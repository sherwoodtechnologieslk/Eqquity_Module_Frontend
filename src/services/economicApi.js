// Thin client for the backend World Bank proxy at /api/economic-indicators.
// The browser cannot reliably call the World Bank API directly (CORS / mixed
// content), so the request is proxied and cached server-side. Returns macro
// indicators for Sri Lanka and the World aggregate, kept separate for display.

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const economicApi = {
    // Curated macroeconomic indicators (inflation, GDP growth, rates, etc.).
    getIndicators: async () => {
        const url = `${API_BASE_URL}/economic-indicators`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await response.json().catch(() => null);
            if (!response.ok || !body) {
                return {
                    success: true,
                    sriLanka: [],
                    world: [],
                    exchangeRate: null,
                    note: 'World Bank macro feed is temporarily unavailable.'
                };
            }
            return {
                success: true,
                lastUpdated: body.lastUpdated,
                sriLanka: Array.isArray(body.sriLanka) ? body.sriLanka : [],
                world: Array.isArray(body.world) ? body.world : [],
                exchangeRate: body.exchangeRate || null,
                note: body.note || ''
            };
        } catch (e) {
            return {
                success: true,
                sriLanka: [],
                world: [],
                exchangeRate: null,
                note: 'Cannot reach the server. Check your connection and try again.'
            };
        }
    }
};

export default economicApi;
