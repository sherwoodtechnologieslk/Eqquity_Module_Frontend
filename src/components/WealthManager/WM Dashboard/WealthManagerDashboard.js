import React, { useEffect, useMemo, useState } from 'react';
import './Styles/WealthManagerDashboard.css';

const OPS_HEALTH = {
  score: 88,
  status: 'Healthy',
  reconciliation: 'On track',
  pendingAllocations: '12 (low)',
  serviceLevel: '99.4%',
};

const OPS_ALERTS = [
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

const ALLOC_COLORS = ['#143f36', '#3e6f8f', '#b08a62', '#8e9694'];
const DEAL_COLORS = ['#143f36', '#3e7a62', '#b08a62'];
const SEGMENT_COLORS = ['#143f36', '#3e7a62', '#b08a62', '#8e9694'];

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

const formatLkrCompact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`;
  return abs.toString();
};

const Panel = ({ kicker, title, note, children, className = '' }) => (
  <section className={`wmd-panel${className ? ` ${className}` : ''}`}>
    <header className="wmd-panel__head">
      <div>
        {kicker ? <p className="wmd-kicker">{kicker}</p> : null}
        <h2>{title}</h2>
      </div>
      {note ? <p className="wmd-note">{note}</p> : null}
    </header>
    {children}
  </section>
);

const WeightRow = ({ label, meta, pct, color }) => (
  <div className="wmd-weight">
    <span className="wmd-weight__name">
      <i style={{ background: color }} aria-hidden />
      {label}
    </span>
    <span className="wmd-weight__meta">{meta}</span>
    <span className="wmd-weight__pct">{pct}%</span>
    <span className="wmd-weight__track" aria-hidden>
      <b style={{ width: `${pct}%`, background: color }} />
    </span>
  </div>
);

const WealthManagerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const data = {
    aum: { total: 2450000000, change: 3.2 },
    clients: { total: 12450, active: 11890, new: 159 },
    funds: { active: 45, topPerformer: 'Equity Growth Fund' },
    transactions: { today: 342, pending: 23, value: 12500000 },
    inflows: 8200000,
    outflows: 4300000,
    settlement: [
      { label: 'Settled today', value: 186, tone: 'ok' },
      { label: 'T+1 queue', value: 41, tone: 'info' },
      { label: 'Exceptions', value: 7, tone: 'warn' },
    ],
    recentTransactions: [
      { id: 1, client: 'Client 1', fund: 'Equity Growth Fund', type: 'Purchase', amount: 125000, time: '10:30 AM', status: 'Completed' },
      { id: 2, client: 'Client 2', fund: 'Balanced Income Fund', type: 'Redemption', amount: 62500, time: '10:15 AM', status: 'Completed' },
      { id: 3, client: 'Client 3', fund: 'Fixed Income Fund', type: 'Purchase', amount: 100000, time: '09:45 AM', status: 'Pending' },
      { id: 4, client: 'Client 4', fund: 'Equity Growth Fund', type: 'Switch', amount: 75000, time: '09:30 AM', status: 'Completed' },
      { id: 5, client: 'Client 5', fund: 'Money Market Fund', type: 'Purchase', amount: 200000, time: '09:15 AM', status: 'Completed' },
      { id: 6, client: 'Client 6', fund: 'Index Fund', type: 'Redemption', amount: 38580, time: '09:05 AM', status: 'Completed' },
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

  const netFlow = data.inflows - data.outflows;
  const navMax = Math.max(...data.navTrend.map((point) => point.value));
  const navMin = Math.min(...data.navTrend.map((point) => point.value));

  const chart = useMemo(() => {
    const w = 640;
    const h = 280;
    const left = 46;
    const right = 16;
    const top = 18;
    const bottom = 28;
    const span = navMax - navMin || 1;
    const pts = data.navTrend.map((point, index) => {
      const x = left + (index / (data.navTrend.length - 1)) * (w - left - right);
      const y = top + (1 - (point.value - navMin) / span) * (h - top - bottom);
      return { ...point, x, y };
    });
    const line = pts.map((point) => `${point.x},${point.y}`).join(' ');
    const area = `${pts[0].x},${h - bottom} ${line} ${pts[pts.length - 1].x},${h - bottom}`;
    const grid = [0, 0.5, 1].map((t) => ({
      y: top + t * (h - top - bottom),
      label: (navMax - t * span).toFixed(2),
    }));
    return { w, h, bottom, pts, line, area, grid };
  }, [data.navTrend, navMax, navMin]);

  const clock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const businessDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="wmd">
      <header className="wmd-command">
        <div>
          <p className="wmd-kicker">Wealth Management</p>
          <h1>Operations Overview</h1>
        </div>
        <div className="wmd-command__meta">
          <span>Business date</span>
          <time dateTime={currentTime.toISOString()}>
            <strong>{businessDate}</strong>
            {clock}
          </time>
          <span className="wmd-scope">Equity Growth Fund · 5 sessions</span>
        </div>
      </header>

      <section className="wmd-strip" aria-label="Business summary">
        <div>
          <span>Assets under management</span>
          <strong>LKR {formatLkrCompact(data.aum.total)}</strong>
          <em className="is-up">Up {data.aum.change}% MoM</em>
        </div>
        <div>
          <span>Net flow</span>
          <strong className="is-up">+{formatLkrCompact(netFlow)}</strong>
          <em>In {formatLkrCompact(data.inflows)} · Out {formatLkrCompact(data.outflows)}</em>
        </div>
        <div>
          <span>Clients</span>
          <strong>{formatNumber(data.clients.total)}</strong>
          <em>{formatNumber(data.clients.active)} active · +{data.clients.new}</em>
        </div>
        <div>
          <span>Active funds</span>
          <strong>{data.funds.active}</strong>
          <em>{data.funds.topPerformer}</em>
        </div>
        <div>
          <span>Today&apos;s deals</span>
          <strong>{formatNumber(data.transactions.today)}</strong>
          <em>LKR {formatLkrCompact(data.transactions.value)} · {data.transactions.pending} pending</em>
        </div>
        <div>
          <span>Operations health</span>
          <strong>{OPS_HEALTH.score}<small>/100</small></strong>
          <em className="is-up">{OPS_HEALTH.status}</em>
        </div>
      </section>

      <div className="wmd-primary">
        <Panel
          className="wmd-chart-panel"
          kicker="Performance"
          title="NAV path"
          note="Equity Growth Fund"
        >
          <div className="wmd-chart" role="img" aria-label="NAV for the last five sessions">
            <svg viewBox={`0 0 ${chart.w} ${chart.h}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="wmdNavFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#143f36" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#143f36" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chart.grid.map((row) => (
                <g key={row.label}>
                  <line className="wmd-chart__grid" x1="46" x2={chart.w - 12} y1={row.y} y2={row.y} />
                  <text className="wmd-chart__axis" x="0" y={row.y + 3}>{row.label}</text>
                </g>
              ))}
              <polygon points={chart.area} fill="url(#wmdNavFill)" />
              <polyline className="wmd-chart__line" fill="none" points={chart.line} />
              {chart.pts.map((point, index) => (
                <g key={point.date}>
                  <circle
                    className={hover === index ? 'is-hot' : ''}
                    cx={point.x}
                    cy={point.y}
                    r={hover === index ? 5 : 3.5}
                    tabIndex={0}
                    role="button"
                    aria-label={`${point.date} NAV ${point.value.toFixed(2)}`}
                    onMouseEnter={() => setHover(index)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(index)}
                    onBlur={() => setHover(null)}
                  />
                  <text className="wmd-chart__day" x={point.x} y={chart.h - 8} textAnchor="middle">{point.date}</text>
                </g>
              ))}
            </svg>
            {hover !== null ? (
              <div
                className="wmd-tip"
                style={{ left: `${(chart.pts[hover].x / chart.w) * 100}%` }}
              >
                <strong>{chart.pts[hover].date}</strong>
                <span>NAV {chart.pts[hover].value.toFixed(2)}</span>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel kicker="Portfolio" title="Asset allocation" note="Book mix">
          <div className="wmd-stack" aria-hidden>
            {data.portfolioAllocation.map((item, index) => (
              <i key={item.category} style={{ width: `${item.percentage}%`, background: ALLOC_COLORS[index] }} />
            ))}
          </div>
          <div className="wmd-weights" role="table" aria-label="Asset allocation">
            {data.portfolioAllocation.map((item, index) => (
              <WeightRow
                key={item.category}
                label={item.category}
                meta={`LKR ${formatLkrCompact(item.value)}`}
                pct={item.percentage}
                color={ALLOC_COLORS[index]}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="wmd-mid">
        <Panel kicker="Dealing" title="Today's dealing" note={`${formatNumber(data.transactions.today)} orders`}>
          <div className="wmd-stack" aria-hidden>
            {data.flowMix.map((item, index) => (
              <i key={item.category} style={{ width: `${item.percentage}%`, background: DEAL_COLORS[index] }} />
            ))}
          </div>
          <div className="wmd-deal">
            {data.flowMix.map((item, index) => (
              <div key={item.category}>
                <span>
                  <i style={{ background: DEAL_COLORS[index] }} aria-hidden />
                  {item.category}
                </span>
                <strong>{item.value}</strong>
                <em>{item.percentage}% of orders</em>
              </div>
            ))}
          </div>
        </Panel>

        <Panel kicker="Investors" title="Investor distribution" note={`${formatNumber(data.clients.total)} clients`}>
          <div className="wmd-weights">
            {data.clientSegments.map((item, index) => (
              <WeightRow
                key={item.category}
                label={item.category}
                meta={formatNumber(item.value)}
                pct={item.percentage}
                color={SEGMENT_COLORS[index]}
              />
            ))}
          </div>
        </Panel>

        <Panel kicker="Control" title="Operations monitor" note={OPS_HEALTH.status}>
          <dl className="wmd-ops">
            <div>
              <dt>Reconciliation</dt>
              <dd>{OPS_HEALTH.reconciliation}</dd>
            </div>
            <div>
              <dt>Pending allocation</dt>
              <dd>{OPS_HEALTH.pendingAllocations}</dd>
            </div>
            <div>
              <dt>Service level</dt>
              <dd>{OPS_HEALTH.serviceLevel}</dd>
            </div>
          </dl>
          <ul className="wmd-settle">
            {data.settlement.map((row) => (
              <li key={row.label} className={`tone-${row.tone}`}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
          <ul className="wmd-alerts">
            {OPS_ALERTS.map((alert) => (
              <li key={alert.title} className={`sev-${alert.severity}`}>
                <strong>{alert.title}</strong>
                <span>{alert.message}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="wmd-lower">
        <Panel kicker="Funds" title="Fund register" note="By assets">
          <table className="wmd-table">
            <thead>
              <tr>
                <th>Fund</th>
                <th>NAV</th>
                <th>Change</th>
                <th>AUM</th>
              </tr>
            </thead>
            <tbody>
              {data.topFunds.map((fund) => (
                <tr key={fund.name}>
                  <td>
                    <strong>{fund.name}</strong>
                    <span>{fund.category}</span>
                  </td>
                  <td>{fund.nav.toFixed(2)}</td>
                  <td className={fund.change >= 0 ? 'is-up' : 'is-down'}>
                    {fund.change >= 0 ? '+' : ''}{fund.change}%
                  </td>
                  <td>LKR {formatLkrCompact(fund.aum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel kicker="Blotter" title="Latest activity" note="Client orders">
          <table className="wmd-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Client</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((row) => (
                <tr key={row.id}>
                  <td>{row.time}</td>
                  <td>
                    <strong>{row.client}</strong>
                    <span>{row.fund}</span>
                  </td>
                  <td>{row.type}</td>
                  <td>LKR {formatLkrCompact(row.amount)}</td>
                  <td>
                    <span className={row.status === 'Completed' ? 'wmd-status is-done' : 'wmd-status is-wait'}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
};

export default WealthManagerDashboard;
