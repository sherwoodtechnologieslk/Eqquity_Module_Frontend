import React, { useState, useEffect } from 'react';
import './Styles/OtherTransactions.css';
import { accountAPI } from '../../services/api';

// Function to generate unique voucher numbers
const generateVoucherNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `V-${year}${month}${day}-${hour}${minute}${second}`;
};

const OtherTransactions = () => {
  const [form, setForm] = useState({
    voucherNumber: generateVoucherNumber(),
    accountType: '',
    transactionType: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    currency: 'LKR',
    fxRate: '1.00',
    counterparty: '',
    notes: '',
    cashFlowOnSettlement: '',
    selectedAccountId: '',
    settlementAccount: '',
    paymentAccountName: '',
    paymentAccountNumber: '',
    paymentBankName: '',
    paymentBranchName: '',
    paymentMethod: ''
  });

  // Transaction type options based on defined item
  const transactionTypes = {
    income: ['Salary', 'Rent Income', 'Interest Income', 'Dividend Income', 'Commission Income', 'Other Income'],
    expense: ['Rental Payment', 'Educational Expenses', 'Travel Expenses', 'Office Expenses', 'Utilities', 'Professional Fees', 'Insurance', 'Other Expenses'],
    liability: ['Accounts Payable', 'Loans Payable', 'Tax Payable', 'Accrued Liabilities', 'Bonds Payable', 'Other Liabilities'],
    asset: ['Cash', 'Bank Deposits', 'Accounts Receivable', 'Inventory', 'Fixed Assets', 'Investments', 'Other Assets']
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setAccountsLoading(true);
        const accountData = await accountAPI.getAllAccounts();
        setAccounts(accountData || []);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Calculate Cash Flow On Settlement when amount or fxRate changes
  useEffect(() => {
    if (form.amount && form.fxRate) {
      const calculatedValue = (parseFloat(form.amount) || 0) * (parseFloat(form.fxRate) || 0);
      setForm(prev => ({
        ...prev,
        cashFlowOnSettlement: calculatedValue.toFixed(2)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        cashFlowOnSettlement: ''
      }));
    }
  }, [form.amount, form.fxRate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle account selection from dropdown
    if (name === 'selectedAccountId') {
      const selectedAccount = accounts.find(acc => acc.id.toString() === value);
      if (selectedAccount) {
        setForm(prev => ({
          ...prev,
          settlementAccount: `${selectedAccount.account_name} - ${selectedAccount.account_number}`,
          paymentAccountName: selectedAccount.account_name,
          paymentAccountNumber: selectedAccount.account_number,
          paymentBankName: selectedAccount.bank_name,
          paymentBranchName: selectedAccount.branch_name
        }));
      }
      return;
    }

    // If defined item changes, reset transaction type
    if (name === 'accountType') {
      setForm({ ...form, [name]: value, transactionType: '' });
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['accountType'];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // TODO: Implement API call to save the transaction
      console.log('Submitting transaction:', form);
      
      setSubmitMessage('Transaction saved successfully!');
      handleReset();
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      setSubmitMessage('Error saving transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      voucherNumber: generateVoucherNumber(),
      accountType: '',
      transactionType: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      currency: 'LKR',
      fxRate: '1.00',
      counterparty: '',
      notes: '',
      cashFlowOnSettlement: '',
      selectedAccountId: '',
      settlementAccount: '',
      paymentAccountName: '',
      paymentAccountNumber: '',
      paymentBankName: '',
      paymentBranchName: '',
      paymentMethod: ''
    });
    setSubmitMessage('');
  };

  return (
    <div className="other-trans-page-container">
      <div className="other-trans-content-wrapper">
        <div className="other-trans-header-section">
          <div className="other-trans-header-icon">
            <svg className="other-trans-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="other-trans-header-text-group">
            <h1 className="other-trans-main-title">Non-Trading Transactions</h1>
            <p className="other-trans-subtitle">Manage other income, expenses, and assets. Multi-currency supported.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="other-trans-form-card">
          <div className="other-trans-card-header">
            <h2 className="other-trans-card-title">Transaction Information</h2>
          </div>

          <div className="other-trans-form-content">
            <form onSubmit={handleSubmit}>
              <div className="other-trans-form-grid">

                {/* Voucher Number */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="other-trans-field-label" style={{ marginBottom: 0 }}>Voucher Number</label>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, voucherNumber: generateVoucherNumber() }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.15rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  <input
                    name="voucherNumber"
                    value={form.voucherNumber}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Auto-generated voucher number
                  </small>
                </div>

                {/* Account Type */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Defined Item *</label>
                  <select
                    name="accountType"
                    value={form.accountType}
                    onChange={handleChange}
                    className="other-trans-form-select"
                  >
                    <option value="">Select Defined Item</option>
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                {/* Transaction Type */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Transaction Type</label>
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                    className="other-trans-form-select"
                    disabled={!form.accountType}
                  >
                    <option value="">Select Transaction Type</option>
                    {form.accountType && transactionTypes[form.accountType]?.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {!form.accountType && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Please select a Defined Item first
                    </small>
                  )}
                </div>

                {/* Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Transaction Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Currency */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Currency *</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="other-trans-form-select"
                  >
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                </div>

                {/* FX Rate */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">FX Rate → LKR</label>
                  <input
                    type="number"
                    name="fxRate"
                    step="0.0001"
                    placeholder="Enter exchange rate"
                    value={form.fxRate}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Amount */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    placeholder="Enter reference number"
                    value={form.reference}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Counterparty */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Counterparty</label>
                  <input
                    name="counterparty"
                    placeholder="Enter counterparty name"
                    value={form.counterparty}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter transaction description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>
              </div>

              {/* Payment & Settlement Details Section */}
              <div className="other-trans-section-divider" style={{ 
                margin: '2.5rem 0 1.5rem 0',
                borderTop: '2px solid #e5e7eb',
                paddingTop: '2rem'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                    borderRadius: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.11)'
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Payment & Settlement Details</h3>
                </div>
                
                <div className="other-trans-form-grid">
                  {/* Cash Flow On Settlement */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Cash Flow On Settlement (Rs.)</label>
                    <input
                      name="cashFlowOnSettlement"
                      value={form.cashFlowOnSettlement}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Account Selection Dropdown */}
                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Select Account</label>
                    <select
                      name="selectedAccountId"
                      value={form.selectedAccountId}
                      onChange={handleChange}
                      className="other-trans-form-select"
                      disabled={accountsLoading}
                    >
                      <option value="">Select an account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} - {account.account_number} ({account.bank_name})
                        </option>
                      ))}
                    </select>
                    {accountsLoading && <small style={{ color: '#6b7280' }}>Loading accounts...</small>}
                  </div>

                  {/* Account Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Account Name</label>
                    <input
                      name="paymentAccountName"
                      placeholder="Auto-filled"
                      value={form.paymentAccountName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Account Number */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Account Number</label>
                    <input
                      name="paymentAccountNumber"
                      placeholder="Auto-filled"
                      value={form.paymentAccountNumber}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Bank Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Bank Name</label>
                    <input
                      name="paymentBankName"
                      placeholder="Auto-filled"
                      value={form.paymentBankName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Branch Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Branch Name</label>
                    <input
                      name="paymentBranchName"
                      placeholder="Auto-filled"
                      value={form.paymentBranchName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      className="other-trans-form-select"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online Banking">Online Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="other-trans-notes-section">
                <label className="other-trans-field-label">Notes & Additional Information</label>
                <textarea
                  name="notes"
                  placeholder="Add any additional notes or information..."
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  className="other-trans-form-textarea"
                ></textarea>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="other-trans-btn other-trans-btn-tertiary"
                  disabled={isSubmitting}
                  onClick={() => setShowPreviewModal(true)}
                >
                  Preview Voucher
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="other-trans-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Non-Trading Transactions Management • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default OtherTransactions;
