import React, { useState } from 'react';
import { accountAPI } from '../../services/api';
import AccountListView from './AccountListView';
import './Styles/AccountMaster.css';

const AccountMaster = () => {
  const [form, setForm] = useState({
    paymentMethod: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    swiftCode: '',
    iban: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');

    if (
      !form.paymentMethod.trim() ||
      !form.accountName.trim() ||
      !form.accountNumber.trim() ||
      !form.bankName.trim() ||
      !form.branchName.trim()
    ) {
      setSubmitMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const accountData = {
        payment_method: form.paymentMethod,
        account_name: form.accountName,
        account_number: form.accountNumber,
        bank_name: form.bankName,
        branch_name: form.branchName,
        swift_code: form.swiftCode,
        iban: form.iban,
      };

      let result;
      if (isEditMode && editingAccount) {
        // Update existing account
        result = await accountAPI.updateAccount(editingAccount.id, accountData);
        setSubmitMessage('Account updated successfully!');
        console.log('Account updated:', result);
      } else {
        // Create new account
        result = await accountAPI.createAccount(accountData);
        setSubmitMessage('Account master entry saved successfully!');
        console.log('Account created:', result);
      }
      
      handleReset();
      
    } catch (error) {
      console.error('Error saving account:', error);
      setSubmitMessage('Error saving account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      paymentMethod: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      swiftCode: '',
      iban: '',
    });
    setSubmitMessage('');
    setEditingAccount(null);
    setIsEditMode(false);
  };

  const handleEdit = async (accountId) => {
    try {
      const account = await accountAPI.getAccountById(accountId);
      setEditingAccount(account);
      setIsEditMode(true);
      
      // Populate form with account data
      setForm({
        paymentMethod: account.payment_method || '',
        accountName: account.account_name || '',
        accountNumber: account.account_number || '',
        bankName: account.bank_name || '',
        branchName: account.branch_name || '',
        swiftCode: account.swift_code || '',
        iban: account.iban || '',
      });
      
      setSubmitMessage('');
    } catch (error) {
      console.error('Error fetching account for edit:', error);
      setSubmitMessage('Error loading account for editing. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    handleReset();
  };

  const toggleView = () => {
    setShowListView(!showListView);
  };

  if (showListView) {
    return (
      <div className="acct-page-container">
        <div className="acct-content-wrapper">
          <div className="acct-view-toggle">
            <button onClick={toggleView} className="acct-back-btn">
              Back to Entry Form
            </button>
            <button onClick={() => window.location.reload()} className="acct-refresh-btn">
              <svg className="acct-refresh-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
              Refresh
            </button>
          </div>
          <AccountListView onEditAccount={handleEdit} />
        </div>
      </div>
    );
  }

  return (
    <div className="acct-page-container">
      <div className="acct-content-wrapper">
        <div className="acct-header-section">
          <div className="acct-header-icon">
            <svg className="acct-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="acct-header-text-group">
            <h1 className="acct-main-title">Account Master</h1>
            <p className="acct-subtitle">Configure payment methods and settlement accounts for treasury operations</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="acct-form-card">
          <div className="acct-card-header">
            <h2 className="acct-card-title">
              {isEditMode ? 'Edit Account' : 'Payment Method Configuration'}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="acct-cancel-edit-btn"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="acct-form-content">
            <form onSubmit={handleSubmit}>
              <div className="acct-form-grid">
                
                {/* Payment Method */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="acct-form-select"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Banking">Online Banking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <span className="acct-help-text">Choose the payment method for this account</span>
                </div>

                {/* Account Name */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Account Name *</label>
                  <input
                    name="accountName"
                    placeholder="e.g. Main Operating Account, Treasury Account"
                    value={form.accountName}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Descriptive name for this account</span>
                </div>

                {/* Account Number */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Account Number *</label>
                  <input
                    name="accountNumber"
                    placeholder="e.g. 5566778899"
                    value={form.accountNumber}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Primary account number</span>
                </div>

                {/* Bank Name */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Bank Name *</label>
                  <input
                    name="bankName"
                    placeholder="e.g. People's Bank"
                    value={form.bankName}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Name of the bank</span>
                </div>

                {/* Branch Name */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Branch Name *</label>
                  <input
                    name="branchName"
                    placeholder="e.g. Online Banking"
                    value={form.branchName}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Branch or service type</span>
                </div>

                {/* SWIFT Code */}
                <div className="acct-field-group">
                  <label className="acct-field-label">SWIFT Code</label>
                  <input
                    name="swiftCode"
                    placeholder="e.g. PSBKL2X"
                    value={form.swiftCode}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Bank SWIFT code (optional)</span>
                </div>

                {/* IBAN */}
                <div className="acct-field-group">
                  <label className="acct-field-label">IBAN</label>
                  <input
                    name="iban"
                    placeholder="e.g. LK5566778899001122334455"
                    value={form.iban}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">International Bank Account Number (optional)</span>
                </div>
              </div>

              {/* Error Message */}
              {submitMessage && (
                <div className={`acct-submit-message ${submitMessage.includes('Error') ? 'acct-error-message' : 'acct-success-message'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="acct-button-section">
                <button
                  type="button"
                  onClick={handleReset}
                  className="acct-btn acct-btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={toggleView}
                  className="acct-btn acct-btn-tertiary"
                >
                  View Existing Methods
                </button>
                <button
                  type="submit"
                  className="acct-btn acct-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Saving...') 
                    : (isEditMode ? 'Update Account' : 'Verify & Save')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="acct-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure payment method configuration • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default AccountMaster;