import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { CLIENTS, todayISO } from '../shared/wealthOpsKit';

const makeReportScreen = ({ title, blurb, types, seed }) => {
  const Screen = () => (
    <WealthOpsWorkbench
      title={title}
      blurb={blurb}
      newLabel="Generate"
      formTitle={`New ${title.toLowerCase()}`}
      initialForm={{
        audience: types[0],
        asOf: todayISO(),
        format: 'PDF',
        notes: '',
      }}
      formFields={[
        { name: 'audience', label: 'Pack', type: 'select', options: types },
        { name: 'asOf', label: 'As of', type: 'date' },
        { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'XLSX'] },
        { name: 'notes', label: 'Notes', wide: true },
      ]}
      estimate={(form) => `${form.audience} · ${form.format}`}
      buildRow={(form, rows) => {
        const client = CLIENTS[rows.length % CLIENTS.length];
        return {
          id: `${title.slice(0, 3).toUpperCase()}-${String(100 + rows.length + 1)}`,
          pack: form.audience,
          clientName: client.name,
          clientCode: client.code,
          asOf: form.asOf,
          format: form.format,
          status: 'Generated',
          notes: form.notes,
          createdBy: 'Reporting Desk',
        };
      }}
      seedRows={seed}
      stats={(rows) => [
        { k: 'Packs', v: rows.length, m: 'This period', focus: true },
        { k: 'Generated', v: rows.filter((r) => r.status === 'Generated').length, m: 'Ready' },
        { k: 'Queued', v: rows.filter((r) => r.status === 'Queued').length, m: 'Running' },
        { k: 'Failed', v: rows.filter((r) => r.status === 'Failed').length, m: 'Retry' },
      ]}
      statusTabs={['All', 'Queued', 'Generated', 'Failed']}
      extraFilter={{ key: 'pack', label: 'Pack' }}
      searchKeys={['id', 'pack', 'clientName', 'clientCode']}
      columns={[
        { key: 'id', label: 'Run' },
        { key: 'pack', label: 'Pack' },
        { key: 'clientName', label: 'Client / entity', sub: 'clientCode' },
        { key: 'asOf', label: 'As of' },
        { key: 'format', label: 'Format' },
        { key: 'status', label: 'Status', badge: true },
      ]}
      boardTitle="Report queue"
      detailFields={[
        { k: 'Pack', get: (r) => r.pack },
        { k: 'As of', get: (r) => r.asOf },
        { k: 'Format', get: (r) => r.format },
        { k: 'Created by', get: (r) => r.createdBy },
      ]}
      statusActions={{
        Queued: [{ label: 'Mark generated', status: 'Generated', variant: 'solid' }],
      }}
    />
  );
  Screen.displayName = title.replace(/\s+/g, '');
  return Screen;
};

