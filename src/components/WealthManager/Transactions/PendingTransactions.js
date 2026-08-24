import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney, formatUnits } from '../shared/wealthOpsKit';

const PendingTransactions = () => (
  <WealthOpsWorkbench
    title="Pending Transactions"
    blurb="Work the dealing queue: funding checks, cut-off, and allotment before the NAV is locked."
    seedRows={[
      { id: 'PND-1204', clientName: 'Weerathungage Arani Sehansa', clientCode: 'CLT-000128', fundName: 'Equity Growth Fund', type: 'Purchase', amount: 850000, units: 33398.82, tradeDate: '2026-08-21', reason: 'Awaiting funds', status: 'Pending', notes: 'Cheque uncleared' },
      { id: 'PND-1201', clientName: 'Family Trust – Growth', clientCode: 'CLT-000389', fundName: 'Index Fund', type: 'Switch', amount: 620000, units: 19284.6, tradeDate: '2026-08-21', reason: 'Cut-off', status: 'Queued', notes: '' },
      { id: 'PND-1198', clientName: 'Omega Holdings (Pvt) Ltd', clientCode: 'CLT-000257', fundName: 'Money Market Fund', type: 'Redemption', amount: 4500000, units: 4500000, tradeDate: '2026-08-20', reason: 'Compliance hold', status: 'Watch', notes: 'Large redemption notice' },
    ]}
    stats={(rows) => [
      { k: 'Queue value', v: formatMoney(rows.reduce((s, r) => s + r.amount, 0)), m: 'Not yet allotted', focus: true },
      { k: 'Items', v: rows.length, m: 'Open queue' },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'Ops action' },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: 'Compliance' },
    ]}
    statusTabs={['All', 'Pending', 'Queued', 'Watch']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'clientName', 'fundName', 'reason']}
    columns={[
      { key: 'id', label: 'Queue #' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'type', label: 'Type' },
      { key: 'fundName', label: 'Fund' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'reason', label: 'Hold' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Pending queue"
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Units', get: (r) => formatUnits(r.units) },
      { k: 'Hold reason', get: (r) => r.reason },
      { k: 'Trade date', get: (r) => r.tradeDate },
    ]}
    statusActions={{
      Pending: [
        { label: 'Release to allotment', status: 'Queued', variant: 'solid' },
        { label: 'Send to watch', status: 'Watch', variant: 'ghost' },
      ],
      Queued: [{ label: 'Mark pending', status: 'Pending', variant: 'ghost' }],
      Watch: [{ label: 'Release', status: 'Pending', variant: 'solid' }],
    }}
  />
);

export default PendingTransactions;
