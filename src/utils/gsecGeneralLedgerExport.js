/**
 * PDF + Excel export for GSec General Ledger (filtered rows).
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HEADERS = [
  'Date',
  'Deal Number',
  'Account Code',
  'Account Name',
  'Category',
  'Description',
  'Debit (LKR)',
  'Credit (LKR)',
  'Currency'
];

const stamp = () => new Date().toISOString().split('T')[0];

const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(n);
};

const formatDateDisplay = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-LK');
};

const rowPdf = (entry) => [
  formatDateDisplay(entry.entry_date),
  entry.deal_number ?? '',
  entry.account_code ?? '',
  entry.account_name ?? '',
  entry.account_category ?? '',
  entry.description ?? '',
  Number(entry.debit_amount) > 0 ? formatCurrency(entry.debit_amount) : '-',
  Number(entry.credit_amount) > 0 ? formatCurrency(entry.credit_amount) : '-',
  entry.currency ?? ''
];

const rowExcel = (entry) => [
  formatDateDisplay(entry.entry_date),
  entry.deal_number ?? '',
  entry.account_code ?? '',
  entry.account_name ?? '',
  entry.account_category ?? '',
  entry.description ?? '',
  Number(entry.debit_amount) || 0,
  Number(entry.credit_amount) || 0,
  entry.currency ?? ''
];

/**
 * @param {{ entries: Array, totalDebits: number, totalCredits: number, filenameBase?: string }} opts
 */
export function exportGsecGeneralLedgerToPdf({ entries, totalDebits, totalCredits, filenameBase }) {
  const list = Array.isArray(entries) ? entries : [];
  const rows = list.map(rowPdf);
  const base = filenameBase || `gsec-general-ledger-${stamp()}`;

  const foot = [
    [
      'Totals',
      `${list.length} entries`,
      '',
      '',
      '',
      '',
      formatCurrency(totalDebits),
      formatCurrency(totalCredits),
      ''
    ]
  ];

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(11);
  doc.text('GSec General Ledger', 40, 34);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Exported ${new Date().toLocaleString('en-LK')}`, 40, 50);
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 58,
    theme: 'grid',
    head: [HEADERS],
    body: rows,
    foot,
    showFoot: 'lastPage',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [22, 101, 52],
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
 * @param {{ entries: Array, totalDebits: number, totalCredits: number, filenameBase?: string }} opts
 */
export function exportGsecGeneralLedgerToExcel({ entries, totalDebits, totalCredits, filenameBase }) {
  const list = Array.isArray(entries) ? entries : [];
  const rows = list.map(rowExcel);
  const base = filenameBase || `gsec-general-ledger-${stamp()}`;

  const sheetData = [
    ['GSec General Ledger'],
    [`Exported ${new Date().toLocaleString('en-LK')}`],
    [],
    HEADERS,
    ...rows,
    [],
    [
      'Totals',
      `${list.length} entries`,
      '',
      '',
      '',
      '',
      totalDebits,
      totalCredits,
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GSec Ledger');
  XLSX.writeFile(wb, `${base}.xlsx`);
}
