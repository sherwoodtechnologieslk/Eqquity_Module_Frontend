import React, { useMemo, useState, useCallback } from 'react';
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
  GROUP_FINANCE_DATA,
  ASSET_COLORS,
  cloneGroupData,
  normalizeCompany,
  deriveGroupMetrics,
  formatCurrency,
  formatDisplayDate
} from './groupFinanceData';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/GroupFinanceDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const moneyTooltip = (ctx) => {
  const raw = Number(ctx.raw) || 0;
  return `LKR ${formatCurrency(raw)}`;
};

const compactAxisTick = (value) => formatCurrency(value, { compact: true });

const comparisonBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    tooltip: { cornerRadius: 0, callbacks: { label: moneyTooltip } }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      ticks: { callback: compactAxisTick },
      grid: { color: '#e2e8f0' }
    }
  }
};

const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    tooltip: { cornerRadius: 0, callbacks: { label: moneyTooltip } }
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: {
      stacked: true,
      ticks: { callback: compactAxisTick },
      grid: { color: '#e2e8f0' }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '55%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: { cornerRadius: 0, callbacks: { label: moneyTooltip } }
  }
};

function formatInputNumber(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return String(v);
}

function CompanyLabel({ company }) {
  return (
    <>
      {company.code} - {company.name}
    </>
  );
}

function CompanyCell({ company, viewOnly, onCodeChange, onNameChange }) {
  if (viewOnly) {
    return (
      <td>
        <CompanyLabel company={company} />
      </td>
    );
  }
  return (
    <td className="gfd-company-cell">
      <input
        type="text"
        className="gfd-company-code-input"
        value={company.code}
        onChange={(e) => onCodeChange(e.target.value)}
        aria-label="Company abbreviation"
        maxLength={16}
      />
      <span className="gfd-company-sep" aria-hidden>
        -
      </span>
      <input
        type="text"
        className="gfd-company-name-input"
        value={company.name}
        onChange={(e) => onNameChange(e.target.value)}
        aria-label={`${company.code} company name`}
      />
    </td>
  );
}

