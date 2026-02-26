import React from 'react';
import './Styles/ClientDashboard.css';

const ClientDashboard = () => {
  // Mock data for client dashboard
  const portfolioData = {
    totalValue: 2450000,
    change: 3.2,
    changeType: 'positive',
    totalFunds: 5,
    ytdReturn: 12.5
  };

  const holdings = [
    { fund: 'Equity Growth Fund', units: 50000, nav: 25.45, value: 1272500, allocation: 51.9, return: 12.5 },
    { fund: 'Balanced Income Fund', units: 30000, nav: 18.92, value: 567600, allocation: 23.2, return: 10.8 },
    { fund: 'Fixed Income Fund', units: 25000, nav: 10.25, value: 256250, allocation: 10.5, return: 6.5 },
    { fund: 'Index Fund', units: 15000, nav: 32.15, value: 482250, allocation: 19.7, return: 14.2 },
    { fund: 'Money Market Fund', units: 100000, nav: 1.00, value: 100000, allocation: 4.1, return: 4.2 }
  ];

  const recentTransactions = [
    { id: 1, date: '2024-01-15', fund: 'Equity Growth Fund', type: 'Purchase', units: 5000, amount: 125000, status: 'Completed' },
    { id: 2, date: '2024-01-10', fund: 'Balanced Income Fund', type: 'Redemption', units: 2500, amount: 62500, status: 'Completed' },
    { id: 3, date: '2024-01-05', fund: 'Index Fund', type: 'Purchase', units: 3000, amount: 96450, status: 'Completed' }
  ];

  const performanceData = [
    { period: '1M', return: 2.3 },
    { period: '3M', return: 5.2 },
    { period: '6M', return: 8.5 },
    { period: '1Y', return: 15.2 },
    { period: '3Y', return: 18.5 }
  ];

  return (
    <div className="cp-dashboard">
      <div className="cp-dashboard-header">
        <h1>Portfolio Overview</h1>
        <p>Welcome back! Here's your investment summary.</p>
      </div>

      {/* Summary Cards */}
      <div className="cp-summary-cards">
        <div className="cp-summary-card cp-card-primary">
          <div className="cp-card-icon">
            <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="cp-card-content">
            <div className="cp-card-label">Total Portfolio Value</div>
            <div className="cp-card-value">{portfolioData.totalValue.toLocaleString()}</div>
            <div className={`cp-card-change ${portfolioData.changeType}`}>
              {portfolioData.changeType === 'positive' ? '+' : ''}{portfolioData.change}%
            </div>
          </div>
        </div>

        <div className="cp-summary-card cp-card-secondary">
          <div className="cp-card-icon">
            <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="cp-card-content">
            <div className="cp-card-label">YTD Return</div>
            <div className="cp-card-value">{portfolioData.ytdReturn}%</div>
            <div className="cp-card-subtext">Year to date</div>
          </div>
        </div>

        <div className="cp-summary-card cp-card-tertiary">
          <div className="cp-card-icon">
            <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="cp-card-content">
            <div className="cp-card-label">Active Funds</div>
            <div className="cp-card-value">{portfolioData.totalFunds}</div>
            <div className="cp-card-subtext">Funds invested</div>
          </div>
        </div>
      </div>

      {/* Holdings and Performance */}
      <div className="cp-dashboard-grid">
        <div className="cp-holdings-section">
          <div className="cp-section-header">
            <h3>My Holdings</h3>
            <button className="cp-view-all-btn">View All</button>
          </div>
          <div className="cp-holdings-table">
            <table>
              <thead>
                <tr>
                  <th>Fund Name</th>
                  <th>Units</th>
                  <th>NAV</th>
                  <th>Value</th>
                  <th>Allocation</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <tr key={index}>
                    <td className="cp-fund-name">{holding.fund}</td>
                    <td>{holding.units.toLocaleString()}</td>
                    <td>{holding.nav.toFixed(2)}</td>
                    <td>{holding.value.toLocaleString()}</td>
                    <td>{holding.allocation}%</td>
                    <td className={`cp-return ${holding.return >= 0 ? 'positive' : 'negative'}`}>
                      {holding.return >= 0 ? '+' : ''}{holding.return}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cp-performance-section">
          <div className="cp-section-header">
            <h3>Performance Metrics</h3>
          </div>
          <div className="cp-performance-grid">
            {performanceData.map((item, index) => (
              <div key={index} className="cp-performance-card">
                <div className="cp-performance-period">{item.period}</div>
                <div className={`cp-performance-return ${item.return >= 0 ? 'positive' : 'negative'}`}>
                  {item.return >= 0 ? '+' : ''}{item.return}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="cp-transactions-section">
        <div className="cp-section-header">
          <h3>Recent Transactions</h3>
          <button className="cp-view-all-btn">View All</button>
        </div>
        <div className="cp-transactions-list">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="cp-transaction-item">
              <div className="cp-transaction-date">{transaction.date}</div>
              <div className="cp-transaction-fund">{transaction.fund}</div>
              <div className={`cp-transaction-type ${transaction.type.toLowerCase()}`}>
                {transaction.type}
              </div>
              <div className="cp-transaction-units">{transaction.units.toLocaleString()} units</div>
              <div className="cp-transaction-amount">{transaction.amount.toLocaleString()}</div>
              <div className={`cp-transaction-status ${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
