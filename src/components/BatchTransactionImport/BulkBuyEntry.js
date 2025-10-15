import React, { useState, useEffect } from 'react';
import './Styles/BulkBuyEntry.css';
import PaymentMethodModal from '../TradeCapture/PaymentMethodModal';
import { equityAPI, portfolioAPI, tradeSummaryAPI, costOfFundsAPI } from '../../services/api';
import EquitySelectorModal from '../TradeCapture/EquitySelectorModal';


const getToday = () => new Date().toISOString().slice(0, 10);

// Function to generate unique deal numbers for bulk transactions
const generateDealNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `BULK-BUY-${year}${month}${day}-${hour}${minute}${second}`;
};

const BulkBuyEntry = () => {
  // Equities for dropdown
  const [equities, setEquities] = useState([]);
  const [equitiesLoading, setEquitiesLoading] = useState(true);

  // Portfolios for dropdown
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);


  const [form, setForm] = useState({
    companyName: '',
    symbol: '',
    portfolio: '',
    portfolioId: '',
    dealNumber: generateDealNumber(),
    description: '',
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

  const [showEquitySelector, setShowEquitySelector] = useState(false);

  // Function to regenerate deal number
  const regenerateDealNumber = () => {
    setForm(prev => ({ ...prev, dealNumber: generateDealNumber() }));
  };

  // Fetch active cost of funds on mount
  useEffect(() => {
    const fetchActiveCostOfFunds = async () => {
      try {
        const activeCostOfFunds = await costOfFundsAPI.getActiveCostOfFunds();
        if (activeCostOfFunds && activeCostOfFunds.cost_of_funds) {
          setForm(prev => ({ 
            ...prev, 
            costOfFunds: parseFloat(activeCostOfFunds.cost_of_funds).toFixed(2)
          }));
        }
      } catch (error) {
        console.log('No active cost of funds definition found, using default value');
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

    // Bulk Buy Logic: Calculate price and fees when quantity and grossValue are entered
    if (name === 'quantity' || name === 'grossValue') {
      try {
        const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(updatedForm.quantity);
        const grossValue = name === 'grossValue' ? parseFloat(value) : parseFloat(updatedForm.grossValue);
        
        // Only calculate if both quantity and grossValue are valid numbers
        if (quantity > 0 && grossValue > 0) {
          // Calculate price from quantity and gross value
          const calculatedPrice = grossValue / quantity;
          
          // Calculate fees using the calculated price
          const calc = await tradeSummaryAPI.calculateBuyTransaction({
            quantity: quantity,
            price: calculatedPrice,
            costOfFunds: updatedForm.costOfFunds
          });
          
          setForm({
            ...updatedForm,
            price: calculatedPrice.toFixed(2), // Set the calculated price
            grossValue: calc.grossValue ? parseFloat(calc.grossValue).toFixed(4) : '',
            brokerage: calc.brokerage ? parseFloat(calc.brokerage).toFixed(4) : '',
            cseFees: calc.cseFees ? parseFloat(calc.cseFees).toFixed(4) : '',
            cdsFees: calc.cdsFees ? parseFloat(calc.cdsFees).toFixed(4) : '',
            clearingFees: calc.clearingFees ? parseFloat(calc.clearingFees).toFixed(4) : '',
            sec: calc.sec ? parseFloat(calc.sec).toFixed(4) : '',
            stl: calc.stl ? parseFloat(calc.stl).toFixed(4) : '',
            netValue: calc.netValue ? parseFloat(calc.netValue).toFixed(4) : '',
            cashFlowOnSettlement: calc.netValue ? parseFloat(calc.netValue).toFixed(4) : '',
            stepUp: calc.stepUp,
            moneyGenerationCost: calc.moneyGenerationCost ? parseFloat(calc.moneyGenerationCost).toFixed(4) : ''
          });
        } else {
          // If either quantity or grossValue is invalid, just update the form
          setForm(updatedForm);
        }
      } catch (err) {
        console.error('Error calculating bulk buy transaction:', err);
        setForm(updatedForm);
      }
    } else {
      setForm(updatedForm);
    }
  };

  // Handle account selection from payment modal
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setForm(prev => ({
      ...prev,
      paymentMethod: selectedPaymentMethod,
      settlementAccount: `${account.accountName} - ${account.accountNumber}`
    }));
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
  };

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
    setShowEquitySelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields validation
    const requiredFields = [
      'companyName', 'symbol', 'portfolio', 'quantity', 'price', 'contractNumber',
      'brokerName', 'tradeDate', 'settlementDate'
    ];

    const missingFields = requiredFields.filter(field => !form[field].toString().trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    const today = getToday();
    const submitForm = {
      ...form,
      tradeDate: form.tradeDate || today,
      settlementDate: form.settlementDate || today
    };

    // Debug logging
    console.log('Submitting bulk buy form data:', JSON.stringify(submitForm, null, 2));

    try {
      const result = await tradeSummaryAPI.saveBuyTransaction(submitForm);
      console.log('Save bulk buy transaction result:', result);
      alert('Bulk Buy Transaction submitted successfully!');
      handleReset();
      // Generate new deal number for next transaction
      setForm(prev => ({ ...prev, dealNumber: generateDealNumber() }));
    } catch (err) {
      console.error('Error saving bulk buy transaction:', err);
      alert(`Failed to save bulk buy transaction: ${err.message || 'Unknown error'}`);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      symbol: '',
      portfolio: '',
      portfolioId: '',
      dealNumber: generateDealNumber(),
      description: '',
      quantity: '',
      price: '',
      grossValue: '',
      brokerage: '',
      cdsFees: '',
      cseFees: '',
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
    setSelectedAccount(null);
  };

  // Check if Cost of Funds has a value to enable Money Generation Cost field
  const isCostOfFundsEntered = form.costOfFunds && form.costOfFunds.trim() !== '';



  return (
    <div className="bulk-buy-page-container">
      <div className="bulk-buy-content-wrapper">
        {/* Header */}
        <div className="bulk-buy-header-section">
          <div className="bulk-buy-header-icon">
            <svg className="bulk-buy-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="bulk-buy-header-text-group">
            <h1 className="bulk-buy-main-title">Bulk Buy Transaction Entry</h1>
            <p className="bulk-buy-subtitle">Record bulk equity purchase transactions with automatic calculations</p>
          </div>
        </div>

        <div className="bulk-buy-container">
          <div className="bulk-buy-card-header">
            <h2 className="bulk-buy-card-title">Transaction Details</h2>
          </div>
          <div className="bulk-buy-form-content">
            <form onSubmit={handleSubmit} className="bulk-buy-form">
              <div className="bulk-buy-form-grid">
          {/* Security & Trade Information */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Security & Trade Information</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Company Name *</label>
                <div className="bulk-buy-equity-selector">
                  <input
                    name="companyName"
                    value={form.companyName}
                    readOnly
                    required
                    className="bulk-buy-form-input"
                    placeholder="Click to select company"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEquitySelector(true)}
                    className="bulk-buy-equity-select-btn"
                    disabled={equitiesLoading}
                  >
                    <svg className="bulk-buy-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    Select
                  </button>
                </div>
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Ticker Symbol *</label>
                <input
                  name="symbol"
                  value={form.symbol}
                  readOnly
                  required
                  className="bulk-buy-form-input"
                  placeholder="Auto-filled from company"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Choose Portfolio *</label>
                <select
                  name="portfolio"
                  value={form.portfolio}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
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
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Portfolio ID</label>
                <input
                  name="portfolioId"
                  value={form.portfolioId}
                  readOnly
                  className="bulk-buy-form-input"
                  placeholder="Auto-filled from portfolio"
                />
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Transaction Details</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Quantity Purchased *</label>
                <input
                  name="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Bought Price (Rs.) *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Auto-calculated from quantity and gross value"
                  value={form.price}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Contract Number</label>
                <input
                  name="contractNumber"
                  placeholder="Enter contract number"
                  value={form.contractNumber}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Broker Name *</label>
                <input
                  name="brokerName"
                  placeholder="Enter broker name"
                  value={form.brokerName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Deal Number</label>
                <div className="bulk-buy-deal-number-container">
                  <input
                    name="dealNumber"
                    value={form.dealNumber}
                    readOnly
                    className="bulk-buy-form-input bulk-buy-deal-number-input"
                    placeholder="Auto-generated"
                  />
                  <button
                    type="button"
                    onClick={regenerateDealNumber}
                    className="bulk-buy-btn bulk-buy-btn-tertiary bulk-buy-regenerate-deal-number-btn"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Description</label>
                <input
                  name="description"
                  placeholder="Enter description (optional)"
                  value={form.description}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Trade Date *</label>
                <input
                  type="date"
                  name="tradeDate"
                  value={form.tradeDate}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Settlement Date *</label>
                <input
                  type="date"
                  name="settlementDate"
                  value={form.settlementDate}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
          </div>


          {/* Cost Breakdown & Calculations */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon calculation">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Cost Breakdown & Calculations</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-fee-structure-note">
              <div className="bulk-buy-fee-structure-info">
                <svg className="bulk-buy-info-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <span><strong>Fee Structure:</strong> ≤100M: 1.12% total | &gt;100M: Reduced rates apply</span>
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Gross Value (Rs.)</label>
                <input
                  name="grossValue"
                  type="number"
                  step="0.01"
                  placeholder="Enter gross value"
                  value={form.grossValue}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Brokerage (0.64% / 0.20%)</label>
                <input
                  name="brokerage"
                  type="number"
                  step="0.0001"
                  value={form.brokerage}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">CSE Fees (0.084% / 0.0525%)</label>
                <input
                  name="cseFees"
                  type="number"
                  step="0.0001"
                  value={form.cseFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">CDS Fees (0.012% / 0.0075%)</label>
                <input
                  name="cdsFees"
                  type="number"
                  step="0.0001"
                  value={form.cdsFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Clearing Fees (0.012% / 0.0075%)</label>
                <input
                  name="clearingFees"
                  type="number"
                  step="0.0001"
                  value={form.clearingFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">SEC (0.072% / 0.045%)</label>
                <input
                  name="sec"
                  type="number"
                  step="0.0001"
                  value={form.sec}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">STL (0.300%)</label>
                <input
                  name="stl"
                  type="number"
                  step="0.0001"
                  value={form.stl}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                {/* Empty field to maintain grid alignment */}
              </div>
            </div>
            {/* Step-Up Cost Breakdown Section (for > 100M) */}
            {form.stepUp && (
              <div className="bulk-buy-stepup-section">
                <div className="bulk-buy-stepup-header">
                  <h4>Step-Up Cost Breakdown (for Gross Value &gt; Rs. 100 Million)</h4>
                </div>
                <div className="bulk-buy-stepup-table-wrapper">
                  <table className="bulk-buy-stepup-table">
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
                      <tr className="bulk-buy-stepup-total-row">
                        <td colSpan="3"><strong>Total Step-Up Fees</strong></td>
                        <td><strong>{form.stepUp.totalStepUpFees}</strong></td>
                      </tr>
                      <tr className="bulk-buy-stepup-grandtotal-row">
                        <td colSpan="3"><strong>Gross Value + Step-Up Fees</strong></td>
                        <td><strong>{form.stepUp.total}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bulk-buy-stepup-note">
                  <em>* Step-up calculation: 1.12% for first Rs. 100M, 0.6125% for excess. Based on official fee structure: Brokerage (0.64%→0.20%), CSE (0.084%→0.0525%), CDS (0.012%→0.0075%), Clearing (0.012%→0.0075%), SEC (0.072%→0.045%), STL (0.300% unchanged).</em>
                </div>
              </div>
            )}
            {/* Net Value - Highlighted */}
            <div className="bulk-buy-net-value-section left-align">
              <div className="bulk-buy-net-value-card small">
                <label className="bulk-buy-net-value-label">Total Net Value</label>
                <div className="bulk-buy-net-value-amount">Rs. {form.netValue ? parseFloat(form.netValue).toFixed(4) : '0.0000'}</div>
              </div>
            </div>
          </div>

          {/* Settlement Information */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon payment">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Settlement Information</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Settlement Account *</label>
                <input
                  name="settlementAccount"
                  placeholder="Enter settlement account"
                  value={form.settlementAccount}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                  required
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Account Name</label>
                <input
                  name="accountName"
                  placeholder="Enter account holder name"
                  value={form.accountName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Account Number</label>
                <input
                  name="accountNumber"
                  placeholder="Enter account number"
                  value={form.accountNumber}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Bank Name</label>
                <input
                  name="bankName"
                  placeholder="Enter bank name"
                  value={form.bankName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Branch Name</label>
                <input
                  name="branchName"
                  placeholder="Enter branch name"
                  value={form.branchName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Cash Flow on Settlement</label>
                <input
                  name="cashFlowOnSettlement"
                  placeholder="Enter cash flow on settlement"
                  value={form.cashFlowOnSettlement}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                >
                  <option value="">Select Payment Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Banking">Online Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
                {selectedAccount && (
                  <div className="bulk-buy-selected-account-info">
                    <div className="bulk-buy-account-info-header">
                      <svg className="bulk-buy-account-info-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd"/>
                      </svg>
                      <span>Selected Account</span>
                    </div>
                    <div className="bulk-buy-account-info-details">
                      <div><strong>Account:</strong> {selectedAccount.accountName}</div>
                      <div><strong>Number:</strong> {selectedAccount.accountNumber}</div>
                      <div><strong>Bank:</strong> {selectedAccount.bankName}</div>
                      <div><strong>Branch:</strong> {selectedAccount.branch}</div>
                    </div>
                    <button 
                      type="button" 
                      className="bulk-buy-change-account-btn"
                      onClick={() => {
                        setSelectedAccount(null);
                        setForm(prev => ({ ...prev, paymentMethod: '', settlementAccount: '' }));
                      }}
                    >
                      Change Account
                    </button>
                  </div>
                )}
              </div>
              <div className="bulk-buy-field-wrapper">
                {/* Empty field to maintain grid alignment */}
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Cost of Funds (%)</label>
                <input
                  name="costOfFunds"
                  type="number"
                  step="0.01"
                  placeholder="Enter cost of funds percentage"
                  value={form.costOfFunds}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Money Generation Cost (Rs.)</label>
                <input
                  name="moneyGenerationCost"
                  value={form.moneyGenerationCost}
                  readOnly
                  className="bulk-buy-form-input"
                  placeholder={isCostOfFundsEntered ? "Auto-calculated" : "Enter cost of funds first"}
                  disabled={!isCostOfFundsEntered}
                />
              </div>
            </div>
          </div>

        </div>

              {/* Form Actions */}
              <div className="bulk-buy-button-section">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bulk-buy-btn bulk-buy-btn-secondary"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="bulk-buy-btn bulk-buy-btn-primary"
                >
                  Submit Bulk Buy Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEquitySelector && (
        <EquitySelectorModal
          isOpen={showEquitySelector}
          onClose={() => setShowEquitySelector(false)}
          onSelect={handleEquitySelect}
          selectedEquity={equities.find(eq => eq.name === form.companyName)}
        />
      )}

      {showPaymentModal && (
        <PaymentMethodModal
          paymentMethod={selectedPaymentMethod}
          onClose={handlePaymentModalClose}
          onSelectAccount={handleAccountSelect}
        />
      )}
    </div>
  );
};

export default BulkBuyEntry;
