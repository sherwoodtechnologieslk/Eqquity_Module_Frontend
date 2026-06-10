// Thin client for the backend CSE proxy at /api/cse-announcements/*.
// The browser cannot call https://www.cse.lk/api/* directly because of CORS
// and required headers, so all calls go through our backend.

import { itemMatchesHoldings } from '../utils/cseAnnouncementRank';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const emptyEnvelope = (note) => ({
    success: true,
    items: [],
    note,
    lastUpdated: new Date().toISOString()
});

const request = async (path) => {
    const url = `${API_BASE_URL}/cse-announcements${path}`;
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (networkError) {
        return emptyEnvelope('Cannot reach the server. Check your connection and try again.');
    }

    let body = null;
    try {
        body = await response.json();
    } catch (e) {
        // Non-JSON body — soft-fail.
    }

    if (!response.ok) {
        return emptyEnvelope(
            (body && (body.message || body.error)) ||
                `CSE feed unavailable (HTTP ${response.status})`
        );
    }

    return body || emptyEnvelope();
};

// Combine multiple feeds into a single sorted envelope. Used by screens that
// surface more than one CSE announcement type at once (e.g. Market
// Announcements = new listings + buy-in board).
const combine = async (paths) => {
    const results = await Promise.all(paths.map((p) => request(p)));
    const items = results.flatMap((r) => (Array.isArray(r?.items) ? r.items : []));
    items.sort((a, b) => {
        const ta = a?.date ? Date.parse(a.date) : 0;
        const tb = b?.date ? Date.parse(b.date) : 0;
        return tb - ta;
    });
    const note = results.find((r) => r?.note)?.note || '';
    return {
        success: true,
        lastUpdated: new Date().toISOString(),
        items,
        note,
        sources: results.map((r, i) => ({ path: paths[i], count: r?.items?.length || 0 }))
    };
};

const cseApi = {
    financialAnnouncements: () => request('/financial'),
    circularAnnouncements: () => request('/circular'),
    directiveAnnouncements: () => request('/directive'),
    approvedAnnouncements: () => request('/approved'),
    newListingsAnnouncements: () => request('/new-listings'),
    buyInBoardAnnouncements: () => request('/buy-in-board'),
    nonComplianceAnnouncements: () => request('/non-compliance'),

    // Composite feeds for the existing sidebar tabs.
    marketAnnouncements: () => combine(['/new-listings', '/buy-in-board']),
    regulatoryUpdates: () => combine(['/directive', '/non-compliance']),

    // Dashboard Market Pulse — corporate actions + new listings in parallel.
    dashboardPulse: async () => {
        const [corporate, listings] = await Promise.all([
            request('/approved'),
            request('/new-listings')
        ]);
        return {
            success: true,
            lastUpdated: new Date().toISOString(),
            corporate: Array.isArray(corporate?.items) ? corporate.items : [],
            listings: Array.isArray(listings?.items) ? listings.items : [],
            note: corporate?.note || listings?.note || ''
        };
    },

    topGainers: () => request('/top-gainers'),
    topLosers: () => request('/top-losers'),
    mostActiveTrades: () => request('/most-active'),
    marketStatus: () => request('/market-status'),

    // Market-wide indices (ASPI + S&P SL20) for the Global Events factor.
    marketIndices: async () => {
        const url = `${API_BASE_URL}/cse-announcements/market-indices`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await response.json().catch(() => null);
            if (!response.ok || !body) {
                return { success: true, aspi: null, snp: null, note: 'CSE index data unavailable.' };
            }
            return {
                success: true,
                lastUpdated: body.lastUpdated,
                aspi: body.aspi || null,
                snp: body.snp || null,
                note: body.note || ''
            };
        } catch (e) {
            return { success: true, aspi: null, snp: null, note: 'Cannot reach the server.' };
        }
    },

    // Live per-company snapshot (companyInfoSummery).
    companyInfo: async (symbol) => {
        if (!symbol) return { success: false, info: null, note: 'No symbol provided.' };
        const url = `${API_BASE_URL}/cse-announcements/company-info?symbol=${encodeURIComponent(
            symbol
        )}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await response.json().catch(() => null);
            if (!response.ok || !body) {
                return {
                    success: true,
                    info: null,
                    note: (body && (body.message || body.note)) || 'CSE company data unavailable.'
                };
            }
            return {
                success: true,
                lastUpdated: body.lastUpdated,
                info: body.info || null,
                note: body.note || ''
            };
        } catch (e) {
            return {
                success: true,
                info: null,
                note: 'Cannot reach the server. Check your connection and try again.'
            };
        }
    },

    // Announcements filtered to a single company (symbol + name match).
    companyAnnouncements: async (symbol, companyName) => {
        const paths = ['/financial', '/approved', '/new-listings', '/circular'];
        const results = await Promise.all(paths.map((p) => request(p)));
        const items = results.flatMap((r) => (Array.isArray(r?.items) ? r.items : []));
        const symbols = symbol ? [symbol] : [];
        const names = companyName ? [companyName] : [];
        const matched = items.filter((item) => itemMatchesHoldings(item, symbols, names));
        matched.sort((a, b) => {
            const ta = a?.date ? Date.parse(a.date) : 0;
            const tb = b?.date ? Date.parse(b.date) : 0;
            return tb - ta;
        });
        return {
            success: true,
            lastUpdated: new Date().toISOString(),
            items: matched,
            note: results.find((r) => r?.note)?.note || ''
        };
    },

    // Financial-statement filings (interim/annual reports) for a single company.
    // Sourced from CSE getFinancialAnnouncement (PDF reports). The upstream
    // feed only carries the most recent market-wide filings, so a company may
    // have no entries if it hasn't filed recently.
    companyFinancialReports: async (symbol, companyName) => {
        const res = await request('/financial');
        const items = Array.isArray(res?.items) ? res.items : [];
        const symbols = symbol ? [symbol] : [];
        const names = companyName ? [companyName] : [];
        const matched = items.filter((item) => itemMatchesHoldings(item, symbols, names));
        matched.sort((a, b) => {
            const ta = a?.date ? Date.parse(a.date) : 0;
            const tb = b?.date ? Date.parse(b.date) : 0;
            return tb - ta;
        });
        return {
            success: true,
            lastUpdated: new Date().toISOString(),
            items: matched,
            note: res?.note || ''
        };
    },

    // Dashboard Market Movers — gainers, losers, most active + status in one call.
    dashboardMovers: async () => {
        let body = null;
        try {
            const response = await fetch(`${API_BASE_URL}/cse-announcements/dashboard-movers`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            body = await response.json();
            if (!response.ok) {
                return {
                    success: true,
                    lastUpdated: new Date().toISOString(),
                    marketStatus: { status: 'unknown', label: 'Market status unavailable' },
                    gainers: [],
                    losers: [],
                    active: [],
                    note: body?.message || body?.error || 'CSE market data unavailable'
                };
            }
        } catch (networkError) {
            return {
                success: true,
                lastUpdated: new Date().toISOString(),
                marketStatus: { status: 'unknown', label: 'Market status unavailable' },
                gainers: [],
                losers: [],
                active: [],
                note: 'Cannot reach the server. Check your connection and try again.'
            };
        }
        return {
            success: true,
            lastUpdated: body?.lastUpdated || new Date().toISOString(),
            marketStatus: body?.marketStatus || { status: 'unknown', label: 'Unknown' },
            gainers: Array.isArray(body?.gainers) ? body.gainers : [],
            losers: Array.isArray(body?.losers) ? body.losers : [],
            active: Array.isArray(body?.active) ? body.active : [],
            note: body?.note || ''
        };
    }
};

export default cseApi;
