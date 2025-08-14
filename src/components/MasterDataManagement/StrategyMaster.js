import React, { useState, useEffect } from 'react';
import './Styles/StrategyMaster.css';
import { portfolioAPI, portfolioStrategyAPI } from '../../services/api';

const ViewPortfoliosModal = ({ open, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      portfolioStrategyAPI.getAllPortfolioStrategies()
        .then(setData)
        .catch(() => setError('Failed to fetch portfolio-strategy assignments.'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="vp-modal-overlay" onClick={onClose}>
      <div className="vp-modal-content" onClick={e => e.stopPropagation()}>
        <div className="vp-modal-header">
          <h2>Portfolio Strategy Details</h2>
          <button className="vp-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="vp-modal-body">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="vp-modal-error">{error}</div>
          ) : data.length === 0 ? (
            <div>No assignments found.</div>
          ) : (
            <div className="vp-table-wrapper">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>Portfolio Name</th>
                    <th>Portfolio ID</th>
                    <th>Strategy Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.portfolioName || row.portfolio_name || '-'}</td>
                      <td>{row.portfolioId || row.portfolio_id || '-'}</td>
                      <td>{row.strategy_type || row.strategyType || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StrategyMaster = () => {
  const [form, setForm] = useState({
    strategyId: '',
    portfolioId: '', // user-entered string, e.g., ASW001
    portfolioName: '',
    strategyType: '',
    entityBusinessUnit: ''
  });
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If portfolioId changes, update portfolioName accordingly
    if (name === 'portfolioId') {
      const selected = portfolios.find(p => p.portfolioId === value);
      setForm(prev => ({ ...prev, portfolioId: value, portfolioName: selected ? selected.portfolioName : '' }));
    } else if (name === 'portfolioName') {
      const selected = portfolios.find(p => p.portfolioName === value);
      setForm(prev => ({ ...prev, portfolioName: value, portfolioId: selected ? selected.portfolioId : '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setForm({
      strategyId: '',
      portfolioId: '',
      portfolioName: '',
      strategyType: '',
      entityBusinessUnit: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = ['strategyId', 'portfolioId', 'portfolioName', 'strategyType', 'entityBusinessUnit'];
    const missing = requiredFields.filter(f => !form[f].trim());

    if (missing.length > 0) {
      alert(`Please fill in all required fields:\n- ${missing.join('\n- ')}`);
      return;
    }

    try {
      // Use the user-entered portfolioId string for assignment
      const assignmentData = {
        portfolioId: form.portfolioId, // string, e.g., ASW001
        strategy_id: form.strategyId,
        strategy_type: form.strategyType,
        entity_business_unit: form.entityBusinessUnit,
      };
      // Call backend to assign strategy
      await portfolioStrategyAPI.assignStrategy(assignmentData);
      alert('Strategy assigned to portfolio successfully!');
      handleReset();
    } catch (error) {
      alert('Failed to assign strategy. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="strat-page-container">
      <div className="strat-content-wrapper">
        <div className="strat-header-section">
          <div className="strat-header-icon">
            <svg className="strat-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4z"/>
              <path d="M14 10h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v-8z"/>
            </svg>
          </div>
          <div className="strat-header-text-group">
            <h1 className="strat-main-title">Strategy Master Entry</h1>
            <p className="strat-subtitle">Create and define new strategies linked to portfolio entities</p>
          </div>
        </div>

        <div className="strat-form-card">
          <form onSubmit={handleSubmit} className="strat-form-content">

            <div className="strat-form-grid">
              <div className="strat-field-group">
                <label className="strat-field-label">Strategy ID *</label>
                <input
                  name="strategyId"
                  value={form.strategyId}
                  onChange={handleChange}
                  className="strat-form-input"
                  placeholder="Enter strategy ID"
                />
              </div>
              <div className="strat-field-group">
                <label className="strat-field-label">Portfolio ID *</label>
                <select
                  name="portfolioId"
                  value={form.portfolioId}
                  onChange={handleChange}
                  className="strat-form-select"
                  disabled={portfoliosLoading}
                >
                  <option value="">
                    {portfoliosLoading
                      ? 'Loading portfolio IDs...'
                      : portfolios.length === 0
                        ? 'No active portfolios found'
                        : 'Select Portfolio ID'}
                  </option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.portfolioId}>{p.portfolioId}</option>
                  ))}
                </select>
              </div>
              <div className="strat-field-group">
                <label className="strat-field-label">Portfolio Name *</label>
                <select
                  name="portfolioName"
                  value={form.portfolioName}
                  onChange={handleChange}
                  className="strat-form-select"
                  disabled={portfoliosLoading}
                >
                  <option value="">
                    {portfoliosLoading
                      ? 'Loading portfolios...'
                      : portfolios.length === 0
                        ? 'No active portfolios found'
                        : 'Select Portfolio'}
                  </option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.portfolioName}>{p.portfolioName}</option>
                  ))}
                </select>
              </div>

              <div className="strat-field-group">
                <label className="strat-field-label">Strategy Type *</label>
                <select
                  name="strategyType"
                  value={form.strategyType}
                  onChange={handleChange}
                  className="strat-form-select"
                >
                  <option value="">Select Type</option>
                  <option value="Trading">Trading</option>
                  <option value="Investment">Investment</option>
                  <option value="Liquidity">Liquidity</option>
                </select>
              </div>

              <div className="strat-field-group">
                <label className="strat-field-label">Entity/Business Unit *</label>
                <select
                  name="entityBusinessUnit"
                  value={form.entityBusinessUnit}
                  onChange={handleChange}
                  className="strat-form-select"
                >
                  <option value="">Select Entity</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="strat-button-section">
              <button type="reset" onClick={handleReset} className="strat-btn strat-btn-secondary">
                Reset Form
              </button>
              <button
                type="button"
                className="strat-btn strat-btn-secondary"
                style={{ minWidth: 150 }}
                onClick={() => setViewModalOpen(true)}
              >
                View Portfolios
              </button>
              <button type="submit" className="strat-btn strat-btn-primary">
                Save Strategy
              </button>
            </div>
          </form>
        </div>
        <ViewPortfoliosModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} />
        <div className="strat-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure strategy management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyMaster;
