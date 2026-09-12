import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Styles/FinancialReportingNotes.css';
import DisclosureNoteView from './DisclosureNoteView';
import { buildNotePeriods } from '../../utils/financialNotePeriods';
import { loadFinancialNoteData } from '../../utils/loadFinancialNoteData';
import { FINANCIAL_NOTES } from '../../utils/financialNotesRegistry';

const todayYmd = () => new Date().toISOString().split('T')[0];

const FinancialReportingNotes = ({ context = null }) => {
  const [asOfDate, setAsOfDate] = useState(() => context?.asOfDate || todayYmd());
  const [selectedNoteId, setSelectedNoteId] = useState(
    () => context?.noteId || FINANCIAL_NOTES[0]?.id || ''
  );
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const tabsScrollRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    if (context?.asOfDate) setAsOfDate(context.asOfDate);
    if (context?.noteId) setSelectedNoteId(context.noteId);
  }, [context?.asOfDate, context?.noteId]);

  /** Keep the selected tab fully visible in the horizontal strip. */
  useEffect(() => {
    const el = activeTabRef.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }, [selectedNoteId]);

  const loadNote = useCallback(async () => {
    if (!selectedNoteId) {
      setNoteData(null);
      setLoadError('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError('');
      const data = await loadFinancialNoteData({
        noteId: selectedNoteId,
        asOfDate
      });
      setNoteData(data);
    } catch (err) {
      setLoadError(err.message || 'Failed to load note');
      setNoteData(null);
    } finally {
      setLoading(false);
    }
  }, [asOfDate, selectedNoteId]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const periods = buildNotePeriods(asOfDate);
  const selectedNote = FINANCIAL_NOTES.find((n) => n.id === selectedNoteId) || null;

  return (
    <div className="nts-page">
      <div className="nts-wrap">
        <header className="nts-header">
          <div>
            <h1 className="nts-title">Notes to the Financial Statements</h1>
            <p className="nts-subtitle">As at {periods.current.label}</p>
          </div>
          <label className="nts-filter" htmlFor="frn-as-of">
            As at date
            <input
              id="frn-as-of"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </label>
        </header>

        <div className="nts-tabs-bar" role="tablist" aria-label="Notes contents">
          <div className="nts-tabs-scroll" ref={tabsScrollRef}>
            {FINANCIAL_NOTES.map((note) => {
              const active = selectedNoteId === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  ref={active ? activeTabRef : null}
                  className={`nts-tab${active ? ' is-active' : ''}`}
                  onClick={() => setSelectedNoteId(note.id)}
                  title={`Note ${note.number} — ${note.title}`}
                >
                  <span className="nts-tab-num">{note.number}</span>
                  <span className="nts-tab-label">{note.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedNoteId ? (
          <div className="nts-excel-workbook">
            <div className="nts-excel-titlebar">
              <span className="nts-excel-titlebar-text">
                Notes to the Financial Statements
                {selectedNote ? ` — Note ${selectedNote.number}` : ''}
              </span>
            </div>
            <div className="nts-excel-ribbon">
              <span className="nts-excel-ribbon-item is-active">Home</span>
              <span className="nts-excel-ribbon-item">Insert</span>
              <span className="nts-excel-ribbon-item">Page Layout</span>
            </div>
            <div className="nts-excel-formula-bar">
              <span className="nts-excel-cell-ref">A1</span>
              <span className="nts-excel-formula-input">
                {selectedNote
                  ? `${selectedNote.number}. ${selectedNote.title}`
                  : ''}
              </span>
            </div>
            <div className="nts-excel-grid-area">
              <DisclosureNoteView data={noteData} loading={loading} error={loadError} />
            </div>
            <div className="nts-excel-sheet-tabs">
              <span className="nts-excel-sheet-tab is-active">
                Note {selectedNote?.number ?? ''}
              </span>
              <span className="nts-excel-sheet-tab">Contents</span>
            </div>
          </div>
        ) : (
          <p className="nts-hint">Select a note tab to open its disclosure.</p>
        )}
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
