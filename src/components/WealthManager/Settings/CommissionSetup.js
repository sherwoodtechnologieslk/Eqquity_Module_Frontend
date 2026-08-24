import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const CommissionSetup = () => (
  <WealthOpsWorkbench
    title="Commission Setup"
    blurb="Distributor and RM trail / upfront grids used when allotting unit-trust subscriptions."
    newLabel="Add grid"
    formTitle="New commission grid"
    initialForm={{ channel: 'IFA', product: 'Equity Growth Fund', upfront: '', trail: '', notes: '' }}
    formFields={[
      { name: 'channel', label: 'Channel', type: 'select', options: ['IFA', 'Bank branch', 'RM desk', 'Online'] },
      { name: 'product', label: 'Product', type: 'select', options: ['Equity Growth Fund', 'Balanced Income Fund', 'Fixed Income Fund', 'Money Market Fund'] },
      { name: 'upfront', label: 'Upfront %', type: 'number', min: 0, step: '0.01' },
      { name: 'trail', label: 'Trail % p.a.', type: 'number', min: 0, step: '0.01' },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => `${form.channel} · ${form.product} · ${form.upfront || 0}% / ${form.trail || 0}% trail`}
    buildRow={(form, rows) => ({
      id: `COM-${String(10 + rows.length + 1)}`,
      channel: form.channel,
      product: form.product,
      upfront: parseFloat(form.upfront) || 0,
      trail: parseFloat(form.trail) || 0,
      status: 'Active',
      notes: form.notes,
      createdBy: 'Distribution',
    })}
    seedRows={[
      { id: 'COM-012', channel: 'IFA', product: 'Equity Growth Fund', upfront: 1.0, trail: 0.35, status: 'Active', notes: '', createdBy: 'Distribution' },
      { id: 'COM-011', channel: 'Bank branch', product: 'Money Market Fund', upfront: 0.15, trail: 0.1, status: 'Active', notes: '', createdBy: 'Distribution' },
      { id: 'COM-009', channel: 'RM desk', product: 'Balanced Income Fund', upfront: 0.5, trail: 0.25, status: 'Active', notes: '', createdBy: 'Distribution' },
      { id: 'COM-007', channel: 'Online', product: 'Index Fund', upfront: 0, trail: 0.15, status: 'Inactive', notes: 'Promo ended', createdBy: 'Distribution' },
    ]}
    stats={(rows) => [
      { k: 'Grids', v: rows.length, m: 'Configured', focus: true },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Paying' },
      { k: 'Channels', v: new Set(rows.map((r) => r.channel)).size, m: 'Covered' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Retired' },
    ]}
    statusTabs={['All', 'Active', 'Inactive']}
    extraFilter={{ key: 'channel', label: 'Channel' }}
    searchKeys={['id', 'channel', 'product']}
    columns={[
      { key: 'id', label: 'Grid' },
      { key: 'channel', label: 'Channel' },
      { key: 'product', label: 'Product' },
      { key: 'upfront', label: 'Upfront', render: (r) => `${r.upfront.toFixed(2)}%` },
      { key: 'trail', label: 'Trail', render: (r) => `${r.trail.toFixed(2)}%` },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Commission grids"
    detailFields={[
      { k: 'Upfront', get: (r) => `${r.upfront.toFixed(2)}%` },
      { k: 'Trail', get: (r) => `${r.trail.toFixed(2)}% p.a.` },
      { k: 'Channel', get: (r) => r.channel },
      { k: 'Product', get: (r) => r.product },
    ]}
    statusActions={{
      Active: [{ label: 'Deactivate', status: 'Inactive', variant: 'ghost' }],
      Inactive: [{ label: 'Activate', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default CommissionSetup;
