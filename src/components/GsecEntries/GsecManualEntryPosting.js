import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { gsecEntriesAPI, chartOfAccountsAPI } from '../../services/api';
import './Styles/GsecEntries.css';
import './Styles/GsecManualEntryPosting.css';

const INITIAL_SHARED = {
  id: '',
  transaction_id: '',
  deal_number: '',
  entry_date: '',
  currency: 'LKR',
  account_category: '',
  transaction_code: '',
  transaction_description: '',
  created_at: '',
  updated_at: ''
};

const INITIAL_LINE = {
  account_code: '',
  account_name: '',
  account_id: '',
  debit_amount: '',
  credit_amount: '',
  description: ''
};

const INITIAL_AP = { query: '', showDropdown: false, locked: false };

const coaDisplayName = (row) =>
  String(row?.description ?? row?.account_name ?? '')
    .trim();

const isCoaActive = (row) => {
  if (row?.active_status == null) return true;
  return String(row.active_status).toLowerCase() === 'yes';
};

const EPS = 0.0001;

function buildEntryPayload(shared, line) {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v);
  const empty = (v) => v === '' || v == null;

  const numOrNull = (v) => {
    const t = trim(v);
    if (empty(t)) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const strOrNull = (v) => {
    const t = trim(v);
    return empty(t) ? null : t;
  };

  return {
    id: numOrNull(shared.id),
    transaction_id: numOrNull(shared.transaction_id),
    deal_number: strOrNull(shared.deal_number),
    account_id: numOrNull(line.account_id),
    entry_date: strOrNull(shared.entry_date),
    debit_amount: empty(trim(line.debit_amount)) ? 0 : Number(trim(line.debit_amount)),
    credit_amount: empty(trim(line.credit_amount)) ? 0 : Number(trim(line.credit_amount)),
    currency: 'LKR',
    description: strOrNull(line.description),
    account_code: strOrNull(line.account_code),
    account_name: strOrNull(line.account_name),
    account_category: strOrNull(shared.account_category),
    transaction_code: strOrNull(shared.transaction_code),
    transaction_description: strOrNull(shared.transaction_description)
  };
}

