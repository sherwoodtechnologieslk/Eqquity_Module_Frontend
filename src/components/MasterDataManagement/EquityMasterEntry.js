import React, { useState } from 'react';
import { equityAPI } from '../../services/api';
import EquityListView from './EquityListView';
import './Styles/EquityMasterEntryScreen.css';

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
    <div className="eqme">
      <header className="eqme-rail">
        <div className="eqme-rail__brand">
          <div>
            <p className="eqme-rail__eyebrow">Masters · Equities</p>
            <h1 className="eqme-rail__title">Equity Master Entry</h1>
            <p className="eqme-rail__blurb">
              Register listed securities: ticker, ISIN, sector, and market defaults
            </p>
          </div>
        </div>
      </header>

      <section className="eqme-panel">
        <div className="eqme-panel__head">
          <div>
            <h2>Security information</h2>
            <p>Required fields marked with *. Market, country, and currency are locked for CSE books.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="eqme-form">
          <div className="eqme-grid">
            <div className="eqme-field">
              <label className="eqme-label">Company Name <span className="eqme-req">*</span></label>
              <input
                name="companyName"
                placeholder="Enter company name"
                value={form.companyName}
                onChange={handleChange}
                className="eqme-input"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">Ticker Symbol <span className="eqme-req">*</span></label>
              <input
                name="tickerSymbol"
                placeholder="e.g., COMB.N0000"
                value={form.tickerSymbol}
                onChange={handleChange}
                className="eqme-input"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">ISIN</label>
              <input
                name="isin"
                placeholder="e.g., LK0027N00009"
                value={form.isin}
                onChange={handleChange}
                className="eqme-input"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">Sector</label>
              <select
                name="sector"
                value={form.sector}
                onChange={handleChange}
                className="eqme-select"
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

            <div className="eqme-field">
              <label className="eqme-label">Market</label>
              <input
                name="market"
                value={form.market}
                readOnly
                className="eqme-input eqme-input--locked"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">Country</label>
              <input
                name="country"
                value={form.country}
                readOnly
                className="eqme-input eqme-input--locked"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">Currency</label>
              <input
                name="currency"
                value={form.currency}
                readOnly
                className="eqme-input eqme-input--locked"
              />
            </div>

            <div className="eqme-field">
              <label className="eqme-label">Status</label>
              <div className="eqme-toggle-row">
                <label className="eqme-toggle">
                  <input
                    type="checkbox"
                    name="status"
                    checked={form.status}
                    onChange={handleChange}
                  />
                  <span className={`eqme-toggle__track${form.status ? ' is-on' : ''}`}>
                    <span className="eqme-toggle__thumb" />
                  </span>
                </label>
                <span className={`eqme-toggle__text${form.status ? ' is-on' : ''}`}>
                  {form.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="eqme-field eqme-field--full">
            <label className="eqme-label">Notes & Description</label>
            <textarea
              name="notes"
              placeholder="Add any additional notes or description about this equity…"
              value={form.notes}
              onChange={handleChange}
              rows="4"
              className="eqme-textarea"
            />
          </div>

          {submitMessage && (
            <div className={`eqme-alert ${submitMessage.includes('Error') ? 'eqme-alert--err' : 'eqme-alert--ok'}`}>
              {submitMessage}
            </div>
          )}

          <div className="eqme-actions">
            <button
              type="button"
              onClick={handleReset}
              className="eqme-btn eqme-btn--ghost"
              disabled={isSubmitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="eqme-btn eqme-btn--solid"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save Equity'}
            </button>
          </div>
        </form>
      </section>

      <section className="eqme-panel eqme-panel--list">
        <div className="eqme-panel__head">
          <div>
            <h2>Existing equities</h2>
            <p>Search, edit, or deactivate securities already on the master.</p>
          </div>
        </div>
        <div className="eqme-list-shell">
          <EquityListView embedded refreshKey={listRefreshKey} />
        </div>
      </section>
    </div>
  );
};

export default EquityMasterEntry;
