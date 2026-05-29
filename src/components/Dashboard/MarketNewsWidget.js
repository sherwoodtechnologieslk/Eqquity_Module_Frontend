import React, { useCallback, useEffect, useState } from 'react';
import newsApi from '../../services/newsApi';
import './MarketNewsWidget.css';

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

const FALLBACK_THUMB =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#bfdbfe"/>' +
            '</linearGradient></defs>' +
            '<rect width="100%" height="100%" fill="url(#g)"/>' +
            '<path d="M20 28h40v4H20zm0 10h40v3H20zm0 8h28v3H20zm0 8h32v3H20z" fill="#1e40af" opacity="0.55"/>' +
            '</svg>'
    );

const MarketNewsWidget = ({ onOpenFull }) => {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1 featured + up to 15 list items so the ticker has enough to scroll.
            const result = await newsApi.businessHeadlines({ pageSize: 16 });
            setArticles(result?.articles || []);
        } catch (err) {
            console.error('MarketNewsWidget load failed:', err);
            setError(err.message || 'Failed to load market news.');
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const [featured, ...rest] = articles;

    return (
        <div className="market-news-widget">
            <div className="market-news-widget__header">
                <div className="market-news-widget__heading">
                    <span className="market-news-widget__icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4z" />
                            <path d="M19 8h2v9a3 3 0 0 1-3 3" />
                            <line x1="8" y1="9" x2="14" y2="9" />
                            <line x1="8" y1="13" x2="14" y2="13" />
                            <line x1="8" y1="17" x2="12" y2="17" />
                        </svg>
                    </span>
                    <div className="market-news-widget__heading-text">
                        <h3 className="market-news-widget__title-text">Market News</h3>
                        <span className="market-news-widget__subtitle-text">Latest US business headlines</span>
                    </div>
                </div>
                <div className="market-news-widget__actions">
                    <button
                        type="button"
                        className="market-news-widget__refresh"
                        onClick={load}
                        disabled={isLoading}
                        aria-label="Refresh market news"
                        title="Refresh"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                        </svg>
                    </button>
                    {onOpenFull && (
                        <button
                            type="button"
                            className="market-news-widget__more"
                            onClick={onOpenFull}
                        >
                            View all
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="market-news-widget__loading">
                    <div className="loading-spinner" />
                    <span>Loading news…</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="market-news-widget__error">
                    <span>{error}</span>
                    <button type="button" onClick={load}>Retry</button>
                </div>
            )}

            {!isLoading && !error && articles.length === 0 && (
                <div className="market-news-widget__empty">No headlines available.</div>
            )}

            {!isLoading && !error && featured && (
                <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="market-news-widget__featured"
                >
                    <div className="market-news-widget__featured-thumb-wrap">
                        <img
                            className="market-news-widget__featured-thumb"
                            src={featured.urlToImage || FALLBACK_THUMB}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.src = FALLBACK_THUMB;
                            }}
                        />
                        <span className="market-news-widget__featured-pill">Top story</span>
                    </div>
                    <div className="market-news-widget__featured-body">
                        <div className="market-news-widget__meta">
                            <span className="market-news-widget__source">
                                {featured.source?.name || 'Source'}
                            </span>
                            <span className="market-news-widget__dot">·</span>
                            <span className="market-news-widget__time">
                                {relativeTime(featured.publishedAt)}
                            </span>
                        </div>
                        <h4 className="market-news-widget__featured-title">
                            {featured.title || 'Untitled article'}
                        </h4>
                    </div>
                </a>
            )}

            {!isLoading && !error && rest.length > 0 && (() => {
                // Autoscroll only when there are more items than fit in the
                // viewport, otherwise it just looks like jitter.
                const shouldAutoscroll = rest.length > 5;
                // Slow ticker feel — ~6s per article keeps it easy to read.
                const animationDuration = `${Math.max(rest.length * 6, 45)}s`;

                const renderItem = (article, index, ariaHidden = false) => (
                    <li
                        key={`${article.url || 'mnw'}-${index}${ariaHidden ? '-dup' : ''}`}
                        className="market-news-widget__item"
                        aria-hidden={ariaHidden || undefined}
                    >
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="market-news-widget__link"
                            tabIndex={ariaHidden ? -1 : 0}
                        >
                            <div className="market-news-widget__thumb-wrap">
                                <img
                                    className="market-news-widget__thumb"
                                    src={article.urlToImage || FALLBACK_THUMB}
                                    alt=""
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = FALLBACK_THUMB;
                                    }}
                                />
                            </div>
                            <div className="market-news-widget__body">
                                <div className="market-news-widget__meta">
                                    <span className="market-news-widget__source">
                                        {article.source?.name || 'Source'}
                                    </span>
                                    <span className="market-news-widget__dot">·</span>
                                    <span className="market-news-widget__time">
                                        {relativeTime(article.publishedAt)}
                                    </span>
                                </div>
                                <div className="market-news-widget__title">
                                    {article.title || 'Untitled article'}
                                </div>
                            </div>
                        </a>
                    </li>
                );

                return (
                    <div
                        className={`market-news-widget__list-viewport${
                            shouldAutoscroll ? ' is-autoscrolling' : ''
                        }`}
                    >
                        <ul
                            className="market-news-widget__list"
                            style={shouldAutoscroll ? { animationDuration } : undefined}
                        >
                            {rest.map((a, i) => renderItem(a, i, false))}
                            {shouldAutoscroll &&
                                rest.map((a, i) => renderItem(a, i, true))}
                        </ul>
                    </div>
                );
            })()}
        </div>
    );
};

export default MarketNewsWidget;
