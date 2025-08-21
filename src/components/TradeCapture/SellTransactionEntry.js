import React, { useState, useEffect } from 'react';
import './Styles/SellTransactionEntry.css';
import { portfolioAPI } from '../../services/api';
import { equityAPI } from '../../services/api';
import { portfolioCostingMethodAPI } from '../../services/api'; // <-- Add this import
import { transactionEntryAPI } from '../../services/api'; // <-- Add this import
import { costOfFundsAPI } from '../../services/api';
import SellTransactionListView from './SellTransactionListView';
import TransactionDetails from './TransactionDetails';
import SellEquitySelectorModal from './SellEquitySelectorModal';

const getToday = () => new Date().toISOString().slice(0, 10);

const SellTransactionEntry = ({ setFifoParams, setActiveTab }) => {
  const [form, setForm] = useState({
    
    companyName: '',
    symbol: '', // <-- Add symbol to form state
    portfolioName: '',
    portfolioId: '', // <-- Add this field
    valuationMethod: '', // <-- Added field
    contractNumber: '',
    quantity: '',
    soldPrice: '',
    boughtPrice: '',
    tradeDate: getToday(),
    settlementDate: getToday(),
    brokerName: '',
    settlementAccount: '',
    capitalGain: '',
    costOfFunds: '',
    hdays: '',
    cp: '',
    buyContract: '',
    holdingCost: '',
    profitLoss: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [equities, setEquities] = useState([]);
  const [equitiesLoading, setEquitiesLoading] = useState(true);
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]); // <-- Add state
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  // Add new state for totalShares
  const [totalShares, setTotalShares] = useState('');
  const [remainingShares, setRemainingShares] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showEquitySelector, setShowEquitySelector] = useState(false);

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
        // Keep the field empty if no active cost of funds is found
      }
    };

    fetchActiveCostOfFunds();
  }, []);

  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
    // Fetch assigned costing methods
    portfolioCostingMethodAPI.getAllAssignedCostingMethods()
      .then(data => setAssignedCostingMethods(data))
      .catch(() => setAssignedCostingMethods([]));
  }, []);

  useEffect(() => {
    setEquitiesLoading(true);
    equityAPI.getActiveEquities()
      .then(data => setEquities(data))
      .catch(() => setEquities([]))
      .finally(() => setEquitiesLoading(false));
  }, []);

  // Fetch companies when portfolio changes
  useEffect(() => {
    if (form.portfolioName) {
      setCompaniesLoading(true);
      transactionEntryAPI.getCompaniesByPortfolio(form.portfolioName)
        .then(companies => setFilteredCompanies(companies))
        .catch(() => setFilteredCompanies([]))
        .finally(() => setCompaniesLoading(false));
      // Clear companyName and symbol if portfolio changes
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    } else {
      setFilteredCompanies([]);
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    }
  }, [form.portfolioName]);

  // --- Calculations ---
  useEffect(() => {
    if (form.soldPrice && form.boughtPrice && form.quantity) {
      const gain = (parseFloat(form.soldPrice) - parseFloat(form.boughtPrice)) * parseFloat(form.quantity);
      setForm(prev => ({ ...prev, capitalGain: gain.toFixed(2) }));
    }
  }, [form.soldPrice, form.boughtPrice, form.quantity]);

  useEffect(() => {
    if (form.capitalGain && form.holdingCost) {
      const profit = parseFloat(form.capitalGain) - parseFloat(form.holdingCost || 0);
      setForm(prev => ({ ...prev, profitLoss: profit.toFixed(2) }));
    }
  }, [form.capitalGain, form.holdingCost]);

  useEffect(() => {
    if (form.tradeDate && form.settlementDate) {
      const trade = new Date(form.tradeDate);
      const settle = new Date(form.settlementDate);
      if (!isNaN(trade) && !isNaN(settle)) {
        const dayDiff = Math.ceil((settle - trade) / (1000 * 60 * 60 * 24));
        setForm(prev => ({ ...prev, hdays: dayDiff >= 0 ? dayDiff : '' }));
      }
    }
  }, [form.tradeDate, form.settlementDate]);

  // Autofill valuation method when portfolioName changes
  useEffect(() => {
    if (form.portfolioName && assignedCostingMethods.length > 0) {
      // Find the portfolioId for the selected portfolioName
      const selectedPortfolio = portfolios.find(p => p.portfolioName === form.portfolioName);
      if (selectedPortfolio) {
        const assigned = assignedCostingMethods.find(a => a.portfolioId === (selectedPortfolio.portfolioId || selectedPortfolio.id));
        if (assigned && assigned.costing_method) {
          setForm(prev => ({ ...prev, valuationMethod: assigned.costing_method }));
        } else {
          setForm(prev => ({ ...prev, valuationMethod: '' }));
        }
      } else {
        setForm(prev => ({ ...prev, valuationMethod: '' }));
      }
    }
  }, [form.portfolioName, assignedCostingMethods, portfolios]);

  useEffect(() => {
    if (form.portfolioName && form.companyName) {
      transactionEntryAPI.getTotalQuantity(form.portfolioName, form.companyName)
        .then(res => {
          setTotalShares(res.total_quantity || '');
        })
        .catch(() => {
          setTotalShares('');
        });
    } else {
      setTotalShares('');
    }
  }, [form.portfolioName, form.companyName]);

  useEffect(() => {
    const fetchAndSetWAP = async () => {
      if (
        form.portfolioName &&
        form.companyName &&
        form.valuationMethod &&
        form.valuationMethod.toUpperCase() === 'WAP'
      ) {
        try {
          const res = await transactionEntryAPI.getWAPByPortfolioAndCompany(form.portfolioName, form.companyName);
          setForm(prev => ({ ...prev, boughtPrice: res.wap ? parseFloat(res.wap).toFixed(2) : '' }));
        } catch (err) {
          setForm(prev => ({ ...prev, boughtPrice: '' }));
        }
      } else if (form.valuationMethod && form.valuationMethod.toUpperCase() === 'WAP') {
        setForm(prev => ({ ...prev, boughtPrice: '' }));
      }
    };
    fetchAndSetWAP();
  }, [form.portfolioName, form.companyName, form.valuationMethod]);

  useEffect(() => {
    const fetchAndSetFIFO = async () => {
      if (
        form.portfolioName &&
        form.companyName &&
        form.valuationMethod &&
        form.valuationMethod.toUpperCase() === 'FIFO' &&
        form.quantity && !isNaN(parseFloat(form.quantity)) && parseFloat(form.quantity) > 0
      ) {
        try {
          const res = await transactionEntryAPI.getFifoCostByPortfolioAndCompany(
            form.portfolioName,
            form.companyName,
            form.quantity
          );
          setForm(prev => ({ ...prev, boughtPrice: res.fifoCost ? parseFloat(res.fifoCost).toFixed(2) : '' }));
        } catch (err) {
          setForm(prev => ({ ...prev, boughtPrice: '' }));
        }
      } else if (form.valuationMethod && form.valuationMethod.toUpperCase() === 'FIFO') {
        setForm(prev => ({ ...prev, boughtPrice: '' }));
      }
    };
    fetchAndSetFIFO();
  }, [form.portfolioName, form.companyName, form.valuationMethod, form.quantity]);

  // Calculate remaining shares when totalShares or form.quantity changes
  useEffect(() => {
    const total = parseFloat(totalShares);
    const qty = parseFloat(form.quantity);
    if (!isNaN(total) && !isNaN(qty)) {
      setRemainingShares(Math.max(total - qty, 0));
    } else {
      setRemainingShares('');
    }
  }, [totalShares, form.quantity]);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!form.companyName) newErrors.companyName = 'Company name is required';
    if (!form.portfolioName) newErrors.portfolioName = 'Portfolio name is required';
    if (!form.valuationMethod) newErrors.valuationMethod = 'Valuation method is required'; // <-- Added validation
    if (!form.contractNumber) newErrors.contractNumber = 'Contract number is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!form.soldPrice || form.soldPrice <= 0) newErrors.soldPrice = 'Valid sold price is required';
    if (!form.boughtPrice || form.boughtPrice <= 0) newErrors.boughtPrice = 'Valid bought price is required';
    if (!form.tradeDate) newErrors.tradeDate = 'Trade date is required';
    if (!form.settlementDate) newErrors.settlementDate = 'Settlement date is required';
    if (!form.brokerName) newErrors.brokerName = 'Broker name is required';
    if (!form.symbol) newErrors.symbol = 'Ticker Symbol is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // If portfolioName changes, clear valuationMethod (it will be autofilled by useEffect)
    if (name === 'portfolioName') {
      // Autofill portfolioId
      const selectedPortfolio = portfolios.find(p => p.portfolioName === value);
      setForm({ ...form, [name]: value, valuationMethod: '', portfolioId: selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '' });
    } else {
      let updatedForm = { ...form, [name]: value };
      // Autofill symbol when companyName changes
      if (name === 'companyName') {
        const selectedEquity = equities.find(eq => eq.name === value);
        updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
      }
      setForm(updatedForm);
    }
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const today = getToday();
    const submitForm = {
      ...form,
      tradeDate: form.tradeDate || today,
      settlementDate: form.settlementDate || today
    };
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await transactionEntryAPI.saveSellTransaction({
        ...submitForm,
        totalShares: totalShares // include totalShares if needed
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      handleReset();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to save sell transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      symbol: '', // <-- Add to reset
      portfolioName: '',
      portfolioId: '', // <-- Reset this field
      valuationMethod: '', // <-- Added reset
      contractNumber: '',
      quantity: '',
      soldPrice: '',
      boughtPrice: '',
      tradeDate: getToday(),
      settlementDate: getToday(),
      brokerName: '',
      settlementAccount: '',
      capitalGain: '',
      costOfFunds: '',
      hdays: '',
      wap: '',
      cp: '',
      buyContract: '',
      holdingCost: '',
      profitLoss: ''
    });
    setErrors({});
    setShowSuccess(false);
  };

  const getFieldClassName = (fieldName) =>
    `sell-form-input${errors[fieldName] ? ' sell-error' : ''}`;

  // Handle equity selection from modal
  const handleEquitySelect = (companyName) => {
    // Find the equity record to get the symbol
    const selectedEquity = equities.find(equity => equity.name === companyName);
    const symbol = selectedEquity ? selectedEquity.symbol : '';
    
    setForm(prev => ({
      ...prev,
      companyName: companyName,
      symbol: symbol
    }));
    
    // Clear any existing errors
    if (errors.companyName) {
      setErrors(prev => ({ ...prev, companyName: '' }));
    }
  };

  // --- Render ---
  if (showListView) {
    return <SellTransactionListView onBack={() => setShowListView(false)} setActiveTab={setActiveTab} />;
  }

  if (showTransactionDetails) {
    return (
      <TransactionDetails 
        onBack={() => setShowTransactionDetails(false)} 
        companyName={form.companyName}
        portfolioName={form.portfolioName}
        quantity={form.quantity}
        sellTransaction={form}
        valuationMethod={form.valuationMethod}
      />
    );
  }

  return (
    <div className="sell-page">
      

      


      <div className="sell-content-wrapper">
        <div className="sell-header-section">
  <div className="sell-header-icon">
    <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
  </div>
  <div className="sell-header-text-group">
    <h1 className="sell-main-title">Sell Transaction Entry</h1>
    <p className="sell-subtitle">Record your stock sale transaction details</p>
  </div>
</div>
        <div className="sell-container">
          <div className="sell-card-header">
            <h2 className="sell-card-title">Transaction Details</h2>
          </div>
          <div className="sell-form-content">
            {showSuccess && (
              <div className="sell-success-banner">
                <div className="sell-success-icon">✓</div>
                <span>Transaction recorded successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="sell-form">
              {/* Section 1 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Basic Information</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <div className="sell-equity-selector">
                    <input
                      id="companyName"
                      name="companyName"
                      value={form.companyName}
                      readOnly
                      required
                      className="sell-form-input"
                      placeholder="Click to select company"
                      disabled={companiesLoading || !form.portfolioName}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEquitySelector(true)}
                      className="sell-equity-select-btn"
                      disabled={companiesLoading || !form.portfolioName}
                    >
                      <svg className="sell-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Select
                    </button>
                  </div>
                  {errors.companyName && <span className="sell-error-text">{errors.companyName}</span>}
                </div>
                <div className="sell-form-group">
    <label htmlFor="portfolioName">Choose Portfolio *</label>
    <select
      id="portfolioName"
      name="portfolioName"
      value={form.portfolioName}
      onChange={handleChange}
      className={getFieldClassName('portfolioName')}
      required
      disabled={portfoliosLoading}
    >
      <option value="">
        {portfoliosLoading
          ? 'Loading portfolios...'
          : portfolios.length === 0
            ? 'No active portfolios found'
            : 'Select Portfolio'}
      </option>
      {portfolios.map(p => (
        <option key={p.id} value={p.portfolioName}>{p.portfolioName}</option>
      ))}
    </select>
    {errors.portfolioName && <span className="sell-error-text">{errors.portfolioName}</span>}
  </div>
                {/* Portfolio ID field (read-only, autofilled) */}
                <div className="sell-form-group">
                  <label htmlFor="portfolioId">Portfolio ID</label>
                  <input
                    type="text"
                    id="portfolioId"
                    name="portfolioId"
                    value={form.portfolioId}
                    readOnly
                    className="sell-form-input"
                    placeholder="Auto-filled from portfolio"
                  />
                </div>
                {/* Valuation Method Field */}
                <div className="sell-form-group">
                  <label htmlFor="valuationMethod">Valuation Method *</label>
                  <input
                    type="text"
                    id="valuationMethod"
                    name="valuationMethod"
                    value={form.valuationMethod}
                    className={getFieldClassName('valuationMethod')}
                    readOnly
                    disabled
                    placeholder="Auto-filled from portfolio"
                  />
                  {errors.valuationMethod && <span className="sell-error-text">{errors.valuationMethod}</span>}
                  {form.portfolioName && !form.valuationMethod && (
                    <span className="sell-error-text">No costing method assigned to this portfolio.</span>
                  )}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="symbol">Ticker Symbol *</label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={form.symbol}
                    readOnly
                    required
                    className="sell-form-input"
                    placeholder="Auto-filled from company"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="totalShares">Total Shares *</label>
                  <input
                    type="number"
                    id="totalShares"
                    name="totalShares"
                    value={totalShares}
                    readOnly
                    className="sell-form-input"
                    placeholder="Auto-fetched total shares"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="contractNumber">Contract Number *</label>
                  <input
                    type="text"
                    id="contractNumber"
                    name="contractNumber"
                    value={form.contractNumber}
                    onChange={handleChange}
                    className={getFieldClassName('contractNumber')}
                    placeholder="Enter contract number"
                  />
                  {errors.contractNumber && <span className="sell-error-text">{errors.contractNumber}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="brokerName">Broker Name *</label>
                  <input
                    type="text"
                    id="brokerName"
                    name="brokerName"
                    value={form.brokerName}
                    onChange={handleChange}
                    className={getFieldClassName('brokerName')}
                    placeholder="Enter broker name"
                  />
                  {errors.brokerName && <span className="sell-error-text">{errors.brokerName}</span>}
                </div>

              </div>
              {/* Section 2 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Transaction Details</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    className={getFieldClassName('quantity')}
                    placeholder="Number of shares"
                    min="1"
                  />
                  {errors.quantity && <span className="sell-error-text">{errors.quantity}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="remainingShares">Remaining Shares</label>
                  <input
                    type="number"
                    id="remainingShares"
                    name="remainingShares"
                    value={remainingShares}
                    readOnly
                    className="sell-form-input"
                    placeholder="Remaining shares after sale"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="soldPrice">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    id="soldPrice"
                    name="soldPrice"
                    value={form.soldPrice}
                    onChange={handleChange}
                    className={getFieldClassName('soldPrice')}
                    placeholder="Price per share"
                    step="0.01"
                    min="0"
                  />
                  {errors.soldPrice && <span className="sell-error-text">{errors.soldPrice}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="boughtPrice">Bought Price (LKR) *</label>
                  <input
                    type="number"
                    id="boughtPrice"
                    name="boughtPrice"
                    value={form.boughtPrice}
                    onChange={handleChange}
                    className={getFieldClassName('boughtPrice')}
                    placeholder="Original purchase price"
                    step="0.01"
                    min="0"
                    readOnly
                  />
                  {errors.boughtPrice && <span className="sell-error-text">{errors.boughtPrice}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="capitalGain">Capital Gain (LKR)</label>
                  <div className="sell-capital-gain-row">
                    <input
                      type="number"
                      id="capitalGain"
                      name="capitalGain"
                      value={form.capitalGain}
                      onChange={handleChange}
                      className="sell-form-input sell-calculated-field"
                      placeholder="Auto-calculated"
                      step="0.01"
                      readOnly
                    />
                    <button
                      type="button"
                      className="sell-view-details-btn"
                      onClick={() => setShowTransactionDetails(true)}
                    >
                      View Details
                    </button>
                  </div>
                  <small className="sell-field-note">Automatically calculated</small>
                </div>
              </div>
              {/* Section 3 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Dates & References</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="tradeDate">Trade Date *</label>
                  <input
                    type="date"
                    id="tradeDate"
                    name="tradeDate"
                    value={form.tradeDate}
                    onChange={handleChange}
                    className={getFieldClassName('tradeDate')}
                  />
                  {errors.tradeDate && <span className="sell-error-text">{errors.tradeDate}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="settlementDate">Settlement Date *</label>
                  <input
                    type="date"
                    id="settlementDate"
                    name="settlementDate"
                    value={form.settlementDate}
                    onChange={handleChange}
                    className={getFieldClassName('settlementDate')}
                  />
                  {errors.settlementDate && <span className="sell-error-text">{errors.settlementDate}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="buyContract">Related Buy Contract</label>
                  <select
                    id="buyContract"
                    name="buyContract"
                    value={form.buyContract}
                    onChange={handleChange}
                    className="sell-form-input"
                  >
                    <option value="">Select Contract</option>
                    <option value="236354">236354</option>
                    <option value="345897">345897</option>
                    <option value="456789">456789</option>
                  </select>
                </div>
                <div className="sell-form-group">
                  <label htmlFor="hdays">Holding Days</label>
                  <input
                    type="number"
                    id="hdays"
                    name="hdays"
                    value={form.hdays}
                    onChange={handleChange}
                    className="sell-form-input"
                    placeholder="Days held Auto-calculated"
                    readOnly
                  />
                  <small className="sell-field-note">Automatically calculated</small>
                </div>
              </div>
              {/* Section 4 */}
              <div className="sell-section-header">
                <div className="sell-section-icon calculation">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Financial Calculations</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="costOfFunds">Cost of Funds (%)</label>
                  <input
                    type="number"
                    id="costOfFunds"
                    name="costOfFunds"
                    value={form.costOfFunds}
                    readOnly
                    className="sell-form-input sell-readonly-input"
                    placeholder="Auto-fetched from Cost of Funds Definition"
                    step="0.01"
                    title="This value is automatically fetched from the active Cost of Funds Definition"
                  />
                  <small className="sell-field-note">
                    Automatically fetched from Cost of Funds Definition
                  </small>
                </div>
                
                <div className="sell-form-group">
                  <label htmlFor="cp">CP (Closing Price)</label>
                  <input
                    type="number"
                    id="cp"
                    name="cp"
                    value={form.cp}
                    onChange={handleChange}
                    className="sell-form-input sell-disabled-field"
                    placeholder="Closing price"
                    step="0.01"
                    min="0"
                    disabled
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="holdingCost">Holding Cost (LKR)</label>
                  <input
                    type="number"
                    id="holdingCost"
                    name="holdingCost"
                    value={form.holdingCost}
                    onChange={handleChange}
                    className="sell-form-input"
                    placeholder="Total holding costs"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Profit / Loss Card */}
              <div className="sell-profit-loss-section">
                <div className="sell-profit-loss-card">
                  <label htmlFor="profitLoss">Net Profit / Loss (LKR)</label>
                  <input
                    type="number"
                    id="profitLoss"
                    name="profitLoss"
                    value={form.profitLoss}
                    onChange={handleChange}
                    className="sell-form-input sell-profit-loss-input"
                    placeholder="Net result"
                    step="0.01"
                    readOnly
                  />
                  <small className="sell-field-note">Capital Gain - Holding Cost</small>
                </div>
              </div>

              {/* Actions */}
              <div className="sell-form-actions">
                <button
                  type="button"
                  onClick={handleReset}
                  className="sell-btn sell-btn-secondary"
                  disabled={isSubmitting}
                >
                  <span className="sell-btn-icon">↻</span>
                  Reset Form
                </button>
                <button
                  type="button"
                  className="sell-btn sell-btn-tertiary"
                  onClick={() => setShowListView(true)}
                  disabled={isSubmitting}
                >
                  View Transactions
                </button>
                <button
                  type="submit"
                  className="sell-btn sell-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="sell-btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="sell-btn-icon">✓</span>
                      Record Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="eqt-footer-section">
          <p>  ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure transaction recording • All calculations are automated and verified</p>
        </div>
      </div>

      {/* Equity Selector Modal */}
      {showEquitySelector && (
        <SellEquitySelectorModal
          isOpen={showEquitySelector}
          onClose={() => setShowEquitySelector(false)}
          onSelect={handleEquitySelect}
          companies={filteredCompanies}
          selectedCompany={form.companyName}
          loading={companiesLoading}
        />
      )}
    </div>
  );
};

export default SellTransactionEntry;
