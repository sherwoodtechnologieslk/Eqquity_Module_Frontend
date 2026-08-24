import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatCompact, todayISO } from '../shared/wealthOpsKit';

const ValuationReports = () => (
  <WealthOpsWorkbench
    title="Valuation Reports"
    blurb="Produce fund and portfolio valuation packs for trustees, auditors, and RM delivery."
    newLabel="Generate pack"
    formTitle="New valuation pack"
    initialForm={{ pack: 'Fund valuation', asOf: todayISO(), format: 'PDF', notes: '' }}
    formFields={[
      { name: 'pack', label: 'Pack', type: 'select', options: ['Fund valuation', 'Portfolio valuation', 'Price source listing', 'Stale price exception'] },
      { name: 'asOf', label: 'As of', type: 'date' },
      { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'XLSX'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.pack} · ${form.asOf}`}
    buildRow={(form, rows) => ({
      id: `VAL-${String(30 + rows.length + 1).padStart(3, '0')}`,
      pack: form.pack,
      asOf: form.asOf,
      format: form.format,
      aum: 2_450_000_000,
      status: 'Generated',
      notes: form.notes,
      createdBy: 'Valuation Desk',
    })}
    seedRows={[
      { id: 'VAL-034', pack: 'Fund valuation', asOf: '2026-08-21', format: 'PDF', aum: 2_450_000_000, status: 'Generated', notes: '', createdBy: 'Valuation Desk' },
      { id: 'VAL-033', pack: 'Stale price exception', asOf: '2026-08-21', format: 'XLSX', aum: 18_400_000, status: 'Queued', notes: 'Unlisted paper', createdBy: 'Valuation Desk' },
      { id: 'VAL-031', pack: 'Portfolio valuation', asOf: '2026-08-15', format: 'PDF', aum: 502_000_000, status: 'Generated', notes: 'CLT-000128', createdBy: 'RM Desk' },
    ]}
    stats={(rows) => [
      { k: 'Covered AUM', v: formatCompact(rows[0]?.aum || 0), m: 'Latest fund pack', focus: true },
      { k: 'Packs', v: rows.length, m: 'This month' },
      { k: 'Generated', v: rows.filter((r) => r.status === 'Generated').length, m: 'Ready' },
      { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'Running' },
    ]}
    statusTabs={['All', 'Queued', 'Generated']}
    extraFilter={{ key: 'pack', label: 'Pack' }}
    searchKeys={['id', 'pack']}
    columns={[
      { key: 'id', label: 'Pack' },
      { key: 'pack', label: 'Type' },
      { key: 'asOf', label: 'As of' },
      { key: 'format', label: 'Format' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Valuation packs"
    detailFields={[
      { k: 'AUM in pack', get: (r) => formatCompact(r.aum) },
      { k: 'Format', get: (r) => r.format },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{ Queued: [{ label: 'Mark generated', status: 'Generated', variant: 'solid' }] }}
  />
);

export default ValuationReports;
