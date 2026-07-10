import React, { useEffect, useMemo, useState } from 'react';
import { generalLedgerAPI, gsecEntriesAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Styles/CombinedGL.css';

const SOURCE_FILTER_LABELS = {
  all: 'All Ledgers',
  equity: 'Equity Only',
  gsec: 'GSec Only',
};

const getPeriodLabel = (filters, formatDate) => {
  if (!filters.dateFrom && !filters.dateTo) return 'All dates';
  return `${filters.dateFrom ? formatDate(filters.dateFrom) : 'Earliest'} – ${
    filters.dateTo ? formatDate(filters.dateTo) : 'Latest'
  }`;
};

const IconSearch = () => (
  <svg className="cgl-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 14l3.5 3.5" />
  </svg>
);

const IconInfo = () => (
  <svg className="cgl-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeWidth="1.5" d="M10 9v4M10 7h.01" />
  </svg>
);

const IconCheck = () => (
  <svg className="cgl-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg className="cgl-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const IconPdf = () => (
  <svg className="cgl-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0v3a1 1 0 01-1 1H9a1 1 0 01-1-1V4h4z" clipRule="evenodd" />
  </svg>
);

const IconExcel = () => (
  <svg className="cgl-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 3v2h2V7H8zm2 4H8v2h2v-2zm4-4h-2v2h2V7zm-2 4h2v2h-2v-2z" clipRule="evenodd" />
  </svg>
);

const IconSpinner = () => (
  <svg className="cgl-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const CombinedGL = ({ onTabChange }) => {
  const [equityEntries, setEquityEntries] = useState([]);
  const [gsecEntries, setGsecEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    source: 'all',
    account_code: '',
    dateFrom: '',
    dateTo: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(25);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');

      const [equityData, gsecData] = await Promise.all([
        generalLedgerAPI.getAllEntries(null),
        gsecEntriesAPI.getSavedLedgerEntries(null),
      ]);

      setEquityEntries(Array.isArray(equityData) ? equityData : []);
      setGsecEntries(Array.isArray(gsecData) ? gsecData : []);
    } catch (err) {
      console.error('Error fetching combined GL data:', err);
      setLoadError(err.message || 'Failed to fetch combined general ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      source: 'all',
      account_code: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const combinedEntries = useMemo(() => {
    const equityNormalized = equityEntries.map((e) => ({
      id: `equity-${e.id}`,
      source: 'Equity',
      date: e.date,
      account_code: e.account_code,
      account_name: e.account_name,
      description: e.description,
      reference: e.reference,
      debit: Number(e.debit) || 0,
      credit: Number(e.credit) || 0,
      balance: typeof e.balance === 'number' ? e.balance : (Number(e.debit) || 0) - (Number(e.credit) || 0),
      transaction_type: e.transaction_type,
      status: e.status,
    }));

    const gsecNormalized = gsecEntries.map((g) => ({
      id: `gsec-${g.id}`,
      source: 'GSec',
      date: g.entry_date,
      account_code: g.account_code,
      account_name: g.account_name,
      description: g.description,
      reference: g.deal_number,
      debit: Number(g.debit_amount) || 0,
      credit: Number(g.credit_amount) || 0,
      balance: (Number(g.debit_amount) || 0) - (Number(g.credit_amount) || 0),
      transaction_type: g.transaction_code || 'GSec',
      status: '',
    }));

    return [...equityNormalized, ...gsecNormalized];
  }, [equityEntries, gsecEntries]);

  const filteredEntries = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return combinedEntries.filter((entry) => {
      if (filters.source === 'equity' && entry.source !== 'Equity') return false;
      if (filters.source === 'gsec' && entry.source !== 'GSec') return false;

      if (filters.account_code && !(entry.account_code || '').includes(filters.account_code)) {
        return false;
      }

      const dateKey = normalizeDate(entry.date);
      if (filters.dateFrom && (!dateKey || dateKey < filters.dateFrom)) return false;
      if (filters.dateTo && (!dateKey || dateKey > filters.dateTo)) return false;

      if (
        search &&
        !(
          (entry.account_code && entry.account_code.toLowerCase().includes(search)) ||
          (entry.account_name && entry.account_name.toLowerCase().includes(search)) ||
          (entry.description && entry.description.toLowerCase().includes(search)) ||
          (entry.reference && entry.reference.toLowerCase().includes(search)) ||
          (entry.source && entry.source.toLowerCase().includes(search))
        )
      ) {
        return false;
      }

      return true;
    });
  }, [combinedEntries, filters, searchTerm]);

  const totalDebits = filteredEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const netBalance = totalCredits - totalDebits;
  const isBalanced = Math.abs(netBalance) < 0.01;

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage) || 1;

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(n);
  };

  const formatLedgerAmount = (amount) => {
    const n = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return `LKR ${formatted}`;
  };

  const formatDateDisplay = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-LK');
  };

  const formatNumber = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const periodLabel = getPeriodLabel(filters, formatDateDisplay);

  const handleExportPdf = async () => {
    setExporting(true);
    setActionMessage('');
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const stamp = new Date().toISOString().slice(0, 10);

      doc.setFontSize(16);
      doc.text('Combined General Ledger', 40, 40);
      doc.setFontSize(10);
      doc.text(`Export date: ${stamp}`, 40, 58);

      const filterSummary = [
        filters.source ? `Source=${filters.source}` : null,
        filters.account_code ? `Account=${filters.account_code}` : null,
        filters.dateFrom ? `From=${filters.dateFrom}` : null,
        filters.dateTo ? `To=${filters.dateTo}` : null,
        searchTerm ? `Search="${searchTerm}"` : null,
      ].filter(Boolean).join('  •  ');
      if (filterSummary) {
        doc.text(filterSummary, 40, 74);
      }

      const rows = filteredEntries.map((e) => ([
        formatDateDisplay(e.date) || '',
        e.account_code || '',
        e.account_name || '',
        e.description || '',
        e.reference || '',
        formatNumber(e.debit),
        formatNumber(e.credit),
        formatNumber(e.balance),
        e.transaction_type || '',
        e.status || '',
        e.source || '',
      ]));

      autoTable(doc, {
        startY: filterSummary ? 92 : 80,
        head: [[
          'Date',
          'Account Code',
          'Account Name',
          'Description',
          'Reference',
          'Debit',
          'Credit',
          'Balance',
          'Type',
          'Status',
          'Sources',
        ]],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 40, right: 40 },
      });

      doc.save(`combined-general-ledger-${stamp}.pdf`);
    } catch (err) {
      console.error('Failed to export combined GL PDF:', err);
      setActionMessage('Failed to export PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setActionMessage('');
    try {
      const stamp = new Date().toISOString().slice(0, 10);

      const data = filteredEntries.map((e) => ({
        Date: formatDateDisplay(e.date) || '',
        AccountCode: e.account_code || '',
        AccountName: e.account_name || '',
        Description: e.description || '',
        Reference: e.reference || '',
        Debit: Number(e.debit) || 0,
        Credit: Number(e.credit) || 0,
        Balance: Number(e.balance) || 0,
        Type: e.transaction_type || '',
        Status: e.status || '',
        Sources: e.source || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 28 },
        { wch: 40 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CombinedGL');
      XLSX.writeFile(wb, `combined-general-ledger-${stamp}.xlsx`);
    } catch (err) {
      console.error('Failed to export combined GL Excel:', err);
      setActionMessage('Failed to export Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleSourceNavigate = (entry) => {
    if (!onTabChange) return;
    if (entry.source === 'Equity') {
      onTabChange('General Ledger');
    } else if (entry.source === 'GSec') {
      onTabChange('GSec General Ledger');
    }
  };

  if (loading) {
    return (
      <div className="cgl-page-container">
        <div className="cgl-loading-state">
          <IconSpinner />
          <p>Loading Combined General Ledger…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="cgl-page-container">
        <div className="cgl-error-state">
          <p className="cgl-error-state__title">Unable to load Combined General Ledger</p>
          <p className="cgl-error-state__text">{loadError}</p>
          <button type="button" className="cgl-btn cgl-btn--primary" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cgl-page-container">
      <div className="cgl-content-wrapper">
        <header className="cgl-masthead">
          <div className="cgl-masthead__primary">
            <p className="cgl-eyebrow">Financial Reporting</p>
            <h1 className="cgl-main-title">Combined General Ledger</h1>
            <p className="cgl-subtitle">
              Unified line-level view of Equity and GSec ledger entries with filtering, export, and source navigation.
            </p>
          </div>
          <div className="cgl-masthead__meta">
            <div className="cgl-meta-chip">
              <span className="cgl-meta-chip__label">Reporting Period</span>
              <span className="cgl-meta-chip__value">{periodLabel}</span>
            </div>
            <div className="cgl-meta-chip">
              <span className="cgl-meta-chip__label">Ledger Scope</span>
              <span className="cgl-meta-chip__value">{SOURCE_FILTER_LABELS[filters.source] || 'All Ledgers'}</span>
            </div>
            <div className="cgl-meta-chip">
              <span className="cgl-meta-chip__label">Entries</span>
              <span className="cgl-meta-chip__value">{filteredEntries.length.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <section className="cgl-toolbar" aria-label="Ledger filters">
          <div className="cgl-toolbar__row cgl-toolbar__row--primary">
            <div className="cgl-field">
              <label className="cgl-field__label" htmlFor="cgl-source">Ledger Source</label>
              <select
                id="cgl-source"
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                className="cgl-field__select"
              >
                <option value="all">All Ledgers</option>
                <option value="equity">Equity Only</option>
                <option value="gsec">GSec Only</option>
              </select>
            </div>

            <div className="cgl-field">
              <label className="cgl-field__label" htmlFor="cgl-account">Account Code</label>
              <input
                id="cgl-account"
                type="text"
                name="account_code"
                value={filters.account_code}
                onChange={handleFilterChange}
                className="cgl-field__input"
                placeholder="Filter by code"
              />
            </div>

            <div className="cgl-field">
              <label className="cgl-field__label" htmlFor="cgl-date-from">Date From</label>
              <input
                id="cgl-date-from"
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="cgl-field__input"
              />
            </div>

            <div className="cgl-field">
              <label className="cgl-field__label" htmlFor="cgl-date-to">Date To</label>
              <input
                id="cgl-date-to"
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="cgl-field__input"
              />
            </div>
          </div>

          <div className="cgl-toolbar__row cgl-toolbar__row--secondary">
            <div className="cgl-field cgl-field--search">
              <label className="cgl-field__label" htmlFor="cgl-search">Search</label>
              <div className="cgl-search-wrap">
                <span className="cgl-search-icon" aria-hidden="true"><IconSearch /></span>
                <input
                  id="cgl-search"
                  type="search"
                  className="cgl-field__input"
                  placeholder="Account code, name, description, reference, or source…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="cgl-toolbar__actions">
              <button type="button" className="cgl-btn cgl-btn--ghost" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
        </section>

        <div
          className={`cgl-status-banner ${isBalanced ? 'cgl-status-banner--balanced' : 'cgl-status-banner--unbalanced'}`}
          role="status"
        >
          <div className="cgl-status-banner__lead">
            <span
              className={`cgl-status-banner__indicator ${isBalanced ? 'cgl-status-banner__indicator--ok' : 'cgl-status-banner__indicator--warn'}`}
              aria-hidden="true"
            >
              {isBalanced ? <IconCheck /> : <IconAlert />}
            </span>
            <div>
              <p className="cgl-status-banner__title">
                {isBalanced ? 'Ledger Totals Reconciled' : 'Ledger Totals Out of Balance'}
              </p>
              <p className="cgl-status-banner__text">
                {isBalanced
                  ? 'Total debits and credits agree for the current filter selection.'
                  : 'Filtered debits and credits do not reconcile. Review underlying entries.'}
              </p>
            </div>
          </div>
          <div className="cgl-status-banner__metrics">
            <div className="cgl-metric">
              <span className="cgl-metric__label">Total Entries</span>
              <span className="cgl-metric__value">{filteredEntries.length.toLocaleString()}</span>
            </div>
            <div className="cgl-metric">
              <span className="cgl-metric__label">Total Debits</span>
              <span className="cgl-metric__value cgl-amount cgl-amount--debit">{formatCurrency(totalDebits)}</span>
            </div>
            <div className="cgl-metric">
              <span className="cgl-metric__label">Total Credits</span>
              <span className="cgl-metric__value cgl-amount cgl-amount--credit">{formatCurrency(totalCredits)}</span>
            </div>
            <div className="cgl-metric">
              <span className="cgl-metric__label">Net Difference</span>
              <span className={`cgl-metric__value cgl-amount ${netBalance >= 0 ? 'cgl-amount--credit' : 'cgl-amount--debit'}`}>
                {formatCurrency(Math.abs(netBalance))}
              </span>
            </div>
            <div className="cgl-metric">
              <span className="cgl-metric__label">Status</span>
              <span className={`cgl-metric__value ${isBalanced ? 'cgl-status-pill--ok' : 'cgl-status-pill--warn'}`}>
                {isBalanced ? 'Balanced' : 'Out of Balance'}
              </span>
            </div>
          </div>
        </div>

        <section className="cgl-report" aria-label="Combined General Ledger report">
          <div className="cgl-report__header">
            <div className="cgl-report__heading">
              <h2 className="cgl-report__title">Ledger Entries</h2>
              <p className="cgl-report__meta">
                {periodLabel} · {SOURCE_FILTER_LABELS[filters.source] || 'All Ledgers'} ·{' '}
                {filteredEntries.length.toLocaleString()} records
                {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ''}
              </p>
            </div>
            <div className="cgl-report__actions">
              <button
                type="button"
                className="cgl-btn cgl-btn--export"
                onClick={handleExportPdf}
                disabled={exporting || filteredEntries.length === 0}
                title="Export current filtered ledger to PDF"
              >
                {exporting ? <IconSpinner /> : <IconPdf />}
                <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
              </button>
              <button
                type="button"
                className="cgl-btn cgl-btn--export"
                onClick={handleExportExcel}
                disabled={exporting || filteredEntries.length === 0}
                title="Export current filtered ledger to Excel"
              >
                {exporting ? <IconSpinner /> : <IconExcel />}
                <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="cgl-action-banner" role="alert">
              {actionMessage}
            </div>
          )}

          <div className="cgl-info-banner" role="note">
            <span className="cgl-info-banner__icon" aria-hidden="true"><IconInfo /></span>
            <p className="cgl-info-banner__text">
              <strong>Source navigation:</strong> click an Equity or GSec badge in the Sources column to open the dedicated ledger screen.
            </p>
          </div>

          <div className="cgl-table-wrap">
            {filteredEntries.length === 0 ? (
              <div className="cgl-empty-state">
                <p className="cgl-empty-state__title">No ledger entries found</p>
                <p className="cgl-empty-state__text">Adjust your date range, ledger filter, account code, or search terms.</p>
              </div>
            ) : (
              <table className="cgl-grid">
                <thead>
                  <tr>
                    <th className="cgl-col-date">Date</th>
                    <th className="cgl-col-code">Account Code</th>
                    <th className="cgl-col-name">Account Name</th>
                    <th className="cgl-col-desc">Description</th>
                    <th className="cgl-col-ref">Reference</th>
                    <th className="cgl-col-amount">Debit (LKR)</th>
                    <th className="cgl-col-amount">Credit (LKR)</th>
                    <th className="cgl-col-num">Balance (LKR)</th>
                    <th className="cgl-col-type">Type</th>
                    <th className="cgl-col-status">Status</th>
                    <th className="cgl-col-sources">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry, idx) => (
                    <tr key={entry.id} className={idx % 2 === 1 ? 'cgl-grid__row--alt' : ''}>
                      <td className="cgl-col-date">{formatDateDisplay(entry.date)}</td>
                      <td className="cgl-col-code">
                        <span className="cgl-code">{entry.account_code}</span>
                      </td>
                      <td className="cgl-col-name">{entry.account_name}</td>
                      <td className="cgl-col-desc">{entry.description}</td>
                      <td className="cgl-col-ref">{entry.reference}</td>
                      <td className="cgl-col-amount">
                        {entry.debit > 0 ? formatLedgerAmount(entry.debit) : '-'}
                      </td>
                      <td className="cgl-col-amount">
                        {entry.credit > 0 ? formatLedgerAmount(entry.credit) : '-'}
                      </td>
                      <td className="cgl-col-num">
                        <span className={`cgl-amount ${entry.balance >= 0 ? 'cgl-amount--debit' : 'cgl-amount--credit'}`}>
                          {formatLedgerAmount(Math.abs(entry.balance))}
                        </span>
                      </td>
                      <td className="cgl-col-type">{entry.transaction_type}</td>
                      <td className="cgl-col-status">
                        {entry.source === 'Equity' ? entry.status || '—' : 'GSec'}
                      </td>
                      <td className="cgl-col-sources">
                        <button
                          type="button"
                          className="cgl-source-link"
                          onClick={() => handleSourceNavigate(entry)}
                          disabled={!onTabChange}
                          title={onTabChange ? `Open ${entry.source} General Ledger` : undefined}
                        >
                          <span className="cgl-source-badge" data-source={entry.source}>
                            {entry.source}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredEntries.length > 0 && totalPages > 1 && (
            <div className="cgl-pagination">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="cgl-btn cgl-btn--secondary cgl-pagination__btn"
              >
                Previous
              </button>
              <div className="cgl-pagination__info">
                Page {currentPage} of {totalPages}
                <span className="cgl-pagination__count">
                  Showing {indexOfFirst + 1}–{Math.min(indexOfLast, filteredEntries.length)} of {filteredEntries.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="cgl-btn cgl-btn--secondary cgl-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CombinedGL;
