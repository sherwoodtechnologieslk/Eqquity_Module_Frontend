import React, { useState } from 'react';
import './Styles/DefineExpenses.css';

const emptyForm = {
  code: '',
  name: '',
  category: 'Fees',
  status: 'Active',
  description: ''
};

const DefineExpenses = () => {
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const save = () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) return;

    resetForm();
  };

  return (
    <div className="wmwm-define-expenses__root">
      <div className="wmwm-define-expenses__header">
        <div className="wmwm-define-expenses__kicker">Expense Master</div>
        <h1 className="wmwm-define-expenses__title">Define Expenses</h1>
        <p className="wmwm-define-expenses__subtitle">
          Create and maintain expense definitions (code, category, status) used by Wealth Manager.
        </p>
      </div>

      <div className="wmwm-define-expenses__container">
        <div className="wmwm-define-expenses__card">
          <div className="wmwm-define-expenses__cardHeader">
            <div className="wmwm-define-expenses__cardTitle">Define Expense</div>
            <button
              type="button"
              onClick={resetForm}
              className="wmwm-define-expenses__clearBtn"
            >
              Clear
            </button>
          </div>

          <div className="wmwm-define-expenses__body">
            <div className="wmwm-define-expenses__formGrid">
              <div className="wmwm-define-expenses__row2">
                <label className="wmwm-define-expenses__field">
                  Code
                  <input
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="EXP-###"
                    className="wmwm-define-expenses__input"
                  />
                </label>
                <label className="wmwm-define-expenses__field">
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="wmwm-define-expenses__select"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>
              </div>

              <label className="wmwm-define-expenses__field">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Expense name"
                  className="wmwm-define-expenses__input"
                />
              </label>

              <label className="wmwm-define-expenses__field">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="wmwm-define-expenses__select"
                >
                  <option>Fees</option>
                  <option>Operations</option>
                  <option>Compliance</option>
                  <option>Taxes</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="wmwm-define-expenses__field">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={4}
                  className="wmwm-define-expenses__textarea"
                />
              </label>

              <div className="wmwm-define-expenses__actions">
                <button
                  type="button"
                  onClick={save}
                  className="wmwm-define-expenses__saveBtn"
                >
                  Save
                </button>
              </div>
              <div className="wmwm-define-expenses__note">
                Note: This is currently a front-end mock. Hook it to the backend/API when ready.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefineExpenses;

