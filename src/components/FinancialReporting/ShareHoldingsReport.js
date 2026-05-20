import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/ShareHoldingsReport.css';

const HOLDINGS_COLS = [
  'Counter',
  'AMC',
  'AMH',
  'CCH',
  'Total no of shares',
  'Group Holdings',
  '(Ordinary Shares)',
  'Balance to be purchased'
];

const HOLDINGS_SUM_COL_INDEXES = [1, 2, 3, 4, 6, 7];
const HOLDINGS_NUM_COL_INDEXES = [1, 2, 3, 4, 6, 7];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseMoney = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s)
    .trim()
    .replace(/,/g, '')
    .replace(/%/g, '');
  if (t === '' || t === '-' || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const fmt = (n) => {
  if (n === '' || n === null || n === undefined) return '-';
  const v = Number(n);
  if (Number.isNaN(v)) return '-';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const displayCell = (cell) => {
  if (cell === '' || cell === null || cell === undefined) return '-';
  const n = parseMoney(cell);
  if (n !== null) return fmt(n);
  return String(cell);
};

const normalizeCells = (cells, colCount) => {
  const arr = Array.isArray(cells) ? cells : [];
  return Array.from({ length: colCount }, (_, i) => {
    const c = arr[i];
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
    if (c === '-' || c === undefined || c === null) return '';
    return String(c);
  });
};

const emptyRow = (colCount) => ({ id: newId(), cells: Array.from({ length: colCount }, () => '') });

const sumColumn = (rows, colIndex) =>
  rows.reduce((sum, { cells }) => {
    const n = parseMoney(cells[colIndex]);
    return sum + (n !== null ? n : 0);
  }, 0);

const hasNumericInColumn = (rows, colIndex) =>
  rows.some(({ cells }) => parseMoney(cells[colIndex]) !== null);

const buildTotalsRow = (rows, columns, sumIndexes, label = 'Total') =>
  columns.map((_, i) => {
    if (i === 0) return label;
    if (sumIndexes.includes(i)) {
      const s = sumColumn(rows, i);
      return hasNumericInColumn(rows, i) ? s : '-';
    }
    return '';
  });

const toInputYmd = (value) => {
  const s = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10);
};

const formatDisplayDate = (ymd) => {
  const s = toInputYmd(ymd);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const INITIAL_ROWS = [
  { cells: ['DFCC', '', 38275412, 5167734, 43443146, '9.91%', 438404250, 178076.87] },
  { cells: ['Seylan', '', 30296829, '', 30296829, '9.93%', 305236937, ''] },
  { cells: ['SAMP', '', 20837, '', 20837, '0.002%', 1172700760, ''] },
  { cells: ['COMB.N', 29109, 3050000, '', 3079109, '0.20%', 1515561695, ''] },
  { cells: ['HNB.X', '', 607538, '', 607538, '0.52%', 115852722, ''] },
  { cells: ['HAY.N', '', 15697, '', 15697, '0.00%', 750000000, ''] },
  { cells: ['KHC.N', '', 45904622, '', 45904622, '6.09%', 754309253, ''] },
  { cells: ['CHOT.N', 19425117, 5000000, '', 24425117, '13.57%', 180030942, ''] },
  { cells: ['MDL.N', 18500000, '', '', 18500000, '51.03%', 36250000, ''] }
];

const INITIAL_FOOTER = {
  note: 'to reach 9.9%',
  rows: [
    { id: 'seed-1', label: 'Seylan', amount: '20000000' },
    { id: 'seed-2', label: 'Balance', amount: '10296829' }
  ]
};

function cloneRowsWithIds(rows) {
  return rows.map((r) => ({
    id: newId(),
    cells: normalizeCells(r.cells, HOLDINGS_COLS.length)
  }));
}

function cloneFooterWithIds(footer) {
  return {
    note: footer.note || '',
    rows: (footer.rows || []).map((r) => ({
      id: newId(),
      label: r.label || '',
      amount: r.amount ?? ''
    }))
  };
}

const snapshot = (src) => JSON.parse(JSON.stringify(src));

const HoldingsTable = ({ rows, setRows, viewOnly }) => {
  const totals = useMemo(
    () => buildTotalsRow(rows, HOLDINGS_COLS, HOLDINGS_SUM_COL_INDEXES),
    [rows]
  );

  const updateCell = (rowIndex, cellIndex, raw) => {
    setRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, cells: r.cells.map((c, ci) => (ci === cellIndex ? raw : c)) } : r
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(HOLDINGS_COLS.length)]);
  const removeRow = (rowIndex) => setRows((prev) => prev.filter((_, i) => i !== rowIndex));

  return (
    <div className="shr-table-block">
      <p className="shr-col-hint">
        <span>No of shares</span>
        <span className="shr-col-hint-sub">AMC · AMH · CCH</span>
      </p>
      <div className="bfr-table-wrap shr-table-wrap">
        <table className={`bfr-table ${viewOnly ? 'bfr-table--readonly' : 'bfr-table--editable'} shr-table`}>
          <thead>
            <tr>
              {HOLDINGS_COLS.map((col) => (
                <th key={col}>{col}</th>
              ))}
              {!viewOnly ? <th className="bfr-col-actions" aria-label="Row actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rowIndex) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => {
                  const isNum = HOLDINGS_NUM_COL_INDEXES.includes(j);
                  if (viewOnly) {
                    return (
                      <td key={j} className={isNum ? 'bfr-num' : ''}>
                        {displayCell(cell)}
                      </td>
                    );
                  }
                  return (
                    <td key={j} className={isNum ? 'bfr-num bfr-cell-input' : 'bfr-cell-input'}>
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, j, e.target.value)}
                        aria-label={`${HOLDINGS_COLS[j]} row ${rowIndex + 1}`}
                      />
                    </td>
                  );
                })}
                {!viewOnly ? (
                  <td className="bfr-col-actions">
                    <button type="button" className="bfr-row-remove" onClick={() => removeRow(rowIndex)} title="Remove row">
                      ×
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            <tr className="bfr-total-row">
              {totals.map((cell, j) => (
                <td key={j} className={HOLDINGS_SUM_COL_INDEXES.includes(j) ? 'bfr-num' : ''}>
                  {typeof cell === 'number' ? fmt(cell) : cell === '-' ? '-' : cell}
                </td>
              ))}
              {!viewOnly ? <td className="bfr-col-actions" /> : null}
            </tr>
          </tbody>
        </table>
      </div>
      {!viewOnly ? (
        <div className="bfr-table-actions">
          <button type="button" className="bfr-add-row" onClick={addRow}>
            + Add row
          </button>
        </div>
      ) : null}
    </div>
  );
};

