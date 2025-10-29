import React, { useEffect, useState } from 'react';
import { chartOfAccountsAPI } from '../../services/api';
import './Styles/ChartOfAccounts.css';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setLoading(true);
    chartOfAccountsAPI.getAll()
      .then(setAccounts)
      .catch(() => setError('Failed to load chart of accounts'))
      .finally(() => setLoading(false));
  };

  const handleEdit = (account) => {
    // TODO: Implement edit functionality
    console.log('Edit account:', account);
    // You can add navigation to edit form or open modal here
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(acc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acc.account_code?.toLowerCase().includes(searchLower) ||
      acc.description?.toLowerCase().includes(searchLower) ||
      acc.account_type?.toLowerCase().includes(searchLower)
    );
  });

  const activeCount = filteredAccounts.filter(acc => acc.active_status === 'Yes').length;
  const inactiveCount = filteredAccounts.length - activeCount;

  return (
    <div className="coa-page-container">
      {/* Header Section */}
      <div className="coa-header-section">
        <div className="coa-header-icon">
          <svg className="coa-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
            <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
          </svg>
        </div>
        <div className="coa-header-text-group">
          <h1 className="coa-main-title">Chart of Accounts</h1>
          <p className="coa-subtitle">View and manage your complete chart of accounts</p>
        </div>
      </div>

      {/* Data Display Card */}
      <div className="coa-data-card">
        <div className="coa-card-header">
          <h2 className="coa-card-title">Account Records ({accounts.length} total)</h2>
          <button 
            onClick={loadAccounts}
            className="coa-refresh-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="coa-search-container">
          <div className="coa-search-wrapper">
            <input
              type="text"
              className="coa-search-input"
              placeholder="Search by account code, description, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <div className="coa-search-results">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </div>
          )}
        </div>

        {/* Stats Section */}
        {accounts.length > 0 && (
          <div className="coa-stats">
            <div className="coa-stat">
              <div className="coa-stat-value">{accounts.length}</div>
              <div className="coa-stat-label">Total Accounts</div>
            </div>
            <div className="coa-stat">
              <div className="coa-stat-value">{activeCount}</div>
              <div className="coa-stat-label">Active</div>
            </div>
            <div className="coa-stat">
              <div className="coa-stat-value">{inactiveCount}</div>
              <div className="coa-stat-label">Inactive</div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="coa-table-container">
          {loading && (
            <div className="coa-loading">Loading chart of accounts...</div>
          )}
          
          {error && (
            <div className="coa-error">{error}</div>
          )}
          
          {!loading && !error && accounts.length === 0 && (
            <div className="coa-no-data">No accounts found in the database.</div>
          )}

          {!loading && !error && searchTerm && filteredAccounts.length === 0 && (
            <div className="coa-no-data">No accounts match your search criteria.</div>
          )}
          
          {!loading && !error && filteredAccounts.length > 0 && (
            <table className="coa-data-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Description</th>
                  <th>Active Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.id}>
                    <td className="coa-account-code">{acc.account_code}</td>
                    <td className="coa-description">{acc.description}</td>
                    <td>
                      <span className={`coa-active-status ${acc.active_status?.toLowerCase()}`}>
                        {acc.active_status}
                      </span>
                    </td>
                    <td>{new Date(acc.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(acc)}
                        className="coa-edit-btn"
                        title="Edit Account"
                      >
                        <svg className="coa-edit-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="coa-footer-section">
        <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Chart of Accounts Management • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default ChartOfAccounts;
