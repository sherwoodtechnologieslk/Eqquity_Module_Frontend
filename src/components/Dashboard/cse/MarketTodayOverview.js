import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import cseApi from '../../../services/cseApi';
import { fmtCompact, fmtNum, fmtPct, pctClass, sparklinePath } from './cseFormat';
import './DashboardCseExtras.css';

const REFRESH_MS = 3 * 60 * 1000;
const CHART_W = 320;
const CHART_H = 72;
const CHART_PAD = 4;

const METRICS = [
    { key: 'tradeVolume', label: 'Turnover', currency: true },
    { key: 'shareVolume', label: 'Share volume', currency: false },
    { key: 'trades', label: 'Trades', currency: false },
];

const GRID_LINES = [0.25, 0.5, 0.75];

// Combined CSE Market Today: summary metrics, ASPI trend, and live share prices.
const MarketTodayOverview = () => {
    const [summary, setSummary] = useState(null);
    const [points, setPoints] = useState([]);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trendNote, setTrendNote] = useState('');
    const [priceNote, setPriceNote] = useState('');
    const chartFillId = useId().replace(/:/g, '');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const [summaryRes, trendRes, pricesRes] = await Promise.allSettled([
            cseApi.liveMarketSummary(),
            cseApi.indexChart('ASI', 1),
            cseApi.sharePrices(),
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

    const values = useMemo(() => points.map((p) => p.value), [points]);
    const spark = useMemo(
        () => sparklinePath(values, CHART_W, CHART_H, CHART_PAD),
        [values]
    );
    const first = values[0];
    const last = values[values.length - 1];
    const changePct = first ? ((last - first) / first) * 100 : 0;
    const changeDir = pctClass(changePct);
    const stroke = spark.up ? '#059669' : '#dc2626';
    const tickerDuration = Math.max(90, prices.length * 2.5);

    const gridYs = useMemo(
        () => GRID_LINES.map((t) => CHART_PAD + (CHART_H - CHART_PAD * 2) * t),
        []
    );

    return (
        <div
            className="content-card cse-market-today cse-today-overview"
            role="status"
            aria-label="Live CSE market overview"
        >
            <div className="card-header cse-market-today__header">
                <div className="header-left cse-market-today__heading">
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

            <div className="cse-today-overview__chart">
                <div className="cse-today-overview__chart-head">
                    <div>
                        <span className="cse-today-overview__chart-title">ASPI Intraday</span>
                        <span className="cse-today-overview__chart-sub">All Share Price Index</span>
                    </div>
                    {!loading && points.length >= 2 ? (
                        <div className="cse-today-overview__chart-quote">
                            <span className="cse-today-overview__chart-last">
                                {fmtNum(last, 2)}
                            </span>
                            <span className={`cse-today-overview__chart-pct cse-${changeDir}`}>
                                {fmtPct(changePct)}
                            </span>
                        </div>
                    ) : null}
                </div>

                {loading && points.length === 0 ? (
                    <div className="cse-today-overview__chart-state">Loading index trend…</div>
                ) : points.length < 2 ? (
                    <div className="cse-today-overview__chart-state">
                        {trendNote || 'No intraday index data.'}
                    </div>
                ) : (
                    <>
                        <svg
                            className="cse-today-overview__svg"
                            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                            preserveAspectRatio="none"
                            aria-hidden
                        >
                            <defs>
                                <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
                                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {gridYs.map((y) => (
                                <line
                                    key={y}
                                    x1={CHART_PAD}
                                    y1={y}
                                    x2={CHART_W - CHART_PAD}
                                    y2={y}
                                    className="cse-today-overview__grid"
                                />
                            ))}
                            <path d={spark.area} fill={`url(#${chartFillId})`} stroke="none" />
                            <path
                                d={spark.line}
                                fill="none"
                                stroke={stroke}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                        <div className="cse-today-overview__chart-foot">
                            <span>Open {fmtNum(first, 2)}</span>
                            <span>
                                Current{' '}
                                <strong className={`cse-${changeDir}`}>{fmtNum(last, 2)}</strong>
                            </span>
                            <span className={`cse-${changeDir}`}>{fmtPct(changePct)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="cse-today-overview__prices">
                <div className="cse-today-overview__prices-head">
                    <span className="cse-today-overview__chart-title">Live Share Prices</span>
                    <span className="cse-today-overview__chart-sub">
                        {prices.length > 0
                            ? `All ${prices.length} listed securities`
                            : 'Full CSE board'}
                    </span>
                </div>
                {loading && prices.length === 0 ? (
                    <div className="cse-today-overview__chart-state">Loading share prices…</div>
                ) : prices.length === 0 ? (
                    <div className="cse-today-overview__chart-state">
                        {priceNote || 'No share price data available.'}
                    </div>
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
