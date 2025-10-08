import React, { useState, useEffect, useCallback } from 'react';
import { portfolioAPI, portfolioCostingMethodAPI, transactionEntryAPI } from '../../services/api';
import './Styles/PortfolioDropdown.css';

const PortfolioDropdown = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]);
  const [selectedPortfolioCostingMethod, setSelectedPortfolioCostingMethod] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]);
  const [sellPortfolioData, setSellPortfolioData] = useState([]);
  const [filteredPortfolioData, setFilteredPortfolioData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [transactionFilter, setTransactionFilter] = useState('all'); // 'all', 'buy', 'sell'

  // Define costing method labels for display
  const costingMethodLabels = {
    'FIFO': 'FIFO (First-In First-Out)',
    'CHERRY': 'Cherry Picking',
    'WAP': 'Weighted Average Price (WAP)'
  };

  // Empty array - ready for real API data
  // const mockPortfolioData = [];

  const loadPortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      const data = await portfolioAPI.getActivePortfolios();
      setPortfolios(data);
      setSelectedPortfolio('');
      setSelectedPortfolioId('');
      setSelectedPortfolioCostingMethod('');
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setPortfolios([]);
      setSelectedPortfolio('');
      setSelectedPortfolioId('');
      setSelectedPortfolioCostingMethod('');
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const loadAssignedCostingMethods = async () => {
    try {
      const data = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
      setAssignedCostingMethods(data);
    } catch (error) {
      console.error('Error fetching assigned costing methods:', error);
      setAssignedCostingMethods([]);
    }
  };

  const loadPortfolioData = async (portfolioName) => {
    try {
      setTableLoading(true);
      const data = await transactionEntryAPI.getByPortfolio(portfolioName);
      // Map backend fields to table columns
      const mappedData = data.map(entry => ({
        companyName: entry.company_name,
        valueDate: entry.settlement_date,
        paid: entry.gross_value,
        sharesAmount: entry.quantity,
        ...entry // keep the rest for now
      }));
      setPortfolioData(mappedData);
    } catch (error) {
      console.error('Error loading buy transactions:', error);
      setPortfolioData([]);
    } finally {
      setTableLoading(false);
    }
  };

  const loadSellPortfolioData = async (portfolioName) => {
    try {
      const data = await transactionEntryAPI.getSellTransactionsByPortfolio(portfolioName);
      
      // Map backend fields to sell transaction table columns
      const mappedData = data.map(entry => {
        const totalShares = parseFloat(entry.total_shares) || 0;
        const soldShares = parseFloat(entry.quantity) || 0;
        const remainingShares = Math.max(totalShares - soldShares, 0);
        
        return {
          id: entry.id,
          companyName: entry.company_name,
          sellingPrice: entry.sold_price,
          valueDate: entry.settlement_date,
          soldSharesAmount: entry.quantity,
          remainingShares: remainingShares, // Calculate: total_shares - quantity_sold
          capitalGain: entry.capital_gain,
          ...entry // keep the rest for now
        };
      });
      setSellPortfolioData(mappedData);
    } catch (error) {
      console.error('Error loading sell data:', error);
      setSellPortfolioData([]);
    }
  };

  // Filter portfolio data based on date range and transaction type
  const filterPortfolioData = useCallback(() => {
    let filtered = [];

    // Filter by transaction type
    if (transactionFilter === 'buy') {
      filtered = portfolioData;
    } else if (transactionFilter === 'sell') {
      filtered = sellPortfolioData;
    } else {
      // 'all' - combine both buy and sell transactions
      filtered = [...portfolioData, ...sellPortfolioData];
    }

    // Apply date range filter
    if (dateRange.fromDate || dateRange.toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.valueDate);
        const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : null;
        const toDate = dateRange.toDate ? new Date(dateRange.toDate) : null;

        if (fromDate && toDate) {
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (fromDate) {
          return itemDate >= fromDate;
        } else if (toDate) {
          return itemDate <= toDate;
        }
        return true;
      });
    }

    setFilteredPortfolioData(filtered);
  }, [transactionFilter, portfolioData, sellPortfolioData, dateRange]);

  useEffect(() => {
    loadPortfolios();
    loadAssignedCostingMethods();
  }, []);

  useEffect(() => {
    filterPortfolioData();
  }, [dateRange, portfolioData, sellPortfolioData, transactionFilter, filterPortfolioData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPortfolios(), loadAssignedCostingMethods()]);
    if (selectedPortfolio) {
      await loadPortfolioData(selectedPortfolio);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleSelectChange = async (e) => {
    const value = e.target.value;
    setSelectedPortfolio(value);
    setIsOpen(false);
    
    // Find the selected portfolio and its ID
    const selectedPortfolioObj = portfolios.find(p => p.portfolioName === value);
    const portfolioId = selectedPortfolioObj ? selectedPortfolioObj.portfolioId : '';
    setSelectedPortfolioId(portfolioId);
    
    // Find assigned costing method for this portfolio
    if (portfolioId && assignedCostingMethods.length > 0) {
      const assignedMethod = assignedCostingMethods.find(a => a.portfolioId === portfolioId);
      setSelectedPortfolioCostingMethod(assignedMethod ? assignedMethod.costing_method : '');
    } else {
      setSelectedPortfolioCostingMethod('');
    }
    
    if (value) {
      await Promise.all([
        loadPortfolioData(value),
        loadSellPortfolioData(value)
      ]);
    } else {
      setPortfolioData([]);
      setSellPortfolioData([]);
      setFilteredPortfolioData([]);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateRange = () => {
    setDateRange({
      fromDate: '',
      toDate: ''
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFocus = () => {
    setIsOpen(true);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsOpen(false);
    setIsFocused(false);
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2
  //   }).format(amount);
  // };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="pf-dropdown-container">
      {/* Header Section */}
      <div className="pf-header-section">
        <div className="pf-header-icon">
          <svg className="pf-icon" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="6" width="18" height="12" rx="3" fill="#3b82f6"/>
            <rect x="7" y="10" width="10" height="2" rx="1" fill="#fff"/>
            <rect x="7" y="14" width="6" height="2" rx="1" fill="#fff"/>
          </svg>
        </div>
        <div className="pf-header-text-group">
          <h1 className="pf-main-title">Portfolio Selection<span className="pf-label-accent">*</span></h1>
        </div>
        <button
          className={`pf-refresh-button ${isRefreshing ? 'pf-refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={portfoliosLoading || isRefreshing}
          title="Refresh portfolios"
          aria-label="Refresh portfolio list"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m17 1 4 4-4 4"></path>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <path d="m7 23-4-4 4-4"></path>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </button>
      </div>

      {/* Dropdown Section */}
      <div className="pf-select-wrapper">
        <div className={`pf-select-container ${isFocused ? 'pf-focused' : ''} ${portfoliosLoading ? 'pf-loading' : ''}`}> 
          <select
            id="portfolio-select"
            className="pf-dropdown-select"
            value={selectedPortfolio}
            onChange={handleSelectChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={portfoliosLoading}
          >
            <option value="" disabled>
              {portfoliosLoading
                ? 'Loading portfolios...'
                : portfolios.length === 0
                  ? 'No active portfolios found'
                  : 'Choose your portfolio'}
            </option>
            {portfolios.map(portfolio => (
              <option key={portfolio.id} value={portfolio.portfolioName}>
                {portfolio.portfolioName}
              </option>
            ))}
          </select>
          <div className="pf-select-icon-container">
            {portfoliosLoading ? (
              <div className="pf-loading-animation">
                <div className="pf-loading-ring"></div>
                <div className="pf-loading-ring pf-loading-ring-2"></div>
                <div className="pf-loading-ring pf-loading-ring-3"></div>
              </div>
            ) : (
              <div className={`pf-dropdown-chevron ${isOpen ? 'pf-chevron-open' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </div>
            )}
          </div>
          {selectedPortfolio && !portfoliosLoading && (
            <div className="pf-success-indicator">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Costing Method Info Section */}
      {selectedPortfolio && (
        <div className="pf-costing-method-section">
          <div className="pf-costing-method-card">
            <div className="pf-costing-method-header">
              <div className="pf-costing-method-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div className="pf-costing-method-content">
                <h3 className="pf-costing-method-title">Portfolio Costing Method</h3>
                <div className="pf-costing-method-details">
                  <span className="pf-portfolio-info">
                    <strong>Portfolio:</strong> {selectedPortfolio} ({selectedPortfolioId})
                  </span>
                  <div className="pf-costing-method-info">
                    {selectedPortfolioCostingMethod ? (
                      <>
                        <span className="pf-costing-method-label">Assigned Method:</span>
                        <span className="pf-costing-method-value pf-method-assigned">
                          {costingMethodLabels[selectedPortfolioCostingMethod] || selectedPortfolioCostingMethod}
                        </span>
                      </>
                    ) : (
                      <span className="pf-costing-method-value pf-method-not-assigned">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        No costing method assigned to this portfolio
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter Section */}
      {selectedPortfolio && (
        <div className="pf-date-range-section">
          <div className="pf-date-range-header">
            <div className="pf-date-range-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="pf-date-range-title">Filter by Date Range</h3>
            {(dateRange.fromDate || dateRange.toDate) && (
              <button
                className="pf-clear-dates-button"
                onClick={clearDateRange}
                title="Clear date filters"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
            )}
          </div>
          
          <div className="pf-date-inputs-container">
            <div className="pf-date-input-group">
              <label className="pf-date-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                From Date
              </label>
              <input
                type="date"
                className="pf-date-input"
                value={dateRange.fromDate}
                onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
                max={dateRange.toDate || undefined}
              />
            </div>
            
            <div className="pf-date-separator">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12,5 19,12 12,19"></polyline>
              </svg>
            </div>
            
            <div className="pf-date-input-group">
              <label className="pf-date-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                To Date
              </label>
              <input
                type="date"
                className="pf-date-input"
                value={dateRange.toDate}
                onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
                min={dateRange.fromDate || undefined}
              />
            </div>
          </div>
          
          {(dateRange.fromDate || dateRange.toDate) && (
            <div className="pf-date-range-summary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 11 3 3 8-8"></path>
              </svg>
              <span>
                Showing {filteredPortfolioData.length} of {portfolioData.length} transactions
                {dateRange.fromDate && ` from ${formatDate(dateRange.fromDate)}`}
                {dateRange.toDate && ` to ${formatDate(dateRange.toDate)}`}
              </span>
            </div>
          )}
        </div>
      )}
      {selectedPortfolio && <div className="pf-gap-large"></div>}
      {/* Portfolio Data Table */}
      {selectedPortfolio && (
        <>
          <div className="pf-table-section">
            <div className="pf-table-header">
              <div className="pf-table-header-content">
                <div className="pf-table-header-text">
                  <div className="pf-table-subtitle">
                    Viewing data for: <span className="pf-portfolio-name">{selectedPortfolio}</span>
                  </div>
                </div>
                <div className="pf-header-controls">
                  <div className="pf-transaction-filter-row">
                    <label htmlFor="transaction-filter" className="pf-transaction-filter-label">Show:</label>
                    <select
                      id="transaction-filter"
                      className="pf-transaction-filter-select"
                      value={transactionFilter}
                      onChange={e => setTransactionFilter(e.target.value)}
                    >
                      <option value="all">All Transactions</option>
                      <option value="buy">Buy Transactions</option>
                      <option value="sell">Sell Transactions</option>
                    </select>
                  </div>
                  <button
                    className="pf-print-button"
                    onClick={handlePrint}
                    disabled={tableLoading || filteredPortfolioData.length === 0}
                    title="Print portfolio transactions"
                    aria-label="Print portfolio transactions"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 6,2 18,2 18,9"></polyline>
                      <path d="M6,18H4a2,2 0,0,1-2-2V11a2,2 0,0,1,2-2H20a2,2 0,0,1,2,2v5a2,2 0,0,1-2,2H18"></path>
                      <polyline points="6,14 18,14 18,22 6,22 6,14"></polyline>
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            </div>

            {tableLoading ? (
              <div className="pf-table-loading">
                <div className="pf-table-loading-content">
                  <div className="pf-table-loading-spinner">
                    <div className="pf-spinner-ring"></div>
                    <div className="pf-spinner-ring pf-spinner-ring-2"></div>
                    <div className="pf-spinner-ring pf-spinner-ring-3"></div>
                  </div>
                  <p className="pf-loading-text">Loading portfolio data...</p>
                </div>
              </div>
            ) : (
              <div className="pf-table-container">
                <div className="pf-table-wrapper">
{transactionFilter === 'sell' ? (
                  // Sell Transactions Table Only
                  <table className="pf-portfolio-table">
                    <thead className="pf-table-head">
                      <tr className="pf-header-row">
                        <th className="pf-header-cell pf-company-col">Company Name</th>
                        <th className="pf-header-cell">Selling Price per Share</th>
                        <th className="pf-header-cell">Value Date</th>
                        <th className="pf-header-cell">Sold Shares Amount</th>
                        <th className="pf-header-cell">Remaining Shares</th>
                        <th className="pf-header-cell">Capital Gain</th>
                      </tr>
                    </thead>
                    <tbody className="pf-table-body">
                      {sellPortfolioData.length > 0 ? sellPortfolioData.map((item, index) => (
                        <tr key={item.id} className={`pf-table-row ${index % 2 === 0 ? 'pf-row-even' : 'pf-row-odd'}`}>
                          <td className="pf-table-cell pf-company-cell">
                            <div className="pf-company-name">{item.companyName}</div>
                          </td>
                          <td className="pf-table-cell pf-currency-cell">{(item.sellingPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="pf-table-cell">{formatDate(item.valueDate)}</td>
                          <td className="pf-table-cell pf-numeric-cell" style={{ color: 'red' }}>{item.soldSharesAmount?.toLocaleString() || 0}</td>
                          <td className="pf-table-cell pf-numeric-cell">{item.remainingShares?.toLocaleString() || 0}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.capitalGain || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="pf-table-cell" style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                            No sell transactions found for this portfolio. Create some sell transactions first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : transactionFilter === 'all' ? (
                  // All Transactions - Combined table with color coding
                  <table className="pf-portfolio-table">
                    <thead className="pf-table-head">
                      <tr className="pf-header-row">
                        <th className="pf-header-cell pf-company-col">Company Name</th>
                        <th className="pf-header-cell">Value Date</th>
                        <th className="pf-header-cell">Shares Amount</th>
                        <th className="pf-header-cell">Share Price (per share)</th>
                        <th className="pf-header-cell">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="pf-table-body">
                      {(() => {
                        // Combine buy and sell transactions with type indicator
                        const buyTransactions = portfolioData.map(item => ({
                          ...item,
                          type: 'buy',
                          sharesAmount: item.sharesAmount,
                          sharePrice: item.price || item.sharePrice || 0,
                          totalAmount: item.paid || 0
                        }));
                        
                        const sellTransactions = sellPortfolioData.map(item => ({
                          ...item,
                          type: 'sell',
                          sharesAmount: item.soldSharesAmount,
                          sharePrice: item.sellingPrice || 0,
                          totalAmount: item.sellingPrice * item.soldSharesAmount || 0
                        }));
                        
                        // Combine and sort by date (newest first)
                        const allTransactions = [...buyTransactions, ...sellTransactions]
                          .sort((a, b) => new Date(b.valueDate) - new Date(a.valueDate));
                        
                        return allTransactions.length > 0 ? allTransactions.map((item, index) => (
                          <tr 
                            key={`${item.type}-${item.id}`} 
                            className={`pf-table-row pf-all-transaction-row ${item.type === 'buy' ? 'pf-buy-row' : 'pf-sell-row'} ${index % 2 === 0 ? 'pf-row-even' : 'pf-row-odd'}`}
                          >
                            <td className="pf-table-cell pf-company-cell">
                              <div className="pf-company-name">{item.companyName}</div>
                            </td>
                            <td className="pf-table-cell">{formatDate(item.valueDate)}</td>
                            <td className="pf-table-cell pf-numeric-cell" style={{ color: item.type === 'buy' ? 'green' : 'red' }}>{item.sharesAmount?.toLocaleString() || 0}</td>
                            <td className="pf-table-cell pf-currency-cell">{item.sharePrice?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</td>
                            <td className="pf-table-cell pf-currency-cell">{item.totalAmount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="pf-table-cell" style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                              No transactions found for this portfolio.
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                ) : (
                  // Buy Transactions Table Only (default)
                  <table className="pf-portfolio-table">
                    <thead className="pf-table-head">
                      <tr className="pf-header-row">
                        <th className="pf-header-cell pf-company-col">Company Name</th>
                        <th className="pf-header-cell">Value Date</th>
                        <th className="pf-header-cell">Shares Amount</th>
                        <th className="pf-header-cell">Share Price</th>
                        <th className="pf-header-cell">Paid</th>
                        <th className="pf-header-cell">Costing Method with Charges</th>
                        <th className="pf-header-cell">Cost of Funds</th>
                        <th className="pf-header-cell">Costing Method with Cost of Funds</th>
                      </tr>
                    </thead>
                    <tbody className="pf-table-body">
                      {portfolioData.map((item, index) => (
                        <tr key={item.id} className={`pf-table-row ${index % 2 === 0 ? 'pf-row-even' : 'pf-row-odd'}`}>
                          <td className="pf-table-cell pf-company-cell">
                            <div className="pf-company-name">{item.companyName}</div>
                          </td>
                          <td className="pf-table-cell">{formatDate(item.valueDate)}</td>
                          <td className="pf-table-cell pf-numeric-cell" style={{ color: 'green' }}>{item.sharesAmount?.toLocaleString() || 0}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.price || item.sharePrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.paid || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.costingMethodWithCharges || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.costOfFunds || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="pf-table-cell pf-currency-cell">{(item.costingMethodWithCostOfFunds || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                </div>
                
                {filteredPortfolioData.length === 0 && portfolioData.length > 0 && (
                  <div className="pf-no-data-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>No transactions found for the selected date range.</p>
                    <button className="pf-clear-filter-button" onClick={clearDateRange}>
                      Clear Date Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioDropdown;