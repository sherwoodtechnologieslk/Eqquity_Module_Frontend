import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatCompact } from '../shared/wealthOpsKit';

const ClientPortfolios = () => (
  <WealthOpsWorkbench
    title="Client Portfolios"
    blurb="Operational view of wealth portfolios linked to client accounts — holdings count, AUM, and RM owner."
    seedRows={[
      {
        id: 'WM001',
        name: 'Growth sleeve',
        clientName: 'Weerathungage Arani Sehansa',
        clientCode: 'CLT-000128',
        type: 'Discretionary',
        rm: 'Sherwood Wealth Team',
        aum: 502_000_000,
        holdings: 4,
        status: 'Active',
        opened: '2022-07-15',
        notes: '',
      },
      {
        id: 'WM002',
        name: 'Treasury book',
        clientName: 'Omega Holdings (Pvt) Ltd',
        clientCode: 'CLT-000257',
        type: 'Advisory',
        rm: 'Corporate Coverage',
        aum: 890_000_000,
        holdings: 7,
        status: 'Active',
        opened: '2021-03-10',
        notes: '',
      },
      {
        id: 'WM003',
        name: 'Trust growth',
        clientName: 'Family Trust – Growth',
        clientCode: 'CLT-000389',
        type: 'Discretionary',
        rm: 'Sherwood Wealth Team',
        aum: 325_000_000,
        holdings: 3,
        status: 'Pending',
        opened: '2025-01-05',
        notes: 'KYC still in review',
      },
      {
        id: 'WM004',
        name: 'Retirement income',
        clientName: 'Nimal Perera – Retirement',
        clientCode: 'CLT-000412',
        type: 'Execution only',
        rm: 'Private Client Desk',
        aum: 96_000_000,
        holdings: 2,
        status: 'Active',
        opened: '2023-11-02',
        notes: '',
      },
    ]}
    stats={(rows) => [
      { k: 'AUM', v: formatCompact(rows.reduce((s, r) => s + r.aum, 0)), m: 'Linked portfolios', focus: true },
      { k: 'Portfolios', v: rows.length, m: 'All books' },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Dealing enabled' },
      { k: 'Pending', v: rows.filter((r) => r.status === 'Pending').length, m: 'Not yet live' },
    ]}
    statusTabs={['All', 'Active', 'Pending', 'Inactive']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'name', 'clientName', 'clientCode', 'rm']}
    searchPlaceholder="Search portfolio, client, RM…"
    columns={[
      { key: 'id', label: 'Code', sub: 'name' },
      { key: 'clientName', label: 'Client', sub: 'clientCode' },
      { key: 'type', label: 'Mandate' },
      { key: 'aum', label: 'AUM', render: (r) => formatCompact(r.aum) },
      { key: 'holdings', label: 'Holdings' },
      { key: 'rm', label: 'RM' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Portfolio register"
    detailTitle={(r) => `${r.id} · ${r.name}`}
    detailSubtitle={(r) => `${r.clientName} · ${r.type}`}
    detailFields={[
      { k: 'AUM', get: (r) => formatCompact(r.aum) },
      { k: 'Holdings', get: (r) => r.holdings },
      { k: 'Mandate', get: (r) => r.type },
      { k: 'RM', get: (r) => r.rm },
      { k: 'Opened', get: (r) => r.opened },
      { k: 'Status', get: (r) => r.status },
    ]}
  />
);

export default ClientPortfolios;
