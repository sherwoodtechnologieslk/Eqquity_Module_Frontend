import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  DEFAULT_SECTORS,
  SUMMARY_COLUMNS,
  GROUPING_OPTIONS,
  cloneEquitySummaryData,
  deriveHolding,
  newId,
  formatNumber,
  formatPercent,
  formatDisplayDate
} from './equityPortfolioSummaryData';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/EquityPortfolioSummaryReport.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const COMPANY_COLORS = {
  AMC: '#1e3a8a',
  AMH: '#0ea5e9',
  CCH: '#f97316'
};

const SECTOR_PALETTE = [
  '#1e3a8a',
  '#0ea5e9',
  '#f97316',
  '#14b8a6',
  '#a855f7',
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#64748b',
  '#db2777'
];

const compactValue = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1.0e9) return `${(v / 1.0e9).toFixed(2)}B`;
  if (abs >= 1.0e6) return `${(v / 1.0e6).toFixed(2)}M`;
  if (abs >= 1.0e3) return `${(v / 1.0e3).toFixed(1)}K`;
  return String(Math.round(v));
};

const moneyTooltip = (ctx) => {
  const raw = Number(ctx.raw) || 0;
  return `LKR ${formatNumber(raw)}`;
};

const compactAxisTick = (value) => compactValue(value);

const toInputYmd = (value) => {
  const s = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10);
};

const defaultVisibleColumns = () => {
  const o = {};
  SUMMARY_COLUMNS.forEach((c) => {
    o[c.key] = c.key !== 'company';
  });
  return o;
};

function buildRows(holdings, { companyFilter, minMV, topN }) {
  let rows = holdings.map(deriveHolding);
  if (companyFilter && companyFilter !== 'all') {
    rows = rows.filter((h) => h.company === companyFilter);
  }
  if (minMV > 0) {
    rows = rows.filter((h) => h.totalMV >= minMV);
  }
  rows.sort((a, b) => b.totalMV - a.totalMV);
  if (topN > 0) {
    rows = rows.slice(0, topN);
  }
  return rows;
}

function groupRows(rows, grouping) {
  if (grouping === 'none') {
    return [{ key: 'all', label: 'All holdings', rows }];
  }
  if (grouping === 'company') {
    const map = new Map();
    rows.forEach((r) => {
      const k = r.company || 'Other';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    });
    return [...map.entries()].map(([key, groupRows_]) => ({
      key,
      label: key,
      rows: groupRows_
    }));
  }
  const map = new Map();
  rows.forEach((r) => {
    const k = r.sector || 'Other';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  });
  return [...map.entries()]
    .map(([key, groupRows_]) => ({
      key,
      label: key,
      rows: groupRows_.sort((a, b) => b.totalMV - a.totalMV)
    }))
    .sort((a, b) => {
      const ta = a.rows.reduce((s, r) => s + r.totalMV, 0);
      const tb = b.rows.reduce((s, r) => s + r.totalMV, 0);
      return tb - ta;
    });
}

function totalsForRows(rows) {
  const cost = rows.reduce((s, r) => s + r.totalCost, 0);
  const mv = rows.reduce((s, r) => s + r.totalMV, 0);
  return { cost, mv, unrealised: mv - cost, count: rows.length };
}

