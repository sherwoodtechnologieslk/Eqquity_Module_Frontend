import React, { useState, useEffect } from 'react';
import './Styles/NewGLAccount.css';

const NewGLAccount = () => {
  const [formData, setFormData] = useState({
    accountCode: '',
    description: '',
    accountType: '',
    parentAccount: '',
    activeStatus: 'Yes',
    accountCategory: '',
    normalBalance: 'Debit'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');

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

    // Simulate API call delay
    setTimeout(() => {
      console.log('New GL Account Data:', formData);
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
          normalBalance: 'Debit'
        });
        setSuggestedCode('');
        setShowSuccess(false);
      }, 3000);
    }, 1500);
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
      normalBalance: 'Debit'
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
          <h1 className="new-gl-main-title">New GL Account</h1>
          <p className="new-gl-subtitle">Create a new general ledger account for your chart of accounts</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="new-gl-success-message">
          <div className="success-icon">✓</div>
          <div className="success-text">
            <h3>Account Created Successfully!</h3>
            <p>Your new GL account has been added to the chart of accounts.</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">Account Details</h2>
          <p className="new-gl-form-subtitle">Fill in the details below to create a new general ledger account</p>
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
                  Normal Balance
                </label>
                <select
                  id="normalBalance"
                  name="normalBalance"
                  value={formData.normalBalance}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
                <div className="input-hint">Determines how debits and credits affect this account</div>
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

      {/* Footer */}
      <div className="new-gl-footer-section">
        <p>SHERWOOD TECHNOLOGIES (PVT) LTD • General Ledger Account Management • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default NewGLAccount;

