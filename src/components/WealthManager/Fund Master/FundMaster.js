import React, { useState } from 'react';
import './Styles/FundMaster.css';

const FundMaster = () => {
  const [form, setForm] = useState({
    fundCode: '',
    fundName: '',
    fundCategory: '',
    fundType: '',
    managementCompany: '',
    launchDate: '',
    status: 'Active',
    riskRating: '',
    minimumInvestment: '',
    managementFee: '',
    performanceFee: '',
    exitFee: '',
    initialNav: '',
    currentNav: '',
    baseCurrency: 'LKR',
    benchmark: '',
    investmentObjective: '',
    investmentStrategy: '',
    fundManager: '',
    custodian: '',
    registrar: '',
    auditor: '',
    regulatoryStatus: '',
    distributionFrequency: '',
    dividendPolicy: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [fundsList, setFundsList] = useState([
    { id: 1, fundCode: 'EGF001', fundName: 'Equity Growth Fund', category: 'Equity', type: 'Open-Ended', status: 'Active', nav: 25.45, riskRating: 'High' },
    { id: 2, fundCode: 'BIF002', fundName: 'Balanced Income Fund', category: 'Balanced', type: 'Open-Ended', status: 'Active', nav: 18.92, riskRating: 'Medium' },
    { id: 3, fundCode: 'FIF003', fundName: 'Fixed Income Fund', category: 'Fixed Income', type: 'Open-Ended', status: 'Active', nav: 10.25, riskRating: 'Low' },
    { id: 4, fundCode: 'MMF004', fundName: 'Money Market Fund', category: 'Money Market', type: 'Open-Ended', status: 'Active', nav: 1.00, riskRating: 'Very Low' },
    { id: 5, fundCode: 'IDX005', fundName: 'Index Fund', category: 'Equity', type: 'Open-Ended', status: 'Active', nav: 32.15, riskRating: 'Medium' }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleReset = () => {
    setForm({
      fundCode: '',
      fundName: '',
      fundCategory: '',
      fundType: '',
      managementCompany: '',
      launchDate: '',
      status: 'Active',
      riskRating: '',
      minimumInvestment: '',
      managementFee: '',
      performanceFee: '',
      exitFee: '',
      initialNav: '',
      currentNav: '',
      baseCurrency: 'LKR',
      benchmark: '',
      investmentObjective: '',
      investmentStrategy: '',
      fundManager: '',
      custodian: '',
      registrar: '',
      auditor: '',
      regulatoryStatus: '',
      distributionFrequency: '',
      dividendPolicy: '',
      notes: ''
    });
  };

  const isRequired = (fieldName) => {
    const requiredFields = [
      'fundCode',
      'fundName',
      'fundCategory',
      'fundType',
      'managementCompany',
      'baseCurrency',
      'status'
    ];
    return requiredFields.includes(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Validate required fields
    const requiredFields = ['fundCode', 'fundName', 'fundCategory', 'fundType', 'managementCompany', 'baseCurrency'];
    const missingFields = requiredFields.filter(field => !form[field]);
    
    if (missingFields.length > 0) {
      setSubmitMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to list (in real app, this would be an API call)
      const newFund = {
        id: fundsList.length + 1,
        fundCode: form.fundCode,
        fundName: form.fundName,
        category: form.fundCategory,
        type: form.fundType,
        status: form.status,
        nav: parseFloat(form.currentNav) || 0,
        riskRating: form.riskRating
      };
      
      setFundsList([...fundsList, newFund]);
      setSubmitMessage('Fund created successfully!');
      setTimeout(() => {
        handleReset();
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      setSubmitMessage('Error creating fund. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldType = (fieldName) => {
    const dateFields = ['launchDate'];
    const numberFields = ['minimumInvestment', 'managementFee', 'performanceFee', 'exitFee', 'initialNav', 'currentNav'];
    const textareaFields = ['investmentObjective', 'investmentStrategy', 'notes'];

    if (dateFields.includes(fieldName)) return 'date';
    if (numberFields.includes(fieldName)) return 'number';
    if (textareaFields.includes(fieldName)) return 'textarea';
    return 'text';
  };

  const getSelectOptions = (fieldName) => {
    const options = {
      fundCategory: ['Equity', 'Fixed Income', 'Balanced', 'Money Market', 'Real Estate', 'Capital Preservation', 'Index'],
      fundType: ['Open-Ended', 'Close-Ended'],
      status: ['Active', 'Inactive', 'Suspended', 'Closed'],
      riskRating: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      baseCurrency: ['LKR', 'USD', 'EUR', 'GBP'],
      distributionFrequency: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'None'],
      dividendPolicy: ['Distribution', 'Reinvestment', 'Both']
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
        <div key={fieldName} className="fm-field-group">
          <label className="fm-field-label">
            {label} {required && <span className="fm-required">*</span>}
          </label>
          <textarea
            name={fieldName}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            rows="4"
            className="fm-form-textarea"
          />
        </div>
      );
    }

    if (isSelect) {
      return (
        <div key={fieldName} className="fm-field-group">
          <label className="fm-field-label">
            {label} {required && <span className="fm-required">*</span>}
          </label>
          <select
            name={fieldName}
            value={value}
            onChange={handleChange}
            className="fm-form-select"
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
      <div key={fieldName} className="fm-field-group">
        <label className="fm-field-label">
          {label} {required && <span className="fm-required">*</span>}
        </label>
        <input
          type={fieldType}
          name={fieldName}
          value={value}
          onChange={handleChange}
          placeholder={fieldType === 'date' ? '' : `Enter ${label.toLowerCase()}`}
          className="fm-form-input"
          step={fieldName.includes('Fee') || fieldName.includes('Nav') ? '0.01' : undefined}
        />
      </div>
    );
  };

  if (showListView) {
    return (
      <div className="fm-container">
        <div className="fm-header">
          <h2>Fund Master List</h2>
          <button 
            className="fm-btn fm-btn-primary"
            onClick={() => setShowListView(false)}
          >
            Add New Fund
          </button>
        </div>
        
        <div className="fm-table-container">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Fund Code</th>
                <th>Fund Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>NAV</th>
                <th>Risk Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fundsList.map(fund => (
                <tr key={fund.id}>
                  <td>{fund.fundCode}</td>
                  <td>{fund.fundName}</td>
                  <td><span className="fm-badge">{fund.category}</span></td>
                  <td>{fund.type}</td>
                  <td>{fund.nav.toFixed(2)}</td>
                  <td><span className={`fm-risk-badge fm-risk-${fund.riskRating.toLowerCase().replace(' ', '-')}`}>{fund.riskRating}</span></td>
                  <td><span className={`fm-status-badge fm-status-${fund.status.toLowerCase()}`}>{fund.status}</span></td>
                  <td>
                    <button className="fm-action-btn fm-edit">Edit</button>
                    <button className="fm-action-btn fm-delete">Delete</button>
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
    <div className="fm-container">
      <div className="fm-header">
        <h2>Fund Master Entry</h2>
        <div className="fm-header-actions">
          <button 
            className="fm-btn fm-btn-secondary"
            onClick={() => setShowListView(true)}
          >
            View Funds List
          </button>
        </div>
      </div>

      {submitMessage && (
        <div className={`fm-message ${submitMessage.includes('Error') ? 'fm-error' : 'fm-success'}`}>
          {submitMessage}
        </div>
      )}

      <div className="fm-form-container">
        <form onSubmit={handleSubmit} className="fm-form">
          <div className="fm-form-section">
            <h3 className="fm-section-title">Basic Information</h3>
            <div className="fm-form-grid">
              {renderField('fundCode', form.fundCode)}
              {renderField('fundName', form.fundName)}
              {renderField('fundCategory', form.fundCategory)}
              {renderField('fundType', form.fundType)}
              {renderField('managementCompany', form.managementCompany)}
              {renderField('launchDate', form.launchDate)}
              {renderField('status', form.status)}
              {renderField('baseCurrency', form.baseCurrency)}
            </div>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Financial Details</h3>
            <div className="fm-form-grid">
              {renderField('initialNav', form.initialNav)}
              {renderField('currentNav', form.currentNav)}
              {renderField('minimumInvestment', form.minimumInvestment)}
              {renderField('managementFee', form.managementFee)}
              {renderField('performanceFee', form.performanceFee)}
              {renderField('exitFee', form.exitFee)}
              {renderField('benchmark', form.benchmark)}
              {renderField('riskRating', form.riskRating)}
            </div>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Investment Details</h3>
            <div className="fm-form-grid">
              {renderField('investmentObjective', form.investmentObjective)}
              {renderField('investmentStrategy', form.investmentStrategy)}
              {renderField('distributionFrequency', form.distributionFrequency)}
              {renderField('dividendPolicy', form.dividendPolicy)}
            </div>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Service Providers</h3>
            <div className="fm-form-grid">
              {renderField('fundManager', form.fundManager)}
              {renderField('custodian', form.custodian)}
              {renderField('registrar', form.registrar)}
              {renderField('auditor', form.auditor)}
            </div>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Additional Information</h3>
            <div className="fm-form-grid">
              {renderField('regulatoryStatus', form.regulatoryStatus)}
              {renderField('notes', form.notes)}
            </div>
          </div>

          <div className="fm-form-actions">
            <button 
              type="button" 
              className="fm-btn fm-btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
            <button 
              type="submit" 
              className="fm-btn fm-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundMaster;
