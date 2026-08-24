import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { formatCompact, formatMoney } from '../shared/wealthOpsKit';

const MaturityCalendar = () => (
  <WealthOpsWorkbench
    title="Maturity Calendar"
    blurb="Upcoming T-bill and T-bond maturities and coupons so cash can be pre-funded in trustee accounts."
    seedRows={[
      {
        id: 'MAT-20261120-TB',
        instrument: '91-day T-bill',
        isin: 'LKB01026C153',
        type: 'Maturity',
        fundName: 'Money Market Fund',
        face: 250_000_000,
        date: '2026-11-20',
        days: 90,
        status: 'Scheduled',
        notes: 'Roll into next 91-day auction unless instructed',
      },
      {
        id: 'MAT-20260915-CPN',
        instrument: '2-year T-bond 9.50%',
        isin: 'LKB01528C157',
        type: 'Coupon',
        fundName: 'Balanced Income Fund',
        face: 5_700_000,
        date: '2026-09-15',
        days: 24,
        status: 'Scheduled',
        notes: 'Semi-annual coupon',
      },
      {
        id: 'MAT-20270219-TB',
        instrument: '182-day T-bill',
        isin: 'LKB01026F151',
        type: 'Maturity',
        fundName: 'Fixed Income Fund',
        face: 180_000_000,
        date: '2027-02-19',
        days: 181,
        status: 'Scheduled',
        notes: '',
      },
      {
        id: 'MAT-20260815-CPN',
        instrument: '5-year T-bond 10.25%',
        isin: 'LKB02030A152',
        type: 'Coupon',
        fundName: 'Fixed Income Fund',
        face: 4_612_500,
        date: '2026-08-15',
        days: -7,
        status: 'Paid',
        notes: 'Posted to trustee cash',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Next 90 days',
        v: formatCompact(
          rows.filter((r) => r.status === 'Scheduled' && r.days <= 90).reduce((s, r) => s + r.face, 0)
        ),
        m: 'Maturity + coupon cash',
        focus: true,
      },
      { k: 'Events', v: rows.length, m: 'On the calendar' },
      { k: 'Scheduled', v: rows.filter((r) => r.status === 'Scheduled').length, m: 'Still open' },
      { k: 'Paid', v: rows.filter((r) => r.status === 'Paid').length, m: 'Settled to cash' },
    ]}
    statusTabs={['All', 'Scheduled', 'Paid']}
    extraFilter={{ key: 'type', label: 'Type' }}
    searchKeys={['id', 'instrument', 'isin', 'fundName']}
    columns={[
      { key: 'date', label: 'Date' },
      { key: 'instrument', label: 'Instrument', sub: 'isin' },
      { key: 'type', label: 'Event' },
      { key: 'fundName', label: 'Book' },
      { key: 'face', label: 'Amount', render: (r) => formatMoney(r.face) },
      { key: 'days', label: 'Days', render: (r) => (r.days >= 0 ? r.days : 'Past') },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Cash events"
    detailTitle={(r) => r.instrument}
    detailSubtitle={(r) => `${r.type} · ${r.date}`}
    detailFields={[
      { k: 'Amount', get: (r) => formatMoney(r.face) },
      { k: 'ISIN', get: (r) => r.isin },
      { k: 'Book', get: (r) => r.fundName },
      { k: 'Days to event', get: (r) => (r.days >= 0 ? `${r.days} days` : 'Past') },
    ]}
    statusActions={{
      Scheduled: [{ label: 'Mark paid', status: 'Paid', variant: 'solid' }],
    }}
  />
);

export default MaturityCalendar;
