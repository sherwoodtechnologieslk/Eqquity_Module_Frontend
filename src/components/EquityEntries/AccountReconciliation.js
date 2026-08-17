import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { chartOfAccountsAPI, accountReconciliationAPI } from '../../services/api';
import './Styles/AccountReconciliation.css';

function normalizeStatementDateForDisplay(value, yearHint) {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  const monthMatch = str.match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i);
  if (monthMatch) {
    const months = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12'
    };
    const year =
      typeof yearHint === 'number' && Number.isFinite(yearHint)
        ? yearHint
        : new Date().getFullYear();
    return `${year}-${months[monthMatch[2].toUpperCase()]}-${String(Number(monthMatch[1])).padStart(2, '0')}`;
  }

  const m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!m) return '';

  const first = Number(m[1]);
  const second = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const month = first > 12 ? second : first;
  const day = first > 12 ? first : second;

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Matches COA CSV "Transaction Type" (e.g. (410) Cash and Short Term Deposits → transaction_type). */
const CASH_AND_SHORT_TERM_DEPOSITS_TYPE = 'Cash and Short Term Deposits';

const getAccountTransactionTypeLabel = (account) =>
  String(account?.transaction_type ?? account?.transactionType ?? '').trim();

const isCashAndShortTermDepositsAccount = (account) =>
  getAccountTransactionTypeLabel(account).toLowerCase() === CASH_AND_SHORT_TERM_DEPOSITS_TYPE.toLowerCase();

const ALL_TIME_RANGE_START = '1900-01-01';

/** Narrow cash accounts by bank name (matches COA description text). */
const RECONCILE_BANK_SELECT_OPTIONS = [
  { value: '', label: 'Select bank' },
  { value: 'seylan', label: 'Seylan Bank' },
  { value: 'hatton', label: 'Hattion Nattion Bank' },
  { value: 'commercial', label: 'COMMERCIAL BANK' },
  { value: 'sampath', label: 'Sampath bank' }
];

const RECONCILE_BANK_KEYWORDS = {
  seylan: ['seylan'],
  hatton: ['hatton', 'hnb', 'hattion', 'nattion', 'hatton national'],
  commercial: ['commercial'],
  sampath: ['sampath']
};

