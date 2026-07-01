import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtTime } from './cseFormat';

const REFRESH_MS = 30 * 60 * 1000;

// Legacy COVID-19 disclosure notices (getCOVIDAnnouncements).
const CovidNoticesCard = () => {
    const [items, setItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.covidAnnouncements();
            setItems(Array.isArray(res.items) ? res.items : []);
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
            title="COVID-19 Disclosures"
            subtitle="Archived notices"
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--covid"
        >
            {loading && items.length === 0 ? (
                <div className="cse-card__state">Loading COVID disclosures…</div>
            ) : items.length === 0 ? (
                <div className="cse-card__state">{note || 'No COVID disclosures available.'}</div>
            ) : (
                <div className="cse-list">
                    {items.slice(0, 30).map((a) => (
                        <div className="cse-row" key={a.id}>
                            <div className="cse-row__main">
                                <span className="cse-row__sym">{a.company}</span>
                                <span className="cse-row__name" title={a.title}>{a.title}</span>
                            </div>
                            <span className="cse-row__num" style={{ fontSize: 10.5, color: '#94a3b8' }}>
                                {fmtTime(a.date)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default CovidNoticesCard;
