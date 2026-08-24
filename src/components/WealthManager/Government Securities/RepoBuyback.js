import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney, todayISO } from '../shared/wealthOpsKit';

const RepoBuyback = () => (
  <WealthOpsWorkbench
    title="Repo & Buyback"
    blurb="Repo, reverse-repo, and CBSL buyback tickets against gilt collateral held in wealth books."
    newLabel="New ticket"
    formTitle="New repo / buyback"
    formHint="Haircut and rate follow the overnight CBSL standing facility unless overridden."
    initialForm={{
      type: 'Repo',
      book: 'Money Market Fund',
      collateral: 'LKB01026C153',
      face: '',
      rate: '',
      startDate: todayISO(),
      endDate: todayISO(),
      counterparty: 'CBSL',
      notes: '',
    }}
    formFields={[
      { name: 'type', label: 'Type', type: 'select', options: ['Repo', 'Reverse repo', 'Buyback'] },
      {
        name: 'book',
        label: 'Book',
        type: 'select',
        options: ['Money Market Fund', 'Fixed Income Fund', 'Balanced Income Fund'],
      },
      {
        name: 'collateral',
        label: 'Collateral',
        type: 'select',
        options: ['LKB01026C153', 'LKB01026F151', 'LKB01528C157', 'LKB02030A152'],
      },
      { name: 'face', label: 'Face / notional (LKR)', type: 'number', min: 0, step: '1000000' },
      { name: 'rate', label: 'Rate %', type: 'number', min: 0, step: '0.01' },
      { name: 'startDate', label: 'Start', type: 'date' },
      { name: 'endDate', label: 'End / maturity', type: 'date' },
      {
        name: 'counterparty',
        label: 'Counterparty',
        type: 'select',
        options: ['CBSL', 'Primary dealer', 'Bank treasury'],
      },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.type} · ${formatMoney(parseFloat(form.face) || 0)} @ ${form.rate || '—'}%`}
    validateForm={(form) => ((parseFloat(form.face) || 0) <= 0 ? 'Enter a notional.' : '')}
    buildRow={(form, rows) => ({
      id: `RP-${String(70 + rows.length + 1)}`,
      type: form.type,
      book: form.book,
      collateral: form.collateral,
      face: parseFloat(form.face) || 0,
      rate: parseFloat(form.rate) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      counterparty: form.counterparty,
      status: 'Open',
      notes: form.notes,
      createdBy: 'Treasury Desk',
    })}
    seedRows={[
      {
        id: 'RP-074',
        type: 'Repo',
        book: 'Money Market Fund',
        collateral: 'LKB01026C153',
        face: 80_000_000,
        rate: 8.25,
        startDate: '2026-08-21',
        endDate: '2026-08-22',
        counterparty: 'CBSL',
        status: 'Open',
        notes: 'Overnight standing facility',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'RP-071',
        type: 'Reverse repo',
        book: 'Fixed Income Fund',
        collateral: 'LKB01528C157',
        face: 40_000_000,
        rate: 8.4,
        startDate: '2026-08-18',
        endDate: '2026-08-25',
        counterparty: 'Primary dealer',
        status: 'Open',
        notes: '',
        createdBy: 'Treasury Desk',
      },
      {
        id: 'RP-066',
        type: 'Buyback',
        book: 'Fixed Income Fund',
        collateral: 'LKB02030A152',
        face: 15_000_000,
        rate: 10.15,
        startDate: '2026-08-12',
        endDate: '2026-08-12',
        counterparty: 'CBSL',
        status: 'Completed',
        notes: 'CBSL switch auction',
        createdBy: 'Treasury Desk',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Open notional',
        v: formatMoney(rows.filter((r) => r.status === 'Open').reduce((s, r) => s + r.face, 0)),
        m: 'Live tickets',
        focus: true,
      },
      { k: 'Tickets', v: rows.length, m: 'In view' },
      { k: 'Open', v: rows.filter((r) => r.status === 'Open').length, m: 'Not yet unwound' },
      { k: 'Completed', v: rows.filter((r) => r.status === 'Completed').length, m: 'Closed' },
    ]}
    statusTabs={['All', 'Open', 'Completed', 'Cancelled']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'type', 'book', 'collateral', 'counterparty']}
    columns={[
      { key: 'id', label: 'Ticket' },
      { key: 'type', label: 'Type' },
      { key: 'book', label: 'Book' },
      { key: 'collateral', label: 'Collateral' },
      { key: 'face', label: 'Notional', render: (r) => formatMoney(r.face) },
      { key: 'rate', label: 'Rate', render: (r) => `${r.rate.toFixed(2)}%` },
      { key: 'endDate', label: 'End' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Repo book"
    detailFields={[
      { k: 'Notional', get: (r) => formatMoney(r.face) },
      { k: 'Rate', get: (r) => `${r.rate.toFixed(2)}%` },
      { k: 'Start / end', get: (r) => `${r.startDate} → ${r.endDate}` },
      { k: 'Counterparty', get: (r) => r.counterparty },
      { k: 'Collateral', get: (r) => r.collateral },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Open: [
        { label: 'Unwind', status: 'Completed', variant: 'solid' },
        { label: 'Cancel', status: 'Cancelled', variant: 'danger' },
      ],
    }}
  />
);

export default RepoBuyback;
