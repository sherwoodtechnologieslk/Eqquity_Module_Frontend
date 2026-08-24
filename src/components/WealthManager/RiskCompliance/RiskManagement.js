import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatPct } from '../shared/wealthOpsKit';

const RiskManagement = () => (
  <WealthOpsWorkbench
    title="Risk Management"
    blurb="Monitor concentration, liquidity, duration, and mandate breaches across unit trust and discretionary books."
    seedRows={[
      { id: 'RSK-EGF-01', name: 'Single-name cap', book: 'Equity Growth Fund', metric: 'JKH 8.4%', limit: '8.0%', utilisation: 105, status: 'Breached', notes: 'Trim plan with RM by T+2' },
      { id: 'RSK-BIF-02', name: 'Equity sleeve', book: 'Balanced Income Fund', metric: '48%', limit: '50%', utilisation: 96, status: 'Watch', notes: '' },
      { id: 'RSK-MMF-03', name: 'WAM', book: 'Money Market Fund', metric: '48 days', limit: '60 days', utilisation: 80, status: 'Ok', notes: '' },
      { id: 'RSK-WM003', name: 'Tracking error', book: 'Trust growth', metric: '6.1%', limit: '5.0%', utilisation: 122, status: 'Breached', notes: 'Policy review scheduled' },
      { id: 'RSK-FIF-04', name: 'Duration', book: 'Fixed Income Fund', metric: '3.2y', limit: '4.0y', utilisation: 80, status: 'Ok', notes: '' },
    ]}
    stats={(rows) => [
      { k: 'Breaches', v: rows.filter((r) => r.status === 'Breached').length, m: 'Need action', focus: true },
      { k: 'Watch', v: rows.filter((r) => r.status === 'Watch').length, m: '>80% of limit' },
      { k: 'Ok', v: rows.filter((r) => r.status === 'Ok').length, m: 'Within policy' },
      { k: 'Limits', v: rows.length, m: 'Monitored' },
    ]}
    statusTabs={['All', 'Ok', 'Watch', 'Breached']}
    extraFilter={{ key: 'book', label: 'Book' }}
    searchKeys={['id', 'name', 'book', 'metric']}
    columns={[
      { key: 'name', label: 'Limit', sub: 'id' },
      { key: 'book', label: 'Book' },
      { key: 'metric', label: 'Current' },
      { key: 'limit', label: 'Cap' },
      { key: 'utilisation', label: 'Use', render: (r) => formatPct(r.utilisation - 100).replace('+', '') === formatPct(r.utilisation - 100) ? `${r.utilisation}%` : `${r.utilisation}%` },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Risk limits"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => r.book}
    detailFields={[
      { k: 'Current', get: (r) => r.metric },
      { k: 'Limit', get: (r) => r.limit },
      { k: 'Utilisation', get: (r) => `${r.utilisation}%` },
      { k: 'Book', get: (r) => r.book },
    ]}
    statusActions={{
      Breached: [{ label: 'Move to watch', status: 'Watch', variant: 'ghost' }],
      Watch: [{ label: 'Mark ok', status: 'Ok', variant: 'solid' }],
    }}
  />
);

export default RiskManagement;
