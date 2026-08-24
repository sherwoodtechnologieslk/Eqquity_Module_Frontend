import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const FundPricing = () => (
  <WealthOpsWorkbench
    title="Fund Pricing"
    blurb="Publish bid, offer, and dealing NAVs for each fund. Prices lock at the dealing cut-off."
    newLabel="Publish price"
    formTitle="New price publication"
    formHint="Offer includes the front-end load. Bid is NAV less exit load where applicable."
    initialForm={{
      fundId: FUNDS[0].id,
      priceDate: todayISO(),
      nav: '',
      bid: '',
      offer: '',
      notes: '',
    }}
    formFields={[
      {
        name: 'fundId',
        label: 'Fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'priceDate', label: 'Price date', type: 'date' },
      { name: 'nav', label: 'Dealing NAV', type: 'number', min: 0, step: '0.0001' },
      { name: 'bid', label: 'Bid', type: 'number', min: 0, step: '0.0001' },
      { name: 'offer', label: 'Offer', type: 'number', min: 0, step: '0.0001' },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return `${fund.name} · NAV ${formatMoney(parseFloat(form.nav) || 0)}`;
    }}
    validateForm={(form) => ((parseFloat(form.nav) || 0) <= 0 ? 'Enter a dealing NAV.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      const nav = parseFloat(form.nav) || 0;
      return {
        id: `PRC-${form.priceDate}-${fund.id}`,
        fundId: fund.id,
        fundName: fund.name,
        priceDate: form.priceDate,
        nav,
        bid: parseFloat(form.bid) || nav,
        offer: parseFloat(form.offer) || nav,
        spread: ((parseFloat(form.offer) || nav) - (parseFloat(form.bid) || nav)) / nav * 100,
        change: 0.12,
        status: 'Published',
        notes: form.notes,
        createdBy: 'Pricing Desk',
      };
    }}
    seedRows={FUNDS.map((fund, i) => ({
      id: `PRC-2026-08-21-${fund.id}`,
      fundId: fund.id,
      fundName: fund.name,
      priceDate: '2026-08-21',
      nav: fund.nav,
      bid: +(fund.nav * 0.997).toFixed(4),
      offer: +(fund.nav * 1.005).toFixed(4),
      spread: 0.8,
      change: [0.42, 0.18, 0.05, 0.01, 0.61][i],
      status: i === 0 ? 'Locked' : 'Published',
      notes: i === 0 ? 'Locked pending late trade rec' : '',
      createdBy: 'Pricing Desk',
    }))}
    stats={(rows) => [
      { k: 'Funds priced', v: rows.length, m: 'Today’s dealing book', focus: true },
      { k: 'Published', v: rows.filter((r) => r.status === 'Published').length, m: 'Live for dealing' },
      { k: 'Locked', v: rows.filter((r) => r.status === 'Locked').length, m: 'Awaiting sign-off' },
      { k: 'Avg spread', v: `${(rows.reduce((s, r) => s + r.spread, 0) / (rows.length || 1)).toFixed(2)}%`, m: 'Bid–offer' },
    ]}
    statusTabs={['All', 'Published', 'Locked', 'Draft']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName', 'fundId']}
    columns={[
      { key: 'fundName', label: 'Fund', sub: 'fundId' },
      { key: 'priceDate', label: 'Date' },
      { key: 'nav', label: 'NAV', render: (r) => formatMoney(r.nav) },
      { key: 'bid', label: 'Bid', render: (r) => formatMoney(r.bid) },
      { key: 'offer', label: 'Offer', render: (r) => formatMoney(r.offer) },
      { key: 'change', label: 'Δ', render: (r) => <span className={r.change >= 0 ? 'wos-up' : 'wos-down'}>{r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%</span> },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Dealing prices"
    detailSubtitle={(r) => `${r.fundName} · ${r.priceDate}`}
    detailFields={[
      { k: 'Dealing NAV', get: (r) => formatMoney(r.nav) },
      { k: 'Bid', get: (r) => formatMoney(r.bid) },
      { k: 'Offer', get: (r) => formatMoney(r.offer) },
      { k: 'Spread', get: (r) => `${r.spread.toFixed(2)}%` },
      { k: 'Change', get: (r) => `${r.change >= 0 ? '+' : ''}${r.change.toFixed(2)}%` },
      { k: 'Published by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Draft: [{ label: 'Publish', status: 'Published', variant: 'solid' }],
      Published: [{ label: 'Lock', status: 'Locked', variant: 'ghost' }],
      Locked: [{ label: 'Unlock', status: 'Published', variant: 'ghost' }],
    }}
  />
);

export default FundPricing;
