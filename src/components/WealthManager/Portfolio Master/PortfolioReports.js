import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { CLIENTS, todayISO } from '../shared/wealthOpsKit';

const PortfolioReports = () => (
  <WealthOpsWorkbench
    title="Portfolio Reports"
    blurb="Generate valuation, performance, and holding reports for RM packs and client delivery."
    newLabel="Generate report"
    formTitle="New report request"
    formHint="Reports generate against the latest published NAV."
    initialForm={{
      clientCode: CLIENTS[0].code,
      reportType: 'Valuation pack',
      asOf: todayISO(),
      format: 'PDF',
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
        name: 'reportType',
        label: 'Report',
        type: 'select',
        options: ['Valuation pack', 'Holdings', 'Performance attribution', 'Transaction listing'],
      },
      { name: 'asOf', label: 'As of', type: 'date' },
      { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'XLSX'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.reportType} · ${form.format} · ${form.asOf}`}
    buildRow={(form, rows) => {
      const client = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[0];
      return {
        id: `RPT-${String(220 + rows.length + 1).padStart(4, '0')}`,
        clientCode: client.code,
        clientName: client.name,
        reportType: form.reportType,
        asOf: form.asOf,
        format: form.format,
        status: 'Generated',
        notes: form.notes,
        createdBy: 'Sherwood Wealth Team',
      };
    }}
    seedRows={[
      {
        id: 'RPT-0224',
        clientCode: 'CLT-000128',
        clientName: 'Weerathungage Arani Sehansa',
        reportType: 'Valuation pack',
        asOf: '2026-08-15',
        format: 'PDF',
        status: 'Generated',
        notes: '',
        createdBy: 'Sherwood Wealth Team',
      },
      {
        id: 'RPT-0221',
        clientCode: 'CLT-000257',
        clientName: 'Omega Holdings (Pvt) Ltd',
        reportType: 'Holdings',
        asOf: '2026-08-15',
        format: 'XLSX',
        status: 'Generated',
        notes: 'Treasury month-end pack',
        createdBy: 'Corporate Coverage',
      },
      {
        id: 'RPT-0218',
        clientCode: 'CLT-000389',
        clientName: 'Family Trust – Growth',
        reportType: 'Performance attribution',
        asOf: '2026-07-31',
        format: 'PDF',
        status: 'Queued',
        notes: '',
        createdBy: 'Reporting Desk',
      },
    ]}
    stats={(rows) => [
      { k: 'Reports', v: rows.length, m: 'This month', focus: true },
      { k: 'Generated', v: rows.filter((r) => r.status === 'Generated').length, m: 'Ready to download' },
      { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'In the engine' },
      { k: 'Failed', v: rows.filter((r) => r.status === 'Failed').length, m: 'Needs retry' },
    ]}
    statusTabs={['All', 'Queued', 'Generated', 'Failed']}
    extraFilter={{ key: 'reportType', label: 'Type' }}
    searchKeys={['id', 'clientName', 'reportType']}
    columns={[
      { key: 'id', label: 'Request' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'reportType', label: 'Report' },
      { key: 'asOf', label: 'As of' },
      { key: 'format', label: 'Format' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Report queue"
    detailFields={[
      { k: 'Report', get: (r) => r.reportType },
      { k: 'As of', get: (r) => r.asOf },
      { k: 'Format', get: (r) => r.format },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Queued: [{ label: 'Mark generated', status: 'Generated', variant: 'solid' }],
      Generated: [{ label: 'Re-queue', status: 'Queued', variant: 'ghost' }],
    }}
  />
);

export default PortfolioReports;
