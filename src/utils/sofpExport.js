/**
 * Shared SOFP export / display helpers.
 * Asset current vs non-current and transaction-type grouping are owned by the backend.
 * Frontend helpers mirror backend grouping only as a fallback when `data.groups` is absent.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs/dist/exceljs.min.js';

export const SOFP_EXPORT_HEADERS = ['Section', 'Transaction type', 'Amount', 'DR/CR'];

/** Backend may return net_profit as number or numeric string */
export const parseNetProfit = (raw) => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Same requests as FinancialPosition.js fetch (FP + YTD P&L for Current P&L line).
 * Pass portfolio as undefined for all portfolios (matches SOFP screen empty filter).
 */
export const loadSofpDataForExport = async ({ getFinancialPosition, getProfitLoss, asOfDate, portfolio }) => {
  const asOfDateObj = new Date(asOfDate);
  const startOfYear = Number.isNaN(asOfDateObj.getTime())
    ? null
    : new Date(asOfDateObj.getFullYear(), 0, 1).toISOString().split('T')[0];

  const [fpResp, plResp] = await Promise.all([
    getFinancialPosition({ asOfDate, portfolio }),
    getProfitLoss({
      startDate: startOfYear || undefined,
      endDate: asOfDate,
      portfolio: portfolio || undefined
    }).catch(() => null)
  ]);

  if (!fpResp?.success) {
    throw new Error(fpResp?.error || 'Failed to load Statement of Financial Position');
  }

  const netProfit = plResp?.success ? parseNetProfit(plResp.data?.totals?.net_profit) : undefined;

  return { financialPositionData: fpResp.data, netProfit };
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

/**
 * Opening-balance SOFP / live SOFP asset split: current vs non-current from
 * chart_of_accounts.account_category text only (aligned with Opening Balance List).
 */
export const isNonCurrentAssetLike = (account) => {
  const c = String(account?.accountCategory || account?.account_category || '')
    .toLowerCase()
    .trim();
  if (!c) return false;
  return (
    c.includes('non-current') ||
    c.includes('non current') ||
    c.includes('noncurrent') ||
    c.includes('fixed asset') ||
    c.includes('intangible')
  );
};

/** Trust backend buckets; no client-side reclassification. */
export const computeDisplayedAssetBuckets = (financialPositionData) => {
  const nonCurrentAssets = financialPositionData?.assets?.nonCurrentAssets || [];
  const currentAssets = financialPositionData?.assets?.currentAssets || [];
  const sumBalance = (rows) => rows.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  return {
    nonCurrentAssets,
    currentAssets,
    totalNonCurrentAssets:
      financialPositionData?.totals?.totalNonCurrentAssets ?? sumBalance(nonCurrentAssets),
    totalCurrentAssets:
      financialPositionData?.totals?.totalCurrentAssets ?? sumBalance(currentAssets)
  };
};

/** Mirrors equityDisplayRows useMemo in FinancialPosition.js */
export const computeEquityDisplayRows = (financialPositionData, netProfit) => {
  const equityAccounts = financialPositionData?.equity || [];
  const currentPlLabel = 'Current P&L';

  const derivedBalanceTypeFromBalance = (balance) => {
    if (Math.abs(balance) < 0.00001) return 'ZERO';
    return balance >= 0 ? 'CR' : 'DR';
  };

  const np = parseNetProfit(netProfit);
  if (np != null) {
    return [
      ...equityAccounts,
      {
        accountName: currentPlLabel,
        transactionTypeName: currentPlLabel,
        balance: np,
        balanceType: derivedBalanceTypeFromBalance(np),
        accountCode: ''
      }
    ];
  }

  return equityAccounts;
};

/**
 * Mirrors backend groupAccountsByTransactionType.
 * Groups by transaction type only — never promote account name to a type row.
 * @returns {Array<{ key: string, label: string, transactionTypeName: string,
 *   accountCategory: string, balance: number, accounts: object[] }>}
 */
export const groupByTransactionType = (accounts) => {
  const groups = [];
  const indexByKey = new Map();

  (accounts || []).forEach((account) => {
    const ttName = String(account?.transactionTypeName || '').trim() || 'Unassigned';
    const key = `g:${ttName.toLowerCase()}`;

    let group = indexByKey.get(key);
    if (!group) {
      group = {
        key,
        label: ttName,
        transactionTypeName: ttName,
        accountCategory: account?.accountCategory || '',
        balance: 0,
        accounts: []
      };
      indexByKey.set(key, group);
      groups.push(group);
    }
    group.balance += Number(account?.balance) || 0;
    group.accounts.push(account);
  });

  return groups;
};

/**
 * Prefer backend `data.groups[sectionKey]`; fall back to local grouping of flat accounts.
 * For equity, inject Current P&L into the flat list before grouping when groups are absent;
 * when backend groups exist, append Current P&L as its own group.
 */
export const resolveSofpGroups = (financialPositionData, sectionKey, flatAccounts, netProfit) => {
  const backendGroups = financialPositionData?.groups?.[sectionKey];
  const hasBackendGroups = Array.isArray(backendGroups) && backendGroups.length > 0;

  if (sectionKey === 'equity') {
    const equityRows = computeEquityDisplayRows(financialPositionData, netProfit);
    if (hasBackendGroups) {
      const np = parseNetProfit(netProfit);
      if (np == null) return backendGroups;
      const plGroup = groupByTransactionType([
        {
          accountName: 'Current P&L',
          transactionTypeName: 'Current P&L',
          balance: np,
          accountCode: ''
        }
      ])[0];
      return plGroup ? [...backendGroups, plGroup] : backendGroups;
    }
    return groupByTransactionType(equityRows);
  }

  if (hasBackendGroups) return backendGroups;
  return groupByTransactionType(flatAccounts);
};

/** Normal-balance-aware DR/CR for a signed (summed) balance. */
export const deriveBalanceTypeFromBalance = (balance, normalBalanceType) => {
  const b = Number(balance) || 0;
  if (Math.abs(b) < 0.005) return 'ZERO';
  if (b > 0) return normalBalanceType;
  return normalBalanceType === 'DR' ? 'CR' : 'DR';
};

/**
 * @param {{ financialPositionData: object, netProfit?: number | null }} params
 * @returns {string[][]} rows for PDF body / CSV
 */
export const buildSofpExportRows = ({ financialPositionData, netProfit }) => {
  const rows = [];
  const sumAccounts = (list) => (list || []).reduce((acc, a) => acc + (Number(a?.balance) || 0), 0);
  const sumGroups = (list) => (list || []).reduce((acc, g) => acc + (Number(g?.balance) || 0), 0);

  const pushGroup = (section, groups, normal, subtotalLabel) => {
    (groups || []).forEach((g) => {
      const drcr =
        g.balanceType ||
        deriveBalanceTypeFromBalance(g.balance, normal);
      rows.push([
        section,
        g.label,
        formatCurrency(Math.abs(Number(g.balance) || 0)),
        drcr === 'ZERO' ? normal : drcr
      ]);
    });
    if (subtotalLabel && (groups || []).length > 0) {
      rows.push([
        section,
        subtotalLabel,
        formatCurrency(Math.abs(sumGroups(groups))),
        normal
      ]);
    }
  };

  const { nonCurrentAssets, currentAssets } = computeDisplayedAssetBuckets(financialPositionData);
  const nonCurrentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentAssets',
    nonCurrentAssets,
    netProfit
  );
  const currentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'currentAssets',
    currentAssets,
    netProfit
  );
  const equityGroups = resolveSofpGroups(
    financialPositionData,
    'equity',
    financialPositionData?.equity,
    netProfit
  );
  const nonCurrentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentLiabilities',
    financialPositionData?.liabilities?.nonCurrentLiabilities,
    netProfit
  );
  const currentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'currentLiabilities',
    financialPositionData?.liabilities?.currentLiabilities,
    netProfit
  );

  const totalAssets =
    financialPositionData?.totals?.totalAssets ??
    sumAccounts(nonCurrentAssets) + sumAccounts(currentAssets);

  pushGroup('Assets · Non-current', nonCurrentAssetGroups, 'DR', 'Total Non-current assets');
  pushGroup('Assets · Current', currentAssetGroups, 'DR', 'Total Current assets');
  rows.push(['', 'Total Assets', formatCurrency(Math.abs(totalAssets)), 'DR']);

  pushGroup('Equity', equityGroups, 'CR', 'Total Equity');
  pushGroup(
    'Liabilities · Non-current',
    nonCurrentLiabilityGroups,
    'CR',
    'Total Non-current liabilities'
  );
  pushGroup(
    'Liabilities · Current',
    currentLiabilityGroups,
    'CR',
    'Total Current liabilities'
  );
  rows.push([
    '',
    'Total Equity & Liabilities',
    formatCurrency(
      Math.abs(
        sumGroups(equityGroups) +
          sumGroups(nonCurrentLiabilityGroups) +
          sumGroups(currentLiabilityGroups)
      )
    ),
    'CR'
  ]);

  return rows;
};

