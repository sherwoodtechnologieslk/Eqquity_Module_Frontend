import React, { useState } from 'react';
import './Styles/IPOAllocation.css';

const IPOAllocation = () => {
  const [form, setForm] = useState({
    companyName: '',
    appliedQuantity: '',
    allocatedQuantity: '',
    pricePerShare: '',
    refundAmount: '',
    bankAccount: '',
    refundReceived: ''
  });

  const ipoEntries = [
    { companyName: 'ABC Ltd', appliedQuantity: 100, pricePerShare: 50 },
    { companyName: 'XYZ Corp', appliedQuantity: 200, pricePerShare: 75 }
  ];

  const handleCompanySelect = (e) => {
    const selected = ipoEntries.find(entry => entry.companyName === e.target.value);
    if (selected) {
      setForm(prev => ({
        ...prev,
        companyName: selected.companyName,
        appliedQuantity: selected.appliedQuantity,
        pricePerShare: selected.pricePerShare,
        allocatedQuantity: '',
        refundAmount: '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        companyName: '',
        appliedQuantity: '',
        pricePerShare: '',
        allocatedQuantity: '',
        refundAmount: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    if (name === 'allocatedQuantity' && form.pricePerShare) {
      const refundQty = form.appliedQuantity - value;
      const refund = refundQty * form.pricePerShare;
      updated.refundAmount = isNaN(refund) ? '' : refund.toFixed(2);
    }

    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('IPO Allocation Submitted:', form);
    alert('IPO Allocation submitted successfully!');
    setForm({
      companyName: '',
      appliedQuantity: '',
      allocatedQuantity: '',
      pricePerShare: '',
      refundAmount: '',
      bankAccount: '',
      refundReceived: ''
    });
  };

  return (
    <div className="ipo-page-container">
      <div className="ipo-content-wrapper">
        <div className="ipo-header-section">
          <div className="ipo-header-text-group">
            <p className="ipo-eyebrow">IPO</p>
            <h1 className="ipo-main-title">IPO Allocation</h1>
            <p className="ipo-subtitle">Record allocated shares and refund details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ipo-form-card">
          <div className="ipo-card-header">
            <h2 className="ipo-card-title">Allocation Details</h2>
          </div>
          <div className="ipo-form-content">
            <div className="ipo-form-grid">
              <div className="ipo-field-group">
                <label className="ipo-field-label">IPO Issue Company *</label>
                <select
                  name="companyName"
                  value={form.companyName}
                  onChange={handleCompanySelect}
                  className="ipo-form-select"
                  required
                >
                  <option value="">Select IPO Entry</option>
                  {ipoEntries.map((entry, idx) => (
                    <option key={idx} value={entry.companyName}>{entry.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Applied Quantity</label>
                <input
                  name="appliedQuantity"
                  value={form.appliedQuantity}
                  className="ipo-form-input"
                  disabled
                  readOnly
                />
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Allocated Quantity *</label>
                <input
                  type="number"
                  name="allocatedQuantity"
                  value={form.allocatedQuantity}
                  onChange={handleChange}
                  className="ipo-form-input"
                  required
                />
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Price per Share</label>
                <input
                  name="pricePerShare"
                  value={form.pricePerShare}
                  className="ipo-form-input"
                  disabled
                  readOnly
                />
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Refund Amount</label>
                <input
                  name="refundAmount"
                  value={form.refundAmount}
                  className="ipo-form-input"
                  disabled
                  readOnly
                />
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Bank Account</label>
                <input
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={handleChange}
                  className="ipo-form-input"
                />
              </div>

              <div className="ipo-field-group">
                <label className="ipo-field-label">Refund Received *</label>
                <select
                  name="refundReceived"
                  value={form.refundReceived}
                  onChange={handleChange}
                  className="ipo-form-select"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="ipo-button-section">
              <button type="submit" className="ipo-btn ipo-btn-primary">Submit Allocation</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPOAllocation;
