import React, { useState, useEffect } from 'react';
import './Styles/BuyTransactionEntry.css';
import TransactionModal from './TransactionModal';
import PaymentMethodModal from './PaymentMethodModal';
import { equityAPI, portfolioAPI, tradeSummaryAPI, costOfFundsAPI, transactionEntryAPI } from '../../services/api';
import BuyTransactionListView from './BuyTransactionListView';
import EquitySelectorModal from './EquitySelectorModal';


const STORAGE_KEY = 'buy_transactions';

const getToday = () => new Date().toISOString().slice(0, 10);

// Function to get today's date string in YYYYMMDD format
const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Function to extract sequence number from deal number
const extractSequenceFromDealNumber = (dealNumber) => {
  // Format: BUY-YYYYMMDD-XXXXXX where XXXXXX is the sequence
  const match = dealNumber.match(/BUY-\d{8}-(\d{6})/);
  return match ? parseInt(match[1], 10) : 0;
};

// Function to generate unique deal numbers with sequential numbering per day
const generateDealNumber = async () => {
  const todayDateString = getTodayDateString();
  const datePrefix = `BUY-${todayDateString}-`;
  
  try {
    // Try to fetch all buy transactions from the backend
    // We'll check for today's transactions to find the max sequence
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/transaction-entries/buy-all`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (response.ok) {
      const transactions = await response.json();
      // Filter transactions for today and extract sequence numbers
      const todayTransactions = (transactions || []).filter(t => {
        if (!t.deal_number) return false;
        return t.deal_number.startsWith(datePrefix);
      });
      
      if (todayTransactions.length > 0) {
        const maxSequence = Math.max(
          ...todayTransactions.map(t => extractSequenceFromDealNumber(t.deal_number))
        );
        const nextSequence = maxSequence + 1;
        return `${datePrefix}${String(nextSequence).padStart(6, '0')}`;
      }
    }
  } catch (error) {
    console.log('Could not fetch transactions from backend, using localStorage or default:', error);
    // Fallback to localStorage if backend is not available
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const transactions = stored ? JSON.parse(stored) : [];
      const todayTransactions = transactions.filter(t => {
        if (!t.dealNumber) return false;
        return t.dealNumber.startsWith(datePrefix);
      });
      
      if (todayTransactions.length > 0) {
        const maxSequence = Math.max(
          ...todayTransactions.map(t => extractSequenceFromDealNumber(t.dealNumber))
        );
        const nextSequence = maxSequence + 1;
        return `${datePrefix}${String(nextSequence).padStart(6, '0')}`;
      }
    } catch (localError) {
      console.log('Could not read from localStorage:', localError);
    }
  }
  
  // If no transactions found for today, start from 000001
  return `${datePrefix}000001`;
};

const BuyTransactionEntry = () => {
  // Equities for dropdown
  const [equities, setEquities] = useState([]);
  const [equitiesLoading, setEquitiesLoading] = useState(true);

  // Portfolios for dropdown
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);

  // Transactions persist in localStorage
  const [transactions, setTransactions] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [form, setForm] = useState({
    companyName: '',
    symbol: '', // <-- Add symbol to form state
    portfolio: '',
    portfolioId: '', // <-- Add this field
    dealNumber: '', // Will be set in useEffect
    description: '', // <-- Add description field
    quantity: '',
    price: '',
    grossValue: '',
    brokerage: '',
    cseFees: '',
    cdsFees: '',
    clearingFees: '',
    sec: '',
    stl: '',
    netValue: '',
    contractNumber: '',
    brokerName: '',
    tradeDate: getToday(),
    settlementDate: getToday(),
    settlementAccount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    cashFlowOnSettlement: '',
    paymentMethod: '',
    generatePayment: 'No',
    moneyGenerationCost: '',
    costOfFunds: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [showListView, setShowListView] = useState(false);
  const [showEquitySelector, setShowEquitySelector] = useState(false);

  // Function to regenerate deal number
  const regenerateDealNumber = async () => {
    const newDealNumber = await generateDealNumber();
    setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
  };

  // Initialize deal number on component mount
  useEffect(() => {
    const initDealNumber = async () => {
      const newDealNumber = await generateDealNumber();
      setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
    };
    initDealNumber();
  }, []);

  // Fetch active cost of funds on mount
  useEffect(() => {
    const fetchActiveCostOfFunds = async () => {
      try {
        const activeCostOfFunds = await costOfFundsAPI.getActiveCostOfFunds();
        if (activeCostOfFunds && activeCostOfFunds.after_tax_cost_of_funds) {
          setForm(prev => ({ 
            ...prev, 
            costOfFunds: parseFloat(activeCostOfFunds.after_tax_cost_of_funds).toFixed(2)
          }));
        }
      } catch (error) {
        console.log('No active cost of funds definition found, using default value');
        // Keep the field empty if no active cost of funds is found
      }
    };

    fetchActiveCostOfFunds();
  }, []);

  // Fetch equities for dropdown on mount
  useEffect(() => {
    setEquitiesLoading(true);
    equityAPI.getActiveEquities()
      .then(data => setEquities(data))
      .catch(() => setEquities([]))
      .finally(() => setEquitiesLoading(false));
  }, []);

  // Fetch active portfolios for dropdown on mount
  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
  }, []);

  // Persist to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // Input handler with non-blocking calculations to avoid typing delay
  const handleChange = async (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    // Autofill portfolioId when portfolio name changes
    if (name === 'portfolio') {
      const selectedPortfolio = portfolios.find(p => p.portfolioName === value);
      // Only use the string portfolioId, never the numeric id
      updatedForm.portfolioId = selectedPortfolio ? selectedPortfolio.portfolioId : '';
    }

    // Autofill symbol when companyName changes
    if (name === 'companyName') {
      const selectedEquity = equities.find(eq => eq.name === value);
      updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
    }

    // If Cost of Funds is cleared, also clear Money Generation Cost
    if (name === 'costOfFunds' && !value.trim()) {
      updatedForm = { ...updatedForm, moneyGenerationCost: '' };
    }

    // Handle payment method selection
    if (name === 'paymentMethod' && value) {
      setSelectedPaymentMethod(value);
      setShowPaymentModal(true);
      // Don't update form yet, wait for account selection
      return;
    }

    // Always update form state immediately to avoid input lag
    setForm(updatedForm);

    // Recalculate only when quantity or price changes, in the background
    if (name === 'quantity' || name === 'price') {
      const latestQuantity = name === 'quantity' ? value : updatedForm.quantity;
      const latestPrice = name === 'price' ? value : updatedForm.price;

      // If either value is empty, just clear calculated fields and skip API
      if (!latestQuantity || !latestPrice) {
        setForm(prev => ({
          ...prev,
          grossValue: '',
          brokerage: '',
          cseFees: '',
          cdsFees: '',
          clearingFees: '',
          sec: '',
          stl: '',
          netValue: '',
          cashFlowOnSettlement: '',
          stepUp: undefined,
          moneyGenerationCost: ''
        }));
        return;
      }

      try {
        const calc = await tradeSummaryAPI.calculateBuyTransaction({
          quantity: latestQuantity,
          price: latestPrice,
          costOfFunds: updatedForm.costOfFunds
        });

        // Only apply results if quantity/price haven't changed since we started the call
        setForm(prev => {
          if (prev.quantity !== latestQuantity || prev.price !== latestPrice) {
            return prev;
          }
          return {
            ...prev,
          grossValue: calc.grossValue,
          brokerage: calc.brokerage,
          cseFees: calc.cseFees,
          cdsFees: calc.cdsFees,
          clearingFees: calc.clearingFees,
          sec: calc.sec,
          stl: calc.stl,
          netValue: calc.netValue,
          cashFlowOnSettlement: calc.netValue,
          stepUp: calc.stepUp,
            moneyGenerationCost: calc.moneyGenerationCost ?? prev.moneyGenerationCost
          };
        });
      } catch (err) {
        // Ignore calculation errors for typing; keep latest manual input
      }
    }
  };

  // Handle account selection from payment modal
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setForm(prev => ({
      ...prev,
      paymentMethod: selectedPaymentMethod,
      settlementAccount: `${account.accountName} - ${account.accountNumber}`,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      branchName: account.branch
    }));
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
    // Reset payment method if no account was selected
    if (!selectedAccount) {
      setForm(prev => ({ ...prev, paymentMethod: '' }));
    }
  };

  // Handle equity selection from modal
  const handleEquitySelect = (equity) => {
    setForm(prev => ({
      ...prev,
      companyName: equity.name,
      symbol: equity.symbol
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields validation
    const requiredFields = [
      'companyName', 'symbol', 'portfolio', 'quantity', 'price',
      'brokerName', 'tradeDate', 'settlementDate'
    ];

    const missingFields = requiredFields.filter(field => !form[field].toString().trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    const today = getToday();
    const submitForm = {
      company_name: form.companyName,
      symbol: form.symbol,
      portfolio: form.portfolio,
      portfolioId: form.portfolioId,
      deal_number: form.dealNumber,
      description: form.description,
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      gross_value: parseFloat(form.grossValue) || 0,
      brokerage: parseFloat(form.brokerage) || 0,
      cds_fees: parseFloat(form.cdsFees) || 0,
      cse_fees: parseFloat(form.cseFees) || 0,
      clearing_fees: parseFloat(form.clearingFees) || 0,
      sec: parseFloat(form.sec) || 0,
      stl: parseFloat(form.stl) || 0,
      net_value: parseFloat(form.netValue) || 0,
      contract_number: form.contractNumber,
      broker_name: form.brokerName,
      trade_date: form.tradeDate || today,
      settlement_date: form.settlementDate || today,
      settlement_account: form.settlementAccount || '',
      account_name: form.accountName || '',
      account_number: form.accountNumber || '',
      bank_name: form.bankName || '',
      branch_name: form.branchName || '',
      cash_flow_on_settlement: parseFloat(form.cashFlowOnSettlement) || 0,
      payment_method: form.paymentMethod || '',
      generate_payment: form.generatePayment || 'No',
      money_generation_cost: parseFloat(form.moneyGenerationCost) || 0,
      cost_of_funds: parseFloat(form.costOfFunds) || 0
    };

    // Debug logging
    console.log('Submitting form data:', JSON.stringify(submitForm, null, 2));

    try {
      console.log('Attempting to save buy transaction...');
      console.log('API endpoint: /api/transaction-entries/buy');
      console.log('Form data being sent:', submitForm);
      
      const result = await transactionEntryAPI.saveBuyTransaction(submitForm);
      console.log('Save transaction result:', result);
      alert('Buy Transaction submitted successfully!');
      handleReset();
      // Generate new deal number for next transaction
      const newDealNumber = await generateDealNumber();
      setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
    } catch (err) {
      console.error('Error saving transaction:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      alert(`Failed to save transaction: ${err.message || 'Unknown error'}`);
    }
  };

  const handleReset = async () => {
    const newDealNumber = await generateDealNumber();
    setForm({
      companyName: '',
      symbol: '',
      portfolio: '',
      portfolioId: '',
      dealNumber: newDealNumber, // <-- Generate new deal number on reset
      description: '',
      quantity: '',
      price: '',
      grossValue: '',
      brokerage: '',
      cdsFees: '',
      cseFees: '',
      clearingFees: '', // <-- Added missing field
      sec: '',
      stl: '',
      netValue: '',
      contractNumber: '',
      brokerName: '',
      tradeDate: getToday(),
      settlementDate: getToday(),
      settlementAccount: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      cashFlowOnSettlement: '',
      paymentMethod: '',
      generatePayment: 'No',
      moneyGenerationCost: '',
      costOfFunds: ''
    });
    setSelectedAccount(null);
    setSelectedPaymentMethod('');
  };

  // Check if Cost of Funds has a value to enable Money Generation Cost field
  const isCostOfFundsEntered = form.costOfFunds && form.costOfFunds.trim() !== '';

  // Authorize transaction button
  const authorizeTransaction = (idx) => {
    setTransactions(transactions.map((t, i) =>
      i === idx ? { ...t, authorized: true, rejected: false } : t
    ));
  };

  

  // Delete transaction by index (with confirm)
  

  const [showModal, setShowModal] = useState(false);

  if (showListView) {
    return <BuyTransactionListView onBack={() => setShowListView(false)} />;
  }

  return (
    <div className="buy-page-container">
      <div className="buy-content-wrapper">

        {/* Header */}
        <div className="buy-header-section">
          <div className="buy-header-icon">
            <svg className="buy-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="buy-header-text-group">
            <h1 className="buy-main-title">Buy Transaction Entry</h1>
            <p className="buy-subtitle">Record equity purchase transactions with automatic calculations</p>
          </div>
        </div>

        <div className="buy-container">
          <div className="buy-card-header">
            <h2 className="buy-card-title">Transaction Details</h2>
          </div>
          <div className="buy-form-content">
            <form onSubmit={handleSubmit}>
              {/* Transaction Information Section */}
              <div className="buy-section-header">
                <div className="buy-section-icon">
                  <svg className="buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z"/>
                  </svg>
                </div>
                <h3 className="buy-section-title">Security & Trade Information</h3>
              </div>
              <div className="buy-form-grid">
                {/* Company Name selector: now using modal */}
                <div className="buy-field-group">
                  <label className="buy-field-label">Company Name *</label>
                  <div className="buy-equity-selector">
                    <input
                      name="companyName"
                      value={form.companyName}
                      readOnly
                      required
                      className="buy-form-input"
                      placeholder="Click to select company"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEquitySelector(true)}
                      className="buy-equity-select-btn"
                      disabled={equitiesLoading}
                    >
                      <svg className="buy-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Select
                    </button>
                  </div>
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Ticker Symbol *</label>
                  <input
                    name="symbol"
                    value={form.symbol}
                    readOnly
                    required
                    className="buy-form-input"
                    placeholder="Auto-filled from company"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Choose Portfolio *</label>
                  <select
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleChange}
                    className="buy-form-select"
                    disabled={portfoliosLoading}
                  >
                    <option value="">
                      {portfoliosLoading
                        ? 'Loading portfolios...'
                        : portfolios.length === 0
                          ? 'No active portfolios found'
                          : 'Select Portfolio'}
                    </option>
                    {portfolios.map(portfolio => (
                      <option key={portfolio.id} value={portfolio.portfolioName}>
                        {portfolio.portfolioName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Portfolio ID field (read-only, autofilled) */}
                <div className="buy-field-group">
                  <label className="buy-field-label">Portfolio ID</label>
                  <input
                    name="portfolioId"
                    value={form.portfolioId}
                    readOnly
                    className="buy-form-input"
                    placeholder="Auto-filled from portfolio"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Quantity Purchased *</label>
                  <input
                    name="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Bought Price (Rs.) *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="Enter price per share"
                    value={form.price}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Contract Number</label>
                  <input
                    name="contractNumber"
                    placeholder="Enter contract number"
                    value={form.contractNumber}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Deal Number</label>
                  <div className="deal-number-container">
                    <input
                      name="dealNumber"
                      value={form.dealNumber}
                      readOnly
                      className="buy-form-input deal-number-input"
                      placeholder="Auto-generated"
                    />
                    <button
                      type="button"
                      onClick={regenerateDealNumber}
                      className="buy-btn buy-btn-tertiary regenerate-deal-number-btn"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Description</label>
                  <input
                    name="description"
                    placeholder="Enter description (optional)"
                    value={form.description}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Broker Name *</label>
                  <input
                    name="brokerName"
                    placeholder="Enter broker name"
                    value={form.brokerName}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Trade Date *</label>
                  <input
                    type="date"
                    name="tradeDate"
                    value={form.tradeDate}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Settlement Date *</label>
                  <input
                    type="date"
                    name="settlementDate"
                    value={form.settlementDate}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
              </div>
              {/* Cost Breakdown Section */}
              <div className="buy-section-header">
                <div className="buy-section-icon calculation">
                  <svg className="buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="buy-section-title">Cost Breakdown & Calculations</h3>
              </div>
              <div className="buy-fee-structure-note">
                <div className="buy-fee-structure-info">
                  <svg className="buy-info-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span><strong>Fee Structure:</strong> ≤100M: 1.12% total | &gt;100M: Reduced rates apply</span>
                </div>
              </div>
              <div className="buy-form-grid">
                <div className="buy-field-group">
                  <label className="buy-field-label">Gross Value (Rs.)</label>
                  <input
                    name="grossValue"
                    value={form.grossValue}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Brokerage (0.64% / 0.20%)</label>
                  <input
                    name="brokerage"
                    value={form.brokerage}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">CSE Fees (0.084% / 0.0525%)</label>
                  <input
                    name="cseFees"
                    value={form.cseFees}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">CDS Fees (0.012% / 0.0075%)</label>
                  <input
                    name="cdsFees"
                    value={form.cdsFees}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Clearing Fees (0.012% / 0.0075%)</label>
                  <input
                    name="clearingFees"
                    value={form.clearingFees}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">SEC (0.072% / 0.045%)</label>
                  <input
                    name="sec"
                    value={form.sec}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">STL (0.300%)</label>
                  <input
                    name="stl"
                    value={form.stl}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
              </div>
              {/* Step-Up Cost Breakdown Section (for > 100M) */}
              {form.stepUp && (
                <div className="buy-stepup-section">
                  <div className="buy-stepup-header">
                    <h4>Step-Up Cost Breakdown (for Gross Value &gt; Rs. 100 Million)</h4>
                  </div>
                  <div className="buy-stepup-table-wrapper">
                    <table className="buy-stepup-table">
                      <thead>
                        <tr>
                          <th>Portion</th>
                          <th>Value (Rs.)</th>
                          <th>Rate (%)</th>
                          <th>Fees (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>First Rs. 100,000,000</td>
                          <td>{form.stepUp.first100M}</td>
                          <td>1.12</td>
                          <td>{form.stepUp.first100MFees}</td>
                        </tr>
                        <tr>
                          <td>Excess</td>
                          <td>{form.stepUp.excess}</td>
                          <td>0.6125</td>
                          <td>{form.stepUp.excessFees}</td>
                        </tr>
                        <tr className="buy-stepup-total-row">
                          <td colSpan="3"><strong>Total Step-Up Fees</strong></td>
                          <td><strong>{form.stepUp.totalStepUpFees}</strong></td>
                        </tr>
                        <tr className="buy-stepup-grandtotal-row">
                          <td colSpan="3"><strong>Gross Value + Step-Up Fees</strong></td>
                          <td><strong>{form.stepUp.total}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="buy-stepup-note">
                    <em>* Step-up calculation: 1.12% for first Rs. 100M, 0.6125% for excess. Based on official fee structure: Brokerage (0.64%→0.20%), CSE (0.084%→0.0525%), CDS (0.012%→0.0075%), Clearing (0.012%→0.0075%), SEC (0.072%→0.045%), STL (0.300% unchanged).</em>
                  </div>
                </div>
              )}
              {/* Net Value - Highlighted */}
              <div className="buy-net-value-section left-align">
                <div className="buy-net-value-card small">
                  <label className="buy-net-value-label">Total Net Value</label>
                  <div className="buy-net-value-amount">Rs. {form.netValue || '0.00'}</div>
                </div>
              </div>
              {/* Payment Information Section */}
              <div className="buy-section-header">
                <div className="buy-section-icon payment">
                  <svg className="buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="buy-section-title">Payment & Settlement Details</h3>
              </div>
              <div className="buy-form-grid">
                <div className="buy-field-group">
                  <label className="buy-field-label">Cash Flow On Settlement (Rs.)</label>
                  <input
                    name="cashFlowOnSettlement"
                    value={form.cashFlowOnSettlement}
                    readOnly
                    className="buy-form-input calculated"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Settlement Account *</label>
                  <input
                    name="settlementAccount"
                    placeholder="Account number for payment"
                    value={form.settlementAccount}
                    onChange={handleChange}
                    className="buy-form-input"
                    required
                  />
                  <small className="buy-field-note">Account from which payment will be made</small>
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Account Name</label>
                  <input
                    name="accountName"
                    placeholder="Enter account holder name"
                    value={form.accountName}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Account Number</label>
                  <input
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={form.accountNumber}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Bank Name</label>
                  <input
                    name="bankName"
                    placeholder="Enter bank name"
                    value={form.bankName}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Branch Name</label>
                  <input
                    name="branchName"
                    placeholder="Enter branch name"
                    value={form.branchName}
                    onChange={handleChange}
                    className="buy-form-input"
                  />
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="buy-form-select"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Banking">Online Banking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                  {selectedAccount && (
                    <div className="selected-account-info">
                      <div className="account-info-header">
                        <svg className="account-info-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd"/>
                        </svg>
                        <span>Selected Account</span>
                      </div>
                      <div className="account-info-details">
                        <div><strong>Account:</strong> {selectedAccount.accountName}</div>
                        <div><strong>Number:</strong> {selectedAccount.accountNumber}</div>
                        <div><strong>Bank:</strong> {selectedAccount.bankName}</div>
                        <div><strong>Branch:</strong> {selectedAccount.branch}</div>
                      </div>
                      <button 
                        type="button" 
                        className="change-account-btn"
                        onClick={() => {
                          setSelectedAccount(null);
                          setForm(prev => ({ 
                            ...prev, 
                            paymentMethod: '', 
                            settlementAccount: '',
                            accountName: '',
                            accountNumber: '',
                            bankName: '',
                            branchName: ''
                          }));
                        }}
                      >
                        Change Account
                      </button>
                    </div>
                  )}
                </div>
                <div className="buy-field-group">
                  <label className="buy-field-label">Cost of Funds (After-Tax) (%)</label>
                  <input
                    name="costOfFunds"
                    type="number"
                    step="0.01"
                    placeholder="Auto-fetched from Cost of Funds Definition"
                    value={form.costOfFunds}
                    readOnly
                    className="buy-form-input buy-readonly-input"
                    title="This value is automatically fetched from the active Cost of Funds Definition (after-tax rate)"
                  />
                  <small className="buy-field-note">
                    Automatically fetched from Cost of Funds Definition (after-tax rate)
                  </small>
                </div>
                <div className="buy-field-group">
                  <label className={`buy-field-label ${!isCostOfFundsEntered ? 'disabled' : ''}`}>
                    Money Generation Cost (Daily) (Rs.)
                  </label>
                  <input
                    name="moneyGenerationCost"
                    type="number"
                    step="0.01"
                    placeholder={isCostOfFundsEntered ? "Auto-calculated daily cost" : "Enter Cost of Funds first"}
                    value={form.moneyGenerationCost}
                    onChange={handleChange}
                    disabled={!isCostOfFundsEntered}
                    className={`buy-form-input ${!isCostOfFundsEntered ? 'disabled' : ''}`}
                    readOnly
                  />
                  <small className="buy-field-note">
                    Daily cost calculated as (Net Value × Cost of Funds (After-Tax) %) ÷ 365
                  </small>
                </div>
              </div>

              <div className="buy-field-group">
                  <label className="buy-field-label">Generate Payment</label>
                  <div className="buy-toggle-container">
                    <label className="buy-toggle-wrapper">
                      <input
                        type="checkbox"
                        name="generatePayment"
                        checked={form.generatePayment === 'Yes'}
                        onChange={(e) => handleChange({
                          target: {
                            name: 'generatePayment',
                            value: e.target.checked ? 'Yes' : 'No'
                          }
                        })}
                        className="buy-toggle-input"
                      />
                      <div className={`buy-toggle-slider ${form.generatePayment === 'Yes' ? 'active' : ''}`}>
                        <div className="buy-toggle-thumb"></div>
                      </div>
                    </label>
                    <span className={`buy-toggle-text ${form.generatePayment === 'Yes' ? 'active' : ''}`}>
                      {form.generatePayment}
                    </span>
                  </div>
                </div>
              {/* Buttons */}
              <div className="buy-button-section">
                <button
                  type="button"
                  onClick={handleReset}
                  className="buy-btn buy-btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="buy-btn buy-btn-tertiary"
                  onClick={() => setShowListView(true)}
                >
                  View Transactions
                </button>
                <button
                  type="submit"
                  className="buy-btn buy-btn-primary"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>

        {showModal && (
          <TransactionModal
            transaction={transactions[showModal]}
            onClose={() => setShowModal(false)}
            onConfirm={() => {
              authorizeTransaction(showModal);
              setShowModal(false);
            }}
          />
        )}

        {showPaymentModal && (
          <PaymentMethodModal
            paymentMethod={selectedPaymentMethod}
            onClose={handlePaymentModalClose}
            onSelectAccount={handleAccountSelect}
          />
        )}

        {showEquitySelector && (
          <EquitySelectorModal
            isOpen={showEquitySelector}
            onClose={() => setShowEquitySelector(false)}
            onSelect={handleEquitySelect}
            selectedEquity={equities.find(eq => eq.name === form.companyName)}
          />
        )}

        {/* Footer */}
        <div className="buy-footer-section">
          <p>  SHERWOOD TECHNOLOGIES (PVT) LTD • Secure transaction recording • All calculations are automated and verified</p>
        </div>
      </div>
    </div>
  );
};

export default BuyTransactionEntry;