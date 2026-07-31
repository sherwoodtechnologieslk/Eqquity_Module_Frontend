import React, { useState } from 'react';
import './Styles/FundCategories.css';

const FundCategories = () => {
  const [form, setForm] = useState({
    categoryCode: '',
    categoryName: '',
    description: '',
    riskLevel: '',
    typicalReturn: '',
    typicalHorizon: '',
    minimumInvestment: '',
    status: 'Active',
    regulatoryCategory: '',
    taxTreatment: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [categoriesList, setCategoriesList] = useState([
    { id: 1, categoryCode: 'EQ', categoryName: 'Equity', description: 'Funds that invest primarily in stocks', riskLevel: 'High', typicalReturn: '12-15%', typicalHorizon: '5+ years', minimumInvestment: '10000', status: 'Active', regulatoryCategory: 'Equity Fund', taxTreatment: 'Capital Gains Tax' },
    { id: 2, categoryCode: 'FI', categoryName: 'Fixed Income', description: 'Funds that invest in bonds and fixed income securities', riskLevel: 'Low', typicalReturn: '6-8%', typicalHorizon: '2-5 years', minimumInvestment: '5000', status: 'Active', regulatoryCategory: 'Debt Fund', taxTreatment: 'Interest Income Tax' },
    { id: 3, categoryCode: 'BL', categoryName: 'Balanced', description: 'Funds that invest in both stocks and bonds', riskLevel: 'Medium', typicalReturn: '8-12%', typicalHorizon: '3-7 years', minimumInvestment: '7500', status: 'Active', regulatoryCategory: 'Hybrid Fund', taxTreatment: 'Mixed Tax Treatment' },
    { id: 4, categoryCode: 'MM', categoryName: 'Money Market', description: 'Funds that invest in short-term debt instruments', riskLevel: 'Very Low', typicalReturn: '4-6%', typicalHorizon: 'Less than 1 year', minimumInvestment: '1000', status: 'Active', regulatoryCategory: 'Money Market Fund', taxTreatment: 'Interest Income Tax' },
    { id: 5, categoryCode: 'RE', categoryName: 'Real Estate', description: 'Funds that invest in real estate investment trusts (REITs)', riskLevel: 'Medium', typicalReturn: '7-10%', typicalHorizon: '5+ years', minimumInvestment: '15000', status: 'Active', regulatoryCategory: 'Real Estate Fund', taxTreatment: 'Dividend Tax' }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm({
      categoryCode: '',
      categoryName: '',
      description: '',
      riskLevel: '',
      typicalReturn: '',
      typicalHorizon: '',
      minimumInvestment: '',
      status: 'Active',
      regulatoryCategory: '',
      taxTreatment: '',
      notes: ''
    });
  };

  const isRequired = (fieldName) => {
    const requiredFields = [
      'categoryCode',
      'categoryName',
      'riskLevel',
      'status'
    ];
    return requiredFields.includes(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Validate required fields
    const requiredFields = ['categoryCode', 'categoryName', 'riskLevel', 'status'];
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
      const newCategory = {
        id: categoriesList.length + 1,
        categoryCode: form.categoryCode,
        categoryName: form.categoryName,
        description: form.description,
        riskLevel: form.riskLevel,
        typicalReturn: form.typicalReturn,
        typicalHorizon: form.typicalHorizon,
        minimumInvestment: form.minimumInvestment,
        status: form.status,
        regulatoryCategory: form.regulatoryCategory,
        taxTreatment: form.taxTreatment
      };
      
      setCategoriesList([...categoriesList, newCategory]);
      setSubmitMessage('Fund Category created successfully!');
      setTimeout(() => {
        handleReset();
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      setSubmitMessage('Error creating fund category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectOptions = (fieldName) => {
    const options = {
      riskLevel: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      status: ['Active', 'Inactive', 'Suspended'],
      regulatoryCategory: ['Equity Fund', 'Debt Fund', 'Hybrid Fund', 'Money Market Fund', 'Real Estate Fund', 'Index Fund', 'Capital Preservation Fund'],
      taxTreatment: ['Capital Gains Tax', 'Interest Income Tax', 'Dividend Tax', 'Mixed Tax Treatment', 'Tax-Free']
    };
    return options[fieldName] || [];
  };

  const renderField = (fieldName, value) => {
    const selectOptions = getSelectOptions(fieldName);
    const isSelect = selectOptions.length > 0;
    const required = isRequired(fieldName);

    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    if (fieldName === 'description' || fieldName === 'notes') {
      return (
        <div key={fieldName} className="fc-field-group">
          <label className="fc-field-label">
            {label} {required && <span className="fc-required">*</span>}
          </label>
          <textarea
            name={fieldName}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            rows="4"
            className="fc-form-textarea"
          />
        </div>
      );
    }

    if (isSelect) {
      return (
        <div key={fieldName} className="fc-field-group">
          <label className="fc-field-label">
            {label} {required && <span className="fc-required">*</span>}
          </label>
          <select
            name={fieldName}
            value={value}
            onChange={handleChange}
            className="fc-form-select"
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
      <div key={fieldName} className="fc-field-group">
        <label className="fc-field-label">
          {label} {required && <span className="fc-required">*</span>}
        </label>
        <input
          type="text"
          name={fieldName}
          value={value}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="fc-form-input"
        />
      </div>
    );
  };

  if (showListView) {
    return (
      <div className="fc-container">
        <div className="fc-header">
          <div className="fc-header-copy">
            <span className="fc-eyebrow">Fund administration</span>
            <h2>Fund Categories List</h2>
            <p>Review and maintain the classifications used across the unit-trust catalogue.</p>
          </div>
          <button 
            className="fc-btn fc-btn-primary"
            onClick={() => setShowListView(false)}
          >
            Add New Category
          </button>
        </div>
        
        <div className="fc-table-container">
          <table className="fc-table">
            <thead>
              <tr>
                <th>Category Code</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Risk Level</th>
                <th>Typical Return</th>
                <th>Typical Horizon</th>
                <th>Min. Investment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoriesList.map(category => (
                <tr key={category.id}>
                  <td><strong>{category.categoryCode}</strong></td>
                  <td>{category.categoryName}</td>
                  <td className="fc-description-cell">{category.description}</td>
                  <td><span className={`fc-risk-badge fc-risk-${category.riskLevel.toLowerCase().replace(' ', '-')}`}>{category.riskLevel}</span></td>
                  <td>{category.typicalReturn}</td>
                  <td>{category.typicalHorizon}</td>
                  <td>{category.minimumInvestment}</td>
                  <td><span className={`fc-status-badge fc-status-${category.status.toLowerCase()}`}>{category.status}</span></td>
                  <td>
                    <button className="fc-action-btn fc-edit">Edit</button>
                    <button className="fc-action-btn fc-delete">Delete</button>
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
    <div className="fc-container">
      <div className="fc-header">
        <div className="fc-header-copy">
          <span className="fc-eyebrow">Fund administration</span>
          <h2>Fund Category Entry</h2>
          <p>Define category characteristics, risk expectations, and regulatory treatment.</p>
        </div>
        <div className="fc-header-actions">
          <button 
            className="fc-btn fc-btn-secondary"
            onClick={() => setShowListView(true)}
          >
            View Categories List
          </button>
        </div>
      </div>

      {submitMessage && (
        <div className={`fc-message ${submitMessage.includes('Error') ? 'fc-error' : 'fc-success'}`}>
          {submitMessage}
        </div>
      )}

      <div className="fc-form-container">
        <form onSubmit={handleSubmit} className="fc-form">
          <div className="fc-form-section">
            <h3 className="fc-section-title">Basic Information</h3>
            <div className="fc-form-grid">
              {renderField('categoryCode', form.categoryCode)}
              {renderField('categoryName', form.categoryName)}
              {renderField('description', form.description)}
              {renderField('riskLevel', form.riskLevel)}
              {renderField('status', form.status)}
            </div>
          </div>

          <div className="fc-form-section">
            <h3 className="fc-section-title">Investment Characteristics</h3>
            <div className="fc-form-grid">
              {renderField('typicalReturn', form.typicalReturn)}
              {renderField('typicalHorizon', form.typicalHorizon)}
              {renderField('minimumInvestment', form.minimumInvestment)}
            </div>
          </div>

          <div className="fc-form-section">
            <h3 className="fc-section-title">Regulatory & Tax Information</h3>
            <div className="fc-form-grid">
              {renderField('regulatoryCategory', form.regulatoryCategory)}
              {renderField('taxTreatment', form.taxTreatment)}
            </div>
          </div>

          <div className="fc-form-section">
            <h3 className="fc-section-title">Additional Information</h3>
            <div className="fc-form-grid">
              {renderField('notes', form.notes)}
            </div>
          </div>

          <div className="fc-form-actions">
            <button 
              type="button" 
              className="fc-btn fc-btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
            <button 
              type="submit" 
              className="fc-btn fc-btn-primary"
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

export default FundCategories;
