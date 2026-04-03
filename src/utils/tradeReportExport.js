/**
 * Shared Trade Report export (PDF + Excel) and grouping used by
 * Trade Confirmation and Financial Reports Download Center.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const TRADE_REPORT_EXCEL_COLUMNS = [
  'Type',
  'Company',
  'Trade Date',
  'Contract No',
  'No of Shares',
  'Price/Avg',
  'Gross Amount',
  'Brokerage',
  'SEC',
  'Exchange',
  'CDS',
  'GOV CESS',
  'Clearing Fees',
  'Net Amount',
  'Settlement',
  'Foreign Brokerage'
];

export const formatTradeDate = (dateString) => {
  if (!dateString) return '';
  return dateString.split('-').join('/');
};

export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '0.00';
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatExcelNumber = (amount) => {
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
};

export const calculateTransactionValue = (transaction) => {
  const qty = parseFloat(transaction.quantity) || 0;
  const price = parseFloat(transaction.price) || 0;
  return qty * price;
};

export const calculateFees = (transaction) => {
  const brokerage = parseFloat(transaction.brokerage) || 0;
  const cdsFees = parseFloat(transaction.cds_fees) || 0;
  const cseFees = parseFloat(transaction.cse_fees) || 0;
  const clearingFees = parseFloat(transaction.clearing_fees) || 0;
  const secCess = parseFloat(transaction.sec_cess) || 0;
  const govCess = parseFloat(transaction.government_cess) || 0;
  const foreignBrokerage = parseFloat(transaction.foreign_brokerage) || 0;

  return brokerage + cdsFees + cseFees + clearingFees + secCess + govCess + foreignBrokerage;
};

export const getContractNo = (transaction) => {
  const buySell = (transaction.buy_sell || '').toUpperCase();
  if (buySell === 'B') {
    return transaction.buying_contract_no || transaction.execution_id || 'N/A';
  }
  if (buySell === 'S') {
    return transaction.selling_contract_no || transaction.execution_id || 'N/A';
  }
  return transaction.execution_id || 'N/A';
};

export const calculateNetAmount = (transaction) => {
  const value = calculateTransactionValue(transaction);
  const fees = calculateFees(transaction);
  const buySell = (transaction.buy_sell || '').toUpperCase();
  if (buySell === 'B') {
    return value + fees;
  }
  return value - fees;
};

export const calculateReportTotals = (transactions) =>
  transactions.reduce(
    (totals, t) => {
      const value = calculateTransactionValue(t);
      totals.gross += value;
      totals.brokerage += parseFloat(t.brokerage) || 0;
      totals.sec += parseFloat(t.sec_cess) || 0;
      totals.exchange += parseFloat(t.cse_fees) || 0;
      totals.cds += parseFloat(t.cds_fees) || 0;
      totals.govCess += parseFloat(t.government_cess) || 0;
      totals.clearing += parseFloat(t.clearing_fees) || 0;
      totals.net += calculateNetAmount(t);
      totals.foreignBrokerage += parseFloat(t.foreign_brokerage) || 0;
      totals.quantity += parseFloat(t.quantity) || 0;
      return totals;
    },
    {
      gross: 0,
      brokerage: 0,
      sec: 0,
      exchange: 0,
      cds: 0,
      govCess: 0,
      clearing: 0,
      net: 0,
      foreignBrokerage: 0,
      quantity: 0
    }
  );

/** Group parsed transactions by company for sales vs purchases (latest-day slice only). */
export const groupTransactionsByCompany = (data) => {
  const sales = {};
  const purchases = {};

  (data || []).forEach((transaction) => {
    const companyId = transaction.company_id || 'UNKNOWN';
    const buySell = (transaction.buy_sell || '').toUpperCase();

    if (buySell === 'S') {
      if (!sales[companyId]) sales[companyId] = [];
      sales[companyId].push(transaction);
    } else if (buySell === 'B') {
      if (!purchases[companyId]) purchases[companyId] = [];
      purchases[companyId].push(transaction);
    }
  });

  return { sales, purchases };
};

/**
 * Same rules as Trade Confirmation: newest trade_date wins; only that day’s rows are grouped.
 */
