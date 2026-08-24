import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney } from '../shared/wealthOpsKit';

const TransactionApproval = () => (
  <WealthOpsWorkbench
    title="Transaction Approval"
    blurb="Maker–checker queue for deals above mandate limits, related-party switches, and large redemptions."
    seedRows={[
      { id: 'APR-441', clientName: 'Omega Holdings (Pvt) Ltd', clientCode: 'CLT-000257', fundName: 'Money Market Fund', type: 'Redemption', amount: 12000000, maker: 'Corporate Coverage', submitted: '2026-08-21 09:14', status: 'In review', notes: 'Above LKR 10M four-eye rule' },
      { id: 'APR-438', clientName: 'Family Trust – Growth', clientCode: 'CLT-000389', fundName: 'Equity Growth Fund', type: 'Switch', amount: 1500000, maker: 'Client Portal', submitted: '2026-08-20 16:02', status: 'Approved', notes: '' },
      { id: 'APR-432', clientName: 'Sunrise Foundation', clientCode: 'CLT-000441', fundName: 'Index Fund', type: 'Purchase', amount: 900000, maker: 'Call Centre', submitted: '2026-08-19 11:40', status: 'Rejected', notes: 'Source-of-funds pack incomplete' },
    ]}
    stats={(rows) => [
      { k: 'Awaiting checker', v: formatMoney(rows.filter((r) => r.status === 'In review').reduce((s, r) => s + r.amount, 0)), m: 'In review', focus: true },
      { k: 'Items', v: rows.length, m: 'Approval book' },
      { k: 'Approved', v: rows.filter((r) => r.status === 'Approved').length, m: 'Released' },
      { k: 'Rejected', v: rows.filter((r) => r.status === 'Rejected').length, m: 'Returned' },
    ]}
    statusTabs={['All', 'In review', 'Approved', 'Rejected']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'clientName', 'maker', 'fundName']}
    columns={[
      { key: 'id', label: 'Approval' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'maker', label: 'Maker' },
      { key: 'submitted', label: 'Submitted' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Four-eye queue"
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Fund', get: (r) => r.fundName },
      { k: 'Maker', get: (r) => r.maker },
      { k: 'Submitted', get: (r) => r.submitted },
    ]}
    statusActions={{
      'In review': [
        { label: 'Approve', status: 'Approved', variant: 'solid' },
        { label: 'Reject', status: 'Rejected', variant: 'danger' },
      ],
    }}
  />
);

export default TransactionApproval;
