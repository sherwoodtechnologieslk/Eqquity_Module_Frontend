/**
 * PDF + Excel export for Profit & Loss screen.
 *
 * Keeps export simple and robust: one flat table including section/category headers,
 * account rows, and key totals. Uses the current P&L payload already shown on screen.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HEADERS = ['Section', 'Account Code', 'Account Name / Label', 'Type', 'Amount', 'DR/CR'];

const fmt2 = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

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

const drcrFromBalance = (balance, fallback) => {
  const n = Number(balance);
  if (!Number.isFinite(n)) return fallback || '';
  if (Math.abs(n) < 0.00001) return fallback || '';
  return n >= 0 ? 'DR' : 'CR';
};

function pushSection(rows, section, accounts, categorySubtotals) {
  if (!accounts) return;

  // If grouped-by-category, accounts is an object: { [category]: Account[] }
  if (!Array.isArray(accounts) && typeof accounts === 'object') {
    const categories = Object.keys(accounts);
    categories.forEach((cat) => {
      rows.push([`${section} · ${cat}`, '', '—', '', '', '']);
      (accounts[cat] || []).forEach((a) => {
        const bal = Number(a?.balance) || 0;
        rows.push([
          section,
          a?.account_code ?? '',
          a?.account_name ?? '',
          a?.account_type ?? '',
          fmt2(Math.abs(bal)),
          a?.balance_type ?? drcrFromBalance(bal, '')
        ]);
      });
      const sub = categorySubtotals?.[cat];
      if (sub != null) {
        const sb = Number(sub) || 0;
        rows.push([`${section} · ${cat} subtotal`, '', '', '', fmt2(Math.abs(sb)), drcrFromBalance(sb, '')]);
      }
    });
    return;
  }

  // Flat list
  (accounts || []).forEach((a) => {
    const bal = Number(a?.balance) || 0;
    rows.push([
      section,
      a?.account_code ?? '',
      a?.account_name ?? '',
      a?.account_type ?? '',
      fmt2(Math.abs(bal)),
      a?.balance_type ?? drcrFromBalance(bal, '')
    ]);
  });
}

export function buildProfitLossExportRows({ profitLossData, viewMode }) {
  const pl = profitLossData || {};
  const totals = pl.totals || {};

  const rows = [];
  rows.push(['Period', '', `${pl?.period?.startDate || ''} → ${pl?.period?.endDate || ''}`, '', '', '']);
  rows.push(['Portfolio', '', pl?.period?.portfolio || 'All', '', '', '']);
  rows.push(['View', '', viewMode === 'summary' ? 'Summary' : 'Detailed', '', '', '']);
  rows.push(['', '', '', '', '', '']);

  // Always include key totals
  rows.push(['Totals', '', 'Total Revenue', '', fmt2(totals.total_revenue || 0), drcrFromBalance(totals.total_revenue || 0, 'CR')]);
  rows.push(['Totals', '', 'Total Other Income', '', fmt2(totals.total_other_income || 0), drcrFromBalance(totals.total_other_income || 0, 'CR')]);
  rows.push(['Totals', '', 'Total Provisions', '', fmt2(totals.total_provisions || 0), drcrFromBalance((totals.total_provisions || 0) * -1, 'DR')]);
  rows.push(['Totals', '', 'Total Expenses', '', fmt2(totals.total_expenses || 0), drcrFromBalance((totals.total_expenses || 0) * -1, 'DR')]);
  rows.push(['Totals', '', 'Operating Profit', '', fmt2(totals.operating_profit || 0), drcrFromBalance(totals.operating_profit || 0, '')]);
  rows.push(['Totals', '', 'Unrealized Capital Gains', '', fmt2(totals.unrealized_capital_gains || 0), drcrFromBalance(totals.unrealized_capital_gains || 0, '')]);
  rows.push(['Totals', '', 'Net Profit / Loss', '', fmt2(totals.net_profit || 0), drcrFromBalance(totals.net_profit || 0, '')]);
  rows.push(['', '', '', '', '', '']);

  if (viewMode === 'summary') {
    (pl.summary || []).forEach((s) => {
      const amt = Number(s?.total_amount) || 0;
      rows.push(['Summary', '', s?.account_type ?? '', '', fmt2(Math.abs(amt)), drcrFromBalance(amt, '')]);
    });
    return rows;
  }

  // Detailed sections
  rows.push(['Revenue', '', '—', '', '', '']);
  pushSection(rows, 'Revenue', pl.revenueByCategory || pl.revenueAccounts, pl.revenueCategorySubtotals);
  if (pl.revenueSubtotal?.balance != null) {
    const b = Number(pl.revenueSubtotal.balance) || 0;
    rows.push(['Revenue subtotal', '', 'Total Revenue', '', fmt2(Math.abs(b)), drcrFromBalance(b, '')]);
  }
  rows.push(['', '', '', '', '', '']);

  rows.push(['Other Income', '', '—', '', '', '']);
  pushSection(rows, 'Other Income', pl.otherIncomeByCategory || pl.otherIncomeAccounts, pl.otherIncomeCategorySubtotals);
  if (pl.otherIncomeSubtotal?.balance != null) {
    const b = Number(pl.otherIncomeSubtotal.balance) || 0;
    rows.push(['Other Income subtotal', '', 'Total Other Income', '', fmt2(Math.abs(b)), drcrFromBalance(b, '')]);
  }
  rows.push(['', '', '', '', '', '']);

  rows.push(['Provisions', '', '—', '', '', '']);
  pushSection(rows, 'Provisions', pl.provisionsByCategory || pl.provisionsAccounts, pl.provisionsCategorySubtotals);
  if (pl.provisionsSubtotal?.balance != null) {
    const b = Number(pl.provisionsSubtotal.balance) || 0;
    rows.push(['Provisions subtotal', '', 'Total Provisions', '', fmt2(Math.abs(b)), drcrFromBalance(b, '')]);
  }
  rows.push(['', '', '', '', '', '']);

  rows.push(['Expenses', '', '—', '', '', '']);
  pushSection(rows, 'Expenses', pl.expensesByCategory || pl.expenseAccounts, pl.expenseCategorySubtotals);
  if (pl.expenseSubtotal?.balance != null) {
    const b = Number(pl.expenseSubtotal.balance) || 0;
    rows.push(['Expenses subtotal', '', 'Total Expenses', '', fmt2(Math.abs(b)), drcrFromBalance(b, '')]);
  }
  rows.push(['', '', '', '', '', '']);

  // Unrealized adjustments table (if present)
  if (Array.isArray(pl.unrealizedCapitalGains) && pl.unrealizedCapitalGains.length) {
    rows.push(['Unrealized Capital Gains', '', '—', '', '', '']);
    pl.unrealizedCapitalGains.forEach((u) => {
      const amt = Number(u?.amount) || 0;
      rows.push([
        'Unrealized',
        u?.portfolio ?? '',
        u?.description ?? '',
        'UNREALIZED',
        fmt2(Math.abs(amt)),
        amt >= 0 ? 'GAIN' : 'LOSS'
      ]);
    });
    if (pl.unrealizedCapitalGainsSubtotal?.balance != null) {
      const b = Number(pl.unrealizedCapitalGainsSubtotal.balance) || 0;
      rows.push(['Unrealized subtotal', '', 'Unrealized Capital Gains', '', fmt2(Math.abs(b)), drcrFromBalance(b, '')]);
    }
  }

  return rows;
}

export function exportProfitLossToPdf({ profitLossData, viewMode }) {
  const rows = buildProfitLossExportRows({ profitLossData, viewMode });
  const subtitle = [
    profitLossData?.period?.startDate && profitLossData?.period?.endDate
      ? `Period: ${profitLossData.period.startDate} → ${profitLossData.period.endDate}`
      : null,
    profitLossData?.period?.portfolio ? `Portfolio: ${profitLossData.period.portfolio}` : null,
    `View: ${viewMode === 'summary' ? 'Summary' : 'Detailed'}`,
    `Exported: ${new Date().toLocaleString()}`
  ]
    .filter(Boolean)
    .join(' • ');

  const base = `profit-loss-${sanitizeFilePart(profitLossData?.period?.portfolio || 'all')}-${stamp()}`;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(12);
  doc.text('Profit & Loss Statement', 40, 34);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 40, 50);
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 62,
    theme: 'grid',
    head: [HEADERS],
    body: rows,
    styles: {
      fontSize: 7,
      cellPadding: 3,
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
    margin: { left: 40, right: 40 }
  });

  doc.save(`${base}.pdf`);
}

export function exportProfitLossToExcel({ profitLossData, viewMode }) {
  const rows = buildProfitLossExportRows({ profitLossData, viewMode });
  const sheetData = [HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'P&L');
  const base = `profit-loss-${sanitizeFilePart(profitLossData?.period?.portfolio || 'all')}-${stamp()}`;
  XLSX.writeFile(wb, `${base}.xlsx`);
}

