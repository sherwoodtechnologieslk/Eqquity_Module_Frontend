import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const CATEGORIES = ['Fees', 'Operations', 'Compliance', 'Taxes', 'Other'];
const BASES = ['AUM', 'NAV', 'Income', 'Fixed'];
const FREQUENCIES = ['Daily', 'Monthly', 'Quarterly', 'Annual', 'On event'];

const DefineExpenses = () => (
  <WealthOpsWorkbench
    title="Define Expenses"
    blurb="Create and maintain expense definitions — code, category, accrual basis, and GL mapping — used by Wealth Manager."
    newLabel="Save expense"
    formTitle="New expense definition"
    formHint="Codes should follow EXP-###. Active types accrue into the next NAV run."
    initialForm={{
      code: '',
      name: '',
      category: 'Fees',
      basis: 'AUM',
      frequency: 'Monthly',
      glCode: '',
      rate: '',
      status: 'Active',
      description: '',
    }}
    formFields={[
      { name: 'code', label: 'Code', placeholder: 'EXP-007' },
      { name: 'name', label: 'Name', placeholder: 'e.g. Registrar fee' },
      { name: 'category', label: 'Category', type: 'select', options: CATEGORIES },
      { name: 'basis', label: 'Basis', type: 'select', options: BASES },
      { name: 'frequency', label: 'Frequency', type: 'select', options: FREQUENCIES },
      { name: 'glCode', label: 'GL account', placeholder: '501-xxx' },
      { name: 'rate', label: 'Typical rate %', type: 'number', min: 0, step: '0.01', placeholder: '0.00' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      { name: 'description', label: 'Description', wide: true, placeholder: 'Optional notes for fund accounting' },
    ]}
    estimate={(form) => {
      const rate = parseFloat(form.rate);
      const rateLabel = Number.isFinite(rate) && rate > 0 ? `${rate.toFixed(2)}% of ${form.basis}` : form.basis;
      return `${form.code || 'EXP-###'} · ${form.name || 'New type'} · ${rateLabel}`;
    }}
    validateForm={(form) => {
      if (!form.code.trim() || !form.name.trim()) return 'Enter a code and name.';
      return '';
    }}
    buildRow={(form, rows) => ({
      id: form.code.trim().toUpperCase() || `EXP-${String(10 + rows.length).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      basis: form.basis,
      frequency: form.frequency,
      glCode: form.glCode.trim() || '—',
      rate: parseFloat(form.rate) || 0,
      status: form.status,
      notes: form.description,
      createdBy: 'Sherwood Wealth Team',
    })}
    seedRows={[
      {
        id: 'EXP-001',
        name: 'Management Fee',
        category: 'Fees',
        basis: 'AUM',
        frequency: 'Monthly',
        glCode: '501-010',
        rate: 1.5,
        status: 'Active',
        notes: 'Accrued daily, posted month-end.',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'EXP-002',
        name: 'Custody Fee',
        category: 'Fees',
        basis: 'AUM',
        frequency: 'Quarterly',
        glCode: '501-020',
        rate: 0.08,
        status: 'Active',
        notes: '',
        createdBy: 'Fund Accounting',
      },
      {
        id: 'EXP-003',
        name: 'Audit Expense',
        category: 'Operations',
        basis: 'Fixed',
        frequency: 'Annual',
        glCode: '501-110',
        rate: 0,
        status: 'Active',
        notes: 'Fixed retainer spread across the year.',
        createdBy: 'Fund Accounting',
      },
    ]}
    stats={(rows) => [
      { k: 'Definitions', v: rows.length, m: 'Saved types', focus: true },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Will accrue' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Held back' },
      { k: 'Categories', v: new Set(rows.map((r) => r.category)).size, m: 'In use' },
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
    boardTitle="Defined expenses"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => `${r.id} · ${r.glCode}`}
    detailFields={[
      { k: 'Category', get: (r) => r.category },
      { k: 'Basis', get: (r) => r.basis },
      { k: 'Frequency', get: (r) => r.frequency },
      { k: 'Typical rate', get: (r) => (r.rate ? `${r.rate.toFixed(2)}%` : 'Fixed / ad hoc') },
      { k: 'GL account', get: (r) => r.glCode },
      { k: 'Created by', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Active: [{ label: 'Deactivate', status: 'Inactive', variant: 'ghost' }],
      Inactive: [{ label: 'Activate', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default DefineExpenses;
