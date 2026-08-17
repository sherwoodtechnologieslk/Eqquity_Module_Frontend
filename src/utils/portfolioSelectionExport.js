import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HEADERS = [
  'Company',
  'Company ID',
  'Net Quantity',
  'Average Buy Price',
  'Cost per Share',
  'Cost Value',
  'Charges',
  'Net Value',
  'Last Trade Date',
];

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatNum = (v, digits = 2) =>
  toNumber(v).toLocaleString('en-LK', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const normalizeList = (holdings) => (Array.isArray(holdings) ? holdings : []);

const rowValues = (h) => [
  h.companyName || '—',
  h.companyId || '—',
  toNumber(h.netQuantity),
  toNumber(h.avgBuyPrice),
  toNumber(h.costPerShare),
  toNumber(h.costValue),
  toNumber(h.totalCharges),
  toNumber(h.netValue),
  h.lastTradeDate || '—',
];

const rowPdf = (h) => [
  h.companyName || '—',
  h.companyId || '—',
  formatNum(h.netQuantity, 0),
  formatNum(h.avgBuyPrice, 2),
  formatNum(h.costPerShare, 4),
  formatNum(h.costValue, 2),
  formatNum(h.totalCharges, 2),
  formatNum(h.netValue, 4),
  h.lastTradeDate || '—',
];

const buildTotals = (list) => {
  const netQty = list.reduce((s, h) => s + toNumber(h.netQuantity), 0);
  const costValue = list.reduce((s, h) => s + toNumber(h.costValue), 0);
  const charges = list.reduce((s, h) => s + toNumber(h.totalCharges), 0);
  const netValue = list.reduce((s, h) => s + toNumber(h.netValue), 0);
  const avgBuy = netQty > 0 ? costValue / netQty : 0;
  const costPerShare = netQty > 0 ? netValue / netQty : 0;
  return { netQty, avgBuy, costPerShare, costValue, charges, netValue };
};

const safeBase = (name) =>
  String(name || 'portfolio')
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'portfolio';

/**
 * @param {{
 *  holdings: Array,
 *  portfolioName?: string,
 *  costingMethod?: string,
 *  dateFrom?: string,
 *  dateTo?: string,
 *  filenameBase?: string
 * }} opts
 */
export function exportPortfolioSelectionToPdf({
  holdings,
  portfolioName,
  costingMethod,
  dateFrom,
  dateTo,
  filenameBase,
}) {
  const list = normalizeList(holdings);
  const totals = buildTotals(list);
  const base = filenameBase || `portfolio-holdings-${safeBase(portfolioName)}-${stamp()}`;

  const meta = [
    `Portfolio: ${portfolioName || '—'}`,
    costingMethod ? `Costing: ${costingMethod}` : null,
    dateFrom || dateTo
      ? `Trade date: ${dateFrom || '…'} – ${dateTo || '…'}`
      : 'Trade date: All trades',
    `Exported ${new Date().toLocaleString('en-LK')}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(12);
  doc.text('Portfolio Holdings', 40, 34);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(meta, 40, 50);
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 62,
    theme: 'grid',
    head: [HEADERS],
    body: list.map(rowPdf),
    foot: [
      [
        'Portfolio Totals',
        `${list.length} rows`,
        formatNum(totals.netQty, 0),
        formatNum(totals.avgBuy, 2),
        formatNum(totals.costPerShare, 4),
        formatNum(totals.costValue, 2),
        formatNum(totals.charges, 2),
        formatNum(totals.netValue, 4),
        '',
      ],
    ],
    showFoot: 'lastPage',
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    margin: { left: 40, right: 40 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
  });

  doc.save(`${base}.pdf`);
}

/**
 * @param {{
 *  holdings: Array,
 *  portfolioName?: string,
 *  costingMethod?: string,
 *  dateFrom?: string,
 *  dateTo?: string,
 *  filenameBase?: string
 * }} opts
 */
export function exportPortfolioSelectionToExcel({
  holdings,
  portfolioName,
  costingMethod,
  dateFrom,
  dateTo,
  filenameBase,
}) {
  const list = normalizeList(holdings);
  const totals = buildTotals(list);
  const base = filenameBase || `portfolio-holdings-${safeBase(portfolioName)}-${stamp()}`;

  const sheetData = [
    ['Portfolio Holdings'],
    [`Portfolio: ${portfolioName || '—'}`],
    ...(costingMethod ? [[`Costing: ${costingMethod}`]] : []),
    [
      dateFrom || dateTo
        ? `Trade date: ${dateFrom || '…'} – ${dateTo || '…'}`
        : 'Trade date: All trades',
    ],
    [`Exported ${new Date().toLocaleString('en-LK')}`],
    [],
    HEADERS,
    ...list.map(rowValues),
    [],
    [
      'Portfolio Totals',
      `${list.length} rows`,
      totals.netQty,
      totals.avgBuy,
      totals.costPerShare,
      totals.costValue,
      totals.charges,
      totals.netValue,
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Holdings');
  XLSX.writeFile(wb, `${base}.xlsx`);
}
