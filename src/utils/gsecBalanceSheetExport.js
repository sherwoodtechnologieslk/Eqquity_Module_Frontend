/**
 * PDF + Excel export for GSec Balance Sheet (accounts by category).
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HEADERS = [
  'Category',
  'Account Code',
  'Account Name',
  'Debit (LKR)',
  'Credit (LKR)',
  'Net Balance'
];

const stamp = () => new Date().toISOString().split('T')[0];

const toNumber = (value) => Number(value) || 0;

const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(n);
};

const getNetBalance = (debit, credit) => toNumber(debit) - toNumber(credit);

const getBalanceType = (net) => {
  if (net > 0.005) return 'DR';
  if (net < -0.005) return 'CR';
  return '—';
};

const formatNetBalanceExport = (debit, credit, asCurrency = true) => {
  const net = getNetBalance(debit, credit);
  if (Math.abs(net) < 0.005) return '—';
  const amount = asCurrency ? formatCurrency(Math.abs(net)) : Math.abs(net);
  return `${amount} ${getBalanceType(net)}`;
};

const rowPdf = (acc) => {
  const dr = toNumber(acc.total_debit);
  const cr = toNumber(acc.total_credit);
  return [
    acc.account_category ?? '',
    acc.account_code ?? '',
    acc.account_name ?? '',
    formatCurrency(dr),
    formatCurrency(cr),
    formatNetBalanceExport(dr, cr, true)
  ];
};

const rowExcel = (acc) => {
  const dr = toNumber(acc.total_debit);
  const cr = toNumber(acc.total_credit);
  return [
    acc.account_category ?? '',
    acc.account_code ?? '',
    acc.account_name ?? '',
    dr,
    cr,
    formatNetBalanceExport(dr, cr, false)
  ];
};

const normalizeList = (accounts) => {
  const list = Array.isArray(accounts) ? accounts : [];
  return list
    .map((a) => ({
      ...a,
      account_category: (String(a?.account_category ?? '').trim() || 'Uncategorized')
    }))
    .sort((a, b) => {
      const ca = String(a.account_category || '').toLowerCase();
      const cb = String(b.account_category || '').toLowerCase();
      if (ca !== cb) return ca.localeCompare(cb);
      return String(a.account_code || '').localeCompare(String(b.account_code || ''));
    });
};

/**
 * @param {{
 *  accounts: Array,
 *  period?: { startDate?: string, endDate?: string },
 *  totals?: { debit?: number, credit?: number },
 *  filenameBase?: string
 * }} opts
 */
export function exportGsecBalanceSheetToPdf({ accounts, period, totals, filenameBase }) {
  const list = normalizeList(accounts);
  const rows = list.map(rowPdf);
  const base = filenameBase || `gsec-balance-sheet-${stamp()}`;

  const totalDebit = toNumber(totals?.debit);
  const totalCredit = toNumber(totals?.credit);

  const foot = [
    [
      'Totals',
      `${list.length} accounts`,
      '',
      formatCurrency(totalDebit),
      formatCurrency(totalCredit),
      formatNetBalanceExport(totalDebit, totalCredit, true)
    ]
  ];

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(11);
  doc.text('GSec Balance Sheet', 40, 34);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Exported ${new Date().toLocaleString('en-LK')}`, 40, 50);
  if (period?.startDate || period?.endDate) {
    doc.text(
      `Period: ${period?.startDate || ''}${period?.startDate && period?.endDate ? ' - ' : ''}${period?.endDate || ''}`,
      40,
      64
    );
  }
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: period?.startDate || period?.endDate ? 72 : 58,
    theme: 'grid',
    head: [HEADERS],
    body: rows,
    foot,
    showFoot: 'lastPage',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [21, 128, 61],
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
    margin: { left: 40, right: 40 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  doc.save(`${base}.pdf`);
}

/**
 * @param {{
 *  accounts: Array,
 *  period?: { startDate?: string, endDate?: string },
 *  totals?: { debit?: number, credit?: number },
 *  filenameBase?: string
 * }} opts
 */
export function exportGsecBalanceSheetToExcel({ accounts, period, totals, filenameBase }) {
  const list = normalizeList(accounts);
  const rows = list.map(rowExcel);
  const base = filenameBase || `gsec-balance-sheet-${stamp()}`;

  const totalDebit = toNumber(totals?.debit);
  const totalCredit = toNumber(totals?.credit);

  const periodLine =
    period?.startDate || period?.endDate
      ? `Period: ${period?.startDate || ''}${period?.startDate && period?.endDate ? ' - ' : ''}${period?.endDate || ''}`
      : '';

  const sheetData = [
    ['GSec Balance Sheet'],
    [`Exported ${new Date().toLocaleString('en-LK')}`],
    ...(periodLine ? [[periodLine]] : []),
    [],
    HEADERS,
    ...rows,
    [],
    [
      'Totals',
      `${list.length} accounts`,
      '',
      totalDebit,
      totalCredit,
      formatNetBalanceExport(totalDebit, totalCredit, false)
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
  XLSX.writeFile(wb, `${base}.xlsx`);
}

