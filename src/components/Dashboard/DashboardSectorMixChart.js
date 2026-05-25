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

// Compact LKR formatter for the donut center.
const formatLkrCompact = (value) => {
  const n = Number(value) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}LKR ${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}LKR ${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}LKR ${(abs / 1e3).toFixed(1)}K`;
  return `${sign}LKR ${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/**
 * Sector mix doughnut for the dashboard — Chart.js pilot (replaces inline SVG pie).
 */
function DashboardSectorMixChart({ sectorData, totalCompanies }) {
  const totalValue = useMemo(
    () => (sectorData || []).reduce((acc, s) => acc + (Number(s.value) || 0), 0),
    [sectorData]
  );

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
          borderWidth: 3,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 12,
          spacing: 1
        }
      ]
    };
  }, [sectorData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: '62%',
      layout: {
        padding: 6
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 12, weight: '500' },
          padding: { top: 8, right: 12, bottom: 8, left: 12 },
          cornerRadius: 6,
          displayColors: true,
          boxWidth: 10,
          boxHeight: 10,
          boxPadding: 6,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          callbacks: {
            title: (items) => (items[0]?.label != null ? String(items[0].label) : ''),
            label: (ctx) => {
              const raw = Number(ctx.raw) || 0;
              const dataArr = ctx.dataset.data;
              const total = dataArr.reduce((a, b) => a + Number(b), 0);
              const pct = total > 0 ? ((raw / total) * 100).toFixed(1) : '0';
              const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(raw);
              return ` LKR ${formatted}  •  ${pct}%`;
            }
          }
        }
      }
    }),
    []
  );

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

  const sectorCount = totalCompanies ?? sectorData.length;

  return (
    <div className="pie-chart pie-chart--chartjs">
      <div className="pie-chart__canvas-wrap">
        <Doughnut data={chartData} options={options} />
        <div className="pie-chart__center" aria-hidden>
          <span className="pie-chart__center-pill">
            {sectorCount} {sectorCount === 1 ? 'Sector' : 'Sectors'}
          </span>
          <span className="pie-chart__center-num">{formatLkrCompact(totalValue)}</span>
          <span className="pie-chart__center-label">Total value</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardSectorMixChart;
