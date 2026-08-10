/**
 * Excel export for Business Approvals — requests + line-level details.
 */
import * as XLSX from 'xlsx';
import { governanceService } from '../services/governanceApi';
import { GSEC_SOURCE_LABELS } from './gsecMakerChecker';
import { NON_TRADING_SOURCE_LABELS } from './nonTradingMakerChecker';

const EXPORT_PAGE_SIZE = 100;

const STATUS_LABELS = {
  pending: 'Pending (Not approved)',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

const SUMMARY_HEADERS = [
  'Request ID',
  'Module',
  'Label',
  'Entity type',
  'Action type',
  'Status',
  'Status code',
  'Source',
  'Voucher',
  'Account type',
  'Transaction type',
  'Amount',
  'Entry / txn date',
  'Debit GL',
  'Credit GL',
  'Description',
  'Entry count',
  'Pass duplicates',
  'Live tables',
  'Requested by',
  'Requested at',
  'Expires at',
  'Reviewed by',
  'Reviewed at',
  'Rejection reason',
  'Resulting entity table',
  'Resulting entity ID',
];

const DETAIL_HEADERS = [
  'Request ID',
  'Module',
  'Label',
  'Status',
  'Action type',
  'Source',
  'Requested by',
  'Requested at',
  'Reviewed by',
  'Reviewed at',
  'Detail type',
  'Line side',
  'Line #',
  'Voucher',
  'Account type',
  'Transaction type',
  'Amount',
  'Date',
  'Debit GL',
  'Credit GL',
  'GL account',
  'GL description',
  'Currency',
  'Description',
  'Reference',
  'Counterparty',
  'Notes',
  'Deal number',
  'Account code',
  'Account name',
  'Account category',
  'Debit',
  'Credit',
  'Transaction ID',
];

const GL_LINE_HEADERS = [
  'Request ID',
  'Module',
  'Label',
  'Status',
  'Voucher',
  'Account type',
  'Transaction type',
  'Txn amount',
  'Txn date',
  'Description',
  'Line side',
  'Line #',
  'Account',
  'Name',
  'Amount',
];

/** Strip characters that break OOXML / Excel. */
const sanitizeText = (value) => {
  if (value == null) return '';
  return Array.from(String(value), (ch) => {
    const code = ch.charCodeAt(0);
    if (code < 32 && ch !== '\t' && ch !== '\n' && ch !== '\r') return ' ';
    return ch;
  })
    .join('')
    .trim();
};

const cellValue = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toLocaleString('en-LK');
  }
  if (typeof value === 'object') {
    try {
      return sanitizeText(JSON.stringify(value));
    } catch {
      return '';
    }
  }
  const asNum = typeof value === 'string' && value.trim() !== '' && /^-?\d+(\.\d+)?$/.test(value.trim())
    ? Number(value)
    : NaN;
  if (Number.isFinite(asNum) && String(value).length < 16) {
    // keep IDs / codes as text when they look like codes with leading zeros elsewhere
  }
  return sanitizeText(value);
};

const formatDateTime = (value) => {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return sanitizeText(value);
  return d.toLocaleString('en-LK');
};

const statusLabel = (status) => STATUS_LABELS[status] || sanitizeText(status);

const sourceLabel = (req) =>
  sanitizeText(
    req.source_label ||
      GSEC_SOURCE_LABELS[req.source || req.payload?.source] ||
      NON_TRADING_SOURCE_LABELS[req.source || req.payload?.source] ||
      req.source ||
      req.payload?.source ||
      ''
  );

