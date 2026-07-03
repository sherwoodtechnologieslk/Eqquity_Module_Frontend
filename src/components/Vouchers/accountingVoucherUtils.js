export const VOUCHER_TYPES = [
  { id: 'payment', label: 'Payment Voucher', prefix: 'PV' },
  { id: 'receipt', label: 'Receipt Voucher', prefix: 'RV' },
  { id: 'journal', label: 'Journal Voucher', prefix: 'JV' },
  { id: 'contra', label: 'Contra Voucher', prefix: 'CV' }
];

export const ACCOUNTING_VOUCHER_TRANSACTION_TYPES = [
  'PAYMENT_VOUCHER',
  'RECEIPT_VOUCHER',
  'JOURNAL_VOUCHER',
  'CONTRA_VOUCHER'
];

const TRANSACTION_TYPE_TO_VOUCHER_TYPE = {
  PAYMENT_VOUCHER: 'payment',
  RECEIPT_VOUCHER: 'receipt',
  JOURNAL_VOUCHER: 'journal',
  CONTRA_VOUCHER: 'contra'
};

export const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'Online'];

export const getToday = () => new Date().toISOString().split('T')[0];

export const newLineId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const emptyLine = () => ({
  id: newLineId(),
  accountCode: '',
  accountName: '',
  amount: ''
});

export const createEmptyHeader = (voucherType, voucherNumber, date = getToday()) => ({
  voucherType,
  voucherNumber,
  date,
  party: '',
  paymentMethod: 'Bank Transfer',
  description: '',
  reference: '',
  notes: '',
  branchCode: '',
  branchAccount: '',
  branchName: '',
  chequeNumber: ''
});

export const toYmdCompact = (dateYmd) =>
  String(dateYmd || getToday()).substring(0, 10).replace(/-/g, '');

export const inferVoucherTypeFromRecord = (record) => {
  const txType = String(record?.transaction_type || record?.transactionType || '')
    .toUpperCase()
    .trim();
  if (TRANSACTION_TYPE_TO_VOUCHER_TYPE[txType]) {
    return TRANSACTION_TYPE_TO_VOUCHER_TYPE[txType];
  }
  const vn = String(record?.voucher_number || record?.voucherNumber || '').toUpperCase();
  if (vn.startsWith('PV-')) return 'payment';
  if (vn.startsWith('RV-')) return 'receipt';
  if (vn.startsWith('JV-')) return 'journal';
  if (vn.startsWith('CV-')) return 'contra';
  return null;
};

export const isAccountingVoucherRecord = (record) => {
  const txType = String(record?.transaction_type || record?.transactionType || '')
    .toUpperCase()
    .trim();
  if (ACCOUNTING_VOUCHER_TRANSACTION_TYPES.includes(txType)) return true;
  return Boolean(inferVoucherTypeFromRecord(record));
};