const EquityPortfolioSummaryReport = ({ open, onClose, asOfDate = '2026-03-23', embedded = false }) => {
  const [data, setData] = useState(() => cloneEquitySummaryData());
  const [savedData, setSavedData] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [headerDateYmd, setHeaderDateYmd] = useState(() => toInputYmd(asOfDate));
  const [savedHeaderDateYmd, setSavedHeaderDateYmd] = useState(null);
  const [grouping, setGrouping] = useState('company');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [topN, setTopN] = useState(0);
  const [minMV, setMinMV] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);

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
      setData(cloneEquitySummaryData());
      setSavedData(null);
      setViewOnly(false);
      setSavedHeaderDateYmd(null);
      setHeaderDateYmd(toInputYmd(asOfDate));
      setGrouping('company');
      setCompanyFilter('all');
      setTopN(0);
      setMinMV(0);
      setVisibleColumns(defaultVisibleColumns());
    }
  }, [open, embedded, asOfDate]);

  const activeData = viewOnly && savedData ? savedData : data;
  const displayHeaderYmd = viewOnly && savedHeaderDateYmd != null ? savedHeaderDateYmd : headerDateYmd;
  const readOnly = viewOnly;

  const derivedHoldings = useMemo(
    () => activeData.holdings.map(deriveHolding),
    [activeData.holdings]
  );

  const filteredRows = useMemo(
    () => buildRows(derivedHoldings, { companyFilter, minMV, topN }),
    [derivedHoldings, companyFilter, minMV, topN]
  );

  const portfolioTotalMV = useMemo(
    () => derivedHoldings.reduce((s, h) => s + h.totalMV, 0),
    [derivedHoldings]
  );

  const groups = useMemo(() => groupRows(filteredRows, grouping), [filteredRows, grouping]);

  const grandTotals = useMemo(() => totalsForRows(filteredRows), [filteredRows]);

  const companyAggregates = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const k = r.company || 'Other';
      const cur = map.get(k) || { company: k, cost: 0, mv: 0, unrealised: 0, count: 0 };
      cur.cost += r.totalCost;
      cur.mv += r.totalMV;
      cur.unrealised += r.unrealised;
      cur.count += 1;
      map.set(k, cur);
    });
    return [...map.values()].sort((a, b) => b.mv - a.mv);
  }, [filteredRows]);

  const sectorAggregates = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const k = r.sector || 'Other';
      const cur = map.get(k) || { sector: k, cost: 0, mv: 0, unrealised: 0, count: 0 };
      cur.cost += r.totalCost;
      cur.mv += r.totalMV;
      cur.unrealised += r.unrealised;
      cur.count += 1;
      map.set(k, cur);
    });
    return [...map.values()].sort((a, b) => b.mv - a.mv);
  }, [filteredRows]);

  const topHoldings = useMemo(
    () => [...filteredRows].sort((a, b) => b.totalMV - a.totalMV).slice(0, 10),
    [filteredRows]
  );

  const companyAllocationChart = useMemo(
    () => ({
      labels: companyAggregates.map((c) => c.company),
      datasets: [
        {
          data: companyAggregates.map((c) => c.mv),
          backgroundColor: companyAggregates.map(
            (c, i) => COMPANY_COLORS[c.company] || SECTOR_PALETTE[i % SECTOR_PALETTE.length]
          ),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }),
    [companyAggregates]
  );

  const sectorAllocationChart = useMemo(
    () => ({
      labels: sectorAggregates.map((s) => s.sector),
      datasets: [
        {
          data: sectorAggregates.map((s) => s.mv),
          backgroundColor: sectorAggregates.map((_, i) => SECTOR_PALETTE[i % SECTOR_PALETTE.length]),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }),
    [sectorAggregates]
  );

  const costVsMvChart = useMemo(
    () => ({
      labels: companyAggregates.map((c) => c.company),
      datasets: [
        {
          label: 'Total cost',
          data: companyAggregates.map((c) => c.cost),
          backgroundColor: '#94a3b8'
        },
        {
          label: 'Market value',
          data: companyAggregates.map((c) => c.mv),
          backgroundColor: '#1e3a8a'
        }
      ]
    }),
    [companyAggregates]
  );

  const topHoldingsChart = useMemo(
    () => ({
      labels: topHoldings.map((h) => h.counter || '-'),
      datasets: [
        {
          label: 'Market value',
          data: topHoldings.map((h) => h.totalMV),
          backgroundColor: topHoldings.map(
            (h) => COMPANY_COLORS[h.company] || '#1e3a8a'
          )
        }
      ]
    }),
    [topHoldings]
  );

  const unrealisedBySectorChart = useMemo(
    () => ({
      labels: sectorAggregates.map((s) => s.sector),
      datasets: [
        {
          label: 'Unrealised gain / (loss)',
          data: sectorAggregates.map((s) => s.unrealised),
          backgroundColor: sectorAggregates.map((s) => (s.unrealised >= 0 ? '#15803d' : '#b91c1c'))
        }
      ]
    }),
    [sectorAggregates]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          cornerRadius: 0,
          callbacks: {
            label: (ctx) => {
              const value = Number(ctx.raw) || 0;
              const ds = ctx.dataset.data || [];
              const total = ds.reduce((s, v) => s + (Number(v) || 0), 0);
              const pct = total > 0 ? (value / total) * 100 : 0;
              return ` ${ctx.label}: LKR ${formatNumber(value)} (${pct.toFixed(1)}%)`;
            }
          }
        }
      }
    }),
    []
  );

  const verticalBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 } } },
        tooltip: { cornerRadius: 0, callbacks: { label: moneyTooltip } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          ticks: { callback: compactAxisTick, font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        }
      }
    }),
    []
  );

  const horizontalBarOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { cornerRadius: 0, callbacks: { label: moneyTooltip } }
      },
      scales: {
        x: {
          ticks: { callback: compactAxisTick, font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }),
    []
  );

  const activeColumns = useMemo(
    () => SUMMARY_COLUMNS.filter((c) => c.alwaysOn || visibleColumns[c.key]),
    [visibleColumns]
  );

  const updateHolding = useCallback(
    (id, field, raw) => {
      if (readOnly) return;
      setData((prev) => ({
        ...prev,
        holdings: prev.holdings.map((h) => (h.id === id ? { ...h, [field]: raw } : h))
      }));
    },
    [readOnly]
  );

  const addHolding = (companyCode = 'AMC') => {
    setData((prev) => ({
      ...prev,
      holdings: [
        ...prev.holdings,
        {
          id: newId(),
          company: companyCode,
          counter: '',
          sector: 'Other',
          shares: 0,
          totalCost: 0,
          totalMV: 0
        }
      ]
    }));
  };

  const removeHolding = (id) => {
    setData((prev) => ({
      ...prev,
      holdings: prev.holdings.filter((h) => h.id !== id)
    }));
  };

  const handleSave = () => {
    setSavedData(cloneEquitySummaryData(data));
    setSavedHeaderDateYmd(headerDateYmd);
    setViewOnly(true);
  };

  const handleEditAgain = () => setViewOnly(false);

  const companyName = (code) => activeData.companies.find((c) => c.code === code)?.name || code;

  const renderCell = (row, col, groupMV) => {
    const weightBase = groupMV > 0 ? groupMV : portfolioTotalMV;
    const weight = weightBase > 0 ? (row.totalMV / weightBase) * 100 : 0;

    switch (col.key) {
      case 'counter':
        return readOnly ? (
          <td className="epsr-text">{row.counter || '-'}</td>
        ) : (
          <td className="epsr-cell-input epsr-text">
            <input
              type="text"
              value={row.counter}
              onChange={(e) => updateHolding(row.id, 'counter', e.target.value)}
              aria-label="Counter"
            />
          </td>
        );
      case 'sector':
        return readOnly ? (
          <td className="epsr-text">{row.sector || '-'}</td>
        ) : (
          <td className="epsr-cell-input epsr-text">
            <select value={row.sector} onChange={(e) => updateHolding(row.id, 'sector', e.target.value)}>
              {DEFAULT_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </td>
        );
      case 'company':
        return <td className="epsr-text">{companyName(row.company)}</td>;
      case 'shares':
        return readOnly ? (
          <td>{formatNumber(row.shares)}</td>
        ) : (
          <td className="epsr-cell-input">
            <input
              type="text"
              inputMode="decimal"
              className="epsr-num-input"
              value={row.shares === 0 ? '0' : String(row.shares)}
              onChange={(e) => updateHolding(row.id, 'shares', e.target.value)}
            />
          </td>
        );
      case 'totalCost':
        return readOnly ? (
          <td>{formatNumber(row.totalCost)}</td>
        ) : (
          <td className="epsr-cell-input">
            <input
              type="text"
              inputMode="decimal"
              className="epsr-num-input"
              value={row.totalCost === 0 ? '0' : String(row.totalCost)}
              onChange={(e) => updateHolding(row.id, 'totalCost', e.target.value)}
            />
          </td>
        );
      case 'totalMV':
        return readOnly ? (
          <td>{formatNumber(row.totalMV)}</td>
        ) : (
          <td className="epsr-cell-input">
            <input
              type="text"
              inputMode="decimal"
              className="epsr-num-input"
              value={row.totalMV === 0 ? '0' : String(row.totalMV)}
              onChange={(e) => updateHolding(row.id, 'totalMV', e.target.value)}
            />
          </td>
        );
      case 'unrealised': {
        const cls = row.unrealised >= 0 ? 'epsr-pos' : 'epsr-neg';
        return (
          <td className={cls}>
            {row.unrealised >= 0 ? '+' : ''}
            {formatNumber(row.unrealised)}
          </td>
        );
      }
      case 'weight':
        return <td>{formatPercent(weight)}</td>;
      default:
        return <td>-</td>;
    }
  };

  const renderTable = (rows, groupMV, groupKey) => {
    const t = totalsForRows(rows);
    const groupLabel = grouping === 'company' ? companyName(groupKey) : groupKey;

    return (
      <div className="epsr-group-section" key={groupKey}>
        <h3 className="epsr-group-title">
          <span>{grouping === 'company' ? `${groupKey} - ${groupLabel}` : groupLabel}</span>
          <span className="epsr-group-meta">
            {t.count} holding{t.count === 1 ? '' : 's'} · MV {formatNumber(t.mv)} · Unrealised{' '}
            {t.unrealised >= 0 ? '+' : ''}
            {formatNumber(t.unrealised)}
          </span>
        </h3>
        <div className="bfr-table-wrap">
          <table className={`epsr-table${readOnly ? '' : ' bfr-table--editable'}`}>
            <thead>
              <tr>
                {activeColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {!readOnly ? <th className="epsr-row-actions" aria-label="Actions" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + (readOnly ? 0 : 1)} className="epsr-empty">
                    No holdings match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {activeColumns.map((col) => (
                      <React.Fragment key={col.key}>{renderCell(row, col, groupMV)}</React.Fragment>
                    ))}
                    {!readOnly ? (
                      <td className="epsr-row-actions">
                        <button
                          type="button"
                          className="epsr-row-remove"
                          onClick={() => removeHolding(row.id)}
                          title="Remove row"
                        >
                          ×
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                {activeColumns.map((col, i) => {
                  if (i === 0) return <td>Subtotal</td>;
                  if (col.key === 'totalCost') return <td>{formatNumber(t.cost)}</td>;
                  if (col.key === 'totalMV') return <td>{formatNumber(t.mv)}</td>;
                  if (col.key === 'unrealised') {
                    const cls = t.unrealised >= 0 ? 'epsr-pos' : 'epsr-neg';
                    return (
                      <td className={cls}>
                        {t.unrealised >= 0 ? '+' : ''}
                        {formatNumber(t.unrealised)}
                      </td>
                    );
                  }
                  if (col.key === 'weight') {
                    const pct = portfolioTotalMV > 0 ? (t.mv / portfolioTotalMV) * 100 : 0;
                    return <td>{formatPercent(pct)}</td>;
                  }
                  return <td />;
                })}
                {!readOnly ? <td /> : null}
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && grouping === 'company' ? (
          <button type="button" className="epsr-add-row" onClick={() => addHolding(groupKey)}>
            + Add holding to {groupKey}
          </button>
        ) : null}
        {!readOnly && grouping !== 'company' ? (
          <button type="button" className="epsr-add-row" onClick={() => addHolding(companyFilter === 'all' ? 'AMC' : companyFilter)}>
            + Add holding
          </button>
        ) : null}
      </div>
    );
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
          className="bfr-modal-shell epsr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="epsr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          {!embedded ? (
            <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close equity summary report">
              ×
            </button>
          ) : null}
          <div className="bfr-doc">
            <div className="bfr-title-band">
              <h1 id="epsr-dialog-title" className="bfr-title-band-heading">
                <span className="bfr-title-band-label">Equity portfolio summary -</span>
                {readOnly ? (
                  <time dateTime={displayHeaderYmd}>{formatDisplayDate(displayHeaderYmd)}</time>
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

            {!readOnly ? (
              <div className="epsr-controls">
                <div className="epsr-control">
                  <label htmlFor="epsr-grouping">Group by</label>
                  <select id="epsr-grouping" value={grouping} onChange={(e) => setGrouping(e.target.value)}>
                    {GROUPING_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="epsr-control">
                  <label htmlFor="epsr-company-filter">Company filter</label>
                  <select
                    id="epsr-company-filter"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                  >
                    <option value="all">All companies</option>
                    {activeData.companies.map((c) => (
                      <option key={c.companyId} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="epsr-control">
                  <label htmlFor="epsr-topn">Top N holdings (0 = all)</label>
                  <input
                    id="epsr-topn"
                    type="number"
                    min={0}
                    value={topN}
                    onChange={(e) => setTopN(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="epsr-control">
                  <label htmlFor="epsr-minmv">Hide below market value (LKR)</label>
                  <input
                    id="epsr-minmv"
                    type="number"
                    min={0}
                    value={minMV}
                    onChange={(e) => setMinMV(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="epsr-columns">
                  <span className="epsr-control" style={{ fontWeight: 700, width: '100%' }}>
                    Columns
                  </span>
                  {SUMMARY_COLUMNS.filter((c) => !c.alwaysOn).map((col) => (
                    <label key={col.key} className="epsr-column-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(visibleColumns[col.key])}
                        onChange={(e) =>
                          setVisibleColumns((prev) => ({ ...prev, [col.key]: e.target.checked }))
                        }
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="epsr-summary-cards">
              <div className="epsr-card">
                <div className="epsr-card-label">Holdings shown</div>
                <div className="epsr-card-value">{grandTotals.count}</div>
                <p className="epsr-card-sub">After filters</p>
              </div>
              <div className="epsr-card">
                <div className="epsr-card-label">Total cost</div>
                <div className="epsr-card-value">{formatNumber(grandTotals.cost, { decimals: 0 })}</div>
              </div>
              <div className="epsr-card">
                <div className="epsr-card-label">Total market value</div>
                <div className="epsr-card-value">{formatNumber(grandTotals.mv, { decimals: 0 })}</div>
              </div>
              <div className="epsr-card">
                <div className="epsr-card-label">Unrealised gain / (loss)</div>
                <div
                  className={`epsr-card-value ${grandTotals.unrealised >= 0 ? 'epsr-card-value--positive' : 'epsr-card-value--negative'}`}
                >
                  {grandTotals.unrealised >= 0 ? '+' : ''}
                  {formatNumber(grandTotals.unrealised)}
                </div>
              </div>
            </div>

            {filteredRows.length > 0 ? (
              <div className="epsr-charts">
                <div className="epsr-chart-card epsr-chart-card--half">
                  <div className="epsr-chart-header">
                    <h4>Allocation by company</h4>
                    <span className="epsr-chart-sub">% of market value</span>
                  </div>
                  <div className="epsr-chart-body epsr-chart-body--doughnut">
                    <Doughnut data={companyAllocationChart} options={doughnutOptions} />
                  </div>
                </div>

                <div className="epsr-chart-card epsr-chart-card--half">
                  <div className="epsr-chart-header">
                    <h4>Allocation by sector</h4>
                    <span className="epsr-chart-sub">% of market value</span>
                  </div>
                  <div className="epsr-chart-body epsr-chart-body--doughnut">
                    <Doughnut data={sectorAllocationChart} options={doughnutOptions} />
                  </div>
                </div>

                <div className="epsr-chart-card epsr-chart-card--full">
                  <div className="epsr-chart-header">
                    <h4>Cost vs market value by company</h4>
                    <span className="epsr-chart-sub">LKR</span>
                  </div>
                  <div className="epsr-chart-body">
                    <Bar data={costVsMvChart} options={verticalBarOptions} />
                  </div>
                </div>

                <div className="epsr-chart-card epsr-chart-card--half">
                  <div className="epsr-chart-header">
                    <h4>Top {topHoldings.length} holdings</h4>
                    <span className="epsr-chart-sub">Market value · color = company</span>
                  </div>
                  <div className="epsr-chart-body epsr-chart-body--tall">
                    <Bar data={topHoldingsChart} options={horizontalBarOptions} />
                  </div>
                </div>

                <div className="epsr-chart-card epsr-chart-card--half">
                  <div className="epsr-chart-header">
                    <h4>Unrealised gain / (loss) by sector</h4>
                    <span className="epsr-chart-sub">Green = gain, red = loss</span>
                  </div>
                  <div className="epsr-chart-body epsr-chart-body--tall">
                    <Bar data={unrealisedBySectorChart} options={horizontalBarOptions} />
                  </div>
                </div>

                <div className="epsr-chart-card epsr-chart-card--full">
                  <div className="epsr-chart-header">
                    <h4>Company performance summary</h4>
                    <span className="epsr-chart-sub">Holdings · cost · MV · unrealised P&amp;L</span>
                  </div>
                  <div className="epsr-mini-table-wrap">
                    <table className="epsr-mini-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Holdings</th>
                          <th>Total cost</th>
                          <th>Market value</th>
                          <th>Unrealised</th>
                          <th>Return %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyAggregates.map((c) => {
                          const ret = c.cost > 0 ? (c.unrealised / c.cost) * 100 : 0;
                          const retCls = ret >= 0 ? 'epsr-pos' : 'epsr-neg';
                          return (
                            <tr key={c.company}>
                              <td className="epsr-text">
                                <span
                                  className="epsr-color-dot"
                                  style={{ backgroundColor: COMPANY_COLORS[c.company] || '#94a3b8' }}
                                />
                                {c.company}
                              </td>
                              <td>{c.count}</td>
                              <td>{formatNumber(c.cost)}</td>
                              <td>{formatNumber(c.mv)}</td>
                              <td className={c.unrealised >= 0 ? 'epsr-pos' : 'epsr-neg'}>
                                {c.unrealised >= 0 ? '+' : ''}
                                {formatNumber(c.unrealised)}
                              </td>
                              <td className={retCls}>{formatPercent(ret)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {groups.map((g) => {
              const gMV = g.rows.reduce((s, r) => s + r.totalMV, 0);
              return renderTable(g.rows, gMV, g.key);
            })}

            <p className="bfr-footnote">
              {readOnly ? (
                <>
                  Saved read-only summary. Use <strong>Edit</strong> beside this panel to change filters and data.
                </>
              ) : (
                <>
                  Executive roll-up of the full equity report. Adjust grouping, top N, minimum size, and columns; edit
                  holdings inline. Use <strong>Save</strong> for a fixed view.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="bfr-modal-floating-actions" role="toolbar" aria-label="Report controls" onClick={(e) => e.stopPropagation()}>
          {readOnly ? (
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

export default EquityPortfolioSummaryReport;
