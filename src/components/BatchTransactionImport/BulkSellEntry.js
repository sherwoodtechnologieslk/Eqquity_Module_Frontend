import React, { useState } from 'react';
import './Styles/BulkSellEntry.css';

const BulkSellEntry = () => {
  const [form, setForm] = useState({
    // Add form fields as needed
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Bulk Sell Entry submitted');
  };

  return (
    <div className="bulk-sell-page-container">
      <div className="bulk-sell-content-wrapper">
        {/* Header */}
        <div className="bulk-sell-header-section">
          <div className="bulk-sell-header-icon">
            <svg className="bulk-sell-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="bulk-sell-header-text-group">
            <h1 className="bulk-sell-main-title">Bulk Sell Transaction Entry</h1>
            <p className="bulk-sell-subtitle">Record bulk equity sale transactions with automatic calculations</p>
          </div>
        </div>

        <div className="bulk-sell-container">
          <div className="bulk-sell-card-header">
            <h2 className="bulk-sell-card-title">Transaction Details</h2>
          </div>
          <div className="bulk-sell-form-content">
            <form onSubmit={handleSubmit} className="bulk-sell-form">
              <div className="bulk-sell-form-grid">
                {/* Coming Soon Content */}
                <div className="bulk-sell-coming-soon">
                  <div className="bulk-sell-coming-soon-icon">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="bulk-sell-coming-soon-title">Coming Soon</h3>
                  <p className="bulk-sell-coming-soon-text">
                    Bulk Sell Transaction Entry functionality is currently under development. 
                    This feature will allow you to record multiple sell transactions efficiently.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSellEntry;
