import React, { useState, useEffect } from 'react';
import './Styles/OpeningBalEntry.css';
import { chartOfAccountsAPI, openingBalanceAPI, accountCategoryAPI } from '../../services/api';

const OpeningBalEntry = () => {
  const [formData, setFormData] = useState({
    accountType: '',
    accountCategory: '',
    accountCode: '',
    accountName: '',
    openingBalanceDate: '',
    amount: '',
    balanceType: 'Debit', // 'Debit' or 'Credit'
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountCodeSearch, setAccountCodeSearch] = useState('');
  
  // Account categories loaded from database (matching GL Account Specification pattern)
  const [accountCategories, setAccountCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load chart of accounts and categories on component mount
  useEffect(() => {
    loadChartOfAccounts();
    loadAccountCategories();
  }, []);


  const loadChartOfAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await chartOfAccountsAPI.getAll();
      setChartOfAccounts(accounts || []);
    } catch (error) {
      console.error('Error loading chart of accounts:', error);
      setErrors(prev => ({
        ...prev,
        accountCode: 'Failed to load accounts. Please refresh the page.'
      }));
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load account categories from database (matching GL Account Specification pattern)
  const loadAccountCategories = async () => {
    try {
      setLoadingCategories(true);
      const [categories, transactionTypes] = await Promise.all([
        accountCategoryAPI.getAll().catch(() => []),
        accountCategoryAPI.getAllTransactionTypes().catch(() => [])
      ]);
      
      // Group categories by account_type (normalize to lowercase for consistency)
      const grouped = {};
      
      categories.forEach(cat => {
        // Normalize account_type to lowercase to match dropdown values
        const normalizedType = (cat.account_type || '').toLowerCase();
        if (!grouped[normalizedType]) {
          grouped[normalizedType] = [];
        }
        grouped[normalizedType].push(cat.category_name);
      });
      
      // Extract sub-categories from transaction types
      const subCategoriesFromTransactionTypes = {};
      transactionTypes.forEach(tt => {
        // Normalize account_type to lowercase to match dropdown values
        const normalizedType = (tt.account_type || '').toLowerCase();
        if (tt.category_name) {
          if (!subCategoriesFromTransactionTypes[normalizedType]) {
            subCategoriesFromTransactionTypes[normalizedType] = [];
          }
          if (!subCategoriesFromTransactionTypes[normalizedType].includes(tt.category_name)) {
            subCategoriesFromTransactionTypes[normalizedType].push(tt.category_name);
          }
        }
      });
      
      // Merge categories from database with sub-categories from transaction types
      const mergedCategories = { ...grouped };
      Object.keys(subCategoriesFromTransactionTypes).forEach(accountType => {
        if (!mergedCategories[accountType]) {
          mergedCategories[accountType] = [];
        }
        subCategoriesFromTransactionTypes[accountType].forEach(subCat => {
          if (!mergedCategories[accountType].includes(subCat)) {
            mergedCategories[accountType].push(subCat);
          }
        });
      });
      
      // Remove duplicates and sort
      Object.keys(mergedCategories).forEach(type => {
        mergedCategories[type] = [...new Set(mergedCategories[type])].sort();
      });
      
      setAccountCategories(mergedCategories);
    } catch (error) {
      console.error('Error loading account categories:', error);
      setAccountCategories({});
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'accountType') {
      // Reset accountCategory and accountCode when accountType changes
      setFormData(prev => ({
        ...prev,
        accountType: value,
        accountCategory: '',
        accountCode: '',
        accountName: ''
      }));
      setAccountCodeSearch('');
    } else if (name === 'accountCategory') {
      // Reset accountCode when accountCategory changes
      setFormData(prev => ({
        ...prev,
        accountCategory: value,
        accountCode: '',
        accountName: ''
      }));
      setAccountCodeSearch('');
    } else if (name === 'accountCode') {
      // Find the selected account from filtered accounts
      setFormData(prev => {
        const filteredAccounts = getFilteredAccounts(prev);
        const selectedAccount = filteredAccounts.find(acc => acc.account_code === value);
        return {
          ...prev,
          accountCode: value,
          accountName: selectedAccount ? selectedAccount.description : ''
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Get unique account types from chart of accounts
  // Base account types that should always be available (lowercase to match GL Account Specification)
  const baseAccountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];
  
  // Helper function to normalize account type to lowercase (matching GL Account Specification)
  const normalizeAccountType = (type) => {
    if (!type) return '';
    // Convert to lowercase for consistent comparison
    return type.toLowerCase().trim();
  };
  
  const getAccountTypes = () => {
    // Get types from chart of accounts and normalize them to lowercase
    const typesFromAccounts = [...new Set(
      chartOfAccounts
        .map(acc => normalizeAccountType(acc.account_type))
        .filter(Boolean)
    )];
    
    // Create account type objects with value and label
    const accountTypeMap = {};
    baseAccountTypes.forEach(type => {
      accountTypeMap[type.value] = type.label;
    });
    
    // Add types from accounts with title case labels
    typesFromAccounts.forEach(type => {
      if (!accountTypeMap[type]) {
        // Convert to title case for display
        accountTypeMap[type] = type.charAt(0).toUpperCase() + type.slice(1);
      }
    });
    
    // Return array of { value, label } objects sorted by label
    return Object.keys(accountTypeMap)
      .map(value => ({ value, label: accountTypeMap[value] }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };


  // Get filtered accounts based on accountType and accountCategory
  const getFilteredAccounts = (currentFormData = formData) => {
    let filtered = chartOfAccounts;
    
    if (currentFormData.accountType) {
      // Normalize the selected account type to lowercase (matching GL Account Specification)
      const selectedType = normalizeAccountType(currentFormData.accountType);
      filtered = filtered.filter(acc => {
        // Normalize account type from database to lowercase for consistent comparison
        const accType = normalizeAccountType(acc.account_type);
        return accType === selectedType;
      });
    }
    
    if (currentFormData.accountCategory) {
      filtered = filtered.filter(acc => {
        const accCategory = (acc.account_category || '').toLowerCase().trim();
        const selectedCategory = (currentFormData.accountCategory || '').toLowerCase().trim();
        return accCategory === selectedCategory;
      });
    }
    
    return filtered;
  };

  const getFilteredAccountsForDropdown = (currentFormData = formData) => {
    const filtered = getFilteredAccounts(currentFormData);
    const q = (accountCodeSearch || '').toLowerCase().trim();
    if (!q) return filtered;
    return filtered.filter((acc) => {
      const code = (acc.account_code || '').toLowerCase();
      const desc = (acc.description || '').toLowerCase();
      return code.includes(q) || desc.includes(q);
    });
  };

  const handleBalanceTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      balanceType: e.target.value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }

    if (!formData.accountCategory) {
      newErrors.accountCategory = 'Account category is required';
    }

    if (!formData.accountCode.trim()) {
      newErrors.accountCode = 'Account code is required';
    }

    if (!formData.openingBalanceDate) {
      newErrors.openingBalanceDate = 'Opening balance date is required';
    } else {
      // Validate date is not in the future
      const selectedDate = new Date(formData.openingBalanceDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.openingBalanceDate = 'Opening balance date cannot be in the future';
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }

    if (!formData.balanceType) {
      newErrors.balanceType = 'Balance type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      // Prepare data for API call
      const openingBalanceData = {
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        accountType: formData.accountType,
        accountCategory: formData.accountCategory,
        openingBalanceDate: formData.openingBalanceDate,
        debit: formData.balanceType === 'Debit' ? parseFloat(formData.amount) : 0,
        credit: formData.balanceType === 'Credit' ? parseFloat(formData.amount) : 0,
        description: formData.description || `Opening balance for ${formData.accountName || formData.accountCode}`
      };

      // Call the API to save opening balance
      const response = await openingBalanceAPI.create(openingBalanceData);
      
      if (response.success) {
        // Show success message
        setShowSuccess(true);
      } else {
        throw new Error(response.error || 'Failed to save opening balance');
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          accountType: '',
          accountCategory: '',
          accountCode: '',
          accountName: '',
          openingBalanceDate: '',
          amount: '',
          balanceType: 'Debit',
          description: ''
        });
        setShowSuccess(false);
      setAccountCodeSearch('');
      }, 3000);

    } catch (error) {
      console.error('Error saving opening balance:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to save opening balance. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      accountType: '',
      accountCategory: '',
      accountCode: '',
      accountName: '',
      openingBalanceDate: '',
      amount: '',
      balanceType: 'Debit',
      description: ''
    });
    setAccountCodeSearch('');
    setErrors({});
    setShowSuccess(false);
  };

  // Get default date (first day of current month)
  const getDefaultDate = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  return (
    <div className="opening-bal-entry-container">
      {/* Header Section */}
      <div className="opening-bal-header-section">
        <div className="opening-bal-header-icon">
          <svg className="opening-bal-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="opening-bal-header-text-group">
          <h1 className="opening-bal-main-title">Opening Balance Entry</h1>
          <p className="opening-bal-subtitle">Enter opening balances for your general ledger accounts</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="opening-bal-success-message">
          <div className="success-icon">✓</div>
          <div className="success-text">
            <h3>Opening Balance Saved Successfully!</h3>
            <p>Your opening balance has been recorded.</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="opening-bal-form-card">
        <div className="opening-bal-form-header">
          <h2 className="opening-bal-form-title">Opening Balance Information</h2>
          <p className="opening-bal-form-subtitle">Fill in the details below to create an opening balance entry</p>
        </div>

        <form className="opening-bal-form" onSubmit={handleSubmit}>
          {/* Account Selection Section */}
          <div className="form-section">
            <h3 className="form-section-title">Account Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountType" className="form-label">
                  Account Type <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  {loadingAccounts ? (
                    <div className="loading-container-inline">
                      <div className="loading-spinner-small"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="accountType"
                      name="accountType"
                      className={`form-select ${errors.accountType ? 'error' : ''}`}
                      value={formData.accountType}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Select Account Type --</option>
                      {getAccountTypes().map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {errors.accountType && (
                  <div className="error-message">{errors.accountType}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="accountCategory" className="form-label">
                  Account Category <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  {loadingAccounts || loadingCategories ? (
                    <div className="loading-container-inline">
                      <div className="loading-spinner-small"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="accountCategory"
                      name="accountCategory"
                      className={`form-select ${errors.accountCategory ? 'error' : ''}`}
                      value={formData.accountCategory}
                      onChange={handleInputChange}
                      disabled={!formData.accountType || loadingCategories}
                      key={formData.accountType} // Force re-render when accountType changes
                    >
                      <option value="">-- Select Account Category --</option>
                      {formData.accountType && accountCategories[normalizeAccountType(formData.accountType)] && accountCategories[normalizeAccountType(formData.accountType)].map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {errors.accountCategory && (
                  <div className="error-message">{errors.accountCategory}</div>
                )}
                {!formData.accountType && (
                  <div className="input-hint">Please select Account Type first</div>
                )}
                {formData.accountType && (!accountCategories[normalizeAccountType(formData.accountType)] || accountCategories[normalizeAccountType(formData.accountType)].length === 0) && (() => {
                  // Get the label for the selected account type
                  const accountTypeObj = getAccountTypes().find(t => t.value === formData.accountType);
                  const accountTypeLabel = accountTypeObj ? accountTypeObj.label : formData.accountType;
                  return (
                    <div className="input-hint" style={{ color: '#f59e0b' }}>
                      No categories found for {accountTypeLabel}. Please add categories in the "Account Category" screen first.
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="accountCode" className="form-label">
                Account Code <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={accountCodeSearch}
                onChange={(e) => setAccountCodeSearch(e.target.value)}
                placeholder="Search accounts by code or name..."
                disabled={!formData.accountType || !formData.accountCategory || loadingAccounts}
              />
              <div className="select-wrapper">
                {loadingAccounts ? (
                  <div className="loading-container-inline">
                    <div className="loading-spinner-small"></div>
                    <span>Loading accounts...</span>
                  </div>
                ) : (
                  <select
                    id="accountCode"
                    name="accountCode"
                    className={`form-select ${errors.accountCode ? 'error' : ''}`}
                    value={formData.accountCode}
                    onChange={handleInputChange}
                    disabled={!formData.accountType || !formData.accountCategory}
                  >
                    <option value="">-- Select Account --</option>
                    {getFilteredAccountsForDropdown().map((account) => (
                      <option key={account.id || account.account_code} value={account.account_code}>
                        {account.account_code} - {account.description}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {errors.accountCode && (
                <div className="error-message">{errors.accountCode}</div>
              )}
              {(!formData.accountType || !formData.accountCategory) && (
                <div className="input-hint">Please select Account Type and Category first</div>
              )}
              {formData.accountName && (
                <div className="selected-account-info">
                  <strong>Selected Account:</strong> {formData.accountName}
                </div>
              )}
            </div>
          </div>

          {/* Opening Balance Details Section */}
          <div className="form-section">
            <h3 className="form-section-title">Opening Balance Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="openingBalanceDate" className="form-label">
                  Opening Balance Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="openingBalanceDate"
                  name="openingBalanceDate"
                  className={`form-input ${errors.openingBalanceDate ? 'error' : ''}`}
                  value={formData.openingBalanceDate || getDefaultDate()}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.openingBalanceDate && (
                  <div className="error-message">{errors.openingBalanceDate}</div>
                )}
                <div className="input-hint">Select the date for which this opening balance applies</div>
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Amount <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {errors.amount && (
                  <div className="error-message">{errors.amount}</div>
                )}
                <div className="input-hint">Enter the opening balance amount</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Balance Type <span className="required">*</span>
              </label>
              <div className="balance-type-options">
                <label className="balance-type-option">
                  <input
                    type="radio"
                    name="balanceType"
                    value="Debit"
                    checked={formData.balanceType === 'Debit'}
                    onChange={handleBalanceTypeChange}
                  />
                  <span className="balance-type-label debit">Debit</span>
                </label>
                <label className="balance-type-option">
                  <input
                    type="radio"
                    name="balanceType"
                    value="Credit"
                    checked={formData.balanceType === 'Credit'}
                    onChange={handleBalanceTypeChange}
                  />
                  <span className="balance-type-label credit">Credit</span>
                </label>
              </div>
              {errors.balanceType && (
                <div className="error-message">{errors.balanceType}</div>
              )}
              <div className="input-hint">Select whether this is a debit or credit balance</div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-input form-textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description or notes for this opening balance..."
                rows="3"
              />
              <div className="input-hint">Add any additional notes or description (optional)</div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Save Opening Balance
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="opening-bal-footer-section">
        <p>Make sure the opening balance date is before your first transaction date for accurate accounting.</p>
      </div>
    </div>
  );
};

export default OpeningBalEntry;

