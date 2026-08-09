import React, { useMemo, useState } from 'react';
import './Styles/ClientPortfolio.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

const formatPercent = (value) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const ALLOC_COLORS = ['#0f4c3a', '#14624a', '#c4a574', '#d6c7a8'];

const ClientPortfolio = () => {
  const [clientPortfolios] = useState([
    {
      id: 1,
      name: 'Weerathungage Arani Sehansa',
      code: 'CLT-000128',
      segment: 'Individual',
      riskProfile: 'Moderate Growth',
      rm: 'Sherwood Wealth Team',
      since: '2022-07-15',
      totalMarketValue: 502,
      totalCost: 468,
      totalUnrealized: 34,
      totalReturnPct: 7.26
    },
    {
      id: 2,
      name: 'ePortfolio – Corporate Treasury',
      code: 'CLT-000257',
      segment: 'Corporate',
      riskProfile: 'Balanced Income',
      rm: 'Sherwood Wealth Team',
      since: '2021-03-10',
      totalMarketValue: 890,
      totalCost: 845,
      totalUnrealized: 45,
      totalReturnPct: 5.33
    },
    {
      id: 3,
      name: 'Family Trust – Growth',
      code: 'CLT-000389',
      segment: 'Trust / Foundation',
      riskProfile: 'Aggressive Growth',
      rm: 'Sherwood Wealth Team',
      since: '2020-11-01',
      totalMarketValue: 325,
      totalCost: 280,
      totalUnrealized: 45,
      totalReturnPct: 16.07
    },
    {
      id: 4,
      name: 'Nimal Perera – Retirement',
      code: 'CLT-000441',
      segment: 'Individual',
      riskProfile: 'Conservative',
      rm: 'Private Client Desk',
      since: '2019-05-22',
      totalMarketValue: 178,
      totalCost: 172,
      totalUnrealized: 6,
      totalReturnPct: 3.49
    },
    {
      id: 5,
      name: 'Lanka Logistics PLC – Surplus',
      code: 'CLT-000512',
      segment: 'Corporate',
      riskProfile: 'Balanced Income',
      rm: 'Corporate Coverage',
      since: '2023-01-18',
      totalMarketValue: 1240,
      totalCost: 1185,
      totalUnrealized: 55,
      totalReturnPct: 4.64
    },
    {
      id: 6,
      name: 'Dias Education Endowment',
      code: 'CLT-000603',
      segment: 'Trust / Foundation',
      riskProfile: 'Moderate Growth',
      rm: 'Sherwood Wealth Team',
      since: '2018-09-04',
      totalMarketValue: 412,
      totalCost: 390,
      totalUnrealized: 22,
      totalReturnPct: 5.64
    },
    {
      id: 7,
      name: 'S. Fernando – High Net Worth',
      code: 'CLT-000718',
      segment: 'Private Wealth',
      riskProfile: 'Aggressive Growth',
      rm: 'Private Client Desk',
      since: '2024-02-11',
      totalMarketValue: 965,
      totalCost: 880,
      totalUnrealized: 85,
      totalReturnPct: 9.66
    },
    {
      id: 8,
      name: 'Harbor Insurance – Reserves',
      code: 'CLT-000804',
      segment: 'Institutional',
      riskProfile: 'Very Conservative',
      rm: 'Institutional Desk',
      since: '2020-06-30',
      totalMarketValue: 2105,
      totalCost: 2080,
      totalUnrealized: 25,
      totalReturnPct: 1.20
    }
  ]);

  const [selectedClientId, setSelectedClientId] = useState(
    clientPortfolios[0]?.id || null
  );

  const holdingsByClient = {
    1: [
      {
        id: 1,
        instrument: 'CAL Equity Growth Fund',
        instrumentCode: 'CAL-EQGF',
        type: 'Unit Trust',
        sector: 'Equity',
        units: 185000.23,
        avgCost: 145.75,
        lastPrice: 162.4,
        marketValue: 30058000,
        costValue: 26963700,
        unrealizedPnL: 3094300,
        unrealizedReturn: 11.48
      },
      {
        id: 2,
        instrument: 'CAL Fixed Income Opportunities Fund',
        instrumentCode: 'CAL-FIOF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 520000.0,
        avgCost: 10.0,
        lastPrice: 10.82,
        marketValue: 5626400,
        costValue: 5200000,
        unrealizedPnL: 426400,
        unrealizedReturn: 8.2
      },
      {
        id: 3,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 750000.0,
        avgCost: 10.0,
        lastPrice: 10.38,
        marketValue: 7785000,
        costValue: 7500000,
        unrealizedPnL: 285000,
        unrealizedReturn: 3.8
      },
      {
        id: 4,
        instrument: 'CAL Balanced Fund',
        instrumentCode: 'CAL-BAL',
        type: 'Unit Trust',
        sector: 'Balanced',
        units: 120000.0,
        avgCost: 52.1,
        lastPrice: 56.8,
        marketValue: 6816000,
        costValue: 6252000,
        unrealizedPnL: 564000,
        unrealizedReturn: 9.0
      }
    ],
    2: [
      {
        id: 1,
        instrument: 'CAL Corporate Bond Fund',
        instrumentCode: 'CAL-CBF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 1200000.0,
        avgCost: 10.0,
        lastPrice: 10.65,
        marketValue: 12780000,
        costValue: 12000000,
        unrealizedPnL: 780000,
        unrealizedReturn: 6.5
      },
      {
        id: 2,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 1500000.0,
        avgCost: 10.0,
        lastPrice: 10.35,
        marketValue: 15525000,
        costValue: 15000000,
        unrealizedPnL: 525000,
        unrealizedReturn: 3.5
      }
    ],
    3: [
      {
        id: 1,
        instrument: 'CAL Equity Growth Fund',
        instrumentCode: 'CAL-EQGF',
        type: 'Unit Trust',
        sector: 'Equity',
        units: 95000.0,
        avgCost: 138.5,
        lastPrice: 167.2,
        marketValue: 15884000,
        costValue: 13157500,
        unrealizedPnL: 2726500,
        unrealizedReturn: 20.72
      },
      {
        id: 2,
        instrument: 'CAL Balanced Fund',
        instrumentCode: 'CAL-BAL',
        type: 'Unit Trust',
        sector: 'Balanced',
        units: 80000.0,
        avgCost: 50.25,
        lastPrice: 57.3,
        marketValue: 4584000,
        costValue: 4020000,
        unrealizedPnL: 564000,
        unrealizedReturn: 14.03
      }
    ],
    4: [
      {
        id: 1,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 9800000.0,
        avgCost: 10.0,
        lastPrice: 10.28,
        marketValue: 100744000,
        costValue: 98000000,
        unrealizedPnL: 2744000,
        unrealizedReturn: 2.8
      },
      {
        id: 2,
        instrument: 'CAL Fixed Income Opportunities Fund',
        instrumentCode: 'CAL-FIOF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 7200000.0,
        avgCost: 10.0,
        lastPrice: 10.55,
        marketValue: 75960000,
        costValue: 72000000,
        unrealizedPnL: 3960000,
        unrealizedReturn: 5.5
      }
    ],
    5: [
      {
        id: 1,
        instrument: 'CAL Corporate Bond Fund',
        instrumentCode: 'CAL-CBF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 45000000.0,
        avgCost: 10.0,
        lastPrice: 10.48,
        marketValue: 471600000,
        costValue: 450000000,
        unrealizedPnL: 21600000,
        unrealizedReturn: 4.8
      },
      {
        id: 2,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 38000000.0,
        avgCost: 10.0,
        lastPrice: 10.32,
        marketValue: 392160000,
        costValue: 380000000,
        unrealizedPnL: 12160000,
        unrealizedReturn: 3.2
      },
      {
        id: 3,
        instrument: 'CAL Balanced Fund',
        instrumentCode: 'CAL-BAL',
        type: 'Unit Trust',
        sector: 'Balanced',
        units: 6200000.0,
        avgCost: 51.0,
        lastPrice: 55.2,
        marketValue: 342240000,
        costValue: 316200000,
        unrealizedPnL: 26040000,
        unrealizedReturn: 8.24
      }
    ],
    6: [
      {
        id: 1,
        instrument: 'CAL Balanced Fund',
        instrumentCode: 'CAL-BAL',
        type: 'Unit Trust',
        sector: 'Balanced',
        units: 3100000.0,
        avgCost: 49.8,
        lastPrice: 56.1,
        marketValue: 173910000,
        costValue: 154380000,
        unrealizedPnL: 19530000,
        unrealizedReturn: 12.65
      },
      {
        id: 2,
        instrument: 'CAL Equity Growth Fund',
        instrumentCode: 'CAL-EQGF',
        type: 'Unit Trust',
        sector: 'Equity',
        units: 820000.0,
        avgCost: 140.0,
        lastPrice: 158.5,
        marketValue: 129970000,
        costValue: 114800000,
        unrealizedPnL: 15170000,
        unrealizedReturn: 13.21
      },
      {
        id: 3,
        instrument: 'CAL Fixed Income Opportunities Fund',
        instrumentCode: 'CAL-FIOF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 10500000.0,
        avgCost: 10.0,
        lastPrice: 10.62,
        marketValue: 111510000,
        costValue: 105000000,
        unrealizedPnL: 6510000,
        unrealizedReturn: 6.2
      }
    ],
    7: [
      {
        id: 1,
        instrument: 'CAL Equity Growth Fund',
        instrumentCode: 'CAL-EQGF',
        type: 'Unit Trust',
        sector: 'Equity',
        units: 2850000.0,
        avgCost: 152.0,
        lastPrice: 171.8,
        marketValue: 489630000,
        costValue: 433200000,
        unrealizedPnL: 56430000,
        unrealizedReturn: 13.03
      },
      {
        id: 2,
        instrument: 'CAL Balanced Fund',
        instrumentCode: 'CAL-BAL',
        type: 'Unit Trust',
        sector: 'Balanced',
        units: 4200000.0,
        avgCost: 53.5,
        lastPrice: 58.9,
        marketValue: 247380000,
        costValue: 224700000,
        unrealizedPnL: 22680000,
        unrealizedReturn: 10.09
      },
      {
        id: 3,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 18500000.0,
        avgCost: 10.0,
        lastPrice: 10.4,
        marketValue: 192400000,
        costValue: 185000000,
        unrealizedPnL: 7400000,
        unrealizedReturn: 4.0
      }
    ],
    8: [
      {
        id: 1,
        instrument: 'CAL Money Market Fund',
        instrumentCode: 'CAL-MMF',
        type: 'Unit Trust',
        sector: 'Money Market',
        units: 125000000.0,
        avgCost: 10.0,
        lastPrice: 10.18,
        marketValue: 1272500000,
        costValue: 1250000000,
        unrealizedPnL: 22500000,
        unrealizedReturn: 1.8
      },
      {
        id: 2,
        instrument: 'CAL Corporate Bond Fund',
        instrumentCode: 'CAL-CBF',
        type: 'Unit Trust',
        sector: 'Fixed Income',
        units: 82000000.0,
        avgCost: 10.0,
        lastPrice: 10.12,
        marketValue: 829840000,
        costValue: 820000000,
        unrealizedPnL: 9840000,
        unrealizedReturn: 1.2
      }
    ]
  };

  const client =
    clientPortfolios.find((p) => p.id === selectedClientId) ||
    clientPortfolios[0] ||
    null;

  const holdings = holdingsByClient[selectedClientId] || [];
  const [view, setView] = useState('holdings');

  const aggregates = useMemo(() => {
    if (!client) {
      return {
        totalMarketValue: 0,
        totalCost: 0,
        totalUnrealized: 0,
        totalReturnPct: 0,
        allocation: [],
        holdingsCount: 0
      };
    }

    const totalMarketValue = client.totalMarketValue * 1_000_000;
    const totalCost = client.totalCost * 1_000_000;
    const totalUnrealized = client.totalUnrealized * 1_000_000;
    const totalReturnPct = client.totalReturnPct;

    const equity = holdings
      .filter((h) => h.sector === 'Equity')
      .reduce((sum, h) => sum + h.marketValue, 0);
    const fixedIncome = holdings
      .filter((h) => h.sector === 'Fixed Income')
      .reduce((sum, h) => sum + h.marketValue, 0);
    const balanced = holdings
      .filter((h) => h.sector === 'Balanced')
      .reduce((sum, h) => sum + h.marketValue, 0);
    const moneyMarket = holdings
      .filter((h) => h.sector === 'Money Market')
      .reduce((sum, h) => sum + h.marketValue, 0);

    const holdingsTotal = equity + fixedIncome + balanced + moneyMarket;
    const withTotal = (val) =>
      holdingsTotal > 0 ? (val / holdingsTotal) * 100 : 0;

    return {
      totalMarketValue,
      totalCost,
      totalUnrealized,
      totalReturnPct,
      holdingsCount: holdings.length,
      allocation: [
        { label: 'Equity', value: equity, pct: withTotal(equity) },
        { label: 'Fixed Income', value: fixedIncome, pct: withTotal(fixedIncome) },
        { label: 'Balanced', value: balanced, pct: withTotal(balanced) },
        { label: 'Money Market', value: moneyMarket, pct: withTotal(moneyMarket) }
      ].filter((a) => a.value > 0)
    };
  }, [holdings, client]);

  const donutStyle = useMemo(() => {
    let cursor = 0;
    const stops = aggregates.allocation.map((item, i) => {
      const start = cursor;
      cursor += item.pct;
      return `${ALLOC_COLORS[i % ALLOC_COLORS.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    return {
      background: stops.length
        ? `conic-gradient(${stops.join(', ')})`
        : 'conic-gradient(#e6e2d9 0% 100%)'
    };
  }, [aggregates.allocation]);

  const getReturnClass = (value) => {
    if (value > 0) return 'is-up';
    if (value < 0) return 'is-down';
    return 'is-flat';
  };

  if (!client) {
    return (
      <div className="wmclp">
        <p className="wmclp-empty">No client portfolios available.</p>
      </div>
    );
  }

  return (
    <div className="wmclp">
      <header className="wmclp-rail">
        <div className="wmclp-rail__brand">
          <div>
            <p className="wmclp-rail__eyebrow">Sherwood Wealth</p>
            <h1 className="wmclp-rail__title">Client Portfolios</h1>
            <p className="wmclp-rail__blurb">
              Select a client book, review holdings, and track allocation across unit trusts.
            </p>
          </div>
        </div>
        <div className="wmclp-rail__meta">
          <strong>{clientPortfolios.length}</strong>
          <span>Active books</span>
        </div>
      </header>

      <section className="wmclp-picker" aria-label="Client portfolio list">
        <div className="wmclp-panel__head">
          <div>
            <h2>Client books</h2>
            <p>Click a row to open holdings and allocation for that client.</p>
          </div>
        </div>
        <div className="wmclp-picker__grid">
          {clientPortfolios.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`wmclp-book${p.id === selectedClientId ? ' is-on' : ''}`}
              onClick={() => setSelectedClientId(p.id)}
            >
              <div className="wmclp-book__top">
                <div>
                  <strong>{p.name}</strong>
                  <span>
                    {p.code} · {p.segment}
                  </span>
                </div>
                <span className={`wmclp-pill ${getReturnClass(p.totalReturnPct)}`}>
                  {formatPercent(p.totalReturnPct)}
                </span>
              </div>
              <div className="wmclp-book__stats">
                <div>
                  <em>Value</em>
                  <b>{p.totalMarketValue.toFixed(1)} Mn</b>
                </div>
                <div>
                  <em>P&amp;L</em>
                  <b className={getReturnClass(p.totalUnrealized)}>
                    {p.totalUnrealized.toFixed(1)} Mn
                  </b>
                </div>
                <div>
                  <em>Risk</em>
                  <b>{p.riskProfile}</b>
                </div>
                <div>
                  <em>Since</em>
                  <b>{p.since}</b>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="wmclp-spotlight" aria-label="Selected portfolio metrics">
        <article className="wmclp-stat wmclp-stat--wide">
          <span className="wmclp-label">Selected client</span>
          <strong className="wmclp-stat__name">{client.name}</strong>
          <span className="wmclp-stat__meta">
            {client.code} · {client.segment} · Since {client.since}
          </span>
          <div className="wmclp-stat__chips">
            <span className="wmclp-pill wmclp-pill--info">{client.riskProfile}</span>
            <span className="wmclp-pill wmclp-pill--soft">{client.rm}</span>
          </div>
        </article>
        <article className="wmclp-stat">
          <span className="wmclp-label">Portfolio value</span>
          <strong>LKR {formatCurrency(aggregates.totalMarketValue)}</strong>
          <span className="wmclp-stat__meta">Market value</span>
        </article>
        <article className="wmclp-stat">
          <span className="wmclp-label">Total cost</span>
          <strong>LKR {formatCurrency(aggregates.totalCost)}</strong>
          <span className="wmclp-stat__meta">Book cost</span>
        </article>
        <article className="wmclp-stat">
          <span className="wmclp-label">Unrealized P&amp;L</span>
          <strong className={getReturnClass(aggregates.totalUnrealized)}>
            LKR {formatCurrency(aggregates.totalUnrealized)}
          </strong>
          <span className={`wmclp-pill ${getReturnClass(aggregates.totalReturnPct)}`}>
            {formatPercent(aggregates.totalReturnPct)}
          </span>
        </article>
        <article className="wmclp-stat">
          <span className="wmclp-label">Holdings</span>
          <strong>{aggregates.holdingsCount}</strong>
          <span className="wmclp-stat__meta">Unit trust lines</span>
        </article>
      </section>

      <div className="wmclp-toolbar">
        <div className="wmclp-tabs" role="tablist" aria-label="Portfolio view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'holdings'}
            className={`wmclp-tab${view === 'holdings' ? ' is-on' : ''}`}
            onClick={() => setView('holdings')}
          >
            Holdings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'summary'}
            className={`wmclp-tab${view === 'summary' ? ' is-on' : ''}`}
            onClick={() => setView('summary')}
          >
            Allocation summary
          </button>
        </div>
      </div>

      <div className="wmclp-board">
        <section className="wmclp-panel wmclp-panel--main">
          {view === 'holdings' ? (
            <>
              <div className="wmclp-panel__head">
                <div>
                  <h2>Current holdings</h2>
                  <p>
                    Instrument-level view with cost, market value and unrealized performance.
                  </p>
                </div>
              </div>
              <div className="wmclp-table-wrap">
                <table className="wmclp-table">
                  <thead>
                    <tr>
                      <th>Instrument</th>
                      <th>Type</th>
                      <th>Sector</th>
                      <th className="wmclp-num">Units</th>
                      <th className="wmclp-num">Avg Cost</th>
                      <th className="wmclp-num">Last Price</th>
                      <th className="wmclp-num">Cost Value</th>
                      <th className="wmclp-num">Market Value</th>
                      <th className="wmclp-num">Unrealized P&amp;L</th>
                      <th className="wmclp-num">% Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <div className="wmclp-entity">
                            <strong>{h.instrument}</strong>
                            <span>{h.instrumentCode}</span>
                          </div>
                        </td>
                        <td>{h.type}</td>
                        <td>
                          <span className="wmclp-pill wmclp-pill--soft">{h.sector}</span>
                        </td>
                        <td className="wmclp-num">
                          {h.units.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmclp-num">
                          {h.avgCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmclp-num">
                          {h.lastPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmclp-num">{formatCurrency(h.costValue)}</td>
                        <td className="wmclp-num">{formatCurrency(h.marketValue)}</td>
                        <td className={`wmclp-num ${getReturnClass(h.unrealizedPnL)}`}>
                          {formatCurrency(h.unrealizedPnL)}
                        </td>
                        <td className={`wmclp-num ${getReturnClass(h.unrealizedReturn)}`}>
                          {formatPercent(h.unrealizedReturn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="wmclp-panel__head">
                <div>
                  <h2>Allocation summary</h2>
                  <p>Weights and market values by asset class.</p>
                </div>
              </div>
              <div className="wmclp-table-wrap">
                <table className="wmclp-table">
                  <thead>
                    <tr>
                      <th>Asset Class</th>
                      <th className="wmclp-num">Weight %</th>
                      <th className="wmclp-num">Market Value (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregates.allocation.map((item) => (
                      <tr key={item.label}>
                        <td>{item.label}</td>
                        <td className="wmclp-num">{item.pct.toFixed(1)}%</td>
                        <td className="wmclp-num">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <aside className="wmclp-side">
          <section className="wmclp-panel">
            <div className="wmclp-panel__head">
              <div>
                <h2>Fund allocation</h2>
                <p>Asset-class mix for the selected book.</p>
              </div>
            </div>
            <div className="wmclp-alloc">
              <div className="wmclp-donut" style={donutStyle}>
                <div className="wmclp-donut__hole">
                  <strong>{aggregates.holdingsCount}</strong>
                  <span>lines</span>
                </div>
              </div>
              <ul className="wmclp-legend">
                {aggregates.allocation.map((item, i) => (
                  <li key={item.label}>
                    <i style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                    <span>{item.label}</span>
                    <b>{item.pct.toFixed(1)}%</b>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="wmclp-panel wmclp-panel--notes">
            <div className="wmclp-panel__head">
              <div>
                <h2>Advisory notes</h2>
                <p>Talking points for the next client review.</p>
              </div>
            </div>
            <ul className="wmclp-notes">
              <li>
                Equity allocation is tilted towards growth – monitor volatility and
                drawdown against client comfort.
              </li>
              <li>
                Fixed income and money market exposures provide liquidity and
                stability; consider top-ups if risk appetite changes.
              </li>
              <li>
                Balanced fund can be used to gradually adjust risk without large
                one-off switches.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ClientPortfolio;