export const generateAccountingVoucherNumber = (voucherType, dateYmd, existingRecords = []) => {
  const typeMeta = VOUCHER_TYPES.find((t) => t.id === voucherType) || VOUCHER_TYPES[0];
  const datePart = toYmdCompact(dateYmd);
  const prefix = typeMeta.prefix;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}-${datePart}-(\\d{3})$`, 'i');

  let maxSeq = 0;
  (existingRecords || []).forEach((record) => {
    const recordType = record?.voucherType || inferVoucherTypeFromRecord(record);
    if (recordType !== voucherType) return;
    const vn = String(record?.voucherNumber || record?.voucher_number || '').trim();
    const match = vn.match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
    }
  });

  return `${prefix}-${datePart}-${String(maxSeq + 1).padStart(3, '0')}`;
};

export const parseAmount = (raw) => {
  const n = parseFloat(String(raw || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const lineIsFilled = (line) =>
  Boolean(String(line?.accountCode || '').trim()) && parseAmount(line?.amount) > 0;

export const sumLines = (lines) =>
  (lines || []).reduce(
    (sum, line) => sum + (lineIsFilled(line) ? parseAmount(line.amount) : 0),
    0
  );

export const validateSideLines = (lines, sideLabel) => {
  const filled = (lines || []).filter(lineIsFilled);
  if (filled.length === 0) {
    return { ok: false, message: `Add at least one ${sideLabel} line with GL code and amount.` };
  }
  const incomplete = (lines || []).some((line) => {
    const hasCode = Boolean(String(line.accountCode || '').trim());
    const hasAmt = parseAmount(line.amount) > 0;
    return (hasCode && !hasAmt) || (!hasCode && hasAmt);
  });
  if (incomplete) {
    return { ok: false, message: `Each ${sideLabel} line needs both GL code and amount.` };
  }
  return { ok: true, filled };
};

export const validateJournal = (debitLines, creditLines) => {
  const dr = validateSideLines(debitLines, 'debit');
  if (!dr.ok) return dr;
  const cr = validateSideLines(creditLines, 'credit');
  if (!cr.ok) return cr;
  const drTotal = sumLines(debitLines);
  const crTotal = sumLines(creditLines);
  if (Math.abs(drTotal - crTotal) >= 0.01) {
    return {
      ok: false,
      message: `Debits (${drTotal.toFixed(2)}) must equal credits (${crTotal.toFixed(2)}).`
    };
  }
  return { ok: true, drTotal, crTotal };
};

export const getTransactionTypeForVoucher = (voucherType) => {
  switch (voucherType) {
    case 'receipt':
      return 'RECEIPT_VOUCHER';
    case 'journal':
      return 'JOURNAL_VOUCHER';
    case 'contra':
      return 'CONTRA_VOUCHER';
    default:
      return 'PAYMENT_VOUCHER';
  }
};

export const buildOtherTransactionPayload = ({
  voucherType,
  header,
  debitLines,
  creditLines,
  drTotal,
  userEmail
}) => {
  const glDebitLinesPayload = (debitLines || [])
    .filter(lineIsFilled)
    .map((line) => ({
      accountCode: String(line.accountCode || '').trim(),
      accountName: String(line.accountName || '').trim() || null,
      amount: parseAmount(line.amount)
    }));

  const glCreditLinesPayload = (creditLines || [])
    .filter(lineIsFilled)
    .map((line) => ({
      accountCode: String(line.accountCode || '').trim(),
      accountName: String(line.accountName || '').trim() || null,
      amount: parseAmount(line.amount)
    }));

  const d0 = glDebitLinesPayload[0];
  const c0 = glCreditLinesPayload[0];

  const noteParts = [];
  if (header.notes?.trim()) noteParts.push(header.notes.trim());
  if (header.chequeNumber?.trim()) noteParts.push(`Cheque: ${header.chequeNumber.trim()}`);

  return {
    voucherNumber: header.voucherNumber,
    accountType: 'gl_to_gl',
    transactionType: getTransactionTypeForVoucher(voucherType),
    description: header.description || '',
    amount: String(drTotal),
    date: header.date,
    reference: header.reference || '',
    counterparty: header.party?.trim() || null,
    notes: noteParts.length > 0 ? noteParts.join(' | ') : null,
    paymentMethod: header.paymentMethod || null,
    paymentAccountNumber: header.branchAccount?.trim() || null,
    paymentBankName: header.branchName?.trim() || null,
    paymentBranchName: header.branchCode?.trim() || null,
    glDebitLines: glDebitLinesPayload,
    glCreditLines: glCreditLinesPayload,
    debitGlAccountCode: d0.accountCode,
    debitCoaDescription: d0.accountName,
    creditGlAccountCode: c0.accountCode,
    creditCoaDescription: c0.accountName,
    userEmail
  };
};

export const getPartyLabel = (voucherType) => {
  switch (voucherType) {
    case 'receipt':
      return 'Received from';
    case 'journal':
      return 'Reference party (optional)';
    case 'contra':
      return 'Transfer party (optional)';
    default:
      return 'Payee';
  }
};

export const showsBankSection = (voucherType) => voucherType !== 'journal';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const raw = String(dateStr).substring(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getVoucherTypeLabel = (typeId) =>
  VOUCHER_TYPES.find((t) => t.id === typeId)?.label || typeId;

export const getVoucherTypeLabelFromRecord = (record) => {
  const typeId = inferVoucherTypeFromRecord(record);
  return typeId ? getVoucherTypeLabel(typeId) : record?.transaction_type || 'Voucher';
};

export const mapGlEntriesToJournalLines = (entries = []) => {
  const debitLines = [];
  const creditLines = [];
  (entries || []).forEach((entry) => {
    const debit = parseFloat(entry.debit) || 0;
    const credit = parseFloat(entry.credit) || 0;
    const line = {
      accountCode: entry.account_code || entry.accountCode || '',
      accountName: entry.account_name || entry.accountName || '',
      amount: debit > 0 ? debit : credit
    };
    if (debit > 0) debitLines.push(line);
    if (credit > 0) creditLines.push(line);
  });
  return { debitLines, creditLines };
};
