import React, { useState, useEffect } from 'react';
import './Styles/AccountBalanceSetup.css';
import { chartOfAccountsAPI } from '../../services/api';

const AccountBalanceSetup = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccountType, setFilterAccountType] = useState('All');
  const [filterBalanceType, setFilterBalanceType] = useState('All');
  const [editingAccount, setEditingAccount] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, filterAccountType, filterBalanceType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await chartOfAccountsAPI.getAll();
      setAccounts(data || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts. Please try again.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = [...accounts];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.account_code?.toLowerCase().includes(searchLower) ||
        account.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by account type
    if (filterAccountType !== 'All') {
      filtered = filtered.filter(account =>
        account.account_type?.toLowerCase() === filterAccountType.toLowerCase()
      );
    }

    // Filter by balance type
    if (filterBalanceType !== 'All') {
      filtered = filtered.filter(account =>
        account.normal_balance?.toLowerCase() === filterBalanceType.toLowerCase()
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setEditFormData({
      normalBalance: account.normal_balance || 'Debit',
      activeStatus: account.active_status || 'Yes'
    });
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditFormData({});
  };

  const handleSave = async (accountId) => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      // Call the API to update account
      const response = await chartOfAccountsAPI.update(accountId, {
        normal_balance: editFormData.normalBalance,
        active_status: editFormData.activeStatus
      });

      if (response.success || response) {
        // Update local state
        setAccounts(prevAccounts =>
          prevAccounts.map(acc =>
            acc.id === accountId
              ? { ...acc, normal_balance: editFormData.normalBalance, active_status: editFormData.activeStatus }
              : acc
          )
        );

        setSuccess('Account balance settings updated successfully!');
        setEditingAccount(null);
        setEditFormData({});

        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.error || 'Failed to update account');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.message || 'Failed to update account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAccountTypeColor = (accountType) => {
    const colors = {
      asset: '#3b82f6',
      liability: '#f59e0b',
      equity: '#10b981',
      revenue: '#8b5cf6',
      expense: '#ef4444'
    };
    return colors[accountType?.toLowerCase()] || '#6b7280';
  };

  const getBalanceTypeBadge = (balanceType) => {
    const isDebit = balanceType?.toLowerCase() === 'debit';
    return (
      <span className={`balance-badge ${isDebit ? 'debit-badge' : 'credit-badge'}`}>
        {balanceType || 'Not Set'}
      </span>
    );
  };

  const debitCount = accounts.filter(a => a.normal_balance?.toLowerCase() === 'debit').length;
  const creditCount = accounts.filter(a => a.normal_balance?.toLowerCase() === 'credit').length;
  const activeCount = accounts.filter(a => a.active_status === 'Yes').length;

  return (
    <div className="account-balance-setup-container">
      <div className="account-balance-setup-content-wrapper">
      {/* Toolbar */}
      <header className="account-balance-setup-header-section">
        <div className="account-balance-setup-header-left">
          <div className="account-balance-setup-header-text-group">
            <h1 className="account-balance-setup-main-title">Account Balance Setup</h1>
            <p className="account-balance-setup-subtitle">Configure debit/credit balance types for your GL accounts</p>
          </div>
        </div>
        <div className="account-balance-setup-header-actions">
          <button
            type="button"
            className="account-balance-setup-refresh-btn"
            onClick={loadAccounts}
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
      <section className="account-balance-setup-kpis" aria-label="Account summary">
        <div className="abs-kpi abs-kpi--total">
          <div className="abs-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6h4v6m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="abs-kpi__body">
            <span className="abs-kpi__value">{accounts.length}</span>
            <span className="abs-kpi__label">Total Accounts</span>
          </div>
        </div>
        <div className="abs-kpi abs-kpi--debit">
          <div className="abs-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div className="abs-kpi__body">
            <span className="abs-kpi__value">{debitCount}</span>
            <span className="abs-kpi__label">Debit Accounts</span>
          </div>
        </div>
        <div className="abs-kpi abs-kpi--credit">
          <div className="abs-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div className="abs-kpi__body">
            <span className="abs-kpi__value">{creditCount}</span>
            <span className="abs-kpi__label">Credit Accounts</span>
          </div>
        </div>
        <div className="abs-kpi abs-kpi--active">
          <div className="abs-kpi__icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="abs-kpi__body">
            <span className="abs-kpi__value">{activeCount}</span>
            <span className="abs-kpi__label">Active Accounts</span>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {success && (
        <div className="account-balance-setup-success-message">
          <svg className="success-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>{success}</span>
          <button className="success-close-btn" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="account-balance-setup-error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
          <button className="error-close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Data Card */}
      <div className="account-balance-setup-data-card">
        {/* Search and Filter Section */}
        <div className="account-balance-setup-search-container">
          <div className="account-balance-setup-search-wrapper">
            <input
              type="text"
              className="account-balance-setup-search-input"
              placeholder="Search by account code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="account-balance-setup-filters">
            <div className="filter-group">
              <label htmlFor="filterAccountType" className="filter-label">Account Type:</label>
              <select
                id="filterAccountType"
                className="filter-select"
                value={filterAccountType}
                onChange={(e) => setFilterAccountType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="filterBalanceType" className="filter-label">Balance Type:</label>
              <select
                id="filterBalanceType"
                className="filter-select"
                value={filterBalanceType}
                onChange={(e) => setFilterBalanceType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            
            <button
              className="filter-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterAccountType('All');
                setFilterBalanceType('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="account-balance-setup-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <h3>No Accounts Found</h3>
              <p>{searchTerm || filterAccountType !== 'All' || filterBalanceType !== 'All'
                ? 'Try adjusting your search or filters.' 
                : 'No accounts available.'}</p>
            </div>
          ) : (
            <>
              <div className="accounts-grid">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className={`account-card ${editingAccount?.id === account.id ? 'editing' : ''}`}>
                    <div className="account-card-header">
                      <div className="account-card-title-section">
                        <div className="account-code-display">
                          <span className="code-text">{account.account_code}</span>
                        </div>
                        <h3 className="account-name-display">{account.description}</h3>
                      </div>
                      {editingAccount?.id !== account.id && (
                        <button
                          className="card-edit-btn"
                          onClick={() => handleEdit(account)}
                          title="Edit Balance Type"
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="account-card-body">
                      {editingAccount?.id === account.id ? (
                        <div className="edit-mode">
                          <div className="form-field-group">
                            <label className="field-label">Account Type</label>
                            <span 
                              className="account-type-badge"
                              style={{ backgroundColor: getAccountTypeColor(account.account_type) + '20', color: getAccountTypeColor(account.account_type) }}
                            >
                              {account.account_type || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="form-field-group">
                            <label className="field-label" htmlFor={`balance-${account.id}`}>
                              Balance Type <span className="required">*</span>
                            </label>
                            <select
                              id={`balance-${account.id}`}
                              name="normalBalance"
                              className="edit-select"
                              value={editFormData.normalBalance}
                              onChange={handleInputChange}
                            >
                              <option value="Debit">Debit</option>
                              <option value="Credit">Credit</option>
                            </select>
                          </div>

                          <div className="form-field-group">
                            <label className="field-label" htmlFor={`status-${account.id}`}>
                              Status <span className="required">*</span>
                            </label>
                            <select
                              id={`status-${account.id}`}
                              name="activeStatus"
                              className="edit-select"
                              value={editFormData.activeStatus}
                              onChange={handleInputChange}
                            >
                              <option value="Yes">Active</option>
                              <option value="No">Inactive</option>
                            </select>
                          </div>

                          <div className="card-action-buttons">
                            <button
                              className="card-btn save-btn"
                              onClick={() => handleSave(account.id)}
                              disabled={isSaving}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              Save
                            </button>
                            <button
                              className="card-btn cancel-btn"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                              </svg>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="view-mode">
                          <div className="info-row">
                            <span className="info-label">Account Type:</span>
                            <span 
                              className="account-type-badge"
                              style={{ backgroundColor: getAccountTypeColor(account.account_type) + '20', color: getAccountTypeColor(account.account_type) }}
                            >
                              {account.account_type || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="info-row">
                            <span className="info-label">Balance Type:</span>
                            {getBalanceTypeBadge(account.normal_balance)}
                          </div>
                          
                          <div className="info-row">
                            <span className="info-label">Status:</span>
                            <span className={`status-badge ${account.active_status === 'Yes' ? 'active' : 'inactive'}`}>
                              {account.active_status === 'Yes' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="table-summary">
                <p>
                  Showing <strong>{filteredAccounts.length}</strong> of <strong>{accounts.length}</strong> account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AccountBalanceSetup;

