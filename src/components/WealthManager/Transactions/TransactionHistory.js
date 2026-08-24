import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney, formatUnits } from '../shared/wealthOpsKit';

const ROWS = [
  { id: 'TXN-88421', clientName: 'Weerathungage Arani Sehansa', clientCode: 'CLT-000128', fundName: 'Equity Growth Fund', type: 'Purchase', amount: 2500000, units: 98231.8271, tradeDate: '2026-08-18', channel: 'RM Assisted', status: 'Completed', notes: 'Top-up into growth sleeve' },
  { id: 'TXN-88414', clientName: 'Omega Holdings (Pvt) Ltd', clientCode: 'CLT-000257', fundName: 'Money Market Fund', type: 'Redemption', amount: 12000000, units: 12000000, tradeDate: '2026-08-17', channel: 'Branch', status: 'Completed', notes: '' },
  { id: 'TXN-88408', clientName: 'Family Trust – Growth', clientCode: 'CLT-000389', fundName: 'Balanced Income Fund', type: 'Switch', amount: 620000, units: 32769.556, tradeDate: '2026-08-16', channel: 'Client Portal', status: 'Pending', notes: 'Awaiting cut-off' },
  { id: 'TXN-88391', clientName: 'Nimal Perera – Retirement', clientCode: 'CLT-000412', fundName: 'Fixed Income Fund', type: 'SIP', amount: 25000, units: 2439.0244, tradeDate: '2026-08-15', channel: 'Direct Debit', status: 'Completed', notes: '' },
  { id: 'TXN-88380', clientName: 'Sunrise Foundation', clientCode: 'CLT-000441', fundName: 'Index Fund', type: 'Purchase', amount: 900000, units: 27993.7792, tradeDate: '2026-08-14', channel: 'Call Centre', status: 'Failed', notes: 'Mandate expired' },
];

const TransactionHistory = () => (
  <WealthOpsWorkbench
    title="Transaction History"
    blurb="Full dealing blotter across purchases, redemptions, switches, SIPs and SWPs."
    seedRows={ROWS}
    stats={(rows) => [
      { k: 'Value', v: formatMoney(rows.reduce((s, r) => s + r.amount, 0)), m: 'All shown trades', focus: true },
      { k: 'Trades', v: rows.length, m: 'In view' },
      { k: 'Completed', v: rows.filter((r) => r.status === 'Completed').length, m: 'Booked' },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'In flight' },
      { k: 'Failed', v: rows.filter((r) => r.status === 'Failed').length, m: 'Need repair' },
    ]}
    statusTabs={['All', 'Completed', 'Pending', 'Failed']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'clientName', 'clientCode', 'fundName', 'type']}
    searchPlaceholder="Search trade, client, fund…"
    columns={[
      { key: 'id', label: 'Trade' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'type', label: 'Type' },
      { key: 'fundName', label: 'Fund' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'tradeDate', label: 'Trade date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Dealing blotter"
    detailFields={[
      { k: 'Type', get: (r) => r.type },
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Units', get: (r) => formatUnits(r.units) },
      { k: 'Channel', get: (r) => r.channel },
      { k: 'Trade date', get: (r) => r.tradeDate },
      { k: 'Fund', get: (r) => r.fundName },
    ]}
  />
);

export default TransactionHistory;
