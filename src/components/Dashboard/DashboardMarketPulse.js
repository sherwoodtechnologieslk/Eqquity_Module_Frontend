import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../services/cseApi';
import { rankAnnouncements } from '../../utils/cseAnnouncementRank';
import './DashboardMarketPulse.css';

const REFRESH_MS = 3 * 60 * 1000;

const TABS = [
    {
        id: 'corporate',
        label: 'Corporate Actions',
        targetTab: 'Corporate Notices',
        itemsKey: 'corporate'
    },
    {
        id: 'listings',
        label: 'New Listings',
        targetTab: 'Market Announcements',
        itemsKey: 'listings'
    }
];

const RELATIVE_DIVISIONS = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' }
];

const relativeTime = (iso) => {
    if (!iso) return '';
    let duration = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const division of RELATIVE_DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            try {
                return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
                    Math.round(duration),
                    division.name
                );
            } catch (e) {
                return new Date(iso).toLocaleDateString();
            }
        }
        duration /= division.amount;
    }
    return new Date(iso).toLocaleDateString();
};

const FALLBACK_LOGO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#bfdbfe"/>' +
            '</linearGradient></defs>' +
            '<rect width="100%" height="100%" fill="url(#g)"/>' +
            '<text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="#1e40af" font-family="Inter, sans-serif" font-size="22" font-weight="800">CSE</text>' +
            '</svg>'
    );

const FALLBACK_HERO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">' +
            '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#0ea5e9"/>' +
            '</linearGradient></defs>' +
            '<rect width="100%" height="100%" fill="url(#bg)"/>' +
            '<g fill="rgba(255,255,255,0.18)">' +
            '<rect x="32" y="118" width="22" height="38"/>' +
            '<rect x="62" y="92" width="22" height="64"/>' +
            '<rect x="92" y="68" width="22" height="88"/>' +
            '<rect x="122" y="100" width="22" height="56"/>' +
            '<rect x="152" y="50" width="22" height="106"/>' +
            '<rect x="182" y="76" width="22" height="80"/>' +
            '<rect x="212" y="58" width="22" height="98"/>' +
            '<rect x="242" y="42" width="22" height="114"/>' +
            '</g>' +
            '<text x="50%" y="38" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="rgba(255,255,255,0.9)" font-family="Inter, sans-serif" font-size="14" font-weight="700" letter-spacing="2">' +
            'CSE MARKET PULSE</text>' +
            '</svg>'
    );

const rowTitle = (item) => {
    const title = (item?.title || '').trim();
    if (title) return title;
    return (item?.category || '').trim() || 'Announcement';
};

const featuredCategory = (item) => {
    const c = (item?.category || item?.type || '').trim();
    return c || 'Announcement';
};

