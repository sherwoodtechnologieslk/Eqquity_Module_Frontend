import React, { useState, useEffect, useCallback } from 'react';
import { transactionEntryAPI, tradeSummaryAPI, portfolioAPI, equityAPI } from '../../services/api';
import './RiskReturnScatterPlot.css';

const RiskReturnScatterPlot = () => {
  const [scatterData, setScatterData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('90D');
  const [colorMode, setColorMode] = useState('sector'); // 'sector' or 'performance'
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [calculationProgress, setCalculationProgress] = useState({ current: 0, total: 0 });
  const [equitySectorMap, setEquitySectorMap] = useState({}); // Map of symbol -> sector

  // Fetch equities to get sector information
  useEffect(() => {
    const fetchEquities = async () => {
      try {
        const equities = await equityAPI.getAllEquities();
        // Create a map of symbol -> sector
        const sectorMap = {};
        equities.forEach(equity => {
          if (equity.symbol && equity.sector) {
            sectorMap[equity.symbol] = equity.sector;
          }
        });
        console.log('🔍 RISK-RETURN - Loaded equity sector map:', sectorMap);
        setEquitySectorMap(sectorMap);
      } catch (error) {
        console.error('Error fetching equities for sector mapping:', error);
        setEquitySectorMap({});
      }
    };
    fetchEquities();
  }, []);

  // Fetch active portfolios
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioAPI.getActivePortfolios();
        console.log('🔍 RISK-RETURN - Loaded portfolios:', data);
        setPortfolios(data);
        if (data.length > 0) {
          // Use id or portfolioId field
          const portfolioId = data[0].id || data[0].portfolioId;
          console.log('🔍 RISK-RETURN - Setting initial portfolio ID:', portfolioId);
          setSelectedPortfolio(portfolioId);
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
        setPortfolios([]);
      }
    };
    fetchPortfolios();
  }, []);

  // Calculate date range based on time range selection
  const getDateRange = (timeRange) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '30D':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '60D':
        startDate.setDate(startDate.getDate() - 60);
        break;
      case '90D':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 90);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Calculate volatility from historical prices
  const calculateVolatility = (prices) => {
    if (!prices || prices.length < 2) return null;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] > 0) {
        const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
        returns.push(dailyReturn);
      }
    }
    
    if (returns.length < 2) return null;
    
    // Calculate mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate variance
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    
    // Calculate standard deviation (volatility)
    const stdDev = Math.sqrt(variance);
    
    // Annualize volatility (assuming 252 trading days per year)
    // For shorter periods, adjust accordingly
    const annualizedVolatility = stdDev * Math.sqrt(252);
    
    return annualizedVolatility * 100; // Convert to percentage
  };

  // Calculate return percentage
  const calculateReturn = (currentPrice, avgPrice) => {
    if (!avgPrice || avgPrice === 0) return null;
    return ((currentPrice - avgPrice) / avgPrice) * 100;
  };

  // Get sector color
  const getSectorColor = (sector, index) => {
    const sectorColors = {
      'Banking': '#3B82F6',
      'Finance': '#10B981',
      'Insurance': '#F59E0B',
      'Manufacturing': '#EF4444',
      'Services': '#8B5CF6',
      'Plantations': '#06B6D4',
      'Hotels & Travels': '#84CC16',
      'Food & Beverages': '#F97316',
      'Telecommunications': '#EC4899',
      'Diversified': '#6B7280',
      'Unknown': '#94A3B8'
    };
    
    return sectorColors[sector] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
  };

  // Get performance color
  const getPerformanceColor = (returnValue) => {
    if (returnValue >= 20) return '#10B981'; // Green - High positive
    if (returnValue >= 10) return '#84CC16'; // Light green - Medium positive
    if (returnValue >= 0) return '#F59E0B'; // Amber - Low positive
    if (returnValue >= -10) return '#F97316'; // Orange - Low negative
    return '#EF4444'; // Red - High negative
  };

  // Fetch and process data
  const loadScatterData = useCallback(async () => {
    if (!selectedPortfolio || selectedPortfolio === 'all') {
      setScatterData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCalculationProgress({ current: 0, total: 0 });

    try {
      console.log('🔍 RISK-RETURN - Fetching positions for portfolio ID:', selectedPortfolio);
      
      // Fetch portfolio positions
      const positions = await transactionEntryAPI.getPortfolioPositions(selectedPortfolio);
      
      console.log('🔍 RISK-RETURN - Received positions:', positions);
      console.log('🔍 RISK-RETURN - Number of positions:', positions?.length);
      
      if (!positions || positions.length === 0) {
        console.log('⚠️ RISK-RETURN - No positions found for portfolio');
        setScatterData([]);
        setIsLoading(false);
        return;
      }

      const { startDate, endDate } = getDateRange(selectedTimeRange);
      const scatterPoints = [];
      let processedCount = 0;

      setCalculationProgress({ current: 0, total: positions.length });

      // Process each holding
      for (const position of positions) {
        try {
          const symbol = position.symbol;
          if (!symbol) continue;

          // Fetch historical price data
          const historicalData = await tradeSummaryAPI.getCompanyData(symbol, startDate, endDate);
          
          console.log(`🔍 RISK-RETURN - ${symbol}: Historical data points:`, historicalData?.length);
          
          if (!historicalData || historicalData.length < 10) {
            // Reduced minimum from 20 to 10 for more flexibility
            console.log(`⚠️ RISK-RETURN - ${symbol}: Insufficient historical data (${historicalData?.length || 0} points, need at least 10)`);
            processedCount++;
            setCalculationProgress({ current: processedCount, total: positions.length });
            continue;
          }

          // Extract and sort prices by date
          const prices = historicalData
            .filter(item => item.last_trade && parseFloat(item.last_trade) > 0)
            .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
            .map(item => parseFloat(item.last_trade));

          console.log(`🔍 RISK-RETURN - ${symbol}: Valid prices after filtering:`, prices.length);

          if (prices.length < 10) {
            // Reduced minimum from 20 to 10
            console.log(`⚠️ RISK-RETURN - ${symbol}: Insufficient valid prices (${prices.length} points, need at least 10)`);
            processedCount++;
            setCalculationProgress({ current: processedCount, total: positions.length });
            continue;
          }

          // Calculate volatility
          const volatility = calculateVolatility(prices);
          if (volatility === null) {
            processedCount++;
            setCalculationProgress({ current: processedCount, total: positions.length });
            continue;
          }

          // Get current price (use last price from historical data or from position)
          const currentPrice = parseFloat(position.currentPrice) || parseFloat(position.lastTrade) || prices[prices.length - 1];
          const avgPrice = parseFloat(position.avgPrice) || parseFloat(position.averagePrice) || (parseFloat(position.costValue) / parseFloat(position.quantity));

          // Calculate return
          const returnValue = calculateReturn(currentPrice, avgPrice);
          if (returnValue === null) {
            processedCount++;
            setCalculationProgress({ current: processedCount, total: positions.length });
            continue;
          }

          // Get sector from equities table using symbol
          const sector = equitySectorMap[symbol] || position.sector || 'Unknown';

          // Create scatter point with return value
          scatterPoints.push({
            symbol: symbol,
            companyName: position.companyName || position.company_name || symbol,
            volatility: volatility,
            return: returnValue,
            sector: sector,
            marketValue: parseFloat(position.marketValue) || parseFloat(position.grossSales) || 0,
            quantity: parseFloat(position.quantity) || 0,
            currentPrice: currentPrice,
            avgPrice: avgPrice
          });

          processedCount++;
          setCalculationProgress({ current: processedCount, total: positions.length });
        } catch (error) {
          console.error(`Error processing ${position.symbol}:`, error);
          processedCount++;
          setCalculationProgress({ current: processedCount, total: positions.length });
          continue;
        }
      }

      console.log('🔍 RISK-RETURN - Final scatter points:', scatterPoints.length);
      setScatterData(scatterPoints);
      
      if (scatterPoints.length === 0) {
        console.warn('⚠️ RISK-RETURN - No scatter points created. All holdings may have been filtered out.');
        setError('No holdings with sufficient historical data found. Try selecting a different time range or ensure trade summary data is uploaded.');
      }
    } catch (error) {
      console.error('❌ RISK-RETURN - Error loading scatter data:', error);
      setError(`Failed to load risk-return data: ${error.message || 'Please try again.'}`);
      setScatterData([]);
    } finally {
      setIsLoading(false);
      setCalculationProgress({ current: 0, total: 0 });
    }
  }, [selectedPortfolio, selectedTimeRange, equitySectorMap]);

  useEffect(() => {
    if (selectedPortfolio) {
      loadScatterData();
    }
  }, [selectedPortfolio, selectedTimeRange, loadScatterData]);

  // Calculate chart dimensions and scales
  const getChartData = () => {
    if (scatterData.length === 0) return null;

    const volatilities = scatterData.map(d => d.volatility);
    const returns = scatterData.map(d => d.return);

    const minVolatility = Math.min(...volatilities);
    const maxVolatility = Math.max(...volatilities);
    const minReturn = Math.min(...returns);
    const maxReturn = Math.max(...returns);

    const volatilityRange = maxVolatility - minVolatility;
    const returnRange = maxReturn - minReturn;

    const padding = {
      volatility: volatilityRange * 0.1,
      return: returnRange * 0.1
    };

    return {
      minVolatility: Math.max(0, minVolatility - padding.volatility),
      maxVolatility: maxVolatility + padding.volatility,
      minReturn: minReturn - padding.return,
      maxReturn: maxReturn + padding.return,
      volatilityRange: maxVolatility - minVolatility + 2 * padding.volatility,
      returnRange: maxReturn - minReturn + 2 * padding.return
    };
  };

  const chartData = getChartData();
  // Make chart responsive - use container width with max constraint
  // Account for sidebar (320px) + padding (80px) + margins
  const availableWidth = typeof window !== 'undefined' ? window.innerWidth - 500 : 600;
  const containerWidth = Math.min(600, Math.max(400, availableWidth)); // Between 400-600px
  const chartWidth = containerWidth;
  const chartHeight = 500;
  const margin = { top: 20, right: 20, bottom: 60, left: 80 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const scaleX = (volatility) => {
    if (!chartData) return 0;
    return ((volatility - chartData.minVolatility) / chartData.volatilityRange) * innerWidth;
  };

  const scaleY = (returnValue) => {
    if (!chartData) return 0;
    return innerHeight - ((returnValue - chartData.minReturn) / chartData.returnRange) * innerHeight;
  };

  const getPointColor = (point, index) => {
    if (colorMode === 'sector') {
      return getSectorColor(point.sector, index);
    } else {
      return getPerformanceColor(point.return);
    }
  };

  const getPointSize = (marketValue) => {
    if (scatterData.length === 0) return 6;
    const maxValue = Math.max(...scatterData.map(d => d.marketValue));
    const minValue = Math.min(...scatterData.map(d => d.marketValue));
    const range = maxValue - minValue;
    if (range === 0) return 6;
    const normalized = (marketValue - minValue) / range;
    return 4 + normalized * 8; // Size between 4 and 12
  };

  return (
    <div className="risk-return-scatter-plot">
      <div className="scatter-plot-header">
        <div className="header-left">
          <h3>Risk-Return Scatter Plot</h3>
          <span className="card-subtitle">Portfolio holdings by risk vs return</span>
        </div>
        <div className="header-controls">
          {portfolios.length > 0 && (
            <select
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              className="portfolio-selector"
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((portfolio) => {
                const portfolioId = portfolio.id || portfolio.portfolioId;
                return (
                  <option key={portfolioId} value={portfolioId}>
                    {portfolio.portfolioName}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>

      <div className="scatter-plot-controls">
        <div className="control-group" role="group" aria-label="Time range">
          <span className="control-group-label">Range</span>
          <div className="time-range-buttons">
            {['30D', '60D', '90D', '1Y'].map((range) => (
              <button
                key={range}
                className={`time-btn ${selectedTimeRange === range ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group" role="group" aria-label="Color by">
          <span className="control-group-label">Color</span>
          <div className="color-mode-buttons">
            <button
              className={`color-btn ${colorMode === 'sector' ? 'active' : ''}`}
              onClick={() => setColorMode('sector')}
            >
              Sector
            </button>
            <button
              className={`color-btn ${colorMode === 'performance' ? 'active' : ''}`}
              onClick={() => setColorMode('performance')}
            >
              Performance
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="scatter-plot-loading">
          <div className="loading-spinner"></div>
          <p>
            {calculationProgress.total > 0
              ? `Calculating volatility for ${calculationProgress.current} of ${calculationProgress.total} holdings...`
              : 'Loading data...'}
          </p>
        </div>
      )}

      {error && (
        <div className="scatter-plot-error">
          <p>{error}</p>
          <button onClick={loadScatterData}>Retry</button>
        </div>
      )}

      {!isLoading && !error && scatterData.length === 0 && (
        <div className="scatter-plot-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <p>No data available for the selected portfolio</p>
          <span>Ensure you have holdings with sufficient historical price data</span>
        </div>
      )}

      {!isLoading && !error && scatterData.length > 0 && chartData && (
        <div className="scatter-plot-container">
          <div className="scatter-plot-svg-wrapper">
            <svg 
              width={chartWidth} 
              height={chartHeight} 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="scatter-plot-svg"
              preserveAspectRatio="xMidYMid meet"
            >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Grid lines */}
              <g className="grid-lines">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <g key={t}>
                    <line
                      x1={0}
                      y1={t * innerHeight}
                      x2={innerWidth}
                      y2={t * innerHeight}
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    <line
                      x1={t * innerWidth}
                      y1={0}
                      x2={t * innerWidth}
                      y2={innerHeight}
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  </g>
                ))}
              </g>

              {/* Zero return line */}
              {chartData.minReturn <= 0 && chartData.maxReturn >= 0 && (
                <line
                  x1={0}
                  y1={scaleY(0)}
                  x2={innerWidth}
                  y2={scaleY(0)}
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              )}

              {/* Data points */}
              {scatterData.map((point, index) => {
                const x = scaleX(point.volatility);
                const y = scaleY(point.return);
                const color = getPointColor(point, index);
                const size = getPointSize(point.marketValue);
                const isHovered = hoveredPoint?.symbol === point.symbol;

                return (
                  <g key={point.symbol}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? size + 2 : size}
                      fill={color}
                      stroke={isHovered ? '#1E40AF' : '#fff'}
                      strokeWidth={isHovered ? 2 : 1}
                      opacity={isHovered ? 1 : 0.8}
                      className="scatter-point"
                      filter={isHovered ? 'url(#glow)' : 'none'}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    />
                    {isHovered && (
                      <text
                        x={x}
                        y={y - size - 8}
                        textAnchor="middle"
                        className="point-label"
                        fontSize="11"
                        fontWeight="600"
                        fill="#1E40AF"
                      >
                        {point.symbol}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Axes */}
              <g className="axes">
                {/* X-axis */}
                <line
                  x1={0}
                  y1={innerHeight}
                  x2={innerWidth}
                  y2={innerHeight}
                  stroke="#374151"
                  strokeWidth="2"
                />
                {/* Y-axis */}
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={innerHeight}
                  stroke="#374151"
                  strokeWidth="2"
                />
              </g>

              {/* X-axis labels */}
              <g className="x-axis-labels">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const value = chartData.minVolatility + t * chartData.volatilityRange;
                  return (
                    <text
                      key={t}
                      x={t * innerWidth}
                      y={innerHeight + 20}
                      textAnchor="middle"
                      className="axis-label"
                      fontSize="11"
                      fill="#6B7280"
                    >
                      {value.toFixed(1)}%
                    </text>
                  );
                })}
              </g>

              {/* Y-axis labels */}
              <g className="y-axis-labels">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const value = chartData.maxReturn - t * chartData.returnRange;
                  return (
                    <text
                      key={t}
                      x={-10}
                      y={t * innerHeight + 5}
                      textAnchor="end"
                      className="axis-label"
                      fontSize="11"
                      fill="#6B7280"
                      dominantBaseline="middle"
                    >
                      {value.toFixed(1)}%
                    </text>
                  );
                })}
              </g>

              {/* Axis titles */}
              <text
                x={innerWidth / 2}
                y={innerHeight + 45}
                textAnchor="middle"
                className="axis-title"
                fontSize="12"
                fontWeight="600"
                fill="#374151"
              >
                Risk (Volatility %)
              </text>
              <text
                x={-innerHeight / 2}
                y={-50}
                textAnchor="middle"
                className="axis-title"
                fontSize="12"
                fontWeight="600"
                fill="#374151"
                transform="rotate(-90)"
              >
                Return (%)
              </text>
            </g>
          </svg>
          </div>

          {/* Tooltip */}
          {hoveredPoint && (
            <div className="scatter-tooltip">
              <div className="tooltip-header">
                <strong>{hoveredPoint.symbol}</strong>
                <span>{hoveredPoint.companyName}</span>
              </div>
              <div className="tooltip-content">
                <div className="tooltip-row">
                  <span>Volatility:</span>
                  <span>{hoveredPoint.volatility.toFixed(2)}%</span>
                </div>
                <div className="tooltip-row">
                  <span>Return:</span>
                  <span className={hoveredPoint.return >= 0 ? 'positive' : 'negative'}>
                    {hoveredPoint.return >= 0 ? '+' : ''}{hoveredPoint.return.toFixed(2)}%
                  </span>
                </div>
                <div className="tooltip-row">
                  <span>Sector:</span>
                  <span>{hoveredPoint.sector}</span>
                </div>
                <div className="tooltip-row">
                  <span>Market Value:</span>
                  <span>LKR {hoveredPoint.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="tooltip-row">
                  <span>Quantity:</span>
                  <span>{hoveredPoint.quantity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="scatter-legend">
            {colorMode === 'sector' ? (
              <div className="legend-content">
                <div className="legend-title">Sectors</div>
                <div className="legend-items">
                  {Array.from(new Set(scatterData.map(d => d.sector))).map((sector, index) => (
                    <div key={sector} className="legend-item">
                      <div
                        className="legend-color"
                        style={{ backgroundColor: getSectorColor(sector, index) }}
                      ></div>
                      <span>{sector}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="legend-content">
                <div className="legend-title">Performance</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
                    <span>High Positive (≥20%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#84CC16' }}></div>
                    <span>Medium Positive (10-20%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
                    <span>Low Positive (0-10%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#F97316' }}></div>
                    <span>Low Negative (-10-0%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
                    <span>High Negative (&lt;-10%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskReturnScatterPlot;
