import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney } from '../shared/wealthOpsKit';

const GSecSettlements = () => (
  <WealthOpsWorkbench
    title="G-Sec Settlements"
    blurb="LankaSettle tickets for T-bill allotments, bond trades, coupons, and repo unwind — matching versus trustee cash."
    seedRows={[
      {
        id: 'SET-8841',
        ref: 'TB-20260821-01',
        type: 'T-bill allotment',
        book: 'Money Market Fund',
        amount: 244_875_000,
        valueDate: '2026-08-22',
        csd: 'LankaSettle',
        status: 'Settled',
        notes: 'DvP versus CBSL',
        createdBy: 'Settlements',
      },
      {
        id: 'SET-8836',
        ref: 'BD-20260819-038',
        type: 'Bond purchase',
        book: 'Balanced Income Fund',
        amount: 29_220_000,
        valueDate: '2026-08-21',
        csd: 'LankaSettle',
        status: 'Pending',
        notes: 'Awaiting dealer confirmation',
        createdBy: 'Settlements',
      },
      {
        id: 'SET-8829',
        ref: 'RP-074',
        type: 'Repo start',
        book: 'Money Market Fund',
        amount: 80_000_000,
        valueDate: '2026-08-21',
        csd: 'LankaSettle',
        status: 'Settled',
        notes: '',
        createdBy: 'Settlements',
      },
      {
        id: 'SET-8822',
        ref: 'MAT-20260815-CPN',
        type: 'Coupon',
        book: 'Fixed Income Fund',
        amount: 4_612_500,
        valueDate: '2026-08-15',
        csd: 'Trustee cash',
        status: 'Failed',
        notes: 'Repaired — SSI mismatch, resubmitted',
        createdBy: 'Settlements',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Pending value',
        v: formatMoney(rows.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.amount, 0)),
        m: 'Not yet DvP',
        focus: true,
      },
      { k: 'Tickets', v: rows.length, m: 'In view' },
      { k: 'Settled', v: rows.filter((r) => r.status === 'Settled').length, m: 'Complete' },
      { k: 'Failed', v: rows.filter((r) => r.status === 'Failed').length, m: 'Need repair' },
    ]}
    statusTabs={['All', 'Pending', 'Settled', 'Failed']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'ref', 'type', 'book']}
    columns={[
      { key: 'id', label: 'Ticket' },
      { key: 'ref', label: 'Source' },
      { key: 'type', label: 'Type' },
      { key: 'book', label: 'Book' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'valueDate', label: 'Value date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Settlement queue"
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'CSD / cash', get: (r) => r.csd },
      { k: 'Value date', get: (r) => r.valueDate },
      { k: 'Source', get: (r) => r.ref },
      { k: 'Book', get: (r) => r.book },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Pending: [
        { label: 'Mark settled', status: 'Settled', variant: 'solid' },
        { label: 'Fail', status: 'Failed', variant: 'danger' },
      ],
      Failed: [{ label: 'Retry', status: 'Pending', variant: 'ghost' }],
    }}
  />
);

export default GSecSettlements;
