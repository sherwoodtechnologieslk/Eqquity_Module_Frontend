import React, { useState, useEffect } from 'react';
import './Styles/DoubleEntries.css';

const DoubleEntries = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  useEffect(() => {
    loadDoubleEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, filterDate, filterAccount]);

  const loadDoubleEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Group entries by transaction/reference to show double entries
          const groupedEntries = groupByTransaction(result.data);
          setEntries(groupedEntries);
        } else {
          throw new Error(result.error || 'Failed to load entries');
        }
      } else {
        throw new Error('Failed to load double entries');
      }
    } catch (err) {
      console.error('Error loading double entries:', err);
      setError(err.message || 'Failed to load double entries. Please try again.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const groupByTransaction = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const key = entry.reference || entry.transaction_id || entry.id;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          date: entry.date || entry.transaction_date,
          reference: entry.reference || '',
          description: entry.description || '',
          entries: []
        };
      }
      grouped[key].entries.push(entry);
    });
    return Object.values(grouped);
  };

  const filterEntries = () => {
    let filtered = [...entries];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(group =>
        group.reference?.toLowerCase().includes(searchLower) ||
        group.description?.toLowerCase().includes(searchLower) ||
        group.entries.some(e => 
          e.account_code?.toLowerCase().includes(searchLower) ||
          e.account_name?.toLowerCase().includes(searchLower)
        )
      );
    }

    if (filterDate) {
      filtered = filtered.filter(group => group.date === filterDate);
    }

    if (filterAccount.trim()) {
      const accountLower = filterAccount.toLowerCase();
      filtered = filtered.filter(group =>
        group.entries.some(e =>
          e.account_code?.toLowerCase().includes(accountLower) ||
          e.account_name?.toLowerCase().includes(accountLower)
        )
      );
    }

    setFilteredEntries(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotals = (group) => {
    const totalDebit = group.entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = group.entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };

  return (
    <div className="double-entries-container">
      {/* Header Section */}
      <div className="double-entries-header-section">
        <div className="double-entries-header-icon">
          <svg className="double-entries-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
            <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
          </svg>
        </div>
        <div className="double-entries-header-text-group">
          <h1 className="double-entries-main-title">Double Entries</h1>
          <p className="double-entries-subtitle">View all double-entry accounting transactions with matching debits and credits</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="double-entries-error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
          <button className="error-close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Data Card */}
      <div className="double-entries-data-card">
        {/* Search and Filter Section */}
        <div className="double-entries-search-container">
          <div className="double-entries-search-wrapper">
            <input
              type="text"
              className="double-entries-search-input"
              placeholder="Search by reference, description, or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="double-entries-filters">
            <div className="filter-group">
              <label htmlFor="filterDate" className="filter-label">Date:</label>
              <input
                type="date"
                id="filterDate"
                className="filter-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="filterAccount" className="filter-label">Account:</label>
              <input
                type="text"
                id="filterAccount"
                className="filter-input"
                placeholder="Account code or name"
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
              />
            </div>
            
            <button
              className="filter-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
                setFilterAccount('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Entries Section */}
        <div className="double-entries-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading double entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
              </svg>
              <h3>No Double Entries Found</h3>
              <p>{searchTerm || filterDate || filterAccount
                ? 'Try adjusting your search or filters.' 
                : 'No double entries have been recorded yet.'}</p>
            </div>
          ) : (
            <div className="double-entries-list">
              {filteredEntries.map((group) => {
                const totals = calculateTotals(group);
                return (
                  <div key={group.id} className="double-entry-group">
                    <div className="entry-group-header">
                      <div className="entry-group-info">
                        <div className="entry-group-date">{formatDate(group.date)}</div>
                        <div className="entry-group-reference">
                          <strong>Reference:</strong> {group.reference || 'N/A'}
                        </div>
                        <div className="entry-group-description">{group.description || 'No description'}</div>
                      </div>
                      <div className="entry-group-totals">
                        <div className={`balance-indicator ${totals.isBalanced ? 'balanced' : 'unbalanced'}`}>
                          {totals.isBalanced ? (
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                          ) : (
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                          )}
                          <span>{totals.isBalanced ? 'Balanced' : 'Unbalanced'}</span>
                        </div>
                        <div className="total-amounts">
                          <div className="total-debit">
                            <span className="total-label">Total Debit:</span>
                            <span className="total-value">{formatCurrency(totals.totalDebit)}</span>
                          </div>
                          <div className="total-credit">
                            <span className="total-label">Total Credit:</span>
                            <span className="total-value">{formatCurrency(totals.totalCredit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="entry-group-table">
                      <table className="double-entry-table">
                        <thead>
                          <tr>
                            <th>Account Code</th>
                            <th>Account Name</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((entry, idx) => (
                            <tr key={entry.id || idx}>
                              <td className="account-code-cell">
                                <span className="code-text">{entry.account_code || '-'}</span>
                              </td>
                              <td>{entry.account_name || '-'}</td>
                              <td className="description-cell">{entry.description || '-'}</td>
                              <td className={parseFloat(entry.debit) > 0 ? 'debit-amount' : ''}>
                                {parseFloat(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                              </td>
                              <td className={parseFloat(entry.credit) > 0 ? 'credit-amount' : ''}>
                                {parseFloat(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="totals-row">
                            <td colSpan="3" className="totals-label">Total</td>
                            <td className="debit-amount total-amount">
                              {formatCurrency(totals.totalDebit)}
                            </td>
                            <td className="credit-amount total-amount">
                              {formatCurrency(totals.totalCredit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredEntries.length > 0 && (
          <div className="double-entries-summary">
            <p>
              Showing <strong>{filteredEntries.length}</strong> of <strong>{entries.length}</strong> transaction{entries.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleEntries;

