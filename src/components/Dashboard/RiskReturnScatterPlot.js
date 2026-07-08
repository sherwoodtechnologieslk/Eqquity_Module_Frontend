import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { transactionEntryAPI, portfolioAPI } from '../../services/api';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import './RiskReturnScatterPlot.css';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, ScatterController);

const RiskReturnScatterPlot = ({ syncedPortfolioId }) => {
  const [scatterData, setScatterData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('90D');
  const [colorMode, setColorMode] = useState('sector'); // 'sector' or 'performance'
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
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

  // Chart.js handles responsive sizing; we keep the layout via CSS.

  // point color/size are handled in the Chart.js dataset (scriptable props)

  const chartJsData = useMemo(() => {
    if (!scatterData?.length) return null;
    return {
      datasets: [
        {
          label: 'Holdings',
          data: scatterData.map((p, index) => ({
            x: p.volatility,
            y: p.return,
            symbol: p.symbol,
            companyName: p.companyName,
            sector: p.sector,
            marketValue: p.marketValue,
            quantity: p.quantity,
            __color: colorMode === 'sector' ? getSectorColor(p.sector, index) : getPerformanceColor(p.return),
            __radius: (() => {
              if (scatterData.length === 0) return 6;
              const maxValue = Math.max(...scatterData.map(d => d.marketValue));
              const minValue = Math.min(...scatterData.map(d => d.marketValue));
              const range = maxValue - minValue;
              if (range === 0) return 6;
              const normalized = (p.marketValue - minValue) / range;
              return 4 + normalized * 8;
            })()
          })),
          pointBackgroundColor: (ctx) => ctx?.raw?.__color || '#94a3b8',
          pointBorderColor: 'rgba(15, 23, 42, 0.9)',
          pointBorderWidth: 1,
          pointRadius: (ctx) => Number(ctx?.raw?.__radius) || 6,
          pointHoverRadius: (ctx) => (Number(ctx?.raw?.__radius) || 6) + 2,
          pointHoverBorderColor: '#3b82f6',
          pointHoverBorderWidth: 2
        }
      ]
    };
  }, [scatterData, colorMode]);

  const quadrantPlugin = useMemo(() => {
    return {
      id: 'riskReturnQuadrants',
      beforeDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;
        const x = scales.x;
        const y = scales.y;
        if (!x || !y) return;

        const midX = (x.min + x.max) / 2;
        const midY = (y.min + y.max) / 2;
        const sx = x.getPixelForValue(midX);
        const sy = y.getPixelForValue(midY);

        ctx.save();
        // Quadrant fills — system slate + emerald + blue + red, all very subtle
        ctx.fillStyle = 'rgba(5, 150, 105, 0.05)'; // lower vol, higher return — ideal
        ctx.fillRect(chartArea.left, chartArea.top, sx - chartArea.left, sy - chartArea.top);

        ctx.fillStyle = 'rgba(59, 130, 246, 0.06)'; // higher vol, higher return — hot
        ctx.fillRect(sx, chartArea.top, chartArea.right - sx, sy - chartArea.top);

        ctx.fillStyle = 'rgba(100, 116, 139, 0.05)'; // lower vol, lower return — dull
        ctx.fillRect(chartArea.left, sy, sx - chartArea.left, chartArea.bottom - sy);

        ctx.fillStyle = 'rgba(220, 38, 38, 0.05)'; // higher vol, lower return — risk
        ctx.fillRect(sx, sy, chartArea.right - sx, chartArea.bottom - sy);

        // Mid lines (dashed hairline — slate-900 @ low alpha)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(sx, chartArea.top);
        ctx.lineTo(sx, chartArea.bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(chartArea.left, sy);
        ctx.lineTo(chartArea.right, sy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      },
      afterDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;
        const y = scales.y;
        if (!y) return;
        if (y.min > 0 || y.max < 0) return;

        // Zero-return line — system blue accent
        const y0 = y.getPixelForValue(0);
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.75)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y0);
        ctx.lineTo(chartArea.right, y0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    };
  }, []);

  const chartJsOptions = useMemo(() => {
    const monoFont =
      "'IBM Plex Mono', 'Roboto Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: {
        padding: { top: 4, right: 8, bottom: 4, left: 4 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#1e293b',
          borderColor: '#0f172a',
          borderWidth: 1,
          titleFont: { size: 11, weight: '700', family: monoFont },
          bodyFont: { size: 10, weight: '500', family: monoFont },
          titleMarginBottom: 6,
          padding: 10,
          cornerRadius: 0,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const raw = items?.[0]?.raw;
              const symbol = (raw?.symbol || '').toUpperCase();
              const name = (raw?.companyName || '').toUpperCase();
              return name ? `${symbol}  ·  ${name}` : symbol;
            },
            label: (ctx) => {
              const raw = ctx?.raw || {};
              const vol = Number(raw.x) || 0;
              const ret = Number(raw.y) || 0;
              const mv = Number(raw.marketValue) || 0;
              const qty = Number(raw.quantity) || 0;
              const mvFmt = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(mv);
              const qtyFmt = new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0
              }).format(qty);
              const sector = (raw.sector || 'UNKNOWN').toUpperCase();
              const sign = ret >= 0 ? '+' : '';
              return [
                `VOL    ${vol.toFixed(2)}%`,
                `RTN    ${sign}${ret.toFixed(2)}%`,
                `SEC    ${sector}`,
                `MV     LKR ${mvFmt}`,
                `QTY    ${qtyFmt}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'RISK · VOLATILITY (%)',
            color: '#475569',
            font: { size: 10, weight: '700', family: monoFont },
            padding: { top: 8, bottom: 4 }
          },
          ticks: {
            color: '#1e293b',
            font: { size: 10, family: monoFont },
            callback: (v) => `${Number(v).toFixed(1)}`
          },
          grid: { color: '#e2e8f0', drawTicks: false, drawBorder: false },
          border: { color: '#0f172a' }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'RETURN (%)',
            color: '#475569',
            font: { size: 10, weight: '700', family: monoFont },
            padding: { bottom: 8, top: 4 }
          },
          ticks: {
            color: '#1e293b',
            font: { size: 10, family: monoFont },
            callback: (v) => `${Number(v).toFixed(1)}`
          },
          grid: { color: '#e2e8f0', drawTicks: false, drawBorder: false },
          border: { color: '#0f172a' }
        }
      }
    };
  }, []);

  return (
    <div className="risk-return-scatter-plot">
      <div className="scatter-plot-body">
        <div className="scatter-plot-header">
          <div className="header-left">
            <span className="card-subtitle">Risk-Return Scatter Plot: Portfolio holdings by risk vs return</span>
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
          <div className="scatter-plot-controls__segment" role="group" aria-label="Color by">
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
          <div className="scatter-plot-panel scatter-plot-loading">
            <div className="loading-spinner"></div>
            <p>Loading risk–return data…</p>
          </div>
        )}

        {error && (
          <div className="scatter-plot-panel scatter-plot-error">
            <p>{error}</p>
            <button onClick={loadScatterData}>Retry</button>
          </div>
        )}

        {!isLoading && !error && scatterData.length === 0 && (
          <div className="scatter-plot-panel scatter-plot-empty">
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
          <>
            <div className="scatter-plot-panel scatter-plot-svg-wrapper scatter-plot-chartjs-wrapper">
              {chartJsData && (
                <Scatter
                  data={chartJsData}
                  options={{
                    ...chartJsOptions,
                    scales: {
                      x: {
                        ...chartJsOptions.scales.x,
                        min: chartData.minVolatility,
                        max: chartData.maxVolatility
                      },
                      y: {
                        ...chartJsOptions.scales.y,
                        min: chartData.minReturn,
                        max: chartData.maxReturn
                      }
                    }
                  }}
                  plugins={[quadrantPlugin]}
                />
              )}
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

            <div className="scatter-plot-panel scatter-legend">
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
          </>
        )}
      </div>
    </div>
  );
};

export default RiskReturnScatterPlot;
