import React, { useMemo, useState } from 'react';
import { getToday, formatCurrency, formatDisplayDate } from './accountingVoucherUtils';
import '../MasterDataManagement/Styles/EquityMasterEntry.css';
import './Styles/InternalBankTransfer.css';

const TRANSFER_PREFIX = 'BT';

const toYmdCompact = (dateYmd) =>
  String(dateYmd || getToday()).substring(0, 10).replace(/-/g, '');

const generateTransferRef = (dateYmd, existing = []) => {
  const datePart = toYmdCompact(dateYmd);
  const pattern = new RegExp(`^${TRANSFER_PREFIX}-${datePart}-(\\d{3})$`, 'i');
  let maxSeq = 0;
  existing.forEach((row) => {
    const match = String(row.reference || '').trim().match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
    }
  });
  return `${TRANSFER_PREFIX}-${datePart}-${String(maxSeq + 1).padStart(3, '0')}`;
};

const emptyForm = (existing = []) => ({
  reference: generateTransferRef(getToday(), existing),
  transferDate: getToday(),
  valueDate: getToday(),
  fromAccountCode: '',
  fromAccountName: '',
  toAccountCode: '',
  toAccountName: '',
  amount: '',
  narration: '',
  notes: ''
});

const InternalBankTransfer = ({ chartAccounts = [], chartAccountsLoading = false }) => {
  const [mode, setMode] = useState('create');
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState(() => emptyForm());
  const [message, setMessage] = useState('');

  const resolveAccountName = (code) => {
    const match = chartAccounts.find(
      (a) => String(a.account_code || '').trim() === String(code || '').trim()
    );
    return match?.description || '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'transferDate') {
        next.reference = generateTransferRef(value, transfers);
      }
      return next;
    });
  };

  const handleAccountChange = (side, code) => {
    setForm((prev) => ({
      ...prev,
      [`${side}AccountCode`]: code,
      [`${side}AccountName`]: resolveAccountName(code)
    }));
  };

  const resetForm = () => {
    setForm(emptyForm(transfers));
    setMessage('');
  };

  const isErrorMessage = (text) =>
    text.toLowerCase().includes('error') ||
    text.includes('required') ||
    text.includes('valid') ||
    text.includes('different');

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.fromAccountCode.trim() || !form.toAccountCode.trim()) {
      setMessage('From and to bank accounts are required.');
      return;
    }
    if (form.fromAccountCode.trim() === form.toAccountCode.trim()) {
      setMessage('From and to accounts must be different.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid transfer amount.');
      return;
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...form,
      amount,
      status: 'Draft',
      savedAt: new Date().toISOString()
    };

    setTransfers((prev) => [record, ...prev]);
    setMessage('Transfer saved in UI preview only (backend not connected).');
    setForm(emptyForm([record, ...transfers]));
    setMode('view');
  };

  const previewAmount = useMemo(() => {
    const n = parseFloat(form.amount);
    return Number.isFinite(n) ? n : 0;
  }, [form.amount]);

  return (
    <div className="eqt-page-container ibt-page">
      <div className="eqt-content-wrapper">
        <div className="eqt-header-section">
          <div className="eqt-header-text-group">
            <h1 className="eqt-main-title">Internal Bank Transfer</h1>
            <p className="eqt-subtitle">
              Move funds between bank or cash accounts within the organisation.
            </p>
          </div>
        </div>

        <nav className="ibt-screen-tabs" aria-label="Internal bank transfer">
          <button
            type="button"
            className={`ibt-screen-tab${mode === 'create' ? ' active' : ''}`}
            onClick={() => setMode('create')}
          >
            New transfer
          </button>
          <button
            type="button"
            className={`ibt-screen-tab${mode === 'view' ? ' active' : ''}`}
            onClick={() => setMode('view')}
          >
            View transfers
            {transfers.length > 0 && <span className="ibt-tab-count">{transfers.length}</span>}
          </button>
          <button
            type="button"
            className={`ibt-screen-tab${mode === 'letter' ? ' active' : ''}`}
            onClick={() => setMode('letter')}
          >
            Generate transfer letter
          </button>
        </nav>

        {mode === 'create' && (
          <div className="eqt-form-card">
            <div className="eqt-card-header eqt-card-header-row">
              <h2 className="eqt-card-title">Transfer details</h2>
              <span className="ibt-preview-pill">UI preview</span>
            </div>

            <div className="eqt-form-content">
              <form onSubmit={handleSubmit}>
                <div className="eqt-form-grid">
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Transfer reference</label>
                    <input
                      name="reference"
                      value={form.reference}
                      onChange={handleChange}
                      className="eqt-form-input eqt-readonly-field"
                      readOnly
                    />
                    <span className="eqt-help-text">Format: BT-YYYYMMDD-001</span>
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Transfer date *</label>
                    <input
                      type="date"
                      name="transferDate"
                      value={form.transferDate}
                      onChange={handleChange}
                      className="eqt-form-input"
                      required
                    />
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Value date</label>
                    <input
                      type="date"
                      name="valueDate"
                      value={form.valueDate}
                      onChange={handleChange}
                      className="eqt-form-input"
                    />
                  </div>
                </div>

                <div className="ibt-accounts-section">
                  <div className="ibt-accounts-row">
                    <div className="ibt-account-panel">
                      <div className="ibt-account-heading">From account *</div>
                      <div className="eqt-field-group">
                        <label className="eqt-field-label">GL account</label>
                        <select
                          className="eqt-form-select"
                          value={form.fromAccountCode}
                          onChange={(e) => handleAccountChange('from', e.target.value)}
                          disabled={chartAccountsLoading}
                        >
                          <option value="">
                            {chartAccountsLoading
                              ? 'Loading accounts...'
                              : 'Select source account'}
                          </option>
                          {chartAccounts.map((a) => (
                            <option key={`from-${a.account_code}`} value={a.account_code}>
                              {a.account_code} — {a.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="eqt-field-group">
                        <label className="eqt-field-label">Account name</label>
                        <input
                          value={form.fromAccountName}
                          className="eqt-form-input eqt-readonly-field"
                          readOnly
                          placeholder="Auto-filled from chart of accounts"
                        />
                      </div>
                    </div>

                    <div className="ibt-transfer-bridge" aria-hidden="true">
                      <div className="ibt-transfer-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 5l7 7-7 7V5zm-9 0v14h2V5H4z" />
                        </svg>
                      </div>
                      {previewAmount > 0 && (
                        <span className="ibt-transfer-amount">{formatCurrency(previewAmount)}</span>
                      )}
                    </div>

                    <div className="ibt-account-panel ibt-account-panel--to">
                      <div className="ibt-account-heading">To account *</div>
                      <div className="eqt-field-group">
                        <label className="eqt-field-label">GL account</label>
                        <select
                          className="eqt-form-select"
                          value={form.toAccountCode}
                          onChange={(e) => handleAccountChange('to', e.target.value)}
                          disabled={chartAccountsLoading}
                        >
                          <option value="">
                            {chartAccountsLoading
                              ? 'Loading accounts...'
                              : 'Select destination account'}
                          </option>
                          {chartAccounts.map((a) => (
                            <option key={`to-${a.account_code}`} value={a.account_code}>
                              {a.account_code} — {a.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="eqt-field-group">
                        <label className="eqt-field-label">Account name</label>
                        <input
                          value={form.toAccountName}
                          className="eqt-form-input eqt-readonly-field"
                          readOnly
                          placeholder="Auto-filled from chart of accounts"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="eqt-form-grid">
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      className="eqt-form-input"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Narration</label>
                    <input
                      name="narration"
                      value={form.narration}
                      onChange={handleChange}
                      className="eqt-form-input"
                      placeholder="Purpose of internal transfer"
                    />
                  </div>
                </div>

                <div className="eqt-notes-section">
                  <label className="eqt-field-label">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                    className="eqt-form-textarea"
                    placeholder="Internal notes (optional)"
                  />
                </div>

                <div className="ibt-preview-section">
                  <div className="ibt-preview-title">Posting preview</div>
                  <p className="ibt-preview-hint">Journal entries shown for review — not posted until backend is connected.</p>
                  <div className="eqt-data-table-wrapper">
                    <table className="eqt-data-table ibt-preview-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>DR / CR</th>
                          <th className="ibt-num">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            {form.toAccountCode || '—'}
                            {form.toAccountName ? ` — ${form.toAccountName}` : ''}
                          </td>
                          <td>DR</td>
                          <td className="ibt-num">
                            {previewAmount > 0 ? formatCurrency(previewAmount) : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            {form.fromAccountCode || '—'}
                            {form.fromAccountName ? ` — ${form.fromAccountName}` : ''}
                          </td>
                          <td>CR</td>
                          <td className="ibt-num">
                            {previewAmount > 0 ? formatCurrency(previewAmount) : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {message && (
                  <div className={`eqt-message ${isErrorMessage(message) ? 'eqt-error' : 'eqt-success'}`}>
                    {message}
                  </div>
                )}

                <div className="eqt-button-section">
                  <button type="button" onClick={resetForm} className="eqt-btn eqt-btn-secondary">
                    Reset
                  </button>
                  <button type="submit" className="eqt-btn eqt-btn-primary">
                    Save transfer (preview)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {mode === 'view' && (
          <div className="eqt-form-card eqt-list-card">
            <div className="eqt-card-header eqt-card-header-row">
              <h2 className="eqt-card-title">Session transfers</h2>
              <button
                type="button"
                className="eqt-btn eqt-btn-tertiary ibt-header-btn"
                onClick={() => setMode('create')}
              >
                + New transfer
              </button>
            </div>

            <div className="ibt-list-body">
              <p className="ibt-list-hint">
                Transfers listed here are UI preview records for this session only.
              </p>

              {transfers.length === 0 ? (
                <div className="ibt-empty">
                  <p className="ibt-empty-title">No transfers yet</p>
                  <p className="ibt-empty-text">Create a transfer to see it listed here.</p>
                  <button type="button" className="eqt-btn eqt-btn-primary" onClick={() => setMode('create')}>
                    Create transfer
                  </button>
                </div>
              ) : (
                <div className="eqt-data-table-wrapper">
                  <table className="eqt-data-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Date</th>
                        <th>From</th>
                        <th>To</th>
                        <th className="ibt-num">Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((row) => (
                        <tr key={row.id}>
                          <td>{row.reference}</td>
                          <td>{formatDisplayDate(row.transferDate)}</td>
                          <td>{row.fromAccountCode || '—'}</td>
                          <td>{row.toAccountCode || '—'}</td>
                          <td className="ibt-num">{formatCurrency(row.amount)}</td>
                          <td>
                            <span className="ibt-status-draft">{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="eqt-footer-section">
          <p>
            SHERWOOD TECHNOLOGIES (PVT) LTD • Internal bank transfers between organisation accounts
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternalBankTransfer;
