import React, { useState, useEffect, useMemo } from 'react';
import { portfolioAPI, portfolioCostingMethodAPI, transactionEntryAPI } from '../../services/api';
import {
  buildHoldingsFromTransactions,
  buildHoldingsFromBackendPositions,
} from '../../utils/portfolioHoldingsExport';
import { toLocalYmd, txTradeDateYmd } from '../../utils/tradeDateYmd';
import './Styles/PortfolioDropdown.css';

const ALL_PORTFOLIOS_VALUE = '__ALL_PORTFOLIOS__';

const PortfolioDropdown = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]);
  const [selectedPortfolioCostingMethod, setSelectedPortfolioCostingMethod] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [holdingsLastUpdateFrom, setHoldingsLastUpdateFrom] = useState('');
  const [holdingsLastUpdateTo, setHoldingsLastUpdateTo] = useState('');
  const [rawBuyTransactions, setRawBuyTransactions] = useState([]);
  const [rawSellTransactions, setRawSellTransactions] = useState([]);
  const [backendPositions, setBackendPositions] = useState([]);

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
      setRawBuyTransactions([]);
      setRawSellTransactions([]);
      setBackendPositions([]);
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const loadPortfolioHoldings = async (portfolioName) => {
    try {
      setHoldingsLoading(true);
      
      if (portfolioName === ALL_PORTFOLIOS_VALUE) {
        let buyTransactions = [];
        let sellTransactions = [];

        try {
          buyTransactions = await transactionEntryAPI.getAllBuyTransactions();
        } catch (buyTxError) {
          console.error('Error fetching buy transactions:', buyTxError);
        }

        try {
          sellTransactions = await transactionEntryAPI.getAllSellTransactions();
        } catch (sellTxError) {
          console.error('Error fetching sell transactions:', sellTxError);
        }

        setRawBuyTransactions(buyTransactions || []);
        setRawSellTransactions(sellTransactions || []);
        setBackendPositions([]);
        return;
      }

      // Find the portfolio ID for the selected portfolio name
      const selectedPortfolio = portfolios.find(p => p.portfolioName === portfolioName);
      if (!selectedPortfolio) {
        console.error('Portfolio not found:', portfolioName);
        setRawBuyTransactions([]);
        setRawSellTransactions([]);
        setBackendPositions([]);
        return;
      }
      
      const portfolioId = selectedPortfolio.id || selectedPortfolio.portfolioId;
      console.log('Using portfolio ID:', portfolioId, 'for portfolio:', portfolioName);
      console.log('Selected portfolio object:', selectedPortfolio);
      
      if (!portfolioId) {
        console.error('No portfolio ID found for portfolio:', portfolioName);
        setRawBuyTransactions([]);
        setRawSellTransactions([]);
        setBackendPositions([]);
        return;
      }

      let positionsData = [];
      try {
        positionsData = await transactionEntryAPI.getPortfolioPositions(portfolioId);
      } catch (positionsError) {
        console.error('Error fetching portfolio positions:', positionsError);
      }
      
      // Fetch all buy transactions, then filter to this portfolio
      let buyTransactions = [];
      try {
        const allBuyTransactions = await transactionEntryAPI.getAllBuyTransactions();
        buyTransactions = allBuyTransactions.filter(tx => 
          tx.portfolio && tx.portfolio.toLowerCase().trim() === portfolioName.toLowerCase().trim()
        );
        console.log('Buy transactions for portfolio:', buyTransactions);
      } catch (buyTxError) {
        console.error('Error fetching buy transactions:', buyTxError);
      }
      
      let sellTransactions = [];
      try {
        const allSellTransactions = await transactionEntryAPI.getAllSellTransactions();
        sellTransactions = allSellTransactions.filter(tx => 
          tx.portfolio_name && tx.portfolio_name.toLowerCase().trim() === portfolioName.toLowerCase().trim()
        );
        console.log('Sell transactions for portfolio:', sellTransactions);
      } catch (sellTxError) {
        console.error('Error fetching sell transactions:', sellTxError);
      }

      setRawBuyTransactions(buyTransactions || []);
      setRawSellTransactions(sellTransactions || []);
      setBackendPositions(positionsData || []);
    } catch (error) {
      console.error('Error loading portfolio holdings:', error);
      console.error('Error details:', error.message);
      setRawBuyTransactions([]);
      setRawSellTransactions([]);
      setBackendPositions([]);
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

  useEffect(() => {
    setHoldingsLastUpdateFrom('');
    setHoldingsLastUpdateTo('');
  }, [selectedPortfolio]);

  const isAllPortfoliosSelected = selectedPortfolio === ALL_PORTFOLIOS_VALUE;

  const filteredTransactions = useMemo(() => {
    const from = holdingsLastUpdateFrom.trim();
    const to = holdingsLastUpdateTo.trim();
    const todayYmd = toLocalYmd(new Date());
    if (!from && !to) {
      return { buy: rawBuyTransactions, sell: rawSellTransactions };
    }

    let effFrom = from;
    let effTo = to;
    if (from && to && from > to) {
      effFrom = to;
      effTo = from;
    }

    const inRange = (tx) => {
      const ymd = txTradeDateYmd(tx);
      if (!ymd) return false;
      if (effFrom && ymd < effFrom) return false;
      if (effTo) {
        if (ymd > effTo) return false;
      } else if (effFrom && todayYmd && ymd > todayYmd) {
        return false;
      }
      return true;
    };

    return {
      buy: (rawBuyTransactions || []).filter(inRange),
      sell: (rawSellTransactions || []).filter(inRange),
    };
  }, [rawBuyTransactions, rawSellTransactions, holdingsLastUpdateFrom, holdingsLastUpdateTo]);

  const hasHoldingsDateFilter = Boolean(holdingsLastUpdateFrom.trim() || holdingsLastUpdateTo.trim());

  const useBackendPositionsForHoldings =
    !isAllPortfoliosSelected && !hasHoldingsDateFilter && (backendPositions?.length ?? 0) > 0;

  const holdingsAllDates = useMemo(() => {
    if (useBackendPositionsForHoldings) {
      return buildHoldingsFromBackendPositions(
        backendPositions,
        rawBuyTransactions || [],
        rawSellTransactions || []
      );
    }
    return buildHoldingsFromTransactions(
      rawBuyTransactions || [],
      rawSellTransactions || []
    );
  }, [
    useBackendPositionsForHoldings,
    backendPositions,
    rawBuyTransactions,
    rawSellTransactions,
  ]);

  const holdingsFilteredDates = useMemo(() => {
    if (hasHoldingsDateFilter) {
      return buildHoldingsFromTransactions(
        filteredTransactions.buy || [],
        filteredTransactions.sell || []
      );
    }
    return holdingsAllDates;
  }, [hasHoldingsDateFilter, filteredTransactions, holdingsAllDates]);

  const holdingsDateRangeWasReversed = Boolean(
    holdingsLastUpdateFrom.trim() &&
      holdingsLastUpdateTo.trim() &&
      holdingsLastUpdateFrom.trim() > holdingsLastUpdateTo.trim()
  );


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
    if (value === ALL_PORTFOLIOS_VALUE) {
      setSelectedPortfolioId('ALL');
      setSelectedPortfolioCostingMethod('');
      await loadPortfolioHoldings(value);
      return;
    }

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
      setRawBuyTransactions([]);
      setRawSellTransactions([]);
      setBackendPositions([]);
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
          <h1 className="pf-main-title">Portfolio Selection</h1>
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
            <option value={ALL_PORTFOLIOS_VALUE}>All Portfolios</option>
            {portfolios.map((portfolio, index) => (
              <option key={`portfolio-${portfolio.id}-${index}`} value={portfolio.portfolioName}>
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

      {selectedPortfolio && (
        <div className="pf-secondary-container" aria-label="Trade date filter and costing method">
          <div className="pf-secondary-grid pf-secondary-grid-v2">
            <div
              className={`pf-holdings-date-filter${holdingsDateRangeWasReversed ? ' pf-holdings-date-filter-reversed' : ''}`}
              aria-label="Filter holdings by transaction trade date"
            >
              <div className="pf-panel-title-row">
                <div className="pf-panel-title">
                  <span>Trade date</span>
                </div>
                {hasHoldingsDateFilter ? (
                  <button
                    type="button"
                    className="pf-link-btn"
                    onClick={() => {
                      setHoldingsLastUpdateFrom('');
                      setHoldingsLastUpdateTo('');
                    }}
                  >
                    Clear
                  </button>
                ) : (
                  <span className="pf-panel-meta">Optional</span>
                )}
              </div>
              {holdingsDateRangeWasReversed ? (
                <div className="pf-inline-warning">From/To were reversed for filtering.</div>
              ) : null}
              <div className="pf-holdings-date-filter-controls">
                <div className="pf-holdings-date-filter-field">
                  <label htmlFor="pfHoldingsLastFrom">From</label>
                  <input
                    id="pfHoldingsLastFrom"
                    type="date"
                    className="pf-holdings-date-input"
                    value={holdingsLastUpdateFrom}
                    onChange={(e) => setHoldingsLastUpdateFrom(e.target.value)}
                    disabled={holdingsLoading}
                  />
                </div>
                <div className="pf-holdings-date-filter-field">
                  <label htmlFor="pfHoldingsLastTo">To</label>
                  <input
                    id="pfHoldingsLastTo"
                    type="date"
                    className="pf-holdings-date-input"
                    value={holdingsLastUpdateTo}
                    onChange={(e) => setHoldingsLastUpdateTo(e.target.value)}
                    disabled={holdingsLoading}
                  />
                </div>
              </div>
              <ul className="pf-rule-list" aria-label="Trade date filter rules">
                <li><strong>From</strong> only: include trades from that date through today.</li>
                <li><strong>To</strong> only: include trades on or before that date.</li>
                <li><strong>Both</strong>: inclusive between the dates.</li>
                <li>Leave both blank to use all trades.</li>
              </ul>
            </div>

            <div className="pf-costing-method-section">
              <div className="pf-panel-title-row">
                <div className="pf-panel-title">
                  <span>Costing method</span>
                </div>
                {selectedPortfolioCostingMethod ? (
                  <span className="pf-badge pf-badge-blue">Assigned</span>
                ) : (
                  <span className="pf-badge pf-badge-gray">Not assigned</span>
                )}
              </div>

              <div className="pf-kv">
                <div className="pf-kv-row">
                  <div className="pf-kv-label">Portfolio</div>
                  <div className="pf-kv-value">
                    {selectedPortfolio === ALL_PORTFOLIOS_VALUE
                      ? 'All Portfolios'
                      : `${selectedPortfolio} (${selectedPortfolioId})`}
                  </div>
                </div>
                <div className="pf-kv-row">
                  <div className="pf-kv-label">Method</div>
                  <div className="pf-kv-value">
                    {selectedPortfolio === ALL_PORTFOLIOS_VALUE ? (
                      <span className="pf-muted">
                        Multiple portfolios selected - costing method varies by portfolio
                      </span>
                    ) : selectedPortfolioCostingMethod ? (
                      <span className="pf-method-pill">
                        {costingMethodLabels[selectedPortfolioCostingMethod] || selectedPortfolioCostingMethod}
                      </span>
                    ) : (
                      <span className="pf-muted">No costing method assigned</span>
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
               <div className="ph-table-header-row">
                 <h2>Portfolio Holdings</h2>
                 {hasHoldingsDateFilter ? (
                   <button
                     type="button"
                     className="pf-holdings-date-clear ph-header-clear"
                     onClick={() => {
                       setHoldingsLastUpdateFrom('');
                       setHoldingsLastUpdateTo('');
                     }}
                   >
                     Clear date filter
                   </button>
                 ) : null}
               </div>
               <p>
                 Current holdings for{' '}
                 <strong>{isAllPortfoliosSelected ? 'All Portfolios' : selectedPortfolio}</strong>
                 {hasHoldingsDateFilter && holdingsAllDates.length > 0
                   ? ` (${holdingsFilteredDates.length} of ${holdingsAllDates.length} rows by trade date filter).`
                   : '.'}
               </p>
          </div>
          
             {holdingsLoading ? (
               <div className="ph-loading">
                 <div className="ph-loading-spinner"></div>
                 <p>Loading portfolio holdings...</p>
            </div>
             ) : holdingsAllDates.length === 0 ? (
               <div className="ph-no-data">
                 <div className="ph-no-data-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
                 <h3>No Holdings Data</h3>
                 <p>No holdings found for this portfolio. Make sure you have transactions recorded for this portfolio.</p>
              </div>
            ) : hasHoldingsDateFilter && holdingsFilteredDates.length === 0 ? (
              <div className="ph-no-data">
                <div className="ph-no-data-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3>No Holdings in This Date Range</h3>
                <p>
                  None of the holdings remain after filtering trades by <strong>trade date</strong>. Adjust the filter
                  or clear the dates.
                </p>
                <button
                  type="button"
                  className="pf-holdings-date-clear ph-no-data-clear"
                  onClick={() => {
                    setHoldingsLastUpdateFrom('');
                    setHoldingsLastUpdateTo('');
                  }}
                >
                  Clear date filter
                </button>
              </div>
            ) : (
               <div className="ph-table-container">
                 <table className="ph-table">
                   <thead>
                     <tr>
                       <th>Company</th>
                       <th>Net Quantity</th>
                       <th>Average Buy Price</th>
                       <th>Cost Value</th>
                       <th>Charges</th>
                       <th>Net Value</th>
                       <th>Cost per Share</th>
                        <th>Last Trade Date</th>
                      </tr>
                    </thead>
                   <tbody>
                     {holdingsFilteredDates.map((holding) => (
                       <tr key={holding.companyName} className="ph-table-row">
                         <td className="ph-company-name">{holding.companyName}</td>
                         <td className="ph-quantity">{(holding.netQuantity || 0).toLocaleString()}</td>
                         <td className="ph-avg-price">{(holding.avgBuyPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                         <td className="ph-total-value">{(holding.costValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                         <td className="ph-charges">{(holding.totalCharges || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                         <td className="ph-net-value">{(holding.netValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                         <td className="ph-cost-per-share">{(holding.costPerShare || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                         <td className="ph-last-update">
                           {holding.lastTradeDate ? holding.lastTradeDate : '—'}
                         </td>
                        </tr>
                      ))}
                    </tbody>
                   <tfoot>
                     <tr className="ph-total-row">
                       <td><strong>Portfolio Totals</strong></td>
                       <td className="ph-total-quantity">
                         {holdingsFilteredDates.reduce((sum, holding) => sum + (holding.netQuantity || 0), 0).toLocaleString()}
                       </td>
                       <td className="ph-total-avg-price">
                         {holdingsFilteredDates.length > 0 ? 
                           (holdingsFilteredDates.reduce((sum, holding) => sum + (holding.costValue || 0), 0) / 
                            holdingsFilteredDates.reduce((sum, holding) => sum + (holding.netQuantity || 0), 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : 
                           '0.00'
                         }
                       </td>
                       <td className="ph-total-value-sum">
                         {holdingsFilteredDates.reduce((sum, holding) => sum + (holding.costValue || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                       </td>
                       <td className="ph-total-charges">
                         {holdingsFilteredDates.reduce((sum, holding) => sum + (holding.totalCharges || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                       </td>
                       <td className="ph-total-net-value">
                         {holdingsFilteredDates.reduce((sum, holding) => sum + (holding.netValue || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                       </td>
                       <td className="ph-total-cost-per-share">
                         {holdingsFilteredDates.length > 0 ? 
                           (holdingsFilteredDates.reduce((sum, holding) => sum + (holding.netValue || 0), 0) / 
                            holdingsFilteredDates.reduce((sum, holding) => sum + (holding.netQuantity || 0), 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : 
                           '0.00'
                         }
                       </td>
                       <td className="ph-total-last-update" aria-hidden="true" />
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