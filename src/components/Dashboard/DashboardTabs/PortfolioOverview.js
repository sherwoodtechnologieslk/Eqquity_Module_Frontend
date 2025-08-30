import React, { useState, useEffect } from 'react';
import './PortfolioOverview.css';

const PortfolioOverview = () => {
  const [portfolioData, setPortfolioData] = useState({
    summary: {
      totalValue: 0,
      totalPnL: 0,
      totalCost: 0,
      cashBalance: 0,
      numberOfPositions: 0
    },
    holdings: [],
    assetAllocation: {
      equity: 0,
      cash: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
              // Fetch portfolio data from backend
                const response = await fetch('http://localhost:8080/api/portfolios/overview', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
            // Removed Authorization header since backend doesn't require it for now
          }
        });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPortfolioData(result.data);
        } else {
          // Fallback to mock data
          setMockData();
        }
      } else {
        // Fallback to mock data
        setMockData();
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Fallback to mock data
      setMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const setMockData = () => {
    const mockData = {
      summary: {
        totalValue: 1250000,
        totalPnL: 45000,
        totalCost: 1205000,
        cashBalance: 75000,
        numberOfPositions: 15
      },
      holdings: [
        { symbol: 'AAPL', quantity: 100, avgPrice: 145.25, currentPrice: 150.25, marketValue: 15025, pnl: 500, sector: 'Technology' },
        { symbol: 'MSFT', quantity: 75, avgPrice: 315.50, currentPrice: 320.50, marketValue: 24037.5, pnl: 375, sector: 'Technology' },
        { symbol: 'GOOGL', quantity: 50, avgPrice: 2700.00, currentPrice: 2750.00, marketValue: 137500, pnl: 2500, sector: 'Technology' },
        { symbol: 'NVDA', quantity: 200, avgPrice: 450.00, currentPrice: 480.00, marketValue: 96000, pnl: 6000, sector: 'Technology' },
        { symbol: 'JPM', quantity: 150, avgPrice: 140.00, currentPrice: 145.00, marketValue: 21750, pnl: 750, sector: 'Financial' }
      ],
      assetAllocation: {
        equity: 1175000,
        cash: 75000
      }
    };
    setPortfolioData(mockData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="portfolio-overview-loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-overview">
      <div className="overview-header">
        <h2>Portfolio Overview</h2>
        <p className="overview-subtitle">Your current portfolio status and holdings</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon"></div>
          <div className="card-content">
            <h3>Total Portfolio Value</h3>
            <p className="card-value">{formatCurrency(portfolioData.summary.totalValue)}</p>
            <span className="card-change positive">+{formatPercentage(portfolioData.summary.totalPnL, portfolioData.summary.totalCost)}</span>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon"></div>
          <div className="card-content">
            <h3>Total P&L</h3>
            <p className="card-value">{formatCurrency(portfolioData.summary.totalPnL)}</p>
            <span className="card-change positive">+{formatPercentage(portfolioData.summary.totalPnL, portfolioData.summary.totalCost)}</span>
          </div>
        </div>

        <div className="summary-card info">
          <div className="card-icon"></div>
          <div className="card-content">
            <h3>Active Positions</h3>
            <p className="card-value">{portfolioData.summary.numberOfPositions}</p>
            <span className="card-change">Across multiple sectors</span>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-icon"></div>
          <div className="card-content">
            <h3>Cash Balance</h3>
            <p className="card-value">{formatCurrency(portfolioData.summary.cashBalance)}</p>
            <span className="card-change">{formatPercentage(portfolioData.summary.cashBalance, portfolioData.summary.totalValue)} of portfolio</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="allocation-section">
        <div className="section-header">
          <h3>Asset Allocation</h3>
        </div>
        <div className="allocation-cards">
          <div className="allocation-card equity">
            <div className="allocation-icon"></div>
            <div className="allocation-content">
              <h4>Equity</h4>
              <p className="allocation-value">{formatCurrency(portfolioData.assetAllocation.equity)}</p>
              <span className="allocation-percentage">
                {formatPercentage(portfolioData.assetAllocation.equity, portfolioData.summary.totalValue)}
              </span>
            </div>
          </div>
          <div className="allocation-card cash">
            <div className="allocation-icon"></div>
            <div className="allocation-content">
              <h4>Cash</h4>
              <p className="allocation-value">{formatCurrency(portfolioData.assetAllocation.cash)}</p>
              <span className="allocation-percentage">
                {formatPercentage(portfolioData.assetAllocation.cash, portfolioData.summary.totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="holdings-section">
        <div className="section-header">
          <h3>Current Holdings</h3>
          <button className="view-all-btn">View All Positions</button>
        </div>
        <div className="holdings-table-container">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Avg Price</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>P&L</th>
                <th>Sector</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.holdings.map((holding, index) => (
                <tr key={index} className="holding-row">
                  <td className="symbol-cell">
                    <span className="symbol">{holding.symbol}</span>
                  </td>
                  <td>{holding.quantity.toLocaleString()}</td>
                  <td>{formatCurrency(holding.avgPrice)}</td>
                  <td>{formatCurrency(holding.currentPrice)}</td>
                  <td>{formatCurrency(holding.marketValue)}</td>
                  <td className={`pnl-cell ${holding.pnl >= 0 ? 'positive' : 'negative'}`}>
                    {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                  </td>
                  <td className="sector-cell">{holding.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
