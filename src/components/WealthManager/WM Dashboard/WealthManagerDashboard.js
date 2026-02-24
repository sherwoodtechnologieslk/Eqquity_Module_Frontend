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
      {/* Header Section */}
      <div className="wm-dashboard-header">
        <div>
          <h1>Wealth Management Dashboard</h1>
          <p className="wm-dashboard-subtitle">Unit Trust Portfolio Overview</p>
        </div>
        <div className="wm-header-time">
          <div className="wm-time-display">{currentTime.toLocaleTimeString()}</div>
          <div className="wm-date-display">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="wm-metrics-grid">
        <div className="wm-metric-card wm-aum-card">
          <div className="wm-metric-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="wm-metric-content">
            <div className="wm-metric-label">Total AUM</div>
            <div className="wm-metric-value">{formatCurrency(dashboardData.aum.total)}</div>
            <div className={`wm-metric-change wm-${dashboardData.aum.changeType}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0L10 6H2L6 0Z"/>
              </svg>
              {dashboardData.aum.change}% vs last month
            </div>
          </div>
        </div>

        <div className="wm-metric-card wm-clients-card">
          <div className="wm-metric-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </div>
          <div className="wm-metric-content">
            <div className="wm-metric-label">Total Clients</div>
            <div className="wm-metric-value">{formatNumber(dashboardData.clients.total)}</div>
            <div className="wm-metric-sub-info">
              <span>{formatNumber(dashboardData.clients.active)} Active</span>
              <span className="wm-new-badge">+{dashboardData.clients.new} New</span>
            </div>
          </div>
        </div>

        <div className="wm-metric-card wm-funds-card">
          <div className="wm-metric-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="wm-metric-content">
            <div className="wm-metric-label">Active Funds</div>
            <div className="wm-metric-value">{dashboardData.funds.active}</div>
            <div className="wm-metric-sub-info">
              <span>of {dashboardData.funds.total} Total</span>
            </div>
          </div>
        </div>

        <div className="wm-metric-card wm-transactions-card">
          <div className="wm-metric-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" clipRule="evenodd"/>
              <path fillRule="evenodd" d="M14 4a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2h6zm-1 3a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="wm-metric-content">
            <div className="wm-metric-label">Today's Transactions</div>
            <div className="wm-metric-value">{formatNumber(dashboardData.transactions.today)}</div>
            <div className="wm-metric-sub-info">
              <span>{formatCurrency(dashboardData.transactions.value)} Value</span>
              <span className="wm-pending-badge">{dashboardData.transactions.pending} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="wm-dashboard-grid">
        {/* Left Column */}
        <div className="wm-dashboard-left">
          {/* NAV Trend Chart */}
          <div className="wm-dashboard-card">
            <div className="wm-card-header">
              <h3>NAV Trend (Last 5 Days)</h3>
              <select className="wm-period-select">
                <option>Last 5 Days</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="wm-nav-chart">
              <div className="wm-chart-container">
                {dashboardData.navTrend.map((point, index) => {
                  const maxValue = Math.max(...dashboardData.navTrend.map(p => p.value));
                  const height = (point.value / maxValue) * 100;
                  return (
                    <div key={index} className="wm-chart-bar-container">
                      <div className="wm-chart-bar" style={{ height: `${height}%` }}>
                        <div className="wm-bar-value">{point.value.toFixed(2)}</div>
                      </div>
                      <div className="wm-bar-label">{point.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Portfolio Allocation */}
          <div className="wm-dashboard-card">
            <div className="wm-card-header">
              <h3>Portfolio Allocation</h3>
            </div>
            <div className="wm-allocation-container">
              {dashboardData.portfolioAllocation.map((item, index) => (
                <div key={index} className="wm-allocation-item">
                  <div className="wm-allocation-header">
                    <span className="wm-allocation-category">{item.category}</span>
                    <span className="wm-allocation-percentage">{item.percentage}%</span>
                  </div>
                  <div className="wm-allocation-bar">
                    <div 
                      className="wm-allocation-fill" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="wm-allocation-value">{formatCurrency(item.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="wm-dashboard-right">
          {/* Top Performing Funds */}
          <div className="wm-dashboard-card">
            <div className="wm-card-header">
              <h3>Top Performing Funds</h3>
            </div>
            <div className="wm-funds-list">
              {dashboardData.topFunds.map((fund, index) => (
                <div key={index} className="wm-fund-item">
                  <div className="wm-fund-rank">#{index + 1}</div>
                  <div className="wm-fund-info">
                    <div className="wm-fund-name">{fund.name}</div>
                    <div className="wm-fund-category">{fund.category}</div>
                  </div>
                  <div className="wm-fund-nav">
                    <div className="wm-nav-value">NAV: {fund.nav.toFixed(2)}</div>
                    <div className="wm-nav-change wm-positive">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M5 0L9 6H1L5 0Z"/>
                      </svg>
                      {fund.change}%
                    </div>
                  </div>
                  <div className="wm-fund-aum">{formatCurrency(fund.aum)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="wm-dashboard-card">
            <div className="wm-card-header">
              <h3>Recent Transactions</h3>
              <button className="wm-view-all-btn">View All</button>
            </div>
            <div className="wm-transactions-list">
              {dashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="wm-transaction-item">
                  <div className="wm-transaction-icon">
                    {transaction.type === 'Purchase' && (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {transaction.type === 'Redemption' && (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {transaction.type === 'Switch' && (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm9.293-2.707a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 11H6a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <div className="wm-transaction-details">
                    <div className="wm-transaction-client">{transaction.client}</div>
                    <div className="wm-transaction-fund">{transaction.fund}</div>
                    <div className="wm-transaction-meta">
                      <span>{transaction.type}</span>
                      <span>•</span>
                      <span>{formatNumber(transaction.units)} Units</span>
                    </div>
                  </div>
                  <div className="wm-transaction-amount">
                    <div className="wm-amount-value">{formatCurrency(transaction.amount)}</div>
                    <div className={`wm-transaction-status wm-${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </div>
                    <div className="wm-transaction-time">{transaction.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthManagerDashboard;