const toNumberOrEmpty = (value) => {
  if (value == null || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : sanitizeText(value);
};

/**
 * Fetch every page for the given modules (max 100 per page).
 */
export async function fetchAllBusinessApprovalRequests(modules = []) {
  const all = [];
  for (const moduleId of modules) {
    let page = 1;
    let totalPages = 1;
    do {
      const res = await governanceService.listBusinessApprovalRequests({
        page,
        limit: EXPORT_PAGE_SIZE,
        module: moduleId,
      });
      const data = res.data || {};
      const requests = Array.isArray(data.requests) ? data.requests : [];
      all.push(...requests);
      totalPages = Math.max(1, Number(data.total_pages) || 1);
      page += 1;
    } while (page <= totalPages);
  }
  return all;
}

const startOfDay = (yyyyMmDd) => {
  if (!yyyyMmDd) return null;
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const endOfDay = (yyyyMmDd) => {
  if (!yyyyMmDd) return null;
  const d = new Date(`${yyyyMmDd}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const inDateRange = (value, from, to) => {
  if (!from && !to) return true;
  if (value == null || value === '') return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

/** Collect entry / transaction dates from a request payload. */
export function getRequestEntryDates(req) {
  const dates = [];
  const payload = req?.payload && typeof req.payload === 'object' ? req.payload : {};
  if (Array.isArray(payload.entries)) {
    payload.entries.forEach((entry) => {
      if (entry?.entry_date) dates.push(entry.entry_date);
      else if (entry?.date) dates.push(entry.date);
    });
  }
  const txn = payload.transaction && typeof payload.transaction === 'object' ? payload.transaction : null;
  if (txn?.date) dates.push(txn.date);
  if (payload.date && !Array.isArray(payload.entries)) dates.push(payload.date);
  return dates;
}

/**
 * Filter requests by created_at and/or entry date ranges (inclusive, local day).
 * @param {object[]} requests
 * @param {{ createdFrom?: string, createdTo?: string, entryFrom?: string, entryTo?: string }} filters
 */
export function filterBusinessApprovalRequests(requests, filters = {}) {
  const list = Array.isArray(requests) ? requests : [];
  const createdFrom = startOfDay(filters.createdFrom);
  const createdTo = endOfDay(filters.createdTo);
  const entryFrom = startOfDay(filters.entryFrom);
  const entryTo = endOfDay(filters.entryTo);
  const hasEntryFilter = Boolean(entryFrom || entryTo);

  return list.filter((req) => {
    if (!inDateRange(req.created_at, createdFrom, createdTo)) return false;
    if (!hasEntryFilter) return true;
    const entryDates = getRequestEntryDates(req);
    if (!entryDates.length) return false;
    return entryDates.some((d) => inDateRange(d, entryFrom, entryTo));
  });
}

/** Resolve transaction object the same way as the on-screen payload preview. */
function getTransactionPayload(req) {
  const payload = req?.payload && typeof req.payload === 'object' ? req.payload : {};
  const isReverse = req.action_type === 'post' || payload.operation === 'reverse';
  if (isReverse) return { transaction: payload, isReverse: true, payload };
  const nested = payload.transaction && typeof payload.transaction === 'object' ? payload.transaction : null;
  return { transaction: nested || payload, isReverse: false, payload };
}

function lineAccountCode(line) {
  return line?.accountCode || line?.account_code || line?.glAccountCode || '';
}

function lineAccountName(line) {
  return line?.accountName || line?.account_name || line?.coaDescription || '';
}

function requestSummaryRow(req) {
  const { transaction, payload } = getTransactionPayload(req);
  const txn = transaction && typeof transaction === 'object' ? transaction : {};
  const firstEntryDate = Array.isArray(payload.entries) ? payload.entries[0]?.entry_date : null;

  return [
    cellValue(req.id),
    cellValue(req.module),
    cellValue(req.label || req.entity_type),
    cellValue(req.entity_type),
    cellValue(req.action_type),
    statusLabel(req.status),
    cellValue(req.status),
    sourceLabel(req),
    cellValue(txn.voucherNumber || req.voucher_number),
    cellValue(txn.accountType),
    cellValue(txn.transactionType),
    toNumberOrEmpty(txn.amount),
    formatDateTime(txn.date || firstEntryDate),
    cellValue(txn.debitGlAccountCode),
    cellValue(txn.creditGlAccountCode),
    cellValue(txn.description),
    toNumberOrEmpty(req.entry_count),
    req.pass_duplicates ? 'Yes' : 'No',
    Array.isArray(req.live_tables) ? sanitizeText(req.live_tables.join(', ')) : '',
    cellValue(req.requested_by_email),
    formatDateTime(req.created_at),
    formatDateTime(req.expires_at),
    cellValue(req.reviewed_by_email),
    formatDateTime(req.reviewed_at),
    cellValue(req.rejection_reason),
    cellValue(req.resulting_entity_table),
    cellValue(req.resulting_entity_id),
  ];
}

function detailMeta(req) {
  return [
    cellValue(req.id),
    cellValue(req.module),
    cellValue(req.label || req.entity_type),
    statusLabel(req.status),
    cellValue(req.action_type),
    sourceLabel(req),
    cellValue(req.requested_by_email),
    formatDateTime(req.created_at),
    cellValue(req.reviewed_by_email),
    formatDateTime(req.reviewed_at),
  ];
}

function emptyDetailTail(count) {
  return Array.from({ length: count }, () => '');
}

function flattenRequestDetails(req) {
  const rows = [];
  const { transaction, isReverse, payload } = getTransactionPayload(req);
  const meta = detailMeta(req);

  if (Array.isArray(payload.entries) && payload.entries.length > 0) {
    payload.entries.forEach((entry, index) => {
      const e = entry && typeof entry === 'object' ? entry : {};
      rows.push([
        ...meta,
        'Ledger entry',
        '',
        index + 1,
        cellValue(e.voucher_number || req.voucher_number),
        '',
        cellValue(e.transaction_code),
        '',
        formatDateTime(e.entry_date),
        '',
        '',
        cellValue(e.account_code),
        cellValue(e.account_name),
        cellValue(e.currency),
        cellValue(e.description),
        '',
        '',
        '',
        cellValue(e.deal_number),
        cellValue(e.account_code),
        cellValue(e.account_name),
        cellValue(e.account_category),
        toNumberOrEmpty(e.debit_amount),
        toNumberOrEmpty(e.credit_amount),
        cellValue(e.transaction_id),
      ]);
    });
    return rows;
  }

  const txn = transaction && typeof transaction === 'object' ? transaction : {};
  const debitLines = Array.isArray(txn.glDebitLines) ? txn.glDebitLines : [];
  const creditLines = Array.isArray(txn.glCreditLines) ? txn.glCreditLines : [];
  const hasTxnFields =
    txn.voucherNumber ||
    txn.amount != null ||
    txn.glAccountCode ||
    txn.debitGlAccountCode ||
    txn.creditGlAccountCode ||
    txn.accountType ||
    txn.transactionType ||
    txn.date ||
    txn.description ||
    txn.reference ||
    debitLines.length > 0 ||
    creditLines.length > 0;

  if (hasTxnFields) {
    const voucher = txn.voucherNumber || req.voucher_number;
    // Header / summary row for the transaction (matches on-screen fields)
    rows.push([
      ...meta,
      isReverse ? 'Reversal' : 'Transaction',
      '',
      1,
      cellValue(voucher),
      cellValue(txn.accountType),
      cellValue(txn.transactionType),
      toNumberOrEmpty(txn.amount),
      formatDateTime(txn.date),
      cellValue(txn.debitGlAccountCode),
      cellValue(txn.creditGlAccountCode),
      cellValue(txn.glAccountCode),
      cellValue(txn.coaDescription),
      cellValue(txn.currency),
      cellValue(txn.description),
      cellValue(txn.reference),
      cellValue(txn.counterparty),
      cellValue(txn.notes),
      ...emptyDetailTail(7),
    ]);

    debitLines.forEach((line, index) => {
      rows.push([
        ...meta,
        'Debit line',
        'Debit',
        index + 1,
        cellValue(voucher),
        cellValue(txn.accountType),
        cellValue(txn.transactionType),
        toNumberOrEmpty(txn.amount),
        formatDateTime(txn.date),
        cellValue(txn.debitGlAccountCode),
        cellValue(txn.creditGlAccountCode),
        '',
        '',
        cellValue(txn.currency),
        cellValue(txn.description),
        '',
        '',
        '',
        '',
        cellValue(lineAccountCode(line)),
        cellValue(lineAccountName(line)),
        '',
        toNumberOrEmpty(line?.amount),
        '',
        '',
      ]);
    });

    creditLines.forEach((line, index) => {
      rows.push([
        ...meta,
        'Credit line',
        'Credit',
        index + 1,
        cellValue(voucher),
        cellValue(txn.accountType),
        cellValue(txn.transactionType),
        toNumberOrEmpty(txn.amount),
        formatDateTime(txn.date),
        cellValue(txn.debitGlAccountCode),
        cellValue(txn.creditGlAccountCode),
        '',
        '',
        cellValue(txn.currency),
        cellValue(txn.description),
        '',
        '',
        '',
        '',
        cellValue(lineAccountCode(line)),
        cellValue(lineAccountName(line)),
        '',
        '',
        toNumberOrEmpty(line?.amount),
        '',
      ]);
    });

    return rows;
  }

  let description = 'See approval request payload in system';
  if (req.voucher_number) description = `Voucher ${req.voucher_number}`;
  else if (req.entry_count != null) {
    description = `${req.entry_count} entr${req.entry_count === 1 ? 'y' : 'ies'}`;
  }

  rows.push([
    ...meta,
    'Request summary',
    '',
    1,
    cellValue(req.voucher_number),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    description,
    '',
    '',
    cellValue(req.rejection_reason),
    ...emptyDetailTail(7),
  ]);

  return rows;
}

/** Dedicated sheet matching Debit lines / Credit lines tables in the UI. */
function flattenGlLines(req) {
  const rows = [];
  const { transaction, payload } = getTransactionPayload(req);
  if (Array.isArray(payload.entries) && payload.entries.length > 0) return rows;

  const txn = transaction && typeof transaction === 'object' ? transaction : {};
  const debitLines = Array.isArray(txn.glDebitLines) ? txn.glDebitLines : [];
  const creditLines = Array.isArray(txn.glCreditLines) ? txn.glCreditLines : [];
  if (!debitLines.length && !creditLines.length) return rows;

  const base = [
    cellValue(req.id),
    cellValue(req.module),
    cellValue(req.label || req.entity_type),
    statusLabel(req.status),
    cellValue(txn.voucherNumber || req.voucher_number),
    cellValue(txn.accountType),
    cellValue(txn.transactionType),
    toNumberOrEmpty(txn.amount),
    formatDateTime(txn.date),
    cellValue(txn.description),
  ];

  debitLines.forEach((line, index) => {
    rows.push([
      ...base,
      'Debit',
      index + 1,
      cellValue(lineAccountCode(line)),
      cellValue(lineAccountName(line)),
      toNumberOrEmpty(line?.amount),
    ]);
  });

  creditLines.forEach((line, index) => {
    rows.push([
      ...base,
      'Credit',
      index + 1,
      cellValue(lineAccountCode(line)),
      cellValue(lineAccountName(line)),
      toNumberOrEmpty(line?.amount),
    ]);
  });

  return rows;
}

function sheetFromAoA(headers, rows) {
  const data = [headers, ...(rows.length ? rows : [headers.map(() => '')])];
  return XLSX.utils.aoa_to_sheet(data);
}

function downloadWorkbook(workbook, filename) {
  // Array + Blob is more reliable in the browser than writeFile for some Excel builds.
  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
  });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Build and download an .xlsx report for business approval requests.
 * @param {object[]} requests
 * @param {{ companyName?: string, moduleLabel?: string }} meta
 */
export function exportBusinessApprovalsToExcel(requests, meta = {}) {
  const list = Array.isArray(requests) ? requests : [];
  const stamp = new Date().toISOString().slice(0, 10);
  const company = meta.companyName || 'company';
  const modulePart = meta.moduleLabel ? `-${meta.moduleLabel}` : '';

  const summaryRows = list.map(requestSummaryRow);
  const detailRows = list.flatMap(flattenRequestDetails);
  const glLineRows = list.flatMap(flattenGlLines);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromAoA(SUMMARY_HEADERS, summaryRows),
    'Approval Requests'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromAoA(DETAIL_HEADERS, detailRows),
    'Request Details'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromAoA(GL_LINE_HEADERS, glLineRows),
    'GL Lines'
  );

  const safeCompany = String(company).replace(/[^\w-]+/g, '_').slice(0, 40);
  const filename = `business-approvals${modulePart}-${safeCompany}-${stamp}.xlsx`;
  downloadWorkbook(workbook, filename);
  return {
    filename,
    requestCount: list.length,
    detailCount: detailRows.length,
    glLineCount: glLineRows.length,
  };
}
