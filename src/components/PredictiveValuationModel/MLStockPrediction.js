import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut, Pie, Line, Scatter } from 'react-chartjs-2';
import './Styles/MLStockPrediction.css';
import { mlPredictionAPI } from '../../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

/* ----------------------------------------------------------------------- */
/*  Constants                                                                */
/* ----------------------------------------------------------------------- */
const PALETTE = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#84cc16'];
const RED = '#ef4444';
const GREEN = '#10b981';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'eda', label: 'EDA' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'classification', label: 'Classification' },
    { id: 'regression', label: 'Regression' },
    { id: 'clustering', label: 'Clustering' },
    { id: 'anomaly', label: 'Anomaly' },
    { id: 'volatility', label: 'Volatility' },
    { id: 'results', label: 'All Stocks' },
    { id: 'predict', label: 'Buy Signals' },
];

const RECOMMENDATION_CLASS = {
    'STRONG BUY': 'rec-strong-buy',
    'BUY': 'rec-buy',
    'HOLD': 'rec-hold',
    'WATCH': 'rec-hold',
    'AVOID': 'rec-avoid',
};

/* ----------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ----------------------------------------------------------------------- */
const fmt = (v, digits = 2) =>
    v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(digits);

const fmtInt = (v) =>
    v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toLocaleString();

const corrColor = (v) => {
    const t = Math.max(-1, Math.min(1, v ?? 0));
    if (t >= 0) {
        const a = t;
        return `rgba(16, 185, 129, ${0.15 + a * 0.75})`;
    }
    const a = -t;
    return `rgba(239, 68, 68, ${0.15 + a * 0.75})`;
};

