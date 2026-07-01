import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtCompact, fmtNum, fmtPct, pctClass } from './cseFormat';

const REFRESH_MS = 3 * 60 * 1000;

// Turnover leaders across the whole market (tradeSummary).
const TurnoverLeadersCard = () => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.turnoverLeaders();
            setItems(res.items || []);
            setTotal(res.totalSecurities || 0);
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

    const maxTurnover = items.reduce((m, i) => Math.max(m, Number(i.turnover) || 0), 0) || 1;

    return (
        <CseCardShell
            title="Turnover Leaders"
            subtitle={total ? `Top 25 of ${total}` : 'Full-market snapshot'}
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--turnover"
        >
            {loading && items.length === 0 ? (
                <div className="cse-card__state">Loading turnover leaders…</div>
            ) : items.length === 0 ? (
                <div className="cse-card__state">{note || 'No trade summary available.'}</div>
            ) : (
                <div className="cse-list">
                    {items.map((s) => (
                        <div className="cse-row" key={s.id}>
                            <div className="cse-row__main">
                                <span className="cse-row__sym">{s.symbol}</span>
                                <span className="cse-row__name" title={s.name}>{s.name}</span>
                                <span
                                    aria-hidden
                                    style={{
                                        height: 3,
                                        marginTop: 3,
                                        borderRadius: 2,
                                        background: '#0ea5e9',
                                        width: `${Math.max((Number(s.turnover) || 0) / maxTurnover * 100, 4)}%`
                                    }}
                                />
                            </div>
                            <span className="cse-row__num" style={{ minWidth: 78, color: '#0f172a', fontWeight: 700 }}>
                                LKR {fmtCompact(s.turnover)}
                            </span>
                            <span className={`cse-row__chg cse-${pctClass(s.percentageChange)}`}>
                                {fmtNum(s.price)} {fmtPct(s.percentageChange)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default TurnoverLeadersCard;
