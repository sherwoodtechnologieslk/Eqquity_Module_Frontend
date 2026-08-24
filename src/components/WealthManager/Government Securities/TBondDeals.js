import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const TBondDeals = () => (
  <WealthOpsWorkbench
    title="T-Bond Deals"
    blurb="Secondary-market treasury-bond purchases and sales for wealth books, against CBSL / dealer quotes."
    newLabel="Book deal"
    formTitle="New T-bond deal"
    formHint="Settles T+2 versus LankaSettle. Price is clean; accrued is calculated to value date."
    initialForm={{
      fundId: 'FIF',
      isin: 'LKB01528C157',
      side: 'Buy',
      face: '',
      price: '',
      yield: '',
      tradeDate: todayISO(),
      counterparty: 'Primary dealer',
      notes: '',
    }}
    formFields={[
      {
        name: 'fundId',
        label: 'Book',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: f.name })),
      },
      {
        name: 'isin',
        label: 'ISIN',
        type: 'select',
        options: [
          { value: 'LKB01528C157', label: 'LKB01528C157 — 2y 9.50%' },
          { value: 'LKB02030A152', label: 'LKB02030A152 — 5y 10.25%' },
          { value: 'LKB01035A159', label: 'LKB01035A159 — 10y 11.00%' },
        ],
      },
      { name: 'side', label: 'Side', type: 'select', options: ['Buy', 'Sell'] },
      { name: 'face', label: 'Face value (LKR)', type: 'number', min: 0, step: '1000000' },
      { name: 'price', label: 'Clean price', type: 'number', min: 0, step: '0.01', placeholder: '99.50' },
      { name: 'yield', label: 'YTM %', type: 'number', min: 0, step: '0.01' },
      { name: 'tradeDate', label: 'Trade date', type: 'date' },
      {
        name: 'counterparty',
        label: 'Counterparty',
        type: 'select',
        options: ['Primary dealer', 'CBSL window', 'Bank treasury', 'Internal book'],
      },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const face = parseFloat(form.face) || 0;
      const price = parseFloat(form.price) || 0;
      const consideration = (face * price) / 100;
      return `${form.side} ${formatMoney(face)} · cons. ${formatMoney(consideration)}`;
    }}
    validateForm={(form) => ((parseFloat(form.face) || 0) <= 0 ? 'Enter a face value.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[2];
      const face = parseFloat(form.face) || 0;
      const price = parseFloat(form.price) || 0;
      return {
        id: `BD-${form.tradeDate.replace(/-/g, '')}-${String(40 + rows.length).padStart(3, '0')}`,
        fundName: fund.name,
        isin: form.isin,
        side: form.side,
        face,
        price,
        yield: parseFloat(form.yield) || 0,
        consideration: (face * price) / 100,
        tradeDate: form.tradeDate,
        counterparty: form.counterparty,
        status: 'Pending',
        notes: form.notes,
        createdBy: 'Treasury Desk',
      };
    }}
    seedRows={[
      {
        id: 'BD-20260820-041',
        fundName: 'Fixed Income Fund',
        isin: 'LKB01528C157',
        side: 'Buy',
        face: 50_000_000,
        price: 99.12,
        yield: 9.72,
        consideration: 49_560_000,
        tradeDate: '2026-08-20',
        counterparty: 'Primary dealer',
        status: 'Settled',
        notes: '',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'BD-20260819-038',
        fundName: 'Balanced Income Fund',
        isin: 'LKB02030A152',
        side: 'Buy',
        face: 30_000_000,
        price: 97.4,
        yield: 10.41,
        consideration: 29_220_000,
        tradeDate: '2026-08-19',
        counterparty: 'Bank treasury',
        status: 'Pending',
        notes: 'Awaiting LankaSettle',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'BD-20260812-033',
        fundName: 'Fixed Income Fund',
        isin: 'LKB01035A159',
        side: 'Sell',
        face: 15_000_000,
        price: 98.05,
        yield: 11.18,
        consideration: 14_707_500,
        tradeDate: '2026-08-12',
        counterparty: 'CBSL window',
        status: 'Settled',
        notes: 'Duration trim',
        createdBy: 'Treasury Desk',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Deal face',
        v: formatMoney(rows.reduce((s, r) => s + r.face, 0)),
        m: 'All deals in view',
        focus: true,
      },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'Unsettled' },
      { k: 'Settled', v: rows.filter((r) => r.status === 'Settled').length, m: 'T+2 complete' },
      { k: 'Buys', v: rows.filter((r) => r.side === 'Buy').length, m: 'Purchase tickets' },
    ]}
    statusTabs={['All', 'Pending', 'Settled', 'Cancelled']}
    extraFilter={{ key: 'side', label: 'Side' }}
    searchKeys={['id', 'isin', 'fundName', 'counterparty']}
    columns={[
      { key: 'id', label: 'Deal' },
      { key: 'isin', label: 'ISIN' },
      { key: 'side', label: 'Side' },
      { key: 'fundName', label: 'Book' },
      { key: 'face', label: 'Face', render: (r) => formatMoney(r.face) },
      { key: 'price', label: 'Price', render: (r) => r.price.toFixed(2) },
      { key: 'tradeDate', label: 'Trade date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Bond blotter"
    detailFields={[
      { k: 'Consideration', get: (r) => formatMoney(r.consideration) },
      { k: 'YTM', get: (r) => `${r.yield.toFixed(2)}%` },
      { k: 'Counterparty', get: (r) => r.counterparty },
      { k: 'Trade date', get: (r) => r.tradeDate },
      { k: 'Side', get: (r) => r.side },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Pending: [
        { label: 'Mark settled', status: 'Settled', variant: 'solid' },
        { label: 'Cancel', status: 'Cancelled', variant: 'danger' },
      ],
    }}
  />
);

export default TBondDeals;
