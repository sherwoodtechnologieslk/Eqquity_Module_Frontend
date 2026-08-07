import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './CSEAnnouncementFeed.css';

const formatPublishedAt = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return iso;
    }
};

const FALLBACK_LOGO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
            '<rect width="100%" height="100%" rx="8" fill="#eff6ff"/>' +
            '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="#1e40af" font-family="DM Sans, Segoe UI, sans-serif" font-size="16" font-weight="700">CSE</text>' +
            '</svg>'
    );

const SEARCH_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const BUILDING_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
);

const REFRESH_ICON = (
    <svg className="cse-feed__refresh-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

const CLEAR_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const X_ICON = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CHEVRON_ICON = (
    <svg className="cse-feed__select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

/**
 * Generic CSE announcement feed screen.
 *
 * Props:
 *  - loader: () => Promise<{ items, lastUpdated?, note? }>
 *  - eyebrow, title, subtitle: optional page header text
 *  - filterTabs?: [{ id, label, icon?, matches?: (item) => boolean }] — first tab is treated as the "all" tab
 *  - dropdownAxis?: 'company' | 'category' (defaults to 'company')
 *  - emptyMessage?: friendly text shown when there is nothing to render
 *  - itemTypeLabel?: pill label shown on each card (defaults to item.type)
 *  - sourceUrl?: link rendered in the footer attribution
 */
const CSEAnnouncementFeed = ({
    loader,
    eyebrow,
    title,
    subtitle,
    filterTabs = [],
    dropdownAxis = 'company',
    emptyMessage = 'The CSE feed is quiet at the moment. Please check back shortly.',
    itemTypeLabel,
    sourceUrl = 'https://www.cse.lk/'
}) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [note, setNote] = useState('');
    const [updatedAt, setUpdatedAt] = useState(null);
    const [filterTab, setFilterTab] = useState(filterTabs[0]?.id || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownValue, setDropdownValue] = useState('all');

    const load = useCallback(async () => {
        setIsLoading(true);
        setNote('');
        try {
            const result = await loader();
            setItems(Array.isArray(result?.items) ? result.items : []);
            setUpdatedAt(result?.lastUpdated || new Date().toISOString());
            if (result?.note) setNote(result.note);
        } catch (err) {
            setItems([]);
            setNote('Live CSE feed is taking a break. Try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [loader]);

    useEffect(() => { load(); }, [load]);

    // Build dropdown options based on the chosen axis.
    const dropdownOptions = useMemo(() => {
        const map = new Map();
        items.forEach((item) => {
            const key = dropdownAxis === 'category'
                ? (item.category || item.type || '')
                : (item.symbol || '');
            if (!key || map.has(key)) return;
            const label = dropdownAxis === 'category'
                ? key
                : (item.company ? `${key} - ${item.company}` : key);
            map.set(key, { key, label });
        });
        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    }, [items, dropdownAxis]);

    const dropdownLabels = useMemo(() => {
        if (dropdownAxis === 'category') {
            return {
                ariaLabel: 'Filter by category',
                placeholder: 'All categories',
                icon: BUILDING_ICON
            };
        }
        return {
            ariaLabel: 'Filter by company',
            placeholder: 'All companies',
            icon: BUILDING_ICON
        };
    }, [dropdownAxis]);

    // Counts for each filter chip — driven by user-supplied matchers.
    const tabCounts = useMemo(() => {
        const counts = {};
        filterTabs.forEach((tab, idx) => {
            if (idx === 0) {
                counts[tab.id] = items.length;
            } else {
                counts[tab.id] = items.filter((it) => tab.matches?.(it)).length;
            }
        });
        return counts;
    }, [items, filterTabs]);

    const visibleItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        const matchesTab = (item) => {
            if (!filterTabs.length) return true;
            const idx = filterTabs.findIndex((t) => t.id === filterTab);
            if (idx <= 0) return true; // first tab = "all"
            const def = filterTabs[idx];
            return def?.matches ? def.matches(item) : true;
        };

        const matchesDropdown = (item) => {
            if (dropdownValue === 'all') return true;
            const value = dropdownAxis === 'category'
                ? (item.category || item.type)
                : item.symbol;
            return value === dropdownValue;
        };

        return items.filter((item) => {
            if (!matchesTab(item)) return false;
            if (!matchesDropdown(item)) return false;
            if (!term) return true;
            const haystack = `${item.company || ''} ${item.title || ''} ${item.symbol || ''} ${item.category || ''} ${item.remarks || ''}`.toLowerCase();
            return haystack.includes(term);
        });
    }, [items, filterTab, filterTabs, dropdownAxis, dropdownValue, searchTerm]);

    const summary = useMemo(() => {
        if (isLoading) return 'Loading the latest announcements from CSE…';
        if (note) return note;
        return subtitle || 'Live announcements from the Colombo Stock Exchange.';
    }, [isLoading, note, subtitle]);

    const hasActiveFilters = searchTerm || dropdownValue !== 'all' || (filterTabs.length > 0 && filterTab !== filterTabs[0]?.id);

    const resetAll = () => {
        setSearchTerm('');
        setDropdownValue('all');
        if (filterTabs.length) setFilterTab(filterTabs[0].id);
    };

    return (
        <div className="cse-feed">
            {(eyebrow || title || subtitle) && (
                <header className="cse-feed__rail">
                    <div>
                        {eyebrow && <p className="cse-feed__eyebrow">{eyebrow}</p>}
                        {title && <h1 className="cse-feed__title">{title}</h1>}
                        {subtitle && <p className="cse-feed__blurb">{subtitle}</p>}
                    </div>
                </header>
            )}

            <div className="cse-feed__toolbar">
                {filterTabs.length > 0 && (
                    <nav className="cse-feed__tabs" role="tablist" aria-label="Filter">
                        {filterTabs.map((tab) => {
                            const count = tabCounts[tab.id] ?? 0;
                            const isActive = filterTab === tab.id;
                            return (
                                <button
                                    type="button"
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`cse-feed__tab${isActive ? ' is-active' : ''}`}
                                    onClick={() => setFilterTab(tab.id)}
                                >
                                    {tab.icon && (
                                        <span className="cse-feed__tab-icon" aria-hidden="true">
                                            {tab.icon}
                                        </span>
                                    )}
                                    <span>{tab.label}</span>
                                    <span className="cse-feed__tab-count">
                                        {isLoading ? '…' : count.toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                )}

                <button
                    type="button"
                    className={`cse-feed__refresh${isLoading ? ' is-loading' : ''}`}
                    onClick={load}
                    disabled={isLoading}
                    aria-label={isLoading ? 'Refreshing' : 'Refresh'}
                >
                    {REFRESH_ICON}
                    <span>{isLoading ? 'Refreshing…' : 'Refresh'}</span>
                </button>
            </div>

            <div className="cse-feed__search">
                <div className="cse-feed__field cse-feed__field--search">
                    <span className="cse-feed__field-icon">{SEARCH_ICON}</span>
                    <input
                        type="search"
                        className="cse-feed__search-input"
                        placeholder="Search by company, symbol, title, or remarks"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="cse-feed__field-clear"
                            onClick={() => setSearchTerm('')}
                            aria-label="Clear search"
                        >
                            {X_ICON}
                        </button>
                    )}
                </div>

                <div className="cse-feed__field cse-feed__field--select">
                    <span className="cse-feed__field-icon">{dropdownLabels.icon}</span>
                    <select
                        className="cse-feed__select"
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(e.target.value)}
                        disabled={dropdownOptions.length === 0}
                        aria-label={dropdownLabels.ariaLabel}
                    >
                        <option value="all">
                            {dropdownLabels.placeholder}
                            {dropdownOptions.length ? ` · ${dropdownOptions.length}` : ''}
                        </option>
                        {dropdownOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                    {CHEVRON_ICON}
                </div>

                {hasActiveFilters && (
                    <button type="button" className="cse-feed__clear" onClick={resetAll}>
                        {CLEAR_ICON}
                        Clear filters
                    </button>
                )}
            </div>

            <div className="cse-feed__subtitle">
                {summary}
                {!isLoading && items.length > 0 && (
                    <span className="cse-feed__count">
                        {' '}· {visibleItems.length.toLocaleString()} of {items.length.toLocaleString()} shown
                        {updatedAt && ` · updated ${formatPublishedAt(updatedAt)}`}
                    </span>
                )}
            </div>

            {isLoading && (
                <div className="cse-feed__loading">
                    <div className="loading-spinner" />
                    <p>Fetching the latest announcements from CSE…</p>
                </div>
            )}

            {!isLoading && visibleItems.length === 0 && (
                <div className="cse-feed__empty">
                    <h3>Nothing to show</h3>
                    <p>
                        {hasActiveFilters
                            ? 'Try clearing your filters to see all items.'
                            : note || emptyMessage}
                    </p>
                </div>
            )}

            {!isLoading && visibleItems.length > 0 && (
                <ul className="cse-feed__list">
                    {visibleItems.map((item) => {
                        const pill = itemTypeLabel || item.category || item.type || 'Notice';
                        const link = item.pdfUrl;
                        const CardTag = link ? 'a' : 'div';
                        const cardProps = link
                            ? { href: link, target: '_blank', rel: 'noopener noreferrer' }
                            : {};
                        return (
                            <li key={item.id} className="cse-feed__card">
                                <CardTag className="cse-feed__card-link" {...cardProps}>
                                    <img
                                        className="cse-feed__logo"
                                        src={item.logoUrl || FALLBACK_LOGO}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
                                    />

                                    <div className="cse-feed__body">
                                        <div className="cse-feed__meta-inline">
                                            {(item.symbol || item.company) && (
                                                <span className="cse-feed__symbol">
                                                    {item.symbol || '—'}
                                                </span>
                                            )}
                                            <time className="cse-feed__time">
                                                {formatPublishedAt(item.date)}
                                            </time>
                                        </div>
                                        <h3 className="cse-feed__company">
                                            {item.company || 'Colombo Stock Exchange'}
                                        </h3>
                                        <p className="cse-feed__title-text">
                                            {item.title || 'Announcement'}
                                        </p>
                                        {item.remarks && item.remarks !== item.title && (
                                            <p className="cse-feed__remarks">{item.remarks}</p>
                                        )}
                                    </div>

                                    <div className="cse-feed__footer-row">
                                        <span className="cse-feed__pill">{pill}</span>
                                        {link ? (
                                            <span className="cse-feed__cta">
                                                Open PDF
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </span>
                                        ) : (
                                            <span className="cse-feed__cta cse-feed__cta--muted">
                                                Notice
                                            </span>
                                        )}
                                    </div>
                                </CardTag>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="cse-feed__footer">
                Data sourced from{' '}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    Colombo Stock Exchange
                </a>
            </div>
        </div>
    );
};

export default CSEAnnouncementFeed;
