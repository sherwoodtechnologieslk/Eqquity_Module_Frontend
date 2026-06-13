import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './PortfolioOverview.css';
import { portfolioAPI } from '../../../services/api';
import {
  analyzePortfolio,
  formatLkrCompact,
  formatLkrFull,
  formatPct
} from '../../../utils/portfolioAnalytics';

const GAUGE_CIRCUMFERENCE = 326.726; // 2πr, r = 52

const PortfolioOverview = () => {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState({});
  const [portfolios, setPortfolios] = useState([]);
  const [selectedKey, setSelectedKey] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async (key) => {
    try {
      setIsLoading(true);
      setError('');
      const resp = await portfolioAPI.getPortfolioOverview(key && key !== 'all' ? key : null);
      if (resp && resp.success && resp.data) {
        setHoldings(Array.isArray(resp.data.holdings) ? resp.data.holdings : []);
        setSummary(resp.data.summary || {});
      } else {
        setHoldings([]);
        setSummary({});
      }
    } catch (e) {
      console.error('Error loading portfolio overview:', e);
      setError(e.message || 'Failed to load portfolio data');
      setHoldings([]);
      setSummary({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await portfolioAPI.getActivePortfolios();
        setPortfolios(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Error loading portfolios:', e);
        setPortfolios([]);
      }
    })();
  }, []);

  useEffect(() => {
    fetchOverview(selectedKey);
  }, [selectedKey, fetchOverview]);

  const a = useMemo(() => analyzePortfolio(holdings, summary), [holdings, summary]);

  const selectedName =
    selectedKey === 'all'
      ? 'All Portfolios'
      : (portfolios.find(
          (p) => String(p.portfolioId || p.id) === String(selectedKey)
        ) || {}).portfolioName || 'Portfolio';

  const gaugeOffset = GAUGE_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, a.score)) / 100);
  const up = a.valuation.unrealized >= 0;

  const STATUS_CAPTION = {
    healthy: 'Well balanced — low risk',
    moderate: 'Some risks worth watching',
    'at-risk': 'Needs attention'
  };

  return (
    <div className="pov">
      {/* Header */}
      <div className="pov-header">
        <div className="pov-header__titles">
          <h1 className="pov-title">Portfolio Overview</h1>
          <p className="pov-subtitle">
            Full health, risk &amp; performance analysis of your holdings
          </p>
        </div>
        <div className="pov-header__controls">
          <select
            className="pov-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="all">All Portfolios</option>
            {portfolios.map((p) => (
              <option key={p.id || p.portfolioId} value={p.portfolioId || p.id}>
                {p.portfolioName || p.name || `Portfolio ${p.id}`}
              </option>
            ))}
          </select>
          <button
            className="pov-refresh"
            onClick={() => fetchOverview(selectedKey)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="pov-state">
          <div className="pov-spinner" />
          <p>Analyzing portfolio…</p>
        </div>
      ) : error ? (
        <div className="pov-state pov-state--error">
          <p>{error}</p>
          <button className="pov-refresh" onClick={() => fetchOverview(selectedKey)}>
            Retry
          </button>
        </div>
      ) : !a.hasData ? (
        <div className="pov-state pov-state--empty">
          <p>No holdings found for {selectedName}.</p>
          <span>Once you have priced positions, the full analysis will appear here.</span>
        </div>
      ) : (
        <>
          {/* Alerts & insights (top priority) */}
          <div className="pov-card pov-card--alerts">
            <div className="pov-card__title">Alerts &amp; insights</div>
            <ul className="pov-alerts pov-alerts--grid">
              {a.alerts.map((al, i) => (
                <li key={i} className={`pov-alert pov-alert--${al.severity}`}>
                  <span className="pov-alert__icon" aria-hidden="true">
                    {al.severity === 'high' ? '!' : al.severity === 'medium' ? '•' : '✓'}
                  </span>
                  <div className="pov-alert__body">
                    <div className="pov-alert__title">{al.title}</div>
                    <div className="pov-alert__text">{al.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Hero: health score + breakdown + valuation */}
          <div className="pov-hero">
            <div className={`pov-hero__score pov-hero__score--${a.statusKey}`}>
              <div className="pov-hero__eyebrow">Health score</div>
              <div className="pov-gauge">
                <svg viewBox="0 0 120 120" className="pov-gauge__svg">
                  <defs>
                    <linearGradient id="pov-grad-healthy" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="pov-grad-moderate" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="pov-grad-at-risk" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  <circle className="pov-gauge__bg" cx="60" cy="60" r="52" />
                  <circle
                    className="pov-gauge__bar"
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={`url(#pov-grad-${a.statusKey})`}
                    style={{
                      strokeDasharray: GAUGE_CIRCUMFERENCE,
                      strokeDashoffset: gaugeOffset
                    }}
                  />
                </svg>
                <div className="pov-gauge__center">
                  <div className="pov-gauge__score">{a.score}</div>
                  <div className="pov-gauge__outof">out of 100</div>
                </div>
              </div>
              <div className="pov-hero__status">
                <span className={`pov-pill pov-pill--${a.statusKey}`}>
                  <span className="pov-pill__dot" />
                  {a.status}
                </span>
                <span className="pov-hero__caption">
                  {STATUS_CAPTION[a.statusKey] || 'Overall health'}
                </span>
                <span className="pov-hero__portfolio">{selectedName}</span>
              </div>
            </div>

            <div className="pov-hero__breakdown">
              <div className="pov-hero__breakdown-title">Score breakdown</div>
              {a.scoreBreakdown.map((b) => (
                <div key={b.key} className="pov-bar-row">
                  <div className="pov-bar-row__head">
                    <span className="pov-bar-row__label">
                      <span className={`pov-bar-row__dot pov-bar-row__dot--${b.key}`} />
                      {b.label}
                    </span>
                    <span className="pov-bar-row__pts">
                      <strong>{b.points}</strong> / {b.max}
                    </span>
                  </div>
                  <div className="pov-bar">
                    <div
                      className={`pov-bar__fill pov-bar__fill--${b.key}`}
                      style={{ width: `${Math.round(b.value * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pov-hero__valuation">
              <div className="pov-hero__breakdown-title">Valuation</div>
              <div className="pov-val-row">
                <span>Market value</span>
                <strong>{formatLkrCompact(a.valuation.marketValue)}</strong>
              </div>
              <div className="pov-val-row">
                <span>Invested (cost)</span>
                <strong>{formatLkrCompact(a.valuation.cost)}</strong>
              </div>
              <div className="pov-val-row">
                <span>Unrealized P&amp;L</span>
                <strong className={up ? 'pov-pos' : 'pov-neg'}>
                  {formatLkrCompact(a.valuation.unrealized)} ({formatPct(a.valuation.unrealizedPct)})
                </strong>
              </div>
              <div className="pov-val-row">
                <span>Realized P&amp;L</span>
                <strong className={a.valuation.realized >= 0 ? 'pov-pos' : 'pov-neg'}>
                  {formatLkrCompact(a.valuation.realized)}
                </strong>
              </div>
              <div className="pov-val-row pov-val-row--total">
                <span>Total P&amp;L</span>
                <strong className={a.valuation.totalPnL >= 0 ? 'pov-pos' : 'pov-neg'}>
                  {formatLkrCompact(a.valuation.totalPnL)}
                </strong>
              </div>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="pov-kpis">
            <div className="pov-kpi">
              <div className="pov-kpi__label">Positions</div>
              <div className="pov-kpi__value">{a.positions.count}</div>
              <div className="pov-kpi__sub">{a.positions.sectors} sectors</div>
            </div>
            <div className="pov-kpi">
              <div className="pov-kpi__label">Diversification</div>
              <div className="pov-kpi__value">{a.diversification.label}</div>
              <div className="pov-kpi__sub">
                ≈ {a.diversification.effectiveN.toFixed(1)} effective holdings
              </div>
            </div>
            <div className="pov-kpi">
              <div className="pov-kpi__label">Concentration</div>
              <div className="pov-kpi__value">{a.concentration.label}</div>
              <div className="pov-kpi__sub">
                Top {a.concentration.topSymbol} · {a.concentration.topWeightPct.toFixed(1)}%
              </div>
            </div>
            <div className="pov-kpi">
              <div className="pov-kpi__label">Win rate</div>
              <div className="pov-kpi__value">{a.stats.winRatePct.toFixed(0)}%</div>
              <div className="pov-kpi__sub">
                {a.stats.winners} up · {a.stats.losers} down
              </div>
            </div>
            <div className="pov-kpi">
              <div className="pov-kpi__label">Top sector</div>
              <div className="pov-kpi__value pov-kpi__value--sm">{a.topSector.name}</div>
              <div className="pov-kpi__sub">{a.topSector.pct.toFixed(1)}% of value</div>
            </div>
            <div className="pov-kpi">
              <div className="pov-kpi__label">Best / Worst</div>
              <div className="pov-kpi__value pov-kpi__value--sm">
                <span className="pov-pos">{a.best ? a.best.symbol : '—'}</span>
                {' / '}
                <span className="pov-neg">{a.worst ? a.worst.symbol : '—'}</span>
              </div>
              <div className="pov-kpi__sub">
                {a.best ? formatPct(a.best.returnPct) : '—'} /{' '}
                {a.worst ? formatPct(a.worst.returnPct) : '—'}
              </div>
            </div>
          </div>

          {/* Allocation + concentration */}
          <div className="pov-cols">
            <div className="pov-card">
              <div className="pov-card__title">Sector allocation</div>
              <div className="pov-alloc">
                {a.sectors.map((s) => (
                  <div key={s.name} className="pov-alloc-row">
                    <div className="pov-alloc-row__head">
                      <span className="pov-alloc-row__name">
                        <span
                          className="pov-dot"
                          style={{ background: s.color }}
                        />
                        {s.name}
                      </span>
                      <span className="pov-alloc-row__pct">{s.pct.toFixed(1)}%</span>
                    </div>
                    <div className="pov-bar">
                      <div
                        className="pov-bar__fill"
                        style={{ width: `${Math.min(100, s.pct)}%`, background: s.color }}
                      />
                    </div>
                    <div className="pov-alloc-row__meta">
                      <span>{formatLkrCompact(s.value)}</span>
                      <span className={s.pnl >= 0 ? 'pov-pos' : 'pov-neg'}>
                        {formatLkrCompact(s.pnl)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pov-card">
              <div className="pov-card__title">Top holdings by weight</div>
              <div className="pov-alloc">
                {a.topHoldings.map((h) => (
                  <div key={h.symbol} className="pov-alloc-row">
                    <div className="pov-alloc-row__head">
                      <span className="pov-alloc-row__name">{h.symbol}</span>
                      <span className="pov-alloc-row__pct">{h.weightPct.toFixed(1)}%</span>
                    </div>
                    <div className="pov-bar">
                      <div
                        className="pov-bar__fill pov-bar__fill--weight"
                        style={{ width: `${Math.min(100, h.weightPct)}%` }}
                      />
                    </div>
                    <div className="pov-alloc-row__meta">
                      <span>{formatLkrCompact(h.marketValue)}</span>
                      <span className={h.pnl >= 0 ? 'pov-pos' : 'pov-neg'}>
                        {formatPct(h.returnPct)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Movers */}
          <div className="pov-card">
            <div className="pov-card__title">Movers</div>
            <div className="pov-movers">
              <div className="pov-movers__col">
                <div className="pov-movers__head pov-pos">Top gainers</div>
                {a.movers.gainers.length === 0 ? (
                  <div className="pov-movers__empty">No gainers</div>
                ) : (
                  a.movers.gainers.map((h) => (
                    <div key={h.symbol} className="pov-mover">
                      <span className="pov-mover__sym">{h.symbol}</span>
                      <span className="pov-mover__pct pov-pos">{formatPct(h.returnPct)}</span>
                      <span className="pov-mover__val">{formatLkrCompact(h.pnl)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="pov-movers__col">
                <div className="pov-movers__head pov-neg">Top losers</div>
                {a.movers.losers.length === 0 ? (
                  <div className="pov-movers__empty">No losers</div>
                ) : (
                  a.movers.losers.map((h) => (
                    <div key={h.symbol} className="pov-mover">
                      <span className="pov-mover__sym">{h.symbol}</span>
                      <span className="pov-mover__pct pov-neg">{formatPct(h.returnPct)}</span>
                      <span className="pov-mover__val">{formatLkrCompact(h.pnl)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Full holdings table */}
          <div className="pov-card">
            <div className="pov-card__title">
              All holdings
              <span className="pov-card__count">{a.holdings.length}</span>
            </div>
            <div className="pov-table-wrap">
              <table className="pov-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Sector</th>
                    <th className="pov-num">Qty</th>
                    <th className="pov-num">Avg</th>
                    <th className="pov-num">Price</th>
                    <th className="pov-num">Market value</th>
                    <th className="pov-num">Weight</th>
                    <th className="pov-num">Unrealized P&amp;L</th>
                    <th className="pov-num">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {a.holdings.map((h) => (
                    <tr key={h.symbol}>
                      <td className="pov-table__sym">{h.symbol}</td>
                      <td className="pov-table__name">{h.name}</td>
                      <td>{h.sector}</td>
                      <td className="pov-num">{h.quantity.toLocaleString('en-US')}</td>
                      <td className="pov-num">{h.avgPrice.toFixed(2)}</td>
                      <td className="pov-num">{h.currentPrice.toFixed(2)}</td>
                      <td className="pov-num">{formatLkrFull(h.marketValue)}</td>
                      <td className="pov-num">{h.weightPct.toFixed(1)}%</td>
                      <td className={`pov-num ${h.pnl >= 0 ? 'pov-pos' : 'pov-neg'}`}>
                        {formatLkrCompact(h.pnl)}
                      </td>
                      <td className={`pov-num ${h.pnl >= 0 ? 'pov-pos' : 'pov-neg'}`}>
                        {formatPct(h.returnPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioOverview;
