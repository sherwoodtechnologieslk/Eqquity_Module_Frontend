import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PERIODS, buildPerformanceReportModel } from './portfolioPerformanceReportModel';

const n0 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const n2 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const sgn = (v) => (v > 0 ? '+' : '');
const fmtPct = (v) =>
  v == null || Number.isNaN(v) ? '—' : `${sgn(v)}${n2(v)}%`;
const dash = '—';

const escapeCsvCell = (value) => {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filenameBase, rows) => {
  const lines = rows.map((r) => r.map(escapeCsvCell).join(','));
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * @param {object} params
 * @param {string} params.portfolioName
 * @param {string} params.asOfDate - YYYY-MM-DD
 * @param {string} [params.period] - default YTD
 * @param {Array} params.positions
 * @param {*} params.historyRaw
 * @param {Map} params.sectorBySymbol
 */
export function exportPortfolioPerformanceReportPdf({
  portfolioName,
  asOfDate,
  period = 'YTD',
  positions,
  historyRaw,
  sectorBySymbol,
  filenameBase
}) {
  const refDate = new Date(String(asOfDate || '').slice(0, 10) || Date.now());
  const model = buildPerformanceReportModel({
    positions,
    historyRaw,
    sectorBySymbol,
    period,
    referenceDate: refDate
  });
  const { holdingRows, sectorRows, metricsByPeriod, m, totCost, totMkt, totGL, totRet, sectorContribTotal } = model;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = 34;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('PORTFOLIO PERFORMANCE REPORT', margin, y);
  y += 22;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Portfolio: ${portfolioName || '—'}  |  As of: ${asOfDate}  |  Primary period: ${period}`, margin, y);
  y += 28;
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: [
      [
        `Total Portfolio Return (${period})`,
        fmtPct(m.totalReturn),
        'Total Portfolio Value (LKR)',
        n0(m.portfolioValue)
      ],
      ['Sharpe Ratio (est.)', m.sharpe != null ? n2(m.sharpe) : dash, 'Annualised Volatility (est.)', m.volatility != null ? `${n2(m.volatility)}%` : dash],
      [
        `Maximum Drawdown (${period})`,
        m.maxDrawdown != null ? `${n2(m.maxDrawdown)}%` : dash,
        'Alpha / Beta / Benchmark',
        '— (requires benchmark series)'
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 18;
  doc.setFontSize(10);
  doc.text('Holdings performance', margin, y);
  y += 8;

  const holdBody = holdingRows.map((r) => [
    r.symbol || '',
    String(r.name || '').slice(0, 40),
    n0(r.qty),
    n2(r.costPrice),
    n2(r.currentPrice),
    n0(r.cost),
    n0(r.mkt),
    `${sgn(r.gl)}${n0(r.gl)}`,
    `${sgn(r.ret)}${n2(r.ret)}%`,
    `${n2(r.weight)}%`
  ]);
  if (holdingRows.length) {
    holdBody.push([
      'Total',
      '',
      '',
      '',
      '',
      n0(totCost),
      n0(totMkt),
      `${sgn(totGL)}${n0(totGL)}`,
      totRet != null ? `${sgn(totRet)}${n2(totRet)}%` : dash,
      '100.00%'
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Symbol', 'Security', 'Qty', 'Cost px', 'Mkt px', 'Cost LKR', 'Mkt LKR', 'Unrealised G/L', 'Return %', 'Weight %']],
    body: holdBody.length ? holdBody : [['—', 'No holdings', '', '', '', '', '', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 18;
  doc.text('Sector allocation & performance', margin, y);
  y += 8;

  const secBody = sectorRows.map((s) => {
    const contribution = (s.weight / 100) * s.periodReturn;
    return [
      s.sector,
      `${n2(s.weight)}%`,
      `${sgn(s.periodReturn)}${n2(s.periodReturn)}%`,
      `${sgn(contribution)}${n2(contribution)}%`
    ];
  });
  if (sectorRows.length) {
    secBody.push(['Total', '100.00%', dash, `${sgn(sectorContribTotal)}${n2(sectorContribTotal)}%`]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Sector', 'Weight %', 'Holdings return vs cost %', 'Contribution (pts)']],
    body: secBody.length ? secBody : [['—', '', '', 'No sector breakdown']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 18;
  doc.text('Portfolio return by period (from value history)', margin, y);
  y += 8;

  const benchBody = PERIODS.map((p) => {
    const tr = metricsByPeriod[p]?.totalReturn;
    return [p, fmtPct(tr), dash, dash];
  });

  autoTable(doc, {
    startY: y,
    head: [['Period', 'Portfolio return %', 'Benchmark %', 'Excess %']],
    body: benchBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin }
  });

  doc.save(`${filenameBase}.pdf`);
}

export function exportPortfolioPerformanceReportCsv({
  portfolioName,
  asOfDate,
  period = 'YTD',
  positions,
  historyRaw,
  sectorBySymbol,
  filenameBase
}) {
  const refDate = new Date(String(asOfDate || '').slice(0, 10) || Date.now());
  const model = buildPerformanceReportModel({
    positions,
    historyRaw,
    sectorBySymbol,
    period,
    referenceDate: refDate
  });
  const { holdingRows, sectorRows, metricsByPeriod, m, totCost, totMkt, totGL, totRet, sectorContribTotal } = model;

  const rows = [];
  rows.push(['PORTFOLIO PERFORMANCE REPORT']);
  rows.push(['Portfolio', portfolioName]);
  rows.push(['As of date', asOfDate]);
  rows.push(['Primary period', period]);
  rows.push([]);
  rows.push(['1. Performance summary']);
  rows.push([`Total return (${period})`, fmtPct(m.totalReturn)]);
  rows.push(['Total portfolio value (LKR)', n0(m.portfolioValue)]);
  rows.push(['Sharpe (est.)', m.sharpe != null ? n2(m.sharpe) : dash]);
  rows.push(['Volatility (est.) %', m.volatility != null ? n2(m.volatility) : dash]);
  rows.push(['Max drawdown (%)', m.maxDrawdown != null ? n2(m.maxDrawdown) : dash]);
  rows.push([]);
  rows.push(['2. Return by period']);
  rows.push(['Period', 'Portfolio return %']);
  PERIODS.forEach((p) => {
    rows.push([p, fmtPct(metricsByPeriod[p]?.totalReturn)]);
  });
  rows.push([]);
  rows.push(['3. Holdings']);
  rows.push([
    'Symbol',
    'Security',
    'Quantity',
    'Cost price',
    'Market price',
    'Cost value',
    'Market value',
    'Unrealised G/L',
    'Return %',
    'Weight %'
  ]);
  holdingRows.forEach((r) => {
    rows.push([
      r.symbol,
      r.name,
      n0(r.qty),
      n2(r.costPrice),
      n2(r.currentPrice),
      n0(r.cost),
      n0(r.mkt),
      `${sgn(r.gl)}${n0(r.gl)}`,
      `${sgn(r.ret)}${n2(r.ret)}`,
      n2(r.weight)
    ]);
  });
  if (holdingRows.length) {
    rows.push([
      'Total',
      '',
      '',
      '',
      '',
      n0(totCost),
      n0(totMkt),
      `${sgn(totGL)}${n0(totGL)}`,
      totRet != null ? `${sgn(totRet)}${n2(totRet)}` : dash,
      '100'
    ]);
  }
  rows.push([]);
  rows.push(['4. Sector allocation']);
  rows.push(['Sector', 'Weight %', 'Holdings return %', 'Contribution pts']);
  sectorRows.forEach((s) => {
    const contribution = (s.weight / 100) * s.periodReturn;
    rows.push([s.sector, n2(s.weight), `${sgn(s.periodReturn)}${n2(s.periodReturn)}`, `${sgn(contribution)}${n2(contribution)}`]);
  });
  if (sectorRows.length) {
    rows.push(['Total', '100', '', `${sgn(sectorContribTotal)}${n2(sectorContribTotal)}`]);
  }

  downloadCsv(filenameBase, rows);
}
