import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatCompact, formatPct } from '../shared/wealthOpsKit';

const PortfolioPerformance = () => (
  <WealthOpsWorkbench
    title="Portfolio Performance"
    blurb="Review time-weighted returns, excess versus benchmark, and contribution by sleeve."
    seedRows={[
      {
        id: 'WM001',
        name: 'Growth sleeve – Arani Sehansa',
        client: 'CLT-000128',
        aum: 502_000_000,
        mtd: 1.42,
        qtd: 4.18,
        ytd: 7.26,
        oneY: 12.4,
        benchmark: 'CSE ASPI + cash',
        excess: 1.15,
        status: 'Active',
        notes: 'Equity overweight added 0.6 pp this quarter.',
      },
      {
        id: 'WM002',
        name: 'Treasury book – Omega Holdings',
        client: 'CLT-000257',
        aum: 890_000_000,
        mtd: 0.62,
        qtd: 1.88,
        ytd: 5.33,
        oneY: 8.1,
        benchmark: '91-day T-bill',
        excess: 0.44,
        status: 'Active',
        notes: '',
      },
      {
        id: 'WM003',
        name: 'Trust growth – Family Trust',
        client: 'CLT-000389',
        aum: 325_000_000,
        mtd: 2.05,
        qtd: 6.4,
        ytd: 16.07,
        oneY: 18.9,
        benchmark: 'CSE ASPI',
        excess: 2.8,
        status: 'Active',
        notes: 'High tracking error vs policy.',
      },
      {
        id: 'WM004',
        name: 'Retirement – Nimal Perera',
        client: 'CLT-000412',
        aum: 96_000_000,
        mtd: 0.41,
        qtd: 1.22,
        ytd: 4.05,
        oneY: 6.8,
        benchmark: 'CPI + 2%',
        excess: -0.3,
        status: 'Watch',
        notes: 'Income sleeve lagging CPI target.',
      },
    ]}
    stats={(rows) => [
      { k: 'AUM covered', v: formatCompact(rows.reduce((s, r) => s + r.aum, 0)), m: 'Performance book', focus: true },
      { k: 'Avg YTD', v: formatPct(rows.reduce((s, r) => s + r.ytd, 0) / rows.length), m: 'Equal-weighted' },
      { k: 'Beating bench', v: rows.filter((r) => r.excess >= 0).length, m: 'Portfolios' },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: 'Below policy' },
    ]}
    statusTabs={['All', 'Active', 'Watch']}
    extraFilter={{ key: 'benchmark', label: 'Benchmark' }}
    searchKeys={['id', 'name', 'client']}
    searchPlaceholder="Search portfolio or client…"
    columns={[
      { key: 'name', label: 'Portfolio', sub: 'client' },
      { key: 'aum', label: 'AUM', render: (r) => formatCompact(r.aum) },
      { key: 'mtd', label: 'MTD', render: (r) => <span className={r.mtd >= 0 ? 'wos-up' : 'wos-down'}>{formatPct(r.mtd)}</span> },
      { key: 'qtd', label: 'QTD', render: (r) => formatPct(r.qtd) },
      { key: 'ytd', label: 'YTD', render: (r) => formatPct(r.ytd) },
      { key: 'excess', label: 'Excess', render: (r) => <span className={r.excess >= 0 ? 'wos-up' : 'wos-down'}>{formatPct(r.excess)}</span> },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Return summary"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => `${r.client} · ${r.benchmark}`}
    detailFields={[
      { k: 'AUM', get: (r) => formatCompact(r.aum) },
      { k: 'MTD', get: (r) => formatPct(r.mtd) },
      { k: 'QTD', get: (r) => formatPct(r.qtd) },
      { k: 'YTD', get: (r) => formatPct(r.ytd) },
      { k: '1 year', get: (r) => formatPct(r.oneY) },
      { k: 'Excess', get: (r) => formatPct(r.excess) },
    ]}
  />
);

export default PortfolioPerformance;
