import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../services/cseApi';
import {
    itemMatchesHoldings,
    itemMatchesWatchlist
} from '../../utils/cseAnnouncementRank';
import './DashboardMarketMovers.css';

const REFRESH_MS = 3 * 60 * 1000;
// Show all rows the CSE returns; column lists scroll internally.
const COLUMN_LIMIT = 200;

const COLUMNS = [
    {
        id: 'gainers',
        label: 'Top Gainers',
        accent: 'up',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 15 12 9 18 15" />
            </svg>
        ),
        valueKey: 'percentageChange'
    },
    {
        id: 'losers',
        label: 'Top Losers',
        accent: 'down',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        ),
        valueKey: 'percentageChange'
    },
    {
        id: 'active',
        label: 'Most Active',
        accent: 'neutral',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        ),
        valueKey: 'turnover'
    }
];

const formatPrice = (value) =>
    value == null
        ? '—'
        : Number(value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
          });

const formatPct = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
};

const formatCompact = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const formatAsOf = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
};

const rankMovers = (items, options = {}) => {
    const {
        holdingSymbols = [],
        holdingNames = [],
        watchlistSymbols = [],
        limit = COLUMN_LIMIT
    } = options;

    const scored = (Array.isArray(items) ? items : []).map((item, index) => {
        let tier = 2;
        if (itemMatchesHoldings(item, holdingSymbols, holdingNames)) tier = 0;
        else if (itemMatchesWatchlist(item, watchlistSymbols)) tier = 1;
        return { item, tier, index };
    });

    scored.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.index - b.index;
    });

    return scored.slice(0, limit).map(({ item, tier }) => ({
        ...item,
        isHolding: tier === 0,
        isWatchlist: tier === 1
    }));
};

const pctClass = (value) => {
    if (value == null || Number(value) === 0) return 'is-flat';
    return Number(value) > 0 ? 'is-up' : 'is-down';
};

