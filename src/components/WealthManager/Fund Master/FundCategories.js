import React, { useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
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
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const isRequired = (fieldName) =>
    ['categoryCode', 'categoryName', 'riskLevel', 'status'].includes(fieldName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const requiredFields = ['categoryCode', 'categoryName', 'riskLevel', 'status'];
    const missingFields = requiredFields.filter((field) => !form[field]);

    if (missingFields.length > 0) {
      setSubmitMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      regulatoryCategory: [
        'Equity Fund',
        'Debt Fund',
        'Hybrid Fund',
        'Money Market Fund',
        'Real Estate Fund',
        'Index Fund',
        'Capital Preservation Fund'
      ],
      taxTreatment: [
        'Capital Gains Tax',
        'Interest Income Tax',
        'Dividend Tax',
        'Mixed Tax Treatment',
        'Tax-Free'
      ]
    };
    return options[fieldName] || [];
  };

  const renderField = (fieldName, value) => {
    const selectOptions = getSelectOptions(fieldName);
    const isSelect = selectOptions.length > 0;
    const required = isRequired(fieldName);
    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());

    if (fieldName === 'description' || fieldName === 'notes') {
      return (
        <div key={fieldName} className="fc-field">
          <label className="fc-field__label" htmlFor={`fc-${fieldName}`}>
            {label} {required && <span className="fc-required">*</span>}
          </label>
          <textarea
            id={`fc-${fieldName}`}
            name={fieldName}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}…`}
            rows="4"
            className="fc-input fc-input--area"
          />
        </div>
      );
    }

    if (isSelect) {
      return (
        <div key={fieldName} className="fc-field">
          <label className="fc-field__label" htmlFor={`fc-${fieldName}`}>
            {label} {required && <span className="fc-required">*</span>}
          </label>
          <select
            id={`fc-${fieldName}`}
            name={fieldName}
            value={value}
            onChange={handleChange}
            className="fc-input"
          >
            <option value="">Select {label}</option>
            {selectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={fieldName} className="fc-field">
        <label className="fc-field__label" htmlFor={`fc-${fieldName}`}>
          {label} {required && <span className="fc-required">*</span>}
        </label>
        <input
          id={`fc-${fieldName}`}
          type="text"
          name={fieldName}
          value={value}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="fc-input"
        />
      </div>
    );
  };

  const riskClass = (level) =>
    `fc-badge fc-badge--risk-${String(level || '')
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

  const statusClass = (status) =>
    `fc-badge fc-badge--status-${String(status || '').toLowerCase()}`;

  if (showListView) {
    return (
      <div className="fc">
        <WealthPageHeader
          title="Fund Categories"
          blurb="Review and maintain the classifications used across the unit-trust catalogue."
          actions={
            <button type="button" className="fc-btn fc-btn--primary" onClick={() => setShowListView(false)}>
              Add New Category
            </button>
          }
        />

        <div className="fc-panel fc-panel--table">
          <div className="fc-table-wrap">
            <table className="fc-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Risk</th>
                  <th>Return</th>
                  <th>Horizon</th>
                  <th>Min. Investment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesList.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong className="fc-code">{category.categoryCode}</strong>
                    </td>
                    <td>{category.categoryName}</td>
                    <td className="fc-desc">{category.description}</td>
                    <td>
                      <span className={riskClass(category.riskLevel)}>{category.riskLevel}</span>
                    </td>
                    <td>{category.typicalReturn}</td>
                    <td>{category.typicalHorizon}</td>
                    <td>{category.minimumInvestment}</td>
                    <td>
                      <span className={statusClass(category.status)}>{category.status}</span>
                    </td>
                    <td className="fc-row-actions">
                      <button type="button" className="fc-link-btn">
                        Edit
                      </button>
                      <button type="button" className="fc-link-btn fc-link-btn--danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fc">
      <WealthPageHeader
        title="Fund Category Entry"
        blurb="Define category characteristics, risk expectations, and regulatory treatment."
        actions={
          <button type="button" className="fc-btn fc-btn--ghost" onClick={() => setShowListView(true)}>
            View Categories List
          </button>
        }
      />

      {submitMessage && (
        <div
          className={`fc-message${
            submitMessage.includes('Error') || submitMessage.includes('required')
              ? ' fc-message--error'
              : ' fc-message--success'
          }`}
          role="status"
        >
          {submitMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fc-form">
        <section className="fc-panel">
          <h2 className="fc-panel__title">Basic Information</h2>
          <div className="fc-grid fc-grid--basic">
            {renderField('categoryCode', form.categoryCode)}
            {renderField('categoryName', form.categoryName)}
            {renderField('riskLevel', form.riskLevel)}
            {renderField('status', form.status)}
            {renderField('description', form.description)}
          </div>
        </section>

        <section className="fc-panel">
          <h2 className="fc-panel__title">Investment Characteristics</h2>
          <div className="fc-grid">
            {renderField('typicalReturn', form.typicalReturn)}
            {renderField('typicalHorizon', form.typicalHorizon)}
            {renderField('minimumInvestment', form.minimumInvestment)}
          </div>
        </section>

        <section className="fc-panel">
          <h2 className="fc-panel__title">Regulatory & Tax</h2>
          <div className="fc-grid">
            {renderField('regulatoryCategory', form.regulatoryCategory)}
            {renderField('taxTreatment', form.taxTreatment)}
          </div>
        </section>

        <section className="fc-panel">
          <h2 className="fc-panel__title">Additional Notes</h2>
          <div className="fc-grid fc-grid--single">
            {renderField('notes', form.notes)}
          </div>
        </section>

        <div className="fc-actions">
          <button type="button" className="fc-btn fc-btn--ghost" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="fc-btn fc-btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FundCategories;
