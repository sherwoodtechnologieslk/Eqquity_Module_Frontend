import React, { useState, useEffect, useCallback } from 'react';
import { tradeSummaryAPI } from '../../services/api';
import './Styles/TradeSummaryData.css';

const ITEMS_PER_PAGE = 500;

const transformRow = (item) => ({
  ...item,
  share_volume: parseFloat(item.share_volume) || 0,
  trade_volume: parseFloat(item.trade_volume) || 0,
  previous_close: parseFloat(item.previous_close) || 0,
  open: parseFloat(item.open) || 0,
  high: parseFloat(item.high) || 0,
  low: parseFloat(item.low) || 0,
  last_trade: parseFloat(item.last_trade) || 0,
  change_rs: parseFloat(item.change_rs) || 0,
  change_percent: parseFloat(item.change_percent) || 0
});

const TradeSummaryData = () => {
  const [paginatedData, setPaginatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [query, setQuery] = useState({ page: 1, tradeDate: '', search: '' });

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({
    uniqueCompanies: 0,
    minDate: null,
    maxDate: null
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => {
        if (prev.search === searchTerm) return prev;
        return { ...prev, search: searchTerm, page: 1 };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTradeSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await tradeSummaryAPI.getTradeSummariesPaginated({
        page: query.page,
        limit: ITEMS_PER_PAGE,
        tradeDate: query.tradeDate || null,
        search: query.search || null
      });

      const { data, pagination, stats: responseStats } = result;

      setPaginatedData((data || []).map(transformRow));
      setTotalPages(pagination?.totalPages || 0);
      setTotalRecords(pagination?.total || 0);

      if (pagination?.page && pagination.page !== query.page) {
        setQuery((prev) => ({ ...prev, page: pagination.page }));
      }

      setStats({
        uniqueCompanies: responseStats?.uniqueCompanies || 0,
        minDate: responseStats?.minDate || null,
        maxDate: responseStats?.maxDate || null
      });
    } catch (err) {
      const msg = err?.message || '';
      setError(
        msg.includes('401') || /session expired|authorization denied|not valid/i.test(msg)
          ? 'Your session has expired. Please log out and sign in again.'
          : 'Failed to fetch trade summary data'
      );
      console.error('Error fetching trade summaries:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchTradeSummaries();
  }, [fetchTradeSummaries]);

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    setQuery((prev) => ({ ...prev, tradeDate: date, page: 1 }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setQuery((prev) => ({ ...prev, page }));
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(query.page - 1);
  const goToNextPage = () => goToPage(query.page + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, query.page - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSearchTerm('');
    setQuery({ page: 1, tradeDate: '', search: '' });
  };

  const formatDateRange = () => {
    if (!stats.minDate || !stats.maxDate) return 'No data available';
    const min = new Date(stats.minDate).toLocaleDateString();
    const max = new Date(stats.maxDate).toLocaleDateString();
    return min === max ? min : `${min} - ${max}`;
  };

  if (loading && paginatedData.length === 0 && !error) {
    return (
      <div className="tsd-equity-module-main-container">
        <div className="tsd-loading-state-wrapper">
          <div className="tsd-loading-spinner-animation"></div>
          <p>Loading trade summary data...</p>
        </div>
      </div>
    );
  }

  if (error && paginatedData.length === 0) {
    return (
      <div className="tsd-equity-module-main-container">
        <div className="tsd-error-state-container">
          <div className="tsd-error-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={fetchTradeSummaries} className="tsd-retry-button-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tsd-equity-module-main-container">
      <div className="tsd-page-header-section">
        <div className="tsd-header-content-wrapper">
          <div className="tsd-header-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div className="tsd-header-text-content">
            <h2>Trade Summary Data</h2>
            <p>View and analyze uploaded trade summary information</p>
          </div>
        </div>
      </div>

      <div className="tsd-controls-section">
        <div className="tsd-filter-controls-wrapper">
          <div className="tsd-search-wrapper">
            <label htmlFor="searchInput">Search:</label>
            <input
              type="text"
              id="searchInput"
              placeholder="Search by company name or symbol..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="tsd-search-input"
            />
          </div>
          <label htmlFor="dateFilter">Filter by Date:</label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="tsd-date-filter-input"
          />
          <button onClick={clearFilters} className="tsd-clear-filters-button">
            Clear Filters
          </button>
        </div>
        <div className="tsd-refresh-controls-wrapper">
          <button onClick={fetchTradeSummaries} className="tsd-refresh-data-button" disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="tsd-summary-cards-section">
        <div className="tsd-summary-card-item">
          <div className="tsd-summary-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
          <div className="tsd-summary-content-wrapper">
            <h3>Total Records</h3>
            <p className="tsd-summary-number-display">{totalRecords}</p>
          </div>
        </div>
        <div className="tsd-summary-card-item">
          <div className="tsd-summary-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="tsd-summary-content-wrapper">
            <h3>Date Range</h3>
            <p className="tsd-summary-text-display">{formatDateRange()}</p>
          </div>
        </div>
        <div className="tsd-summary-card-item">
          <div className="tsd-summary-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4v18"/>
              <path d="M19 21V11l-6-4"/>
              <path d="M9 9h.01"/>
              <path d="M15 9h.01"/>
            </svg>
          </div>
          <div className="tsd-summary-content-wrapper">
            <h3>Unique Companies</h3>
            <p className="tsd-summary-number-display">{stats.uniqueCompanies}</p>
          </div>
        </div>
      </div>

      <div className="tsd-table-container-section">
        {totalRecords === 0 ? (
          <div className="tsd-no-data-state">
            <div className="tsd-no-data-icon-svg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
              </svg>
            </div>
            <h3>No Data Found</h3>
            <p>
              {query.tradeDate
                ? `No trade summaries found for ${new Date(query.tradeDate).toLocaleDateString()}`
                : 'No trade summary data available. Try uploading some data first.'}
            </p>
          </div>
        ) : (
          <>
            {totalPages > 1 && (
              <div className="tsd-pagination-container">
                <div className="tsd-pagination-info">
                  Showing {((query.page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(query.page * ITEMS_PER_PAGE, totalRecords)} of {totalRecords} records
                </div>
                <div className="tsd-pagination-controls">
                  <button
                    className="tsd-pagination-btn tsd-pagination-first"
                    onClick={goToFirstPage}
                    disabled={query.page === 1 || loading}
                    title="First Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 19l-7-7 7-7M21 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  <button
                    className="tsd-pagination-btn tsd-pagination-prev"
                    onClick={goToPreviousPage}
                    disabled={query.page === 1 || loading}
                    title="Previous Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>

                  <div className="tsd-pagination-numbers">
                    {getPageNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        className={`tsd-pagination-btn tsd-pagination-number ${query.page === pageNum ? 'active' : ''}`}
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                        title={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    className="tsd-pagination-btn tsd-pagination-next"
                    onClick={goToNextPage}
                    disabled={query.page === totalPages || loading}
                    title="Next Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  <button
                    className="tsd-pagination-btn tsd-pagination-last"
                    onClick={goToLastPage}
                    disabled={query.page === totalPages || loading}
                    title="Last Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 5l7 7-7 7M3 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className={`tsd-table-wrapper-container${loading ? ' tsd-table-loading' : ''}`}>
              <table className="tsd-trade-summary-data-table">
                <thead>
                  <tr>
                    <th>Trade Date</th>
                    <th>Company Name</th>
                    <th>Symbol</th>
                    <th>Share Volume</th>
                    <th>Trade Volume</th>
                    <th>Previous Close</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Last Trade</th>
                    <th>Change (Rs)</th>
                    <th>Change (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id ?? `${item.trade_date}-${item.symbol}`}>
                      <td>{new Date(item.trade_date).toLocaleDateString()}</td>
                      <td>{item.company_name || 'N/A'}</td>
                      <td>{item.symbol || 'N/A'}</td>
                      <td>{item.share_volume.toLocaleString()}</td>
                      <td>{item.trade_volume.toLocaleString()}</td>
                      <td>{item.previous_close.toFixed(2)}</td>
                      <td>{item.open.toFixed(2)}</td>
                      <td>{item.high.toFixed(2)}</td>
                      <td>{item.low.toFixed(2)}</td>
                      <td>{item.last_trade.toFixed(2)}</td>
                      <td className={item.change_rs >= 0 ? 'tsd-positive-change-value' : 'tsd-negative-change-value'}>
                        {item.change_rs.toFixed(2)}
                      </td>
                      <td className={item.change_percent >= 0 ? 'tsd-positive-change-value' : 'tsd-negative-change-value'}>
                        {item.change_percent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradeSummaryData;
