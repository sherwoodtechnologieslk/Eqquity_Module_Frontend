import React, { useEffect, useState } from 'react';
import { gsecEntriesAPI } from '../../services/api';
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

  const loadData = async (overridePage) => {
    setLoading(true);
    setError('');

    try {
      const targetPage = overridePage || page;
      const data = await gsecEntriesAPI.getSellTransactionReport({
        startDate,
        endDate,
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

  const handleSaveToDatabase = async () => {
    if (!rows || rows.length === 0) {
      window.alert('No rows to save. Please load data first.');
      return;
    }

    try {
      setSaving(true);
      await gsecEntriesAPI.saveEntriesToDatabase(rows);
      window.alert('GSec entries saved to database successfully.');
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

      <div className="gsec-toolbar">
        <span className="gsec-toolbar-text">
          Page {page} • {rows.length} row(s) on this page • Total {total}
        </span>
        <div className="gsec-toolbar-actions">
          <button
            type="button"
            className="gsec-refresh-button"
            onClick={handleSaveToDatabase}
            disabled={saving || loading || rows.length === 0}
          >
            {saving ? 'Saving…' : 'Save to DB'}
          </button>
          <div className="gsec-pagination">
            <button
              type="button"
              onClick={handlePrevPage}
              className="gsec-button-ghost"
              disabled={loading || page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              className="gsec-button-ghost"
              disabled={loading}
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
    </div>
  );
};

export default GsecEntries;

