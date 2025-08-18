import React, { useState, useEffect } from 'react';
import { generalLedgerAPI } from '../../services/api';
import './Styles/GeneralLedger.css';

const GeneralLedger = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    account_code: '',
    dateFrom: '',
    dateTo: '',
    transaction_type: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(20);

  // Fetch real data from API
  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching general ledger entries...');
      const data = await generalLedgerAPI.getAllEntries();
      console.log('Received ledger entries:', data);
      
      setLedgerEntries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      setError('Failed to fetch ledger entries: ' + error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerEntries();
  }, []);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredEntries = ledgerEntries.filter(entry => {
    const matchesSearch = 
      entry.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (!filters.account_code || entry.account_code.includes(filters.account_code)) &&
      (!filters.dateFrom || entry.date >= filters.dateFrom) &&
      (!filters.dateTo || entry.date <= filters.dateTo) &&
      (!filters.transaction_type || entry.transaction_type === filters.transaction_type) &&
      (!filters.status || entry.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const netBalance = totalCredits - totalDebits;

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  if (loading) {
    return (
      <div className="gl-page-container">
        <div className="gl-loading">Loading General Ledger...</div>
      </div>
    );
  }

  return (
    <div className="gl-page-container">
      <div className="gl-content-wrapper">
        {/* Header Section */}
        <div className="gl-header-section">
          <div className="gl-header-icon">
            <svg className="gl-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
              <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
            </svg>
          </div>
          <div className="gl-header-text-group">
            <h1 className="gl-main-title">General Ledger</h1>
            <p className="gl-subtitle">Comprehensive view of all accounting transactions and journal entries</p>
          </div>
        </div>

        {/* Filters and Search Card */}
        <div className="gl-filters-card">
          <div className="gl-card-header">
            <h2 className="gl-card-title">Filters & Search</h2>
          </div>
          <div className="gl-filters-content">
            <div className="gl-search-section">
              <input
                type="text"
                placeholder="Search by account code, name, description, or reference..."
                value={searchTerm}
                onChange={handleSearch}
                className="gl-search-input"
              />
            </div>
            
            <div className="gl-filters-grid">
              <div className="gl-filter-group">
                <label className="gl-filter-label">Account Code</label>
                <input
                  type="text"
                  name="account_code"
                  value={filters.account_code}
                  onChange={handleFilterChange}
                  placeholder="Enter account code"
                  className="gl-filter-input"
                />
              </div>

              <div className="gl-filter-group">
                <label className="gl-filter-label">Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="gl-filter-input"
                />
              </div>

              <div className="gl-filter-group">
                <label className="gl-filter-label">Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="gl-filter-input"
                />
              </div>

              <div className="gl-filter-group">
                <label className="gl-filter-label">Transaction Type</label>
                <select
                  name="transaction_type"
                  value={filters.transaction_type}
                  onChange={handleFilterChange}
                  className="gl-filter-select"
                >
                  <option value="">All Types</option>
                  <option value="Investment Purchase">Investment Purchase</option>
                  <option value="Trading Expense">Trading Expense</option>
                  <option value="Bank Payment">Bank Payment</option>
                  <option value="Asset Purchase">Asset Purchase</option>
                  <option value="Loan">Loan</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                  <option value="Journal Entry">Journal Entry</option>
                </select>
              </div>

              <div className="gl-filter-group">
                <label className="gl-filter-label">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="gl-filter-select"
                >
                  <option value="">All Status</option>
                  <option value="Posted">Posted</option>
                  <option value="Pending">Pending</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="gl-filter-group">
                <button
                  onClick={() => {
                    setFilters({
                      account_code: '',
                      dateFrom: '',
                      dateTo: '',
                      transaction_type: '',
                      status: ''
                    });
                    setSearchTerm('');
                  }}
                  className="gl-clear-filters-btn"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="gl-summary-stats">
          <div className="gl-stat-card">
            <div className="gl-stat-value">{filteredEntries.length}</div>
            <div className="gl-stat-label">Total Entries</div>
          </div>
          <div className="gl-stat-card">
            <div className="gl-stat-value debit">{formatCurrency(totalDebits)}</div>
            <div className="gl-stat-label">Total Debits</div>
          </div>
          <div className="gl-stat-card">
            <div className="gl-stat-value credit">{formatCurrency(totalCredits)}</div>
            <div className="gl-stat-label">Total Credits</div>
          </div>
          <div className="gl-stat-card">
            <div className={`gl-stat-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <div className="gl-stat-label">Net Balance</div>
          </div>
        </div>

        {/* Ledger Table Card */}
        <div className="gl-table-card">
          <div className="gl-card-header">
            <h2 className="gl-card-title">Ledger Entries ({filteredEntries.length} records)</h2>
            <div className="gl-table-actions">
                             <button 
                 className="gl-refresh-btn" 
                 onClick={() => {
                   setLoading(true);
                   fetchLedgerEntries();
                 }}
                 disabled={loading}
               >
                 {loading ? 'Refreshing...' : 'Refresh'}
               </button>
              <button className="gl-export-btn">Export to Excel</button>
              <button className="gl-print-btn">Print Report</button>
            </div>
          </div>

          <div className="gl-table-container">
            {error && (
              <div className="gl-error">{error}</div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="gl-no-data">No ledger entries found matching the current filters.</div>
            ) : (
              <>
                <table className="gl-ledger-table">
                  <thead>
                    <tr>
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
                    {currentEntries.map(entry => (
                      <tr key={entry.id} className="gl-table-row">
                        <td className="gl-date">{formatDate(entry.date)}</td>
                        <td className="gl-account-code">{entry.account_code}</td>
                        <td className="gl-account-name">{entry.account_name}</td>
                        <td className="gl-description">{entry.description}</td>
                        <td className="gl-reference">{entry.reference}</td>
                        <td className="gl-debit">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                        <td className="gl-credit">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                        <td className={`gl-balance ${entry.balance >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(Math.abs(entry.balance))}
                        </td>
                        <td className="gl-type">{entry.transaction_type}</td>
                        <td>
                          <span className={`gl-status ${entry.status.toLowerCase()}`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="gl-pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="gl-pagination-btn"
                    >
                      Previous
                    </button>
                    
                    <div className="gl-page-info">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="gl-pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="gl-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • General Ledger Management • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;





