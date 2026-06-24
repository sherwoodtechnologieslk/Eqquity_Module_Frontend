import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './Styles/FinancialPosition.css';
import { accountReconciliationAPI } from '../../services/api';
import DisclosureNoteView from './DisclosureNoteView';
import { loadFinancialNoteData } from '../../utils/loadFinancialNoteData';
import { buildNotePeriods } from '../../utils/financialNotePeriods';
import {
  enrichNotesContext,
  FINANCIAL_NOTES,
  getNoteById,
  getSourceTabName,
  notesContextKey
} from '../../utils/financialNotesRegistry';

const formatAmount = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const formatDateDisplay = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

const SOURCE_LABELS = {
  general_ledger_entries: 'GL',
  other_transaction_gl_entries: 'Other GL',
  gsec_entries: 'GSec',
  opening_balance_entries: 'Opening Balance'
};

const sourceBadgeClass = (src) => {
  switch (src) {
    case 'opening_balance_entries':
      return 'frn-src-ob';
    case 'gsec_entries':
      return 'frn-src-gsec';
    case 'other_transaction_gl_entries':
      return 'frn-src-other';
    default:
      return 'frn-src-gl';
  }
};

const todayYmd = () => new Date().toISOString().split('T')[0];

const FinancialReportingNotes = ({ context = null, onTabChange }) => {
  const incomingContextKey = notesContextKey(context);
  const [dismissedContextKey, setDismissedContextKey] = useState('');
  const [asOfDate, setAsOfDate] = useState(() => context?.asOfDate || todayYmd());
  const [showGlDetail, setShowGlDetail] = useState(false);
  const prevIncomingKeyRef = useRef('');

  useEffect(() => {
    if (incomingContextKey && incomingContextKey !== prevIncomingKeyRef.current) {
      setDismissedContextKey('');
      if (context?.asOfDate) setAsOfDate(context.asOfDate);
    }
    prevIncomingKeyRef.current = incomingContextKey;
  }, [incomingContextKey, context?.asOfDate]);

  const activeContext = useMemo(
    () =>
      context && incomingContextKey && incomingContextKey !== dismissedContextKey
        ? enrichNotesContext(context)
        : null,
    [context, incomingContextKey, dismissedContextKey]
  );

  const [noteData, setNoteData] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [entriesOpening, setEntriesOpening] = useState(0);
  const [entriesClosing, setEntriesClosing] = useState(0);

  const periods = useMemo(() => buildNotePeriods(asOfDate), [asOfDate]);

  const loadNoteDisclosure = useCallback(async (ctx, periodEnd) => {
    if (!ctx?.noteId) {
      setNoteData(null);
      setNoteError('');
      return;
    }
    try {
      setNoteLoading(true);
      setNoteError('');
      const data = await loadFinancialNoteData({
        noteId: ctx.noteId,
        asOfDate: periodEnd,
        portfolioId: ctx.portfolioId || ''
      });
      setNoteData(data);
    } catch (e) {
      setNoteError(e.message || 'Failed to load note disclosure');
      setNoteData(null);
    } finally {
      setNoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeContext?.noteId) {
      loadNoteDisclosure(activeContext, asOfDate);
    } else {
      setNoteData(null);
      setNoteError('');
    }
  }, [activeContext?.noteId, activeContext?.portfolioId, asOfDate, loadNoteDisclosure]);

  const loadEntries = useCallback(async (ctx) => {
    if (!ctx || !ctx.accountCode) {
      setEntries([]);
      setEntriesOpening(0);
      setEntriesClosing(0);
      setEntriesError('');
      return;
    }
    try {
      setEntriesLoading(true);
      setEntriesError('');
      const resp = await accountReconciliationAPI.getAccountTransactions(
        ctx.accountCode,
        {
          startDate: '1900-01-01',
          endDate: ctx.asOfDate || asOfDate
        }
      );
      const txs = Array.isArray(resp?.transactions) ? resp.transactions : [];
      setEntries(txs);
      setEntriesOpening(Number(resp?.openingBalance) || 0);
      setEntriesClosing(Number(resp?.closingBalance) || 0);
    } catch (e) {
      setEntriesError(e.message || 'Failed to load entries for this account');
      setEntries([]);
      setEntriesOpening(0);
      setEntriesClosing(0);
    } finally {
      setEntriesLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    if (activeContext?.accountCode) {
      loadEntries({ ...activeContext, asOfDate: activeContext.asOfDate || asOfDate });
      setShowGlDetail(true);
    } else {
      setEntries([]);
      setShowGlDetail(false);
    }
  }, [activeContext?.accountCode, activeContext?.asOfDate, asOfDate, loadEntries]);

  const entryTotals = useMemo(() => {
    const debit = entries.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const credit = entries.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    return { debit, credit, net: debit - credit };
  }, [entries]);

  const clearContext = () => {
    if (incomingContextKey) setDismissedContextKey(incomingContextKey);
    setNoteData(null);
    setEntries([]);
    setEntriesError('');
    onTabChange?.('Financial Reporting Notes', null);
  };

  const goBackToSource = () => {
    if (typeof onTabChange !== 'function' || !activeContext) return;
    onTabChange(getSourceTabName(activeContext.source));
  };

  const openNoteFromIndex = (note) => {
    if (!note || typeof onTabChange !== 'function') return;
    onTabChange(
      'Financial Reporting Notes',
      enrichNotesContext({
        source: 'ALL',
        noteId: note.id,
        note,
        asOfDate
      })
    );
  };

  const activeNote = activeContext?.noteId ? getNoteById(activeContext.noteId) : null;

  return (
    <div className="fp-main-container">
      <div className="fp-content-wrapper">
        <div className="fp-header-section">
          <div className="fp-header-left">
            <h1 className="fp-main-title">Notes to the Financial Statements</h1>
            <p className="frn-page-subtitle">{periods.periodTitle}</p>
          </div>
          {activeContext ? (
            <div className="frn-header-actions">
              <label className="frn-asof-label">
                As at date
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>

        {activeContext ? (
          <>
            <div className="frn-context-panel frn-context-panel--compact">
              <div className="frn-context-header">
                <div className="frn-context-title-wrap">
                  {activeContext.source && activeContext.source !== 'ALL' ? (
                    <span className="frn-context-eyebrow">
                      Opened from {getSourceTabName(activeContext.source)}
                    </span>
                  ) : null}
                  <h2 className="frn-context-title">
                    {activeNote
                      ? `${activeNote.number}. ${activeNote.title}`
                      : activeContext.displayLabel}
                  </h2>
                </div>
                <div className="frn-context-actions">
                  {activeContext.source && activeContext.source !== 'ALL' ? (
                    <button
                      type="button"
                      className="fp-export-button"
                      onClick={goBackToSource}
                    >
                      Back to {getSourceTabName(activeContext.source)}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="fp-export-button"
                    onClick={clearContext}
                  >
                    All notes
                  </button>
                </div>
              </div>
            </div>

            <DisclosureNoteView
              data={noteData}
              loading={noteLoading}
              error={noteError}
            />

            {activeContext.accountCode ? (
              <div className="frn-after-mock">
                <button
                  type="button"
                  className="frn-gl-toggle"
                  onClick={() => setShowGlDetail((v) => !v)}
                  aria-expanded={showGlDetail}
                >
                  {showGlDetail ? 'Hide' : 'Show'} supporting GL detail
                  {activeContext.accountCode ? ` (${activeContext.accountCode})` : ''}
                </button>

                {showGlDetail ? (
                  <div className="frn-context-panel">
                    <div className="frn-context-meta">
                      <span className="frn-context-chip">
                        Account: <strong>{activeContext.accountCode}</strong>
                      </span>
                      <span className="frn-context-chip">
                        As of: <strong>{formatDateDisplay(activeContext.asOfDate || asOfDate)}</strong>
                      </span>
                      {activeContext.portfolioLabel ? (
                        <span className="frn-context-chip">
                          Portfolio:{' '}
                          <strong>{activeContext.portfolioLabel}</strong>
                        </span>
                      ) : null}
                    </div>

                    {entriesLoading ? (
                      <div className="frn-loading">
                        <div className="fp-loading-spinner" />
                        <p className="frn-loading-text">Loading entries…</p>
                      </div>
                    ) : entriesError ? (
                      <div className="frn-error">{entriesError}</div>
                    ) : entries.length === 0 ? (
                      <div className="frn-context-empty">
                        No ledger entries found for this account.
                      </div>
                    ) : (
                      <>
                        <div className="frn-context-summary">
                          <div className="frn-summary-cell">
                            <div className="frn-summary-label">Opening</div>
                            <div className="frn-summary-value">
                              {formatAmount(entriesOpening)}
                            </div>
                          </div>
                          <div className="frn-summary-cell">
                            <div className="frn-summary-label">Debits</div>
                            <div className="frn-summary-value">
                              {formatAmount(entryTotals.debit)}
                            </div>
                          </div>
                          <div className="frn-summary-cell">
                            <div className="frn-summary-label">Credits</div>
                            <div className="frn-summary-value">
                              {formatAmount(entryTotals.credit)}
                            </div>
                          </div>
                          <div className="frn-summary-cell">
                            <div className="frn-summary-label">Closing</div>
                            <div className="frn-summary-value">
                              {formatAmount(entriesClosing)}
                            </div>
                          </div>
                        </div>
                        <div className="frn-entries-wrap">
                          <table className="frn-entries-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Description</th>
                                <th>Reference</th>
                                <th className="frn-entries-num">Debit</th>
                                <th className="frn-entries-num">Credit</th>
                                <th className="frn-entries-num">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries.map((row) => (
                                <tr key={row.id}>
                                  <td>{formatDateDisplay(row.date)}</td>
                                  <td>
                                    <span
                                      className={`frn-src-badge ${sourceBadgeClass(
                                        row.gl_source
                                      )}`}
                                    >
                                      {SOURCE_LABELS[row.gl_source] || row.gl_source}
                                    </span>
                                  </td>
                                  <td className="frn-entries-desc">
                                    {row.description || '-'}
                                  </td>
                                  <td>{row.reference || '-'}</td>
                                  <td className="frn-entries-num">
                                    {row.debit ? formatAmount(row.debit) : ''}
                                  </td>
                                  <td className="frn-entries-num">
                                    {row.credit ? formatAmount(row.credit) : ''}
                                  </td>
                                  <td className="frn-entries-num">
                                    {formatAmount(row.balance)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="frn-index">
            <p className="frn-index-intro">
              Select a note below, or open a line on <strong>SOFP</strong>,{' '}
              <strong>SOCI</strong>, or <strong>Cash Flow</strong> and choose{' '}
              <strong>Note N</strong>. Balance-sheet notes use balances{' '}
              <strong>as at</strong> your selected date; income notes use year-to-date
              through that date, compared with the same day last year.
            </p>
            <div className="frn-index-toolbar">
              <label className="frn-asof-label">
                As at date
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </label>
            </div>
            <ul className="frn-index-list frn-index-list--full">
              {FINANCIAL_NOTES.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className="frn-index-item"
                    onClick={() => openNoteFromIndex(note)}
                  >
                    <span className="frn-index-num">Note {note.number}</span>
                    <span className="frn-index-label">{note.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
