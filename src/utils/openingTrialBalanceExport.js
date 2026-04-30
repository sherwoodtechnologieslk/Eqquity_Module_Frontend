/**
 * PDF and Excel export for the Opening Balance list "Opening TB" view.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const stamp = () => new Date().toISOString().slice(0, 10);

const fmtLkr = (n) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(Number(n) || 0);

const cellAmt = (v, isZero) => (isZero ? '—' : fmtLkr(v));

/**
 * @param {Array<{
 *  accountCode: string,
 *  accountName: string,
 *  typeLabel: string,
 *  debit: number,
 *  credit: number,
 *  net: number,
 *  balanceType: string
 * }>} rows
 * @param {{ debit: number, credit: number }} totals
 * @param {number} netDiff
 * @param {boolean} balanced
 */
export function exportOpeningTrialBalanceToPdf({ rows, totals, netDiff, balanced }) {
  const list = Array.isArray(rows) ? rows : [];
  const body = list.map((r) => {
    const drz = (Number(r.debit) || 0) <= 0.00001;
    const crz = (Number(r.credit) || 0) <= 0.00001;
    const nz = Math.abs(Number(r.net) || 0) < 0.00001;
    return [
      r.accountCode ?? '',
      r.accountName ?? '',
      r.typeLabel ?? '',
      cellAmt(r.debit, drz),
      cellAmt(r.credit, crz),
      cellAmt(r.net, nz),
      r.balanceType ?? ''
    ];
  });

  const td = Number(totals?.debit) || 0;
  const tc = Number(totals?.credit) || 0;
  const foot = [
    [
      'Total',
      '',
      '',
      fmtLkr(td),
      fmtLkr(tc),
      fmtLkr(netDiff),
      balanced ? 'BALANCED' : 'CHECK'
    ]
  ];

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Opening Trial Balance', 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Exported ${new Date().toLocaleString('en-LK')}`, 40, 52);
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 64,
    theme: 'grid',
    head: [['Account code', 'Account name', 'Type', 'Debit', 'Credit', 'Net', 'DR / CR']],
    body: body.length ? body : [['—', 'No accounts in current filter', '', '—', '—', '—', '—']],
    foot: foot,
    showFoot: 'lastPage',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4, textColor: [15, 23, 42] },
    margin: { left: 40, right: 40 }
  });

  doc.save(`opening-trial-balance-${stamp()}.pdf`);
}

/**
 * @param {object} same as exportOpeningTrialBalanceToPdf
 */
export function exportOpeningTrialBalanceToExcel({ rows, totals, netDiff, balanced }) {
  const list = Array.isArray(rows) ? rows : [];
  const td = Number(totals?.debit) || 0;
  const tc = Number(totals?.credit) || 0;

  const aoa = [
    ['Opening Trial Balance'],
    ['Exported', new Date().toLocaleString('en-LK')],
    [],
    ['Account code', 'Account name', 'Type', 'Debit (LKR)', 'Credit (LKR)', 'Net (LKR)', 'DR / CR'],
    ...list.map((r) => [
      r.accountCode ?? '',
      r.accountName ?? '',
      r.typeLabel ?? '',
      Number(r.debit) || 0,
      Number(r.credit) || 0,
      Number(r.net) || 0,
      r.balanceType ?? ''
    ]),
    [
      'Total',
      '',
      '',
      td,
      tc,
      netDiff,
      balanced ? 'BALANCED' : 'CHECK'
    ]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colW = [{ wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }];
  ws['!cols'] = colW;
  XLSX.utils.book_append_sheet(wb, ws, 'Opening TB');
  XLSX.writeFile(wb, `opening-trial-balance-${stamp()}.xlsx`);
}
