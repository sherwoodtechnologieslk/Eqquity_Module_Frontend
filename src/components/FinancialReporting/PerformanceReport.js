import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './Styles/PerformanceReport.css';
import { portfolioAPI, transactionEntryAPI, equityAPI } from '../../services/api';
import { downloadPerformanceReportPdf } from '../../utils/performanceReportPdfExport';

const PERIODS = ['MTD', 'QTD', 'YTD', '1Y'];

const n0 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const n2 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const sgn = (v) => (v > 0 ? '+' : '');
const cls = (v) => (v > 0 ? 'fr-pos' : v < 0 ? 'fr-neg' : '');

function periodStartDate(period) {
  const now = new Date();
  if (period === 'MTD') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'QTD') {
    const q = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), q, 1);
  }
  if (period === 'YTD') return new Date(now.getFullYear(), 0, 1);
  if (period === '1Y') {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return new Date(now.getFullYear(), 0, 1);
}

function parseHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => ({
      t: new Date(d.date).getTime(),
      date: new Date(d.date),
      value: parseFloat(d.value) || 0,
    }))
    .filter((p) => Number.isFinite(p.value) && p.value >= 0)
    .sort((a, b) => a.t - b.t);
}

function valueOnOrBefore(points, targetMs) {
  let best = null;
  for (const p of points) {
    if (p.t <= targetMs && p.value > 0) best = p.value;
  }
  return best;
}

function valueOnOrAfter(points, targetMs) {
  for (const p of points) {
    if (p.t >= targetMs && p.value > 0) return p.value;
  }
  return null;
}

function sliceHistory(points, fromMs, toMs) {
  return points.filter((p) => p.t >= fromMs && p.t <= toMs);
}

function periodReturnPercent(points, period) {
  if (!points.length) return null;
  const endVal = points[points.length - 1].value;
  if (endVal <= 0) return null;
  const startMs = periodStartDate(period).getTime();
  let startVal = valueOnOrBefore(points, startMs);
  if (startVal == null) startVal = valueOnOrAfter(points, startMs);
  if (startVal == null || startVal <= 0) return null;
  return ((endVal / startVal) - 1) * 100;
}

