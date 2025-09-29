import React, { useState, useEffect } from 'react';
import { equityAPI, portfolioAPI, costOfFundsAPI, transactionEntryAPI, portfolioCostingMethodAPI } from '../../services/api';
import SellEquitySelectorModal from '../TradeCapture/SellEquitySelectorModal';
import './Styles/BulkSellEntry.css';

const getToday = () => new Date().toISOString().slice(0, 10);

const BulkSellEntry = () => {
  const [equities, setEquities] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [costOfFunds, setCostOfFunds] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [showEquitySelector, setShowEquitySelector] = useState(false);
  const [totalShares, setTotalShares] = useState('');

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
        setPortfoliosLoading(true);
        console.log('Fetching active portfolios...');
        const [equitiesData, portfoliosData] = await Promise.all([
          equityAPI.getActiveEquities(),
          portfolioAPI.getActivePortfolios()
        ]);
        console.log('Active portfolios fetched:', portfoliosData);
        console.log('Portfolio structure:', portfoliosData[0]); // Log first portfolio structure
        setEquities(equitiesData);
        setPortfolios(portfoliosData);
        
        // Fetch cost of funds separately since it has different API
        try {
          const costOfFundsData = await costOfFundsAPI.getActiveCostOfFunds();
          setCostOfFunds(costOfFundsData);
        } catch (costError) {
          console.log('No active cost of funds found, using default');
          setCostOfFunds([]);
        }
        
        // Fetch assigned costing methods
        try {
          const costingMethodsData = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
          setAssignedCostingMethods(costingMethodsData);
        } catch (costingError) {
          console.log('No assigned costing methods found');
          setAssignedCostingMethods([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Set empty arrays on error to prevent undefined issues
        setEquities([]);
        setPortfolios([]);
        setCostOfFunds([]);
      } finally {
        setPortfoliosLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch companies when portfolio changes
  useEffect(() => {
    if (form.portfolio) {
      setCompaniesLoading(true);
      transactionEntryAPI.getCompaniesByPortfolio(form.portfolio)
        .then(companies => {
          console.log('Companies fetched for portfolio:', companies);
          console.log('First company structure:', companies[0]);
          setFilteredCompanies(companies);
        })
        .catch(() => setFilteredCompanies([]))
        .finally(() => setCompaniesLoading(false));
      // Clear companyName and symbol if portfolio changes
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    } else {
      setFilteredCompanies([]);
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    }
  }, [form.portfolio]);

  // Autofill valuation method when portfolio changes
  useEffect(() => {
    if (form.portfolio && assignedCostingMethods.length > 0) {
      console.log('Portfolio changed, looking for costing method:', form.portfolio);
      console.log('Available costing methods:', assignedCostingMethods);
      
      // Find the portfolioId for the selected portfolio
      const selectedPortfolio = portfolios.find(p => (p.name === form.portfolio) || (p.portfolioName === form.portfolio));
      console.log('Selected portfolio:', selectedPortfolio);
      
      if (selectedPortfolio) {
        const assigned = assignedCostingMethods.find(a => a.portfolioId === (selectedPortfolio.portfolioId || selectedPortfolio.id));
        console.log('Found assigned costing method:', assigned);
        
        if (assigned && assigned.costing_method) {
          console.log('Setting valuation method to:', assigned.costing_method);
          setForm(prev => ({ ...prev, valuationMethod: assigned.costing_method }));
        } else {
          console.log('No costing method found for this portfolio');
          setForm(prev => ({ ...prev, valuationMethod: '' }));
        }
      } else {
        console.log('Portfolio not found in portfolios array');
        setForm(prev => ({ ...prev, valuationMethod: '' }));
      }
    }
  }, [form.portfolio, assignedCostingMethods, portfolios]);

  // Fetch total shares when portfolio and company are selected
  useEffect(() => {
    if (form.portfolio && form.companyName) {
      console.log('Fetching total shares for:', form.portfolio, form.companyName);
      // Fetch total quantity
      transactionEntryAPI.getTotalQuantity(form.portfolio, form.companyName)
        .then(res => {
          console.log('Total shares fetched:', res);
          setTotalShares(res.total_quantity || '');
        })
        .catch(error => {
          console.error('Error fetching total shares:', error);
          setTotalShares('');
        });
    } else {
      setTotalShares('');
    }
  }, [form.portfolio, form.companyName]);

  // Handle equity selection from modal
  const handleEquitySelect = (companyName) => {
    // Find the equity record to get the symbol
    const selectedEquity = equities.find(equity => equity.company_name === companyName || equity.name === companyName);
    const symbol = selectedEquity ? selectedEquity.symbol : '';
    
    setForm(prev => ({
      ...prev,
      companyName: companyName,
      symbol: symbol
    }));
    
    setShowEquitySelector(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If portfolio changes, clear companyName and symbol (handled by useEffect)
    if (name === 'portfolio') {
      // Autofill portfolioId when portfolio is selected
      const selectedPortfolio = portfolios.find(p => (p.name === value) || (p.portfolioName === value));
      setForm({ 
        ...form, 
        [name]: value, 
        portfolioId: selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '',
        companyName: '',
        symbol: ''
      });
    } else {
      let updatedForm = { ...form, [name]: value };
      
      // Autofill symbol when companyName changes
      if (name === 'companyName') {
        console.log('Company selected:', value);
        console.log('Searching in equities:', equities.length, 'items');
        // Find the symbol from the equities array using the company name
        const selectedEquity = equities.find(eq => 
          eq.company_name === value || eq.name === value
        );
        console.log('Found equity:', selectedEquity);
        const symbol = selectedEquity ? selectedEquity.symbol : '';
        console.log('Symbol to set:', symbol);
        updatedForm.symbol = symbol;
      }
      
      setForm(updatedForm);
    }
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
                  <div className="bulk-sell-equity-selector">
                    <input
                      name="companyName"
                      value={form.companyName}
                      readOnly
                      required
                      className="bulk-sell-input"
                      placeholder="Click to select company"
                      disabled={companiesLoading || !form.portfolio}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEquitySelector(true)}
                      className="bulk-sell-equity-select-btn"
                      disabled={companiesLoading || !form.portfolio}
                    >
                      <svg className="bulk-sell-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Choose Portfolio *</label>
                  <select
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                    required
                    disabled={portfoliosLoading}
                  >
                    <option value="">
                      {portfoliosLoading ? 'Loading portfolios...' : 'Select Portfolio'}
                    </option>
                    {portfolios && portfolios.length > 0 ? (
                      portfolios.map(portfolio => {
                        console.log('Rendering portfolio:', portfolio); // Debug log
                        return (
                          <option key={portfolio.id || portfolio.portfolioId} value={portfolio.name || portfolio.portfolioName}>
                            {portfolio.name || portfolio.portfolioName}
                          </option>
                        );
                      })
                    ) : (
                      !portfoliosLoading && <option value="" disabled>No active portfolios found</option>
                    )}
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
                  <input
                    type="text"
                    name="valuationMethod"
                    value={form.valuationMethod}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from portfolio"
                    readOnly
                    required
                  />
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
                  <label className="bulk-sell-label">Total Shares *</label>
                  <input
                    type="number"
                    name="totalShares"
                    value={totalShares}
                    className="bulk-sell-input"
                    placeholder="Auto-fetched total shares"
                    readOnly
                    required
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

export default BulkSellEntry;
