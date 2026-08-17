import React, { useState, useEffect, useMemo } from 'react';
import { portfolioAPI, portfolioCostingMethodAPI, transactionEntryAPI } from '../../services/api';
import {
  buildHoldingsFromTransactions,
  buildHoldingsFromBackendPositions,
} from '../../utils/portfolioHoldingsExport';
import {
  exportPortfolioSelectionToExcel,
  exportPortfolioSelectionToPdf,
} from '../../utils/portfolioSelectionExport';
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

  const exportMeta = () => {
    const portfolioLabel = isAllPortfoliosSelected
      ? 'All Portfolios'
      : selectedPortfolio || 'Portfolio';
    const costingLabel =
      selectedPortfolio === ALL_PORTFOLIOS_VALUE
        ? 'Varies by portfolio'
        : costingMethodLabels[selectedPortfolioCostingMethod] ||
          selectedPortfolioCostingMethod ||
          '';
    return {
      holdings: holdingsFilteredDates,
      portfolioName: portfolioLabel,
      costingMethod: costingLabel,
      dateFrom: holdingsLastUpdateFrom.trim() || '',
      dateTo: holdingsLastUpdateTo.trim() || '',
      filenameBase: `portfolio-holdings-${String(portfolioLabel)
        .replace(/[^\w\-]+/g, '_')
        .slice(0, 40)}`,
    };
  };

  const canExport =
    Boolean(selectedPortfolio) && !holdingsLoading && holdingsFilteredDates.length > 0;

  const handleExportExcel = () => {
    if (!canExport) return;
    exportPortfolioSelectionToExcel(exportMeta());
  };

  const handleExportPdf = () => {
    if (!canExport) return;
    exportPortfolioSelectionToPdf(exportMeta());
  };

  return (
    <div className="pf-page">
      <header className="pf-rail">
        <div>
          <p className="pf-rail__eyebrow">Trading · Portfolio</p>
          <h1 className="pf-rail__title">Portfolio Selection</h1>
          <p className="pf-rail__blurb">
            Select a portfolio to review holdings, average cost, charges, and net value.
          </p>
        </div>
        <div className="pf-rail__actions">
          <button
            type="button"
            className="pf-btn pf-btn--excel"
            onClick={handleExportExcel}
            disabled={!canExport}
            title={canExport ? 'Export holdings to Excel' : 'Select a portfolio with holdings to export'}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="pf-btn pf-btn--pdf"
            onClick={handleExportPdf}
            disabled={!canExport}
            title={canExport ? 'Export holdings to PDF' : 'Select a portfolio with holdings to export'}
          >
            Export PDF
          </button>
          <button
            type="button"
            className={`pf-refresh${isRefreshing ? ' is-spinning' : ''}`}
            onClick={handleRefresh}
            disabled={portfoliosLoading || isRefreshing}
            title="Refresh portfolios"
            aria-label="Refresh portfolio list"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="pf-controls" aria-label="Portfolio filters">
        <div className="pf-controls__row pf-controls__row--select">
          <label className="pf-field pf-field--grow" htmlFor="portfolio-select">
            <span className="pf-label">Portfolio</span>
            <div className={`pf-select${isFocused ? ' is-focused' : ''}${portfoliosLoading ? ' is-loading' : ''}`}>
              <select
                id="portfolio-select"
                className="pf-select__control"
                value={selectedPortfolio}
                onChange={handleSelectChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={portfoliosLoading}
              >
                <option value="" disabled>
                  {portfoliosLoading
                    ? 'Loading portfolios…'
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
              <span className={`pf-select__chevron${isOpen ? ' is-open' : ''}`} aria-hidden>
                ▾
              </span>
            </div>
          </label>

          {selectedPortfolio ? (
            <div className="pf-costing-inline">
              <span className="pf-label">Costing</span>
              {selectedPortfolio === ALL_PORTFOLIOS_VALUE ? (
                <span className="pf-muted">Varies by portfolio</span>
              ) : selectedPortfolioCostingMethod ? (
                <span className="pf-method">
                  {costingMethodLabels[selectedPortfolioCostingMethod] || selectedPortfolioCostingMethod}
                </span>
              ) : (
                <span className="pf-muted">Not assigned</span>
              )}
            </div>
          ) : null}
        </div>

        {selectedPortfolio && (
          <div
            className={`pf-controls__row pf-controls__row--dates${holdingsDateRangeWasReversed ? ' is-warn' : ''}`}
            aria-label="Filter holdings by transaction trade date"
          >
            <label className="pf-field">
              <span className="pf-label">Trade date from</span>
              <input
                id="pfHoldingsLastFrom"
                type="date"
                className="pf-input"
                value={holdingsLastUpdateFrom}
                onChange={(e) => setHoldingsLastUpdateFrom(e.target.value)}
                disabled={holdingsLoading}
              />
            </label>
            <label className="pf-field">
              <span className="pf-label">Trade date to</span>
              <input
                id="pfHoldingsLastTo"
                type="date"
                className="pf-input"
                value={holdingsLastUpdateTo}
                onChange={(e) => setHoldingsLastUpdateTo(e.target.value)}
                disabled={holdingsLoading}
              />
            </label>
            {hasHoldingsDateFilter ? (
              <button
                type="button"
                className="pf-btn pf-btn--ghost pf-btn--clear"
                onClick={() => {
                  setHoldingsLastUpdateFrom('');
                  setHoldingsLastUpdateTo('');
                }}
              >
                Clear dates
              </button>
            ) : (
              <span className="pf-hint-inline">Optional · blank = all trades</span>
            )}
            {holdingsDateRangeWasReversed ? (
              <span className="pf-warn-inline">From/To reversed for filtering.</span>
            ) : null}
          </div>
        )}
      </section>

      {selectedPortfolio && (
        <section className="pf-desk" aria-label="Portfolio holdings">
          <div className="pf-desk__head">
            <div>
              <h2>Portfolio holdings</h2>
              <p>
                Current holdings for{' '}
                <strong>{isAllPortfoliosSelected ? 'All Portfolios' : selectedPortfolio}</strong>
                {selectedPortfolioId && !isAllPortfoliosSelected ? ` (${selectedPortfolioId})` : ''}
                {hasHoldingsDateFilter && holdingsAllDates.length > 0
                  ? ` · ${holdingsFilteredDates.length} of ${holdingsAllDates.length} rows`
                  : ''}
              </p>
            </div>
            <div className="pf-desk__actions">
              {hasHoldingsDateFilter ? (
                <button
                  type="button"
                  className="pf-btn pf-btn--ghost"
                  onClick={() => {
                    setHoldingsLastUpdateFrom('');
                    setHoldingsLastUpdateTo('');
                  }}
                >
                  Clear date filter
                </button>
              ) : null}
              <button
                type="button"
                className="pf-btn pf-btn--excel"
                onClick={handleExportExcel}
                disabled={!canExport}
              >
                Export Excel
              </button>
              <button
                type="button"
                className="pf-btn pf-btn--pdf"
                onClick={handleExportPdf}
                disabled={!canExport}
              >
                Export PDF
              </button>
            </div>
          </div>

          {holdingsLoading ? (
            <div className="pf-state">
              <div className="pf-spinner" />
              <p>Loading portfolio holdings…</p>
            </div>
          ) : holdingsAllDates.length === 0 ? (
            <div className="pf-state">
              <h3>No holdings data</h3>
              <p>No holdings found for this portfolio. Record transactions first.</p>
            </div>
          ) : hasHoldingsDateFilter && holdingsFilteredDates.length === 0 ? (
            <div className="pf-state">
              <h3>No holdings in this date range</h3>
              <p>Adjust the trade-date filter or clear the dates.</p>
              <button
                type="button"
                className="pf-btn pf-btn--ghost"
                onClick={() => {
                  setHoldingsLastUpdateFrom('');
                  setHoldingsLastUpdateTo('');
                }}
              >
                Clear date filter
              </button>
            </div>
          ) : (
            <div className="pf-table-wrap">
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Company ID</th>
                    <th className="num">Net qty</th>
                    <th className="num">Avg buy</th>
                    <th className="num">Cost / share</th>
                    <th className="num">Cost value</th>
                    <th className="num">Charges</th>
                    <th className="num">Net value</th>
                    <th>Last trade</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsFilteredDates.map((holding) => (
                    <tr key={`${holding.companyKey}-${holding.companyName}`}>
                      <td className="name">{holding.companyName}</td>
                      <td className="symbol">{holding.companyId || '—'}</td>
                      <td className="num">{(holding.netQuantity || 0).toLocaleString()}</td>
                      <td className="num">
                        {(holding.avgBuyPrice || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="num">
                        {(holding.costPerShare || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="num">
                        {(holding.costValue || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="num">
                        {(holding.totalCharges || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="num">
                        {(holding.netValue || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="date">{holding.lastTradeDate ? holding.lastTradeDate : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <strong>Portfolio totals</strong>
                    </td>
                    <td aria-hidden="true" />
                    <td className="num">
                      {holdingsFilteredDates
                        .reduce((sum, holding) => sum + (holding.netQuantity || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td className="num">
                      {holdingsFilteredDates.length > 0
                        ? (
                            holdingsFilteredDates.reduce(
                              (sum, holding) => sum + (holding.costValue || 0),
                              0
                            ) /
                            holdingsFilteredDates.reduce(
                              (sum, holding) => sum + (holding.netQuantity || 0),
                              0
                            )
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00'}
                    </td>
                    <td className="num">
                      {holdingsFilteredDates.length > 0
                        ? (
                            holdingsFilteredDates.reduce(
                              (sum, holding) => sum + (holding.netValue || 0),
                              0
                            ) /
                            holdingsFilteredDates.reduce(
                              (sum, holding) => sum + (holding.netQuantity || 0),
                              0
                            )
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })
                        : '0.00'}
                    </td>
                    <td className="num">
                      {holdingsFilteredDates
                        .reduce((sum, holding) => sum + (holding.costValue || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </td>
                    <td className="num">
                      {holdingsFilteredDates
                        .reduce((sum, holding) => sum + (holding.totalCharges || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </td>
                    <td className="num">
                      {holdingsFilteredDates
                        .reduce((sum, holding) => sum + (holding.netValue || 0), 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                    </td>
                    <td aria-hidden="true" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PortfolioDropdown;