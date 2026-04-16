import React, { useState, useEffect } from 'react';
import './Styles/WealthManagerDashboard.css';

const WealthManagerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for the dashboard
  const dashboardData = {
    aum: {
      total: 2450000000,
      change: 3.2,
      changeType: 'positive'
    },
    clients: {
      total: 12450,
      active: 11890,
      new: 156
    },
    funds: {
      total: 48,
      active: 45,
      topPerformer: 'Equity Growth Fund'
    },
    transactions: {
      today: 342,
      pending: 23,
      value: 12500000
    },
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
      { name: 'Index Fund', nav: 32.15, change: 3.5, aum: 180000000, category: 'Equity' },
      { name: 'Dividend Income Equity Fund', nav: 22.80, change: 1.5, aum: 275000000, category: 'Equity' },
      { name: 'Real Estate Fund (REIT)', nav: 15.60, change: 0.9, aum: 140000000, category: 'Real Estate' },
      { name: 'Capital Preservation Fund', nav: 1.05, change: 0.2, aum: 120000000, category: 'Capital Preservation' },
      { name: 'Aggressive Growth Fund', nav: 35.20, change: 4.2, aum: 110000000, category: 'Equity' }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="wm-dashboard">
      {/* Calm header (no big banner) */}
      <div className="wm2-head">
        <div className="wm2-head-left">
          <h1 className="wm2-title">Wealth Overview</h1>
          <div className="wm2-subtitle">Unit trust operations • Monitoring • Client activity</div>
        </div>
        <div className="wm2-time">
          <div className="wm2-time-top">{currentTime.toLocaleTimeString()}</div>
          <div className="wm2-time-bottom">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* At-a-glance strip */}
      <div className="wm2-kpis">
        <div className="wm2-kpi">
          <div className="wm2-kpi-label">AUM</div>
          <div className="wm2-kpi-value">{formatCurrency(dashboardData.aum.total)}</div>
          <div className={`wm2-kpi-delta ${dashboardData.aum.changeType === 'positive' ? 'is-pos' : 'is-neg'}`}>
            {dashboardData.aum.changeType === 'positive' ? '▲' : '▼'} {dashboardData.aum.change}% MoM
          </div>
        </div>
        <div className="wm2-kpi">
          <div className="wm2-kpi-label">Clients</div>
          <div className="wm2-kpi-value">{formatNumber(dashboardData.clients.total)}</div>
          <div className="wm2-kpi-meta">
            <span>{formatNumber(dashboardData.clients.active)} active</span>
            <span className="wm2-pill">+{dashboardData.clients.new} new</span>
          </div>
        </div>
        <div className="wm2-kpi">
          <div className="wm2-kpi-label">Funds</div>
          <div className="wm2-kpi-value">{formatNumber(dashboardData.funds.active)}</div>
          <div className="wm2-kpi-meta">
            <span>{formatNumber(dashboardData.funds.total)} total</span>
            <span className="wm2-pill">{dashboardData.funds.topPerformer}</span>
          </div>
        </div>
        <div className="wm2-kpi">
          <div className="wm2-kpi-label">Today</div>
          <div className="wm2-kpi-value">{formatNumber(dashboardData.transactions.today)}</div>
          <div className="wm2-kpi-meta">
            <span>{formatCurrency(dashboardData.transactions.value)} value</span>
            <span className="wm2-pill">{dashboardData.transactions.pending} pending</span>
          </div>
        </div>
      </div>

      {/* Editorial grid */}
      <div className="wm2-grid">
        <div className="wm2-card wm2-span-2">
          <div className="wm2-card-head">
            <div className="wm2-card-title">NAV trend</div>
            <select className="wm2-select" defaultValue="Last 5 Days">
              <option>Last 5 Days</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="wm2-bars">
            {dashboardData.navTrend.map((point, index) => {
              const maxValue = Math.max(...dashboardData.navTrend.map((p) => p.value));
              const height = (point.value / maxValue) * 100;
              const isLast = index === dashboardData.navTrend.length - 1;
              return (
                <div key={index} className="wm2-bar-col">
                  <div className={`wm2-bar ${isLast ? 'is-accent' : ''}`} style={{ height: `${height}%` }} />
                  <div className="wm2-bar-label">{point.date}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="wm2-card">
          <div className="wm2-card-head">
            <div className="wm2-card-title">Top funds</div>
            <div className="wm2-muted">by weekly return</div>
          </div>
          <div className="wm2-list">
            {dashboardData.topFunds.slice(0, 5).map((fund, index) => (
              <div key={index} className="wm2-row">
                <div className="wm2-rank">{index + 1}</div>
                <div className="wm2-row-main">
                  <div className="wm2-row-title">{fund.name}</div>
                  <div className="wm2-row-sub">{fund.category}</div>
                </div>
                <div className="wm2-row-right">
                  <div className="wm2-row-metric">NAV {fund.nav.toFixed(2)}</div>
                  <div className={`wm2-row-delta ${fund.change >= 0 ? 'is-pos' : 'is-neg'}`}>
                    {fund.change >= 0 ? '▲' : '▼'} {fund.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wm2-card">
          <div className="wm2-card-head">
            <div className="wm2-card-title">Allocation</div>
            <div className="wm2-muted">asset mix</div>
          </div>
          <div className="wm2-alloc">
            {dashboardData.portfolioAllocation.map((item, index) => (
              <div key={index} className="wm2-alloc-row">
                <div className="wm2-alloc-top">
                  <div className="wm2-alloc-name">{item.category}</div>
                  <div className="wm2-alloc-pct">{item.percentage}%</div>
                </div>
                <div className="wm2-alloc-track">
                  <div className="wm2-alloc-fill" style={{ width: `${item.percentage}%` }} />
                </div>
                <div className="wm2-alloc-val">{formatCurrency(item.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="wm2-card wm2-span-2">
          <div className="wm2-card-head">
            <div className="wm2-card-title">Recent activity</div>
            <button className="wm2-link" type="button">
              View all
            </button>
          </div>
          <div className="wm2-table">
            {dashboardData.recentTransactions.map((t) => (
              <div key={t.id} className="wm2-trow">
                <div className="wm2-tmain">
                  <div className="wm2-tname">{t.client}</div>
                  <div className="wm2-tsub">
                    {t.type} • {t.fund} • {formatNumber(t.units)} units
                  </div>
                </div>
                <div className="wm2-tright">
                  <div className="wm2-tamt">{formatCurrency(t.amount)}</div>
                  <div className="wm2-tmeta">
                    <span className={`wm2-status ${t.status.toLowerCase() === 'completed' ? 'is-ok' : 'is-warn'}`}>
                      {t.status}
                    </span>
                    <span className="wm2-dot">•</span>
                    <span className="wm2-muted">{t.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthManagerDashboard;
