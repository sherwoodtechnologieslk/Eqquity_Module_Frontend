import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dashboardAPI } from '../../services/api';
import {
  parseGlobalMarketPayload,
  isGlobalVenueOpen,
  groupMarketsByType,
  normalizeMarketType,
  getSessionProgress,
  formatDurationShort
} from '../../utils/globalMarketStatus';
import './GlobalMarkets.css';

// Pulled from the same Alpha Vantage MARKET_STATUS proxy that powers the
// Dashboard's "Global Market Status" card. The backend caches for a few minutes
// and the page itself refreshes every 5 minutes so we don't burn the quota.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const TYPE_FILTERS = ['All', 'Equity', 'Forex', 'Cryptocurrency'];

const formatTime = (date) =>
  date
    ? date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : '';

const GlobalMarkets = () => {
  const [status, setStatus] = useState({
    loading: true,
    fetchedAt: null,
    error: null,
    data: null
  });
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All / Open / Closed
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Ticks once a minute so the live session-progress bars advance between the
  // 5-minute data refreshes (getSessionProgress reads the wall clock).
  const [, setClockTick] = useState(0);

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await dashboardAPI.getGlobalMarketStatus();
      setStatus({
        loading: false,
        fetchedAt: new Date(),
        error: null,
        data
      });
    } catch (e) {
      setStatus((prev) => ({
        loading: false,
        fetchedAt: new Date(),
        error: e?.message || 'Failed to load global market status',
        data: prev.data // keep previous data so the UI doesn't blank on a transient error
      }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadStatus({ silent: true });
    const interval = setInterval(() => {
      if (isMounted) loadStatus({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadStatus]);

  useEffect(() => {
    const interval = setInterval(() => setClockTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const parsed = useMemo(() => parseGlobalMarketPayload(status.data), [status.data]);
  const allMarkets = parsed.markets;
  const apiMessage = parsed.apiMessage;
  const rawKeys = parsed.rawKeys;

  const filteredMarkets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allMarkets.filter((m) => {
      const type = normalizeMarketType(m.market_type);
      const open = isGlobalVenueOpen(m);
      if (typeFilter !== 'All' && type !== typeFilter) return false;
      if (statusFilter === 'Open' && !open) return false;
      if (statusFilter === 'Closed' && open) return false;
      if (!query) return true;
      return (
        String(m.primary_exchanges || '').toLowerCase().includes(query) ||
        String(m.region || '').toLowerCase().includes(query) ||
        String(m.market_type || '').toLowerCase().includes(query) ||
        String(m.notes || '').toLowerCase().includes(query)
      );
    });
  }, [allMarkets, typeFilter, statusFilter, searchQuery]);

  const grouped = useMemo(() => groupMarketsByType(filteredMarkets), [filteredMarkets]);
  const openMarketsNow = useMemo(
    () => filteredMarkets.filter(isGlobalVenueOpen),
    [filteredMarkets]
  );

  const summary = useMemo(() => {
    const total = allMarkets.length;
    const open = allMarkets.filter(isGlobalVenueOpen).length;
    const equity = allMarkets.filter(
      (m) => String(m.market_type || '').toLowerCase() === 'equity'
    ).length;
    const forex = allMarkets.filter(
      (m) => String(m.market_type || '').toLowerCase() === 'forex'
    ).length;
    const crypto = allMarkets.filter((m) => {
      const t = String(m.market_type || '').toLowerCase();
      return t === 'cryptocurrency' || t === 'crypto';
    }).length;
    return { total, open, closed: total - open, equity, forex, crypto };
  }, [allMarkets]);

  // ---------- render branches ----------

  const renderEmpty = (title, hint) => (
    <div className="gm-empty-state">
      <p>{title}</p>
      {hint && <span>{hint}</span>}
    </div>
  );

  let body;
  if (status.loading && !status.data) {
    body = (
      <div className="gm-loading">
        <div className="gm-loading-spinner" />
        <p>Loading global market status…</p>
      </div>
    );
  } else if (status.error && !status.data) {
    body = renderEmpty(
      status.error,
      'Set ALPHAVANTAGE_API_KEY on the backend (Equity_module_Backend/.env) and restart the server.'
    );
  } else if (allMarkets.length === 0 && apiMessage) {
    body = renderEmpty('Market status unavailable', apiMessage);
  } else if (allMarkets.length === 0) {
    body = renderEmpty(
      'No venue rows found in the provider response.',
      rawKeys
        ? `Top-level fields returned: ${rawKeys}`
        : 'Confirm the backend can reach https://www.alphavantage.co and that ALPHAVANTAGE_API_KEY is valid.'
    );
  } else if (filteredMarkets.length === 0) {
    body = renderEmpty('No markets match the current filters.', 'Try clearing the search or switching the type/status filter.');
  } else {
    body = (
      <>
        {apiMessage && (
          <div className="gm-api-banner" role="status">
            {apiMessage}
          </div>
        )}

        {openMarketsNow.length > 0 && (
          <div className="gm-open-strip" aria-label="Markets currently open">
            <div className="gm-open-strip__label">Currently open</div>
            <ul className="gm-open-list">
              {openMarketsNow.map((m, idx) => (
                <li key={`${m.primary_exchanges || 'm'}-${idx}`}>
                  <span className="gm-open-dot" aria-hidden />
                  <span className="gm-open-name">{m.primary_exchanges || '—'}</span>
                  <span className="gm-open-meta">
                    {m.region ? `${m.region} · ` : ''}
                    {normalizeMarketType(m.market_type)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {grouped.map((group) => (
          <section key={group.heading} className="gm-group">
            <h4 className="gm-group__title">{group.heading}</h4>
            <div className="gm-table-wrap">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th scope="col">Exchange</th>
                    <th scope="col">Region</th>
                    <th scope="col">Status</th>
                    <th scope="col">Opens</th>
                    <th scope="col">Closes</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((m, idx) => {
                    const open = isGlobalVenueOpen(m);
                    const progress = getSessionProgress(m);
                    const pct = progress
                      ? Math.round(progress.fraction * 100)
                      : null;
                    return (
                      <tr
                        key={`${group.heading}-${m.primary_exchanges || idx}-${idx}`}
                      >
                        <td className="gm-table__exchange">
                          {m.primary_exchanges || '—'}
                        </td>
                        <td>{m.region || '—'}</td>
                        <td>
                          <span
                            className={`gm-pill ${open ? 'is-open' : 'is-closed'}`}
                          >
                            <span className="gm-pill-dot" aria-hidden />
                            {open ? 'Open' : 'Closed'}
                          </span>
                          {progress && (
                            <div
                              className="gm-session"
                              title={`Session ${pct}% complete · ${formatDurationShort(
                                progress.remainingMinutes
                              )} to close`}
                            >
                              <div className="gm-session__bar">
                                <div
                                  className="gm-session__fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="gm-session__text">
                                {pct}% · {formatDurationShort(progress.remainingMinutes)} left
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="gm-table__time">{m.local_open || '—'}</td>
                        <td className="gm-table__time">{m.local_close || '—'}</td>
                        <td className="gm-table__notes">
                          {m.notes ? String(m.notes) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="gm-container">
      <div className="gm-header">
        <div>
          <h1 className="gm-title">Global Markets</h1>
          <p className="gm-subtitle">
            Live exchange open/close status powered by Alpha Vantage MARKET_STATUS
          </p>
        </div>
        <div className="gm-header-actions">
          <button
            type="button"
            className="gm-refresh-btn"
            onClick={() => loadStatus()}
            disabled={refreshing}
            title="Refresh now"
          >
            <svg
              className={`gm-refresh-icon ${refreshing ? 'is-spinning' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.064 10.534a1 1 0 011.353.4A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.4-1.353z"
                clipRule="evenodd"
              />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="gm-summary-grid">
        <div className="gm-summary-card">
          <span className="gm-summary-label">Markets open</span>
          <span className="gm-summary-value">
            {summary.open}
            <span className="gm-summary-total">/{summary.total}</span>
          </span>
        </div>
        <div className="gm-summary-card gm-summary-positive">
          <span className="gm-summary-label">Equity venues</span>
          <span className="gm-summary-value">{summary.equity}</span>
        </div>
        <div className="gm-summary-card">
          <span className="gm-summary-label">Forex</span>
          <span className="gm-summary-value">{summary.forex}</span>
        </div>
        <div className="gm-summary-card">
          <span className="gm-summary-label">Crypto</span>
          <span className="gm-summary-value">{summary.crypto}</span>
        </div>
      </div>

      <div className="gm-controls">
        <div className="gm-search-box">
          <svg className="gm-search-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="gm-search-input"
            placeholder="Search exchange, region or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="gm-filter-group">
          <span className="gm-filter-label">Type</span>
          <div className="gm-chip-row">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                className={`gm-chip ${typeFilter === t ? 'is-active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'Cryptocurrency' ? 'Crypto' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="gm-filter-group">
          <span className="gm-filter-label">Status</span>
          <div className="gm-chip-row">
            {['All', 'Open', 'Closed'].map((s) => (
              <button
                key={s}
                type="button"
                className={`gm-chip ${statusFilter === s ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status.error && status.data && (
        <div className="gm-stale-banner" role="status">
          Showing the last successful snapshot — latest refresh failed: {status.error}
        </div>
      )}

      {body}

      {status.fetchedAt && (
        <p className="gm-footer">
          Last updated: {formatTime(status.fetchedAt)}
        </p>
      )}
    </div>
  );
};

export default GlobalMarkets;
