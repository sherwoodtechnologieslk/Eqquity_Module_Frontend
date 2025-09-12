import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    activePortfolios: 0,
    recentTransactions: [],
    topPerformers: [],
    marketAlerts: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API calls
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Use the same API as Buy Transaction Entry to get active portfolios
      const portfoliosResponse = await fetch('http://localhost:8080/api/portfolios/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (portfoliosResponse.ok) {
        const portfolios = await portfoliosResponse.json();
        setDashboardData({
          activePortfolios: portfolios.length,
          recentTransactions: [],
          topPerformers: [],
          marketAlerts: [
            { type: 'info', message: `${portfolios.length} active portfolios found` },
            { type: 'success', message: 'System is running normally' }
          ]
        });
      } else {
        // Fallback to mock data if API fails
        const mockData = {
          activePortfolios: 0,
          recentTransactions: [],
          topPerformers: [],
          marketAlerts: [
            { type: 'info', message: 'No active portfolios found. Create your first portfolio to get started.' },
            { type: 'success', message: 'System is running normally' }
          ]
        };
        setDashboardData(mockData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data on error
      const mockData = {
        activePortfolios: 0,
        recentTransactions: [],
        topPerformers: [],
        marketAlerts: [
          { type: 'info', message: 'No active portfolios found. Create your first portfolio to get started.' },
          { type: 'success', message: 'System is running normally' }
        ]
      };
      setDashboardData(mockData);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-content">
          <div className="welcome-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="welcome-text">
            <h1>Welcome to Equity Module</h1>
            <p className="welcome-subtitle">Professional Portfolio Management Dashboard</p>
          </div>
        </div>
        <div className="welcome-decoration">
          <div className="decoration-dot"></div>
          <div className="decoration-dot"></div>
          <div className="decoration-dot"></div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card primary">
          <div className="metric-icon"></div>
          <div className="metric-content">
            <h3>Active Portfolios</h3>
            <p className="metric-value">{dashboardData.activePortfolios}</p>
            <span className="metric-change positive">
              {dashboardData.activePortfolios === 0 ? 'No portfolios yet' : `${dashboardData.activePortfolios} portfolios`}
            </span>
          </div>
        </div>



        <div className="metric-card warning">
          <div className="metric-icon"></div>
          <div className="metric-content">
            <h3>Market Status</h3>
            <p className="metric-value">Open</p>
            <span className="metric-change">Trading normally</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="transactions-list">
            {dashboardData.recentTransactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className={`transaction-type ${transaction.type.toLowerCase()}`}>
                  {transaction.type}
                </div>
                <div className="transaction-details">
                  <span className="symbol">{transaction.symbol}</span>
                  <span className="quantity">{transaction.quantity} shares</span>
                  <span className="price">${transaction.price}</span>
                </div>
                <div className="transaction-date">{transaction.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Top Performers</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="performers-list">
            {dashboardData.topPerformers.map((performer, index) => (
              <div key={index} className="performer-item">
                <div className="performer-rank">{index + 1}</div>
                <div className="performer-symbol">{performer.symbol}</div>
                <div className="performer-return positive">+{performer.return}%</div>
                <div className="performer-value">${performer.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Alerts */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Market Alerts</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="alerts-list">
            {dashboardData.marketAlerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <div className="alert-icon">
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button 
              className="action-btn primary"
              onClick={() => window.location.href = '/#/buy'}
            >
              New Trade
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/#/portfolio'}
            >
              Portfolio Review
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/#/valuation'}
            >
              Market Analysis
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/#/reports'}
            >
              Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
