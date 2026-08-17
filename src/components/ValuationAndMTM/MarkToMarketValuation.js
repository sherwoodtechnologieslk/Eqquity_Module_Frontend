import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

/** Local calendar YYYY-MM-DD (matches native date inputs). */
function toLocalYmd(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lastPriceUpdateLocalYmd(item) {
  if (!item?.lastPriceUpdate) return null;
  const d = new Date(item.lastPriceUpdate);
  return toLocalYmd(d);
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

// High-contrast palette (cycled only if sectors > palette size).
// Key change: we assign colors per *unique sector* (no collisions), stable via sorting sector names.
const SECTOR_RR_COLORS = [
  '#1d4ed8', // strong blue
  '#dc2626', // strong red
  '#16a34a', // strong green
  '#f59e0b', // strong amber
  '#7c3aed', // strong purple
  '#06b6d4', // strong cyan
  '#db2777', // strong pink
  '#65a30d', // strong lime
  '#ea580c', // strong orange
  '#0f766e', // strong teal
  '#4f46e5', // indigo
  '#9a3412', // brown
  '#84cc16', // bright lime
  '#be123c', // rose
  '#0ea5e9', // sky
  '#9333ea', // violet
];

/** Scatter: X = annualized volatility %, Y = total return % (equal-weight sector aggregates). */
const SectorRiskReturnChart = ({ points }) => {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const sectorSeries = React.useMemo(() => {
    const list = Array.isArray(points) ? points : [];
    const norm = list
      .map((p) => {
        const sector = String(p?.sector ?? 'Other').trim() || 'Other';
        const riskPct = Number(p?.riskPct);
        const returnPct = Number(p?.returnPct);
        const stockCount = p?.stockCount != null ? Number(p.stockCount) : null;
        return {
          sector,
          riskPct: Number.isFinite(riskPct) ? riskPct : 0,
          returnPct: Number.isFinite(returnPct) ? returnPct : 0,
          stockCount: Number.isFinite(stockCount) ? stockCount : null,
        };
      })
      .sort((a, b) => a.sector.localeCompare(b.sector));

    // Unique per-sector colors in a stable order (sorted by sector)
    return norm.map((row, i) => ({
      ...row,
      color: SECTOR_RR_COLORS[i % SECTOR_RR_COLORS.length],
    }));
  }, [points]);

  const layout = React.useMemo(() => {
    if (!points?.length) return null;
    const margin = { left: 96, right: 28, top: 44, bottom: 88 };
    const W = 920;
    const H = 480;
    const plotLeft = margin.left;
    const plotRight = W - margin.right;
    const plotTop = margin.top;
    const plotBottom = H - margin.bottom;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const risks = points.map((p) => p.riskPct);
    const rets = points.map((p) => p.returnPct);
    let minX = Math.min(0, ...risks);
    let maxX = Math.max(...risks, 0.01);
    let minY = Math.min(0, ...rets);
    let maxY = Math.max(...rets, 0.01);
    const padX = Math.max((maxX - minX) * 0.12, 3);
    const padY = Math.max((maxY - minY) * 0.12, 3);
    minX -= padX;
    maxX += padX;
    minY -= padY;
    maxY += padY;

    const sx = (x) => plotLeft + ((x - minX) / (maxX - minX || 1)) * plotW;
    const sy = (y) => plotBottom - ((y - minY) / (maxY - minY || 1)) * plotH;

    const numTicks = 5;
    const xTicks = [];
    for (let i = 0; i < numTicks; i++) {
      const t = minX + ((maxX - minX) * i) / (numTicks - 1);
      xTicks.push({ x: sx(t), label: `${t.toFixed(1)}%` });
    }
    const yTicks = [];
    for (let i = 0; i < numTicks; i++) {
      const t = minY + ((maxY - minY) * i) / (numTicks - 1);
      yTicks.push({ y: sy(t), label: `${t.toFixed(1)}%` });
    }

    const zeroX = sx(0);
    const zeroY = sy(0);
    const showZeroX = zeroX >= plotLeft && zeroX <= plotRight;
    const showZeroY = zeroY >= plotTop && zeroY <= plotBottom;

    // Stable colors per sector *and* no collisions within the current chart
    const sectorColorMap = new Map(sectorSeries.map((s) => [s.sector, s.color]));
    const nodes = points.map((p) => {
      const sectorName = String(p?.sector ?? 'Other').trim() || 'Other';
      return {
        ...p,
        cx: sx(p.riskPct),
        cy: sy(p.returnPct),
        color: sectorColorMap.get(sectorName) || SECTOR_RR_COLORS[0],
        sector: sectorName,
      };
    });

    return {
      W,
      H,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      xTicks,
      yTicks,
      zeroX,
      zeroY,
      showZeroX,
      showZeroY,
      nodes,
    };
  }, [points, sectorSeries]);

  const moveTooltip = (e, node) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const tw = 240;
    const th = 120;
    let px = e.clientX - r.left + 14;
    let py = e.clientY - r.top + 14;
    if (px + tw > r.width - 8) px = e.clientX - r.left - tw - 14;
    if (py + th > r.height - 8) py = e.clientY - r.top - th - 14;
    px = Math.max(8, px);
    py = Math.max(8, py);
    setHover({
      sector: node.sector,
      returnPct: node.returnPct,
      riskPct: node.riskPct,
      stockCount: node.stockCount,
      px,
      py,
    });
  };

  if (!layout) return null;

  return (
    <div ref={wrapRef} className="mtm-sector-scatter-chart">
      <p className="mtm-sector-scatter-hint">Hover a point for sector details · colors match the legend below.</p>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="mtm-sector-scatter-svg"
        role="img"
        aria-label="Sector risk versus return scatter chart"
      >
        <rect
          x={layout.plotLeft}
          y={layout.plotTop}
          width={layout.plotRight - layout.plotLeft}
          height={layout.plotBottom - layout.plotTop}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {layout.yTicks.map((t, i) => (
          <g key={`gy-${i}`}>
            <line
              x1={layout.plotLeft}
              y1={t.y}
              x2={layout.plotRight}
              y2={t.y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
            <text
              x={layout.plotLeft - 10}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.xTicks.map((t, i) => (
          <g key={`gx-${i}`}>
            <line
              x1={t.x}
              y1={layout.plotTop}
              x2={t.x}
              y2={layout.plotBottom}
              stroke="#f9fafb"
              strokeWidth="1"
            />
            <text
              x={t.x}
              y={layout.plotBottom + 22}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.showZeroY ? (
          <line
            x1={layout.plotLeft}
            y1={layout.zeroY}
            x2={layout.plotRight}
            y2={layout.zeroY}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}
        {layout.showZeroX ? (
          <line
            x1={layout.zeroX}
            y1={layout.plotTop}
            x2={layout.zeroX}
            y2={layout.plotBottom}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}

        {layout.nodes.map((n, idx) => (
          <circle
            key={`${n.sector}-${idx}`}
            cx={n.cx}
            cy={n.cy}
            r="10"
            fill={n.color}
            fillOpacity="0.9"
            stroke="#fff"
            strokeWidth="2"
            className="mtm-sector-scatter-point"
            style={{ cursor: 'pointer' }}
            aria-label={`${n.sector}: total return ${Number(n.returnPct).toFixed(2)} percent, annualized volatility ${Number(n.riskPct).toFixed(2)} percent`}
            onMouseEnter={(e) => moveTooltip(e, n)}
            onMouseMove={(e) => moveTooltip(e, n)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        <text
          transform={`translate(${layout.plotLeft - 56},${(layout.plotTop + layout.plotBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          TOTAL RETURN (%)
        </text>
        <text
          x={(layout.plotLeft + layout.plotRight) / 2}
          y={layout.H - 28}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          ANNUALIZED VOLATILITY (%)
        </text>
      </svg>

      {hover ? (
        <div
          className="mtm-sector-scatter-tooltip"
          style={{ left: hover.px, top: hover.py }}
          role="tooltip"
        >
          <div className="mtm-sector-scatter-tooltip__title">{hover.sector}</div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Total return</span>
            <strong>{typeof hover.returnPct === 'number' ? `${hover.returnPct.toFixed(2)}%` : '—'}</strong>
          </div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Annualized volatility</span>
            <strong>{typeof hover.riskPct === 'number' ? `${hover.riskPct.toFixed(2)}%` : '—'}</strong>
          </div>
          {hover.stockCount != null ? (
            <div className="mtm-sector-scatter-tooltip__meta">{hover.stockCount} symbols in sector</div>
          ) : null}
        </div>
      ) : null}

      <div className="mtm-sector-scatter-legend" aria-label="Sector colors">
        {sectorSeries.map((n) => (
          <span key={`leg-${n.sector}`} className="mtm-sector-scatter-legend__item">
            <i className="mtm-sector-scatter-legend__swatch" style={{ background: n.color }} />
            <span className="mtm-sector-scatter-legend__label">{n.sector}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/** Bar chart (Return %) by sector; bars inherit sector colors. */
const SectorRiskReturnBarChart = ({ points }) => {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const series = React.useMemo(() => {
    const list = Array.isArray(points) ? points : [];
    return list
      .map((p) => {
        const sector = String(p?.sector ?? 'Other').trim() || 'Other';
        const returnPct = Number(p?.returnPct);
        const riskPct = Number(p?.riskPct);
        const stockCount = p?.stockCount != null ? Number(p.stockCount) : null;
        return {
          sector,
          returnPct: Number.isFinite(returnPct) ? returnPct : 0,
          riskPct: Number.isFinite(riskPct) ? riskPct : 0,
          stockCount: Number.isFinite(stockCount) ? stockCount : null,
        };
      })
      .sort((a, b) => a.sector.localeCompare(b.sector))
      .map((row, i) => ({ ...row, color: SECTOR_RR_COLORS[i % SECTOR_RR_COLORS.length] }));
  }, [points]);

  const layout = React.useMemo(() => {
    if (!series.length) return null;
    const margin = { left: 96, right: 28, top: 44, bottom: 118 };
    const W = 920;
    const H = 480;
    const plotLeft = margin.left;
    const plotRight = W - margin.right;
    const plotTop = margin.top;
    const plotBottom = H - margin.bottom;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const vals = series.map((s) => s.returnPct);
    let minY = Math.min(0, ...vals);
    let maxY = Math.max(0.01, ...vals);
    const padY = Math.max((maxY - minY) * 0.12, 3);
    minY -= padY;
    maxY += padY;

    const sy = (y) => plotBottom - ((y - minY) / (maxY - minY || 1)) * plotH;
    const zeroY = sy(0);
    const showZero = zeroY >= plotTop && zeroY <= plotBottom;

    const n = series.length;
    const step = plotW / Math.max(1, n);
    const barW = Math.max(10, Math.min(42, step * 0.58));

    const nodes = series.map((s, i) => {
      const cx = plotLeft + step * (i + 0.5);
      const x = cx - barW / 2;
      const y = sy(s.returnPct);
      const y0 = sy(0);
      const topY = Math.min(y, y0);
      const h = Math.max(2, Math.abs(y - y0));
      return { ...s, x, y: topY, w: barW, h, cx, labelX: cx, baseY: y0 };
    });

    const numTicks = 5;
    const yTicks = [];
    for (let i = 0; i < numTicks; i++) {
      const t = minY + ((maxY - minY) * i) / (numTicks - 1);
      yTicks.push({ y: sy(t), label: `${t.toFixed(1)}%` });
    }

    return { W, H, plotLeft, plotRight, plotTop, plotBottom, yTicks, showZero, zeroY, nodes };
  }, [series]);

  const moveTooltip = (e, node) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const tw = 260;
    const th = 120;
    let px = e.clientX - r.left + 14;
    let py = e.clientY - r.top + 14;
    if (px + tw > r.width - 8) px = e.clientX - r.left - tw - 14;
    if (py + th > r.height - 8) py = e.clientY - r.top - th - 14;
    px = Math.max(8, px);
    py = Math.max(8, py);
    setHover({ ...node, px, py });
  };

  if (!layout) return null;

  return (
    <div ref={wrapRef} className="mtm-sector-alt-chart">
      <p className="mtm-sector-scatter-hint">Bar chart: total return (%) by sector · hover bars for details.</p>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="mtm-sector-scatter-svg"
        role="img"
        aria-label="Sector total return bar chart"
      >
        <rect
          x={layout.plotLeft}
          y={layout.plotTop}
          width={layout.plotRight - layout.plotLeft}
          height={layout.plotBottom - layout.plotTop}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {layout.yTicks.map((t, i) => (
          <g key={`by-${i}`}>
            <line
              x1={layout.plotLeft}
              y1={t.y}
              x2={layout.plotRight}
              y2={t.y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
            <text
              x={layout.plotLeft - 10}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.showZero ? (
          <line
            x1={layout.plotLeft}
            y1={layout.zeroY}
            x2={layout.plotRight}
            y2={layout.zeroY}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}

        {layout.nodes.map((n) => (
          <rect
            key={`bar-${n.sector}`}
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            fill={n.color}
            fillOpacity="0.9"
            stroke="#fff"
            strokeWidth="1.5"
            rx="4"
            style={{ cursor: 'pointer' }}
            aria-label={`${n.sector}: total return ${Number(n.returnPct).toFixed(2)} percent`}
            onMouseEnter={(e) => moveTooltip(e, n)}
            onMouseMove={(e) => moveTooltip(e, n)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* X labels */}
        {layout.nodes.map((n, i) => (
          <text
            key={`bx-${n.sector}-${i}`}
            x={n.labelX}
            y={layout.plotBottom + 28}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {n.sector.length > 16 ? `${n.sector.slice(0, 16)}…` : n.sector}
          </text>
        ))}

        <text
          transform={`translate(${layout.plotLeft - 56},${(layout.plotTop + layout.plotBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          TOTAL RETURN (%)
        </text>
      </svg>

      {hover ? (
        <div className="mtm-sector-scatter-tooltip" style={{ left: hover.px, top: hover.py }} role="tooltip">
          <div className="mtm-sector-scatter-tooltip__title">{hover.sector}</div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Total return</span>
            <strong>{typeof hover.returnPct === 'number' ? `${hover.returnPct.toFixed(2)}%` : '—'}</strong>
          </div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Annualized volatility</span>
            <strong>{typeof hover.riskPct === 'number' ? `${hover.riskPct.toFixed(2)}%` : '—'}</strong>
          </div>
          {hover.stockCount != null ? (
            <div className="mtm-sector-scatter-tooltip__meta">{hover.stockCount} symbols in sector</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

/** Line chart (Return %) across sectors (alphabetical), with sector-colored points. */
const SectorRiskReturnLineChart = ({ points }) => {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const series = React.useMemo(() => {
    const list = Array.isArray(points) ? points : [];
    return list
      .map((p) => {
        const sector = String(p?.sector ?? 'Other').trim() || 'Other';
        const returnPct = Number(p?.returnPct);
        const riskPct = Number(p?.riskPct);
        const stockCount = p?.stockCount != null ? Number(p.stockCount) : null;
        return {
          sector,
          returnPct: Number.isFinite(returnPct) ? returnPct : 0,
          riskPct: Number.isFinite(riskPct) ? riskPct : 0,
          stockCount: Number.isFinite(stockCount) ? stockCount : null,
        };
      })
      .sort((a, b) => a.sector.localeCompare(b.sector))
      .map((row, i) => ({ ...row, color: SECTOR_RR_COLORS[i % SECTOR_RR_COLORS.length] }));
  }, [points]);

  const layout = React.useMemo(() => {
    if (!series.length) return null;
    const margin = { left: 96, right: 28, top: 44, bottom: 118 };
    const W = 920;
    const H = 480;
    const plotLeft = margin.left;
    const plotRight = W - margin.right;
    const plotTop = margin.top;
    const plotBottom = H - margin.bottom;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const vals = series.map((s) => s.returnPct);
    let minY = Math.min(0, ...vals);
    let maxY = Math.max(0.01, ...vals);
    const padY = Math.max((maxY - minY) * 0.12, 3);
    minY -= padY;
    maxY += padY;

    const sy = (y) => plotBottom - ((y - minY) / (maxY - minY || 1)) * plotH;
    const n = series.length;
    const step = plotW / Math.max(1, n - 1);

    const nodes = series.map((s, i) => ({
      ...s,
      cx: plotLeft + step * i,
      cy: sy(s.returnPct),
    }));

    const lineD = nodes
      .map((n, i) => `${i === 0 ? 'M' : 'L'} ${n.cx} ${n.cy}`)
      .join(' ');

    const zeroY = sy(0);
    const showZero = zeroY >= plotTop && zeroY <= plotBottom;

    const numTicks = 5;
    const yTicks = [];
    for (let i = 0; i < numTicks; i++) {
      const t = minY + ((maxY - minY) * i) / (numTicks - 1);
      yTicks.push({ y: sy(t), label: `${t.toFixed(1)}%` });
    }

    return { W, H, plotLeft, plotRight, plotTop, plotBottom, yTicks, showZero, zeroY, nodes, lineD };
  }, [series]);

  const moveTooltip = (e, node) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const tw = 260;
    const th = 120;
    let px = e.clientX - r.left + 14;
    let py = e.clientY - r.top + 14;
    if (px + tw > r.width - 8) px = e.clientX - r.left - tw - 14;
    if (py + th > r.height - 8) py = e.clientY - r.top - th - 14;
    px = Math.max(8, px);
    py = Math.max(8, py);
    setHover({ ...node, px, py });
  };

  if (!layout) return null;

  return (
    <div ref={wrapRef} className="mtm-sector-alt-chart">
      <p className="mtm-sector-scatter-hint">Line chart: total return (%) across sectors (alphabetical).</p>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="mtm-sector-scatter-svg"
        role="img"
        aria-label="Sector total return line chart"
      >
        <rect
          x={layout.plotLeft}
          y={layout.plotTop}
          width={layout.plotRight - layout.plotLeft}
          height={layout.plotBottom - layout.plotTop}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {layout.yTicks.map((t, i) => (
          <g key={`ly-${i}`}>
            <line
              x1={layout.plotLeft}
              y1={t.y}
              x2={layout.plotRight}
              y2={t.y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
            <text
              x={layout.plotLeft - 10}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.showZero ? (
          <line
            x1={layout.plotLeft}
            y1={layout.zeroY}
            x2={layout.plotRight}
            y2={layout.zeroY}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}

        <path d={layout.lineD} fill="none" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {layout.nodes.map((n) => (
          <circle
            key={`pt-${n.sector}`}
            cx={n.cx}
            cy={n.cy}
            r="8"
            fill={n.color}
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            aria-label={`${n.sector}: total return ${Number(n.returnPct).toFixed(2)} percent`}
            onMouseEnter={(e) => moveTooltip(e, n)}
            onMouseMove={(e) => moveTooltip(e, n)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {layout.nodes.map((n, i) => (
          <text
            key={`lx-${n.sector}-${i}`}
            x={n.cx}
            y={layout.plotBottom + 28}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {n.sector.length > 16 ? `${n.sector.slice(0, 16)}…` : n.sector}
          </text>
        ))}

        <text
          transform={`translate(${layout.plotLeft - 56},${(layout.plotTop + layout.plotBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          TOTAL RETURN (%)
        </text>
      </svg>

      {hover ? (
        <div className="mtm-sector-scatter-tooltip" style={{ left: hover.px, top: hover.py }} role="tooltip">
          <div className="mtm-sector-scatter-tooltip__title">{hover.sector}</div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Total return</span>
            <strong>{typeof hover.returnPct === 'number' ? `${hover.returnPct.toFixed(2)}%` : '—'}</strong>
          </div>
          <div className="mtm-sector-scatter-tooltip__row">
            <span>Annualized volatility</span>
            <strong>{typeof hover.riskPct === 'number' ? `${hover.riskPct.toFixed(2)}%` : '—'}</strong>
          </div>
          {hover.stockCount != null ? (
            <div className="mtm-sector-scatter-tooltip__meta">{hover.stockCount} symbols in sector</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

/** Multi-line time series: equal-weight sector index (base 100) over dates. */
const SectorRiskReturnLineTimeChart = ({ payload }) => {
  const wrapRef = useRef(null);
  const [focus, setFocus] = useState(null); // { idx, px, py }
  const [highlightSector, setHighlightSector] = useState(null);

  const prepared = React.useMemo(() => {
    if (!payload?.dates?.length || !payload?.sectors?.length || !payload?.seriesBySector) return null;
    const dates = payload.dates;
    const sectors = [...payload.sectors].sort((a, b) => a.localeCompare(b));

    const sectorColorMap = new Map(
      sectors.map((s, i) => [s, SECTOR_RR_COLORS[i % SECTOR_RR_COLORS.length]])
    );

    let minV = Infinity;
    let maxV = -Infinity;
    sectors.forEach((s) => {
      const arr = payload.seriesBySector[s] || [];
      arr.forEach((v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        minV = Math.min(minV, n);
        maxV = Math.max(maxV, n);
      });
    });
    if (!Number.isFinite(minV) || !Number.isFinite(maxV)) return null;
    const pad = Math.max((maxV - minV) * 0.08, 0.5);
    minV -= pad;
    maxV += pad;

    return { dates, sectors, sectorColorMap, minV, maxV };
  }, [payload]);

  const layout = React.useMemo(() => {
    if (!prepared) return null;
    const margin = { left: 96, right: 28, top: 44, bottom: 88 };
    const W = 920;
    const H = 480;
    const plotLeft = margin.left;
    const plotRight = W - margin.right;
    const plotTop = margin.top;
    const plotBottom = H - margin.bottom;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const n = prepared.dates.length;
    const sx = (i) => plotLeft + (i * plotW) / Math.max(1, n - 1);
    const sy = (v) => plotBottom - ((v - prepared.minV) / (prepared.maxV - prepared.minV || 1)) * plotH;

    const yTicks = [];
    const numTicks = 5;
    for (let i = 0; i < numTicks; i++) {
      const t = prepared.minV + ((prepared.maxV - prepared.minV) * i) / (numTicks - 1);
      yTicks.push({ y: sy(t), label: t.toFixed(1) });
    }

    const formatTickDate = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // x ticks (max 7) — ensure strictly increasing unique indices
    const maxXTicks = 7;
    const rawIdx =
      n <= maxXTicks
        ? Array.from({ length: n }, (_, i) => i)
        : Array.from({ length: maxXTicks }, (_, k) =>
            Math.round((k * (n - 1)) / (maxXTicks - 1))
          );

    const tickIdx = Array.from(new Set([0, ...rawIdx, n - 1]))
      .filter((i) => i >= 0 && i < n)
      .sort((a, b) => a - b);

    const xTicks = tickIdx.map((i) => ({
      i,
      x: sx(i),
      label: formatTickDate(prepared.dates[i])
    }));

    // build paths
    const paths = prepared.sectors.map((sector) => {
      const series = payload.seriesBySector[sector] || [];
      const pts = series.map((v, i) => ({ x: sx(i), y: sy(Number(v)) }));
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return {
        sector,
        color: prepared.sectorColorMap.get(sector),
        d,
        pts,
      };
    });

    return { W, H, plotLeft, plotRight, plotTop, plotBottom, sx, sy, yTicks, xTicks, paths };
  }, [prepared, payload]);

  const onMove = (e) => {
    if (!layout || !prepared) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left;
    const plotX = Math.max(layout.plotLeft, Math.min(layout.plotRight, x));
    const t = (plotX - layout.plotLeft) / (layout.plotRight - layout.plotLeft || 1);
    const idx = Math.round(t * (prepared.dates.length - 1));
    const px = plotX + 14;
    const py = 60;
    setFocus({ idx, px, py, anchorX: plotX });
  };

  if (!layout || !prepared) return null;

  const focusIdx = focus?.idx ?? null;
  const focusDate = focusIdx != null ? prepared.dates[focusIdx] : null;

  return (
    <div ref={wrapRef} className="mtm-sector-alt-chart" onMouseMove={onMove} onMouseLeave={() => setFocus(null)}>
      <p className="mtm-sector-scatter-hint">
        Line (Time): each sector is a separate line (equal-weight index, base 100).
      </p>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="mtm-sector-scatter-svg"
        role="img"
        aria-label="Sector performance time series (multi-line)"
      >
        <rect
          x={layout.plotLeft}
          y={layout.plotTop}
          width={layout.plotRight - layout.plotLeft}
          height={layout.plotBottom - layout.plotTop}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {layout.yTicks.map((t, i) => (
          <g key={`ty-${i}`}>
            <line x1={layout.plotLeft} y1={t.y} x2={layout.plotRight} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
            <text
              x={layout.plotLeft - 10}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.xTicks.map((t, i) => (
          <g key={`tx-${i}`}>
            <line x1={t.x} y1={layout.plotTop} x2={t.x} y2={layout.plotBottom} stroke="#f9fafb" strokeWidth="1" />
            <text
              x={t.x}
              y={layout.plotBottom + 22}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        {layout.paths.map((p) => {
          const active = highlightSector == null || highlightSector === p.sector;
          return (
            <path
              key={`path-${p.sector}`}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={active ? 2.6 : 1.4}
              opacity={active ? 0.95 : 0.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {focus && focusIdx != null ? (
          <line
            x1={focus.anchorX}
            y1={layout.plotTop}
            x2={focus.anchorX}
            y2={layout.plotBottom}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ) : null}

        <text
          transform={`translate(${layout.plotLeft - 56},${(layout.plotTop + layout.plotBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#6b7280"
          letterSpacing="0.06em"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          SECTOR INDEX (BASE 100)
        </text>
      </svg>

      <div className="mtm-sector-scatter-legend" aria-label="Sector colors (click to highlight)">
        {prepared.sectors.map((s) => {
          const color = prepared.sectorColorMap.get(s);
          const isActive = highlightSector === s;
          return (
            <button
              type="button"
              key={`leg2-${s}`}
              className="mtm-sector-legend-btn"
              onClick={() => setHighlightSector((prev) => (prev === s ? null : s))}
              title={isActive ? 'Click to show all sectors' : 'Click to highlight this sector'}
            >
              <i className="mtm-sector-scatter-legend__swatch" style={{ background: color, opacity: isActive || highlightSector == null ? 1 : 0.35 }} />
              <span className="mtm-sector-scatter-legend__label">{s}</span>
            </button>
          );
        })}
      </div>

      {focusIdx != null && focusDate ? (
        <div className="mtm-sector-scatter-tooltip" style={{ left: focus.px, top: focus.py }} role="tooltip">
          <div className="mtm-sector-scatter-tooltip__title">{focusDate}</div>
          {(() => {
            const list = prepared.sectors
              .map((s) => ({ sector: s, v: Number(payload.seriesBySector[s]?.[focusIdx]) }))
              .filter((x) => Number.isFinite(x.v))
              .sort((a, b) => b.v - a.v);
            const top = highlightSector
              ? list.filter((x) => x.sector === highlightSector)
              : list.slice(0, 6);
            return top.map((row) => (
              <div key={`tt-${row.sector}`} className="mtm-sector-scatter-tooltip__row">
                <span>{row.sector}</span>
                <strong>{row.v.toFixed(2)}</strong>
              </div>
            ));
          })()}
          <div className="mtm-sector-scatter-tooltip__meta">
            Showing {highlightSector ? 'selected sector' : 'top 6 sectors'} at this date
          </div>
        </div>
      ) : null}
    </div>
  );
};

function sectorRiskDateRange(period) {
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
      startDate.setMonth(startDate.getMonth() - 3);
  }
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

const EMPTY_MTM_POSITION = { symbol: 'N/A', companyName: '', gainLossPercentage: 0 };

function getCompanyInitials(item) {
  const companyName = String(item?.companyName || '').trim();
  if (companyName) {
    const words = companyName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
    }
    return companyName.slice(0, 2).toUpperCase();
  }
  const symbol = String(item?.symbol || '').trim();
  if (!symbol || symbol === 'N/A') return '?';
  const base = symbol.split('.')[0] || symbol;
  return base.slice(0, 2).toUpperCase();
}

function formatMtmTrendPercentage(percentage) {
  const arrow = percentage >= 0 ? '↑' : '↓';
  const sign = percentage >= 0 ? '+' : '';
  return `${arrow} ${sign}${percentage.toFixed(2)}%`;
}

function formatLkrAmountParts(amount) {
  return {
    code: 'LKR',
    amount: new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount),
  };
}

function formatCompactLkr(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `LKR ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `LKR ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `LKR ${(amount / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatLkrFull(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount);
}

const MarkToMarketValuation = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [mtmData, setMtmData] = useState([]);
  const [mtmLastUpdateFrom, setMtmLastUpdateFrom] = useState('');
  const [mtmLastUpdateTo, setMtmLastUpdateTo] = useState('');
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
  const [sectorRiskReturnData, setSectorRiskReturnData] = useState(null);
  const [sectorRiskReturnLoading, setSectorRiskReturnLoading] = useState(false);
  const [sectorRiskReturnError, setSectorRiskReturnError] = useState('');
  const [sectorRiskReturnPeriod, setSectorRiskReturnPeriod] = useState('3M');
  const [sectorRiskReturnChartType, setSectorRiskReturnChartType] = useState('scatter'); // scatter | bar | line
  const [sectorRiskReturnTimeseries, setSectorRiskReturnTimeseries] = useState(null);
  const [sectorRiskReturnTimeseriesLoading, setSectorRiskReturnTimeseriesLoading] = useState(false);
  const [sectorRiskReturnTimeseriesError, setSectorRiskReturnTimeseriesError] = useState('');

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
    setMtmLastUpdateFrom('');
    setMtmLastUpdateTo('');
  }, [selectedPortfolio]);

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

  const filteredMtmData = useMemo(() => {
    if (!mtmData.length) return [];
    const from = mtmLastUpdateFrom.trim();
    const to = mtmLastUpdateTo.trim();
    if (!from && !to) return mtmData;

    let effFrom = from;
    let effTo = to;
    if (from && to && from > to) {
      effFrom = to;
      effTo = from;
    }

    const todayYmd = toLocalYmd(new Date());

    return mtmData.filter((item) => {
      const ymd = lastPriceUpdateLocalYmd(item);
      if (!ymd) return false;
      if (effFrom && ymd < effFrom) return false;
      if (effTo) {
        if (ymd > effTo) return false;
      } else if (effFrom && todayYmd && ymd > todayYmd) {
        return false;
      }
      return true;
    });
  }, [mtmData, mtmLastUpdateFrom, mtmLastUpdateTo]);

  const totals = useMemo(() => computeMtmPortfolioTotals(filteredMtmData), [filteredMtmData]);

  const overviewMetrics = useMemo(() => {
    if (!filteredMtmData.length) {
      return {
        bestPerformer: EMPTY_MTM_POSITION,
        worstPerformer: EMPTY_MTM_POSITION,
        winners: 0,
        losers: 0,
        winRate: 0,
        avgPositionSize: 0,
      };
    }

    const bestPerformer = filteredMtmData.reduce((best, current) =>
      current.gainLossPercentage > best.gainLossPercentage ? current : best
    );
    const worstPerformer = filteredMtmData.reduce((worst, current) =>
      current.gainLossPercentage < worst.gainLossPercentage ? current : worst
    );
    const winners = filteredMtmData.filter((item) => item.gainLossPercentage > 0).length;

    return {
      bestPerformer,
      worstPerformer,
      winners,
      losers: filteredMtmData.filter((item) => item.gainLossPercentage < 0).length,
      winRate: (winners / filteredMtmData.length) * 100,
      avgPositionSize: totals.totalMarket / filteredMtmData.length,
    };
  }, [filteredMtmData, totals.totalMarket]);

  const focusCompanyInsights = useCallback((symbol) => {
    if (!symbol || symbol === 'N/A') return;
    setSelectedAnalysisCompany(symbol);
    setSelectedCompany(symbol);
    setActiveTab('price-analysis');
    requestAnimationFrame(() => {
      document.querySelector('.mtm-tab-content')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const avgPositionParts = formatLkrAmountParts(overviewMetrics.avgPositionSize);
  const avgPositionCompact = formatCompactLkr(overviewMetrics.avgPositionSize);
  const avgPositionFull = formatLkrFull(overviewMetrics.avgPositionSize);

  const hasLastUpdateDateFilter = Boolean(mtmLastUpdateFrom.trim() || mtmLastUpdateTo.trim());

  const mtmDateRangeWasReversed = Boolean(
    mtmLastUpdateFrom.trim() &&
      mtmLastUpdateTo.trim() &&
      mtmLastUpdateFrom.trim() > mtmLastUpdateTo.trim()
  );

  // Load price analysis: last 7 available trading days (based on trade_date)
  const loadPriceAnalysisData = useCallback(async (companySymbol) => {
    if (!companySymbol) {
      setPriceAnalysisData([]);
      return;
    }

    setPriceAnalysisLoading(true);
    try {
      // Fetch a wider window so we can always show the last 7 available dates,
      // even if there are gaps (weekends/holidays/missing data).
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 45);
      const toYmd = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const normalizeTradeDateKey = (raw) => {
        if (!raw) return '';
        if (raw instanceof Date) return toYmd(raw);
        const s = String(raw).trim();
        if (!s) return '';

        // ISO-like: "YYYY-MM-DD..." → take date portion
        const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

        // Common "DD/MM/YYYY" or "DD-MM-YYYY"
        const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (dmy) {
          const dd = String(dmy[1]).padStart(2, '0');
          const mm = String(dmy[2]).padStart(2, '0');
          const yyyy = dmy[3];
          return `${yyyy}-${mm}-${dd}`;
        }

        // Fallback: try Date parsing
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return toYmd(d);
        return s.slice(0, 10);
      };
      const startDate = toYmd(start);
      const endDate = toYmd(end);

      const tradeData = await tradeSummaryAPI.getCompanyData(companySymbol, startDate, endDate);

      const portfolioCompany = mtmData.find(item => item.symbol === companySymbol);
      const averageCost = portfolioCompany
        ? portfolioCompany.costValue / portfolioCompany.quantity
        : 0;

      // One point per trading day (keep last row if multiple rows share the same day)
      const byDay = new Map();
      for (const trade of tradeData) {
        const key = normalizeTradeDateKey(trade.trade_date);
        if (!key) continue;
        byDay.set(key, trade);
      }

      const allDatesAsc = [...byDay.keys()].sort((a, b) => {
        // keys are normalized to YYYY-MM-DD
        return a.localeCompare(b);
      });
      const last7DatesAsc = allDatesAsc.slice(Math.max(0, allDatesAsc.length - 7));

      const chartData = last7DatesAsc
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

  useEffect(() => {
    if (activeTab !== 'sector-risk-return') return undefined;
    let cancelled = false;
    (async () => {
      setSectorRiskReturnLoading(true);
      setSectorRiskReturnError('');
      try {
        const { start, end } = sectorRiskDateRange(sectorRiskReturnPeriod);
        const data = await tradeSummaryAPI.getSectorRiskReturn(start, end);
        if (!cancelled) setSectorRiskReturnData(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSectorRiskReturnData(null);
          setSectorRiskReturnError(
            e?.message || 'Could not load sector risk–return data.'
          );
        }
      } finally {
        if (!cancelled) setSectorRiskReturnLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, sectorRiskReturnPeriod]);

  useEffect(() => {
    if (activeTab !== 'sector-risk-return') return undefined;
    if (sectorRiskReturnChartType !== 'line') return undefined; // line = multi-line time series
    let cancelled = false;
    (async () => {
      setSectorRiskReturnTimeseriesLoading(true);
      setSectorRiskReturnTimeseriesError('');
      try {
        const { start, end } = sectorRiskDateRange(sectorRiskReturnPeriod);
        const data = await tradeSummaryAPI.getSectorRiskReturnTimeseries(start, end);
        if (!cancelled) setSectorRiskReturnTimeseries(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSectorRiskReturnTimeseries(null);
          setSectorRiskReturnTimeseriesError(e?.message || 'Could not load sector time-series.');
        }
      } finally {
        if (!cancelled) setSectorRiskReturnTimeseriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, sectorRiskReturnPeriod, sectorRiskReturnChartType]);

  return (
    <div className="mtm-page">
      <div className="mtm-content-wrapper">
        <header className="mtm-header-section">
          <div className="mtm-header-text-group">
            <p className="mtm-eyebrow">Valuation · MTM</p>
            <h1 className="mtm-main-title">Mark-to-Market Valuation</h1>
            <p className="mtm-subtitle">
              {portfoliosLoading ? 'Loading portfolios…' :
               selectedPortfolio ? `Real-time valuation for ${getSelectedPortfolioName()}` :
               portfolios.length > 0 ? `Select a portfolio to value holdings (${portfolios.length} available)` :
               'Real-time portfolio valuation and performance tracking'}
            </p>
          </div>
        </header>

        {/* Portfolio controls + valuation summary in one panel */}
        <div className="mtm-toolbar-summary-panel">
          <div className="mtm-toolbar-top">
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

            <div
              className={`mtm-date-filter-section${mtmDateRangeWasReversed ? ' mtm-date-filter-reversed' : ''}`}
              aria-label="Filter positions by last price update date"
            >
              <div className="mtm-date-filter-heading-row">
                <div className="mtm-date-filter-heading-left">
                  <span className="mtm-date-filter-title">Last price update</span>
                  {mtmDateRangeWasReversed ? (
                    <span className="mtm-date-filter-note" role="status">
                      From/To were reversed for filtering
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mtm-btn mtm-btn-secondary mtm-date-filter-clear"
                  onClick={() => {
                    setMtmLastUpdateFrom('');
                    setMtmLastUpdateTo('');
                  }}
                  disabled={!hasLastUpdateDateFilter || !selectedPortfolio}
                >
                  Clear dates
                </button>
              </div>

              <div className="mtm-date-filter-controls" role="group" aria-label="Last price update date range">
                <div className="mtm-date-filter-range">
                  <div className="mtm-date-filter-field">
                    <label htmlFor="mtmLastUpdateFrom">From</label>
                    <input
                      id="mtmLastUpdateFrom"
                      type="date"
                      className="mtm-date-input"
                      value={mtmLastUpdateFrom}
                      onChange={(e) => setMtmLastUpdateFrom(e.target.value)}
                      disabled={!selectedPortfolio || loading || portfoliosLoading}
                    />
                  </div>

                  <span className="mtm-date-filter-sep" aria-hidden="true">
                    →
                  </span>

                  <div className="mtm-date-filter-field">
                    <label htmlFor="mtmLastUpdateTo">To</label>
                    <input
                      id="mtmLastUpdateTo"
                      type="date"
                      className="mtm-date-input"
                      value={mtmLastUpdateTo}
                      onChange={(e) => setMtmLastUpdateTo(e.target.value)}
                      disabled={!selectedPortfolio || loading || portfoliosLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="mtm-date-filter-hint" aria-label="How the date filter works">
                <div className="mtm-date-filter-hint-item">
                  <strong>From</strong> only: last update from that date through today.
                </div>
                <div className="mtm-date-filter-hint-item">
                  <strong>To</strong> only: last update on or before that date (no start date).
                </div>
                <div className="mtm-date-filter-hint-item">
                  <strong>Both</strong>: inclusive between the dates. Leave both blank for all positions.
                </div>
              </div>
            </div>
          </div>

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
        </div>

        {/* Performance Analysis Section */}
        <div className="mtm-performance-section">
          <div className="mtm-performance-header">
            <p className="mtm-eyebrow">Charts &amp; snapshot</p>
            <h2>Performance Analysis</h2>
            <p>Track holdings over time with charts, sector risk, and tax summary</p>
          </div>

          <div className="mtm-tab-navigation" role="tablist" aria-label="Performance views">
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
              className={`mtm-tab ${activeTab === 'sector-risk-return' ? 'active' : ''}`}
              onClick={() => setActiveTab('sector-risk-return')}
            >
              Sector Risk–Return
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
                  <div className="mtm-overview-header-text">
                    <h3>Performance snapshot</h3>
                    <p className="mtm-overview-header-desc">
                      Leaders, laggards, and breadth across open positions
                    </p>
                  </div>
                  <span className="mtm-last-updated">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>

                <div className="mtm-performance-grid">
                  <div className="mtm-performance-row">
                    <button
                      type="button"
                      className="mtm-performer-card mtm-performer-card--best"
                      onClick={() => focusCompanyInsights(overviewMetrics.bestPerformer.symbol)}
                      disabled={!filteredMtmData.length || overviewMetrics.bestPerformer.symbol === 'N/A'}
                      aria-label={`View price analysis for best performer ${overviewMetrics.bestPerformer.symbol}`}
                    >
                      <span className="mtm-performer-card__label">Best performer</span>
                      <div className="mtm-performer-card__main">
                        <div className="mtm-performer-card__identity">
                          <div className="mtm-company-avatar mtm-company-avatar--best" aria-hidden="true">
                            {getCompanyInitials(overviewMetrics.bestPerformer)}
                          </div>
                          <div className="mtm-performer-card__names">
                            <span className="mtm-performer-card__symbol">
                              {overviewMetrics.bestPerformer.symbol}
                            </span>
                            {overviewMetrics.bestPerformer.companyName ? (
                              <span className="mtm-performer-card__company">
                                {overviewMetrics.bestPerformer.companyName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="mtm-performer-card__hero mtm-performer-card__hero--positive">
                          {formatMtmTrendPercentage(overviewMetrics.bestPerformer.gainLossPercentage)}
                        </div>
                      </div>
                      <span className="mtm-performer-card__caption">Highest unrealized return · Open price analysis</span>
                    </button>

                    <button
                      type="button"
                      className="mtm-performer-card mtm-performer-card--worst"
                      onClick={() => focusCompanyInsights(overviewMetrics.worstPerformer.symbol)}
                      disabled={!filteredMtmData.length || overviewMetrics.worstPerformer.symbol === 'N/A'}
                      aria-label={`View price analysis for worst performer ${overviewMetrics.worstPerformer.symbol}`}
                    >
                      <span className="mtm-performer-card__label">Worst performer</span>
                      <div className="mtm-performer-card__main">
                        <div className="mtm-performer-card__identity">
                          <div className="mtm-company-avatar mtm-company-avatar--worst" aria-hidden="true">
                            {getCompanyInitials(overviewMetrics.worstPerformer)}
                          </div>
                          <div className="mtm-performer-card__names">
                            <span className="mtm-performer-card__symbol">
                              {overviewMetrics.worstPerformer.symbol}
                            </span>
                            {overviewMetrics.worstPerformer.companyName ? (
                              <span className="mtm-performer-card__company">
                                {overviewMetrics.worstPerformer.companyName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className={`mtm-performer-card__hero ${
                            overviewMetrics.worstPerformer.gainLossPercentage >= 0
                              ? 'mtm-performer-card__hero--positive'
                              : 'mtm-performer-card__hero--negative'
                          }`}
                        >
                          {formatMtmTrendPercentage(overviewMetrics.worstPerformer.gainLossPercentage)}
                        </div>
                      </div>
                      <span className="mtm-performer-card__caption">Largest unrealized decline · Open price analysis</span>
                    </button>
                  </div>

                  <div className="mtm-kpi-grid" role="list">
                    <div className="mtm-kpi-card mtm-kpi-card--winners" role="listitem">
                      <div className="mtm-kpi-card__label">Winners</div>
                      <div className="mtm-kpi-card__value">{overviewMetrics.winners}</div>
                    </div>

                    <div className="mtm-kpi-card mtm-kpi-card--losers" role="listitem">
                      <div className="mtm-kpi-card__label">Losers</div>
                      <div className="mtm-kpi-card__value">{overviewMetrics.losers}</div>
                    </div>

                    <div className="mtm-kpi-card mtm-kpi-card--win-rate" role="listitem">
                      <div className="mtm-kpi-card__label">Win rate</div>
                      <div className="mtm-kpi-card__value">{overviewMetrics.winRate.toFixed(0)}%</div>
                    </div>

                    <div
                      className="mtm-kpi-card mtm-kpi-card--avg-position"
                      role="listitem"
                      title={avgPositionFull}
                    >
                      <div className="mtm-kpi-card__label">Avg. position</div>
                      <div className="mtm-kpi-card__value mtm-kpi-card__value--currency">
                        <span className="mtm-kpi-card__value-compact">{avgPositionCompact}</span>
                        <span className="mtm-kpi-card__value-split" aria-label={avgPositionFull}>
                          <span className="mtm-kpi-card__currency-code">{avgPositionParts.code}</span>
                          <span className="mtm-kpi-card__currency-amount">{avgPositionParts.amount}</span>
                        </span>
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
                    Compare your average cost with market price movements (last 7 available trading days).
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

            {activeTab === 'sector-risk-return' && (
              <div className="mtm-sector-risk-return-content">
                <div className="mtm-sector-risk-return-toolbar">
                  <div className="mtm-sector-risk-return-intro">
                    <h3 className="mtm-sector-risk-return-title">Sector Risk–Return</h3>
                    <p className="mtm-sector-risk-return-desc">
                      Each point is an <strong>equal-weight</strong> sector aggregate from{' '}
                      <strong>trade summary</strong> prices: Y = total return over the period, X =
                      annualized volatility of daily returns. Symbols without sector map to{' '}
                      <strong>Other</strong>.
                    </p>
                  </div>
                  <div className="mtm-sector-risk-return-controls">
                    <label htmlFor="sectorRiskPeriodSelect">Period:</label>
                    <select
                      id="sectorRiskPeriodSelect"
                      className="mtm-sector-risk-period-select"
                      value={sectorRiskReturnPeriod}
                      onChange={(e) => setSectorRiskReturnPeriod(e.target.value)}
                      disabled={sectorRiskReturnLoading}
                    >
                      <option value="1M">1 Month</option>
                      <option value="3M">3 Months</option>
                      <option value="6M">6 Months</option>
                      <option value="1Y">1 Year</option>
                    </select>

                    <div className="mtm-sector-chart-type" role="group" aria-label="Chart type">
                      <button
                        type="button"
                        className={`mtm-sector-chart-type-btn ${sectorRiskReturnChartType === 'scatter' ? 'active' : ''}`}
                        onClick={() => setSectorRiskReturnChartType('scatter')}
                      >
                        Scatter
                      </button>
                      <button
                        type="button"
                        className={`mtm-sector-chart-type-btn ${sectorRiskReturnChartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setSectorRiskReturnChartType('bar')}
                      >
                        Bar
                      </button>
                      <button
                        type="button"
                        className={`mtm-sector-chart-type-btn ${sectorRiskReturnChartType === 'line' ? 'active' : ''}`}
                        onClick={() => setSectorRiskReturnChartType('line')}
                      >
                        Line (Time)
                      </button>
                    </div>
                  </div>
                </div>

                {sectorRiskReturnError ? (
                  <div className="mtm-sector-risk-return-error" role="alert">
                    {sectorRiskReturnError}
                  </div>
                ) : null}

                {sectorRiskReturnLoading ? (
                  <div className="mtm-chart-loading mtm-sector-risk-return-chart-wrap">
                    <div className="mtm-loading-spinner" />
                    <p>Building sector risk–return from market data…</p>
                  </div>
                ) : !sectorRiskReturnData?.sectors?.length ? (
                  <div className="mtm-chart-no-data mtm-sector-risk-return-chart-wrap">
                    <p>
                      Not enough trade-summary history to plot sectors. Upload more daily summaries
                      or pick a longer period.
                    </p>
                  </div>
                ) : sectorRiskReturnChartType === 'line' ? (
                  <div className="mtm-sector-risk-return-chart-wrap">
                    {sectorRiskReturnTimeseriesError ? (
                      <div className="mtm-sector-risk-return-error" role="alert">
                        {sectorRiskReturnTimeseriesError}
                      </div>
                    ) : sectorRiskReturnTimeseriesLoading ? (
                      <div className="mtm-chart-loading mtm-sector-risk-return-chart-wrap">
                        <div className="mtm-loading-spinner" />
                        <p>Loading sector time-series…</p>
                      </div>
                    ) : !sectorRiskReturnTimeseries?.dates?.length ? (
                      <div className="mtm-chart-no-data mtm-sector-risk-return-chart-wrap">
                        <p>Not enough history to plot multi-line sector series. Try a longer period.</p>
                      </div>
                    ) : (
                      <SectorRiskReturnLineTimeChart payload={sectorRiskReturnTimeseries} />
                    )}
                    <p className="mtm-sector-risk-return-meta">
                      {sectorRiskReturnData.startDate} → {sectorRiskReturnData.endDate} ·{' '}
                      {sectorRiskReturnData.symbolsWithMetrics ?? 0} symbols with valid return &amp;
                      volatility · {sectorRiskReturnData.sectors.length} sectors
                    </p>
                  </div>
                ) : (
                  <div className="mtm-sector-risk-return-chart-wrap">
                    {sectorRiskReturnChartType === 'scatter' ? (
                      <SectorRiskReturnChart points={sectorRiskReturnData.sectors} />
                    ) : sectorRiskReturnChartType === 'bar' ? (
                      <SectorRiskReturnBarChart points={sectorRiskReturnData.sectors} />
                    ) : (
                      <SectorRiskReturnLineChart points={sectorRiskReturnData.sectors} />
                    )}
                    <p className="mtm-sector-risk-return-meta">
                      {sectorRiskReturnData.startDate} → {sectorRiskReturnData.endDate} ·{' '}
                      {sectorRiskReturnData.symbolsWithMetrics ?? 0} symbols with valid return &amp;
                      volatility · {sectorRiskReturnData.sectors.length} sectors
                    </p>
                  </div>
                )}
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
                <p>
                  Mark-to-market valuation for positions in the selected portfolio
                  {hasLastUpdateDateFilter && mtmData.length > 0
                    ? ` (${filteredMtmData.length} of ${mtmData.length} shown by last price update filter).`
                    : '.'}
                </p>
              </div>
              <div className="mtm-table-header-actions fre-header-actions">
                <ExportPdfExcelButtons
                  exportDisabled={loading || mtmData.length === 0 || filteredMtmData.length === 0}
                  pdfLabel="Download PDF"
                  excelLabel="Download Excel"
                  onExportPdf={() =>
                    exportMtmPositionDetailsToPdf({
                      mtmData: filteredMtmData,
                      portfolioName: getSelectedPortfolioName(),
                      totals,
                      lastUpdated
                    })
                  }
                  onExportExcel={() =>
                    exportMtmPositionDetailsToExcel({
                      mtmData: filteredMtmData,
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
          ) : filteredMtmData.length === 0 ? (
            <div className="mtm-no-data">
              <div className="mtm-no-data-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3>No Positions in This Date Range</h3>
              <p>
                None of the {mtmData.length} position{mtmData.length === 1 ? '' : 's'} have a <strong>Last Update</strong> in the selected range, or dates are missing. Adjust the Last price update filter above or clear the dates.
              </p>
              <button
                type="button"
                className="mtm-btn mtm-btn-secondary"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setMtmLastUpdateFrom('');
                  setMtmLastUpdateTo('');
                }}
              >
                Clear date filter
              </button>
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
                  {filteredMtmData.map((item) => (
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
                    <td colSpan="3"><strong>Portfolio Totals</strong></td>
                    <td className="mtm-total-cost-price" title="Weighted average cost per share for the portfolio">
                      {formatCurrency4(totals.weightedAvgCostPrice ?? 0)}
                    </td>
                    <td></td>
                    <td className="mtm-total-cost">{formatCurrency(totals.totalCost)}</td>
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
