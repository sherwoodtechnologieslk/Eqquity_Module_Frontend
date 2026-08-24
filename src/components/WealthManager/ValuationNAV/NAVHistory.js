import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, formatPct } from '../shared/wealthOpsKit';

const NAVHistory = () => (
  <WealthOpsWorkbench
    title="NAV History"
    blurb="Audit published dealing NAVs by fund and date, with day-on-day change."
    seedRows={FUNDS.flatMap((fund, fi) =>
      ['2026-08-21', '2026-08-20', '2026-08-19', '2026-08-18'].map((date, di) => ({
        id: `${fund.id}-${date}`,
        fundId: fund.id,
        fundName: fund.name,
        navDate: date,
        nav: +(fund.nav * (1 - di * 0.003)).toFixed(4),
        change: di === 0 ? [0.42, 0.18, 0.05, 0.01, 0.61][fi] : 0.12 - di * 0.04,
        status: 'Published',
        notes: '',
        createdBy: 'Pricing Desk',
      }))
    )}
    stats={(rows) => {
      const latest = rows.filter((r) => r.navDate === '2026-08-21');
      return [
        { k: 'Funds', v: FUNDS.length, m: 'With history', focus: true },
        { k: 'Points', v: rows.length, m: 'Published NAVs' },
        { k: 'Latest avg Δ', v: formatPct(latest.reduce((s, r) => s + r.change, 0) / (latest.length || 1)), m: '21 Aug 2026' },
        { k: 'Published', v: rows.filter((r) => r.status === 'Published').length, m: 'Locked history' },
      ];
    }}
    statusTabs={['All', 'Published']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName', 'navDate']}
    columns={[
      { key: 'fundName', label: 'Fund', sub: 'fundId' },
      { key: 'navDate', label: 'Date' },
      { key: 'nav', label: 'NAV', render: (r) => formatMoney(r.nav) },
      { key: 'change', label: 'Δ', render: (r) => <span className={r.change >= 0 ? 'wos-up' : 'wos-down'}>{formatPct(r.change)}</span> },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Published NAV series"
    detailFields={[
      { k: 'NAV', get: (r) => formatMoney(r.nav) },
      { k: 'Change', get: (r) => formatPct(r.change) },
      { k: 'Date', get: (r) => r.navDate },
      { k: 'Published by', get: (r) => r.createdBy },
    ]}
  />
);

export default NAVHistory;
