import React from 'react';
import './Styles/FinancialPosition.css';

const FinancialReportingNotes = () => {
  return (
    <div className="fp-main-container">
      <div className="fp-content-wrapper">
        <div className="fp-header-section">
          <div className="fp-header-left">
            <h1 className="fp-main-title">FINANCIAL REPORTING NOTES</h1>
            <div className="fp-period-info">
              <span className="fp-period-label">Notes to the financial statements</span>
            </div>
          </div>
        </div>

        <div className="fp-main-content" style={{ padding: '24px' }}>
          <div style={{ color: '#475569', lineHeight: 1.6 }}>
            <p style={{ marginTop: 0 }}>
              This section is reserved for explanatory notes supporting Financial Reporting statements
              (e.g., Note 7: Property, Plant & Equipment; Note 11: Prepayments & Receivables).
            </p>
            <p style={{ marginBottom: 0 }}>
              Content and note mappings can be implemented next.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportingNotes;

