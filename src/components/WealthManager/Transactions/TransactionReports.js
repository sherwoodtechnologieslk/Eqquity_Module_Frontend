import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney, todayISO } from '../shared/wealthOpsKit';

const TransactionReports = () => (
  <WealthOpsWorkbench
    title="Transaction Reports"
    blurb="Build dealing, settlement, and exception reports for ops, audit, and trustee packs."
    newLabel="Run report"
    formTitle="New transaction report"
    formHint="Reports pull from the allotted blotter, not the pending queue."
    initialForm={{
      reportType: 'Daily dealing',
      fromDate: todayISO(),
      toDate: todayISO(),
      format: 'XLSX',
      notes: '',
    }}
    formFields={[
      {
        name: 'reportType',
        label: 'Report',
        type: 'select',
        options: ['Daily dealing', 'Settlement lag', 'Failed trades', 'SIP / SWP runs', 'Channel mix'],
      },
      { name: 'fromDate', label: 'From', type: 'date' },
      { name: 'toDate', label: 'To', type: 'date' },
      { name: 'format', label: 'Format', type: 'select', options: ['XLSX', 'PDF', 'CSV'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.reportType} · ${form.fromDate} to ${form.toDate}`}
    buildRow={(form, rows) => ({
      id: `TRP-${String(90 + rows.length + 1).padStart(3, '0')}`,
      reportType: form.reportType,
      fromDate: form.fromDate,
      toDate: form.toDate,
      format: form.format,
      rows: 128,
      value: 24_800_000,
      status: 'Generated',
      notes: form.notes,
      createdBy: 'Ops Desk',
    })}
    seedRows={[
      { id: 'TRP-094', reportType: 'Daily dealing', fromDate: '2026-08-20', toDate: '2026-08-20', format: 'XLSX', rows: 342, value: 48_200_000, status: 'Generated', notes: '', createdBy: 'Ops Desk' },
      { id: 'TRP-091', reportType: 'Failed trades', fromDate: '2026-08-01', toDate: '2026-08-21', format: 'PDF', rows: 11, value: 1_240_000, status: 'Generated', notes: 'Trustee pack', createdBy: 'Compliance' },
      { id: 'TRP-088', reportType: 'SIP / SWP runs', fromDate: '2026-08-01', toDate: '2026-08-21', format: 'CSV', rows: 64, value: 6_750_000, status: 'Queued', notes: '', createdBy: 'Ops Desk' },
    ]}
    stats={(rows) => [
      { k: 'Covered value', v: formatMoney(rows.reduce((s, r) => s + r.value, 0)), m: 'In generated packs', focus: true },
      { k: 'Reports', v: rows.length, m: 'This month' },
      { k: 'Generated', v: rows.filter((r) => r.status === 'Generated').length, m: 'Downloadable' },
      { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'Running' },
    ]}
    statusTabs={['All', 'Queued', 'Generated', 'Failed']}
    extraFilter={{ key: 'reportType', label: 'Type' }}
    searchKeys={['id', 'reportType']}
    columns={[
      { key: 'id', label: 'Run' },
      { key: 'reportType', label: 'Report' },
      { key: 'fromDate', label: 'From' },
      { key: 'toDate', label: 'To' },
      { key: 'rows', label: 'Lines' },
      { key: 'format', label: 'Format' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Report runs"
    detailFields={[
      { k: 'Value', get: (r) => formatMoney(r.value) },
      { k: 'Lines', get: (r) => r.rows },
      { k: 'Format', get: (r) => r.format },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Queued: [{ label: 'Mark generated', status: 'Generated', variant: 'solid' }],
    }}
  />
);

export default TransactionReports;
