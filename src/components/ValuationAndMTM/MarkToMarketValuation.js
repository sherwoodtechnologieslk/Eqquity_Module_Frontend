import React, { useState, useEffect, useCallback } from 'react';
import { portfolioAPI, tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import {
  exportMtmPositionDetailsToPdf,
  exportMtmPositionDetailsToExcel,
  computeMtmPortfolioTotals
} from '../../utils/mtmPositionDetailsExport';
import ExportPdfExcelButtons from '../FinancialReporting/ExportPdfExcelButtons';
import './Styles/MarkToMarketValuation.css';

/** Monotone cubic Hermite (Fritsch–Carlson); avoids overshoot on uneven x spacing. */
function linePathMonotoneX(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const n = points.length;
  if (n === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const m = new Array(n);
  m[0] = (ys[1] - ys[0]) / (xs[1] - xs[0] || 1);
  m[n - 1] = (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2] || 1);
  for (let k = 1; k < n - 1; k++) {
    const hl = xs[k] - xs[k - 1];
    const hr = xs[k + 1] - xs[k];
    const dl = (ys[k] - ys[k - 1]) / (hl || 1);
    const dr = (ys[k + 1] - ys[k]) / (hr || 1);
    m[k] = (dl * hr + dr * hl) / (hl + hr || 1);
  }
  for (let k = 0; k < n - 1; k++) {
    const h = xs[k + 1] - xs[k];
    const delta = (ys[k + 1] - ys[k]) / (h || 1);
    if (Math.abs(delta) < 1e-12) {
      m[k] = 0;
      m[k + 1] = 0;
    } else {
      const a = m[k] / delta;
      const b = m[k + 1] / delta;
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[k] = t * a * delta;
        m[k + 1] = t * b * delta;
      }
    }
  }
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let k = 0; k < n - 1; k++) {
    const h = xs[k + 1] - xs[k];
    d += ` C ${xs[k] + h / 3} ${ys[k] + (m[k] * h) / 3} ${xs[k + 1] - h / 3} ${ys[k + 1] - (m[k + 1] * h) / 3} ${xs[k + 1]} ${ys[k + 1]}`;
  }
  return d;
}

function areaPathMonotoneX(points, baselineY) {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length === 1) {
    return `M ${first.x} ${baselineY} L ${first.x} ${first.y} L ${first.x} ${baselineY} Z`;
  }
  const lineD = linePathMonotoneX(points);
  const afterMove = lineD.replace(/^M\s+[\d.-]+\s+[\d.-]+/, '');
  return `M ${first.x} ${baselineY} L ${first.x} ${first.y}${afterMove} L ${last.x} ${baselineY} Z`;
}

function parseTradeDate(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(raw);
  }
  return new Date(raw);
}

