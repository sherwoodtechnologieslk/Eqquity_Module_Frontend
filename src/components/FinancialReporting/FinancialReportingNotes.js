import React, { useState, useEffect, useMemo, useRef } from 'react';
import './Styles/FinancialReportingNotes.css';
import DisclosureNoteView from './DisclosureNoteView';
import { buildNotePeriods } from '../../utils/financialNotePeriods';
import { loadFinancialNoteData } from '../../utils/loadFinancialNoteData';
import { FINANCIAL_NOTES } from '../../utils/financialNotesRegistry';
import { resolveCustomNoteRows } from '../../utils/resolveCustomNoteRows';
import { chartOfAccountsAPI } from '../../services/api';

const todayYmd = () => new Date().toISOString().split('T')[0];

const newRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isActiveAccount = (acc) => {
  const status = String(acc?.active_status || acc?.activeStatus || 'Yes').toLowerCase();
  return status === 'yes' || status === 'y' || status === '1' || status === 'true';
};

/** Flaky backend/auth failures that should retry, then show a friendly recovery message. */
const isTransientLoadError = (err) => {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('500') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('unable to verify session') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('internal server error')
  );
};

const TRANSIENT_NOTE_LOAD_MESSAGE =
  'The note could not be loaded just now (temporary server issue). Please click this note tab again, or wait a moment and retry.';

