import React, { useState, useEffect } from 'react';
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

const WealthManagerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dashboardData = {
    aum: { total: 2450000000, change: 3.2, changeType: 'positive' },
    clients: { total: 12450, active: 11890, new: 156 },
    funds: { total: 48, active: 45, topPerformer: 'Equity Growth Fund' },
    transactions: { today: 342, pending: 23, value: 12500000 },
    recentTransactions: [
      { id: 1, client: 'Client 1', fund: 'Equity Growth Fund', type: 'Purchase', units: 5000, amount: 125000, time: '10:30 AM', status: 'Completed' },
      { id: 2, client: 'Client 2', fund: 'Balanced Income Fund', type: 'Redemption', units: 2500, amount: 62500, time: '10:15 AM', status: 'Completed' },
      { id: 3, client: 'Client 3', fund: 'Fixed Income Fund', type: 'Purchase', units: 10000, amount: 100000, time: '09:45 AM', status: 'Pending' },
      { id: 4, client: 'Client 4', fund: 'Equity Growth Fund', type: 'Switch', units: 3000, amount: 75000, time: '09:30 AM', status: 'Completed' },
      { id: 5, client: 'Client 5', fund: 'Money Market Fund', type: 'Purchase', units: 20000, amount: 200000, time: '09:15 AM', status: 'Completed' }
    ],
    topFunds: [
      { name: 'Equity Growth Fund', nav: 25.45, change: 2.3, aum: 450000000, category: 'Equity' },
      { name: 'Balanced Income Fund', nav: 18.92, change: 1.8, aum: 320000000, category: 'Balanced' },
      { name: 'Fixed Income Fund', nav: 10.25, change: 0.5, aum: 280000000, category: 'Fixed Income' },
      { name: 'Money Market Fund', nav: 1.00, change: 0.1, aum: 150000000, category: 'Money Market' },
      { name: 'Index Fund', nav: 32.15, change: 3.5, aum: 180000000, category: 'Equity' }
    ],
    navTrend: [
      { date: 'Mon', value: 24.2 },
      { date: 'Tue', value: 24.5 },
      { date: 'Wed', value: 24.8 },
      { date: 'Thu', value: 25.1 },
      { date: 'Fri', value: 25.45 }
    ],
    portfolioAllocation: [
      { category: 'Equity', percentage: 45, value: 1102500000 },
      { category: 'Fixed Income', percentage: 30, value: 735000000 },
      { category: 'Balanced', percentage: 15, value: 367500000 },
      { category: 'Money Market', percentage: 10, value: 245000000 }
    ]
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const dayOfWeek = currentTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hour = currentTime.getHours();
  const isWithinOpsHours = !isWeekend && hour >= 9 && hour < 15;

  const opsStatus = isWithinOpsHours
    ? { label: 'OPEN', toneClass: 'wm-eq-strip--open' }
    : { label: 'CLOSED', toneClass: 'wm-eq-strip--closed' };

  const navMax = Math.max(...dashboardData.navTrend.map((p) => p.value));
  const buyCount = dashboardData.recentTransactions.filter(
    (t) => t.type === 'Purchase' || t.type === 'Switch'
  ).length;
  const sellCount = dashboardData.recentTransactions.filter(
    (t) => t.type === 'Redemption'
  ).length;

  return (
    <div className="wm-dashboard wm-eqstyle">
      <div className="wm-eq-body">
        {/* LEFT COLUMN */}
        <div className="wm-eq-body__left">
          <header className="wm-eq-hero" aria-label="Wealth snapshot">
            <p className="wm-eq-hero__eyebrow">Wealth snapshot</p>
            <h1 className="wm-eq-hero__title">Wealth Overview</h1>
            <p className="wm-eq-hero__note">
              Unit trust operations · Monitoring · Client activity
            </p>
          </header>

          <div className="wm-eq-leftcol">
            {/* Status strip — mirrors Equity market-strip */}
            <div
              className={`wm-eq-strip ${opsStatus.toneClass}`}
              role="status"
              aria-label={`Operations ${opsStatus.label.toLowerCase()}`}
            >
              <div className="wm-eq-strip__left">
                <span className="wm-eq-strip__pill">
                  <span className="wm-eq-strip__dot" aria-hidden />
                  {opsStatus.label}
                </span>
                <div className="wm-eq-strip__text">
                  <span className="wm-eq-strip__name">Asset Management Desk</span>
                  <span className="wm-eq-strip__hours">
                    Opens 9:00 AM · Closes 3:00 PM
                  </span>
                </div>
              </div>
              <div className="wm-eq-strip__clock">
                <span className="wm-eq-strip__time">{formatTime(currentTime)}</span>
                <span className="wm-eq-strip__date">{formatDate(currentTime)}</span>
              </div>
            </div>

            {/* Lead chart — NAV trend */}
            <div className="wm-eq-card wm-eq-card--lead">
              <div className="wm-eq-card__head">
                <div className="wm-eq-card__head-left">
                  <span className="wm-eq-card__subtitle">NAV trend across periods</span>
                </div>
                <select className="wm-eq-card__select" defaultValue="Last 5 Days">
                  <option>Last 5 Days</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="wm-eq-bars">
                {dashboardData.navTrend.map((point, index) => {
                  const heightPct = (point.value / navMax) * 100;
                  const isLast = index === dashboardData.navTrend.length - 1;
                  return (
                    <div key={index} className="wm-eq-bar-col">
                      <div className="wm-eq-bar-value">{point.value.toFixed(2)}</div>
                      <div
                        className={`wm-eq-bar ${isLast ? 'is-accent' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="wm-eq-bar-label">{point.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top funds */}
            <div className="wm-eq-card">
              <div className="wm-eq-card__head">
                <div className="wm-eq-card__head-left">
                  <span className="wm-eq-card__subtitle">
                    Top funds by weekly return
                  </span>
                </div>
              </div>
              <div className="wm-eq-list">
                {dashboardData.topFunds.map((fund, index) => (
                  <div key={index} className="wm-eq-list-row">
                    <div className="wm-eq-list-rank">{index + 1}</div>
                    <div className="wm-eq-list-main">
                      <div className="wm-eq-list-title">{fund.name}</div>
                      <div className="wm-eq-list-sub">
                        {fund.category} · AUM LKR {formatLkrCompact(fund.aum)}
                      </div>
                    </div>
                    <div className="wm-eq-list-right">
                      <div className="wm-eq-list-metric">NAV {fund.nav.toFixed(2)}</div>
                      <div
                        className={`wm-eq-list-delta ${
                          fund.change >= 0 ? 'is-pos' : 'is-neg'
                        }`}
                      >
                        {fund.change >= 0 ? '▲' : '▼'} {fund.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest activity */}
            <div className="wm-eq-card wm-eq-card--activity">
              <div className="wm-eq-card__head">
                <div className="wm-eq-card__head-left">
                  <h3 className="wm-eq-activity__title">Latest fund activity</h3>
                  <span className="wm-eq-activity__subtitle">
                    Recent client transactions across funds
                  </span>
                </div>
                <div className="wm-eq-activity__stats">
                  <span className="wm-eq-activity__stat is-buy">
                    <span className="wm-eq-activity__dot" />
                    {buyCount} Purchases
                  </span>
                  <span className="wm-eq-activity__stat is-sell">
                    <span className="wm-eq-activity__dot" />
                    {sellCount} Redemptions
                  </span>
                </div>
              </div>
              <div className="wm-eq-tx">
                {dashboardData.recentTransactions.map((t) => (
                  <div key={t.id} className="wm-eq-tx-row">
                    <div className="wm-eq-tx-main">
                      <div className="wm-eq-tx-name">{t.client}</div>
                      <div className="wm-eq-tx-sub">
                        {t.type} · {t.fund} · {formatNumber(t.units)} units
                      </div>
                    </div>
                    <div className="wm-eq-tx-right">
                      <div className="wm-eq-tx-amount">
                        <span className="wm-eq-tx-currency">LKR</span>{' '}
                        {formatCurrency(t.amount)}
                      </div>
                      <div className="wm-eq-tx-meta">
                        <span
                          className={`wm-eq-tx-status ${
                            t.status.toLowerCase() === 'completed'
                              ? 'is-ok'
                              : 'is-warn'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="wm-eq-tx-time">{t.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="wm-eq-body__right">
          <div className="wm-eq-rightcol">
            {/* KPI tiles — mirrors equity .pnl-stats */}
            <div className="wm-eq-kpis">
              <div className="wm-eq-kpi wm-eq-kpi--pos">
                <span className="wm-eq-kpi__label">AUM</span>
                <span className="wm-eq-kpi__value">
                  <span className="wm-eq-kpi__currency">LKR</span>{' '}
                  {formatLkrCompact(dashboardData.aum.total)}
                </span>
                <span className="wm-eq-kpi__delta" aria-hidden>
                  ▲ {dashboardData.aum.change}% MoM
                </span>
              </div>

              <div className="wm-eq-kpi">
                <span className="wm-eq-kpi__label">Clients</span>
                <span className="wm-eq-kpi__value">
                  {formatNumber(dashboardData.clients.total)}
                </span>
                <div className="wm-eq-kpi__meta">
                  <span>{formatNumber(dashboardData.clients.active)} active</span>
                  <span className="wm-eq-kpi__pill">
                    +{dashboardData.clients.new} new
                  </span>
                </div>
              </div>

              <div className="wm-eq-kpi">
                <span className="wm-eq-kpi__label">Funds</span>
                <span className="wm-eq-kpi__value">
                  {formatNumber(dashboardData.funds.active)}
                </span>
                <div className="wm-eq-kpi__meta">
                  <span>{formatNumber(dashboardData.funds.total)} total</span>
                  <span className="wm-eq-kpi__pill">
                    {dashboardData.funds.topPerformer}
                  </span>
                </div>
              </div>

              <div className="wm-eq-kpi">
                <span className="wm-eq-kpi__label">Today</span>
                <span className="wm-eq-kpi__value">
                  {formatNumber(dashboardData.transactions.today)}
                </span>
                <div className="wm-eq-kpi__meta">
                  <span>
                    LKR {formatLkrCompact(dashboardData.transactions.value)}
                  </span>
                  <span className="wm-eq-kpi__pill">
                    {dashboardData.transactions.pending} pending
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="wm-eq-card">
              <div className="wm-eq-card__head">
                <div className="wm-eq-card__head-left">
                  <span className="wm-eq-card__subtitle">
                    Asset class allocation across portfolios
                  </span>
                </div>
              </div>
              <div className="wm-eq-alloc">
                {dashboardData.portfolioAllocation.map((item, index) => (
                  <div key={index} className="wm-eq-alloc-row">
                    <div className="wm-eq-alloc-head">
                      <span className="wm-eq-alloc-name">{item.category}</span>
                      <span className="wm-eq-alloc-pct">{item.percentage}%</span>
                    </div>
                    <div className="wm-eq-alloc-track">
                      <div
                        className="wm-eq-alloc-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="wm-eq-alloc-val">
                      LKR {formatLkrCompact(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations health */}
            <div className="wm-eq-card wm-eq-card--health">
              <div className="wm-eq-card__head">
                <div className="wm-eq-card__head-left">
                  <h3 className="wm-eq-health__title">
                    Operations Health &amp; Alerts
                  </h3>
                </div>
              </div>

              <div className="wm-eq-health-top">
                <div className="wm-eq-health-score">
                  <div className="wm-eq-health-score__label">Overall health</div>
                  <div className="wm-eq-health-score__value">
                    {MOCK_OPS_HEALTH.score}
                    <span className="wm-eq-health-score__outof">/100</span>
                  </div>
                  <span className="wm-eq-health-score__pill">
                    {MOCK_OPS_HEALTH.status}
                  </span>
                </div>

                <div className="wm-eq-health-kpis">
                  <div className="wm-eq-health-kpi">
                    <div className="wm-eq-health-kpi__label">Reconciliation</div>
                    <div className="wm-eq-health-kpi__value">
                      {MOCK_OPS_HEALTH.reconciliation}
                    </div>
                  </div>
                  <div className="wm-eq-health-kpi">
                    <div className="wm-eq-health-kpi__label">Pending allocations</div>
                    <div className="wm-eq-health-kpi__value">
                      {MOCK_OPS_HEALTH.pendingAllocations}
                    </div>
                  </div>
                  <div className="wm-eq-health-kpi">
                    <div className="wm-eq-health-kpi__label">Service level</div>
                    <div className="wm-eq-health-kpi__value">
                      {MOCK_OPS_HEALTH.serviceLevel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="wm-eq-health-bottom">
                <div className="wm-eq-health-block__title">Alerts &amp; tasks</div>
                <ul className="wm-eq-health-alerts">
                  {MOCK_OPS_ALERTS.map((alert, index) => (
                    <li
                      key={index}
                      className={`wm-eq-health-alert wm-eq-health-alert--${alert.severity}`}
                    >
                      <div className="wm-eq-health-alert__title">
                        {alert.title}
                      </div>
                      <div className="wm-eq-health-alert__text">
                        {alert.message}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthManagerDashboard;
