import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './Styles/PerformanceReport.css';
import { portfolioAPI, transactionEntryAPI, equityAPI } from '../../services/api';
import { downloadPerformanceReportPdf } from '../../utils/performanceReportPdfExport';
import { PERIODS, parseHistory, buildPerformanceReportModel } from '../../utils/portfolioPerformanceReportModel';

const n0 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const n2 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const sgn = (v) => (v > 0 ? '+' : '');
const cls = (v) => (v > 0 ? 'fr-pos' : v < 0 ? 'fr-neg' : '');

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

  const {
    holdingRows,
    sectorRows,
    metricsByPeriod,
    m,
    totCost,
    totMkt,
    totGL,
    totRet,
    sectorContribTotal
  } = useMemo(
    () =>
      buildPerformanceReportModel({
        positions,
        historyPoints,
        sectorBySymbol,
        period,
        referenceDate: new Date()
      }),
    [positions, historyPoints, sectorBySymbol, period]
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
      <header className="fr-page-rail fr-no-print">
        <p className="fr-eyebrow">Accounting · Reporting</p>
        <h1>Performance Report</h1>
        <p className="fr-page-blurb">Period returns, holdings, and sector contribution.</p>
      </header>
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
        <div className="fr-section-heading fr-section-heading--spaced">
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
        <div className="fr-section-heading fr-section-heading--spaced">
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
                <td colSpan="4" className="fr-holdings-empty">
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
        <div className="fr-section-heading fr-section-heading--spaced">
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
        <div className="fr-section-heading fr-section-heading--spaced">
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

        <div className="fr-rule-thick fr-rule-thick--foot" />
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
