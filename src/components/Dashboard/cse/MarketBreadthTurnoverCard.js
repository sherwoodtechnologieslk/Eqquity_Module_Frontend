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
    const domNet = domBuy - domSell;
    const totalFlow = foreignBuy + foreignSell + domBuy + domSell || 1;

    const maxTurnover = items.reduce((m, i) => Math.max(m, Number(i.turnover) || 0), 0) || 1;

    return (
        <CseCardShell
            title="Market Breadth & Turnover"
            subtitle={
                total
                    ? `Daily flow · Top 25 of ${total} securities`
                    : 'Daily flow & turnover leaders · Colombo Stock Exchange'
            }
            lastUpdated={lastUpdated}
            onRefresh={() => load()}
            refreshing={loading}
            className="cse-card--combo cse-breadth-turnover"
        >
            <div className="cse-breadth-turnover__body">
                {/* ---- Breadth & flow ---- */}
                <section className="cse-breadth-turnover__panel" aria-label="Market breadth and flow">
                    {loading && !latest ? (
                        <div className="cse-breadth-turnover__state">Loading daily market summary…</div>
                    ) : !latest ? (
                        <div className="cse-breadth-turnover__state">
                            {breadthNote || 'No daily summary available.'}
                        </div>
                    ) : (
                        <>
                            <div className="cse-breadth-turnover__stats">
                                <div className="cse-breadth-turnover__stat">
                                    <span className="cse-breadth-turnover__stat-label">Market turnover</span>
                                    <span className="cse-breadth-turnover__stat-value">
                                        <span className="cse-breadth-turnover__currency">LKR</span>
                                        {fmtCompact(latest.marketTurnover)}
                                    </span>
                                </div>
                                <div className="cse-breadth-turnover__stat">
                                    <span className="cse-breadth-turnover__stat-label">Market cap</span>
                                    <span className="cse-breadth-turnover__stat-value">
                                        <span className="cse-breadth-turnover__currency">LKR</span>
                                        {fmtCompact(latest.marketCap)}
                                    </span>
                                </div>
                                <div className="cse-breadth-turnover__stat">
                                    <span className="cse-breadth-turnover__stat-label">Trades</span>
                                    <span className="cse-breadth-turnover__stat-value">
                                        {fmtCompact(latest.tradesNo)}
                                    </span>
                                </div>
                                <div className="cse-breadth-turnover__stat">
                                    <span className="cse-breadth-turnover__stat-label">Cos. traded</span>
                                    <span className="cse-breadth-turnover__stat-value">
                                        {fmtNum(latest.tradedCompanies, 0)}
                                        <span className="cse-breadth-turnover__stat-muted">
                                            {' '}
                                            / {fmtNum(latest.listedCompanies, 0)}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="cse-breadth-turnover__flow">
                                <div className="cse-breadth-turnover__flow-head">
                                    <span className="cse-breadth-turnover__flow-title">Investor flow</span>
                                    <div className="cse-breadth-turnover__flow-legend" aria-hidden>
                                        <span className="cse-breadth-turnover__flow-legend-item cse-breadth-turnover__flow-legend-item--buy">
                                            Buy
                                        </span>
                                        <span className="cse-breadth-turnover__flow-legend-item cse-breadth-turnover__flow-legend-item--sell">
                                            Sell
                                        </span>
                                    </div>
                                </div>

                                <div className="cse-breadth-turnover__flow-row">
                                    <span className="cse-breadth-turnover__flow-label">Foreign</span>
                                    <span className="cse-breadth-turnover__flow-track">
                                        <span
                                            className="cse-breadth-turnover__flow-seg cse-breadth-turnover__flow-seg--buy"
                                            style={{ width: `${(foreignBuy / totalFlow) * 100}%` }}
                                        />
                                        <span
                                            className="cse-breadth-turnover__flow-seg cse-breadth-turnover__flow-seg--sell"
                                            style={{ width: `${(foreignSell / totalFlow) * 100}%` }}
                                        />
                                    </span>
                                    <span
                                        className={`cse-breadth-turnover__flow-net cse-${pctClass(foreignNet)}`}
                                    >
                                        {foreignNet >= 0 ? '+' : ''}
                                        {fmtCompact(foreignNet)}
                                    </span>
                                </div>

                                <div className="cse-breadth-turnover__flow-row">
                                    <span className="cse-breadth-turnover__flow-label">Domestic</span>
                                    <span className="cse-breadth-turnover__flow-track">
                                        <span
                                            className="cse-breadth-turnover__flow-seg cse-breadth-turnover__flow-seg--buy"
                                            style={{ width: `${(domBuy / totalFlow) * 100}%` }}
                                        />
                                        <span
                                            className="cse-breadth-turnover__flow-seg cse-breadth-turnover__flow-seg--sell"
                                            style={{ width: `${(domSell / totalFlow) * 100}%` }}
                                        />
                                    </span>
                                    <span
                                        className={`cse-breadth-turnover__flow-net cse-${pctClass(domNet)}`}
                                    >
                                        {domNet >= 0 ? '+' : ''}
                                        {fmtCompact(domNet)}
                                    </span>
                                </div>
                            </div>

                            <div className="cse-breadth-turnover__indices" aria-label="Market indices">
                                <span className="cse-breadth-turnover__chip">PER {fmtNum(latest.per, 1)}</span>
                                <span className="cse-breadth-turnover__chip">PBV {fmtNum(latest.pbv, 1)}</span>
                                <span className="cse-breadth-turnover__chip">DY {fmtNum(latest.dy, 1)}%</span>
                                <span className="cse-breadth-turnover__chip">ASI {fmtNum(latest.asi, 0)}</span>
                                <span className="cse-breadth-turnover__chip">SL20 {fmtNum(latest.spp, 0)}</span>
                            </div>
                        </>
                    )}
                </section>

                {/* ---- Turnover leaders ---- */}
                <section className="cse-breadth-turnover__panel" aria-label="Turnover leaders">
                    <div className="cse-breadth-turnover__panel-head">
                        <span className="cse-breadth-turnover__panel-title">Turnover leaders</span>
                        {total ? (
                            <span className="cse-breadth-turnover__panel-meta">Top 25 of {total}</span>
                        ) : null}
                    </div>

                    {loading && items.length === 0 ? (
                        <div className="cse-breadth-turnover__state">Loading turnover leaders…</div>
                    ) : items.length === 0 ? (
                        <div className="cse-breadth-turnover__state">
                            {turnoverNote || 'No trade summary available.'}
                        </div>
                    ) : (
                        <>
                            <div className="cse-breadth-turnover__list-head" aria-hidden>
                                <span>#</span>
                                <span>Symbol</span>
                                <span>Turnover</span>
                                <span>Last / Chg</span>
                            </div>
                            <div className="cse-breadth-turnover__list">
                                {items.map((s, index) => {
                                    const chgDir = pctClass(s.percentageChange);
                                    const barWidth = Math.max(
                                        (Number(s.turnover) || 0) / maxTurnover * 100,
                                        6
                                    );
                                    return (
                                        <div className="cse-breadth-turnover__row" key={s.id}>
                                            <span className="cse-breadth-turnover__rank">{index + 1}</span>
                                            <div className="cse-breadth-turnover__symbol">
                                                <span className="cse-breadth-turnover__sym">{s.symbol}</span>
                                                <span className="cse-breadth-turnover__name" title={s.name}>
                                                    {s.name}
                                                </span>
                                                <span className="cse-breadth-turnover__bar" aria-hidden>
                                                    <span
                                                        className="cse-breadth-turnover__bar-fill"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </span>
                                            </div>
                                            <span className="cse-breadth-turnover__turnover">
                                                LKR {fmtCompact(s.turnover)}
                                            </span>
                                            <span className={`cse-breadth-turnover__quote cse-${chgDir}`}>
                                                <span className="cse-breadth-turnover__price">
                                                    {fmtNum(s.price)}
                                                </span>
                                                <span className="cse-breadth-turnover__chg">
                                                    {fmtPct(s.percentageChange)}
                                                </span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </CseCardShell>
    );
};

export default MarketBreadthTurnoverCard;
