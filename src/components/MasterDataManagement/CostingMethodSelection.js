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
  const [showUpgradePopup, setShowUpgradePopup] = useState(false); // <-- new state for upgrade popup

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
        // Don't set message automatically - only show when user tries to submit
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
    const methodValue = e.target.value;
    
    // Check if user is trying to select a restricted method
    if (methodValue === 'FIFO' || methodValue === 'CHERRY') {
      setShowUpgradePopup(true);
      return; // Don't change the selected method
    }
    
    setSelectedMethod(methodValue);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPortfolioId || !selectedPortfolioName || !selectedMethod) {
      setMessage('Please select a portfolio id, portfolio name, and a costing method.');
      return;
    }
    
    // Check if portfolio already has a method assigned (frontend check)
    if (isAssigned) {
      const methodLabel = methods.find(m => m.value === assignedMethodForPortfolio)?.label || assignedMethodForPortfolio;
      setMessage(`This portfolio already has a costing method assigned: ${methodLabel}`);
      return;
    }
    
    try {
      await portfolioCostingMethodAPI.assignCostingMethod({
        portfolioId: selectedPortfolioId,
        costing_method: selectedMethod,
      });
      // Success - show simple success message
      setMessage('Costing method saved successfully!');
      // Refresh assigned methods
      const updated = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
      setAssignedMethods(updated);
    } catch (error) {
      // Check if error is because portfolio already has a method assigned
      if (error.message && error.message.includes('already has a costing method assigned')) {
        setMessage(error.message);
      } else {
        setMessage('Failed to assign costing method. Please try again.');
      }
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

  const handleCloseUpgradePopup = () => {
    setShowUpgradePopup(false);
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

        <div className="cost-method-main-layout">
          {/* Left: Configuration stripe + form */}
          <div className="cost-method-left-column">
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
              <button type="submit" className="cost-method-btn cost-method-btn-primary">
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
      </div>

      {/* Right: Assigned Methods View Section */}
      <div className="cost-method-right-column">
        <div className="cost-method-assigned-section">
          <div className="cost-method-assigned-header">
            <h3 className="cost-method-assigned-title">Assigned Portfolio Methods</h3>
            <p className="cost-method-assigned-subtitle">View all portfolios with their assigned costing methods</p>
          </div>
          
          <div className="cost-method-assigned-content">
            {assignedMethods.length === 0 ? (
              <div className="cost-method-empty-state">
                <div className="cost-method-empty-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p className="cost-method-empty-text">No portfolios have costing methods assigned yet</p>
              </div>
            ) : (
              <div className="cost-method-assigned-grid">
                {assignedMethods.map((assignment, index) => {
                  const portfolio = portfolios.find(p => p.portfolioId === assignment.portfolioId);
                  const method = methods.find(m => m.value === assignment.costing_method);
                  return (
                    <div key={index} className="cost-method-assigned-card">
                      <div className="cost-method-assigned-card-header">
                        <div className="cost-method-assigned-portfolio-info">
                          <h4 className="cost-method-assigned-portfolio-name">
                            {portfolio ? portfolio.portfolioName : 'Unknown Portfolio'}
                          </h4>
                          <p className="cost-method-assigned-portfolio-id">
                            ID: {assignment.portfolioId}
                          </p>
                        </div>
                        <div className="cost-method-assigned-method-badge">
                          {method ? method.label : assignment.costing_method}
                        </div>
                      </div>
                      <div className="cost-method-assigned-card-details">
                        <div className="cost-method-assigned-detail-item">
                          <span className="cost-method-assigned-detail-label">Method:</span>
                          <span className="cost-method-assigned-detail-value">
                            {method ? method.label : assignment.costing_method}
                          </span>
                        </div>
                        <div className="cost-method-assigned-detail-item">
                          <span className="cost-method-assigned-detail-label">Portfolio:</span>
                          <span className="cost-method-assigned-detail-value">
                            {portfolio ? portfolio.portfolioName : 'Unknown Portfolio'}
                          </span>
                        </div>
                        <div className="cost-method-assigned-detail-item">
                          <span className="cost-method-assigned-detail-label">Status:</span>
                          <span className="cost-method-assigned-status active">Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

        {/* --- FOOTER INFO --- */}
        <div className="cost-method-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Assign costing methods to your portfolios for precise P&amp;L calculation</p>
        </div>
      </div>

      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div className="upgrade-popup-overlay">
          <div className="upgrade-popup-content">
            <div className="upgrade-popup-header">
              <div className="upgrade-popup-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <h3 className="upgrade-popup-title">Premium Feature</h3>
            </div>
            <div className="upgrade-popup-body">
              <p className="upgrade-popup-message">
                <strong>FIFO (First-In First-Out)</strong> and <strong>Cherry Picking</strong> methods are available in our premium plan.
              </p>
              <p className="upgrade-popup-description">
                Upgrade your account to access advanced portfolio costing methods that provide more granular control over your position valuation and P&L calculations.
              </p>
              <div className="upgrade-popup-features">
                <div className="upgrade-popup-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                  <span>FIFO - Oldest lots relieved first</span>
                </div>
                <div className="upgrade-popup-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                  <span>Cherry Picking - User picks specific lots at deal level</span>
                </div>
                <div className="upgrade-popup-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                  <span>Advanced reporting and analytics</span>
                </div>
              </div>
            </div>
            <div className="upgrade-popup-footer">
              <button 
                className="upgrade-popup-btn upgrade-popup-btn-primary"
                onClick={() => {
                  // You can add upgrade logic here
                  window.open('mailto:support@sherwoodtech.com?subject=Upgrade Request - Premium Portfolio Costing Methods', '_blank');
                }}
              >
                Contact Sales
              </button>
              <button 
                className="upgrade-popup-btn upgrade-popup-btn-secondary"
                onClick={handleCloseUpgradePopup}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostingMethodSelection;