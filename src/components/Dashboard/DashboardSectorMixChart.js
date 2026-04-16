import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

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
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [sectorData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: '37%',
      layout: {
        padding: 4
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 4,
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
              return `LKR ${formatted} (${pct}%)`;
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
