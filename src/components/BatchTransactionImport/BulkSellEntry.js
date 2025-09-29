import React, { useState, useEffect } from 'react';
import { equityAPI, portfolioAPI, costOfFundsAPI } from '../../services/api';
import './Styles/BulkSellEntry.css';

const getToday = () => new Date().toISOString().slice(0, 10);

const BulkSellEntry = () => {
  const [equities, setEquities] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [costOfFunds, setCostOfFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    symbol: '',
    portfolio: '',
    portfolioId: '',
    valuationMethod: '',
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
    profitLoss: '',
    dealNumber: ''
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [equitiesData, portfoliosData, costOfFundsData] = await Promise.all([
          equityAPI.getAll(),
          portfolioAPI.getAll(),
          costOfFundsAPI.getAll()
        ]);
        setEquities(equitiesData);
        setPortfolios(portfoliosData);
        setCostOfFunds(costOfFundsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    // Autofill symbol when companyName changes
    if (name === 'companyName') {
      const selectedEquity = equities.find(eq => eq.company_name === value);
      updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
    }

    // Autofill portfolioId when portfolio name changes
    if (name === 'portfolio') {
      const selectedPortfolio = portfolios.find(p => p.name === value);
      updatedForm.portfolioId = selectedPortfolio ? selectedPortfolio.portfolioId : '';
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would implement the bulk sell transaction logic
      console.log('Bulk sell transaction data:', form);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form
      setForm({
        companyName: '',
        symbol: '',
        portfolio: '',
        portfolioId: '',
        valuationMethod: '',
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
        profitLoss: '',
        dealNumber: ''
      });
    } catch (error) {
      console.error('Error submitting bulk sell transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-sell-page-container">
      <div className="bulk-sell-content-wrapper">
        {/* Header */}
        <div className="bulk-sell-header-section">
          <div className="bulk-sell-header-icon">
            <svg className="bulk-sell-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="bulk-sell-header-text-group">
            <h1 className="bulk-sell-main-title">Bulk Sell Transaction Entry</h1>
            <p className="bulk-sell-subtitle">Record multiple stock sale transactions with automatic calculations</p>
          </div>
        </div>

        <div className="bulk-sell-container">
          <div className="bulk-sell-card-header">
            <h2 className="bulk-sell-card-title">Transaction Details</h2>
          </div>
          <div className="bulk-sell-form-content">
            {showSuccess && (
              <div className="bulk-sell-success-banner">
                <div className="bulk-sell-success-icon">✓</div>
                <span>Bulk sell transactions recorded successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bulk-sell-form">
              {/* Section 1 - Basic Information */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Basic Information</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Company Name *</label>
                  <select
                    name="companyName"
                    value={form.companyName}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                    required
                  >
                    <option value="">Select Company</option>
                    {equities.map(equity => (
                      <option key={equity.id} value={equity.company_name}>
                        {equity.company_name} ({equity.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Choose Portfolio *</label>
                  <select
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                    required
                  >
                    <option value="">Select Portfolio</option>
                    {portfolios.map(portfolio => (
                      <option key={portfolio.id} value={portfolio.name}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Portfolio ID</label>
                  <input
                    type="text"
                    name="portfolioId"
                    value={form.portfolioId}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from portfolio"
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Valuation Method *</label>
                  <select
                    name="valuationMethod"
                    value={form.valuationMethod}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                    required
                  >
                    <option value="">Select Valuation Method</option>
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="LIFO">LIFO (Last In, First Out)</option>
                    <option value="AVERAGE">Average Cost</option>
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Ticker Symbol *</label>
                  <input
                    type="text"
                    name="symbol"
                    value={form.symbol}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from company"
                    required
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Contract Number *</label>
                  <input
                    type="text"
                    name="contractNumber"
                    value={form.contractNumber}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter contract number"
                    required
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Broker Name *</label>
                  <input
                    type="text"
                    name="brokerName"
                    value={form.brokerName}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter broker name"
                    required
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Deal Number</label>
                  <input
                    type="text"
                    name="dealNumber"
                    value={form.dealNumber}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter deal number"
                  />
                </div>
              </div>

              {/* Section 2 - Transaction Details */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Transaction Details</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Number of shares"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    name="soldPrice"
                    value={form.soldPrice}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Price per share"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Bought Price (LKR) *</label>
                  <input
                    type="number"
                    name="boughtPrice"
                    value={form.boughtPrice}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Original purchase price"
                    required
                    min="0"
                    step="0.01"
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Capital Gain (LKR)</label>
                  <input
                    type="number"
                    name="capitalGain"
                    value={form.capitalGain}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-calculated-field"
                    placeholder="Auto-calculated"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Automatically calculated</small>
                </div>
              </div>

              {/* Section 3 - Dates & References */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Dates & References</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Trade Date *</label>
                  <input
                    type="date"
                    name="tradeDate"
                    value={form.tradeDate}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    required
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Settlement Date *</label>
                  <input
                    type="date"
                    name="settlementDate"
                    value={form.settlementDate}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    required
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Related Deal Number</label>
                  <select
                    name="buyContract"
                    value={form.buyContract}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                  >
                    <option value="">Select Deal Number</option>
                    {/* Available deal numbers would be populated here */}
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Holding Days</label>
                  <input
                    type="number"
                    name="hdays"
                    value={form.hdays}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Days held - Auto-calculated"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Automatically calculated</small>
                </div>
              </div>

              {/* Section 4 - Financial Calculations */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon calculation">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Financial Calculations</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Cost of Funds (%)</label>
                  <input
                    type="number"
                    name="costOfFunds"
                    value={form.costOfFunds}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-readonly-input"
                    placeholder="Auto-fetched from Cost of Funds Definition"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">
                    Automatically fetched from Cost of Funds Definition
                  </small>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">CP (Closing Price)</label>
                  <input
                    type="number"
                    name="cp"
                    value={form.cp}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-disabled-field"
                    placeholder="Closing price"
                    step="0.01"
                    min="0"
                    disabled
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Holding Cost (LKR)</label>
                  <input
                    type="number"
                    name="holdingCost"
                    value={form.holdingCost}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Total holding costs"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Profit / Loss Card */}
              <div className="bulk-sell-profit-loss-section">
                <div className="bulk-sell-profit-loss-card">
                  <label className="bulk-sell-label">Net Profit / Loss (LKR)</label>
                  <input
                    type="number"
                    name="profitLoss"
                    value={form.profitLoss}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-profit-loss-input"
                    placeholder="Net result"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Capital Gain - Holding Cost</small>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bulk-sell-form-actions">
                <button
                  type="submit"
                  className="bulk-sell-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Submit Bulk Sell Transactions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSellEntry;
