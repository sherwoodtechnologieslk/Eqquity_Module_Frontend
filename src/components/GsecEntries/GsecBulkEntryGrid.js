import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsecEntriesAPI, chartOfAccountsAPI } from '../../services/api';
import './Styles/GsecEntries.css';
import './Styles/GsecManualEntryPosting.css';
import './Styles/GsecBulkEntryGrid.css';

const coaDisplayName = (row) =>
  String(row?.description ?? row?.account_name ?? '').trim();

const isCoaActive = (row) => {
  if (row?.active_status == null) return true;
  return String(row.active_status).toLowerCase() === 'yes';
};

// Columns mirror the gsec_entries table shown on the GSec screens.
// created_at / updated_at are maintained by the database and are read-only here.
const COLUMNS = [
  { key: 'id', label: 'id', type: 'number', width: 110, placeholder: 'external id' },
  { key: 'transaction_id', label: 'transaction_id', type: 'number', width: 130 },
  { key: 'deal_number', label: 'deal_number', type: 'text', width: 190, required: true },
  { key: 'account_id', label: 'account_id', type: 'number', width: 110 },
  { key: 'entry_date', label: 'entry_date', type: 'datetime-local', width: 210, required: true },
  { key: 'debit_amount', label: 'debit_amount', type: 'number', width: 130 },
  { key: 'credit_amount', label: 'credit_amount', type: 'number', width: 130 },
  { key: 'currency', label: 'currency', type: 'text', width: 90 },
  { key: 'description', label: 'description', type: 'text', width: 220 },
  { key: 'created_at', label: 'created_at', type: 'text', width: 150, readOnly: true },
  { key: 'updated_at', label: 'updated_at', type: 'text', width: 150, readOnly: true },
  { key: 'account_code', label: 'account_code', type: 'text', width: 140, required: true },
  { key: 'account_name', label: 'account_name', type: 'text', width: 200 },
  { key: 'account_category', label: 'account_category', type: 'text', width: 150 },
  { key: 'transaction_code', label: 'transaction_code', type: 'text', width: 150 },
  { key: 'transaction_description', label: 'transaction_description', type: 'text', width: 230 }
];

const EDITABLE_COLUMNS = COLUMNS.filter((c) => !c.readOnly);

let RID_SEQ = 0;
const nextRid = () => {
  RID_SEQ += 1;
  return `row-${Date.now()}-${RID_SEQ}`;
};

const makeEmptyRow = () => {
  const row = { _rid: nextRid() };
  COLUMNS.forEach((col) => {
    row[col.key] = col.key === 'currency' ? 'LKR' : '';
  });
  return row;
};

const isRowBlank = (row) =>
  EDITABLE_COLUMNS.every((col) => {
    const v = row[col.key];
    if (col.key === 'currency') return String(v ?? '').trim() === '' || v === 'LKR';
    return String(v ?? '').trim() === '';
  });

const trimOrNull = (v) => {
  const t = typeof v === 'string' ? v.trim() : v;
  return t === '' || t == null ? null : t;
};