const TRANSIENT_AMOUNT_LOAD_MESSAGE =
  'Account amounts could not be loaded just now (temporary server issue). Please remove and add the row again, or switch tabs and come back.';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FinancialReportingNotes = ({ context = null }) => {
  const [asOfDate, setAsOfDate] = useState(() => context?.asOfDate || todayYmd());
  const [selectedNoteId, setSelectedNoteId] = useState(
    () => context?.noteId || FINANCIAL_NOTES[0]?.id || ''
  );
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [ribbonTab, setRibbonTab] = useState('home');
  const [layoutDensity, setLayoutDensity] = useState('comfortable');
  const [customRowsByNote, setCustomRowsByNote] = useState({});
  const [removedAutoKeysByNote, setRemovedAutoKeysByNote] = useState({});
  const [extraAccountsByNote, setExtraAccountsByNote] = useState({});
  const [rowSignsByNote, setRowSignsByNote] = useState({});
  const [addAccountsTarget, setAddAccountsTarget] = useState(null);
  const [addAccountCodes, setAddAccountCodes] = useState([]);
  const [addCoaSearch, setAddCoaSearch] = useState('');
  const [coaList, setCoaList] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);
  const [coaError, setCoaError] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAccountCodes, setDraftAccountCodes] = useState([]);
  const [coaSearch, setCoaSearch] = useState('');
  const [customResolveError, setCustomResolveError] = useState('');
  const [customResolving, setCustomResolving] = useState(false);
  const tabsScrollRef = useRef(null);
  const activeTabRef = useRef(null);
  const loadSeqRef = useRef(0);
  const customSeqRef = useRef(0);
  const extrasSeqRef = useRef(0);

  useEffect(() => {
    if (context?.asOfDate) setAsOfDate(context.asOfDate);
    if (context?.noteId) setSelectedNoteId(context.noteId);
  }, [context?.asOfDate, context?.noteId]);

  useEffect(() => {
    const el = activeTabRef.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }, [selectedNoteId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCoaLoading(true);
        setCoaError('');
        const list = await chartOfAccountsAPI.getAll();
        if (cancelled) return;
        const safe = Array.isArray(list) ? list.filter(isActiveAccount) : [];
        setCoaList(safe);
      } catch (err) {
        if (cancelled) return;
        setCoaError(err.message || 'Failed to load chart of accounts');
        setCoaList([]);
      } finally {
        if (!cancelled) setCoaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedNoteId) {
      loadSeqRef.current += 1;
      setNoteData(null);
      setLoadError('');
      setLoading(false);
      return undefined;
    }

    const seq = ++loadSeqRef.current;
    const noteId = selectedNoteId;
    const date = asOfDate;

    setLoading(true);
    setLoadError('');
    setNoteData(null);

    let cancelled = false;

    (async () => {
      const maxAttempts = 3;
      let lastErr = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (cancelled || seq !== loadSeqRef.current) return;
        try {
          const data = await loadFinancialNoteData({
            noteId,
            asOfDate: date
          });
          if (cancelled || seq !== loadSeqRef.current) return;
          setNoteData(data);
          setLoadError('');
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (
            attempt < maxAttempts &&
            isTransientLoadError(err) &&
            !cancelled &&
            seq === loadSeqRef.current
          ) {
            await wait(350 * attempt);
            continue;
          }
          break;
        }
      }

      if (cancelled || seq !== loadSeqRef.current) return;

      if (lastErr) {
        setNoteData(null);
        setLoadError(
          isTransientLoadError(lastErr)
            ? TRANSIENT_NOTE_LOAD_MESSAGE
            : lastErr.message || 'Failed to load note'
        );
      }

      if (!cancelled && seq === loadSeqRef.current) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [asOfDate, selectedNoteId, reloadToken]);

  const periods = noteData?.periods || buildNotePeriods(asOfDate);
  const selectedNote = FINANCIAL_NOTES.find((n) => n.id === selectedNoteId) || null;
  const sessionCustomRows = customRowsByNote[selectedNoteId] || [];
  const sessionRemovedAutoKeys = removedAutoKeysByNote[selectedNoteId] || [];
  const sessionExtraAccountsByKey = extraAccountsByNote[selectedNoteId] || {};
  const sessionRowSignsByKey = rowSignsByNote[selectedNoteId] || {};

  useEffect(() => {
    const defs = customRowsByNote[selectedNoteId] || [];
    if (!selectedNoteId || !defs.length) {
      setCustomResolveError('');
      setCustomResolving(false);
      return undefined;
    }

    const seq = ++customSeqRef.current;
    let cancelled = false;
    setCustomResolving(true);
    setCustomResolveError('');

    (async () => {
      const maxAttempts = 3;
      let lastErr = null;
      let resolved = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (cancelled || seq !== customSeqRef.current) return;
        try {
          resolved = await resolveCustomNoteRows(defs, periods);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (
            attempt < maxAttempts &&
            isTransientLoadError(err) &&
            !cancelled &&
            seq === customSeqRef.current
          ) {
            await wait(350 * attempt);
            continue;
          }
          break;
        }
      }

      if (cancelled || seq !== customSeqRef.current) return;

      if (resolved) {
        setCustomRowsByNote((prev) => {
          const existing = prev[selectedNoteId] || [];
          const byId = new Map(resolved.map((r) => [r.id, r]));
          return {
            ...prev,
            [selectedNoteId]: existing.map((row) => {
              const next = byId.get(row.id);
              if (!next) return row;
              return {
                ...row,
                current: next.current,
                prior: next.prior,
                accountNames: row.accountNames?.length ? row.accountNames : next.accountNames,
                accountDetails: next.accountDetails || row.accountDetails || []
              };
            })
          };
        });
        setCustomResolveError('');
      } else {
        setCustomResolveError(
          lastErr
            ? isTransientLoadError(lastErr)
              ? TRANSIENT_AMOUNT_LOAD_MESSAGE
              : lastErr.message || 'Failed to resolve account balances'
            : ''
        );
      }

      if (!cancelled && seq === customSeqRef.current) {
        setCustomResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-resolve when date/note changes or when row definitions (ids/codes) change — not on amount-only updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    asOfDate,
    selectedNoteId,
    periods.current?.startDate,
    periods.current?.endDate,
    periods.prior?.startDate,
    periods.prior?.endDate,
    JSON.stringify(
      (customRowsByNote[selectedNoteId] || []).map((r) => ({
        id: r.id,
        accountCodes: r.accountCodes,
        accountNames: r.accountNames
      }))
    )
  ]);

  useEffect(() => {
    const noteExtras = extraAccountsByNote[selectedNoteId] || {};
    const defs = Object.entries(noteExtras).map(([rowKey, entry]) => ({
      id: rowKey,
      label: rowKey,
      accountCodes: entry.accountCodes || [],
      accountNames: entry.accountNames || []
    }));

    if (!selectedNoteId || !defs.length) return undefined;

    const seq = ++extrasSeqRef.current;
    let cancelled = false;
    setCustomResolving(true);
    setCustomResolveError('');

    (async () => {
      const maxAttempts = 3;
      let lastErr = null;
      let resolved = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (cancelled || seq !== extrasSeqRef.current) return;
        try {
          resolved = await resolveCustomNoteRows(defs, periods);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (
            attempt < maxAttempts &&
            isTransientLoadError(err) &&
            !cancelled &&
            seq === extrasSeqRef.current
          ) {
            await wait(350 * attempt);
            continue;
          }
          break;
        }
      }

      if (cancelled || seq !== extrasSeqRef.current) return;

      if (resolved) {
        setExtraAccountsByNote((prev) => {
          const existing = prev[selectedNoteId] || {};
          const next = { ...existing };
          resolved.forEach((row) => {
            const cur = existing[row.id];
            if (!cur) return;
            next[row.id] = {
              ...cur,
              current: row.current,
              prior: row.prior,
              accountDetails: row.accountDetails || []
            };
          });
          return { ...prev, [selectedNoteId]: next };
        });
        setCustomResolveError('');
      } else {
        setCustomResolveError(
          lastErr
            ? isTransientLoadError(lastErr)
              ? TRANSIENT_AMOUNT_LOAD_MESSAGE
              : lastErr.message || 'Failed to resolve account balances'
            : ''
        );
      }

      if (!cancelled && seq === extrasSeqRef.current) {
        setCustomResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    asOfDate,
    selectedNoteId,
    periods.current?.startDate,
    periods.current?.endDate,
    periods.prior?.startDate,
    periods.prior?.endDate,
    JSON.stringify(
      Object.entries(extraAccountsByNote[selectedNoteId] || {}).map(([rowKey, entry]) => ({
        rowKey,
        accountCodes: entry.accountCodes,
        accountNames: entry.accountNames
      }))
    )
  ]);

  const filteredCoa = useMemo(() => {
    const q = coaSearch.trim().toLowerCase();
    const incomeFirst = (acc) => {
      const code = String(acc.account_code || '');
      return /^[3456]/.test(code) ? 0 : 1;
    };
    const matched = !q
      ? [...coaList]
      : coaList.filter((acc) => {
          const code = String(acc.account_code || '').toLowerCase();
          const name = String(acc.description || '').toLowerCase();
          const type = String(acc.account_type || '').toLowerCase();
          return code.includes(q) || name.includes(q) || type.includes(q);
        });
    return matched.sort((a, b) => incomeFirst(a) - incomeFirst(b)).slice(0, 100);
  }, [coaList, coaSearch]);

  const filteredAddCoa = useMemo(() => {
    const q = addCoaSearch.trim().toLowerCase();
    const incomeFirst = (acc) => {
      const code = String(acc.account_code || '');
      return /^[3456]/.test(code) ? 0 : 1;
    };
    const matched = !q
      ? [...coaList]
      : coaList.filter((acc) => {
          const code = String(acc.account_code || '').toLowerCase();
          const name = String(acc.description || '').toLowerCase();
          const type = String(acc.account_type || '').toLowerCase();
          return code.includes(q) || name.includes(q) || type.includes(q);
        });
    return matched.sort((a, b) => incomeFirst(a) - incomeFirst(b)).slice(0, 100);
  }, [coaList, addCoaSearch]);

  const toggleDraftAccount = (code) => {
    const key = String(code || '').trim();
    if (!key) return;
    setDraftAccountCodes((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const toggleAddAccount = (code) => {
    const key = String(code || '').trim();
    if (!key) return;
    const existing = new Set(addAccountsTarget?.existingCodes || []);
    if (existing.has(key)) return;
    setAddAccountCodes((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const closeAddAccountsModal = () => {
    setAddAccountsTarget(null);
    setAddAccountCodes([]);
    setAddCoaSearch('');
  };

  const handleOpenAddAccounts = (target) => {
    if (!target) return;
    setAddAccountsTarget(target);
    setAddAccountCodes([]);
    setAddCoaSearch('');
    setRibbonTab('home');
  };

  const handleConfirmAddAccounts = () => {
    if (!selectedNoteId || !addAccountsTarget || !addAccountCodes.length) return;

    const selectedAccounts = coaList.filter((acc) =>
      addAccountCodes.includes(String(acc.account_code || '').trim())
    );
    const newCodes = [...addAccountCodes];
    const newNames = selectedAccounts.map((acc) =>
      String(acc.description || acc.account_name || '').trim()
    );

    if (addAccountsTarget.kind === 'custom') {
      const rowId = addAccountsTarget.rowKey;
      setCustomRowsByNote((prev) => ({
        ...prev,
        [selectedNoteId]: (prev[selectedNoteId] || []).map((row) => {
          if (row.id !== rowId) return row;
          const mergedCodes = [...(row.accountCodes || [])];
          const mergedNames = [...(row.accountNames || [])];
          newCodes.forEach((code, i) => {
            if (mergedCodes.includes(code)) return;
            mergedCodes.push(code);
            mergedNames.push(newNames[i] || code);
          });
          return {
            ...row,
            accountCodes: mergedCodes,
            accountNames: mergedNames
          };
        })
      }));
    } else {
      const rowKey = addAccountsTarget.rowKey;
      setExtraAccountsByNote((prev) => {
        const noteMap = prev[selectedNoteId] || {};
        const existing = noteMap[rowKey] || {
          accountCodes: [],
          accountNames: [],
          current: 0,
          prior: 0,
          accountDetails: []
        };
        const mergedCodes = [...(existing.accountCodes || [])];
        const mergedNames = [...(existing.accountNames || [])];
        newCodes.forEach((code, i) => {
          if (mergedCodes.includes(code)) return;
          mergedCodes.push(code);
          mergedNames.push(newNames[i] || code);
        });
        return {
          ...prev,
          [selectedNoteId]: {
            ...noteMap,
            [rowKey]: {
              ...existing,
              accountCodes: mergedCodes,
              accountNames: mergedNames
            }
          }
        };
      });
    }

    closeAddAccountsModal();
  };

  const handleAddCustomRow = async () => {
    const label = draftDescription.trim();
    if (!label || !draftAccountCodes.length || !selectedNoteId) return;

    const selectedAccounts = coaList.filter((acc) =>
      draftAccountCodes.includes(String(acc.account_code || '').trim())
    );

    const row = {
      id: newRowId(),
      label,
      accountCodes: [...draftAccountCodes],
      accountNames: selectedAccounts.map(
        (acc) => String(acc.description || acc.account_name || '').trim()
      ),
      current: 0,
      prior: 0
    };

    const noteId = selectedNoteId;
    setCustomRowsByNote((prev) => ({
      ...prev,
      [noteId]: [...(prev[noteId] || []), row]
    }));
    setDraftDescription('');
    setDraftAccountCodes([]);
    setCoaSearch('');
    setRibbonTab('home');
    setCustomResolving(true);
    setCustomResolveError('');

    try {
      let resolved = null;
      let lastErr = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const rows = await resolveCustomNoteRows([row], periods);
          resolved = rows[0] || null;
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < 3 && isTransientLoadError(err)) {
            await wait(350 * attempt);
            continue;
          }
          break;
        }
      }

      if (resolved) {
        setCustomRowsByNote((prev) => ({
          ...prev,
          [noteId]: (prev[noteId] || []).map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  current: resolved?.current || 0,
                  prior: resolved?.prior || 0
                }
              : r
          )
        }));
        setCustomResolveError('');
      } else if (lastErr) {
        setCustomResolveError(
          isTransientLoadError(lastErr)
            ? TRANSIENT_AMOUNT_LOAD_MESSAGE
            : lastErr.message || 'Failed to resolve account balances'
        );
      } else {
        setCustomResolveError('');
      }
    } finally {
      setCustomResolving(false);
    }
  };

  const handleRemoveCustomRow = (rowId) => {
    if (!selectedNoteId) return;
    setCustomRowsByNote((prev) => ({
      ...prev,
      [selectedNoteId]: (prev[selectedNoteId] || []).filter((r) => r.id !== rowId)
    }));
    const signKey = `c:${rowId}`;
    setRowSignsByNote((prev) => {
      const noteMap = prev[selectedNoteId];
      if (!noteMap || noteMap[signKey] == null) return prev;
      const next = { ...noteMap };
      delete next[signKey];
      return { ...prev, [selectedNoteId]: next };
    });
  };

  const handleRemoveAutoRow = (rowKey) => {
    const key = String(rowKey || '').trim();
    if (!selectedNoteId || !key) return;
    setRemovedAutoKeysByNote((prev) => {
      const existing = prev[selectedNoteId] || [];
      if (existing.includes(key)) return prev;
      return {
        ...prev,
        [selectedNoteId]: [...existing, key]
      };
    });
    setExtraAccountsByNote((prev) => {
      const noteMap = prev[selectedNoteId];
      if (!noteMap || !noteMap[key]) return prev;
      const next = { ...noteMap };
      delete next[key];
      return { ...prev, [selectedNoteId]: next };
    });
    setRowSignsByNote((prev) => {
      const noteMap = prev[selectedNoteId];
      if (!noteMap || noteMap[key] == null) return prev;
      const next = { ...noteMap };
      delete next[key];
      return { ...prev, [selectedNoteId]: next };
    });
  };

  const handleToggleRowSign = (rowKey) => {
    const key = String(rowKey || '').trim();
    if (!selectedNoteId || !key) return;
    setRowSignsByNote((prev) => {
      const noteMap = prev[selectedNoteId] || {};
      const current = noteMap[key] === -1 ? -1 : 1;
      return {
        ...prev,
        [selectedNoteId]: {
          ...noteMap,
          [key]: current === -1 ? 1 : -1
        }
      };
    });
  };

  return (
    <div className="nts-page">
      <div className="nts-wrap">
        <header className="nts-header">
          <div>
            <h1 className="nts-title">Notes to the Financial Statements</h1>
            <p className="nts-subtitle">As at {periods.current.label}</p>
          </div>
          <label className="nts-filter" htmlFor="frn-as-of">
            As at date
            <input
              id="frn-as-of"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </label>
        </header>

        <div className="nts-tabs-bar" role="tablist" aria-label="Notes contents">
          <div className="nts-tabs-scroll" ref={tabsScrollRef}>
            {FINANCIAL_NOTES.map((note) => {
              const active = selectedNoteId === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  ref={active ? activeTabRef : null}
                  className={`nts-tab${active ? ' is-active' : ''}`}
                  onClick={() => setSelectedNoteId(note.id)}
                  title={`Note ${note.number} — ${note.title}`}
                >
                  <span className="nts-tab-num">{note.number}</span>
                  <span className="nts-tab-label">{note.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedNoteId ? (
          <div
            className={`nts-excel-workbook${
              layoutDensity === 'compact' ? ' is-compact' : ''
            }`}
          >
            <div className="nts-excel-titlebar">
              <span className="nts-excel-titlebar-text">
                Notes to the Financial Statements
                {selectedNote ? ` — Note ${selectedNote.number}` : ''}
              </span>
            </div>
            <div className="nts-excel-ribbon" role="tablist" aria-label="Workbook ribbon">
              <button
                type="button"
                role="tab"
                aria-selected={ribbonTab === 'home'}
                className={`nts-excel-ribbon-item${ribbonTab === 'home' ? ' is-active' : ''}`}
                onClick={() => setRibbonTab('home')}
              >
                Home
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ribbonTab === 'insert'}
                className={`nts-excel-ribbon-item${ribbonTab === 'insert' ? ' is-active' : ''}`}
                onClick={() => setRibbonTab('insert')}
              >
                Insert
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ribbonTab === 'pageLayout'}
                className={`nts-excel-ribbon-item${
                  ribbonTab === 'pageLayout' ? ' is-active' : ''
                }`}
                onClick={() => setRibbonTab('pageLayout')}
              >
                Page Layout
              </button>
            </div>

            {ribbonTab === 'insert' ? (
              <div className="nts-insert-panel">
                <div className="nts-insert-panel-head">
                  <strong>Insert description</strong>
                  <span>Session only — not saved. Amounts = full Combined Trial Balance for the selected account(s).</span>
                </div>
                <div className="nts-insert-grid">
                  <label className="nts-insert-field">
                    Description
                    <input
                      type="text"
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="e.g. Capital Gain on Treasury Bonds"
                    />
                  </label>
                  <label className="nts-insert-field">
                    Search accounts
                    <input
                      type="search"
                      value={coaSearch}
                      onChange={(e) => setCoaSearch(e.target.value)}
                      placeholder="Code or name"
                    />
                  </label>
                </div>
                {coaError ? <p className="nts-insert-error">{coaError}</p> : null}
                {coaLoading ? (
                  <p className="nts-insert-hint">Loading chart of accounts…</p>
                ) : (
                  <div className="nts-insert-coa-list" role="listbox" aria-label="Chart of accounts">
                    {filteredCoa.length === 0 ? (
                      <p className="nts-insert-hint">No accounts match your search.</p>
                    ) : (
                      filteredCoa.map((acc) => {
                        const code = String(acc.account_code || '').trim();
                        const name = String(
                          acc.description || acc.account_name || 'Account'
                        ).trim();
                        const checked = draftAccountCodes.includes(code);
                        return (
                          <label
                            key={code || acc.id}
                            className={`nts-insert-coa-item${checked ? ' is-checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDraftAccount(code)}
                            />
                            <span className="nts-insert-coa-item-text">
                              <span className="nts-insert-coa-code">{code || '—'}</span>
                              <span className="nts-insert-coa-name">{name}</span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
                <p className="nts-insert-hint">
                  Pick the account code(s) exactly as on Combined Trial Balance. The note shows that
                  account’s full Combined TB amount for each period column.
                </p>
                <div className="nts-insert-actions">
                  <span className="nts-insert-hint">
                    {draftAccountCodes.length
                      ? `${draftAccountCodes.length} account(s) selected`
                      : 'Select one or more accounts'}
                  </span>
                  <button
                    type="button"
                    className="nts-insert-add"
                    disabled={!draftDescription.trim() || !draftAccountCodes.length}
                    onClick={handleAddCustomRow}
                  >
                    Add to note
                  </button>
                </div>
              </div>
            ) : null}

            {ribbonTab === 'pageLayout' ? (
              <div className="nts-layout-panel">
                <span className="nts-layout-label">Density</span>
                <button
                  type="button"
                  className={`nts-layout-option${
                    layoutDensity === 'comfortable' ? ' is-active' : ''
                  }`}
                  onClick={() => setLayoutDensity('comfortable')}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  className={`nts-layout-option${layoutDensity === 'compact' ? ' is-active' : ''}`}
                  onClick={() => setLayoutDensity('compact')}
                >
                  Compact
                </button>
              </div>
            ) : null}

            <div className="nts-excel-formula-bar">
              <span className="nts-excel-cell-ref">A1</span>
              <span className="nts-excel-formula-input">
                {selectedNote
                  ? `${selectedNote.number}. ${selectedNote.title}`
                  : ''}
              </span>
            </div>
            {customResolving ? (
              <div className="nts-resolve-banner" role="status" aria-live="polite">
                <span className="nts-resolve-spinner" aria-hidden />
                <div className="nts-resolve-banner-copy">
                  <strong>Loading account amounts</strong>
                  <span>Please wait while balances are loaded.</span>
                </div>
              </div>
            ) : null}
            {customResolveError ? (
              <div className="nts-resolve-error-banner" role="alert">
                <div className="nts-resolve-error-copy">
                  <strong>Couldn’t load account amounts</strong>
                  <span>{customResolveError}</span>
                </div>
              </div>
            ) : null}
            <div
              className={`nts-excel-grid-area${
                customResolving ? ' is-resolving' : ''
              }`}
            >
              <DisclosureNoteView
                data={noteData}
                loading={loading}
                error={loadError}
                customRows={sessionCustomRows}
                removedAutoKeys={sessionRemovedAutoKeys}
                extraAccountsByKey={sessionExtraAccountsByKey}
                rowSignsByKey={sessionRowSignsByKey}
                onRemoveCustomRow={handleRemoveCustomRow}
                onRemoveAutoRow={handleRemoveAutoRow}
                onAddAccounts={handleOpenAddAccounts}
                onToggleRowSign={handleToggleRowSign}
                onRetry={() => {
                  setLoadError('');
                  setReloadToken((n) => n + 1);
                }}
              />
            </div>
            <div className="nts-excel-sheet-tabs">
              <span className="nts-excel-sheet-tab is-active">
                Note {selectedNote?.number ?? ''}
              </span>
              <span className="nts-excel-sheet-tab">Contents</span>
            </div>
          </div>
        ) : (
          <p className="nts-hint">Select a note tab to open its disclosure.</p>
        )}

        {addAccountsTarget ? (
          <div className="frn-accounts-overlay" role="presentation" onClick={closeAddAccountsModal}>
            <div
              className="frn-accounts-modal frn-add-accounts-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Add accounts"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="frn-accounts-modal-head">
                <div>
                  <p className="frn-accounts-modal-eyebrow">Add accounts</p>
                  <h3 className="frn-accounts-modal-title">{addAccountsTarget.title}</h3>
                </div>
                <button
                  type="button"
                  className="frn-accounts-modal-close"
                  onClick={closeAddAccountsModal}
                >
                  Close
                </button>
              </div>
              <div className="frn-accounts-modal-body">
                <p className="nts-insert-hint">
                  Session only — new Combined TB amounts are added to this description.
                </p>
                <label className="nts-insert-field">
                  Search accounts
                  <input
                    type="search"
                    value={addCoaSearch}
                    onChange={(e) => setAddCoaSearch(e.target.value)}
                    placeholder="Code or name"
                  />
                </label>
                {coaError ? <p className="nts-insert-error">{coaError}</p> : null}
                {coaLoading ? (
                  <p className="nts-insert-hint">Loading chart of accounts…</p>
                ) : (
                  <div className="nts-insert-coa-list" role="listbox" aria-label="Add chart of accounts">
                    {filteredAddCoa.length === 0 ? (
                      <p className="nts-insert-hint">No accounts match your search.</p>
                    ) : (
                      filteredAddCoa.map((acc) => {
                        const code = String(acc.account_code || '').trim();
                        const name = String(
                          acc.description || acc.account_name || 'Account'
                        ).trim();
                        const alreadyLinked = (addAccountsTarget.existingCodes || []).includes(
                          code
                        );
                        const checked = alreadyLinked || addAccountCodes.includes(code);
                        return (
                          <label
                            key={code || acc.id}
                            className={`nts-insert-coa-item${checked ? ' is-checked' : ''}${
                              alreadyLinked ? ' is-linked' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={alreadyLinked}
                              onChange={() => toggleAddAccount(code)}
                            />
                            <span className="nts-insert-coa-item-text">
                              <span className="nts-insert-coa-code">{code || '—'}</span>
                              <span className="nts-insert-coa-name">
                                {name}
                                {alreadyLinked ? ' · already linked' : ''}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
                <div className="nts-insert-actions">
                  <span className="nts-insert-hint">
                    {addAccountCodes.length
                      ? `${addAccountCodes.length} new account(s) selected`
                      : 'Select one or more new accounts'}
                  </span>
                  <button
                    type="button"
                    className="nts-insert-add"
                    disabled={!addAccountCodes.length}
                    onClick={handleConfirmAddAccounts}
                  >
                    Add to description
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
