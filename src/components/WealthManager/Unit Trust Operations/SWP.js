import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { CLIENTS, FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const SWP = () => (
  <WealthOpsWorkbench
    title="Systematic Withdrawal Plan (SWP)"
    blurb="Schedule recurring redemptions so clients can draw a regular income from unit trust holdings."
    newLabel="Create SWP"
    formTitle="New SWP mandate"
    formHint="Withdrawals allot at the dealing NAV on each run date and pay out T+1."
    initialForm={{
      clientCode: CLIENTS[3].code,
      fundId: FUNDS[2].id,
      amount: '',
      frequency: 'Monthly',
      startDate: todayISO(),
      notes: '',
    }}
    formFields={[
      {
        name: 'clientCode',
        label: 'Client',
        type: 'select',
        options: CLIENTS.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
      },
      {
        name: 'fundId',
        label: 'Fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'amount', label: 'Withdrawal (LKR)', type: 'number', min: 0, step: '0.01' },
      {
        name: 'frequency',
        label: 'Frequency',
        type: 'select',
        options: ['Monthly', 'Quarterly'],
      },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const amount = parseFloat(form.amount) || 0;
      const annual = form.frequency === 'Quarterly' ? amount * 4 : amount * 12;
      return `${formatMoney(amount)} ${String(form.frequency || '').toLowerCase()} · ~${formatMoney(annual)} / year`;
    }}
    validateForm={(form) => ((parseFloat(form.amount) || 0) <= 0 ? 'Enter a valid withdrawal amount.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[2];
      const client = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[3];
      return {
        id: `SWP-${String(40 + rows.length + 1).padStart(4, '0')}`,
        clientCode: client.code,
        clientName: client.name,
        fundName: fund.name,
        amount: parseFloat(form.amount) || 0,
        frequency: form.frequency,
        startDate: form.startDate,
        nextRun: form.startDate,
        cycles: 0,
        status: 'Active',
        notes: form.notes,
        createdBy: 'Sherwood Wealth Team',
      };
    }}
    seedRows={[
      {
        id: 'SWP-0042',
        clientCode: 'CLT-000412',
        clientName: 'Nimal Perera – Retirement',
        fundName: 'Fixed Income Fund',
        amount: 35000,
        frequency: 'Monthly',
        startDate: '2025-09-01',
        nextRun: '2026-09-01',
        cycles: 12,
        status: 'Active',
        notes: 'Retirement income drawdown',
        createdBy: 'Private Client Desk',
      },
      {
        id: 'SWP-0038',
        clientCode: 'CLT-000389',
        clientName: 'Family Trust – Growth',
        fundName: 'Balanced Income Fund',
        amount: 120000,
        frequency: 'Quarterly',
        startDate: '2026-01-15',
        nextRun: '2026-10-15',
        cycles: 3,
        status: 'Active',
        notes: '',
        createdBy: 'Sherwood Wealth Team',
      },
      {
        id: 'SWP-0029',
        clientCode: 'CLT-000128',
        clientName: 'Weerathungage Arani Sehansa',
        fundName: 'Money Market Fund',
        amount: 20000,
        frequency: 'Monthly',
        startDate: '2026-03-01',
        nextRun: '2026-08-01',
        cycles: 5,
        status: 'Stopped',
        notes: 'Stopped after lump-sum top-up',
        createdBy: 'Client Portal',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Active SWP book',
        v: formatMoney(rows.filter((r) => r.status === 'Active').reduce((s, r) => s + r.amount, 0)),
        m: 'Next cycle payouts',
        focus: true,
      },
      { k: 'Mandates', v: rows.length, m: 'All SWPs' },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Paying' },
      { k: 'Stopped', v: rows.filter((r) => r.status === 'Stopped').length, m: 'Closed' },
    ]}
    statusTabs={['All', 'Active', 'Paused', 'Stopped']}
    extraFilter={{ key: 'frequency', label: 'Frequency' }}
    searchKeys={['id', 'clientName', 'fundName']}
    columns={[
      { key: 'id', label: 'SWP' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'fundName', label: 'Fund' },
      { key: 'amount', label: 'Withdrawal', render: (r) => formatMoney(r.amount) },
      { key: 'frequency', label: 'Frequency' },
      { key: 'nextRun', label: 'Next run' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="SWP mandates"
    detailFields={[
      { k: 'Withdrawal', get: (r) => formatMoney(r.amount) },
      { k: 'Frequency', get: (r) => r.frequency },
      { k: 'Start date', get: (r) => r.startDate },
      { k: 'Next run', get: (r) => r.nextRun },
      { k: 'Cycles completed', get: (r) => r.cycles },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Active: [
        { label: 'Pause', status: 'Paused', variant: 'ghost' },
        { label: 'Stop', status: 'Stopped', variant: 'danger' },
      ],
      Paused: [{ label: 'Resume', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default SWP;
