import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import './Styles/WealthManagerDashboard.css';

const MOCK_OPS_HEALTH = {
  score: 88,
  status: 'Healthy',
  reconciliation: 'On track',
  pendingAllocations: '12 (low)',
  serviceLevel: '99.4%',
};

const MOCK_OPS_ALERTS = [
  {
    severity: 'high',
    title: 'Subscription cut-off in 30 min',
    message: 'Equity Growth Fund · until 1:00 PM',
  },
  {
    severity: 'medium',
    title: 'Bank statement unmatched',
    message: 'HSBC op. account · LKR 12.4M',
  },
  {
    severity: 'low',
    title: 'New KYC submissions',
    message: '8 packs ready for review',
  },
];

/** WM editorial mix — forest + sand (same family as Portfolio / Client screens). */
const MIX_COLORS = ['#0f4c3a', '#14624a', '#c4a574', '#b7c4bc'];
/** Asset allocation only — clearer contrast across slices. */
const ALLOC_COLORS = ['#0f4c3a', '#2563eb', '#d97706', '#64748b'];

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const MixBreakdown = ({
  items,
  formatDetail,
  centerValue = '100%',
  centerLabel = 'Book',
  variant = 'doughnut',
  colors = MIX_COLORS,
}) => {
  const size = 128;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 56;
  const inner = variant === 'pie' ? 0 : 32;
  const isPie = variant === 'pie';
  const total = items.reduce((s, it) => s + (Number(it.percentage) || 0), 0) || 100;

  let cursor = 0;
  const slices = items.map((item, index) => {
    const pct = Number(item.percentage) || 0;
    const start = (cursor / total) * 360;
    cursor += pct;
    const end = (cursor / total) * 360;
    const large = end - start > 180 ? 1 : 0;
    const o0 = polar(cx, cy, outer, start);
    const o1 = polar(cx, cy, outer, end);

    let d;
    if (isPie) {
      d = [
        `M ${cx} ${cy}`,
        `L ${o0.x} ${o0.y}`,
        `A ${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y}`,
        'Z',
      ].join(' ');
    } else {
      const i0 = polar(cx, cy, inner, end);
      const i1 = polar(cx, cy, inner, start);
      d = [
        `M ${o0.x} ${o0.y}`,
        `A ${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y}`,
        `L ${i0.x} ${i0.y}`,
        `A ${inner} ${inner} 0 ${large} 0 ${i1.x} ${i1.y}`,
        'Z',
      ].join(' ');
    }

    return {
      key: item.category,
      d,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className={`wdb-mix${isPie ? ' wdb-mix--pie' : ''}`}>
      <div className="wdb-mix__pie" aria-hidden>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {slices.map((s) => (
            <path key={s.key} d={s.d} fill={s.color} />
          ))}
        </svg>
        {!isPie ? (
          <div className="wdb-mix__hole">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        ) : null}
      </div>
      <ul className="wdb-mix__list">
        {items.map((item, index) => (
          <li key={item.category}>
            <i style={{ background: colors[index % colors.length] }} />
            <strong>{item.category}</strong>
            <span>{formatDetail(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

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
    inflows: 8200000,
    outflows: 4300000,
    settlement: [
      { label: 'Settled today', value: 186, tone: 'ok' },
      { label: 'T+1 queue', value: 41, tone: 'info' },
      { label: 'Exceptions', value: 7, tone: 'warn' },
    ],
    recentTransactions: [
      { id: 1, client: 'Client 1', fund: 'Equity Growth Fund', type: 'Purchase', units: 5000, amount: 125000, time: '10:30 AM', status: 'Completed' },
      { id: 2, client: 'Client 2', fund: 'Balanced Income Fund', type: 'Redemption', units: 2500, amount: 62500, time: '10:15 AM', status: 'Completed' },
      { id: 3, client: 'Client 3', fund: 'Fixed Income Fund', type: 'Purchase', units: 10000, amount: 100000, time: '09:45 AM', status: 'Pending' },
      { id: 4, client: 'Client 4', fund: 'Equity Growth Fund', type: 'Switch', units: 3000, amount: 75000, time: '09:30 AM', status: 'Completed' },
      { id: 5, client: 'Client 5', fund: 'Money Market Fund', type: 'Purchase', units: 20000, amount: 200000, time: '09:15 AM', status: 'Completed' },
      { id: 6, client: 'Client 6', fund: 'Index Fund', type: 'Redemption', units: 1200, amount: 38580, time: '09:05 AM', status: 'Completed' },
    ],
    topFunds: [
      { name: 'Equity Growth Fund', nav: 25.45, change: 2.3, aum: 450000000, category: 'Equity' },
      { name: 'Balanced Income Fund', nav: 18.92, change: 1.8, aum: 320000000, category: 'Balanced' },
      { name: 'Fixed Income Fund', nav: 10.25, change: 0.5, aum: 280000000, category: 'Fixed Income' },
      { name: 'Index Fund', nav: 32.15, change: 3.5, aum: 180000000, category: 'Equity' },
      { name: 'Money Market Fund', nav: 1.0, change: 0.1, aum: 150000000, category: 'Money Market' },
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
    flowMix: [
      { category: 'Purchase', percentage: 58, value: 198 },
      { category: 'Redemption', percentage: 28, value: 96 },
      { category: 'Switch', percentage: 14, value: 48 },
    ],
    clientSegments: [
      { category: 'Retail', percentage: 52, value: 6474 },
      { category: 'HNW', percentage: 28, value: 3486 },
      { category: 'Corporate', percentage: 14, value: 1743 },
      { category: 'Trust', percentage: 6, value: 747 },
    ],
  };

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
      const y = 28 - ((point.value - navMin) / (navMax - navMin || 1)) * 20;
      return { x, y };
    });
    return { line: pts.map((p) => `${p.x},${p.y}`).join(' ') };
  }, [dashboardData.navTrend, navMax, navMin]);

  const navChart = useMemo(() => {
    const w = 340;
    const h = 148;
    const padX = 18;
    const padY = 22;
    const pts = dashboardData.navTrend.map((point, index) => {
      const x = padX + (index / (dashboardData.navTrend.length - 1)) * (w - padX * 2);
      const y =
        h - padY - ((point.value - navMin) / (navMax - navMin || 1)) * (h - padY * 2 - 6);
      return { ...point, x, y };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${h - padY} ${line} ${pts[pts.length - 1].x},${h - padY}`;
    return { w, h, padY, pts, line, area };
  }, [dashboardData.navTrend, navMax, navMin]);

  return (
    <div className="wdb">
      <WealthPageHeader
        title="Operations Dashboard"
        blurb="AUM, fund performance, client flows, and desk health in one view."
        actions={
          <div className="wdb-rail__clock">
            <strong>{formatTime(currentTime)}</strong>
            <span>{formatDate(currentTime)}</span>
          </div>
        }
      />

      {/* Unified metrics rail — not six separate cards */}
      <section className="wdb-rail" aria-label="Key metrics">
        <div className="wdb-rail__aum">
          <span className="wdb-label">Assets under management</span>
          <div className="wdb-aum__figure">
            <span className="wdb-aum__ccy">LKR</span>
            <strong className="wdb-aum__num">{formatLkrCompact(dashboardData.aum.total)}</strong>
          </div>
          <div className="wdb-aum__meta">
            <span className="wdb-aum__delta">▲ {dashboardData.aum.change}% MoM</span>
            <span className="wdb-kpi__note">NAV · 5 sessions</span>
          </div>
          <div className="wdb-kpi__spark" aria-hidden>
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
        </div>

        <div className="wdb-rail__metrics">
          <div className="wdb-rail__cell">
            <span className="wdb-label">Clients</span>
            <strong>{formatNumber(dashboardData.clients.total)}</strong>
            <span className="wdb-kpi__note">
              {formatNumber(dashboardData.clients.active)} active · +{dashboardData.clients.new}
            </span>
          </div>
          <div className="wdb-rail__cell">
            <span className="wdb-label">Active funds</span>
            <strong>{formatNumber(dashboardData.funds.active)}</strong>
            <span className="wdb-kpi__note">{dashboardData.funds.topPerformer}</span>
          </div>
          <div className="wdb-rail__cell">
            <span className="wdb-label">Today&apos;s deals</span>
            <strong>{formatNumber(dashboardData.transactions.today)}</strong>
            <span className="wdb-kpi__note">
              LKR {formatLkrCompact(dashboardData.transactions.value)} · {dashboardData.transactions.pending} pend.
            </span>
          </div>
          <div className="wdb-rail__cell">
            <span className="wdb-label">Net flow</span>
            <strong className="is-up">
              +{formatLkrCompact(dashboardData.inflows - dashboardData.outflows)}
            </strong>
            <span className="wdb-kpi__note">
              In {formatLkrCompact(dashboardData.inflows)} · Out {formatLkrCompact(dashboardData.outflows)}
            </span>
          </div>
          <div className="wdb-rail__cell">
            <span className="wdb-label">Ops health</span>
            <strong>
              {MOCK_OPS_HEALTH.score}
              <span className="wdb-stat__den">/100</span>
            </strong>
            <span className="wdb-kpi__note">{MOCK_OPS_HEALTH.status}</span>
          </div>
        </div>
      </section>

      <section className="wdb-grid wdb-grid--3" aria-label="Charts">
        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>NAV trend</h2>
              <p>Equity Growth · 5d</p>
            </div>
            <select className="wdb-select" defaultValue="5d" aria-label="NAV period">
              <option value="5d">5d</option>
              <option value="1m">1m</option>
              <option value="3m">3m</option>
              <option value="1y">1y</option>
            </select>
          </header>
          <div className="wdb-linechart" role="img" aria-label="NAV line chart">
            <svg viewBox={`0 0 ${navChart.w} ${navChart.h}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="wdbNavFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f4c3a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f4c3a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((i) => {
                const y = 16 + i * ((navChart.h - 40) / 2);
                return (
                  <line
                    key={i}
                    x1="12"
                    x2={navChart.w - 12}
                    y1={y}
                    y2={y}
                    className="wdb-linechart__grid"
                  />
                );
              })}
              <polygon fill="url(#wdbNavFill)" points={navChart.area} />
              <polyline className="wdb-linechart__line" fill="none" points={navChart.line} />
              {navChart.pts.map((p) => (
                <g key={p.date}>
                  <circle className="wdb-linechart__dot" cx={p.x} cy={p.y} r="3" />
                  <text className="wdb-linechart__val" x={p.x} y={p.y - 9} textAnchor="middle">
                    {p.value.toFixed(1)}
                  </text>
                  <text className="wdb-linechart__day" x={p.x} y={navChart.h - 4} textAnchor="middle">
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>

        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>Asset allocation</h2>
              <p>Book mix</p>
            </div>
          </header>
          <MixBreakdown
            variant="pie"
            colors={ALLOC_COLORS}
            items={dashboardData.portfolioAllocation}
            formatDetail={(item) => `${item.percentage}% · LKR ${formatLkrCompact(item.value)}`}
          />
        </article>

        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>Deal mix</h2>
              <p>Today by type</p>
            </div>
          </header>
          <MixBreakdown
            items={dashboardData.flowMix}
            formatDetail={(item) => `${item.percentage}% · ${item.value} txns`}
            centerValue={String(dashboardData.transactions.today)}
            centerLabel="Deals"
          />
        </article>
      </section>

      <section className="wdb-grid wdb-grid--3" aria-label="Segments and desk">
        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>Client segments</h2>
              <p>Book by type</p>
            </div>
          </header>
          <MixBreakdown
            items={dashboardData.clientSegments}
            formatDetail={(item) => `${item.percentage}% · ${formatNumber(item.value)}`}
            centerValue={formatLkrCompact(dashboardData.clients.total)}
            centerLabel="Clients"
          />
        </article>

        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>Desk readiness</h2>
              <p>Recon &amp; service</p>
            </div>
            <span className="wdb-score">{MOCK_OPS_HEALTH.score}</span>
          </header>
          <dl className="wdb-ops">
            <div>
              <dt>Reconciliation</dt>
              <dd className="wdb-pill wdb-pill--ok">{MOCK_OPS_HEALTH.reconciliation}</dd>
            </div>
            <div>
              <dt>Pending alloc.</dt>
              <dd className="wdb-pill wdb-pill--warn">{MOCK_OPS_HEALTH.pendingAllocations}</dd>
            </div>
            <div>
              <dt>Service level</dt>
              <dd className="wdb-pill wdb-pill--info">{MOCK_OPS_HEALTH.serviceLevel}</dd>
            </div>
          </dl>
          <div className="wdb-settle">
            {dashboardData.settlement.map((row) => (
              <div key={row.label} className={`wdb-settle__item tone-${row.tone}`}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="wdb-panel">
          <header className="wdb-panel__head">
            <div>
              <h2>Alerts</h2>
              <p>Open desk tasks</p>
            </div>
          </header>
          <ul className="wdb-alerts">
            {MOCK_OPS_ALERTS.map((alert) => (
              <li key={alert.title} className={`sev-${alert.severity}`}>
                <strong>{alert.title}</strong>
                <span>{alert.message}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="wdb-grid wdb-grid--2" aria-label="Funds and activity">
        <article className="wdb-panel wdb-panel--funds">
          <header className="wdb-panel__head">
            <div>
              <h2>Top funds</h2>
              <p>By weekly return</p>
            </div>
          </header>
          <table className="wdb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fund</th>
                <th>NAV</th>
                <th>Chg</th>
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
                    {fund.change >= 0 ? '+' : ''}
                    {fund.change}%
                  </td>
                  <td>{formatLkrCompact(fund.aum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="wdb-panel wdb-panel--tx">
          <header className="wdb-panel__head">
            <div>
              <h2>Latest activity</h2>
              <p>Client transactions</p>
            </div>
            <div className="wdb-flow">
              <span className="is-buy">{buyCount} buys</span>
              <span className="is-sell">{sellCount} sells</span>
            </div>
          </header>
          <ul className="wdb-txlist">
            {dashboardData.recentTransactions.map((t) => (
              <li key={t.id}>
                <div className="wdb-txlist__main">
                  <strong>{t.client}</strong>
                  <span>
                    {t.type} · {t.fund}
                  </span>
                </div>
                <div className="wdb-txlist__side">
                  <strong>{formatLkrCompact(t.amount)}</strong>
                  <span>
                    <em className={t.status === 'Completed' ? 'ok' : 'warn'}>{t.status}</em>
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
