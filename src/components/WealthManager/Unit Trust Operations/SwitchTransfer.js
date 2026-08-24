import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { CLIENTS, FUNDS, CHANNELS, formatMoney, formatUnits, todayISO } from '../shared/wealthOpsKit';

const SwitchTransfer = () => (
  <WealthOpsWorkbench
    title="Switch / Transfer"
    blurb="Move units between funds or transfer holdings between client accounts without a cash settlement."
    newLabel="Submit switch"
    formTitle="New switch / transfer"
    formHint="Switches use the same-day dealing NAV on both legs."
    initialForm={{
      clientCode: CLIENTS[0].code,
      fromFundId: 'EGF',
      toFundId: 'BIF',
      amount: '',
      tradeDate: todayISO(),
      channel: CHANNELS[0],
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
        name: 'fromFundId',
        label: 'From fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      {
        name: 'toFundId',
        label: 'To fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'amount', label: 'Switch amount (LKR)', type: 'number', min: 0, step: '0.01' },
      { name: 'tradeDate', label: 'Trade date', type: 'date' },
      { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const from = FUNDS.find((f) => f.id === form.fromFundId) || FUNDS[0];
      const to = FUNDS.find((f) => f.id === form.toFundId) || FUNDS[1];
      const amount = parseFloat(form.amount) || 0;
      return `${formatUnits(amount / from.nav)} out · ${formatUnits(amount / to.nav)} in`;
    }}
    validateForm={(form) => {
      if ((parseFloat(form.amount) || 0) <= 0) return 'Enter a valid switch amount.';
      if (form.fromFundId === form.toFundId) return 'From and to funds must be different.';
      return '';
    }}
    buildRow={(form, rows) => {
      const from = FUNDS.find((f) => f.id === form.fromFundId) || FUNDS[0];
      const to = FUNDS.find((f) => f.id === form.toFundId) || FUNDS[1];
      const client = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[0];
      const amount = parseFloat(form.amount) || 0;
      return {
        id: `SWT-${new Date().getFullYear()}-${String(140 + rows.length + 1).padStart(5, '0')}`,
        clientCode: client.code,
        clientName: client.name,
        fromFund: from.name,
        toFund: to.name,
        amount,
        outUnits: amount / from.nav,
        inUnits: amount / to.nav,
        tradeDate: form.tradeDate,
        channel: form.channel,
        status: 'Pending',
        notes: form.notes,
        createdBy: 'Sherwood Wealth Team',
      };
    }}
    seedRows={[
      {
        id: 'SWT-2026-00144',
        clientCode: 'CLT-000128',
        clientName: 'Weerathungage Arani Sehansa',
        fromFund: 'Equity Growth Fund',
        toFund: 'Balanced Income Fund',
        amount: 1500000,
        outUnits: 58939.0963,
        inUnits: 79281.1839,
        tradeDate: '2026-08-19',
        channel: 'RM Assisted',
        status: 'Pending',
        notes: 'Rebalance toward income sleeve',
        createdBy: 'Sherwood Wealth Team',
      },
      {
        id: 'SWT-2026-00140',
        clientCode: 'CLT-000257',
        clientName: 'Omega Holdings (Pvt) Ltd',
        fromFund: 'Money Market Fund',
        toFund: 'Fixed Income Fund',
        amount: 8000000,
        outUnits: 8000000,
        inUnits: 780487.8049,
        tradeDate: '2026-08-16',
        channel: 'Branch',
        status: 'Completed',
        notes: '',
        createdBy: 'Corporate Coverage',
      },
      {
        id: 'SWT-2026-00136',
        clientCode: 'CLT-000389',
        clientName: 'Family Trust – Growth',
        fromFund: 'Index Fund',
        toFund: 'Equity Growth Fund',
        amount: 620000,
        outUnits: 19284.6034,
        inUnits: 24361.4931,
        tradeDate: '2026-08-11',
        channel: 'Client Portal',
        status: 'Rejected',
        notes: 'Cut-off missed',
        createdBy: 'Client Portal',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Switch value',
        v: formatMoney(rows.filter((r) => r.status !== 'Rejected').reduce((s, r) => s + r.amount, 0)),
        m: 'Excluding rejected',
        focus: true,
      },
      { k: 'Instructions', v: rows.length, m: 'All switches' },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'Awaiting allotment' },
      { k: 'Completed', v: rows.filter((r) => r.status === 'Completed').length, m: 'Both legs booked' },
    ]}
    statusTabs={['All', 'Pending', 'Completed', 'Rejected']}
    extraFilter={{ key: 'fromFund', label: 'From fund' }}
    searchKeys={['id', 'clientName', 'fromFund', 'toFund']}
    searchPlaceholder="Search switch, client, fund…"
    columns={[
      { key: 'id', label: 'Switch' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'fromFund', label: 'From' },
      { key: 'toFund', label: 'To' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'tradeDate', label: 'Trade date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Switch book"
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Units out', get: (r) => formatUnits(r.outUnits) },
      { k: 'Units in', get: (r) => formatUnits(r.inUnits) },
      { k: 'Channel', get: (r) => r.channel },
      { k: 'Trade date', get: (r) => r.tradeDate },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Pending: [
        { label: 'Complete both legs', status: 'Completed', variant: 'solid' },
        { label: 'Reject', status: 'Rejected', variant: 'danger' },
      ],
    }}
  />
);

export default SwitchTransfer;