function formatAxisPriceLKR(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function selectXTickIndices(len, maxTicks) {
  if (len <= 0) return [];
  if (len === 1) return [0];
  if (len <= maxTicks) return Array.from({ length: len }, (_, i) => i);
  const out = new Set([0, len - 1]);
  const inner = maxTicks - 2;
  for (let j = 1; j <= inner; j++) {
    out.add(Math.round((j * (len - 1)) / (inner + 1)));
  }
  return [...out].sort((a, b) => a - b);
}

// Dynamic Chart Component — Performance Analysis tab
const DynamicChart = ({ data }) => {
  const gradientId = React.useId().replace(/:/g, '');

  const chartData = React.useMemo(() => {
    if (!data.length) {
      return {
        plotPoints: [],
        linePathD: '',
        areaPathD: '',
        minPrice: 0,
        maxPrice: 0,
        yAxisLabels: [],
        xTicks: [],
        chartWidth: 1024,
        chartHeight: 400,
        plotLeft: 0,
        plotRight: 0,
        plotTop: 0,
        plotBottom: 0,
      };
    }

    const margin = { left: 102, right: 28, top: 36, bottom: 72 };
    const chartWidth = 1024;
    const chartHeight = 400;
    const plotLeft = margin.left;
    const plotRight = chartWidth - margin.right;
    const plotTop = margin.top;
    const plotBottom = chartHeight - margin.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const prices = data.map((item) => item.lastTrade);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const xDenom = Math.max(1, data.length - 1);

    const parsedDates = data.map((item) => {
      const d = parseTradeDate(item.trade_date);
      return d && !isNaN(d.getTime()) ? d : null;
    });

    const firstD = parsedDates.find(Boolean);
    const lastD = [...parsedDates].reverse().find(Boolean);
    const spanMultipleYears =
      firstD &&
      lastD &&
      firstD.getFullYear() !== lastD.getFullYear();

    const formatTickDate = (d) => {
      if (!d) return '—';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(spanMultipleYears ? { year: 'numeric' } : {}),
      });
    };

    const plotPoints = data.map((item, index) => ({
      x: plotLeft + (index * plotWidth) / xDenom,
      y: plotTop + ((maxPrice - item.lastTrade) / priceRange) * plotHeight,
    }));

    const linePathD = linePathMonotoneX(plotPoints);
    const areaPathD = areaPathMonotoneX(plotPoints, plotBottom);

    const numY = 6;
    const yAxisLabels = [];
    for (let i = 0; i < numY; i++) {
      const value = maxPrice - (priceRange * i) / (numY - 1);
      const y = plotTop + (plotHeight * i) / (numY - 1);
      yAxisLabels.push({
        y,
        text: formatAxisPriceLKR(value),
      });
    }

    const tickIdx = selectXTickIndices(data.length, 8);
    const xTicks = tickIdx.map((index) => ({
      index,
      x: plotPoints[index].x,
      label: formatTickDate(parsedDates[index]),
    }));

    return {
      plotPoints,
      linePathD,
      areaPathD,
      minPrice,
      maxPrice,
      yAxisLabels,
      xTicks,
      chartWidth,
      chartHeight,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
    };
  }, [data]);

  if (!data.length) {
    return null;
  }

  const {
    plotPoints,
    linePathD,
    areaPathD,
    yAxisLabels,
    xTicks,
    chartWidth,
    chartHeight,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
  } = chartData;

  const showPointDots = data.length <= 28;

  return (
    <svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="mtm-performance-chart-svg"
      role="img"
      aria-label="Price trend chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Plot frame */}
      <rect
        x={plotLeft}
        y={plotTop}
        width={plotRight - plotLeft}
        height={plotBottom - plotTop}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="1"
      />

      {/* Horizontal grid + Y labels */}
      {yAxisLabels.map((label, index) => (
        <g key={`y-${index}`}>
          <line
            x1={plotLeft}
            y1={label.y}
            x2={plotRight}
            y2={label.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={plotLeft - 10}
            y={label.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="500"
            fill="#374151"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {label.text}
          </text>
        </g>
      ))}

      {/* Vertical grid at date ticks */}
      {xTicks.map((t) => (
        <line
          key={`vx-${t.index}`}
          x1={t.x}
          y1={plotTop}
          x2={t.x}
          y2={plotBottom}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
      ))}

      {areaPathD ? <path d={areaPathD} fill={`url(#${gradientId})`} stroke="none" /> : null}

      {linePathD ? (
        <path
          d={linePathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}

      {showPointDots
        ? plotPoints.map((pt, index) => (
            <circle key={index} cx={pt.x} cy={pt.y} r="3.5" fill="#2563eb" stroke="#fff" strokeWidth="1" />
          ))
        : null}

      {/* X-axis date labels */}
      {xTicks.map((t) => (
        <text
          key={`x-${t.index}`}
          x={t.x}
          y={plotBottom + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="500"
          fill="#374151"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {t.label}
        </text>
      ))}

      <text
        x={plotLeft - 10}
        y={plotTop - 14}
        textAnchor="start"
        fontSize="10"
        fontWeight="600"
        fill="#6b7280"
        letterSpacing="0.04em"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        PRICE (LKR)
      </text>
      <text
        x={(plotLeft + plotRight) / 2}
        y={chartHeight - 8}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#6b7280"
        letterSpacing="0.04em"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        DATE
      </text>
    </svg>
  );
};

// Price Analysis tab — same layout/axis treatment as Performance chart
const PriceAnalysisChart = ({ data }) => {
  const fillGradientId = React.useId().replace(/:/g, '');

  const chartPayload = React.useMemo(() => {
    if (!data?.length) return null;

    const margin = { left: 102, right: 36, top: 36, bottom: 72 };
    const chartWidth = 1024;
    const chartHeight = 400;
    const plotLeft = margin.left;
    const plotRight = chartWidth - margin.right;
    const plotTop = margin.top;
    const plotBottom = chartHeight - margin.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const prices = data.map((d) => d.price);
    const averageCost = data[0]?.averageCost ?? 0;
    const maxPrice = Math.max(...prices, averageCost);
    const minPrice = Math.min(...prices, averageCost);
    const range = maxPrice - minPrice;
    const pad = range * 0.1 || (Math.abs(maxPrice) || 1) * 0.01 || 1;
    const yMinV = minPrice - pad;
    const yMaxV = maxPrice + pad;
    const ySpan = yMaxV - yMinV || 1;

    const xDenom = Math.max(1, data.length - 1);

    const valueToY = (value) => plotTop + ((yMaxV - value) / ySpan) * plotHeight;

    const plotPoints = data.map((point, index) => ({
      x: plotLeft + (index / xDenom) * plotWidth,
      y: valueToY(point.price),
    }));

    const pricePath = linePathMonotoneX(plotPoints);
    const areaPath = areaPathMonotoneX(plotPoints, plotBottom);

    const costY = valueToY(averageCost);
    const costLinePath = `M ${plotLeft} ${costY} L ${plotRight} ${costY}`;

    const numY = 6;
    const yAxisLabels = [];
    for (let i = 0; i < numY; i++) {
      const value = yMaxV - (ySpan * i) / (numY - 1);
      const y = plotTop + (plotHeight * i) / (numY - 1);
      yAxisLabels.push({ y, text: formatAxisPriceLKR(value) });
    }

    const parsedDates = data.map((p) => {
      const d = parseTradeDate(p.date);
      return d && !isNaN(d.getTime()) ? d : null;
    });
    const firstD = parsedDates.find(Boolean);
    const lastD = [...parsedDates].reverse().find(Boolean);
    const spanMultipleYears =
      firstD && lastD && firstD.getFullYear() !== lastD.getFullYear();

    const formatTickDate = (d) => {
      if (!d) return '—';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(spanMultipleYears ? { year: 'numeric' } : {}),
      });
    };

    const tickIdx = selectXTickIndices(data.length, 8);
    const xTicks = tickIdx.map((index) => ({
      index,
      x: plotPoints[index].x,
      label: formatTickDate(parsedDates[index]),
    }));

    return {
      chartWidth,
      chartHeight,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      yAxisLabels,
      xTicks,
      pricePath,
      areaPath,
      costLinePath,
      plotPoints,
      showDots: data.length <= 28,
      avgCostLabel: formatAxisPriceLKR(averageCost),
    };
  }, [data]);

  if (!data?.length || !chartPayload) {
    return (
      <div className="price-chart-placeholder">
        <p>No data available for chart</p>
      </div>
    );
  }

  const {
    chartWidth,
    chartHeight,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    yAxisLabels,
    xTicks,
    pricePath,
    areaPath,
    costLinePath,
    plotPoints,
    showDots,
    avgCostLabel,
  } = chartPayload;

  return (
    <div className="price-analysis-chart">
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="price-chart-svg mtm-price-analysis-chart-svg"
        role="img"
        aria-label="Market price versus average cost"
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <rect
          x={plotLeft}
          y={plotTop}
          width={plotRight - plotLeft}
          height={plotBottom - plotTop}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {yAxisLabels.map((label, index) => (
          <g key={`pa-y-${index}`}>
            <line
              x1={plotLeft}
              y1={label.y}
              x2={plotRight}
              y2={label.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={plotLeft - 10}
              y={label.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="500"
              fill="#374151"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {label.text}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <line
            key={`pa-vx-${t.index}`}
            x1={t.x}
            y1={plotTop}
            x2={t.x}
            y2={plotBottom}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {areaPath ? <path d={areaPath} fill={`url(#${fillGradientId})`} stroke="none" /> : null}

        <path
          d={costLinePath}
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        <path
          d={pricePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="price-line"
        />

        {showDots
          ? plotPoints.map((pt, index) => (
              <circle
                key={index}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#2563eb"
                stroke="#fff"
                strokeWidth="1"
                className="price-point"
              />
            ))
          : null}

        {xTicks.map((t) => (
          <text
            key={`pa-x-${t.index}`}
            x={t.x}
            y={plotBottom + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="500"
            fill="#374151"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {t.label}
          </text>
        ))}

        <text
          x={plotLeft - 10}
          y={plotTop - 14}
          textAnchor="start"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.04em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          PRICE (LKR)
        </text>
        <text
          x={(plotLeft + plotRight) / 2}
          y={chartHeight - 8}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.04em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          DATE
        </text>
      </svg>

      <div className="price-chart-legend">
        <div className="legend-item">
          <div className="legend-color price-line-color" />
          <span>Market price (LKR)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cost-line-color" />
          <span>Average cost {avgCostLabel}</span>
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrency4 = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
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

  const totals = computeMtmPortfolioTotals(mtmData);

  // Load price analysis: last 7 calendar days (inclusive), local date
  const loadPriceAnalysisData = useCallback(async (companySymbol) => {
    if (!companySymbol) {
      setPriceAnalysisData([]);
      return;
    }

    setPriceAnalysisLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const toYmd = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const startDate = toYmd(start);
      const endDate = toYmd(end);

      const tradeData = await tradeSummaryAPI.getCompanyData(companySymbol, startDate, endDate);

      const portfolioCompany = mtmData.find(item => item.symbol === companySymbol);
      const averageCost = portfolioCompany
        ? portfolioCompany.costValue / portfolioCompany.quantity
        : 0;

      // One point per calendar day (keep last row if multiple rows share trade_date)
      const byDay = new Map();
      for (const trade of tradeData) {
        const raw = trade.trade_date;
        const key =
          typeof raw === 'string'
            ? raw.slice(0, 10)
            : raw instanceof Date
              ? toYmd(raw)
              : String(raw || '').slice(0, 10);
        if (!key) continue;
        byDay.set(key, trade);
      }

      const chartData = [...byDay.keys()]
        .sort()
        .map((date) => {
          const t = byDay.get(date);
          const price = parseFloat(t.last_trade);
          return {
            date,
            price: Number.isFinite(price) ? price : 0,
            averageCost,
          };
        });

      setPriceAnalysisData(chartData);
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
                    borderRadius: '0', 
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
              <h3>Total Unrealized Capital Gain</h3>
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
                    <DynamicChart data={companyData} />
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
                
                <div className="mtm-performance-grid">
                  {/* Performance Overview Cards */}
                  <div className="mtm-performance-row">
                    <div className="mtm-performance-card best-performer">
                      <div className="mtm-card-header">
                        <div className="mtm-card-icon best-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        <div className="mtm-card-title">Best Performer</div>
                      </div>
                      <div className="mtm-card-content">
                        <div className="mtm-card-value">
                          {(() => {
                            const bestPerformer = mtmData.reduce((best, current) => 
                              current.gainLossPercentage > best.gainLossPercentage ? current : best, 
                              mtmData[0] || { symbol: 'N/A', gainLossPercentage: 0 }
                            );
                            return bestPerformer.symbol;
                          })()}
                        </div>
                        <div className="mtm-card-change positive">
                          {(() => {
                            const bestPerformer = mtmData.reduce((best, current) => 
                              current.gainLossPercentage > best.gainLossPercentage ? current : best, 
                              mtmData[0] || { gainLossPercentage: 0 }
                            );
                            return '+' + formatPercentage(bestPerformer.gainLossPercentage);
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="mtm-performance-card worst-performer">
                      <div className="mtm-card-header">
                        <div className="mtm-card-icon worst-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l-3.09 6.26L2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        <div className="mtm-card-title">Worst Performer</div>
                      </div>
                      <div className="mtm-card-content">
                        <div className="mtm-card-value">
                          {(() => {
                            const worstPerformer = mtmData.reduce((worst, current) => 
                              current.gainLossPercentage < worst.gainLossPercentage ? current : worst, 
                              mtmData[0] || { symbol: 'N/A', gainLossPercentage: 0 }
                            );
                            return worstPerformer.symbol;
                          })()}
                        </div>
                        <div className={`mtm-card-change ${(() => {
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
                            return '+' + formatPercentage(worstPerformer.gainLossPercentage);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="mtm-stats-grid">
                    <div className="mtm-stat-card winners">
                      <div className="mtm-stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div className="mtm-stat-content">
                        <div className="mtm-stat-label">WINNERS</div>
                        <div className="mtm-stat-value">
                          {mtmData.filter(item => item.gainLossPercentage > 0).length}
                        </div>
                      </div>
                    </div>

                    <div className="mtm-stat-card losers">
                      <div className="mtm-stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="mtm-stat-content">
                        <div className="mtm-stat-label">LOSERS</div>
                        <div className="mtm-stat-value">
                          {mtmData.filter(item => item.gainLossPercentage < 0).length}
                        </div>
                      </div>
                    </div>

                    <div className="mtm-stat-card win-rate">
                      <div className="mtm-stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                        </svg>
                      </div>
                      <div className="mtm-stat-content">
                        <div className="mtm-stat-label">WIN RATE</div>
                        <div className="mtm-stat-value">
                          {mtmData.length > 0 ? 
                            ((mtmData.filter(item => item.gainLossPercentage > 0).length / mtmData.length) * 100).toFixed(0) + '%' : 
                            '0%'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="mtm-stat-card avg-position">
                      <div className="mtm-stat-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                      <div className="mtm-stat-content">
                        <div className="mtm-stat-label">AVG POSITION SIZE</div>
                        <div className="mtm-stat-value">
                          {formatCurrency(mtmData.length > 0 ? totals.totalMarket / mtmData.length : 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'price-analysis' && (
              <div className="mtm-price-analysis-content">
                <div className="mtm-price-analysis-toolbar">
                  <h3 className="mtm-price-analysis-toolbar-title">Price Analysis</h3>
                  <p className="mtm-price-analysis-toolbar-desc">
                    Compare your average cost with market price movements (last 7 days).
                  </p>
                  <div className="mtm-price-analysis-toolbar-company">
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
            <div className="mtm-table-header-row">
              <div className="mtm-table-header-text">
                <h2>Position Details</h2>
                <p>Mark-to-market valuation for all positions in the selected portfolio</p>
              </div>
              <div className="mtm-table-header-actions fre-header-actions">
                <ExportPdfExcelButtons
                  exportDisabled={loading || mtmData.length === 0}
                  pdfLabel="Download PDF"
                  excelLabel="Download Excel"
                  onExportPdf={() =>
                    exportMtmPositionDetailsToPdf({
                      mtmData,
                      portfolioName: getSelectedPortfolioName(),
                      totals,
                      lastUpdated
                    })
                  }
                  onExportExcel={() =>
                    exportMtmPositionDetailsToExcel({
                      mtmData,
                      portfolioName: getSelectedPortfolioName(),
                      totals
                    })
                  }
                />
              </div>
            </div>
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
                    <th>Gross Sales</th>
                     <th>Charges on Purchases</th>
                     <th>Charges on Sales</th>
                     <th>Projected Sales Proceeds</th>
                    <th>Cost of Funds</th>
                    <th>Projected Sale Proceeds with COF</th>
                    <th>Unrealized Capital Gain</th>
                    <th>Capital Gain %</th>
                    <th>Unrealized P&L</th>
                    <th>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {mtmData.map((item) => (
                    <tr key={item.id} className="mtm-table-row">
                      <td className="mtm-company-name">{item.companyName}</td>
                      <td className="mtm-symbol">{item.symbol}</td>
                      <td className="mtm-quantity">{item.quantity.toLocaleString()}</td>
                      <td className="mtm-cost-price">{formatCurrency4(item.costPrice)}</td>
                      <td className="mtm-market-price">{formatCurrency(item.marketPrice)}</td>
                      <td className="mtm-cost-value">{formatCurrency(item.costValue)}</td>
                      <td className="mtm-gross-sales">{formatCurrency(item.grossSales)}</td>
                       <td className="mtm-charges">{formatCurrency(item.charges || 0)}</td>
                       <td className="mtm-charges-sales">{formatCurrency(item.chargesOnSales || 0)}</td>
                       <td className="mtm-projected-sales">{formatCurrency(item.projectedSalesProceeds || 0)}</td>
                      <td className="mtm-cost-of-funds">{formatCurrency(item.costOfFunds || 0)}</td>
                      <td className="mtm-projected-sales-with-cof">{formatCurrency(item.projectedSalesWithCOF || 0)}</td>
                      <td className={`mtm-gain-loss ${item.unrealizedGainLoss >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(item.unrealizedGainLoss)}
                      </td>
                      <td className={`mtm-gain-loss-percentage ${item.gainLossPercentage >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercentage(item.gainLossPercentage)}
                      </td>
                      <td className={`mtm-unrealized-pnl ${(item.projectedSalesWithCOF - (item.costValue + item.charges)) >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(item.projectedSalesWithCOF - (item.costValue + item.charges))}
                      </td>
                      <td className="mtm-last-update">
                        {item.lastPriceUpdate ? new Date(item.lastPriceUpdate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="mtm-total-row">
                    <td colSpan="4"><strong>Portfolio Totals</strong></td>
                    <td></td>
                    <td></td>
                     <td className="mtm-total-gross-sales">{formatCurrency(totals.totalGrossSales)}</td>
                     <td></td>
                     <td></td>
                     <td className="mtm-total-projected-sales">{formatCurrency(totals.totalProjectedSales || 0)}</td>
                    <td></td>
                    <td className="mtm-total-projected-sales-with-cof">{formatCurrency(totals.totalProjectedSalesWithCOF || 0)}</td>
                    <td className={`mtm-total-gain-loss ${totals.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(totals.totalGainLoss)}
                    </td>
                    <td></td>
                    <td className={`mtm-total-unrealized-pnl ${(totals.totalProjectedSalesWithCOF - (totals.totalCost + totals.totalCharges)) >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(totals.totalProjectedSalesWithCOF - (totals.totalCost + totals.totalCharges))}
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
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Real-time MTM valuation</p>
        </div>
      </div>
    </div>
  );
};

export default MarkToMarketValuation;