export const getLatestDayTradeReportState = (data) => {
  if (!data || !data.length) {
    return { latestTradeDate: null, groupedData: { sales: {}, purchases: {} } };
  }
  const tradeDates = data
    .map((t) => t.trade_date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
  const latestTradeDate = tradeDates[0];
  const filtered = data.filter((t) => t.trade_date === latestTradeDate);
  const groupedData = groupTransactionsByCompany(filtered);
  return { latestTradeDate, groupedData };
};

export const buildReportRows = (groupedData, type) => {
  const groups =
    type === 'sale' ? Object.entries(groupedData.sales) : Object.entries(groupedData.purchases);

  return groups.flatMap(([companyId, transactions]) =>
    transactions.map((t) => {
      const gross = calculateTransactionValue(t);
      return {
        Type: type === 'sale' ? 'Sale' : 'Purchase',
        Company: companyId,
        'Trade Date': t.trade_date || '',
        'Contract No': getContractNo(t),
        'No of Shares': formatExcelNumber(t.quantity),
        'Price/Avg': formatExcelNumber(t.price),
        'Gross Amount': formatExcelNumber(gross),
        Brokerage: formatExcelNumber(t.brokerage),
        SEC: formatExcelNumber(t.sec_cess),
        Exchange: formatExcelNumber(t.cse_fees),
        CDS: formatExcelNumber(t.cds_fees),
        'GOV CESS': formatExcelNumber(t.government_cess),
        'Clearing Fees': formatExcelNumber(t.clearing_fees),
        'Net Amount': formatExcelNumber(calculateNetAmount(t)),
        Settlement: t.settlement_date || '',
        'Foreign Brokerage': formatExcelNumber(t.foreign_brokerage)
      };
    })
  );
};

/**
 * @param {{ groupedData: { sales: object, purchases: object }, latestTradeDate: string | null, filenameBase?: string }} opts
 */
export const exportTradeReportToExcel = ({ groupedData, latestTradeDate, filenameBase }) => {
  const reportDate = latestTradeDate ? formatTradeDate(latestTradeDate) : 'N/A';

  const salesRows = buildReportRows(groupedData, 'sale');
  const purchaseRows = buildReportRows(groupedData, 'purchase');

  const purchaseTotals = calculateReportTotals(Object.values(groupedData.purchases).flat());
  const saleTotals = calculateReportTotals(Object.values(groupedData.sales).flat());
  const netSettlement = saleTotals.net - purchaseTotals.net;

  const summaryRows = [
    { Metric: 'Report Date', Value: reportDate },
    { Metric: 'Purchase Total (Net)', Value: formatExcelNumber(purchaseTotals.net) },
    { Metric: 'Sales Total (Net)', Value: formatExcelNumber(saleTotals.net) },
    { Metric: 'Net Settlement Value', Value: formatExcelNumber(netSettlement) }
  ];

  const detailRowToArray = (row) => TRADE_REPORT_EXCEL_COLUMNS.map((key) => row[key] ?? '');

  const aoa = [];
  aoa.push(['Trade Report']);
  aoa.push([`Report date: ${reportDate}`]);
  aoa.push([]);
  aoa.push(['Metric', 'Value']);
  summaryRows.forEach((r) => aoa.push([r.Metric, r.Value]));
  aoa.push([]);
  aoa.push(['SALES']);
  aoa.push(TRADE_REPORT_EXCEL_COLUMNS);
  if (salesRows.length) {
    salesRows.forEach((r) => aoa.push(detailRowToArray(r)));
  } else {
    aoa.push(['No sale transactions for this report date.']);
  }
  aoa.push([]);
  aoa.push(['PURCHASES']);
  aoa.push(TRADE_REPORT_EXCEL_COLUMNS);
  if (purchaseRows.length) {
    purchaseRows.forEach((r) => aoa.push(detailRowToArray(r)));
  } else {
    aoa.push(['No purchase transactions for this report date.']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colCount = TRADE_REPORT_EXCEL_COLUMNS.length;
  ws['!cols'] = Array.from({ length: colCount }, (_, i) => ({
    wch: i === 0 ? 28 : i === 1 ? 16 : i < 4 ? 14 : 12
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trade Report');

  const safeDate = (reportDate || 'trade-report').replace(/[^\w.-]+/g, '_');
  const base = filenameBase || `trade-report-${safeDate}`;
  XLSX.writeFile(wb, `${base}.xlsx`);
};

/**
 * @param {{ groupedData: { sales: object, purchases: object }, latestTradeDate: string | null, filenameBase?: string }} opts
 */
export const exportTradeReportToPdf = ({ groupedData, latestTradeDate, filenameBase }) => {
  const reportDate = latestTradeDate ? formatTradeDate(latestTradeDate) : 'N/A';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const marginX = 36;
  let cursorY = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Trade Report', marginX, cursorY);
  cursorY += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Trade Date: ${reportDate}`, marginX, cursorY);
  cursorY += 14;
  doc.text(
    'We wish to inform you that the following transaction(s) were done on the above date.',
    marginX,
    cursorY
  );
  cursorY += 18;

  const head = [
    [
      'Trade Date',
      'Contract No',
      'No of Shares',
      'Price/Avg',
      'Gross Amount',
      'Brokerage',
      'SEC',
      'Exchange',
      'CDS',
      'GOV CESS',
      'Clearing Fees',
      'Net Amount',
      'Settlement',
      'Foreign Brokerage'
    ]
  ];

  const addSection = (title, companyId, transactions) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const heading = `${title} ${companyId} (${companyId}.N0000 / LK${companyId.padStart(4, '0')}N00000)`;
    doc.text(heading, marginX, cursorY);
    cursorY += 10;

    const totals = calculateReportTotals(transactions);
    const body = transactions.map((t) => {
      const gross = calculateTransactionValue(t);
      return [
        t.trade_date || 'N/A',
        getContractNo(t),
        formatCurrency(t.quantity),
        formatCurrency(t.price),
        formatCurrency(gross),
        formatCurrency(t.brokerage),
        formatCurrency(t.sec_cess),
        formatCurrency(t.cse_fees),
        formatCurrency(t.cds_fees),
        formatCurrency(t.government_cess),
        formatCurrency(t.clearing_fees),
        formatCurrency(calculateNetAmount(t)),
        t.settlement_date || 'N/A',
        formatCurrency(t.foreign_brokerage)
      ];
    });

    body.push([
      'Total',
      '',
      formatCurrency(totals.quantity),
      '',
      formatCurrency(totals.gross),
      formatCurrency(totals.brokerage),
      formatCurrency(totals.sec),
      formatCurrency(totals.exchange),
      formatCurrency(totals.cds),
      formatCurrency(totals.govCess),
      formatCurrency(totals.clearing),
      formatCurrency(totals.net),
      '',
      formatCurrency(totals.foreignBrokerage)
    ]);

    autoTable(doc, {
      startY: cursorY,
      head,
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: marginX, right: marginX }
    });

    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 18;
  };

  const saleGroups = Object.entries(groupedData.sales);
  const purchaseGroups = Object.entries(groupedData.purchases);

  saleGroups.forEach(([companyId, txns]) => addSection('Sale of', companyId, txns));
  purchaseGroups.forEach(([companyId, txns]) => addSection('Purchase of', companyId, txns));

  const purchaseTotals = calculateReportTotals(Object.values(groupedData.purchases).flat());
  const saleTotals = calculateReportTotals(Object.values(groupedData.sales).flat());
  const netSettlement = saleTotals.net - purchaseTotals.net;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Summary', marginX, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    head: [['Metric', 'Value']],
    body: [
      ['Purchase Total (Net)', formatCurrency(purchaseTotals.net)],
      ['Sales Total (Net)', formatCurrency(saleTotals.net)],
      ['Net Settlement Value', formatCurrency(netSettlement)]
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    margin: { left: marginX, right: marginX }
  });

  const safeDate = (reportDate || 'trade-report').replace(/[^\w.-]+/g, '_');
  const base = filenameBase || `trade-report-${safeDate}`;
  doc.save(`${base}.pdf`);
};
