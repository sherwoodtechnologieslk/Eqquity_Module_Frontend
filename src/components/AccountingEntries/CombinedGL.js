import React, { useEffect, useMemo, useState } from 'react';
import { generalLedgerAPI, gsecEntriesAPI } from '../../services/api';
import './Styles/CombinedGL.css';

const CombinedGL = ({ onTabChange }) => {
  const [equityEntries, setEquityEntries] = useState([]);
  const [gsecEntries, setGsecEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    source: 'all', // all | equity | gsec
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
      setError('');

      const [equityData, gsecData] = await Promise.all([
        generalLedgerAPI.getAllEntries(null),
        gsecEntriesAPI.getSavedLedgerEntries(null),
      ]);

      setEquityEntries(Array.isArray(equityData) ? equityData : []);
      setGsecEntries(Array.isArray(gsecData) ? gsecData : []);
    } catch (err) {
      console.error('Error fetching combined GL data:', err);
      setError(err.message || 'Failed to fetch combined general ledger data');
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
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
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

  const formatDateDisplay = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-LK');
  };

  if (loading) {
    return (
      <div className="cgl-page-container">
        <div className="cgl-loading">Loading Combined General Ledger...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cgl-page-container">
        <div className="cgl-error">
          <div className="cgl-error-title">Error loading Combined General Ledger</div>
          <div className="cgl-error-message">{error}</div>
          <button className="cgl-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cgl-page-container">
      <div className="cgl-content-wrapper">
        {/* Header */}
        <div className="cgl-header-section">
          <div className="cgl-header-icon">
            <svg className="cgl-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h3a1 1 0 01.707.293l2 2A1 1 0 0112 5v1h4a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="cgl-header-text-group">
            <h1 className="cgl-main-title">Combined General Ledger</h1>
            <p className="cgl-subtitle">
              Unified view of Equity and GSec ledger entries in a single screen.
            </p>
          </div>
        </div>

        {/* Filters & search */}
        <div className="cgl-filters-card">
          <div className="cgl-card-header">
            <h2 className="cgl-card-title">Filters & Search</h2>
          </div>
          <div className="cgl-filters-content">
            <div className="cgl-search-section">
              <input
                type="text"
                placeholder="Search by account code, name, description, reference or source..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="cgl-search-input"
              />
            </div>

            <div className="cgl-filters-grid">
              <div className="cgl-filter-group">
                <label className="cgl-filter-label">Source</label>
                <select
                  name="source"
                  value={filters.source}
                  onChange={handleFilterChange}
                  className="cgl-filter-select"
                >
                  <option value="all">All</option>
                  <option value="equity">Equity Only</option>
                  <option value="gsec">GSec Only</option>
                </select>
              </div>

              <div className="cgl-filter-group">
                <label className="cgl-filter-label">Account Code</label>
                <input
                  type="text"
                  name="account_code"
                  value={filters.account_code}
                  onChange={handleFilterChange}
                  className="cgl-filter-input"
                  placeholder="Enter account code"
                />
              </div>

              <div className="cgl-filter-group">
                <label className="cgl-filter-label">Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="cgl-filter-input"
                />
              </div>

              <div className="cgl-filter-group">
                <label className="cgl-filter-label">Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="cgl-filter-input"
                />
              </div>

              <div className="cgl-filter-group">
                <button type="button" className="cgl-clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="cgl-summary-stats">
          <div className="cgl-stat-card">
            <div className="cgl-stat-value">{filteredEntries.length}</div>
            <div className="cgl-stat-label">Total Entries</div>
          </div>
          <div className="cgl-stat-card">
            <div className="cgl-stat-value debit">{formatCurrency(totalDebits)}</div>
            <div className="cgl-stat-label">Total Debits</div>
          </div>
          <div className="cgl-stat-card">
            <div className="cgl-stat-value credit">{formatCurrency(totalCredits)}</div>
            <div className="cgl-stat-label">Total Credits</div>
          </div>
          <div className="cgl-stat-card">
            <div className={`cgl-stat-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <div className="cgl-stat-label">Net Balance</div>
          </div>
        </div>

        {/* Table */}
        <div className="cgl-table-card">
          <div className="cgl-card-header cgl-table-header">
            <h2 className="cgl-card-title">
              Combined Ledger Entries ({filteredEntries.length} records)
            </h2>
          </div>

          <div className="cgl-table-container">
            {filteredEntries.length === 0 ? (
              <div className="cgl-no-data">
                No ledger entries found for the selected filters.
              </div>
            ) : (
              <>
                <table className="cgl-ledger-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Debit (LKR)</th>
                      <th>Credit (LKR)</th>
                      <th>Balance (LKR)</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td
                          className="cgl-source-cell"
                          onClick={() => {
                            if (!onTabChange) return;
                            if (entry.source === 'Equity') {
                              onTabChange('General Ledger');
                            } else if (entry.source === 'GSec') {
                              onTabChange('GSec General Ledger');
                            }
                          }}
                        >
                          <span className="cgl-source" data-source={entry.source}>
                            {entry.source}
                          </span>
                        </td>
                        <td className="cgl-date">{formatDateDisplay(entry.date)}</td>
                        <td className="cgl-account-code">{entry.account_code}</td>
                        <td className="cgl-account-name">{entry.account_name}</td>
                        <td className="cgl-description">{entry.description}</td>
                        <td className="cgl-reference">{entry.reference}</td>
                        <td className="cgl-debit">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="cgl-credit">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td
                          className={`cgl-balance ${
                            entry.balance >= 0 ? 'positive' : 'negative'
                          }`}
                        >
                          {formatCurrency(Math.abs(entry.balance))}
                        </td>
                        <td className="cgl-type">{entry.transaction_type}</td>
                        <td className="cgl-status">
                          {entry.source === 'Equity' ? entry.status || '-' : 'GSec'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="cgl-pagination">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="cgl-pagination-btn"
                    >
                      Previous
                    </button>
                    <div className="cgl-page-info">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="cgl-pagination-btn"
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

export default CombinedGL;

