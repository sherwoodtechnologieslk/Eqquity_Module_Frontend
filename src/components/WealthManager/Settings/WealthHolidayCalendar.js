import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { todayISO } from '../shared/wealthOpsKit';

const WealthHolidayCalendar = () => (
  <WealthOpsWorkbench
    title="Holiday Calendar"
    blurb="Dealing calendar for unit trusts — CSE holidays, trustee non-value days, and fund-specific closures."
    newLabel="Add holiday"
    formTitle="New non-dealing day"
    initialForm={{ name: '', date: todayISO(), market: 'CSE', applies: 'All funds', notes: '' }}
    formFields={[
      { name: 'name', label: 'Name', placeholder: 'e.g. Maha Shivaratri' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'market', label: 'Calendar', type: 'select', options: ['CSE', 'CBSL', 'Trustee', 'Internal'] },
      { name: 'applies', label: 'Applies to', type: 'select', options: ['All funds', 'Equity funds', 'Money market only'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.name || 'Holiday'} · ${form.date} · ${form.market}`}
    validateForm={(form) => (!form.name ? 'Enter a holiday name.' : '')}
    buildRow={(form, rows) => ({
      id: `HOL-${form.date}-${rows.length + 1}`,
      name: form.name,
      date: form.date,
      market: form.market,
      applies: form.applies,
      status: 'Active',
      notes: form.notes,
      createdBy: 'Ops Desk',
    })}
    seedRows={[
      { id: 'HOL-2026-02-04', name: 'Independence Day', date: '2026-02-04', market: 'CSE', applies: 'All funds', status: 'Active', notes: '', createdBy: 'Ops Desk' },
      { id: 'HOL-2026-04-13', name: 'Sinhala & Tamil New Year', date: '2026-04-13', market: 'CSE', applies: 'All funds', status: 'Active', notes: '', createdBy: 'Ops Desk' },
      { id: 'HOL-2026-05-01', name: 'May Day', date: '2026-05-01', market: 'CSE', applies: 'All funds', status: 'Active', notes: '', createdBy: 'Ops Desk' },
      { id: 'HOL-2026-12-25', name: 'Christmas Day', date: '2026-12-25', market: 'CSE', applies: 'All funds', status: 'Active', notes: '', createdBy: 'Ops Desk' },
    ]}
    stats={(rows) => [
      { k: 'Holidays', v: rows.length, m: 'This calendar', focus: true },
      { k: 'CSE', v: rows.filter((r) => r.market === 'CSE').length, m: 'Exchange closures' },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Blocking dealing' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Removed' },
    ]}
    statusTabs={['All', 'Active', 'Inactive']}
    extraFilter={{ key: 'market', label: 'Calendar' }}
    searchKeys={['id', 'name', 'market']}
    columns={[
      { key: 'date', label: 'Date' },
      { key: 'name', label: 'Holiday' },
      { key: 'market', label: 'Calendar' },
      { key: 'applies', label: 'Applies to' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Non-dealing days"
    detailFields={[
      { k: 'Date', get: (r) => r.date },
      { k: 'Calendar', get: (r) => r.market },
      { k: 'Applies to', get: (r) => r.applies },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Active: [{ label: 'Deactivate', status: 'Inactive', variant: 'ghost' }],
      Inactive: [{ label: 'Activate', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default WealthHolidayCalendar;
