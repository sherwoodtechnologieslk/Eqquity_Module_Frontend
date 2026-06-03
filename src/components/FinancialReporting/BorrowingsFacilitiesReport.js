import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BorrowingsFacilitiesReport.css';

const MIN_EXTERNAL_COLS = 2;
const MIN_INTERNAL_COLS = 2;

const fmt = (n) => {
  if (n === '' || n === null || n === undefined) return '-';
  const v = Number(n);
  if (Number.isNaN(v)) return '-';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseMoney = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const normalizeExternalCells = (cells) =>
  cells.map((c) => {
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
    if (c === '-' || c === undefined || c === null) return '';
    return String(c);
  });

const externalColDefFromLabel = (label) => {
  const l = String(label).trim();
  const sum = /^(limit|used|remaining)$/i.test(l);
  return { id: newId(), label: l, sum };
};

const internalColDefsFromLabels = (labels) => {
  let amountAssigned = false;
  return labels.map((label) => {
    const l = String(label).trim();
    let amount = /loan|amount|principal/i.test(l) && !amountAssigned;
    if (amount) amountAssigned = true;
    return { id: newId(), label: l, amount };
  });
};

const emptyExternalRow = (colCount) => ({
  id: newId(),
  cells: Array.from({ length: colCount }, () => '')
});

const emptyInternalRow = (colCount) => ({
  id: newId(),
  cells: Array.from({ length: colCount }, () => '')
});

const DEFAULT_EXTERNAL_COL_LABELS = ['Bank', 'Facility', 'Limit', 'Used', 'Remaining', 'Rates'];
const DEFAULT_INTERNAL_COL_LABELS = ['From', 'To', 'Loan amount', 'Rates'];

const defaultExternalTableState = () => {
  const columns = DEFAULT_EXTERNAL_COL_LABELS.map((l) => externalColDefFromLabel(l));
  return {
    columns,
    rows: [emptyExternalRow(columns.length)]
  };
};

const defaultInternalState = () => {
  let columns = internalColDefsFromLabels(DEFAULT_INTERNAL_COL_LABELS);
  if (!columns.some((c) => c.amount) && columns.length) {
    const fallback = Math.max(0, columns.length - 2);
    columns = columns.map((c, i) => ({ ...c, amount: i === fallback }));
  }
  return {
    columns,
    rows: [],
    footerExtra: ''
  };
};

const newExternalBlock = (title = 'External borrowings - new table') => ({
  blockId: newId(),
  title,
  ...defaultExternalTableState()
});

const newEmptySection = () => {
  const ext = defaultExternalTableState();
  return {
    entity: 'New company / entity',
    sectionId: newId(),
    externalLabel: 'External borrowings',
    internalLabel: 'Internal borrowings',
    extraExternalTables: [],
    external: ext,
    internal: defaultInternalState()
  };
};

const newExtraExternalTable = (indexOneBased = 2) => ({
  tableId: newId(),
  title: `External borrowings (${indexOneBased})`,
  ...defaultExternalTableState()
});

const hasNumericInColumn = (rows, colIndex) =>
  rows.some(({ cells }) => parseMoney(cells[colIndex]) !== null);

const sumExternalColumn = (rows, colIndex) =>
  rows.reduce((sum, { cells }) => {
    const n = parseMoney(cells[colIndex]);
    return sum + (n !== null ? n : 0);
  }, 0);

const buildExternalTotals = (rows, columns, label = 'Total') =>
  columns.map((col, i) => {
    if (i === 0) return label;
    if (col.sum) {
      const s = sumExternalColumn(rows, i);
      return hasNumericInColumn(rows, i) ? s : '-';
    }
    return '';
  });

const amountColumnIndex = (columns) => {
  const i = columns.findIndex((c) => c.amount);
  return i >= 0 ? i : Math.max(0, columns.length - 2);
};

const sumInternalAmounts = (rows, columns) => {
  const ai = amountColumnIndex(columns);
  return rows.reduce((s, { cells }) => {
    const n = parseMoney(cells[ai]);
    return s + (n !== null ? n : 0);
  }, 0);
};

const ExternalEditableTable = ({ columns, setColumns, rows, setRows, totalLabel = 'Total' }) => {
  const totals = useMemo(() => buildExternalTotals(rows, columns, totalLabel), [rows, columns, totalLabel]);

  const updateCell = (rowIndex, cellIndex, raw) => {
    setRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, cells: r.cells.map((c, ci) => (ci === cellIndex ? raw : c)) } : r
      )
    );
  };

  const updateColumnLabel = (colIndex, label) => {
    setColumns((prev) =>
      prev.map((c, i) => {
        if (i !== colIndex) return c;
        const next = { ...c, label };
        if (/^(limit|used|remaining)$/i.test(String(label).trim())) next.sum = true;
        return next;
      })
    );
  };

  const toggleColumnSum = (colIndex) => {
    setColumns((prev) => prev.map((c, i) => (i === colIndex ? { ...c, sum: !c.sum } : c)));
  };

  const removeColumn = (colIndex) => {
    if (columns.length <= MIN_EXTERNAL_COLS) return;
    setColumns((prev) => prev.filter((_, i) => i !== colIndex));
    setRows((prev) => prev.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== colIndex) })));
  };

  const addColumn = () => {
    setColumns((prev) => [...prev, { id: newId(), label: 'New column', sum: false }]);
    setRows((prev) => prev.map((r) => ({ ...r, cells: [...r.cells, ''] })));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyExternalRow(columns.length)]);
  };

  const removeRow = (rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  return (
    <div className="bfr-table-block">
      <div className="bfr-table-wrap">
        <table className="bfr-table bfr-table--editable">
          <thead>
            <tr>
              {columns.map((col, colIndex) => (
                <th key={col.id} className="bfr-th-editable">
                  <div className="bfr-th-inner">
                    <input
                      type="text"
                      className="bfr-th-input"
                      value={col.label}
                      onChange={(e) => updateColumnLabel(colIndex, e.target.value)}
                      aria-label={`Column ${colIndex + 1} name`}
                    />
                    <div className="bfr-th-tools">
                      <label className="bfr-sum-toggle" title="Include in total row (Σ)">
                        <input type="checkbox" checked={!!col.sum} onChange={() => toggleColumnSum(colIndex)} />
                        <span>Σ</span>
                      </label>
                      <button
                        type="button"
                        className="bfr-col-remove"
                        disabled={columns.length <= MIN_EXTERNAL_COLS}
                        onClick={() => removeColumn(colIndex)}
                        title="Remove column"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="bfr-col-actions" aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="bfr-empty-hint">
                  No rows yet - use &quot;+ Add row&quot; below.
                </td>
              </tr>
            ) : null}
            {rows.map((r, rowIndex) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => (
                  <td key={j} className={columns[j]?.sum ? 'bfr-num bfr-cell-input' : 'bfr-cell-input'}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, j, e.target.value)}
                      aria-label={`${columns[j]?.label || 'Column'} row ${rowIndex + 1}`}
                    />
                  </td>
                ))}
                <td className="bfr-col-actions">
                  <button type="button" className="bfr-row-remove" onClick={() => removeRow(rowIndex)} title="Remove row">
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bfr-total-row">
              {totals.map((cell, j) => (
                <td key={columns[j]?.id || j} className={columns[j]?.sum ? 'bfr-num' : ''}>
                  {typeof cell === 'number' ? fmt(cell) : cell === '-' ? '-' : cell}
                </td>
              ))}
              <td className="bfr-col-actions" />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bfr-table-actions">
        <button type="button" className="bfr-add-row" onClick={addRow}>
          + Add row
        </button>
        <button type="button" className="bfr-add-col" onClick={addColumn}>
          + Add column
        </button>
      </div>
    </div>
  );
};