const formatAsAt = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString || '');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatStatementAmount = (amount) => {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(n));
  if (Math.abs(n) < 0.005) return '-';
  return n < 0 ? `(${formatted})` : formatted;
};

const statementDrCr = (balance, normal) => {
  const side = deriveBalanceTypeFromBalance(balance, normal);
  return side === 'ZERO' ? '—' : side;
};

/**
 * Two-sided statement matching the on-screen SOFP:
 * left = Assets, right = Equity & Liabilities.
 */
export const buildSofpStatement = ({ financialPositionData, netProfit, includeAccounts = false }) => {
  const displayed = computeDisplayedAssetBuckets(financialPositionData);
  const nonCurrentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentAssets',
    displayed.nonCurrentAssets,
    netProfit
  );
  const currentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'currentAssets',
    displayed.currentAssets,
    netProfit
  );
  const equityGroups = resolveSofpGroups(
    financialPositionData,
    'equity',
    financialPositionData?.equity,
    netProfit
  );
  const nonCurrentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentLiabilities',
    financialPositionData?.liabilities?.nonCurrentLiabilities,
    netProfit
  );
  const currentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'currentLiabilities',
    financialPositionData?.liabilities?.currentLiabilities,
    netProfit
  );

  const sumGroups = (list) => (list || []).reduce((acc, g) => acc + (Number(g?.balance) || 0), 0);
  const totalEquity = sumGroups(equityGroups);
  const totalNonCurrentLiabilities =
    financialPositionData?.totals?.totalNonCurrentLiabilities ?? sumGroups(nonCurrentLiabilityGroups);
  const totalCurrentLiabilities =
    financialPositionData?.totals?.totalCurrentLiabilities ?? sumGroups(currentLiabilityGroups);
  const totalAssets = Number(financialPositionData?.totals?.totalAssets) || 0;
  const totalEquityAndLiabilities =
    totalNonCurrentLiabilities + totalCurrentLiabilities + totalEquity;
  const difference = Math.abs(totalAssets - totalEquityAndLiabilities);

  const pushSection = (rows, { title, groups, normal, subtotalLabel, subtotalAmount }) => {
    rows.push({ kind: 'heading', label: title, amount: null, drcr: '' });
    if (!groups.length) {
      rows.push({ kind: 'empty', label: '—', amount: null, drcr: '' });
      return;
    }
    groups.forEach((group) => {
      rows.push({
        kind: 'line',
        label: group.label,
        amount: Number(group.balance) || 0,
        drcr: statementDrCr(group.balance, normal)
      });
      if (!includeAccounts) return;
      (group.accounts || []).forEach((account) => {
        const code = String(account?.accountCode || '').trim();
        if (!code) return;
        const name = String(account?.accountName || '').trim() || '—';
        const balance = Number(account?.balance) || 0;
        const rawSide = String(account?.balanceType || '').trim();
        const drcr =
          rawSide && rawSide !== 'ZERO' ? rawSide : statementDrCr(balance, normal);
        rows.push({
          kind: 'account',
          label: `${code}   ${name}`,
          amount: balance,
          drcr
        });
      });
    });
    rows.push({
      kind: 'subtotal',
      label: subtotalLabel,
      amount: Number(subtotalAmount) || 0,
      drcr: ''
    });
  };

  const assets = [];
  pushSection(assets, {
    title: 'Non-current assets',
    groups: nonCurrentAssetGroups,
    normal: 'DR',
    subtotalLabel: 'Total non-current assets',
    subtotalAmount: displayed.totalNonCurrentAssets
  });
  pushSection(assets, {
    title: 'Current assets',
    groups: currentAssetGroups,
    normal: 'DR',
    subtotalLabel: 'Total current assets',
    subtotalAmount: displayed.totalCurrentAssets
  });
  assets.push({
    kind: 'total',
    label: 'Total assets',
    amount: totalAssets,
    drcr: ''
  });

  const equityAndLiabilities = [];
  pushSection(equityAndLiabilities, {
    title: 'Equity',
    groups: equityGroups,
    normal: 'CR',
    subtotalLabel: 'Total equity',
    subtotalAmount: totalEquity
  });
  pushSection(equityAndLiabilities, {
    title: 'Non-current liabilities',
    groups: nonCurrentLiabilityGroups,
    normal: 'CR',
    subtotalLabel: 'Total non-current liabilities',
    subtotalAmount: totalNonCurrentLiabilities
  });
  pushSection(equityAndLiabilities, {
    title: 'Current liabilities',
    groups: currentLiabilityGroups,
    normal: 'CR',
    subtotalLabel: 'Total current liabilities',
    subtotalAmount: totalCurrentLiabilities
  });
  equityAndLiabilities.push({
    kind: 'total',
    label: 'Total equity & liabilities',
    amount: totalEquityAndLiabilities,
    drcr: ''
  });

  const asOfDate = financialPositionData?.asOfDate || '';
  return {
    title: 'Statement of Financial Position',
    asOfLabel: formatAsAt(asOfDate),
    asOfDate,
    portfolio: financialPositionData?.portfolio || 'All Portfolios',
    assets,
    equityAndLiabilities,
    totalAssets,
    totalEquityAndLiabilities,
    isBalanced: difference < 0.01,
    difference
  };
};

