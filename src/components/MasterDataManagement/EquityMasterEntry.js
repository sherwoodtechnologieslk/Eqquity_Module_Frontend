import React, { useState } from 'react';
import { equityAPI } from '../../services/api';
import EquityListView from './EquityListView';
import './Styles/EquityMasterEntry.css';

const EquityMasterEntry = () => {
  const [form, setForm] = useState({
    companyName: '',
    tickerSymbol: '',
    isin: '',
    sector: '',
    market: 'Colombo Stock Exchange',
    country: 'Sri Lanka',
    currency: 'LKR',
    status: true,
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'companyName',
      'tickerSymbol'
    ];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Check if ticker symbol already exists
    try {
      const symbolCheck = await equityAPI.checkSymbolExists(form.tickerSymbol.trim());
      if (symbolCheck.exists) {
        alert(`Ticker Symbol "${form.tickerSymbol.trim()}" already exists. Please use a different symbol.`);
        return;
      }
    } catch (error) {
      console.error('Error checking symbol:', error);
      alert('Error checking ticker symbol. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const equityData = {
        name: form.companyName,
        symbol: form.tickerSymbol.trim(),
        isin: form.isin,
        sector: form.sector,
        market: form.market,
        country: form.country,
        currency: form.currency,
        isActive: form.status,
        notes: form.notes
      };

      const result = await equityAPI.createEquity(equityData);
      
      console.log('Equity created:', result);
      setListRefreshKey((key) => key + 1);
      setForm({
        companyName: '',
        tickerSymbol: '',
        isin: '',
        sector: '',
        market: 'Colombo Stock Exchange',
        country: 'Sri Lanka',
        currency: 'LKR',
        status: true,
        notes: ''
      });
      setSubmitMessage('Equity saved successfully!');
      
    } catch (error) {
      console.error('Error saving equity:', error);
      setSubmitMessage('Error saving equity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      tickerSymbol: '',
      isin: '',
      sector: '',
      market: 'Colombo Stock Exchange',
      country: 'Sri Lanka',
      currency: 'LKR',
      status: true,
      notes: ''
    });
    setSubmitMessage('');
  };

  return (
    <div className="eqt-page-container">
      <div className="eqt-content-wrapper">
        <div className="eqt-header-section">
          <div className="eqt-header-text-group">
            <h1 className="eqt-main-title">Equity Master Entry</h1>
            <p className="eqt-subtitle">Add new equity securities and manage existing records below</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="eqt-form-card">
          <div className="eqt-card-header">
            <h2 className="eqt-card-title">Security Information</h2>
          </div>

          <div className="eqt-form-content">
            <form onSubmit={handleSubmit}>
              <div className="eqt-form-grid">

                {/* Company Name */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Company Name *</label>
                  <input
                    name="companyName"
                    placeholder="Enter company name"
                    value={form.companyName}
                    onChange={handleChange}
                    className="eqt-form-input"
                  />
                </div>

                {/* Ticker Symbol */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Ticker Symbol *</label>
                  <input
                    name="tickerSymbol"
                    placeholder="e.g., AAPL"
                    value={form.tickerSymbol}
                    onChange={handleChange}
                    className="eqt-form-input"
                  />
                </div>

                {/* ISIN */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">ISIN</label>
                  <input
                    name="isin"
                    placeholder="e.g., US0378331005"
                    value={form.isin}
                    onChange={handleChange}
                    className="eqt-form-input"
                  />
                </div>

                {/* Sector */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Sector</label>
                  <select
                    name="sector"
                    value={form.sector}
                    onChange={handleChange}
                    className="eqt-form-select"
                  >
                    <option value="">Select Sector</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Consumer Goods">Consumer Goods</option>
                    <option value="Energy">Energy</option>
                    <option value="Construction & Engineering">Construction & Engineering</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Real Estate & Property Development">Real Estate & Property Development</option>
                    <option value="Retail & Trading">Retail & Trading</option>
                    <option value="Investment Trusts & Holdings">Investment Trusts & Holdings</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Plantations/Agriculture">Plantations/Agriculture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Market */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Market</label>
                  <input
                    name="market"
                    value={form.market}
                    readOnly
                    className="eqt-form-input eqt-readonly-field"
                  />
                </div>

                {/* Country */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Country</label>
                  <input
                    name="country"
                    value={form.country}
                    readOnly
                    className="eqt-form-input eqt-readonly-field"
                  />
                </div>

                {/* Currency */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Currency</label>
                  <input
                    name="currency"
                    value={form.currency}
                    readOnly
                    className="eqt-form-input eqt-readonly-field"
                  />
                </div>

                {/* Status Toggle */}
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Status</label>
                  <div className="eqt-status-container">
                    <label className="eqt-toggle-wrapper">
                      <input
                        type="checkbox"
                        name="status"
                        checked={form.status}
                        onChange={handleChange}
                        className="eqt-toggle-input"
                      />
                      <div className={`eqt-toggle-slider ${form.status ? 'active' : ''}`}>
                        <div className="eqt-toggle-thumb"></div>
                      </div>
                    </label>
                    <span className={`eqt-status-text ${form.status ? 'active' : ''}`}>
                      {form.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="eqt-notes-section">
                <label className="eqt-field-label">Notes & Description</label>
                <textarea
                  name="notes"
                  placeholder="Add any additional notes or description about this equity..."
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  className="eqt-form-textarea"
                ></textarea>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`eqt-message ${submitMessage.includes('Error') ? 'eqt-error' : 'eqt-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="eqt-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="eqt-btn eqt-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="eqt-btn eqt-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Equity'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Equities */}
        <div className="eqt-form-card eqt-list-card">
          <div className="eqt-card-header">
            <h2 className="eqt-card-title">Existing Equities</h2>
          </div>
          <EquityListView embedded refreshKey={listRefreshKey} />
        </div>

        {/* Footer */}
        <div className="eqt-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure equity management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default EquityMasterEntry;