function maxDrawdownFromSlice(slice) {
  if (!slice.length) return null;
  let peak = slice[0].value;
  let maxDd = 0;
  for (const p of slice) {
    if (p.value > peak) peak = p.value;
    if (peak > 0) {
      const dd = ((p.value - peak) / peak) * 100;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

function volatilityAndSharpe(slice) {
  const rets = [];
  for (let i = 1; i < slice.length; i++) {
    const a = slice[i - 1].value;
    const b = slice[i].value;
    if (a > 0) rets.push((b - a) / a);
  }
  if (rets.length < 2) return { volatility: null, sharpe: null };
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1 || 1);
  const std = Math.sqrt(variance);
  const daySpan = Math.max(1, (slice[slice.length - 1].t - slice[0].t) / 86400000);
  const periodsPerYear = Math.max(12, Math.min(252, (rets.length / daySpan) * 365));
  const volPct = std * Math.sqrt(periodsPerYear) * 100;
  const sharpe = std > 1e-12 ? (mean / std) * Math.sqrt(periodsPerYear) : null;
  return { volatility: volPct, sharpe };
}

const dash = '—';

const PerformanceReport = () => {
  const [period, setPeriod] = useState('YTD');
  const [reportEntityLine, setReportEntityLine] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [sectorBySymbol, setSectorBySymbol] = useState(() => new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const docRef = useRef(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Portfolio Performance Report';
    return () => {
      document.title = prev;
    };
  }, []);

  const loadPortfolios = useCallback(async () => {
    setPortfoliosLoading(true);
    try {
      const data = await portfolioAPI.getActivePortfolios();
      const list = Array.isArray(data) ? data : [];
      setPortfolios(list);
      setSelectedPortfolioId((prev) => {
        if (prev) return prev;
        return list[0] ? String(list[0].id) : '';
      });
    } catch (e) {
      console.error(e);
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setPositions([]);
      setHistoryPoints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [pos, histRes, eqList] = await Promise.all([
          transactionEntryAPI.getPortfolioPositions(selectedPortfolioId),
          portfolioAPI.getPortfolioValueHistory(selectedPortfolioId, '1Y'),
          equityAPI.getActiveEquities().catch(() => []),
        ]);
        if (cancelled) return;
        const hist = parseHistory(histRes?.data || histRes || []);
        setPositions(Array.isArray(pos) ? pos : []);
        setHistoryPoints(hist);
        const map = new Map();
        (Array.isArray(eqList) ? eqList : []).forEach((e) => {
          const s = (e.symbol || '').trim().toUpperCase();
          if (s) map.set(s, (e.sector || '').trim() || 'Unclassified');
        });
        setSectorBySymbol(map);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError('Could not load portfolio performance data.');
          setPositions([]);
          setHistoryPoints([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPortfolioId]);

  const holdingRows = useMemo(() => {
    const totalMkt = positions.reduce(
      (s, p) => s + (parseFloat(p.marketPrice) || 0) * (parseFloat(p.quantity) || 0),
      0
    );
    return positions
      .map((p) => {
        const qty = parseFloat(p.quantity) || 0;
        const costPrice = parseFloat(p.costPrice) || 0;
        const currentPrice = parseFloat(p.marketPrice) || 0;
        const symKey = (p.symbol || '').trim().toUpperCase();
        const sector = sectorBySymbol.get(symKey) || 'Unclassified';
        const cost = qty * costPrice;
        const mkt = qty * currentPrice;
        const gl = mkt - cost;
        const ret = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;
        const weight = totalMkt > 0 ? (mkt / totalMkt) * 100 : 0;
        return {
          symbol: p.symbol,
          name: p.companyName || dash,
          sector,
          qty,
          costPrice,
          currentPrice,
          cost,
          mkt,
          gl,
          ret,
          weight,
        };
      })
      .sort((a, b) => b.mkt - a.mkt);
  }, [positions, sectorBySymbol]);

  const sectorRows = useMemo(() => {
    const bySec = new Map();
    for (const r of holdingRows) {
      if (!bySec.has(r.sector)) bySec.set(r.sector, { mkt: 0, weightedRet: 0 });
      const g = bySec.get(r.sector);
      g.mkt += r.mkt;
      g.weightedRet += r.mkt * r.ret;
    }
    const totalMkt = holdingRows.reduce((s, r) => s + r.mkt, 0);
    return [...bySec.entries()]
      .map(([sector, { mkt, weightedRet }]) => ({
        sector,
        weight: totalMkt > 0 ? (mkt / totalMkt) * 100 : 0,
        periodReturn: mkt > 0 ? weightedRet / mkt : 0,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [holdingRows]);

  const metricsByPeriod = useMemo(() => {
    const out = {};
    PERIODS.forEach((p) => {
      out[p] = {
        totalReturn: periodReturnPercent(historyPoints, p),
        benchmarkReturn: null,
      };
    });
    return out;
  }, [historyPoints]);

  const m = useMemo(() => {
    const nowMs = Date.now();
    const startMs = periodStartDate(period).getTime();
    const slice = sliceHistory(historyPoints, startMs, nowMs);
    const useSlice = slice.length >= 2 ? slice : historyPoints;
    const totalReturn = periodReturnPercent(historyPoints, period);
    const portfolioValue = holdingRows.reduce((s, r) => s + r.mkt, 0);
    const maxDrawdown = maxDrawdownFromSlice(useSlice.length ? useSlice : historyPoints);
    const { volatility, sharpe } = volatilityAndSharpe(useSlice.length >= 3 ? useSlice : historyPoints);
    return {
      totalReturn,
      benchmarkReturn: null,
      sharpe,
      beta: null,
      alpha: null,
      maxDrawdown,
      volatility,
      portfolioValue,
    };
  }, [period, historyPoints, holdingRows]);

  const totCost = holdingRows.reduce((s, r) => s + r.cost, 0);
  const totMkt = holdingRows.reduce((s, r) => s + r.mkt, 0);
  const totGL = totMkt - totCost;
  const totRet = totCost > 0 ? (totGL / totCost) * 100 : null;

  const sectorContribTotal = sectorRows.reduce(
    (s, x) => s + (x.weight / 100) * x.periodReturn,
    0
  );

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmtPct = (v) =>
    v == null || Number.isNaN(v) ? dash : `${sgn(v)}${n2(v)}%`;

  const entityDisplay = reportEntityLine.trim();

  const savePdfWaiting =
    portfoliosLoading || loading || !selectedPortfolioId;
  const savePdfDisabled = pdfBusy || savePdfWaiting;

  const handleSavePdf = useCallback(async () => {
    if (
      !docRef.current ||
      pdfBusy ||
      portfoliosLoading ||
      loading ||
      !selectedPortfolioId
    ) {
      return;
    }
    setPdfBusy(true);
    try {
      await downloadPerformanceReportPdf(docRef.current);
    } catch (e) {
      console.error(e);
      window.alert(
        e && e.message
          ? `Could not generate PDF: ${e.message}`
          : 'Could not generate PDF. Try again or use a different browser.'
      );
    } finally {
      setPdfBusy(false);
    }
  }, [pdfBusy, portfoliosLoading, loading, selectedPortfolioId]);

  return (
    <div className="fr-page performance-report-page">
      <div className="fr-screen-toolbar fr-no-print">
        <div className="fr-screen-toolbar-inner">
          <div className="fr-report-controls fr-report-controls--toolbar">
            <div className="fr-report-controls-row">
              <label htmlFor="fr-performance-portfolio">Portfolio</label>
              <select
                id="fr-performance-portfolio"
                className="fr-report-portfolio-select"
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                disabled={portfoliosLoading || portfolios.length === 0}
              >
                {portfolios.length === 0 ? (
                  <option value="">No portfolios</option>
                ) : (
                  portfolios.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.portfolioName || p.portfolioId || `Portfolio ${p.id}`}
                    </option>
                  ))
                )}
              </select>
              <span className="fr-report-controls-sep" aria-hidden="true" />
              <span className="fr-period-label">Reporting Period:</span>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`fr-period-btn ${period === p ? 'fr-period-btn--active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
              <span className="fr-report-controls-sep" aria-hidden="true" />
              <button
                type="button"
                className="fr-report-pdf-btn"
                onClick={handleSavePdf}
                disabled={savePdfDisabled}
                title={
                  pdfBusy
                    ? 'Generating PDF…'
                    : savePdfWaiting
                      ? 'Available after portfolios and performance data have finished loading.'
                      : 'Downloads a PDF without browser headers (no URL or print timestamp)'
                }
              >
                {pdfBusy ? 'Preparing PDF…' : 'Save as PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fr-doc" ref={docRef}>
        <div className="fr-letterhead">
          <div className="fr-letterhead-left">
            <input
              id="fr-report-entity-line"
              type="text"
              className="fr-letterhead-entity-input"
              value={reportEntityLine}
              onChange={(e) => setReportEntityLine(e.target.value)}
              placeholder="Company or individual name"
              maxLength={200}
              autoComplete="organization"
              aria-label="Company or individual name"
            />
            <div className="fr-letterhead-entity-print" aria-hidden="true">
              {entityDisplay || '\u00a0'}
            </div>
          </div>
          <div className="fr-letterhead-right">
            <div className="fr-report-type">PORTFOLIO PERFORMANCE REPORT</div>
            <div className="fr-report-meta">Prepared on {today}</div>
            <div className="fr-report-meta">Classification: Internal Use Only</div>
          </div>
        </div>

        {error ? <div className="fr-report-error fr-no-print">{error}</div> : null}
        {loading ? <div className="fr-report-loading fr-no-print">Loading performance data…</div> : null}

        {!loading && selectedPortfolioId && !error && positions.length === 0 && !portfoliosLoading ? (
          <div className="fr-report-empty fr-no-print">No open positions in this portfolio.</div>
        ) : null}

        {/* ── Section 1 ── */}
        <div className="fr-section-heading">1. Performance Summary</div>
        <div className="fr-rule" />

        <table className="fr-summary-table">
          <tbody>
            <tr>
              <td className="fr-st-label">Total Portfolio Return ({period})</td>
              <td className={`fr-st-value ${cls(m.totalReturn ?? 0)}`}>{fmtPct(m.totalReturn)}</td>
              <td className="fr-st-label">CSE All-Share Benchmark ({period})</td>
              <td className="fr-st-value">{dash}</td>
            </tr>
            <tr>
              <td className="fr-st-label">Alpha (Outperformance)</td>
              <td className="fr-st-value">{dash}</td>
              <td className="fr-st-label">Beta</td>
              <td className="fr-st-value">{dash}</td>
            </tr>
            <tr>
              <td className="fr-st-label">Sharpe Ratio</td>
              <td className="fr-st-value">{m.sharpe != null ? n2(m.sharpe) : dash}</td>
              <td className="fr-st-label">Annualised Volatility (est.)</td>
              <td className="fr-st-value">{m.volatility != null ? `${n2(m.volatility)}%` : dash}</td>
            </tr>
            <tr>
              <td className="fr-st-label">Maximum Drawdown ({period})</td>
              <td className={`fr-st-value ${cls(m.maxDrawdown ?? 0)}`}>
                {m.maxDrawdown != null ? `${n2(m.maxDrawdown)}%` : dash}
              </td>
              <td className="fr-st-label">Total Portfolio Value</td>
              <td className="fr-st-value">LKR {n0(m.portfolioValue)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Section 2 ── */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>
          2. Holdings Performance
        </div>
        <div className="fr-rule" />

        <div className="fr-table-scroll fr-table-scroll--holdings" aria-label="Holdings performance table">
        <table className="fr-holdings-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Security Name</th>
              <th className="fr-th-r">Quantity</th>
              <th className="fr-th-r">
                Cost Price
                <br />
                (LKR)
              </th>
              <th className="fr-th-r">
                Market Price
                <br />
                (LKR)
              </th>
              <th className="fr-th-r">
                Cost Value
                <br />
                (LKR)
              </th>
              <th className="fr-th-r">
                Market Value
                <br />
                (LKR)
              </th>
              <th className="fr-th-r">
                Unrealised G/L
                <br />
                (LKR)
              </th>
              <th className="fr-th-r">
                Return
                <br />
                (%)
              </th>
              <th className="fr-th-r">
                Weight
                <br />
                (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {holdingRows.length === 0 ? (
              <tr className="fr-holdings-empty-row">
                <td colSpan="10" className="fr-holdings-empty">
                  {selectedPortfolioId ? 'No holdings to display.' : 'Select a portfolio.'}
                </td>
              </tr>
            ) : (
              holdingRows.map((r) => (
                <tr key={r.symbol}>
                  <td className="fr-td-symbol">{r.symbol}</td>
                  <td className="fr-td-name">{r.name}</td>
                  <td className="fr-td-r">{n0(r.qty)}</td>
                  <td className="fr-td-r">{n2(r.costPrice)}</td>
                  <td className="fr-td-r">{n2(r.currentPrice)}</td>
                  <td className="fr-td-r">{n0(r.cost)}</td>
                  <td className="fr-td-r">{n0(r.mkt)}</td>
                  <td className={`fr-td-r ${cls(r.gl)}`}>
                    {sgn(r.gl)}
                    {n0(r.gl)}
                  </td>
                  <td className={`fr-td-r ${cls(r.ret)}`}>
                    {sgn(r.ret)}
                    {n2(r.ret)}%
                  </td>
                  <td className="fr-td-r">{n2(r.weight)}%</td>
                </tr>
              ))
            )}
          </tbody>
          {holdingRows.length > 0 ? (
            <tfoot>
              <tr className="fr-total-row">
                <td colSpan="5">
                  <strong>Total</strong>
                </td>
                <td className="fr-td-r">
                  <strong>{n0(totCost)}</strong>
                </td>
                <td className="fr-td-r">
                  <strong>{n0(totMkt)}</strong>
                </td>
                <td className={`fr-td-r ${cls(totGL)}`}>
                  <strong>
                    {sgn(totGL)}
                    {n0(totGL)}
                  </strong>
                </td>
                <td className={`fr-td-r ${cls(totRet ?? 0)}`}>
                  <strong>{totRet != null ? `${sgn(totRet)}${n2(totRet)}%` : dash}</strong>
                </td>
                <td className="fr-td-r">
                  <strong>100.00%</strong>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
        </div>

        {/* ── Section 3 ── */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>
          3. Sector Allocation &amp; Performance
        </div>
        <div className="fr-rule" />

        <table className="fr-sector-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th className="fr-th-r">Portfolio Weight (%)</th>
              <th className="fr-th-r">Holdings return vs cost (%)</th>
              <th className="fr-th-r">Contribution (% pts)</th>
            </tr>
          </thead>
          <tbody>
            {sectorRows.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>
                  No sector breakdown.
                </td>
              </tr>
            ) : (
              sectorRows.map((s) => {
                const contribution = (s.weight / 100) * s.periodReturn;
                return (
                  <tr key={s.sector}>
                    <td>{s.sector}</td>
                    <td className="fr-td-r">{n2(s.weight)}%</td>
                    <td className={`fr-td-r ${cls(s.periodReturn)}`}>
                      {sgn(s.periodReturn)}
                      {n2(s.periodReturn)}%
                    </td>
                    <td className={`fr-td-r ${cls(contribution)}`}>
                      {sgn(contribution)}
                      {n2(contribution)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {sectorRows.length > 0 ? (
            <tfoot>
              <tr className="fr-total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td className="fr-td-r">
                  <strong>100.00%</strong>
                </td>
                <td className="fr-td-r">{dash}</td>
                <td className={`fr-td-r ${cls(sectorContribTotal)}`}>
                  <strong>
                    {sgn(sectorContribTotal)}
                    {n2(sectorContribTotal)}%
                  </strong>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        {/* ── Section 4 ── */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>
          4. Risk &amp; Return Metrics
        </div>
        <div className="fr-rule" />

        <table className="fr-risk-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="fr-th-r">Portfolio</th>
              <th className="fr-th-r">Benchmark</th>
              <th className="fr-th-r">Difference</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Return ({period})</td>
              <td className={`fr-td-r ${cls(m.totalReturn ?? 0)}`}>{fmtPct(m.totalReturn)}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">From reconstructed portfolio value history</td>
            </tr>
            <tr>
              <td>Annualised Volatility (est.)</td>
              <td className="fr-td-r">{m.volatility != null ? `${n2(m.volatility)}%` : dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">Based on sampled history points</td>
            </tr>
            <tr>
              <td>Sharpe Ratio (est.)</td>
              <td className="fr-td-r">{m.sharpe != null ? n2(m.sharpe) : dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">Assumes zero risk-free rate</td>
            </tr>
            <tr>
              <td>Maximum Drawdown ({period})</td>
              <td className={`fr-td-r ${cls(m.maxDrawdown ?? 0)}`}>
                {m.maxDrawdown != null ? `${n2(m.maxDrawdown)}%` : dash}
              </td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">Largest peak-to-trough decline in period</td>
            </tr>
            <tr>
              <td>Alpha</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">Requires benchmark time series</td>
            </tr>
            <tr>
              <td>Beta</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-r">{dash}</td>
              <td className="fr-td-interp">Requires benchmark time series</td>
            </tr>
          </tbody>
        </table>

        {/* ── Section 5 ── */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>
          5. Benchmark Comparison — CSE All-Share Index
        </div>
        <div className="fr-rule" />

        <table className="fr-bench-table">
          <thead>
            <tr>
              <th>Period</th>
              <th className="fr-th-r">Portfolio Return (%)</th>
              <th className="fr-th-r">Benchmark Return (%)</th>
              <th className="fr-th-r">Excess Return (%)</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => {
              const pm = metricsByPeriod[p];
              const tr = pm.totalReturn;
              return (
                <tr key={p} className={p === period ? 'fr-row-active' : ''}>
                  <td>
                    {p === period ? <strong>{p} ◀ current</strong> : p}
                  </td>
                  <td className={`fr-td-r ${cls(tr ?? 0)}`}>{fmtPct(tr)}</td>
                  <td className="fr-td-r">{dash}</td>
                  <td className="fr-td-r">{dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="fr-rule-thick" style={{ marginTop: '2.5rem' }} />
        <div className="fr-footer">
          <span>
            {entityDisplay ? (
              <>
                {entityDisplay}
                &nbsp;·&nbsp;
              </>
            ) : null}
            Equity Portfolio Management System &nbsp;·&nbsp; Confidential
          </span>
          <span>Generated on {today}</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