const pdfCell = (text, extra = {}) => ({
  content: text == null ? '' : String(text),
  styles: extra
});

const pdfSideCells = (row) => {
  const amount = row?.amount == null ? '' : formatStatementAmount(row.amount);
  const base = { fontSize: 8, textColor: [15, 23, 42], cellPadding: 3.2 };
  if (!row) {
    return [pdfCell('', base), pdfCell('', base), pdfCell('', base)];
  }
  if (row.kind === 'heading') {
    const styles = {
      ...base,
      fontStyle: 'bold',
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59]
    };
    return [pdfCell(row.label, styles), pdfCell('', styles), pdfCell('', styles)];
  }
  if (row.kind === 'subtotal') {
    const styles = {
      ...base,
      fontStyle: 'bold',
      fillColor: [248, 250, 252]
    };
    return [
      pdfCell(row.label, styles),
      pdfCell(amount, { ...styles, halign: 'right' }),
      pdfCell('', styles)
    ];
  }
  if (row.kind === 'total') {
    const styles = {
      ...base,
      fontStyle: 'bold',
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255]
    };
    return [
      pdfCell(row.label, styles),
      pdfCell(amount, { ...styles, halign: 'right' }),
      pdfCell('', styles)
    ];
  }
  return [
    pdfCell(row.label, base),
    pdfCell(amount, { ...base, halign: 'right' }),
    pdfCell(row.drcr || '', { ...base, halign: 'center', textColor: [71, 85, 105], fontSize: 7 })
  ];
};

