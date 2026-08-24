import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const RegulatoryCompliance = () => (
  <WealthOpsWorkbench
    title="Regulatory Compliance"
    blurb="Filing calendar for SEC unit-trust returns, CBSL stats, trustee certificates, and AML reviews."
    seedRows={[
      { id: 'FIL-SEC-08', filing: 'SEC monthly UT return', regulator: 'SEC', due: '2026-09-10', period: 'Aug 2026', status: 'Queued', notes: '' },
      { id: 'FIL-CBSL-Q2', filing: 'CBSL statistical return', regulator: 'CBSL', due: '2026-08-31', period: 'Q2 2026', status: 'In review', notes: '' },
      { id: 'FIL-TRU-07', filing: 'Trustee compliance cert', regulator: 'Trustee', due: '2026-08-15', period: 'Jul 2026', status: 'Completed', notes: 'Filed 14 Aug' },
      { id: 'FIL-AML-Q3', filing: 'AML risk assessment', regulator: 'FIU', due: '2026-09-30', period: 'Q3 2026', status: 'Queued', notes: '' },
    ]}
    stats={(rows) => [
      { k: 'Open filings', v: rows.filter((r) => r.status !== 'Completed').length, m: 'Not yet filed', focus: true },
      { k: 'In review', v: rows.filter((r) => r.status === 'In review').length, m: 'Internal sign-off' },
      { k: 'Completed', v: rows.filter((r) => r.status === 'Completed').length, m: 'This quarter' },
      { k: 'Regulators', v: new Set(rows.map((r) => r.regulator)).size, m: 'Covered' },
    ]}
    statusTabs={['All', 'Queued', 'In review', 'Completed']}
    extraFilter={{ key: 'regulator', label: 'Regulator' }}
    searchKeys={['id', 'filing', 'regulator', 'period']}
    columns={[
      { key: 'id', label: 'Filing' },
      { key: 'filing', label: 'Return' },
      { key: 'regulator', label: 'Regulator' },
      { key: 'period', label: 'Period' },
      { key: 'due', label: 'Due' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Filing calendar"
    detailFields={[
      { k: 'Regulator', get: (r) => r.regulator },
      { k: 'Period', get: (r) => r.period },
      { k: 'Due', get: (r) => r.due },
      { k: 'Return', get: (r) => r.filing },
    ]}
    statusActions={{
      Queued: [{ label: 'Send for review', status: 'In review', variant: 'solid' }],
      'In review': [{ label: 'Mark filed', status: 'Completed', variant: 'solid' }],
    }}
  />
);

export default RegulatoryCompliance;
