import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatCompact, formatMoney, todayISO } from '../shared/wealthOpsKit';

const NAVManagement = () => (
  <WealthOpsWorkbench
    title="NAV Management"
    blurb="Run the NAV workflow from valuation lock through checker sign-off and client publication."
    newLabel="Open NAV run"
    formTitle="New NAV run"
    formHint="A run covers one fund and one valuation date. Assets must be priced before lock."
    initialForm={{
      fundId: FUNDS[0].id,
      navDate: todayISO(),
      notes: '',
    }}
    formFields={[
      {
        name: 'fundId',
        label: 'Fund',
        type: 'select',
        options: FUNDS.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })),
      },
      { name: 'navDate', label: 'Valuation date', type: 'date' },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return `${fund.name} · ${form.navDate}`;
    }}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return {
        id: `NAV-${form.navDate}-${fund.id}`,
        fundId: fund.id,
        fundName: fund.name,
        navDate: form.navDate,
        nav: fund.nav,
        aum: [450, 320, 280, 150, 180][FUNDS.findIndex((f) => f.id === fund.id)] * 1_000_000,
        units: 17_680_000,
        status: 'Draft',
        owner: 'Fund Accounting',
        notes: form.notes,
        createdBy: 'Fund Accounting',
      };
    }}
    seedRows={FUNDS.map((fund, i) => ({
      id: `NAV-2026-08-21-${fund.id}`,
      fundId: fund.id,
      fundName: fund.name,
      navDate: '2026-08-21',
      nav: fund.nav,
      aum: [450, 320, 280, 150, 180][i] * 1_000_000,
      units: [17.68, 16.91, 27.32, 150, 5.6][i] * 1_000_000,
      status: ['In review', 'Published', 'Published', 'Locked', 'Draft'][i],
      owner: 'Fund Accounting',
      notes: '',
      createdBy: 'Fund Accounting',
    }))}
    stats={(rows) => [
      { k: 'AUM in run', v: formatCompact(rows.reduce((s, r) => s + r.aum, 0)), m: 'All funds this date', focus: true },
      { k: 'Runs', v: rows.length, m: 'Open valuation book' },
      { k: 'Published', v: rows.filter((r) => r.status === 'Published').length, m: 'Released to dealing' },
      { k: 'In review', v: rows.filter((r) => r.status === 'In review').length, m: 'Checker queue' },
    ]}
    statusTabs={['All', 'Draft', 'In review', 'Locked', 'Published']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName', 'fundId']}
    columns={[
      { key: 'id', label: 'Run' },
      { key: 'fundName', label: 'Fund' },
      { key: 'navDate', label: 'Date' },
      { key: 'nav', label: 'NAV', render: (r) => formatMoney(r.nav) },
      { key: 'aum', label: 'AUM', render: (r) => formatCompact(r.aum) },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="NAV runs"
    detailFields={[
      { k: 'NAV', get: (r) => formatMoney(r.nav) },
      { k: 'AUM', get: (r) => formatMoney(r.aum) },
      { k: 'Units in issue', get: (r) => r.units.toLocaleString() },
      { k: 'Valuation date', get: (r) => r.navDate },
      { k: 'Owner', get: (r) => r.owner },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Draft: [{ label: 'Send for review', status: 'In review', variant: 'solid' }],
      'In review': [
        { label: 'Lock & publish', status: 'Published', variant: 'solid' },
        { label: 'Return to draft', status: 'Draft', variant: 'ghost' },
      ],
      Locked: [{ label: 'Publish', status: 'Published', variant: 'solid' }],
    }}
  />
);

export default NAVManagement;
