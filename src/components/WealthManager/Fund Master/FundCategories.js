import React, { useCallback, useEffect, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import './Styles/FundCategories.css';

const emptyForm = () => ({
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
  notes: '',
});

const FundCategories = () => {
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await cisFundService.listFundCategories();
      setCategoriesList(rows);
    } catch (error) {
      setSubmitMessage(error.message || 'Failed to load fund categories.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm(emptyForm());
    setEditingId(null);
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
      const payload = {
        categoryCode: form.categoryCode.trim(),
        categoryName: form.categoryName.trim(),
        description: form.description,
        riskLevel: form.riskLevel,
        typicalReturn: form.typicalReturn,
        typicalHorizon: form.typicalHorizon,
        minimumInvestment: form.minimumInvestment,
        status: form.status,
        regulatoryCategory: form.regulatoryCategory,
        taxTreatment: form.taxTreatment,
        notes: form.notes,
      };

      if (editingId) {
        await cisFundService.updateFundCategory(editingId, payload);
        setSubmitMessage('Fund category updated successfully!');
      } else {
        await cisFundService.createFundCategory(payload);
        setSubmitMessage('Fund category created successfully!');
      }

      await loadCategories();
      setTimeout(() => {
        handleReset();
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      setSubmitMessage(error.message || 'Error saving fund category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      categoryCode: category.categoryCode || '',
      categoryName: category.categoryName || '',
      description: category.description || '',
      riskLevel: category.riskLevel || '',
      typicalReturn: category.typicalReturn || '',
      typicalHorizon: category.typicalHorizon || '',
      minimumInvestment: category.minimumInvestment || '',
      status: category.status || 'Active',
      regulatoryCategory: category.regulatoryCategory || '',
      taxTreatment: category.taxTreatment || '',
      notes: category.notes || '',
    });
    setShowListView(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fund category? This cannot be undone.')) return;
    try {
      await cisFundService.deleteFundCategory(id);
      await loadCategories();
      setSubmitMessage('Fund category deleted.');
    } catch (error) {
      setSubmitMessage(error.message || 'Could not delete category.');
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
        'Capital Preservation Fund',
      ],
      taxTreatment: [
        'Capital Gains Tax',
        'Interest Income Tax',
        'Dividend Tax',
        'Mixed Tax Treatment',
        'Tax-Free',
      ],
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
          disabled={fieldName === 'categoryCode' && editingId}
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

        {submitMessage && (
          <div
            className={`fc-message${
              submitMessage.includes('Error') || submitMessage.includes('required') || submitMessage.includes('Could not')
                ? ' fc-message--error'
                : ' fc-message--success'
            }`}
            role="status"
          >
            {submitMessage}
          </div>
        )}

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
                {loadingList && (
                  <tr>
                    <td colSpan={9}>Loading categories…</td>
                  </tr>
                )}
                {!loadingList && categoriesList.length === 0 && (
                  <tr>
                    <td colSpan={9}>No fund categories yet. Add the first category.</td>
                  </tr>
                )}
                {!loadingList &&
                  categoriesList.map((category) => (
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
                        <button type="button" className="fc-link-btn" onClick={() => handleEdit(category)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="fc-link-btn fc-link-btn--danger"
                          onClick={() => handleDelete(category.id)}
                        >
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
        title={editingId ? 'Edit Fund Category' : 'Fund Category Entry'}
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

      <form onSubmit={handleSubmit} className="fc-form fc-form--entry">
        <div className="fc-form-shell">
          <section className="fc-section">
            <h2 className="fc-section__title">Basic Information</h2>
            <div className="fc-grid fc-grid--basic">
              {renderField('categoryCode', form.categoryCode)}
              {renderField('categoryName', form.categoryName)}
              {renderField('riskLevel', form.riskLevel)}
              {renderField('status', form.status)}
              {renderField('description', form.description)}
            </div>
          </section>

          <section className="fc-section">
            <h2 className="fc-section__title">Investment Characteristics</h2>
            <div className="fc-grid">
              {renderField('typicalReturn', form.typicalReturn)}
              {renderField('typicalHorizon', form.typicalHorizon)}
              {renderField('minimumInvestment', form.minimumInvestment)}
            </div>
          </section>

          <section className="fc-section">
            <h2 className="fc-section__title">Regulatory &amp; Tax</h2>
            <div className="fc-grid fc-grid--pair">
              {renderField('regulatoryCategory', form.regulatoryCategory)}
              {renderField('taxTreatment', form.taxTreatment)}
            </div>
          </section>

          <section className="fc-section">
            <h2 className="fc-section__title">Additional Notes</h2>
            <div className="fc-grid fc-grid--single">
              {renderField('notes', form.notes)}
            </div>
          </section>

          <div className="fc-actions">
            <button type="button" className="fc-btn fc-btn--ghost" onClick={handleReset}>
              Reset
            </button>
            <button type="submit" className="fc-btn fc-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : editingId ? 'Update Category' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FundCategories;
