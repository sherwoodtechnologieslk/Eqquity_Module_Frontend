import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtCompact, fmtNum, fmtPct, pctClass } from './cseFormat';

const REFRESH_MS = 2 * 60 * 1000;

// Recent individual trade prints / tape (detailedTrades).
const DetailedTradesCard = () => {
    const [items, setItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.detailedTrades();
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

    return (
        <CseCardShell
            title="Trade Tape"
            subtitle="Recent prints"
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--trades"
        >
            {loading && items.length === 0 ? (
                <div className="cse-card__state">Loading recent trades…</div>
            ) : items.length === 0 ? (
                <div className="cse-card__state">{note || 'No detailed trades available.'}</div>
            ) : (
                <div className="cse-list">
                    {items.map((t) => (
                        <div className="cse-row" key={`${t.id}-${t.price}-${t.qty}`}>
                            <div className="cse-row__main">
                                <span className="cse-row__sym">{t.symbol}</span>
                                <span className="cse-row__name" title={t.name}>
                                    {fmtCompact(t.qty)} sh · {t.trades} trades
                                </span>
                            </div>
                            <span className="cse-row__val">{fmtNum(t.price)}</span>
                            <span className={`cse-row__chg cse-${pctClass(t.changePercentage)}`}>
                                {fmtPct(t.changePercentage)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default DetailedTradesCard;
