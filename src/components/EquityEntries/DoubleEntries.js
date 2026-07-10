import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/DoubleEntries.css';

const PAGE_SIZE = 20;

const IconSearch = () => (
  <svg className="de-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 14l3.5 3.5" />
  </svg>
);

const IconInfo = () => (
  <svg className="de-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeWidth="1.5" d="M10 9v4M10 7h.01" />
  </svg>
);

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
        `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/accounts/list`,
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
        `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/double-entries?${params.toString()}`,
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
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);
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
      <div className="de-page-container">
        <div className="de-loading-state">Loading double entries…</div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="de-page-container">
        <div className="de-error-banner">
          <p className="de-error-banner__title">Error loading Double Entries</p>
          <p className="de-error-banner__text">{error}</p>
          <button type="button" className="de-btn de-btn--primary" onClick={loadDoubleEntries}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="de-page-container">
      <div className="de-content-wrapper">
        <header className="de-masthead">
          <div className="de-masthead__primary">
            <p className="de-eyebrow">Financial Reporting</p>
            <h1 className="de-main-title">Double Entries</h1>
            <p className="de-subtitle">
              View double-entry postings from Equity, Other Transactions, and GSec ledgers, grouped by
              reference or deal number.
            </p>
          </div>
          <div className="de-masthead__meta">
            <div className="de-meta-chip">
              <span className="de-meta-chip__label">Transactions</span>
              <span className="de-meta-chip__value">{summary.transactionCount}</span>
            </div>
            <div className="de-meta-chip">
              <span className="de-meta-chip__label">Balanced</span>
              <span className="de-meta-chip__value">{summary.balancedCount}</span>
            </div>
            <div className="de-meta-chip">
              <span className="de-meta-chip__label">Unbalanced</span>
              <span className="de-meta-chip__value">{summary.unbalancedCount}</span>
            </div>
          </div>
        </header>

        <section className="de-toolbar" aria-label="Report filters">
          <div className="de-toolbar__row">
            <div className="de-field de-field--search">
              <label className="de-field__label" htmlFor="deSearch">
                Search
              </label>
              <div className="de-search-wrap">
                <span className="de-search-icon" aria-hidden="true">
                  <IconSearch />
                </span>
                <input
                  id="deSearch"
                  type="search"
                  className="de-field__input"
                  placeholder="Reference, description, or account…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="de-field">
              <label className="de-field__label" htmlFor="deFilterDate">
                Date
              </label>
              <input
                type="date"
                id="deFilterDate"
                lang="en-US"
                className="de-field__input"
                value={filterDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            <div
              className={`de-field de-field--account${
                accountDropdownOpen ? ' de-field--account-open' : ''
              }`}
              ref={accountComboRef}
            >
              <label className="de-field__label" htmlFor="deFilterAccount">
                Account
              </label>
              <div className="de-account-combo">
                <input
                  ref={accountInputRef}
                  type="text"
                  id="deFilterAccount"
                  className="de-field__input de-account-input"
                  placeholder="Search or select account…"
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

            <div className="de-toolbar__actions">
              <button type="button" className="de-btn de-btn--ghost" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="de-error-banner de-error-banner--inline" role="alert">
            <p className="de-error-banner__title">Unable to load entries</p>
            <p className="de-error-banner__text">{error}</p>
          </div>
        ) : null}

        <div className="de-status-banner" role="status">
          <div className="de-status-banner__lead">
            <p className="de-status-banner__title">Double-entry overview</p>
            <p className="de-status-banner__text">
              {hasActiveFilters
                ? 'Showing filtered transactions across Equity, Other, and GSec ledgers.'
                : 'All double-entry groups across Equity, Other, and GSec ledgers.'}
            </p>
          </div>
          <div className="de-status-banner__metrics">
            <div className="de-metric">
              <span className="de-metric__label">Transactions</span>
              <span className="de-metric__value">{summary.transactionCount}</span>
            </div>
            <div className="de-metric">
              <span className="de-metric__label">Balanced</span>
              <span className="de-metric__value de-status-pill--ok">{summary.balancedCount}</span>
            </div>
            <div className="de-metric">
              <span className="de-metric__label">Unbalanced</span>
              <span className="de-metric__value de-status-pill--warn">{summary.unbalancedCount}</span>
            </div>
            <div className="de-metric">
              <span className="de-metric__label">Total Value (DR)</span>
              <span className="de-metric__value de-amount de-amount--debit">
                {formatCurrency(summary.totalDebit)}
              </span>
            </div>
          </div>
        </div>

        <section className="de-report" aria-label="Double entry transactions">
          <div className="de-report__header">
            <div className="de-report__heading">
              <h2 className="de-report__title">Double Entry Transactions ({totalTransactions})</h2>
              <p className="de-report__meta">
                Page {currentPage} of {totalPages}
                {hasActiveFilters ? ' · Filters active' : ''}
              </p>
            </div>
            <div className="de-report__actions">
              <button
                type="button"
                className="de-btn de-btn--export"
                onClick={loadDoubleEntries}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="de-info-banner" role="note">
            <span className="de-info-banner__icon" aria-hidden="true">
              <IconInfo />
            </span>
            <p className="de-info-banner__text">
              Each group represents one transaction from Equity, Other, or GSec. Debits and credits within a
              group should balance; <strong>unbalanced</strong> groups are highlighted.
            </p>
          </div>

          <div className="de-report__body">
            {loading ? (
              <div className="de-empty-state">
                <p className="de-empty-state__title">Loading double entries…</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="de-empty-state">
                <p className="de-empty-state__title">No transactions to display</p>
                <p className="de-empty-state__text">
                  {hasActiveFilters
                    ? 'No double entries match the selected filters.'
                    : 'No double entries have been recorded yet.'}
                </p>
              </div>
            ) : (
              <>
                <p className="de-page-info">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {(currentPage - 1) * PAGE_SIZE + entries.length} of {totalTransactions} transactions
                </p>

                <div className="de-transaction-list">
                  {entries.map((group) => {
                    const totals = calculateTotals(group);
                    return (
                      <article key={group.id} className="de-transaction-group">
                        <div className="de-group-header">
                          <div className="de-group-info">
                            <div className="de-group-topline">
                              <span className="de-group-date">{formatDate(group.date)}</span>
                              <span
                                className={`de-source-badge de-source-badge--${
                                  group.source || 'equity'
                                }`}
                              >
                                {group.sourceLabel || 'Equity'}
                              </span>
                            </div>
                            <p className="de-group-reference">
                              <span className="de-group-reference__label">Reference</span>
                              {group.reference || 'N/A'}
                            </p>
                            <p className="de-group-description">{group.description || 'No description'}</p>
                          </div>
                          <div className="de-group-meta">
                            <span
                              className={`de-balance-badge ${
                                totals.isBalanced ? 'de-balance-badge--ok' : 'de-balance-badge--bad'
                              }`}
                            >
                              {totals.isBalanced ? 'Balanced' : 'Unbalanced'}
                            </span>
                          </div>
                        </div>

                        <div className="de-group-table-wrap">
                          <table className="de-grid de-grid--nested">
                            <thead>
                              <tr>
                                <th className="de-col-code">Account Code</th>
                                <th>Account Name</th>
                                <th>Description</th>
                                <th className="de-col-num">Debit</th>
                                <th className="de-col-num">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map((entry, idx) => (
                                <tr key={entry.id || idx}>
                                  <td className="de-col-code">
                                    <span className="de-code">{entry.account_code || '—'}</span>
                                  </td>
                                  <td>{entry.account_name || '—'}</td>
                                  <td className="de-description-cell">{entry.description || '—'}</td>
                                  <td className="de-col-num">
                                    <span className="de-amount de-amount--debit">
                                      {parseFloat(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}
                                    </span>
                                  </td>
                                  <td className="de-col-num">
                                    <span className="de-amount de-amount--credit">
                                      {parseFloat(entry.credit) > 0 ? formatCurrency(entry.credit) : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="de-grid__totals">
                                <td colSpan="3" className="de-totals-label">
                                  Total
                                </td>
                                <td className="de-col-num">
                                  <span className="de-amount de-amount--debit">
                                    {formatCurrency(totals.totalDebit)}
                                  </span>
                                </td>
                                <td className="de-col-num">
                                  <span className="de-amount de-amount--credit">
                                    {formatCurrency(totals.totalCredit)}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <div className="de-pagination">
                    <button
                      type="button"
                      className="de-btn de-btn--secondary"
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
                      className="de-btn de-btn--secondary"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
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
              <div className="de-account-option de-account-option--empty">No matching accounts</div>
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
