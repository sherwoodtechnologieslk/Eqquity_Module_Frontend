// Thin client for the backend Global Markets proxy at /api/global-markets.
// Combines CSE (Sri Lanka indices/breadth) with Alpha Vantage (world indices +
// RSI). All keys live on the backend; the browser never sees them.

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const empty = (note) => ({
    success: true,
    sriLanka: { aspi: null, snp: null, breadth: null, marketStatus: 'Unknown' },
    world: { indices: [], rsi: null, note: '' },
    note
});

const globalMarketsApi = {
    getMarkets: async () => {
        const url = `${API_BASE_URL}/global-markets`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const body = await response.json().catch(() => null);
            if (!response.ok || !body) {
                return empty('Global markets data is temporarily unavailable.');
            }
            return {
                success: true,
                lastUpdated: body.lastUpdated,
                sriLanka: body.sriLanka || empty().sriLanka,
                world: body.world || empty().world,
                note: body.note || ''
            };
        } catch (e) {
            return empty('Cannot reach the server. Check your connection and try again.');
        }
    }
};

export default globalMarketsApi;
