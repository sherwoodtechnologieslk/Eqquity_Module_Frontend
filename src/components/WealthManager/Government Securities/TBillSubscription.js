import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const TENORS = ['91-day', '182-day', '364-day'];

const TBillSubscription = () => (
  <WealthOpsWorkbench
    title="T-Bill Subscription"
    blurb="Capture CBSL treasury-bill auction bids for wealth books, then track allotment against the competitive / non-competitive split."
    newLabel="Submit bid"
    formTitle="New T-bill bid"
    formHint="Bids must be in multiples of LKR 1,000,000 face. Cut-off is 11:00 on auction day."
    initialForm={{
      fundId: 'MMF',
      tenor: '91-day',
      auctionDate: todayISO(),
      face: '',
      yield: '',
      bidType: 'Competitive',
      notes: '',
    }}
    formFields={[
      {
        name: 'fundId',
        label: 'Book',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: f.name })),
      },
      { name: 'tenor', label: 'Tenor', type: 'select', options: TENORS },
      { name: 'auctionDate', label: 'Auction date', type: 'date' },
      { name: 'face', label: 'Face value (LKR)', type: 'number', min: 0, step: '1000000', placeholder: '1000000' },
      { name: 'yield', label: 'Bid yield %', type: 'number', min: 0, step: '0.01', placeholder: '9.10' },
      { name: 'bidType', label: 'Bid type', type: 'select', options: ['Competitive', 'Non-competitive'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const face = parseFloat(form.face) || 0;
      return `${form.tenor} · ${formatMoney(face)} face @ ${form.yield || '—'}%`;
    }}
    validateForm={(form) => ((parseFloat(form.face) || 0) < 1_000_000 ? 'Minimum bid is LKR 1,000,000 face.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[3];
      const face = parseFloat(form.face) || 0;
      return {
        id: `TB-${form.auctionDate.replace(/-/g, '')}-${String(rows.length + 1).padStart(2, '0')}`,
        fundName: fund.name,
        tenor: form.tenor,
        auctionDate: form.auctionDate,
        face,
        yield: parseFloat(form.yield) || 0,
        bidType: form.bidType,
        allotted: 0,
        status: 'Pending',
        notes: form.notes,
        createdBy: 'Treasury Desk',
      };
    }}
    seedRows={[
      {
        id: 'TB-20260821-01',
        fundName: 'Money Market Fund',
        tenor: '91-day',
        auctionDate: '2026-08-21',
        face: 250_000_000,
        yield: 9.12,
        bidType: 'Competitive',
        allotted: 250_000_000,
        status: 'Allotted',
        notes: 'Full allotment',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'TB-20260821-02',
        fundName: 'Fixed Income Fund',
        tenor: '182-day',
        auctionDate: '2026-08-21',
        face: 100_000_000,
        yield: 9.4,
        bidType: 'Competitive',
        allotted: 60_000_000,
        status: 'Allotted',
        notes: 'Partial — cut-off 9.38%',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'TB-20260814-01',
        fundName: 'Money Market Fund',
        tenor: '364-day',
        auctionDate: '2026-08-14',
        face: 80_000_000,
        yield: 9.95,
        bidType: 'Competitive',
        allotted: 0,
        status: 'Rejected',
        notes: 'Above cut-off 9.88%',
        createdBy: 'Treasury Desk',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Bid face',
        v: formatMoney(rows.reduce((s, r) => s + r.face, 0)),
        m: 'Submitted',
        focus: true,
      },
      { k: 'Allotted', v: formatMoney(rows.reduce((s, r) => s + r.allotted, 0)), m: 'Won at auction' },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'Awaiting result' },
      { k: 'Rejected', v: rows.filter((r) => r.status === 'Rejected').length, m: 'Above cut-off' },
    ]}
    statusTabs={['All', 'Pending', 'Allotted', 'Rejected']}
    extraFilter={{ key: 'tenor', label: 'Tenor' }}
    searchKeys={['id', 'fundName', 'tenor']}
    columns={[
      { key: 'id', label: 'Bid' },
      { key: 'fundName', label: 'Book' },
      { key: 'tenor', label: 'Tenor' },
      { key: 'face', label: 'Face', render: (r) => formatMoney(r.face) },
      { key: 'yield', label: 'Yield', render: (r) => `${r.yield.toFixed(2)}%` },
      { key: 'auctionDate', label: 'Auction' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Auction book"
    detailFields={[
      { k: 'Face bid', get: (r) => formatMoney(r.face) },
      { k: 'Allotted', get: (r) => formatMoney(r.allotted) },
      { k: 'Bid yield', get: (r) => `${r.yield.toFixed(2)}%` },
      { k: 'Type', get: (r) => r.bidType },
      { k: 'Auction date', get: (r) => r.auctionDate },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Pending: [
        { label: 'Mark allotted', status: 'Allotted', variant: 'solid' },
        { label: 'Reject', status: 'Rejected', variant: 'danger' },
      ],
    }}
  />
);

export default TBillSubscription;
