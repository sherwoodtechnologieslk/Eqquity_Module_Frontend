import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtNum, sparklinePath } from './cseFormat';

const REFRESH_MS = 3 * 60 * 1000;

// ASPI intraday trend from CSE chartData (index-chart proxy).
const IndexTrendCard = () => {
    const [points, setPoints] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.indexChart('ASI', 1);
            setPoints(res.points || []);
            setLastUpdated(res.lastUpdated);
            setNote(res.note || '');
        } catch (e) {
            setPoints([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const values = points.map((p) => p.value);
    const spark = sparklinePath(values, 320, 90);
    const first = values[0];
    const last = values[values.length - 1];
    const changePct = first ? ((last - first) / first) * 100 : 0;
    const stroke = spark.up ? '#16a34a' : '#dc2626';
    const fill = spark.up ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)';

    return (
        <CseCardShell
            title="ASPI Intraday Trend"
            subtitle="All Share Price Index"
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--index"
        >
            {loading && points.length === 0 ? (
                <div className="cse-card__state">Loading index trend…</div>
            ) : points.length < 2 ? (
                <div className="cse-card__state">{note || 'No intraday index data available.'}</div>
            ) : (
                <div className="cse-spark__wrap">
                    <svg className="cse-spark" viewBox="0 0 320 90" preserveAspectRatio="none">
                        <path d={spark.area} fill={fill} stroke="none" />
                        <path d={spark.line} fill="none" stroke={stroke} strokeWidth="2" />
                    </svg>
                    <div className="cse-spark__foot">
                        <span>Open {fmtNum(first, 2)}</span>
                        <span style={{ fontWeight: 700, color: stroke }}>
                            {fmtNum(last, 2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            )}
        </CseCardShell>
    );
};

export default IndexTrendCard;
