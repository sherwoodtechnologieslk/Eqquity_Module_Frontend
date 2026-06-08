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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries`, {
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

  const balancedCount = entries.filter(g => calculateTotals(g).isBalanced).length;
  const unbalancedCount = entries.length - balancedCount;
  const totalDebitValue = entries.reduce((sum, g) => sum + calculateTotals(g).totalDebit, 0);

  return (
    <div className="double-entries-container">
      <div className="double-entries-content-wrapper">
      {/* Toolbar */}
      <header className="double-entries-header-section">
        <div className="double-entries-header-left">
          <div className="double-entries-header-text-group">
            <h1 className="double-entries-main-title">Double Entries</h1>
            <p className="double-entries-subtitle">View all double-entry accounting transactions with matching debits and credits</p>
          </div>
        </div>
        <div className="double-entries-header-actions">
          <button
            type="button"
            className="double-entries-refresh-btn"
            onClick={loadDoubleEntries}
            disabled={loading}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* KPI Summary */}
      <section className="double-entries-kpis" aria-label="Double entries summary">
        <div className="de-kpi de-kpi--total">
          <div className="de-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6h4v6m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="de-kpi__body">
            <span className="de-kpi__value">{entries.length}</span>
            <span className="de-kpi__label">Transactions</span>
          </div>
        </div>
        <div className="de-kpi de-kpi--balanced">
          <div className="de-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="de-kpi__body">
            <span className="de-kpi__value">{balancedCount}</span>
            <span className="de-kpi__label">Balanced</span>
          </div>
        </div>
        <div className="de-kpi de-kpi--unbalanced">
          <div className="de-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="de-kpi__body">
            <span className="de-kpi__value">{unbalancedCount}</span>
            <span className="de-kpi__label">Unbalanced</span>
          </div>
        </div>
        <div className="de-kpi de-kpi--value">
          <div className="de-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="de-kpi__body">
            <span className="de-kpi__value">{formatCurrency(totalDebitValue)}</span>
            <span className="de-kpi__label">Total Value</span>
          </div>
        </div>
      </section>

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
    </div>
  );
};

export default DoubleEntries;

