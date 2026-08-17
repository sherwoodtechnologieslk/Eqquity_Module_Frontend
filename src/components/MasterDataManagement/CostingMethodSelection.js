import React, { useState, useEffect } from 'react';
import './Styles/EquityMasterEntry.css';
import './Styles/CostingMethodSelection.css';
import { portfolioAPI, portfolioCostingMethodAPI } from '../../services/api';

const methods = [
  {
    value: 'WAP',
    abbr: 'WAP',
    title: 'Weighted Average Price',
    desc: 'Recalculates after each acquisition',
    premium: false
  },
  {
    value: 'FIFO',
    abbr: 'FIFO',
    title: 'First-In First-Out',
    desc: 'Oldest lots relieved first',
    premium: true
  },
  {
    value: 'CHERRY',
    abbr: 'Cherry',
    title: 'Cherry Picking',
    desc: 'Select specific lots at deal level',
    premium: true
  }
];

const CostingMethodSelection = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedPortfolioName, setSelectedPortfolioName] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [message, setMessage] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [assignedMethods, setAssignedMethods] = useState([]);
  const [isAssigned, setIsAssigned] = useState(false);
  const [assignedMethodForPortfolio, setAssignedMethodForPortfolio] = useState('');
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then((data) => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));

    portfolioCostingMethodAPI.getAllAssignedCostingMethods()
      .then((data) => setAssignedMethods(data))
      .catch(() => setAssignedMethods([]));
  }, []);

  useEffect(() => {
    if (selectedPortfolioId && assignedMethods.length > 0) {
      const found = assignedMethods.find((a) => a.portfolioId === selectedPortfolioId);
      if (found) {
        setIsAssigned(true);
        setAssignedMethodForPortfolio(found.costing_method);
        setSelectedMethod(found.costing_method);
      } else {
        setIsAssigned(false);
        setAssignedMethodForPortfolio('');
        setSelectedMethod('');
        setMessage('');
      }
    } else {
      setIsAssigned(false);
      setAssignedMethodForPortfolio('');
      if (!selectedPortfolioId) {
        setSelectedMethod('');
      }
      setMessage('');
    }
  }, [selectedPortfolioId, assignedMethods]);

  const handlePortfolioChange = (e) => {
    const value = e.target.value;
    const selected = portfolios.find((p) => p.portfolioId === value);
    setSelectedPortfolioId(value);
    setSelectedPortfolioName(selected ? selected.portfolioName : '');
    setMessage('');
  };

  const handleMethodSelect = (methodValue) => {
    if (isAssigned) return;

    if (methodValue === 'FIFO' || methodValue === 'CHERRY') {
      setShowUpgradePopup(true);
      return;
    }

    setSelectedMethod(methodValue);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPortfolioId || !selectedPortfolioName || !selectedMethod) {
      setMessage('Please select a portfolio and a costing method.');
      return;
    }

    if (isAssigned) {
      const methodLabel =
        methods.find((m) => m.value === assignedMethodForPortfolio)?.title ||
        assignedMethodForPortfolio;
      setMessage(`This portfolio already has a costing method assigned: ${methodLabel}`);
      return;
    }

    try {
      await portfolioCostingMethodAPI.assignCostingMethod({
        portfolioId: selectedPortfolioId,
        costing_method: selectedMethod
      });
      setMessage('Costing method saved successfully!');
      const updated = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
      setAssignedMethods(updated);
    } catch (error) {
      if (error.message && error.message.includes('already has a costing method assigned')) {
        setMessage(error.message);
      } else {
        setMessage('Failed to assign costing method. Please try again.');
      }
      console.error(error);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    setSelectedPortfolioId('');
    setSelectedPortfolioName('');
    setSelectedMethod('');
    setMessage('');
    setIsAssigned(false);
    setAssignedMethodForPortfolio('');
  };

  const getMethodLabel = (value) => {
    const method = methods.find((m) => m.value === value);
    return method ? `${method.abbr} - ${method.title}` : value;
  };

  return (
    <div className="eqt-page-container pcm-page">
      <div className="eqt-content-wrapper">
        <header className="eqt-header-section">
          <div className="eqt-header-text-group">
            <p className="eqt-eyebrow">Masters · Valuation</p>
            <h1 className="eqt-main-title">Valuation Method</h1>
            <p className="eqt-subtitle">
              Assign the default costing method for positions, unrealised P/L, and limits
            </p>
          </div>
        </header>

        <div className="eqt-form-card">
          <div className="eqt-card-header">
            <h2 className="eqt-card-title">Assign Costing Method</h2>
          </div>
          <div className="eqt-form-content">
            <form onSubmit={handleSubmit}>
              <div className="eqt-form-grid">
                <div className="eqt-field-group">
                  <label className="eqt-field-label">Portfolio *</label>
                  <select
                    className="eqt-form-select"
                    value={selectedPortfolioId}
                    onChange={handlePortfolioChange}
                    disabled={portfoliosLoading}
                  >
                    <option value="">
                      {portfoliosLoading
                        ? 'Loading portfolios...'
                        : portfolios.length === 0
                          ? 'No active portfolios found'
                          : 'Select a portfolio'}
                    </option>
                    {portfolios.map((p) => (
                      <option key={p.portfolioId} value={p.portfolioId}>
                        {p.portfolioId} - {p.portfolioName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPortfolioId && (
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Portfolio name</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedPortfolioName}
                      className="eqt-form-input eqt-readonly-field"
                    />
                  </div>
                )}

                {isAssigned && (
                  <div className="eqt-field-group">
                    <label className="eqt-field-label">Assigned method</label>
                    <input
                      type="text"
                      readOnly
                      value={getMethodLabel(assignedMethodForPortfolio)}
                      className="eqt-form-input eqt-readonly-field"
                    />
                  </div>
                )}
              </div>

              <div className="pcm-method-section">
                <div className="pcm-method-label">Costing method *</div>
                <div className="pcm-method-grid">
                  {methods.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      className={`pcm-method-card${
                        selectedMethod === m.value ? ' pcm-method-card--selected' : ''
                      }${m.premium ? ' pcm-method-card--premium' : ''}`}
                      onClick={() => handleMethodSelect(m.value)}
                      disabled={isAssigned}
                    >
                      <span className="pcm-method-radio" aria-hidden="true" />
                      <span className="pcm-method-body">
                        <span className="pcm-method-top">
                          <span className="pcm-method-abbr">{m.abbr}</span>
                          {m.premium && <span className="pcm-method-lock">Premium</span>}
                        </span>
                        <span className="pcm-method-title">{m.title}</span>
                        <span className="pcm-method-desc">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pcm-info-strip">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Changing this setting affects how future transactions are valued. Historical postings
                  remain as originally recorded.
                </span>
              </div>

              {message && (
                <div
                  className={`eqt-message ${
                    message.includes('successfully!') ? 'eqt-success' : 'eqt-error'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="eqt-button-section">
                <button type="button" className="eqt-btn eqt-btn-secondary" onClick={handleReset}>
                  Reset
                </button>
                <button
                  type="submit"
                  className="eqt-btn eqt-btn-primary"
                  disabled={isAssigned || !selectedPortfolioId || !selectedMethod}
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="eqt-form-card eqt-list-card">
          <div className="eqt-card-header">
            <h2 className="eqt-card-title">Assigned Portfolio Methods</h2>
          </div>
          <div className="pcm-assigned-body">
            {assignedMethods.length === 0 ? (
              <div className="pcm-empty">
                <p className="pcm-empty-title">No assignments yet</p>
                <p className="pcm-empty-text">
                  Select a portfolio above and save a costing method to see it listed here.
                </p>
              </div>
            ) : (
              <div className="eqt-data-table-wrapper">
                <table className="eqt-data-table">
                  <thead>
                    <tr>
                      <th>Portfolio ID</th>
                      <th>Portfolio name</th>
                      <th>Costing method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedMethods.map((assignment, index) => {
                      const portfolio = portfolios.find(
                        (p) => p.portfolioId === assignment.portfolioId
                      );
                      return (
                        <tr key={index}>
                          <td>{assignment.portfolioId}</td>
                          <td>{portfolio ? portfolio.portfolioName : '-'}</td>
                          <td>{getMethodLabel(assignment.costing_method)}</td>
                          <td>
                            <span className="pcm-status-active">Active</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="eqt-footer-section">
          <p>
            SHERWOOD TECHNOLOGIES (PVT) LTD • Assign costing methods to your portfolios for precise
            P&amp;L calculation
          </p>
        </div>
      </div>

      {showUpgradePopup && (
        <div className="eqt-upgrade-overlay">
          <div className="eqt-upgrade-content">
            <div className="eqt-upgrade-header">
              <div className="eqt-upgrade-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="eqt-upgrade-title">Premium Feature</h3>
            </div>
            <div className="eqt-upgrade-body">
              <p className="eqt-upgrade-message">
                <strong>FIFO</strong> and <strong>Cherry Picking</strong> are available on the premium plan.
              </p>
              <p className="eqt-upgrade-description">
                Upgrade for advanced costing methods with more granular control over position valuation
                and P&amp;L.
              </p>
              <div className="eqt-upgrade-features">
                <div className="eqt-upgrade-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>FIFO - oldest lots relieved first</span>
                </div>
                <div className="eqt-upgrade-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>Cherry picking - lot-level selection</span>
                </div>
              </div>
            </div>
            <div className="eqt-upgrade-footer">
              <button className="eqt-btn eqt-btn-secondary" onClick={() => setShowUpgradePopup(false)}>
                Maybe Later
              </button>
              <button
                className="eqt-btn eqt-btn-primary"
                onClick={() => {
                  window.open(
                    'mailto:support@sherwoodtech.com?subject=Upgrade Request - Premium Portfolio Costing Methods',
                    '_blank'
                  );
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostingMethodSelection;
