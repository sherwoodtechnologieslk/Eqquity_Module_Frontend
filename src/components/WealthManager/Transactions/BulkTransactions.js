import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const BulkTransactions = () => (
  <WealthOpsWorkbench
    title="Bulk Transactions"
    blurb="Upload a dealing file for SIP runs, payroll subscriptions, or branch batches, then allot as a single book."
    newLabel="Create batch"
    formTitle="New bulk batch"
    formHint="Accepted formats: CSV or XLSX with client code, fund, amount, and trade date."
    initialForm={{
      batchType: 'SIP run',
      fundId: FUNDS[0].id,
      tradeDate: todayISO(),
      fileName: '',
      notes: '',
    }}
    formFields={[
      {
        name: 'batchType',
        label: 'Batch type',
        type: 'select',
        options: ['SIP run', 'Payroll subscription', 'Branch batch', 'SWP run'],
      },
      {
        name: 'fundId',
        label: 'Default fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'tradeDate', label: 'Trade date', type: 'date' },
      { name: 'fileName', label: 'File name', placeholder: 'sip-aug-2026.csv' },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.batchType} · ${form.tradeDate}`}
    validateForm={(form) => (!form.fileName ? 'Enter a file name for this batch.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return {
        id: `BLK-${String(55 + rows.length + 1).padStart(3, '0')}`,
        batchType: form.batchType,
        fundName: fund.name,
        tradeDate: form.tradeDate,
        fileName: form.fileName,
        lines: 0,
        amount: 0,
        status: 'Queued',
        notes: form.notes,
        createdBy: 'Ops Desk',
      };
    }}
    seedRows={[
      { id: 'BLK-058', batchType: 'SIP run', fundName: 'Equity Growth Fund', tradeDate: '2026-08-05', fileName: 'sip-aug-egf.csv', lines: 186, amount: 9_300_000, status: 'Completed', notes: '', createdBy: 'Ops Desk' },
      { id: 'BLK-057', batchType: 'SWP run', fundName: 'Fixed Income Fund', tradeDate: '2026-08-01', fileName: 'swp-aug-fif.csv', lines: 42, amount: 1_470_000, status: 'Completed', notes: '', createdBy: 'Ops Desk' },
      { id: 'BLK-056', batchType: 'Payroll subscription', fundName: 'Balanced Income Fund', tradeDate: '2026-08-21', fileName: 'omega-payroll.xlsx', lines: 64, amount: 4_800_000, status: 'Queued', notes: 'Awaiting HR confirmation', createdBy: 'Corporate Coverage' },
    ]}
    stats={(rows) => [
      { k: 'Batch value', v: formatMoney(rows.reduce((s, r) => s + r.amount, 0)), m: 'All batches in view', focus: true },
      { k: 'Batches', v: rows.length, m: 'This month' },
      { k: 'Lines', v: rows.reduce((s, r) => s + r.lines, 0), m: 'Instructions' },
      { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'Not yet allotted' },
    ]}
    statusTabs={['All', 'Queued', 'Completed', 'Failed']}
    extraFilter={{ key: 'batchType', label: 'Type' }}
    searchKeys={['id', 'batchType', 'fileName', 'fundName']}
    columns={[
      { key: 'id', label: 'Batch' },
      { key: 'batchType', label: 'Type' },
      { key: 'fundName', label: 'Fund' },
      { key: 'lines', label: 'Lines' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'tradeDate', label: 'Trade date' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Bulk book"
    detailFields={[
      { k: 'File', get: (r) => r.fileName },
      { k: 'Lines', get: (r) => r.lines },
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Queued: [
        { label: 'Mark completed', status: 'Completed', variant: 'solid' },
        { label: 'Fail batch', status: 'Failed', variant: 'danger' },
      ],
    }}
  />
);

export default BulkTransactions;
