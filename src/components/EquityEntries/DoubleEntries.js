import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../AccountingEntries/Styles/CombinedTrialBalance.css';
import '../AccountingEntries/Styles/AccountSummaries.css';
import './Styles/DoubleEntries.css';

const PAGE_SIZE = 20;

const DoubleEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [summary, setSummary] = useState({
    transactionCount: 0,
    balancedCount: 0,
    unbalancedCount: 0,
    totalDebit: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accountList, setAccountList] = useState([]);
  const [dropdownRect, setDropdownRect] = useState(null);
  const accountComboRef = useRef(null);
  const accountInputRef = useRef(null);
  const accountDropdownRef = useRef(null);

  useEffect(() => {
    loadAccountList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadAccountList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries/accounts/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) return;

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setAccountList(
          result.data
            .map((row) => ({
              code: String(row.account_code || '').trim(),
              name: String(row.description || '').trim()
            }))
            .filter((row) => row.code)
        );
      }
    } catch (err) {
      console.error('Error loading accounts for filter:', err);
    }
  };

  const loadDoubleEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE)
      });

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (filterDate) {
        params.set('date', filterDate);
      }
      if (filterAccount.trim()) {
        params.set('account', filterAccount.trim());
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries/double-entries?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load double entries');
      }

      const result = await response.json();
      if (result.success) {
        setEntries(Array.isArray(result.data) ? result.data : []);
        setTotalTransactions(result.pagination?.total ?? result.data?.length ?? 0);
        setSummary({
          transactionCount: result.summary?.transactionCount ?? result.pagination?.total ?? 0,
          balancedCount: result.summary?.balancedCount ?? 0,
          unbalancedCount: result.summary?.unbalancedCount ?? 0,
          totalDebit: result.summary?.totalDebit ?? 0
        });
      } else {
        throw new Error(result.error || 'Failed to load entries');
      }
    } catch (err) {
      console.error('Error loading double entries:', err);
      setError(err.message || 'Failed to load double entries. Please try again.');
      setEntries([]);
      setTotalTransactions(0);
      setSummary({
        transactionCount: 0,
        balancedCount: 0,
        unbalancedCount: 0,
        totalDebit: 0
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterDate, filterAccount]);

  useEffect(() => {
    loadDoubleEntries();
  }, [loadDoubleEntries]);

  const updateDropdownRect = useCallback(() => {
    if (!accountInputRef.current) return;
    const rect = accountInputRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    });
  }, []);

  useEffect(() => {
    if (!accountDropdownOpen) {
      setDropdownRect(null);
      return undefined;
    }

    updateDropdownRect();
    window.addEventListener('scroll', updateDropdownRect, true);
    window.addEventListener('resize', updateDropdownRect);

    return () => {
      window.removeEventListener('scroll', updateDropdownRect, true);
      window.removeEventListener('resize', updateDropdownRect);
    };
  }, [accountDropdownOpen, updateDropdownRect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inCombo = accountComboRef.current?.contains(event.target);
      const inDropdown = accountDropdownRef.current?.contains(event.target);
      if (!inCombo && !inDropdown) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotals = (group) => {
    const totalDebit = group.entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = group.entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE));
  const hasActiveFilters = Boolean(searchTerm.trim() || filterDate || filterAccount.trim());

  const accountOptions = useMemo(() => {
    const byCode = new Map();

    accountList.forEach((account) => {
      byCode.set(account.code, account);
    });

    entries.forEach((group) => {
      group.entries.forEach((entry) => {
        const code = String(entry.account_code || '').trim();
        if (!code) return;
        if (!byCode.has(code)) {
          byCode.set(code, {
            code,
            name: String(entry.account_name || '').trim()
          });
        }
      });
    });

    return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [entries, accountList]);

  const filteredAccountOptions = useMemo(() => {
    const query = filterAccount.trim().toLowerCase();
    if (!query) return accountOptions.slice(0, 50);
    return accountOptions
      .filter(
        (account) =>
          account.code.toLowerCase().includes(query) ||
          account.name.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [accountOptions, filterAccount]);

  const handleAccountSelect = (account) => {
    setFilterAccount(account.code);
    setAccountDropdownOpen(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilterDate('');
    setFilterAccount('');
    setAccountDropdownOpen(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value) => {
    setFilterDate(value);
    setCurrentPage(1);
  };

  const handleAccountInputChange = (value) => {
    setFilterAccount(value);
    setAccountDropdownOpen(true);
    setCurrentPage(1);
  };

  if (loading && entries.length === 0 && !error) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-loading">Loading Double Entries...</div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-error">
          <div className="ctb-error-title">Error loading Double Entries</div>
          <div className="ctb-error-message">{error}</div>
          <button type="button" className="ctb-retry-btn" onClick={loadDoubleEntries}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ctb-page-container de-page">
      <div className="ctb-content-wrapper">
        <div className="ctb-header-section de-header-section">
          <div className="ctb-header-text-group">
            <h1 className="ctb-main-title">Double Entries</h1>
            <p className="ctb-subtitle">
              View double-entry postings from Equity, Other Transactions, and GSec ledgers,
              grouped by reference or deal number.
            </p>
          </div>
          <div className="ctb-header-meta">
            <div className="ctb-period">
              Transactions:&nbsp;
              <span>{summary.transactionCount}</span>
            </div>
          </div>
        </div>

        <div className="ctb-filters-card de-filters-card">
          <div className="ctb-filters-content">
            <div className="ctb-filters-grid de-filters-grid">
              <div className="ctb-filter-group de-filter-search">
                <label className="ctb-filter-label" htmlFor="deSearch">
                  Search
                </label>
                <input
                  id="deSearch"
                  type="text"
                  className="ctb-filter-input"
                  placeholder="Reference, description, or account..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <div className="ctb-filter-group">
                <label className="ctb-filter-label" htmlFor="filterDate">
                  Date
                </label>
                <input
                  type="date"
                  id="filterDate"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filterDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div
                className={`ctb-filter-group de-account-combo-wrap${
                  accountDropdownOpen ? ' de-account-combo-wrap--open' : ''
                }`}
                ref={accountComboRef}
              >
                <label className="ctb-filter-label" htmlFor="filterAccount">
                  Account
                </label>
                <div className="de-account-combo">
                  <input
                    ref={accountInputRef}
                    type="text"
                    id="filterAccount"
                    className="ctb-filter-input de-account-input"
                    placeholder="Search or select account..."
                    value={filterAccount}
                    onChange={(e) => handleAccountInputChange(e.target.value)}
                    onFocus={() => setAccountDropdownOpen(true)}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={accountDropdownOpen}
                    aria-controls="deAccountDropdown"
                    aria-autocomplete="list"
                  />
                  {filterAccount && (
                    <button
                      type="button"
                      className="de-account-clear"
                      onClick={() => {
                        setFilterAccount('');
                        setAccountDropdownOpen(true);
                        setCurrentPage(1);
                        accountInputRef.current?.focus();
                      }}
                      aria-label="Clear account filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="ctb-filter-group ctb-filter-actions">
                <button type="button" className="ctb-clear-btn" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="de-inline-error">{error}</div>
        )}

        <div className="cas-metrics de-metrics">
          <div className="cas-metric-card">
            <div className="cas-metric-label">Transactions</div>
            <div className="cas-metric-value">{summary.transactionCount}</div>
          </div>
          <div className="cas-metric-card">
            <div className="cas-metric-label">Balanced</div>
            <div className="cas-metric-value positive">{summary.balancedCount}</div>
          </div>
          <div className="cas-metric-card">
            <div className="cas-metric-label">Unbalanced</div>
            <div className="cas-metric-value negative">{summary.unbalancedCount}</div>
          </div>
          <div className="cas-metric-card">
            <div className="cas-metric-label">Total Value (DR)</div>
            <div className="cas-metric-value debit">{formatCurrency(summary.totalDebit)}</div>
          </div>
        </div>

        <div className="ctb-table-card">
          <div className="ctb-card-header ctb-table-header">
            <h2 className="ctb-card-title">
              Double Entry Transactions ({totalTransactions})
            </h2>
            <div className="ctb-export-actions">
              <button
                type="button"
                className="ctb-export-btn"
                onClick={loadDoubleEntries}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          <p className="ctb-table-hint">
            Each group represents one transaction from Equity, Other, or GSec. Debits and credits
            within a group should balance; unbalanced groups are highlighted.
          </p>

          <div className="de-transactions-container">
            {loading ? (
              <div className="ctb-loading">Loading double entries...</div>
            ) : entries.length === 0 ? (
              <div className="ctb-no-data">
                {hasActiveFilters
                  ? 'No double entries match the selected filters.'
                  : 'No double entries have been recorded yet.'}
              </div>
            ) : (
              <>
                <div className="de-page-info">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {(currentPage - 1) * PAGE_SIZE + entries.length} of {totalTransactions} transactions
                </div>
                <div className="de-transaction-list">
                  {entries.map((group) => {
                    const totals = calculateTotals(group);
                    return (
                      <div key={group.id} className="de-transaction-group">
                        <div className="de-group-header">
                          <div className="de-group-info">
                            <div className="de-group-topline">
                              <div className="de-group-date">{formatDate(group.date)}</div>
                              <span className={`de-source-badge de-source-badge--${group.source || 'equity'}`}>
                                {group.sourceLabel || 'Equity'}
                              </span>
                            </div>
                            <div className="de-group-reference">
                              <strong>Reference:</strong> {group.reference || 'N/A'}
                            </div>
                            <div className="de-group-description">
                              {group.description || 'No description'}
                            </div>
                          </div>
                          <div className="de-group-meta">
                            <span
                              className={`de-balance-badge ${
                                totals.isBalanced ? 'de-balance-badge--ok' : 'de-balance-badge--bad'
                              }`}
                            >
                              {totals.isBalanced ? 'Balanced' : 'Unbalanced'}
                            </span>
                            <div className="de-group-totals">
                              <span className="de-total-item">
                                <span className="de-total-label">Debit</span>
                                <span className="de-total-value de-total-value--debit">
                                  {formatCurrency(totals.totalDebit)}
                                </span>
                              </span>
                              <span className="de-total-item">
                                <span className="de-total-label">Credit</span>
                                <span className="de-total-value de-total-value--credit">
                                  {formatCurrency(totals.totalCredit)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="de-group-table-wrap">
                          <table className="ctb-data-table de-nested-table">
                            <thead>
                              <tr>
                                <th>Account Code</th>
                                <th>Account Name</th>
                                <th>Description</th>
                                <th>Debit</th>
                                <th>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map((entry, idx) => (
                                <tr key={entry.id || idx}>
                                  <td className="ctb-account-code">{entry.account_code || '-'}</td>
                                  <td>{entry.account_name || '-'}</td>
                                  <td className="de-description-cell">{entry.description || '-'}</td>
                                  <td className="ctb-debit">
                                    {parseFloat(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                                  </td>
                                  <td className="ctb-credit">
                                    {parseFloat(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="de-totals-row">
                                <td colSpan="3" className="de-totals-label">
                                  Total
                                </td>
                                <td className="ctb-debit">{formatCurrency(totals.totalDebit)}</td>
                                <td className="ctb-credit">{formatCurrency(totals.totalCredit)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="de-pagination">
                    <button
                      type="button"
                      className="de-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </button>
                    <span className="de-page-label">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="de-pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
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

      {accountDropdownOpen &&
        dropdownRect &&
        createPortal(
          <div
            id="deAccountDropdown"
            ref={accountDropdownRef}
            className="de-account-dropdown de-account-dropdown--portal"
            role="listbox"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width
            }}
          >
            {filteredAccountOptions.length === 0 ? (
              <div className="de-account-option de-account-option--empty">
                No matching accounts
              </div>
            ) : (
              filteredAccountOptions.map((account) => (
                <button
                  key={account.code}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="de-account-option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="de-account-option-code">{account.code}</div>
                  {account.name ? (
                    <div className="de-account-option-name">{account.name}</div>
                  ) : null}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default DoubleEntries;
