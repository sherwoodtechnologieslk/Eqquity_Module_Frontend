import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { todayISO } from '../shared/wealthOpsKit';

const RiskReports = () => (
  <WealthOpsWorkbench
    title="Risk Reports"
    blurb="Generate limit utilisation, liquidity, and breach packs for IC and trustee packs."
    newLabel="Generate"
    formTitle="New risk pack"
    initialForm={{ pack: 'Limit utilisation', asOf: todayISO(), format: 'PDF', notes: '' }}
    formFields={[
      { name: 'pack', label: 'Pack', type: 'select', options: ['Limit utilisation', 'Liquidity ladder', 'Breach log', 'VaR / TE summary'] },
      { name: 'asOf', label: 'As of', type: 'date' },
      { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'XLSX'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.pack} · ${form.asOf}`}
    buildRow={(form, rows) => ({
      id: `RRP-${String(40 + rows.length + 1)}`,
      pack: form.pack,
      asOf: form.asOf,
      format: form.format,
      status: 'Generated',
      notes: form.notes,
      createdBy: 'Risk Desk',
    })}
    seedRows={[
      { id: 'RRP-044', pack: 'Limit utilisation', asOf: '2026-08-21', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Risk Desk' },
      { id: 'RRP-041', pack: 'Breach log', asOf: '2026-08-21', format: 'XLSX', status: 'Generated', notes: 'IC pack', createdBy: 'Risk Desk' },
      { id: 'RRP-038', pack: 'Liquidity ladder', asOf: '2026-08-15', format: 'PDF', status: 'Queued', notes: '', createdBy: 'Risk Desk' },
    ]}
    stats={(rows) => [
      { k: 'Packs', v: rows.length, m: 'This month', focus: true },
      { k: 'Generated', v: rows.filter((r) => r.status === 'Generated').length, m: 'Ready' },
      { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'Running' },
      { k: 'Failed', v: rows.filter((r) => r.status === 'Failed').length, m: 'Retry' },
    ]}
    statusTabs={['All', 'Queued', 'Generated']}
    extraFilter={{ key: 'pack', label: 'Pack' }}
    searchKeys={['id', 'pack']}
    columns={[
      { key: 'id', label: 'Run' },
      { key: 'pack', label: 'Pack' },
      { key: 'asOf', label: 'As of' },
      { key: 'format', label: 'Format' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Risk packs"
    detailFields={[
      { k: 'Pack', get: (r) => r.pack },
      { k: 'As of', get: (r) => r.asOf },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{ Queued: [{ label: 'Mark generated', status: 'Generated', variant: 'solid' }] }}
  />
);

export default RiskReports;