export const downloadSofpPdf = ({ financialPositionData, netProfit, filenameBase }) => {
  const statement = buildSofpStatement({ financialPositionData, netProfit });
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 58, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(statement.title.toUpperCase(), margin, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`As at ${statement.asOfLabel}`, margin, 44);
  doc.text(statement.portfolio, pageWidth - margin, 44, { align: 'right' });

  const rowCount = Math.max(statement.assets.length, statement.equityAndLiabilities.length);
  const body = [];
  for (let i = 0; i < rowCount; i += 1) {
    body.push([
      ...pdfSideCells(statement.assets[i]),
      ...pdfSideCells(statement.equityAndLiabilities[i])
    ]);
  }

  const headStyles = {
    fillColor: [30, 41, 59],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 8,
    halign: 'left'
  };

  autoTable(doc, {
    startY: 72,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'Assets', colSpan: 3, styles: { ...headStyles, halign: 'left' } },
        { content: 'Equity & Liabilities', colSpan: 3, styles: { ...headStyles, halign: 'left' } }
      ],
      [
        { content: 'Transaction type', styles: headStyles },
        { content: 'Amount (LKR)', styles: { ...headStyles, halign: 'right' } },
        { content: 'DR/CR', styles: { ...headStyles, halign: 'center' } },
        { content: 'Transaction type', styles: headStyles },
        { content: 'Amount (LKR)', styles: { ...headStyles, halign: 'right' } },
        { content: 'DR/CR', styles: { ...headStyles, halign: 'center' } }
      ]
    ],
    body,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.4,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 248 },
      1: { cellWidth: 100, halign: 'right' },
      2: { cellWidth: 44, halign: 'center' },
      3: { cellWidth: 248 },
      4: { cellWidth: 100, halign: 'right' },
      5: { cellWidth: 44, halign: 'center' }
    }
  });

  const footY = (doc.lastAutoTable?.finalY || 72) + 18;
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(statement.isBalanced ? 'Balanced' : 'Unbalanced', margin, footY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Difference  ${formatStatementAmount(statement.difference)}`, margin + 78, footY);

  const base = filenameBase || `SOFP_${statement.asOfDate || 'export'}`;
  doc.save(`${base}.pdf`);
};

const excelAmount = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) return null;
  return n;
};

const EXCEL_NUM = '#,##0.00;(#,##0.00);"-"';
const solidFill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const hairline = { style: 'thin', color: { argb: 'FFD9E2EC' } };
const bottomBorder = { bottom: hairline };
const subtotalBorder = {
  top: { style: 'medium', color: { argb: 'FF243B64' } },
  bottom: hairline
};

const paintRange = (row, from, to, { fill, font, align }) => {
  for (let col = from; col <= to; col += 1) {
    const cell = row.getCell(col);
    if (fill) cell.fill = solidFill(fill);
    if (font) cell.font = { name: 'Calibri', size: 11, ...font };
    cell.alignment = { vertical: 'middle', ...(align || {}) };
  }
};

const writeSideCells = (row, startCol, item, alt) => {
  const labelCell = row.getCell(startCol);
  const amountCell = row.getCell(startCol + 1);
  const sideCell = row.getCell(startCol + 2);
  const cells = [labelCell, amountCell, sideCell];

  const blank = (fill) => {
    cells.forEach((cell) => {
      cell.value = null;
      cell.fill = solidFill(fill);
      cell.border = bottomBorder;
    });
  };

  if (!item) {
    blank('FFFFFFFF');
    return;
  }

  if (item.kind === 'heading') {
    labelCell.value = String(item.label || '').toUpperCase();
    amountCell.value = null;
    sideCell.value = null;
    cells.forEach((cell) => {
      cell.fill = solidFill('FFF1F5F9');
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF243B64' } };
      cell.border = bottomBorder;
      cell.alignment = { vertical: 'middle' };
    });
    return;
  }

  if (item.kind === 'subtotal') {
    labelCell.value = item.label;
    amountCell.value = Number(item.amount) || 0;
    amountCell.numFmt = EXCEL_NUM;
    sideCell.value = null;
    cells.forEach((cell) => {
      cell.fill = solidFill('FFE8EEF7');
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F2937' } };
      cell.border = subtotalBorder;
      cell.alignment = { vertical: 'middle', horizontal: cell === amountCell ? 'right' : 'left' };
    });
    return;
  }

  if (item.kind === 'account') {
    const amount = excelAmount(item.amount);
    labelCell.value = item.label;
    amountCell.value = amount == null ? '—' : amount;
    if (amount != null) amountCell.numFmt = EXCEL_NUM;
    sideCell.value = item.drcr || '';
    cells.forEach((cell) => {
      cell.fill = solidFill('FFDCE8F5');
      cell.border = bottomBorder;
      cell.alignment = {
        vertical: 'middle',
        horizontal: cell === amountCell ? 'right' : cell === sideCell ? 'center' : 'left',
        indent: cell === labelCell ? 1 : 0
      };
    });
    labelCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF334155' } };
    amountCell.font = {
      name: 'Calibri',
      size: 10,
      color: { argb: amount != null && amount < 0 ? 'FFB42318' : 'FF334155' }
    };
    sideCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF334155' } };
    return;
  }

  if (item.kind === 'total') {
    labelCell.value = item.label;
    amountCell.value = Number(item.amount) || 0;
    amountCell.numFmt = EXCEL_NUM;
    sideCell.value = null;
    cells.forEach((cell) => {
      cell.fill = solidFill('FF243B64');
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = bottomBorder;
      cell.alignment = { vertical: 'middle', horizontal: cell === amountCell ? 'right' : 'left' };
    });
    return;
  }

  const fill = alt ? 'FFF8FAFC' : 'FFFFFFFF';
  const amount = excelAmount(item.amount);
  labelCell.value = item.kind === 'empty' ? '—' : item.label;
  amountCell.value = amount == null ? '—' : amount;
  if (amount != null) amountCell.numFmt = EXCEL_NUM;
  sideCell.value = item.drcr || '';
  cells.forEach((cell) => {
    cell.fill = solidFill(fill);
    cell.border = bottomBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: cell === amountCell ? 'right' : cell === sideCell ? 'center' : 'left'
    };
  });
  labelCell.font = {
    name: 'Calibri',
    size: 11,
    italic: item.kind === 'empty',
    color: { argb: item.kind === 'empty' ? 'FF64748B' : 'FF1F2937' }
  };
  amountCell.font = {
    name: 'Calibri',
    size: 11,
    color: { argb: amount != null && amount < 0 ? 'FFB42318' : 'FF1F2937' }
  };
  sideCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
};

export const downloadSofpExcel = async ({
  financialPositionData,
  netProfit,
  filenameBase,
  includeAccounts = false
}) => {
  const statement = buildSofpStatement({ financialPositionData, netProfit, includeAccounts });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Financial Position', {
    views: [{ state: 'frozen', ySplit: 7, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });
  const labelWidth = includeAccounts ? 58 : 42;
  const equityStartCol = 5;
  sheet.columns = [
    { width: labelWidth },
    { width: 20 },
    { width: 12 },
    { width: 4 },
    { width: labelWidth },
    { width: 20 },
    { width: 12 }
  ];

  const titleRow = sheet.getRow(1);
  titleRow.height = 28;
  sheet.mergeCells('A1:G1');
  titleRow.getCell(1).value = statement.title.toUpperCase();
  paintRange(titleRow, 1, 7, {
    fill: 'FF17233C',
    font: { size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    align: { horizontal: 'left' }
  });

  const asAtRow = sheet.getRow(2);
  asAtRow.height = 20;
  sheet.mergeCells('A2:G2');
  asAtRow.getCell(1).value = `As at ${statement.asOfLabel}`;
  paintRange(asAtRow, 1, 7, {
    fill: 'FFF8FAFC',
    font: { size: 11, color: { argb: 'FF243B64' } }
  });

  const portfolioRow = sheet.getRow(3);
  portfolioRow.height = 20;
  sheet.mergeCells('A3:G3');
  portfolioRow.getCell(1).value = statement.portfolio;
  paintRange(portfolioRow, 1, 7, {
    fill: 'FFF8FAFC',
    font: { size: 11, color: { argb: 'FF243B64' } }
  });

  const balanceFill = statement.isBalanced ? 'FFECFDF3' : 'FFFEF2F2';
  const balanceInk = statement.isBalanced ? 'FF067647' : 'FFB42318';
  const balanceRow = sheet.getRow(4);
  balanceRow.height = 22;
  balanceRow.getCell(1).value = 'Balance check';
  balanceRow.getCell(2).value = statement.isBalanced ? 'Balanced' : 'Unbalanced';
  balanceRow.getCell(3).value = 'Difference';
  balanceRow.getCell(equityStartCol).value = Number(statement.difference) || 0;
  balanceRow.getCell(equityStartCol).numFmt = EXCEL_NUM;
  paintRange(balanceRow, 1, 7, {
    fill: balanceFill,
    font: { bold: true, color: { argb: balanceInk } }
  });
  balanceRow.getCell(equityStartCol).alignment = { vertical: 'middle', horizontal: 'right' };

  sheet.getRow(5).height = 8;

  const sideHead = sheet.getRow(6);
  sideHead.height = 22;
  sheet.mergeCells('A6:C6');
  sheet.mergeCells('E6:G6');
  sideHead.getCell(1).value = 'Assets';
  sideHead.getCell(equityStartCol).value = 'Equity & Liabilities';
  paintRange(sideHead, 1, 3, {
    fill: 'FF243B64',
    font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  });
  paintRange(sideHead, equityStartCol, equityStartCol + 2, {
    fill: 'FF243B64',
    font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  });

  const colHead = sheet.getRow(7);
  colHead.height = 18;
  ['Transaction type', 'Amount (LKR)', 'DR/CR'].forEach((label, index) => {
    [1, equityStartCol].forEach((startCol) => {
      const cell = colHead.getCell(startCol + index);
      cell.value = label;
      cell.fill = solidFill('FFE8EEF7');
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF243B64' } };
      cell.border = bottomBorder;
      cell.alignment = {
        vertical: 'middle',
        horizontal: index === 1 ? 'right' : index === 2 ? 'center' : 'left'
      };
    });
  });

  const withSectionGap = (items) => {
    const placed = [];
    (items || []).forEach((item, index) => {
      placed.push(item);
      if (item?.kind !== 'subtotal') return;
      const nextKind = items[index + 1]?.kind;
      if (nextKind === 'heading' || nextKind === 'total') placed.push(null);
    });
    return placed;
  };

  const writeSide = (items, startCol) => {
    let alt = false;
    let rowIndex = 8;
    withSectionGap(items).forEach((item) => {
      if (item) {
        const excelRow = sheet.getRow(rowIndex);
        excelRow.height = 18;
        writeSideCells(excelRow, startCol, item, alt);
        if (item.kind !== 'account') alt = !alt;
      }
      rowIndex += 1;
    });
  };

  writeSide(statement.assets, 1);
  writeSide(statement.equityAndLiabilities, equityStartCol);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const base = filenameBase || `SOFP_${statement.asOfDate || 'export'}`;
  anchor.href = url;
  anchor.download = `${base}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
};
