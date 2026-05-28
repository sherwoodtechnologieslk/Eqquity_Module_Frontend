// Thin client for the backend NewsAPI proxy at /api/news/*.
// The actual NEWS_API_KEY lives on the backend; the browser never sees it.

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const buildQuery = (params = {}) => {
    const entries = Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
    );
    if (entries.length === 0) return '';
    const usp = new URLSearchParams();
    entries.forEach(([key, value]) => usp.append(key, String(value)));
    return `?${usp.toString()}`;
};

const request = async (path, params) => {
    const url = `${API_BASE_URL}/news${path}${buildQuery(params)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    let body = null;
    try {
        body = await response.json();
    } catch (e) {
        // Non-JSON body (rare from this proxy) — fall through.
    }

    if (!response.ok || (body && body.success === false)) {
        const message =
            (body && (body.message || body.error)) ||
            `Failed to load news (HTTP ${response.status})`;
        throw new Error(message);
    }

    return body;
};

// Finance-focused publishers exposed by NewsAPI's /sources directory.
export const FINANCE_SOURCES = [
    'bloomberg',
    'cnbc',
    'reuters',
    'business-insider',
    'the-wall-street-journal',
    'financial-post',
    'fortune'
].join(',');

export const newsApi = {
    // /v2/top-headlines — pass any of: country, category, sources, q, pageSize, page.
    topHeadlines: (params = {}) => request('/top-headlines', params),

    // /v2/everything — must include q, qInTitle, sources, or domains.
    everything: (params = {}) => request('/everything', params),

    // /v2/top-headlines/sources — list of supported publishers.
    sources: (params = {}) => request('/sources', params),

    // Convenience: curated US business headlines for the dashboard widget.
    businessHeadlines: ({ pageSize = 6 } = {}) =>
        request('/top-headlines', { country: 'us', category: 'business', pageSize }),

    // Convenience: multi-source finance feed.
    financeHeadlines: ({ pageSize = 12 } = {}) =>
        request('/top-headlines', { sources: FINANCE_SOURCES, pageSize }),

    // Convenience: full-text search with sensible defaults.
    searchNews: ({ q, from, to, language = 'en', sortBy = 'publishedAt', pageSize = 20 }) =>
        request('/everything', { q, from, to, language, sortBy, pageSize })
};

export default newsApi;
