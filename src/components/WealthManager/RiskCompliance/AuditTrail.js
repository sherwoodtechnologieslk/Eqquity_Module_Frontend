import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const AuditTrail = () => (
  <WealthOpsWorkbench
    title="Audit Trail"
    blurb="Immutable activity log for dealing, NAV publication, approvals, and master-data changes."
    seedRows={[
      { id: 'AUD-9021', when: '2026-08-21 10:14', actor: 'n.fernando', action: 'Published NAV', book: 'EGF', status: 'Posted', notes: 'NAV 25.45 locked' },
      { id: 'AUD-9018', when: '2026-08-21 09:41', actor: 's.jayasuriya', action: 'Approved redemption', book: 'MMF / CLT-000257', status: 'Posted', notes: 'APR-441' },
      { id: 'AUD-9012', when: '2026-08-20 16:22', actor: 'system', action: 'SIP debit file loaded', book: 'BLK-058', status: 'Posted', notes: '186 lines' },
      { id: 'AUD-9004', when: '2026-08-20 11:05', actor: 'a.sehansa', action: 'Updated fee table', book: 'EGF AMC', status: 'Posted', notes: '1.50% → 1.45% effective 1 Sep' },
      { id: 'AUD-8991', when: '2026-08-19 14:18', actor: 'c.perera', action: 'Rejected KYC', book: 'CLT-000441', status: 'Posted', notes: 'Expired NIC' },
    ]}
    stats={(rows) => [
      { k: 'Events', v: rows.length, m: 'Last 72 hours', focus: true },
      { k: 'Users', v: new Set(rows.map((r) => r.actor)).size, m: 'Distinct actors' },
      { k: 'System', v: rows.filter((r) => r.actor === 'system').length, m: 'Automated' },
      { k: 'Posted', v: rows.filter((r) => r.status === 'Posted').length, m: 'Immutable' },
    ]}
    statusTabs={['All', 'Posted']}
    extraFilter={{ key: 'actor', label: 'Actor' }}
    searchKeys={['id', 'actor', 'action', 'book', 'notes']}
    searchPlaceholder="Search actor, action, book…"
    columns={[
      { key: 'when', label: 'When' },
      { key: 'actor', label: 'Actor' },
      { key: 'action', label: 'Action' },
      { key: 'book', label: 'Book' },
      { key: 'id', label: 'Event' },
    ]}
    boardTitle="Activity log"
    detailTitle={(r) => r.action}
    detailSubtitle={(r) => `${r.actor} · ${r.when}`}
    detailFields={[
      { k: 'Event', get: (r) => r.id },
      { k: 'Book', get: (r) => r.book },
      { k: 'Actor', get: (r) => r.actor },
      { k: 'When', get: (r) => r.when },
    ]}
  />
);

export default AuditTrail;
