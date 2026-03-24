import React, { useState, useEffect, useMemo } from 'react';
import './Styles/FinancialPosition.css';
import { accountCategoryAPI } from '../../services/api';

/** Display label for account_type */
const formatAccountType = (t) => {
  if (!t) return '';
  return String(t)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/** Tab label: main category name only (strip subtitle after —, –, -, |, or before '('). */
const mainCategoryTabLabel = (t) => {
  if (!t) return '';
  let s = String(t).trim();
  for (const d of [' — ', ' – ', ' - ', ' | ']) {
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

const formatLKR = (n) =>
  new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(n) || 0);

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

/** Notes disclosure table (LKR) */
const NotesTable = ({ title, subtitle, columns, rows }) => (
  <div className="frn-mock-section">
    {title ? <h4 className="frn-mock-h4">{title}</h4> : null}
    {subtitle ? <p className="frn-mock-sub">{subtitle}</p> : null}
    <div className="frn-mock-table-wrap">
      <table className="frn-mock-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className={c !== columns[0] ? 'frn-mock-th-num' : ''}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.isTotal ? 'frn-mock-row-total' : row.isSub ? 'frn-mock-row-sub' : ''}>
              {row.cells.map((cell, j) => {
                const isNum = typeof cell === 'number';
                return (
                  <td key={j} className={j > 0 && isNum ? 'frn-mock-num' : ''}>
                    {isNum ? formatLKR(cell) : cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const NOTE_PERIOD_COLS = ['Sep-25 LKR', 'Mar-25 LKR', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25'];

const notesDisclosureByType = (typeKey) => {
  const k = typeKey.toLowerCase().replace(/\s+/g, ' ').trim();

  if (k === 'revenue' || k === 'income') {
    return (
      <>
        <NotesTable
          title="Note — Revenue"
          subtitle="For the period ended 30 September 2025"
          columns={['', ...NOTE_PERIOD_COLS]}
          rows={[
            { cells: ['Capital gain on Treasury Bills', 5200000, 4100000, 800000, 900000, 1100000, 950000] },
            { cells: ['Capital gain on Treasury Bonds', 182000000, 165400000, 12000000, 14000000, 18000000, 15000000] },
            { cells: ['Interest income — Treasury bonds & REPs', 45600000, 38900000, 5200000, 6100000, 7200000, 6800000] },
            {
              isTotal: true,
              cells: ['Total', 232800000, 208400000, 18000000, 21000000, 26300000, 22950000]
            }
          ]}
        />
      </>
    );
  }

  if (k === 'other income') {
    return (
      <NotesTable
        title="Note — Other income"
        subtitle="For the period ended 30 September 2025"
        columns={['', ...NOTE_PERIOD_COLS]}
        rows={[
          { cells: ['Interest income on current account', 2400000, 2100000, 120000, 150000, 180000, 160000] },
          { cells: ['Sundry income', 890000, 760000, 45000, 52000, 48000, 55000] },
          { cells: ['Interest income — other', 3200000, 2950000, 80000, 95000, 110000, 98000] },
          { cells: ['Dividend income', 78500000, 70200000, 4200000, 5100000, 6200000, 5800000] },
          { cells: ['Other income from financial assets', 12500000, 10800000, 950000, 1100000, 980000, 1020000] },
          { isTotal: true, cells: ['Total', 97490000, 86870000, 5495000, 6507000, 6608000, 7126000] }
        ]}
      />
    );
  }

  if (k === 'expense') {
    return (
      <>
        <NotesTable
          title="Note — Finance cost"
          subtitle="For the period ended 30 September 2025"
          columns={['', ...NOTE_PERIOD_COLS]}
          rows={[
            { cells: ['Interest expense on borrowings', 12400000, 11800000, 980000, 1020000, 1100000, 1050000] },
            { cells: ['Interest expense on tax', 890000, 760000, 65000, 72000, 78000, 71000] },
            { cells: ['Interest on soft loan', 2100000, 1950000, 120000, 135000, 148000, 142000] },
            { cells: ['Interest on lease', 4560000, 4200000, 280000, 310000, 325000, 318000] },
            { isTotal: true, cells: ['Total', 19950000, 18710000, 1445000, 1537000, 1651000, 1581000] }
          ]}
        />
      </>
    );
  }

  if (k === 'asset') {
    return (
      <>
        <NotesTable
          title="Note — Property, plant & equipment (roll-forward)"
          subtitle="At cost"
          columns={['', 'Balance 01 Apr 25', 'Additions', 'Disposals', 'Balance 30 Sep 25']}
          rows={[
            { cells: ['Office computer', 2400000, 320000, 0, 2720000] },
            { cells: ['Office equipment', 8900000, 450000, 120000, 9230000] },
            { isSub: true, cells: ['Accumulated depreciation — Computer', 1200000, 180000, 0, 1380000] },
            { isSub: true, cells: ['Accumulated depreciation — Equipment', 3560000, 520000, 80000, 4000000] },
            { isTotal: true, cells: ['Net carrying amount', 6540000, 70000, 40000, 6570000] }
          ]}
        />
        <NotesTable
          title="Note — Other receivables"
          columns={['', '30 Sep 25', '31 Mar 25']}
          rows={[
            { cells: ['Refundable deposit', 1250000, 1180000] },
            { cells: ['Advance — other expenses', 890000, 760000] },
            { cells: ['Service charge on interest income', 340000, 298000] },
            { cells: ['Other WHT receivable', 210000, 185000] },
            { cells: ['Other receivable — related party', 5600000, 5200000] },
            { isTotal: true, cells: ['Total', 8290000, 7623000] }
          ]}
        />
      </>
    );
  }

  if (k === 'liability') {
    return (
      <>
        <NotesTable
          title="Note — Income tax"
          columns={['', 'Current tax', 'Deferred tax']}
          rows={[
            { cells: ['Opening balance', 4200000, 1850000] },
            { cells: ['Charge for the period', 15200000, 3200000] },
            { cells: ['Payments / adjustments', 11800000, 450000] },
            { isTotal: true, cells: ['Closing balance', 11600000, 4600000] }
          ]}
        />
        <NotesTable
          title="Note — Deferred tax asset / (liability) movement"
          columns={['', 'SOFP 2025', 'SOFP 2024', 'SOCI 2025', 'SOCI 2024']}
          rows={[
            { cells: ['Fair value gain', 2100000, 1850000, 420000, 310000] },
            { cells: ['Retirement benefit plan', 890000, 760000, 120000, 95000] },
            { cells: ['Right-of-use asset', 1560000, 1420000, 180000, 165000] },
            { cells: ['Accelerated depreciation (tax)', 3200000, 2980000, 220000, 198000] },
            { isTotal: true, cells: ['Net deferred tax', 7750000, 7010000, 940000, 768000] }
          ]}
        />
      </>
    );
  }

  if (k === 'equity') {
    return (
      <NotesTable
        title="Note — Equity reconciliation"
        columns={['', 'Share capital', 'Retained earnings', 'Total']}
        rows={[
          { cells: ['Balance 01 April 2025', 500000000, 124500000, 624500000] },
          { cells: ['Profit for the period', 0, 28500000, 28500000] },
          { cells: ['Dividends paid', 0, 12000000, 12000000] },
          { isTotal: true, cells: ['Balance 30 September 2025', 500000000, 141000000, 641000000] }
        ]}
      />
    );
  }

  if (k === 'provisions') {
    return (
      <NotesTable
        title="Note — Provisions"
        columns={['', 'Opening', 'Additional', 'Utilised', 'Closing']}
        rows={[
          { cells: ['Tax contingencies', 2400000, 450000, 120000, 2730000] },
          { cells: ['Staff gratuity', 8900000, 620000, 410000, 9110000] },
          { cells: ['Legal claims', 1200000, 0, 200000, 1000000] },
          { isTotal: true, cells: ['Total provisions', 12500000, 1070000, 730000, 12840000] }
        ]}
      />
    );
  }

  return (
    <NotesTable
      title={`Note — ${formatAccountType(typeKey)}`}
      subtitle="For the period ended 30 September 2025"
      columns={['Description', 'Current period LKR', 'Prior period LKR']}
      rows={[
        { cells: ['Line item A', 1250000, 980000] },
        { cells: ['Line item B', 3400000, 3100000] },
        { cells: ['Line item C', 890000, 760000] },
        { isTotal: true, cells: ['Total', 5540000, 4840000] }
      ]}
    />
  );
};

const FinancialReportingNotes = () => {
  const [allRows, setAllRows] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAccountType, setActiveAccountType] = useState(null);

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
            <div className="fp-period-info">
              <span className="fp-period-label">Notes to the financial statements · period ended 30 September 2025</span>
            </div>
          </div>
        </div>

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
                  <>
                    <div className="frn-mock-block">
                      <h3 className="frn-mock-block-title">Notes disclosure (LKR)</h3>
                      {notesDisclosureByType(activeKey)}
                    </div>

                    {categoryTree.length > 0 ? (
                      <div className="frn-tree frn-tree-flat frn-after-mock">
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
                      <p className="frn-panel-placeholder frn-after-mock">
                        No <strong>category_name</strong> for this <strong>account_type</strong> in account_categories.
                      </p>
                    )}
                  </>
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
