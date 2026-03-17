import React, { useMemo, useState } from 'react';
import './Styles/ExpenseMaster.css';

const ExpenseMaster = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [expenses] = useState([
    { id: 'EXP-001', name: 'Management Fee', category: 'Fees', status: 'Active' },
    { id: 'EXP-002', name: 'Custody Fee', category: 'Fees', status: 'Active' },
    { id: 'EXP-003', name: 'Audit Expense', category: 'Operations', status: 'Active' },
    { id: 'EXP-004', name: 'Regulatory Levy', category: 'Compliance', status: 'Inactive' }
  ]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(expenses.map((e) => e.category)))],
    [expenses]
  );

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || e.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, category]);

  const summary = useMemo(() => {
    const total = expenses.length;
    const active = expenses.filter((e) => e.status === 'Active').length;
    const inactive = expenses.filter((e) => e.status !== 'Active').length;
    const distinctCategories = new Set(expenses.map((e) => e.category)).size;
    return { total, active, inactive, distinctCategories };
  }, [expenses]);

  const categoriesForLegend = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))),
    [expenses]
  );

  return (
    <div className="wmwm-expense-master__root">
      <div className="wmwm-expense-master__header">
        <div className="wmwm-expense-master__headerMain">
          <div>
            <div className="wmwm-expense-master__kicker">Master Data</div>
            <h1 className="wmwm-expense-master__title">Expense Master</h1>
            <p className="wmwm-expense-master__subtitle">
              Central registry for all fee and operating expense definitions used across Wealth
              Manager.
            </p>
          </div>
          <div className="wmwm-expense-master__headerIcon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 5.5C4 4.12 5.12 3 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a.5.5 0 0 1-.8.4L15 16.5l-4.2 2.4a.5.5 0 0 1-.5 0L6 16.5l-3.2 2.4A.5.5 0 0 1 2 18.5v-13C2 4.12 3.12 3 4.5 3H5a1 1 0 0 0-1 1v1.5z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="wmwm-expense-master__filters">
        <div className="wmwm-expense-master__filtersLeft">
          <div className="wmwm-expense-master__filtersLabel">Filter expenses</div>
          <div className="wmwm-expense-master__inputWrap">
            <span className="wmwm-expense-master__inputIcon">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M8.5 3a5.5 5.5 0 014.383 8.84l3.139 3.138a1 1 0 01-1.414 1.415l-3.138-3.139A5.5 5.5 0 118.5 3zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code…"
              className="wmwm-expense-master__input"
            />
          </div>
        </div>
        <div className="wmwm-expense-master__filtersRight">
          <div className="wmwm-expense-master__filtersLabel">Category</div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="wmwm-expense-master__select"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="wmwm-expense-master__summaryBar">
        <div className="wmwm-expense-master__summaryChip wmwm-expense-master__summaryChip--primary">
          <span className="wmwm-expense-master__summaryLabel">Total expense types</span>
          <span className="wmwm-expense-master__summaryValue">{summary.total}</span>
        </div>
        <div className="wmwm-expense-master__summaryChip">
          <span className="wmwm-expense-master__summaryLabel">Active</span>
          <span className="wmwm-expense-master__summaryValue">{summary.active}</span>
        </div>
        <div className="wmwm-expense-master__summaryChip">
          <span className="wmwm-expense-master__summaryLabel">Inactive</span>
          <span className="wmwm-expense-master__summaryValue">{summary.inactive}</span>
        </div>
        <div className="wmwm-expense-master__summaryChip">
          <span className="wmwm-expense-master__summaryLabel">Categories</span>
          <span className="wmwm-expense-master__summaryValue">
            {summary.distinctCategories}
          </span>
        </div>
      </div>

      {categoriesForLegend.length > 0 && (
        <div className="wmwm-expense-master__categoryLegend">
          {categoriesForLegend.map((c) => (
            <span key={c} className="wmwm-expense-master__categoryPill">
              <span className="wmwm-expense-master__categoryDot" />
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="wmwm-expense-master__card">
        <div className="wmwm-expense-master__cardHeader">
          <div className="wmwm-expense-master__cardTitle">Expense Types</div>
          <div className="wmwm-expense-master__cardHeaderRight">
            <div className="wmwm-expense-master__cardMeta">{filtered.length} item(s)</div>
            <button
              type="button"
              className="wmwm-expense-master__primaryBtn"
              onClick={() => {}}
            >
              + New expense type
            </button>
          </div>
        </div>

        <div className="wmwm-expense-master__tableWrap">
          <table className="wmwm-expense-master__table">
            <thead>
              <tr>
                <th className="wmwm-expense-master__th">Code</th>
                <th className="wmwm-expense-master__th">Name</th>
                <th className="wmwm-expense-master__th">Category</th>
                <th className="wmwm-expense-master__th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="wmwm-expense-master__td">
                    <span className="wmwm-expense-master__mono">{e.id}</span>
                  </td>
                  <td className="wmwm-expense-master__td">{e.name}</td>
                  <td className="wmwm-expense-master__td">{e.category}</td>
                  <td className="wmwm-expense-master__td">
                    <span
                      className={[
                        'wmwm-expense-master__statusPill',
                        e.status === 'Active'
                          ? 'wmwm-expense-master__statusPill--active'
                          : 'wmwm-expense-master__statusPill--inactive'
                      ].join(' ')}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="wmwm-expense-master__empty">
                    No expense types match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseMaster;

