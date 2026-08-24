import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';
import { FUNDS, formatMoney, todayISO } from '../shared/wealthOpsKit';

const WealthJournalEntries = () => (
  <WealthOpsWorkbench
    title="Journal Entries"
    blurb="Post fund-accounting journals for income, expenses, NAV equalisation, and manual adjustments."
    newLabel="Post journal"
    formTitle="New journal"
    initialForm={{
      fundId: FUNDS[0].id,
      jeDate: todayISO(),
      debit: 'Assets – investments',
      credit: 'Income – dividends',
      amount: '',
      narration: '',
    }}
    formFields={[
      { name: 'fundId', label: 'Fund', type: 'select', options: FUNDS.map((f) => ({ value: f.id, label: f.name })) },
      { name: 'jeDate', label: 'Date', type: 'date' },
      {
        name: 'debit',
        label: 'Debit account',
        type: 'select',
        options: ['Assets – investments', 'Cash – trustee', 'Expense – management fee', 'Units – capital'],
      },
      {
        name: 'credit',
        label: 'Credit account',
        type: 'select',
        options: ['Income – dividends', 'Income – interest', 'Liability – redemptions', 'Income – equalisation'],
      },
      { name: 'amount', label: 'Amount (LKR)', type: 'number', min: 0, step: '0.01' },
      { name: 'narration', label: 'Narration', wide: true },
    ]}
    estimate={(form) => `${formatMoney(parseFloat(form.amount) || 0)} · ${form.debit} / ${form.credit}`}
    validateForm={(form) => ((parseFloat(form.amount) || 0) <= 0 ? 'Enter a journal amount.' : '')}
    buildRow={(form, rows) => {
      const fund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
      return {
        id: `JE-${String(1840 + rows.length + 1)}`,
        fundName: fund.name,
        jeDate: form.jeDate,
        debit: form.debit,
        credit: form.credit,
        amount: parseFloat(form.amount) || 0,
        status: 'Posted',
        notes: form.narration,
        createdBy: 'Fund Accounting',
      };
    }}
    seedRows={[
      { id: 'JE-1844', fundName: 'Equity Growth Fund', jeDate: '2026-08-21', debit: 'Assets – investments', credit: 'Income – dividends', amount: 1_240_000, status: 'Posted', notes: 'CSE dividend COMB', createdBy: 'Fund Accounting' },
      { id: 'JE-1843', fundName: 'Balanced Income Fund', jeDate: '2026-08-21', debit: 'Expense – management fee', credit: 'Liability – fees', amount: 186_400, status: 'Posted', notes: 'August AMC accrual', createdBy: 'Fund Accounting' },
      { id: 'JE-1841', fundName: 'Money Market Fund', jeDate: '2026-08-20', debit: 'Cash – trustee', credit: 'Units – capital', amount: 15_000_000, status: 'Draft', notes: 'Subscription equalisation', createdBy: 'Ops Desk' },
    ]}
    stats={(rows) => [
      { k: 'Posted value', v: formatMoney(rows.filter((r) => r.status === 'Posted').reduce((s, r) => s + r.amount, 0)), m: 'Balanced journals', focus: true },
      { k: 'Journals', v: rows.length, m: 'In view' },
      { k: 'Posted', v: rows.filter((r) => r.status === 'Posted').length, m: 'In the GL' },
      { k: 'Draft', v: rows.filter((r) => r.status === 'Draft').length, m: 'Unposted' },
    ]}
    statusTabs={['All', 'Draft', 'Posted']}
    extraFilter={{ key: 'fundName', label: 'Fund' }}
    searchKeys={['id', 'fundName', 'debit', 'credit', 'notes']}
    columns={[
      { key: 'id', label: 'Journal' },
      { key: 'fundName', label: 'Fund' },
      { key: 'jeDate', label: 'Date' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Credit' },
      { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount) },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Journal book"
    detailFields={[
      { k: 'Debit', get: (r) => r.debit },
      { k: 'Credit', get: (r) => r.credit },
      { k: 'Amount', get: (r) => formatMoney(r.amount) },
      { k: 'Date', get: (r) => r.jeDate },
    ]}
    statusActions={{
      Draft: [{ label: 'Post', status: 'Posted', variant: 'solid' }],
    }}
  />
);

export default WealthJournalEntries;
