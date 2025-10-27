import React, { useState, useEffect, useCallback } from 'react';
import './Styles/RealizedPnL.css';
import { realizedPnLService } from '../../services/realizedPnLService';
import { portfolioAPI } from '../../services/api';

const RealizedPnL = () => {
  const [realizedData, setRealizedData] = useState({
    portfolioSummary: {
      totalRealizedGains: 0,
      totalRealizedLosses: 0,
      netRealizedPnL: 0,
      totalTrades: 0,
      winRate: 0
    },
    tradeHistory: [],
    performanceByPeriod: [],
    topPerformers: [],
    taxSummary: {
      shortTermGains: 0,
      longTermGains: 0,
      shortTermLosses: 0,
      longTermLosses: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trades');
  const [timeRange, setTimeRange] = useState('1Y');
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);

  const loadActivePortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      const data = await portfolioAPI.getActivePortfolios();
      console.log('Loaded portfolios from API:', data);
      setPortfolios(data);
    } catch (error) {
      console.error('Error loading active portfolios:', error);
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const loadRealizedPnLData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use backend API to get realized P&L data
      let portfolioId = selectedPortfolio;
      
      if (selectedPortfolio === 'all') {
        // If no specific portfolio selected, use the first available portfolio
        if (portfolios.length > 0) {
          portfolioId = portfolios[0].portfolioId;
        } else {
          console.warn('No portfolios available for realized P&L data');
          setIsLoading(false);
          return;
        }
      }
      
      // Check if the selected portfolio exists in the portfolios list
      const portfolioExists = portfolios.some(p => p.portfolioId === portfolioId);
      if (!portfolioExists && selectedPortfolio !== 'all') {
        console.warn(`Portfolio "${portfolioId}" not found in available portfolios`);
        setIsLoading(false);
        return;
      }
      
      console.log('Loading realized P&L data for portfolio:', portfolioId, 'timeRange:', timeRange);
      console.log('Available portfolios:', portfolios.map(p => p.portfolioName));
      const data = await realizedPnLService.getCompleteData(portfolioId, timeRange);
      
      console.log('Received realized P&L data:', data);
      console.log('Trade History length:', data.tradeHistory ? data.tradeHistory.length : 'undefined');
      console.log('Portfolio Summary:', data.portfolioSummary);
      console.log('Trade History data:', data.tradeHistory);
      setRealizedData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading realized P&L data:', error);
      // Fallback to empty data structure
      setRealizedData({
        portfolioSummary: {
          totalRealizedGains: 0,
          totalRealizedLosses: 0,
          netRealizedPnL: 0,
          totalTrades: 0,
          winRate: 0
        },
        tradeHistory: [],
        performanceByPeriod: [],
        topPerformers: [],
        taxSummary: {
          shortTermGains: 0,
          longTermGains: 0,
          shortTermLosses: 0,
          longTermLosses: 0
        }
      });
      setIsLoading(false);
    }
  }, [selectedPortfolio, timeRange, portfolios]);

  useEffect(() => {
    loadRealizedPnLData();
  }, [loadRealizedPnLData]);

  // Load active portfolios on component mount
  useEffect(() => {
    loadActivePortfolios();
  }, []);

  // Auto-select first portfolio when portfolios are loaded
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolio === 'all') {
      setSelectedPortfolio(portfolios[0].portfolioId);
    }
  }, [portfolios, selectedPortfolio]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPnLColor = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  // Handler functions for action buttons
  const handleGenerateReport = async () => {
    try {
      let portfolioId = selectedPortfolio;
      if (selectedPortfolio === 'all' && portfolios.length > 0) {
        portfolioId = portfolios[0].portfolioId;
      }
      await realizedPnLService.generateReport(portfolioId, timeRange, 'summary');
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleExportToExcel = async () => {
    try {
      let portfolioId = selectedPortfolio;
      if (selectedPortfolio === 'all' && portfolios.length > 0) {
        portfolioId = portfolios[0].portfolioId;
      }
      await realizedPnLService.exportToExcel(portfolioId, timeRange);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="realized-pnl-loading-container">
        <div className="realized-pnl-loading-spinner"></div>
        <p>Loading Realized Capital Gain data...</p>
      </div>
    );
  }

  return (
    <div className="realized-pnl-page">
      <div className="realized-pnl-page-wrapper">
      <div className="realized-pnl-page-header">
        <h1 className="realized-pnl-page-title">Realized Gain/Loss Tracking</h1>
        <div className="realized-pnl-page-controls">
          <div className="realized-pnl-time-selector">
            <label className="realized-pnl-time-label">Time Range:</label>
            <select className="realized-pnl-time-dropdown" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
              <option value="3Y">3 Years</option>
              <option value="5Y">5 Years</option>
            </select>
          </div>
          <div className="realized-pnl-portfolio-selector">
            <label className="realized-pnl-portfolio-label">Portfolio:</label>
            <select className="realized-pnl-portfolio-dropdown"
              value={selectedPortfolio} 
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              disabled={portfoliosLoading}
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((portfolio, index) => (
                <option key={`portfolio-${portfolio.id || index}-${portfolio.portfolioName}`} value={portfolio.portfolioId}>
                  {portfolio.portfolioName}
                </option>
              ))}
            </select>
            {portfoliosLoading && <span className="realized-pnl-loading-indicator">Loading portfolios...</span>}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="realized-pnl-summary-grid">
        <div className="realized-pnl-summary-card">
          <div className="realized-pnl-card-title">Total Realized Gains</div>
          <div className="realized-pnl-card-amount positive">{formatCurrency(parseFloat(realizedData.portfolioSummary.totalRealizedGains || 0))}</div>
          <div className="realized-pnl-card-description">Profits from completed trades</div>
        </div>

        <div className="realized-pnl-summary-card">
          <div className="realized-pnl-card-title">Total Realized Losses</div>
          <div className="realized-pnl-card-amount negative">{formatCurrency(parseFloat(realizedData.portfolioSummary.totalRealizedLosses || 0))}</div>
          <div className="realized-pnl-card-description">Losses from completed trades</div>
        </div>

        <div className="realized-pnl-summary-card">
          <div className="realized-pnl-card-title">Net Realized Capital Gain</div>
          <div className={`realized-pnl-card-amount ${getPnLColor(realizedData.portfolioSummary.netRealizedPnL)}`}>
            {formatCurrency(parseFloat(realizedData.portfolioSummary.netRealizedPnL || 0))}
          </div>
          <div className="realized-pnl-card-description">Net profit/loss</div>
        </div>

        <div className="realized-pnl-summary-card">
          <div className="realized-pnl-card-title">Win Rate</div>
          <div className="realized-pnl-card-amount">{parseFloat(realizedData.portfolioSummary.winRate || 0).toFixed(1)}%</div>
          <div className="realized-pnl-card-description">Profitable trades</div>
        </div>

        <div className="realized-pnl-summary-card">
          <div className="realized-pnl-card-title">Realized P&L</div>
          <div className={`realized-pnl-card-amount ${getPnLColor(realizedData.realizedPnL || 0)}`}>
            {formatCurrency(parseFloat(realizedData.realizedPnL || 0))}
          </div>
          <div className="realized-pnl-card-description">
            After fees and cost of funds
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="realized-pnl-tab-navigation">
        <button 
          className={`realized-pnl-tab-button ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          Trade History
        </button>
        <button 
          className={`realized-pnl-tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="realized-pnl-tab-content">
        {activeTab === 'trades' && (
          <div className="realized-pnl-trades-content">
            {/* Buy Trade History */}
            <div className="realized-pnl-trade-history-section">
              <h3 className="realized-pnl-trade-history-title">Buy Trade History</h3>
              {realizedData.tradeHistory && realizedData.tradeHistory.filter(trade => trade.tradeType === 'BUY').length > 0 ? (
                <div className="realized-pnl-trade-history-table-container">
                  <table className="realized-pnl-trade-history-table">
                    <thead>
                      <tr>
                        <th className="realized-pnl-trade-history-header">Symbol</th>
                        <th className="realized-pnl-trade-history-header">Quantity</th>
                        <th className="realized-pnl-trade-history-header">Buy Price</th>
                        <th className="realized-pnl-trade-history-header">Buy Date</th>
                        <th className="realized-pnl-trade-history-header">Cost Basis</th>
                        <th className="realized-pnl-trade-history-header">Charges</th>
                        <th className="realized-pnl-trade-history-header">Net Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realizedData.tradeHistory
                        .filter(trade => trade.tradeType === 'BUY')
                        .map((trade) => (
                        <tr key={`buy-${trade.id}`} className="realized-pnl-trade-history-row realized-pnl-buy-row">
                          <td className="realized-pnl-trade-history-cell realized-pnl-trade-symbol">{trade.symbol}</td>
                          <td className="realized-pnl-trade-history-cell">{parseInt(trade.quantity || 0).toLocaleString()}</td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.buyPrice || 0))}</td>
                          <td className="realized-pnl-trade-history-cell">{formatDate(trade.buyDate)}</td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.costBasis || 0))}</td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.charges || 0))}</td>
                          <td className="realized-pnl-trade-history-cell">{
                            (() => {
                              const costBasis = parseFloat(trade.costBasis || 0);
                              const charges = parseFloat(trade.charges || 0);
                              return formatCurrency(costBasis + charges);
                            })()
                          }</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-trades-message">
                  <p>No buy transactions found for the selected portfolio and time range.</p>
                </div>
              )}
            </div>

            {/* Sell Trade History */}
            <div className="realized-pnl-trade-history-section">
              <h3 className="realized-pnl-trade-history-title">Sell Trade History</h3>
              {realizedData.tradeHistory && realizedData.tradeHistory.filter(trade => trade.tradeType === 'SELL').length > 0 ? (
                <div className="realized-pnl-trade-history-table-container">
                  <table className="realized-pnl-trade-history-table">
                    <thead>
                      <tr>
                        <th className="realized-pnl-trade-history-header">Symbol</th>
                        <th className="realized-pnl-trade-history-header">Quantity</th>
                        <th className="realized-pnl-trade-history-header">Buy Price</th>
                        <th className="realized-pnl-trade-history-header">Sell Price</th>
                        <th className="realized-pnl-trade-history-header">Buy Date</th>
                        <th className="realized-pnl-trade-history-header">Sell Date</th>
                        <th className="realized-pnl-trade-history-header">Holding Period</th>
                        <th className="realized-pnl-trade-history-header">Realized Capital Gain</th>
                        <th className="realized-pnl-trade-history-header">P&L %</th>
                        <th className="realized-pnl-trade-history-header">Charges</th>
                        <th className="realized-pnl-trade-history-header">Net Capital Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realizedData.tradeHistory
                        .filter(trade => trade.tradeType === 'SELL')
                        .map((trade) => (
                        <tr key={`sell-${trade.id}`} className="realized-pnl-trade-history-row realized-pnl-sell-row">
                          <td className="realized-pnl-trade-history-cell realized-pnl-trade-symbol">{trade.symbol}</td>
                          <td className="realized-pnl-trade-history-cell">{parseInt(trade.quantity || 0).toLocaleString()}</td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.buyPrice || 0))}</td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.sellPrice || 0))}</td>
                          <td className="realized-pnl-trade-history-cell">{formatDate(trade.buyDate)}</td>
                          <td className="realized-pnl-trade-history-cell">{formatDate(trade.sellDate)}</td>
                          <td className="realized-pnl-trade-history-cell realized-pnl-holding-period">
                            {trade.holdingPeriod}
                          </td>
                          <td className={`realized-pnl-trade-history-cell realized-pnl-trade-pnl ${getPnLColor(trade.realizedPnL)}`}>
                            {formatCurrency(parseFloat(trade.realizedPnL || 0))}
                          </td>
                          <td className={`realized-pnl-trade-history-cell realized-pnl-trade-pnl-percentage ${getPnLColor(trade.pnLPercentage)}`}>
                            {formatPercentage(parseFloat(trade.pnLPercentage || 0))}
                          </td>
                          <td className="realized-pnl-trade-history-cell">{formatCurrency(parseFloat(trade.charges || 0))}</td>
                          <td className={`realized-pnl-trade-history-cell realized-pnl-trade-net-pnl ${getPnLColor((parseFloat(trade.realizedPnL || 0) - parseFloat(trade.charges || 0)))}`}>
                            {
                              (() => {
                                const realized = parseFloat(trade.realizedPnL || 0);
                                const charges = parseFloat(trade.charges || 0);
                                return formatCurrency(realized - charges);
                              })()
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-trades-message">
                  <p>No sell transactions found for the selected portfolio and time range.</p>
                  <p>Sell transactions will appear here once you have completed sell transactions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="realized-pnl-performance-content">
            <h3 className="realized-pnl-performance-title">Performance by Time Period</h3>
            <div className="realized-pnl-performance-container">
              <table className="realized-pnl-performance-table">
                <thead>
                  <tr>
                    <th className="realized-pnl-performance-header">Period</th>
                    <th className="realized-pnl-performance-header">Realized Capital Gain</th>
                    <th className="realized-pnl-performance-header">Number of Trades</th>
                    <th className="realized-pnl-performance-header">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {realizedData.performanceByPeriod.map((period, index) => (
                    <tr key={`performance-${period.period}-${index}`}>
                      <td className="realized-pnl-performance-cell">{period.period}</td>
                      <td className={`realized-pnl-performance-cell ${getPnLColor(period.realizedPnL)}`}>
                        {formatCurrency(parseFloat(period.realizedPnL || 0))}
                      </td>
                      <td className="realized-pnl-performance-cell">{parseInt(period.trades || 0)}</td>
                      <td className="realized-pnl-performance-cell">{parseFloat(period.winRate || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export and Actions */}
      <div className="realized-pnl-actions-container">
        <button className="realized-pnl-action-button" onClick={() => handleGenerateReport()}>
          Generate Realized Capital Gain Report
        </button>
        <button className="realized-pnl-action-button" onClick={() => handleExportToExcel()}>
          Export to Excel
        </button>
        <button className="realized-pnl-action-button" onClick={loadRealizedPnLData}>
          Refresh Data
        </button>
      </div>
      </div>
    </div>
  );
};

export default RealizedPnL;
