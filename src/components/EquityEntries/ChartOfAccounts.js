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
      account_code: '101-101-555-001-44',
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
      account_code: '601-101-100-001-44',
      description: 'Brokerage',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-101-001-44',
      description: 'CSE Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-102-001-44',
      description: 'SEC',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-103-001-44',
      description: 'CDS Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-104-001-44',
      description: 'Clearing Fees',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
      normal_balance: 'Debit',
      active_status: 'Yes'
    },
    {
      account_code: '601-101-105-001-44',
      description: 'STL',
      account_type: 'Expense',
      account_category: 'Trading Expenses',
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

      const baseUrl = process.env.REACT_APP_API_URL || 'http://98.91.201.168/api';
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

      {/* Success Message */}
      {successMessage && (
        <div style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '8px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span style={{ fontWeight: '600' }}>{successMessage}</span>
        </div>
      )}

      {/* Data Display Card */}
      <div className="coa-data-card">
        <div className="coa-card-header">
          <h2 className="coa-card-title">
            Account Records ({
              activeTab === 'user' ? userAccounts.length : 
              activeTab === 'trading' ? systemAccounts.length : 
              systemAccountsFromCSV.length
            } {
              activeTab === 'user' ? 'user' : 
              activeTab === 'trading' ? 'trading' : 
              'system'
            } accounts)
          </h2>
          <button 
            onClick={loadAccounts}
            className="coa-refresh-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              setActiveTab('user');
              setSearchTerm(''); // Clear search when switching tabs
            }}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: activeTab === 'user' ? '#3b82f6' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'user' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            User Accounts ({userAccounts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('trading');
              setSearchTerm(''); // Clear search when switching tabs
            }}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: activeTab === 'trading' ? '#3b82f6' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'trading' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Trading Accounts ({systemAccounts.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('system');
              setSearchTerm(''); // Clear search when switching tabs
            }}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: activeTab === 'system' ? '#3b82f6' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'system' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            System Accounts ({systemAccountsFromCSV.length})
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
          <div className="coa-stats" style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '0',
            padding: '1rem 2rem',
            background: '#f8fafc',
            borderBottom: 'none',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div className="coa-stat">
              <div className="coa-stat-value">{displayAccounts.length}</div>
              <div className="coa-stat-label">Total {
                activeTab === 'user' ? 'User' : 
                activeTab === 'trading' ? 'Trading' : 
                'System'
              } Accounts</div>
            </div>
            <div className="coa-stat">
              <div className="coa-stat-value">{activeCount}</div>
              <div className="coa-stat-label">Active</div>
            </div>
            <div className="coa-stat">
              <div className="coa-stat-value">{inactiveCount}</div>
              <div className="coa-stat-label">Inactive</div>
            </div>
            
            {/* Use System Chart of Accounts Button - Only for System Accounts tab */}
            {activeTab === 'system' && !loadingSystemAccounts && systemAccountsFromCSV.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleImportSystemAccounts}
                  disabled={importingSystemAccounts}
                  style={{
                    padding: '0.875rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: importingSystemAccounts ? '#9ca3af' : '#3b82f6',
                    backgroundColor: 'transparent',
                    border: `2px solid ${importingSystemAccounts ? '#9ca3af' : '#3b82f6'}`,
                    borderRadius: '8px',
                    cursor: importingSystemAccounts ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    marginLeft: '0',
                    opacity: importingSystemAccounts ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!importingSystemAccounts) {
                      e.target.style.backgroundColor = '#eff6ff';
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.color = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!importingSystemAccounts) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.color = '#3b82f6';
                    }
                  }}
                >
                  {importingSystemAccounts ? 'Importing...' : 'Use System Chart of Accounts'}
                </button>

                <button
                  onClick={handleExportSystemAccounts}
                  disabled={exportingSystemAccounts}
                  style={{
                    padding: '0.875rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: exportingSystemAccounts ? '#9ca3af' : '#16a34a',
                    backgroundColor: 'transparent',
                    border: `2px solid ${exportingSystemAccounts ? '#9ca3af' : '#16a34a'}`,
                    borderRadius: '8px',
                    cursor: exportingSystemAccounts ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    opacity: exportingSystemAccounts ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!exportingSystemAccounts) {
                      e.target.style.backgroundColor = '#dcfce7';
                      e.target.style.borderColor = '#15803d';
                      e.target.style.color = '#15803d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!exportingSystemAccounts) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = '#16a34a';
                      e.target.style.color = '#16a34a';
                    }
                  }}
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
                      </>
                    ) : (
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                              Trading Account
                        </span>
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

      {/* Edit Modal */}
      {editingAccount && typeof document !== 'undefined' && createPortal(
        <div 
          className="coa-modal-overlay"
          onClick={handleCloseEdit}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 9999,
            paddingTop: '100px',
            paddingBottom: '20px',
            overflowY: 'auto'
          }}
        >
          <div 
            className="coa-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: 'calc(100vh - 140px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              marginBottom: '20px',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <div style={{ 
              marginBottom: '1rem',
              flexShrink: 0,
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}>
                Edit Account
              </h2>
              <p style={{ 
                margin: 0,
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Update account information below
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '0.5rem'
            }}>
              {/* Account Code */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Account Code <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="account_code"
                  value={editFormData.account_code}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: `2px solid ${editErrors.account_code ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., 1-001-01-01-01"
                />
                {editErrors.account_code && (
                  <span style={{ 
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    {editErrors.account_code}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: `2px solid ${editErrors.description ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Account description"
                />
                {editErrors.description && (
                  <span style={{ 
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    {editErrors.description}
                  </span>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Account Type
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={editFormData.account_type}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., Asset, Liability, Equity"
                />
              </div>

              {/* Account Category */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Account Category
                </label>
                <input
                  type="text"
                  name="account_category"
                  value={editFormData.account_category}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., Current Assets, Operating Expenses"
                />
              </div>

              {/* Normal Balance */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Normal Balance
                </label>
                <select
                  name="normal_balance"
                  value={editFormData.normal_balance}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">Select if applicable</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* Parent Account */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Parent Account
                </label>
                <input
                  type="text"
                  name="parent_account"
                  value={editFormData.parent_account}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., 1-000-01-01-01"
                />
              </div>

              {/* Active Status */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Active Status
                </label>
                <select
                  name="active_status"
                  value={editFormData.active_status}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="Yes">Active</option>
                  <option value="No">Inactive</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <button
                onClick={handleCloseEdit}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
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
