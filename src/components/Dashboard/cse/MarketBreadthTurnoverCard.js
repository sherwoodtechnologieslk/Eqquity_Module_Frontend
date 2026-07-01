import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtCompact, fmtNum, fmtPct, pctClass } from './cseFormat';

const REFRESH_MS = 3 * 60 * 1000;

// Combined view: daily market breadth/flow (dailyMarketSummery) on top and
// market-wide turnover leaders (tradeSummary) below, in a single card.
const MarketBreadthTurnoverCard = () => {
    const [latest, setLatest] = useState(null);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [breadthNote, setBreadthNote] = useState('');
    const [turnoverNote, setTurnoverNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const [breadthRes, turnoverRes] = await Promise.allSettled([
            cseApi.dailyMarketSummary(),
            cseApi.turnoverLeaders()
        ]);

        if (breadthRes.status === 'fulfilled') {
            setLatest(breadthRes.value.latest || null);
            setBreadthNote(breadthRes.value.note || '');
            if (breadthRes.value.lastUpdated) setLastUpdated(breadthRes.value.lastUpdated);
        } else {
            setLatest(null);
        }

        if (turnoverRes.status === 'fulfilled') {
            setItems(turnoverRes.value.items || []);
            setTotal(turnoverRes.value.totalSecurities || 0);
            setTurnoverNote(turnoverRes.value.note || '');
            if (turnoverRes.value.lastUpdated) setLastUpdated(turnoverRes.value.lastUpdated);
        } else {
            setItems([]);
        }

        setLoading(false);
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

    const maxTurnover = items.reduce((m, i) => Math.max(m, Number(i.turnover) || 0), 0) || 1;

    return (
        <CseCardShell
            title="Market Breadth & Turnover"
            subtitle={total ? `Daily flow · Top 25 of ${total}` : 'Daily flow & turnover leaders'}
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--combo"
        >
            {/* ---- Breadth & flow ---- */}
            <div className="cse-combo__section">
                <span className="cse-section-label">Breadth &amp; Flow</span>
                {loading && !latest ? (
                    <div className="cse-card__state">Loading daily market summary…</div>
                ) : !latest ? (
                    <div className="cse-card__state">{breadthNote || 'No daily summary available.'}</div>
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
            </div>

            <div className="cse-combo__divider" aria-hidden />

            {/* ---- Turnover leaders ---- */}
            <div className="cse-combo__section">
                <span className="cse-section-label">
                    Turnover Leaders{total ? ` · Top 25 of ${total}` : ''}
                </span>
                {loading && items.length === 0 ? (
                    <div className="cse-card__state">Loading turnover leaders…</div>
                ) : items.length === 0 ? (
                    <div className="cse-card__state">{turnoverNote || 'No trade summary available.'}</div>
                ) : (
                    <div className="cse-list cse-combo__list">
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
            </div>
        </CseCardShell>
    );
};

export default MarketBreadthTurnoverCard;
