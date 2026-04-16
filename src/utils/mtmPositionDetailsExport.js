/**
 * PDF + Excel export for Mark-to-Market "Position Details" table.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HEADERS = [
  'Company',
  'Symbol',
  'Quantity',
  'Cost Price',
  'Market Price',
  'Cost Value',
  'Gross Sales',
  'Charges on Purchases',
  'Charges on Sales',
  'Projected Sales Proceeds',
  'Cost of Funds',
  'Projected Sale Proceeds with COF',
  'Unrealized Capital Gain',
  'Capital Gain %',
  'Unrealized P&L',
  'Last Update'
];

const fmt2 = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const fmt4 = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(Number(n) || 0);

const fmtPct = (p) => {
  const v = Number(p) || 0;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
};

const unrealizedPnLForRow = (item) =>
  (Number(item.projectedSalesWithCOF) || 0) -
  ((Number(item.costValue) || 0) + (Number(item.charges) || 0));

const rowFromItem = (item) => [
  item.companyName ?? '',
  item.symbol ?? '',
  (Number(item.quantity) || 0).toLocaleString(),
  fmt4(item.costPrice),
  fmt2(item.marketPrice),
  fmt2(item.costValue),
  fmt2(item.grossSales),
  fmt2(item.charges || 0),
  fmt2(item.chargesOnSales || 0),
  fmt2(item.projectedSalesProceeds || 0),
  fmt2(item.costOfFunds || 0),
  fmt2(item.projectedSalesWithCOF || 0),
  fmt2(item.unrealizedGainLoss),
  fmtPct(item.gainLossPercentage),
  fmt2(unrealizedPnLForRow(item)),
  item.lastPriceUpdate ? new Date(item.lastPriceUpdate).toLocaleDateString() : 'N/A'
];

const totalsFootRow = (totals) => {
  const t = totals || {};
  const totalUnrealizedPnL =
    (Number(t.totalProjectedSalesWithCOF) || 0) -
    ((Number(t.totalCost) || 0) + (Number(t.totalCharges) || 0));
  // Align with on-screen footer: blank under Market, totals for Cost Value onward
  return [
    'Portfolio Totals',
    '',
    '',
    fmt4(t.weightedAvgCostPrice ?? 0),
    '',
    fmt2(t.totalCost || 0),
    fmt2(t.totalGrossSales),
    '',
    '',
    fmt2(t.totalProjectedSales || 0),
    '',
    fmt2(t.totalProjectedSalesWithCOF || 0),
    fmt2(t.totalGainLoss),
    '',
    fmt2(totalUnrealizedPnL),
    ''
  ];
};

const sanitizeFilePart = (name) => {
  const withoutControl = String(name || 'export')
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('');
  return (
    withoutControl
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'export'
  );
};

const stamp = () => new Date().toISOString().split('T')[0];

/** Same roll-ups as Mark-to-Market screen `calculatePortfolioTotals`. */
export function computeMtmPortfolioTotals(mtmData) {
  const data = Array.isArray(mtmData) ? mtmData : [];
  if (!data.length) {
    return {
      totalCost: 0,
      totalQuantity: 0,
      weightedAvgCostPrice: 0,
      totalGrossSales: 0,
      totalCharges: 0,
      totalProjectedSales: 0,
      totalCostOfFunds: 0,
      totalProjectedSalesWithCOF: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      totalMarket: 0
    };
  }
  const totalQuantity = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalCost = data.reduce((sum, item) => sum + (Number(item.costValue) || 0), 0);
  const totalGrossSales = data.reduce((sum, item) => sum + (Number(item.grossSales) || 0), 0);
  const totalCharges = data.reduce((sum, item) => sum + (Number(item.charges) || 0), 0);
  const totalProjectedSales = data.reduce((sum, item) => sum + (Number(item.projectedSalesProceeds) || 0), 0);
  const totalCostOfFunds = data.reduce((sum, item) => sum + (Number(item.costOfFunds) || 0), 0);
  const totalProjectedSalesWithCOF = data.reduce((sum, item) => sum + (Number(item.projectedSalesWithCOF) || 0), 0);
  const totalMarket = data.reduce((sum, item) => sum + (Number(item.grossSales) || 0), 0);
  const totalGainLoss = totalGrossSales - totalCost;
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const weightedAvgCostPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  return {
    totalCost,
    totalQuantity,
    weightedAvgCostPrice,
    totalGrossSales,
    totalCharges,
    totalProjectedSales,
    totalCostOfFunds,
    totalProjectedSalesWithCOF,
    totalGainLoss,
    totalGainLossPercentage,
    totalMarket
  };
}

/**
 * @param {{ mtmData: Array, portfolioName: string, totals: object, lastUpdated?: Date, filenameBase?: string }} opts
 */
export function exportMtmPositionDetailsToPdf({ mtmData, portfolioName, totals, lastUpdated, filenameBase }) {
  const rows = (mtmData || []).map(rowFromItem);
  const foot = totalsFootRow(totals);
  const pf = sanitizeFilePart(portfolioName || 'portfolio');
  const base = filenameBase || `mtm-position-details-${pf}-${stamp()}`;

  const subtitleParts = [
    portfolioName ? `Portfolio: ${portfolioName}` : null,
    lastUpdated ? `Exported: ${lastUpdated.toLocaleString()}` : null
  ].filter(Boolean);
  const subtitle = subtitleParts.join(' • ');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(11);
  doc.text('Mark-to-Market - Position Details', 40, 34);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 40, 50);
    doc.setTextColor(15, 23, 42);
  }

  autoTable(doc, {
    startY: subtitle ? 58 : 48,
    theme: 'grid',
    head: [HEADERS],
    body: rows,
    foot: [foot],
    showFoot: 'lastPage',
    styles: {
      fontSize: 6,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    margin: { left: 40, right: 40 }
  });

  doc.save(`${base}.pdf`);
}

/**
 * @param {{ mtmData: Array, portfolioName: string, totals: object, filenameBase?: string }} opts
 */
export function exportMtmPositionDetailsToExcel({ mtmData, portfolioName, totals, filenameBase }) {
  const rows = (mtmData || []).map(rowFromItem);
  const foot = totalsFootRow(totals);
  const sheetData = [HEADERS, ...rows, foot];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Position Details');
  const pf = sanitizeFilePart(portfolioName || 'portfolio');
  const base = filenameBase || `mtm-position-details-${pf}-${stamp()}`;
  XLSX.writeFile(wb, `${base}.xlsx`);
}
