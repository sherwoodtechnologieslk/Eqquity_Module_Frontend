import React, { useState } from 'react';
import './Styles/PerformanceReport.css';

const PERIODS = ['MTD', 'QTD', 'YTD', '1Y'];

const METRICS = {
  MTD:  { totalReturn: 2.14,  sharpe: 1.42, alpha: 0.9,  beta: 0.88, maxDrawdown: -1.2, volatility: 8.3,  portfolioValue: 197684649, benchmarkReturn: 1.5  },
  QTD:  { totalReturn: 5.82,  sharpe: 1.38, alpha: 2.1,  beta: 0.91, maxDrawdown: -3.4, volatility: 9.1,  portfolioValue: 197684649, benchmarkReturn: 4.1  },
  YTD:  { totalReturn: 12.4,  sharpe: 1.51, alpha: 3.3,  beta: 0.92, maxDrawdown: -6.3, volatility: 10.2, portfolioValue: 197684649, benchmarkReturn: 9.1  },
  '1Y': { totalReturn: 18.7,  sharpe: 1.63, alpha: 5.2,  beta: 0.89, maxDrawdown: -8.1, volatility: 11.4, portfolioValue: 197684649, benchmarkReturn: 13.5 },
};

const HOLDINGS = [
  { symbol: 'JKH.N',  name: 'John Keells Holdings PLC',   qty: 12500, costPrice: 165.20, currentPrice: 195.50, sector: 'Diversified'   },
  { symbol: 'SIRA.N', name: 'Siyapatha Finance PLC',      qty: 45000, costPrice:  18.40, currentPrice:  22.10, sector: 'Finance'       },
  { symbol: 'COMB.N', name: 'Commercial Bank PLC',        qty: 20000, costPrice:  85.00, currentPrice:  92.30, sector: 'Banking'       },
  { symbol: 'DIAL.N', name: 'Dialog Axiata PLC',          qty: 80000, costPrice:  13.50, currentPrice:  14.20, sector: 'Telecom'       },
  { symbol: 'TJL.N',  name: 'Tess Agro PLC',              qty: 30000, costPrice:  40.60, currentPrice:  36.80, sector: 'Consumer Goods'},
  { symbol: 'AGAL.N', name: 'Agalawatte Plantations PLC', qty: 15000, costPrice:  28.90, currentPrice:  33.40, sector: 'Plantation'   },
  { symbol: 'AEL.N',  name: 'Access Engineering PLC',     qty: 25000, costPrice:  22.10, currentPrice:  24.75, sector: 'Construction' },
  { symbol: 'EXPO.N', name: 'Expolanka Holdings PLC',     qty: 10000, costPrice: 198.00, currentPrice: 212.50, sector: 'Logistics'    },
];

const SECTOR_DATA = [
  { sector: 'Banking',        weight: 22.4, periodReturn: 8.6  },
  { sector: 'Finance',        weight: 18.1, periodReturn: 20.1 },
  { sector: 'Diversified',    weight: 14.2, periodReturn: 18.4 },
  { sector: 'Telecom',        weight: 12.8, periodReturn: 5.2  },
  { sector: 'Plantation',     weight: 9.3,  periodReturn: 15.6 },
  { sector: 'Consumer Goods', weight: 8.7,  periodReturn: -9.4 },
  { sector: 'Construction',   weight: 7.4,  periodReturn: 12.0 },
  { sector: 'Logistics',      weight: 7.1,  periodReturn: 7.3  },
];

const n0 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const n2 = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const sgn = (v) => (v > 0 ? '+' : '');
const cls = (v) => (v > 0 ? 'fr-pos' : v < 0 ? 'fr-neg' : '');

