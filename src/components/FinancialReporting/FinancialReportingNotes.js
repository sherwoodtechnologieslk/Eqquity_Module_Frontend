import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './Styles/FinancialPosition.css';
import { accountCategoryAPI, accountReconciliationAPI } from '../../services/api';

/** Display label for account_type */
const formatAccountType = (t) => {
  if (!t) return '';
  return String(t)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/** Tab label: main category name only (strip subtitle after -, –, -, |, or before '('). */
const mainCategoryTabLabel = (t) => {
  if (!t) return '';
  let s = String(t).trim();
  for (const d of [' - ', ' – ', ' - ', ' | ']) {
    const i = s.indexOf(d);
    if (i > 0) {
      s = s.slice(0, i).trim();
      break;
    }
  }
  const paren = s.indexOf(' (');
  if (paren > 0) s = s.slice(0, paren).trim();
  return formatAccountType(s);
};

/** Currency formatting for the entries detail table (2dp). */
const formatAmount = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const formatDateDisplay = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

const SOURCE_LABELS = {
  general_ledger_entries: 'GL',
  other_transaction_gl_entries: 'Other GL',
  gsec_entries: 'GSec',
  opening_balance_entries: 'Opening Balance'
};

const sourceBadgeClass = (src) => {
  switch (src) {
    case 'opening_balance_entries':
      return 'frn-src-ob';
    case 'gsec_entries':
      return 'frn-src-gsec';
    case 'other_transaction_gl_entries':
      return 'frn-src-other';
    default:
      return 'frn-src-gl';
  }
};

const collectDistinctAccountTypes = (rows) => {
  const byLower = new Map();
  for (const row of rows) {
    const raw = row?.account_type;
    if (raw == null || String(raw).trim() === '') continue;
    const trimmed = String(raw).trim();
    const key = trimmed.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, trimmed);
  }
  return Array.from(byLower.values());
};

const ACCOUNT_TYPE_ORDER = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
  'other income',
  'provisions'
];

