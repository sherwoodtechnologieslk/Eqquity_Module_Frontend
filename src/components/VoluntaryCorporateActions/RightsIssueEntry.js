import React, { useState } from 'react';
import './Styles/RightsIssueEntry.css';

const RightsIssueEntry = () => {
  const [form, setForm] = useState({
    securityCode: '',
    securityName: '',
    rightsRatioFrom: '',
    rightsRatioTo: '',
    offerPrice: '',
    announcementDate: '',
    recordDate: '',
    exRightsDate: '',
    subscriptionStart: '',
    subscriptionEnd: '',
    sharesHeld: '',
    eligibleShares: '',
    subscribed: 'Yes',
    subscribedQty: '',
    amountPaid: '',
    allottedShares: '',
    remarks: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredFields = [
      'securityCode',
      'securityName',
      'rightsRatioFrom',
      'rightsRatioTo',
      'offerPrice',
      'announcementDate',
      'recordDate',
      'exRightsDate',
      'subscriptionStart',
      'subscriptionEnd',
      'sharesHeld'
    ];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    console.log('Submitted:', form);
    alert('Rights Issue entry submitted successfully!');
  };

  const handleReset = () => {
    setForm({
      securityCode: '',
      securityName: '',
      rightsRatioFrom: '',
      rightsRatioTo: '',
      offerPrice: '',
      announcementDate: '',
      recordDate: '',
      exRightsDate: '',
      subscriptionStart: '',
      subscriptionEnd: '',
      sharesHeld: '',
      eligibleShares: '',
      subscribed: 'Yes',
      subscribedQty: '',
      amountPaid: '',
      allottedShares: '',
      remarks: ''
    });
  };

  return (
    <div className="rights-page-container">
      <div className="rights-content-wrapper">
        <div className="rights-header-section">
          <div className="rights-header-icon">
            <svg className="rights-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 6h12v6H4v-6z"/>
              <path d="M6 6h8v2H6V6z"/>
            </svg>
          </div>
          <div className="rights-header-text-group">
            <h1 className="rights-main-title">Rights Issue Entry</h1>
            <p className="rights-subtitle">Manage and track rights issue subscriptions and allocations</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rights-form-card">
          <div className="rights-card-header">
            <h2 className="rights-card-title">Rights Issue Information</h2>
          </div>

          <div className="rights-form-content">
            <form onSubmit={handleSubmit}>
              
              {/* Security Information Section */}
              <div className="rights-section-header">
                <div className="rights-section-icon">
                  <svg className="rights-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="rights-section-title">Security Details</h3>
              </div>

              <div className="rights-form-grid">
                {/* Security Code */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Security Code *</label>
                  <input
                    name="securityCode"
                    placeholder="Enter security code"
                    value={form.securityCode}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Security Name */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Security Name *</label>
                  <input
                    name="securityName"
                    placeholder="Enter security name"
                    value={form.securityName}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Rights Ratio */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Rights Ratio *</label>
                  <div className="rights-ratio-inputs">
                    <input
                      name="rightsRatioFrom"
                      placeholder="1"
                      value={form.rightsRatioFrom}
                      onChange={handleChange}
                      className="rights-form-input"
                    />
                    <span className="rights-ratio-separator">:</span>
                    <input
                      name="rightsRatioTo"
                      placeholder="4"
                      value={form.rightsRatioTo}
                      onChange={handleChange}
                      className="rights-form-input"
                    />
                  </div>
                </div>

                {/* Offer Price */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Offer Price (LKR) *</label>
                  <input
                    name="offerPrice"
                    placeholder="Enter offer price"
                    value={form.offerPrice}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>
              </div>

              {/* Date Information Section */}
              <div className="rights-section-header">
                <div className="rights-section-icon">
                  <svg className="rights-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="rights-section-title">Important Dates</h3>
              </div>

              <div className="rights-form-grid">
                {/* Announcement Date */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Announcement Date *</label>
                  <input
                    type="date"
                    name="announcementDate"
                    value={form.announcementDate}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Record Date */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Record Date *</label>
                  <input
                    type="date"
                    name="recordDate"
                    value={form.recordDate}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Ex-Rights Date */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Ex-Rights Date *</label>
                  <input
                    type="date"
                    name="exRightsDate"
                    value={form.exRightsDate}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Subscription Start */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Subscription Start *</label>
                  <input
                    type="date"
                    name="subscriptionStart"
                    value={form.subscriptionStart}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Subscription End */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Subscription End *</label>
                  <input
                    type="date"
                    name="subscriptionEnd"
                    value={form.subscriptionEnd}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>
              </div>

              {/* Shareholding & Subscription Section */}
              <div className="rights-section-header">
                <div className="rights-section-icon">
                  <svg className="rights-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z"/>
                    <path d="M6 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6z"/>
                  </svg>
                </div>
                <h3 className="rights-section-title">Shareholding & Subscription Details</h3>
              </div>

              <div className="rights-form-grid">
                {/* Shares Held */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Shares Held *</label>
                  <input
                    name="sharesHeld"
                    placeholder="Enter shares held"
                    value={form.sharesHeld}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Eligible Shares */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Eligible Shares</label>
                  <input
                    name="eligibleShares"
                    placeholder="Auto-calculated"
                    value={form.eligibleShares}
                    onChange={handleChange}
                    className="rights-form-input calculated"
                  />
                </div>

                {/* Subscribed */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Subscribed</label>
                  <select
                    name="subscribed"
                    value={form.subscribed}
                    onChange={handleChange}
                    className="rights-form-select"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Subscribed Qty */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Subscribed Quantity</label>
                  <input
                    name="subscribedQty"
                    placeholder="Enter quantity subscribed"
                    value={form.subscribedQty}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>

                {/* Amount Paid */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Amount Paid (LKR)</label>
                  <input
                    name="amountPaid"
                    placeholder="Auto-calculated"
                    value={form.amountPaid}
                    onChange={handleChange}
                    className="rights-form-input calculated"
                  />
                </div>

                {/* Allotted Shares */}
                <div className="rights-field-group">
                  <label className="rights-field-label">Allotted Shares</label>
                  <input
                    name="allottedShares"
                    placeholder="Enter allotted shares"
                    value={form.allottedShares}
                    onChange={handleChange}
                    className="rights-form-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="rights-notes-section">
                <label className="rights-field-label">Remarks & Notes</label>
                <textarea
                  name="remarks"
                  placeholder="Add any additional remarks or notes about this rights issue..."
                  value={form.remarks}
                  onChange={handleChange}
                  rows="4"
                  className="rights-form-textarea"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="rights-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="rights-btn rights-btn-secondary"
                >
                  Clear Form
                </button>
                <button
                  type="button"
                  className="rights-btn rights-btn-tertiary"
                  onClick={() => alert('View existing rights issues')}
                >
                  View Rights Issues
                </button>
                <button
                  type="submit"
                  className="rights-btn rights-btn-primary"
                >
                  Save Rights Issue
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="rights-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure rights issue management • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default RightsIssueEntry;