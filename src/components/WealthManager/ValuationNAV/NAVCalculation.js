import React from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import { FUNDS, formatCompact, formatMoney, todayISO } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const ASSETS = [
  { name: 'Listed equities', value: 1_102_500_000, weight: 45 },
  { name: 'Government securities', value: 490_000_000, weight: 20 },
  { name: 'Corporate debt', value: 245_000_000, weight: 10 },
  { name: 'Cash & money market', value: 367_500_000, weight: 15 },
  { name: 'Other', value: 245_000_000, weight: 10 },
];

const NAVCalculation = () => {
  const [fundId, setFundId] = React.useState(FUNDS[0].id);
  const [navDate, setNavDate] = React.useState(todayISO());
  const [message, setMessage] = React.useState('');
  const [status, setStatus] = React.useState('Draft');
  const fund = FUNDS.find((f) => f.id === fundId) || FUNDS[0];
  const aum = 450_000_000;
  const units = 17_681_729;
  const expenses = 128_400;
  const income = 86_250;
  const nav = (aum + income - expenses) / units;

  const run = () => {
    setStatus('Published');
    setMessage(`NAV for ${fund.name} on ${navDate} published at ${formatMoney(nav)}.`);
  };

  return (
    <div className="wos">
      <WealthPageHeader
        title="NAV Calculation"
        blurb="Roll asset valuations, accrue income and expenses, then publish the dealing NAV for the selected fund."
        actions={
          <button type="button" className="wos-btn wos-btn--solid" onClick={run}>
            Run & publish NAV
          </button>
        }
      />

      <section className="wos-strip wos-strip--5">
        <article className="wos-stat wos-stat--focus">
          <span className="wos-k">Indicative NAV</span>
          <strong>{formatMoney(nav)}</strong>
          <span className="wos-m">{fund.name}</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Net assets</span>
          <strong>{formatCompact(aum + income - expenses)}</strong>
          <span className="wos-m">After income & fees</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Units in issue</span>
          <strong>{units.toLocaleString()}</strong>
          <span className="wos-m">End of day</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Income / expense</span>
          <strong>{formatMoney(income - expenses)}</strong>
          <span className="wos-m">Net accrual</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Status</span>
          <strong>{status}</strong>
          <span className="wos-m">{navDate}</span>
        </article>
      </section>

      {message ? <p className="wos-message">{message}</p> : null}

      <section className="wos-form-panel">
        <header className="wos-panel-head">
          <div>
            <h2>Run parameters</h2>
            <p>Uses last close prices and the expense master accruals.</p>
          </div>
        </header>
        <div className="wos-form-grid">
          <label className="wos-field">
            <span>Fund</span>
            <select value={fundId} onChange={(e) => setFundId(e.target.value)}>
              {FUNDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wos-field">
            <span>Valuation date</span>
            <input type="date" value={navDate} onChange={(e) => setNavDate(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="wos-board">
        <header className="wos-board__head">
          <div>
            <h2>Asset roll-up</h2>
            <p>Market value feeding this NAV</p>
          </div>
        </header>
        <div className="wos-table-wrap">
          <table className="wos-table">
            <thead>
              <tr>
                <th>Sleeve</th>
                <th>Weight</th>
                <th className="num">Market value</th>
              </tr>
            </thead>
            <tbody>
              {ASSETS.map((row) => (
                <tr key={row.name} className="is-static">
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>
                    <div className="wos-bar">
                      <div className="wos-bar__track">
                        <div className="wos-bar__fill" style={{ width: `${row.weight}%` }} />
                      </div>
                      <span>{row.weight}%</span>
                    </div>
                  </td>
                  <td className="num">{formatMoney(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default NAVCalculation;
