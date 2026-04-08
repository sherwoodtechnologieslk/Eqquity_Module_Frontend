import React, { useState, useEffect, useCallback } from 'react';
import { transactionEntryAPI, portfolioAPI } from '../../services/api';
import './RiskReturnScatterPlot.css';

const RiskReturnScatterPlot = ({ syncedPortfolioId }) => {
  const [scatterData, setScatterData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('90D');
  const [colorMode, setColorMode] = useState('sector'); // 'sector' or 'performance'
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  // Fetch active portfolios (syncedPortfolioId on first paint comes from dashboard hero)
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioAPI.getActivePortfolios();
        console.log('🔍 RISK-RETURN - Loaded portfolios:', data);
        setPortfolios(data);
        if (data.length > 0) {
          const fromParent =
            syncedPortfolioId != null && syncedPortfolioId !== ''
              ? data.find(
                  (p) =>
                    String(p.id) === String(syncedPortfolioId) ||
                    String(p.portfolioId) === String(syncedPortfolioId)
                )
              : null;
          const pick = fromParent || data[0];
          const portfolioId = pick.id || pick.portfolioId;
          console.log('🔍 RISK-RETURN - Setting portfolio ID:', portfolioId);
          setSelectedPortfolio(portfolioId);
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
        setPortfolios([]);
      }
    };
    fetchPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only align to parent on initial mount
  }, []);

  useEffect(() => {
    if (syncedPortfolioId == null || syncedPortfolioId === '') return;
    if (portfolios.length === 0) return;
    const match = portfolios.find(
      (p) =>
        String(p.id) === String(syncedPortfolioId) ||
        String(p.portfolioId) === String(syncedPortfolioId)
    );
    if (match) {
      const pid = match.id || match.portfolioId;
      setSelectedPortfolio((prev) => (prev === pid ? prev : pid));
    }
  }, [syncedPortfolioId, portfolios]);

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

  // Fetch pre-computed scatter points from the backend (single request)
  const loadScatterData = useCallback(async () => {
    if (!selectedPortfolio || selectedPortfolio === 'all') {
      setScatterData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scatterPoints = await transactionEntryAPI.getPortfolioRiskReturnScatter(
        selectedPortfolio,
        selectedTimeRange
      );
      const list = Array.isArray(scatterPoints) ? scatterPoints : [];
      setScatterData(list);
      setError(null);
    } catch (error) {
      console.error('Error loading risk-return scatter:', error);
      setError(`Failed to load risk-return data: ${error.message || 'Please try again.'}`);
      setScatterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPortfolio, selectedTimeRange]);

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

  // Responsive width — wider plot on desktop
  const availableWidth =
    typeof window !== 'undefined' ? window.innerWidth - 420 : 720;
  const containerWidth = Math.min(760, Math.max(440, availableWidth));
  const chartWidth = containerWidth;
  const chartHeight = 560;
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

      <div
        className="scatter-plot-controls scatter-plot-controls--inline"
        role="toolbar"
        aria-label="Chart range and color mode"
      >
        <div className="scatter-plot-controls__segment" role="group" aria-label="Time range">
          <span className="control-group-label control-group-label--inline">Range</span>
          <div className="time-range-buttons">
            {['30D', '60D', '90D', '1Y'].map((range) => (
              <button
                key={range}
                type="button"
                className={`time-btn ${selectedTimeRange === range ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="scatter-plot-controls__divider" aria-hidden="true" />
        <div className="scatter-plot-controls__segment" role="group" aria-label="Color by">
          <span className="control-group-label control-group-label--inline">Color</span>
          <div className="color-mode-buttons">
            <button
              type="button"
              className={`color-btn ${colorMode === 'sector' ? 'active' : ''}`}
              onClick={() => setColorMode('sector')}
            >
              Sector
            </button>
            <button
              type="button"
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
          <p>Loading risk–return data…</p>
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
              {chartData.volatilityRange > 0 && chartData.returnRange > 0 && (
                <g className="quadrant-zones" aria-hidden="true">
                  {(() => {
                    const midVol =
                      (chartData.minVolatility + chartData.maxVolatility) / 2;
                    const midRet =
                      (chartData.minReturn + chartData.maxReturn) / 2;
                    const sx = scaleX(midVol);
                    const sy = scaleY(midRet);
                    return (
                      <>
                        <rect
                          x={0}
                          y={0}
                          width={sx}
                          height={sy}
                          fill="rgba(34, 197, 94, 0.07)"
                        />
                        <rect
                          x={sx}
                          y={0}
                          width={innerWidth - sx}
                          height={sy}
                          fill="rgba(245, 158, 11, 0.08)"
                        />
                        <rect
                          x={0}
                          y={sy}
                          width={sx}
                          height={innerHeight - sy}
                          fill="rgba(100, 116, 139, 0.07)"
                        />
                        <rect
                          x={sx}
                          y={sy}
                          width={innerWidth - sx}
                          height={innerHeight - sy}
                          fill="rgba(239, 68, 68, 0.08)"
                        />
                        <line
                          x1={sx}
                          y1={0}
                          x2={sx}
                          y2={innerHeight}
                          stroke="#94a3b8"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.65"
                        />
                        <line
                          x1={0}
                          y1={sy}
                          x2={innerWidth}
                          y2={sy}
                          stroke="#94a3b8"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.65"
                        />
                      </>
                    );
                  })()}
                </g>
              )}
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
                      opacity={isHovered ? 1 : 0.85}
                      className="scatter-point"
                      filter={isHovered ? 'url(#glow)' : 'none'}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    />
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

          <div className="scatter-quadrant-legend" aria-label="Risk-return zones">
            <span className="scatter-quadrant-legend__item">
              <i className="scatter-quadrant-legend__swatch scatter-quadrant-legend__swatch--ideal" />
              Lower vol · higher return
            </span>
            <span className="scatter-quadrant-legend__item">
              <i className="scatter-quadrant-legend__swatch scatter-quadrant-legend__swatch--hot" />
              Higher vol · higher return
            </span>
            <span className="scatter-quadrant-legend__item">
              <i className="scatter-quadrant-legend__swatch scatter-quadrant-legend__swatch--dull" />
              Lower vol · lower return
            </span>
            <span className="scatter-quadrant-legend__item">
              <i className="scatter-quadrant-legend__swatch scatter-quadrant-legend__swatch--risk" />
              Higher vol · lower return
            </span>
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