function AccountPickerBlock({
  line,
  setLine,
  ap,
  setAp,
  comboRef,
  coaList,
  coaLoading,
  coaLoadError,
  coaUseSearch,
  title,
  inputId
}) {
  const filteredCoa = useMemo(() => {
    const q = ap.query.trim().toLowerCase();
    const base = coaList.filter(isCoaActive);
    if (!q) return base.slice(0, 80);
    return base
      .filter((row) => {
        const code = (row.account_code || '').toLowerCase();
        const name = coaDisplayName(row).toLowerCase();
        return code.includes(q) || name.includes(q);
      })
      .slice(0, 80);
  }, [coaList, ap.query]);

  const applyCoaRow = useCallback(
    (row) => {
      const code = (row.account_code || '').trim();
      const name = coaDisplayName(row);
      setLine((prev) => ({
        ...prev,
        account_code: code,
        account_name: name,
        account_id: row.id != null && row.id !== '' ? String(row.id) : prev.account_id
      }));
      setAp((prev) => ({ ...prev, query: '', showDropdown: false, locked: true }));
    },
    [setLine, setAp]
  );

  const clearAccountSelection = useCallback(() => {
    setLine((prev) => ({
      ...prev,
      account_code: '',
      account_name: '',
      account_id: ''
    }));
    setAp({ query: '', showDropdown: false, locked: false });
  }, [setLine, setAp]);

  const tryExactMatchFromQuery = useCallback(() => {
    const q = ap.query.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const base = coaList.filter(isCoaActive);
    const byCode = base.filter((r) => (r.account_code || '').trim().toLowerCase() === lower);
    if (byCode.length === 1) {
      applyCoaRow(byCode[0]);
      return;
    }
    const byName = base.filter((r) => coaDisplayName(r).toLowerCase() === lower);
    if (byName.length === 1) {
      applyCoaRow(byName[0]);
    }
  }, [ap.query, coaList, applyCoaRow]);

  if (coaUseSearch) {
    return (
      <div className="gsec-manual-account-combo" ref={comboRef}>
        <label className="gsec-filter-label">{title}</label>
        <p className="gsec-manual-hint" style={{ marginTop: 0 }}>
          Search by account code or name, then pick a row. Code and name are set together.
        </p>

        {!ap.locked ? (
          <div className="gsec-filter-group" style={{ marginBottom: 0 }}>
            <input
              id={inputId}
              type="text"
              className="gsec-filter-input"
              value={ap.query}
              onChange={(e) => {
                setAp((prev) => ({ ...prev, query: e.target.value, showDropdown: true }));
              }}
              onFocus={() => setAp((prev) => ({ ...prev, showDropdown: true }))}
              onBlur={() => {
                window.setTimeout(() => tryExactMatchFromQuery(), 150);
              }}
              placeholder={coaLoading ? 'Loading chart of accounts…' : 'Type code or account name…'}
              disabled={coaLoading}
              autoComplete="off"
            />
            {ap.showDropdown && ap.query.trim() && filteredCoa.length > 0 && (
              <div className="gsec-manual-account-dropdown" role="listbox">
                {filteredCoa.map((row) => (
                  <button
                    key={row.id ?? row.account_code}
                    type="button"
                    role="option"
                    className="gsec-manual-account-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCoaRow(row)}
                  >
                    <div className="gsec-manual-account-option-code">{row.account_code}</div>
                    <div className="gsec-manual-account-option-name">{coaDisplayName(row) || '—'}</div>
                  </button>
                ))}
              </div>
            )}
            {ap.showDropdown && ap.query.trim() && !coaLoading && filteredCoa.length === 0 && (
              <div className="gsec-manual-account-dropdown">
                <div className="gsec-manual-account-option" style={{ cursor: 'default' }}>
                  <span className="gsec-manual-account-option-name">No matching accounts</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="gsec-manual-account-row">
            <div className="gsec-filter-group">
              <label className="gsec-filter-label">account_code</label>
              <input
                type="text"
                className="gsec-filter-input gsec-manual-readonly"
                value={line.account_code}
                readOnly
              />
            </div>
            <div className="gsec-filter-group">
              <label className="gsec-filter-label">account_name</label>
              <input
                type="text"
                className="gsec-filter-input gsec-manual-readonly"
                value={line.account_name}
                readOnly
              />
            </div>
            <button type="button" className="gsec-manual-account-clear" onClick={clearAccountSelection}>
              Change account
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gsec-manual-account-combo">
      <label className="gsec-filter-label">{title}</label>
      {coaLoadError ? (
        <p className="gsec-manual-hint" style={{ color: '#b91c1c' }}>
          Chart of accounts unavailable ({coaLoadError}). Enter code and name manually; both are required.
        </p>
      ) : (
        <p className="gsec-manual-hint">No accounts in chart. Enter code and name manually.</p>
      )}
      <div className="gsec-manual-account-row" style={{ marginTop: '0.5rem' }}>
        <div className="gsec-filter-group">
          <label className="gsec-filter-label">account_code</label>
          <input
            type="text"
            className="gsec-filter-input"
            value={line.account_code}
            onChange={(e) => {
              const v = e.target.value;
              setLine((prev) => ({ ...prev, account_code: v }));
            }}
            onBlur={(e) => {
              const code = (e.target.value || '').trim().toLowerCase();
              if (!code) return;
              const match = coaList.filter(isCoaActive).find(
                (r) => (r.account_code || '').trim().toLowerCase() === code
              );
              if (match) {
                setLine((prev) => ({
                  ...prev,
                  account_code: (match.account_code || '').trim(),
                  account_name: coaDisplayName(match),
                  account_id:
                    match.id != null && match.id !== '' ? String(match.id) : prev.account_id
                }));
              }
            }}
            required
          />
        </div>
        <div className="gsec-filter-group">
          <label className="gsec-filter-label">account_name</label>
          <input
            type="text"
            className="gsec-filter-input"
            value={line.account_name}
            onChange={(e) => {
              const v = e.target.value;
              setLine((prev) => ({ ...prev, account_name: v }));
            }}
            onBlur={(e) => {
              const name = (e.target.value || '').trim().toLowerCase();
              if (!name) return;
              const matches = coaList
                .filter(isCoaActive)
                .filter((r) => coaDisplayName(r).toLowerCase() === name);
              if (matches.length === 1) {
                const m = matches[0];
                setLine((prev) => ({
                  ...prev,
                  account_code: (m.account_code || '').trim(),
                  account_name: coaDisplayName(m),
                  account_id: m.id != null && m.id !== '' ? String(m.id) : prev.account_id
                }));
              }
            }}
            required
          />
        </div>
      </div>
    </div>
  );
}

const INITIAL_DUPLICATE_MODAL = {
  open: false,
  existingRows: [],
  pendingEntries: null,
  notice: ''
};

const GsecManualEntryPosting = () => {
  const [duplicateModal, setDuplicateModal] = useState(INITIAL_DUPLICATE_MODAL);

  const [postingMode, setPostingMode] = useState('single');
  const [shared, setShared] = useState(INITIAL_SHARED);
  const [line1, setLine1] = useState({ ...INITIAL_LINE });
  const [line2, setLine2] = useState({ ...INITIAL_LINE });
  const [ap1, setAp1] = useState({ ...INITIAL_AP });
  const [ap2, setAp2] = useState({ ...INITIAL_AP });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [coaList, setCoaList] = useState([]);
  const [coaLoading, setCoaLoading] = useState(true);
  const [coaLoadError, setCoaLoadError] = useState('');

  const comboRef1 = useRef(null);
  const comboRef2 = useRef(null);

  const coaUseSearch = coaList.length > 0 && !coaLoadError;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCoaLoading(true);
        setCoaLoadError('');
        const data = await chartOfAccountsAPI.getAll();
        if (!cancelled) {
          setCoaList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCoaLoadError(err.message || 'Failed to load chart of accounts');
          setCoaList([]);
        }
      } finally {
        if (!cancelled) setCoaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const open = ap1.showDropdown || ap2.showDropdown;
    if (!open) return;
    const onDocDown = (e) => {
      const t = e.target;
      if (comboRef1.current?.contains(t) || comboRef2.current?.contains(t)) return;
      setAp1((p) => ({ ...p, showDropdown: false }));
      setAp2((p) => ({ ...p, showDropdown: false }));
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [ap1.showDropdown, ap2.showDropdown]);

  const setSharedField = (name, value) => {
    setShared((prev) => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleModeChange = (mode) => {
    setPostingMode(mode);
    setMessage({ type: '', text: '' });
    if (mode === 'single') {
      setLine2({ ...INITIAL_LINE });
      setAp2({ ...INITIAL_AP });
    }
  };

  const handleReset = () => {
    setShared(INITIAL_SHARED);
    setLine1({ ...INITIAL_LINE });
    setLine2({ ...INITIAL_LINE });
    setAp1({ ...INITIAL_AP });
    setAp2({ ...INITIAL_AP });
    setMessage({ type: '', text: '' });
    setDuplicateModal(INITIAL_DUPLICATE_MODAL);
  };

  const closeDuplicateModal = () => {
    setDuplicateModal(INITIAL_DUPLICATE_MODAL);
  };

  const formatRowDateTime = (v) => {
    if (v == null || v === '') return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString('en-LK');
  };

  const handlePassDuplicates = async () => {
    const pending = duplicateModal.pendingEntries;
    if (!pending || pending.length === 0) return;
    try {
      setSaving(true);
      const res = await gsecEntriesAPI.manualPostEntries(pending, { passDuplicates: true });
      if (res?.success) {
        const msg =
          pending.length === 1
            ? 'Entry saved (duplicate check was bypassed).'
            : `${res.insertedRows ?? pending.length} entries saved (duplicate check was bypassed).`;
        handleReset();
        setMessage({ type: 'ok', text: msg });
      } else {
        setMessage({ type: 'error', text: res?.message || 'Save failed after passing duplicates.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to save entries.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!shared.deal_number?.trim() || !shared.entry_date) {
      setMessage({ type: 'error', text: 'Deal number and entry date are required.' });
      return;
    }

    const validateLineAccounts = (line, label) => {
      if (!line.account_code?.trim() || !line.account_name?.trim()) {
        setMessage({
          type: 'error',
          text: `${label}: account code and account name are required (use chart search to set both).`
        });
        return false;
      }
      return true;
    };

    try {
      setSaving(true);

      if (postingMode === 'single') {
        if (!validateLineAccounts(line1, 'Line')) return;
        const entries = [buildEntryPayload(shared, line1)];
        const res = await gsecEntriesAPI.manualPostEntries(entries, { passDuplicates: false });
        if (res?.duplicate && res.success === false) {
          setDuplicateModal({
            open: true,
            existingRows: Array.isArray(res.existingRows) ? res.existingRows : [],
            pendingEntries: entries,
            notice: res.message || ''
          });
          return;
        }
        if (res?.success) {
          const n = res.insertedRows ?? 0;
          if (n === 0) {
            setMessage({ type: 'error', text: res.message || 'Nothing was inserted.' });
            return;
          }
          handleReset();
          setMessage({ type: 'ok', text: 'Entry saved to GSec ledger successfully.' });
          return;
        }
        setMessage({ type: 'error', text: res?.message || 'Unexpected response from server.' });
        return;
      }

      if (!validateLineAccounts(line1, 'Line 1')) return;
      if (!validateLineAccounts(line2, 'Line 2')) return;

      const d1 = Number(line1.debit_amount) || 0;
      const c1 = Number(line1.credit_amount) || 0;
      const d2 = Number(line2.debit_amount) || 0;
      const c2 = Number(line2.credit_amount) || 0;
      const totalDr = d1 + d2;
      const totalCr = c1 + c2;

      if (totalDr <= EPS && totalCr <= EPS) {
        setMessage({ type: 'error', text: 'Double entry: at least one side must have a non-zero amount.' });
        return;
      }
      if (Math.abs(totalDr - totalCr) > EPS) {
        setMessage({
          type: 'error',
          text: `Double entry must balance: total debits (${totalDr.toFixed(4)}) must equal total credits (${totalCr.toFixed(4)}).`
        });
        return;
      }

      if (line1.account_code.trim() === line2.account_code.trim()) {
        setMessage({
          type: 'error',
          text: 'Double entry: line 1 and line 2 must use different account codes.'
        });
        return;
      }

      const entries = [buildEntryPayload(shared, line1), buildEntryPayload(shared, line2)];
      const res = await gsecEntriesAPI.manualPostEntries(entries, { passDuplicates: false });
      if (res?.duplicate && res.success === false) {
        setDuplicateModal({
          open: true,
          existingRows: Array.isArray(res.existingRows) ? res.existingRows : [],
          pendingEntries: entries,
          notice: res.message || ''
        });
        return;
      }
      if (res?.success) {
        const n = res.insertedRows ?? 0;
        if (n === 0) {
          setMessage({ type: 'error', text: res.message || 'Nothing was inserted.' });
          return;
        }
        handleReset();
        setMessage({ type: 'ok', text: 'Double entry (2 lines) saved to GSec ledger successfully.' });
        return;
      }
      setMessage({ type: 'error', text: res?.message || 'Unexpected response from server.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to save entry.' });
    } finally {
      setSaving(false);
    }
  };

  const renderLineAmounts = (line, setLine, prefix) => (
    <>
      <div className="gsec-filter-group">
        <label className="gsec-filter-label" htmlFor={`${prefix}-debit`}>
          debit_amount
        </label>
        <input
          id={`${prefix}-debit`}
          type="number"
          step="0.0001"
          min="0"
          className="gsec-filter-input"
          value={line.debit_amount}
          onChange={(e) => setLine((prev) => ({ ...prev, debit_amount: e.target.value }))}
        />
      </div>
      <div className="gsec-filter-group">
        <label className="gsec-filter-label" htmlFor={`${prefix}-credit`}>
          credit_amount
        </label>
        <input
          id={`${prefix}-credit`}
          type="number"
          step="0.0001"
          min="0"
          className="gsec-filter-input"
          value={line.credit_amount}
          onChange={(e) => setLine((prev) => ({ ...prev, credit_amount: e.target.value }))}
        />
      </div>
      <div className="gsec-filter-group gsec-manual-form-span">
        <label className="gsec-filter-label" htmlFor={`${prefix}-desc`}>
          description (line)
        </label>
        <textarea
          id={`${prefix}-desc`}
          className="gsec-filter-input gsec-manual-textarea"
          rows={2}
          value={line.description}
          onChange={(e) => setLine((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </>
  );

  return (
    <div className="gsec-page-container">
      <div className="gsec-header-section">
        <div className="gsec-header-icon">
          <svg className="gsec-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z"
              clipRule="evenodd"
            />
            <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z" />
          </svg>
        </div>
        <div className="gsec-header-text-group">
          <h1 className="gsec-main-title">GSec Manual Entry Posting</h1>
          <p className="gsec-subtitle">
            Post a single ledger line, or a balanced double entry (two lines: total debits must equal
            total credits). If the same deal, account, and date already exist, you can review them and
            choose to pass the entry to save anyway (this screen only).
          </p>
        </div>
      </div>

      <form className="gsec-filters-card" onSubmit={handleSubmit}>
        <div className="gsec-card-header">
          <h2 className="gsec-card-title">Manual entry</h2>
        </div>
        <div className="gsec-filters-content">
          {message.text && (
            <div className={message.type === 'error' ? 'gsec-error' : 'gsec-manual-success'}>
              {message.text}
            </div>
          )}

          <div className="gsec-manual-posting-mode gsec-manual-form-span">
            <span className="gsec-filter-label" style={{ marginRight: '0.75rem' }}>
              Posting type
            </span>
            <label className="gsec-manual-radio">
              <input
                type="radio"
                name="gsec-posting-mode"
                checked={postingMode === 'single'}
                onChange={() => handleModeChange('single')}
              />
              Single entry (one line)
            </label>
            <label className="gsec-manual-radio">
              <input
                type="radio"
                name="gsec-posting-mode"
                checked={postingMode === 'double'}
                onChange={() => handleModeChange('double')}
              />
              Double entry (two lines, balanced)
            </label>
          </div>

          <div className="gsec-manual-form-grid">
            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-id">
                id (external / source id)
              </label>
              <input
                id="gsec-manual-id"
                type="number"
                className="gsec-filter-input"
                value={shared.id}
                onChange={(e) => setSharedField('id', e.target.value)}
                placeholder="Optional — stored as external_id"
              />
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-transaction_id">
                transaction_id
              </label>
              <input
                id="gsec-manual-transaction_id"
                type="number"
                className="gsec-filter-input"
                value={shared.transaction_id}
                onChange={(e) => setSharedField('transaction_id', e.target.value)}
              />
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-deal_number">
                deal_number <span style={{ color: '#b91c1c' }}>*</span>
              </label>
              <input
                id="gsec-manual-deal_number"
                type="text"
                className="gsec-filter-input"
                value={shared.deal_number}
                onChange={(e) => setSharedField('deal_number', e.target.value)}
                placeholder="e.g. 20251106/GSEC/0001"
                required
              />
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-entry_date">
                entry_date <span style={{ color: '#b91c1c' }}>*</span>
              </label>
              <input
                id="gsec-manual-entry_date"
                type="datetime-local"
                className="gsec-filter-input"
                value={shared.entry_date}
                onChange={(e) => setSharedField('entry_date', e.target.value)}
                required
              />
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-currency">
                currency
              </label>
              <input
                id="gsec-manual-currency"
                type="text"
                className="gsec-filter-input gsec-manual-readonly"
                value="LKR"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-account_category">
                account_category
              </label>
              <input
                id="gsec-manual-account_category"
                type="text"
                className="gsec-filter-input"
                value={shared.account_category}
                onChange={(e) => setSharedField('account_category', e.target.value)}
                placeholder="e.g. asset, liability, income"
                list="gsec-manual-account-category-suggestions"
              />
              <datalist id="gsec-manual-account-category-suggestions">
                <option value="asset" />
                <option value="liability" />
                <option value="equity" />
                <option value="income" />
                <option value="expense" />
              </datalist>
            </div>

            <div className="gsec-filter-group">
              <label className="gsec-filter-label" htmlFor="gsec-manual-transaction_code">
                transaction_code
              </label>
              <input
                id="gsec-manual-transaction_code"
                type="text"
                className="gsec-filter-input"
                value={shared.transaction_code}
                onChange={(e) => setSharedField('transaction_code', e.target.value)}
              />
            </div>

            <div className="gsec-filter-group gsec-manual-form-span">
              <label className="gsec-filter-label" htmlFor="gsec-manual-transaction_description">
                transaction_description
              </label>
              <textarea
                id="gsec-manual-transaction_description"
                className="gsec-filter-input gsec-manual-textarea"
                value={shared.transaction_description}
                onChange={(e) => setSharedField('transaction_description', e.target.value)}
                rows={2}
                maxLength={255}
              />
            </div>

            <div className="gsec-filter-group gsec-manual-form-span">
              <label className="gsec-filter-label" htmlFor="gsec-manual-created_at">
                created_at
              </label>
              <input
                id="gsec-manual-created_at"
                type="text"
                className="gsec-filter-input gsec-manual-readonly"
                value={shared.created_at}
                readOnly
                placeholder="Set by database on insert"
              />
              <p className="gsec-manual-hint">Not sent on save — MySQL default CURRENT_TIMESTAMP.</p>
            </div>

            <div className="gsec-filter-group gsec-manual-form-span">
              <label className="gsec-filter-label" htmlFor="gsec-manual-updated_at">
                updated_at
              </label>
              <input
                id="gsec-manual-updated_at"
                type="text"
                className="gsec-filter-input gsec-manual-readonly"
                value={shared.updated_at}
                readOnly
                placeholder="Set by database on insert / update"
              />
              <p className="gsec-manual-hint">Not sent on save — maintained by the database.</p>
            </div>

            <div className="gsec-manual-line-card gsec-manual-form-span">
              <h3 className="gsec-manual-line-title">
                {postingMode === 'single' ? 'Line' : 'Line 1'}
              </h3>
              <AccountPickerBlock
                line={line1}
                setLine={setLine1}
                ap={ap1}
                setAp={setAp1}
                comboRef={comboRef1}
                coaList={coaList}
                coaLoading={coaLoading}
                coaLoadError={coaLoadError}
                coaUseSearch={coaUseSearch}
                title={
                  <>
                    Account (code &amp; name) <span style={{ color: '#b91c1c' }}>*</span>
                  </>
                }
                inputId="gsec-manual-account-search-1"
              />
              <div className="gsec-manual-form-grid" style={{ marginTop: '0.75rem' }}>
                <div className="gsec-filter-group">
                  <label className="gsec-filter-label" htmlFor="gsec-line1-account_id">
                    account_id
                  </label>
                  <input
                    id="gsec-line1-account_id"
                    type="number"
                    className="gsec-filter-input"
                    value={line1.account_id}
                    onChange={(e) => setLine1((prev) => ({ ...prev, account_id: e.target.value }))}
                    title="Filled when you pick from chart (optional override)"
                  />
                </div>
                {renderLineAmounts(line1, setLine1, 'gsec-line1')}
              </div>
            </div>

            {postingMode === 'double' && (
              <div className="gsec-manual-line-card gsec-manual-form-span">
                <h3 className="gsec-manual-line-title">Line 2</h3>
                <AccountPickerBlock
                  line={line2}
                  setLine={setLine2}
                  ap={ap2}
                  setAp={setAp2}
                  comboRef={comboRef2}
                  coaList={coaList}
                  coaLoading={coaLoading}
                  coaLoadError={coaLoadError}
                  coaUseSearch={coaUseSearch}
                  title={
                    <>
                      Account (code &amp; name) <span style={{ color: '#b91c1c' }}>*</span>
                    </>
                  }
                  inputId="gsec-manual-account-search-2"
                />
                <div className="gsec-manual-form-grid" style={{ marginTop: '0.75rem' }}>
                  <div className="gsec-filter-group">
                    <label className="gsec-filter-label" htmlFor="gsec-line2-account_id">
                      account_id
                    </label>
                    <input
                      id="gsec-line2-account_id"
                      type="number"
                      className="gsec-filter-input"
                      value={line2.account_id}
                      onChange={(e) => setLine2((prev) => ({ ...prev, account_id: e.target.value }))}
                      title="Filled when you pick from chart (optional override)"
                    />
                  </div>
                  {renderLineAmounts(line2, setLine2, 'gsec-line2')}
                </div>
              </div>
            )}
          </div>

          <div className="gsec-manual-actions">
            <button type="submit" className="gsec-refresh-button" disabled={saving}>
              {saving ? 'Posting…' : postingMode === 'single' ? 'Post entry' : 'Post double entry'}
            </button>
            <button type="button" className="gsec-button-ghost" onClick={handleReset} disabled={saving}>
              Clear form
            </button>
          </div>
        </div>
      </form>

      {duplicateModal.open && (
        <div
          className="gsec-manual-dup-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gsec-dup-modal-title"
        >
          <div className="gsec-manual-dup-modal">
            <div className="gsec-manual-dup-modal-header">
              <h3 id="gsec-dup-modal-title" className="gsec-manual-dup-modal-title">
                Possible duplicate posting
              </h3>
              <button
                type="button"
                className="gsec-manual-dup-modal-close"
                onClick={closeDuplicateModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="gsec-manual-dup-modal-intro">
              {duplicateModal.notice ||
                'The same deal number, account code, and entry date already exist in gsec_entries. Existing rows are shown below.'}
            </p>
            <div className="gsec-manual-dup-modal-table-wrap">
              <table className="gsec-manual-dup-modal-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Entry date</th>
                    <th>Deal</th>
                    <th>Account</th>
                    <th>Name</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(duplicateModal.existingRows || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="gsec-manual-dup-modal-empty">
                        No matching rows returned (conflict may be within this batch only). You can still
                        pass entries to save.
                      </td>
                    </tr>
                  ) : (
                    duplicateModal.existingRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{formatRowDateTime(row.entry_date)}</td>
                        <td>{row.deal_number}</td>
                        <td>{row.account_code}</td>
                        <td>{row.account_name}</td>
                        <td>{row.debit_amount}</td>
                        <td>{row.credit_amount}</td>
                        <td>{row.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="gsec-manual-dup-modal-actions">
              <button type="button" className="gsec-button-ghost" onClick={closeDuplicateModal} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="gsec-refresh-button" onClick={handlePassDuplicates} disabled={saving}>
                {saving
                  ? 'Saving…'
                  : duplicateModal.pendingEntries?.length === 1
                    ? 'Pass entry'
                    : 'Pass entries'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GsecManualEntryPosting;
