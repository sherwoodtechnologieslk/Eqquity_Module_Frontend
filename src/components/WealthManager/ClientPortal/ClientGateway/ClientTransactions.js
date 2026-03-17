import React, { useState } from 'react';
import './Styles/ClientTransactions.css';

const ClientTransactions = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = [
    { 
      id: 1, 
      date: '2024-01-15', 
      fund: 'Equity Growth Fund', 
      type: 'Purchase', 
      units: 5000, 
      nav: 25.45,
      amount: 125000, 
      status: 'Completed',
      transactionId: 'TXN-2024-001234'
    },
    { 
      id: 2, 
      date: '2024-01-10', 
      fund: 'Balanced Income Fund', 
      type: 'Redemption', 
      units: 2500, 
      nav: 18.92,
      amount: 62500, 
      status: 'Completed',
      transactionId: 'TXN-2024-001189'
    },
    { 
      id: 3, 
      date: '2024-01-05', 
      fund: 'Index Fund', 
      type: 'Purchase', 
      units: 3000, 
      nav: 32.15,
      amount: 96450, 
      status: 'Completed',
      transactionId: 'TXN-2024-001156'
    },
    { 
      id: 4, 
      date: '2024-01-02', 
      fund: 'Fixed Income Fund', 
      type: 'Switch', 
      units: 5000, 
      nav: 10.25,
      amount: 51250, 
      status: 'Completed',
      transactionId: 'TXN-2024-001123'
    },
    { 
      id: 5, 
      date: '2023-12-28', 
      fund: 'Money Market Fund', 
      type: 'Purchase', 
      units: 20000, 
      nav: 1.00,
      amount: 20000, 
      status: 'Completed',
      transactionId: 'TXN-2023-009876'
    },
    { 
      id: 6, 
      date: '2023-12-20', 
      fund: 'Equity Growth Fund', 
      type: 'Dividend', 
      units: 0, 
      nav: 0,
      amount: 15000, 
      status: 'Completed',
      transactionId: 'TXN-2023-009845'
    }
  ];

  const filteredTransactions = transactions.filter(txn => {
    const matchesType = filterType === 'all' || txn.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      txn.fund.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExport = () => {
    alert('Export functionality will be implemented with backend integration');
  };

  return (
    <div className="cp-transactions">
      <div className="cp-transactions-header">
        <h1>Transaction History</h1>
        <p>View all your investment transactions</p>
      </div>

      {/* Filters and Search */}
      <div className="cp-transactions-filters">
        <div className="cp-search-box">
          <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Search by fund name or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cp-search-input"
          />
        </div>
        <div className="cp-filter-group">
          <label>Transaction Type</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="cp-filter-select"
          >
            <option value="all">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="redemption">Redemption</option>
            <option value="switch">Switch</option>
            <option value="dividend">Dividend</option>
          </select>
        </div>
        <button className="cp-export-btn" onClick={handleExport}>
          <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Transactions Table */}
      <div className="cp-transactions-table-container">
        <table className="cp-transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Fund Name</th>
              <th>Type</th>
              <th>Units</th>
              <th>NAV</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td className="cp-txn-id">{transaction.transactionId}</td>
                  <td className="cp-fund-name">{transaction.fund}</td>
                  <td>
                    <span className={`cp-txn-type-badge ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.units > 0 ? transaction.units.toLocaleString() : '-'}</td>
                  <td>{transaction.nav > 0 ? transaction.nav.toFixed(2) : '-'}</td>
                  <td className="cp-amount">{transaction.amount.toLocaleString()}</td>
                  <td>
                    <span className={`cp-status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="cp-no-results">
                  No transactions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="cp-transactions-summary">
        <div className="cp-summary-item">
          <span className="cp-summary-label">Total Transactions:</span>
          <span className="cp-summary-value">{filteredTransactions.length}</span>
        </div>
        <div className="cp-summary-item">
          <span className="cp-summary-label">Total Amount:</span>
          <span className="cp-summary-value">
            {filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClientTransactions;
