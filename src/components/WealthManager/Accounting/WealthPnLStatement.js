import React from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import { formatMoney } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const LINES = [
  { label: 'Dividend income', amount: 18_420_000, indent: false },
  { label: 'Interest income', amount: 22_150_000, indent: false },
  { label: 'Realised gains', amount: 6_840_000, indent: false },
  { label: 'Unrealised gains', amount: 11_200_000, indent: false },
  { label: 'Total income', amount: 58_610_000, total: true },
  { label: 'Management fees', amount: -14_800_000, indent: true },
  { label: 'Trustee / custody', amount: -2_140_000, indent: true },
  { label: 'Audit & legal', amount: -860_000, indent: true },
  { label: 'Other operating', amount: -1_120_000, indent: true },
  { label: 'Total expenses', amount: -18_920_000, total: true },
  { label: 'Profit for the period', amount: 39_690_000, total: true },
];

const WealthPnLStatement = () => (
  <div className="wos">
    <WealthPageHeader
      title="P&L Statement"
      blurb="Combined unit-trust profit and loss for the year to 21 August 2026, before client distributions."
    />
    <section className="wos-strip wos-strip--4">
      <article className="wos-stat wos-stat--focus">
        <span className="wos-k">Net profit</span>
        <strong>{formatMoney(39_690_000)}</strong>
        <span className="wos-m">YTD to 21 Aug 2026</span>
      </article>
      <article className="wos-stat">
        <span className="wos-k">Income</span>
        <strong>{formatMoney(58_610_000)}</strong>
        <span className="wos-m">Including unrealised</span>
      </article>
      <article className="wos-stat">
        <span className="wos-k">Expenses</span>
        <strong>{formatMoney(18_920_000)}</strong>
        <span className="wos-m">Fees & operating</span>
      </article>
      <article className="wos-stat">
        <span className="wos-k">Expense ratio</span>
        <strong>1.12%</strong>
        <span className="wos-m">On average AUM</span>
      </article>
    </section>
    <section className="wos-board">
      <header className="wos-board__head">
        <div>
          <h2>Statement of comprehensive income</h2>
          <p>All funds · LKR</p>
        </div>
      </header>
      <div className="wos-table-wrap">
        <table className="wos-table wos-stmt">
          <thead>
            <tr>
              <th>Line</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map((line) => (
              <tr key={line.label} className={`${line.total ? 'total' : ''} is-static`}>
                <td className={line.indent ? 'indent' : ''}>{line.label}</td>
                <td>{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
);

export default WealthPnLStatement;