export const ClientReports = makeReportScreen({
  title: 'Client Reports',
  blurb: 'Produce RM and client packs: valuation, activity, and holdings summaries.',
  types: ['Valuation letter', 'Activity summary', 'Holdings certificate', 'Fee invoice'],
  seed: [
    { id: 'CLI-101', pack: 'Valuation letter', clientName: 'Weerathungage Arani Sehansa', clientCode: 'CLT-000128', asOf: '2026-08-15', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Reporting Desk' },
    { id: 'CLI-098', pack: 'Fee invoice', clientName: 'Omega Holdings (Pvt) Ltd', clientCode: 'CLT-000257', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Billing' },
    { id: 'CLI-094', pack: 'Holdings certificate', clientName: 'Family Trust – Growth', clientCode: 'CLT-000389', asOf: '2026-08-15', format: 'PDF', status: 'Queued', notes: '', createdBy: 'Reporting Desk' },
  ],
});

export const FundReports = makeReportScreen({
  title: 'Fund Reports',
  blurb: 'Trustee, factsheet, and regulatory fund packs from the published NAV book.',
  types: ['Factsheet', 'Trustee pack', 'Holdings look-through', 'Expense ratio'],
  seed: [
    { id: 'FUN-044', pack: 'Factsheet', clientName: 'Equity Growth Fund', clientCode: 'EGF', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Product' },
    { id: 'FUN-041', pack: 'Trustee pack', clientName: 'All funds', clientCode: 'ALL', asOf: '2026-07-31', format: 'XLSX', status: 'Generated', notes: '', createdBy: 'Fund Accounting' },
    { id: 'FUN-039', pack: 'Expense ratio', clientName: 'Money Market Fund', clientCode: 'MMF', asOf: '2026-07-31', format: 'PDF', status: 'Queued', notes: '', createdBy: 'Fund Accounting' },
  ],
});

export const PerformanceReports = makeReportScreen({
  title: 'Performance Reports',
  blurb: 'Time-weighted and money-weighted return packs versus each mandate benchmark.',
  types: ['TWR pack', 'MWR pack', 'Attribution', 'Peer comparison'],
  seed: [
    { id: 'PER-022', pack: 'TWR pack', clientName: 'Growth sleeve – Arani Sehansa', clientCode: 'WM001', asOf: '2026-08-15', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Performance' },
    { id: 'PER-019', pack: 'Attribution', clientName: 'Trust growth', clientCode: 'WM003', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Performance' },
  ],
});

export const RegulatoryReports = makeReportScreen({
  title: 'Regulatory Reports',
  blurb: 'SEC, CBSL, and trustee statutory filings generated from the wealth books.',
  types: ['SEC unit trust return', 'CBSL statistical', 'AML STR extract', 'Trustee compliance'],
  seed: [
    { id: 'REG-012', pack: 'SEC unit trust return', clientName: 'Sherwood Wealth', clientCode: 'REG', asOf: '2026-07-31', format: 'XLSX', status: 'Generated', notes: '', createdBy: 'Compliance' },
    { id: 'REG-011', pack: 'Trustee compliance', clientName: 'All funds', clientCode: 'ALL', asOf: '2026-07-31', format: 'PDF', status: 'Queued', notes: '', createdBy: 'Compliance' },
  ],
});

export const TaxReports = makeReportScreen({
  title: 'Tax Reports',
  blurb: 'Withholding, WHT certificates, and year-end tax packs for clients and IRD.',
  types: ['WHT certificate', 'IRD withholding return', 'Capital gains extract', 'Year-end tax pack'],
  seed: [
    { id: 'TAX-077', pack: 'WHT certificate', clientName: 'Nimal Perera – Retirement', clientCode: 'CLT-000412', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Tax Desk' },
    { id: 'TAX-074', pack: 'IRD withholding return', clientName: 'Sherwood Wealth', clientCode: 'REG', asOf: '2026-07-31', format: 'XLSX', status: 'Generated', notes: '', createdBy: 'Tax Desk' },
  ],
});

export const StatementGeneration = makeReportScreen({
  title: 'Statement Generation',
  blurb: 'Batch client statements for a period — email, portal publish, or print house.',
  types: ['Monthly statement', 'Quarterly statement', 'Ad-hoc statement', 'Consolidated family'],
  seed: [
    { id: 'STM-310', pack: 'Monthly statement', clientName: 'Weerathungage Arani Sehansa', clientCode: 'CLT-000128', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: 'Portal published', createdBy: 'Statements' },
    { id: 'STM-308', pack: 'Monthly statement', clientName: 'Omega Holdings (Pvt) Ltd', clientCode: 'CLT-000257', asOf: '2026-07-31', format: 'PDF', status: 'Generated', notes: '', createdBy: 'Statements' },
    { id: 'STM-301', pack: 'Quarterly statement', clientName: 'Family Trust – Growth', clientCode: 'CLT-000389', asOf: '2026-06-30', format: 'PDF', status: 'Queued', notes: '', createdBy: 'Statements' },
  ],
});
