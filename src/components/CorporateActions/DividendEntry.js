import React, { useState } from 'react';
import './Styles/DividendEntry.css';

const DividendEntry = () => {
  const [form, setForm] = useState({
    securityCode: '',
    securityName: '',
    dividendType: 'Cash',
    announcementDate: '',
    exDividendDate: '',
    recordDate: '',
    paymentDate: '',
    dividendRate: '',
    sharesHeld: '',
    taxWithheld: '',
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
      'announcementDate',
      'exDividendDate',
      'recordDate',
      'paymentDate',
      'dividendRate',
      'sharesHeld'
    ];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    console.log('Submitted:', form);
    alert('Dividend entry submitted successfully!');
  };

  const handleReset = () => {
    setForm({
      securityCode: '',
      securityName: '',
      dividendType: 'Cash',
      announcementDate: '',
      exDividendDate: '',
      recordDate: '',
      paymentDate: '',
      dividendRate: '',
      sharesHeld: '',
      taxWithheld: '',
      remarks: ''
    });
  };

  const amountPayable = () => {
    const rate = parseFloat(form.dividendRate);
    const shares = parseFloat(form.sharesHeld);
    return (!isNaN(rate) && !isNaN(shares)) ? (rate * shares).toFixed(2) : '';
  };

  return (
    <div className="div-page-container">
      <div className="div-content-wrapper">
        <div className="div-header-section">
          <div className="div-header-icon">
            <svg className="div-icon" fill="currentColor" viewBox="0 0 20 20">
<path d="M12 3L2 9h2v8h12V9h2L12 3zm0 2.84L17.16 9H6.84L12 5.84zM6 11h2v4H6v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4z"/>            </svg>
            
          </div>
          <div className="div-header-text-group">
            <h1 className="div-main-title">Dividend Entry Screen</h1>
            <p className="div-subtitle">Record dividends declared for your holdings</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="div-form-card">
          <div className="div-card-header">
            <h2 className="div-card-title">Dividend Information</h2>
          </div>

          <div className="div-form-content">
            <form onSubmit={handleSubmit}>
              <div className="div-form-grid">

                {/* Security Code */}
                <div className="div-field-group">
                  <label className="div-field-label">Security Code *</label>
                  <input
                    name="securityCode"
                    placeholder="Enter security code"
                    value={form.securityCode}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Security Name */}
                <div className="div-field-group">
                  <label className="div-field-label">Security Name *</label>
                  <input
                    name="securityName"
                    placeholder="Enter security name"
                    value={form.securityName}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Dividend Type */}
                <div className="div-field-group">
                  <label className="div-field-label">Dividend Type</label>
                  <select
                    name="dividendType"
                    value={form.dividendType}
                    onChange={handleChange}
                    className="div-form-select"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Scrip">Stock</option>
                  </select>
                </div>

                {/* Announcement Date */}
                <div className="div-field-group">
                  <label className="div-field-label">Announcement Date *</label>
                  <input
                    type="date"
                    name="announcementDate"
                    value={form.announcementDate}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Ex-Dividend Date */}
                <div className="div-field-group">
                  <label className="div-field-label">Ex-Dividend Date *</label>
                  <input
                    type="date"
                    name="exDividendDate"
                    value={form.exDividendDate}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Record Date */}
                <div className="div-field-group">
                  <label className="div-field-label">Record Date *</label>
                  <input
                    type="date"
                    name="recordDate"
                    value={form.recordDate}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Payment Date */}
                <div className="div-field-group">
                  <label className="div-field-label">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={form.paymentDate}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Dividend Rate */}
                <div className="div-field-group">
                  <label className="div-field-label">Dividend Rate *</label>
                  <input
                    name="dividendRate"
                    placeholder="Rate per share"
                    value={form.dividendRate}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Shares Held */}
                <div className="div-field-group">
                  <label className="div-field-label">Shares Held *</label>
                  <input
                    name="sharesHeld"
                    placeholder="Number of shares"
                    value={form.sharesHeld}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>

                {/* Amount Payable */}
                <div className="div-field-group">
                  <label className="div-field-label">Amount Payable</label>
                  <input
                    value={amountPayable()}
                    readOnly
                    placeholder="Auto calculated"
                    className="div-form-input calculated"
                  />
                </div>

                {/* Tax Withheld */}
                <div className="div-field-group">
                  <label className="div-field-label">Tax Withheld</label>
                  <input
                    name="taxWithheld"
                    placeholder="Tax amount (optional)"
                    value={form.taxWithheld}
                    onChange={handleChange}
                    className="div-form-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="div-notes-section">
                <label className="div-field-label">Remarks & Notes</label>
                <textarea
                  name="remarks"
                  placeholder="Add any additional notes or remarks about this dividend..."
                  value={form.remarks}
                  onChange={handleChange}
                  rows="4"
                  className="div-form-textarea"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="div-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="div-btn div-btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="div-btn div-btn-tertiary"
                >
                  View Dividend History
                </button>
                <button
                  type="submit"
                  className="div-btn div-btn-primary"
                >
                  Save Dividend
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="div-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure dividend management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default DividendEntry;