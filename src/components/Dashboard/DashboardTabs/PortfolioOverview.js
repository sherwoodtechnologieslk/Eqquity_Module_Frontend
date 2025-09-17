import React, { useState, useEffect, useCallback } from 'react';
import './PortfolioOverview.css';
import { portfolioAPI } from '../../../services/api';

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
    },
    valueHistory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('3M');

  // Generate mock portfolio value history data
  const generateValueHistory = (timeRange, currentValue) => {
    const now = new Date();
    const days = timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365;
    const data = [];
    
    // Start with a base value (80% of current value for realistic growth)
    let baseValue = currentValue * 0.8;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic volatility and growth
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
      const growth = 0.0005; // Slight upward trend
      baseValue = baseValue * (1 + volatility + growth);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * 100) / 100
      });
    }
    
    return data;
  };

  const loadActivePortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      const data = await portfolioAPI.getActivePortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Error loading active portfolios:', error);
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const setMockData = useCallback(() => {
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
      },
      valueHistory: generateValueHistory(selectedTimeRange, 1250000)
    };
    setPortfolioData(mockData);
  }, [selectedTimeRange]);

  const loadPortfolioData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Build URL with portfolio parameter
      let url = 'http://localhost:8080/api/portfolios/overview';
      if (selectedPortfolio && selectedPortfolio !== 'all') {
        url += `?portfolioId=${selectedPortfolio}`;
      }
      
      // Fetch portfolio data from backend
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Removed Authorization header since backend doesn't require it for now
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const portfolioValue = result.data.summary?.totalValue || 0;
          setPortfolioData({
            ...result.data,
            valueHistory: generateValueHistory(selectedTimeRange, portfolioValue)
          });
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
  }, [selectedPortfolio, selectedTimeRange, setMockData]);

  useEffect(() => {
    loadActivePortfolios();
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      loadPortfolioData();
    }
  }, [selectedPortfolio, portfolios, loadPortfolioData]);

  // Regenerate chart data when time range changes
  useEffect(() => {
    if (portfolioData.summary.totalValue > 0) {
      const newValueHistory = generateValueHistory(selectedTimeRange, portfolioData.summary.totalValue);
      setPortfolioData(prev => ({
        ...prev,
        valueHistory: newValueHistory
      }));
    }
  }, [selectedTimeRange, portfolioData.summary.totalValue]);


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

  // Sector data processing functions
  const getSectorData = (holdings) => {
    const sectorMap = {};
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      if (sectorMap[sector]) {
        sectorMap[sector] += holding.marketValue;
      } else {
        sectorMap[sector] = holding.marketValue;
      }
    });

    return Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getTotalSectorValue = (holdings) => {
    return holdings.reduce((total, holding) => total + holding.marketValue, 0);
  };

  const getSectorColor = (index) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
    return colors[index % colors.length];
  };

  // Sector Pie Chart Component
  const SectorPieChart = ({ data }) => {
    const sectorData = getSectorData(data);
    const totalValue = getTotalSectorValue(data);
    
    if (sectorData.length === 0) {
      return (
        <div className="no-data-message">
          <p>No sector data available</p>
        </div>
      );
    }

    let cumulativePercentage = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200" className="sector-pie-chart">
        {sectorData.map((sector, index) => {
          const percentage = (sector.value / totalValue) * 100;
          const startAngle = (cumulativePercentage / 100) * 360;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
          
          const startAngleRad = (startAngle - 90) * (Math.PI / 180);
          const endAngleRad = (endAngle - 90) * (Math.PI / 180);
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = percentage > 50 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          cumulativePercentage += percentage;

          return (
            <path
              key={index}
              d={pathData}
              fill={getSectorColor(index)}
              stroke="#fff"
              strokeWidth="2"
              className="sector-slice"
            />
          );
        })}
        <circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="#fff"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="pie-center-text"
          fontSize="12"
          fontWeight="600"
          fill="#374151"
        >
          {sectorData.length}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="pie-center-text"
          fontSize="10"
          fill="#6B7280"
        >
          Sectors
        </text>
      </svg>
    );
  };

  // Portfolio Value Chart Component
  const PortfolioValueChart = ({ data, timeRange }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>No data available for the selected time range</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding

    // Responsive chart dimensions - larger chart within same container
    const isMobile = window.innerWidth <= 768;
    const chartWidth = isMobile ? Math.min(window.innerWidth - 60, 550) : 700;
    const chartHeight = isMobile ? 280 : 350;
    const margin = { top: 25, right: 25, bottom: 35, left: isMobile ? 80 : 100 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const xScale = (index) => (index / (data.length - 1)) * innerWidth;
    const yScale = (value) => innerHeight - ((value - minValue + padding) / (range + 2 * padding)) * innerHeight;

    const pathData = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaData = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ` L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`;

    return (
      <div className="portfolio-chart-container">
        <svg width={chartWidth} height={chartHeight} className="portfolio-chart">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            <g className="grid-lines">
              {[0, 0.25, 0.5, 0.75, 1].map(t => (
                <line
                  key={t}
                  x1={0}
                  y1={t * innerHeight}
                  x2={innerWidth}
                  y2={t * innerHeight}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
            </g>

            {/* Area under the curve */}
            <path
              d={areaData}
              fill="url(#areaGradient)"
              className="area-path"
            />

            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              className="line-path"
            />

            {/* Data points */}
            {data.map((point, index) => (
              <circle
                key={index}
                cx={xScale(index)}
                cy={yScale(point.value)}
                r="3"
                fill="#3B82F6"
                className="data-point"
              />
            ))}

            {/* Y-axis labels */}
            <g className="y-axis">
              {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const value = minValue + padding + (1 - t) * (range + 2 * padding);
                return (
                  <text
                    key={t}
                    x={-15}
                    y={t * innerHeight + 5}
                    textAnchor="end"
                    className="axis-label"
                    fontSize="11"
                    fill="#6B7280"
                    dominantBaseline="middle"
                  >
                    {formatCurrency(value)}
                  </text>
                );
              })}
            </g>

            {/* X-axis labels */}
            <g className="x-axis">
              {data.filter((_, index) => index % Math.ceil(data.length / 5) === 0).map((point, index) => {
                const originalIndex = data.findIndex(d => d === point);
                return (
                  <text
                    key={index}
                    x={xScale(originalIndex)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="axis-label"
                    fontSize="12"
                    fill="#6B7280"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    );
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
        <div className="summary-card secondary">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Portfolio Selection</h3>
            <div className="portfolio-selector">
              <select 
                value={selectedPortfolio} 
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                disabled={portfoliosLoading}
                className="portfolio-dropdown"
              >
                <option value="all">All Portfolios</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.portfolioName}
                  </option>
                ))}
              </select>
            </div>
            <span className="card-change">
              {portfoliosLoading ? 'Loading portfolios...' : `${portfolios.length} portfolios available`}
            </span>
          </div>
        </div>

        <div className="summary-card primary">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Total Portfolio Value</h3>
            <p className="card-value">{formatCurrency(portfolioData.summary.totalValue)}</p>
            <span className="card-change positive">+{formatPercentage(portfolioData.summary.totalPnL, portfolioData.summary.totalCost)}</span>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Total P&L</h3>
            <p className="card-value">{formatCurrency(portfolioData.summary.totalPnL)}</p>
            <span className="card-change positive">+{formatPercentage(portfolioData.summary.totalPnL, portfolioData.summary.totalCost)}</span>
          </div>
        </div>

        <div className="summary-card info">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div className="card-content">
            <h3>Active Positions</h3>
            <p className="card-value">{portfolioData.summary.numberOfPositions}</p>
            <span className="card-change">Across multiple sectors</span>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
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
            <div className="allocation-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="allocation-content">
              <h4>Equity</h4>
              <p className="allocation-value">{formatCurrency(portfolioData.assetAllocation.equity)}</p>
              <span className="allocation-percentage">
                {formatPercentage(portfolioData.assetAllocation.equity, portfolioData.summary.totalValue)}
              </span>
            </div>
          </div>
          <div className="allocation-card cash">
            <div className="allocation-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
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

      {/* Portfolio Value Over Time Chart */}
      <div className="value-chart-section">
        <div className="section-header">
          <h3>Portfolio Value Over Time</h3>
          <div className="time-range-selector">
            <button 
              className={`time-btn ${selectedTimeRange === '1M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('1M')}
            >
              1M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '3M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('3M')}
            >
              3M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '6M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('6M')}
            >
              6M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '1Y' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('1Y')}
            >
              1Y
            </button>
          </div>
        </div>
        <div className="chart-wrapper">
          <PortfolioValueChart data={portfolioData.valueHistory} timeRange={selectedTimeRange} />
        </div>
      </div>

      {/* Sector Distribution Chart */}
      <div className="sector-chart-section">
        <div className="section-header">
          <h3>Sector Distribution</h3>
          <p className="section-subtitle">Portfolio allocation by sector</p>
        </div>
        <div className="chart-container">
          <div className="pie-chart">
            <SectorPieChart data={portfolioData.holdings} />
          </div>
          <div className="chart-legend">
            {getSectorData(portfolioData.holdings).map((sector, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: getSectorColor(index) }}
                ></div>
                <div className="legend-content">
                  <div className="legend-label">{sector.name}</div>
                  <div className="legend-value">
                    {formatCurrency(sector.value)} ({formatPercentage(sector.value, getTotalSectorValue(portfolioData.holdings))})
                  </div>
                </div>
              </div>
            ))}
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