const DashboardMarketMovers = ({
    holdingSymbols = [],
    holdingNames = [],
    watchlistSymbols = []
}) => {
    const [feeds, setFeeds] = useState({ gainers: [], losers: [], active: [] });
    const [marketStatus, setMarketStatus] = useState({
        status: 'unknown',
        label: 'Loading…'
    });
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const result = await cseApi.dashboardMovers();
            setFeeds({
                gainers: result.gainers || [],
                losers: result.losers || [],
                active: result.active || []
            });
            setMarketStatus(result.marketStatus || { status: 'unknown', label: 'Unknown' });
            setLastUpdated(result.lastUpdated || new Date().toISOString());
            setNote(result.note || '');
        } catch (e) {
            setError('Failed to load market movers.');
            setFeeds({ gainers: [], losers: [], active: [] });
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    useEffect(() => {
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const ranked = useMemo(
        () => ({
            gainers: rankMovers(feeds.gainers, {
                holdingSymbols,
                holdingNames,
                watchlistSymbols
            }),
            losers: rankMovers(feeds.losers, {
                holdingSymbols,
                holdingNames,
                watchlistSymbols
            }),
            active: rankMovers(feeds.active, {
                holdingSymbols,
                holdingNames,
                watchlistSymbols
            })
        }),
        [feeds, holdingSymbols, holdingNames, watchlistSymbols]
    );

    const topMover = ranked.gainers[0];
    const worstMover = ranked.losers[0];
    const heroMover = topMover && worstMover
        ? Math.abs(Number(topMover.percentageChange) || 0) >=
          Math.abs(Number(worstMover.percentageChange) || 0)
            ? topMover
            : worstMover
        : topMover || worstMover;

    const statusKey = marketStatus.status || 'unknown';

    const renderRow = (item, columnId, ariaHidden = false) => {
        const pct = item.percentageChange;
        const showPct = columnId !== 'active';
        const valueDisplay = showPct
            ? formatPct(pct)
            : formatCompact(item.turnover);
        const subtitle = showPct
            ? `Rs. ${formatPrice(item.price)}`
            : `Vol ${formatCompact(item.shareVolume)}`;

        return (
            <div
                key={`${columnId}-${item.id || item.symbol}${ariaHidden ? '-dup' : ''}`}
                className={`mmb-row ${item.isHolding ? 'is-holding' : ''} ${
                    item.isWatchlist ? 'is-watchlist' : ''
                }`}
                aria-hidden={ariaHidden || undefined}
            >
                <div className="mmb-row__main">
                    <div className="mmb-row__symbol-line">
                        <span className="mmb-row__symbol">{item.symbol || '—'}</span>
                        {item.isHolding && (
                            <span className="mmb-row__badge is-holding" title="In your holdings">★</span>
                        )}
                        {!item.isHolding && item.isWatchlist && (
                            <span className="mmb-row__badge is-watchlist" title="On your watchlist">●</span>
                        )}
                    </div>
                    <span className="mmb-row__subtitle">{subtitle}</span>
                </div>
                <span
                    className={`mmb-row__value ${
                        showPct ? pctClass(pct) : 'is-active'
                    }`}
                >
                    {valueDisplay}
                </span>
            </div>
        );
    };

    return (
        <div className="market-movers-board">
            <div className="mmb-header">
                <div className="mmb-heading">
                    <span className="mmb-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </span>
                    <div className="mmb-heading-text">
                        <h3 className="mmb-title">Market Movers</h3>
                        <span className="mmb-subtitle">
                            {heroMover ? (
                                <>
                                    <span className="mmb-hero-inline">
                                        {Number(heroMover.percentageChange) >= 0 ? '▲' : '▼'}{' '}
                                        <strong>{heroMover.symbol || '—'}</strong>
                                        <span
                                            className={`mmb-hero-inline__pct ${pctClass(
                                                heroMover.percentageChange
                                            )}`}
                                        >
                                            {formatPct(heroMover.percentageChange)}
                                        </span>
                                    </span>
                                    {lastUpdated ? ` · ${formatAsOf(lastUpdated)}` : ''}
                                </>
                            ) : (
                                <>Live CSE board{lastUpdated ? ` · ${formatAsOf(lastUpdated)}` : ''}</>
                            )}
                        </span>
                    </div>
                </div>

                <div className="mmb-header-actions">
                    <span
                        className={`mmb-status mmb-status--${statusKey}`}
                        title={marketStatus.label}
                    >
                        <span className="mmb-status-dot" />
                        {marketStatus.label}
                    </span>
                    <button
                        type="button"
                        className="mmb-refresh"
                        onClick={() => load(false)}
                        disabled={isLoading}
                        aria-label="Refresh market movers"
                        title="Refresh"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="mmb-state">
                    <div className="loading-spinner" />
                    <span>Loading market data…</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="mmb-state is-error">
                    <span>{error}</span>
                    <button type="button" onClick={() => load(false)}>Retry</button>
                </div>
            )}

            {!isLoading && !error && (
                <div className="mmb-grid">
                    {COLUMNS.map((col) => {
                        const items = ranked[col.id] || [];
                        // Auto-scroll only when there are more rows than fit (~4).
                        const shouldAutoscroll = items.length > 4;
                        const animationDuration = `${Math.max(items.length * 3.2, 18)}s`;
                        return (
                            <section
                                key={col.id}
                                className={`mmb-col mmb-col--${col.accent}`}
                                aria-label={col.label}
                            >
                                <header className="mmb-col__header">
                                    <span className="mmb-col__icon" aria-hidden>{col.icon}</span>
                                    <span className="mmb-col__label">{col.label}</span>
                                    <span className="mmb-col__count">{items.length}</span>
                                </header>
                                {items.length === 0 ? (
                                    <div className="mmb-col__empty">
                                        {note || 'No data'}
                                    </div>
                                ) : (
                                    <div
                                        className={`mmb-col__viewport${
                                            shouldAutoscroll ? ' is-autoscrolling' : ''
                                        }`}
                                    >
                                        <div
                                            className="mmb-col__list"
                                            style={
                                                shouldAutoscroll
                                                    ? { animationDuration }
                                                    : undefined
                                            }
                                        >
                                            {items.map((item) =>
                                                renderRow(item, col.id, false)
                                            )}
                                            {shouldAutoscroll &&
                                                items.map((item) =>
                                                    renderRow(item, col.id, true)
                                                )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DashboardMarketMovers;
