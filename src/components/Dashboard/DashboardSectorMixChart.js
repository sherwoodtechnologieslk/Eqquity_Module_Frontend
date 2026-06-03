import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

// Hex <-> HSL helpers for deriving a more vivid hover color from a muted base.
const hexToHsl = (hex) => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return null;
  const [r, g, b] = m.map((v) => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
};

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
};

// Bump saturation +20 and slightly darken for a clear "highlight" effect.
const enhance = (hex) => {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  const [h, s, l] = hsl;
  return hslToHex(h, Math.min(95, s + 20), Math.max(8, Math.min(92, l - 6)));
};

/**
 * Sector mix doughnut for the dashboard — Chart.js pilot (replaces inline SVG pie).
 */
function DashboardSectorMixChart({ sectorData, totalCompanies }) {
  const chartData = useMemo(() => {
    if (!sectorData?.length) return null;
    return {
      labels: sectorData.map((s) => s.name),
      datasets: [
        {
          data: sectorData.map((s) => s.value),
          backgroundColor: sectorData.map((s) => s.color),
          hoverBackgroundColor: sectorData.map((s) => enhance(s.color)),
          borderColor: '#ffffff',
          borderWidth: 1,
          hoverBorderColor: '#0f172a',
          hoverBorderWidth: 1,
          hoverOffset: 8
        }
      ]
    };
  }, [sectorData]);

  const options = useMemo(() => {
    const monoFont =
      "'IBM Plex Mono', 'Roboto Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: '40%',
      layout: { padding: 4 },
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
              const label = items[0]?.label != null ? String(items[0].label) : '';
              return label.toUpperCase();
            },
            label: (ctx) => {
              const raw = Number(ctx.raw) || 0;
              const dataArr = ctx.dataset.data;
              const total = dataArr.reduce((a, b) => a + Number(b), 0);
              const pct = total > 0 ? ((raw / total) * 100).toFixed(1) : '0';
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(raw);
              return [
                `VALUE   LKR ${formatted}`,
                `SHARE   ${pct}%`
              ];
            }
          }
        }
      }
    };
  }, []);

  if (!chartData) {
    return (
      <div className="pie-chart pie-chart--empty" aria-label="No sector data">
        <div className="pie-chart__placeholder-ring" aria-hidden />
        <div className="pie-chart__center pie-chart__center--empty">
          <span className="pie-chart__center-num">0</span>
          <span className="pie-chart__center-label">Sectors</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pie-chart pie-chart--chartjs">
      <div className="pie-chart__canvas-wrap">
        <Doughnut data={chartData} options={options} />
        <div className="pie-chart__center" aria-hidden>
          <span className="pie-chart__center-num">{totalCompanies ?? sectorData.length}</span>
          <span className="pie-chart__center-label">Sectors</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardSectorMixChart;
