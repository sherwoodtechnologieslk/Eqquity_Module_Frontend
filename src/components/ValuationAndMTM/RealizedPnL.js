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
  const [activeTab, setActiveTab] = useState('buy-trades');
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

  const formatKpiMoney = (value, mode = 'signed') => {
    const amount = Number(value) || 0;
    if (mode === 'magnitude') {
      return { sign: '', figure: formatCurrency(Math.abs(amount)) };
    }
    const sign = amount < 0 ? '−' : '';
    return { sign, figure: formatCurrency(Math.abs(amount)) };
  };

  const renderKpiMoney = (value, tone, mode = 'signed') => {
    const { sign, figure } = formatKpiMoney(value, mode);
    return (
      <div className={`realized-pnl-kpi__value realized-pnl-kpi__value--${tone}`}>
        {sign ? <span className="realized-pnl-kpi__sign">{sign}</span> : null}
        <span className="realized-pnl-kpi__currency">LKR</span>
        <span className="realized-pnl-kpi__figure">{figure}</span>
      </div>
    );
  };

  const formatPercentage = (num) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPnLColor = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const timeRangeLabels = {
    '1M': '1 month',
    '3M': '3 months',
    '6M': '6 months',
    '1Y': '1 year',
    '3Y': '3 years',
    '5Y': '5 years',
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
      <header className="realized-pnl-page-header">
        <div className="realized-pnl-header-text">
          <p className="realized-pnl-eyebrow">Accounting · Valuation</p>
          <h1 className="realized-pnl-page-title">Realized Gain/Loss Tracking</h1>
          <p className="realized-pnl-page-subtitle">
            Realized capital gains and losses from completed sell transactions
          </p>
        </div>
        <div className="realized-pnl-toolbar">
          <div className="realized-pnl-page-controls">
            <div className="realized-pnl-time-selector">
              <label className="realized-pnl-time-label" htmlFor="rpnlTimeRange">Time Range</label>
              <select id="rpnlTimeRange" className="realized-pnl-time-dropdown" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
              <option value="3Y">3 Years</option>
              <option value="5Y">5 Years</option>
            </select>
          </div>
          <div className="realized-pnl-portfolio-selector">
            <label className="realized-pnl-portfolio-label" htmlFor="rpnlPortfolio">Portfolio</label>
            <select id="rpnlPortfolio" className="realized-pnl-portfolio-dropdown"
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
      </header>
      <section className="realized-pnl-kpi-panel" aria-label="Realized gain and loss summary">
        <div className="realized-pnl-kpi-panel__head">
          <h2 className="realized-pnl-kpi-panel__title">Portfolio Summary</h2>
          <p className="realized-pnl-kpi-panel__meta">
            {timeRangeLabels[timeRange] || timeRange} period · {parseInt(realizedData.portfolioSummary.totalTrades || 0, 10).toLocaleString()} completed sells
          </p>
        </div>

        <div className="realized-pnl-summary-grid">
          <article className="realized-pnl-kpi realized-pnl-kpi--gains">
            <header className="realized-pnl-kpi__head">
              <span className="realized-pnl-kpi__label">Total Realized Gains</span>
            </header>
            {renderKpiMoney(realizedData.portfolioSummary.totalRealizedGains, 'positive', 'unsigned')}
            <footer className="realized-pnl-kpi__foot">Profits from completed trades</footer>
          </article>

          <article className="realized-pnl-kpi realized-pnl-kpi--losses">
            <header className="realized-pnl-kpi__head">
              <span className="realized-pnl-kpi__label">Total Realized Losses</span>
            </header>
            {renderKpiMoney(realizedData.portfolioSummary.totalRealizedLosses, 'negative', 'magnitude')}
            <footer className="realized-pnl-kpi__foot">Losses from completed trades</footer>
          </article>

          <article className="realized-pnl-kpi realized-pnl-kpi--net">
            <header className="realized-pnl-kpi__head">
              <span className="realized-pnl-kpi__label">Net Realized Capital Gain</span>
            </header>
            {renderKpiMoney(
              realizedData.portfolioSummary.netRealizedPnL,
              getPnLColor(realizedData.portfolioSummary.netRealizedPnL)
            )}
            <footer className="realized-pnl-kpi__foot">Net profit / loss before fee adjustment</footer>
          </article>

          <article className="realized-pnl-kpi realized-pnl-kpi--win-rate">
            <header className="realized-pnl-kpi__head">
              <span className="realized-pnl-kpi__label">Win Rate</span>
            </header>
            <div className="realized-pnl-kpi__value realized-pnl-kpi__value--metric">
              <span className="realized-pnl-kpi__figure">
                {parseFloat(realizedData.portfolioSummary.winRate || 0).toFixed(1)}
              </span>
              <span className="realized-pnl-kpi__unit">%</span>
            </div>
            <footer className="realized-pnl-kpi__foot">Profitable sell transactions</footer>
          </article>

          <article className="realized-pnl-kpi realized-pnl-kpi--featured">
            <header className="realized-pnl-kpi__head">
              <span className="realized-pnl-kpi__label">Realized P&amp;L</span>
              <span className="realized-pnl-kpi__badge">After fees</span>
            </header>
            {renderKpiMoney(realizedData.realizedPnL, getPnLColor(realizedData.realizedPnL || 0))}
            <footer className="realized-pnl-kpi__foot">Net of estimated buy &amp; sell charges</footer>
          </article>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="realized-pnl-tab-navigation" role="tablist" aria-label="Realized P&amp;L views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'buy-trades'}
          className={`realized-pnl-tab-button ${activeTab === 'buy-trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy-trades')}
        >
          Buy Trade History
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sell-trades'}
          className={`realized-pnl-tab-button ${activeTab === 'sell-trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell-trades')}
        >
          Sell Trade History
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'performance'}
          className={`realized-pnl-tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="realized-pnl-tab-content">
        {activeTab === 'buy-trades' && (
          <div className="realized-pnl-trades-content">
            <div className="realized-pnl-trade-history-section">
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
          </div>
        )}

        {activeTab === 'sell-trades' && (
          <div className="realized-pnl-trades-content">
            <div className="realized-pnl-trade-history-section">
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
        <button type="button" className="realized-pnl-action-button realized-pnl-action-button--primary" onClick={() => handleGenerateReport()}>
          Generate Realized Capital Gain Report
        </button>
        <button type="button" className="realized-pnl-action-button realized-pnl-action-button--excel" onClick={() => handleExportToExcel()}>
          Export to Excel
        </button>
        <button type="button" className="realized-pnl-action-button realized-pnl-action-button--secondary" onClick={loadRealizedPnLData}>
          Refresh Data
        </button>
      </div>
      </div>
    </div>
  );
};

export default RealizedPnL;