const DashboardMarketPulse = ({
    holdingSymbols = [],
    holdingNames = [],
    watchlistSymbols = [],
    onNavigate,
    portfolioName = ''
}) => {
    const [activeTab, setActiveTab] = useState('corporate');
    const [feeds, setFeeds] = useState({ corporate: [], listings: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const result = await cseApi.dashboardPulse();
            setFeeds({
                corporate: result.corporate || [],
                listings: result.listings || []
            });
            setNote(result.note || '');
        } catch (e) {
            setError('Failed to load CSE feed.');
            setFeeds({ corporate: [], listings: [] });
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

    const ranked = useMemo(() => {
        const opts = { holdingSymbols, holdingNames, watchlistSymbols, limit: 9999 };
        const corporate = rankAnnouncements(feeds.corporate, opts);
        const listings = rankAnnouncements(feeds.listings, opts);

        return {
            corporate: {
                items: corporate,
                holdingCount: corporate.filter((i) => i.isHolding).length
            },
            listings: {
                items: listings,
                holdingCount: listings.filter((i) => i.isHolding).length
            }
        };
    }, [feeds, holdingSymbols, holdingNames, watchlistSymbols]);

    const current = TABS.find((t) => t.id === activeTab) || TABS[0];
    const currentRanked = ranked[current.id] || { items: [], holdingCount: 0 };
    const items = currentRanked.items;
    const [featured, ...rest] = items;

    return (
        <div className="market-pulse-widget">
            <div className="market-pulse-widget__header">
                <div className="market-pulse-widget__heading">
                    <span className="market-pulse-widget__icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </span>
                    <div className="market-pulse-widget__heading-text">
                        <h3 className="market-pulse-widget__title-text">Market Pulse</h3>
                        <span className="market-pulse-widget__subtitle-text">
                            {portfolioName
                                ? `CSE updates · ${portfolioName}`
                                : 'Colombo Stock Exchange announcements'}
                        </span>
                    </div>
                </div>

                <div className="market-pulse-widget__actions">
                    <button
                        type="button"
                        className="market-pulse-widget__refresh"
                        onClick={() => load(false)}
                        disabled={isLoading}
                        aria-label="Refresh market pulse"
                        title="Refresh"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                        </svg>
                    </button>
                    {onNavigate && (
                        <button
                            type="button"
                            className="market-pulse-widget__more"
                            onClick={() => onNavigate(current.targetTab)}
                        >
                            View all
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="market-pulse-widget__tabs" role="tablist">
                {TABS.map((tab) => {
                    const meta = ranked[tab.id] || { items: [], holdingCount: 0 };
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`market-pulse-widget__tab${isActive ? ' is-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.label}</span>
                            <span className="market-pulse-widget__tab-count">
                                {isLoading ? '…' : meta.items.length.toLocaleString()}
                            </span>
                            {!isLoading && meta.holdingCount > 0 && (
                                <span
                                    className="market-pulse-widget__tab-holding"
                                    title="Affects your holdings"
                                >
                                    {meta.holdingCount}★
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {isLoading && (
                <div className="market-pulse-widget__loading">
                    <div className="loading-spinner" />
                    <span>Loading announcements…</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="market-pulse-widget__error">
                    <span>{error}</span>
                    <button type="button" onClick={() => load(false)}>Retry</button>
                </div>
            )}

            {!isLoading && !error && items.length === 0 && (
                <div className="market-pulse-widget__empty">
                    {note || 'No announcements available right now.'}
                </div>
            )}

            {!isLoading && !error && featured && (
                <button
                    type="button"
                    className={`market-pulse-widget__featured${featured.isHolding ? ' is-holding' : ''}`}
                    onClick={() => onNavigate && onNavigate(current.targetTab)}
                >
                    <div className="market-pulse-widget__featured-thumb-wrap">
                        <img
                            className="market-pulse-widget__featured-thumb"
                            src={FALLBACK_HERO}
                            alt=""
                        />
                        <div className="market-pulse-widget__featured-overlay">
                            <img
                                className="market-pulse-widget__featured-logo"
                                src={featured.logoUrl || FALLBACK_LOGO}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = FALLBACK_LOGO;
                                }}
                            />
                            <div className="market-pulse-widget__featured-meta">
                                <span className="market-pulse-widget__featured-pill">
                                    {featured.isHolding ? 'Holding · ' : ''}
                                    {featuredCategory(featured)}
                                </span>
                                {featured.symbol && (
                                    <span className="market-pulse-widget__featured-symbol">
                                        {featured.symbol}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="market-pulse-widget__featured-body">
                        <div className="market-pulse-widget__meta">
                            <span className="market-pulse-widget__source">
                                {featured.company || 'Colombo Stock Exchange'}
                            </span>
                            <span className="market-pulse-widget__dot">·</span>
                            <span className="market-pulse-widget__time">
                                {relativeTime(featured.date)}
                            </span>
                        </div>
                        <h4 className="market-pulse-widget__featured-title">
                            {rowTitle(featured)}
                        </h4>
                    </div>
                </button>
            )}

            {!isLoading && !error && rest.length > 0 && (() => {
                const shouldAutoscroll = rest.length > 4;
                // ~7s per item; gives a calm, readable scroll.
                const animationDuration = `${Math.max(rest.length * 7, 36)}s`;

                const renderItem = (item, index, ariaHidden = false) => (
                    <li
                        key={`${item.id || 'mp'}-${index}${ariaHidden ? '-dup' : ''}`}
                        className={`market-pulse-widget__item${item.isHolding ? ' is-holding' : ''}`}
                        aria-hidden={ariaHidden || undefined}
                    >
                        <button
                            type="button"
                            className="market-pulse-widget__link"
                            onClick={() => onNavigate && onNavigate(current.targetTab)}
                            tabIndex={ariaHidden ? -1 : 0}
                        >
                            <div className="market-pulse-widget__thumb-wrap">
                                <img
                                    className="market-pulse-widget__thumb"
                                    src={item.logoUrl || FALLBACK_LOGO}
                                    alt=""
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = FALLBACK_LOGO;
                                    }}
                                />
                            </div>
                            <div className="market-pulse-widget__body">
                                <div className="market-pulse-widget__meta">
                                    <span className="market-pulse-widget__source">
                                        {item.symbol || item.company || 'CSE'}
                                    </span>
                                    <span className="market-pulse-widget__dot">·</span>
                                    <span className="market-pulse-widget__time">
                                        {relativeTime(item.date)}
                                    </span>
                                    {item.isHolding && (
                                        <span className="market-pulse-widget__row-tag">
                                            Holding
                                        </span>
                                    )}
                                </div>
                                <div className="market-pulse-widget__row-title">
                                    {rowTitle(item)}
                                </div>
                            </div>
                        </button>
                    </li>
                );

                return (
                    <div
                        className={`market-pulse-widget__list-viewport${
                            shouldAutoscroll ? ' is-autoscrolling' : ''
                        }`}
                    >
                        <ul
                            className="market-pulse-widget__list"
                            style={shouldAutoscroll ? { animationDuration } : undefined}
                        >
                            {rest.map((item, i) => renderItem(item, i, false))}
                            {shouldAutoscroll &&
                                rest.map((item, i) => renderItem(item, i, true))}
                        </ul>
                    </div>
                );
            })()}
        </div>
    );
};

export default DashboardMarketPulse;
