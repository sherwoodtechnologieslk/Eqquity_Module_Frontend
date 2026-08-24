import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const ComplianceMonitoring = () => (
  <WealthOpsWorkbench
    title="Compliance Monitoring"
    blurb="Open compliance items: KYC ageing, mandate breaches, marketing reviews, and trustee exceptions."
    seedRows={[
      { id: 'CMP-221', item: 'KYC refresh overdue', owner: 'Compliance Desk', due: '2026-08-12', book: 'CLT-000441', status: 'Overdue', notes: 'NIC expired' },
      { id: 'CMP-218', item: 'Factsheet disclaimer', owner: 'Product', due: '2026-08-25', book: 'EGF', status: 'In review', notes: '' },
      { id: 'CMP-214', item: 'Related-party dealing', owner: 'Compliance Desk', due: '2026-08-22', book: 'WM002', status: 'Watch', notes: 'Omega CP holding' },
      { id: 'CMP-209', item: 'Marketing pack sign-off', owner: 'Legal', due: '2026-08-28', book: 'All funds', status: 'Ok', notes: 'Approved 18 Aug' },
    ]}
    stats={(rows) => [
      { k: 'Open items', v: rows.filter((r) => r.status !== 'Ok').length, m: 'Not closed', focus: true },
      { k: 'Overdue', v: rows.filter((r) => r.status === 'Overdue').length, m: 'Past due date' },
      { k: 'In review', v: rows.filter((r) => r.status === 'In review').length, m: 'With owner' },
      { k: 'Closed', v: rows.filter((r) => r.status === 'Ok').length, m: 'This month' },
    ]}
    statusTabs={['All', 'Overdue', 'Watch', 'In review', 'Ok']}
    extraFilter={{ key: 'owner', label: 'Owner' }}
    searchKeys={['id', 'item', 'book', 'owner']}
    columns={[
      { key: 'id', label: 'Item' },
      { key: 'item', label: 'Issue' },
      { key: 'book', label: 'Book / client' },
      { key: 'owner', label: 'Owner' },
      { key: 'due', label: 'Due' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Compliance book"
    detailFields={[
      { k: 'Owner', get: (r) => r.owner },
      { k: 'Due', get: (r) => r.due },
      { k: 'Book', get: (r) => r.book },
      { k: 'Issue', get: (r) => r.item },
    ]}
    statusActions={{
      Overdue: [{ label: 'Move to review', status: 'In review', variant: 'solid' }],
      'In review': [{ label: 'Close', status: 'Ok', variant: 'solid' }],
      Watch: [{ label: 'Close', status: 'Ok', variant: 'solid' }],
    }}
  />
);

export default ComplianceMonitoring;
