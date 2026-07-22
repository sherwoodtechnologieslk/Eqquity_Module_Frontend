import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { gsecEntriesAPI } from '../../services/api';
import './Styles/GsecShared.css';
import './Styles/GsecMissingEntries.css';

const formatDateHeader = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown date';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCellValue = (key, value) => {
  if (value == null) return '';

  if (key === 'entry_date' || key === 'created_at' || key === 'updated_at') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB');
  }

  return String(value);
};

const GsecMissingEntries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({
    totalMissing: 0,
    totalRemote: 0,
    totalLocalPairs: 0
  });
  const [partial, setPartial] = useState({ partial: false, failedPages: 0 });

  const loadData = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError('');

    try {
      const data = await gsecEntriesAPI.getMissingFromRemote({ force });
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load missing GSec entries');
      }

      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setSummary({
        totalMissing: data.totalMissing ?? 0,
        totalRemote: data.totalRemote ?? 0,
        totalLocalPairs: data.totalLocalPairs ?? 0
      });
      setPartial({ partial: !!data.partial, failedPages: data.failedPages || 0 });
    } catch (err) {
      console.error('Failed to load missing GSec entries:', err);
      setError(err.message || 'Failed to load missing GSec entries');
      setGroups([]);
      setSummary({ totalMissing: 0, totalRemote: 0, totalLocalPairs: 0 });
      setPartial({ partial: false, failedPages: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData({ force: false });
  }, [loadData]);

  const columns = useMemo(() => {
    const firstRow = groups.find((g) => g.rows?.length)?.rows?.[0];
    if (!firstRow) return [];
    return Object.keys(firstRow);
  }, [groups]);

  return (
    <div className="gsec-page-container">
      <div className="gsec-header-section">
        <div className="gsec-header-icon">
          <svg className="gsec-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="gsec-header-text-group">
          <h1 className="gsec-main-title">Missing GSec Entries</h1>
          <p className="gsec-subtitle">
            Remote ledger rows not yet saved locally. A remote row is treated as saved only when
            it exists locally with the same deal number, account, date, debit and credit (or by
            remote id).
          </p>
        </div>
      </div>

      <div className="gsec-missing-summary-row">
        <div className="gsec-missing-summary-card">
          <span className="gsec-missing-summary-label">Missing rows</span>
          <span className="gsec-missing-summary-value">{summary.totalMissing}</span>
        </div>
        <div className="gsec-missing-summary-card">
          <span className="gsec-missing-summary-label">Remote rows checked</span>
          <span className="gsec-missing-summary-value">{summary.totalRemote}</span>
        </div>
        <div className="gsec-missing-summary-card">
          <span className="gsec-missing-summary-label">Local line fingerprints</span>
          <span className="gsec-missing-summary-value">{summary.totalLocalPairs}</span>
        </div>
      </div>

      <div className="gsec-toolbar">
        <span className="gsec-toolbar-text">
          {loading
            ? 'Comparing remote ledger with local database…'
            : `${groups.length} date group(s) • ${summary.totalMissing} missing row(s)`}
        </span>
        <button
          type="button"
          className="gsec-refresh-button"
          onClick={() => loadData({ force: true })}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="gsec-error">{error}</div>}

      {partial.partial && (
        <div className="gsec-error" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
          Warning: {partial.failedPages} remote page(s) failed to load after retries. Results may be
          incomplete — click Refresh to try again.
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="gsec-table-card">
          <div className="gsec-empty" style={{ padding: '2rem' }}>
            No missing entries — every remote deal/date pair is already in your database.
          </div>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.date} className="gsec-missing-date-section">
          <header className="gsec-missing-date-header">
            <h2 className="gsec-missing-date-title">{formatDateHeader(group.date)}</h2>
            <span className="gsec-missing-date-count">
              {group.count} row{group.count === 1 ? '' : 's'}
            </span>
          </header>

          <div className="gsec-table-card">
            <div className="gsec-table-container">
              <table className="gsec-table">
                <thead>
                  <tr>
                    {columns.length === 0
                      ? <th>No columns</th>
                      : columns.map((col) => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(group.rows || []).map((row, idx) => (
                    <tr key={`${group.date}-${idx}`}>
                      {columns.map((col) => (
                        <td key={col} title={formatCellValue(col, row[col])}>
                          {formatCellValue(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default GsecMissingEntries;