const numOrNull = (v) => {
  const t = trimOrNull(v);
  if (t == null) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const buildEntryPayload = (row) => ({
  id: numOrNull(row.id),
  transaction_id: numOrNull(row.transaction_id),
  deal_number: trimOrNull(row.deal_number),
  account_id: numOrNull(row.account_id),
  entry_date: trimOrNull(row.entry_date),
  debit_amount: trimOrNull(row.debit_amount) == null ? 0 : Number(row.debit_amount),
  credit_amount: trimOrNull(row.credit_amount) == null ? 0 : Number(row.credit_amount),
  currency: trimOrNull(row.currency) || 'LKR',
  description: trimOrNull(row.description),
  account_code: trimOrNull(row.account_code),
  account_name: trimOrNull(row.account_name),
  account_category: trimOrNull(row.account_category),
  transaction_code: trimOrNull(row.transaction_code),
  transaction_description: trimOrNull(row.transaction_description)
});

function AccountSearchCell({ field, value, coaList, onChange, onPick, placeholder }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const inputRef = useRef(null);

  const matches = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    const base = coaList.filter(isCoaActive);
    if (!q) return base.slice(0, 50);
    return base
      .filter((r) => {
        const code = (r.account_code || '').toLowerCase();
        const name = coaDisplayName(r).toLowerCase();
        return code.includes(q) || name.includes(q);
      })
      .slice(0, 50);
  }, [value, coaList]);

  const positionDropdown = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 260) });
  };

  const openDropdown = () => {
    positionDropdown();
    setOpen(true);
  };

  const pick = (accountRow) => {
    onPick(accountRow);
    setOpen(false);
  };

  const showQuery = String(value || '').trim();

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        className="gsec-grid-input"
        value={value ?? ''}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && rect && (
        <div
          className="gsec-grid-ac-dropdown"
          style={{ top: rect.top, left: rect.left, width: rect.width }}
          role="listbox"
        >
          {matches.length > 0 ? (
            matches.map((r) => (
              <button
                key={r.id ?? r.account_code}
                type="button"
                role="option"
                className="gsec-manual-account-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
              >
                <div className="gsec-manual-account-option-code">{r.account_code}</div>
                <div className="gsec-manual-account-option-name">{coaDisplayName(r) || '—'}</div>
              </button>
            ))
          ) : (
            <div className="gsec-manual-account-option" style={{ cursor: 'default' }}>
              <span className="gsec-manual-account-option-name">
                {showQuery ? 'No matching accounts' : 'No accounts available'}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const GsecBulkEntryGrid = () => {
  const [rows, setRows] = useState(() => [makeEmptyRow(), makeEmptyRow(), makeEmptyRow()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [coaList, setCoaList] = useState([]);
  const [coaLoading, setCoaLoading] = useState(true);
  const [coaLoadError, setCoaLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCoaLoading(true);
        setCoaLoadError('');
        const data = await chartOfAccountsAPI.getAll();
        if (!cancelled) setCoaList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load chart of accounts:', err);
        if (!cancelled) {
          setCoaLoadError(err.message || 'Failed to load chart of accounts');
          setCoaList([]);
        }
      } finally {
        if (!cancelled) setCoaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const coaReady = coaList.length > 0 && !coaLoadError;

  const applyAccount = (rid, acc) => {
    const code = (acc.account_code || '').trim();
    const name = coaDisplayName(acc);
    setRows((prev) =>
      prev.map((row) =>
        row._rid === rid
          ? {
              ...row,
              account_code: code,
              account_name: name,
              account_id:
                acc.id != null && acc.id !== '' ? String(acc.id) : row.account_id
            }
          : row
      )
    );
    setMessage({ type: '', text: '' });
  };

  const updateCell = (rid, key, value) => {
    setRows((prev) =>
      prev.map((row) => (row._rid === rid ? { ...row, [key]: value } : row))
    );
    setMessage({ type: '', text: '' });
  };

  const addRow = () => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const addFiveRows = () => {
    setRows((prev) => [...prev, makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow()]);
  };

  const duplicateRow = (rid) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r._rid === rid);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], _rid: nextRid() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const removeRow = (rid) => {
    setRows((prev) => {
      const next = prev.filter((row) => row._rid !== rid);
      return next.length ? next : [makeEmptyRow()];
    });
    setMessage({ type: '', text: '' });
  };

  const clearAll = () => {
    setRows([makeEmptyRow()]);
    setMessage({ type: '', text: '' });
  };

  const nonBlankRows = useMemo(() => rows.filter((r) => !isRowBlank(r)), [rows]);

  const handleSave = async () => {
    setMessage({ type: '', text: '' });

    if (nonBlankRows.length === 0) {
      setMessage({ type: 'error', text: 'Nothing to save. Add at least one row with data.' });
      return;
    }

    // Validate required fields on each non-blank row.
    const problems = [];
    rows.forEach((row, idx) => {
      if (isRowBlank(row)) return;
      const missing = COLUMNS.filter(
        (c) => c.required && trimOrNull(row[c.key]) == null
      ).map((c) => c.label);
      if (missing.length) {
        problems.push(`Row ${idx + 1}: missing ${missing.join(', ')}`);
      }
    });

    if (problems.length) {
      setMessage({ type: 'error', text: problems.join(' • ') });
      return;
    }

    const entries = nonBlankRows.map(buildEntryPayload);

    try {
      setSaving(true);
      const res = await gsecEntriesAPI.saveEntriesToDatabase(entries);
      const inserted = res?.insertedRows ?? 0;
      setMessage({
        type: 'ok',
        text: res?.message
          ? `${res.message} (inserted ${inserted} of ${entries.length}).`
          : `Saved. Inserted ${inserted} of ${entries.length} row(s).`
      });
      if (inserted > 0) {
        setRows([makeEmptyRow()]);
      }
    } catch (err) {
      console.error('Failed to save GSec grid entries:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save GSec entries.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gsec-page-container">
      <div className="gsec-header-section">
        <div className="gsec-header-icon">
          <svg className="gsec-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z"
              clipRule="evenodd"
            />
            <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z" />
          </svg>
        </div>
        <div className="gsec-header-text-group">
          <h1 className="gsec-main-title">GSec Bulk Entry Grid</h1>
          <p className="gsec-subtitle">
            Add or remove rows in an editable grid and save many GSec entries at once. Columns mirror
            the GSec ledger table. <strong>created_at</strong> and <strong>updated_at</strong> are set
            by the database. Duplicate rows (same deal number, account code and entry date) are skipped
            automatically on save.
          </p>
        </div>
      </div>

      <div className="gsec-toolbar">
        <span className="gsec-toolbar-text">
          {rows.length} row(s) • {nonBlankRows.length} with data
        </span>
        <div className="gsec-toolbar-actions">
          <button type="button" className="gsec-button-ghost" onClick={addRow}>
            + Add row
          </button>
          <button type="button" className="gsec-button-ghost" onClick={addFiveRows}>
            + Add 5 rows
          </button>
          <button type="button" className="gsec-button-ghost" onClick={clearAll} disabled={saving}>
            Clear all
          </button>
          <button
            type="button"
            className="gsec-refresh-button"
            onClick={handleSave}
            disabled={saving || nonBlankRows.length === 0}
          >
            {saving ? 'Saving…' : 'Save to DB'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'gsec-error' : 'gsec-manual-success'}>
          {message.text}
        </div>
      )}

      {coaLoadError && (
        <div className="gsec-manual-hint" style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>
          Chart of accounts unavailable ({coaLoadError}). You can still type account code and name
          manually.
        </div>
      )}

      <div className="gsec-table-card">
        <div className="gsec-table-container">
          <table className="gsec-table gsec-grid-table">
            <thead>
              <tr>
                <th className="gsec-grid-rownum-col">#</th>
                {COLUMNS.map((col) => (
                  <th key={col.key}>
                    {col.label}
                    {col.required && <span className="gsec-grid-required">*</span>}
                  </th>
                ))}
                <th className="gsec-grid-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row._rid}>
                  <td className="gsec-grid-rownum-col">{idx + 1}</td>
                  {COLUMNS.map((col) => {
                    const isAccountField =
                      col.key === 'account_code' || col.key === 'account_name';
                    return (
                      <td key={col.key} style={{ minWidth: col.width }}>
                        {isAccountField && coaReady ? (
                          <AccountSearchCell
                            field={col.key}
                            value={row[col.key]}
                            coaList={coaList}
                            onChange={(v) => updateCell(row._rid, col.key, v)}
                            onPick={(acc) => applyAccount(row._rid, acc)}
                            placeholder={
                              coaLoading
                                ? 'Loading accounts…'
                                : col.key === 'account_code'
                                  ? 'Search code or name…'
                                  : 'Search name or code…'
                            }
                          />
                        ) : (
                          <input
                            type={col.type}
                            className={`gsec-grid-input${col.readOnly ? ' gsec-manual-readonly' : ''}`}
                            value={row[col.key] ?? ''}
                            readOnly={col.readOnly}
                            placeholder={
                              col.readOnly
                                ? 'set by database'
                                : isAccountField && coaLoading
                                  ? 'Loading accounts…'
                                  : col.placeholder || ''
                            }
                            step={col.type === 'number' ? 'any' : undefined}
                            onChange={(e) => updateCell(row._rid, col.key, e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="gsec-grid-actions-col">
                    <div className="gsec-grid-row-actions">
                      <button
                        type="button"
                        className="gsec-button-ghost gsec-grid-icon-btn"
                        title="Duplicate row"
                        onClick={() => duplicateRow(row._rid)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="gsec-grid-remove-btn"
                        title="Remove row"
                        onClick={() => removeRow(row._rid)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gsec-grid-footer">
        <button type="button" className="gsec-button-ghost" onClick={addRow}>
          + Add row
        </button>
      </div>
    </div>
  );
};

export default GsecBulkEntryGrid;
