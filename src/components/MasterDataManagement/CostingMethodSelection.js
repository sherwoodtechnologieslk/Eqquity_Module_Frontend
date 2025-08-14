import React, { useState, useEffect } from 'react';
import './Styles/CostingMethodSelection.css';
import { portfolioAPI, portfolioCostingMethodAPI } from '../../services/api';

const methods = [
  { value: 'FIFO', label: 'FIFO (First-In First-Out)' },
  { value: 'CHERRY', label: 'Cherry Picking' },
  { value: 'WAP', label: 'Weighted Average Price (WAP)' },
];

const CostingMethodSelection = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedPortfolioName, setSelectedPortfolioName] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [message, setMessage] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [assignedMethods, setAssignedMethods] = useState([]); // <-- new state
  const [isAssigned, setIsAssigned] = useState(false); // <-- new state
  const [assignedMethodForPortfolio, setAssignedMethodForPortfolio] = useState(''); // <-- new state

  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
    // Fetch assigned costing methods
    portfolioCostingMethodAPI.getAllAssignedCostingMethods()
      .then(data => setAssignedMethods(data))
      .catch(() => setAssignedMethods([]));
  }, []);

  useEffect(() => {
    // Check if selected portfolio already has a costing method assigned
    if (selectedPortfolioId && assignedMethods.length > 0) {
      const found = assignedMethods.find(a => a.portfolioId === selectedPortfolioId);
      if (found) {
        setIsAssigned(true);
        setAssignedMethodForPortfolio(found.costing_method);
        setSelectedMethod(found.costing_method);
        setMessage(`This portfolio already has a costing method assigned: ${methods.find(m => m.value === found.costing_method)?.label || found.costing_method}`);
      } else {
        setIsAssigned(false);
        setAssignedMethodForPortfolio('');
        setSelectedMethod('');
        setMessage('');
      }
    } else {
      setIsAssigned(false);
      setAssignedMethodForPortfolio('');
      setSelectedMethod('');
      setMessage('');
    }
  }, [selectedPortfolioId, assignedMethods]);

  const handlePortfolioIdChange = (e) => {
    const value = e.target.value;
    setSelectedPortfolioId(value);
    const selected = portfolios.find(p => p.portfolioId === value);
    setSelectedPortfolioName(selected ? selected.portfolioName : '');
    // setSelectedMethod('');
    // setMessage('');
  };
  const handlePortfolioNameChange = (e) => {
    const value = e.target.value;
    setSelectedPortfolioName(value);
    const selected = portfolios.find(p => p.portfolioName === value);
    setSelectedPortfolioId(selected ? selected.portfolioId : '');
    // setSelectedMethod('');
    // setMessage('');
  };

  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPortfolioId || !selectedPortfolioName || !selectedMethod) {
      setMessage('Please select a portfolio id, portfolio name, and a costing method.');
      return;
    }
    if (isAssigned) {
      setMessage('This portfolio already has a costing method assigned and cannot be changed.');
      return;
    }
    try {
      await portfolioCostingMethodAPI.assignCostingMethod({
        portfolioId: selectedPortfolioId,
        costing_method: selectedMethod,
      });
      setMessage(`Costing method "${methods.find(m => m.value === selectedMethod).label}" assigned to "${selectedPortfolioName} (${selectedPortfolioId})" successfully!`);
      // Refresh assigned methods
      const updated = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
      setAssignedMethods(updated);
    } catch (error) {
      setMessage('Failed to assign costing method. Please try again.');
      console.error(error);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setSelectedPortfolioId('');
    setSelectedPortfolioName('');
    setSelectedMethod('');
    setMessage('');
    setIsAssigned(false);
    setAssignedMethodForPortfolio('');
  };

  return (
    <div className="cost-method-page-container">
      <div className="cost-method-content-wrapper">
        {/* --- HEADER: DO NOT CHANGE --- */}
        <div className="cost-method-header-section">
          <div className="cost-method-header-icon">
            <svg className="cost-method-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 12a1 1 0 110-2 1 1 0 010 2zm-1-3V7a1 1 0 112 0v4a1 1 0 01-2 0z" />
            </svg>
          </div>
          <div className="cost-method-header-text-group">
            <h1 className="cost-method-main-title">Portfolio Costing Method</h1>
            <p className="cost-method-subtitle">Select the default carrying-value method used for position costing, unrealised P/L and limit checks.</p>
          </div>
        </div>

        {/* Blue stripe section */}
        <div className="cost-method-blue-stripe">
          <h2 className="cost-method-stripe-title">Portfolio Costing Method Configuration</h2>
        </div>

        <div className="cost-method-form-card">
          <form onSubmit={handleSubmit} className="cost-method-form-content">
            <div className="cost-method-form-grid">

              {/* Portfolio Id Selection */}
              <div className="cost-method-field-group">
                <label className="cost-method-field-label">Portfolio Id *</label>
                <select
                  className="cost-method-form-select"
                  value={selectedPortfolioId}
                  onChange={handlePortfolioIdChange}
                  disabled={portfoliosLoading}
                >
                  <option value="">
                    {portfoliosLoading
                      ? 'Loading portfolio ids...'
                      : portfolios.length === 0
                        ? 'No active portfolios found'
                        : 'Choose a portfolio id'}
                  </option>
                  {portfolios.map(p => (
                    <option key={p.portfolioId} value={p.portfolioId}>{p.portfolioId}</option>
                  ))}
                </select>
              </div>
              {/* Portfolio Name Selection */}
              <div className="cost-method-field-group">
                <label className="cost-method-field-label">Portfolio Name *</label>
                <select
                  className="cost-method-form-select"
                  value={selectedPortfolioName}
                  onChange={handlePortfolioNameChange}
                  disabled={portfoliosLoading}
                >
                  <option value="">
                    {portfoliosLoading
                      ? 'Loading portfolio names...'
                      : portfolios.length === 0
                        ? 'No active portfolios found'
                        : 'Choose a portfolio name'}
                  </option>
                  {portfolios.map(p => (
                    <option key={p.portfolioId} value={p.portfolioName}>{p.portfolioName}</option>
                  ))}
                </select>
              </div>

              {/* Costing Method Selection */}
              <div className="cost-method-field-group">
                <label className="cost-method-field-label">Costing Method *</label>
                <div className="cost-method-options">
                  {methods.map((m) => (
                    <label key={m.value} className={`cost-method-radio-label ${selectedMethod === m.value ? 'selected' : ''}`}
                      style={{ opacity: isAssigned && selectedMethod !== m.value ? 0.5 : 1 }}>
                      <input
                        type="radio"
                        name="costingMethod"
                        value={m.value}
                        checked={selectedMethod === m.value}
                        onChange={handleMethodChange}
                        className="cost-method-radio"
                        disabled={isAssigned}
                      />
                      <span>
                        {m.label}
                        <div className="cost-method-radio-desc">
                          {m.value === 'WAP' && 'Auto-recalculates after every acquisition.'}
                          {m.value === 'FIFO' && 'Oldest lots relieved first'}
                          {m.value === 'CHERRY' && 'User picks specific lots at deal level'}
                        </div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* --- WARNING INFO BOX --- */}
            <div className="cost-method-warning-box">
              <span className="cost-method-warning-icon">!</span>
              <span>
                Changing this setting affects how all future transactions are valued. <br />
                Historical postings remain as originally recorded.
              </span>
            </div>

            {message && (
              <div className={`cost-method-message ${message.includes('successfully!') ? 'cost-method-success' : 'cost-method-error'}`}>
                {message}
              </div>
            )}

            {/* --- BUTTONS --- */}
            <div className="cost-method-button-section">
              <button type="submit" className="cost-method-btn cost-method-btn-primary" disabled={isAssigned}>
                Save Method
              </button>
              <button
                type="button"
                className="cost-method-btn cost-method-btn-secondary"
                onClick={handleCancel}
                style={{ marginLeft: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* --- FOOTER INFO --- */}
        <div className="cost-method-footer-section">
          <p>ALCYONE TREASURY SOLUTIONS (PVT) LTD • Assign costing methods to your portfolios for precise P&amp;L calculation</p>
        </div>
      </div>
    </div>
  );
};

export default CostingMethodSelection;