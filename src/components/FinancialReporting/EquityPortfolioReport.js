import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/EquityPortfolioReport.css';

const EQUITY_COLS = [
  'Counter',
  'No. of shares',
  'WACC',
  'Total Cost',
  'BEC Based on WACC',
  'BEC Cost (after deducting dividends)',
  'BEC Based on 31March - MV',
  'Mkt value/Per share',
  'Total Mrkt Value',
  'Unrealised Gain or (Loss) Based on Wacc & MV 23.03.2026',
  'Unrealised Gain or (Loss) Based on MV 31.03.2025 & 23.03.2026'
];

const EQUITY_SUM_COL_INDEXES = [1, 3, 8, 9, 10];
const EQUITY_NUM_COL_INDEXES = [1, 2, 3, 8, 9, 10];

const TRADING_COLS = ['', 'Sampath Bank', 'Com Bank', 'Balance shares'];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseMoney = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s)
    .trim()
    .replace(/,/g, '')
    .replace(/%/g, '')
    .replace(/\s*p\s*$/i, '');
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

const INITIAL_SECTIONS = [
  {
    title: 'Ambeon Capital PLC - Equity Portfolio',
    valuationDateYmd: '2026-03-23',
    sectionNotes: '',
    rows: [
      { cells: ['COMB', 29109, '', '', '', '', '', 191.25, 5567096, 5567096, 5567096] },
      { cells: ['Capital Metals', 59701000, '10.05', 600000000, '2.50 P', '', '', '4.95P', 1235362047, 635362047, 635362047] },
      { cells: ['MDL.N', 18500000, '8.58', 158720656, '', '', '', 20.6, 381100000, 222379344, 222379344] },
      { cells: ['CHOT', 19425117, '30.08', 584277635, '30.42', '', '', 31.3, 608006162, 23728527, 23728527] }
    ]
  },
  {
    title: 'Ambeon Holdings PLC- Equity Portfolio',
    valuationDateYmd: '2026-03-23',
    sectionNotes: '20.69\n1,235,362,046.99',
    rows: [
      { cells: ['HNB.X', 607538, '281.97', 171305615, '285.13', '', '', 330, 200487540, 29181925, 29181925] },
      { cells: ['COMB', 3050000, '180.30', 549904256, '182.32', '', '', 191.25, 583312500, 33408244, 33408244] },
      { cells: ['HAY', 15697, '175.26', 2751050, '177.22', '', '', 205.25, 3221809, 470759, 470759] },
      { cells: ['SAM', 20837, '89.93', 1873783, '90.93', '71.28', '123.87', 151.25, 3151596, 1277813, 570475] },
      { cells: ['DFCC', 38275412, '91.63', 3507196459, '92.66', '79.16', '107.19', 129.25, 4947097001, 1439900542, 844462760] },
      { cells: ['SEYB', 30296829, '63.19', 1914445564, '63.90', '56.40', '73.31', 100, 3029682900, 1115237336, 808561772] },
      { cells: ['CHOT', 5000000, '40.35', 201732500, '40.80', '', '', 31.3, 156500000, -45232500, -45232500] },
      { cells: ['KHC.N', 45904622, '12.08', 554736954, '12.22', '', '', 13.9, 638074246, 83337292, 83337292] }
    ]
  },
  {
    title: 'Colombo City Holdings PLC - Equity Portfolio',
    valuationDateYmd: '2026-03-23',
    sectionNotes: '',
    rows: [
      { cells: ['DFCC', 5167734, '84.50', 436662688, '85.44', '71.94', '107.19', 129.25, 667929620, 231266932, 114014682] }
    ]
  }
];

const INITIAL_TRADING = {
  title: 'Trading Balances shares',
  rows: [
    { cells: ['Pledged - Seylan shares', '20000000', '', '5296829'] },
    { cells: ['- Seylan shares', '5000000', '', ''] },
    { cells: ['- DFCC shares', '3000000', '', ''] },
    { cells: ['Pledged DFCC shares', '', '27000000', '8275412'] },
    { cells: ['Com Bank', '', '', '3050000'] },
    { cells: ['Sampath', '', '', '20837'] }
  ]
};

function cloneSectionsWithIds() {
  return INITIAL_SECTIONS.map((sec) => ({
    sectionId: newId(),
    title: sec.title,
    valuationDateYmd: toInputYmd(sec.valuationDateYmd),
    sectionNotes: sec.sectionNotes || '',
    rows: (sec.rows || []).map((r) => ({
      id: newId(),
      cells: normalizeCells(r.cells, EQUITY_COLS.length)
    }))
  }));
}