const ShareHoldingsReport = ({ open, onClose, asOfDate = '2026-03-23', embedded = false }) => {
  const [rows, setRows] = useState([]);
  const [footer, setFooter] = useState(() => cloneFooterWithIds(INITIAL_FOOTER));
  const [savedRows, setSavedRows] = useState(null);
  const [savedFooter, setSavedFooter] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [headerDateYmd, setHeaderDateYmd] = useState(() => toInputYmd(asOfDate));
  const [savedHeaderDateYmd, setSavedHeaderDateYmd] = useState(null);

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  useEffect(() => {
    if (open || embedded) {
      setRows(cloneRowsWithIds(INITIAL_ROWS));
      setFooter(cloneFooterWithIds(INITIAL_FOOTER));
      setSavedRows(null);
      setSavedFooter(null);
      setViewOnly(false);
      setSavedHeaderDateYmd(null);
      setHeaderDateYmd(toInputYmd(asOfDate));
    }
  }, [open, embedded, asOfDate]);

  const handleSave = () => {
    setSavedRows(snapshot(rows));
    setSavedFooter(snapshot(footer));
    setSavedHeaderDateYmd(headerDateYmd);
    setViewOnly(true);
  };

  const handleEditAgain = () => setViewOnly(false);

  const dataRows = viewOnly && savedRows ? savedRows : rows;
  const dataFooter = viewOnly && savedFooter ? savedFooter : footer;
  const displayHeaderYmd = viewOnly && savedHeaderDateYmd != null ? savedHeaderDateYmd : headerDateYmd;

  const addFooterRow = () => {
    setFooter((prev) => ({
      ...prev,
      rows: [...prev.rows, { id: newId(), label: '', amount: '' }]
    }));
  };

  const removeFooterRow = (rowId) => {
    setFooter((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.id !== rowId) }));
  };

  if (!open && !embedded) return null;

  const reportMarkup = (
    <div
      className={embedded ? 'bfr-embedded-root' : 'bfr-modal-root'}
      role={embedded ? undefined : 'presentation'}
      onClick={
        embedded
          ? undefined
          : (e) => {
              if (e.target === e.currentTarget) onClose?.();
            }
      }
    >
      <div className="bfr-modal-cluster" onClick={(e) => e.stopPropagation()}>
        <div
          className="bfr-modal-shell shr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          {!embedded ? (
            <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close share holdings report">
              ×
            </button>
          ) : null}
          <div className="bfr-doc">
            <div className="bfr-title-band">
              <h1 id="shr-dialog-title" className="bfr-title-band-heading">
                <span className="bfr-title-band-label">Ambeon Group - Equity Holdings -</span>
                {viewOnly ? (
                  <time dateTime={displayHeaderYmd}>{formatDisplayDate(displayHeaderYmd)}</time>
                ) : (
                  <label className="bfr-header-date-field">
                    <span className="bfr-sr-only">Holdings as of date</span>
                    <input
                      type="date"
                      className="bfr-header-date-input"
                      value={headerDateYmd}
                      onChange={(e) => setHeaderDateYmd(toInputYmd(e.target.value))}
                    />
                  </label>
                )}
              </h1>
            </div>

            <HoldingsTable rows={dataRows} setRows={setRows} viewOnly={viewOnly} />

            <section className="shr-footer-section">
              {viewOnly ? (
                dataFooter.note?.trim() ? <p className="shr-footer-note">{dataFooter.note}</p> : null
              ) : (
                <input
                  type="text"
                  className="shr-footer-note-input"
                  value={dataFooter.note}
                  onChange={(e) => setFooter((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Note (e.g. to reach 9.9%)"
                />
              )}
              <div className="bfr-table-wrap shr-footer-table-wrap">
                <table className={`bfr-table ${viewOnly ? 'bfr-table--readonly' : 'bfr-table--editable'}`}>
                  <thead>
                    <tr>
                      <th> </th>
                      <th>Amount</th>
                      {!viewOnly ? <th className="bfr-col-actions" aria-label="Row actions" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {dataFooter.rows.map((fr) =>
                      viewOnly ? (
                        <tr key={fr.id}>
                          <td>{fr.label || '-'}</td>
                          <td className="bfr-num">{displayCell(fr.amount)}</td>
                        </tr>
                      ) : (
                        <tr key={fr.id}>
                          <td className="bfr-cell-input">
                            <input
                              type="text"
                              value={fr.label}
                              onChange={(e) =>
                                setFooter((p) => ({
                                  ...p,
                                  rows: p.rows.map((r) => (r.id === fr.id ? { ...r, label: e.target.value } : r))
                                }))
                              }
                              aria-label="Label"
                            />
                          </td>
                          <td className="bfr-num bfr-cell-input">
                            <input
                              type="text"
                              value={fr.amount}
                              onChange={(e) =>
                                setFooter((p) => ({
                                  ...p,
                                  rows: p.rows.map((r) => (r.id === fr.id ? { ...r, amount: e.target.value } : r))
                                }))
                              }
                              aria-label="Amount"
                            />
                          </td>
                          <td className="bfr-col-actions">
                            <button
                              type="button"
                              className="bfr-row-remove"
                              onClick={() => removeFooterRow(fr.id)}
                              title="Remove row"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              {!viewOnly ? (
                <button type="button" className="bfr-add-row shr-footer-add" onClick={addFooterRow}>
                  + Add footer row
                </button>
              ) : null}
            </section>

            <p className="bfr-footnote">
              {viewOnly ? (
                <>Saved read-only view. Use <strong>Edit</strong> beside this panel to change data.</>
              ) : (
                <>
                  Edit holdings by company (AMC / AMH / CCH). Use <strong>Save</strong> beside this panel for formatted
                  tables. Total row sums share and balance columns.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="bfr-modal-floating-actions" role="toolbar" aria-label="Report view controls" onClick={(e) => e.stopPropagation()}>
          {viewOnly ? (
            <button type="button" className="bfr-btn-edit bfr-btn-floating" onClick={handleEditAgain}>
              Edit
            </button>
          ) : (
            <button type="button" className="bfr-btn-save bfr-btn-floating" onClick={handleSave}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return reportMarkup;
  return createPortal(reportMarkup, document.body);
};

export default ShareHoldingsReport;
