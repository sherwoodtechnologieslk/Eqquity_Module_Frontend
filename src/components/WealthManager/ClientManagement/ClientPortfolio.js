import React, { useMemo, useState } from 'react';
import './Styles/ClientPortfolio.css';

// Simple currency formatter reused across the screen
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

const formatPercent = (value) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const ClientPortfolio = () => {
  // In a real app these would come from an API
  const [clientPortfolios] = useState([
    {
      id: 1,
      name: 'Weerathungage Arani Sehansa',
      code: 'CLT-000128',
      segment: 'Individual',
      riskProfile: 'Moderate Growth',
      rm: 'Sherwood Wealth Team',
      since: '2022-07-15',
      totalMarketValue: 502, // in LKR millions (for display only)
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
    ]
  };

  const client =
    clientPortfolios.find((p) => p.id === selectedClientId) ||
    clientPortfolios[0] ||
    null;

  const holdings = holdingsByClient[selectedClientId] || [];

  const [view, setView] = useState('holdings'); // 'holdings' | 'summary' (reserved for future)

  const aggregates = useMemo(() => {
    if (!client) {
      return {
        totalMarketValue: 0,
        totalCost: 0,
        totalUnrealized: 0,
        totalReturnPct: 0,
        allocation: []
      };
    }

    // Use client-level aggregates for the header
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

    const withTotal = (val) =>
      totalMarketValue > 0 ? (val / totalMarketValue) * 100 : 0;

    return {
      totalMarketValue,
      totalCost,
      totalUnrealized,
      totalReturnPct,
      allocation: [
        { label: 'Equity', value: equity, pct: withTotal(equity) },
        {
          label: 'Fixed Income',
          value: fixedIncome,
          pct: withTotal(fixedIncome)
        },
        { label: 'Balanced', value: balanced, pct: withTotal(balanced) },
        {
          label: 'Money Market',
          value: moneyMarket,
          pct: withTotal(moneyMarket)
        }
      ]
    };
  }, [holdings, client]);

  const getReturnClass = (value) => {
    if (value > 0) return 'wmcp-return-positive';
    if (value < 0) return 'wmcp-return-negative';
    return 'wmcp-return-neutral';
  };

  return (
    <div className="wmcp-container">
      {/* Client list */}
      <div className="wmcp-header-card wmcp-list-card">
        <div className="wmcp-card-header">
          <div>
            <h2>Client Portfolios</h2>
            <p>
              Select a client portfolio to view detailed holdings and asset
              allocation.
            </p>
          </div>
        </div>
        <div className="wmcp-table-wrapper">
          <table className="wmcp-table wmcp-client-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Code</th>
                <th>Segment</th>
                <th>Risk</th>
                <th>Since</th>
                <th className="wmcp-num">Value (LKR Mn)</th>
                <th className="wmcp-num">Unrealized P&amp;L (LKR Mn)</th>
                <th className="wmcp-num">% Return</th>
              </tr>
            </thead>
            <tbody>
              {clientPortfolios.map((p) => (
                <tr
                  key={p.id}
                  className={
                    p.id === selectedClientId ? 'wmcp-row-selected' : ''
                  }
                  onClick={() => setSelectedClientId(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="wmcp-client-cell">
                      <div className="wmcp-client-name">{p.name}</div>
                      <div className="wmcp-client-sub">
                        {p.rm} • {p.segment}
                      </div>
                    </div>
                  </td>
                  <td>{p.code}</td>
                  <td>{p.segment}</td>
                  <td>{p.riskProfile}</td>
                  <td>{p.since}</td>
                  <td className="wmcp-num">
                    {p.totalMarketValue.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}
                  </td>
                  <td className={`wmcp-num ${getReturnClass(p.totalUnrealized)}`}>
                    {p.totalUnrealized.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}
                  </td>
                  <td className={`wmcp-num ${getReturnClass(p.totalReturnPct)}`}>
                    {formatPercent(p.totalReturnPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Header */}
      <div className="wmcp-header-card">
        <div className="wmcp-header-main">
          <div className="wmcp-header-left">
            <div className="wmcp-header-label">Client Portfolio</div>
            <h1 className="wmcp-header-title">{client.name}</h1>
            <div className="wmcp-header-meta">
              <span>ID: {client.code}</span>
              <span>Segment: {client.segment}</span>
              <span>Since: {client.since}</span>
            </div>
          </div>
          <div className="wmcp-header-right">
            <div className="wmcp-chip wmcp-chip-risk">
              <span className="wmcp-chip-label">Risk Profile</span>
              <span className="wmcp-chip-value">{client.riskProfile}</span>
            </div>
            <div className="wmcp-chip wmcp-chip-rm">
              <span className="wmcp-chip-label">Relationship Team</span>
              <span className="wmcp-chip-value">{client.rm}</span>
            </div>
          </div>
        </div>

        <div className="wmcp-header-summary">
          <div className="wmcp-summary-item">
            <div className="wmcp-summary-label">Total Portfolio Value</div>
            <div className="wmcp-summary-value">
              LKR {formatCurrency(aggregates.totalMarketValue)}
            </div>
          </div>
          <div className="wmcp-summary-item">
            <div className="wmcp-summary-label">Total Cost</div>
            <div className="wmcp-summary-value">
              LKR {formatCurrency(aggregates.totalCost)}
            </div>
          </div>
          <div className="wmcp-summary-item">
            <div className="wmcp-summary-label">Unrealized P&amp;L</div>
            <div
              className={`wmcp-summary-value ${getReturnClass(
                aggregates.totalUnrealized
              )}`}
            >
              LKR {formatCurrency(aggregates.totalUnrealized)}
            </div>
          </div>
          <div className="wmcp-summary-item">
            <div className="wmcp-summary-label">Unrealized Return</div>
            <div
              className={`wmcp-summary-value ${getReturnClass(
                aggregates.totalReturnPct
              )}`}
            >
              {formatPercent(aggregates.totalReturnPct)}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="wmcp-toolbar">
        <div className="wmcp-toggle-group">
          <button
            type="button"
            className={`wmcp-toggle-btn ${
              view === 'holdings' ? 'active' : ''
            }`}
            onClick={() => setView('holdings')}
          >
            Holdings
          </button>
          <button
            type="button"
            className={`wmcp-toggle-btn ${
              view === 'summary' ? 'active' : ''
            }`}
            onClick={() => setView('summary')}
          >
            Allocation Summary
          </button>
        </div>
      </div>

      <div className="wmcp-main-grid">
        {/* Left: Holdings / Allocation Summary */}
        <div className="wmcp-card">
          {view === 'holdings' ? (
            <>
              <div className="wmcp-card-header">
                <div>
                  <h2>Current Holdings</h2>
                  <p>
                    Instrument-level view of the client&apos;s portfolio with
                    cost, market value and unrealized performance.
                  </p>
                </div>
              </div>

              <div className="wmcp-table-wrapper">
                <table className="wmcp-table">
                  <thead>
                    <tr>
                      <th>Instrument</th>
                      <th>Type</th>
                      <th>Sector</th>
                      <th className="wmcp-num">Units</th>
                      <th className="wmcp-num">Avg Cost</th>
                      <th className="wmcp-num">Last Price</th>
                      <th className="wmcp-num">Cost Value</th>
                      <th className="wmcp-num">Market Value</th>
                      <th className="wmcp-num">Unrealized P&amp;L</th>
                      <th className="wmcp-num">% Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <div className="wmcp-instrument-cell">
                            <div className="wmcp-instrument-name">
                              {h.instrument}
                            </div>
                            <div className="wmcp-instrument-code">
                              {h.instrumentCode}
                            </div>
                          </div>
                        </td>
                        <td>{h.type}</td>
                        <td>{h.sector}</td>
                        <td className="wmcp-num">
                          {h.units.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmcp-num">
                          {h.avgCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmcp-num">
                          {h.lastPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="wmcp-num">
                          {formatCurrency(h.costValue)}
                        </td>
                        <td className="wmcp-num">
                          {formatCurrency(h.marketValue)}
                        </td>
                        <td
                          className={`wmcp-num ${getReturnClass(
                            h.unrealizedPnL
                          )}`}
                        >
                          {formatCurrency(h.unrealizedPnL)}
                        </td>
                        <td
                          className={`wmcp-num ${getReturnClass(
                            h.unrealizedReturn
                          )}`}
                        >
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
              <div className="wmcp-card-header">
                <div>
                  <h2>Allocation Summary</h2>
                  <p>
                    Summary of the client&apos;s portfolio by asset class with
                    weights and values.
                  </p>
                </div>
              </div>
              <div className="wmcp-table-wrapper">
                <table className="wmcp-table">
                  <thead>
                    <tr>
                      <th>Asset Class</th>
                      <th className="wmcp-num">Weight %</th>
                      <th className="wmcp-num">Market Value (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregates.allocation.map((item) => (
                      <tr key={item.label}>
                        <td>{item.label}</td>
                        <td className="wmcp-num">
                          {item.pct.toFixed(1)}%
                        </td>
                        <td className="wmcp-num">
                          {formatCurrency(item.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Right: Allocation & quick summary */}
        <div className="wmcp-side-column">
          <div className="wmcp-card">
            <div className="wmcp-card-header">
              <div>
                <h2>Allocation by Asset Class</h2>
                <p>Breakdown of the portfolio by high-level asset class.</p>
              </div>
            </div>
            <div className="wmcp-allocation-list">
              {aggregates.allocation.map((item) => (
                <div key={item.label} className="wmcp-allocation-row">
                  <div className="wmcp-allocation-label">
                    <span className="wmcp-allocation-pill">
                      {item.label}
                    </span>
                  </div>
                  <div className="wmcp-allocation-bar-wrapper">
                    <div className="wmcp-allocation-bar-bg">
                      <div
                        className="wmcp-allocation-bar-fill"
                        style={{ width: `${item.pct.toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                  <div className="wmcp-allocation-values">
                    <span className="wmcp-allocation-pct">
                      {item.pct.toFixed(1)}%
                    </span>
                    <span className="wmcp-allocation-amount">
                      LKR {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="wmcp-card wmcp-note-card">
            <div className="wmcp-card-header">
              <div>
                <h2>Advisory Notes</h2>
                <p>
                  Use this view as a starting point for your next portfolio
                  review with the client.
                </p>
              </div>
            </div>
            <ul className="wmcp-notes-list">
              <li>
                Equity allocation is tilted towards growth – monitor volatility
                and drawdown against client comfort.
              </li>
              <li>
                Fixed income and money market exposures provide liquidity and
                stability; consider top-ups if risk appetite changes.
              </li>
              <li>
                Balanced fund can be used to gradually adjust risk without
                large one-off switches.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortfolio;

