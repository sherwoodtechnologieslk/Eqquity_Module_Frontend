import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import {
  CLIENTS,
  FUNDS,
  CHANNELS,
  PAYMENT_METHODS,
  formatMoney,
  formatUnits,
  todayISO,
} from '../shared/wealthOpsKit';

const Redemption = () => (
  <WealthOpsWorkbench
    title="Redemption"
    blurb="Capture unit trust redemptions, check available units, and track payout status through to settlement."
    newLabel="Submit redemption"
    formTitle="New redemption instruction"
    formHint={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return `Indicative NAV ${formatMoney(fund.nav)} · payout in ${fund.currency}`;
    }}
    initialForm={{
      clientCode: CLIENTS[0].code,
      fundId: FUNDS[0].id,
      entryMode: 'amount',
      amount: '',
      units: '',
      tradeDate: todayISO(),
      valueDate: todayISO(),
      payoutMethod: PAYMENT_METHODS[0],
      payoutRef: '',
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
        name: 'fundId',
        label: 'Fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      {
        name: 'entryMode',
        label: 'Entry mode',
        type: 'select',
        options: [
          { value: 'amount', label: 'By amount' },
          { value: 'units', label: 'By units' },
        ],
      },
      { name: 'amount', label: 'Redemption amount (LKR)', type: 'number', min: 0, step: '0.01', placeholder: '0.00' },
      { name: 'tradeDate', label: 'Trade date', type: 'date' },
      { name: 'valueDate', label: 'Value date', type: 'date' },
      { name: 'payoutMethod', label: 'Payout method', type: 'select', options: PAYMENT_METHODS },
      { name: 'payoutRef', label: 'Payout reference', placeholder: 'e.g. BT-44102' },
      { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
      { name: 'notes', label: 'Notes', wide: true, placeholder: 'Optional instruction notes' },
    ]}
    estimate={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      const amount = parseFloat(form.amount) || 0;
      const units = fund.nav ? amount / fund.nav : 0;
      return `${formatMoney(amount)} · ${formatUnits(units)} units @ ${formatMoney(fund.nav)}`;
    }}
    validateForm={(form) => ((parseFloat(form.amount) || 0) <= 0 ? 'Enter a valid redemption amount.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      const client = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[0];
      const amount = parseFloat(form.amount) || 0;
      return {
        id: `RED-${new Date().getFullYear()}-${String(310 + rows.length + 1).padStart(5, '0')}`,
        clientCode: client.code,
        clientName: client.name,
        fundId: fund.id,
        fundName: fund.name,
        amount,
        units: amount / fund.nav,
        nav: fund.nav,
        currency: fund.currency,
        tradeDate: form.tradeDate,
        valueDate: form.valueDate,
        payoutMethod: form.payoutMethod,
        payoutRef: form.payoutRef || 'N/A',
        channel: form.channel,
        status: 'Pending',
        notes: form.notes,
        createdBy: 'Sherwood Wealth Team',
      };
    }}
    seedRows={[
      {
        id: 'RED-2026-00312',
        clientCode: 'CLT-000128',
        clientName: 'Weerathungage Arani Sehansa',
        fundId: 'EGF',
        fundName: 'Equity Growth Fund',
        amount: 850000,
        units: 33398.8212,
        nav: 25.45,
        currency: 'LKR',
        tradeDate: '2026-08-18',
        valueDate: '2026-08-19',
        payoutMethod: 'Bank Transfer',
        payoutRef: 'BT-99102',
        channel: 'RM Assisted',
        status: 'Pending',
        notes: 'Partial cash-out for property deposit',
        createdBy: 'Sherwood Wealth Team',
      },
      {
        id: 'RED-2026-00308',
        clientCode: 'CLT-000257',
        clientName: 'Omega Holdings (Pvt) Ltd',
        fundId: 'MMF',
        fundName: 'Money Market Fund',
        amount: 12000000,
        units: 12000000,
        nav: 1.0,
        currency: 'LKR',
        tradeDate: '2026-08-17',
        valueDate: '2026-08-17',
        payoutMethod: 'Internal Transfer',
        payoutRef: 'INT-77021',
        channel: 'Branch',
        status: 'Paid',
        notes: 'Treasury working-capital draw',
        createdBy: 'Corporate Coverage',
      },
      {
        id: 'RED-2026-00301',
        clientCode: 'CLT-000389',
        clientName: 'Family Trust – Growth',
        fundId: 'BIF',
        fundName: 'Balanced Income Fund',
        amount: 400000,
        units: 21141.649,
        nav: 18.92,
        currency: 'LKR',
        tradeDate: '2026-08-14',
        valueDate: '2026-08-15',
        payoutMethod: 'Cheque',
        payoutRef: 'CHQ-4411',
        channel: 'Client Portal',
        status: 'Processing',
        notes: '',
        createdBy: 'Client Portal',
      },
      {
        id: 'RED-2026-00294',
        clientCode: 'CLT-000412',
        clientName: 'Nimal Perera – Retirement',
        fundId: 'FIF',
        fundName: 'Fixed Income Fund',
        amount: 150000,
        units: 14634.1463,
        nav: 10.25,
        currency: 'LKR',
        tradeDate: '2026-08-12',
        valueDate: '2026-08-13',
        payoutMethod: 'Direct Debit',
        payoutRef: 'DD-2291',
        channel: 'Call Centre',
        status: 'Rejected',
        notes: 'Units held under lock-in',
        createdBy: 'Call Centre',
      },
    ]}
    stats={(rows) => {
      const pending = rows.filter((r) => r.status === 'Pending').length;
      const processing = rows.filter((r) => r.status === 'Processing').length;
      const paid = rows.filter((r) => r.status === 'Paid').length;
      const rejected = rows.filter((r) => r.status === 'Rejected').length;
      const pipeline = rows
        .filter((r) => r.status === 'Pending' || r.status === 'Processing')
        .reduce((s, r) => s + r.amount, 0);
      return [
        { k: 'In pipeline', v: formatMoney(pipeline), m: 'Pending + processing', focus: true },
        { k: 'Orders', v: rows.length, m: 'All redemptions' },
        { k: 'Pending', v: pending, m: 'Ready to process' },
        { k: 'Processing', v: processing, m: 'Payout in flight' },
        { k: 'Paid', v: paid, m: 'Settled to client' },
        { k: 'Rejected', v: rejected, m: 'Needs follow-up' },
      ];
    }}
    statusTabs={['All', 'Pending', 'Processing', 'Paid', 'Rejected']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'clientName', 'clientCode', 'fundName', 'payoutRef']}
    searchPlaceholder="Search order, client, fund…"
    columns={[
      { key: 'id', label: 'Order', sub: 'payoutRef' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'fundName', label: 'Fund' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount, r.currency) },
      { key: 'units', label: 'Units', render: (r) => formatUnits(r.units) },
      { key: 'tradeDate', label: 'Trade date' },
      { key: 'channel', label: 'Channel' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Redemption book"
    detailEyebrow="Instruction detail"
    detailSubtitle={(r) => `${r.clientName} · ${r.fundName}`}
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.amount, r.currency) },
      { k: 'Units', get: (r) => formatUnits(r.units) },
      { k: 'NAV', get: (r) => formatMoney(r.nav, r.currency) },
      { k: 'Payout', get: (r) => r.payoutMethod },
      { k: 'Trade / value', get: (r) => `${r.tradeDate} → ${r.valueDate}` },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Pending: [
        { label: 'Send to payout', status: 'Processing', variant: 'solid' },
        { label: 'Reject', status: 'Rejected', variant: 'danger' },
      ],
      Processing: [{ label: 'Mark paid', status: 'Paid', variant: 'solid' }],
    }}
  />
);

export default Redemption;
