import React, { useState, useEffect } from 'react';
import './Styles/EquityMasterEntry.css';
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
    <div className="eqt-modal-overlay" onClick={onClose}>
      <div className="eqt-modal-content" onClick={e => e.stopPropagation()}>
        <div className="eqt-modal-header">
          <h2>Portfolio Strategy Details</h2>
          <button className="eqt-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="eqt-modal-body">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="eqt-modal-error">{error}</div>
          ) : data.length === 0 ? (
            <div>No assignments found.</div>
          ) : (
            <div className="eqt-data-table-wrapper">
              <table className="eqt-data-table">
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
    <div className="eqt-page-container">
      <div className="eqt-content-wrapper">
        <header className="eqt-header-section">
          <div className="eqt-header-text-group">
            <p className="eqt-eyebrow">Masters · Strategy</p>
            <h1 className="eqt-main-title">Strategy Master</h1>
            <p className="eqt-subtitle">Assign strategies to portfolio entities</p>
          </div>
        </header>

        <div className="eqt-form-card">
          <div className="eqt-card-header">
            <h2 className="eqt-card-title">Strategy Configuration</h2>
          </div>
          <div className="eqt-form-content">
          <form onSubmit={handleSubmit}>

            <div className="eqt-form-grid">
              <div className="eqt-field-group">
                <label className="eqt-field-label">Strategy ID *</label>
                <input
                  name="strategyId"
                  value={form.strategyId}
                  onChange={handleChange}
                  className="eqt-form-input"
                  placeholder="Enter strategy ID"
                />
              </div>
              <div className="eqt-field-group">
                <label className="eqt-field-label">Portfolio ID *</label>
                <select
                  name="portfolioId"
                  value={form.portfolioId}
                  onChange={handleChange}
                  className="eqt-form-select"
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
              <div className="eqt-field-group">
                <label className="eqt-field-label">Portfolio Name *</label>
                <select
                  name="portfolioName"
                  value={form.portfolioName}
                  onChange={handleChange}
                  className="eqt-form-select"
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

              <div className="eqt-field-group">
                <label className="eqt-field-label">Strategy Type *</label>
                <select
                  name="strategyType"
                  value={form.strategyType}
                  onChange={handleChange}
                  className="eqt-form-select"
                >
                  <option value="">Select Type</option>
                  <option value="Trading">Trading</option>
                  <option value="Investment">Investment</option>
                  <option value="Liquidity">Liquidity</option>
                </select>
              </div>

              <div className="eqt-field-group">
                <label className="eqt-field-label">Entity/Business Unit *</label>
                <select
                  name="entityBusinessUnit"
                  value={form.entityBusinessUnit}
                  onChange={handleChange}
                  className="eqt-form-select"
                >
                  <option value="">Select Entity</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="eqt-button-section">
              <button type="reset" onClick={handleReset} className="eqt-btn eqt-btn-secondary">
                Reset Form
              </button>
              <button
                type="button"
                className="eqt-btn eqt-btn-tertiary"
                onClick={() => setViewModalOpen(true)}
              >
                View Portfolios
              </button>
              <button type="submit" className="eqt-btn eqt-btn-primary">
                Save Strategy
              </button>
            </div>
          </form>
          </div>
        </div>
        <ViewPortfoliosModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} />
        <div className="eqt-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure strategy management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyMaster;
