import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../services/cseApi';
import { equityAPI } from '../../services/api';
import {
    itemMatchesHoldings,
    itemMatchesWatchlist
} from '../../utils/cseAnnouncementRank';
import './DashboardMarketMovers.css';

const REFRESH_MS = 3 * 60 * 1000;
// How often the board auto-advances to the next tab.
const CYCLE_MS = 6000;
// Auto-scroll the list once it has more rows than comfortably fit.
const AUTOSCROLL_MIN_ROWS = 5;
// Show all rows the CSE returns; the list scrolls internally.
const COLUMN_LIMIT = 200;

// Normalize a ticker to its base form (e.g. "SEMB.N0000" -> "SEMB") so CSE
// feed symbols can be matched against the local equity master.
const normalizeSym = (s) =>
    String(s || '')
        .toUpperCase()
        .split('.')[0]
        .replace(/[^A-Z0-9]/g, '')
        .trim();

const TABS = [
    {
        id: 'gainers',
        label: 'Gainers',
        featureTag: 'Top Gainer',
        accent: 'up',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 15 12 9 18 15" />
            </svg>
        )
    },
    {
        id: 'losers',
        label: 'Losers',
        featureTag: 'Top Loser',
        accent: 'down',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        )
    },
    {
        id: 'active',
        label: 'Most Active',
        featureTag: 'Most Active',
        accent: 'neutral',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        )
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
    const [activeTab, setActiveTab] = useState('gainers');
    const [symbolMeta, setSymbolMeta] = useState({});
    const [isPaused, setIsPaused] = useState(false);

    // Load the local equity master once to resolve company names + sectors that
    // the CSE movers feed often omits.
    useEffect(() => {
        let cancelled = false;
        equityAPI
            .getAllEquities()
            .then((rows) => {
                if (cancelled || !Array.isArray(rows)) return;
                const map = {};
                rows.forEach((r) => {
                    const key = normalizeSym(r.symbol);
                    if (key && !map[key]) {
                        map[key] = { name: r.name || '', sector: r.sector || '' };
                    }
                });
                setSymbolMeta(map);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

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

    // Auto-advance through the tabs on a timer (paused while hovered).
    useEffect(() => {
        if (isPaused) return undefined;
        const id = setInterval(() => {
            setActiveTab((current) => {
                const idx = TABS.findIndex((t) => t.id === current);
                const next = TABS[(idx + 1) % TABS.length];
                return next.id;
            });
        }, CYCLE_MS);
        return () => clearInterval(id);
    }, [isPaused]);

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

    const counts = {
        gainers: ranked.gainers.length,
        losers: ranked.losers.length,
        active: ranked.active.length
    };

    const tabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];
    const items = ranked[activeTab] || [];
    const isActiveTab = activeTab === 'active';
    const statusKey = marketStatus.status || 'unknown';

    // Magnitude used for the relative bars in each row.
    const magnitudeOf = useCallback(
        (item) =>
            isActiveTab
                ? Math.abs(Number(item.turnover) || 0)
                : Math.abs(Number(item.percentageChange) || 0),
        [isActiveTab]
    );

    const maxMagnitude = useMemo(() => {
        let max = 0;
        items.forEach((item) => {
            const m = magnitudeOf(item);
            if (m > max) max = m;
        });
        return max;
    }, [items, magnitudeOf]);

    const feature = items[0];
    const restItems = items.slice(1);

    const valueOf = (item) =>
        isActiveTab ? formatCompact(item.turnover) : formatPct(item.percentageChange);
    const subtitleOf = (item) =>
        isActiveTab
            ? `Vol ${formatCompact(item.shareVolume)}`
            : `Rs. ${formatPrice(item.price)}`;
    const valueClassOf = (item) =>
        isActiveTab ? 'is-active' : pctClass(item.percentageChange);
    const metaOf = (item) => symbolMeta[normalizeSym(item.symbol)] || null;
    const companyOf = (item) => item.company || metaOf(item)?.name || '';
    const sectorOf = (item) => metaOf(item)?.sector || '';

    const renderBadge = (item) => {
        if (item.isHolding) {
            return <span className="mm2-badge is-holding" title="In your holdings">★</span>;
        }
        if (item.isWatchlist) {
            return <span className="mm2-badge is-watchlist" title="On your watchlist">●</span>;
        }
        return null;
    };

    const renderRow = (item, index, dup = false) => {
        const magnitude = magnitudeOf(item);
        const barWidth = maxMagnitude > 0 ? Math.max((magnitude / maxMagnitude) * 100, 4) : 0;
        return (
            <div
                key={`${activeTab}-${item.id || item.symbol}${dup ? '-dup' : ''}`}
                className={`mm2-row ${item.isHolding ? 'is-holding' : ''} ${
                    item.isWatchlist ? 'is-watchlist' : ''
                }`}
                aria-hidden={dup || undefined}
            >
                <span className="mm2-row__rank">{index + 2}</span>
                <div className="mm2-row__info">
                    <div className="mm2-row__symline">
                        <span className="mm2-row__symbol">{item.symbol || '—'}</span>
                        {renderBadge(item)}
                        {sectorOf(item) ? (
                            <span className="mm2-row__sector" title={sectorOf(item)}>
                                {sectorOf(item)}
                            </span>
                        ) : null}
                    </div>
                    {companyOf(item) ? (
                        <span className="mm2-row__company" title={companyOf(item)}>
                            {companyOf(item)}
                        </span>
                    ) : null}
                    <span className="mm2-row__sub">{subtitleOf(item)}</span>
                </div>
                <div className={`mm2-row__bar mm2-row__bar--${tabMeta.accent}`} aria-hidden>
                    <span style={{ width: `${barWidth}%` }} />
                </div>
                <span className={`mm2-row__value ${valueClassOf(item)}`}>{valueOf(item)}</span>
            </div>
        );
    };

    return (
        <div
            className={`market-movers-board mm2 mm2--${tabMeta.accent}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="mm2-header">
                <div className="mm2-heading">
                    <span className="mm2-heading__icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </span>
                    <div className="mm2-heading__text">
                        <h3 className="mm2-title">Market Movers</h3>
                        <span className="mm2-subtitle">
                            Live CSE board{lastUpdated ? ` · ${formatAsOf(lastUpdated)}` : ''}
                        </span>
                    </div>
                </div>

                <div className="mm2-header__actions">
                    <span
                        className={`mm2-status mm2-status--${statusKey}`}
                        title={marketStatus.label}
                    >
                        <span className="mm2-status__dot" />
                        {marketStatus.label}
                    </span>
                    <button
                        type="button"
                        className="mm2-refresh"
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

            <div className="mm2-tabs" role="tablist" aria-label="Market mover categories">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`mm2-tab mm2-tab--${tab.accent} ${
                            activeTab === tab.id ? 'is-active' : ''
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="mm2-tab__icon" aria-hidden>{tab.icon}</span>
                        <span className="mm2-tab__label">{tab.label}</span>
                        <span className="mm2-tab__count">{counts[tab.id]}</span>
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="mm2-state">
                    <div className="loading-spinner" />
                    <span>Loading market data…</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="mm2-state is-error">
                    <span>{error}</span>
                    <button type="button" onClick={() => load(false)}>Retry</button>
                </div>
            )}

            {!isLoading && !error && (
                <div className="mm2-body">
                    {feature ? (
                        <div className={`mm2-feature mm2-feature--${tabMeta.accent}`}>
                            <div className="mm2-feature__left">
                                <span className="mm2-feature__tag">
                                    <span className="mm2-feature__tag-icon" aria-hidden>
                                        {tabMeta.icon}
                                    </span>
                                    {tabMeta.featureTag}
                                </span>
                                <div className="mm2-feature__symline">
                                    <span className="mm2-feature__symbol">
                                        {feature.symbol || '—'}
                                    </span>
                                    {renderBadge(feature)}
                                    {sectorOf(feature) ? (
                                        <span className="mm2-feature__sector" title={sectorOf(feature)}>
                                            {sectorOf(feature)}
                                        </span>
                                    ) : null}
                                </div>
                                {companyOf(feature) ? (
                                    <span className="mm2-feature__company" title={companyOf(feature)}>
                                        {companyOf(feature)}
                                    </span>
                                ) : null}
                                <span className="mm2-feature__sub">{subtitleOf(feature)}</span>
                            </div>
                            <span className={`mm2-feature__value ${valueClassOf(feature)}`}>
                                {valueOf(feature)}
                            </span>
                        </div>
                    ) : (
                        <div className="mm2-empty">{note || 'No data available'}</div>
                    )}

                    {restItems.length > 0 && (() => {
                        const autoscroll = restItems.length > AUTOSCROLL_MIN_ROWS;
                        const trackDuration = `${Math.max(restItems.length * 2.4, 12)}s`;
                        return (
                            <div className={`mm2-list${autoscroll ? ' is-autoscrolling' : ''}`}>
                                <div
                                    className="mm2-list__track"
                                    style={autoscroll ? { animationDuration: trackDuration } : undefined}
                                >
                                    {restItems.map((item, index) => renderRow(item, index))}
                                    {autoscroll &&
                                        restItems.map((item, index) =>
                                            renderRow(item, index, true)
                                        )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default DashboardMarketMovers;
