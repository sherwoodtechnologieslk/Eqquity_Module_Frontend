import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { CLIENTS, FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const SIP = () => (
  <WealthOpsWorkbench
    title="Systematic Investment Plan (SIP)"
    blurb="Set up recurring unit trust purchases on a standing mandate, then pause, skip, or resume cycles."
    newLabel="Create SIP"
    formTitle="New SIP mandate"
    formHint="Debits run on the selected frequency against the registered bank mandate."
    initialForm={{
      clientCode: CLIENTS[0].code,
      fundId: FUNDS[0].id,
      amount: '',
      frequency: 'Monthly',
      startDate: todayISO(),
      debitDay: '5',
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
      { name: 'amount', label: 'Installment (LKR)', type: 'number', min: 0, step: '0.01' },
      {
        name: 'frequency',
        label: 'Frequency',
        type: 'select',
        options: ['Weekly', 'Monthly', 'Quarterly'],
      },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'debitDay', label: 'Debit day', type: 'number', min: 1, max: 28 },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const amount = parseFloat(form.amount) || 0;
      const annual = form.frequency === 'Weekly' ? amount * 52 : form.frequency === 'Quarterly' ? amount * 4 : amount * 12;
      return `${formatMoney(amount)} ${String(form.frequency || '').toLowerCase()} · ~${formatMoney(annual)} / year`;
    }}
    validateForm={(form) => ((parseFloat(form.amount) || 0) <= 0 ? 'Enter a valid installment.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      const client = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[0];
      return {
        id: `SIP-${String(80 + rows.length + 1).padStart(4, '0')}`,
        clientCode: client.code,
        clientName: client.name,
        fundName: fund.name,
        amount: parseFloat(form.amount) || 0,
        frequency: form.frequency,
        startDate: form.startDate,
        nextRun: form.startDate,
        debitDay: form.debitDay,
        cycles: 0,
        status: 'Active',
        notes: form.notes,
        createdBy: 'Sherwood Wealth Team',
      };
    }}
    seedRows={[
      {
        id: 'SIP-0084',
        clientCode: 'CLT-000128',
        clientName: 'Weerathungage Arani Sehansa',
        fundName: 'Equity Growth Fund',
        amount: 50000,
        frequency: 'Monthly',
        startDate: '2025-01-05',
        nextRun: '2026-09-05',
        debitDay: '5',
        cycles: 20,
        status: 'Active',
        notes: 'Core equity accumulation',
        createdBy: 'Sherwood Wealth Team',
      },
      {
        id: 'SIP-0071',
        clientCode: 'CLT-000412',
        clientName: 'Nimal Perera – Retirement',
        fundName: 'Balanced Income Fund',
        amount: 25000,
        frequency: 'Monthly',
        startDate: '2024-06-10',
        nextRun: '2026-09-10',
        debitDay: '10',
        cycles: 26,
        status: 'Paused',
        notes: 'Paused at client request',
        createdBy: 'Private Client Desk',
      },
      {
        id: 'SIP-0066',
        clientCode: 'CLT-000257',
        clientName: 'Omega Holdings (Pvt) Ltd',
        fundName: 'Money Market Fund',
        amount: 2000000,
        frequency: 'Weekly',
        startDate: '2026-04-01',
        nextRun: '2026-08-25',
        debitDay: '1',
        cycles: 21,
        status: 'Active',
        notes: 'Treasury sweep',
        createdBy: 'Corporate Coverage',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Active SIP book',
        v: formatMoney(rows.filter((r) => r.status === 'Active').reduce((s, r) => s + r.amount, 0)),
        m: 'Next cycle installment total',
        focus: true,
      },
      { k: 'Mandates', v: rows.length, m: 'All SIPs' },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Debiting' },
      { k: 'Paused', v: rows.filter((r) => r.status === 'Paused').length, m: 'On hold' },
    ]}
    statusTabs={['All', 'Active', 'Paused', 'Stopped']}
    extraFilter={{ key: 'frequency', label: 'Frequency' }}
    searchKeys={['id', 'clientName', 'fundName']}
    columns={[
      { key: 'id', label: 'SIP' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'fundName', label: 'Fund' },
      { key: 'amount', label: 'Installment', render: (r) => formatMoney(r.amount) },
      { key: 'frequency', label: 'Frequency' },
      { key: 'nextRun', label: 'Next run' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="SIP mandates"
    detailFields={[
      { k: 'Installment', get: (r) => formatMoney(r.amount) },
      { k: 'Frequency', get: (r) => r.frequency },
      { k: 'Debit day', get: (r) => r.debitDay },
      { k: 'Start date', get: (r) => r.startDate },
      { k: 'Next run', get: (r) => r.nextRun },
      { k: 'Cycles completed', get: (r) => r.cycles },
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

export default SIP;
