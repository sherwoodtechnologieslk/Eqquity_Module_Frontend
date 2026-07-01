import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import { fmtCompact } from './cseFormat';
import './DashboardCseExtras.css';

const REFRESH_MS = 3 * 60 * 1000;

const METRICS = [
    { key: 'tradeVolume', label: 'Turnover', currency: true },
    { key: 'shareVolume', label: 'Share volume', currency: false },
    { key: 'trades', label: 'Trades', currency: false }
];

// Live market-wide turnover / share volume / trades (CSE marketSummery).
const LiveMarketSummaryBar = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await cseApi.liveMarketSummary();
            setSummary(res.summary || null);
        } catch (e) {
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    return (
        <div className="content-card cse-market-today" role="status" aria-label="Live CSE market summary">
            <div className="card-header cse-market-today__header">
                <div className="header-left cse-market-today__heading">
                    <span className="card-subtitle">CSE Today</span>
                    <span className="cse-market-today__hint">Live market summary</span>
                </div>
                <span className="cse-market-today__badge">
                    <span className="cse-market-today__badge-dot" aria-hidden />
                    Live
                </span>
            </div>

            <div className="cse-market-today__grid">
                {METRICS.map(({ key, label, currency }) => (
                    <div key={key} className="cse-market-today__stat">
                        <span className="cse-market-today__stat-label">{label}</span>
                        <span className="cse-market-today__stat-value">
                            {loading ? (
                                '…'
                            ) : currency ? (
                                <>
                                    <span className="cse-market-today__currency">LKR</span>
                                    {fmtCompact(summary?.[key])}
                                </>
                            ) : (
                                fmtCompact(summary?.[key])
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveMarketSummaryBar;
