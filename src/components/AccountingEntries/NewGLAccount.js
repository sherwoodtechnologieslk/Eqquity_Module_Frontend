import React, { useState, useEffect } from 'react';
import './Styles/NewGLAccount.css';
import { accountAPI, chartOfAccountsAPI, glAccountMappingAPI, glAccountAPI } from '../../services/api';

const NewGLAccount = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('newGLAccount'); // 'newGLAccount', 'glMapping', or 'journalEntry'
  
  const [formData, setFormData] = useState({
    accountCode: '',
    description: '',
    accountType: '',
    parentAccount: '',
    activeStatus: 'Yes',
    accountCategory: '',
    normalBalance: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');

  // GL Mapping states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [mappings, setMappings] = useState({}); // { bankAccountId: glAccountCode }
  const [loading, setLoading] = useState(false);
  const [mappingErrors, setMappingErrors] = useState({});

  // Account type options based on existing chart of accounts
  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
    { value: 'bank', label: 'Bank Account' },
    { value: 'investment', label: 'Investment Account' }
  ];

  // Account categories for better organization
  const accountCategories = {
    asset: ['Current Assets', 'Non-Current Assets', 'Fixed Assets', 'Intangible Assets'],
    liability: ['Current Liabilities', 'Non-Current Liabilities', 'Long-term Debt'],
    equity: ['Share Capital', 'Retained Earnings', 'Reserves'],
    revenue: ['Operating Revenue', 'Non-Operating Revenue', 'Interest Income'],
    expense: ['Operating Expenses', 'Administrative Expenses', 'Financial Expenses'],
    bank: ['Current Account', 'Savings Account', 'Fixed Deposit'],
    investment: ['Equity Investments', 'Debt Investments', 'Mutual Funds']
  };

  // Generate suggested account code based on type and category
  const generateAccountCode = (type, category) => {
    const codeMap = {
      asset: '1',
      liability: '2',
      equity: '3',
      revenue: '4',
      expense: '5',
      bank: '1-6',
      investment: '1-7'
    };

    const baseCode = codeMap[type] || '1';
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${baseCode}-${randomSuffix}-01-01-01`;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Generate suggested code when type or category changes
    if (name === 'accountType' || name === 'accountCategory') {
      const newType = name === 'accountType' ? value : formData.accountType;
      const newCategory = name === 'accountCategory' ? value : formData.accountCategory;
      if (newType) {
        setSuggestedCode(generateAccountCode(newType, newCategory));
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountCode.trim()) {
      newErrors.accountCode = 'Account Code is required';
    } else if (!/^\d+-\d+-\d+-\d+-\d+$/.test(formData.accountCode)) {
      newErrors.accountCode = 'Account Code must follow format: X-XX-XX-XX-XX';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Account Type is required';
    }

    if (!formData.accountCategory) {
      newErrors.accountCategory = 'Account Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const accountData = {
        accountCode: formData.accountCode,
        description: formData.description,
        accountType: formData.accountType,
        accountCategory: formData.accountCategory,
        normalBalance: formData.normalBalance,
        parentAccount: formData.parentAccount || null,
        activeStatus: formData.activeStatus
      };

      // Call the API to create GL account
      await glAccountAPI.create(accountData);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          accountCode: '',
          description: '',
          accountType: '',
          parentAccount: '',
          activeStatus: 'Yes',
          accountCategory: '',
          normalBalance: ''
        });
        setSuggestedCode('');
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating GL account:', error);
      setIsSubmitting(false);
      
      // Parse error message from response
      let errorMessage = 'Failed to create GL account. Please try again.';
      
      if (error.message && error.message.includes('409')) {
        errorMessage = 'An account with this code already exists. Please use a different account code.';
      } else if (error.message && error.message.includes('400')) {
        errorMessage = 'Invalid account code format. Must follow pattern: X-XXX-XX-XX-XX (e.g., 1-100-01-01-01)';
      }
      
      // Set error for accountCode field
      setErrors({ accountCode: errorMessage });
      
      // Also show alert for visibility
      alert(errorMessage);
    }
  };

  // Handle reset form
  const handleReset = () => {
    setFormData({
      accountCode: '',
      description: '',
      accountType: '',
      parentAccount: '',
      activeStatus: 'Yes',
      accountCategory: '',
      normalBalance: ''
    });
    setErrors({});
    setSuggestedCode('');
    setShowSuccess(false);
  };

  // Use suggested code
  const useSuggestedCode = () => {
    setFormData(prev => ({
      ...prev,
      accountCode: suggestedCode
    }));
    if (errors.accountCode) {
      setErrors(prev => ({
        ...prev,
        accountCode: ''
      }));
    }
  };

  // Track which accounts already have mappings (loaded from database)
  const [existingMappings, setExistingMappings] = useState({});

  // Fetch bank accounts and chart of accounts for GL Mapping
  useEffect(() => {
    const fetchDataForMapping = async () => {
      if (activeTab === 'glMapping') {
        setLoading(true);
        try {
          const [accountsResponse, chartResponse, existingMappingsData] = await Promise.all([
            accountAPI.getAllAccounts(),
            chartOfAccountsAPI.getAll(),
            glAccountMappingAPI.getAll().catch(() => []) // Fetch existing mappings, return empty array if none exist
          ]);
          
          // Filter only active accounts
          const activeAccounts = accountsResponse.filter(acc => acc.active_status !== 'No');
          setBankAccounts(activeAccounts);
          setChartOfAccounts(chartResponse);
          
          // Populate existing mappings into state (for display - these won't be saved again)
          const mappingsObj = {};
          const existingMappingsObj = {};
          existingMappingsData.forEach(mapping => {
            mappingsObj[mapping.account_id] = mapping.gl_account_code;
            existingMappingsObj[mapping.account_id] = {
              gl_account_code: mapping.gl_account_code,
              gl_account_name: mapping.gl_account_name || ''
            };
          });
          setMappings(mappingsObj);
          setExistingMappings(existingMappingsObj);
        } catch (error) {
          console.error('Error fetching data for GL Mapping:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDataForMapping();
  }, [activeTab]);

  // Handle GL mapping changes
  const handleMappingChange = (bankAccountId, glAccountCode) => {
    setMappings(prev => ({
      ...prev,
      [bankAccountId]: glAccountCode
    }));
    
    // Clear error for this mapping
    if (mappingErrors[bankAccountId]) {
      setMappingErrors(prev => ({
        ...prev,
        [bankAccountId]: ''
      }));
    }
  };

  // Handle save mappings
  const handleSaveMappings = async () => {
    // Validate only NEW mappings (not existing ones)
    const newErrors = {};
    let hasErrors = false;

    // Check if all accounts that don't have existing mappings have been mapped
    bankAccounts.forEach(account => {
      if (!existingMappings[account.id] && !mappings[account.id]) {
        newErrors[account.id] = 'Please select a GL account';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setMappingErrors(newErrors);
      return;
    }

    // Prepare mappings for API (exclude accounts that already have mappings in the database)
    const mappingsArray = Object.entries(mappings)
      .filter(([accountId, glAccountCode]) => {
        // Only include new mappings (not already in the database)
        return glAccountCode && !existingMappings[accountId];
      })
      .map(([accountId, glAccountCode]) => {
        // Find the GL account name
        const glAccount = chartOfAccounts.find(coa => coa.account_code === glAccountCode);
        return {
          account_id: parseInt(accountId),
          gl_account_code: glAccountCode,
          gl_account_name: glAccount ? glAccount.description : ''
        };
      });

    // If no new mappings to save, show a message
    if (mappingsArray.length === 0) {
      alert('All accounts are already mapped. No new mappings to save.');
      return;
    }

    try {
      // Save only new mappings to the backend
      await glAccountMappingAPI.saveBulk(mappingsArray);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving GL mappings:', error);
      alert('Failed to save GL mappings. Please try again.');
    }
  };

  return (
    <div className="new-gl-account-container">
      {/* Header Section */}
      <div className="new-gl-header-section">
        <div className="new-gl-header-icon">
          <svg className="new-gl-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="new-gl-header-text-group">
          <h1 className="new-gl-main-title">GL Account Specification</h1>
          <p className="new-gl-subtitle">Define general ledger account mappings for your chart of accounts</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="new-gl-success-message">
          <div className="success-icon">✓</div>
          <div className="success-text">
            <h3>Account Created Successfully!</h3>
            <p>Your GL account specification has been added to the chart of accounts.</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('newGLAccount')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'newGLAccount' ? '600' : '400',
            color: activeTab === 'newGLAccount' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'newGLAccount' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          New GL Account
        </button>
        <button
          onClick={() => setActiveTab('glMapping')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'glMapping' ? '600' : '400',
            color: activeTab === 'glMapping' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'glMapping' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          GL Mapping
        </button>
        <button
          onClick={() => setActiveTab('journalEntry')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'journalEntry' ? '600' : '400',
            color: activeTab === 'journalEntry' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'journalEntry' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          General Ledger - Journal Entry
        </button>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'newGLAccount' ? (
      /* New GL Account Form */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">Account Details</h2>
          <p className="new-gl-form-subtitle">Define the GL account specification details below</p>
        </div>

        <form onSubmit={handleSubmit} className="new-gl-form">
          {/* Account Code Section */}
          <div className="form-section">
            <h3 className="form-section-title">Account Identification</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountCode" className="form-label">
                  Account Code <span className="required">*</span>
                </label>
                <div className="input-with-suggestion">
                  <input
                    type="text"
                    id="accountCode"
                    name="accountCode"
                    value={formData.accountCode}
                    onChange={handleInputChange}
                    className={`form-input ${errors.accountCode ? 'error' : ''}`}
                    placeholder="e.g., 1-001-01-01-01"
                    maxLength={17}
                  />
                  {suggestedCode && formData.accountCode !== suggestedCode && (
                    <button
                      type="button"
                      onClick={useSuggestedCode}
                      className="suggestion-btn"
                      title="Use suggested code"
                    >
                      Use: {suggestedCode}
                    </button>
                  )}
                </div>
                {errors.accountCode && <span className="error-message">{errors.accountCode}</span>}
                <div className="input-hint">Format: X-XX-XX-XX-XX (e.g., 1-001-01-01-01)</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Account Description <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`form-input ${errors.description ? 'error' : ''}`}
                  placeholder="e.g., Asset Motor Vehicles"
                  maxLength={255}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                <div className="input-hint">Enter a clear, descriptive name for the account</div>
              </div>
            </div>
          </div>

          {/* Account Classification Section */}
          <div className="form-section">
            <h3 className="form-section-title">Account Classification</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountType" className="form-label">
                  Account Type <span className="required">*</span>
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className={`form-select ${errors.accountType ? 'error' : ''}`}
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.accountType && <span className="error-message">{errors.accountType}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="accountCategory" className="form-label">
                  Account Category <span className="required">*</span>
                </label>
                <select
                  id="accountCategory"
                  name="accountCategory"
                  value={formData.accountCategory}
                  onChange={handleInputChange}
                  className={`form-select ${errors.accountCategory ? 'error' : ''}`}
                  disabled={!formData.accountType}
                >
                  <option value="">Select Category</option>
                  {formData.accountType && accountCategories[formData.accountType]?.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.accountCategory && <span className="error-message">{errors.accountCategory}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="normalBalance" className="form-label">
                  Normal Balance (Optional)
                </label>
                <select
                  id="normalBalance"
                  name="normalBalance"
                  value={formData.normalBalance}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select if applicable</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
                <div className="input-hint">Leave empty if debit/credit depends on transaction context</div>
              </div>

              <div className="form-group">
                <label htmlFor="activeStatus" className="form-label">
                  Status
                </label>
                <select
                  id="activeStatus"
                  name="activeStatus"
                  value={formData.activeStatus}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Yes">Active</option>
                  <option value="No">Inactive</option>
                </select>
                <div className="input-hint">Active accounts can be used in transactions</div>
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parentAccount" className="form-label">
                  Parent Account (Optional)
                </label>
                <input
                  type="text"
                  id="parentAccount"
                  name="parentAccount"
                  value={formData.parentAccount}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., 1-000-01-01-01"
                />
                <div className="input-hint">Link to a parent account for hierarchical organization</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      ) : activeTab === 'glMapping' ? (
      /* GL Mapping Tab */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">GL Account Mapping</h2>
          <p className="new-gl-form-subtitle">Map your payment accounts to specific GL account codes from the Chart of Accounts</p>
        </div>

        {loading ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem' }}>Loading accounts...</p>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No bank accounts found. Please add accounts first.</p>
          </div>
        ) : (
          <div style={{ padding: '2rem 0' }}>
            <div className="gl-mapping-instructions">
              <div className="gl-mapping-instructions-content">
                <p className="gl-mapping-instructions-title">
                  Instructions
                </p>
                <p className="gl-mapping-instructions-text">
                  Select the appropriate GL account from the Chart of Accounts for each payment account below. This mapping will be used for automatic posting of transactions.
                </p>
              </div>
            </div>

            {/* Mappings Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #e5e7eb'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      Bank Account
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      GL Account Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map(account => (
                    <tr key={account.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{account.bank_name}</strong>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                          {account.account_name} ({account.account_number})
                        </div>
                        {mappingErrors[account.id] && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {mappingErrors[account.id]}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {(() => {
                          const hasExistingMapping = existingMappings[account.id];
                          const existingMapping = hasExistingMapping ? hasExistingMapping.gl_account_code : '';
                          
                          return hasExistingMapping ? (
                            <div style={{
                              padding: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#059669',
                              backgroundColor: '#d1fae5',
                              borderRadius: '6px',
                              border: '1px solid #059669'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                {existingMapping}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                                Already Mapped
                              </div>
                            </div>
                          ) : (
                            <select
                              value={mappings[account.id] || ''}
                              onChange={(e) => handleMappingChange(account.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                fontSize: '0.875rem',
                                border: `1px solid ${mappingErrors[account.id] ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: '6px',
                                backgroundColor: '#fff',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Select GL Account...</option>
                              {chartOfAccounts
                                .filter(coa => coa.active_status === 'Yes')
                                .map(coa => (
                                  <option key={coa.account_code} value={coa.account_code}>
                                    {coa.account_code} - {coa.description}
                                  </option>
                                ))}
                            </select>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              maxWidth: '90%'
            }}>
              <button
                onClick={handleSaveMappings}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Save Mappings
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
      /* General Ledger - Journal Entry Tab */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">General Ledger - Journal Entry</h2>
          <p className="new-gl-form-subtitle">Create manual journal entries for GL adjustments</p>
        </div>
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>Journal Entry functionality coming soon</p>
        </div>
      </div>
      )}

      {/* Footer */}
      <div className="new-gl-footer-section">
        <p>SHERWOOD TECHNOLOGIES (PVT) LTD • General Ledger Account Management • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default NewGLAccount;

