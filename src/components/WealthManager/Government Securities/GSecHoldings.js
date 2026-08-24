import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatCompact, formatMoney, formatPct } from '../shared/wealthOpsKit';

const GSecHoldings = () => (
  <WealthOpsWorkbench
    title="G-Sec Holdings"
    blurb="Government securities held across unit-trust and discretionary books — T-bills, T-bonds, and remaining tenor."
    seedRows={[
      {
        id: 'LKB01026C153',
        name: '91-day T-bill',
        type: 'T-Bill',
        fundName: 'Money Market Fund',
        face: 250_000_000,
        cost: 244_875_000,
        mv: 247_800_000,
        yield: 9.12,
        maturity: '2026-11-20',
        tenor: '91d',
        status: 'Active',
        notes: 'CBSL auction 21 Aug 2026',
      },
      {
        id: 'LKB01026F151',
        name: '182-day T-bill',
        type: 'T-Bill',
        fundName: 'Fixed Income Fund',
        face: 180_000_000,
        cost: 171_720_000,
        mv: 173_340_000,
        yield: 9.45,
        maturity: '2027-02-19',
        tenor: '182d',
        status: 'Active',
        notes: '',
      },
      {
        id: 'LKB01528C157',
        name: '2-year T-bond 9.50%',
        type: 'T-Bond',
        fundName: 'Balanced Income Fund',
        face: 120_000_000,
        cost: 118_560_000,
        mv: 121_440_000,
        yield: 9.68,
        maturity: '2028-03-15',
        tenor: '2y',
        status: 'Active',
        notes: 'Semi-annual coupon',
      },
      {
        id: 'LKB02030A152',
        name: '5-year T-bond 10.25%',
        type: 'T-Bond',
        fundName: 'Fixed Income Fund',
        face: 90_000_000,
        cost: 88_200_000,
        mv: 87_390_000,
        yield: 10.41,
        maturity: '2030-01-15',
        tenor: '5y',
        status: 'Watch',
        notes: 'Duration above FIF policy band',
      },
      {
        id: 'LKB01026I150',
        name: '364-day T-bill',
        type: 'T-Bill',
        fundName: 'Money Market Fund',
        face: 75_000_000,
        cost: 68_250_000,
        mv: 69_075_000,
        yield: 9.88,
        maturity: '2027-08-20',
        tenor: '364d',
        status: 'Active',
        notes: '',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Market value',
        v: formatCompact(rows.reduce((s, r) => s + r.mv, 0)),
        m: 'All G-Sec books',
        focus: true,
      },
      { k: 'Face value', v: formatCompact(rows.reduce((s, r) => s + r.face, 0)), m: 'Par outstanding' },
      { k: 'Lines', v: rows.length, m: 'Instruments' },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: 'Policy review' },
    ]}
    statusTabs={['All', 'Active', 'Watch']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'name', 'fundName', 'type']}
    searchPlaceholder="Search ISIN, name, fund…"
    columns={[
      { key: 'name', label: 'Instrument', sub: 'id' },
      { key: 'type', label: 'Type' },
      { key: 'fundName', label: 'Book' },
      { key: 'face', label: 'Face', render: (r) => formatCompact(r.face) },
      { key: 'mv', label: 'Market', render: (r) => formatCompact(r.mv) },
      { key: 'yield', label: 'YTM', render: (r) => formatPct(r.yield).replace('+', '') },
      { key: 'maturity', label: 'Maturity' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Holdings book"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => `${r.id} · ${r.fundName}`}
    detailFields={[
      { k: 'Face value', get: (r) => formatMoney(r.face) },
      { k: 'Cost', get: (r) => formatMoney(r.cost) },
      { k: 'Market value', get: (r) => formatMoney(r.mv) },
      { k: 'Yield to maturity', get: (r) => `${r.yield.toFixed(2)}%` },
      { k: 'Tenor', get: (r) => r.tenor },
      { k: 'Maturity', get: (r) => r.maturity },
    ]}
  />
);

export default GSecHoldings;