const PerformanceReport = () => {
  const [period, setPeriod] = useState('YTD');
  const m = METRICS[period];

  const rows = HOLDINGS.map((h) => {
    const cost    = h.qty * h.costPrice;
    const mkt     = h.qty * h.currentPrice;
    const gl      = mkt - cost;
    const ret     = ((h.currentPrice - h.costPrice) / h.costPrice) * 100;
    const weight  = (mkt / m.portfolioValue) * 100;
    return { ...h, cost, mkt, gl, ret, weight };
  }).sort((a, b) => b.mkt - a.mkt);

  const totCost = rows.reduce((s, r) => s + r.cost, 0);
  const totMkt  = rows.reduce((s, r) => s + r.mkt, 0);
  const totGL   = totMkt - totCost;
  const totRet  = (totGL / totCost) * 100;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fr-page">
      <div className="fr-doc">

        {/* ── Letterhead ── */}
        <div className="fr-letterhead">
          <div className="fr-letterhead-left">
            <div className="fr-company">SHERWOOD TECHNOLOGIES (PVT) LTD</div>
            <div className="fr-company-sub">Equity Portfolio Management System</div>
          </div>
          <div className="fr-letterhead-right">
            <div className="fr-report-type">PORTFOLIO PERFORMANCE REPORT</div>
            <div className="fr-report-meta">Prepared on {today}</div>
            <div className="fr-report-meta">Classification: Internal Use Only</div>
          </div>
        </div>

        <div className="fr-rule-thick" />

        {/* ── Period selector ── */}
        <div className="fr-period-bar">
          <span className="fr-period-label">Reporting Period:</span>
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`fr-period-btn ${period === p ? 'fr-period-btn--active' : ''}`}
              onClick={() => setPeriod(p)}
            >{p}</button>
          ))}
          <span className="fr-period-note">* Sample data for illustration purposes</span>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — Performance Summary
        ════════════════════════════════════════════════════════ */}
        <div className="fr-section-heading">1. Performance Summary</div>
        <div className="fr-rule" />

        <table className="fr-summary-table">
          <tbody>
            <tr>
              <td className="fr-st-label">Total Portfolio Return ({period})</td>
              <td className={`fr-st-value ${cls(m.totalReturn)}`}>{sgn(m.totalReturn)}{m.totalReturn}%</td>
              <td className="fr-st-label">CSE All-Share Benchmark ({period})</td>
              <td className={`fr-st-value ${cls(m.benchmarkReturn)}`}>{sgn(m.benchmarkReturn)}{m.benchmarkReturn}%</td>
            </tr>
            <tr>
              <td className="fr-st-label">Alpha (Outperformance)</td>
              <td className={`fr-st-value ${cls(m.totalReturn - m.benchmarkReturn)}`}>
                {sgn(m.totalReturn - m.benchmarkReturn)}{(m.totalReturn - m.benchmarkReturn).toFixed(2)}%
              </td>
              <td className="fr-st-label">Beta</td>
              <td className="fr-st-value">{m.beta}</td>
            </tr>
            <tr>
              <td className="fr-st-label">Sharpe Ratio</td>
              <td className="fr-st-value fr-pos">{m.sharpe}</td>
              <td className="fr-st-label">Annualised Volatility</td>
              <td className="fr-st-value">{m.volatility}%</td>
            </tr>
            <tr>
              <td className="fr-st-label">Maximum Drawdown</td>
              <td className={`fr-st-value ${cls(m.maxDrawdown)}`}>{m.maxDrawdown}%</td>
              <td className="fr-st-label">Total Portfolio Value</td>
              <td className="fr-st-value">LKR {n0(m.portfolioValue)}</td>
            </tr>
          </tbody>
        </table>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — Holdings Performance
        ════════════════════════════════════════════════════════ */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>2. Holdings Performance</div>
        <div className="fr-rule" />

        <table className="fr-holdings-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Security Name</th>
              <th>Sector</th>
              <th className="fr-th-r">Quantity</th>
              <th className="fr-th-r">Cost Price<br />(LKR)</th>
              <th className="fr-th-r">Market Price<br />(LKR)</th>
              <th className="fr-th-r">Cost Value<br />(LKR)</th>
              <th className="fr-th-r">Market Value<br />(LKR)</th>
              <th className="fr-th-r">Unrealised G/L<br />(LKR)</th>
              <th className="fr-th-r">Return<br />(%)</th>
              <th className="fr-th-r">Weight<br />(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td className="fr-td-symbol">{r.symbol}</td>
                <td className="fr-td-name">{r.name}</td>
                <td className="fr-td-sector">{r.sector}</td>
                <td className="fr-td-r">{n0(r.qty)}</td>
                <td className="fr-td-r">{n2(r.costPrice)}</td>
                <td className="fr-td-r">{n2(r.currentPrice)}</td>
                <td className="fr-td-r">{n0(r.cost)}</td>
                <td className="fr-td-r">{n0(r.mkt)}</td>
                <td className={`fr-td-r ${cls(r.gl)}`}>{sgn(r.gl)}{n0(r.gl)}</td>
                <td className={`fr-td-r ${cls(r.ret)}`}>{sgn(r.ret)}{n2(r.ret)}%</td>
                <td className="fr-td-r">{n2(r.weight)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="fr-total-row">
              <td colSpan="6"><strong>Total</strong></td>
              <td className="fr-td-r"><strong>{n0(totCost)}</strong></td>
              <td className="fr-td-r"><strong>{n0(totMkt)}</strong></td>
              <td className={`fr-td-r ${cls(totGL)}`}><strong>{sgn(totGL)}{n0(totGL)}</strong></td>
              <td className={`fr-td-r ${cls(totRet)}`}><strong>{sgn(totRet)}{n2(totRet)}%</strong></td>
              <td className="fr-td-r"><strong>100.00%</strong></td>
            </tr>
          </tfoot>
        </table>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — Sector Allocation & Performance
        ════════════════════════════════════════════════════════ */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>3. Sector Allocation &amp; Performance</div>
        <div className="fr-rule" />

        <table className="fr-sector-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th className="fr-th-r">Portfolio Weight (%)</th>
              <th className="fr-th-r">Period Return ({period}) (%)</th>
              <th className="fr-th-r">Contribution to Return (%)</th>
            </tr>
          </thead>
          <tbody>
            {SECTOR_DATA.map((s) => {
              const contribution = (s.weight / 100) * s.periodReturn;
              return (
                <tr key={s.sector}>
                  <td>{s.sector}</td>
                  <td className="fr-td-r">{n2(s.weight)}%</td>
                  <td className={`fr-td-r ${cls(s.periodReturn)}`}>{sgn(s.periodReturn)}{n2(s.periodReturn)}%</td>
                  <td className={`fr-td-r ${cls(contribution)}`}>{sgn(contribution)}{n2(contribution)}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="fr-total-row">
              <td><strong>Total</strong></td>
              <td className="fr-td-r"><strong>100.00%</strong></td>
              <td className="fr-td-r">—</td>
              <td className={`fr-td-r ${cls(SECTOR_DATA.reduce((s, x) => s + (x.weight / 100) * x.periodReturn, 0))}`}>
                <strong>
                  {(() => {
                    const v = SECTOR_DATA.reduce((s, x) => s + (x.weight / 100) * x.periodReturn, 0);
                    return `${sgn(v)}${n2(v)}%`;
                  })()}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — Risk Metrics
        ════════════════════════════════════════════════════════ */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>4. Risk &amp; Return Metrics</div>
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
              <td className={`fr-td-r ${cls(m.totalReturn)}`}>{sgn(m.totalReturn)}{m.totalReturn}%</td>
              <td className={`fr-td-r ${cls(m.benchmarkReturn)}`}>{sgn(m.benchmarkReturn)}{m.benchmarkReturn}%</td>
              <td className={`fr-td-r ${cls(m.totalReturn - m.benchmarkReturn)}`}>
                {sgn(m.totalReturn - m.benchmarkReturn)}{n2(m.totalReturn - m.benchmarkReturn)}%
              </td>
              <td className="fr-td-interp">Portfolio {m.totalReturn > m.benchmarkReturn ? 'outperformed' : 'underperformed'} benchmark</td>
            </tr>
            <tr>
              <td>Annualised Volatility</td>
              <td className="fr-td-r">{m.volatility}%</td>
              <td className="fr-td-r">12.1%</td>
              <td className={`fr-td-r ${cls(12.1 - m.volatility)}`}>{n2(m.volatility - 12.1)}%</td>
              <td className="fr-td-interp">{m.volatility < 12.1 ? 'Lower risk than benchmark' : 'Higher risk than benchmark'}</td>
            </tr>
            <tr>
              <td>Sharpe Ratio</td>
              <td className="fr-td-r fr-pos">{m.sharpe}</td>
              <td className="fr-td-r">0.98</td>
              <td className={`fr-td-r ${cls(m.sharpe - 0.98)}`}>{sgn(m.sharpe - 0.98)}{n2(m.sharpe - 0.98)}</td>
              <td className="fr-td-interp">{m.sharpe > 1 ? 'Adequate risk-adjusted return' : 'Risk-adjusted return below threshold'}</td>
            </tr>
            <tr>
              <td>Maximum Drawdown</td>
              <td className={`fr-td-r ${cls(m.maxDrawdown)}`}>{m.maxDrawdown}%</td>
              <td className="fr-td-r fr-neg">-10.2%</td>
              <td className={`fr-td-r ${cls(-10.2 - m.maxDrawdown)}`}>{n2(m.maxDrawdown - (-10.2))}%</td>
              <td className="fr-td-interp">{Math.abs(m.maxDrawdown) < 10.2 ? 'Lower downside than benchmark' : 'Higher drawdown than benchmark'}</td>
            </tr>
            <tr>
              <td>Alpha</td>
              <td className={`fr-td-r ${cls(m.alpha)}`}>{sgn(m.alpha)}{m.alpha}%</td>
              <td className="fr-td-r">0.00%</td>
              <td className={`fr-td-r ${cls(m.alpha)}`}>{sgn(m.alpha)}{m.alpha}%</td>
              <td className="fr-td-interp">{m.alpha > 0 ? 'Positive excess return over benchmark' : 'Negative excess return'}</td>
            </tr>
            <tr>
              <td>Beta</td>
              <td className="fr-td-r">{m.beta}</td>
              <td className="fr-td-r">1.00</td>
              <td className={`fr-td-r ${cls(1 - m.beta)}`}>{n2(m.beta - 1.00)}</td>
              <td className="fr-td-interp">{m.beta < 1 ? 'Portfolio is less volatile than market' : 'Portfolio is more volatile than market'}</td>
            </tr>
          </tbody>
        </table>

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — Benchmark Comparison
        ════════════════════════════════════════════════════════ */}
        <div className="fr-section-heading" style={{ marginTop: '2rem' }}>5. Benchmark Comparison — CSE All-Share Index</div>
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
              const pm = METRICS[p];
              const excess = pm.totalReturn - pm.benchmarkReturn;
              return (
                <tr key={p} className={p === period ? 'fr-row-active' : ''}>
                  <td>{p === period ? <strong>{p} ◀ current</strong> : p}</td>
                  <td className={`fr-td-r ${cls(pm.totalReturn)}`}>{sgn(pm.totalReturn)}{pm.totalReturn}%</td>
                  <td className={`fr-td-r ${cls(pm.benchmarkReturn)}`}>{sgn(pm.benchmarkReturn)}{pm.benchmarkReturn}%</td>
                  <td className={`fr-td-r ${cls(excess)}`}>{sgn(excess)}{n2(excess)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Footer ── */}
        <div className="fr-rule-thick" style={{ marginTop: '2.5rem' }} />
        <div className="fr-footer">
          <span>SHERWOOD TECHNOLOGIES (PVT) LTD &nbsp;·&nbsp; Equity Portfolio Management System &nbsp;·&nbsp; Confidential</span>
          <span>Generated on {today}</span>
        </div>

      </div>
    </div>
  );
};

export default PerformanceReport;
