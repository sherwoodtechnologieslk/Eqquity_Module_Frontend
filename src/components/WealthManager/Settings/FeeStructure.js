import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS } from '../shared/wealthOpsKit';

const FeeStructure = () => (
  <WealthOpsWorkbench
    title="Fee Structure"
    blurb="Management, trustee, custody, and performance fees applied to each fund and discretionary mandate."
    newLabel="Add fee"
    formTitle="New fee line"
    initialForm={{ fundId: FUNDS[0].id, feeType: 'Management', rate: '', basis: 'AUM', notes: '' }}
    formFields={[
      { name: 'fundId', label: 'Fund / book', type: 'select', options: FUNDS.map((f) => ({ value: f.id, label: f.name })) },
      { name: 'feeType', label: 'Fee', type: 'select', options: ['Management', 'Trustee', 'Custody', 'Performance', 'Exit'] },
      { name: 'rate', label: 'Rate %', type: 'number', min: 0, step: '0.01' },
      { name: 'basis', label: 'Basis', type: 'select', options: ['AUM', 'NAV', 'Performance hurdle'] },
      { name: 'notes', label: 'Notes', wide: true },
    ]}
    estimate={(form) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return `${fund.name} · ${form.feeType} ${form.rate || 0}% of ${form.basis}`;
    }}
    validateForm={(form) => ((parseFloat(form.rate) || 0) <= 0 ? 'Enter a fee rate.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return {
        id: `FEE-${String(20 + rows.length + 1)}`,
        fundName: fund.name,
        feeType: form.feeType,
        rate: parseFloat(form.rate) || 0,
        basis: form.basis,
        status: 'Active',
        notes: form.notes,
        createdBy: 'Product',
      };
    }}
    seedRows={[
      { id: 'FEE-021', fundName: 'Equity Growth Fund', feeType: 'Management', rate: 1.5, basis: 'AUM', status: 'Active', notes: '', createdBy: 'Product' },
      { id: 'FEE-018', fundName: 'Equity Growth Fund', feeType: 'Trustee', rate: 0.15, basis: 'AUM', status: 'Active', notes: '', createdBy: 'Product' },
      { id: 'FEE-016', fundName: 'Money Market Fund', feeType: 'Management', rate: 0.45, basis: 'AUM', status: 'Active', notes: '', createdBy: 'Product' },
      { id: 'FEE-012', fundName: 'Balanced Income Fund', feeType: 'Exit', rate: 0.5, basis: 'NAV', status: 'Inactive', notes: 'Waived after 1 year', createdBy: 'Product' },
    ]}
    stats={(rows) => [
      { k: 'Fee lines', v: rows.length, m: 'Configured', focus: true },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Accruing' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Not charging' },
      { k: 'Funds', v: new Set(rows.map((r) => r.fundName)).size, m: 'Covered' },
    ]}
    statusTabs={['All', 'Active', 'Inactive']}
    extraFilter={{ key: 'feeType', label: 'Fee' }}
    searchKeys={['id', 'fundName', 'feeType']}
    columns={[
      { key: 'id', label: 'Fee' },
      { key: 'fundName', label: 'Fund' },
      { key: 'feeType', label: 'Type' },
      { key: 'rate', label: 'Rate', render: (r) => `${r.rate.toFixed(2)}%` },
      { key: 'basis', label: 'Basis' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Fee table"
    detailFields={[
      { k: 'Rate', get: (r) => `${r.rate.toFixed(2)}%` },
      { k: 'Basis', get: (r) => r.basis },
      { k: 'Fund', get: (r) => r.fundName },
      { k: 'Owner', get: (r) => r.createdBy },
    ]}
    statusActions={{
      Active: [{ label: 'Deactivate', status: 'Inactive', variant: 'ghost' }],
      Inactive: [{ label: 'Activate', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default FeeStructure;
