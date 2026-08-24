import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatMoney, formatPct } from '../shared/wealthOpsKit';

const AssetValuation = () => (
  <WealthOpsWorkbench
    title="Asset Valuation"
    blurb="Price the underlying holdings that feed fund NAV — listed, gilt, and money-market lines."
    seedRows={[
      { id: 'COMB.N0000', name: 'Commercial Bank', sleeve: 'Listed equity', qty: 1_250_000, price: 98.4, value: 123_000_000, source: 'CSE close', change: 0.8, status: 'Priced' },
      { id: 'JKH.N0000', name: 'John Keells Holdings', sleeve: 'Listed equity', qty: 420_000, price: 186.25, value: 78_225_000, source: 'CSE close', change: -0.4, status: 'Priced' },
      { id: 'TBILL-91', name: '91-day T-bill', sleeve: 'Government securities', qty: 250_000_000, price: 99.12, value: 247_800_000, source: 'CBSL', change: 0.02, status: 'Priced' },
      { id: 'CP-OMEGA', name: 'Omega CP 90d', sleeve: 'Corporate debt', qty: 50_000_000, price: 98.05, value: 49_025_000, source: 'Broker quote', change: 0, status: 'Watch' },
      { id: 'CASH-LKR', name: 'Operating cash', sleeve: 'Cash', qty: 86_400_000, price: 1, value: 86_400_000, source: 'Bank rec', change: 0, status: 'Priced' },
    ]}
    stats={(rows) => [
      { k: 'Market value', v: formatMoney(rows.reduce((s, r) => s + r.value, 0)), m: 'Priced book', focus: true },
      { k: 'Lines', v: rows.length, m: 'Holdings' },
      { k: 'Priced', v: rows.filter((r) => r.status === 'Priced').length, m: 'Ready for NAV' },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: 'Manual quote' },
    ]}
    statusTabs={['All', 'Priced', 'Watch']}
    extraFilter={{ key: 'sleeve', label: 'Sleeve' }}
    searchKeys={['id', 'name', 'sleeve', 'source']}
    columns={[
      { key: 'id', label: 'Instrument', sub: 'name' },
      { key: 'sleeve', label: 'Sleeve' },
      { key: 'price', label: 'Price', render: (r) => formatMoney(r.price) },
      { key: 'value', label: 'Value', render: (r) => formatMoney(r.value) },
      { key: 'change', label: 'Δ', render: (r) => <span className={r.change >= 0 ? 'wos-up' : 'wos-down'}>{formatPct(r.change)}</span> },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Holdings book"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => r.id}
    detailFields={[
      { k: 'Quantity', get: (r) => r.qty.toLocaleString() },
      { k: 'Price', get: (r) => formatMoney(r.price) },
      { k: 'Value', get: (r) => formatMoney(r.value) },
      { k: 'Source', get: (r) => r.source },
    ]}
    statusActions={{
      Watch: [{ label: 'Accept price', status: 'Priced', variant: 'solid' }],
      Priced: [{ label: 'Flag watch', status: 'Watch', variant: 'ghost' }],
    }}
  />
);

export default AssetValuation;
