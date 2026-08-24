import React from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import { formatMoney } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const ROWS = [
  { code: '101-001', name: 'Investments at MV', type: 'Asset', debit: 1_842_500_000, credit: 0 },
  { code: '101-200', name: 'Trustee cash', type: 'Asset', debit: 186_400_000, credit: 0 },
  { code: '101-300', name: 'Receivables', type: 'Asset', debit: 24_800_000, credit: 0 },
  { code: '201-100', name: 'Unit capital', type: 'Liability', debit: 0, credit: 1_980_000_000 },
  { code: '201-200', name: 'Redemptions payable', type: 'Liability', debit: 0, credit: 18_200_000 },
  { code: '201-300', name: 'Accrued fees', type: 'Liability', debit: 0, credit: 12_400_000 },
  { code: '301-100', name: 'Retained income', type: 'Equity', debit: 0, credit: 43_100_000 },
];

const WealthTrialBalance = () => {
  const debit = ROWS.reduce((s, r) => s + r.debit, 0);
  const credit = ROWS.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="wos">
      <WealthPageHeader
        title="Trial Balance"
        blurb="Fund-combined trial balance as at the last published NAV date. Debits and credits must agree before lock."
      />
      <section className="wos-strip wos-strip--4">
        <article className="wos-stat wos-stat--focus">
          <span className="wos-k">Debits</span>
          <strong>{formatMoney(debit)}</strong>
          <span className="wos-m">As at 21 Aug 2026</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Credits</span>
          <strong>{formatMoney(credit)}</strong>
          <span className="wos-m">As at 21 Aug 2026</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Difference</span>
          <strong>{formatMoney(debit - credit)}</strong>
          <span className="wos-m">{debit === credit ? 'In balance' : 'Out of balance'}</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Accounts</span>
          <strong>{ROWS.length}</strong>
          <span className="wos-m">With balances</span>
        </article>
      </section>
      <section className="wos-board">
        <header className="wos-board__head">
          <div>
            <h2>Combined trial balance</h2>
            <p>All unit trust funds · LKR</p>
          </div>
        </header>
        <div className="wos-table-wrap">
          <table className="wos-table wos-stmt">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account</th>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.code} className="is-static">
                  <td>{r.code}</td>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td>{r.type}</td>
                  <td className="num">{r.debit ? formatMoney(r.debit) : '—'}</td>
                  <td className="num">{r.credit ? formatMoney(r.credit) : '—'}</td>
                </tr>
              ))}
              <tr className="total is-static">
                <td colSpan={3}>Total</td>
                <td className="num">{formatMoney(debit)}</td>
                <td className="num">{formatMoney(credit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default WealthTrialBalance;
