import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney } from '../shared/wealthOpsKit';

const WealthGeneralLedger = () => (
  <WealthOpsWorkbench
    title="General Ledger"
    blurb="Fund-level general ledger lines with running balance for trustee cash, investments, and unit capital."
    seedRows={[
      { id: 'GL-101-001', account: '101-001 Investments', fundName: 'Equity Growth Fund', jeDate: '2026-08-21', debit: 1_240_000, credit: 0, balance: 448_760_000, status: 'Posted', notes: 'COMB dividend reinvest', createdBy: 'Fund Accounting' },
      { id: 'GL-101-002', account: '101-200 Trustee cash', fundName: 'Equity Growth Fund', jeDate: '2026-08-21', debit: 2_500_000, credit: 0, balance: 18_420_000, status: 'Posted', notes: 'Subscription receipt', createdBy: 'Ops Desk' },
      { id: 'GL-201-001', account: '201-100 Unit capital', fundName: 'Equity Growth Fund', jeDate: '2026-08-21', debit: 0, credit: 2_500_000, balance: 412_000_000, status: 'Posted', notes: 'Units allotted', createdBy: 'Ops Desk' },
      { id: 'GL-501-001', account: '501-010 Management fee', fundName: 'Balanced Income Fund', jeDate: '2026-08-21', debit: 186_400, credit: 0, balance: 1_442_800, status: 'Posted', notes: 'August AMC', createdBy: 'Fund Accounting' },
      { id: 'GL-101-003', account: '101-200 Trustee cash', fundName: 'Money Market Fund', jeDate: '2026-08-20', debit: 0, credit: 12_000_000, balance: 64_800_000, status: 'Posted', notes: 'Redemption payout', createdBy: 'Ops Desk' },
    ]}
    stats={(rows) => [
      { k: 'Debits', v: formatMoney(rows.reduce((s, r) => s + r.debit, 0)), m: 'In view', focus: true },
      { k: 'Credits', v: formatMoney(rows.reduce((s, r) => s + r.credit, 0)), m: 'In view' },
      { k: 'Lines', v: rows.length, m: 'Posted activity' },
      { k: 'Accounts', v: new Set(rows.map((r) => r.account)).size, m: 'Touched' },
    ]}
    statusTabs={['All', 'Posted']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'account', 'fundName', 'notes']}
    columns={[
      { key: 'jeDate', label: 'Date' },
      { key: 'account', label: 'Account' },
      { key: 'fundName', label: 'Fund' },
      { key: 'debit', label: 'Debit', render: (r) => (r.debit ? formatMoney(r.debit) : '—') },
      { key: 'credit', label: 'Credit', render: (r) => (r.credit ? formatMoney(r.credit) : '—') },
      { key: 'balance', label: 'Balance', render: (r) => formatMoney(r.balance) },
    ]}
    boardTitle="Ledger lines"
    detailTitle={(r) => r.account}
    detailSubtitle={(r) => r.id}
    detailFields={[
      { k: 'Debit', get: (r) => formatMoney(r.debit) },
      { k: 'Credit', get: (r) => formatMoney(r.credit) },
      { k: 'Balance', get: (r) => formatMoney(r.balance) },
      { k: 'Fund', get: (r) => r.fundName },
    ]}
  />
);

export default WealthGeneralLedger;
