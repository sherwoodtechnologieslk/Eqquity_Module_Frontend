import React, { useState, useEffect } from 'react';
import './Styles/ScripDividendEntry.css';

const ScripDividendEntry = () => {
  const [form, setForm] = useState({
    securityCode: '',
    securityName: '',
    dividendType: 'Stock (Scrip)',
    declarationDate: '',
    exDividendDate: '',
    recordDate: '',
    allotmentDate: '',
    dividendRate: '',
    sharesHeld: '',
    bonusSharesReceived: '',
    updatedHolding: '',
    remarks: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredFields = [
      'securityCode',
      'securityName',
      'declarationDate',
      'exDividendDate',
      'recordDate',
      'allotmentDate',
      'dividendRate',
      'sharesHeld'
    ];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    console.log('Submitted:', form);
    alert('Scrip dividend entry submitted successfully!');
  };

  const handleReset = () => {
    setForm({
      securityCode: '',
      securityName: '',
      dividendType: 'Stock (Scrip)',
      declarationDate: '',
      exDividendDate: '',
      recordDate: '',
      allotmentDate: '',
      dividendRate: '',
      sharesHeld: '',
      bonusSharesReceived: '',
      updatedHolding: '',
      remarks: ''
    });
  };

  // Auto-calculate bonus shares and updated holding
  useEffect(() => {
    const rate = parseFloat(form.dividendRate);
    const held = parseInt(form.sharesHeld);
    if (!isNaN(rate) && !isNaN(held)) {
      const bonus = Math.floor((rate / 100) * held);
      const updated = held + bonus;
      setForm(prev => ({
        ...prev,
        bonusSharesReceived: bonus.toString(),
        updatedHolding: updated.toString()
      }));
    } else {
      setForm(prev => ({
        ...prev,
        bonusSharesReceived: '',
        updatedHolding: ''
      }));
    }
  }, [form.dividendRate, form.sharesHeld]);

  return (
    <div className="scrip-page-container">
      <div className="scrip-content-wrapper">
        <div className="scrip-header-section">
          <div className="scrip-header-icon">
            <svg className="scrip-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h6a1 1 0 100-2H9z"/>
            </svg>
          </div>
          <div className="scrip-header-text-group">
            <h1 className="scrip-main-title">Splits & Bonus</h1>
            <p className="scrip-subtitle">Record stock dividends, splits, and bonus share allotments</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="scrip-form-card">
          <div className="scrip-card-header">
            <h2 className="scrip-card-title">Stock Dividend Information</h2>
          </div>

          <div className="scrip-form-content">
            <form onSubmit={handleSubmit}>
              <div className="scrip-form-grid">

                {/* Security Code */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Security Code *</label>
                  <input
                    name="securityCode"
                    placeholder="Enter security code"
                    value={form.securityCode}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Security Name */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Security Name *</label>
                  <input
                    name="securityName"
                    placeholder="Enter security name"
                    value={form.securityName}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Dividend Type */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Dividend Type</label>
                  <select
                    name="dividendType"
                    value={form.dividendType}
                    onChange={handleChange}
                    className="scrip-form-select"
                  >
                    <option value="Stock (Scrip)">Stock (Scrip)</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Declaration Date */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Declaration Date *</label>
                  <input
                    type="date"
                    name="declarationDate"
                    value={form.declarationDate}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Ex-Dividend Date */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Ex-Dividend Date *</label>
                  <input
                    type="date"
                    name="exDividendDate"
                    value={form.exDividendDate}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Record Date */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Record Date *</label>
                  <input
                    type="date"
                    name="recordDate"
                    value={form.recordDate}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Allotment Date */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Allotment Date *</label>
                  <input
                    type="date"
                    name="allotmentDate"
                    value={form.allotmentDate}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Dividend Rate */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Dividend Rate (%) *</label>
                  <input
                    name="dividendRate"
                    placeholder="e.g., 10"
                    value={form.dividendRate}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Shares Held */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Shares Held *</label>
                  <input
                    name="sharesHeld"
                    placeholder="Number of shares held"
                    value={form.sharesHeld}
                    onChange={handleChange}
                    className="scrip-form-input"
                  />
                </div>

                {/* Bonus Shares Received */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Bonus Shares Received</label>
                  <input
                    value={form.bonusSharesReceived}
                    readOnly
                    placeholder="Auto calculated"
                    className="scrip-form-input calculated"
                  />
                </div>

                {/* Updated Holding */}
                <div className="scrip-field-group">
                  <label className="scrip-field-label">Updated Holding</label>
                  <input
                    value={form.updatedHolding}
                    readOnly
                    placeholder="Auto calculated"
                    className="scrip-form-input calculated"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="scrip-notes-section">
                <label className="scrip-field-label">Remarks & Notes</label>
                <textarea
                  name="remarks"
                  placeholder="Add any additional notes or remarks about this scrip dividend..."
                  value={form.remarks}
                  onChange={handleChange}
                  rows="4"
                  className="scrip-form-textarea"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="scrip-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="scrip-btn scrip-btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="scrip-btn scrip-btn-tertiary"
                  onClick={() => alert('View Scrip History')}
                >
                  View Scrip History
                </button>
                <button
                  type="submit"
                  className="scrip-btn scrip-btn-primary"
                >
                  Save Scrip Dividend
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="scrip-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure scrip dividend management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default ScripDividendEntry;