import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, formatUnits, todayISO } from '../shared/wealthOpsKit';

const DividendDistribution = () => (
  <WealthOpsWorkbench
    title="Dividend Distribution"
    blurb="Declare unit trust dividends, lock the record date, and track reinvestment versus cash payouts."
    newLabel="Declare dividend"
    formTitle="New dividend declaration"
    formHint="Record date must be a dealing day. Ex-date is the next dealing day."
    initialForm={{
      fundId: FUNDS[2].id,
      rate: '',
      recordDate: todayISO(),
      exDate: todayISO(),
      payDate: todayISO(),
      option: 'Cash',
      notes: '',
    }}
    formFields={[
      {
        name: 'fundId',
        label: 'Fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'rate', label: 'Rate per unit (LKR)', type: 'number', min: 0, step: '0.0001' },
      { name: 'recordDate', label: 'Record date', type: 'date' },
      { name: 'exDate', label: 'Ex-date', type: 'date' },
      { name: 'payDate', label: 'Pay date', type: 'date' },
      {
        name: 'option',
        label: 'Default option',
        type: 'select',
        options: ['Cash', 'Reinvest', 'Client election'],
      },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[2];
      const rate = parseFloat(form.rate) || 0;
      return `${fund.name} · ${formatMoney(rate)} per unit`;
    }}
    validateForm={(form) => ((parseFloat(form.rate) || 0) <= 0 ? 'Enter a dividend rate.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[2];
      const rate = parseFloat(form.rate) || 0;
      const units = 18_450_000;
      return {
        id: `DIV-${new Date().getFullYear()}-${String(18 + rows.length).padStart(3, '0')}`,
        fundId: fund.id,
        fundName: fund.name,
        rate,
        units,
        gross: rate * units,
        recordDate: form.recordDate,
        exDate: form.exDate,
        payDate: form.payDate,
        option: form.option,
        status: 'Declared',
        notes: form.notes,
        createdBy: 'Fund Accounting',
      };
    }}
    seedRows={[
      {
        id: 'DIV-2026-021',
        fundId: 'FIF',
        fundName: 'Fixed Income Fund',
        rate: 0.085,
        units: 27400000,
        gross: 2329000,
        recordDate: '2026-08-15',
        exDate: '2026-08-16',
        payDate: '2026-08-22',
        option: 'Cash',
        status: 'Declared',
        notes: 'Monthly income distribution',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'DIV-2026-018',
        fundId: 'BIF',
        fundName: 'Balanced Income Fund',
        rate: 0.12,
        units: 16900000,
        gross: 2028000,
        recordDate: '2026-07-31',
        exDate: '2026-08-01',
        payDate: '2026-08-08',
        option: 'Reinvest',
        status: 'Paid',
        notes: '',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'DIV-2026-014',
        fundId: 'MMF',
        fundName: 'Money Market Fund',
        rate: 0.0065,
        units: 150000000,
        gross: 975000,
        recordDate: '2026-07-31',
        exDate: '2026-08-01',
        payDate: '2026-08-04',
        option: 'Client election',
        status: 'Paid',
        notes: 'Daily income accrued, monthly pay',
        createdBy: 'Fund Accounting',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Gross declared',
        v: formatMoney(rows.reduce((s, r) => s + r.gross, 0)),
        m: 'All open declarations',
        focus: true,
      },
      { k: 'Declarations', v: rows.length, m: 'This year' },
      { k: 'Declared', v: rows.filter((r) => r.status === 'Declared').length, m: 'Awaiting pay date' },
      { k: 'Paid', v: rows.filter((r) => r.status === 'Paid').length, m: 'Distributed' },
    ]}
    statusTabs={['All', 'Declared', 'Paid', 'Cancelled']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName']}
    searchPlaceholder="Search declaration or fund…"
    columns={[
      { key: 'id', label: 'Declaration' },
      { key: 'fundName', label: 'Fund' },
      { key: 'rate', label: 'Rate / unit', render: (r) => formatMoney(r.rate) },
      { key: 'units', label: 'Eligible units', render: (r) => formatUnits(r.units) },
      { key: 'gross', label: 'Gross', render: (r) => formatMoney(r.gross) },
      { key: 'payDate', label: 'Pay date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Dividend calendar"
    detailSubtitle={(r) => `${r.fundName} · ${r.option}`}
    detailFields={[
      { k: 'Rate / unit', get: (r) => formatMoney(r.rate) },
      { k: 'Eligible units', get: (r) => formatUnits(r.units) },
      { k: 'Gross amount', get: (r) => formatMoney(r.gross) },
      { k: 'Record date', get: (r) => r.recordDate },
      { k: 'Ex-date', get: (r) => r.exDate },
      { k: 'Pay date', get: (r) => r.payDate },
    ]}
    statusActions={{
      Declared: [
        { label: 'Mark paid', status: 'Paid', variant: 'solid' },
        { label: 'Cancel', status: 'Cancelled', variant: 'danger' },
      ],
    }}
  />
);

export default DividendDistribution;
