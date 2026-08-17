import React, { useEffect, useMemo, useState } from 'react';
import { gsecEntriesAPI } from '../../services/api';
import {
  exportGsecBalanceSheetToExcel,
  exportGsecBalanceSheetToPdf
} from '../../utils/gsecBalanceSheetExport';
import './Styles/GsecBalanceSheet.css';

const getNetBalance = (debit, credit) => (Number(debit) || 0) - (Number(credit) || 0);

const getBalanceType = (net) => {
  if (net > 0.005) return 'DR';
  if (net < -0.005) return 'CR';
  return '—';
};

const GsecBalanceSheet = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountCode: ''
  });
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await gsecEntriesAPI.getBalanceSheet(filters);
      if (response && response.success) {
        setData(response.data);
      } else {
        throw new Error(response?.error || 'Failed to fetch GSec balance sheet data');
      }
    } catch (err) {
      console.error('Error fetching GSec balance sheet data:', err);
      setError(err.message || 'Failed to fetch GSec balance sheet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleExportPdf = () => {
    const accounts = data?.accounts || [];
    exportGsecBalanceSheetToPdf({
      accounts,
      period: data?.period,
      totals: grouped?.totals,
      filenameBase: `gsec-balance-sheet-${filters?.startDate || 'start'}-${filters?.endDate || 'end'}`
    });
  };

  const handleExportExcel = () => {
    const accounts = data?.accounts || [];
    exportGsecBalanceSheetToExcel({
      accounts,
      period: data?.period,
      totals: grouped?.totals,
      filenameBase: `gsec-balance-sheet-${filters?.startDate || 'start'}-${filters?.endDate || 'end'}`
    });
  };

  const handleViewDetails = async (accountCode) => {
    if (!accountCode) return;

    try {
      setDetailsLoading(true);
      setDetailsError('');
      setDetails(null);

      const response = await gsecEntriesAPI.getBalanceSheetAccountDetails(accountCode, filters);
      if (response && response.success) {
        setDetails(response.data);
      } else {
        throw new Error(response?.error || 'Failed to fetch GSec account details');
      }
    } catch (err) {
      console.error('Error fetching GSec account details:', err);
      setDetailsError(err.message || 'Failed to fetch GSec account details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(n);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-LK');
  };

  const formatNetBalanceDisplay = (debit, credit) => {
    const net = getNetBalance(debit, credit);
    if (Math.abs(net) < 0.005) return '—';
    return `${formatCurrency(Math.abs(net))} ${getBalanceType(net)}`;
  };

  const grouped = useMemo(() => {
    if (!data || !Array.isArray(data.accounts)) return { byCategory: {}, totals: { debit: 0, credit: 0 } };

    const byCategory = {};
    const categorySortKeys = {};
    let totalDebit = 0;
    let totalCredit = 0;

    data.accounts.forEach((acc) => {
      const category = acc.account_category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(acc);

      if (categorySortKeys[category] == null) {
        categorySortKeys[category] = acc.category_sort_key || category;
      }

      totalDebit += Number(acc.total_debit) || 0;
      totalCredit += Number(acc.total_credit) || 0;
    });

    const subtotals = {};
    Object.keys(byCategory).forEach((cat) => {
      const rows = byCategory[cat];
      const sub = rows.reduce(
        (acc, r) => {
          acc.debit += Number(r.total_debit) || 0;
          acc.credit += Number(r.total_credit) || 0;
          return acc;
        },
        { debit: 0, credit: 0 }
      );
      subtotals[cat] = sub;
    });

    const sortedCategoryKeys = Object.keys(byCategory).sort((a, b) =>
      String(categorySortKeys[a] || a).localeCompare(String(categorySortKeys[b] || b), undefined, {
        numeric: true
      })
    );

    return {
      byCategory,
      subtotals,
      sortedCategoryKeys,
      totals: { debit: totalDebit, credit: totalCredit }
    };
  }, [data]);

  if (loading) {
    return (
      <div className="gsec-bs-page-container">
        <div className="gsec-bs-loading">Loading GSec Balance Sheet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gsec-bs-page-container">
        <div className="gsec-bs-error">
          <div className="gsec-bs-error-title">Error loading GSec Balance Sheet</div>
          <div className="gsec-bs-error-message">{error}</div>
          <button className="gsec-bs-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gsec-bs-page-container">
      <div className="gsec-bs-content-wrapper">
        <header className="gsec-bs-rail">
          <p className="gsec-bs-rail__eyebrow">Accounting · GSec</p>
          <h1 className="gsec-bs-rail__title">Gsec Trial Balance</h1>
          <p className="gsec-bs-rail__blurb">
            Snapshot of GSec assets and related accounts based on imported GSec entries.
          </p>
        </header>

        <section className="gsec-bs-panel gsec-bs-panel--filters" aria-label="Filters">
          <div className="gsec-bs-panel__head">
            <div>
              <h2>Filters</h2>
              <p>Narrow the trial balance by period and account code.</p>
            </div>
          </div>
          <div className="gsec-bs-filters-content">
            <div className="gsec-bs-filters-grid">
              <div className="gsec-bs-filter-group">
                <label className="gsec-bs-filter-label">Start Date</label>
                <input
                  type="date"
                  className="gsec-bs-filter-input"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="gsec-bs-filter-group">
                <label className="gsec-bs-filter-label">End Date</label>
                <input
                  type="date"
                  className="gsec-bs-filter-input"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="gsec-bs-filter-group">
                <label className="gsec-bs-filter-label">Account Code</label>
                <input
                  type="text"
                  className="gsec-bs-filter-input"
                  value={filters.accountCode}
                  placeholder="e.g. 1010"
                  onChange={(e) => handleFilterChange('accountCode', e.target.value)}
                />
              </div>
              <div className="gsec-bs-filter-group gsec-bs-filter-actions">
                <button type="button" className="gsec-bs-apply-btn" onClick={handleApplyFilters}>
                  Apply
                </button>
                <button
                  type="button"
                  className="gsec-bs-clear-btn"
                  onClick={() => {
                    setFilters({ startDate: '', endDate: '', accountCode: '' });
                    setTimeout(fetchData, 0);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="gsec-bs-summary-row">
          <div className="gsec-bs-summary-card">
            <div className="gsec-bs-summary-label">Total Debits</div>
            <div className="gsec-bs-summary-value debit">
              {formatCurrency(grouped.totals.debit)}
            </div>
          </div>
          <div className="gsec-bs-summary-card">
            <div className="gsec-bs-summary-label">Total Credits</div>
            <div className="gsec-bs-summary-value credit">
              {formatCurrency(grouped.totals.credit)}
            </div>
          </div>
          <div className="gsec-bs-summary-card">
            <div className="gsec-bs-summary-label">Net Balance</div>
            <div className="gsec-bs-summary-value net">
              {formatNetBalanceDisplay(grouped.totals.debit, grouped.totals.credit)}
            </div>
          </div>
        </div>

        <section className="gsec-bs-panel" aria-label="Accounts by category">
          <div className="gsec-bs-panel__head">
            <div>
              <h2>Accounts by Category</h2>
              <p>Debit and credit balances grouped from imported GSec entries.</p>
            </div>
            <div className="gsec-bs-table-actions">
              <button
                type="button"
                className="gsec-bs-export-btn gsec-bs-export-btn--pdf"
                onClick={handleExportPdf}
                disabled={!data?.accounts?.length}
                title="Download current balance sheet rows as PDF"
              >
                Export PDF
              </button>
              <button
                type="button"
                className="gsec-bs-export-btn gsec-bs-export-btn--excel"
                onClick={handleExportExcel}
                disabled={!data?.accounts?.length}
                title="Download current balance sheet rows as Excel"
              >
                Export Excel
              </button>
            </div>
          </div>

          <div className="gsec-bs-table-container">
            {Object.keys(grouped.byCategory).length === 0 ? (
              <div className="gsec-bs-no-data">
                No GSec entries found for the selected period.
              </div>
            ) : (
              (grouped.sortedCategoryKeys || Object.keys(grouped.byCategory)).map((cat) => {
                const rows = grouped.byCategory[cat];
                const sub = grouped.subtotals[cat] || { debit: 0, credit: 0 };
                return (
                  <div key={cat} className="gsec-bs-category-section">
                    <div className="gsec-bs-category-header">
                      <h3 className="gsec-bs-category-title">
                        {cat || 'Uncategorized'}
                      </h3>
                      <div className="gsec-bs-category-subtotals">
                        <span>Debit: {formatCurrency(sub.debit)}</span>
                        <span>Credit: {formatCurrency(sub.credit)}</span>
                      </div>
                    </div>
                    <table className="gsec-bs-table">
                      <thead>
                        <tr>
                          <th>Account Code</th>
                          <th>Account Name</th>
                          <th>Debit (LKR)</th>
                          <th>Credit (LKR)</th>
                          <th>Net Balance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.account_code}>
                            <td className="gsec-bs-account-code">{row.account_code}</td>
                            <td className="gsec-bs-account-name">{row.account_name}</td>
                            <td className="gsec-bs-debit">
                              {formatCurrency(row.total_debit)}
                            </td>
                            <td className="gsec-bs-credit">
                              {formatCurrency(row.total_credit)}
                            </td>
                            <td className="gsec-bs-net">
                              {formatNetBalanceDisplay(row.total_debit, row.total_credit)}
                            </td>
                            <td className="gsec-bs-actions">
                              <button
                                type="button"
                                className="gsec-bs-view-details-btn"
                                onClick={() => handleViewDetails(row.account_code)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>
        </section>
        {details && (
          <div className="gsec-bs-modal-backdrop" onClick={() => setDetails(null)}>
            <div className="gsec-bs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="gsec-bs-modal-header">
                <div>
                  <h3 className="gsec-bs-modal-title">
                    {details.accountCode} — {details.accountName}
                  </h3>
                  <p className="gsec-bs-modal-subtitle">
                    {formatDate(details.period.startDate)} -{' '}
                    {formatDate(details.period.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  className="gsec-bs-modal-close"
                  onClick={() => setDetails(null)}
                >
                  ✕
                </button>
              </div>

              {detailsLoading && (
                <div className="gsec-bs-modal-loading">Loading account details...</div>
              )}
              {detailsError && (
                <div className="gsec-bs-modal-error">{detailsError}</div>
              )}

              {!detailsLoading && !detailsError && (
                <div className="gsec-bs-modal-body">
                  {(!details.entries || details.entries.length === 0) ? (
                    <div className="gsec-bs-no-data">
                      No GSec entries found for this account in the selected period.
                    </div>
                  ) : (
                    <div className="gsec-bs-modal-table-container">
                      <table className="gsec-bs-modal-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Deal Number</th>
                            <th>Description</th>
                            <th>Debit (LKR)</th>
                            <th>Credit (LKR)</th>
                            <th>Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.entries.map((entry) => (
                            <tr key={entry.id}>
                              <td>{formatDate(entry.entry_date)}</td>
                              <td>{entry.deal_number}</td>
                              <td>{entry.description}</td>
                              <td className="gsec-bs-debit">
                                {entry.debit_amount > 0
                                  ? formatCurrency(entry.debit_amount)
                                  : '-'}
                              </td>
                              <td className="gsec-bs-credit">
                                {entry.credit_amount > 0
                                  ? formatCurrency(entry.credit_amount)
                                  : '-'}
                              </td>
                              <td>{entry.currency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GsecBalanceSheet;

