import React, { useEffect, useMemo, useState } from 'react';
import './Styles/WealthManagerDashboard.css';

const MOCK_OPS_HEALTH = {
  score: 88,
  status: 'Healthy',
  reconciliation: 'On track',
  pendingAllocations: '12 (low)',
  serviceLevel: '99.4% uptime',
};

const MOCK_OPS_ALERTS = [
  {
    severity: 'high',
    title: 'Subscription cut-off in 30 min',
    message: 'Equity Growth Fund accepting orders until 1:00 PM',
  },
  {
    severity: 'medium',
    title: 'Bank statement awaiting reconciliation',
    message: 'HSBC operating account · LKR 12.4M unmatched',
  },
  {
    severity: 'low',
    title: 'New KYC submissions',
    message: '8 client KYC packs ready for compliance review',
  },
];

const ALLOC_COLORS = ['#0f4c3a', '#1a7a5c', '#c4a574', '#d6c7a8'];

const WealthManagerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dashboardData = {
    aum: { total: 2450000000, change: 3.2 },
    clients: { total: 12450, active: 11890, new: 156 },
    funds: { total: 48, active: 45, topPerformer: 'Equity Growth Fund' },
    transactions: { today: 342, pending: 23, value: 12500000 },
    recentTransactions: [
      { id: 1, client: 'Client 1', fund: 'Equity Growth Fund', type: 'Purchase', units: 5000, amount: 125000, time: '10:30 AM', status: 'Completed' },
      { id: 2, client: 'Client 2', fund: 'Balanced Income Fund', type: 'Redemption', units: 2500, amount: 62500, time: '10:15 AM', status: 'Completed' },
      { id: 3, client: 'Client 3', fund: 'Fixed Income Fund', type: 'Purchase', units: 10000, amount: 100000, time: '09:45 AM', status: 'Pending' },
      { id: 4, client: 'Client 4', fund: 'Equity Growth Fund', type: 'Switch', units: 3000, amount: 75000, time: '09:30 AM', status: 'Completed' },
      { id: 5, client: 'Client 5', fund: 'Money Market Fund', type: 'Purchase', units: 20000, amount: 200000, time: '09:15 AM', status: 'Completed' },
    ],
    topFunds: [
      { name: 'Equity Growth Fund', nav: 25.45, change: 2.3, aum: 450000000, category: 'Equity' },
      { name: 'Balanced Income Fund', nav: 18.92, change: 1.8, aum: 320000000, category: 'Balanced' },
      { name: 'Fixed Income Fund', nav: 10.25, change: 0.5, aum: 280000000, category: 'Fixed Income' },
      { name: 'Money Market Fund', nav: 1.0, change: 0.1, aum: 150000000, category: 'Money Market' },
      { name: 'Index Fund', nav: 32.15, change: 3.5, aum: 180000000, category: 'Equity' },
    ],
    navTrend: [
      { date: 'Mon', value: 24.2 },
      { date: 'Tue', value: 24.5 },
      { date: 'Wed', value: 24.8 },
      { date: 'Thu', value: 25.1 },
      { date: 'Fri', value: 25.45 },
    ],
    portfolioAllocation: [
      { category: 'Equity', percentage: 45, value: 1102500000 },
      { category: 'Fixed Income', percentage: 30, value: 735000000 },
      { category: 'Balanced', percentage: 15, value: 367500000 },
      { category: 'Money Market', percentage: 10, value: 245000000 },
    ],
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

  const formatLkrCompact = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`;
    return abs.toString();
  };

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const navMax = Math.max(...dashboardData.navTrend.map((p) => p.value));
  const navMin = Math.min(...dashboardData.navTrend.map((p) => p.value));
  const buyCount = dashboardData.recentTransactions.filter(
    (t) => t.type === 'Purchase' || t.type === 'Switch'
  ).length;
  const sellCount = dashboardData.recentTransactions.filter(
    (t) => t.type === 'Redemption'
  ).length;

  const spark = useMemo(() => {
    const pts = dashboardData.navTrend.map((point, index) => {
      const x = (index / (dashboardData.navTrend.length - 1)) * 100;
      const y = 30 - ((point.value - navMin) / (navMax - navMin || 1)) * 22;
      return { x, y };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
    return { line };
  }, [dashboardData.navTrend, navMax, navMin]);

  const navChart = useMemo(() => {
    const w = 420;
    const h = 180;
    const padX = 28;
    const padY = 22;
    const pts = dashboardData.navTrend.map((point, index) => {
      const x =
        padX + (index / (dashboardData.navTrend.length - 1)) * (w - padX * 2);
      const y =
        h -
        padY -
        ((point.value - navMin) / (navMax - navMin || 1)) * (h - padY * 2 - 10);
      return { ...point, x, y };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${h - padY} ${line} ${pts[pts.length - 1].x},${h - padY}`;
    return { w, h, padY, pts, line, area };
  }, [dashboardData.navTrend, navMax, navMin]);

  const donutGradient = dashboardData.portfolioAllocation
    .reduce(
      (acc, item, index) => {
        const start = acc.at;
        const end = start + item.percentage;
        acc.stops.push(`${ALLOC_COLORS[index]} ${start}% ${end}%`);
        acc.at = end;
        return acc;
      },
      { at: 0, stops: [] }
    )
    .stops.join(', ');

  return (
    <div className="wdb">
      <header className="wdb-rail">
        <div className="wdb-rail__brand">
          <span className="wdb-rail__mark">SW</span>
          <div>
            <p className="wdb-rail__eyebrow">Sherwood Wealth</p>
            <h1 className="wdb-rail__title">Operations Dashboard</h1>
            <p className="wdb-rail__blurb">
              AUM, fund performance, client flows, and desk health in one view.
            </p>
          </div>
        </div>
        <div className="wdb-rail__clock">
          <strong>{formatTime(currentTime)}</strong>
          <span>{formatDate(currentTime)}</span>
        </div>
      </header>

      <section className="wdb-spotlight" aria-label="Key metrics">
        <article className="wdb-stat wdb-stat--aum">
          <span className="wdb-label">Assets under management</span>
          <div className="wdb-aum__figure">
            <span className="wdb-aum__ccy">LKR</span>
            <strong className="wdb-aum__num">
              {formatLkrCompact(dashboardData.aum.total)}
            </strong>
          </div>
          <div className="wdb-aum__meta">
            <span className="wdb-aum__delta">
              ▲ {dashboardData.aum.change}% MoM
            </span>
            <span className="wdb-stat__meta">NAV · 5 sessions</span>
          </div>
          <div className="wdb-aum__spark" aria-hidden>
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={spark.line}
              />
            </svg>
          </div>
        </article>

        <article className="wdb-stat">
          <span className="wdb-label">Clients</span>
          <strong>{formatNumber(dashboardData.clients.total)}</strong>
          <span className="wdb-stat__meta">
            {formatNumber(dashboardData.clients.active)} active · +
            {dashboardData.clients.new} new
          </span>
        </article>

        <article className="wdb-stat">
          <span className="wdb-label">Active funds</span>
          <strong>{formatNumber(dashboardData.funds.active)}</strong>
          <span className="wdb-stat__meta">
            {formatNumber(dashboardData.funds.total)} total ·{' '}
            {dashboardData.funds.topPerformer}
          </span>
        </article>

        <article className="wdb-stat">
          <span className="wdb-label">Today&apos;s transactions</span>
          <strong>{formatNumber(dashboardData.transactions.today)}</strong>
          <span className="wdb-stat__meta">
            LKR {formatLkrCompact(dashboardData.transactions.value)} ·{' '}
            {dashboardData.transactions.pending} pending
          </span>
        </article>

        <article className="wdb-stat">
          <span className="wdb-label">Operations health</span>
          <strong>
            {MOCK_OPS_HEALTH.score}
            <span className="wdb-stat__den">/100</span>
          </strong>
          <span className="wdb-stat__meta">{MOCK_OPS_HEALTH.status}</span>
        </article>
      </section>

      <section className="wdb-board">
        <article className="wdb-panel wdb-panel--nav">
          <header className="wdb-panel__head">
            <div>
              <h2>NAV trend</h2>
              <p>Equity Growth Fund · last 5 sessions</p>
            </div>
            <select className="wdb-select" defaultValue="5d" aria-label="NAV period">
              <option value="5d">Last 5 days</option>
              <option value="1m">Last month</option>
              <option value="3m">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
          </header>
          <div className="wdb-linechart" role="img" aria-label="NAV line chart">
            <svg viewBox={`0 0 ${navChart.w} ${navChart.h}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="wdbNavFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(15, 118, 110, 0.18)" />
                  <stop offset="100%" stopColor="rgba(15, 118, 110, 0)" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => {
                const y = 22 + i * ((navChart.h - 44) / 3);
                return (
                  <line
                    key={i}
                    x1="20"
                    x2={navChart.w - 20}
                    y1={y}
                    y2={y}
                    className="wdb-linechart__grid"
                  />
                );
              })}
              <polygon fill="url(#wdbNavFill)" points={navChart.area} />
              <polyline
                className="wdb-linechart__line"
                fill="none"
                points={navChart.line}
              />
              {navChart.pts.map((p) => (
                <g key={p.date}>
                  <circle className="wdb-linechart__dot" cx={p.x} cy={p.y} r="4.5" />
                  <text className="wdb-linechart__val" x={p.x} y={p.y - 12} textAnchor="middle">
                    {p.value.toFixed(2)}
                  </text>
                  <text
                    className="wdb-linechart__day"
                    x={p.x}
                    y={navChart.h - 6}
                    textAnchor="middle"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>

        <article className="wdb-panel wdb-panel--alloc">
          <header className="wdb-panel__head">
            <div>
              <h2>Asset allocation</h2>
              <p>Across all portfolios</p>
            </div>
          </header>
          <div className="wdb-donutwrap">
            <div
              className="wdb-donut"
              style={{ background: `conic-gradient(${donutGradient})` }}
              role="img"
              aria-label="Asset allocation donut"
            >
              <div className="wdb-donut__hole">
                <strong>100%</strong>
                <span>Book</span>
              </div>
            </div>
            <ul className="wdb-legend">
              {dashboardData.portfolioAllocation.map((item, index) => (
                <li key={item.category}>
                  <i style={{ background: ALLOC_COLORS[index] }} />
                  <div>
                    <strong>{item.category}</strong>
                    <span>
                      {item.percentage}% · LKR {formatLkrCompact(item.value)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="wdb-panel wdb-panel--ops">
          <header className="wdb-panel__head">
            <div>
              <h2>Desk readiness</h2>
              <p>Reconciliation &amp; service</p>
            </div>
          </header>
          <dl className="wdb-ops">
            <div>
              <dt>Reconciliation</dt>
              <dd className="wdb-pill wdb-pill--ok">{MOCK_OPS_HEALTH.reconciliation}</dd>
            </div>
            <div>
              <dt>Pending allocations</dt>
              <dd className="wdb-pill wdb-pill--warn">{MOCK_OPS_HEALTH.pendingAllocations}</dd>
            </div>
            <div>
              <dt>Service level</dt>
              <dd className="wdb-pill wdb-pill--info">{MOCK_OPS_HEALTH.serviceLevel}</dd>
            </div>
          </dl>
          <div className="wdb-alerts">
            <h3>Alerts &amp; tasks</h3>
            <ul>
              {MOCK_OPS_ALERTS.map((alert) => (
                <li key={alert.title} className={`sev-${alert.severity}`}>
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="wdb-lower">
        <article className="wdb-panel wdb-panel--funds">
          <header className="wdb-panel__head">
            <div>
              <h2>Top funds</h2>
              <p>Ranked by weekly return</p>
            </div>
          </header>
          <table className="wdb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fund</th>
                <th>NAV</th>
                <th>Change</th>
                <th>AUM</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topFunds.map((fund, index) => (
                <tr key={fund.name}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{fund.name}</strong>
                    <span>{fund.category}</span>
                  </td>
                  <td>{fund.nav.toFixed(2)}</td>
                  <td className={fund.change >= 0 ? 'is-up' : 'is-down'}>
                    {fund.change >= 0 ? '▲' : '▼'} {fund.change}%
                  </td>
                  <td>LKR {formatLkrCompact(fund.aum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="wdb-panel wdb-panel--tx">
          <header className="wdb-panel__head">
            <div>
              <h2>Latest activity</h2>
              <p>Recent client transactions</p>
            </div>
            <div className="wdb-flow">
              <span className="is-buy">{buyCount} purchases</span>
              <span className="is-sell">{sellCount} redemptions</span>
            </div>
          </header>
          <ul className="wdb-txlist">
            {dashboardData.recentTransactions.map((t) => (
              <li key={t.id}>
                <div className="wdb-txlist__main">
                  <strong>{t.client}</strong>
                  <span>
                    {t.type} · {t.fund} · {formatNumber(t.units)} units
                  </span>
                </div>
                <div className="wdb-txlist__side">
                  <strong>LKR {formatCurrency(t.amount)}</strong>
                  <span>
                    <em className={t.status === 'Completed' ? 'ok' : 'warn'}>
                      {t.status}
                    </em>
                    {t.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default WealthManagerDashboard;
