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
  change_percent: parseFloat(item.change_percent) || 0,
});

const formatNum = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-LK', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

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
    maxDate: null,
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
        search: query.search || null,
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
        maxDate: responseStats?.maxDate || null,
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
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const startPage = Math.max(1, query.page - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }

    return pages;
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSearchTerm('');
    setQuery({ page: 1, tradeDate: '', search: '' });
  };

  const formatDateLabel = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateRange = () => {
    if (!stats.minDate || !stats.maxDate) return 'No data';
    const min = formatDateLabel(stats.minDate);
    const max = formatDateLabel(stats.maxDate);
    return min === max ? min : `${min} – ${max}`;
  };

  if (loading && paginatedData.length === 0 && !error) {
    return (
      <div className="tsd-page">
        <div className="tsd-state">
          <div className="tsd-spinner" />
          <p>Loading trade summary data…</p>
        </div>
      </div>
    );
  }

  if (error && paginatedData.length === 0) {
    return (
      <div className="tsd-page">
        <div className="tsd-state tsd-state--error">
          <h3>Couldn’t load data</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchTradeSummaries} className="tsd-btn tsd-btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rangeStart = totalRecords === 0 ? 0 : (query.page - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(query.page * ITEMS_PER_PAGE, totalRecords);

  return (
    <div className="tsd-page">
      <section className="tsd-panel" aria-label="Trade summary filters">
        <div className="tsd-panel__head">
          <div>
            <h2>Trade Summary Data</h2>
            <p>Browse imported CSE trade summary sessions by date or security.</p>
          </div>
          <button
            type="button"
            className="tsd-btn tsd-btn--ghost"
            onClick={fetchTradeSummaries}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="tsd-filters">
          <label className="tsd-field tsd-field--grow">
            <span className="tsd-label">Search</span>
            <input
              type="text"
              className="tsd-input"
              placeholder="Company name or symbol…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <label className="tsd-field">
            <span className="tsd-label">Trade date</span>
            <input
              type="date"
              className="tsd-input"
              value={selectedDate}
              onChange={(e) => handleDateFilter(e.target.value)}
            />
          </label>

          <div className="tsd-field tsd-field--action">
            <span className="tsd-label tsd-label--spacer" aria-hidden>
              &nbsp;
            </span>
            <button type="button" className="tsd-btn tsd-btn--muted" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
      </section>

      <div className="tsd-stats">
        <article className="tsd-stat">
          <span>Total records</span>
          <strong>{Number(totalRecords || 0).toLocaleString('en-LK')}</strong>
        </article>
        <article className="tsd-stat">
          <span>Unique companies</span>
          <strong>{Number(stats.uniqueCompanies || 0).toLocaleString('en-LK')}</strong>
        </article>
        <article className="tsd-stat tsd-stat--wide">
          <span>Date range</span>
          <strong>{formatDateRange()}</strong>
        </article>
      </div>

      <section className="tsd-desk" aria-label="Trade summary table">
        {totalRecords === 0 ? (
          <div className="tsd-empty">
            <h3>No data found</h3>
            <p>
              {query.tradeDate
                ? `No trade summaries for ${formatDateLabel(query.tradeDate)}.`
                : 'No trade summary data yet. Upload a file from Market Price Feed first.'}
            </p>
          </div>
        ) : (
          <>
            <div className="tsd-desk__toolbar">
              <p className="tsd-desk__meta">
                Showing {rangeStart.toLocaleString('en-LK')}–{rangeEnd.toLocaleString('en-LK')} of{' '}
                {totalRecords.toLocaleString('en-LK')}
              </p>
              {totalPages > 1 && (
                <div className="tsd-pagination">
                  <button
                    type="button"
                    className="tsd-page-btn"
                    onClick={goToFirstPage}
                    disabled={query.page === 1 || loading}
                    title="First page"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="tsd-page-btn"
                    onClick={goToPreviousPage}
                    disabled={query.page === 1 || loading}
                    title="Previous page"
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`tsd-page-btn${query.page === pageNum ? ' is-active' : ''}`}
                      onClick={() => goToPage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="tsd-page-btn"
                    onClick={goToNextPage}
                    disabled={query.page === totalPages || loading}
                    title="Next page"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="tsd-page-btn"
                    onClick={goToLastPage}
                    disabled={query.page === totalPages || loading}
                    title="Last page"
                  >
                    »
                  </button>
                </div>
              )}
            </div>

            <div className={`tsd-table-wrap${loading ? ' is-loading' : ''}`}>
              <table className="tsd-table">
                <thead>
                  <tr>
                    <th>Trade date</th>
                    <th>Company</th>
                    <th>Symbol</th>
                    <th className="num">Share vol</th>
                    <th className="num">Trade vol</th>
                    <th className="num">Prev close</th>
                    <th className="num">Open</th>
                    <th className="num">High</th>
                    <th className="num">Low</th>
                    <th className="num">Last trade</th>
                    <th className="num">Change (Rs)</th>
                    <th className="num">Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const changeClass =
                      item.change_percent > 0 ? 'up' : item.change_percent < 0 ? 'down' : '';
                    return (
                      <tr key={item.id ?? `${item.trade_date}-${item.symbol}`}>
                        <td>{formatDateLabel(item.trade_date)}</td>
                        <td>{item.company_name || '—'}</td>
                        <td className="symbol">{item.symbol || '—'}</td>
                        <td className="num">{formatNum(item.share_volume, 0)}</td>
                        <td className="num">{formatNum(item.trade_volume, 0)}</td>
                        <td className="num">{formatNum(item.previous_close)}</td>
                        <td className="num">{formatNum(item.open)}</td>
                        <td className="num">{formatNum(item.high)}</td>
                        <td className="num">{formatNum(item.low)}</td>
                        <td className="num">{formatNum(item.last_trade)}</td>
                        <td className={`num ${changeClass}`}>{formatNum(item.change_rs)}</td>
                        <td className={`num ${changeClass}`}>{formatNum(item.change_percent)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default TradeSummaryData;
