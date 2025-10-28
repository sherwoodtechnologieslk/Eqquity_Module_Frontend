import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Styles/OtherTransactions.css';
import { accountAPI, otherTransactionAPI, otherTransactionGLEntryAPI } from '../../services/api';
import { authService } from '../../services/authService';

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
  
  // New states for viewing vouchers and general ledger
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'view', or 'generalLedger'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'income', 'expense', 'asset', 'liability'
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState([]);
  const [generalLedgerLoading, setGeneralLedgerLoading] = useState(false);

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

  // Fetch vouchers when viewing tab is active
  useEffect(() => {
    if (activeTab === 'view') {
      fetchVouchers();
    } else if (activeTab === 'generalLedger') {
      fetchGeneralLedger();
    }
  }, [activeTab]);

  // Fetch general ledger entries for Other Transactions only
  const fetchGeneralLedger = async () => {
    try {
      setGeneralLedgerLoading(true);
      
      // Fetch GL entries specific to Other Transactions for the logged-in user
      const data = await otherTransactionGLEntryAPI.getEntriesByUser();
      setGeneralLedgerEntries(data || []);
    } catch (error) {
      console.error('Error fetching other transaction GL entries:', error);
      setGeneralLedgerEntries([]);
    } finally {
      setGeneralLedgerLoading(false);
    }
  };

  // Fetch vouchers based on category filter
  const fetchVouchers = async () => {
    try {
      setVouchersLoading(true);
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';
      
      const data = await otherTransactionAPI.getTransactionsByUser(userEmail);
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  };

  // Filter vouchers by active category
  const getFilteredVouchers = () => {
    if (activeCategory === 'all') {
      return vouchers;
    }
    return vouchers.filter(v => v.account_type === activeCategory);
  };

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
      // Get user email from auth service
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';

      // Prepare transaction data
      const transactionData = {
        voucherNumber: form.voucherNumber,
        accountType: form.accountType,
        transactionType: form.transactionType,
        description: form.description,
        amount: form.amount,
        date: form.date,
        reference: form.reference,
        currency: form.currency,
        fxRate: form.fxRate,
        counterparty: form.counterparty,
        notes: form.notes,
        cashFlowOnSettlement: form.cashFlowOnSettlement,
        paymentAccountName: form.paymentAccountName,
        paymentAccountNumber: form.paymentAccountNumber,
        paymentBankName: form.paymentBankName,
        paymentBranchName: form.paymentBranchName,
        paymentMethod: form.paymentMethod,
        userEmail: userEmail
      };

      // Call API to save the transaction
      const result = await otherTransactionAPI.createTransaction(transactionData);
      
      console.log('Transaction saved successfully:', result);
      setSubmitMessage('Transaction saved successfully!');
      handleReset();
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      setSubmitMessage(`Error saving transaction: ${error.message}`);
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

  // Handle view voucher details - reuse the existing preview modal
  const handleViewVoucher = (voucher) => {
    // Populate form with voucher data for preview
    setForm({
      voucherNumber: voucher.voucher_number,
      accountType: voucher.account_type,
      transactionType: voucher.transaction_type || '',
      description: voucher.description || '',
      amount: voucher.amount || '',
      date: voucher.transaction_date || '',
      reference: voucher.reference || '',
      currency: voucher.currency || 'LKR',
      fxRate: voucher.fx_rate || '1.00',
      counterparty: voucher.counterparty || '',
      notes: voucher.notes || '',
      cashFlowOnSettlement: voucher.cash_flow_on_settlement || '',
      selectedAccountId: '',
      settlementAccount: `${voucher.payment_account_name || ''} - ${voucher.payment_account_number || ''}`.trim(),
      paymentAccountName: voucher.payment_account_name || '',
      paymentAccountNumber: voucher.payment_account_number || '',
      paymentBankName: voucher.payment_bank_name || '',
      paymentBranchName: voucher.payment_branch_name || '',
      paymentMethod: voucher.payment_method || ''
    });
    setShowPreviewModal(true);
  };

  // Handle delete voucher
  const handleDeleteVoucher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) {
      return;
    }
    
    try {
      await otherTransactionAPI.deleteTransaction(id);
      // Refresh the list
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Error deleting voucher. Please try again.');
    }
  };

  const filteredVouchers = getFilteredVouchers();

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

        {/* Tab Navigation */}
        <div className="other-trans-tab-navigation" style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'create' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'create' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'create' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            Create Voucher
          </button>
          <button
            onClick={() => setActiveTab('view')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'view' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'view' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'view' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            View Vouchers
          </button>
          <button
            onClick={() => setActiveTab('generalLedger')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'generalLedger' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'generalLedger' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'generalLedger' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            General Ledger
          </button>
        </div>

        {/* Conditional Render: Create Form or View List */}
        {activeTab === 'create' ? (
          /* Form Card */
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
        ) : activeTab === 'view' ? (
          /* Voucher List View */
          <div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setActiveCategory('all')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: activeCategory === 'all' ? '#3b82f6' : '#f3f4f6',
                  color: activeCategory === 'all' ? 'white' : '#374151',
                  fontWeight: activeCategory === 'all' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('income')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: activeCategory === 'income' ? '#10b981' : '#f3f4f6',
                  color: activeCategory === 'income' ? 'white' : '#374151',
                  fontWeight: activeCategory === 'income' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Income
              </button>
              <button
                onClick={() => setActiveCategory('expense')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: activeCategory === 'expense' ? '#ef4444' : '#f3f4f6',
                  color: activeCategory === 'expense' ? 'white' : '#374151',
                  fontWeight: activeCategory === 'expense' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Expense
              </button>
              <button
                onClick={() => setActiveCategory('asset')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: activeCategory === 'asset' ? '#8b5cf6' : '#f3f4f6',
                  color: activeCategory === 'asset' ? 'white' : '#374151',
                  fontWeight: activeCategory === 'asset' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Asset
              </button>
              <button
                onClick={() => setActiveCategory('liability')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  background: activeCategory === 'liability' ? '#f59e0b' : '#f3f4f6',
                  color: activeCategory === 'liability' ? 'white' : '#374151',
                  fontWeight: activeCategory === 'liability' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Liability
              </button>
            </div>

            {/* Voucher Grid */}
            {vouchersLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading vouchers...</p>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: 'white',
                borderRadius: '0.375rem',
                color: '#6b7280'
              }}>
                <p>No vouchers found. Create one using the "Create Voucher" tab.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredVouchers.map((voucher) => (
                  <div 
                    key={voucher.id}
                    style={{
                      background: 'white',
                      borderRadius: '0.375rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => handleViewVoucher(voucher)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {voucher.voucher_number}
                        </h3>
                        <p style={{ 
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          margin: '0.25rem 0 0 0'
                        }}>
                          {voucher.transaction_date}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: voucher.account_type === 'income' ? '#d1fae5' : 
                                   voucher.account_type === 'expense' ? '#fee2e2' :
                                   voucher.account_type === 'asset' ? '#ede9fe' : '#fef3c7',
                        color: voucher.account_type === 'income' ? '#065f46' : 
                               voucher.account_type === 'expense' ? '#991b1b' :
                               voucher.account_type === 'asset' ? '#6d28d9' : '#92400e'
                      }}>
                        {voucher.account_type}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: '0.5rem 0'
                    }}>
                      {voucher.transaction_type || 'N/A'}
                    </h4>

                    {voucher.amount && (
                      <div style={{
                        margin: '0.75rem 0',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '0.25rem'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Amount</div>
                        <div style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '700', 
                          color: '#1f2937' 
                        }}>
                          {parseFloat(voucher.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {voucher.currency}
                        </div>
                      </div>
                    )}

                    {voucher.counterparty && (
                      <p style={{ 
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.5rem 0'
                      }}>
                        Counterparty: {voucher.counterparty}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewVoucher(voucher);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid #3b82f6',
                          background: 'transparent',
                          color: '#3b82f6',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.875rem'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVoucher(voucher.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'generalLedger' && (
          <div>
            {generalLedgerLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading general ledger entries...</p>
              </div>
            ) : generalLedgerEntries.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: 'white',
                borderRadius: '0.375rem',
                color: '#6b7280'
              }}>
                <p>No general ledger entries found.</p>
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '0.375rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1.125rem'
                }}>
                  General Ledger Entries ({generalLedgerEntries.length})
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Account Code</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Account Name</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Debit</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Credit</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalLedgerEntries.slice(0, 50).map((entry, index) => (
                        <tr key={entry.id || index} style={{ 
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            {entry.date || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                            {entry.account_code || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151' }}>
                            {entry.account_name || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: entry.debit > 0 ? '#059669' : '#6b7280', fontWeight: entry.debit > 0 ? '600' : '400' }}>
                            {entry.debit && entry.debit > 0 ? parseFloat(entry.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: entry.credit > 0 ? '#dc2626' : '#6b7280', fontWeight: entry.credit > 0 ? '600' : '400' }}>
                            {entry.credit && entry.credit > 0 ? parseFloat(entry.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            {entry.description || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: entry.status === 'Posted' ? '#d1fae5' : '#fee2e2',
                              color: entry.status === 'Posted' ? '#065f46' : '#991b1b'
                            }}>
                              {entry.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {generalLedgerEntries.length > 50 && (
                  <div style={{ 
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    Showing first 50 entries of {generalLedgerEntries.length} total entries
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="other-trans-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Non-Trading Transactions Management • All data is encrypted and protected</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="other-trans-preview-modal-overlay" 
          onClick={() => setShowPreviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            overflow: 'auto'
          }}
        >
          <div 
            className="other-trans-preview-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '0.18rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div className="other-trans-preview-modal-header">
              <h2 className="other-trans-preview-modal-title">
                <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.75rem' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
                Voucher Preview
              </h2>
              <button 
                className="other-trans-preview-close-btn"
                onClick={() => setShowPreviewModal(false)}
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <div className="other-trans-preview-modal-body">
              <div className="other-trans-preview-section">
                <h3 className="other-trans-preview-section-title">Transaction Details</h3>
                <div className="other-trans-preview-grid">
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Voucher Number:</span>
                    <span className={`other-trans-preview-value ${!form.voucherNumber ? 'empty-value' : ''}`}>
                      {form.voucherNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Defined Item:</span>
                    <span className={`other-trans-preview-value ${!form.accountType ? 'empty-value' : ''}`}>
                      {form.accountType || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Transaction Type:</span>
                    <span className={`other-trans-preview-value ${!form.transactionType ? 'empty-value' : ''}`}>
                      {form.transactionType || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Date:</span>
                    <span className={`other-trans-preview-value ${!form.date ? 'empty-value' : ''}`}>
                      {form.date || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Amount:</span>
                    <span className={`other-trans-preview-value ${!form.amount ? 'empty-value' : ''}`}>
                      {form.amount ? `${form.amount} ${form.currency || 'LKR'}` : 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Currency:</span>
                    <span className="other-trans-preview-value">{form.currency || 'LKR'}</span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">FX Rate:</span>
                    <span className={`other-trans-preview-value ${!form.fxRate ? 'empty-value' : ''}`}>
                      {form.fxRate || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Reference:</span>
                    <span className={`other-trans-preview-value ${!form.reference ? 'empty-value' : ''}`}>
                      {form.reference || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Counterparty:</span>
                    <span className={`other-trans-preview-value ${!form.counterparty ? 'empty-value' : ''}`}>
                      {form.counterparty || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="other-trans-preview-label">Description:</span>
                    <span className={`other-trans-preview-value ${!form.description ? 'empty-value' : ''}`}>
                      {form.description || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="other-trans-preview-section">
                <h3 className="other-trans-preview-section-title">Payment & Settlement Details</h3>
                <div className="other-trans-preview-grid">
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Cash Flow On Settlement:</span>
                    <span className={`other-trans-preview-value ${!form.cashFlowOnSettlement ? 'empty-value' : ''}`}>
                      {form.cashFlowOnSettlement ? `Rs. ${form.cashFlowOnSettlement}` : 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="other-trans-preview-label">Account:</span>
                    <span className={`other-trans-preview-value ${!form.settlementAccount ? 'empty-value' : ''}`}>
                      {form.settlementAccount || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Account Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentAccountName ? 'empty-value' : ''}`}>
                      {form.paymentAccountName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Account Number:</span>
                    <span className={`other-trans-preview-value ${!form.paymentAccountNumber ? 'empty-value' : ''}`}>
                      {form.paymentAccountNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Bank Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentBankName ? 'empty-value' : ''}`}>
                      {form.paymentBankName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Branch Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentBranchName ? 'empty-value' : ''}`}>
                      {form.paymentBranchName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Payment Method:</span>
                    <span className={`other-trans-preview-value ${!form.paymentMethod ? 'empty-value' : ''}`}>
                      {form.paymentMethod || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {form.notes && (
                <div className="other-trans-preview-section">
                  <h3 className="other-trans-preview-section-title">Notes</h3>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-value" style={{ paddingLeft: 0 }}>{form.notes}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="other-trans-preview-modal-footer">
              <button 
                className="other-trans-btn other-trans-btn-secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default OtherTransactions;
