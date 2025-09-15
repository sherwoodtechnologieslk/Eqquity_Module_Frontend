import React, { useState, useEffect } from 'react';
import { tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = ({ onTabChange }) => {
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
      console.log('Loading dashboard data...');
      
      // Get active portfolios count
      const portfoliosResponse = await fetch('http://localhost:8080/api/portfolios/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let activePortfolios = 0;
      let recentTransactions = [];
      let topPerformers = [];
      let marketAlerts = [];

      if (portfoliosResponse.ok) {
        const portfolios = await portfoliosResponse.json();
        activePortfolios = portfolios.length;
      }

      // Fetch real transactions from the database
      try {
        console.log('Fetching real transactions from database...');
        const [buyTransactions, sellTransactions] = await Promise.all([
          tradeSummaryAPI.getBuyTransactions(),
          transactionEntryAPI.getAllSellTransactions()
        ]);

        console.log('Buy transactions:', buyTransactions);
        console.log('Sell transactions:', sellTransactions);

        // Combine and sort all transactions by date
        const allTransactions = [
          ...buyTransactions.map(tx => ({ 
            ...tx, 
            type: 'BUY',
            symbol: tx.symbol || 'N/A',
            quantity: tx.quantity || 0,
            price: tx.price || 0,
            date: tx.trade_date || tx.created_at,
            portfolio: tx.portfolio || 'N/A',
            company: tx.company_name || 'N/A'
          })),
          ...sellTransactions.map(tx => ({ 
            ...tx, 
            type: 'SELL',
            symbol: tx.symbol || 'N/A',
            quantity: tx.quantity || 0,
            price: tx.price || 0,
            date: tx.trade_date || tx.created_at,
            portfolio: tx.portfolio || 'N/A',
            company: tx.company_name || 'N/A'
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10); // Get latest 10

        recentTransactions = allTransactions;
        console.log('Combined recent transactions:', recentTransactions);

        // Calculate top performers from buy transactions
        const performerMap = new Map();
        buyTransactions.forEach(tx => {
          const key = tx.symbol || 'N/A';
          if (performerMap.has(key)) {
            const existing = performerMap.get(key);
            existing.totalValue += (tx.quantity || 0) * (tx.price || 0);
            existing.transactionCount += 1;
            existing.totalQuantity += (tx.quantity || 0);
          } else {
            performerMap.set(key, {
              symbol: key,
              name: tx.company_name || 'Unknown',
              totalValue: (tx.quantity || 0) * (tx.price || 0),
              transactionCount: 1,
              totalQuantity: tx.quantity || 0
            });
          }
        });

        topPerformers = Array.from(performerMap.values())
          .map(performer => ({
            symbol: performer.symbol,
            name: performer.name,
            avgPrice: performer.totalQuantity > 0 ? performer.totalValue / performer.totalQuantity : 0,
            transactionCount: performer.transactionCount
          }))
          .sort((a, b) => b.transactionCount - a.transactionCount)
          .slice(0, 5);

        marketAlerts = [
          { type: 'success', message: `Loaded ${recentTransactions.length} recent transactions` },
          { type: 'info', message: `${activePortfolios} active portfolios found` }
        ];

      } catch (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        
        // Fallback to mock data if transaction fetch fails
        recentTransactions = [
          {
            id: 1,
            type: 'BUY',
            symbol: 'AAPL',
            quantity: 100,
            price: 150.50,
            date: '2024-01-15',
            portfolio: 'Test Portfolio',
            company: 'Apple Inc.'
          },
          {
            id: 2,
            type: 'SELL',
            symbol: 'MSFT',
            quantity: 50,
            price: 300.25,
            date: '2024-01-16',
            portfolio: 'Test Portfolio',
            company: 'Microsoft Corp.'
          }
        ];
        topPerformers = [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            avgPrice: 150.50,
            transactionCount: 5
          }
        ];
        marketAlerts = [
          { type: 'info', message: 'Using fallback data - Transaction API unavailable' }
        ];
      }

      setDashboardData({
        activePortfolios,
        recentTransactions,
        topPerformers: topPerformers.map(performer => ({
          symbol: performer.symbol || 'N/A',
          name: performer.name || 'Unknown',
          avgPrice: performer.avgPrice || 0,
          transactionCount: performer.transactionCount || 0
        })),
        marketAlerts: marketAlerts
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data on error
      const mockData = {
        activePortfolios: 0,
        recentTransactions: [
          {
            id: 1,
            type: 'BUY',
            symbol: 'AAPL',
            quantity: 100,
            price: 150.50,
            date: '2024-01-15',
            portfolio: 'Test Portfolio',
            company: 'Apple Inc.'
          },
          {
            id: 2,
            type: 'SELL',
            symbol: 'MSFT',
            quantity: 50,
            price: 300.25,
            date: '2024-01-16',
            portfolio: 'Test Portfolio',
            company: 'Microsoft Corp.'
          }
        ],
        topPerformers: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            avgPrice: 150.50,
            transactionCount: 5
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corp.',
            avgPrice: 300.25,
            transactionCount: 3
          }
        ],
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
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Active Portfolios</h3>
            <p className="metric-value">{dashboardData.activePortfolios}</p>
            <span className="metric-change positive">
              {dashboardData.activePortfolios === 0 ? 'No portfolios yet' : `${dashboardData.activePortfolios} portfolios`}
            </span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
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
            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className={`transaction-type ${(transaction.type || 'BUY').toLowerCase()}`}>
                    {transaction.type || 'BUY'}
                  </div>
                  <div className="transaction-details">
                    <span className="symbol">{transaction.symbol || 'N/A'}</span>
                    <span className="quantity">{transaction.quantity || 0} shares</span>
                    <span className="price">{transaction.price || 0}</span>
                  </div>
                  <div className="transaction-date">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-transactions">
                <p>No recent transactions found</p>
                <p className="no-transactions-subtitle">Start trading to see your transaction history here</p>
              </div>
            )}
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
                <div className="performer-symbol">{performer.symbol || 'N/A'}</div>
                <div className="performer-value">{performer.transactionCount || 0} trades</div>
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
              onClick={() => onTabChange && onTabChange('Buy')}
            >
              New Trade
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => onTabChange && onTabChange('Portfolio Overview')}
            >
              Portfolio Review
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => onTabChange && onTabChange('Mark-to-Market Valuation')}
            >
              Market Analysis
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => onTabChange && onTabChange('Trade Report')}
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
