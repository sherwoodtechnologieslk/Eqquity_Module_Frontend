import React, { useState } from 'react';
import './Styles/PortfolioMaster.css';
import { portfolioAPI } from '../../services/api';
import PortfolioListView from './PortfolioListView';

const PortfolioMaster = () => {
  const [form, setForm] = useState({
    portfolioId: '',
    portfolioName: '',
    portfolioType: '',
    entity: '',
    fundManager: '',
    baseCurrency: '',
    benchmark: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    riskProfile: '',
    investmentHorizon: '',
    targetYield: '',
    complianceRulesId: '',
    notes: '',
    parentPortfolioId: '',
    valuationMethod: '',
    accountingTreatment: '',
    rebalancingFrequency: '',
    externalRefCode: '',
    tags: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleReset = () => {
    setForm({
      portfolioId: '',
      portfolioName: '',
      portfolioType: '',
      entity: '',
      fundManager: '',
      baseCurrency: '',
      benchmark: '',
      startDate: '',
      endDate: '',
      status: 'Active',
      riskProfile: '',
      investmentHorizon: '',
      targetYield: '',
      complianceRulesId: '',
      notes: '',
      parentPortfolioId: '',
      valuationMethod: '',
      accountingTreatment: '',
      rebalancingFrequency: '',
      externalRefCode: '',
      tags: ''
    });
  };

  const isRequired = (fieldName) => {
    const requiredFields = [
      'portfolioId',
      'portfolioName',
      'portfolioType',
      'entity',
      'fundManager',
      'baseCurrency'
    ];
    return requiredFields.includes(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'portfolioId',
      'portfolioName',
      'portfolioType',
      'entity',
      'fundManager',
      'baseCurrency'
    ];

    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      // Clean up form data - convert empty strings to null for optional fields
      const cleanedForm = { ...form };
      Object.keys(cleanedForm).forEach(key => {
        if (cleanedForm[key] === '' && !isRequired(key)) {
          cleanedForm[key] = null;
        }
      });
      
      console.log('Submitting portfolio form:', cleanedForm);
      const result = await portfolioAPI.createPortfolio(cleanedForm);
      setSubmitMessage('Portfolio saved successfully!');
      console.log('Portfolio created:', result);
      handleReset();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSubmitMessage(`Error saving portfolio: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleView = () => {
    setShowListView(!showListView);
  };

  const getFieldType = (fieldName) => {
    if (fieldName.includes('Date')) return 'date';
    if (fieldName === 'targetYield') return 'number';
    if (fieldName === 'notes') return 'textarea';
    return 'input';
  };

  const getSelectOptions = (fieldName) => {
    const options = {
      portfolioType: [
        'Equity Portfolio',
        'Fixed Income Portfolio',
        'Mixed Portfolio',
        'Alternative Investment Portfolio',
        'Money Market Portfolio'
      ],
      status: ['Active', 'Inactive', 'Suspended', 'Closed'],
      riskProfile: ['Conservative', 'Moderate', 'Aggressive', 'Balanced'],
      investmentHorizon: ['Short Term (< 1 year)', 'Medium Term (1-5 years)', 'Long Term (> 5 years)'],
      baseCurrency: ['USD', 'EUR', 'GBP', 'LKR', 'SGD', 'JPY'],
      valuationMethod: ['Mark to Market', 'Mark to Model', 'Historical Cost', 'Fair Value'],
      accountingTreatment: ['FVTPL', 'FVOCI', 'Amortized Cost', 'HTM'],
      rebalancingFrequency: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual']
    };
    return options[fieldName] || [];
  };


  const renderField = (fieldName, value) => {
    const fieldType = getFieldType(fieldName);
    const selectOptions = getSelectOptions(fieldName);
    const isSelect = selectOptions.length > 0;
    const required = isRequired(fieldName);

    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    if (fieldType === 'textarea') {
      return (
        <div key={fieldName} className="prt-field-group">
          <label className="prt-field-label">
            {label} {required && '*'}
          </label>
          <textarea
            name={fieldName}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            rows="4"
            className="prt-form-textarea"
          />
        </div>
      );
    }

    if (isSelect) {
      return (
        <div key={fieldName} className="prt-field-group">
          <label className="prt-field-label">
            {label} {required && '*'}
          </label>
          <select
            name={fieldName}
            value={value}
            onChange={handleChange}
            className="prt-form-select"
          >
            <option value="">Select {label}</option>
            {selectOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={fieldName} className="prt-field-group">
        <label className="prt-field-label">
          {label} {required && '*'}
        </label>
        <input
          type={fieldType}
          name={fieldName}
          value={value}
          onChange={handleChange}
          placeholder={fieldType === 'date' ? '' : `Enter ${label.toLowerCase()}`}
          className="prt-form-input"
          step={fieldName === 'targetYield' ? '0.01' : undefined}
        />
      </div>
    );
  };

  if (showListView) {
    return (
      <div>
        <div className="prt-view-toggle">
          <button onClick={toggleView} className="prt-back-btn">
            Back to Entry Form
          </button>
          <button onClick={() => window.location.reload()} className="prt-refresh-btn">
            <svg className="prt-refresh-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Refresh
          </button>
        </div>
        <PortfolioListView />
      </div>
    );
  }

  return (
    <div className="prt-page-container">
      <div className="prt-content-wrapper">
        <div className="prt-header-section">
          <div className="prt-header-icon">
            <svg className="prt-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <div className="prt-header-text-group">
            <h1 className="prt-main-title">Portfolio Master Entry</h1>
            <p className="prt-subtitle">Create and configure new investment portfolios for your treasury management system</p>
          </div>
        </div>

        <div className="prt-form-card">
          <div className="prt-card-header">
            <h2 className="prt-card-title">Portfolio Configuration</h2>
          </div>

          <div className="prt-form-content">
            <form onSubmit={handleSubmit}>
              <div className="prt-section-header">
                <div className="prt-section-icon">
                  <svg className="prt-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="prt-section-title">Basic Information</h3>
              </div>

              <div className="prt-form-grid">
                {renderField('portfolioId', form.portfolioId)}
                {renderField('portfolioName', form.portfolioName)}
                {renderField('portfolioType', form.portfolioType)}
                {renderField('entity', form.entity)}
                {renderField('fundManager', form.fundManager)}
                {renderField('baseCurrency', form.baseCurrency)}
              </div>

              <div className="prt-section-header">
                <div className="prt-section-icon">
                  <svg className="prt-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45-1.5a2.5 2.5 0 114.9 0 2.5 2.5 0 01-4.9 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="prt-section-title">Investment Parameters</h3>
              </div>

              <div className="prt-form-grid">
                {renderField('benchmark', form.benchmark)}
                {renderField('riskProfile', form.riskProfile)}
                {renderField('investmentHorizon', form.investmentHorizon)}
                {renderField('targetYield', form.targetYield)}
                {renderField('startDate', form.startDate)}
                {renderField('endDate', form.endDate)}
              </div>

              <div className="prt-section-header">
                <div className="prt-section-icon">
                  <svg className="prt-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="prt-section-title">Operations & Compliance</h3>
              </div>

              <div className="prt-form-grid">
                {renderField('status', form.status)}
                {renderField('complianceRulesId', form.complianceRulesId)}
                {renderField('parentPortfolioId', form.parentPortfolioId)}
                {renderField('valuationMethod', form.valuationMethod)}
                {renderField('accountingTreatment', form.accountingTreatment)}
                {renderField('rebalancingFrequency', form.rebalancingFrequency)}
                {renderField('externalRefCode', form.externalRefCode)}
                {renderField('tags', form.tags)}
              </div>

              <div className="prt-notes-section">
                {renderField('notes', form.notes)}
              </div>

              <div className="prt-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="prt-btn prt-btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="prt-btn prt-btn-tertiary"
                  onClick={toggleView}
                  disabled={isSubmitting}
                >
                  View Existing Portfolios
                </button>
                <button
                  type="submit"
                  className="prt-btn prt-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Portfolio'}
                </button>
              </div>
            </form>
            {submitMessage && (
              <div className="prt-submit-message">{submitMessage}</div>
            )}
          </div>
        </div>

        <div className="prt-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure portfolio management system • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioMaster;