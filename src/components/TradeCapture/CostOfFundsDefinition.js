import React, { useState } from 'react';
import './Styles/CostOfFundsDefinition.css';
import { costOfFundsAPI } from '../../services/api';

const getToday = () => new Date().toISOString().slice(0, 10);

const CostOfFundsDefinition = () => {
  const [costOfFunds, setCostOfFunds] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(getToday());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [savedDefinitions, setSavedDefinitions] = useState([]);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Calculate the after-tax cost of funds (if both are numbers)
  const getAfterTaxCostOfFunds = () => {
    const cof = parseFloat(costOfFunds);
    const tax = parseFloat(taxRate);
    if (isNaN(cof) || isNaN(tax)) return '';
    return (cof * (100 - tax) / 100).toFixed(2);
  };

  // Show tax savings as a percentage
  const getTaxSavingsPercent = () => {
    const tax = parseFloat(taxRate);
    if (isNaN(tax)) return '';
    return tax.toFixed(2) + '%';
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    }
    
    if (!costOfFunds || parseFloat(costOfFunds) <= 0) {
      newErrors.costOfFunds = 'Cost of funds must be greater than 0';
    }
    
    if (!taxRate || parseFloat(taxRate) < 0 || parseFloat(taxRate) > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const saveData = {
        effectiveDate,
        costOfFunds: parseFloat(costOfFunds),
        taxRate: parseFloat(taxRate),
        afterTaxCostOfFunds: parseFloat(getAfterTaxCostOfFunds())
      };
      
      // Call the real API
      const result = await costOfFundsAPI.createCostOfFunds(saveData);
      console.log('Cost of funds definition saved successfully:', result);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving cost of funds definition:', error);
      const msg = error.message || '';
      const isUnauthorized = msg.includes('Unauthorized') || msg.includes('401');
      setErrors({
        general: isUnauthorized
          ? 'The server returned 401 Unauthorized. The app sends your login token with the request — if you are logged in and still see this, the backend is rejecting the cost-of-funds API for your user or role. Fix: ensure the backend allows your role to access /api/cost-of-funds (and /api/cost-of-funds/active), or try logging out and back in to refresh your token.'
          : (msg || 'Failed to save. Please try again.')
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle view saved definitions
  const handleViewDefinitions = async () => {
    setShowModal(true);
    setIsLoadingDefinitions(true);
    
    try {
      const definitions = await costOfFundsAPI.getAllCostOfFunds();
      setSavedDefinitions(definitions);
    } catch (error) {
      console.error('Error fetching saved definitions:', error);
      const msg = error.message || '';
      const isUnauthorized = msg.includes('Unauthorized') || msg.includes('401');
      setErrors({
        general: isUnauthorized
          ? 'You don’t have permission to view cost of funds. The server returned Unauthorized (401). Ask your administrator to grant access to the cost-of-funds API.'
          : 'Failed to load saved definitions. Please try again.'
      });
    } finally {
      setIsLoadingDefinitions(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSavedDefinitions([]);
    setErrors({});
    setDeletingId(null);
  };

  // Handle reset form
  const handleResetForm = () => {
    setCostOfFunds('');
    setTaxRate('');
    setEffectiveDate(getToday());
    setErrors({});
    setShowSuccess(false);
  };

  // Handle delete definition
  const handleDeleteDefinition = async (id, effectiveDate) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the cost of funds definition for ${new Date(effectiveDate).toLocaleDateString()}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeletingId(id);
    
    try {
      await costOfFundsAPI.deleteCostOfFunds(id);
      
      // Remove the deleted item from the local state
      setSavedDefinitions(prevDefinitions => 
        prevDefinitions.filter(def => def.id !== id)
      );
      
      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error('Error deleting cost of funds definition:', error);
      setErrors({ general: error.message || 'Failed to delete. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cofdef-page-container">
      <div className="cofdef-content-wrapper">
        <div className="cofdef-header-section">
          <div className="cofdef-header-icon">
            <svg className="cofdef-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 012 0v.092a4.535 4.535 0 011.676.662C13.398 6.14 14 6.89 14 8c0 1.11-.602 1.86-1.324 2.246a4.535 4.535 0 01-1.676.662V12a1 1 0 11-2 0v-.092a4.535 4.535 0 01-1.676-.662C6.602 10.86 6 10.11 6 9c0-1.11.602-1.86 1.324-2.246A4.535 4.535 0 019 6.092V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="cofdef-header-text-group">
            <h1 className="cofdef-main-title">Cost of Funds Definition</h1>
            <p className="cofdef-subtitle">Configure cost of funds and tax rates for precise financial calculations</p>
          </div>
        </div>

        <div className="cofdef-form-card">
          <div className="cofdef-card-header">
            <h2 className="cofdef-card-title">Financial Parameters</h2>
          </div>

          <div className="cofdef-form-content">
            <form className="cofdef-form" onSubmit={handleSave}>
              <div className="cofdef-form-grid">
                <div className="cofdef-field-group">
                  <label className="cofdef-field-label" htmlFor="cofdef-effective-date">Effective Date *</label>
                  <input
                    id="cofdef-effective-date"
                    className={`cofdef-form-input ${errors.effectiveDate ? 'error' : ''}`}
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                  />
                  {errors.effectiveDate && <span className="cofdef-error-text">{errors.effectiveDate}</span>}
                  <span className="cofdef-help-text">Date when these rates become effective</span>
                </div>
                <div className="cofdef-field-group">
                  <label className="cofdef-field-label" htmlFor="cofdef-cost-of-funds">Cost of Funds (%) *</label>
                  <input
                    id="cofdef-cost-of-funds"
                    className={`cofdef-form-input ${errors.costOfFunds ? 'error' : ''}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={costOfFunds}
                    onChange={e => setCostOfFunds(e.target.value)}
                    placeholder="Enter cost of funds %"
                  />
                  {errors.costOfFunds && <span className="cofdef-error-text">{errors.costOfFunds}</span>}
                  <span className="cofdef-help-text">Base interest rate for funding operations</span>
                </div>
                <div className="cofdef-field-group">
                  <label className="cofdef-field-label" htmlFor="cofdef-tax-rate">Tax Rate (%) *</label>
                  <input
                    id="cofdef-tax-rate"
                    className={`cofdef-form-input ${errors.taxRate ? 'error' : ''}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    placeholder="Enter tax rate %"
                  />
                  {errors.taxRate && <span className="cofdef-error-text">{errors.taxRate}</span>}
                  <span className="cofdef-help-text">Applicable tax rate for calculations</span>
                </div>
              </div>
              
              <div className="cofdef-result-section">
                <div className="cofdef-result-card">
                  <label className="cofdef-result-label">After-Tax Cost of Funds</label>
                  <div className="cofdef-result-value">
                    {getAfterTaxCostOfFunds() ? (
                      <>
                        <span className="cofdef-result-main">{getAfterTaxCostOfFunds()}%</span>
                        <span className="cofdef-result-percent">(Tax Savings: {getTaxSavingsPercent()})</span>
                      </>
                    ) : (
                      <span className="cofdef-result-placeholder">Enter values to calculate</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {errors.general && (
                <div className="cofdef-error-banner">
                  {errors.general}
                </div>
              )}

              {/* Success Message */}
              {showSuccess && (
                <div className="cofdef-success-banner">
                  Cost of funds definition saved successfully!
                </div>
              )}

              {/* Action Buttons */}
              <div className="cofdef-button-section">
                <div className="cofdef-button-group">
                  <button
                    type="button"
                    className="cofdef-view-button"
                    onClick={handleViewDefinitions}
                  >
                    <svg className="cofdef-view-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    View Saved Definitions
                  </button>

                  <button
                    type="button"
                    className="cofdef-reset-button"
                    onClick={handleResetForm}
                  >
                    <svg className="cofdef-reset-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                    </svg>
                    Reset Form
                  </button>
                  
                  <button
                    type="submit"
                    className={`cofdef-save-button ${isSaving ? 'saving' : ''}`}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="cofdef-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="cofdef-save-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Save Definition
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="cofdef-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure financial parameter configuration • All data is encrypted and protected</p>
        </div>
      </div>

      {/* Modal for viewing saved definitions */}
      {showModal && (
        <div className="cofdef-modal-overlay" onClick={closeModal}>
          <div className="cofdef-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cofdef-modal-header">
              <h2 className="cofdef-modal-title">Saved Cost of Funds Definitions</h2>
              <button className="cofdef-modal-close" onClick={closeModal}>
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <div className="cofdef-modal-body">
              {isLoadingDefinitions ? (
                <div className="cofdef-modal-loading">
                  <div className="cofdef-spinner"></div>
                  <p>Loading saved definitions...</p>
                </div>
              ) : savedDefinitions.length === 0 ? (
                <div className="cofdef-modal-empty">
                  <svg className="cofdef-empty-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <h3>No Saved Definitions</h3>
                  <p>You haven't saved any cost of funds definitions yet.</p>
                </div>
              ) : (
                <div className="cofdef-modal-table">
                  <table className="cofdef-table">
                    <thead>
                      <tr>
                        <th>Effective Date</th>
                        <th>Cost of Funds (%)</th>
                        <th>Tax Rate (%)</th>
                        <th>After-Tax Cost (%)</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedDefinitions.map((definition, index) => (
                        <tr key={`cof-def-${definition.id}-${definition.effective_date}-${index}`}>
                          <td>{new Date(definition.effective_date).toLocaleDateString()}</td>
                          <td>{parseFloat(definition.cost_of_funds).toFixed(2)}%</td>
                          <td>{parseFloat(definition.tax_rate).toFixed(2)}%</td>
                          <td className="cofdef-highlight">{parseFloat(definition.after_tax_cost_of_funds).toFixed(2)}%</td>
                          <td>{new Date(definition.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className={`cofdef-delete-btn ${deletingId === definition.id ? 'deleting' : ''}`}
                              onClick={() => handleDeleteDefinition(definition.id, definition.effective_date)}
                              disabled={deletingId === definition.id}
                              title="Delete this definition"
                            >
                              {deletingId === definition.id ? (
                                <div className="cofdef-delete-spinner"></div>
                              ) : (
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="cofdef-modal-footer">
              <button className="cofdef-modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostOfFundsDefinition;