import React, { useState } from 'react';
import './Styles/WealthPortfolioMaster.css';

const WealthPortfolioMaster = () => {
  const [form, setForm] = useState({
    portfolioCode: '',
    portfolioName: '',
    clientId: '',
    clientName: '',
    portfolioType: '',
    accountNumber: '',
    status: 'Active',
    riskProfile: '',
    investmentHorizon: '',
    baseCurrency: 'LKR',
    openingDate: '',
    closingDate: '',
    investmentObjective: '',
    investmentStrategy: '',
    targetAllocation: '',
    rebalancingFrequency: '',
    feeStructure: '',
    managementFee: '',
    performanceFee: '',
    custodian: '',
    advisor: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [portfoliosList, setPortfoliosList] = useState([
    { id: 1, portfolioCode: 'WM001', portfolioName: 'Client Portfolio - John Doe', clientName: 'John Doe', type: 'Individual', status: 'Active', riskProfile: 'Moderate', aum: 2500000 },
    { id: 2, portfolioCode: 'WM002', portfolioName: 'Corporate Portfolio - ABC Corp', clientName: 'ABC Corporation', type: 'Corporate', status: 'Active', riskProfile: 'Conservative', aum: 15000000 },
    { id: 3, portfolioCode: 'WM003', portfolioName: 'Trust Portfolio - Family Trust', clientName: 'Family Trust', type: 'Trust', status: 'Active', riskProfile: 'Balanced', aum: 8500000 },
    { id: 4, portfolioCode: 'WM004', portfolioName: 'Retirement Portfolio - Jane Smith', clientName: 'Jane Smith', type: 'Individual', status: 'Active', riskProfile: 'Moderate', aum: 3200000 }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleReset = () => {
    setForm({
      portfolioCode: '',
      portfolioName: '',
      clientId: '',
      clientName: '',
      portfolioType: '',
      accountNumber: '',
      status: 'Active',
      riskProfile: '',
      investmentHorizon: '',
      baseCurrency: 'LKR',
      openingDate: '',
      closingDate: '',
      investmentObjective: '',
      investmentStrategy: '',
      targetAllocation: '',
      rebalancingFrequency: '',
      feeStructure: '',
      managementFee: '',
      performanceFee: '',
      custodian: '',
      advisor: '',
      notes: ''
    });
  };

  const isRequired = (fieldName) => {
    const requiredFields = [
      'portfolioCode',
      'portfolioName',
      'clientId',
      'clientName',
      'portfolioType',
      'baseCurrency',
      'status'
    ];
    return requiredFields.includes(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const requiredFields = ['portfolioCode', 'portfolioName', 'clientId', 'clientName', 'portfolioType', 'baseCurrency'];
    const missingFields = requiredFields.filter(field => !form[field]);

    if (missingFields.length > 0) {
      setSubmitMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPortfolio = {
        id: portfoliosList.length + 1,
        portfolioCode: form.portfolioCode,
        portfolioName: form.portfolioName,
        clientName: form.clientName,
        type: form.portfolioType,
        status: form.status,
        riskProfile: form.riskProfile,
        aum: 0
      };

      setPortfoliosList([...portfoliosList, newPortfolio]);
      setSubmitMessage('Portfolio created successfully!');
      setTimeout(() => {
        handleReset();
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      setSubmitMessage('Error creating portfolio. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldType = (fieldName) => {
    const dateFields = ['openingDate', 'closingDate'];
    const numberFields = ['managementFee', 'performanceFee'];
    const textareaFields = ['investmentObjective', 'investmentStrategy', 'notes'];

    if (dateFields.includes(fieldName)) return 'date';
    if (numberFields.includes(fieldName)) return 'number';
    if (textareaFields.includes(fieldName)) return 'textarea';
    return 'text';
  };

  const getSelectOptions = (fieldName) => {
    const options = {
      portfolioType: ['Individual', 'Corporate', 'Trust', 'Institutional', 'Retirement', 'Education'],
      status: ['Active', 'Inactive', 'Closed', 'Suspended'],
      riskProfile: ['Very Conservative', 'Conservative', 'Moderate', 'Balanced', 'Aggressive', 'Very Aggressive'],
      baseCurrency: ['LKR'],
      investmentHorizon: ['Short Term (0-2 years)', 'Medium Term (2-5 years)', 'Long Term (5-10 years)', 'Very Long Term (10+ years)'],
      rebalancingFrequency: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'],
      feeStructure: ['Fixed Fee', 'Percentage of AUM', 'Performance Based', 'Hybrid']
    };
    return options[fieldName] || [];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const renderField = (fieldName, value) => {
    const fieldType = getFieldType(fieldName);
    const selectOptions = getSelectOptions(fieldName);
    const isSelect = selectOptions.length > 0;
    const required = isRequired(fieldName);
    const locked = fieldName === 'baseCurrency';

    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    if (fieldType === 'textarea') {
      return (
        <div key={fieldName} className="wmport-field">
          <label className="wmport-label">
            {label} {required && <span className="wmport-required">*</span>}
          </label>
          <textarea
            name={fieldName}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            rows="4"
            className="wmport-textarea"
          />
        </div>
      );
    }

    if (isSelect) {
      return (
        <div key={fieldName} className="wmport-field">
          <label className="wmport-label">
            {label} {required && <span className="wmport-required">*</span>}
          </label>
          <select
            name={fieldName}
            value={value}
            onChange={handleChange}
            disabled={locked}
            className={`wmport-select${locked ? ' wmport-select--locked' : ''}`}
          >
            {!locked && <option value="">Select {label}</option>}
            {selectOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={fieldName} className="wmport-field">
        <label className="wmport-label">
          {label} {required && <span className="wmport-required">*</span>}
        </label>
        <input
          type={fieldType}
          name={fieldName}
          value={value}
          onChange={handleChange}
          placeholder={fieldType === 'date' ? '' : `Enter ${label.toLowerCase()}`}
          className="wmport-input"
          step={fieldName.includes('Fee') ? '0.01' : undefined}
        />
      </div>
    );
  };

  if (showListView) {
    return (
      <div className="wmport-root">
        <header className="wmport-header">
          <div className="wmport-header-copy">
            <span className="wmport-eyebrow">Portfolio administration</span>
            <h2 className="wmport-title">Portfolio Master List</h2>
            <p>Browse managed portfolios, risk profiles, and account status.</p>
          </div>
          <button
            type="button"
            className="wmport-btn wmport-btn--soft"
            onClick={() => setShowListView(false)}
          >
            Add New Portfolio
          </button>
        </header>

        <div className="wmport-table-card">
          <table className="wmport-table">
            <thead>
              <tr>
                <th>Portfolio Code</th>
                <th>Portfolio Name</th>
                <th>Client Name</th>
                <th>Type</th>
                <th>AUM</th>
                <th>Risk Profile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfoliosList.map(portfolio => (
                <tr key={portfolio.id}>
                  <td>{portfolio.portfolioCode}</td>
                  <td>{portfolio.portfolioName}</td>
                  <td>{portfolio.clientName}</td>
                  <td><span className="wmport-chip">{portfolio.type}</span></td>
                  <td className="wmport-num">{formatCurrency(portfolio.aum)}</td>
                  <td>
                    <span className={`wmport-chip wmport-chip--risk-${portfolio.riskProfile.toLowerCase().replace(/\s+/g, '-')}`}>
                      {portfolio.riskProfile}
                    </span>
                  </td>
                  <td>
                    <span className={`wmport-chip wmport-chip--status-${portfolio.status.toLowerCase()}`}>
                      {portfolio.status}
                    </span>
                  </td>
                  <td className="wmport-row-actions">
                    <button type="button" className="wmport-link wmport-link--edit">Edit</button>
                    <button type="button" className="wmport-link wmport-link--delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="wmport-root">
      <header className="wmport-header">
        <div className="wmport-header-copy">
          <span className="wmport-eyebrow">Portfolio administration</span>
          <h2 className="wmport-title">Portfolio Master Entry</h2>
          <p>Create and maintain client portfolios, risk settings, fees, and service providers.</p>
        </div>
        <div className="wmport-header-actions">
          <button
            type="button"
            className="wmport-btn wmport-btn--soft"
            onClick={() => setShowListView(true)}
          >
            View Portfolios List
          </button>
        </div>
      </header>

      {submitMessage && (
        <div className={`wmport-alert ${submitMessage.includes('Error') ? 'wmport-alert--error' : 'wmport-alert--ok'}`}>
          {submitMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="wmport-form">
        <section className="wmport-card">
          <h3 className="wmport-card-title">Basic Information</h3>
          <div className="wmport-grid">
            {renderField('portfolioCode', form.portfolioCode)}
            {renderField('portfolioName', form.portfolioName)}
            {renderField('clientId', form.clientId)}
            {renderField('clientName', form.clientName)}
            {renderField('portfolioType', form.portfolioType)}
            {renderField('accountNumber', form.accountNumber)}
            {renderField('status', form.status)}
            {renderField('baseCurrency', form.baseCurrency)}
          </div>
        </section>

        <section className="wmport-card">
          <h3 className="wmport-card-title">Portfolio Details</h3>
          <div className="wmport-grid">
            {renderField('openingDate', form.openingDate)}
            {renderField('closingDate', form.closingDate)}
            {renderField('riskProfile', form.riskProfile)}
            {renderField('investmentHorizon', form.investmentHorizon)}
            {renderField('rebalancingFrequency', form.rebalancingFrequency)}
            {renderField('targetAllocation', form.targetAllocation)}
          </div>
        </section>

        <section className="wmport-card wmport-card--full">
          <h3 className="wmport-card-title">Investment Strategy</h3>
          <div className="wmport-grid wmport-grid--text">
            {renderField('investmentObjective', form.investmentObjective)}
            {renderField('investmentStrategy', form.investmentStrategy)}
          </div>
        </section>

        <section className="wmport-card">
          <h3 className="wmport-card-title">Fee Structure</h3>
          <div className="wmport-grid">
            {renderField('feeStructure', form.feeStructure)}
            {renderField('managementFee', form.managementFee)}
            {renderField('performanceFee', form.performanceFee)}
          </div>
        </section>

        <section className="wmport-card">
          <h3 className="wmport-card-title">Service Providers</h3>
          <div className="wmport-grid">
            {renderField('custodian', form.custodian)}
            {renderField('advisor', form.advisor)}
          </div>
        </section>

        <section className="wmport-card wmport-card--full">
          <h3 className="wmport-card-title">Additional Information</h3>
          <div className="wmport-grid wmport-grid--text">
            {renderField('notes', form.notes)}
          </div>
        </section>

        <div className="wmport-actions">
          <button
            type="button"
            className="wmport-btn wmport-btn--ghost"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="submit"
            className="wmport-btn wmport-btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WealthPortfolioMaster;
