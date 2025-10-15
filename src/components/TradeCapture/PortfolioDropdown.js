import React, { useState, useEffect } from 'react';
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
  const [portfolioHoldings, setPortfolioHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const loadPortfolioHoldings = async (portfolioName) => {
    try {
      setHoldingsLoading(true);
      
      // Get buy transactions from transaction_entries table
      const buyTransactions = await transactionEntryAPI.getByPortfolio(portfolioName);
      
      // Get sell transactions from sell_transaction_entries table
      const sellTransactions = await transactionEntryAPI.getSellTransactionsByPortfolio(portfolioName);
      
      console.log('Buy transactions:', buyTransactions); // Debug log
      console.log('Sell transactions:', sellTransactions); // Debug log

      // Calculate net holdings for each company
      const holdingsMap = new Map();

      // Process buy transactions (add to holdings)
      buyTransactions.forEach(transaction => {
        const companyName = transaction.company_name || transaction.companyName || transaction.symbol;
        const quantity = parseFloat(transaction.quantity) || 0;
        
        if (!holdingsMap.has(companyName)) {
          holdingsMap.set(companyName, {
            companyName,
            totalBought: 0,
            totalSold: 0,
            netQuantity: 0,
            avgBuyPrice: 0,
            costValue: 0,
            totalCharges: 0
          });
        }
        
        const holding = holdingsMap.get(companyName);
        const previousTotalBought = holding.totalBought;
        holding.totalBought += quantity;
        const transactionValue = quantity * (parseFloat(transaction.price) || 0);
        const previousTotalValue = holding.avgBuyPrice * previousTotalBought;
        holding.avgBuyPrice = (previousTotalValue + transactionValue) / holding.totalBought;
        
        // Calculate charges using the same fee structure as Buy Transaction Entry
        let calculatedCharges = 0;
        
        if (transactionValue <= 100000000) { // Transactions up to Rs. 100 Million
          // Total fee rate: 1.12%
          const brokerage = Math.round(transactionValue * 0.00640 * 100) / 100;    // 0.640%
          const cseFees = Math.round(transactionValue * 0.00084 * 100) / 100;      // 0.084%
          const cdsFees = Math.round(transactionValue * 0.00012 * 100) / 100;     // 0.012%
          const clearingFees = Math.round(transactionValue * 0.00012 * 100) / 100; // 0.012%
          const sec = Math.round(transactionValue * 0.00072 * 100) / 100;          // 0.072%
          const stl = Math.round(transactionValue * 0.003 * 100) / 100;            // 0.300%
          calculatedCharges = brokerage + cseFees + cdsFees + clearingFees + sec + stl;
        } else { // Transactions over Rs. 100 Million
          // Tiered calculation: standard rate for first 100M, reduced rate for excess
          const first100M = 100000000;
          const excess = transactionValue - 100000000;
          
          // First Rs. 100M at standard rates
          const first100MBrokerage = Math.round(first100M * 0.00640 * 100) / 100;    // 0.640%
          const first100MCSE = Math.round(first100M * 0.00084 * 100) / 100;          // 0.084%
          const first100MCDS = Math.round(first100M * 0.00012 * 100) / 100;          // 0.012%
          const first100MClearing = Math.round(first100M * 0.00012 * 100) / 100;     // 0.012%
          const first100MSEC = Math.round(first100M * 0.00072 * 100) / 100;          // 0.072%
          const first100MSTL = Math.round(first100M * 0.003 * 100) / 100;            // 0.300%
          
          // Excess amount at reduced rates
          const excessBrokerage = Math.round(excess * 0.00200 * 100) / 100;          // 0.200%
          const excessCSE = Math.round(excess * 0.000525 * 100) / 100;               // 0.0525%
          const excessCDS = Math.round(excess * 0.000075 * 100) / 100;               // 0.0075%
          const excessClearing = Math.round(excess * 0.000075 * 100) / 100;          // 0.0075%
          const excessSEC = Math.round(excess * 0.000450 * 100) / 100;               // 0.0450%
          const excessSTL = Math.round(excess * 0.003 * 100) / 100;                  // 0.300%
          
          // Total fees = sum of both portions
          calculatedCharges = (first100MBrokerage + excessBrokerage) + 
                             (first100MCSE + excessCSE) + 
                             (first100MCDS + excessCDS) + 
                             (first100MClearing + excessClearing) + 
                             (first100MSEC + excessSEC) + 
                             (first100MSTL + excessSTL);
        }
        
        holding.totalCharges += calculatedCharges;
      });

      // Process sell transactions (subtract from holdings)
      sellTransactions.forEach(transaction => {
        const companyName = transaction.company_name || transaction.companyName || transaction.symbol;
        const quantity = parseFloat(transaction.quantity) || 0;
        
        if (!holdingsMap.has(companyName)) {
          holdingsMap.set(companyName, {
            companyName,
            totalBought: 0,
            totalSold: 0,
            netQuantity: 0,
            avgBuyPrice: 0,
            costValue: 0,
            totalCharges: 0
          });
        }
        
        const holding = holdingsMap.get(companyName);
        holding.totalSold += quantity;
        
        // Calculate charges using the same fee structure as Sell Transaction Entry
        const transactionValue = quantity * (parseFloat(transaction.price) || parseFloat(transaction.sold_price) || 0);
        let calculatedCharges = 0;
        
        if (transactionValue <= 100000000) { // Transactions up to Rs. 100 Million
          // Total fee rate: 1.12%
          const brokerage = Math.round(transactionValue * 0.00640 * 100) / 100;    // 0.640%
          const cseFees = Math.round(transactionValue * 0.00084 * 100) / 100;      // 0.084%
          const cdsFees = Math.round(transactionValue * 0.00012 * 100) / 100;     // 0.012%
          const clearingFees = Math.round(transactionValue * 0.00012 * 100) / 100; // 0.012%
          const sec = Math.round(transactionValue * 0.00072 * 100) / 100;          // 0.072%
          const stl = Math.round(transactionValue * 0.003 * 100) / 100;            // 0.300%
          calculatedCharges = brokerage + cseFees + cdsFees + clearingFees + sec + stl;
        } else { // Transactions over Rs. 100 Million
          // Tiered calculation: standard rate for first 100M, reduced rate for excess
          const first100M = 100000000;
          const excess = transactionValue - 100000000;
          
          // First Rs. 100M at standard rates
          const first100MBrokerage = Math.round(first100M * 0.00640 * 100) / 100;    // 0.640%
          const first100MCSE = Math.round(first100M * 0.00084 * 100) / 100;          // 0.084%
          const first100MCDS = Math.round(first100M * 0.00012 * 100) / 100;          // 0.012%
          const first100MClearing = Math.round(first100M * 0.00012 * 100) / 100;     // 0.012%
          const first100MSEC = Math.round(first100M * 0.00072 * 100) / 100;          // 0.072%
          const first100MSTL = Math.round(first100M * 0.003 * 100) / 100;            // 0.300%
          
          // Excess amount at reduced rates
          const excessBrokerage = Math.round(excess * 0.00200 * 100) / 100;          // 0.200%
          const excessCSE = Math.round(excess * 0.000525 * 100) / 100;               // 0.0525%
          const excessCDS = Math.round(excess * 0.000075 * 100) / 100;               // 0.0075%
          const excessClearing = Math.round(excess * 0.000075 * 100) / 100;          // 0.0075%
          const excessSEC = Math.round(excess * 0.000450 * 100) / 100;               // 0.0450%
          const excessSTL = Math.round(excess * 0.003 * 100) / 100;                  // 0.300%
          
          // Total fees = sum of both portions
          calculatedCharges = (first100MBrokerage + excessBrokerage) + 
                             (first100MCSE + excessCSE) + 
                             (first100MCDS + excessCDS) + 
                             (first100MClearing + excessClearing) + 
                             (first100MSEC + excessSEC) + 
                             (first100MSTL + excessSTL);
        }
        
        holding.totalCharges += calculatedCharges;
      });

      // Calculate net quantities, cost values, and net values, filter out zero holdings
      const holdings = Array.from(holdingsMap.values())
        .map(holding => {
          const netQuantity = holding.totalBought - holding.totalSold;
          const costValue = netQuantity * holding.avgBuyPrice;
          const netValue = costValue + holding.totalCharges;
          const costPerShare = netQuantity > 0 ? netValue / netQuantity : 0;
          return {
            ...holding,
            netQuantity: netQuantity,
            costValue: costValue,
            netValue: netValue,
            costPerShare: costPerShare
          };
        })
        .filter(holding => holding.netQuantity > 0) // Only show companies with positive holdings
        .sort((a, b) => a.companyName.localeCompare(b.companyName));

      console.log('Final holdings:', holdings); // Debug log
      setPortfolioHoldings(holdings);
    } catch (error) {
      console.error('Error loading portfolio holdings:', error);
      setPortfolioHoldings([]);
    } finally {
      setHoldingsLoading(false);
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

  useEffect(() => {
    loadPortfolios();
    loadAssignedCostingMethods();
  }, []);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPortfolios(), loadAssignedCostingMethods()]);
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
    
    // Load portfolio holdings when a portfolio is selected
    if (value) {
      await loadPortfolioHoldings(value);
    } else {
      setPortfolioHoldings([]);
    }
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


  return (
    <div className="pf-dropdown-container">
      {/* Header Section */}
      <div className="pf-header-section">
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

      {/* Portfolio Holdings Table */}
      {selectedPortfolio && (
           <div className="ph-table-section">
             <div className="ph-table-header">
               <h2>Portfolio Holdings</h2>
               <p>Current holdings for portfolio: <strong>{selectedPortfolio}</strong></p>
          </div>
          
             {holdingsLoading ? (
               <div className="ph-loading">
                 <div className="ph-loading-spinner"></div>
                 <p>Loading portfolio holdings...</p>
            </div>
             ) : portfolioHoldings.length === 0 ? (
               <div className="ph-no-data">
                 <div className="ph-no-data-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
                 <h3>No Holdings Data</h3>
                 <p>No holdings found for this portfolio. Make sure you have transactions recorded for this portfolio.</p>
              </div>
            ) : (
               <div className="ph-table-container">
                 <table className="ph-table">
                   <thead>
                     <tr>
                       <th>Company</th>
                       <th>Net Quantity</th>
                       <th>Total Bought</th>
                       <th>Total Sold</th>
                       <th>Average Buy Price</th>
                       <th>Cost Value</th>
                       <th>Charges</th>
                       <th>Net Value</th>
                       <th>Cost per Share</th>
                      </tr>
                    </thead>
                   <tbody>
                     {portfolioHoldings.map((holding) => (
                       <tr key={holding.companyName} className="ph-table-row">
                         <td className="ph-company-name">{holding.companyName}</td>
                         <td className="ph-quantity">{holding.netQuantity.toLocaleString()}</td>
                         <td className="ph-total-bought">{holding.totalBought.toLocaleString()}</td>
                         <td className="ph-total-sold">{holding.totalSold.toLocaleString()}</td>
                         <td className="ph-avg-price">{holding.avgBuyPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                         <td className="ph-total-value">{holding.costValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                         <td className="ph-charges">{holding.totalCharges.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                         <td className="ph-net-value">{holding.netValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                         <td className="ph-cost-per-share">{holding.costPerShare.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                        </tr>
                      ))}
                    </tbody>
                   <tfoot>
                     <tr className="ph-total-row">
                       <td><strong>Portfolio Totals</strong></td>
                       <td className="ph-total-quantity">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.netQuantity, 0).toLocaleString()}
                       </td>
                       <td className="ph-total-bought-sum">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.totalBought, 0).toLocaleString()}
                       </td>
                       <td className="ph-total-sold-sum">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.totalSold, 0).toLocaleString()}
                       </td>
                       <td className="ph-total-avg-price">
                         {portfolioHoldings.length > 0 ? 
                           (portfolioHoldings.reduce((sum, holding) => sum + holding.costValue, 0) / 
                            portfolioHoldings.reduce((sum, holding) => sum + holding.netQuantity, 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : 
                           '0.00'
                         }
                       </td>
                       <td className="ph-total-value-sum">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.costValue, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                       </td>
                       <td className="ph-total-charges">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.totalCharges, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                       </td>
                       <td className="ph-total-net-value">
                         {portfolioHoldings.reduce((sum, holding) => sum + holding.netValue, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                       </td>
                       <td className="ph-total-cost-per-share">
                         {portfolioHoldings.length > 0 ? 
                           (portfolioHoldings.reduce((sum, holding) => sum + holding.netValue, 0) / 
                            portfolioHoldings.reduce((sum, holding) => sum + holding.netQuantity, 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : 
                           '0.00'
                         }
                       </td>
                     </tr>
                   </tfoot>
                  </table>
                  </div>
                )}
              </div>
      )}
    </div>
  );
};

export default PortfolioDropdown;