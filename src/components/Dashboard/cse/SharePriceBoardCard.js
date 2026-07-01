import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtNum, fmtPct, pctClass } from './cseFormat';

const REFRESH_MS = 3 * 60 * 1000;

// Today's share price board for every security (todaySharePrice).
const SharePriceBoardCard = () => {
    const [items, setItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [query, setQuery] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.sharePrices();
            setItems(res.items || []);
            setLastUpdated(res.lastUpdated);
            setNote(res.note || '');
        } catch (e) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const filtered = useMemo(() => {
        const q = query.trim().toUpperCase();
        const list = q ? items.filter((i) => (i.symbol || '').toUpperCase().includes(q)) : items;
        return list.slice(0, 120);
    }, [items, query]);

    return (
        <CseCardShell
            title="Live Share Prices"
            subtitle={`${items.length} securities`}
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--prices"
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by symbol…"
                style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    outline: 'none'
                }}
            />
            {loading && items.length === 0 ? (
                <div className="cse-card__state">Loading share prices…</div>
            ) : items.length === 0 ? (
                <div className="cse-card__state">{note || 'No share price data available.'}</div>
            ) : (
                <div className="cse-list">
                    {filtered.map((s) => (
                        <div className="cse-row" key={s.id}>
                            <div className="cse-row__main">
                                <span className="cse-row__sym">{s.symbol}</span>
                                <span className="cse-row__name">
                                    O {fmtNum(s.open)} · H {fmtNum(s.high)} · L {fmtNum(s.low)}
                                </span>
                            </div>
                            <span className="cse-row__val">{fmtNum(s.lastTradedPrice)}</span>
                            <span className={`cse-row__chg cse-${pctClass(s.changePercentage)}`}>
                                {fmtPct(s.changePercentage)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default SharePriceBoardCard;