const displayCell = (cell) => {
  if (cell === '' || cell === null || cell === undefined) return '-';
  const n = parseMoney(cell);
  if (n !== null) return fmt(n);
  return String(cell);
};

const ExternalReadOnlyTable = ({ columns, rows, totalLabel = 'Total' }) => {
  const totals = useMemo(() => buildExternalTotals(rows, columns, totalLabel), [rows, columns, totalLabel]);
  return (
    <div className="bfr-table-block">
      <div className="bfr-table-wrap">
        <table className="bfr-table bfr-table--readonly">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="bfr-empty-hint">
                  No rows.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => (
                  <td key={j} className={columns[j]?.sum ? 'bfr-num' : ''}>
                    {displayCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bfr-total-row">
              {totals.map((cell, j) => (
                <td key={columns[j]?.id || j} className={columns[j]?.sum ? 'bfr-num' : ''}>
                  {typeof cell === 'number' ? fmt(cell) : cell === '-' ? '-' : cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InternalReadOnlyTable = ({ columns, rows, footerExtra, amountSum }) => {
  const ai = amountColumnIndex(columns);
  return (
    <div className="bfr-table-block">
      <div className="bfr-table-wrap">
        <table className="bfr-table bfr-table--readonly">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="bfr-empty-hint">
                  No rows.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => (
                  <td key={j} className={j === ai ? 'bfr-num' : ''}>
                    {displayCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bfr-internal-summary bfr-internal-summary--readonly">
        <div className="bfr-internal-summary-line">
          <strong>Total internal borrowings (Amt column):</strong> {fmt(amountSum)}
        </div>
        {footerExtra?.trim() ? (
          <div className="bfr-internal-notes-readonly-wrap">
            <span className="bfr-internal-notes-label">Notes</span>
            <div className="bfr-internal-notes-readonly">{footerExtra}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const InternalEditableTable = ({ columns, setColumns, rows, setRows, footerExtra, setFooterExtra, amountSum }) => {
  const ai = amountColumnIndex(columns);

  const updateCell = (rowIndex, cellIndex, raw) => {
    setRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, cells: r.cells.map((c, ci) => (ci === cellIndex ? raw : c)) } : r
      )
    );
  };

  const updateColumnLabel = (colIndex, label) => {
    setColumns((prev) => prev.map((c, i) => (i === colIndex ? { ...c, label } : c)));
  };

  const setAmountColumn = (colIndex) => {
    setColumns((prev) => prev.map((c, i) => ({ ...c, amount: i === colIndex })));
  };

  const removeColumn = (colIndex) => {
    if (columns.length <= MIN_INTERNAL_COLS) return;
    const wasAmount = columns[colIndex]?.amount;
    setColumns((prev) => {
      const next = prev.filter((_, i) => i !== colIndex);
      if (wasAmount && !next.some((c) => c.amount) && next.length) {
        const idx = Math.min(colIndex, next.length - 1);
        next[idx] = { ...next[idx], amount: true };
      }
      return next;
    });
    setRows((prev) => prev.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== colIndex) })));
  };

  const addColumn = () => {
    setColumns((prev) => {
      const next = [...prev, { id: newId(), label: 'New column', amount: false }];
      if (!next.some((c) => c.amount) && next.length) {
        next[next.length - 1] = { ...next[next.length - 1], amount: true };
      }
      return next;
    });
    setRows((prev) => prev.map((r) => ({ ...r, cells: [...r.cells, ''] })));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyInternalRow(columns.length)]);
  };

  const removeRow = (rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const footerFieldId = `bfr-internal-notes-${columns.map((c) => c.id).join('-')}`;
  const radioGroupName = `bfr-amt-${columns.map((c) => c.id).join('-')}`;

  return (
    <div className="bfr-table-block">
      <div className="bfr-table-wrap">
        <table className="bfr-table bfr-table--editable">
          <thead>
            <tr>
              {columns.map((col, colIndex) => (
                <th key={col.id} className="bfr-th-editable">
                  <div className="bfr-th-inner">
                    <input
                      type="text"
                      className="bfr-th-input"
                      value={col.label}
                      onChange={(e) => updateColumnLabel(colIndex, e.target.value)}
                      aria-label={`Column ${colIndex + 1} name`}
                    />
                    <div className="bfr-th-tools">
                      <label className="bfr-amt-toggle" title="Use this column for amount total">
                        <input
                          type="radio"
                          name={radioGroupName}
                          checked={!!col.amount}
                          onChange={() => setAmountColumn(colIndex)}
                        />
                        <span>Amt</span>
                      </label>
                      <button
                        type="button"
                        className="bfr-col-remove"
                        disabled={columns.length <= MIN_INTERNAL_COLS}
                        onClick={() => removeColumn(colIndex)}
                        title="Remove column"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="bfr-col-actions" aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="bfr-empty-hint">
                  No rows yet - use &quot;+ Add row&quot; below.
                </td>
              </tr>
            ) : null}
            {rows.map((r, rowIndex) => (
              <tr key={r.id}>
                {r.cells.map((cell, j) => (
                  <td key={j} className={j === ai ? 'bfr-num bfr-cell-input' : 'bfr-cell-input'}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, j, e.target.value)}
                      aria-label={`${columns[j]?.label || 'Column'} row ${rowIndex + 1}`}
                    />
                  </td>
                ))}
                <td className="bfr-col-actions">
                  <button type="button" className="bfr-row-remove" onClick={() => removeRow(rowIndex)} title="Remove row">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bfr-table-actions">
        <button type="button" className="bfr-add-row" onClick={addRow}>
          + Add row
        </button>
        <button type="button" className="bfr-add-col" onClick={addColumn}>
          + Add column
        </button>
      </div>
      <div className="bfr-internal-summary">
        <div className="bfr-internal-summary-line">
          <strong>Total internal borrowings (Amt column):</strong> {fmt(amountSum)}
        </div>
        <label className="bfr-internal-notes-label" htmlFor={footerFieldId}>
          Notes (eliminations, net group, section totals…)
        </label>
        <textarea
          id={footerFieldId}
          className="bfr-internal-notes"
          rows={3}
          value={footerExtra}
          onChange={(e) => setFooterExtra(e.target.value)}
          placeholder="Optional - e.g. CCH group elimination, net borrowing…"
        />
      </div>
    </div>
  );
};

const INITIAL_SECTIONS = [
  {
    entity: 'Ambeon Capital PLC',
    external: {
      columns: ['Bank', 'Facility', 'Limit', 'Used', 'Remaining', 'Rates'],
      rows: [
        { cells: ['Seylan', 'MML', 1500000000, -486120779, 1013879221, '10.12% - 10.87%'] },
        { cells: ['Seylan', 'OD', '-', '-', '-', '11.17%'] },
        { cells: ['PABC', 'STL / OD', 625000000, -300000000, 325000000, '10.24%'] },
        { cells: ['DFCC', 'STL', 1500000000, -590000000, 910000000, '10.67% - 11.82%'] },
        { cells: ['Commercial Bank', 'Term loan', 1500000000, -1437600000, '-', '10.25%'] },
        { cells: ['Commercial Bank', 'STL', 1500000000, -700000000, 800000000, '9.20%'] }
      ]
    },
    internal: {
      columns: ['To', 'Loan amount', 'Rates'],
      rows: [
        ['Ambeon Holdings PLC', -450000000, 'Fixed - 11.00%'],
        ['Lexinton Holdings (Pvt) Ltd', -320000000, 'AWPLR + 0.50% - 8.95%'],
        ['Taprobane Wealth Plus', -275000000, 'Fixed - 10.50%'],
        ['MIT', -823100000, 'AWPLR + 1.25%']
      ],
      footerExtra: 'Section total (external + internal): (5,381,820,779)'
    }
  },
  {
    entity: 'CCH',
    external: {
      columns: ['Bank', 'Facility', 'Limit', 'Used', 'Remaining', 'Rates'],
      rows: [
        { cells: ['HNB', 'STL', 400000000, '-', '-', '10.15%'] },
        { cells: ['DFCC', 'Rev Repo', 368000000, '-', '-', 'AWPLR + 0.75%'] },
        { cells: ['Seylan', 'Rev Repo', 368000000, '-', '-', 'AWPLR + 0.80%'] },
        { cells: ['DFCC', 'Margin facility', 500000000, '-', '-', 'PLR + 1.50%'] }
      ]
    },
    internal: {
      columns: ['From', 'To', 'Loan amount', 'Rates'],
      rows: [
        ['Colombo City Holdings PLC', 'Lexinton Holdings (Pvt) Ltd', -125000000, 'Intercompany'],
        ['Lexinton Holdings (Pvt) Ltd', 'Ambeon Capital PLC', -88000000, 'Intercompany'],
        ['Ambeon Capital PLC', 'Colombo City Holdings PLC', -95000000, 'Intercompany']
      ],
      footerExtra: 'CCH group elimination: 63,190,862\nNet borrowing CCH group: (8,693,919)'
    }
  },
  {
    entity: 'Ambeon Holdings PLC',
    blocks: [
      {
        title: 'External borrowings - term / STL / OD',
        columns: ['Bank', 'Facility', 'Limit', 'Used', 'Remaining', 'Rates'],
        rows: [
          { cells: ['Commercial Bank', 'STL', 800000000, -520000000, 280000000, '10.10%'] },
          { cells: ['Commercial Bank', 'OD', 400000000, -210000000, 190000000, '10.85%'] },
          { cells: ['NTB', 'STL', 500000000, -380000000, 120000000, '10.45%'] },
          { cells: ['Seylan', 'STL', 600000000, -445000000, 155000000, '10.30%'] },
          { cells: ['DFCC', 'OD', 350000000, -195000000, 155000000, '11.00%'] },
          { cells: ['Sampath', 'STL', 1075000000, -980578634, 94421366, '9.95% - 10.50%'] }
        ]
      },
      {
        title: 'External borrowings - rev repo / margin',
        columns: ['Bank', 'Facility', 'Limit', 'Used', 'Remaining', 'Rates'],
        rows: [
          { cells: ['Seylan', 'Rev Repo', 2000000000, -125000000, 1875000000, 'AWPLR + 0.50%'] },
          { cells: ['DFCC', 'Rev Repo', 1850000000, -198208781, 1651791219, 'AWPLR + 0.60%'] },
          { cells: ['Sampath', 'Margin facility', 1500000000, -280000000, 1220000000, 'PLR + 2.00%'] }
        ]
      }
    ],
    internal: {
      columns: ['From', 'To', 'Loan amount', 'Rates'],
      rows: [],
      footerExtra: ''
    }
  }
];

function cloneSectionsWithIds() {
  return INITIAL_SECTIONS.map((sec) => {
    const out = {
      ...sec,
      entity: sec.entity,
      sectionId: newId(),
      externalLabel: sec.externalLabel ?? 'External borrowings',
      internalLabel: sec.internalLabel ?? 'Internal borrowings'
    };
    if (sec.external) {
      out.external = {
        columns: sec.external.columns.map((l) => externalColDefFromLabel(l)),
        rows: sec.external.rows.map((r) => ({
          id: newId(),
          cells: normalizeExternalCells(r.cells)
        }))
      };
    }
    if (sec.external && !sec.blocks) {
      out.extraExternalTables = (sec.extraExternalTables || []).map((et) => ({
        tableId: newId(),
        title: et.title || 'External borrowings',
        columns: (et.columns && et.columns.length ? et.columns : DEFAULT_EXTERNAL_COL_LABELS).map((c) =>
          typeof c === 'string' ? externalColDefFromLabel(c) : { id: newId(), label: c.label || '', sum: !!c.sum }
        ),
        rows: (et.rows || []).map((r) => ({
          id: newId(),
          cells: normalizeExternalCells(r.cells || [])
        }))
      }));
    }
    if (sec.internal) {
      let cols = internalColDefsFromLabels(sec.internal.columns);
      if (!cols.some((c) => c.amount) && cols.length) {
        const fallback = Math.max(0, cols.length - 2);
        cols = cols.map((c, i) => ({ ...c, amount: i === fallback }));
      }
      out.internal = {
        columns: cols,
        rows: sec.internal.rows.map((cells) => ({
          id: newId(),
          cells: cells.map((c) => (typeof c === 'number' && Number.isFinite(c) ? String(c) : c === '-' ? '' : String(c)))
        })),
        footerExtra: sec.internal.footerExtra || ''
      };
    }
    if (sec.blocks) {
      out.blocks = sec.blocks.map((blk) => ({
        blockId: newId(),
        ...blk,
        columns: blk.columns.map((l) => externalColDefFromLabel(l)),
        rows: blk.rows.map((r) => ({
          id: newId(),
          cells: normalizeExternalCells(r.cells)
        }))
      }));
    }
    return out;
  });
}

const snapshotSections = (src) => JSON.parse(JSON.stringify(src));

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

const BorrowingsFacilitiesReport = ({ open, onClose, asOfDate = '2026-03-23', embedded = false }) => {
  const [sections, setSections] = useState([]);
  const [savedSections, setSavedSections] = useState(null);
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
      setSections(cloneSectionsWithIds());
      setSavedSections(null);
      setSavedHeaderDateYmd(null);
      setViewOnly(false);
      setHeaderDateYmd(toInputYmd(asOfDate));
    }
  }, [open, embedded, asOfDate]);

  const handleSave = () => {
    setSavedSections(snapshotSections(sections));
    setSavedHeaderDateYmd(headerDateYmd);
    setViewOnly(true);
  };

  const handleEditAgain = () => {
    setViewOnly(false);
  };

  const setExternalRows = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.external) return sec;
        const nextRows = typeof updater === 'function' ? updater(sec.external.rows) : updater;
        return { ...sec, external: { ...sec.external, rows: nextRows } };
      })
    );
  };

  const setExternalColumns = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.external) return sec;
        const next = typeof updater === 'function' ? updater(sec.external.columns) : updater;
        return { ...sec, external: { ...sec.external, columns: next } };
      })
    );
  };

  const setBlockRows = (sectionIndex, blockIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.blocks) return sec;
        const blocks = sec.blocks.map((blk, bi) => {
          if (bi !== blockIndex) return blk;
          const nextRows = typeof updater === 'function' ? updater(blk.rows) : updater;
          return { ...blk, rows: nextRows };
        });
        return { ...sec, blocks };
      })
    );
  };

  const setBlockColumns = (sectionIndex, blockIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.blocks) return sec;
        const blocks = sec.blocks.map((blk, bi) => {
          if (bi !== blockIndex) return blk;
          const nextCols = typeof updater === 'function' ? updater(blk.columns) : updater;
          return { ...blk, columns: nextCols };
        });
        return { ...sec, blocks };
      })
    );
  };

  const setInternalRows = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.internal) return sec;
        const nextRows = typeof updater === 'function' ? updater(sec.internal.rows) : updater;
        return { ...sec, internal: { ...sec.internal, rows: nextRows } };
      })
    );
  };

  const setInternalColumns = (sectionIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.internal) return sec;
        const nextCols = typeof updater === 'function' ? updater(sec.internal.columns) : updater;
        return { ...sec, internal: { ...sec.internal, columns: nextCols } };
      })
    );
  };

  const setInternalFooterExtra = (sectionIndex, value) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === sectionIndex && sec.internal ? { ...sec, internal: { ...sec.internal, footerExtra: value } } : sec
      )
    );
  };

  const setSectionEntity = (sectionIndex, entity) => {
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, entity } : sec)));
  };

  const setSectionExternalLabel = (sectionIndex, externalLabel) => {
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, externalLabel } : sec)));
  };

  const setSectionInternalLabel = (sectionIndex, internalLabel) => {
    setSections((prev) => prev.map((sec, i) => (i === sectionIndex ? { ...sec, internalLabel } : sec)));
  };

  const setBlockTitle = (sectionIndex, blockIndex, title) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.blocks) return sec;
        const blocks = sec.blocks.map((blk, bi) => (bi === blockIndex ? { ...blk, title } : blk));
        return { ...sec, blocks };
      })
    );
  };

  const addSection = () => {
    setSections((prev) => [...prev, newEmptySection()]);
  };

  const removeSection = (sectionIndex) => {
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== sectionIndex)));
  };

  const addBlock = (sectionIndex) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.blocks) return sec;
        return { ...sec, blocks: [...sec.blocks, newExternalBlock()] };
      })
    );
  };

  const removeBlock = (sectionIndex, blockIndex) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.blocks || sec.blocks.length <= 1) return sec;
        return { ...sec, blocks: sec.blocks.filter((_, bi) => bi !== blockIndex) };
      })
    );
  };

  const addExtraExternalTable = (sectionIndex) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || sec.blocks || !sec.external) return sec;
        const extra = sec.extraExternalTables || [];
        const next = newExtraExternalTable(extra.length + 2);
        return { ...sec, extraExternalTables: [...extra, next] };
      })
    );
  };

  const removeExtraExternalTable = (sectionIndex, tableIndex) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.extraExternalTables?.length) return sec;
        return { ...sec, extraExternalTables: sec.extraExternalTables.filter((_, ti) => ti !== tableIndex) };
      })
    );
  };

  const setExtraExternalTitle = (sectionIndex, tableIndex, title) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.extraExternalTables) return sec;
        const extraExternalTables = sec.extraExternalTables.map((et, ti) =>
          ti === tableIndex ? { ...et, title } : et
        );
        return { ...sec, extraExternalTables };
      })
    );
  };

  const setExtraExternalRows = (sectionIndex, tableIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.extraExternalTables) return sec;
        const extraExternalTables = sec.extraExternalTables.map((et, ti) => {
          if (ti !== tableIndex) return et;
          const nextRows = typeof updater === 'function' ? updater(et.rows) : updater;
          return { ...et, rows: nextRows };
        });
        return { ...sec, extraExternalTables };
      })
    );
  };

  const setExtraExternalColumns = (sectionIndex, tableIndex, updater) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIndex || !sec.extraExternalTables) return sec;
        const extraExternalTables = sec.extraExternalTables.map((et, ti) => {
          if (ti !== tableIndex) return et;
          const nextCols = typeof updater === 'function' ? updater(et.columns) : updater;
          return { ...et, columns: nextCols };
        });
        return { ...sec, extraExternalTables };
      })
    );
  };

  const grandExternalRow = (sec) => {
    if (!sec.blocks || sec.blocks.length === 0) return null;
    const masterCols = sec.blocks[0].columns;

    const cells = masterCols.map((col, i) => {
      if (i === 0) return 'Grand total (external)';
      if (col.sum) {
        const s = sec.blocks.reduce((acc, b) => acc + sumExternalColumn(b.rows, i), 0);
        const has = sec.blocks.some((b) => i < b.columns.length && hasNumericInColumn(b.rows, i));
        return has ? s : '-';
      }
      return '';
    });

    return (
      <div className="bfr-table-wrap bfr-table-wrap--grand">
        <table className="bfr-table">
          <tbody>
            <tr className="bfr-grand-row">
              {cells.map((cell, j) => (
                <td key={masterCols[j]?.id || j} className={masterCols[j]?.sum ? 'bfr-num' : ''}>
                  {typeof cell === 'number' ? fmt(cell) : cell === '-' ? '-' : cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (!open && !embedded) return null;

  const headerDisplayYmd = viewOnly && savedHeaderDateYmd != null ? savedHeaderDateYmd : headerDateYmd;
  const headerDisplayText = formatHeaderDisplayDate(headerDisplayYmd);

  const dataSections = viewOnly && savedSections ? savedSections : sections;

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
          className="bfr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bfr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
        {!embedded ? (
          <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close borrowings report">
            ×
          </button>
        ) : null}
        <div className="bfr-doc">
          <div className="bfr-title-band">
            <h1 id="bfr-dialog-title" className="bfr-title-band-heading">
              <span className="bfr-title-band-label">Facilities available as at</span>
              {viewOnly ? (
                <time className="bfr-title-band-date-readonly" dateTime={headerDisplayYmd}>
                  {headerDisplayText}
                </time>
              ) : (
                <label className="bfr-header-date-field">
                  <span className="bfr-sr-only">As of date</span>
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

          {dataSections.map((sec, si) => {
            const internalSum = sec.internal ? sumInternalAmounts(sec.internal.rows, sec.internal.columns) : 0;
            const entityInputId = `bfr-entity-${sec.sectionId}`;
            return (
              <section key={sec.sectionId} className="bfr-section">
                {viewOnly ? (
                  <h2 className="bfr-entity-name bfr-entity-name--readonly">{sec.entity}</h2>
                ) : (
                  <div className="bfr-entity-row">
                    <label className="bfr-entity-field-label" htmlFor={entityInputId}>
                      Company / entity
                    </label>
                    <input
                      id={entityInputId}
                      type="text"
                      className="bfr-entity-input"
                      value={sec.entity}
                      onChange={(e) => setSectionEntity(si, e.target.value)}
                      placeholder="Company name"
                      autoComplete="organization"
                    />
                  </div>
                )}

                {sec.external ? (
                  <>
                    {viewOnly ? (
                      <div className="bfr-subsection-title">{sec.externalLabel}</div>
                    ) : (
                      <div className="bfr-subsection-title-row">
                        <label className="bfr-sr-only" htmlFor={`bfr-ext-lbl-${sec.sectionId}`}>
                          External table title
                        </label>
                        <input
                          id={`bfr-ext-lbl-${sec.sectionId}`}
                          type="text"
                          className="bfr-subsection-title-input"
                          value={sec.externalLabel}
                          onChange={(e) => setSectionExternalLabel(si, e.target.value)}
                        />
                      </div>
                    )}
                    {viewOnly ? (
                      <ExternalReadOnlyTable
                        columns={sec.external.columns}
                        rows={sec.external.rows}
                        totalLabel="Total"
                      />
                    ) : (
                      <ExternalEditableTable
                        columns={sec.external.columns}
                        setColumns={(u) => setExternalColumns(si, u)}
                        rows={sec.external.rows}
                        setRows={(u) => setExternalRows(si, u)}
                        totalLabel="Total"
                      />
                    )}
                  </>
                ) : null}

                {(sec.extraExternalTables || []).map((et, ti) => (
                  <React.Fragment key={et.tableId}>
                    {viewOnly ? (
                      <div className="bfr-subsection-title">{et.title}</div>
                    ) : (
                      <div className="bfr-subsection-title-row bfr-subsection-title-row--with-actions">
                        <label className="bfr-sr-only" htmlFor={`bfr-ext-extra-${et.tableId}`}>
                          External table title
                        </label>
                        <input
                          id={`bfr-ext-extra-${et.tableId}`}
                          type="text"
                          className="bfr-subsection-title-input"
                          value={et.title}
                          onChange={(e) => setExtraExternalTitle(si, ti, e.target.value)}
                        />
                        <button
                          type="button"
                          className="bfr-remove-structure"
                          onClick={() => removeExtraExternalTable(si, ti)}
                        >
                          Remove table
                        </button>
                      </div>
                    )}
                    {viewOnly ? (
                      <ExternalReadOnlyTable columns={et.columns} rows={et.rows} totalLabel="Total" />
                    ) : (
                      <ExternalEditableTable
                        columns={et.columns}
                        setColumns={(u) => setExtraExternalColumns(si, ti, u)}
                        rows={et.rows}
                        setRows={(u) => setExtraExternalRows(si, ti, u)}
                        totalLabel="Total"
                      />
                    )}
                  </React.Fragment>
                ))}

                {sec.blocks?.map((blk, bi) => (
                  <React.Fragment key={blk.blockId}>
                    {viewOnly ? (
                      <div className="bfr-subsection-title">{blk.title}</div>
                    ) : (
                      <div className="bfr-subsection-title-row bfr-subsection-title-row--with-actions">
                        <label className="bfr-sr-only" htmlFor={`bfr-blk-${blk.blockId}`}>
                          Table title
                        </label>
                        <input
                          id={`bfr-blk-${blk.blockId}`}
                          type="text"
                          className="bfr-subsection-title-input"
                          value={blk.title}
                          onChange={(e) => setBlockTitle(si, bi, e.target.value)}
                        />
                        {sec.blocks.length > 1 ? (
                          <button
                            type="button"
                            className="bfr-remove-structure"
                            onClick={() => removeBlock(si, bi)}
                          >
                            Remove table
                          </button>
                        ) : null}
                      </div>
                    )}
                    {viewOnly ? (
                      <ExternalReadOnlyTable columns={blk.columns} rows={blk.rows} totalLabel="Subtotal" />
                    ) : (
                      <ExternalEditableTable
                        columns={blk.columns}
                        setColumns={(u) => setBlockColumns(si, bi, u)}
                        rows={blk.rows}
                        setRows={(u) => setBlockRows(si, bi, u)}
                        totalLabel="Subtotal"
                      />
                    )}
                  </React.Fragment>
                ))}

                {sec.blocks?.length ? grandExternalRow(sec) : null}

                {!viewOnly && sec.blocks?.length ? (
                  <div className="bfr-structure-add-row">
                    <button type="button" className="bfr-add-structure" onClick={() => addBlock(si)}>
                      + Add external block
                    </button>
                  </div>
                ) : null}

                {sec.internal ? (
                  <>
                    {viewOnly ? (
                      <div className="bfr-subsection-title">{sec.internalLabel}</div>
                    ) : (
                      <div className="bfr-subsection-title-row">
                        <label className="bfr-sr-only" htmlFor={`bfr-int-lbl-${sec.sectionId}`}>
                          Internal table title
                        </label>
                        <input
                          id={`bfr-int-lbl-${sec.sectionId}`}
                          type="text"
                          className="bfr-subsection-title-input"
                          value={sec.internalLabel}
                          onChange={(e) => setSectionInternalLabel(si, e.target.value)}
                        />
                      </div>
                    )}
                    {viewOnly ? (
                      <InternalReadOnlyTable
                        columns={sec.internal.columns}
                        rows={sec.internal.rows}
                        footerExtra={sec.internal.footerExtra}
                        amountSum={internalSum}
                      />
                    ) : (
                      <InternalEditableTable
                        columns={sec.internal.columns}
                        setColumns={(u) => setInternalColumns(si, u)}
                        rows={sec.internal.rows}
                        setRows={(u) => setInternalRows(si, u)}
                        footerExtra={sec.internal.footerExtra}
                        setFooterExtra={(v) => setInternalFooterExtra(si, v)}
                        amountSum={internalSum}
                      />
                    )}
                  </>
                ) : null}

                {!viewOnly ? (
                  <div className="bfr-section-structure-actions">
                    {sec.external && !sec.blocks ? (
                      <button type="button" className="bfr-add-structure" onClick={() => addExtraExternalTable(si)}>
                        + Add external table
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="bfr-remove-structure"
                      onClick={() => removeSection(si)}
                      disabled={dataSections.length <= 1}
                      title={dataSections.length <= 1 ? 'At least one section is required' : undefined}
                    >
                      Remove this section
                    </button>
                  </div>
                ) : null}
              </section>
            );
          })}

          {!viewOnly ? (
            <div className="bfr-add-section-wrap">
              <button type="button" className="bfr-add-section" onClick={addSection}>
                + Add section (company / entity)
              </button>
            </div>
          ) : null}

          <p className="bfr-footnote">
            {viewOnly ? (
              <>
                This is the <strong>saved</strong> read-only view. Choose <strong>Edit</strong> (beside this panel) to
                change data again.
              </>
            ) : (
              <>
                Use <strong>Save</strong> (beside this panel) to lock the layout and see formatted tables. Edit{' '}
                <strong>company / entity</strong>{' '}
                and each <strong>table title</strong> (blue bands) as needed. Edit headers and cells.{' '}
                <strong>+ Add row</strong> / <strong>+ Add column</strong> extend each table. Use{' '}
                <strong>+ Add section</strong>, <strong>+ Add external table</strong>, or <strong>+ Add external block</strong>{' '}
                for more tables. External: tick{' '}
                <strong>Σ</strong> on a column to include it in the total row. Internal: pick one <strong>Amt</strong>{' '}
                column for the amount total. Grand total (multi-block entities) sums Σ-columns across external blocks by
                column position.
              </>
            )}
          </p>
        </div>
        </div>
        <div
          className="bfr-modal-floating-actions"
          role="toolbar"
          aria-label="Report view controls"
          onClick={(e) => e.stopPropagation()}
        >
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

export default BorrowingsFacilitiesReport;
