import React, { useCallback, useEffect, useMemo, useState } from 'react';
import newsApi from '../../services/newsApi';
import './Styles/NewsEvents.css';

const FEED_TABS = [
    { id: 'top', label: 'Top Headlines' },
    { id: 'finance', label: 'Finance Sources' },
    { id: 'search', label: 'Search News' }
];

const PAGE_SIZE = 20;

const formatPublishedAt = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return iso;
    }
};

const FALLBACK_THUMB =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">' +
            '<rect width="100%" height="100%" fill="#e2e8f0"/>' +
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="#64748b" font-family="Inter, sans-serif" font-size="16">No image</text>' +
            '</svg>'
    );

const NewsEvents = () => {
    const [feedTab, setFeedTab] = useState('top');
    const [articles, setArticles] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search-tab state.
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');

    const loadFeed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let result;
            if (feedTab === 'top') {
                result = await newsApi.topHeadlines({
                    country: 'us',
                    category: 'business',
                    pageSize: PAGE_SIZE
                });
            } else if (feedTab === 'finance') {
                result = await newsApi.financeHeadlines({ pageSize: PAGE_SIZE });
            } else if (feedTab === 'search') {
                if (!submittedQuery) {
                    setArticles([]);
                    setTotalResults(0);
                    setIsLoading(false);
                    return;
                }
                result = await newsApi.searchNews({
                    q: submittedQuery,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: PAGE_SIZE
                });
            }
            setArticles(result?.articles || []);
            setTotalResults(result?.totalResults || 0);
        } catch (err) {
            console.error('NewsEvents load failed:', err);
            setError(err.message || 'Failed to load news.');
            setArticles([]);
            setTotalResults(0);
        } finally {
            setIsLoading(false);
        }
    }, [feedTab, submittedQuery]);

    useEffect(() => {
        loadFeed();
    }, [loadFeed]);

    const onSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        setSubmittedQuery(trimmed);
    };

    const subtitle = useMemo(() => {
        if (feedTab === 'top') return 'US business top headlines';
        if (feedTab === 'finance') return 'Bloomberg, CNBC, Reuters, Business Insider, WSJ, Financial Post, Fortune';
        if (feedTab === 'search') return submittedQuery ? `Results for "${submittedQuery}"` : 'Search across all NewsAPI sources';
        return '';
    }, [feedTab, submittedQuery]);

    return (
        <div className="news-events">
            <div className="news-events__toolbar">
                <div className="news-events__feed-tabs" role="tablist" aria-label="News feeds">
                    {FEED_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={feedTab === tab.id}
                            className={`news-events__feed-tab${feedTab === tab.id ? ' is-active' : ''}`}
                            onClick={() => setFeedTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="news-events__refresh"
                    onClick={loadFeed}
                    disabled={isLoading}
                >
                    {isLoading ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {feedTab === 'search' && (
                <form className="news-events__search" onSubmit={onSearchSubmit}>
                    <input
                        type="search"
                        className="news-events__search-input"
                        placeholder='Search news (e.g. "Apple", "CSE", ticker symbol)'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="news-events__search-submit" disabled={isLoading}>
                        Search
                    </button>
                </form>
            )}

            <div className="news-events__subtitle">
                {subtitle}
                {totalResults > 0 && (
                    <span className="news-events__count"> · {totalResults.toLocaleString()} results</span>
                )}
            </div>

            {error && (
                <div className="news-events__error" role="alert">
                    <strong>Couldn’t load news.</strong>
                    <span>{error}</span>
                    <button type="button" onClick={loadFeed} className="news-events__retry">
                        Try again
                    </button>
                </div>
            )}

            {isLoading && !error && (
                <div className="news-events__loading">
                    <div className="loading-spinner" />
                    <p>Loading articles…</p>
                </div>
            )}

            {!isLoading && !error && articles.length === 0 && (
                <div className="news-events__empty">
                    <h3>No articles to show</h3>
                    <p>
                        {feedTab === 'search'
                            ? 'Enter a search term above to look up news.'
                            : 'Try refreshing in a moment, or switch to another feed.'}
                    </p>
                </div>
            )}

            {!isLoading && articles.length > 0 && (
                <ul className="news-events__list">
                    {articles.map((article, index) => (
                        <li
                            key={`${article.url || 'article'}-${index}`}
                            className="news-events__card"
                        >
                            <a
                                className="news-events__card-link"
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="news-events__thumb-wrap">
                                    <img
                                        className="news-events__thumb"
                                        src={article.urlToImage || FALLBACK_THUMB}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_THUMB;
                                        }}
                                    />
                                </div>
                                <div className="news-events__body">
                                    <div className="news-events__meta">
                                        <span className="news-events__source">
                                            {article.source?.name || 'Unknown source'}
                                        </span>
                                        <span className="news-events__dot">·</span>
                                        <time className="news-events__time">
                                            {formatPublishedAt(article.publishedAt)}
                                        </time>
                                    </div>
                                    <h3 className="news-events__title">
                                        {article.title || 'Untitled article'}
                                    </h3>
                                    {article.description && (
                                        <p className="news-events__desc">{article.description}</p>
                                    )}
                                    {article.author && (
                                        <div className="news-events__author">By {article.author}</div>
                                    )}
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            <div className="news-events__footer">
                Powered by{' '}
                <a href="https://newsapi.org/" target="_blank" rel="noopener noreferrer">
                    NewsAPI.org
                </a>
            </div>
        </div>
    );
};

export default NewsEvents;