const accountMatchesReconcileBank = (account, bankKey) => {
  const key = String(bankKey || '').trim();
  if (!key) return true;
  const keywords = RECONCILE_BANK_KEYWORDS[key];
  if (!keywords || !keywords.length) return true;
  const text = [
    account?.account_name,
    account?.accountName,
    account?.name,
    account?.description,
    account?.transaction_type,
    account?.transactionType
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return keywords.some((k) => text.includes(String(k).toLowerCase()));
};

const AccountReconciliation = () => {
  // State for filters and configuration (default period: All time — matches handlePeriodChange('all'))
  const [filters, setFilters] = useState({
    bank: '',
    accountCode: '',
    period: 'all',
    startDate: ALL_TIME_RANGE_START,
    endDate: new Date().toISOString().split('T')[0],
    referenceType: 'bank', // bank, vendor, customer
    referenceNumber: ''
  });

  // State for data
  const [accounts, setAccounts] = useState([]);
  const [glTransactions, setGlTransactions] = useState([]);
  const [externalTransactions, setExternalTransactions] = useState([]);
  const [matchedTransactions, setMatchedTransactions] = useState([]);

  const unmatchedGl = useMemo(() => {
    const matchedGlIds = new Set(
      matchedTransactions.map((m) => m?.glTransaction?.id).filter(Boolean)
    );
    return glTransactions.filter((t) => t.id != null && !matchedGlIds.has(t.id));
  }, [glTransactions, matchedTransactions]);

  const unmatchedExternal = useMemo(() => {
    const matchedExtIds = new Set(
      matchedTransactions.map((m) => m?.externalTransaction?.id).filter(Boolean)
    );
    return externalTransactions.filter((t) => t.id != null && !matchedExtIds.has(t.id));
  }, [externalTransactions, matchedTransactions]);

  // State for balances
  const [glOpeningBalance, setGlOpeningBalance] = useState(0);
  const [glClosingBalance, setGlClosingBalance] = useState(0);
  const [externalOpeningBalance, setExternalOpeningBalance] = useState(0);
  const [externalClosingBalance, setExternalClosingBalance] = useState(0);

  // State for reconciliation
  const [reconciliationStatus, setReconciliationStatus] = useState('pending');
  const [differences, setDifferences] = useState({
    unrecordedDeposits: 0,
    outstandingCheques: 0,
    bankCharges: 0,
    otherDiscrepancies: 0,
    netDifference: 0
  });

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);
  const [isPassingEntries, setIsPassingEntries] = useState(false);
  const [externalLoading, setExternalLoading] = useState(false);
  const [statementUploadMessage, setStatementUploadMessage] = useState('');
  const [statementPreviewText, setStatementPreviewText] = useState('');
  const [statementPdfPages, setStatementPdfPages] = useState([]);
  const [statementPreviewRows, setStatementPreviewRows] = useState([]);
  const [statementPreviewError, setStatementPreviewError] = useState('');
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [pdfImportPassword, setPdfImportPassword] = useState('');
  const [pdfPasswordError, setPdfPasswordError] = useState('');

  /** Manual match: which side was clicked + that row; modal lists the other side. */
  const [matchPickerModal, setMatchPickerModal] = useState({
    open: false,
    source: null,
    origin: null
  });

  // PDF.js worker - assumes public/pdf.worker.min.js exists (same as PendingDividends)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  const parsePreviewNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const raw = String(value).replace(/\(([^)]+)\)/g, '-$1');
    const match = raw.match(/-?\d[\d,]*(?:\.\d+)?/);
    if (!match) return 0;
    let numericText = match[0];

    // Some PDFs split/drop the decimal point in money values:
    // "LKR 88,925.32" can be extracted as "LKR88,92532".
    if (!numericText.includes('.') && numericText.includes(',')) {
      const sign = numericText.startsWith('-') ? '-' : '';
      const digits = numericText.replace(/[^0-9]/g, '');
      const lastGroup = numericText.split(',').pop() || '';
      if (digits.length > 2 && lastGroup.length > 3) {
        numericText = `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`;
      }
    }

    const n = Number(numericText.replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const extractStatementAmounts = (value) => {
    const compact = String(value || '').replace(/\s+/g, '');
    const matches = [...compact.matchAll(/(CR|DR)(-?\d[\d,]*(?:\.\d+)?)LKR(\d[\d,]*(?:\.\d+)?)/gi)];
    if (matches.length === 0) return null;

    const last = matches[matches.length - 1];
    return {
      crDr: last[1].toUpperCase(),
      transactionAmount: parsePreviewNumber(last[2]),
      runningBalance: parsePreviewNumber(last[3])
    };
  };

  const formatPreviewAmount = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return '-';
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const sanitizePdfEnglishText = (value) => {
    if (!value) return '';
    const cleaned = String(value)
      .replace(/[^A-Za-z0-9\s.,:/()\-+&'#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const artifactTokens = new Set([
      'J',
      'MF',
      'M0',
      'MX',
      'MFMX',
      'MF0',
      'M0IMX',
      'M0LMX',
      'M0X',
      'MWR',
      'NMF',
      'NFX',
      'NZTO',
      'NZT0',
      '0',
      'ZT0',
      'ZT00',
      'X',
      'V'
    ]);

    const withoutArtifacts = cleaned
      .split(' ')
      .filter((token) => {
        const normalizedToken = token.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (!normalizedToken) return false;
        if (/^0+$/.test(normalizedToken)) return false;
        return !artifactTokens.has(normalizedToken);
      })
      .join(' ')
      .trim();

    return withoutArtifacts;
  };

  const normalizePreviewDate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

    const monthMatch = str.match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i);
    if (monthMatch) {
      const months = {
        JAN: '01',
        FEB: '02',
        MAR: '03',
        APR: '04',
        MAY: '05',
        JUN: '06',
        JUL: '07',
        AUG: '08',
        SEP: '09',
        OCT: '10',
        NOV: '11',
        DEC: '12'
      };
      const year = new Date(filters.startDate || filters.endDate || new Date()).getFullYear();
      return `${year}-${months[monthMatch[2].toUpperCase()]}-${String(Number(monthMatch[1])).padStart(2, '0')}`;
    }

    const m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (!m) return '';

    const first = Number(m[1]);
    const second = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parsePdfPreviewRows = (pages) => {
    const rows = [];
    const isStatementDate = (value) => /^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i.test(String(value || '').trim());
    const isCrDr = (value) => /^(CR|DR)$/i.test(String(value || '').trim());
    const validTransactionTypes = new Set(['CR', 'DR', 'POS', 'REF', 'TRF', 'INTEREST', 'TAX']);
    const isIgnoredTableText = (value) =>
      /seylan bank plc|galle road|hot line|infoseylan\.lk|www\.seylan\.lk|generated from seylan online banking|bears no signature|page\s*\d+\s*of\s*\d+/i.test(
        String(value || '')
      );

    const columnForItem = (item, pageWidth) => {
      const ratio = pageWidth ? item.left / pageWidth : 0;

      if (ratio < 0.13) return 'transactionDate';
      if (ratio < 0.25) return 'transactionValueDate';
      if (ratio < 0.36) return 'transactionType';
      if (ratio < 0.58) return 'transactionDescription';
      if (ratio < 0.66) return 'crDr';
      if (ratio < 0.84) return 'transactionAmount';
      return 'runningBalance';
    };

    pages.forEach((page) => {
      (page.lineItems || []).forEach((line) => {
        const text = (line.items || []).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
        if (!text) return;
        if (/transaction\s+date|transaction\s+value\s+date|running\s+balance/i.test(text)) return;
        if (isIgnoredTableText(text)) return;

        const row = {
          transactionDate: '',
          transactionValueDate: '',
          transactionType: '',
          transactionDescription: '',
          crDr: '',
          transactionAmount: '',
          runningBalance: ''
        };

        (line.items || [])
          .sort((a, b) => a.left - b.left)
          .forEach((item) => {
            const column = columnForItem(item, page.width);
            row[column] = `${row[column]} ${item.text}`.trim();
          });

        const rawTransactionDate = row.transactionDate;
        const rawTransactionValueDate = row.transactionValueDate;
        row.transactionDate = normalizePreviewDate(row.transactionDate) || row.transactionDate;
        row.transactionValueDate = normalizePreviewDate(row.transactionValueDate) || row.transactionValueDate;
        const extractedAmounts = extractStatementAmounts(text);
        const amount = extractedAmounts?.transactionAmount ?? parsePreviewNumber(row.transactionAmount);
        const balance = extractedAmounts?.runningBalance ?? parsePreviewNumber(row.runningBalance);

        const isContinuationLine =
          !rawTransactionDate &&
          !rawTransactionValueDate &&
          !row.transactionType &&
          !row.crDr &&
          !amount &&
          !balance &&
          row.transactionDescription &&
          rows.length > 0;

        if (isContinuationLine) {
          rows[rows.length - 1].transactionDescription = `${rows[rows.length - 1].transactionDescription} ${row.transactionDescription}`
            .replace(/\s+/g, ' ')
            .trim();
          return;
        }

        const normalizedType = String(row.transactionType || '').trim().toUpperCase();
        const normalizedCrDr = String(extractedAmounts?.crDr || row.crDr || '').trim().toUpperCase();
        const hasTransactionDates = isStatementDate(rawTransactionDate) && isStatementDate(rawTransactionValueDate);
        const isActualTransaction =
          hasTransactionDates &&
          validTransactionTypes.has(normalizedType) &&
          isCrDr(normalizedCrDr) &&
          amount !== 0 &&
          balance !== 0;

        if (!isActualTransaction) return;

        rows.push({
          id: `${page.pageNumber}-${rows.length + 1}`,
          transactionDate: row.transactionDate,
          transactionValueDate: row.transactionValueDate,
          transactionType: normalizedType,
          transactionDescription: row.transactionDescription || text,
          crDr: normalizedCrDr,
          transactionAmount: amount,
          runningBalance: balance
        });
      });
    });

    return rows;
  };

  const buildPdfTextLayoutPreview = async (file, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      password: password || undefined
    });
    const pdf = await loadingTask.promise;

    const maxPages = pdf.numPages || 1;
    const pages = [];

    for (let pageIndex = 1; pageIndex <= maxPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({ scale: 1.25 });
      const textContent = await page.getTextContent();

      // Convert PDF.js text items into positioned spans (approx "same format")
      const items = (textContent.items || [])
        .map((it) => ({
          ...it,
          str: sanitizePdfEnglishText(it.str)
        }))
        .filter((it) => it && it.str.trim() !== '')
        .map((it, idx) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
          const fontSize = Math.max(1, Math.hypot(tx[0], tx[1]));
          const angle = Math.atan2(tx[1], tx[0]);
          const left = tx[4];
          const top = tx[5] - fontSize;

          return {
            key: `${pageIndex}-${idx}`,
            text: it.str,
            left,
            top,
            fontSize,
            angle
          };
        });

      const lines = [];
      const sortedItems = [...items].sort((a, b) => (a.top - b.top) || (a.left - b.left));
      sortedItems.forEach((item) => {
        const currentLine = lines[lines.length - 1];
        if (currentLine && Math.abs(currentLine.top - item.top) <= 4) {
          currentLine.items.push(item);
        } else {
          lines.push({ top: item.top, items: [item] });
        }
      });

      pages.push({
        pageNumber: pageIndex,
        width: viewport.width,
        height: viewport.height,
        items,
        lineItems: lines.map((line) => ({
          top: line.top,
          items: line.items.sort((a, b) => a.left - b.left)
        })),
        lines: lines.map((line) =>
          line.items
            .sort((a, b) => a.left - b.left)
            .map((item) => item.text)
            .join(' ')
            .trim()
        )
      });
    }

    return pages;
  };

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await chartOfAccountsAPI.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load chart of accounts');
    }
  };

  const reconcileAccounts = useMemo(
    () => (Array.isArray(accounts) ? accounts.filter(isCashAndShortTermDepositsAccount) : []),
    [accounts]
  );

  const reconcileAccountsFiltered = useMemo(
    () => reconcileAccounts.filter((acc) => accountMatchesReconcileBank(acc, filters.bank)),
    [reconcileAccounts, filters.bank]
  );

  useEffect(() => {
    const selected = String(filters.accountCode || '').trim();
    if (!selected) return;
    const codes = reconcileAccountsFiltered.map((acc) =>
      String(acc.account_code || acc.accountCode || acc.code || '').trim()
    );
    if (!codes.includes(selected)) {
      setFilters((prev) => ({ ...prev, accountCode: '' }));
    }
  }, [reconcileAccountsFiltered, filters.accountCode]);

  const loadGlTransactions = useCallback(async () => {
    const accountCode = String(filters.accountCode || '').trim();
    if (!accountCode) {
      setGlTransactions([]);
      setGlOpeningBalance(0);
      setGlClosingBalance(0);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await accountReconciliationAPI.getAccountTransactions(accountCode, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      setGlTransactions(data.transactions || []);
      setGlOpeningBalance(Number(data.openingBalance ?? data.opening_balance) || 0);
      setGlClosingBalance(Number(data.closingBalance ?? data.closing_balance) || 0);
    } catch (error) {
      console.error('Error loading GL transactions:', error);
      setError('Failed to load general ledger transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  const mapStatementEntryRow = useCallback(
    (row) => {
      const rawDate = row.transaction_date ?? row.transactionDate;
      const hintYear = new Date(filters.startDate || filters.endDate || new Date()).getFullYear();
      const normalizedDate = normalizeStatementDateForDisplay(rawDate, hintYear) || rawDate;
      const amount = Number(row.transaction_amount ?? row.transactionAmount) || 0;
      const side = String(row.cr_dr ?? row.crDr ?? '').toUpperCase();
      const isCredit = side === 'CR';

      return {
        id: row.id != null ? `stmt_${row.id}` : `stmt_${normalizedDate}_${row.transaction_description || ''}`,
        date: normalizedDate,
        reference: row.transaction_type || row.transactionType || '',
        description: row.transaction_description || row.transactionDescription || '',
        debit: isCredit ? 0 : Math.abs(amount),
        credit: isCredit ? Math.abs(amount) : 0,
        balance: Number(row.running_balance ?? row.runningBalance) || 0,
        _sourceFile: row.source_file_name || row.sourceFileName || ''
      };
    },
    [filters.startDate, filters.endDate]
  );

  // Explicit filter deps so changing Account to Reconcile always runs a GL fetch.
  useEffect(() => {
    void loadGlTransactions();
  }, [filters.accountCode, filters.startDate, filters.endDate, loadGlTransactions]);

  const loadExternalTransactions = useCallback(async () => {
    if (!filters.accountCode) {
      setExternalTransactions([]);
      setExternalOpeningBalance(0);
      setExternalClosingBalance(0);
      return;
    }

    try {
      setExternalLoading(true);

      const data = await accountReconciliationAPI.getStatementEntries(filters.accountCode, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const rows = data.transactions || [];
      const mapped = rows.map(mapStatementEntryRow);

      setExternalTransactions(mapped);
      setExternalOpeningBalance(Number(data.openingBalance) || 0);
      setExternalClosingBalance(Number(data.closingBalance) || 0);
    } catch (error) {
      console.error('Error loading statement entries:', error);
      setStatementUploadMessage(error?.message || 'Failed to load saved statement entries.');
    } finally {
      setExternalLoading(false);
    }
  }, [filters.accountCode, filters.startDate, filters.endDate, mapStatementEntryRow]);

  // Load saved bank statement rows for the selected account and date range.
  useEffect(() => {
    loadExternalTransactions();
  }, [loadExternalTransactions]);

  const refetchReconciliationMatches = useCallback(
    async (mode = 'merge') => {
      const accountCode = String(filters.accountCode || '').trim();
      if (!accountCode) {
        setMatchedTransactions([]);
        return;
      }
      try {
        const data = await accountReconciliationAPI.getReconciliationMatches({
          accountCode,
          startDate: filters.startDate,
          endDate: filters.endDate
        });
        const fromDb = Array.isArray(data.matches) ? data.matches : [];
        if (mode === 'replace') {
          setMatchedTransactions(fromDb);
          return;
        }
        setMatchedTransactions((prev) => {
          const localOnly = prev.filter((m) => m?.id && String(m.id).startsWith('manual_'));
          const dbGl = new Set(fromDb.map((m) => m?.glTransaction?.id).filter(Boolean));
          const dbExt = new Set(fromDb.map((m) => m?.externalTransaction?.id).filter(Boolean));
          const localFiltered = localOnly.filter(
            (m) => !dbGl.has(m.glTransaction?.id) && !dbExt.has(m.externalTransaction?.id)
          );
          return [...fromDb, ...localFiltered];
        });
      } catch (error) {
        console.error('Error loading reconciliation matches:', error);
        if (mode === 'replace') {
          setMatchedTransactions([]);
        }
      }
    },
    [filters.accountCode, filters.startDate, filters.endDate]
  );

  useEffect(() => {
    void refetchReconciliationMatches('merge');
  }, [refetchReconciliationMatches]);

  // Load saved bank statement rows for the selected account and date range.
  useEffect(() => {
    loadExternalTransactions();
  }, [loadExternalTransactions]);

  const handleFilterChange = (field, value) => {
    const nextValue = field === 'accountCode' ? String(value || '').trim() : value;
    setFilters((prev) => ({
      ...prev,
      [field]: nextValue
    }));
  };

  const handlePeriodChange = (value) => {
    if (value === 'all') {
      const today = new Date().toISOString().split('T')[0];
      setFilters((prev) => ({
        ...prev,
        period: 'all',
        startDate: ALL_TIME_RANGE_START,
        endDate: today
      }));
      return;
    }
    setFilters((prev) => ({ ...prev, period: value }));
  };

  const handleStatementFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
    setStatementUploadMessage('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setStatementPreviewRows([]);
    setStatementPreviewError('');
    setShowPdfPasswordModal(false);
    setPdfPassword('');
    setPdfImportPassword('');
    setPdfPasswordError('');

    if (!file) return;

    setIsPreparingPreview(true);
    try {
      const name = String(file.name || '').toLowerCase();

      if (name.endsWith('.pdf')) {
        setStatementPreviewError('');
        setStatementPreviewText('');
        setStatementPdfPages([]);
        setStatementPreviewRows([]);
        setPdfPassword('');
        setPdfImportPassword('');
        setPdfPasswordError('Enter the PDF password to preview it.');
        setShowPdfPasswordModal(true);
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const raw = await file.text();
        const snippet = raw.length > 4000 ? `${raw.slice(0, 4000)}\n\n... (truncated preview)` : raw;
        setStatementPreviewText(snippet || '(Empty file)');
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        setStatementPreviewText(
          'Preview not available for Excel files yet. Please click Upload to import and view transactions.'
        );
      } else {
        setStatementPreviewText(
          'Preview not available for this file type. Please click Upload to import and view transactions.'
        );
      }
    } catch (err) {
      console.error('Error preparing statement preview:', err);
      setStatementPreviewError('Could not generate a preview for this file. You can still try uploading it.');
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handleRemoveStatementFile = () => {
    setSelectedFile(null);
    setStatementUploadMessage('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setStatementPreviewRows([]);
    setStatementPreviewError('');
    setShowPdfPasswordModal(false);
    setPdfPassword('');
    setPdfImportPassword('');
    setPdfPasswordError('');
    // Reset file input so the same file can be re-selected
    const fileInput = document.getElementById('reconciliationStatementFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUploadStatement = async () => {
    if (!filters.accountCode) {
      setError('Please select an account to reconcile before uploading a statement.');
      setStatementUploadMessage('Select an account to reconcile, then upload the statement.');
      return;
    }
    if (!selectedFile) {
      setError('Please choose a statement file to upload.');
      setStatementUploadMessage('Please choose a file to upload.');
      return;
    }
    setIsUploadingStatement(true);
    setError('');
    setStatementUploadMessage('');

    try {
      const result = await accountReconciliationAPI.uploadExternalStatement(
        selectedFile,
        filters.accountCode,
        pdfImportPassword
      );

      // Support multiple backend response shapes
      const transactions =
        (result && Array.isArray(result.transactions) && result.transactions) ||
        (Array.isArray(result) && result) ||
        (result && Array.isArray(result.data) && result.data) ||
        [];

      const openingBalance =
        (result && (result.openingBalance ?? result.opening_balance)) ?? 0;
      const closingBalance =
        (result && (result.closingBalance ?? result.closing_balance)) ?? 0;

      setExternalTransactions(transactions);
      setExternalOpeningBalance(Number(openingBalance) || 0);
      setExternalClosingBalance(Number(closingBalance) || 0);

      // Reset any previous matching state when new external data arrives
      setMatchedTransactions([]);
      setReconciliationStatus('pending');

      setShowImportModal(false);
      handleRemoveStatementFile();
      setStatementUploadMessage('Statement uploaded successfully. External transactions are now loaded.');
    } catch (err) {
      console.error('Error uploading external statement:', err);
      setError(err?.message || 'Failed to upload statement. Please try again.');
      setStatementUploadMessage(err?.message || 'Failed to upload statement. Please try again.');
    } finally {
      setIsUploadingStatement(false);
    }
  };

  const handlePassEntries = async () => {
    if (!filters.accountCode) {
      setError('Please select an account to reconcile before passing entries.');
      setStatementUploadMessage('Select an account to reconcile, then pass the entries.');
      return;
    }
    if (statementPreviewRows.length === 0) {
      setStatementUploadMessage('No extracted statement entries available to pass.');
      return;
    }

    setIsPassingEntries(true);
    setError('');
    setStatementUploadMessage('');

    try {
      const result = await accountReconciliationAPI.passStatementEntries({
        accountCode: filters.accountCode,
        sourceFileName: selectedFile?.name || '',
        entries: statementPreviewRows
      });

      await loadExternalTransactions();
      setStatementUploadMessage(`${result.insertedCount || statementPreviewRows.length} entries passed successfully.`);
    } catch (err) {
      console.error('Error passing statement entries:', err);
      setError(err?.message || 'Failed to pass entries. Please try again.');
      setStatementUploadMessage(err?.message || 'Failed to pass entries. Please try again.');
    } finally {
      setIsPassingEntries(false);
    }
  };

  const handlePdfPasswordSubmit = async () => {
    if (!pdfPassword.trim()) {
      setPdfPasswordError('Please enter a password');
      return;
    }
    if (!selectedFile) {
      setPdfPasswordError('Please select the PDF file again.');
      return;
    }

    setIsPreparingPreview(true);
    setStatementPreviewError('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setStatementPreviewRows([]);
    setPdfPasswordError('');

    try {
      const pages = await buildPdfTextLayoutPreview(selectedFile, pdfPassword);
      setStatementPdfPages(pages);
      setStatementPreviewRows(parsePdfPreviewRows(pages));
      setPdfImportPassword(pdfPassword);
      setShowPdfPasswordModal(false);
      setPdfPassword('');
      setPdfPasswordError('');
    } catch (err) {
      console.error('Error unlocking PDF for preview:', err);
      const passwordLike =
        err?.name === 'PasswordException' ||
        String(err?.message || '').toLowerCase().includes('password') ||
        String(err?.message || '').toLowerCase().includes('encrypted');
      if (passwordLike) {
        setPdfPasswordError('Incorrect password. Please try again.');
      } else {
        setPdfPasswordError(err?.message || 'Failed to unlock PDF.');
      }
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const calculateDifferences = useCallback(() => {
    const unrecordedDeposits = unmatchedExternal
      .filter(t => t.debit > 0)
      .reduce((sum, t) => sum + t.debit, 0);

    const outstandingCheques = unmatchedGl
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);

    const bankCharges = unmatchedExternal
      .filter(t => t.credit > 0 && t.description.toLowerCase().includes('fee'))
      .reduce((sum, t) => sum + t.credit, 0);

    const netDifference = (glClosingBalance + unrecordedDeposits - outstandingCheques) - externalClosingBalance;

    setDifferences({
      unrecordedDeposits,
      outstandingCheques,
      bankCharges,
      otherDiscrepancies: 0,
      netDifference
    });
  }, [glClosingBalance, externalClosingBalance, unmatchedGl, unmatchedExternal]);

  useEffect(() => {
    calculateDifferences();
  }, [calculateDifferences]);

  const closeMatchPickerModal = () => {
    setMatchPickerModal({ open: false, source: null, origin: null });
  };

  const openMatchPickerModal = (source, origin) => {
    if (!origin) return;
    setMatchPickerModal({ open: true, source, origin });
  };

  const handleConfirmManualMatch = (glTransaction, externalTransaction) => {
    if (!glTransaction?.id || !externalTransaction?.id) return;
    const newMatch = {
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      glTransaction,
      externalTransaction,
      matchType: 'manual',
      matchedAt: new Date().toISOString()
    };
    setMatchedTransactions((prev) => [...prev, newMatch]);
    closeMatchPickerModal();
  };

  const handleUnmatch = (match) => {
    if (!match?.glTransaction || !match?.externalTransaction) return;
    setMatchedTransactions((prev) => prev.filter((m) => m.id !== match.id));
    setReconciliationStatus('pending');
  };

  const handleSaveReconciliation = async () => {
    const accountCode = String(filters.accountCode || '').trim();
    if (!accountCode) {
      setError('Select an account to reconcile before saving.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      const reconciliationData = {
        accountCode,
        bank: filters.bank || null,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        glBalance: glClosingBalance,
        externalBalance: externalClosingBalance,
        matchedTransactions,
        unmatchedGl,
        unmatchedExternal,
        differences,
        status: 'reconciled',
        reconciledAt: new Date().toISOString()
      };

      const result = await accountReconciliationAPI.saveReconciliation(reconciliationData);

      await refetchReconciliationMatches('replace');

      setReconciliationStatus('reconciled');
      const saved = Number(result?.savedCount) || 0;
      const skipped = Number(result?.skippedCount) || 0;
      if (saved === 0 && matchedTransactions.length > 0) {
        setError(
          `Save ran but the server stored 0 matches (skipped ${skipped}). Open DevTools → Network → save response, or check the server log for details.`
        );
        alert('No matches were written to the database. See the message above the form.');
      } else {
        alert(
          skipped > 0
            ? `Saved ${saved} match(es). ${skipped} pair(s) were skipped (missing GL or statement id).`
            : saved === 0
              ? 'Reconciliation saved. All matches for this period were cleared.'
              : `Reconciliation saved successfully (${saved} match(es)).`
        );
      }
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      setError(error?.message || 'Failed to save reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError('');
      
      await loadGlTransactions();
      await loadExternalTransactions();
      await refetchReconciliationMatches('merge');

    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      account: accounts.find(acc => acc.account_code === filters.accountCode),
      period: filters,
      glTransactions,
      externalTransactions,
      matchedTransactions,
      unmatchedGl,
      unmatchedExternal,
      balances: {
        glOpening: glOpeningBalance,
        glClosing: glClosingBalance,
        externalOpening: externalOpeningBalance,
        externalClosing: externalClosingBalance
      },
      differences,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconciliation_${filters.accountCode}_${filters.startDate}_${filters.endDate}.json`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  const selectedAccount = reconcileAccountsFiltered.find((acc) => {
    const code = acc.account_code || acc.accountCode || acc.code;
    return code === filters.accountCode;
  });

  return (
    <div className="account-reconciliation">
      <div className="account-reconciliation-page">
      {/* Header Section */}
      <header className="account-reconciliation-header">
        <div className="account-reconciliation-header-left">
          <div className="account-reconciliation-header-text">
            <p className="account-reconciliation-eyebrow">Accounting · GL</p>
            <h1>Account Reconciliation</h1>
            {selectedAccount && (
              <div className="account-reconciliation-info">
                <span className="account-reconciliation-code">
                  {selectedAccount.account_code || selectedAccount.accountCode || selectedAccount.code}
                </span>
                <span className="account-reconciliation-name">
                  {selectedAccount.account_name ||
                    selectedAccount.accountName ||
                    selectedAccount.name ||
                    selectedAccount.description ||
                    'Unnamed account'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="account-reconciliation-header-right">
          <div className={`reconciliation-status-info reconciliation-status-info--${reconciliationStatus}`}>
            Status: {reconciliationStatus.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="account-reconciliation-filters">
        <div className="reconciliation-filter-group">
          <label>Select bank:</label>
          <select
            value={filters.bank}
            onChange={(e) => handleFilterChange('bank', e.target.value)}
          >
            {RECONCILE_BANK_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Account to Reconcile:</label>
          <select
            value={filters.accountCode}
            onChange={(e) => handleFilterChange('accountCode', e.target.value)}
          >
            <option value="">Select Account</option>
            {reconcileAccountsFiltered.map((account, idx) => {
              const code = account.account_code || account.accountCode || account.code || '';
              const name =
                account.account_name ||
                account.accountName ||
                account.name ||
                account.description ||
                '';
              return (
                <option key={code || account.id || `acc-${idx}`} value={code}>
                  {code} - {name || 'Unnamed account'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Period:</label>
          <select
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value)}
          >
            <option value="month">Current Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
            <option value="custom">Custom Range</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Reference Type:</label>
          <select
            value={filters.referenceType}
            onChange={(e) => handleFilterChange('referenceType', e.target.value)}
          >
            <option value="bank">Bank Statement</option>
            <option value="vendor">Vendor Statement</option>
            <option value="customer">Customer Statement</option>
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Reference Number:</label>
          <input
            type="text"
            value={filters.referenceNumber}
            onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
            placeholder="Statement/Invoice Number"
          />
        </div>

        <div className="reconciliation-action-buttons">
          <button 
            className="reconciliation-btn"
            onClick={loadExternalTransactions}
            disabled={externalLoading || !filters.accountCode}
            type="button"
          >
            {externalLoading ? 'Loading…' : 'Load External Data'}
          </button>
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            Import Statement
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="reconciliation-balance-summary">
        <div className="reconciliation-balance-card">
          <h3>General Ledger</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Opening Balance:</span>
              <span>{formatCurrency(glOpeningBalance)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Closing Balance:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(glClosingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="reconciliation-balance-card">
          <h3>External Statement</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Opening Balance:</span>
              <span>{formatCurrency(externalOpeningBalance)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Closing Balance:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(externalClosingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="reconciliation-balance-card">
          <h3>Difference Analysis</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Unrecorded Deposits:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(differences.unrecordedDeposits)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Outstanding Cheques:</span>
              <span className="reconciliation-balance-negative">{formatCurrency(differences.outstandingCheques)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Bank Charges:</span>
              <span className="reconciliation-balance-negative">{formatCurrency(differences.bankCharges)}</span>
            </div>
            <div className="reconciliation-balance-item reconciliation-balance-item-total">
              <span>Net Difference:</span>
              <span className={differences.netDifference === 0 ? 'reconciliation-balance-balanced' : 'reconciliation-balance-unbalanced'}>
                {formatCurrency(differences.netDifference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Panels */}
      <div className="reconciliation-panels-container">
        {/* General Ledger Transactions Panel */}
        <div className="reconciliation-panel reconciliation-panel-gl">
          <div className="reconciliation-panel-header">
            <h3>General Ledger Transactions</h3>
            <span className="reconciliation-panel-count">({unmatchedGl.length} unmatched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Journal Entry ID</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedGl.map(transaction => (
                  <tr key={transaction.id} className="reconciliation-transaction-row">
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      {transaction.account_code || transaction.accountCode || '-'}
                      {(transaction.account_name || transaction.accountName) ? ` - ${transaction.account_name || transaction.accountName}` : ''}
                    </td>
                    <td>{transaction.reference || transaction.journal_entry_id || transaction.id || '-'}</td>
                    <td>{transaction.description}</td>
                    <td className="reconciliation-debit-amount">{transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}</td>
                    <td className="reconciliation-credit-amount">{transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}</td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-outline"
                        type="button"
                        onClick={() => openMatchPickerModal('gl', transaction)}
                      >
                        Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* External Statement Panel */}
        <div className="reconciliation-panel reconciliation-panel-external">
          <div className="reconciliation-panel-header">
            <h3>External Statement Transactions</h3>
            <span className="reconciliation-panel-count">({unmatchedExternal.length} unmatched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedExternal.map(transaction => (
                  <tr key={transaction.id} className="reconciliation-transaction-row">
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.reference}</td>
                    <td>{transaction.description}</td>
                    <td className="reconciliation-debit-amount">{transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}</td>
                    <td className="reconciliation-credit-amount">{transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}</td>
                    <td className="reconciliation-balance-amount">{formatCurrency(transaction.balance)}</td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-outline"
                        type="button"
                        onClick={() => openMatchPickerModal('external', transaction)}
                      >
                        Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Matched Transactions */}
      {matchedTransactions.length > 0 && (
        <div className="reconciliation-matched-section">
          <div className="reconciliation-panel-header">
            <h3>Matched Transactions</h3>
            <span className="reconciliation-panel-count">({matchedTransactions.length} matched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>GL Date</th>
                  <th>GL Ref</th>
                  <th>GL Description</th>
                  <th>Ext Date</th>
                  <th>Ext Ref</th>
                  <th>Ext Description</th>
                  <th>Amount</th>
                  <th>Match Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matchedTransactions.map(match => (
                  <tr key={match.id} className="reconciliation-matched-row">
                    <td>{formatDate(match.glTransaction.date)}</td>
                    <td>{match.glTransaction.reference}</td>
                    <td>{match.glTransaction.description}</td>
                    <td>{formatDate(match.externalTransaction.date)}</td>
                    <td>{match.externalTransaction.reference}</td>
                    <td>{match.externalTransaction.description}</td>
                    <td className="reconciliation-amount-display">
                      {formatCurrency(match.glTransaction.debit || match.glTransaction.credit)}
                    </td>
                    <td>
                      <span className={`reconciliation-match-type reconciliation-match-type-${match.matchType}`}>
                        {match.matchType}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-danger"
                        type="button"
                        onClick={() => handleUnmatch(match)}
                      >
                        Unmatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="reconciliation-actions-section">
        <div className="reconciliation-actions-buttons">
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          <button 
            className="reconciliation-btn"
            onClick={handleSaveReconciliation}
            disabled={loading || reconciliationStatus === 'reconciled'}
          >
            {loading ? 'Saving...' : 'Save Reconciliation'}
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-success"
            onClick={handleExportReport}
          >
            Export Report
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={() => {/* Handle print */}}
          >
            Print Report
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={() => {/* Handle attach documents */}}
          >
            Attach Documents
          </button>
        </div>
      </div>

      {/* Manual match: pick counterpart from the other table */}
      {matchPickerModal.open &&
        typeof document !== 'undefined' &&
        createPortal(
          (
            <div
              className="reconciliation-modal-overlay"
              role="presentation"
              onClick={closeMatchPickerModal}
            >
              <div
                className="reconciliation-modal-content"
                style={{ maxWidth: 920, width: '92%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="reconciliation-modal-header">
                  <h3>
                    {matchPickerModal.source === 'gl'
                      ? 'Match GL line to bank statement'
                      : 'Match bank statement line to GL'}
                  </h3>
                  <button
                    className="reconciliation-modal-close"
                    type="button"
                    onClick={closeMatchPickerModal}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="reconciliation-modal-body">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Line you clicked</div>
                  {matchPickerModal.source === 'gl' && matchPickerModal.origin ? (
                    <table className="reconciliation-transactions-table" style={{ marginBottom: 16 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Ref</th>
                          <th>Description</th>
                          <th>Debit</th>
                          <th>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{formatDate(matchPickerModal.origin.date)}</td>
                          <td>
                            {matchPickerModal.origin.reference ||
                              matchPickerModal.origin.journal_entry_id ||
                              matchPickerModal.origin.id ||
                              '—'}
                          </td>
                          <td>{matchPickerModal.origin.description || '—'}</td>
                          <td className="reconciliation-debit-amount">
                            {matchPickerModal.origin.debit > 0
                              ? formatCurrency(matchPickerModal.origin.debit)
                              : '—'}
                          </td>
                          <td className="reconciliation-credit-amount">
                            {matchPickerModal.origin.credit > 0
                              ? formatCurrency(matchPickerModal.origin.credit)
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : null}
                  {matchPickerModal.source === 'external' && matchPickerModal.origin ? (
                    <table className="reconciliation-transactions-table" style={{ marginBottom: 16 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Reference</th>
                          <th>Description</th>
                          <th>Debit</th>
                          <th>Credit</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{formatDate(matchPickerModal.origin.date)}</td>
                          <td>{matchPickerModal.origin.reference || '—'}</td>
                          <td>{matchPickerModal.origin.description || '—'}</td>
                          <td className="reconciliation-debit-amount">
                            {matchPickerModal.origin.debit > 0
                              ? formatCurrency(matchPickerModal.origin.debit)
                              : '—'}
                          </td>
                          <td className="reconciliation-credit-amount">
                            {matchPickerModal.origin.credit > 0
                              ? formatCurrency(matchPickerModal.origin.credit)
                              : '—'}
                          </td>
                          <td className="reconciliation-balance-amount">
                            {formatCurrency(matchPickerModal.origin.balance)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : null}

                  <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>
                    {matchPickerModal.source === 'gl'
                      ? 'Unmatched bank statement lines — pick one to match'
                      : 'Unmatched GL lines — pick one to match'}
                  </div>
                  <div style={{ maxHeight: 380, overflow: 'auto', border: '1px solid #e5e7eb' }}>
                    {matchPickerModal.source === 'gl' ? (
                      unmatchedExternal.length === 0 ? (
                        <p style={{ padding: 16, color: '#6b7280', margin: 0 }}>
                          No unmatched external lines. Load a statement or import transactions first.
                        </p>
                      ) : (
                        <table className="reconciliation-transactions-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Reference</th>
                              <th>Description</th>
                              <th>Debit</th>
                              <th>Credit</th>
                              <th>Balance</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unmatchedExternal.map((row) => (
                              <tr key={row.id}>
                                <td>{formatDate(row.date)}</td>
                                <td>{row.reference || '—'}</td>
                                <td>{row.description || '—'}</td>
                                <td className="reconciliation-debit-amount">
                                  {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                                </td>
                                <td className="reconciliation-credit-amount">
                                  {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                                </td>
                                <td className="reconciliation-balance-amount">{formatCurrency(row.balance)}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-success"
                                    onClick={() =>
                                      handleConfirmManualMatch(matchPickerModal.origin, row)
                                    }
                                  >
                                    Match with this
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    ) : unmatchedGl.length === 0 ? (
                      <p style={{ padding: 16, color: '#6b7280', margin: 0 }}>
                        No unmatched GL lines for this account and date range.
                      </p>
                    ) : (
                      <table className="reconciliation-transactions-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Account</th>
                            <th>Ref</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unmatchedGl.map((row) => (
                            <tr key={row.id}>
                              <td>{formatDate(row.date)}</td>
                              <td>
                                {row.account_code || row.accountCode || '—'}
                                {(row.account_name || row.accountName)
                                  ? ` — ${row.account_name || row.accountName}`
                                  : ''}
                              </td>
                              <td>{row.reference || row.journal_entry_id || row.id || '—'}</td>
                              <td>{row.description || '—'}</td>
                              <td className="reconciliation-debit-amount">
                                {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                              </td>
                              <td className="reconciliation-credit-amount">
                                {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-success"
                                  onClick={() =>
                                    handleConfirmManualMatch(row, matchPickerModal.origin)
                                  }
                                >
                                  Match with this
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="reconciliation-upload-actions" style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="reconciliation-btn reconciliation-btn-secondary"
                      onClick={closeMatchPickerModal}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ),
          document.body
        )}

      {/* Import Modal */}
      {showImportModal && createPortal((
        <div className="reconciliation-modal-overlay">
          <div className="reconciliation-modal-content reconciliation-import-modal-content">
            <div className="reconciliation-modal-header">
              <h3>Import External Statement</h3>
              <button 
                className="reconciliation-modal-close"
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  handleRemoveStatementFile();
                }}
              >
                ×
              </button>
            </div>
            <div className="reconciliation-modal-body">
              {!filters.accountCode && (
                <div className="reconciliation-error-message" style={{ marginBottom: 12 }}>
                  Select an <strong>Account to Reconcile</strong> first (required for uploading statements).
                </div>
              )}
              {statementUploadMessage && (
                <div
                  className="reconciliation-error-message"
                  style={{
                    marginBottom: 12,
                    background: statementUploadMessage.toLowerCase().includes('success')
                      ? '#ecfdf5'
                      : undefined,
                    borderColor: statementUploadMessage.toLowerCase().includes('success')
                      ? '#10b981'
                      : undefined,
                    color: statementUploadMessage.toLowerCase().includes('success')
                      ? '#065f46'
                      : undefined
                  }}
                >
                  {statementUploadMessage}
                </div>
              )}
              <div className="reconciliation-file-upload">
                <input
                  type="file"
                  id="reconciliationStatementFile"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleStatementFileChange}
                  className="reconciliation-file-input"
                />
                <div className="reconciliation-file-info">
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span>{selectedFile.name}</span>
                      <button
                        type="button"
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-danger"
                        onClick={handleRemoveStatementFile}
                        disabled={isUploadingStatement}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    'No file selected'
                  )}
                </div>
              </div>

              {(isPreparingPreview || statementPreviewText || statementPdfPages.length > 0 || statementPreviewRows.length > 0 || statementPreviewError) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Statement preview</div>
                  {isPreparingPreview ? (
                    <div style={{ color: '#6b7280' }}>Preparing preview...</div>
                  ) : statementPreviewError && !showPdfPasswordModal ? (
                    <div className="reconciliation-error-message" style={{ marginBottom: 8 }}>
                      {statementPreviewError}
                    </div>
                  ) : null}
                  {statementPreviewRows.length > 0 ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>
                        Extracted transactions table (preview only)
                      </div>
                      <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #e5e7eb' }}>
                        <table className="reconciliation-table reconciliation-preview-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Transaction Date</th>
                              <th>Transaction Value Date</th>
                              <th>Transaction Type</th>
                              <th>Transaction Description</th>
                              <th>CR/DR</th>
                              <th>Transaction Amount</th>
                              <th>Running Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statementPreviewRows.map((row) => (
                              <tr key={row.id}>
                                <td>{row.transactionDate || '-'}</td>
                                <td>{row.transactionValueDate || '-'}</td>
                                <td>{row.transactionType || '-'}</td>
                                <td>{row.transactionDescription || '-'}</td>
                                <td>{row.crDr || '-'}</td>
                                <td>{formatPreviewAmount(row.transactionAmount)}</td>
                                <td>{formatPreviewAmount(row.runningBalance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                  {statementPdfPages.length > 0 ? (
                    <div
                      style={{
                        maxHeight: 650,
                        overflow: 'auto',
                        borderRadius: 10,
                        border: '1px solid rgba(17,24,39,0.12)',
                        background: '#fff',
                        padding: 10
                      }}
                    >
                      {statementPdfPages.map((page) => (
                        <div key={page.pageNumber} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                            Page {page.pageNumber}
                          </div>
                          <div
                            style={{
                              position: 'relative',
                              width: page.width,
                              height: page.height,
                              background: '#fff',
                              border: '1px solid rgba(17,24,39,0.10)'
                            }}
                          >
                            {page.items.map((it) => (
                              <span
                                key={it.key}
                                style={{
                                  position: 'absolute',
                                  left: it.left,
                                  top: it.top,
                                  fontSize: it.fontSize,
                                  transform: it.angle ? `rotate(${it.angle}rad)` : undefined,
                                  transformOrigin: '0 0',
                                  whiteSpace: 'pre',
                                  color: '#111827'
                                }}
                              >
                                {it.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {statementPreviewText ? (
                    <pre
                      style={{
                        maxHeight: 220,
                        overflow: 'auto',
                        background: '#0b1220',
                        color: '#e5e7eb',
                        padding: 12,
                        borderRadius: 8,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                        lineHeight: 1.4,
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {statementPreviewText}
                    </pre>
                  ) : null}
                </div>
              )}

              <div className="reconciliation-upload-actions">
                <button
                  className="reconciliation-btn reconciliation-btn-success"
                  type="button"
                  onClick={handlePassEntries}
                  disabled={isPassingEntries || statementPreviewRows.length === 0 || !filters.accountCode}
                >
                  {isPassingEntries ? 'Passing Entries...' : 'Pass Entries'}
                </button>
                <button 
                  className="reconciliation-btn"
                  type="button"
                  onClick={handleUploadStatement}
                  disabled={isUploadingStatement || isPassingEntries || !selectedFile || !filters.accountCode}
                >
                  {isUploadingStatement ? 'Uploading...' : 'Upload'}
                </button>
                <button 
                  className="reconciliation-btn reconciliation-btn-secondary"
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    handleRemoveStatementFile();
                  }}
                  disabled={isUploadingStatement || isPassingEntries}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* PDF Password Modal (preview only) */}
      {showImportModal && showPdfPasswordModal && createPortal((
        <div className="reconciliation-modal-overlay">
          <div className="reconciliation-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="reconciliation-modal-header">
              <h3>PDF Password Required</h3>
              <button
                className="reconciliation-modal-close"
                type="button"
                onClick={() => {
                  setShowPdfPasswordModal(false);
                  setPdfPassword('');
                  setPdfImportPassword('');
                  setPdfPasswordError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="reconciliation-modal-body">
              <p style={{ marginTop: 0, color: '#374151' }}>
                This PDF is password protected. Enter the password to preview it.
              </p>
              {pdfPasswordError && (
                <div className="reconciliation-error-message" style={{ marginBottom: 12 }}>
                  {pdfPasswordError}
                </div>
              )}
              <div className="reconciliation-filter-group" style={{ marginBottom: 0 }}>
                <label>Password:</label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setPdfPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePdfPasswordSubmit();
                    }
                  }}
                  placeholder="Enter PDF password"
                />
              </div>
              <div className="reconciliation-upload-actions" style={{ marginTop: 16 }}>
                <button
                  className="reconciliation-btn reconciliation-btn-secondary"
                  type="button"
                  onClick={() => {
                    setShowPdfPasswordModal(false);
                    setPdfPassword('');
                    setPdfImportPassword('');
                    setPdfPasswordError('');
                  }}
                  disabled={isPreparingPreview}
                >
                  Cancel
                </button>
                <button
                  className="reconciliation-btn"
                  type="button"
                  onClick={handlePdfPasswordSubmit}
                  disabled={isPreparingPreview || !pdfPassword.trim()}
                >
                  {isPreparingPreview ? 'Unlocking...' : 'Unlock & Preview'}
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
                The same password will be used when importing this PDF statement.
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Error Display */}
      {error && (
        <div className="reconciliation-error-message">
          {error}
        </div>
      )}
      </div>
    </div>
  );
};

export default AccountReconciliation;