const sortAccountTypes = (types) => {
  return [...types].sort((a, b) => {
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    const ia = ACCOUNT_TYPE_ORDER.indexOf(al);
    const ib = ACCOUNT_TYPE_ORDER.indexOf(bl);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
};

const buildTypeCategoryTree = (allRows, activeKeyLower) => {
  const rows = allRows.filter((r) => (r.account_type || '').toLowerCase() === activeKeyLower);
  const categoryOrder = new Map();
  for (const r of rows) {
    const raw = (r.category_name || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!categoryOrder.has(key)) categoryOrder.set(key, raw);
  }
  const sortedCatKeys = [...categoryOrder.keys()].sort((a, b) =>
    categoryOrder.get(a).localeCompare(categoryOrder.get(b), undefined, { sensitivity: 'base' })
  );
  return sortedCatKeys.map((catKey) => {
    const categoryDisplayName = categoryOrder.get(catKey);
    const txSet = new Set();
    for (const r of rows) {
      if ((r.category_name || '').trim().toLowerCase() !== catKey) continue;
      const tt = (r.transaction_type_name || '').trim();
      if (tt) txSet.add(tt);
    }
    const transactionTypeNames = [...txSet].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    return { categoryName: categoryDisplayName, transactionTypeNames };
  });
};

const sofpContextKey = (ctx) => {
  if (!ctx) return '';
  return [
    ctx.accountCode || '',
    ctx.asOfDate || '',
    ctx.displayLabel || ctx.accountName || '',
    ctx.portfolioId || ''
  ].join('|');
};

const FinancialReportingNotes = ({ context = null, onTabChange }) => {
  const [allRows, setAllRows] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAccountType, setActiveAccountType] = useState(null);

  const incomingContextKey = sofpContextKey(context);
  const [dismissedContextKey, setDismissedContextKey] = useState('');
  const prevIncomingKeyRef = useRef('');

  // Reset local dismiss when a new SOFP navigation arrives (stable string key, not object ref).
  useEffect(() => {
    if (incomingContextKey && incomingContextKey !== prevIncomingKeyRef.current) {
      setDismissedContextKey('');
    }
    prevIncomingKeyRef.current = incomingContextKey;
  }, [incomingContextKey]);

  const activeContext =
    context && incomingContextKey && incomingContextKey !== dismissedContextKey
      ? context
      : null;

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [entriesOpening, setEntriesOpening] = useState(0);
  const [entriesClosing, setEntriesClosing] = useState(0);

  const loadEntries = useCallback(async (ctx) => {
    if (!ctx || !ctx.accountCode) {
      setEntries([]);
      setEntriesOpening(0);
      setEntriesClosing(0);
      setEntriesError('');
      return;
    }
    try {
      setEntriesLoading(true);
      setEntriesError('');
      const resp = await accountReconciliationAPI.getAccountTransactions(
        ctx.accountCode,
        {
          startDate: '1900-01-01',
          endDate: ctx.asOfDate || new Date().toISOString().split('T')[0]
        }
      );
      const txs = Array.isArray(resp?.transactions) ? resp.transactions : [];
      setEntries(txs);
      setEntriesOpening(Number(resp?.openingBalance) || 0);
      setEntriesClosing(Number(resp?.closingBalance) || 0);
    } catch (e) {
      setEntriesError(e.message || 'Failed to load entries for this account');
      setEntries([]);
      setEntriesOpening(0);
      setEntriesClosing(0);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctx =
      context && incomingContextKey && incomingContextKey !== dismissedContextKey
        ? context
        : null;
    loadEntries(ctx);
  }, [context, incomingContextKey, dismissedContextKey, loadEntries]);

  const entryTotals = useMemo(() => {
    const debit = entries.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const credit = entries.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    return { debit, credit, net: debit - credit };
  }, [entries]);

  const clearContext = () => {
    if (incomingContextKey) {
      setDismissedContextKey(incomingContextKey);
    }
    setEntries([]);
    setEntriesError('');
    onTabChange?.('Financial Reporting Notes', null);
  };

  const goBackToSofp = () => {
    if (typeof onTabChange === 'function') {
      onTabChange('Statement of Financial Position');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [mainCats, txTypes] = await Promise.all([
          accountCategoryAPI.getAll().catch(() => []),
          accountCategoryAPI.getAllTransactionTypes().catch(() => [])
        ]);
        if (cancelled) return;

        const main = Array.isArray(mainCats) ? mainCats : [];
        const tx = Array.isArray(txTypes) ? txTypes : [];
        const merged = [...main, ...tx];

        setAllRows(merged);

        const distinct = sortAccountTypes(collectDistinctAccountTypes(merged));
        setAccountTypes(distinct);
        setActiveAccountType((prev) => {
          if (prev && distinct.some((t) => t.toLowerCase() === prev.toLowerCase())) {
            return distinct.find((t) => t.toLowerCase() === prev.toLowerCase()) ?? null;
          }
          return distinct[0] ?? null;
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load account categories');
          setAllRows([]);
          setAccountTypes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeKey = activeAccountType?.toLowerCase() ?? '';

  const categoryTree = useMemo(
    () => (activeKey ? buildTypeCategoryTree(allRows, activeKey) : []),
    [allRows, activeKey]
  );

  return (
    <div className="fp-main-container">
      <div className="fp-content-wrapper">
        <div className="fp-header-section">
          <div className="fp-header-left">
            <h1 className="fp-main-title">Notes to Financial Reporting</h1>
          </div>
        </div>

        {activeContext && (
          <div className="frn-context-panel">
            <div className="frn-context-header">
              <div className="frn-context-title-wrap">
                <span className="frn-context-eyebrow">
                  From {activeContext.source || 'SOFP'}
                </span>
                <h2 className="frn-context-title">
                  {activeContext.displayLabel ||
                    activeContext.transactionTypeName ||
                    activeContext.accountName ||
                    activeContext.accountCategory ||
                    'Selected account'}
                </h2>
                <div className="frn-context-meta">
                  {activeContext.accountCode ? (
                    <span className="frn-context-chip">
                      Account: <strong>{activeContext.accountCode}</strong>
                    </span>
                  ) : null}
                  {activeContext.accountName &&
                  activeContext.accountName !== activeContext.displayLabel ? (
                    <span className="frn-context-chip">
                      GL name: <strong>{activeContext.accountName}</strong>
                    </span>
                  ) : null}
                  <span className="frn-context-chip">
                    As of: <strong>{formatDateDisplay(activeContext.asOfDate)}</strong>
                  </span>
                  <span className="frn-context-chip">
                    Portfolio:{' '}
                    <strong>{activeContext.portfolioLabel || 'All Portfolios'}</strong>
                  </span>
                  <span className="frn-context-chip frn-context-chip-amount">
                    SOFP balance:{' '}
                    <strong>
                      {formatAmount(Math.abs(Number(activeContext.balance) || 0))}
                    </strong>{' '}
                    {activeContext.balanceType && activeContext.balanceType !== 'ZERO'
                      ? activeContext.balanceType
                      : ''}
                  </span>
                </div>
              </div>
              <div className="frn-context-actions">
                <button
                  type="button"
                  className="fp-export-button"
                  onClick={goBackToSofp}
                >
                  Back to SOFP
                </button>
                <button
                  type="button"
                  className="fp-export-button"
                  onClick={clearContext}
                >
                  Clear filter
                </button>
              </div>
            </div>

            {!activeContext.accountCode ? (
              <div className="frn-context-empty">
                This SOFP line is a derived total (no single GL account behind it),
                so the underlying entries cannot be listed individually.
              </div>
            ) : entriesLoading ? (
              <div className="frn-loading">
                <div className="fp-loading-spinner" />
                <p className="frn-loading-text">Loading entries…</p>
              </div>
            ) : entriesError ? (
              <div className="frn-error">{entriesError}</div>
            ) : entries.length === 0 ? (
              <div className="frn-context-empty">
                No general ledger / opening balance entries found for this account
                up to {formatDateDisplay(activeContext.asOfDate)}.
              </div>
            ) : (
              <>
                <div className="frn-context-summary">
                  <div className="frn-summary-cell">
                    <div className="frn-summary-label">Opening balance</div>
                    <div className="frn-summary-value">
                      {formatAmount(entriesOpening)}
                    </div>
                  </div>
                  <div className="frn-summary-cell">
                    <div className="frn-summary-label">Period debits</div>
                    <div className="frn-summary-value">
                      {formatAmount(entryTotals.debit)}
                    </div>
                  </div>
                  <div className="frn-summary-cell">
                    <div className="frn-summary-label">Period credits</div>
                    <div className="frn-summary-value">
                      {formatAmount(entryTotals.credit)}
                    </div>
                  </div>
                  <div className="frn-summary-cell">
                    <div className="frn-summary-label">Closing balance</div>
                    <div className="frn-summary-value">
                      {formatAmount(entriesClosing)}
                    </div>
                  </div>
                  <div className="frn-summary-cell">
                    <div className="frn-summary-label">Entries</div>
                    <div className="frn-summary-value">{entries.length}</div>
                  </div>
                </div>

                <div className="frn-entries-wrap">
                  <table className="frn-entries-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Source</th>
                        <th>Description</th>
                        <th>Reference</th>
                        <th className="frn-entries-num">Debit</th>
                        <th className="frn-entries-num">Credit</th>
                        <th className="frn-entries-num">Running balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateDisplay(row.date)}</td>
                          <td>
                            <span
                              className={`frn-src-badge ${sourceBadgeClass(
                                row.gl_source
                              )}`}
                            >
                              {SOURCE_LABELS[row.gl_source] || row.gl_source}
                            </span>
                          </td>
                          <td className="frn-entries-desc">
                            {row.description || '-'}
                          </td>
                          <td>{row.reference || '-'}</td>
                          <td className="frn-entries-num">
                            {row.debit ? formatAmount(row.debit) : ''}
                          </td>
                          <td className="frn-entries-num">
                            {row.credit ? formatAmount(row.credit) : ''}
                          </td>
                          <td className="frn-entries-num">
                            {formatAmount(row.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <div className="frn-body">
          {loading && (
            <div className="frn-loading">
              <div className="fp-loading-spinner" />
              <p className="frn-loading-text">Loading…</p>
            </div>
          )}

          {!loading && error && <div className="frn-error">{error}</div>}

          {!loading && !error && accountTypes.length === 0 && (
            <div className="frn-empty">
              No rows found in <strong>account_categories</strong> for your user. Add data under Account Categories.
            </div>
          )}

          {!loading && !error && accountTypes.length > 0 && (
            <>
              <div className="frn-tabs-wrap" role="tablist" aria-label="account_type">
                <div className="frn-tabs-scroll">
                  {accountTypes.map((type) => {
                    const isActive =
                      activeAccountType != null &&
                      type.toLowerCase() === (activeAccountType || '').toLowerCase();
                    return (
                      <button
                        key={type.toLowerCase()}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`frn-tab frn-tab-single ${isActive ? 'frn-tab-active' : ''}`}
                        onClick={() => setActiveAccountType(type)}
                      >
                        <span className="frn-tab-label">{mainCategoryTabLabel(type)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="frn-panel" role="tabpanel">
                {activeAccountType ? (
                  categoryTree.length > 0 ? (
                    <div className="frn-tree frn-tree-flat">
                      <h3 className="frn-mock-block-title">Category structure</h3>
                      {categoryTree.map(({ categoryName, transactionTypeNames }) => (
                        <div key={categoryName.toLowerCase()} className="frn-cat-block">
                          <h3 className="frn-cat-title">{categoryName}</h3>
                          {transactionTypeNames.length > 0 ? (
                            <ul className="frn-tx-only-list">
                              {transactionTypeNames.map((tt) => (
                                <li key={tt}>{tt}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="frn-sub-empty">
                              No transaction_type_name for this category_name (main category row only, or empty).
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="frn-panel-placeholder">
                      No <strong>category_name</strong> for this <strong>account_type</strong> in account_categories.
                    </p>
                  )
                ) : (
                  <p className="frn-panel-placeholder">Select an account type tab above.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