/* ----------------------------------------------------------------------- */
/*  Component                                                                */
/* ----------------------------------------------------------------------- */
const MLStockPrediction = () => {
    const [health, setHealth] = useState({ checking: true });
    const [status, setStatus] = useState(null);
    const [statusError, setStatusError] = useState('');
    const [training, setTraining] = useState(false);
    const [trainError, setTrainError] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [tab, setTab] = useState('overview');

    // Cached sections (loaded on demand)
    const [eda, setEda] = useState(null);
    const [correlation, setCorrelation] = useState(null);
    const [classification, setClassification] = useState(null);
    const [regression, setRegression] = useState(null);
    const [clustering, setClustering] = useState(null);
    const [anomaly, setAnomaly] = useState(null);
    const [volatility, setVolatility] = useState(null);

    // Results table state
    const [results, setResults] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [resultsFilters, setResultsFilters] = useState({
        onlyAnomalies: false,
        clusterLabel: '',
        search: '',
        limit: 200,
    });

    // Next-day buy signals state
    const [recs, setRecs] = useState(null);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState('');
    const [recsFilters, setRecsFilters] = useState({
        recommendation: '',
        minProbability: '',
        search: '',
        limit: 50,
    });

    const fileInputRef = useRef(null);
    const trained = status?.models_trained;

    /* ------------------------------------------------------------------- */
    /*  Bootstrap                                                            */
    /* ------------------------------------------------------------------- */
    const refreshStatus = useCallback(async () => {
        try {
            const s = await mlPredictionAPI.status();
            setStatus(s);
            setStatusError('');
        } catch (e) {
            setStatusError(e.message);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const h = await mlPredictionAPI.health();
                setHealth({ checking: false, ok: true, ...h });
            } catch (e) {
                setHealth({ checking: false, ok: false, error: e.message });
            }
        })();
        refreshStatus();
    }, [refreshStatus]);

    /* ------------------------------------------------------------------- */
    /*  Training                                                             */
    /* ------------------------------------------------------------------- */
    const handleTrain = async (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;

        setSelectedFiles(picked);
        setTraining(true);
        setTrainError('');
        // Reset cached sections so next tab visit refetches them.
        setEda(null);
        setCorrelation(null);
        setClassification(null);
        setRegression(null);
        setClustering(null);
        setAnomaly(null);
        setVolatility(null);
        setResults(null);
        setRecs(null);
        setRecsError('');
        try {
            await mlPredictionAPI.train(picked);
            await refreshStatus();
            if (tab === 'predict') {
                await loadRecommendations(true);
            }
        } catch (err) {
            setTrainError(err.message);
        } finally {
            setTraining(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /* ------------------------------------------------------------------- */
    /*  Lazy-load tabs                                                       */
    /* ------------------------------------------------------------------- */
    useEffect(() => {
        if (!trained) return;
        const loaders = {
            eda: { has: !!eda, fn: () => mlPredictionAPI.eda().then(setEda) },
            correlation: { has: !!correlation, fn: () => mlPredictionAPI.correlation().then(setCorrelation) },
            classification: { has: !!classification, fn: () => mlPredictionAPI.classificationDetails().then(setClassification) },
            regression: { has: !!regression, fn: () => mlPredictionAPI.regressionDetails().then(setRegression) },
            clustering: { has: !!clustering, fn: () => mlPredictionAPI.clusteringDetails().then(setClustering) },
            anomaly: { has: !!anomaly, fn: () => mlPredictionAPI.anomalyDetails().then(setAnomaly) },
            volatility: { has: !!volatility, fn: () => mlPredictionAPI.volatilityDetails().then(setVolatility) },
        };
        const l = loaders[tab];
        if (l && !l.has) l.fn().catch((e) => console.error(`[${tab}]`, e.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, trained]);

    /* ------------------------------------------------------------------- */
    /*  Results table                                                        */
    /* ------------------------------------------------------------------- */
    const loadResults = useCallback(async () => {
        if (!trained) return;
        setResultsLoading(true);
        try {
            const data = await mlPredictionAPI.results({
                limit: resultsFilters.limit,
                onlyAnomalies: resultsFilters.onlyAnomalies,
                clusterLabel: resultsFilters.clusterLabel,
                search: resultsFilters.search,
            });
            setResults(data);
        } catch (e) {
            console.error('Load results failed:', e);
        } finally {
            setResultsLoading(false);
        }
    }, [trained, resultsFilters]);

    useEffect(() => {
        if (tab === 'results' && trained) loadResults();
    }, [tab, trained, loadResults]);

    /* ------------------------------------------------------------------- */
    /*  Buy signals (Notebook Cell 13)                                       */
    /* ------------------------------------------------------------------- */
    const loadRecommendations = useCallback(async (force = false) => {
        if (!force && !trained) return;
        setRecsLoading(true);
        setRecsError('');
        try {
            const data = await mlPredictionAPI.nextDay({
                limit: recsFilters.limit,
                recommendation: recsFilters.recommendation,
                minProbability:
                    recsFilters.minProbability === '' ||
                    recsFilters.minProbability === null
                        ? null
                        : Number(recsFilters.minProbability),
                search: recsFilters.search,
            });
            setRecs(data);
        } catch (err) {
            setRecsError(err.message);
        } finally {
            setRecsLoading(false);
        }
    }, [trained, recsFilters]);

    useEffect(() => {
        if (tab === 'predict' && trained) loadRecommendations();
    }, [tab, trained, loadRecommendations]);

    /* ------------------------------------------------------------------- */
    /*  Derived chart configs                                                */
    /* ------------------------------------------------------------------- */
    const metadata = status?.metadata;

    const changePctChart = useMemo(() => {
        if (!eda?.change_pct_sorted) return null;
        const data = eda.change_pct_sorted;
        return {
            labels: data.map((_, i) => i + 1),
            datasets: [
                {
                    label: 'Change %',
                    data,
                    backgroundColor: data.map((v) => (v >= 0 ? GREEN : RED)),
                    borderWidth: 0,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0,
                },
            ],
        };
    }, [eda]);

    const moveCategoryChart = useMemo(() => {
        if (!eda?.move_categories) return null;
        const colors = ['#c0392b', '#e74c3c', '#94a3b8', '#22c55e', '#15803d'];
        return {
            labels: eda.move_categories.labels,
            datasets: [
                {
                    label: 'Stocks',
                    data: eda.move_categories.counts,
                    backgroundColor: colors,
                },
            ],
        };
    }, [eda]);

    const volumeHistChart = useMemo(() => {
        if (!eda?.log_share_volume_hist) return null;
        const { bin_edges: e, counts } = eda.log_share_volume_hist;
        const labels = counts.map((_, i) => ((e[i] + e[i + 1]) / 2).toFixed(1));
        return {
            labels,
            datasets: [{ label: 'Stocks', data: counts, backgroundColor: '#3b82f6' }],
        };
    }, [eda]);

    const listingTypeChart = useMemo(() => {
        if (!eda?.listing_types) return null;
        return {
            labels: eda.listing_types.labels,
            datasets: [
                {
                    data: eda.listing_types.counts,
                    backgroundColor: PALETTE.slice(0, eda.listing_types.labels.length),
                    borderWidth: 0,
                },
            ],
        };
    }, [eda]);

    const top10Chart = useMemo(() => {
        if (!eda?.top10_share_volume) return null;
        const labels = eda.top10_share_volume.map((r) =>
            (r.company || '').slice(0, 22)
        );
        const data = eda.top10_share_volume.map((r) => r.share_volume);
        const colors = eda.top10_share_volume.map((r) => (r.is_gainer ? GREEN : RED));
        return {
            labels,
            datasets: [{ label: 'Share volume', data, backgroundColor: colors }],
        };
    }, [eda]);

    const priceRangeScatter = useMemo(() => {
        if (!eda?.price_vs_range_scatter) return null;
        const gainers = eda.price_vs_range_scatter.filter((p) => p.g === 1);
        const losers = eda.price_vs_range_scatter.filter((p) => p.g === 0);
        return {
            datasets: [
                {
                    label: 'Gainer',
                    data: gainers.map((p) => ({ x: p.x, y: p.y })),
                    backgroundColor: GREEN,
                    pointRadius: 3,
                },
                {
                    label: 'Loser',
                    data: losers.map((p) => ({ x: p.x, y: p.y })),
                    backgroundColor: RED,
                    pointRadius: 3,
                },
            ],
        };
    }, [eda]);

    const classificationAccuracyChart = useMemo(() => {
        if (!classification?.models) return null;
        const names = Object.keys(classification.models);
        return {
            labels: names,
            datasets: [
                {
                    label: 'Test Accuracy',
                    data: names.map((n) => +(classification.models[n].test_accuracy * 100).toFixed(2)),
                    backgroundColor: '#3b82f6',
                },
                {
                    label: 'CV Mean',
                    data: names.map((n) => +(classification.models[n].cv_mean * 100).toFixed(2)),
                    backgroundColor: '#8b5cf6',
                },
            ],
        };
    }, [classification]);

    const classifierFIChart = useMemo(() => {
        if (!classification?.feature_importance) return null;
        const entries = Object.entries(classification.feature_importance).sort(
            (a, b) => a[1] - b[1]
        );
        return {
            labels: entries.map(([k]) => k),
            datasets: [
                {
                    label: 'Importance',
                    data: entries.map(([, v]) => +v.toFixed(4)),
                    backgroundColor: '#6366f1',
                },
            ],
        };
    }, [classification]);

    const regressionR2Chart = useMemo(() => {
        if (!regression?.models) return null;
        const names = Object.keys(regression.models);
        return {
            labels: names,
            datasets: [
                {
                    label: 'R²',
                    data: names.map((n) => +regression.models[n].r2.toFixed(4)),
                    backgroundColor: names.map((n) =>
                        regression.models[n].r2 > 0.8
                            ? GREEN
                            : regression.models[n].r2 > 0.5
                                ? '#f59e0b'
                                : RED
                    ),
                },
            ],
        };
    }, [regression]);

    const regressionPvAChart = useMemo(() => {
        if (!regression?.predicted_vs_actual) return null;
        const pts = regression.predicted_vs_actual;
        const min = Math.min(...pts.map((p) => Math.min(p.actual, p.predicted)));
        const max = Math.max(...pts.map((p) => Math.max(p.actual, p.predicted)));
        return {
            datasets: [
                {
                    label: 'Predictions',
                    data: pts.map((p) => ({ x: p.actual, y: p.predicted })),
                    backgroundColor: '#3b82f6',
                    pointRadius: 3,
                },
                {
                    label: 'Perfect',
                    type: 'line',
                    data: [{ x: min, y: min }, { x: max, y: max }],
                    borderColor: RED,
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    showLine: true,
                },
            ],
        };
    }, [regression]);

    const residualsChart = useMemo(() => {
        if (!regression?.residuals_hist) return null;
        const { bin_edges: e, counts } = regression.residuals_hist;
        const labels = counts.map((_, i) => ((e[i] + e[i + 1]) / 2).toFixed(1));
        return {
            labels,
            datasets: [{ label: 'Residuals', data: counts, backgroundColor: '#8b5cf6' }],
        };
    }, [regression]);

    const elbowChart = useMemo(() => {
        if (!clustering?.elbow) return null;
        return {
            labels: clustering.elbow.k_range,
            datasets: [
                {
                    label: 'Inertia',
                    data: clustering.elbow.inertias,
                    borderColor: '#2563eb',
                    backgroundColor: '#bfdbfe',
                    borderWidth: 2,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 4,
                },
            ],
        };
    }, [clustering]);

    const pcaScatter = useMemo(() => {
        if (!clustering?.pca_scatter || !clustering?.labels) return null;
        const labels = clustering.labels;
        const groups = {};
        clustering.pca_scatter.forEach((p) => {
            const key = labels[p.c] || `C${p.c}`;
            (groups[key] = groups[key] || []).push({ x: p.x, y: p.y });
        });
        return {
            datasets: Object.entries(groups).map(([name, pts], i) => ({
                label: name,
                data: pts,
                backgroundColor: PALETTE[i % PALETTE.length],
                pointRadius: 3,
            })),
        };
    }, [clustering]);

    const clusterSizesChart = useMemo(() => {
        if (!clustering?.cluster_sizes) return null;
        const labels = Object.keys(clustering.cluster_sizes);
        return {
            labels,
            datasets: [
                {
                    data: labels.map((l) => clustering.cluster_sizes[l]),
                    backgroundColor: PALETTE.slice(0, labels.length),
                    borderWidth: 0,
                },
            ],
        };
    }, [clustering]);

    const anomalyScatter = useMemo(() => {
        if (!anomaly?.scatter) return null;
        const normal = anomaly.scatter.filter((p) => !p.anomaly);
        const outl = anomaly.scatter.filter((p) => p.anomaly);
        return {
            datasets: [
                {
                    label: 'Normal',
                    data: normal.map((p) => ({ x: p.x, y: p.y })),
                    backgroundColor: '#3b82f6',
                    pointRadius: 2.5,
                },
                {
                    label: 'Anomaly',
                    data: outl.map((p) => ({ x: p.x, y: p.y })),
                    backgroundColor: RED,
                    pointRadius: 5,
                    pointStyle: 'rectRot',
                },
            ],
        };
    }, [anomaly]);

    const volatilityFIChart = useMemo(() => {
        if (!volatility?.feature_importance) return null;
        const entries = Object.entries(volatility.feature_importance).sort(
            (a, b) => a[1] - b[1]
        );
        return {
            labels: entries.map(([k]) => k),
            datasets: [
                {
                    label: 'Importance',
                    data: entries.map(([, v]) => +v.toFixed(4)),
                    backgroundColor: '#8b5cf6',
                },
            ],
        };
    }, [volatility]);

    const volatilityPvAChart = useMemo(() => {
        if (!volatility?.predicted_vs_actual) return null;
        const pts = volatility.predicted_vs_actual;
        const min = Math.min(...pts.map((p) => Math.min(p.actual, p.predicted)));
        const max = Math.max(...pts.map((p) => Math.max(p.actual, p.predicted)));
        return {
            datasets: [
                {
                    label: 'Predictions',
                    data: pts.map((p) => ({ x: p.actual, y: p.predicted })),
                    backgroundColor: '#8b5cf6',
                    pointRadius: 3,
                },
                {
                    label: 'Perfect',
                    type: 'line',
                    data: [{ x: min, y: min }, { x: max, y: max }],
                    borderColor: RED,
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    showLine: true,
                },
            ],
        };
    }, [volatility]);

    /* ------------------------------------------------------------------- */
    /*  Render                                                               */
    /* ------------------------------------------------------------------- */
    const statusPill = health.checking
        ? { cls: 'checking', label: 'Checking ML service…' }
        : health.ok
            ? { cls: 'online', label: 'ML Service Online' }
            : { cls: 'offline', label: 'ML Service Offline' };

    return (
        <div className="mlp-container">
            {/* Header */}
            <div className="mlp-header">
                <div>
                    <h2>CSE Stock ML Predictor</h2>
                    <p className="mlp-subtitle">
                        Complete reproduction of <code>CSE_Stock_ML.ipynb</code> — EDA,
                        classification, regression, clustering, anomaly detection, and volatility.
                    </p>
                </div>
                <span className={`mlp-status-pill ${statusPill.cls}`}>
                    <span className="mlp-status-dot" />
                    {statusPill.label}
                </span>
            </div>

            <div className="mlp-content">
                {/* ML Service offline help */}
                {!health.checking && !health.ok && (
                    <div className="mlp-alert warning">
                        <div className="mlp-alert-title">Python ML service is not running</div>
                        <p style={{ margin: '0.35rem 0 0' }}>
                            Start it in a PowerShell window, then click <strong>Refresh status</strong>:
                        </p>
                        <pre style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', overflow: 'auto' }}>
{`cd Share-Prediction-ML-Model\\ml_service
.venv\\Scripts\\Activate.ps1
uvicorn app:app --host 0.0.0.0 --port 5000 --reload`}
                        </pre>
                    </div>
                )}

                {/* Training row (always visible) */}
                <div className="mlp-section mlp-train-section">
                    <div className="mlp-section-header">
                        <h3>1. Train / Re-train Models</h3>
                        <span className={`mlp-section-badge ${trained ? 'ok' : 'pending'}`}>
                            {trained ? 'Models trained' : 'Not trained yet'}
                        </span>
                    </div>
                    <p className="mlp-section-desc">
                        Upload one or more CSE daily summaries (<code>.csv</code> or <code>.tsv</code>).
                        Multiple files are merged into one training dataset (e.g. several trading days).
                        Each file should include Company, Symbol, Share Volume, Trade Volume,
                        Previous Close, Open, High, Low, Last Trade, Change Rs, and Change %.
                    </p>

                    <div className="mlp-upload-row">
                        <label className="mlp-btn mlp-btn-primary">
                            {training ? 'Training…' : 'Upload & Train'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.tsv,.txt"
                                multiple
                                onChange={handleTrain}
                                disabled={training || !health.ok}
                                hidden
                            />
                        </label>
                        <button
                            type="button"
                            className="mlp-btn mlp-btn-secondary"
                            onClick={refreshStatus}
                            disabled={!health.ok}
                        >
                            Refresh status
                        </button>
                        {trained && (
                            <button
                                type="button"
                                className="mlp-btn mlp-btn-secondary"
                                onClick={() => mlPredictionAPI.downloadResultsCsv().catch((e) => alert(e.message))}
                            >
                                Download results CSV
                            </button>
                        )}
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="mlp-file-list">
                            <span className="mlp-file-list-label">
                                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:
                            </span>
                            <ul>
                                {selectedFiles.map((f, i) => (
                                    <li key={`${f.name}-${i}`}>{f.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {trainError && <div className="mlp-alert error">{trainError}</div>}
                    {statusError && !trainError && <div className="mlp-alert error">{statusError}</div>}
                </div>

                {/* Tabs */}
                <div className="mlp-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            className={`mlp-tab ${tab === t.id ? 'active' : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Not-trained state for tabs that need it */}
                {!trained && tab !== 'predict' && tab !== 'overview' && (
                    <div className="mlp-alert info">
                        Train the models first (Section 1 above) to populate this tab.
                    </div>
                )}

                {/* ---------- OVERVIEW ---------- */}
                {tab === 'overview' && (
                    <div className="mlp-section">
                        <div className="mlp-section-header"><h3>Summary</h3></div>
                        {!trained ? (
                            <p className="mlp-section-desc">
                                After you train, this tab shows dataset counts and best-model picks.
                            </p>
                        ) : (
                            <>
                                <div className="mlp-stat-grid">
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Dataset rows</span>
                                        <span className="mlp-stat-value">{fmtInt(metadata?.dataset?.rows)}</span>
                                    </div>
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Gainers</span>
                                        <span className="mlp-stat-value">{fmtInt(metadata?.dataset?.gainers)}</span>
                                    </div>
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Losers / Flat</span>
                                        <span className="mlp-stat-value">{fmtInt(metadata?.dataset?.losers)}</span>
                                    </div>
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Anomalies</span>
                                        <span className="mlp-stat-value">{fmtInt(metadata?.dataset?.anomalies)}</span>
                                    </div>
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Best classifier</span>
                                        <span className="mlp-stat-value" style={{ fontSize: '0.95rem' }}>
                                            {metadata?.classification?.best_model || '—'}
                                        </span>
                                    </div>
                                    <div className="mlp-stat">
                                        <span className="mlp-stat-label">Best regressor</span>
                                        <span className="mlp-stat-value" style={{ fontSize: '0.95rem' }}>
                                            {metadata?.regression?.best_model || '—'}
                                        </span>
                                    </div>
                                    {metadata?.dataset?.files_merged > 1 && (
                                        <div className="mlp-stat">
                                            <span className="mlp-stat-label">Files merged</span>
                                            <span className="mlp-stat-value">
                                                {metadata.dataset.files_merged}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ---------- EDA ---------- */}
                {tab === 'eda' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header"><h3>Exploratory Data Analysis</h3></div>
                        {!eda ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile">
                                    <h4>Change % (all stocks, sorted)</h4>
                                    <div className="mlp-chart-canvas">
                                        {changePctChart && <Bar data={changePctChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false } } }} />}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Move Category Distribution</h4>
                                    <div className="mlp-chart-canvas">
                                        {moveCategoryChart && <Bar data={moveCategoryChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Share Volume distribution (log)</h4>
                                    <div className="mlp-chart-canvas">
                                        {volumeHistChart && <Bar data={volumeHistChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Listing Type</h4>
                                    <div className="mlp-chart-canvas">
                                        {listingTypeChart && <Pie data={listingTypeChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Top 10 by Share Volume</h4>
                                    <div className="mlp-chart-canvas">
                                        {top10Chart && <Bar data={top10Chart} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Price Range vs Last Trade</h4>
                                    <div className="mlp-chart-canvas">
                                        {priceRangeScatter && (
                                            <Scatter
                                                data={priceRangeScatter}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: {
                                                        x: { type: 'logarithmic', title: { display: true, text: 'Last Trade (LKR)' } },
                                                        y: { title: { display: true, text: 'High − Low' } },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- CORRELATION ---------- */}
                {tab === 'correlation' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header"><h3>Feature Correlation Matrix</h3></div>
                        {!correlation ? <p>Loading…</p> : (
                            <div className="mlp-heatmap-wrap">
                                <table className="mlp-heatmap">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            {correlation.columns.map((c) => (
                                                <th key={c}>{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {correlation.matrix.map((row, i) => (
                                            <tr key={correlation.columns[i]}>
                                                <th>{correlation.columns[i]}</th>
                                                {row.map((v, j) => (
                                                    <td
                                                        key={`${i}-${j}`}
                                                        style={{ background: corrColor(v) }}
                                                        title={`${correlation.columns[i]} vs ${correlation.columns[j]}: ${fmt(v, 3)}`}
                                                    >
                                                        {fmt(v, 2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- CLASSIFICATION ---------- */}
                {tab === 'classification' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>Classification — Gainer vs Loser</h3>
                            {classification?.best_model && (
                                <span className="mlp-section-badge ok">Best: {classification.best_model}</span>
                            )}
                        </div>
                        {!classification ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile">
                                    <h4>Model Accuracy</h4>
                                    <div className="mlp-chart-canvas">
                                        {classificationAccuracyChart && (
                                            <Bar
                                                data={classificationAccuracyChart}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } } },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Confusion Matrix ({classification.best_model})</h4>
                                    <table className="mlp-confusion">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Pred Loser</th>
                                                <th>Pred Gainer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <th>Actual Loser</th>
                                                <td className="cm-tn">{classification.confusion_matrix.matrix[0][0]}</td>
                                                <td className="cm-fp">{classification.confusion_matrix.matrix[0][1]}</td>
                                            </tr>
                                            <tr>
                                                <th>Actual Gainer</th>
                                                <td className="cm-fn">{classification.confusion_matrix.matrix[1][0]}</td>
                                                <td className="cm-tp">{classification.confusion_matrix.matrix[1][1]}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Feature Importance (Random Forest)</h4>
                                    <div className="mlp-chart-canvas">
                                        {classifierFIChart && (
                                            <Bar data={classifierFIChart} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- REGRESSION ---------- */}
                {tab === 'regression' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>Regression — Last Trade Price</h3>
                            {regression?.best_model && (
                                <span className="mlp-section-badge ok">Best: {regression.best_model}</span>
                            )}
                        </div>
                        {!regression ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile">
                                    <h4>R² by Model</h4>
                                    <div className="mlp-chart-canvas">
                                        {regressionR2Chart && (
                                            <Bar
                                                data={regressionR2Chart}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                    scales: { y: { beginAtZero: true, max: 1 } },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Predicted vs Actual</h4>
                                    <div className="mlp-chart-canvas">
                                        {regressionPvAChart && (
                                            <Scatter
                                                data={regressionPvAChart}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: {
                                                        x: { type: 'logarithmic', title: { display: true, text: 'Actual (LKR)' } },
                                                        y: { type: 'logarithmic', title: { display: true, text: 'Predicted (LKR)' } },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Residual Distribution (Actual − Predicted)</h4>
                                    <div className="mlp-chart-canvas">
                                        {residualsChart && (
                                            <Bar data={residualsChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Per-model metrics</h4>
                                    <table className="mlp-table">
                                        <thead><tr><th>Model</th><th>MAE</th><th>RMSE</th><th>R²</th></tr></thead>
                                        <tbody>
                                            {Object.entries(regression.models).map(([k, v]) => (
                                                <tr key={k}>
                                                    <td>{k}</td>
                                                    <td>{fmt(v.mae)}</td>
                                                    <td>{fmt(v.rmse)}</td>
                                                    <td>{fmt(v.r2, 4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- CLUSTERING ---------- */}
                {tab === 'clustering' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header"><h3>K-Means Clustering</h3></div>
                        {!clustering ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile">
                                    <h4>Elbow Method (k = {clustering.k})</h4>
                                    <div className="mlp-chart-canvas">
                                        {elbowChart && (
                                            <Line
                                                data={elbowChart}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>PCA Scatter ({(clustering.explained_variance[0] * 100).toFixed(1)}% + {(clustering.explained_variance[1] * 100).toFixed(1)}% var)</h4>
                                    <div className="mlp-chart-canvas">
                                        {pcaScatter && (
                                            <Scatter
                                                data={pcaScatter}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } },
                                                    scales: { x: { title: { display: true, text: 'PC1' } }, y: { title: { display: true, text: 'PC2' } } },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Cluster Sizes</h4>
                                    <div className="mlp-chart-canvas">
                                        {clusterSizesChart && (
                                            <Doughnut data={clusterSizesChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- ANOMALY ---------- */}
                {tab === 'anomaly' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>Anomaly Detection — Isolation Forest</h3>
                            {anomaly?.total_anomalies !== undefined && (
                                <span className="mlp-section-badge ok">
                                    {anomaly.total_anomalies} anomalies detected
                                </span>
                            )}
                        </div>
                        {!anomaly ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile mlp-chart-tile-wide">
                                    <h4>Volume vs Change % (anomalies highlighted)</h4>
                                    <div className="mlp-chart-canvas tall">
                                        {anomalyScatter && (
                                            <Scatter
                                                data={anomalyScatter}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: {
                                                        x: { title: { display: true, text: 'log(Share Volume)' } },
                                                        y: { title: { display: true, text: 'Change %' } },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile mlp-chart-tile-wide">
                                    <h4>Top 15 Anomalies (lowest isolation score = most anomalous)</h4>
                                    <table className="mlp-table">
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Symbol</th>
                                                <th>Last Trade</th>
                                                <th>Change %</th>
                                                <th>Volume</th>
                                                <th>Range</th>
                                                <th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {anomaly.top_15.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.company}</td>
                                                    <td>{r.symbol}</td>
                                                    <td>{fmt(r.last_trade)}</td>
                                                    <td style={{ color: r.change_pct >= 0 ? GREEN : RED, fontWeight: 600 }}>
                                                        {fmt(r.change_pct)}%
                                                    </td>
                                                    <td>{fmtInt(r.share_volume)}</td>
                                                    <td>{fmt(r.price_range)}</td>
                                                    <td>{fmt(r.anomaly_score, 3)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- VOLATILITY ---------- */}
                {tab === 'volatility' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>Volatility — Intraday Price Range</h3>
                            {volatility?.metrics && (
                                <span className="mlp-section-badge ok">
                                    R² {fmt(volatility.metrics.r2, 3)} · MAE {fmt(volatility.metrics.mae, 3)} LKR
                                </span>
                            )}
                        </div>
                        {!volatility ? <p>Loading…</p> : (
                            <div className="mlp-chart-grid">
                                <div className="mlp-chart-tile">
                                    <h4>Predicted vs Actual</h4>
                                    <div className="mlp-chart-canvas">
                                        {volatilityPvAChart && (
                                            <Scatter
                                                data={volatilityPvAChart}
                                                options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'bottom' } },
                                                    scales: {
                                                        x: { type: 'logarithmic', title: { display: true, text: 'Actual (LKR)' } },
                                                        y: { type: 'logarithmic', title: { display: true, text: 'Predicted (LKR)' } },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mlp-chart-tile">
                                    <h4>Feature Importance</h4>
                                    <div className="mlp-chart-canvas">
                                        {volatilityFIChart && (
                                            <Bar data={volatilityFIChart} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- ALL STOCKS ---------- */}
                {tab === 'results' && trained && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>All Stocks — Full Enriched Results</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="mlp-btn mlp-btn-secondary"
                                    onClick={loadResults}
                                    disabled={resultsLoading}
                                >
                                    {resultsLoading ? 'Loading…' : 'Apply'}
                                </button>
                                <button
                                    type="button"
                                    className="mlp-btn mlp-btn-primary"
                                    onClick={() => mlPredictionAPI.downloadResultsCsv().catch((e) => alert(e.message))}
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>

                        <div className="mlp-results-filters">
                            <input
                                placeholder="Search company or symbol…"
                                value={resultsFilters.search}
                                onChange={(e) => setResultsFilters((f) => ({ ...f, search: e.target.value }))}
                            />
                            <select
                                value={resultsFilters.clusterLabel}
                                onChange={(e) => setResultsFilters((f) => ({ ...f, clusterLabel: e.target.value }))}
                            >
                                <option value="">All clusters</option>
                                {clustering?.cluster_sizes &&
                                    Object.keys(clustering.cluster_sizes).map((l) => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                            </select>
                            <label className="mlp-checkbox">
                                <input
                                    type="checkbox"
                                    checked={resultsFilters.onlyAnomalies}
                                    onChange={(e) =>
                                        setResultsFilters((f) => ({ ...f, onlyAnomalies: e.target.checked }))
                                    }
                                />
                                Only anomalies
                            </label>
                            <select
                                value={resultsFilters.limit}
                                onChange={(e) => setResultsFilters((f) => ({ ...f, limit: parseInt(e.target.value, 10) }))}
                            >
                                <option value={50}>50 rows</option>
                                <option value={200}>200 rows</option>
                                <option value={500}>500 rows</option>
                                <option value={2000}>2000 rows</option>
                            </select>
                        </div>

                        {results && (
                            <>
                                <p className="mlp-hint" style={{ marginBottom: '0.6rem' }}>
                                    Showing {results.returned} of {results.total} rows
                                </p>
                                <div className="mlp-table-wrap">
                                    <table className="mlp-table">
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Symbol</th>
                                                <th>Last</th>
                                                <th>Predicted</th>
                                                <th>Change %</th>
                                                <th>Move</th>
                                                <th>Cluster</th>
                                                <th>Anomaly</th>
                                                <th>Volume</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.rows.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.company}</td>
                                                    <td>{r.symbol}</td>
                                                    <td>{fmt(r.last_trade)}</td>
                                                    <td>{fmt(r.predicted_last_trade)}</td>
                                                    <td style={{ color: (r.change_pct ?? 0) >= 0 ? GREEN : RED, fontWeight: 600 }}>
                                                        {fmt(r.change_pct)}%
                                                    </td>
                                                    <td>{r.move_category}</td>
                                                    <td>{r.cluster_label}</td>
                                                    <td>
                                                        {r.is_anomaly ? (
                                                            <span className="mlp-badge-warn">Anomaly</span>
                                                        ) : (
                                                            <span className="mlp-badge-ok">Normal</span>
                                                        )}
                                                    </td>
                                                    <td>{fmtInt(r.share_volume)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ---------- NEXT-DAY BUY SIGNALS ---------- */}
                {tab === 'predict' && (
                    <div className="mlp-section">
                        <div className="mlp-section-header">
                            <h3>Next-Day Buy Signals</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    className="mlp-btn mlp-btn-secondary"
                                    onClick={() => loadRecommendations(true)}
                                    disabled={!trained || recsLoading}
                                >
                                    {recsLoading ? 'Loading…' : 'Refresh'}
                                </button>
                                <button
                                    type="button"
                                    className="mlp-btn mlp-btn-primary"
                                    disabled={!trained || !recs || !recs.rows?.length}
                                    onClick={async () => {
                                        try {
                                            await mlPredictionAPI.downloadNextDayCsv();
                                        } catch (err) {
                                            setRecsError(err.message);
                                        }
                                    }}
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>
                        <p className="mlp-section-desc">
                            Per-company recommendations for the <strong>next trading session</strong>.
                            For each symbol the model uses today's OHLC/volume plus rolling history
                            (3 / 5 / 10 / 20-day returns, volatility, volume ratio, win rate, trend)
                            to predict the probability of an up-move on the next day.{' '}
                            <span className="rec-pill rec-strong-buy">STRONG BUY</span>{' '}
                            <span className="rec-pill rec-buy">BUY</span>{' '}
                            <span className="rec-pill rec-hold">WATCH</span>{' '}
                            <span className="rec-pill rec-avoid">AVOID</span>
                        </p>

                        {!trained && (
                            <div className="mlp-alert warn">
                                Train the models first (Section 1 above) to generate next-day signals.
                            </div>
                        )}

                        {recsError && <div className="mlp-alert error">{recsError}</div>}

                        {trained && recs?.model && (
                            <div className="mlp-stats-grid" style={{ marginBottom: 12 }}>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">Predicting after</span>
                                    <span className="mlp-stat-value" style={{ fontSize: '1.1rem' }}>
                                        {recs.predict_from_date || '—'}
                                    </span>
                                    <span className="mlp-stat-sub">
                                        {recs.model.unique_dates
                                            ? `${recs.model.unique_dates} trading days`
                                            : 'latest uploaded day'}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">Model</span>
                                    <span className="mlp-stat-value" style={{ fontSize: '1rem' }}>
                                        {recs.model.model_type || '—'}
                                    </span>
                                    <span className="mlp-stat-sub">
                                        {recs.model.train_rows ? `${fmtInt(recs.model.train_rows)} train rows` : ''}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">Test accuracy</span>
                                    <span className="mlp-stat-value">
                                        {recs.model.test_accuracy != null
                                            ? `${fmt(recs.model.test_accuracy * 100, 1)}%`
                                            : '—'}
                                    </span>
                                    <span className="mlp-stat-sub">
                                        baseline {recs.model.naive_accuracy != null
                                            ? `${fmt(recs.model.naive_accuracy * 100, 1)}%`
                                            : '—'}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">Date range</span>
                                    <span className="mlp-stat-value" style={{ fontSize: '0.95rem' }}>
                                        {recs.model.min_date || '—'}
                                    </span>
                                    <span className="mlp-stat-sub">→ {recs.model.max_date || '—'}</span>
                                </div>
                            </div>
                        )}

                        {trained && recs?.summary && (
                            <div className="mlp-stats-grid" style={{ marginBottom: 16 }}>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">STRONG BUY</span>
                                    <span className="mlp-stat-value" style={{ color: '#059669' }}>
                                        {fmtInt(recs.summary.strong_buy)}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">BUY</span>
                                    <span className="mlp-stat-value" style={{ color: '#10b981' }}>
                                        {fmtInt(recs.summary.buy)}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">WATCH</span>
                                    <span className="mlp-stat-value" style={{ color: '#f59e0b' }}>
                                        {fmtInt(recs.summary.watch)}
                                    </span>
                                </div>
                                <div className="mlp-stat-tile">
                                    <span className="mlp-stat-label">AVOID</span>
                                    <span className="mlp-stat-value" style={{ color: '#ef4444' }}>
                                        {fmtInt(recs.summary.avoid)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {trained && (
                            <div className="mlp-filters">
                                <div className="mlp-field">
                                    <label>Search</label>
                                    <input
                                        type="text"
                                        placeholder="Company or symbol"
                                        value={recsFilters.search}
                                        onChange={(e) =>
                                            setRecsFilters((f) => ({ ...f, search: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="mlp-field">
                                    <label>Recommendation</label>
                                    <select
                                        value={recsFilters.recommendation}
                                        onChange={(e) =>
                                            setRecsFilters((f) => ({ ...f, recommendation: e.target.value }))
                                        }
                                    >
                                        <option value="">All</option>
                                        <option value="STRONG BUY">STRONG BUY</option>
                                        <option value="BUY">BUY</option>
                                        <option value="WATCH">WATCH</option>
                                        <option value="AVOID">AVOID</option>
                                    </select>
                                </div>
                                <div className="mlp-field">
                                    <label>Min Probability</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        placeholder="0.0 – 1.0"
                                        value={recsFilters.minProbability}
                                        onChange={(e) =>
                                            setRecsFilters((f) => ({ ...f, minProbability: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="mlp-field">
                                    <label>Show top</label>
                                    <select
                                        value={recsFilters.limit}
                                        onChange={(e) =>
                                            setRecsFilters((f) => ({ ...f, limit: Number(e.target.value) }))
                                        }
                                    >
                                        <option value={20}>Top 20</option>
                                        <option value={50}>Top 50</option>
                                        <option value={100}>Top 100</option>
                                        <option value={0}>All</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="mlp-btn mlp-btn-primary"
                                    onClick={() => loadRecommendations(true)}
                                    disabled={recsLoading}
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        {trained && recs && (
                            <div className="mlp-table-wrap">
                                <div className="mlp-table-meta">
                                    Showing <strong>{recs.returned}</strong> of <strong>{recs.total}</strong> companies
                                    {recs.predict_from_date && (
                                        <>
                                            {' '}— based on data up to <strong>{recs.predict_from_date}</strong>
                                        </>
                                    )}
                                </div>
                                <table className="mlp-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Company</th>
                                            <th>Symbol</th>
                                            <th className="num">Last Trade</th>
                                            <th className="num">Change %</th>
                                            <th className="num">5-Day Avg</th>
                                            <th className="num">Win Rate</th>
                                            <th className="num">Vol Ratio</th>
                                            <th className="num">Trend</th>
                                            <th className="num">P(Up Tomorrow)</th>
                                            <th>Recommendation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recs.rows.map((r, i) => (
                                            <tr key={`${r.symbol}-${i}`}>
                                                <td>{i + 1}</td>
                                                <td>{r.company || '—'}</td>
                                                <td><code>{r.symbol || '—'}</code></td>
                                                <td className="num">{fmt(r.last_trade)}</td>
                                                <td
                                                    className={`num ${r.change_pct >= 0 ? 'positive' : 'negative'}`}
                                                >
                                                    {r.change_pct >= 0 ? '+' : ''}
                                                    {fmt(r.change_pct)}%
                                                </td>
                                                <td
                                                    className={`num ${(r.ret_5d_mean ?? 0) >= 0 ? 'positive' : 'negative'}`}
                                                >
                                                    {(r.ret_5d_mean ?? 0) >= 0 ? '+' : ''}
                                                    {fmt(r.ret_5d_mean)}%
                                                </td>
                                                <td className="num">
                                                    {fmt((r.win_rate_10d ?? 0) * 100, 0)}%
                                                </td>
                                                <td className="num">
                                                    {fmt(r.volume_ratio_5d, 2)}×
                                                </td>
                                                <td
                                                    className={`num ${(r.trend_slope_10d ?? 0) >= 0 ? 'positive' : 'negative'}`}
                                                >
                                                    {(r.trend_slope_10d ?? 0) >= 0 ? '▲' : '▼'}{' '}
                                                    {fmt(r.trend_slope_10d, 3)}
                                                </td>
                                                <td className="num">
                                                    <div className="buy-score-cell">
                                                        <div className="buy-score-bar">
                                                            <div
                                                                className="buy-score-fill"
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(0, (r.prob_up_next_day || 0) * 100))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span>
                                                            {fmt((r.prob_up_next_day ?? 0) * 100, 1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`rec-pill ${
                                                            RECOMMENDATION_CLASS[r.next_day_recommendation] || ''
                                                        }`}
                                                    >
                                                        {r.next_day_recommendation}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {recs.rows.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={11}
                                                    style={{ textAlign: 'center', padding: 24 }}
                                                >
                                                    No companies match the current filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MLStockPrediction;
