import React, { useEffect, useMemo, useState } from 'react';
import './ViewPortfolio.css';
import { portfolioAPI } from '../../services/api';

const ALLOCATION_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#6366f1', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6'];

const formatNumber = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatLkr = (value) => `LKR ${formatNumber(value || 0)}`;

const escapeCsv = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildExportCsv = (summary, holdings) => {
  const rows = [];
  rows.push(['Metric', 'Value']);
  if (summary) {
    rows.push(['Total Market Value', (summary.totalValue ?? 0)]);
    rows.push(['Total Cost', (summary.totalCost ?? 0)]);
    rows.push(['Unrealized P&L', (summary.unrealizedPnL ?? summary.totalUnrealizedCapitalGain ?? summary.totalPnL ?? 0)]);
    rows.push(['Net P&L', (summary.totalPnL ?? 0)]);
    rows.push(['No. of Holdings', (summary.numberOfPositions ?? holdings?.length ?? 0)]);
    rows.push(['Realized P&L', (summary.realizedPnL ?? 0)]);
  }
  rows.push([]);
  const headers = ['Symbol', 'Company Name', 'Quantity', 'Avg Cost', 'Last Price', 'Market Value', 'Unrealized P&L', 'Sector'];
  rows.push(headers);
  const sorted = [...(holdings || [])].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));
  sorted.forEach((h) => {
    rows.push([
      h.symbol ?? '',
      h.companyName ?? h.name ?? '',
      h.quantity ?? '',
      h.avgPrice ?? h.costPrice ?? '',
      h.currentPrice ?? '',
      h.marketValue ?? '',
      h.pnl ?? '',
      h.sector ?? '',
    ]);
  });
  return rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
};

