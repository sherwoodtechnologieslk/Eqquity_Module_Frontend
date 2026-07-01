import React, { useCallback, useEffect, useState } from 'react';
import cseApi from '../../../services/cseApi';
import { fmtCompact, fmtNum, fmtPct, pctClass, sparklinePath } from './cseFormat';
import './DashboardCseExtras.css';

const REFRESH_MS = 3 * 60 * 1000;

const METRICS = [
    { key: 'tradeVolume', label: 'Turnover', currency: true },
    { key: 'shareVolume', label: 'Share volume', currency: false },
    { key: 'trades', label: 'Trades', currency: false }
];

// Combined CSE Market Today: summary metrics, ASPI trend, and live share prices.
const MarketTodayOverview = () => {
    const [summary, setSummary] = useState(null);
    const [points, setPoints] = useState([]);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trendNote, setTrendNote] = useState('');
    const [priceNote, setPriceNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const [summaryRes, trendRes, pricesRes] = await Promise.allSettled([
            cseApi.liveMarketSummary(),
            cseApi.indexChart('ASI', 1),
            cseApi.sharePrices()
        ]);

        if (summaryRes.status === 'fulfilled') {
            setSummary(summaryRes.value.summary || null);
        } else {
            setSummary(null);
        }

        if (trendRes.status === 'fulfilled') {
            setPoints(trendRes.value.points || []);
            setTrendNote(trendRes.value.note || '');
        } else {
            setPoints([]);
        }

        if (pricesRes.status === 'fulfilled') {
            setPrices(pricesRes.value.items || []);
            setPriceNote(pricesRes.value.note || '');
        } else {
            setPrices([]);
        }

        setLoading(false);
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
    const tickerDuration = Math.max(90, prices.length * 2.5);

    return (
        <div
            className="content-card cse-market-today cse-today-overview"
            role="status"
            aria-label="Live CSE market overview"
        >
            <div className="card-header cse-market-today__header">
                <div className="header-left cse-market-today__heading">
                    <span className="card-subtitle">CSE Market Today</span>
                    <span className="cse-market-today__hint">
                        Live summary, ASPI trend &amp; share prices
                        {prices.length > 0 ? ` · ${prices.length} securities` : ''}
                    </span>
                </div>
                <span className="cse-market-today__badge">
                    <span className="cse-market-today__badge-dot" aria-hidden />
                    Live
                </span>
            </div>

            <div className="cse-today-overview__body">
                <div className="cse-market-today__grid cse-today-overview__metrics">
                    {METRICS.map(({ key, label, currency }) => (
                        <div key={key} className="cse-market-today__stat">
                            <span className="cse-market-today__stat-label">{label}</span>
                            <span className="cse-market-today__stat-value">
                                {loading && !summary ? (
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

                <div className="cse-today-overview__trend">
                    <div className="cse-today-overview__trend-head">
                        <span className="cse-today-overview__trend-title">ASPI Intraday</span>
                        <span className="cse-today-overview__trend-sub">All Share Price Index</span>
                    </div>
                    {loading && points.length === 0 ? (
                        <div className="cse-card__state">Loading index trend…</div>
                    ) : points.length < 2 ? (
                        <div className="cse-card__state">{trendNote || 'No intraday index data.'}</div>
                    ) : (
                        <div className="cse-spark__wrap">
                            <svg className="cse-spark" viewBox="0 0 320 90" preserveAspectRatio="none">
                                <path d={spark.area} fill={fill} stroke="none" />
                                <path d={spark.line} fill="none" stroke={stroke} strokeWidth="2" />
                            </svg>
                            <div className="cse-spark__foot">
                                <span>Open {fmtNum(first, 2)}</span>
                                <span style={{ fontWeight: 700, color: stroke }}>
                                    {fmtNum(last, 2)} ({changePct >= 0 ? '+' : ''}
                                    {changePct.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="cse-today-overview__prices">
                <div className="cse-today-overview__prices-head">
                    <span className="cse-today-overview__trend-title">Live Share Prices</span>
                    <span className="cse-today-overview__trend-sub">
                        {prices.length > 0
                            ? `All ${prices.length} listed securities`
                            : 'Full CSE board'}
                    </span>
                </div>
                {loading && prices.length === 0 ? (
                    <div className="cse-card__state">Loading share prices…</div>
                ) : prices.length === 0 ? (
                    <div className="cse-card__state">{priceNote || 'No share price data available.'}</div>
                ) : (
                    <div className="cse-ticker" role="marquee" aria-label="Live share prices ticker">
                        <div
                            className="cse-ticker__track"
                            style={{ '--ticker-duration': `${tickerDuration}s` }}
                        >
                            {[...prices, ...prices].map((s, i) => (
                                <span
                                    className="cse-ticker__item"
                                    key={`${s.symbolFull || s.symbol}-${i}`}
                                    title={s.name || s.symbolFull || s.symbol}
                                >
                                    <span className="cse-ticker__sym">
                                        {s.symbolFull || s.symbol}
                                    </span>
                                    <span className="cse-ticker__price">
                                        {fmtNum(s.lastTradedPrice)}
                                    </span>
                                    <span
                                        className={`cse-ticker__chg cse-${pctClass(s.changePercentage)}`}
                                    >
                                        {fmtPct(s.changePercentage)}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketTodayOverview;
