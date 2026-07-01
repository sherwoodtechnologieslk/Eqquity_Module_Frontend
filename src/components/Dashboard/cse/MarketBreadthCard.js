import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtCompact, fmtNum } from './cseFormat';

const REFRESH_MS = 5 * 60 * 1000;

// Daily market summary: foreign vs domestic flow + valuation ratios.
// Source: CSE dailyMarketSummery.
const MarketBreadthCard = () => {
    const [latest, setLatest] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.dailyMarketSummary();
            setLatest(res.latest || null);
            setLastUpdated(res.lastUpdated);
            setNote(res.note || '');
        } catch (e) {
            setLatest(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const foreignBuy = Number(latest?.foreignPurchase) || 0;
    const foreignSell = Number(latest?.foreignSales) || 0;
    const foreignNet = foreignBuy - foreignSell;
    const domBuy = Number(latest?.domesticPurchase) || 0;
    const domSell = Number(latest?.domesticSales) || 0;
    const totalFlow = foreignBuy + foreignSell + domBuy + domSell || 1;

    return (
        <CseCardShell
            title="Market Breadth & Flow"
            subtitle="Daily summary"
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--breadth"
        >
            {loading && !latest ? (
                <div className="cse-card__state">Loading daily market summary…</div>
            ) : !latest ? (
                <div className="cse-card__state">{note || 'No daily summary available.'}</div>
            ) : (
                <>
                    <div className="cse-stat-grid">
                        <div className="cse-stat">
                            <span className="cse-stat__label">Market turnover</span>
                            <span className="cse-stat__value">LKR {fmtCompact(latest.marketTurnover)}</span>
                        </div>
                        <div className="cse-stat">
                            <span className="cse-stat__label">Market cap</span>
                            <span className="cse-stat__value">LKR {fmtCompact(latest.marketCap)}</span>
                        </div>
                        <div className="cse-stat">
                            <span className="cse-stat__label">Trades</span>
                            <span className="cse-stat__value">{fmtCompact(latest.tradesNo)}</span>
                        </div>
                        <div className="cse-stat">
                            <span className="cse-stat__label">Cos. traded</span>
                            <span className="cse-stat__value">
                                {fmtNum(latest.tradedCompanies, 0)} / {fmtNum(latest.listedCompanies, 0)}
                            </span>
                        </div>
                    </div>

                    <div className="cse-flow">
                        <div className="cse-flow__row">
                            <span style={{ minWidth: 56 }}>Foreign</span>
                            <span className="cse-flow__track">
                                <span
                                    className="cse-flow__seg--buy"
                                    style={{ width: `${(foreignBuy / totalFlow) * 100}%` }}
                                />
                                <span
                                    className="cse-flow__seg--sell"
                                    style={{ width: `${(foreignSell / totalFlow) * 100}%` }}
                                />
                            </span>
                            <span className={foreignNet >= 0 ? 'cse-up' : 'cse-down'} style={{ minWidth: 70, textAlign: 'right', fontWeight: 700 }}>
                                {foreignNet >= 0 ? '+' : ''}{fmtCompact(foreignNet)}
                            </span>
                        </div>
                        <div className="cse-flow__row">
                            <span style={{ minWidth: 56 }}>Domestic</span>
                            <span className="cse-flow__track">
                                <span
                                    className="cse-flow__seg--buy"
                                    style={{ width: `${(domBuy / totalFlow) * 100}%` }}
                                />
                                <span
                                    className="cse-flow__seg--sell"
                                    style={{ width: `${(domSell / totalFlow) * 100}%` }}
                                />
                            </span>
                            <span style={{ minWidth: 70, textAlign: 'right', fontWeight: 700 }}>
                                {fmtCompact(domBuy - domSell)}
                            </span>
                        </div>
                    </div>

                    <div className="cse-chip-row">
                        <span className="cse-chip">PER {fmtNum(latest.per, 1)}</span>
                        <span className="cse-chip">PBV {fmtNum(latest.pbv, 1)}</span>
                        <span className="cse-chip">DY {fmtNum(latest.dy, 1)}%</span>
                        <span className="cse-chip">ASI {fmtNum(latest.asi, 0)}</span>
                        <span className="cse-chip">SL20 {fmtNum(latest.spp, 0)}</span>
                    </div>
                </>
            )}
        </CseCardShell>
    );
};

export default MarketBreadthCard;
