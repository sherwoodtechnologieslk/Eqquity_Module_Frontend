import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import cseApi from '../../../services/cseApi';
import CseCardShell from './CseCardShell';
import { fmtNum, fmtPct, pctClass, sparklinePath } from './cseFormat';

const REFRESH_MS = 3 * 60 * 1000;
const CHART_COUNT = 4;
const TILE_CHART_W = 160;
const TILE_CHART_H = 64;
const TILE_CHART_PAD = 4;
const TILE_GRID_LINES = [0.25, 0.5, 0.75];

const DEFAULT_SYMBOLS = ['JKH.N0000', 'COMB.N0000', 'SAMP.N0000', 'DIAL.N0000'];

const toCseSymbol = (raw) => {
    const s = String(raw || '').trim().toUpperCase();
    if (!s) return '';
    return s.includes('.') ? s : `${s}.N0000`;
};

const buildDefaultSlots = (holdingSymbols) => {
    const fromHoldings = (holdingSymbols || [])
        .map(toCseSymbol)
        .filter(Boolean);
    const merged = [...fromHoldings];
    DEFAULT_SYMBOLS.forEach((sym) => {
        if (!merged.includes(sym)) merged.push(sym);
    });
    return Array.from({ length: CHART_COUNT }, (_, i) => merged[i] || DEFAULT_SYMBOLS[i]);
};

// Single intraday sparkline tile with its own symbol dropdown.
const IntradaySparkTile = ({ symbol, options, onSymbolChange, refreshKey }) => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const chartFillId = useId().replace(/:/g, '');

    const load = useCallback(async () => {
        if (!symbol) {
            setPoints([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await cseApi.companyChart({ symbol, period: 1 });
            setPoints(res.points || []);
            setNote(res.note || '');
        } catch (e) {
            setPoints([]);
            setNote('Failed to load chart.');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const values = points.map((p) => p.price);
    const spark = sparklinePath(values, TILE_CHART_W, TILE_CHART_H, TILE_CHART_PAD);
    const first = values[0];
    const last = values[values.length - 1];
    const changePct = first ? ((last - first) / first) * 100 : 0;
    const changeDir = pctClass(changePct);
    const stroke = spark.up ? '#059669' : '#dc2626';

    const gridYs = TILE_GRID_LINES.map(
        (t) => TILE_CHART_PAD + (TILE_CHART_H - TILE_CHART_PAD * 2) * t
    );

    return (
        <div className="cse-intraday-tile">
            <div className="cse-intraday-tile__head">
                <select
                    className="cse-intraday-tile__select"
                    value={symbol}
                    onChange={(e) => onSymbolChange(e.target.value)}
                    aria-label="Select stock for intraday chart"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {!loading && points.length >= 2 ? (
                    <span className={`cse-intraday-tile__pct cse-${changeDir}`}>
                        {fmtPct(changePct)}
                    </span>
                ) : null}
            </div>

            {loading && points.length === 0 ? (
                <div className="cse-intraday-tile__state">Loading…</div>
            ) : points.length < 2 ? (
                <div className="cse-intraday-tile__state">{note || 'No intraday data.'}</div>
            ) : (
                <div className="cse-intraday-tile__chart">
                    <svg
                        className="cse-intraday-tile__svg"
                        viewBox={`0 0 ${TILE_CHART_W} ${TILE_CHART_H}`}
                        preserveAspectRatio="none"
                        aria-hidden
                    >
                        <defs>
                            <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {gridYs.map((y) => (
                            <line
                                key={y}
                                x1={TILE_CHART_PAD}
                                y1={y}
                                x2={TILE_CHART_W - TILE_CHART_PAD}
                                y2={y}
                                className="cse-intraday-tile__grid"
                            />
                        ))}
                        <path d={spark.area} fill={`url(#${chartFillId})`} stroke="none" />
                        <path
                            d={spark.line}
                            fill="none"
                            stroke={stroke}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <div className="cse-intraday-tile__foot">
                        <span>Open {fmtNum(first, 2)}</span>
                        <span>
                            Now <strong className={`cse-${changeDir}`}>{fmtNum(last, 2)}</strong>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Four intraday charts with per-slot symbol dropdowns (companyChartDataByStock).
const CompanyIntradayCard = ({ holdingSymbols = [] }) => {
    const [slotSymbols, setSlotSymbols] = useState(() => buildDefaultSlots(holdingSymbols));
    const [symbolOptions, setSymbolOptions] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [catalogLoading, setCatalogLoading] = useState(true);

    // Build dropdown catalog from live share prices + portfolio holdings.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setCatalogLoading(true);
            try {
                const res = await cseApi.sharePrices();
                const fromApi = (res.items || [])
                    .map((item) => ({
                        value: item.symbolFull || toCseSymbol(item.symbol),
                        label: item.symbolFull || item.symbol
                    }))
                    .filter((o) => o.value);

                const fromHoldings = (holdingSymbols || [])
                    .map(toCseSymbol)
                    .filter(Boolean)
                    .map((value) => ({ value, label: value }));

                const seen = new Set();
                const merged = [];
                [...fromHoldings, ...fromApi, ...DEFAULT_SYMBOLS.map((value) => ({ value, label: value }))].forEach(
                    (opt) => {
                        if (!opt.value || seen.has(opt.value)) return;
                        seen.add(opt.value);
                        merged.push(opt);
                    }
                );

                if (!cancelled) {
                    setSymbolOptions(merged);
                    setLastUpdated(res.lastUpdated || new Date().toISOString());
                }
            } catch (e) {
                if (!cancelled) {
                    setSymbolOptions(
                        DEFAULT_SYMBOLS.map((value) => ({ value, label: value }))
                    );
                }
            } finally {
                if (!cancelled) setCatalogLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [holdingSymbols]);

    // When holdings load, pre-fill empty slots without overwriting user picks.
    useEffect(() => {
        const defaults = buildDefaultSlots(holdingSymbols);
        setSlotSymbols((prev) =>
            prev.map((sym, i) => (sym ? sym : defaults[i] || DEFAULT_SYMBOLS[i]))
        );
    }, [holdingSymbols]);

    const options = useMemo(() => {
        if (symbolOptions.length > 0) return symbolOptions;
        return DEFAULT_SYMBOLS.map((value) => ({ value, label: value }));
    }, [symbolOptions]);

    const handleSlotChange = (index, value) => {
        setSlotSymbols((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleRefresh = () => {
        setRefreshKey((k) => k + 1);
        setLastUpdated(new Date().toISOString());
    };

    useEffect(() => {
        const id = setInterval(() => setRefreshKey((k) => k + 1), REFRESH_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <CseCardShell
            title="Stock Intraday"
            subtitle="4 live charts — pick a symbol per panel"
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            refreshing={catalogLoading}
            className="cse-card--company-chart cse-intraday-card"
        >
            {catalogLoading && options.length <= DEFAULT_SYMBOLS.length ? (
                <div className="cse-card__state">Loading symbol list…</div>
            ) : (
                <div className="cse-intraday-grid">
                    {slotSymbols.map((sym, index) => (
                        <IntradaySparkTile
                            key={`slot-${index}`}
                            symbol={sym}
                            options={options}
                            onSymbolChange={(value) => handleSlotChange(index, value)}
                            refreshKey={refreshKey}
                        />
                    ))}
                </div>
            )}
        </CseCardShell>
    );
};

export default CompanyIntradayCard;
