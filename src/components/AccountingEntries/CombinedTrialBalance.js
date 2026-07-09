import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { trialBalanceAPI, gsecEntriesAPI } from '../../services/api';
import AccountDetailsModal from '../EquityEntries/AccountDetailsModal';
import './Styles/CombinedTrialBalance.css';

/** Map a GSec balance-sheet account entry into the AccountDetailsModal entry shape. */
const mapGsecEntry = (e) => ({
  source: 'GSec',
  ledgerSource: 'gsec',
  lineId: e.id,
  date: e.entry_date,
  description: e.description || '—',
  reference: e.deal_number != null && e.deal_number !== '' ? String(e.deal_number) : '—',
  debit: Number(e.debit_amount) || 0,
  credit: Number(e.credit_amount) || 0,
  transaction_type: [e.account_category, e.currency].filter(Boolean).join(' · ') || 'GSec',
});

/** Map an Equity (trial-balance) account entry into the AccountDetailsModal entry shape. */
const mapEquityEntry = (e) => {
  const isOpening =
    e.entry_source === 'OpeningBalance' ||
    (!!e.description && /opening/i.test(String(e.description)));
  const ledgerSource =
    e.entry_source === 'OtherTransaction'
      ? 'other'
      : e.entry_source === 'GeneralLedger'
        ? 'equity'
        : null;

  return {
    ...e,
    source: isOpening ? 'Opening Balance' : 'Equity',
    ledgerSource: isOpening ? null : ledgerSource,
    lineId: isOpening ? null : e.id,
    transaction_type:
      e.transaction_type ||
      (isOpening ? 'Opening balance' : null) ||
      e.status ||
      '—',
  };
};

/** Sources shown in the table — Opening Balance is never displayed in this column. */
const getDisplaySources = (sources) =>
  Array.from(sources)
    .filter((src) => src !== 'Opening Balance')
    .sort();

/** Comparable timestamp for sorting entries by date (newest first). */
const entryDateValue = (e) => {
  const t = new Date(e.date).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Open-ended bounds used when the user leaves a date field blank, so the screen
 * shows ALL data instead of a current-month default. Each side falls back
 * independently (e.g. start filled + end blank => "from start onwards").
 */
const FULL_RANGE_START = '1900-01-01';
const FULL_RANGE_END = '2999-12-31';

const resolveTrialBalanceDates = (f) => {
  const s =
    f?.startDate != null && String(f.startDate).trim() !== ''
      ? String(f.startDate).trim()
      : FULL_RANGE_START;
  const e =
    f?.endDate != null && String(f.endDate).trim() !== ''
      ? String(f.endDate).trim()
      : FULL_RANGE_END;
  return { startDate: s, endDate: e };
};

const SOURCE_FILTER_LABELS = {
  all: 'All Ledgers',
  equity: 'Equity Activity',
  gsec: 'GSec Activity',
  opening: 'Opening Balance',
};

const IconSearch = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 14l3.5 3.5" />
  </svg>
);

const IconInfo = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeWidth="1.5" d="M10 9v4M10 7h.01" />
  </svg>
);

const IconCheck = () => (
  <svg className="ctb-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg className="ctb-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const IconPdf = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0v3a1 1 0 01-1 1H9a1 1 0 01-1-1V4h4z" clipRule="evenodd" />
  </svg>
);

const IconExcel = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 3v2h2V7H8zm2 4H8v2h2v-2zm4-4h-2v2h2V7zm-2 4h2v2h-2v-2z" clipRule="evenodd" />
  </svg>
);

const IconSpinner = () => (
  <svg className="ctb-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const IconExpand = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3.5 7.5V3.5H7.5M12.5 3.5H16.5V7.5M16.5 12.5V16.5H12.5M7.5 16.5H3.5V12.5" />
  </svg>
);

const IconCollapse = () => (
  <svg className="ctb-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7.5 3.5V7.5H3.5M16.5 7.5H12.5V3.5M12.5 16.5V12.5H16.5M3.5 12.5H7.5V16.5" />
  </svg>
);