const ViewPortfolio = () => {
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the same backend overview used by the main dashboard
      const result = await portfolioAPI.getPortfolioOverview('all');

      if (result && result.success && result.data) {
        setSummary(result.data.summary || null);
        setHoldings(result.data.holdings || []);
      } else {
        setSummary(null);
        setHoldings([]);
        setError('No portfolio data available.');
      }
    } catch (e) {
      console.error('Error loading portfolio overview:', e);
      setSummary(null);
      setHoldings([]);
      setError(e.message || 'Failed to load portfolio overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allocation = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    const sectorTotals = {};
    let totalMV = 0;

    holdings.forEach((h) => {
      const sector = h.sector || 'Unclassified';
      const mv = h.marketValue || 0;
      sectorTotals[sector] = (sectorTotals[sector] || 0) + mv;
      totalMV += mv;
    });

    return Object.entries(sectorTotals).map(([label, value], idx) => ({
      label,
      percent: totalMV ? (value / totalMV) * 100 : 0,
      color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
    }));
  }, [holdings]);

  const insights = useMemo(() => {
    const totalMV = summary?.totalValue || 0;
    const sorted = [...holdings].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));
    const top5 = sorted.slice(0, 5);
    const top5Value = top5.reduce((sum, h) => sum + (h.marketValue || 0), 0);
    const top5Pct = totalMV ? (top5Value / totalMV) * 100 : 0;
    const largest = sorted[0];
    const largestPct = totalMV && largest ? ((largest.marketValue || 0) / totalMV) * 100 : 0;

    return [
      {
        title: 'Top Concentration',
        body:
          totalMV && top5.length
            ? `Top 5 positions account for ${top5Pct.toFixed(1)}% of total portfolio value. Largest single-name exposure is ${largestPct.toFixed(
                1,
              )}% (${largest.symbol || largest.companyName || 'N/A'}).`
            : 'Not enough data to calculate concentration yet.',
      },
      {
        title: 'Realized vs Unrealized',
        body: `Unrealized P&L is ${formatLkr(summary?.unrealizedPnL ?? summary?.totalUnrealizedCapitalGain ?? summary?.totalPnL ?? 0)}. Realized P&L is ${formatLkr(
          summary?.realizedPnL ?? 0,
        )}.`,
      },
      {
        title: 'Risk Snapshot',
        body: `Currently tracking ${holdings.length} active positions across ${
          allocation.length
        } sectors. Largest sector weight is ${allocation[0] ? allocation[0].percent.toFixed(1) : '0.0'}% (${
          allocation[0]?.label || 'N/A'
        }).`,
      },
    ];
  }, [summary, holdings, allocation]);

  if (loading) {
    return (
      <div className="vp-root">
        <div className="vp-header">
          <div>
            <h2 className="vp-title">Portfolio Overview – Detail</h2>
            <p className="vp-subtitle">Loading real-time portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-root">
      <div className="vp-header">
        <div>
          <h2 className="vp-title">Portfolio Overview – Detail</h2>
          <p className="vp-subtitle">
            A consolidated, real-time analytic view of all equity holdings across portfolios and accounts.
          </p>
        </div>
        <div className="vp-header-actions">
          <button
            className="vp-button ghost"
            onClick={() => {
              const csv = buildExportCsv(summary, holdings);
              const bom = '\uFEFF';
              const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `portfolio-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export Summary
          </button>
          <button className="vp-button primary" onClick={loadData}>
            Recalculate Valuation
          </button>
        </div>
      </div>

      {error && (
        <div className="vp-card" style={{ marginBottom: '1rem', borderColor: '#f97316' }}>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem' }}>{error}</p>
        </div>
      )}

      <div className="vp-grid">
        <section className="vp-card vp-card-summary">
          <h3 className="vp-card-title">Key Portfolio Metrics</h3>
          <div className="vp-metrics">
            <div className="vp-metrics-hero">
              <span className="vp-metrics-hero-label">Total Market Value</span>
              <span className="vp-metrics-hero-value">{formatLkr(summary?.totalValue || 0)}</span>
              <div className="vp-metrics-hero-glow" aria-hidden="true" />
            </div>
            <div className="vp-metrics-grid">
              <div className="vp-metric vp-metric--muted">
                <span className="vp-metric-label">Total Cost</span>
                <span className="vp-metric-value">{formatLkr(summary?.totalCost || 0)}</span>
              </div>
              <div className="vp-metric vp-metric--positive">
                <span className="vp-metric-label">Unrealized P&amp;L</span>
                <span className="vp-metric-value">
                  {formatLkr(summary?.unrealizedPnL ?? summary?.totalUnrealizedCapitalGain ?? summary?.totalPnL ?? 0)}
                </span>
              </div>
              <div className="vp-metric vp-metric--positive">
                <span className="vp-metric-label">Net P&amp;L</span>
                <span className="vp-metric-value">{formatLkr(summary?.totalPnL || 0)}</span>
              </div>
              <div className="vp-metric">
                <span className="vp-metric-label">No. of Holdings</span>
                <span className="vp-metric-value">{holdings.length}</span>
              </div>
              <div className="vp-metric">
                <span className="vp-metric-label">Realized P&amp;L</span>
                <span className="vp-metric-value">{formatLkr(summary?.realizedPnL || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="vp-card vp-card-holdings">
          <div className="vp-card-header">
            <h3 className="vp-card-title">Top Holdings</h3>
            <span className="vp-card-caption">Sorted by market value</span>
          </div>
          <div className="vp-table-wrapper">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th className="num">Quantity</th>
                  <th className="num">Avg. Cost</th>
                  <th className="num">Last Price</th>
                  <th className="num">Market Value</th>
                  <th className="num">Unrealized P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {holdings
                  .slice()
                  .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
                  .slice(0, 10)
                  .map((row) => (
                    <tr key={row.symbol || row.companyName}>
                      <td>{row.symbol}</td>
                      <td>{row.companyName || row.name}</td>
                      <td className="num">{(row.quantity || 0).toLocaleString()}</td>
                      <td className="num">{formatLkr(row.avgPrice || row.costPrice || 0)}</td>
                      <td className="num">
                        {row.currentPrice != null ? formatLkr(row.currentPrice) : 'N/A'}
                      </td>
                      <td className="num">{formatLkr(row.marketValue || 0)}</td>
                      <td className={`num ${row.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {row.pnl != null ? formatLkr(row.pnl) : 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="vp-card vp-card-allocation">
          <h3 className="vp-card-title">Sector Allocation</h3>
          <div className="vp-allocation-chart">
            {allocation.length === 0 && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No sector data available.</p>}
            {allocation.map((item) => (
              <div key={item.label} className="vp-allocation-row">
                <div className="vp-allocation-label">
                  <span className="vp-allocation-dot" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
                <div className="vp-allocation-bar-outer">
                  <div
                    className="vp-allocation-bar-inner"
                    style={{
                      width: `${item.percent.toFixed(1)}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <span className="vp-allocation-value">{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="vp-card vp-card-insights">
          <h3 className="vp-card-title">Portfolio Insights</h3>
          <div className="vp-insights-grid">
            {insights.map((insight) => (
              <article key={insight.title} className="vp-insight-tile">
                <h4>{insight.title}</h4>
                <p>{insight.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewPortfolio;

