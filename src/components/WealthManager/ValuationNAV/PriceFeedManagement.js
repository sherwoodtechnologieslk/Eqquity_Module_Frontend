import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const PriceFeedManagement = () => (
  <WealthOpsWorkbench
    title="Price Feed Management"
    blurb="Monitor market data vendors, last snapshot time, and stale-price exceptions used in NAV."
    seedRows={[
      { id: 'CSE-EQ', name: 'CSE equity close', vendor: 'CSE Data', lastSnap: '2026-08-21 15:32', instruments: 284, stale: 0, status: 'Active', notes: '' },
      { id: 'CBSL-GS', name: 'CBSL gilt curve', vendor: 'CBSL', lastSnap: '2026-08-21 16:05', instruments: 42, stale: 0, status: 'Active', notes: '' },
      { id: 'BB-MM', name: 'Broker money market', vendor: 'Primary dealers', lastSnap: '2026-08-21 12:40', instruments: 18, stale: 2, status: 'Watch', notes: 'Two CP quotes older than T-1' },
      { id: 'FX-LKR', name: 'LKR spot', vendor: 'CBSL', lastSnap: '2026-08-21 16:00', instruments: 1, stale: 0, status: 'Active', notes: '' },
      { id: 'MANUAL', name: 'Unlisted / OTC', vendor: 'Manual', lastSnap: '2026-08-15 10:00', instruments: 6, stale: 6, status: 'Watch', notes: 'Quarterly valuation policy' },
    ]}
    stats={(rows) => [
      { k: 'Feeds', v: rows.length, m: 'Configured sources', focus: true },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Healthy' },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: 'Needs attention' },
      { k: 'Stale lines', v: rows.reduce((s, r) => s + r.stale, 0), m: 'Across all feeds' },
    ]}
    statusTabs={['All', 'Active', 'Watch', 'Inactive']}
    extraFilter={{ key: 'vendor', label: 'Vendor' }}
    searchKeys={['id', 'name', 'vendor']}
    columns={[
      { key: 'name', label: 'Feed', sub: 'id' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'lastSnap', label: 'Last snapshot' },
      { key: 'instruments', label: 'Lines' },
      { key: 'stale', label: 'Stale' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Price sources"
    detailFields={[
      { k: 'Vendor', get: (r) => r.vendor },
      { k: 'Last snapshot', get: (r) => r.lastSnap },
      { k: 'Instruments', get: (r) => r.instruments },
      { k: 'Stale', get: (r) => r.stale },
    ]}
    statusActions={{
      Active: [{ label: 'Put on watch', status: 'Watch', variant: 'ghost' }],
      Watch: [{ label: 'Mark active', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default PriceFeedManagement;
