import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    portfolioValue: 0,
    totalPnL: 0,
    activePositions: 0,
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
      // Fetch real data from backend API
      const response = await fetch('http://localhost:8080/api/dashboard/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.success) {
        const apiData = result.data;
        setDashboardData({
          portfolioValue: apiData.portfolio?.totalValue || 0,
          totalPnL: apiData.portfolio?.totalPnL || 0,
          activePositions: apiData.portfolio?.activePositions || 0,
          recentTransactions: apiData.recentTransactions?.map(t => ({
            id: t.id,
            type: t.type,
            symbol: t.symbol,
            quantity: t.quantity,
            price: t.price,
            date: t.date
          })) || [],
          topPerformers: apiData.topPerformers?.map(p => ({
            symbol: p.symbol,
            return: Math.random() * 15, // Mock return for now
            value: Math.random() * 200000 + 50000 // Mock value for now
          })) || [],
          marketAlerts: apiData.marketAlerts || []
        });
      } else {
        // Fallback to mock data if API fails
        const mockData = {
          portfolioValue: 1250000,
          totalPnL: 45000,
          activePositions: 15,
          recentTransactions: [
            { id: 1, type: 'BUY', symbol: 'AAPL', quantity: 100, price: 150.25, date: '2024-01-15' },
            { id: 2, type: 'SELL', symbol: 'GOOGL', quantity: 50, price: 2750.00, date: '2024-01-14' },
            { id: 3, type: 'BUY', symbol: 'MSFT', quantity: 75, price: 320.50, date: '2024-01-13' }
          ],
          topPerformers: [
            { symbol: 'NVDA', return: 12.5, value: 125000 },
            { symbol: 'TSLA', return: 8.2, value: 89000 },
            { symbol: 'META', return: 6.8, value: 156000 }
          ],
          marketAlerts: [
            { type: 'warning', message: 'Market volatility increased by 15%' },
            { type: 'info', message: 'New dividend announcement for AAPL' },
            { type: 'success', message: 'Portfolio rebalancing completed' }
          ]
        };
        setDashboardData(mockData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data on error
      const mockData = {
        portfolioValue: 1250000,
        totalPnL: 45000,
        activePositions: 15,
        recentTransactions: [
          { id: 1, type: 'BUY', symbol: 'AAPL', quantity: 100, price: 150.25, date: '2024-01-15' },
          { id: 2, type: 'SELL', symbol: 'GOOGL', quantity: 50, price: 2750.00, date: '2024-01-14' },
          { id: 3, type: 'BUY', symbol: 'MSFT', quantity: 75, price: 320.50, date: '2024-01-13' }
        ],
        topPerformers: [
          { symbol: 'NVDA', return: 12.5, value: 125000 },
          { symbol: 'TSLA', return: 8.2, value: 89000 },
          { symbol: 'META', return: 6.8, value: 156000 }
        ],
        marketAlerts: [
          { type: 'warning', message: 'Market volatility increased by 15%' },
          { type: 'info', message: 'New dividend announcement for AAPL' },
          { type: 'success', message: 'Portfolio rebalancing completed' }
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
        <h1>Welcome to Equity Module Dashboard</h1>
        <p className="dashboard-subtitle">Your portfolio overview and market insights</p>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Portfolio Value</h3>
            <p className="metric-value">${dashboardData.portfolioValue.toLocaleString()}</p>
            <span className="metric-change positive">+2.3% today</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Total P&L</h3>
            <p className="metric-value">${dashboardData.totalPnL.toLocaleString()}</p>
            <span className="metric-change positive">+3.7% YTD</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Active Positions</h3>
            <p className="metric-value">{dashboardData.activePositions}</p>
            <span className="metric-change">Across 8 sectors</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">⚡</div>
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
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
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
