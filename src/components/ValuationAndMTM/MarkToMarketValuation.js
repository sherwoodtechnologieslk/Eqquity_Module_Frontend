import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/api';
import './Styles/MarkToMarketValuation.css';

const MarkToMarketValuation = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [mtmData, setMtmData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [portfoliosError, setPortfoliosError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data for MTM - replace with actual API calls when available
  const mockMtmData = [
    {
      id: 1,
      companyName: 'John Keells Holdings PLC',
      symbol: 'JKH',
      quantity: 1000,
      costPrice: 150.50,
      marketPrice: 165.75,
      marketValue: 165750.00,
      costValue: 150500.00,
      unrealizedGainLoss: 15250.00,
      gainLossPercentage: 10.13,
      lastPriceUpdate: '2024-01-15 14:30:00'
    },
    {
      id: 2,
      companyName: 'Seylan Bank PLC',
      symbol: 'SEYB',
      quantity: 2500,
      costPrice: 45.20,
      marketPrice: 42.80,
      marketValue: 107000.00,
      costValue: 113000.00,
      unrealizedGainLoss: -6000.00,
      gainLossPercentage: -5.31,
      lastPriceUpdate: '2024-01-15 14:30:00'
    },
    {
      id: 3,
      companyName: 'Dialog Axiata PLC',
      symbol: 'DIAL',
      quantity: 800,
      costPrice: 12.75,
      marketPrice: 13.45,
      marketValue: 10760.00,
      costValue: 10200.00,
      unrealizedGainLoss: 560.00,
      gainLossPercentage: 5.49,
      lastPriceUpdate: '2024-01-15 14:30:00'
    }
  ];

  // Fetch active portfolios from backend
  const fetchPortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      setPortfoliosError('');
      const data = await portfolioAPI.getActivePortfolios();
      setPortfolios(data);
      if (data.length > 0) {
        setSelectedPortfolio(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      setPortfolios([]);
      setPortfoliosError('Failed to load portfolios. Please try again.');
    } finally {
      setPortfoliosLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadMtmData(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  const loadMtmData = async (portfolioId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMtmData(mockMtmData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading MTM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMtmData = () => {
    loadMtmData(selectedPortfolio);
  };

  const calculatePortfolioTotals = () => {
    if (!mtmData.length) return { totalCost: 0, totalMarket: 0, totalGainLoss: 0, totalGainLossPercentage: 0 };
    
    const totalCost = mtmData.reduce((sum, item) => sum + item.costValue, 0);
    const totalMarket = mtmData.reduce((sum, item) => sum + item.marketValue, 0);
    const totalGainLoss = totalMarket - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    
    return { totalCost, totalMarket, totalGainLoss, totalGainLossPercentage };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  // Helper function to get selected portfolio name
  const getSelectedPortfolioName = () => {
    if (!selectedPortfolio) return '';
    const portfolio = portfolios.find(p => p.id == selectedPortfolio);
    return portfolio ? portfolio.portfolioName : '';
  };

  const totals = calculatePortfolioTotals();

  return (
    <div className="mtm-page">
      <div className="mtm-content-wrapper">
        {/* Header Section */}
        <div className="mtm-header-section">
          <div className="mtm-header-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
            </svg>
          </div>
          <div className="mtm-header-text-group">
            <h1 className="mtm-main-title">Mark-to-Market Valuation</h1>
            <p className="mtm-subtitle">
              {portfoliosLoading ? 'Loading portfolios...' : 
               selectedPortfolio ? `Real-time portfolio valuation for ${getSelectedPortfolioName()}` : 
               portfolios.length > 0 ? `Real-time portfolio valuation and performance tracking (${portfolios.length} portfolios available)` :
               'Real-time portfolio valuation and performance tracking'}
            </p>
          </div>
        </div>

        {/* Portfolio Selection and Controls */}
        <div className="mtm-controls-section">
          <div className="mtm-portfolio-selector">
            <label htmlFor="portfolioSelect">Select Portfolio:</label>
            <select
              id="portfolioSelect"
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              className="mtm-portfolio-select"
              disabled={portfoliosLoading}
            >
              {portfoliosLoading ? (
                <option value="">Loading portfolios...</option>
              ) : portfolios.length === 0 ? (
                <option value="">No portfolios found.</option>
              ) : (
                portfolios.map(portfolio => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.portfolioName}
                  </option>
                ))
              )}
            </select>
            {portfoliosError && (
              <div className="mtm-error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                {portfoliosError}
                <button 
                  onClick={fetchPortfolios}
                  style={{ 
                    marginLeft: '10px', 
                    padding: '2px 8px', 
                    fontSize: '11px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '3px', 
                    cursor: 'pointer' 
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          
          <div className="mtm-action-buttons">
            <button 
              onClick={refreshMtmData}
              className="mtm-btn mtm-btn-primary"
              disabled={loading || !selectedPortfolio}
            >
              {loading ? (
                <>
                  <span className="mtm-btn-spinner"></span>
                  Refreshing...
                </>
              ) : (
                <>
                  <span className="mtm-btn-icon">↻</span>
                  Refresh Data
                </>
              )}
            </button>
            
            <button className="mtm-btn mtm-btn-secondary">
              <span className="mtm-btn-icon"></span>
              Export Report
            </button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="mtm-summary-section">
          <div className="mtm-summary-card">
            <div className="mtm-summary-icon total-cost">
            </div>
            <div className="mtm-summary-content">
              <h3>Total Cost Value</h3>
              <p className="mtm-summary-amount">{formatCurrency(totals.totalCost)}</p>
            </div>
          </div>

          <div className="mtm-summary-card">
            <div className="mtm-summary-icon total-market">
            </div>
            <div className="mtm-summary-content">
              <h3>Total Market Value</h3>
              <p className="mtm-summary-amount">{formatCurrency(totals.totalMarket)}</p>
            </div>
          </div>

          <div className="mtm-summary-card">
            <div className={`mtm-summary-icon total-gain-loss ${totals.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            </div>
            <div className="mtm-summary-content">
              <h3>Total Unrealized G/L</h3>
              <p className={`mtm-summary-amount ${totals.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(totals.totalGainLoss)}
              </p>
              <p className="mtm-summary-percentage">
                {formatPercentage(totals.totalGainLossPercentage)}
              </p>
            </div>
          </div>

          <div className="mtm-summary-card">
            <div className="mtm-summary-icon last-updated">
            </div>
            <div className="mtm-summary-content">
              <h3>Last Updated</h3>
              <p className="mtm-summary-amount">
                {lastUpdated.toLocaleDateString()}
              </p>
              <p className="mtm-summary-time">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* MTM Data Table */}
        <div className="mtm-table-section">
          <div className="mtm-table-header">
            <h2>Position Details</h2>
            <p>Mark-to-market valuation for all positions in the selected portfolio</p>
          </div>

          {loading ? (
            <div className="mtm-loading">
              <div className="mtm-loading-spinner"></div>
              <p>Loading MTM data...</p>
            </div>
          ) : (
            <div className="mtm-table-container">
              <table className="mtm-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Cost Price</th>
                    <th>Market Price</th>
                    <th>Cost Value</th>
                    <th>Market Value</th>
                    <th>Unrealized G/L</th>
                    <th>G/L %</th>
                    <th>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {mtmData.map((item) => (
                    <tr key={item.id} className="mtm-table-row">
                      <td className="mtm-company-name">{item.companyName}</td>
                      <td className="mtm-symbol">{item.symbol}</td>
                      <td className="mtm-quantity">{item.quantity.toLocaleString()}</td>
                      <td className="mtm-cost-price">{formatCurrency(item.costPrice)}</td>
                      <td className="mtm-market-price">{formatCurrency(item.marketPrice)}</td>
                      <td className="mtm-cost-value">{formatCurrency(item.costValue)}</td>
                      <td className="mtm-market-value">{formatCurrency(item.marketValue)}</td>
                      <td className={`mtm-gain-loss ${item.unrealizedGainLoss >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(item.unrealizedGainLoss)}
                      </td>
                      <td className={`mtm-gain-loss-percentage ${item.gainLossPercentage >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercentage(item.gainLossPercentage)}
                      </td>
                      <td className="mtm-last-update">{item.lastPriceUpdate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="mtm-total-row">
                    <td colSpan="5"><strong>Portfolio Totals</strong></td>
                    <td className="mtm-total-cost">{formatCurrency(totals.totalCost)}</td>
                    <td className="mtm-total-market">{formatCurrency(totals.totalMarket)}</td>
                    <td className={`mtm-total-gain-loss ${totals.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(totals.totalGainLoss)}
                    </td>
                    <td className={`mtm-total-gain-loss-percentage ${totals.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercentage(totals.totalGainLossPercentage)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mtm-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Real-time MTM valuation • Market data updated every 15 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default MarkToMarketValuation;
