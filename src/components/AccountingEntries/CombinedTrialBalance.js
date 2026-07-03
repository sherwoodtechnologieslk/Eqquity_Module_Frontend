import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const CombinedTrialBalance = () => {
  const [equityTB, setEquityTB] = useState(null);
  const [gsecBS, setGsecBS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [sourceFilter, setSourceFilter] = useState('all'); // all | equity | gsec
  const [searchTerm, setSearchTerm] = useState('');

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalCode, setAccountModalCode] = useState('');
  const [accountModalData, setAccountModalData] = useState(null);
  const [accountModalError, setAccountModalError] = useState('');
  const [accountModalSourceLabel, setAccountModalSourceLabel] = useState('');

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

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
      const resolved = resolveTrialBalanceDates(filters);
      const queryFilters = { ...filters, startDate: resolved.startDate, endDate: resolved.endDate };

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
          startDate: filters.startDate || '',
          endDate: filters.endDate || '',
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
    const active = filtersOverride ?? filtersRef.current;
    const resolved = resolveTrialBalanceDates(active);
    const queryFilters = { ...active, startDate: resolved.startDate, endDate: resolved.endDate };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

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

  const handleDateChange = (field, value) => {
    const raw = value != null ? String(value).trim() : '';
    setFilters((prev) => ({
      ...prev,
      [field]: raw,
    }));
  };

  const handleApply = () => {
    fetchData({ showLoader: true });
  };

  const handleExportPdf = () => {
    setExporting(true);
    setError('');

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(11);
      doc.text('Combined Trial Balance', 40, 34);

      const periodLabel =
        !filters.startDate && !filters.endDate
          ? 'Period: All dates'
          : `Period: ${
              filters.startDate ? formatDate(filters.startDate) : 'Earliest'
            } - ${filters.endDate ? formatDate(filters.endDate) : 'Latest'}`;

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
        acc.total_debit > 0 ? formatCurrency(acc.total_debit) : '-',
        acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '-',
        formatCurrency(acc.net_balance),
        acc.balance_type
      ]);

      const foot = [
        'Totals',
        '',
        '',
        formatCurrency(totals.debit),
        formatCurrency(totals.credit),
        formatCurrency(netDifference),
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
      const resolved = resolveTrialBalanceDates(filters);
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
    setFilters({ startDate: '', endDate: '' });
    setSourceFilter('all');
    setSearchTerm('');
  };

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(n);
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

  if (loading) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-loading">Loading Combined Trial Balance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-error">
          <div className="ctb-error-title">Error loading Combined Trial Balance</div>
          <div className="ctb-error-message">{error}</div>
          <button className="ctb-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ctb-page-container">
      <div className="ctb-content-wrapper">
        {/* Header */}
        <div className="ctb-header-section">
          <div className="ctb-header-text-group">
            <h1 className="ctb-main-title">Combined Trial Balance</h1>
            <p className="ctb-subtitle">
              One unified row per account across the Equity and GSec ledgers. Click an account to
              see every underlying entry, tagged with the ledger it came from.
            </p>
          </div>
          <div className="ctb-header-meta">
            <div className="ctb-period">
              Period:&nbsp;
              <span>
                {!filters.startDate && !filters.endDate
                  ? 'All dates'
                  : `${filters.startDate ? formatDate(filters.startDate) : 'Earliest'} - ${
                      filters.endDate ? formatDate(filters.endDate) : 'Latest'
                    }`}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ctb-filters-card">
          <div className="ctb-filters-content">
            <div className="ctb-filters-grid">
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Start Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filters.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">End Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Activity In</label>
                <select
                  className="ctb-filter-select"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All Ledgers</option>
                  <option value="equity">With Equity Activity</option>
                  <option value="gsec">With GSec Activity</option>
                  <option value="opening">With Opening Balance</option>
                </select>
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Search</label>
                <input
                  type="text"
                  className="ctb-filter-input"
                  placeholder="Account code, name, type, or ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="ctb-filter-group ctb-filter-actions">
                <button className="ctb-apply-btn" onClick={handleApply}>
                  Apply
                </button>
                <button className="ctb-clear-btn" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Balance status */}
        <div className={`ctb-balance-status ${isBalanced ? 'ctb-balanced' : 'ctb-unbalanced'}`}>
          <span className="ctb-status-text">
            {isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}
          </span>
          <span className="ctb-status-details">
            Total Debits: {formatCurrency(totals.debit)} | Total Credits:{' '}
            {formatCurrency(totals.credit)} | Net (DR − CR):{' '}
            {formatCurrency(netDifference)} | Accounts: {filteredAccounts.length}
          </span>
        </div>

        {/* Table */}
        <div className="ctb-table-card">
          <div className="ctb-card-header ctb-table-header">
            <h2 className="ctb-card-title">Combined Trial Balance</h2>
            <div className="ctb-export-actions">
              <button className="ctb-export-btn" onClick={handleExportPdf} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export to PDF'}
              </button>
              <button className="ctb-export-btn" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export to Excel'}
              </button>
            </div>
          </div>
          <p className="ctb-table-hint">
            Click an <strong>account code</strong> or <strong>account name</strong> to view every
            entry for that account (Equity GL, other transactions, opening balances and GSec
            entries are interleaved and tagged with their source).
          </p>
          <div className="ctb-table-container">
            {filteredAccounts.length === 0 ? (
              <div className="ctb-no-data">
                No accounts found for the selected filters.
              </div>
            ) : (
              <table className="ctb-data-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Type / Category</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Net</th>
                    <th>DR / CR</th>
                    <th className="ctb-sources-header">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="ctb-row">
                      <td
                        className="ctb-account-code ctb-account-drilldown"
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
                        {acc.account_code}
                      </td>
                      <td
                        className="ctb-account-name ctb-account-drilldown"
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
                      <td className="ctb-account-type">{acc.account_type}</td>
                      <td className="ctb-debit">
                        {acc.total_debit > 0 ? formatCurrency(acc.total_debit) : '-'}
                      </td>
                      <td className="ctb-credit">
                        {acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '-'}
                      </td>
                      <td
                        className={`ctb-net-balance${
                          acc.net_balance > 0.005
                            ? ' positive'
                            : acc.net_balance < -0.005
                              ? ' negative'
                              : ''
                        }`}
                      >
                        {Math.abs(acc.net_balance) < 0.005
                          ? '—'
                          : formatCurrency(acc.net_balance)}
                      </td>
                      <td className="ctb-balance-type-cell">
                        {acc.balance_type || '—'}
                      </td>
                      <td className="ctb-sources-cell">
                        <div className="ctb-sources-pills">
                          {getDisplaySources(acc.sources).map((src) => (
                            <span key={src} className="ctb-source" data-source={src}>
                              {src}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="ctb-totals-row">
                    <td colSpan={3} className="ctb-totals-label">
                      Totals
                    </td>
                    <td className="ctb-debit">{formatCurrency(totals.debit)}</td>
                    <td className="ctb-credit">{formatCurrency(totals.credit)}</td>
                    <td
                      className={`ctb-net-balance${
                        netDifference > 0.005
                          ? ' positive'
                          : netDifference < -0.005
                            ? ' negative'
                            : ''
                      }`}
                    >
                      {formatCurrency(netDifference)}
                    </td>
                    <td className="ctb-balance-type-cell">
                      {isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}
                    </td>
                    <td className="ctb-sources-cell" />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

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

