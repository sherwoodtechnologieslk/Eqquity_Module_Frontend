import React, { useState, useEffect, useCallback } from 'react';
import { portfolioAPI, tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import './Styles/MarkToMarketValuation.css';

// Dynamic Chart Component
const DynamicChart = ({ data, selectedCompany, companies }) => {
  const calculateChartData = () => {
    if (!data.length) return { points: '', minPrice: 0, maxPrice: 0, dates: [], yAxisLabels: [] };
    
    const prices = data.map(item => item.lastTrade);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
    
    const chartWidth = 700;
    const chartHeight = 200;
    const padding = 40;
    const usableWidth = chartWidth - (padding * 2);
    const usableHeight = chartHeight - (padding * 2);
    
    const points = data.map((item, index) => {
      const x = padding + (index * usableWidth) / (data.length - 1);
      const y = padding + ((maxPrice - item.lastTrade) / priceRange) * usableHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const dates = data.map(item => {
      let date;
      
      // Handle different date formats
      if (typeof item.trade_date === 'string') {
        // Handle YYYY-MM-DD format (MySQL DATE format)
        if (item.trade_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = item.trade_date.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // Try parsing as ISO date
        else if (item.trade_date.includes('T') || item.trade_date.includes('Z')) {
          date = new Date(item.trade_date);
        } 
        // Try parsing as regular date string
        else {
          date = new Date(item.trade_date);
        }
      } else {
        date = new Date(item.trade_date);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', item.trade_date, 'Type:', typeof item.trade_date);
        // Return the raw date string as fallback for debugging
        return item.trade_date || 'No Date';
      }
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    });
    
    // Generate Y-axis labels
    const yAxisLabels = [];
    const numLabels = 5;
    for (let i = 0; i < numLabels; i++) {
      const value = minPrice + (priceRange * i) / (numLabels - 1);
      const y = padding + (usableHeight * i) / (numLabels - 1);
      yAxisLabels.push({ value: value.toFixed(2), y });
    }
    
    return { points, minPrice, maxPrice, dates, chartWidth, chartHeight, yAxisLabels };
  };

  const chartData = calculateChartData();

  return (
    <svg width="100%" height="300" viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight + 100}`}>
      {/* Chart background */}
      <rect width="100%" height="100%" fill="#f8fafc" />
      
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
        </pattern>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Chart area */}
      <g transform="translate(60, 20)">
        {/* Y-axis labels */}
        {chartData.yAxisLabels.map((label, index) => (
          <text key={index} x="-10" y={label.y} textAnchor="end" fontSize="12" fill="#6b7280">
            {label.value}
          </text>
        ))}
        
        {/* X-axis labels */}
        {chartData.dates.map((date, index) => {
          const x = 40 + (index * (chartData.chartWidth - 120)) / (chartData.dates.length - 1);
          return (
            <text key={index} x={x} y="240" textAnchor="middle" fontSize="10" fill="#6b7280">
              {date}
            </text>
          );
        })}
        
        {/* Performance line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          points={chartData.points}
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = 40 + (index * (chartData.chartWidth - 120)) / (data.length - 1);
          const y = 20 + ((chartData.maxPrice - item.lastTrade) / (chartData.maxPrice - chartData.minPrice)) * 180;
          return (
            <circle key={index} cx={x} cy={y} r="4" fill="#3b82f6" />
          );
        })}
        
        {/* Area under curve */}
        <polygon
          fill="url(#gradient)"
          points={`${chartData.points} ${chartData.chartWidth - 40},200 40,200`}
        />
      </g>
    </svg>
  );
};

// Price Analysis Chart Component
const PriceAnalysisChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="price-chart-placeholder">
        <p>No data available for chart</p>
      </div>
    );
  }

  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Get price range
  const prices = data.map(d => d.price);
  const averageCost = data[0]?.averageCost || 0;
  const maxPrice = Math.max(...prices, averageCost);
  const minPrice = Math.min(...prices, averageCost);
  const range = maxPrice - minPrice;
  const padding = range * 0.1;

  const xScale = (index) => (index / (data.length - 1)) * innerWidth;
  const yScale = (value) => innerHeight - ((value - minPrice + padding) / (range + 2 * padding)) * innerHeight;

  // Price line path
  const pricePath = data.map((point, index) => {
    const x = xScale(index);
    const y = yScale(point.price);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Average cost line (horizontal)
  const costY = yScale(averageCost);
  const costLine = `M 0 ${costY} L ${innerWidth} ${costY}`;

  return (
    <div className="price-analysis-chart">
      <svg width={chartWidth} height={chartHeight} className="price-chart-svg">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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

          {/* Price line */}
          <path
            d={pricePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="price-line"
          />

          {/* Average cost line (dashed) */}
          <path
            d={costLine}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="cost-line"
          />

          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={xScale(index)}
              cy={yScale(point.price)}
              r="4"
              fill="#3B82F6"
              className="price-point"
            />
          ))}

          {/* Y-axis labels */}
          <g className="y-axis">
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
              const value = minPrice + padding + (1 - t) * (range + 2 * padding);
              return (
                <text
                  key={t}
                  x={-10}
                  y={t * innerHeight + 5}
                  textAnchor="end"
                  className="axis-label"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {value.toFixed(2)}
                </text>
              );
            })}
          </g>

          {/* X-axis labels */}
          <g className="x-axis">
            {data.map((point, index) => (
              <text
                key={index}
                x={xScale(index)}
                y={innerHeight + 20}
                textAnchor="middle"
                className="axis-label"
                fontSize="12"
                fill="#6B7280"
              >
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            ))}
          </g>
        </g>
      </svg>

      {/* Chart Legend */}
      <div className="price-chart-legend">
        <div className="legend-item">
          <div className="legend-color price-line-color"></div>
          <span>Market Price</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cost-line-color"></div>
          <span>Your Average Cost</span>
        </div>
      </div>
    </div>
  );
};

const MarkToMarketValuation = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [mtmData, setMtmData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [portfoliosError, setPortfoliosError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [companyDataLoading, setCompanyDataLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [selectedAnalysisCompany, setSelectedAnalysisCompany] = useState('');
  const [priceAnalysisData, setPriceAnalysisData] = useState([]);
  const [priceAnalysisLoading, setPriceAnalysisLoading] = useState(false);


  // Mock performance data for line chart - will be used when implementing dynamic chart
  // const mockPerformanceData = [
  //   { date: '2024-01-01', portfolioValue: 100000, marketValue: 100000 },
  //   { date: '2024-01-02', portfolioValue: 101200, marketValue: 101200 },
  //   { date: '2024-01-03', portfolioValue: 99800, marketValue: 99800 },
  //   { date: '2024-01-04', portfolioValue: 102500, marketValue: 102500 },
  //   { date: '2024-01-05', portfolioValue: 101800, marketValue: 101800 },
  //   { date: '2024-01-08', portfolioValue: 103200, marketValue: 103200 },
  //   { date: '2024-01-09', portfolioValue: 100500, marketValue: 100500 },
  //   { date: '2024-01-10', portfolioValue: 104000, marketValue: 104000 },
  //   { date: '2024-01-11', portfolioValue: 102800, marketValue: 102800 },
  //   { date: '2024-01-12', portfolioValue: 105500, marketValue: 105500 },
  //   { date: '2024-01-15', portfolioValue: 106250, marketValue: 106250 }
  // ];

  // Load MTM data function
  const loadMtmData = useCallback(async (portfolioId) => {
    if (!portfolioId) {
      setMtmData([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await transactionEntryAPI.getPortfolioPositions(portfolioId);
      setMtmData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading MTM data:', error);
      setMtmData([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Fetch companies from trade summaries
  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const data = await tradeSummaryAPI.getCompanyList();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0].symbol);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Fetch company data for chart
  const fetchCompanyData = async (symbol, period = '1M') => {
    if (!symbol) return;
    
    try {
      setCompanyDataLoading(true);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1M':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      const data = await tradeSummaryAPI.getCompanyData(
        symbol, 
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );
      
      // Debug: Log the first few items to see the data structure
      console.log('Sample trade summary data:', data.slice(0, 3));
      
      // Sort data by trade_date and extract unique dates with last trade prices
      const sortedData = data
        .sort((a, b) => {
          const dateA = new Date(a.trade_date);
          const dateB = new Date(b.trade_date);
          return dateA - dateB;
        })
        .map(item => ({
          trade_date: item.trade_date,
          lastTrade: parseFloat(item.last_trade) || 0,
          companyName: item.company_name,
          symbol: item.symbol
        }));
      
      console.log('Processed chart data:', sortedData.slice(0, 3));
      
      setCompanyData(sortedData);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setCompanyData([]);
    } finally {
      setCompanyDataLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadMtmData(selectedPortfolio);
    }
  }, [selectedPortfolio, loadMtmData]);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyData(selectedCompany, selectedPeriod);
    }
  }, [selectedCompany, selectedPeriod]);

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


  // Calculate chart statistics
  const calculateChartStats = () => {
    if (!companyData.length) return { currentValue: 0, totalReturn: 0, period: 0 };
    
    const firstPrice = companyData[0].lastTrade;
    const lastPrice = companyData[companyData.length - 1].lastTrade;
    const totalReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    
    return {
      currentValue: lastPrice,
      totalReturn: totalReturn,
      period: companyData.length
    };
  };

  // Helper function to get selected portfolio name
  const getSelectedPortfolioName = () => {
    if (!selectedPortfolio) return '';
    const portfolio = portfolios.find(p => p.id === selectedPortfolio);
    return portfolio ? portfolio.portfolioName : '';
  };

  const totals = calculatePortfolioTotals();

  // Load price analysis data
  const loadPriceAnalysisData = useCallback(async (companySymbol) => {
    if (!companySymbol) {
      setPriceAnalysisData([]);
      return;
    }

    setPriceAnalysisLoading(true);
    try {
      // Fetch trade summary data for the selected company
      const response = await fetch(`http://localhost:8080/api/trade-summary/company/${companySymbol}?limit=5`);
      if (response.ok) {
        const tradeData = await response.json();
        
        // Calculate average cost from current portfolio
        const portfolioCompany = mtmData.find(item => item.symbol === companySymbol);
        const averageCost = portfolioCompany ? 
          (portfolioCompany.costValue / portfolioCompany.quantity) : 0;

        // Format data for chart
        const chartData = tradeData.map(trade => ({
          date: trade.trade_date,
          price: parseFloat(trade.last_trade),
          averageCost: averageCost
        }));

        setPriceAnalysisData(chartData);
      } else {
        setPriceAnalysisData([]);
      }
    } catch (error) {
      console.error('Error loading price analysis data:', error);
      setPriceAnalysisData([]);
    } finally {
      setPriceAnalysisLoading(false);
    }
  }, [mtmData]);

  // Load price analysis data when company is selected
  useEffect(() => {
    if (selectedAnalysisCompany) {
      loadPriceAnalysisData(selectedAnalysisCompany);
    }
  }, [selectedAnalysisCompany, loadPriceAnalysisData]);

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

        {/* Performance Analysis Section */}
        <div className="mtm-performance-section">
          <div className="mtm-performance-header">
            <h2>Performance Analysis</h2>
            <p>Track portfolio performance over time with interactive charts</p>
          </div>

          {/* Tab Navigation */}
          <div className="mtm-tab-navigation">
            <button 
              className={`mtm-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`mtm-tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance Analysis
            </button>
            <button 
              className={`mtm-tab ${activeTab === 'price-analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('price-analysis')}
            >
              Price Analysis
            </button>
            <button 
              className={`mtm-tab ${activeTab === 'tax-summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('tax-summary')}
            >
              Tax Summary
            </button>
          </div>

          {/* Tab Content */}
          <div className="mtm-tab-content">
            {activeTab === 'performance' && (
              <div className="mtm-chart-container">
                <div className="mtm-chart-header">
                  <h3>
                    {selectedCompany ? 
                      `${companies.find(c => c.symbol === selectedCompany)?.company_name || 'Company'} Performance Trend` : 
                      'Portfolio Value Trend'
                    }
                  </h3>
                  <div className="mtm-chart-controls">
                    <div className="mtm-chart-control-group">
                      <label htmlFor="companySelect">Company:</label>
                      <select 
                        id="companySelect"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="mtm-chart-company-select"
                        disabled={companiesLoading}
                      >
                        {companiesLoading ? (
                          <option value="">Loading companies...</option>
                        ) : companies.length === 0 ? (
                          <option value="">No companies found</option>
                        ) : (
                          companies.map((company, index) => (
                            <option key={index} value={company.symbol}>
                              {company.company_name} ({company.symbol})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="mtm-chart-control-group">
                      <label htmlFor="periodSelect">Period:</label>
                      <select 
                        id="periodSelect" 
                        className="mtm-chart-period"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                      >
                        <option value="1M">1 Month</option>
                        <option value="3M">3 Months</option>
                        <option value="6M">6 Months</option>
                        <option value="1Y">1 Year</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mtm-line-chart">
                  {companyDataLoading ? (
                    <div className="mtm-chart-loading">
                      <div className="mtm-loading-spinner"></div>
                      <p>Loading chart data...</p>
                    </div>
                  ) : companyData.length === 0 ? (
                    <div className="mtm-chart-no-data">
                      <p>No data available for the selected company and period</p>
                    </div>
                  ) : (
                    <DynamicChart 
                      data={companyData} 
                      selectedCompany={selectedCompany}
                      companies={companies}
                    />
                  )}
                </div>
                
                {/* Chart legend and stats */}
                <div className="mtm-chart-footer">
                  <div className="mtm-chart-legend">
                    <div className="mtm-legend-item">
                      <div className="mtm-legend-color" style={{backgroundColor: '#3b82f6'}}></div>
                      <span>
                        {selectedCompany ? 
                          `${companies.find(c => c.symbol === selectedCompany)?.company_name || 'Company'} Last Trade Price` : 
                          'Portfolio Value'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="mtm-chart-stats">
                    {(() => {
                      const stats = calculateChartStats();
                      return (
                        <>
                          <div className="mtm-stat-item">
                            <span className="mtm-stat-label">Current Price:</span>
                            <span className="mtm-stat-value">{formatCurrency(stats.currentValue)}</span>
                          </div>
                          <div className="mtm-stat-item">
                            <span className="mtm-stat-label">Total Return:</span>
                            <span className={`mtm-stat-value ${stats.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                              {formatPercentage(stats.totalReturn)}
                            </span>
                          </div>
                          <div className="mtm-stat-item">
                            <span className="mtm-stat-label">Data Points:</span>
                            <span className="mtm-stat-value">{stats.period} days</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'overview' && (
              <div className="mtm-overview-content">
                <div className="mtm-overview-header">
                  <h3>Performance Analysis</h3>
                  <span className="mtm-last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
                
                <div className="mtm-overview-metrics">
                  {/* Top Performer */}
                  <div className="mtm-metric-card primary">
                    <div className="mtm-metric-label">Best Performer</div>
                    <div className="mtm-metric-value">
                      {(() => {
                        const bestPerformer = mtmData.reduce((best, current) => 
                          current.gainLossPercentage > best.gainLossPercentage ? current : best, 
                          mtmData[0] || { symbol: 'N/A', gainLossPercentage: 0 }
                        );
                        return bestPerformer.symbol;
                      })()}
                    </div>
                    <div className="mtm-metric-change">
                      {(() => {
                        const bestPerformer = mtmData.reduce((best, current) => 
                          current.gainLossPercentage > best.gainLossPercentage ? current : best, 
                          mtmData[0] || { gainLossPercentage: 0 }
                        );
                        return (
                          <span className="positive">
                            +{formatPercentage(bestPerformer.gainLossPercentage)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Worst Performer */}
                  <div className="mtm-metric-card">
                    <div className="mtm-metric-label">Worst Performer</div>
                    <div className="mtm-metric-value">
                      {(() => {
                        const worstPerformer = mtmData.reduce((worst, current) => 
                          current.gainLossPercentage < worst.gainLossPercentage ? current : worst, 
                          mtmData[0] || { symbol: 'N/A', gainLossPercentage: 0 }
                        );
                        return worstPerformer.symbol;
                      })()}
                    </div>
                    <div className={`mtm-metric-percentage ${(() => {
                      const worstPerformer = mtmData.reduce((worst, current) => 
                        current.gainLossPercentage < worst.gainLossPercentage ? current : worst, 
                        mtmData[0] || { gainLossPercentage: 0 }
                      );
                      return worstPerformer.gainLossPercentage >= 0 ? 'positive' : 'negative';
                    })()}`}>
                      {(() => {
                        const worstPerformer = mtmData.reduce((worst, current) => 
                          current.gainLossPercentage < worst.gainLossPercentage ? current : worst, 
                          mtmData[0] || { gainLossPercentage: 0 }
                        );
                        return formatPercentage(worstPerformer.gainLossPercentage);
                      })()}
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="mtm-small-cards">
                    <div className="mtm-small-card">
                      <div className="mtm-small-label">Winners</div>
                      <div className="mtm-small-value positive">
                        {mtmData.filter(item => item.gainLossPercentage > 0).length}
                      </div>
                    </div>
                    <div className="mtm-small-card">
                      <div className="mtm-small-label">Losers</div>
                      <div className="mtm-small-value negative">
                        {mtmData.filter(item => item.gainLossPercentage < 0).length}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mtm-quick-stats">
                    <div className="mtm-stat-item">
                      <span className="mtm-stat-label">Win Rate:</span>
                      <span className="mtm-stat-value">
                        {mtmData.length > 0 ? 
                          ((mtmData.filter(item => item.gainLossPercentage > 0).length / mtmData.length) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="mtm-stat-item">
                      <span className="mtm-stat-label">Avg Position Size:</span>
                      <span className="mtm-stat-value">
                        {formatCurrency(mtmData.length > 0 ? totals.totalMarket / mtmData.length : 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'price-analysis' && (
              <div className="mtm-price-analysis-content">
                <div className="mtm-price-analysis-header">
                  <h3>Price Analysis</h3>
                  <p>Compare your average cost with market price movements</p>
                </div>
                
                <div className="mtm-price-analysis-controls">
                  <div className="mtm-control-group">
                    <label htmlFor="analysisCompanySelect">Select Company:</label>
                    <select 
                      id="analysisCompanySelect"
                      value={selectedAnalysisCompany}
                      onChange={(e) => setSelectedAnalysisCompany(e.target.value)}
                      className="mtm-analysis-company-select"
                      disabled={mtmData.length === 0}
                    >
                      <option value="">Select a company...</option>
                      {mtmData.map((item, index) => (
                        <option key={index} value={item.symbol}>
                          {item.companyName} ({item.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mtm-price-chart-container">
                  {!selectedAnalysisCompany ? (
                    <div className="mtm-chart-no-data">
                      <p>Please choose a company</p>
                    </div>
                  ) : priceAnalysisLoading ? (
                    <div className="mtm-chart-loading">
                      <div className="mtm-loading-spinner"></div>
                      <p>Loading price analysis data...</p>
                    </div>
                  ) : priceAnalysisData.length === 0 ? (
                    <div className="mtm-chart-no-data">
                      <p>No data available for the selected company</p>
                    </div>
                  ) : (
                    <div className="mtm-price-chart">
                      <PriceAnalysisChart data={priceAnalysisData} />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'tax-summary' && (
              <div className="mtm-tax-summary-content">
                <h3>Tax Summary</h3>
                <p>This section will contain tax-related calculations and summaries.</p>
              </div>
            )}
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
          ) : mtmData.length === 0 ? (
            <div className="mtm-no-data">
              <div className="mtm-no-data-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3>No Position Data</h3>
              <p>No positions found for the selected portfolio. Make sure you have buy transactions recorded for this portfolio.</p>
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
                      <td className="mtm-last-update">
                        {item.lastPriceUpdate ? new Date(item.lastPriceUpdate).toLocaleDateString() : 'N/A'}
                      </td>
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