function cloneTradingWithIds(src) {
  return {
    title: src.title,
    rows: (src.rows || []).map((r) => ({
      id: newId(),
      cells: normalizeCells(r.cells, TRADING_COLS.length)
    }))
  };
}

const newEmptySection = () => ({
  sectionId: newId(),
  title: 'New company - Equity Portfolio',
  valuationDateYmd: new Date().toISOString().slice(0, 10),
  sectionNotes: '',
  rows: [emptyRow(EQUITY_COLS.length)]
});

const snapshot = (src) => JSON.parse(JSON.stringify(src));

const DataTable = ({
  columns,
  rows,
  setRows,
  sumIndexes,
  viewOnly,
  numColIndexes = [],
  totalLabel = 'Total',
  showTotalRow = true
}) => {
  const totals = useMemo(
    () => buildTotalsRow(rows, columns, sumIndexes, totalLabel),
    [rows, columns, sumIndexes, totalLabel]
  );

  const updateCell = (rowIndex, cellIndex, raw) => {
    setRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, cells: r.cells.map((c, ci) => (ci === cellIndex ? raw : c)) } : r
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(columns.length)]);
  const removeRow = (rowIndex) => setRows((prev) => prev.filter((_, i) => i !== rowIndex));

  return (
    <div className="epr-table-block">
      <div className="bfr-table-wrap epr-table-wrap">
        <table className={`bfr-table ${viewOnly ? 'bfr-table--readonly' : 'bfr-table--editable'} epr-table`}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={col || `col-${i}`}>{col || ' '}</th>
              ))}
              {!viewOnly ? <th className="bfr-col-actions" aria-label="Row actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (viewOnly ? 0 : 1)} className="bfr-empty-hint">
                  No rows yet.
                </td>
              </tr>
            ) : null}
            {rows.map((r, rowIndex) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => {
                  const isNum = numColIndexes.includes(j) || sumIndexes.includes(j);
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
                        aria-label={`${columns[j] || 'Column'} row ${rowIndex + 1}`}
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
            {showTotalRow ? (
              <tr className="bfr-total-row">
                {totals.map((cell, j) => (
                  <td key={j} className={sumIndexes.includes(j) ? 'bfr-num' : ''}>
                    {typeof cell === 'number' ? fmt(cell) : cell === '-' ? '-' : cell}
                  </td>
                ))}
                {!viewOnly ? <td className="bfr-col-actions" /> : null}
              </tr>
            ) : null}
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

const EquityPortfolioReport = ({ open, onClose, equityDate = '2026-03-23', embedded = false }) => {
  const [sections, setSections] = useState([]);
  const [tradingBalances, setTradingBalances] = useState(() => cloneTradingWithIds(INITIAL_TRADING));
  const [savedSections, setSavedSections] = useState(null);
  const [savedTradingBalances, setSavedTradingBalances] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [headerDateYmd, setHeaderDateYmd] = useState(() => toInputYmd(equityDate));
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
      setSections(cloneSectionsWithIds());
      setTradingBalances(cloneTradingWithIds(INITIAL_TRADING));
      setSavedSections(null);
      setSavedTradingBalances(null);
      setViewOnly(false);
      setSavedHeaderDateYmd(null);
      setHeaderDateYmd(toInputYmd(equityDate));
    }
  }, [open, embedded, equityDate]);

  const handleSave = () => {
    setSavedSections(snapshot(sections));
    setSavedTradingBalances(snapshot(tradingBalances));
    setSavedHeaderDateYmd(headerDateYmd);
    setViewOnly(true);
  };

  const handleEditAgain = () => setViewOnly(false);

  const dataSections = viewOnly && savedSections ? savedSections : sections;
  const dataTrading = viewOnly && savedTradingBalances ? savedTradingBalances : tradingBalances;
  const displayHeaderYmd = viewOnly && savedHeaderDateYmd != null ? savedHeaderDateYmd : headerDateYmd;

  const patchSection = (sectionIndex, patch) => {
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, ...patch } : sec)));
  };

  const setPortfolioRows = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        const next = typeof updater === 'function' ? updater(sec.rows) : updater;
        return { ...sec, rows: next };
      })
    );
  };

  const setTradingRows = (updater) => {
    setTradingBalances((prev) => {
      const next = typeof updater === 'function' ? updater(prev.rows) : updater;
      return { ...prev, rows: next };
    });
  };

  const addSection = () => setSections((prev) => [...prev, newEmptySection()]);
  const removeSection = (sectionIndex) => {
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== sectionIndex)));
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
          className="bfr-modal-shell epr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="epr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          {!embedded ? (
            <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close equity report">
              ×
            </button>
          ) : null}
          <div className="bfr-doc">
            <div className="bfr-title-band">
              <h1 id="epr-dialog-title" className="bfr-title-band-heading">
                <span className="bfr-title-band-label">Equity -</span>
                {viewOnly ? (
                  <time dateTime={displayHeaderYmd}>{formatDisplayDate(displayHeaderYmd)}</time>
                ) : (
                  <label className="bfr-header-date-field">
                    <span className="bfr-sr-only">Equity as of date</span>
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

            {dataSections.map((sec, si) => (
              <section key={sec.sectionId} className="bfr-section epr-section">
                {viewOnly ? (
                  <h2 className="bfr-entity-name bfr-entity-name--readonly">{sec.title}</h2>
                ) : (
                  <input
                    type="text"
                    className="bfr-entity-input epr-section-title-input"
                    value={sec.title}
                    onChange={(e) => patchSection(si, { title: e.target.value })}
                    placeholder="Portfolio title"
                  />
                )}

                <div className="epr-valuation-row">
                  <span className="epr-valuation-label">Valuation date</span>
                  {viewOnly ? (
                    <span>{formatDisplayDate(sec.valuationDateYmd)}</span>
                  ) : (
                    <input
                      type="date"
                      className="bfr-header-date-input epr-valuation-date"
                      value={toInputYmd(sec.valuationDateYmd)}
                      onChange={(e) => patchSection(si, { valuationDateYmd: toInputYmd(e.target.value) })}
                      aria-label={`Valuation date for ${sec.title}`}
                    />
                  )}
                </div>

                <DataTable
                  columns={EQUITY_COLS}
                  rows={sec.rows}
                  setRows={(u) => setPortfolioRows(si, u)}
                  sumIndexes={EQUITY_SUM_COL_INDEXES}
                  numColIndexes={EQUITY_NUM_COL_INDEXES}
                  viewOnly={viewOnly}
                />

                {sec.sectionNotes?.trim() || !viewOnly ? (
                  <div className="epr-section-notes">
                    {viewOnly ? (
                      sec.sectionNotes?.trim() ? (
                        <pre className="epr-section-notes-readonly">{sec.sectionNotes}</pre>
                      ) : null
                    ) : (
                      <textarea
                        className="bfr-internal-notes"
                        rows={2}
                        value={sec.sectionNotes}
                        onChange={(e) => patchSection(si, { sectionNotes: e.target.value })}
                        placeholder="Optional notes below this portfolio…"
                      />
                    )}
                  </div>
                ) : null}

                {!viewOnly ? (
                  <div className="bfr-section-structure-actions">
                    <button
                      type="button"
                      className="bfr-remove-structure"
                      onClick={() => removeSection(si)}
                      disabled={dataSections.length <= 1}
                    >
                      Remove this portfolio
                    </button>
                  </div>
                ) : null}
              </section>
            ))}

            {!viewOnly ? (
              <div className="bfr-add-section-wrap">
                <button type="button" className="bfr-add-section" onClick={addSection}>
                  + Add portfolio section
                </button>
              </div>
            ) : null}

            <section className="epr-trading-section">
              {viewOnly ? (
                <h2 className="bfr-subsection-title">{dataTrading.title}</h2>
              ) : (
                <input
                  type="text"
                  className="bfr-subsection-title-input"
                  value={dataTrading.title}
                  onChange={(e) => setTradingBalances((p) => ({ ...p, title: e.target.value }))}
                  aria-label="Trading balances title"
                />
              )}
              <DataTable
                columns={TRADING_COLS}
                rows={dataTrading.rows}
                setRows={setTradingRows}
                sumIndexes={[]}
                numColIndexes={[1, 2, 3]}
                viewOnly={viewOnly}
                showTotalRow={false}
              />
            </section>

            <p className="bfr-footnote">
              {viewOnly ? (
                <>Saved read-only view. Use <strong>Edit</strong> beside this panel to change data.</>
              ) : (
                <>
                  Edit portfolio rows and trading balances. Use <strong>Save</strong> beside this panel for formatted
                  tables. Total row sums No. of shares, Total Cost, Total Mrkt Value, and unrealised gain columns.
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

export default EquityPortfolioReport;
