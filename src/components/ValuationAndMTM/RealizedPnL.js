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
  const [activeTab, setActiveTab] = useState('overview');
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

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (num) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPnLColor = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const getHoldingPeriodType = (days) => {
    const dayCount = parseInt(days);
    return dayCount <= 365 ? 'short-term' : 'long-term';
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

  const handleTaxReport = async () => {
    try {
      let portfolioId = selectedPortfolio;
      if (selectedPortfolio === 'all' && portfolios.length > 0) {
        portfolioId = portfolios[0].portfolioId;
      }
      await realizedPnLService.generateReport(portfolioId, timeRange, 'tax');
      alert('Tax report generated successfully!');
    } catch (error) {
      console.error('Error generating tax report:', error);
      alert('Failed to generate tax report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="realized-pnl-loading">
        <div className="loading-spinner"></div>
        <p>Loading realized P&L data...</p>
      </div>
    );
  }

  return (
    <div className="realized-pnl">
      <div className="realized-pnl-header">
        <h1>Realized Gain/Loss Tracking</h1>
        <div className="header-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
              <option value="3Y">3 Years</option>
              <option value="5Y">5 Years</option>
            </select>
          </div>
          <div className="portfolio-selector">
            <label>Portfolio:</label>
            <select 
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
            {portfoliosLoading && <span className="loading-text">Loading portfolios...</span>}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">Total Realized Gains</div>
          <div className="card-value positive">{formatCurrency(parseFloat(realizedData.portfolioSummary.totalRealizedGains || 0))}</div>
          <div className="card-subtitle">Profits from completed trades</div>
        </div>

        <div className="summary-card">
          <div className="card-header">Total Realized Losses</div>
          <div className="card-value negative">{formatCurrency(parseFloat(realizedData.portfolioSummary.totalRealizedLosses || 0))}</div>
          <div className="card-subtitle">Losses from completed trades</div>
        </div>

        <div className="summary-card">
          <div className="card-header">Net Realized P&L</div>
          <div className={`card-value ${getPnLColor(realizedData.portfolioSummary.netRealizedPnL)}`}>
            {formatCurrency(parseFloat(realizedData.portfolioSummary.netRealizedPnL || 0))}
          </div>
          <div className="card-subtitle">Net profit/loss</div>
        </div>

        <div className="summary-card">
          <div className="card-header">Win Rate</div>
          <div className="card-value">{parseFloat(realizedData.portfolioSummary.winRate || 0).toFixed(1)}%</div>
          <div className="card-subtitle">Profitable trades</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="realized-pnl-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          Trade History
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          Tax Summary
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="performance-chart-placeholder">
              <div className="chart-header">
                <h3>Realized P&L Performance</h3>
                <span className="chart-period">{timeRange} Performance</span>
              </div>
              <div className="chart-container">
                <div className="chart-placeholder">
                  Realized P&L Chart Placeholder
                  <br />
                  <small>Connect to charting library for interactive charts</small>
                </div>
              </div>
            </div>

            <div className="top-performers">
              <h3>Top Performing Stocks</h3>
              <div className="performers-grid">
                {realizedData.topPerformers.map((stock, index) => (
                  <div key={`performer-${stock.symbol}-${index}`} className="performer-card">
                    <div className="performer-symbol">{stock.symbol}</div>
                    <div className={`performer-pnl ${getPnLColor(stock.totalPnL)}`}>
                      {formatCurrency(parseFloat(stock.totalPnL || 0))}
                    </div>
                    <div className="performer-stats">
                      <span>{parseInt(stock.trades || 0)} trades</span>
                      <span>{parseFloat(stock.avgReturn || 0).toFixed(1)}% avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="trades-content">
            <h3>Completed Trade History</h3>
            {realizedData.tradeHistory && realizedData.tradeHistory.length > 0 ? (
              <div className="trades-table">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Trade Type</th>
                      <th>Quantity</th>
                      <th>Buy Price</th>
                      <th>Sell Price</th>
                      <th>Buy Date</th>
                      <th>Sell Date</th>
                      <th>Holding Period</th>
                      <th>Realized P&L</th>
                      <th>P&L %</th>
                      <th>Net P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realizedData.tradeHistory.map((trade) => (
                      <tr key={trade.id} className="trade-row">
                        <td className="trade-symbol">{trade.symbol}</td>
                        <td className="trade-type">{trade.tradeType}</td>
                        <td className="trade-quantity">{parseInt(trade.quantity || 0).toLocaleString()}</td>
                        <td className="trade-buy-price">{formatCurrency(parseFloat(trade.buyPrice || 0))}</td>
                        <td className="trade-sell-price">{formatCurrency(parseFloat(trade.sellPrice || 0))}</td>
                        <td className="trade-buy-date">{trade.buyDate}</td>
                        <td className="trade-sell-date">{trade.sellDate}</td>
                        <td className={`trade-holding-period ${getHoldingPeriodType(trade.holdingPeriod)}`}>
                          {trade.holdingPeriod}
                        </td>
                        <td className={`trade-pnl ${getPnLColor(trade.realizedPnL)}`}>
                          {formatCurrency(parseFloat(trade.realizedPnL || 0))}
                        </td>
                        <td className={`trade-pnl-percentage ${getPnLColor(trade.pnLPercentage)}`}>
                          {formatPercentage(parseFloat(trade.pnLPercentage || 0))}
                        </td>
                        <td className={`trade-net-pnl ${getPnLColor(trade.netPnL)}`}>
                          {formatCurrency(parseFloat(trade.netPnL || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-trades-message">
                <p>No completed trades found for the selected portfolio and time range.</p>
                <p>Trade history will appear here once you have completed sell transactions.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-content">
            <h3>Performance by Time Period</h3>
            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Realized P&L</th>
                    <th>Number of Trades</th>
                    <th>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {realizedData.performanceByPeriod.map((period, index) => (
                    <tr key={`performance-${period.period}-${index}`}>
                      <td>{period.period}</td>
                      <td className={getPnLColor(period.realizedPnL)}>
                        {formatCurrency(parseFloat(period.realizedPnL || 0))}
                      </td>
                      <td>{parseInt(period.trades || 0)}</td>
                      <td>{parseFloat(period.winRate || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="tax-content">
            <h3>Tax Summary</h3>
            <div className="tax-grid">
              <div className="tax-card">
                <h4>Short-Term Gains</h4>
                <div className="tax-value positive">{formatCurrency(realizedData.taxSummary.shortTermGains)}</div>
                <div className="tax-description">Profits from trades held &lt;= 1 year</div>
              </div>

              <div className="tax-card">
                <h4>Long-Term Gains</h4>
                <div className="tax-value positive">{formatCurrency(realizedData.taxSummary.longTermGains)}</div>
                <div className="tax-description">Profits from trades held &gt; 1 year</div>
              </div>

              <div className="tax-card">
                <h4>Short-Term Losses</h4>
                <div className="tax-value negative">{formatCurrency(realizedData.taxSummary.shortTermLosses)}</div>
                <div className="tax-description">Losses from trades held &lt;= 1 year</div>
              </div>

              <div className="tax-card">
                <h4>Long-Term Losses</h4>
                <div className="tax-value negative">{formatCurrency(realizedData.taxSummary.longTermLosses)}</div>
                <div className="tax-description">Losses from trades held &gt; 1 year</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export and Actions */}
      <div className="actions-section">
        <button className="action-btn" onClick={() => handleGenerateReport()}>
          Generate Realized P&L Report
        </button>
        <button className="action-btn" onClick={() => handleExportToExcel()}>
          Export to Excel
        </button>
        <button className="action-btn" onClick={() => handleTaxReport()}>
          Tax Report
        </button>
        <button className="action-btn" onClick={loadRealizedPnLData}>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default RealizedPnL;