function MoneyCell({ value, viewOnly, onChange, ariaLabel }) {
  if (viewOnly) {
    return <td className="gfd-num">{formatCurrency(value)}</td>;
  }
  return (
    <td className="gfd-num gfd-cell-input">
      <input
        type="text"
        inputMode="decimal"
        value={formatInputNumber(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </td>
  );
}

function AssetAllocationPie({ company }) {
  const chartData = useMemo(
    () => ({
      labels: ['Treasury Bonds', 'Equity Portfolio', 'Other Investments'],
      datasets: [
        {
          data: [company.treasuryBond, company.equityPortfolio, company.otherInvestments],
          backgroundColor: [ASSET_COLORS.treasuryBond, ASSET_COLORS.equityPortfolio, ASSET_COLORS.otherInvestments],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }),
    [company]
  );

  const total = company.treasuryBond + company.equityPortfolio + company.otherInvestments;
  if (total <= 0) {
    return (
      <div className="gfd-pie-card">
        <h4>
          <CompanyLabel company={company} />
        </h4>
        <p className="gfd-header-meta">No asset data</p>
      </div>
    );
  }

  return (
    <div className="gfd-pie-card">
      <h4>
        <CompanyLabel company={company} />
      </h4>
      <div className="gfd-pie-canvas">
        <Doughnut data={chartData} options={doughnutOptions} />
      </div>
    </div>
  );
}

export function DashboardBody({ onClose, showClose, viewOnly = false, data: dataProp, onDataChange }) {
  const [internalData, setInternalData] = useState(() => cloneGroupData());
  const data = dataProp ?? internalData;
  const setData = onDataChange ?? setInternalData;

  const updateCompany = useCallback(
    (companyId, field, raw) => {
      if (viewOnly) return;
      setData((prev) => ({
        ...prev,
        companies: prev.companies.map((c) =>
          c.companyId === companyId ? normalizeCompany({ ...c, [field]: raw }) : c
        )
      }));
    },
    [setData, viewOnly]
  );

  const metrics = useMemo(() => deriveGroupMetrics(data), [data]);

  const labels = metrics.companies.map((c) => c.code);

  const comparisonChart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Liquid assets',
          data: metrics.companies.map((c) => c.totalLiquidAssets),
          backgroundColor: '#2563eb',
          borderRadius: 0
        },
        {
          label: 'Borrowings',
          data: metrics.companies.map((c) => c.totalBorrowings),
          backgroundColor: '#f97316',
          borderRadius: 0
        }
      ]
    }),
    [labels, metrics.companies]
  );

  const borrowingsChart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'External borrowings',
          data: metrics.companies.map((c) => c.externalBorrowings),
          backgroundColor: '#0891b2',
          borderRadius: 0
        },
        {
          label: 'Internal borrowings',
          data: metrics.companies.map((c) => c.internalBorrowings),
          backgroundColor: '#a855f7',
          borderRadius: 0
        }
      ]
    }),
    [labels, metrics.companies]
  );

  return (
    <div className={`gfd-wrap${viewOnly ? ' gfd-wrap--saved' : ''}`}>
      <header className="gfd-header">
        <div>
          <h3>Group finance dashboard</h3>
          <p className="gfd-header-meta">
            Equity as of {formatDisplayDate(data.date)} · T bond valuation {formatDisplayDate(data.valuationDate)}
          </p>
        </div>
        {showClose && onClose ? (
          <button type="button" className="gfd-close" onClick={onClose} aria-label="Close dashboard">
            ×
          </button>
        ) : null}
      </header>

      <div className="gfd-kpi-grid">
        <div className="gfd-kpi-card">
          <div className="gfd-kpi-label">Total liquid assets</div>
          <div className="gfd-kpi-value">{formatCurrency(metrics.totalLiquidAssets, { compact: true })}</div>
          <p className="gfd-kpi-sub">LKR {formatCurrency(metrics.totalLiquidAssets)}</p>
        </div>
        <div className="gfd-kpi-card">
          <div className="gfd-kpi-label">Total borrowings</div>
          <div className="gfd-kpi-value">{formatCurrency(metrics.totalBorrowings, { compact: true })}</div>
          <p className="gfd-kpi-sub">LKR {formatCurrency(metrics.totalBorrowings)}</p>
        </div>
        <div className="gfd-kpi-card">
          <div className="gfd-kpi-label">Net position</div>
          <div
            className={`gfd-kpi-value ${metrics.netPosition >= 0 ? 'gfd-kpi-value--positive' : 'gfd-kpi-value--negative'}`}
          >
            {metrics.netPosition >= 0 ? '+' : ''}
            {formatCurrency(metrics.netPosition, { compact: true })}
          </div>
          <p className="gfd-kpi-sub">Assets minus borrowings (group)</p>
        </div>
        <div className="gfd-kpi-card">
          <div className="gfd-kpi-label">Highest liquid exposure</div>
          <div className="gfd-kpi-value">{metrics.highestExposure?.code}</div>
          <p className="gfd-kpi-sub">
            {formatCurrency(metrics.highestExposure?.totalLiquidAssets, { compact: true })} liquid assets
          </p>
        </div>
      </div>

      <div className="gfd-insights">
        <div className="gfd-insight">
          <strong>Leverage risk:</strong> {metrics.mostLeveraged?.code} borrowings (
          {formatCurrency(metrics.mostLeveraged?.totalBorrowings, { compact: true })}) exceed liquid assets (
          {formatCurrency(metrics.mostLeveraged?.totalLiquidAssets, { compact: true })}).
        </div>
        <div className="gfd-insight">
          <strong>Concentration:</strong> {metrics.highestExposure?.code} holds{' '}
          {metrics.totalLiquidAssets > 0
            ? ((metrics.highestExposure.totalLiquidAssets / metrics.totalLiquidAssets) * 100).toFixed(0)
            : '0'}
          % of group liquid assets, largely in equities.
        </div>
        <div className="gfd-insight">
          <strong>Liquidity strength:</strong> {metrics.strongestNet?.code} net position{' '}
          {formatCurrency(metrics.strongestNet?.netPosition, { compact: true })} - lowest relative leverage in the
          group.
        </div>
      </div>

      <div className="gfd-charts-row gfd-charts-row--split">
        <section className="gfd-panel">
          <h4 className="gfd-panel-title">Liquid assets vs borrowings by company</h4>
          <div className="gfd-chart-canvas">
            <Bar data={comparisonChart} options={comparisonBarOptions} />
          </div>
        </section>
        <section className="gfd-panel">
          <h4 className="gfd-panel-title">Borrowing structure (external vs internal)</h4>
          <div className="gfd-chart-canvas">
            <Bar data={borrowingsChart} options={stackedBarOptions} />
          </div>
        </section>
      </div>

      <section className="gfd-panel" style={{ marginBottom: 16 }}>
        <h4 className="gfd-panel-title">Asset allocation by company</h4>
        <div className="gfd-pie-grid">
          {metrics.companies.map((c) => (
            <AssetAllocationPie key={c.companyId} company={c} />
          ))}
        </div>
      </section>

      <section className="gfd-panel" style={{ marginBottom: 16 }}>
        <h4 className="gfd-panel-title">Detailed financial breakdown</h4>
        {!viewOnly ? (
          <p className="gfd-table-hint">
            Edit abbreviations, company names, and amounts here; KPIs, charts, and net position update
            automatically.
          </p>
        ) : null}
        <div className="gfd-table-wrap">
          <table className={`gfd-table${viewOnly ? '' : ' gfd-table--editable'}`}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Treasury bonds</th>
                <th>Equity portfolio</th>
                <th>Other investments</th>
                <th>Total liquid assets</th>
                <th>External borrowings</th>
                <th>Internal borrowings</th>
                <th>Total borrowings</th>
              </tr>
            </thead>
            <tbody>
              {metrics.companies.map((c) => (
                <tr key={c.companyId}>
                  <CompanyCell
                    company={c}
                    viewOnly={viewOnly}
                    onCodeChange={(raw) => updateCompany(c.companyId, 'code', raw)}
                    onNameChange={(raw) => updateCompany(c.companyId, 'name', raw)}
                  />
                  <MoneyCell
                    value={c.treasuryBond}
                    viewOnly={viewOnly}
                    onChange={(raw) => updateCompany(c.companyId, 'treasuryBond', raw)}
                    ariaLabel={`${c.code} treasury bonds`}
                  />
                  <MoneyCell
                    value={c.equityPortfolio}
                    viewOnly={viewOnly}
                    onChange={(raw) => updateCompany(c.companyId, 'equityPortfolio', raw)}
                    ariaLabel={`${c.code} equity portfolio`}
                  />
                  <MoneyCell
                    value={c.otherInvestments}
                    viewOnly={viewOnly}
                    onChange={(raw) => updateCompany(c.companyId, 'otherInvestments', raw)}
                    ariaLabel={`${c.code} other investments`}
                  />
                  <td className="gfd-num gfd-num--derived">{formatCurrency(c.totalLiquidAssets)}</td>
                  <MoneyCell
                    value={c.externalBorrowings}
                    viewOnly={viewOnly}
                    onChange={(raw) => updateCompany(c.companyId, 'externalBorrowings', raw)}
                    ariaLabel={`${c.code} external borrowings`}
                  />
                  <MoneyCell
                    value={c.internalBorrowings}
                    viewOnly={viewOnly}
                    onChange={(raw) => updateCompany(c.companyId, 'internalBorrowings', raw)}
                    ariaLabel={`${c.code} internal borrowings`}
                  />
                  <td className="gfd-num gfd-num--derived">{formatCurrency(c.totalBorrowings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Group total</td>
                <td className="gfd-num">{formatCurrency(sumCol(metrics.companies, 'treasuryBond'))}</td>
                <td className="gfd-num">{formatCurrency(sumCol(metrics.companies, 'equityPortfolio'))}</td>
                <td className="gfd-num">{formatCurrency(sumCol(metrics.companies, 'otherInvestments'))}</td>
                <td className="gfd-num">{formatCurrency(metrics.totalLiquidAssets)}</td>
                <td className="gfd-num">{formatCurrency(metrics.totalExternalBorrowings)}</td>
                <td className="gfd-num">{formatCurrency(metrics.totalInternalBorrowings)}</td>
                <td className="gfd-num">{formatCurrency(metrics.totalBorrowings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="gfd-panel">
        <h4 className="gfd-panel-title">Net liquidity position</h4>
        {!viewOnly ? (
          <p className="gfd-table-hint">Calculated from the detailed breakdown above.</p>
        ) : null}
        <div className="gfd-table-wrap">
          <table className="gfd-table gfd-table--computed">
            <thead>
              <tr>
                <th>Company</th>
                <th>Liquid assets</th>
                <th>Borrowings</th>
                <th>Net position</th>
              </tr>
            </thead>
            <tbody>
              {metrics.companies.map((c) => (
                <tr key={c.companyId}>
                  <td>
                    <CompanyLabel company={c} />
                  </td>
                  <td className="gfd-num">{formatCurrency(c.totalLiquidAssets)}</td>
                  <td className="gfd-num">{formatCurrency(c.totalBorrowings)}</td>
                  <td className={`gfd-num ${c.netPosition >= 0 ? 'gfd-positive' : 'gfd-negative'}`}>
                    {c.netPosition >= 0 ? '+' : ''}
                    {formatCurrency(c.netPosition)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Group total</td>
                <td className="gfd-num">{formatCurrency(metrics.totalLiquidAssets)}</td>
                <td className="gfd-num">{formatCurrency(metrics.totalBorrowings)}</td>
                <td className={`gfd-num ${metrics.netPosition >= 0 ? 'gfd-positive' : 'gfd-negative'}`}>
                  {metrics.netPosition >= 0 ? '+' : ''}
                  {formatCurrency(metrics.netPosition)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function sumCol(companies, field) {
  return companies.reduce((s, c) => s + (Number(c[field]) || 0), 0);
}

const GroupFinanceDashboard = ({ open, onClose, embedded = false, inline = false }) => {
  if (!open && !embedded && !inline) return null;

  if (inline) {
    return <DashboardBody onClose={onClose} showClose={Boolean(onClose)} />;
  }

  if (embedded) {
    return (
      <div className="gfd-embedded-root">
        <DashboardBody />
      </div>
    );
  }

  return createPortal(
    <div
      className="bfr-modal-root"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bfr-modal-cluster" onClick={(e) => e.stopPropagation()}>
        <div
          className="bfr-modal-shell"
          style={{ maxWidth: 1280, width: '96vw' }}
          role="dialog"
          aria-modal="true"
          aria-label="Group finance dashboard"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close dashboard">
            ×
          </button>
          <div className="bfr-doc" style={{ paddingTop: 8 }}>
            <DashboardBody onClose={onClose} showClose={false} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GroupFinanceDashboard;
