import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsecEntriesAPI } from '../../services/api';
import {
  exportGsecGeneralLedgerToExcel,
  exportGsecGeneralLedgerToPdf
} from '../../utils/gsecGeneralLedgerExport';
import './Styles/GsecGeneralLedger.css';

const GsecGeneralLedger = () => {
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({
    totalEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    account_code: '',
    dateFrom: '',
    dateTo: '',
    deal_number: '',
    account_category: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50);
  const hasLoadedOnceRef = useRef(false);

  const fetchEntries = useCallback(
    async (pageOverride) => {
      const page = pageOverride ?? currentPage;

      try {
        if (!hasLoadedOnceRef.current) {
          setLoading(true);
        }
        setError('');

        const response = await gsecEntriesAPI.getSavedLedgerEntries({
          page,
          limit: entriesPerPage,
          deal_number: filters.deal_number || undefined,
          account_code: filters.account_code || undefined,
          account_category: filters.account_category || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          search: searchTerm || undefined
        });

        if (!response?.success) {
          throw new Error(response?.error || 'Failed to fetch GSec ledger entries');
        }

        setEntries(Array.isArray(response.entries) ? response.entries : []);
        setTotals(
          response.totals || {
            totalEntries: 0,
            totalDebit: 0,
            totalCredit: 0,
            netBalance: 0
          }
        );
        setPagination(
          response.pagination || {
            page,
            limit: entriesPerPage,
            total: 0,
            totalPages: 1
          }
        );
        hasLoadedOnceRef.current = true;
      } catch (err) {
        console.error('Error fetching GSec ledger entries:', err);
        setError(err.message || 'Failed to fetch GSec ledger entries');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, entriesPerPage, filters, searchTerm]
  );

  const fetchAllFilteredEntries = useCallback(async () => {
    const exportLimit = 100;
    let page = 1;
    let totalPages = 1;
    const allEntries = [];

    do {
      const response = await gsecEntriesAPI.getSavedLedgerEntries({
        page,
        limit: exportLimit,
        deal_number: filters.deal_number || undefined,
        account_code: filters.account_code || undefined,
        account_category: filters.account_category || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        search: searchTerm || undefined
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to fetch GSec ledger entries for export');
      }

      allEntries.push(...(response.entries || []));
      totalPages = response.pagination?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);

    return allEntries;
  }, [filters, searchTerm]);

  useEffect(() => {
    const delay = searchTerm ? 400 : 0;
    const timer = window.setTimeout(() => {
      fetchEntries();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [fetchEntries, searchTerm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      account_code: '',
      dateFrom: '',
      dateTo: '',
      deal_number: '',
      account_category: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalDebits = totals.totalDebit || 0;
  const totalCredits = totals.totalCredit || 0;
  const netBalance = totals.netBalance || 0;
  const filteredCount = totals.totalEntries || pagination.total || 0;
  const totalPages = pagination.totalPages || 1;

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
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-LK');
  };

  const handleExportPdf = async () => {
    if (!filteredCount) return;
    setExporting(true);
    setError('');
    try {
      const exportEntries = await fetchAllFilteredEntries();
      const exportDebits = exportEntries.reduce(
        (sum, e) => sum + (parseFloat(e.debit_amount) || 0),
        0
      );
      const exportCredits = exportEntries.reduce(
        (sum, e) => sum + (parseFloat(e.credit_amount) || 0),
        0
      );
      exportGsecGeneralLedgerToPdf({
        entries: exportEntries,
        totalDebits: exportDebits,
        totalCredits: exportCredits
      });
    } catch (err) {
      console.error('Failed to export GSec GL PDF:', err);
      setError('Failed to export PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!filteredCount) return;
    setExporting(true);
    setError('');
    try {
      const exportEntries = await fetchAllFilteredEntries();
      const exportDebits = exportEntries.reduce(
        (sum, e) => sum + (parseFloat(e.debit_amount) || 0),
        0
      );
      const exportCredits = exportEntries.reduce(
        (sum, e) => sum + (parseFloat(e.credit_amount) || 0),
        0
      );
      exportGsecGeneralLedgerToExcel({
        entries: exportEntries,
        totalDebits: exportDebits,
        totalCredits: exportCredits
      });
    } catch (err) {
      console.error('Failed to export GSec GL Excel:', err);
      setError('Failed to export Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="gsec-gl-page-container">
        <div className="gsec-gl-loading">Loading GSec General Ledger...</div>
      </div>
    );
  }

  return (
    <div className="gsec-gl-page-container">
      <div className="gsec-gl-content-wrapper">
        {/* Header */}
        <div className="gsec-gl-header-section">
          <div className="gsec-gl-header-icon">
            <svg className="gsec-gl-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z"
                clipRule="evenodd"
              />
              <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z" />
            </svg>
          </div>
          <div className="gsec-gl-header-text-group">
            <h1 className="gsec-gl-main-title">GSec General Ledger</h1>
            <p className="gsec-gl-subtitle">
              View saved GSec ledger snapshots from the external GSec system, grouped by deal number.
            </p>
          </div>
        </div>

        {/* Filters & search */}
        <div className="gsec-gl-filters-card">
          <div className="gsec-gl-card-header">
            <h2 className="gsec-gl-card-title">Filters & Search</h2>
          </div>
          <div className="gsec-gl-filters-content">
            <div className="gsec-gl-search-section">
              <input
                type="text"
                placeholder="Search by account code, name, description or deal number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="gsec-gl-search-input"
              />
            </div>

            <div className="gsec-gl-filters-grid">
              <div className="gsec-gl-filter-group">
                <label className="gsec-gl-filter-label">Deal Number</label>
                <input
                  type="text"
                  name="deal_number"
                  value={filters.deal_number}
                  onChange={handleFilterChange}
                  placeholder="e.g. 20251106/GSEC/0001"
                  className="gsec-gl-filter-input"
                />
              </div>

              <div className="gsec-gl-filter-group">
                <label className="gsec-gl-filter-label">Account Code</label>
                <input
                  type="text"
                  name="account_code"
                  value={filters.account_code}
                  onChange={handleFilterChange}
                  placeholder="Enter account code"
                  className="gsec-gl-filter-input"
                />
              </div>

              <div className="gsec-gl-filter-group">
                <label className="gsec-gl-filter-label">Account Category</label>
                <select
                  name="account_category"
                  value={filters.account_category}
                  onChange={handleFilterChange}
                  className="gsec-gl-filter-select"
                >
                  <option value="">All Categories</option>
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="gsec-gl-filter-group">
                <label className="gsec-gl-filter-label">Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="gsec-gl-filter-input"
                />
              </div>

              <div className="gsec-gl-filter-group">
                <label className="gsec-gl-filter-label">Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="gsec-gl-filter-input"
                />
              </div>

              <div className="gsec-gl-filter-group">
                <button onClick={clearFilters} className="gsec-gl-clear-filters-btn">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="gsec-gl-summary-stats">
          <div className="gsec-gl-stat-card">
            <div className="gsec-gl-stat-value">{filteredCount}</div>
            <div className="gsec-gl-stat-label">Total Entries</div>
          </div>
          <div className="gsec-gl-stat-card">
            <div className="gsec-gl-stat-value debit">{formatCurrency(totalDebits)}</div>
            <div className="gsec-gl-stat-label">Total Debits</div>
          </div>
          <div className="gsec-gl-stat-card">
            <div className="gsec-gl-stat-value credit">{formatCurrency(totalCredits)}</div>
            <div className="gsec-gl-stat-label">Total Credits</div>
          </div>
          <div className="gsec-gl-stat-card">
            <div className={`gsec-gl-stat-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <div className="gsec-gl-stat-label">Net Balance</div>
          </div>
        </div>

        {/* Table */}
        <div className="gsec-gl-table-card">
          <div className="gsec-gl-card-header">
            <h2 className="gsec-gl-card-title">
              GSec Ledger Entries ({filteredCount} records)
            </h2>
            <div className="gsec-gl-table-actions">
              <button
                type="button"
                className="gsec-gl-refresh-btn"
                onClick={handleExportPdf}
                disabled={!filteredCount || exporting}
                title="Download filtered rows as PDF"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                type="button"
                className="gsec-gl-refresh-btn"
                onClick={handleExportExcel}
                disabled={!filteredCount || exporting}
                title="Download filtered rows as Excel"
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                type="button"
                className="gsec-gl-refresh-btn"
                onClick={() => fetchEntries()}
                disabled={loading || exporting}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="gsec-gl-table-container">
            {error && <div className="gsec-gl-error">{error}</div>}

            {entries.length === 0 ? (
              <div className="gsec-gl-no-data">
                No GSec ledger entries found matching the current filters.
              </div>
            ) : (
              <>
                <table className="gsec-gl-ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Deal Number</th>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Debit (LKR)</th>
                      <th>Credit (LKR)</th>
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="gsec-gl-date">{formatDateDisplay(entry.entry_date)}</td>
                        <td className="gsec-gl-deal-number">{entry.deal_number}</td>
                        <td className="gsec-gl-account-code">{entry.account_code}</td>
                        <td className="gsec-gl-account-name">{entry.account_name}</td>
                        <td className="gsec-gl-category">{entry.account_category}</td>
                        <td className="gsec-gl-description">{entry.description}</td>
                        <td className="gsec-gl-debit">
                          {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                        </td>
                        <td className="gsec-gl-credit">
                          {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                        </td>
                        <td className="gsec-gl-currency">{entry.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="gsec-gl-pagination">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || loading}
                      className="gsec-gl-pagination-btn"
                    >
                      Previous
                    </button>

                    <div className="gsec-gl-page-info">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                      className="gsec-gl-pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GsecGeneralLedger;
