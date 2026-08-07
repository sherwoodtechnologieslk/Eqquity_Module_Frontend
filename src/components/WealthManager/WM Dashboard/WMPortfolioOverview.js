import React, { useMemo, useState } from 'react';
import './Styles/WMPortfolioOverview.css';

const ALLOCATION_COLORS = ['#0f4c3a', '#1a7a5c', '#14624a', '#c4a574', '#d6c7a8'];

const WMPortfolioOverview = () => {
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [viewMode, setViewMode] = useState('summary');
  const [dateRange, setDateRange] = useState('1Y');

  const [portfolioData] = useState({
    portfolios: [
      { id: 1, name: 'Client Portfolio 1', client: 'Client 1', type: 'Individual', value: 12500000, change: 5.2, funds: 8, riskProfile: 'Moderate', manager: 'John Smith' },
      { id: 2, name: 'Client Portfolio 2', client: 'Client 2', type: 'Corporate', value: 45000000, change: 3.8, funds: 12, riskProfile: 'Balanced', manager: 'Sarah Johnson' },
      { id: 3, name: 'Client Portfolio 3', client: 'Client 3', type: 'Individual', value: 8500000, change: 7.1, funds: 6, riskProfile: 'Aggressive', manager: 'Michael Chen' },
      { id: 4, name: 'Client Portfolio 4', client: 'Client 4', type: 'Trust', value: 32000000, change: 4.5, funds: 10, riskProfile: 'Conservative', manager: 'Emily Davis' },
      { id: 5, name: 'Client Portfolio 5', client: 'Client 5', type: 'Individual', value: 18500000, change: 6.2, funds: 9, riskProfile: 'Moderate', manager: 'David Wilson' },
    ],
    allocations: [
      { category: 'Equity Funds', percentage: 45.5, value: 1114750000, funds: 12, change: 8.2 },
      { category: 'Fixed Income', percentage: 28.3, value: 693350000, funds: 8, change: 4.5 },
      { category: 'Balanced Funds', percentage: 15.2, value: 372400000, funds: 6, change: 6.8 },
      { category: 'Money Market', percentage: 8.5, value: 208250000, funds: 4, change: 3.2 },
      { category: 'Real Estate', percentage: 2.5, value: 61250000, funds: 2, change: 5.1 },
    ],
    performance: [
      { period: '1M', return: 2.3, benchmark: 1.8, difference: 0.5 },
      { period: '3M', return: 4.2, benchmark: 4.5, difference: -0.3 },
      { period: '6M', return: 8.5, benchmark: 7.2, difference: 1.3 },
      { period: '1Y', return: 13.8, benchmark: 13.5, difference: 0.3 },
      { period: '3Y', return: 16.2, benchmark: 16.8, difference: -0.6 },
      { period: '5Y', return: 22.1, benchmark: 19.5, difference: 2.6 },
    ],
    topHoldings: [
      { fund: 'Equity Growth Fund', allocation: 18.5, value: 453250000, units: 17800000, nav: 25.45, return: 12.5 },
      { fund: 'Balanced Income Fund', allocation: 15.2, value: 372400000, units: 19680000, nav: 18.92, return: 10.8 },
      { fund: 'Fixed Income Fund', allocation: 12.8, value: 313600000, units: 30585000, nav: 10.25, return: 6.5 },
      { fund: 'Index Fund', allocation: 11.5, value: 281750000, units: 8756000, nav: 32.15, return: 14.2 },
      { fund: 'Dividend Income Equity Fund', allocation: 9.8, value: 240100000, units: 10530000, nav: 22.8, return: 11.2 },
      { fund: 'Money Market Fund', allocation: 8.5, value: 208250000, units: 208250000, nav: 1.0, return: 4.2 },
    ],
    historicalData: [
      { month: 'Jan', value: 2200000000 },
      { month: 'Feb', value: 2250000000 },
      { month: 'Mar', value: 2300000000 },
      { month: 'Apr', value: 2320000000 },
      { month: 'May', value: 2350000000 },
      { month: 'Jun', value: 2380000000 },
      { month: 'Jul', value: 2400000000 },
      { month: 'Aug', value: 2410000000 },
      { month: 'Sep', value: 2420000000 },
      { month: 'Oct', value: 2430000000 },
      { month: 'Nov', value: 2440000000 },
      { month: 'Dec', value: 2450000000 },
    ],
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatLkrCompact = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`;
    return abs.toString();
  };

  const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const pctClass = (value) => {
    if (value > 0) return 'wpo-pct wpo-pct--up';
    if (value < 0) return 'wpo-pct wpo-pct--down';
    return 'wpo-pct';
  };

  const statPctClass = (value) => {
    if (value > 0) return 'wpo-stat__pct wpo-stat__pct--up';
    if (value < 0) return 'wpo-stat__pct wpo-stat__pct--down';
    return 'wpo-stat__pct';
  };

  const totalPortfolioValue = portfolioData.portfolios.reduce((sum, p) => sum + p.value, 0);
  const totalChange =
    (portfolioData.portfolios.reduce((sum, p) => sum + (p.value * p.change) / 100, 0) / totalPortfolioValue) * 100;
  const totalFunds = portfolioData.allocations.reduce((sum, a) => sum + a.funds, 0);
  const ytd = portfolioData.performance[3];

  const histMax = Math.max(...portfolioData.historicalData.map((d) => d.value));
  const histMin = Math.min(...portfolioData.historicalData.map((d) => d.value));

  const riskClass = (profile) => `wpo-risk wpo-risk--${profile.toLowerCase()}`;

  const histChart = useMemo(() => {
    const w = 420;
    const h = 168;
    const padX = 24;
    const padY = 20;
    const range = histMax - histMin || 1;
    const pts = portfolioData.historicalData.map((point, index) => {
      const x = padX + (index / (portfolioData.historicalData.length - 1)) * (w - padX * 2);
      const y = h - padY - ((point.value - histMin) / range) * (h - padY * 2 - 8);
      return { ...point, x, y };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${h - padY} ${line} ${pts[pts.length - 1].x},${h - padY}`;
    return { w, h, padY, pts, line, area };
  }, [portfolioData.historicalData, histMax, histMin]);

  const donutGradient = useMemo(
    () =>
      portfolioData.allocations
        .reduce(
          (acc, item, index) => {
            const start = acc.at;
            const end = start + item.percentage;
            acc.stops.push(`${ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} ${start}% ${end}%`);
            acc.at = end;
            return acc;
          },
          { at: 0, stops: [] }
        )
        .stops.join(', '),
    [portfolioData.allocations]
  );

  const bookSpark = useMemo(() => {
    const pts = portfolioData.historicalData.map((point, index) => {
      const x = (index / (portfolioData.historicalData.length - 1)) * 100;
      const y = 30 - ((point.value - histMin) / (histMax - histMin || 1)) * 22;
      return { x, y };
    });
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  }, [portfolioData.historicalData, histMax, histMin]);

  return (
    <div className="wpo">
      <header className="wpo-rail">
        <div className="wpo-rail__brand">
          <div>
            <p className="wpo-rail__eyebrow">Sherwood Wealth</p>
            <h1 className="wpo-rail__title">Portfolio Overview</h1>
            <p className="wpo-rail__blurb">
              Book-level allocation, client mandates, benchmark-relative performance, and top fund exposures.
            </p>
          </div>
        </div>
        <div className="wpo-rail__filters" aria-label="Portfolio filters">
          <label className="wpo-filter">
            <span className="wpo-label">Portfolio</span>
            <select
              className="wpo-select"
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              aria-label="Portfolio filter"
            >
              <option value="all">All portfolios</option>
              {portfolioData.portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wpo-filter">
            <span className="wpo-label">Period</span>
            <select
              className="wpo-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Date range"
            >
              <option value="1M">1 month</option>
              <option value="3M">3 months</option>
              <option value="6M">6 months</option>
              <option value="1Y">1 year</option>
              <option value="3Y">3 years</option>
              <option value="5Y">5 years</option>
            </select>
          </label>
          <button type="button" className="wpo-btn wpo-btn--primary">
            Export report
          </button>
        </div>
      </header>

      <section className="wpo-spotlight" aria-label="Portfolio summary">
        <article className="wpo-stat wpo-stat--book">
          <span className="wpo-label">Total book value</span>
          <div className="wpo-book__figure">
            <span className="wpo-book__ccy">LKR</span>
            <strong className="wpo-book__num">{formatLkrCompact(totalPortfolioValue)}</strong>
          </div>
          <div className="wpo-book__meta">
            <span className={`wpo-book__delta${totalChange >= 0 ? '' : ' is-down'}`}>
              {totalChange >= 0 ? '▲' : '▼'} {formatPercent(totalChange)} aggregate
            </span>
            <span className="wpo-stat__meta">
              {portfolioData.portfolios.length} mandates · {dateRange} view
            </span>
          </div>
          <div className="wpo-book__spark" aria-hidden>
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={bookSpark}
              />
            </svg>
          </div>
        </article>

        <article className="wpo-stat">
          <span className="wpo-label">Active portfolios</span>
          <strong>{portfolioData.portfolios.length}</strong>
          <span className="wpo-stat__meta">All mandates active</span>
        </article>
        <article className="wpo-stat">
          <span className="wpo-label">Fund positions</span>
          <strong>{totalFunds}</strong>
          <span className="wpo-stat__meta">Across asset classes</span>
        </article>
        <article className="wpo-stat">
          <span className="wpo-label">1Y return</span>
          <strong className={statPctClass(ytd.return)}>{formatPercent(ytd.return)}</strong>
          <span className="wpo-stat__meta">Bench {formatPercent(ytd.benchmark)}</span>
        </article>
        <article className="wpo-stat">
          <span className="wpo-label">Alpha (1Y)</span>
          <strong className={statPctClass(ytd.difference)}>{formatPercent(ytd.difference)}</strong>
          <span className="wpo-stat__meta">{ytd.difference >= 0 ? 'Outperformed' : 'Underperformed'}</span>
        </article>
      </section>

      <section className="wpo-board">
        <article className="wpo-panel wpo-panel--alloc">
          <header className="wpo-panel__head">
            <div>
              <h2>Asset allocation</h2>
              <p>Weighted by market value</p>
            </div>
          </header>
          <div className="wpo-donutwrap">
            <div
              className="wpo-donut"
              style={{ background: `conic-gradient(${donutGradient})` }}
              aria-hidden
            >
              <div className="wpo-donut__hole">
                <strong>100%</strong>
                <span>Book</span>
              </div>
            </div>
            <ul className="wpo-legend">
              {portfolioData.allocations.map((item, index) => (
                <li key={item.category}>
                  <i style={{ background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }} />
                  <div>
                    <strong>{item.category}</strong>
                    <span>
                      {item.percentage}% · LKR {formatLkrCompact(item.value)} ·{' '}
                      <span className={pctClass(item.change)}>{formatPercent(item.change)}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="wpo-panel wpo-panel--trend">
          <header className="wpo-panel__head">
            <div>
              <h2>Book value trend</h2>
              <p>Monthly aggregate · LKR</p>
            </div>
          </header>
          <div className="wpo-linechart" role="img" aria-label="Monthly portfolio value">
            <svg viewBox={`0 0 ${histChart.w} ${histChart.h}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="wpoAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14624a" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#14624a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((t) => (
                <line
                  key={t}
                  className="wpo-linechart__grid"
                  x1={24}
                  x2={histChart.w - 24}
                  y1={histChart.padY + t * (histChart.h - histChart.padY * 2 - 8)}
                  y2={histChart.padY + t * (histChart.h - histChart.padY * 2 - 8)}
                />
              ))}
              <polygon className="wpo-linechart__area" points={histChart.area} />
              <polyline className="wpo-linechart__line" points={histChart.line} />
              {histChart.pts.map((p) => (
                <g key={p.month}>
                  <circle className="wpo-linechart__dot" cx={p.x} cy={p.y} r="4" />
                  <text className="wpo-linechart__day" x={p.x} y={histChart.h - 4} textAnchor="middle">
                    {p.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>
      </section>

      <article className="wpo-panel wpo-panel--table">
        <header className="wpo-panel__head">
          <div>
            <h2>Client portfolios</h2>
            <p>Mandate summary &amp; risk profile</p>
          </div>
          <div className="wpo-seg" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'summary'}
              className={`wpo-seg__btn${viewMode === 'summary' ? ' is-on' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              Summary
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'detailed'}
              className={`wpo-seg__btn${viewMode === 'detailed' ? ' is-on' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </button>
          </div>
        </header>
        <div className="wpo-table-wrap">
          <table className="wpo-table">
            <thead>
              <tr>
                <th>Portfolio</th>
                <th>Client</th>
                <th>Type</th>
                <th className="wpo-num">Value (LKR)</th>
                <th className="wpo-num">Return</th>
                <th className="wpo-num">Funds</th>
                <th>Risk</th>
                {viewMode === 'detailed' && <th>Manager</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {portfolioData.portfolios.map((portfolio) => (
                <tr key={portfolio.id}>
                  <td>
                    <strong>{portfolio.name}</strong>
                  </td>
                  <td>{portfolio.client}</td>
                  <td>
                    <span className="wpo-tag">{portfolio.type}</span>
                  </td>
                  <td className="wpo-num">{formatCurrency(portfolio.value)}</td>
                  <td className="wpo-num">
                    <span className={pctClass(portfolio.change)}>{formatPercent(portfolio.change)}</span>
                  </td>
                  <td className="wpo-num">{portfolio.funds}</td>
                  <td>
                    <span className={riskClass(portfolio.riskProfile)}>{portfolio.riskProfile}</span>
                  </td>
                  {viewMode === 'detailed' && <td>{portfolio.manager}</td>}
                  <td className="wpo-actions">
                    <button type="button" className="wpo-link-btn">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <section className="wpo-board wpo-board--lower">
        <article className="wpo-panel">
          <header className="wpo-panel__head">
            <div>
              <h2>Performance vs benchmark</h2>
              <p>Rolling periods</p>
            </div>
          </header>
          <div className="wpo-table-wrap">
            <table className="wpo-table wpo-table--compact">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="wpo-num">Portfolio</th>
                  <th className="wpo-num">Benchmark</th>
                  <th className="wpo-num">Diff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.performance.map((item) => (
                  <tr key={item.period}>
                    <td>
                      <strong>{item.period}</strong>
                    </td>
                    <td className="wpo-num">
                      <span className={pctClass(item.return)}>{formatPercent(item.return)}</span>
                    </td>
                    <td className="wpo-num">{formatPercent(item.benchmark)}</td>
                    <td className="wpo-num">
                      <span className={pctClass(item.difference)}>{formatPercent(item.difference)}</span>
                    </td>
                    <td>
                      <span className={`wpo-pill${item.difference > 0 ? ' wpo-pill--ok' : ' wpo-pill--warn'}`}>
                        {item.difference > 0 ? 'Outperformed' : 'Underperformed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="wpo-panel">
          <header className="wpo-panel__head">
            <div>
              <h2>Top holdings</h2>
              <p>By allocation weight</p>
            </div>
          </header>
          <div className="wpo-table-wrap">
            <table className="wpo-table wpo-table--compact">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th className="wpo-num">Wt %</th>
                  <th className="wpo-num">Value</th>
                  <th className="wpo-num">NAV</th>
                  <th className="wpo-num">Return</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.topHoldings.map((holding) => (
                  <tr key={holding.fund}>
                    <td>
                      <strong>{holding.fund}</strong>
                    </td>
                    <td className="wpo-num">{holding.allocation}%</td>
                    <td className="wpo-num">{formatLkrCompact(holding.value)}</td>
                    <td className="wpo-num">{holding.nav.toFixed(2)}</td>
                    <td className="wpo-num">
                      <span className={pctClass(holding.return)}>{formatPercent(holding.return)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
};

export default WMPortfolioOverview;
