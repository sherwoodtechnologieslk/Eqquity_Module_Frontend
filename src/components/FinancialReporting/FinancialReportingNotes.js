import React, { useState, useEffect, useRef } from 'react';
import './Styles/FinancialPosition.css';
import { buildNotePeriods } from '../../utils/financialNotePeriods';
import { notesContextKey } from '../../utils/financialNotesRegistry';

const todayYmd = () => new Date().toISOString().split('T')[0];

const FinancialReportingNotes = ({ context = null }) => {
  const incomingContextKey = notesContextKey(context);
  const [asOfDate, setAsOfDate] = useState(() => context?.asOfDate || todayYmd());
  const prevIncomingKeyRef = useRef('');

  useEffect(() => {
    if (incomingContextKey && incomingContextKey !== prevIncomingKeyRef.current) {
      if (context?.asOfDate) setAsOfDate(context.asOfDate);
    }
    prevIncomingKeyRef.current = incomingContextKey;
  }, [incomingContextKey, context?.asOfDate]);

  const periods = buildNotePeriods(asOfDate);

  return (
    <div className="fp-main-container">
      <div className="fp-content-wrapper">
        <div className="fp-header-section">
          <div className="fp-header-left">
            <h1 className="fp-main-title">Notes to the Financial Statements</h1>
            <p className="frn-page-subtitle">As at {periods.current.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportingNotes;
