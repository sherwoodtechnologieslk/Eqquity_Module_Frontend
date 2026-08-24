import React from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import { formatCompact, formatPct } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const SLEEVES = [
  {
    id: 'WM001',
    name: 'Growth sleeve – Arani Sehansa',
    client: 'CLT-000128',
    aum: 502_000_000,
    drift: 1.8,
    lastRebalance: '2026-06-12',
    status: 'On policy',
    rows: [
      { asset: 'Equity Growth Fund', target: 45, actual: 47.2 },
      { asset: 'Balanced Income Fund', target: 25, actual: 23.1 },
      { asset: 'Fixed Income Fund', target: 20, actual: 19.4 },
      { asset: 'Money Market Fund', target: 10, actual: 10.3 },
    ],
  },
  {
    id: 'WM002',
    name: 'Treasury book – Omega Holdings',
    client: 'CLT-000257',
    aum: 890_000_000,
    drift: 0.4,
    lastRebalance: '2026-08-01',
    status: 'On policy',
    rows: [
      { asset: 'Money Market Fund', target: 55, actual: 54.6 },
      { asset: 'Fixed Income Fund', target: 35, actual: 35.8 },
      { asset: 'Balanced Income Fund', target: 10, actual: 9.6 },
    ],
  },
  {
    id: 'WM003',
    name: 'Trust growth – Family Trust',
    client: 'CLT-000389',
    aum: 325_000_000,
    drift: 4.6,
    lastRebalance: '2026-03-20',
    status: 'Watch',
    rows: [
      { asset: 'Equity Growth Fund', target: 60, actual: 64.6 },
      { asset: 'Index Fund', target: 20, actual: 18.2 },
      { asset: 'Balanced Income Fund', target: 15, actual: 13.1 },
      { asset: 'Money Market Fund', target: 5, actual: 4.1 },
    ],
  },
];

const PortfolioAllocation = () => {
  const [selectedId, setSelectedId] = React.useState(SLEEVES[0].id);
  const selected = SLEEVES.find((s) => s.id === selectedId) || SLEEVES[0];
  const totalAum = SLEEVES.reduce((s, p) => s + p.aum, 0);
  const watch = SLEEVES.filter((s) => s.status === 'Watch').length;

  return (
    <div className="wos">
      <WealthPageHeader
        title="Portfolio Allocation"
        blurb="Compare target versus actual sleeve weights and flag drift against the agreed investment policy."
      />

      <section className="wos-strip wos-strip--4">
        <article className="wos-stat wos-stat--focus">
          <span className="wos-k">Allocated AUM</span>
          <strong>{formatCompact(totalAum)}</strong>
          <span className="wos-m">Across {SLEEVES.length} portfolios</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">On policy</span>
          <strong>{SLEEVES.length - watch}</strong>
          <span className="wos-m">Within 3% band</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Watch</span>
          <strong>{watch}</strong>
          <span className="wos-m">Drift above policy</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Selected drift</span>
          <strong>{formatPct(selected.drift)}</strong>
          <span className="wos-m">vs last rebalance {selected.lastRebalance}</span>
        </article>
      </section>

      <div className="wos-split">
        <section className="wos-board">
          <header className="wos-board__head">
            <div>
              <h2>Portfolios</h2>
              <p>Select a sleeve to inspect target vs actual</p>
            </div>
          </header>
          <div className="wos-table-wrap">
            <table className="wos-table">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>AUM</th>
                  <th>Drift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {SLEEVES.map((p) => (
                  <tr
                    key={p.id}
                    className={selectedId === p.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td>
                      <strong>{p.name}</strong>
                      <span className="wos-sub">{p.client}</span>
                    </td>
                    <td>{formatCompact(p.aum)}</td>
                    <td>{formatPct(p.drift)}</td>
                    <td>
                      <span className={`wos-badge wos-badge--${p.status === 'Watch' ? 'watch' : 'ok'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="wos-detail">
          <header className="wos-detail__head">
            <div>
              <p className="wos-detail__eyebrow">Policy vs actual</p>
              <h3>{selected.name}</h3>
              <p>Last rebalance {selected.lastRebalance}</p>
            </div>
          </header>
          <div className="wos-bars">
            {selected.rows.map((row) => (
              <div key={row.asset}>
                <div className="wos-bar">
                  <span>{row.asset}</span>
                  <div className="wos-bar__track">
                    <div className="wos-bar__fill" style={{ width: `${row.actual}%` }} />
                  </div>
                  <strong>{row.actual.toFixed(1)}%</strong>
                </div>
                <div className="wos-bar" style={{ opacity: 0.7 }}>
                  <span className="wos-m">Target {row.target}%</span>
                  <div className="wos-bar__track">
                    <div className="wos-bar__fill wos-bar__fill--gold" style={{ width: `${row.target}%` }} />
                  </div>
                  <span className="wos-m">{(row.actual - row.target).toFixed(1)} pp</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PortfolioAllocation;
