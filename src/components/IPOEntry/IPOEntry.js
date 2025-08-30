import React, { useState } from 'react';
import './Styles/IPOEntry.css';

const IPOEntry = () => {
  const [form, setForm] = useState({
    companyName: '',
    ipoDate: '',
    appliedDate: '',
    pricePerShare: '',
    totalInvestment: '',
    paymentMethod: '',
    remarks: ''
  });

  const paymentMethods = ['RTGS', 'SLIPS', 'CEFT', 'Online', 'Cheque', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    const requiredFields = ['companyName', 'ipoDate', 'appliedDate', 'pricePerShare', 'totalInvestment', 'paymentMethod'];
    const missing = requiredFields.filter(f => !form[f].trim());
    if (missing.length > 0) {
      alert(`Please fill in all required fields:\n- ${missing.join('\n- ')}`);
      return;
    }
    console.log('IPO Entry:', form);
    alert('IPO Entry submitted successfully!');
    setForm({
      companyName: '',
      ipoDate: '',
      appliedDate: '',
      pricePerShare: '',
      totalInvestment: '',
      paymentMethod: '',
      remarks: ''
    });
  };

  return (
    <div className="ipo-page-container">
      <div className="ipo-content-wrapper">
        <div className="ipo-header-section">
          <div className="ipo-header-icon">
            <svg className="ipo-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a1 1 0 011-1h10a1 1 0 011 1v14a1 1 0 11-2 0V4H5v13a1 1 0 11-2 0V3z" />
              <path d="M8 6a1 1 0 000 2h4a1 1 0 100-2H8z" />
            </svg>
          </div>
          <div className="ipo-header-text-group">
            <h1 className="ipo-main-title">IPO Entry</h1>
            <p className="ipo-subtitle">Record your initial public offering investments</p>
          </div>
        </div>

        <div className="ipo-form-card">
          <div className="ipo-card-header">
            <h2 className="ipo-card-title">IPO Details</h2>
          </div>

          <div className="ipo-form-content">
            <form onSubmit={handleSubmit}>
              <div className="ipo-form-grid">
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Company Name *</label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="ipo-form-input"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">IPO Date *</label>
                  <input
                    name="ipoDate"
                    type="date"
                    value={form.ipoDate}
                    onChange={handleChange}
                    className="ipo-form-input"
                  />
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Applied Date *</label>
                  <input
                    name="appliedDate"
                    type="date"
                    value={form.appliedDate}
                    onChange={handleChange}
                    className="ipo-form-input"
                  />
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Price per Share *</label>
                  <input
                    name="pricePerShare"
                    type="number"
                    step="0.01"
                    value={form.pricePerShare}
                    onChange={handleChange}
                    className="ipo-form-input"
                  />
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Total Investment *</label>
                  <input
                    name="totalInvestment"
                    type="number"
                    step="0.01"
                    value={form.totalInvestment}
                    onChange={handleChange}
                    className="ipo-form-input"
                  />
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="ipo-form-select"
                  >
                    <option value="">Select Method</option>
                    {paymentMethods.map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="ipo-field-group">
                  <label className="ipo-field-label">Remarks</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    className="ipo-form-textarea"
                    rows="3"
                    placeholder="Optional comments"
                  ></textarea>
                </div>
              </div>

              <div className="ipo-button-section">
                <button type="submit" className="ipo-btn ipo-btn-primary">Submit IPO</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="ipo-footer-section">
        <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure IPO entry management • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default IPOEntry;
