import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/TBondsReport.css';

const TBOND_COLS = [
  'ISIN No',
  'Face Value',
  'Cost',
  'Maturity Date',
  'Coupon Interest',
  'YTM',
  'Current Market - Rate',
  'Current Market value'
];

const TBOND_SUM_COL_INDEXES = [1, 2, 7];
const OTHER_INV_COLS = ['Date', 'Description', 'Balance'];
const OTHER_INV_SUM_COL_INDEX = 2;

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseMoney = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s).trim().replace(/,/g, '').replace(/%/g, '');
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

const formatHeaderDisplayDate = (ymd) => {
  const s = toInputYmd(ymd);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cellToInputDate = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
};

const displayDateCell = (cell) => {
  const ymd = cellToInputDate(cell);
  if (ymd) return formatHeaderDisplayDate(ymd);
  if (cell === '' || cell === null || cell === undefined) return '-';
  return String(cell);
};

const INITIAL_SECTIONS = [
  {
    title: 'Ambeon Holdings/AMC - Sell/Buy',
    tag: 'TAP INV',
    tBondsLabel: 'T/Bonds',
    tBondsRows: [
      {
        cells: ['LKB01226F014', 2877000, 2702642, '1-Aug-26', '11.5%', '15.30%', '8.00%', 3120610]
      }
    ],
    otherInvestmentsLabel: 'Other Investments',
    otherInvestmentsRows: [{ cells: ['2026-03-23', 'NDBWealth - Yield -7.57%', 894835000] }],
    equityPortfolioLabel: 'Equity Portfolio -',
    equityPortfolioNote: ''
  },
  {
    title: 'Summary of Investments Colombo City Holdings - Group',
    tag: '',
    tBondsLabel: 'T/Bonds',
    tBondsRows: [
      {
        cells: ['LKB000528L152', 20000000, 19704900, '15-Dec-28', '11.5%', '11.90%', '9.75%', 22580800]
      }
    ],
    otherInvestmentsLabel: 'Other Investments',
    otherInvestmentsRows: [
      { cells: ['', 'NDBWealth-(Lexinton) - Yield -7.8%', 23000000] },
      { cells: ['', 'Repo (Sherwood) @ 8.00% (LX H)', 72000000] },
      { cells: ['', 'NDBWealth Repo(CCH) - Yield -7.8%', 490000000] }
    ],
    equityPortfolioLabel: 'Equity Portfolio -',
    equityPortfolioNote: ''
  }
];

function cloneSectionsWithIds() {
  return INITIAL_SECTIONS.map((sec) => ({
    sectionId: newId(),
    title: sec.title,
    tag: sec.tag || '',
    tBondsLabel: sec.tBondsLabel || 'T/Bonds',
    tBondsRows: (sec.tBondsRows || []).map((r) => ({
      id: newId(),
      cells: normalizeCells(r.cells, TBOND_COLS.length)
    })),
    otherInvestmentsLabel: sec.otherInvestmentsLabel || 'Other Investments',
    otherInvestmentsRows: (sec.otherInvestmentsRows || []).map((r) => ({
      id: newId(),
      cells: normalizeCells(r.cells, OTHER_INV_COLS.length)
    })),
    equityPortfolioLabel: sec.equityPortfolioLabel || 'Equity Portfolio -',
    equityPortfolioNote: sec.equityPortfolioNote || ''
  }));
}

const newEmptySection = () => ({
  sectionId: newId(),
  title: 'New section',
  tag: '',
  tBondsLabel: 'T/Bonds',
  tBondsRows: [emptyRow(TBOND_COLS.length)],
  otherInvestmentsLabel: 'Other Investments',
  otherInvestmentsRows: [],
  equityPortfolioLabel: 'Equity Portfolio -',
  equityPortfolioNote: ''
});

const snapshot = (src) => JSON.parse(JSON.stringify(src));

