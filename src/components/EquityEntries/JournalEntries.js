import React, { useState, useEffect, useCallback } from 'react';
import '../AccountingEntries/Styles/CombinedTrialBalance.css';
import './Styles/JournalEntries.css';

const PAGE_SIZE = 250;

const JournalEntries = ({ onTabChange }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    transactionType: 'all',
    dateFrom: '',
    dateTo: '',
    portfolio: 'all'
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    account_code: '',
    account_name: '',
    description: '',
    reference: '',
    debit: '',
    credit: '',
    transaction_type: '',
    status: 'Draft'
  });

  useEffect(() => {
    loadAccounts();
    loadPortfolios();
  }, []);

  const loadJournalEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const offset = (currentPage - 1) * PAGE_SIZE;

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset)
      });

      if (filters.portfolio && filters.portfolio !== 'all') {
        params.set('portfolio', filters.portfolio);
      }
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.transactionType && filters.transactionType !== 'all') {
        params.set('transaction_type', filters.transactionType);
      }
      if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
      }

      const url = `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEntries(result.data || []);
          setTotalEntries(result.pagination?.total ?? result.data?.length ?? 0);
        } else {
          console.error('API error:', result.error);
          setEntries([]);
          setTotalEntries(0);
        }
      } else {
        console.error('Failed to fetch journal entries:', response.status);
        setEntries([]);
        setTotalEntries(0);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
      setEntries([]);
      setTotalEntries(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadJournalEntries();
  }, [loadJournalEntries]);

  const handleFilterChange = (updates) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  const loadPortfolios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries/portfolios`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailablePortfolios(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const loadAccounts = async () => {
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

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAccounts(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'debit' || name === 'credit') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const formattedValue = numericValue ? formatCurrency(parseFloat(numericValue)) : '';
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAccountChange = (e) => {
    const accountCode = e.target.value;
    const selectedAccount = accounts.find((acc) => acc.account_code === accountCode);

    setFormData((prev) => ({
      ...prev,
      account_code: accountCode,
      account_name: selectedAccount ? selectedAccount.description : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingEntry
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries/${editingEntry.id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/journal-entries`;

      const method = editingEntry ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        debit: parseFloat(formData.debit.replace(/[^0-9.]/g, '')) || 0,
        credit: parseFloat(formData.credit.replace(/[^0-9.]/g, '')) || 0
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          loadJournalEntries();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      account_code: '',
      account_name: '',
      description: '',
      reference: '',
      debit: '',
      credit: '',
      transaction_type: '',
      status: 'Draft'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters({
      status: 'all',
      transactionType: 'all',
      dateFrom: '',
      dateTo: '',
      portfolio: 'all'
    });
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-loading">Loading Journal Entries...</div>
      </div>
    );
  }

  return (
    <div className="ctb-page-container je-page">
      <div className="ctb-content-wrapper">
        <div className="ctb-header-section je-header">
          <div className="ctb-header-text-group">
            <h1 className="ctb-main-title">Journal Entries</h1>
            <p className="ctb-subtitle">
              Browse and filter general ledger journal lines posted from trades, corporate actions,
              and manual entries.
            </p>
          </div>
          <div className="je-header-actions">
            <button
              type="button"
              className="je-new-entry-btn"
              onClick={() => onTabChange && onTabChange('Buy')}
            >
              + New Entry
            </button>
          </div>
        </div>

        <div className="ctb-filters-card je-filters-card">
          <div className="ctb-filters-content">
            <div className="ctb-filters-grid je-filters-grid">
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Portfolio</label>
                <select
                  className="ctb-filter-select"
                  value={filters.portfolio}
                  onChange={(e) => handleFilterChange({ portfolio: e.target.value })}
                >
                  <option value="all">All Portfolios</option>
                  {availablePortfolios.map((portfolio) => (
                    <option
                      key={portfolio.portfolioId || portfolio.portfolio}
                      value={portfolio.portfolioId || portfolio.portfolio}
                    >
                      {portfolio.portfolioName || portfolio.portfolio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Status</label>
                <select
                  className="ctb-filter-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="Draft">Draft</option>
                  <option value="Posted">Posted</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Transaction Type</label>
                <select
                  className="ctb-filter-select"
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange({ transactionType: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="Trade">Trade</option>
                  <option value="Dividend">Dividend</option>
                  <option value="Corporate Action">Corporate Action</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div className="ctb-filter-group">
                <label className="ctb-filter-label">From Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                />
              </div>

              <div className="ctb-filter-group">
                <label className="ctb-filter-label">To Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                />
              </div>

              <div className="ctb-filter-group ctb-filter-actions">
                <button type="button" className="ctb-clear-btn" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="je-summary">
          Showing {entries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {(currentPage - 1) * PAGE_SIZE + entries.length} of {totalEntries} entries
          {isLoading && <span className="je-summary-loading"> · Loading…</span>}
        </div>

        <div className={`ctb-table-card je-table-card${isLoading ? ' je-table-card--loading' : ''}`}>
          <div className="ctb-card-header ctb-table-header">
            <h2 className="ctb-card-title">Journal Entries ({totalEntries})</h2>
          </div>

          <div className="je-table-scroll">
            <table className="ctb-data-table je-table">
              <thead>
                <tr>
                  <th className="je-col-date">Date</th>
                  <th className="je-col-code">Account Code</th>
                  <th className="je-col-name">Account Name</th>
                  <th className="je-col-desc">Description</th>
                  <th className="je-col-ref">Reference</th>
                  <th className="je-col-payment">Payment Details</th>
                  <th className="je-col-amount">Debit</th>
                  <th className="je-col-amount">Credit</th>
                  <th className="je-col-amount">Balance</th>
                  <th className="je-col-type">Type</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && entries.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="ctb-no-data">
                      No journal entries found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="je-col-date">{formatDate(entry.date)}</td>
                      <td className="je-col-code ctb-account-code" title={entry.account_code || ''}>
                        {entry.account_code || '—'}
                      </td>
                      <td className="je-col-name">{entry.account_name || '—'}</td>
                      <td className="je-col-desc">{entry.description || '—'}</td>
                      <td className="je-col-ref">{entry.reference || '—'}</td>
                      <td className="je-col-payment">
                        {entry.transaction_account_name ? (
                          <div className="je-payment-details">
                            <div className="je-payment-primary">{entry.transaction_account_name}</div>
                            {entry.account_number && (
                              <div className="je-payment-meta">Acc: {entry.account_number}</div>
                            )}
                            {entry.bank_name && (
                              <div className="je-payment-meta">Bank: {entry.bank_name}</div>
                            )}
                            {entry.payment_method && (
                              <div className="je-payment-meta">Method: {entry.payment_method}</div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="je-col-amount ctb-debit">
                        {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}
                      </td>
                      <td className="je-col-amount ctb-credit">
                        {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '—'}
                      </td>
                      <td className="je-col-amount je-balance">{formatCurrency(entry.balance)}</td>
                      <td className="je-col-type">
                        <span className="je-type-badge">{entry.transaction_type || '—'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="je-pagination">
              <button
                type="button"
                className="je-pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </button>
              <span className="je-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="je-pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="je-modal-overlay">
          <div className="je-modal-content">
            <div className="je-modal-header">
              <h2>{editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
              <button type="button" className="je-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="je-form">
              <div className="je-form-row">
                <div className="je-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="je-form-group">
                  <label>Account *</label>
                  <select
                    name="account_code"
                    value={formData.account_code}
                    onChange={handleAccountChange}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="je-form-row">
                <div className="je-form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="je-form-group">
                  <label>Reference</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="je-form-row">
                <div className="je-form-group">
                  <label>Debit Amount</label>
                  <input
                    type="text"
                    name="debit"
                    value={formData.debit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="je-form-group">
                  <label>Credit Amount</label>
                  <input
                    type="text"
                    name="credit"
                    value={formData.credit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="je-form-row">
                <div className="je-form-group">
                  <label>Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Trade">Trade</option>
                    <option value="Dividend">Dividend</option>
                    <option value="Corporate Action">Corporate Action</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div className="je-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Draft">Draft</option>
                    <option value="Posted">Posted</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="je-form-actions">
                <button type="button" className="je-btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="je-btn-primary">
                  {editingEntry ? 'Update' : 'Create'} Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