const getPeriodLabel = (filters, formatDate) => {
  if (!filters.startDate && !filters.endDate) return 'All dates';
  return `${filters.startDate ? formatDate(filters.startDate) : 'Earliest'} – ${
    filters.endDate ? formatDate(filters.endDate) : 'Latest'
  }`;
};

const CombinedTrialBalance = () => {
  const [equityTB, setEquityTB] = useState(null);
  const [gsecBS, setGsecBS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [appliedFilters, setAppliedFilters] = useState({ startDate: '', endDate: '' });
  const [sourceFilter, setSourceFilter] = useState('all'); // all | equity | gsec
  const [searchTerm, setSearchTerm] = useState('');
  const [showSourcesColumn, setShowSourcesColumn] = useState(true);
  const [reportExpanded, setReportExpanded] = useState(false);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalCode, setAccountModalCode] = useState('');
  const [accountModalData, setAccountModalData] = useState(null);
  const [accountModalError, setAccountModalError] = useState('');
  const [accountModalSourceLabel, setAccountModalSourceLabel] = useState('');

  const appliedFiltersRef = useRef(appliedFilters);
  appliedFiltersRef.current = appliedFilters;

  const filtersArePending =
    filters.startDate !== appliedFilters.startDate || filters.endDate !== appliedFilters.endDate;

  const handleCloseAccountModal = () => {
    setAccountModalOpen(false);
    setAccountModalData(null);
    setAccountModalError('');
    setAccountModalCode('');
    setAccountModalSourceLabel('');
  };

  const handleAccountDrillDown = async (acc, evt) => {
    if (evt) {
      evt.stopPropagation();
    }
    if (!acc?.account_code) return;

    setAccountModalOpen(true);
    setAccountModalCode(acc.account_code);
    setAccountModalData(null);
    setAccountModalError('');

    try {
      const resolved = resolveTrialBalanceDates(appliedFiltersRef.current);
      const queryFilters = { ...appliedFiltersRef.current, startDate: resolved.startDate, endDate: resolved.endDate };

      const [equityRes, gsecRes] = await Promise.all([
        trialBalanceAPI
          .getAccountDetails(acc.account_code, queryFilters)
          .catch((err) => ({ success: false, error: err?.message || 'Equity fetch failed' })),
        gsecEntriesAPI
          .getBalanceSheetAccountDetails(acc.account_code, {
            startDate: resolved.startDate,
            endDate: resolved.endDate,
          })
          .catch((err) => ({ success: false, error: err?.message || 'GSec fetch failed' })),
      ]);

      const equityEntries =
        equityRes?.success && Array.isArray(equityRes?.data?.entries)
          ? equityRes.data.entries.map(mapEquityEntry)
          : [];
      const gsecEntries =
        gsecRes?.success && Array.isArray(gsecRes?.data?.entries)
          ? gsecRes.data.entries.map(mapGsecEntry)
          : [];

      const mergedEntries = [...equityEntries, ...gsecEntries].sort(
        (a, b) => entryDateValue(b) - entryDateValue(a)
      );

      if (
        mergedEntries.length === 0 &&
        equityRes?.success === false &&
        gsecRes?.success === false
      ) {
        throw new Error(
          equityRes?.error || gsecRes?.error || 'Failed to load account details'
        );
      }

      const total_debit = mergedEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
      const total_credit = mergedEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
      const net_balance = total_debit - total_credit;

      const sources = [];
      if (equityEntries.length > 0) sources.push('Equity');
      if (gsecEntries.length > 0) sources.push('GSec');
      const sourceLabel =
        sources.length === 0
          ? 'Combined ledger'
          : `${sources.join(' + ')} ledger${sources.length > 1 ? 's' : ''}`;

      setAccountModalSourceLabel(sourceLabel);
      setAccountModalData({
        accountCode: acc.account_code,
        accountName:
          equityRes?.data?.accountName ||
          gsecRes?.data?.accountName ||
          acc.account_name ||
          '',
        period: {
          startDate: appliedFiltersRef.current.startDate || '',
          endDate: appliedFiltersRef.current.endDate || '',
          portfolio:
            equityRes?.data?.period?.portfolio ||
            (sources.length > 0 ? sources.join(' + ') : 'All Portfolios'),
        },
        entries: mergedEntries,
        totals: {
          total_debit,
          total_credit,
          net_balance,
          balance_type: net_balance > 0 ? 'DR' : net_balance < 0 ? 'CR' : 'ZERO',
        },
      });
    } catch (err) {
      console.error('Combined TB account drill-down:', err);
      setAccountModalError(err.message || 'Failed to load account details');
    }
  };

  const fetchData = async (options = {}) => {
    const { showLoader = true, filtersOverride } = options;
    const active = filtersOverride ?? appliedFiltersRef.current;
    const resolved = resolveTrialBalanceDates(active);
    const queryFilters = { ...active, startDate: resolved.startDate, endDate: resolved.endDate };

    if (filtersOverride) {
      setAppliedFilters({
        startDate: filtersOverride.startDate || '',
        endDate: filtersOverride.endDate || '',
      });
    }

    try {
      if (showLoader || !hasLoadedOnceRef.current) {
        setLoading(true);
      }
      setError('');

      const [tbRes, gsecRes] = await Promise.all([
        trialBalanceAPI.getTrialBalance(queryFilters),
        gsecEntriesAPI.getBalanceSheet({
          startDate: resolved.startDate,
          endDate: resolved.endDate,
        }),
      ]);

      if (!tbRes?.success) {
        throw new Error(tbRes?.error || 'Failed to fetch equity trial balance');
      }
      if (!gsecRes?.success) {
        throw new Error(gsecRes?.error || 'Failed to fetch GSec balance sheet');
      }

      setEquityTB(tbRes.data);
      setGsecBS(gsecRes.data);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.error('Error fetching combined trial balance:', err);
      setError(err.message || 'Failed to fetch combined trial balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ showLoader: true });
    // Initial load only — date changes apply when the user clicks Apply Filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep screen fresh when transactions update elsewhere (tab often stays mounted).
  useEffect(() => {
    const refreshIfVisible = () => {
      if (!document.hidden) {
        fetchData({ showLoader: false });
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);
    const intervalId = window.setInterval(refreshIfVisible, 30000);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!reportExpanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setReportExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [reportExpanded]);

  const handleDateChange = (field, value) => {
    const raw = value != null ? String(value).trim() : '';
    setFilters((prev) => ({
      ...prev,
      [field]: raw,
    }));
  };

  const handleApply = () => {
    fetchData({
      showLoader: true,
      filtersOverride: {
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
      },
    });
  };

  const handleExportPdf = () => {
    setExporting(true);
    setError('');

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(11);
      doc.text('Combined Trial Balance', 40, 34);

      const periodLabel =
        !appliedFilters.startDate && !appliedFilters.endDate
          ? 'Period: All dates'
          : `Period: ${
              appliedFilters.startDate ? formatDate(appliedFilters.startDate) : 'Earliest'
            } - ${appliedFilters.endDate ? formatDate(appliedFilters.endDate) : 'Latest'}`;

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(periodLabel, 40, 50);
      doc.setTextColor(15, 23, 42);

      const head = [
        'Account Code',
        'Account Name',
        'Type / Category',
        'Debit',
        'Credit',
        'Net',
        'DR/CR'
      ];

      const body = filteredAccounts.map((acc) => [
        acc.account_code,
        acc.account_name,
        acc.account_type,
        acc.total_debit > 0 ?         formatCurrency(acc.total_debit) : '-',
        acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '-',
        formatNetBalance(acc.net_balance).text,
        acc.balance_type
      ]);

      const foot = [
        'Totals',
        '',
        '',
        formatCurrency(totals.debit),
        formatCurrency(totals.credit),
        isBalanced ? formatCurrency(0) : netDifferenceDisplay.text,
        isBalanced ? 'BALANCED' : 'OUT OF BALANCE'
      ];

      autoTable(doc, {
        startY: 62,
        theme: 'grid',
        head: [head],
        body,
        foot: [foot],
        showFoot: 'lastPage',
        styles: {
          fontSize: 7,
          cellPadding: 3,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.6
        },
        headStyles: {
          fillColor: [15, 23, 42],
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

      const dateStamp = new Date().toISOString().slice(0, 10);
      doc.save(`combined-trial-balance-${dateStamp}.pdf`);
    } catch (err) {
      console.error('Failed to export combined trial balance PDF:', err);
      setError('Failed to export combined trial balance PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setError('');

    try {
      const resolved = resolveTrialBalanceDates(appliedFilters);
      const blob = await trialBalanceAPI.exportCombinedTrialBalanceExcel({
        startDate: resolved.startDate,
        endDate: resolved.endDate,
        source: sourceFilter,
        search: searchTerm || undefined
      });
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = downloadUrl;
      a.download = `combined-trial-balance-${dateStamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export combined trial balance:', err);
      setError('Failed to export combined trial balance: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    const cleared = { startDate: '', endDate: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setSourceFilter('all');
    setSearchTerm('');
    fetchData({ showLoader: true, filtersOverride: cleared });
  };

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(n);
  };

  /** Absolute balance — no signed/minus display; side used for coloring only. */
  const formatNetBalance = (net) => {
    const n = Number(net) || 0;
    if (Math.abs(n) < 0.005) {
      return { text: '—', side: null };
    }
    const side = n > 0 ? 'DR' : 'CR';
    return { text: formatCurrency(Math.abs(n)), side };
  };

  const formatDate = (dateString) => {
    if (dateString == null || String(dateString).trim() === '') return '';
    const s = String(dateString).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const local = new Date(y, mo - 1, d);
      if (!Number.isNaN(local.getTime())) {
        return local.toLocaleDateString('en-LK');
      }
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-LK');
  };

  const combinedAccounts = useMemo(() => {
    const byCode = new Map();

    const upsert = (key, init, merger) => {
      const existing = byCode.get(key);
      if (existing) {
        merger(existing);
      } else {
        byCode.set(key, init());
      }
    };

    (equityTB?.accounts || []).forEach((a) => {
      const key = String(a.account_code || '').trim();
      if (!key) return;
      const openingDebit = Number(a.opening_debit) || 0;
      const openingCredit = Number(a.opening_credit) || 0;
      const hasOpening = openingDebit > 0.005 || openingCredit > 0.005;
      // If everything for this account came from opening balances, don't show "Equity".
      const totalDebit = Number(a.total_debit) || 0;
      const totalCredit = Number(a.total_credit) || 0;
      const hasEquityActivity =
        totalDebit - openingDebit > 0.005 || totalCredit - openingCredit > 0.005;

      upsert(
        key,
        () => ({
          id: `acct-${key}`,
          account_code: key,
          account_name: a.account_name || '',
          account_type: a.account_type || '',
          total_debit: totalDebit,
          total_credit: totalCredit,
          sources: new Set([
            ...(hasEquityActivity ? ['Equity'] : []),
            ...(hasOpening ? ['Opening Balance'] : []),
          ]),
        }),
        (row) => {
          row.total_debit += totalDebit;
          row.total_credit += totalCredit;
          row.account_name = row.account_name || a.account_name || '';
          row.account_type = row.account_type || a.account_type || '';
          if (hasEquityActivity) row.sources.add('Equity');
          if (hasOpening) row.sources.add('Opening Balance');
        }
      );
    });

    (gsecBS?.accounts || []).forEach((g) => {
      const key = String(g.account_code || '').trim();
      if (!key) return;
      const gsecType = g.account_category || 'GSec';
      upsert(
        key,
        () => ({
          id: `acct-${key}`,
          account_code: key,
          account_name: g.account_name || '',
          account_type: gsecType,
          total_debit: Number(g.total_debit) || 0,
          total_credit: Number(g.total_credit) || 0,
          sources: new Set(['GSec']),
        }),
        (row) => {
          row.total_debit += Number(g.total_debit) || 0;
          row.total_credit += Number(g.total_credit) || 0;
          row.account_name = row.account_name || g.account_name || '';
          if (!row.account_type) {
            row.account_type = gsecType;
          } else if (row.account_type !== gsecType) {
            row.account_type = `${row.account_type} / ${gsecType}`;
          }
          row.sources.add('GSec');
        }
      );
    });

    return Array.from(byCode.values())
      .map((row) => {
        const net = row.total_debit - row.total_credit;
        return {
          ...row,
          net_balance: net,
          balance_type: net > 0.005 ? 'DR' : net < -0.005 ? 'CR' : 'ZERO',
          sources_label: Array.from(row.sources).sort().join(' + '),
        };
      })
      .sort((a, b) =>
        String(a.account_code).localeCompare(String(b.account_code), undefined, {
          numeric: true,
        })
      );
  }, [equityTB, gsecBS]);

  const filteredAccounts = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return combinedAccounts.filter((acc) => {
      if (
        sourceFilter === 'equity' &&
        !(acc.sources.has('Equity') || acc.sources.has('Opening Balance'))
      ) {
        return false;
      }
      if (sourceFilter === 'gsec' && !acc.sources.has('GSec')) return false;
      if (sourceFilter === 'opening' && !acc.sources.has('Opening Balance')) return false;

      if (
        search &&
        !(
          (acc.account_code && acc.account_code.toLowerCase().includes(search)) ||
          (acc.account_name && acc.account_name.toLowerCase().includes(search)) ||
          (acc.account_type && acc.account_type.toLowerCase().includes(search)) ||
          (acc.sources_label && acc.sources_label.toLowerCase().includes(search))
        )
      ) {
        return false;
      }

      return true;
    });
  }, [combinedAccounts, sourceFilter, searchTerm]);

  const totals = filteredAccounts.reduce(
    (acc, a) => {
      acc.debit += a.total_debit || 0;
      acc.credit += a.total_credit || 0;
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  const netDifference = totals.debit - totals.credit;
  const isBalanced = Math.abs(netDifference) < 0.01;
  const periodLabel = getPeriodLabel(appliedFilters, formatDate);
  const netDifferenceDisplay = formatNetBalance(netDifference);

  const renderTrialBalanceTable = () => {
    if (filteredAccounts.length === 0) {
      return (
        <div className="ctb-empty-state">
          <p className="ctb-empty-state__title">No accounts found</p>
          <p className="ctb-empty-state__text">Adjust your date range, ledger filter, or search terms.</p>
        </div>
      );
    }

    return (
      <table className="ctb-grid">
        <thead>
          <tr>
            <th className="ctb-col-code">Account Code</th>
            <th className="ctb-col-name">Account Name</th>
            <th className="ctb-col-type">Type / Category</th>
            <th className="ctb-col-num">Debit</th>
            <th className="ctb-col-num">Credit</th>
            <th className="ctb-col-num">Net</th>
            <th className="ctb-col-drcr">DR / CR</th>
            {showSourcesColumn && <th className="ctb-col-sources">Sources</th>}
          </tr>
        </thead>
        <tbody>
          {filteredAccounts.map((acc, idx) => {
            const netDisplay = formatNetBalance(acc.net_balance);
            return (
              <tr key={acc.id} className={idx % 2 === 1 ? 'ctb-grid__row--alt' : ''}>
                <td
                  className="ctb-col-code ctb-drilldown"
                  onClick={(e) => handleAccountDrillDown(acc, e)}
                  role="button"
                  tabIndex={0}
                  title="View transactions and balances for this account"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountDrillDown(acc, e);
                    }
                  }}
                >
                  <span className="ctb-code">{acc.account_code}</span>
                </td>
                <td
                  className="ctb-col-name ctb-drilldown"
                  onClick={(e) => handleAccountDrillDown(acc, e)}
                  role="button"
                  tabIndex={0}
                  title="View transactions and balances for this account"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountDrillDown(acc, e);
                    }
                  }}
                >
                  {acc.account_name}
                </td>
                <td className="ctb-col-type">{acc.account_type}</td>
                <td className="ctb-col-num">
                  <span className="ctb-amount">
                    {acc.total_debit > 0 ? formatCurrency(acc.total_debit) : '—'}
                  </span>
                </td>
                <td className="ctb-col-num">
                  <span className="ctb-amount">
                    {acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '—'}
                  </span>
                </td>
                <td className="ctb-col-num">
                  <span
                    className={`ctb-amount${
                      netDisplay.side === 'DR'
                        ? ' ctb-amount--debit'
                        : netDisplay.side === 'CR'
                          ? ' ctb-amount--credit'
                          : ''
                    }`}
                  >
                    {netDisplay.text}
                  </span>
                </td>
                <td className="ctb-col-drcr">{acc.balance_type || '—'}</td>
                {showSourcesColumn && (
                  <td className="ctb-col-sources">
                    <div className="ctb-source-badges">
                      {getDisplaySources(acc.sources).map((src) => (
                        <span key={src} className="ctb-source-badge" data-source={src}>
                          {src}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="ctb-grid__totals">
            <td colSpan={3} className="ctb-totals-label">Totals</td>
            <td className="ctb-col-num">
              <span className="ctb-amount ctb-amount--emphasis">{formatCurrency(totals.debit)}</span>
            </td>
            <td className="ctb-col-num">
              <span className="ctb-amount ctb-amount--emphasis">{formatCurrency(totals.credit)}</span>
            </td>
            <td className="ctb-col-num">
              <span
                className={`ctb-amount ctb-amount--emphasis${
                  isBalanced
                    ? ''
                    : netDifferenceDisplay.side === 'DR'
                      ? ' ctb-amount--debit'
                      : ' ctb-amount--credit'
                }`}
              >
                {isBalanced ? formatCurrency(0) : netDifferenceDisplay.text}
              </span>
            </td>
            <td className={`ctb-col-drcr ctb-totals-status${isBalanced ? ' ctb-totals-status--ok' : ' ctb-totals-status--warn'}`}>
              {isBalanced ? 'Balanced' : 'Out of Balance'}
            </td>
            {showSourcesColumn && <td className="ctb-col-sources" />}
          </tr>
        </tfoot>
      </table>
    );
  };

  if (loading) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-loading-state">
          <IconSpinner />
          <p>Loading Combined Trial Balance…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-error">
          <div className="ctb-error-title">Error loading Combined Trial Balance</div>
          <div className="ctb-error-message">{error}</div>
          <button type="button" className="ctb-retry-btn" onClick={() => fetchData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ctb-page-container">
      <div className="ctb-content-wrapper">
        <header className="ctb-masthead">
          <div className="ctb-masthead__primary">
            <p className="ctb-eyebrow">Financial Reporting</p>
            <h1 className="ctb-main-title">Combined Trial Balance</h1>
            <p className="ctb-subtitle">
              Unified account balances across Equity and GSec ledgers with drill-down to underlying entries.
            </p>
          </div>
          <div className="ctb-masthead__meta">
            <div className="ctb-meta-chip">
              <span className="ctb-meta-chip__label">Reporting Period</span>
              <span className="ctb-meta-chip__value">{periodLabel}</span>
            </div>
            <div className="ctb-meta-chip">
              <span className="ctb-meta-chip__label">Ledger Scope</span>
              <span className="ctb-meta-chip__value">{SOURCE_FILTER_LABELS[sourceFilter] || 'All Ledgers'}</span>
            </div>
            <div className="ctb-meta-chip">
              <span className="ctb-meta-chip__label">Accounts</span>
              <span className="ctb-meta-chip__value">{filteredAccounts.length}</span>
            </div>
          </div>
        </header>

        <section className="ctb-toolbar" aria-label="Report filters">
          <div className="ctb-toolbar__row">
            <div className="ctb-field">
              <label className="ctb-field__label" htmlFor="ctb-start-date">Start Date</label>
              <input
                id="ctb-start-date"
                type="date"
                lang="en-US"
                className="ctb-field__input"
                value={filters.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="ctb-field">
              <label className="ctb-field__label" htmlFor="ctb-end-date">End Date</label>
              <input
                id="ctb-end-date"
                type="date"
                lang="en-US"
                className="ctb-field__input"
                value={filters.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
            <div className="ctb-field">
              <label className="ctb-field__label" htmlFor="ctb-source-filter">Activity In</label>
              <select
                id="ctb-source-filter"
                className="ctb-field__select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Ledgers</option>
                <option value="equity">With Equity Activity</option>
                <option value="gsec">With GSec Activity</option>
                <option value="opening">With Opening Balance</option>
              </select>
            </div>
            <div className="ctb-field ctb-field--search">
              <label className="ctb-field__label" htmlFor="ctb-search">Search</label>
              <div className="ctb-search-wrap">
                <span className="ctb-search-icon" aria-hidden="true"><IconSearch /></span>
                <input
                  id="ctb-search"
                  type="search"
                  className="ctb-field__input"
                  placeholder="Account code, name, type, or ledger…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="ctb-toolbar__actions">
              <button
                type="button"
                className={`ctb-btn ctb-btn--primary${filtersArePending ? ' ctb-btn--primary-pending' : ''}`}
                onClick={handleApply}
              >
                Apply Filters
              </button>
              <button type="button" className="ctb-btn ctb-btn--ghost" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
          {filtersArePending && (
            <p className="ctb-toolbar__hint" role="status">
              Date range updated. Click <strong>Apply Filters</strong> to refresh the report.
            </p>
          )}
        </section>

        <div
          className={`ctb-status-banner ${isBalanced ? 'ctb-status-banner--balanced' : 'ctb-status-banner--unbalanced'}`}
          role="status"
        >
          <div className="ctb-status-banner__lead">
            <span
              className={`ctb-status-banner__indicator ${isBalanced ? 'ctb-status-banner__indicator--ok' : 'ctb-status-banner__indicator--warn'}`}
              aria-hidden="true"
            >
              {isBalanced ? <IconCheck /> : <IconAlert />}
            </span>
            <div>
              <p className="ctb-status-banner__title">
                {isBalanced ? 'Trial Balance Reconciled' : 'Trial Balance Out of Balance'}
              </p>
              <p className="ctb-status-banner__text">
                {isBalanced
                  ? 'Total debits and credits are in agreement for the selected period and filters.'
                  : 'Debits and credits do not reconcile. Review underlying entries before closing the period.'}
              </p>
            </div>
          </div>
          <div className="ctb-status-banner__metrics">
            <div className="ctb-metric">
              <span className="ctb-metric__label">Total Debits</span>
              <span className="ctb-metric__value ctb-amount">{formatCurrency(totals.debit)}</span>
            </div>
            <div className="ctb-metric">
              <span className="ctb-metric__label">Total Credits</span>
              <span className="ctb-metric__value ctb-amount">{formatCurrency(totals.credit)}</span>
            </div>
            <div className="ctb-metric">
              <span className="ctb-metric__label">Net Balance</span>
              <span
                className={`ctb-metric__value ctb-amount${
                  isBalanced
                    ? ''
                    : netDifferenceDisplay.side === 'DR'
                      ? ' ctb-amount--debit'
                      : ' ctb-amount--credit'
                }`}
              >
                {isBalanced ? formatCurrency(0) : netDifferenceDisplay.text}
              </span>
            </div>
            <div className="ctb-metric">
              <span className="ctb-metric__label">Status</span>
              <span className={`ctb-metric__value ${isBalanced ? 'ctb-status-pill--ok' : 'ctb-status-pill--warn'}`}>
                {isBalanced ? 'Balanced' : 'Out of Balance'}
              </span>
            </div>
          </div>
        </div>

        <section className="ctb-report" aria-label="Combined Trial Balance report">
          <div className="ctb-report__header">
            <div className="ctb-report__heading">
              <h2 className="ctb-report__title">Combined Trial Balance</h2>
              <p className="ctb-report__meta">
                {periodLabel} · {SOURCE_FILTER_LABELS[sourceFilter] || 'All Ledgers'} · {filteredAccounts.length} accounts
              </p>
            </div>
            <div className="ctb-report__actions">
              <button
                type="button"
                className={`ctb-btn ctb-btn--sources${showSourcesColumn ? ' ctb-btn--sources-active' : ''}`}
                onClick={() => setShowSourcesColumn((prev) => !prev)}
                aria-pressed={showSourcesColumn}
                title={showSourcesColumn ? 'Hide Sources column' : 'Show Sources column'}
              >
                Sources
              </button>
              <button
                type="button"
                className="ctb-btn ctb-btn--export"
                onClick={() => setReportExpanded(true)}
                title="Expand trial balance"
              >
                <IconExpand />
                <span>Expand</span>
              </button>
              <button
                type="button"
                className="ctb-btn ctb-btn--export"
                onClick={handleExportPdf}
                disabled={exporting}
              >
                {exporting ? <IconSpinner /> : <IconPdf />}
                <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
              </button>
              <button
                type="button"
                className="ctb-btn ctb-btn--export"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? <IconSpinner /> : <IconExcel />}
                <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
              </button>
            </div>
          </div>

          <div className="ctb-info-banner" role="note">
            <span className="ctb-info-banner__icon" aria-hidden="true"><IconInfo /></span>
            <p className="ctb-info-banner__text">
              Click an <strong>account code</strong> or <strong>account name</strong> to view every entry for that
              account. Equity GL, other transactions, opening balances, and GSec entries are interleaved and tagged
              with their source ledger.
            </p>
          </div>

          <div className="ctb-table-wrap">
            {renderTrialBalanceTable()}
          </div>
        </section>
      </div>

      {reportExpanded &&
        createPortal(
          <div
            className="ctb-expand-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded Combined Trial Balance"
            onClick={() => setReportExpanded(false)}
          >
            <div
              className="ctb-expand-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ctb-expand-modal__header">
                <div className="ctb-expand-modal__heading">
                  <h2 className="ctb-expand-modal__title">Combined Trial Balance</h2>
                  <p className="ctb-expand-modal__meta">
                    {periodLabel} · {SOURCE_FILTER_LABELS[sourceFilter] || 'All Ledgers'} · {filteredAccounts.length} accounts
                  </p>
                </div>
                <div className="ctb-expand-modal__actions">
                  <button
                    type="button"
                    className={`ctb-btn ctb-btn--sources${showSourcesColumn ? ' ctb-btn--sources-active' : ''}`}
                    onClick={() => setShowSourcesColumn((prev) => !prev)}
                    aria-pressed={showSourcesColumn}
                    title={showSourcesColumn ? 'Hide Sources column' : 'Show Sources column'}
                  >
                    Sources
                  </button>
                  <button
                    type="button"
                    className="ctb-btn ctb-btn--export"
                    onClick={handleExportPdf}
                    disabled={exporting}
                  >
                    {exporting ? <IconSpinner /> : <IconPdf />}
                    <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
                  </button>
                  <button
                    type="button"
                    className="ctb-btn ctb-btn--export"
                    onClick={handleExportExcel}
                    disabled={exporting}
                  >
                    {exporting ? <IconSpinner /> : <IconExcel />}
                    <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
                  </button>
                  <button
                    type="button"
                    className="ctb-btn ctb-btn--export"
                    onClick={() => setReportExpanded(false)}
                    title="Close expanded view"
                  >
                    <IconCollapse />
                    <span>Close</span>
                  </button>
                </div>
              </div>
              <div className="ctb-expand-modal__body">
                {renderTrialBalanceTable()}
              </div>
            </div>
          </div>,
          document.body
        )}

      <AccountDetailsModal
        isOpen={accountModalOpen}
        onClose={handleCloseAccountModal}
        accountCode={accountModalCode}
        accountData={accountModalData}
        loadError={accountModalError}
        detailSource={accountModalSourceLabel}
        softHeader
        onNavigateAccount={(code) =>
          handleAccountDrillDown({ account_code: code, account_name: '' })
        }
      />
    </div>
  );
};

export default CombinedTrialBalance;

