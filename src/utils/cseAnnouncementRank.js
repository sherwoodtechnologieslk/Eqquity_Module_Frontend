/**
 * Rank CSE announcement items for dashboard display:
 * portfolio holdings first, then watchlist, then global by date.
 */

const normalizeSymbol = (value) => {
    if (value == null || value === '') return { full: '', base: '' };
    const full = String(value).trim().toUpperCase();
    const base = full.includes('.') ? full.split('.')[0] : full;
    return { full, base };
};

const buildSymbolIndex = (symbols = []) => {
    const full = new Set();
    const base = new Set();
    (symbols || []).forEach((raw) => {
        const { full: f, base: b } = normalizeSymbol(raw);
        if (f) full.add(f);
        if (b) base.add(b);
    });
    return { full, base };
};

const buildNameIndex = (names = []) =>
    (names || [])
        .map((n) => String(n || '').trim().toUpperCase())
        .filter((n) => n.length >= 3);

const symbolMatchesIndex = (itemSymbol, index) => {
    const { full, base } = normalizeSymbol(itemSymbol);
    if (!full && !base) return false;
    if (full && index.full.has(full)) return true;
    if (base && index.base.has(base)) return true;
    if (full && index.base.has(full)) return true;
    if (base && index.full.has(base)) return true;
    return false;
};

const companyMatchesNames = (company, nameList) => {
    const c = String(company || '').trim().toUpperCase();
    if (!c || c.length < 3) return false;
    return nameList.some((name) => {
        if (!name) return false;
        if (c === name) return true;
        if (c.includes(name) || name.includes(c)) return true;
        const cWords = c.replace(/\s+PLC$|\s+LTD$|\s+LIMITED$/i, '').trim();
        const nWords = name.replace(/\s+PLC$|\s+LTD$|\s+LIMITED$/i, '').trim();
        return cWords.length >= 4 && nWords.length >= 4 && (cWords.includes(nWords) || nWords.includes(cWords));
    });
};

export const itemMatchesHoldings = (item, holdingSymbols = [], holdingNames = []) => {
    if (symbolMatchesIndex(item?.symbol, buildSymbolIndex(holdingSymbols))) return true;
    return companyMatchesNames(item?.company, buildNameIndex(holdingNames));
};

export const itemMatchesWatchlist = (item, watchlistSymbols = []) => {
    return symbolMatchesIndex(item?.symbol, buildSymbolIndex(watchlistSymbols));
};

export const rankAnnouncements = (items, options = {}) => {
    const {
        holdingSymbols = [],
        holdingNames = [],
        watchlistSymbols = [],
        limit = 4
    } = options;

    const holdingSymIndex = buildSymbolIndex(holdingSymbols);
    const watchSymIndex = buildSymbolIndex(watchlistSymbols);
    const holdingNameList = buildNameIndex(holdingNames);

    const scored = (Array.isArray(items) ? items : []).map((item) => {
        let tier = 2;
        if (
            symbolMatchesIndex(item?.symbol, holdingSymIndex) ||
            companyMatchesNames(item?.company, holdingNameList)
        ) {
            tier = 0;
        } else if (symbolMatchesIndex(item?.symbol, watchSymIndex)) {
            tier = 1;
        }
        const time = item?.date ? Date.parse(item.date) : 0;
        return { item, tier, time: Number.isFinite(time) ? time : 0 };
    });

    scored.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.time - a.time;
    });

    return scored.slice(0, limit).map(({ item, tier }) => ({
        ...item,
        isHolding: tier === 0,
        isWatchlist: tier === 1
    }));
};

export const countHoldingMatches = (items, holdingSymbols, holdingNames) =>
    (Array.isArray(items) ? items : []).filter((item) =>
        itemMatchesHoldings(item, holdingSymbols, holdingNames)
    ).length;
