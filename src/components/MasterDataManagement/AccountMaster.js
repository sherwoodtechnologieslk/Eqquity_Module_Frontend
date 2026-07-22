import React, { useState } from 'react';
import { accountAPI } from '../../services/api';
import AccountListView from './AccountListView';
import './Styles/EquityMasterEntry.css';
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

      if (isEditMode && editingAccount) {
        await accountAPI.updateAccount(editingAccount.id, accountData);
        setSubmitMessage('Account updated successfully!');
      } else {
        await accountAPI.createAccount(accountData);
        setSubmitMessage('Account master entry saved successfully!');
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
      setShowListView(false);

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
      <div className="eqt-page-container acct-page">
        <div className="eqt-content-wrapper">
          <div className="eqt-view-toggle">
            <button type="button" onClick={toggleView} className="eqt-back-btn">
              Back to Entry Form
            </button>
            <button type="button" onClick={() => window.location.reload()} className="eqt-refresh-btn">
              <svg className="eqt-refresh-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh
            </button>
          </div>
          <div className="eqt-form-card eqt-list-card">
            <div className="eqt-card-header">
              <h2 className="eqt-card-title">Existing Accounts</h2>
            </div>
            <AccountListView onEditAccount={handleEdit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eqt-page-container acct-page">
      <div className="eqt-content-wrapper">
        <div className="eqt-header-section">
          <div className="eqt-header-icon">
            <svg className="eqt-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="eqt-header-text-group">
            <h1 className="eqt-main-title">Account Master</h1>
            <p className="eqt-subtitle">
              Configure payment methods and settlement accounts for treasury operations
            </p>
          </div>
        </div>

        <div className="eqt-form-card acct-form-shell">
          <div className={`eqt-card-header${isEditMode ? ' eqt-card-header-row' : ''}`}>
            <h2 className="eqt-card-title">
              {isEditMode ? 'Edit Account' : 'Payment Method Configuration'}
            </h2>
            {isEditMode && (
              <button type="button" onClick={handleCancelEdit} className="eqt-cancel-edit-btn">
                Cancel Edit
              </button>
            )}
          </div>

          <div className="eqt-form-content acct-form-body">
            <form onSubmit={handleSubmit}>
              <section className="acct-section-panel">
                <div className="acct-section-heading">
                  <h3 className="acct-section-heading__title">Account Details</h3>
                  <p className="acct-section-heading__hint">
                    Payment method and bank account identity
                  </p>
                </div>

                <div className="eqt-form-grid acct-form-grid">
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Payment Method *</label>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      className="eqt-form-select"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online Banking">Online Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                    <span className="eqt-help-text">Choose the payment method for this account</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Account Name *</label>
                    <input
                      name="accountName"
                      placeholder="e.g. Main Operating Account, Treasury Account"
                      value={form.accountName}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">Descriptive name for this account</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Account Number *</label>
                    <input
                      name="accountNumber"
                      placeholder="e.g. 5566778899"
                      value={form.accountNumber}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">Primary account number</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Bank Name *</label>
                    <input
                      name="bankName"
                      placeholder="e.g. People's Bank"
                      value={form.bankName}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">Name of the bank</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Branch Name *</label>
                    <input
                      name="branchName"
                      placeholder="e.g. Online Banking"
                      value={form.branchName}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">Branch or service type</span>
                  </div>
                </div>
              </section>

              <section className="acct-section-panel">
                <div className="acct-section-heading">
                  <h3 className="acct-section-heading__title">International Codes</h3>
                  <p className="acct-section-heading__hint">Optional SWIFT and IBAN details</p>
                </div>

                <div className="eqt-form-grid acct-form-grid">
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">SWIFT Code</label>
                    <input
                      name="swiftCode"
                      placeholder="e.g. PSBKL2X"
                      value={form.swiftCode}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">Bank SWIFT code (optional)</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">IBAN</label>
                    <input
                      name="iban"
                      placeholder="e.g. LK5566778899001122334455"
                      value={form.iban}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                    <span className="eqt-help-text">International Bank Account Number (optional)</span>
                  </div>
                </div>
              </section>

              {submitMessage && (
                <div
                  className={`eqt-message ${
                    submitMessage.includes('Error') ? 'eqt-error' : 'eqt-success'
                  }`}
                >
                  {submitMessage}
                </div>
              )}

              <div className="eqt-button-section acct-form-actions">
                <button type="button" onClick={handleReset} className="eqt-btn eqt-btn-secondary">
                  Reset Form
                </button>
                <button type="button" onClick={toggleView} className="eqt-btn eqt-btn-tertiary">
                  View Existing Methods
                </button>
                <button type="submit" className="eqt-btn eqt-btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Saving...'
                    : isEditMode
                      ? 'Update Account'
                      : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="eqt-footer-section">
          <p>
            SHERWOOD TECHNOLOGIES (PVT) LTD • Secure payment method configuration • All data is
            encrypted and protected
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountMaster;
