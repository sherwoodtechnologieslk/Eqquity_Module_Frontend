import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const ExpenseMaster = () => (
  <WealthOpsWorkbench
    title="Expense Master"
    blurb="Central registry of fee and operating expense types used across fund accounting, NAV, and billing."
    seedRows={[
      {
        id: 'EXP-001',
        name: 'Management Fee',
        category: 'Fees',
        basis: 'AUM',
        frequency: 'Monthly',
        glCode: '501-010',
        typical: 1.5,
        status: 'Active',
        notes: 'Accrued daily, posted month-end against each fund.',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'EXP-002',
        name: 'Custody Fee',
        category: 'Fees',
        basis: 'AUM',
        frequency: 'Quarterly',
        glCode: '501-020',
        typical: 0.08,
        status: 'Active',
        notes: 'Trustee / custodian tariff.',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'EXP-003',
        name: 'Audit Expense',
        category: 'Operations',
        basis: 'Fixed',
        frequency: 'Annual',
        glCode: '501-110',
        typical: 0,
        status: 'Active',
        notes: 'Spread across dealing days in the audit year.',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'EXP-004',
        name: 'Regulatory Levy',
        category: 'Compliance',
        basis: 'AUM',
        frequency: 'Annual',
        glCode: '501-210',
        typical: 0.05,
        status: 'Inactive',
        notes: 'Superseded by the 2026 SEC schedule.',
        createdBy: 'Compliance',
      },
      {
        id: 'EXP-005',
        name: 'Trustee Fee',
        category: 'Fees',
        basis: 'AUM',
        frequency: 'Monthly',
        glCode: '501-030',
        typical: 0.15,
        status: 'Active',
        notes: '',
        createdBy: 'Product',
      },
      {
        id: 'EXP-006',
        name: 'WHT on income',
        category: 'Taxes',
        basis: 'Income',
        frequency: 'On event',
        glCode: '501-310',
        typical: 10,
        status: 'Active',
        notes: 'Withholding on taxable distributions.',
        createdBy: 'Tax Desk',
      },
    ]}
    stats={(rows) => [
      {
        k: 'Expense types',
        v: rows.length,
        m: 'In the registry',
        focus: true,
      },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Accruing in NAV' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Not charging' },
      { k: 'Categories', v: new Set(rows.map((r) => r.category)).size, m: 'Fees, ops, tax, compliance' },
    ]}
    statusTabs={['All', 'Active', 'Inactive']}
    extraFilter={{ key: 'category', label: 'Category' }}
    searchKeys={['id', 'name', 'category', 'glCode']}
    searchPlaceholder="Search code, name, GL…"
    columns={[
      { key: 'id', label: 'Code', sub: 'glCode' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'basis', label: 'Basis' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Expense types"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => `${r.id} · ${r.glCode}`}
    detailFields={[
      { k: 'Category', get: (r) => r.category },
      { k: 'Basis', get: (r) => r.basis },
      { k: 'Frequency', get: (r) => r.frequency },
      { k: 'Typical rate', get: (r) => (r.typical ? `${r.typical.toFixed(2)}%` : 'Fixed / ad hoc') },
      { k: 'GL account', get: (r) => r.glCode },
      { k: 'Owner', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Active: [{ label: 'Deactivate', status: 'Inactive', variant: 'ghost' }],
      Inactive: [{ label: 'Activate', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default ExpenseMaster;
