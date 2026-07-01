import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtNum, fmtPct, pctClass } from './cseFormat';

const REFRESH_MS = 4 * 60 * 1000;

// Live CSE sector index values (allSectors).
const SectorIndicesCard = () => {
    const [items, setItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.sectorIndices();
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

    const sorted = [...items].sort(
        (a, b) => Math.abs(Number(b.percentage) || 0) - Math.abs(Number(a.percentage) || 0)
    );

    return (
        <CseCardShell
            title="Sector Indices"
            subtitle={`${items.length} CSE sectors`}
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--sectors"
        >
            {loading && items.length === 0 ? (
                <div className="cse-card__state">Loading sector indices…</div>
            ) : items.length === 0 ? (
                <div className="cse-card__state">{note || 'No sector data available.'}</div>
            ) : (
                <div className="cse-list">
                    {sorted.map((s) => (
                        <div className="cse-row" key={s.id}>
                            <div className="cse-row__main">
                                <span className="cse-row__sym">{s.name || s.symbol}</span>
                                <span className="cse-row__name">{s.indexName}</span>
                            </div>
                            <span className="cse-row__val">{fmtNum(s.value, 2)}</span>
                            <span className={`cse-row__chg cse-${pctClass(s.percentage)}`}>
                                {fmtPct(s.percentage)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default SectorIndicesCard;
