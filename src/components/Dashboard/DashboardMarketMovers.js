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
    const [, setMarketStatus] = useState({
        status: 'unknown',
        label: 'Loading…'
    });
    const [, setLastUpdated] = useState(null);
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

    const metaOf = (item) => symbolMeta[normalizeSym(item.symbol)] || null;
    const companyOf = (item) => item.company || metaOf(item)?.name || '';
    const sectorOf = (item) => metaOf(item)?.sector || '';

    const isActiveCat = (tabId) => tabId === 'active';
    const valueFor = (item, tabId) =>
        isActiveCat(tabId) ? formatCompact(item.turnover) : formatPct(item.percentageChange);
    const subFor = (item, tabId) =>
        isActiveCat(tabId)
            ? `Vol ${formatCompact(item.shareVolume)}`
            : `Rs. ${formatPrice(item.price)}`;
    const valueClassFor = (item, tabId) =>
        isActiveCat(tabId) ? 'is-active' : pctClass(item.percentageChange);

    // Top item of each category — drives the always-visible spotlight strip.
    const spotlights = TABS.map((tab) => ({
        tab,
        item: (ranked[tab.id] || [])[0] || null
    }));

    const renderBadge = (item) => {
        if (item.isHolding) {
            return <span className="mmx-badge is-holding" title="In your holdings">★</span>;
        }
        if (item.isWatchlist) {
            return <span className="mmx-badge is-watchlist" title="On your watchlist">●</span>;
        }
        return null;
    };

    const renderRow = (item, index, dup = false) => {
        const magnitude = magnitudeOf(item);
        const barWidth = maxMagnitude > 0 ? Math.max((magnitude / maxMagnitude) * 100, 4) : 0;
        const rank = index + 1;
        return (
            <div
                key={`${activeTab}-${item.id || item.symbol}${dup ? '-dup' : ''}`}
                className={`mmx-row ${item.isHolding ? 'is-holding' : ''} ${
                    item.isWatchlist ? 'is-watchlist' : ''
                }`}
                aria-hidden={dup || undefined}
            >
                <span className={`mmx-row__rank${rank <= 3 ? ' is-top' : ''}`}>{rank}</span>
                <div className="mmx-row__info">
                    <div className="mmx-row__symline">
                        <span className="mmx-row__symbol">{item.symbol || '—'}</span>
                        {renderBadge(item)}
                        {sectorOf(item) ? (
                            <span className="mmx-row__sector" title={sectorOf(item)}>
                                {sectorOf(item)}
                            </span>
                        ) : null}
                    </div>
                    {companyOf(item) ? (
                        <span className="mmx-row__company" title={companyOf(item)}>
                            {companyOf(item)}
                        </span>
                    ) : null}
                </div>
                <div className="mmx-row__metric">
                    <div className={`mmx-row__bar mmx-row__bar--${tabMeta.accent}`} aria-hidden>
                        <span style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="mmx-row__sub">{subFor(item, activeTab)}</span>
                </div>
                <span className={`mmx-row__value ${valueClassFor(item, activeTab)}`}>
                    {valueFor(item, activeTab)}
                </span>
            </div>
        );
    };

    return (
        <div
            className={`market-movers-board mmx mmx--${tabMeta.accent}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {isLoading && (
                <div className="mmx-state">
                    <div className="loading-spinner" />
                    <span>Loading market data…</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="mmx-state is-error">
                    <span>{error}</span>
                    <button type="button" onClick={() => load(false)}>Retry</button>
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <div className="mmx__spotlights">
                        {spotlights.map(({ tab, item }) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`mmx-spot mmx-spot--${tab.accent} ${
                                    activeTab === tab.id ? 'is-active' : ''
                                }`}
                                onClick={() => setActiveTab(tab.id)}
                                aria-pressed={activeTab === tab.id}
                            >
                                <span className="mmx-spot__tag">
                                    <span className="mmx-spot__tag-icon" aria-hidden>
                                        {tab.icon}
                                    </span>
                                    {tab.featureTag}
                                </span>
                                {item ? (
                                    <>
                                        <span className="mmx-spot__symbol">
                                            {item.symbol || '—'}
                                            {renderBadge(item)}
                                        </span>
                                        <span className="mmx-spot__company" title={companyOf(item)}>
                                            {companyOf(item) || sectorOf(item) || '\u00A0'}
                                        </span>
                                        <span
                                            className={`mmx-spot__value ${valueClassFor(item, tab.id)}`}
                                        >
                                            {valueFor(item, tab.id)}
                                        </span>
                                        <span className="mmx-spot__sub">{subFor(item, tab.id)}</span>
                                    </>
                                ) : (
                                    <span className="mmx-spot__empty">No data</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mmx__seg" role="tablist" aria-label="Market mover categories">
                        <span
                            className="mmx__seg-glider"
                            style={{
                                transform: `translateX(${
                                    TABS.findIndex((t) => t.id === activeTab) * 100
                                }%)`
                            }}
                            aria-hidden
                        />
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`mmx__seg-btn mmx__seg-btn--${tab.accent} ${
                                    activeTab === tab.id ? 'is-active' : ''
                                }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="mmx__seg-label">{tab.label}</span>
                                <span className="mmx__seg-count">{counts[tab.id]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mmx__panel">
                        <div className="mmx__panel-head">
                            <span>#</span>
                            <span>Security</span>
                            <span className="mmx__panel-head-metric">
                                {isActiveTab ? 'Volume' : 'Last price'}
                            </span>
                            <span className="mmx__panel-head-value">
                                {isActiveTab ? 'Turnover' : 'Change'}
                            </span>
                        </div>

                        {items.length === 0 ? (
                            <div className="mmx-empty">{note || 'No data available'}</div>
                        ) : (() => {
                            const autoscroll = items.length > AUTOSCROLL_MIN_ROWS;
                            const trackDuration = `${Math.max(items.length * 2.4, 12)}s`;
                            return (
                                <div className={`mmx__list${autoscroll ? ' is-autoscrolling' : ''}`}>
                                    <div
                                        className="mmx__list-track"
                                        style={autoscroll ? { animationDuration: trackDuration } : undefined}
                                    >
                                        {items.map((item, index) => renderRow(item, index))}
                                        {autoscroll &&
                                            items.map((item, index) =>
                                                renderRow(item, index, true)
                                            )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardMarketMovers;
