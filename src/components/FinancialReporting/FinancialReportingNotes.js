import React, { useState, useEffect, useCallback } from 'react';
import './Styles/FinancialPosition.css';
import DisclosureNoteView from './DisclosureNoteView';
import { buildNotePeriods } from '../../utils/financialNotePeriods';
import { loadFinancialNoteData } from '../../utils/loadFinancialNoteData';
import { FINANCIAL_NOTES } from '../../utils/financialNotesRegistry';

const todayYmd = () => new Date().toISOString().split('T')[0];

const CONTENTS_START_PAGE = 2;

const FinancialReportingNotes = ({ context = null }) => {
  const [asOfDate, setAsOfDate] = useState(() => context?.asOfDate || todayYmd());
  const [selectedNoteId, setSelectedNoteId] = useState(() => context?.noteId || '');
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (context?.asOfDate) setAsOfDate(context.asOfDate);
    if (context?.noteId) setSelectedNoteId(context.noteId);
  }, [context?.asOfDate, context?.noteId]);

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

  return (
    <div className="fp-main-container">
      <div className="fp-content-wrapper">
        <div className="fp-header-section">
          <div className="fp-header-left">
            <h1 className="fp-main-title">Notes to the Financial Statements</h1>
            <p className="frn-page-subtitle">As at {periods.current.label}</p>
          </div>
          <div className="frn-header-actions">
            <label className="frn-asof-label" htmlFor="frn-as-of">
              As at date
              <input
                id="frn-as-of"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="frn-body">
          <div className="frn-contents">
            <div className="frn-excel-sheet frn-contents-sheet">
              <table className="frn-excel-table frn-contents-table">
                <colgroup>
                  <col className="frn-contents-col-note" />
                  <col className="frn-contents-col-desc" />
                  <col className="frn-contents-col-page" />
                </colgroup>
                <thead>
                  <tr className="frn-excel-head">
                    <td>Note</td>
                    <td>Description</td>
                    <td className="frn-excel-num">Page</td>
                  </tr>
                </thead>
                <tbody>
                  {FINANCIAL_NOTES.map((note, index) => {
                    const active = selectedNoteId === note.id;
                    return (
                      <tr
                        key={note.id}
                        className={`frn-contents-row${active ? ' is-active' : ''}`}
                        onClick={() => setSelectedNoteId(note.id)}
                      >
                        <td className="frn-contents-note">{note.number}</td>
                        <td className="frn-contents-desc">{note.title}</td>
                        <td className="frn-excel-num">{CONTENTS_START_PAGE + index}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedNoteId ? (
            <DisclosureNoteView data={noteData} loading={loading} error={loadError} />
          ) : (
            <p className="frn-contents-hint">Select a note from the contents to open its disclosure.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
