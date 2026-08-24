import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatCompact, formatMoney } from '../shared/wealthOpsKit';

const FundAccounting = () => (
  <WealthOpsWorkbench
    title="Fund Accounting"
    blurb="Per-fund books: NAV, unit capital, trustee cash, and outstanding equalisation."
    seedRows={FUNDS.map((fund, i) => ({
      id: fund.id,
      fundName: fund.name,
      nav: fund.nav,
      aum: [450, 320, 280, 150, 180][i] * 1_000_000,
      cash: [18.4, 12.1, 9.6, 64.8, 6.2][i] * 1_000_000,
      units: [17.68, 16.91, 27.32, 150, 5.6][i] * 1_000_000,
      equalisation: [0.42, 0.18, 0.05, 0.9, 0.11][i] * 1_000_000,
      status: ['Published', 'Published', 'In review', 'Published', 'Draft'][i],
      notes: '',
      createdBy: 'Fund Accounting',
    }))}
    stats={(rows) => [
      { k: 'Fund AUM', v: formatCompact(rows.reduce((s, r) => s + r.aum, 0)), m: 'All books', focus: true },
      { k: 'Trustee cash', v: formatCompact(rows.reduce((s, r) => s + r.cash, 0)), m: 'Uninvested' },
      { k: 'Equalisation', v: formatCompact(rows.reduce((s, r) => s + r.equalisation, 0)), m: 'Open' },
      { k: 'Published', v: rows.filter((r) => r.status === 'Published').length, m: 'Ready' },
    ]}
    statusTabs={['All', 'Draft', 'In review', 'Published']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName']}
    columns={[
      { key: 'fundName', label: 'Fund', sub: 'id' },
      { key: 'nav', label: 'NAV', render: (r) => formatMoney(r.nav) },
      { key: 'aum', label: 'AUM', render: (r) => formatCompact(r.aum) },
      { key: 'cash', label: 'Cash', render: (r) => formatCompact(r.cash) },
      { key: 'equalisation', label: 'Equalisation', render: (r) => formatCompact(r.equalisation) },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Fund books"
    detailFields={[
      { k: 'NAV', get: (r) => formatMoney(r.nav) },
      { k: 'AUM', get: (r) => formatMoney(r.aum) },
      { k: 'Units', get: (r) => r.units.toLocaleString() },
      { k: 'Trustee cash', get: (r) => formatMoney(r.cash) },
      { k: 'Equalisation', get: (r) => formatMoney(r.equalisation) },
      { k: 'Owner', get: (r) => r.createdBy },
    ]}
  />
);

export default FundAccounting;
