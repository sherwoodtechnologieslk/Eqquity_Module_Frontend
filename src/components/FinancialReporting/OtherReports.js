import React from 'react';
import './Styles/FinancialReportsExport.css';

const OtherReports = () => {
  const handleBorrowingsClick = () => {
    // Borrowings report action — to be wired up.
  };

  return (
    <div className="fre-wrap">
      <div className="fre-header">
        <div>
          <h2>Other Reports</h2>
          <p>Additional report types and exports will appear here.</p>
        </div>
      </div>

      <div className="other-reports-content">
        <button
          type="button"
          className="fre-refresh"
          onClick={handleBorrowingsClick}
        >
          Borrowings
        </button>
      </div>
    </div>
  );
};

export default OtherReports;