const DataTable = ({
  columns,
  rows,
  setRows,
  sumIndexes,
  totalLabel = 'Total',
  viewOnly,
  numColIndexes = [],
  dateColIndexes = []
}) => {
  const totals = useMemo(() => buildTotalsRow(rows, columns, sumIndexes, totalLabel), [rows, columns, sumIndexes, totalLabel]);

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
    <div className="tbr-table-block">
      <div className="bfr-table-wrap">
        <table className={`bfr-table ${viewOnly ? 'bfr-table--readonly' : 'bfr-table--editable'}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
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
                  const isDate = dateColIndexes.includes(j);
                  if (viewOnly) {
                    return (
                      <td key={j} className={isNum ? 'bfr-num' : ''}>
                        {isDate ? displayDateCell(cell) : displayCell(cell)}
                      </td>
                    );
                  }
                  if (isDate) {
                    return (
                      <td key={j} className="bfr-cell-input tbr-cell-date-wrap">
                        <input
                          type="date"
                          className="bfr-header-date-input tbr-cell-date"
                          value={cellToInputDate(cell)}
                          onChange={(e) => updateCell(rowIndex, j, e.target.value)}
                          aria-label={`${columns[j]} row ${rowIndex + 1}`}
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={j} className={isNum ? 'bfr-num bfr-cell-input' : 'bfr-cell-input'}>
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, j, e.target.value)}
                        aria-label={`${columns[j]} row ${rowIndex + 1}`}
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
                <td key={j} className={sumIndexes.includes(j) ? 'bfr-num' : ''}>
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

const TBondsReport = ({ open, onClose, asOfDate = '2025-05-30', equityDate, valuationDate = '2026-03-23', embedded = false }) => {
  const [sections, setSections] = useState([]);
  const [savedSections, setSavedSections] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [headerDateYmd, setHeaderDateYmd] = useState(() => toInputYmd(asOfDate));
  const [equityDateYmd, setEquityDateYmd] = useState(() => toInputYmd(equityDate || '2025-05-28'));
  const [valuationDateYmd, setValuationDateYmd] = useState(() => toInputYmd(valuationDate));
  const [savedHeaderDateYmd, setSavedHeaderDateYmd] = useState(null);
  const [savedEquityDateYmd, setSavedEquityDateYmd] = useState(null);
  const [savedValuationDateYmd, setSavedValuationDateYmd] = useState(null);

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
      setSavedSections(null);
      setViewOnly(false);
      setSavedHeaderDateYmd(null);
      setSavedEquityDateYmd(null);
      setSavedValuationDateYmd(null);
      setHeaderDateYmd(toInputYmd(asOfDate));
      setEquityDateYmd(toInputYmd(equityDate || '2025-05-28'));
      setValuationDateYmd(toInputYmd(valuationDate));
    }
  }, [open, embedded, asOfDate, equityDate, valuationDate]);

  const handleSave = () => {
    setSavedSections(snapshot(sections));
    setSavedHeaderDateYmd(headerDateYmd);
    setSavedEquityDateYmd(equityDateYmd);
    setSavedValuationDateYmd(valuationDateYmd);
    setViewOnly(true);
  };

  const handleEditAgain = () => setViewOnly(false);

  const dataSections = viewOnly && savedSections ? savedSections : sections;
  const displayHeaderYmd = viewOnly && savedHeaderDateYmd != null ? savedHeaderDateYmd : headerDateYmd;
  const displayEquityYmd = viewOnly && savedEquityDateYmd != null ? savedEquityDateYmd : equityDateYmd;
  const displayValuationYmd = viewOnly && savedValuationDateYmd != null ? savedValuationDateYmd : valuationDateYmd;

  const patchSection = (sectionIndex, patch) => {
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, ...patch } : sec)));
  };

  const setTBondRows = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        const next = typeof updater === 'function' ? updater(sec.tBondsRows) : updater;
        return { ...sec, tBondsRows: next };
      })
    );
  };

  const setOtherInvRows = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        const next = typeof updater === 'function' ? updater(sec.otherInvestmentsRows) : updater;
        return { ...sec, otherInvestmentsRows: next };
      })
    );
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
          className="bfr-modal-shell tbr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tbr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          {!embedded ? (
            <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close T bonds report">
              ×
            </button>
          ) : null}
          <div className="bfr-doc">
            <div className="bfr-title-band">
              <h1 id="tbr-dialog-title" className="bfr-title-band-heading">
                <span className="bfr-title-band-label">Facilities available as at</span>
                {viewOnly ? (
                  <time dateTime={displayHeaderYmd}>{formatHeaderDisplayDate(displayHeaderYmd)}</time>
                ) : (
                  <label className="bfr-header-date-field">
                    <span className="bfr-sr-only">Facilities as of date</span>
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

            <div className="tbr-meta-row">
              <div className="tbr-meta-item">
                <span className="tbr-meta-label">Equity -</span>
                {viewOnly ? (
                  <span>{formatHeaderDisplayDate(displayEquityYmd)}</span>
                ) : (
                  <input
                    type="date"
                    className="bfr-header-date-input tbr-meta-date"
                    value={equityDateYmd}
                    onChange={(e) => setEquityDateYmd(toInputYmd(e.target.value))}
                    aria-label="Equity date"
                  />
                )}
              </div>
              <div className="tbr-meta-item">
                <span className="tbr-meta-label">T Bond Valuation date</span>
                {viewOnly ? (
                  <span>{formatHeaderDisplayDate(displayValuationYmd)}</span>
                ) : (
                  <input
                    type="date"
                    className="bfr-header-date-input tbr-meta-date"
                    value={valuationDateYmd}
                    onChange={(e) => setValuationDateYmd(toInputYmd(e.target.value))}
                    aria-label="T Bond valuation date"
                  />
                )}
              </div>
            </div>

            {dataSections.map((sec, si) => (
              <section key={sec.sectionId} className="bfr-section tbr-section">
                <div className="tbr-section-header">
                  {viewOnly ? (
                    <h2 className="bfr-entity-name bfr-entity-name--readonly">{sec.title}</h2>
                  ) : (
                    <input
                      type="text"
                      className="bfr-entity-input tbr-section-title-input"
                      value={sec.title}
                      onChange={(e) => patchSection(si, { title: e.target.value })}
                      placeholder="Section title"
                    />
                  )}
                  {sec.tag || !viewOnly ? (
                    <div className="tbr-section-tag-wrap">
                      {viewOnly ? (
                        sec.tag ? <span className="tbr-section-tag">{sec.tag}</span> : null
                      ) : (
                        <input
                          type="text"
                          className="tbr-section-tag-input"
                          value={sec.tag}
                          onChange={(e) => patchSection(si, { tag: e.target.value })}
                          placeholder="Tag (optional)"
                          aria-label="Section tag"
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="bfr-subsection-title-row">
                  {viewOnly ? (
                    <div className="bfr-subsection-title">{sec.tBondsLabel}</div>
                  ) : (
                    <input
                      type="text"
                      className="bfr-subsection-title-input"
                      value={sec.tBondsLabel}
                      onChange={(e) => patchSection(si, { tBondsLabel: e.target.value })}
                      aria-label="T/Bonds table title"
                    />
                  )}
                </div>
                <DataTable
                  columns={TBOND_COLS}
                  rows={sec.tBondsRows}
                  setRows={(u) => setTBondRows(si, u)}
                  sumIndexes={TBOND_SUM_COL_INDEXES}
                  viewOnly={viewOnly}
                  numColIndexes={TBOND_SUM_COL_INDEXES}
                  dateColIndexes={[3]}
                />

                <div className="bfr-subsection-title-row">
                  {viewOnly ? (
                    <div className="bfr-subsection-title">{sec.otherInvestmentsLabel}</div>
                  ) : (
                    <input
                      type="text"
                      className="bfr-subsection-title-input"
                      value={sec.otherInvestmentsLabel}
                      onChange={(e) => patchSection(si, { otherInvestmentsLabel: e.target.value })}
                      aria-label="Other investments table title"
                    />
                  )}
                </div>
                <DataTable
                  columns={OTHER_INV_COLS}
                  rows={sec.otherInvestmentsRows}
                  setRows={(u) => setOtherInvRows(si, u)}
                  sumIndexes={[OTHER_INV_SUM_COL_INDEX]}
                  viewOnly={viewOnly}
                  numColIndexes={[OTHER_INV_SUM_COL_INDEX]}
                  dateColIndexes={[0]}
                />

                <div className="tbr-equity-block">
                  {viewOnly ? (
                    <p className="tbr-equity-label">{sec.equityPortfolioLabel}</p>
                  ) : (
                    <input
                      type="text"
                      className="tbr-equity-label-input"
                      value={sec.equityPortfolioLabel}
                      onChange={(e) => patchSection(si, { equityPortfolioLabel: e.target.value })}
                    />
                  )}
                  {viewOnly ? (
                    sec.equityPortfolioNote?.trim() ? (
                      <p className="tbr-equity-note">{sec.equityPortfolioNote}</p>
                    ) : null
                  ) : (
                    <textarea
                      className="bfr-internal-notes tbr-equity-note-input"
                      rows={2}
                      value={sec.equityPortfolioNote}
                      onChange={(e) => patchSection(si, { equityPortfolioNote: e.target.value })}
                      placeholder="Optional equity portfolio notes…"
                    />
                  )}
                </div>

                {!viewOnly ? (
                  <div className="bfr-section-structure-actions">
                    <button
                      type="button"
                      className="bfr-remove-structure"
                      onClick={() => removeSection(si)}
                      disabled={dataSections.length <= 1}
                    >
                      Remove this section
                    </button>
                  </div>
                ) : null}
              </section>
            ))}

            {!viewOnly ? (
              <div className="bfr-add-section-wrap">
                <button type="button" className="bfr-add-section" onClick={addSection}>
                  + Add section
                </button>
              </div>
            ) : null}

            <p className="bfr-footnote">
              {viewOnly ? (
                <>
                  Saved read-only view. Use <strong>Edit</strong> (beside this panel) to change data.
                </>
              ) : (
                <>
                  Edit section titles, T/Bonds and Other Investments rows. Use <strong>Save</strong> beside this panel for
                  formatted tables. Total rows sum Face Value, Cost, and Current Market value (T/Bonds) and Balance
                  (Other Investments).
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

export default TBondsReport;
