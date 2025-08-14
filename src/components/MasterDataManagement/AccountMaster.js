import React, { useState } from 'react';
import { accountAPI } from '../../services/api';
import AccountListView from './AccountListView';
import './Styles/AccountMaster.css';

const AccountMaster = () => {
  const [form, setForm] = useState({
    paymentMethod: '',
    paymentMethodOwner: '',
    paymentMethodCode: '',
    settlement1: '',
    settlement2: '',
    settlement3: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);

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
      !form.paymentMethodOwner.trim() ||
      !form.paymentMethodCode.trim() ||
      !form.settlement1.trim()
    ) {
      setSubmitMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // We can combine settlement accounts into a single array or string
      const settlementAccounts = [form.settlement1, form.settlement2, form.settlement3]
        .filter(Boolean) // Remove empty strings
        .join(', '); // Join them into a single string

      const accountData = {
        payment_method: form.paymentMethod,
        owner: form.paymentMethodOwner,
        method_code: form.paymentMethodCode,
        settlement_accounts: settlementAccounts,
      };

      const result = await accountAPI.createAccount(accountData);
      
      setSubmitMessage('Account master entry saved successfully!');
      console.log('Account created:', result);
      
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
      paymentMethodOwner: '',
      paymentMethodCode: '',
      settlement1: '',
      settlement2: '',
      settlement3: '',
    });
    setSubmitMessage('');
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
          <AccountListView />
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
            <h2 className="acct-card-title">Payment Method Configuration</h2>
          </div>

          <div className="acct-form-content">
            <form onSubmit={handleSubmit}>
              <div className="acct-form-grid">
                
                {/* Payment Method */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Payment Method *</label>
                  <input
                    name="paymentMethod"
                    placeholder="e.g. RTGS, CEFT, SLIPS, CHEQUE, CBSL"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Available methods: RTGS, CEFT, SLIPS, CHEQUE, CBSL</span>
                </div>

                {/* Payment Method Owner */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Payment Method Owner *</label>
                  <input
                    name="paymentMethodOwner"
                    placeholder="Finance"
                    value={form.paymentMethodOwner}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Department responsible for this payment method</span>
                </div>

                {/* Payment Method Code */}
                <div className="acct-field-group">
                  <label className="acct-field-label">Payment Method Code *</label>
                  <input
                    name="paymentMethodCode"
                    placeholder="RTGS1, RTGS2, RTGS3, CEFT 1"
                    value={form.paymentMethodCode}
                    onChange={handleChange}
                    className="acct-form-input"
                  />
                  <span className="acct-help-text">Unique identifier: RTGS1, RTGS2, RTGS3, CEFT1</span>
                </div>
              </div>

              {/* Settlement Accounts Section */}
              <div className="acct-settlement-section">
                <label className="acct-field-label">Settlement Accounts *</label>
                <div className="acct-settlement-grid">
                  <div className="acct-field-group">
                    <input
                      name="settlement1"
                      placeholder="Primary settlement account (required)"
                      value={form.settlement1}
                      onChange={handleChange}
                      className="acct-form-input"
                    />
                    <span className="acct-help-text">Primary account (required)</span>
                  </div>
                  <div className="acct-field-group">
                    <input
                      name="settlement2"
                      placeholder="Secondary settlement account (optional)"
                      value={form.settlement2}
                      onChange={handleChange}
                      className="acct-form-input"
                    />
                    <span className="acct-help-text">Secondary account (optional)</span>
                  </div>
                  <div className="acct-field-group">
                    <input
                      name="settlement3"
                      placeholder="Tertiary settlement account (optional)"
                      value={form.settlement3}
                      onChange={handleChange}
                      className="acct-form-input"
                    />
                    <span className="acct-help-text">Tertiary account (optional)</span>
                  </div>
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
                  {isSubmitting ? 'Saving...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="acct-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure payment method configuration • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default AccountMaster;