import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { chartOfAccountsAPI } from '../../services/api';
import './Styles/ChartOfAccounts.css';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [systemAccountsFromCSV, setSystemAccountsFromCSV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSystemAccounts, setLoadingSystemAccounts] = useState(false);
  const [importingSystemAccounts, setImportingSystemAccounts] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user', 'trading', or 'system'
  const [exportingSystemAccounts, setExportingSystemAccounts] = useState(false);

  // System-generated accounts (matching frontend labels)
  const systemAccounts = [
    {
      account_code: '131-101-350-001-44',
      description: 'Investment in Equity Securities',
      account_type: 'Asset',
      account_category: 'Current Assets',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '301-101-555-001-44',
      description: 'Capital Gains',
      account_type: 'Revenue',
      account_category: 'Other Income',
      normal_balance: 'Credit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-555-001-44',
      description: 'Capital Losses',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-001-44',
      description: 'Brokerage',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-002-44',
      description: 'CSE Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-003-44',
      description: 'SEC',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-004-44',
      description: 'CDS Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-005-44',
      description: 'Clearing Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '651-101-120-006-44',
      description: 'STL',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '249-101-270-001-44',
      description: 'Share Purchase Settlement Payable Control',
      account_type: 'Liability',
      account_category: 'Current Liabilities',
      normal_balance: 'Credit',
      active_status: 'Yes'
    },
    {
      account_code: '131-101-290-001-44',
      description: 'Share Sale Settlement Receivable Control',
      account_type: 'Asset',
      account_category: 'Current Assets',
      normal_balance: 'Debit',
      active_status: 'Yes'
    }
  ];

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemAccounts();
    }
  }, [activeTab]);

  const loadAccounts = () => {
    setLoading(true);
    chartOfAccountsAPI.getAll()
      .then(setAccounts)
      .catch(() => setError('Failed to load chart of accounts'))
      .finally(() => setLoading(false));
  };

  const loadSystemAccounts = () => {
    setLoadingSystemAccounts(true);
    chartOfAccountsAPI.getSystemAccounts()
      .then((data) => {
        console.log('System accounts loaded:', data.length);
        setSystemAccountsFromCSV(data);
      })
      .catch((err) => {
        console.error('Failed to load system accounts:', err);
        setSystemAccountsFromCSV([]);
        setError('Failed to load system accounts: ' + (err.message || 'Unknown error'));
      })
      .finally(() => setLoadingSystemAccounts(false));
  };

  const handleImportSystemAccounts = async () => {
    if (systemAccountsFromCSV.length === 0) {
      alert('No system accounts to import');
      return;
    }

    if (!window.confirm(`Are you sure you want to import ${systemAccountsFromCSV.length} system accounts to your chart of accounts?`)) {
      return;
    }

    setImportingSystemAccounts(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await chartOfAccountsAPI.importSystemAccounts();
      setSuccessMessage(`Successfully imported ${result.imported} system accounts!`);
      
      // Reload accounts to show the newly imported ones
      await loadAccounts();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Failed to import system accounts:', err);
      setError('Failed to import system accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setImportingSystemAccounts(false);
    }
  };

  const handleExportSystemAccounts = async () => {
    setExportingSystemAccounts(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token, authorization denied');
      }

      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${baseUrl}/chart-of-accounts/system-accounts/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        let msg = `Failed to export system accounts (HTTP ${response.status})`;
        try {
          const errJson = await response.json();
          msg = errJson?.error || errJson?.message || msg;
        } catch (e) {
          // ignore
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `system-accounts-${dateStamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export system accounts:', err);
      setError('Failed to export system accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingSystemAccounts(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setEditFormData({
      account_code: account.account_code || '',
      description: account.description || '',
      account_type: account.account_type || '',
      account_category: account.account_category || '',
      normal_balance: account.normal_balance || '',
      parent_account: account.parent_account || '',
      active_status: account.active_status || 'Yes'
    });
    setEditErrors({});
  };

  const handleCloseEdit = () => {
    setEditingAccount(null);
    setEditFormData({});
    setEditErrors({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.account_code?.trim()) {
      newErrors.account_code = 'Account Code is required';
    } else if (!/^\d+-\d+-\d+-\d+-\d+$/.test(editFormData.account_code)) {
      newErrors.account_code = 'Account Code must follow format: X-XX-XX-XX-XX';
    }

    if (!editFormData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (editFormData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await chartOfAccountsAPI.update(editingAccount.id, editFormData);
      // Reload accounts to show updated data
      await loadAccounts();
      handleCloseEdit();
    } catch (error) {
      console.error('Error updating account:', error);
      let errorMessage = 'Failed to update account. Please try again.';
      
      if (error.message && error.message.includes('409')) {
        errorMessage = 'An account with this code already exists. Please use a different account code.';
        setEditErrors({ account_code: errorMessage });
      } else if (error.message && error.message.includes('400')) {
        errorMessage = 'Invalid data. Please check your input.';
        setEditErrors({ account_code: errorMessage });
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Separate user accounts, trading accounts, and system accounts
  const userAccounts = accounts.filter(acc => acc.created_by_user);
  const systemAccountsInDB = accounts.filter(acc => !acc.created_by_user);

  // Determine which accounts to display based on active tab
  const displayAccounts = activeTab === 'user' 
    ? userAccounts 
    : activeTab === 'trading' 
    ? systemAccounts 
    : systemAccountsFromCSV;
  
  // Filter accounts based on search term
  const filteredAccounts = displayAccounts.filter(acc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acc.account_code?.toLowerCase().includes(searchLower) ||
      acc.description?.toLowerCase().includes(searchLower) ||
      acc.account_type?.toLowerCase().includes(searchLower)
    );
  });

  const activeCount = filteredAccounts.filter(acc => acc.active_status === 'Yes').length;
  const inactiveCount = filteredAccounts.length - activeCount;
  const accountTypeLabel =
    activeTab === 'user' ? 'user' :
    activeTab === 'trading' ? 'trading' :
    'system';

  return (
    <div className="coa-page-container">
      <div className="coa-content-wrapper">
      {/* Header Section */}
      <div className="coa-header-section">
        <div className="coa-header-text-group">
          <h1 className="coa-main-title">Chart of Accounts</h1>
          <p className="coa-subtitle">View and manage your complete chart of accounts</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="coa-success-banner">
          <svg className="coa-success-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span className="coa-success-text">{successMessage}</span>
        </div>
      )}

      {/* Data Display Card */}
      <div className="coa-data-card">
        <div className="coa-card-header">
          <h2 className="coa-card-title">Account Records</h2>
        </div>

        {/* Tab Navigation */}
        <div className="coa-tab-nav">
          <button
            type="button"
            onClick={() => {
              setActiveTab('user');
              setSearchTerm('');
            }}
            className={`coa-tab-btn${activeTab === 'user' ? ' coa-tab-btn--active' : ''}`}
          >
            <span className="coa-tab-label">User Accounts</span>
            <span className="coa-tab-count">{userAccounts.length}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('trading');
              setSearchTerm('');
            }}
            className={`coa-tab-btn${activeTab === 'trading' ? ' coa-tab-btn--active' : ''}`}
          >
            <span className="coa-tab-label">Trading Accounts</span>
            <span className="coa-tab-count">{systemAccounts.length}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('system');
              setSearchTerm('');
            }}
            className={`coa-tab-btn${activeTab === 'system' ? ' coa-tab-btn--active' : ''}`}
          >
            <span className="coa-tab-label">System Accounts</span>
            <span className="coa-tab-count">{systemAccountsFromCSV.length}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="coa-search-container">
          <div className="coa-search-toolbar">
            <div className="coa-search-wrapper">
              <input
                type="text"
                className="coa-search-input"
                placeholder="Search by account code, description, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={loadAccounts}
              className="coa-refresh-btn"
              disabled={loading}
              aria-label="Refresh accounts"
            >
              <svg className="coa-refresh-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-7 9 9 0 00-14-7" />
              </svg>
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
          {searchTerm && (
            <div className="coa-search-results">
              Showing {filteredAccounts.length} of {displayAccounts.length} {
                activeTab === 'user' ? 'user' : 
                activeTab === 'trading' ? 'trading' : 
                'system'
              } accounts
            </div>
          )}
        </div>

        {/* Stats Section */}
        {displayAccounts.length > 0 && (
          <div className="coa-stats">
            <div className="coa-stat coa-stat--total">
              <div className="coa-stat-label">Total {accountTypeLabel} accounts</div>
              <div className="coa-stat-value">{displayAccounts.length}</div>
            </div>
            <div className="coa-stat coa-stat--active">
              <div className="coa-stat-label">Active accounts</div>
              <div className="coa-stat-value">{activeCount}</div>
            </div>
            <div className="coa-stat coa-stat--inactive">
              <div className="coa-stat-label">Inactive accounts</div>
              <div className="coa-stat-value">{inactiveCount}</div>
            </div>
            
            {/* Use System Chart of Accounts Button - Only for System Accounts tab */}
            {activeTab === 'system' && !loadingSystemAccounts && systemAccountsFromCSV.length > 0 && (
              <div className="coa-stats-actions">
                <button
                  type="button"
                  onClick={handleImportSystemAccounts}
                  disabled={importingSystemAccounts}
                  className="coa-import-btn"
                >
                  {importingSystemAccounts ? 'Importing...' : 'Use System Chart of Accounts'}
                </button>

                <button
                  type="button"
                  onClick={handleExportSystemAccounts}
                  disabled={exportingSystemAccounts}
                  className="coa-export-btn"
                >
                  {exportingSystemAccounts ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            )}
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
          
          {!loading && !error && activeTab === 'user' && userAccounts.length === 0 && (
            <div className="coa-no-data">No user-created accounts found in the database.</div>
          )}

          {!loading && !error && activeTab === 'trading' && systemAccounts.length === 0 && (
            <div className="coa-no-data">No trading accounts available.</div>
          )}

          {!loading && !error && activeTab === 'system' && !loadingSystemAccounts && systemAccountsFromCSV.length === 0 && (
            <div className="coa-no-data">No system accounts available.</div>
          )}

          {activeTab === 'system' && loadingSystemAccounts && (
            <div className="coa-loading">Loading system accounts from CSV...</div>
          )}

          {!loading && !error && searchTerm && filteredAccounts.length === 0 && (
            <div className="coa-no-data">No accounts match your search criteria.</div>
          )}
          
          {!loading && !error && !loadingSystemAccounts && filteredAccounts.length > 0 && (
            <table className="coa-data-table">
              <thead>
                <tr>
                  {activeTab === 'system' ? (
                    <>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Transaction Type</th>
                      <th>Main Category and Sub Category</th>
                      <th>Active Status</th>
                    </>
                  ) : (
                    <>
                  <th>Account Code</th>
                  <th>Description</th>
                  <th>Account Type</th>
                  <th>Account Category</th>
                  <th>Active Status</th>
                  {activeTab === 'user' ? (
                    <>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </>
                  ) : (
                    <th>Notes</th>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc, index) => (
                  <tr key={acc.id || `system-${index}`}>
                    <td className="coa-account-code">{acc.account_code}</td>
                    {activeTab === 'system' ? (
                      <>
                        <td className="coa-description">{acc.account_name || acc.description || '-'}</td>
                        <td>{acc.transaction_type || '-'}</td>
                        <td>
                          {acc.main_category && acc.sub_category 
                            ? `${acc.main_category} - ${acc.sub_category}`
                            : acc.main_category || acc.sub_category || '-'}
                        </td>
                        <td>
                          <span className={`coa-active-status ${acc.active_status?.toLowerCase()}`}>
                            {acc.active_status || 'Yes'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                    <td className="coa-description">{acc.description}</td>
                    <td>{acc.account_type || '-'}</td>
                    <td>{acc.account_category || '-'}</td>
                    <td>
                      <span className={`coa-active-status ${acc.active_status?.toLowerCase()}`}>
                        {acc.active_status || 'Yes'}
                      </span>
                    </td>
                    {activeTab === 'user' ? (
                      <>
                        <td>{acc.created_at ? new Date(acc.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleEdit(acc)}
                            className="coa-edit-btn"
                            title="Edit Account"
                            aria-label="Edit account"
                          >
                            <svg className="coa-edit-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                            <span className="coa-edit-btn-label">Edit</span>
                          </button>
                        </td>
                      </>
                    ) : (
                      <td>
                        <span className="coa-trading-note">Trading Account</span>
                      </td>
                        )}
                      </>
                    )}
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

      {/* Edit Modal */}
      {editingAccount && typeof document !== 'undefined' && createPortal(
        <div
          className="coa-modal-overlay"
          onClick={handleCloseEdit}
        >
          <div
            className="coa-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coa-modal-header">
              <h2 className="coa-modal-title">Edit Account</h2>
              <p className="coa-modal-subtitle">Update account information below</p>
            </div>

            <div className="coa-modal-body">
              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-account-code">
                  Account Code <span className="coa-form-required">*</span>
                </label>
                <input
                  id="coa-edit-account-code"
                  type="text"
                  name="account_code"
                  value={editFormData.account_code}
                  onChange={handleEditInputChange}
                  className={`coa-form-input${editErrors.account_code ? ' coa-form-input--error' : ''}`}
                  placeholder="e.g., 101-101-555-001-44"
                />
                {editErrors.account_code && (
                  <span className="coa-form-error">{editErrors.account_code}</span>
                )}
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-description">
                  Description <span className="coa-form-required">*</span>
                </label>
                <input
                  id="coa-edit-description"
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  className={`coa-form-input${editErrors.description ? ' coa-form-input--error' : ''}`}
                  placeholder="Account description"
                />
                {editErrors.description && (
                  <span className="coa-form-error">{editErrors.description}</span>
                )}
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-account-type">Account Type</label>
                <input
                  id="coa-edit-account-type"
                  type="text"
                  name="account_type"
                  value={editFormData.account_type}
                  onChange={handleEditInputChange}
                  className="coa-form-input"
                  placeholder="e.g., Asset, Liability, Equity"
                />
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-account-category">Account Category</label>
                <input
                  id="coa-edit-account-category"
                  type="text"
                  name="account_category"
                  value={editFormData.account_category}
                  onChange={handleEditInputChange}
                  className="coa-form-input"
                  placeholder="e.g., Current Assets, Operating Expenses"
                />
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-normal-balance">Normal Balance</label>
                <select
                  id="coa-edit-normal-balance"
                  name="normal_balance"
                  value={editFormData.normal_balance}
                  onChange={handleEditInputChange}
                  className="coa-form-select"
                >
                  <option value="">Select if applicable</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-parent-account">Parent Account</label>
                <input
                  id="coa-edit-parent-account"
                  type="text"
                  name="parent_account"
                  value={editFormData.parent_account}
                  onChange={handleEditInputChange}
                  className="coa-form-input"
                  placeholder="e.g., 101-101-100-001-44"
                />
              </div>

              <div className="coa-form-group">
                <label className="coa-form-label" htmlFor="coa-edit-active-status">Active Status</label>
                <select
                  id="coa-edit-active-status"
                  name="active_status"
                  value={editFormData.active_status}
                  onChange={handleEditInputChange}
                  className="coa-form-select"
                >
                  <option value="Yes">Active</option>
                  <option value="No">Inactive</option>
                </select>
              </div>
            </div>

            <div className="coa-modal-actions">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="coa-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="coa-btn-save"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChartOfAccounts;
