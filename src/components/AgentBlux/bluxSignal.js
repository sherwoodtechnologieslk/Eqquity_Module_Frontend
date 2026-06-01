// Multi-signal sentiment for Agent Blux.
// Compares the user's portfolio holdings against today's CSE movers
// (gainers / losers / most active) and rolls up to one of:
//   'active'   — portfolio outperforming + breadth favourable
//   'idle'     — neutral / mildly positive
//   'thinking' — underperforming or breadth weak
//   'offline'  — no usable market data

const toUpper = (value) => String(value || '').trim().toUpperCase();

const buildSymbolSet = (holdingSymbols) => {
    const set = new Set();
    (holdingSymbols || []).forEach((symbol) => {
        const upper = toUpper(symbol);
        if (upper) set.add(upper);
    });
    return set;
};

const safePercent = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const average = (values) => {
    if (!values || values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
};

/**
 * Derive a Blux status and a short human-readable summary from the live CSE
 * feeds + the user's holdings. Returns `null` for `status` when there is not
 * yet enough information to decide; callers should leave the UI unchanged
 * in that case rather than flipping to a misleading state.
 */
export function deriveBluxSignal({
    holdingSymbols = [],
    feeds = { gainers: [], losers: [], active: [] },
    marketStatus = null
} = {}) {
    const gainers = Array.isArray(feeds.gainers) ? feeds.gainers : [];
    const losers = Array.isArray(feeds.losers) ? feeds.losers : [];
    const active = Array.isArray(feeds.active) ? feeds.active : [];

    const totalFeedRows = gainers.length + losers.length + active.length;

    if (totalFeedRows === 0) {
        return {
            status: 'offline',
            summary: 'CSE market feed unavailable',
            metrics: null
        };
    }

    const holdingsSet = buildSymbolSet(holdingSymbols);

    if (holdingsSet.size === 0) {
        return {
            status: 'idle',
            summary: 'No holdings to compare against the market yet',
            metrics: null
        };
    }

    const inHoldings = (item) => holdingsSet.has(toUpper(item && item.symbol));

    const myInGainers = gainers.filter(inHoldings);
    const myInLosers = losers.filter(inHoldings);

    const holdingsUp = myInGainers.length;
    const holdingsDown = myInLosers.length;

    const allMovers = [...gainers, ...losers, ...active];
    const marketPcts = allMovers.map((item) => safePercent(item.percentageChange));
    const marketAvg = average(marketPcts);

    // Deduplicate by symbol when a holding appears in both gainers/losers/active.
    const mySeen = new Map();
    allMovers.forEach((item) => {
        if (!inHoldings(item)) return;
        const key = toUpper(item.symbol);
        if (!mySeen.has(key)) mySeen.set(key, safePercent(item.percentageChange));
    });
    const myPcts = Array.from(mySeen.values());
    const myAvg = average(myPcts);

    const metrics = {
        myAvg,
        marketAvg,
        diff: myAvg - marketAvg,
        holdingsUp,
        holdingsDown,
        sampleSize: myPcts.length,
        portfolioSize: holdingsSet.size,
        marketClosed: !!(marketStatus && marketStatus.status === 'closed')
    };

    if (myPcts.length === 0) {
        return {
            status: 'idle',
            summary: 'Your holdings are quiet vs CSE today',
            metrics
        };
    }

    let score = 0;
    if (myAvg > 0) score += 1;
    if (myAvg > marketAvg) score += 1;
    if (holdingsUp > holdingsDown) score += 1;

    const formatPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
    const detail = `you ${formatPct(myAvg)} · CSE ${formatPct(marketAvg)} · ${holdingsUp}↑/${holdingsDown}↓`;

    let verdict;
    let status;
    if (metrics.marketClosed) {
        verdict = 'Market closed';
        if (score >= 2) status = 'idle';
        else if (myAvg < 0) status = 'thinking';
        else status = 'idle';
    } else if (score >= 3) {
        verdict = 'Outperforming';
        status = 'active';
    } else if (score >= 2) {
        verdict = 'Holding steady';
        status = 'idle';
    } else if (myAvg < 0 && holdingsDown >= holdingsUp) {
        verdict = 'Lagging market';
        status = 'thinking';
    } else {
        verdict = 'Mixed signals';
        status = 'idle';
    }

    return {
        status,
        summary: `${verdict} · ${detail}`,
        verdict,
        metrics
    };
}

export default deriveBluxSignal;
