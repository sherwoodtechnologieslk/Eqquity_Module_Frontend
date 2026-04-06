import React, { useMemo, useRef, useState, useEffect, memo } from 'react';

/** Demo series only — no external scripts or market widgets (avoids cross-origin script errors). */
function buildDemoSeries(pointCount = 120) {
  const base = 10850;
  return Array.from({ length: pointCount }, (_, i) => {
    const t = i / (pointCount - 1);
    const wave = Math.sin(t * Math.PI * 2.2) * 420 + Math.sin(t * Math.PI * 5) * 110;
    const drift = t * 900;
    return { x: i, y: base + drift + wave };
  });
}

function CSEASPIChart() {
  const plotRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 380 });

  useEffect(() => {
    const el = plotRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const h = Math.max(260, Math.min(height || 380, 560));
      setSize({ w: Math.max(280, width), h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(() => buildDemoSeries(120), []);
  const pad = { top: 24, right: 20, bottom: 40, left: 56 };
  const innerW = Math.max(1, size.w - pad.left - pad.right);
  const innerH = Math.max(1, size.h - pad.top - pad.bottom);

  const minY = Math.min(...series.map((p) => p.y));
  const maxY = Math.max(...series.map((p) => p.y));
  const yPad = (maxY - minY) * 0.08 || 1;
  const y0 = minY - yPad;
  const y1 = maxY + yPad;

  const xScale = (x) => pad.left + (x / (series.length - 1)) * innerW;
  const yScale = (y) => pad.top + innerH - ((y - y0) / (y1 - y0)) * innerH;

  const lineD = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
    .join(' ');
  const first = series[0];
  const last = series[series.length - 1];
  const areaD = `${lineD} L ${xScale(last.x).toFixed(1)} ${pad.top + innerH} L ${xScale(first.x).toFixed(1)} ${pad.top + innerH} Z`;

  const change = last.y - first.y;
  const changePct = (change / first.y) * 100;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => y0 + t * (y1 - y0));

  return (
    <div className="cse-aspi-chart">
      <div className="cse-aspi-chart__meta">
        <div className="cse-aspi-chart__stat">
          <span className="cse-aspi-chart__stat-label">Level (demo)</span>
          <span className="cse-aspi-chart__stat-value">{last.y.toFixed(2)}</span>
        </div>
        <div className="cse-aspi-chart__stat">
          <span className="cse-aspi-chart__stat-label">Δ over window</span>
          <span
            className={`cse-aspi-chart__stat-value cse-aspi-chart__stat-value--${change >= 0 ? 'up' : 'down'}`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)} ({changePct >= 0 ? '+' : ''}
            {changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="cse-aspi-chart__plot" ref={plotRef}>
      <svg
        className="cse-aspi-chart__svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="CSE ASPI demo index chart"
      >
        <defs>
          <linearGradient id="cseAspiArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22ab94" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22ab94" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridYs.map((gy, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              y1={yScale(gy)}
              x2={pad.left + innerW}
              y2={yScale(gy)}
              className="cse-aspi-chart__grid"
            />
            <text
              x={pad.left - 8}
              y={yScale(gy)}
              className="cse-aspi-chart__axis-y"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {gy.toFixed(0)}
            </text>
          </g>
        ))}

        <path d={areaD} fill="url(#cseAspiArea)" stroke="none" />
        <path d={lineD} fill="none" className="cse-aspi-chart__line" strokeWidth="2" />

        <text x={pad.left} y={size.h - 10} className="cse-aspi-chart__axis-x">
          Earlier
        </text>
        <text
          x={pad.left + innerW}
          y={size.h - 10}
          className="cse-aspi-chart__axis-x"
          textAnchor="end"
        >
          Latest
        </text>
      </svg>
      </div>

      <p className="cse-aspi-chart__footnote">
        Demo series for layout only — no third-party chart scripts. Connect your CSE ASPI time series API
        when ready.
      </p>
    </div>
  );
}

export default memo(CSEASPIChart);
