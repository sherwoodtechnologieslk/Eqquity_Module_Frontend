import React, { useEffect, useRef, useState } from 'react';
import { gsecEntriesAPI } from '../../services/api';
import {
  GSEC_SOURCES,
  shouldSubmitGsecForApproval,
  gsecSaveButtonLabel,
  gsecSubmittingLabel,
} from '../../utils/gsecMakerChecker';
import './Styles/GsecEntries.css';

const GsecEntries = () => {
  // Empty by default so initial load does NOT filter by date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  // Single-day quick filter handled in a separate modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [specificDate, setSpecificDate] = useState('');
  const dateInputRef = useRef(null);
  // When set, the table is showing remote rows missing locally for one date
  const [missingInfo, setMissingInfo] = useState(null);

  // overrideDates lets callers force a date range (e.g. single-day load) without
  // waiting for startDate/endDate state to settle.
  const loadData = async (overridePage, overrideDates) => {
    setLoading(true);
    setError('');
    setMissingInfo(null);

    try {
      const targetPage = overridePage || page;
      const effectiveStart = overrideDates ? overrideDates.startDate : startDate;
      const effectiveEnd = overrideDates ? overrideDates.endDate : endDate;
      const data = await gsecEntriesAPI.getSellTransactionReport({
        startDate: effectiveStart,
        endDate: effectiveEnd,
        page: targetPage,
        pageSize
      });

      setRawResponse(data);

      // Expected shape from GSEC API:
      // {
      //   total: number,
      //   limit: number,
      //   offset: number,
      //   entries: [ ... ]
      // }
      let items = [];
      if (Array.isArray(data?.entries)) {
        items = data.entries;
      } else if (Array.isArray(data?.data)) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      }

      setRows(items);
      setTotal(typeof data?.total === 'number' ? data.total : items.length);
      if (overridePage) {
        setPage(overridePage);
      }
    } catch (err) {
      console.error('Failed to load GSec entries:', err);
      setError(err.message || 'Failed to load GSec entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadData(1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      loadData(page - 1);
    }
  };

  const handleNextPage = () => {
    loadData(page + 1);
  };

  // Open the date modal and focus/open the native calendar inside it.
  const openDateModal = () => {
    setShowDateModal(true);
    setTimeout(() => {
      const input = dateInputRef.current;
      if (input && typeof input.showPicker === 'function') {
        input.showPicker();
      } else if (input) {
        input.focus();
      }
    }, 0);
  };

  const closeDateModal = () => {
    setShowDateModal(false);
  };

  // For the selected day only, compare the remote ledger against the local
  // table and show the rows that exist remotely but are missing locally.
  // Only that date is fetched/compared on the server (fast), then close modal.
  const handleApplyDate = async () => {
    if (!specificDate) return;

    setShowDateModal(false);
    setLoading(true);
    setError('');
    setPage(1);

    try {
      const data = await gsecEntriesAPI.getMissingByDate(specificDate);
      const missing = Array.isArray(data?.missing) ? data.missing : [];

      setRows(missing);
      setTotal(missing.length);
      setRawResponse(data);
      setMissingInfo({
        date: data?.date || specificDate,
        totalRemote: data?.totalRemote ?? 0,
        totalLocal: data?.totalLocal ?? 0,
        totalMissing: data?.totalMissing ?? missing.length
      });
    } catch (err) {
      console.error('Failed to load missing GSec entries by date:', err);
      setError(err.message || 'Failed to load missing GSec entries for the selected date');
      setMissingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Exit "missing entries" view and reload the default list.
  const clearMissingView = () => {
    setMissingInfo(null);
    setSpecificDate('');
    setStartDate('');
    setEndDate('');
    loadData(1, { startDate: '', endDate: '' });
  };

  const handleSaveToDatabase = async () => {
    if (!rows || rows.length === 0) {
      window.alert('No rows to save. Please load data first.');
      return;
    }

    try {
      setSaving(true);
      if (shouldSubmitGsecForApproval()) {
        await gsecEntriesAPI.submitGsecEntriesForApproval(rows, { source: GSEC_SOURCES.LEDGER });
        window.alert('GSec entries submitted for checker approval. They will be posted after approval.');
      } else {
        await gsecEntriesAPI.saveLedgerEntriesToDatabase(rows);
        window.alert('GSec entries saved to database successfully.');
      }
    } catch (err) {
      console.error('Failed to save GSec entries to database:', err);
      window.alert(err.message || 'Failed to save GSec entries to database.');
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];
    // Take keys from first row; later we can refine to domain columns
    return Object.keys(rows[0]);
  }, [rows]);

  const formatCellValue = (key, value) => {
    if (value == null) return '';

    if (key === 'entry_date' || key === 'created_at' || key === 'updated_at') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('en-GB');
    }

    return String(value);
  };

  return (
    <div className="gsec-page-container">
      {/* Header aligned with GL/Trial Balance style */}
      <div className="gsec-header-section">
        <div className="gsec-header-icon">
          <svg className="gsec-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd" />
            <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z" />
          </svg>
        </div>
        <div className="gsec-header-text-group">
          <h1 className="gsec-main-title">GSec Ledger Entries</h1>
          <p className="gsec-subtitle">
            View GSec accounting entries returned by the external ledger service.
          </p>
        </div>
      </div>

      {/* Filters card, similar to Trial Balance */}
      <div className="gsec-filters-card">
        <div className="gsec-card-header">
          <h2 className="gsec-card-title">Filters</h2>
        </div>
        <form className="gsec-filters-content" onSubmit={handleSubmit}>
          <div className="gsec-filters-grid">
            <div className="gsec-filter-group">
              <label className="gsec-filter-label">Start Date</label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="gsec-filter-input"
              />
            </div>
            <div className="gsec-filter-group">
              <label className="gsec-filter-label">End Date</label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                className="gsec-filter-input"
              />
            </div>
            <div className="gsec-filter-group">
              <label className="gsec-filter-label">Page Size</label>
              <input
                type="number"
                min={1}
                max={500}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 50)}
                className="gsec-filter-input"
              />
            </div>
            <div className="gsec-filter-actions">
              <button
                type="submit"
                className="gsec-refresh-button"
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="gsec-error">{error}</div>}

      {missingInfo && (
        <div className="gsec-missing-banner">
          <span>
            <strong>{missingInfo.totalMissing}</strong>{' '}
            {missingInfo.totalMissing === 1 ? 'entry' : 'entries'} in the remote
            ledger {missingInfo.totalMissing === 1 ? 'is' : 'are'} missing from
            your database for <strong>{missingInfo.date}</strong>{' '}
            (remote: {missingInfo.totalRemote}, local: {missingInfo.totalLocal}).
            {missingInfo.totalMissing > 0 &&
              (shouldSubmitGsecForApproval()
                ? ' Use “Submit for Approval” to send them for checker review.'
                : ' Use “Save to DB” to import them.')}
          </span>
          <button
            type="button"
            className="gsec-button-ghost"
            onClick={clearMissingView}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      )}

      <div className="gsec-toolbar">
        <span className="gsec-toolbar-text">
          {missingInfo
            ? `Missing entries for ${missingInfo.date} • ${rows.length} row(s)`
            : `Page ${page} • ${rows.length} row(s) on this page • Total ${total}`}
        </span>
        <div className="gsec-toolbar-actions">
          <button
            type="button"
            className="gsec-refresh-button"
            onClick={openDateModal}
            disabled={loading}
          >
            Load by Date
          </button>
          <button
            type="button"
            className="gsec-refresh-button"
            onClick={handleSaveToDatabase}
            disabled={saving || loading || rows.length === 0}
          >
            {saving ? gsecSubmittingLabel() : gsecSaveButtonLabel()}
          </button>
          <div className="gsec-pagination">
            <button
              type="button"
              onClick={handlePrevPage}
              className="gsec-button-ghost"
              disabled={loading || page <= 1 || !!missingInfo}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              className="gsec-button-ghost"
              disabled={loading || !!missingInfo}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="gsec-table-card">
        <div className="gsec-table-container">
          <table className="gsec-table">
          <thead>
            <tr>
              {columns.length === 0
                ? <th>No data</th>
                : columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length || 1} className="gsec-empty">
                    {loading ? 'Loading…' : 'No records found for the selected filters.'}
                  </td>
                </tr>
              )
              : rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td
                        key={col}
                        title={formatCellValue(col, row[col])}
                      >
                        {formatCellValue(col, row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      </div>

      {rawResponse && (
        <details className="gsec-debug">
          <summary>Show raw API response (debug)</summary>
          <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
        </details>
      )}

      {showDateModal && (
        <div
          className="gsec-modal-overlay"
          onClick={closeDateModal}
          role="presentation"
        >
          <div
            className="gsec-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gsec-date-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gsec-modal-header">
              <h3 id="gsec-date-modal-title" className="gsec-modal-title">
                Load Entries by Date
              </h3>
              <button
                type="button"
                className="gsec-modal-close"
                onClick={closeDateModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="gsec-modal-body">
              <label className="gsec-filter-label" htmlFor="gsec-specific-date">
                Select a date
              </label>
              <input
                id="gsec-specific-date"
                ref={dateInputRef}
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="gsec-filter-input"
                aria-label="Select a date to load GSec entries"
              />
              <p className="gsec-modal-hint">
                For the selected date only, we compare the remote ledger with
                your database and show the entries that exist remotely but are
                missing locally.
              </p>
            </div>

            <div className="gsec-modal-footer">
              <button
                type="button"
                className="gsec-button-ghost"
                onClick={closeDateModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gsec-refresh-button"
                onClick={handleApplyDate}
                disabled={!specificDate || loading}
              >
                {loading ? 'Checking…' : 'Find Missing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GsecEntries;

