import React, { useCallback, useEffect, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import { openFundConfiguration } from './FundConfiguration';
import './Styles/FundMaster.css';

const PROVIDER_ROLES = [
  { key: 'FUND_MANAGER', label: 'Fund Manager' },
  { key: 'TRUSTEE', label: 'Trustee' },
  { key: 'CUSTODIAN', label: 'Custodian' },
  { key: 'REGISTRAR', label: 'Registrar' },
  { key: 'AUDITOR', label: 'Auditor' },
  { key: 'BROKER', label: 'Broker' },
  { key: 'BANK', label: 'Bank' },
  { key: 'OTHER', label: 'Other' },
];

const emptyProviderIds = () =>
  PROVIDER_ROLES.reduce((acc, { key }) => {
    acc[key] = '';
    return acc;
  }, {});

const emptyForm = () => ({
  fundCode: '',
  fundName: '',
  fundCategoryId: '',
  schemeStructureId: '',
  managingCompanyId: '',
  launchDate: '',
  status: 'Active',
  riskRating: '',
  baseCurrency: 'LKR',
  benchmark: '',
  investmentObjective: '',
  investmentStrategy: '',
  regulatoryStatus: '',
  distributionFrequency: '',
  dividendPolicy: '',
  notes: '',
  providerIds: emptyProviderIds(),
});

const FundMaster = ({ onTabChange }) => {
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [fundsList, setFundsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schemeStructures, setSchemeStructures] = useState([]);
  const [managingCompanies, setManagingCompanies] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadReferenceData = useCallback(async () => {
    const [companies, structures, providers] = await Promise.all([
      cisFundService.listManagingCompanies(),
      cisFundService.listSchemeStructures(),
      cisFundService.listServiceProviders(),
    ]);
    setManagingCompanies(companies);
    setSchemeStructures(structures);
    setServiceProviders(providers);

    const defaultCompanyId = companies[0]?.id ? String(companies[0].id) : '';
    const categoryRows = await cisFundService.listFundCategories(
      defaultCompanyId ? Number(defaultCompanyId) : undefined
    );
    setCategories(categoryRows);

    setForm((prev) => ({
      ...prev,
      managingCompanyId: prev.managingCompanyId || defaultCompanyId,
    }));
  }, []);

  const loadFunds = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await cisFundService.listFunds();
      setFundsList(rows);
    } catch (error) {
      setSubmitMessage(error.message || 'Failed to load funds.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData().catch((error) => {
      setSubmitMessage(error.message || 'Failed to load reference data.');
    });
    loadFunds();
  }, [loadReferenceData, loadFunds]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProviderChange = (role, value) => {
    setForm((prev) => ({
      ...prev,
      providerIds: { ...prev.providerIds, [role]: value },
    }));
  };

  const handleManagingCompanyChange = async (e) => {
    const managingCompanyId = e.target.value;
    setForm((prev) => ({ ...prev, managingCompanyId, fundCategoryId: '' }));
    try {
      const categoryRows = await cisFundService.listFundCategories(
        managingCompanyId ? Number(managingCompanyId) : undefined
      );
      setCategories(categoryRows);
      const providers = await cisFundService.listServiceProviders({
        managingCompanyId: managingCompanyId ? Number(managingCompanyId) : undefined,
      });
      setServiceProviders(providers);
    } catch (error) {
      setSubmitMessage(error.message || 'Failed to load categories for managing company.');
    }
  };

  const handleReset = () => {
    const defaultCompanyId = managingCompanies[0]?.id ? String(managingCompanies[0].id) : '';
    setForm({ ...emptyForm(), managingCompanyId: defaultCompanyId });
    setEditingId(null);
  };

  const isRequired = (fieldName) => {
    const requiredFields = [
      'fundCode',
      'fundName',
      'fundCategoryId',
      'schemeStructureId',
      'managingCompanyId',
      'baseCurrency',
      'status',
    ];
    return requiredFields.includes(fieldName);
  };

  const buildPayload = () => {
    const effectiveFrom = form.launchDate || new Date().toISOString().slice(0, 10);
    const links = PROVIDER_ROLES.map(({ key }) => ({
      role: key,
      serviceProviderId: form.providerIds[key] ? Number(form.providerIds[key]) : null,
      effectiveFrom,
      status: 'ACTIVE',
    })).filter((l) => l.serviceProviderId);

    return {
      managingCompanyId: Number(form.managingCompanyId),
      fundCode: form.fundCode.trim(),
      fundName: form.fundName.trim(),
      fundCategoryId: Number(form.fundCategoryId),
      schemeStructureId: Number(form.schemeStructureId),
      status: form.status,
      launchDate: form.launchDate || null,
      baseCurrency: form.baseCurrency,
      benchmark: form.benchmark,
      riskRating: form.riskRating,
      investmentObjective: form.investmentObjective,
      investmentStrategy: form.investmentStrategy,
      distributionFrequency: form.distributionFrequency,
      dividendPolicy: form.dividendPolicy,
      regulatoryStatus: form.regulatoryStatus,
      notes: form.notes,
      serviceProviderLinks: links,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const requiredFields = [
      'fundCode',
      'fundName',
      'fundCategoryId',
      'schemeStructureId',
      'managingCompanyId',
      'baseCurrency',
    ];
    const missingFields = requiredFields.filter((field) => !form[field]);

    if (missingFields.length > 0) {
      setSubmitMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildPayload();
      if (editingId) {
        await cisFundService.updateFund(editingId, payload);
        setSubmitMessage('Fund updated successfully!');
      } else {
        await cisFundService.createFund(payload);
        setSubmitMessage('Fund created successfully!');
      }
      await loadFunds();
      setTimeout(() => {
        handleReset();
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      setSubmitMessage(error.message || 'Error saving fund. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fund) => {
    const providerIds = emptyProviderIds();
    (fund.serviceProviders || []).forEach((sp) => {
      if (sp.role && sp.serviceProviderId) {
        providerIds[sp.role] = String(sp.serviceProviderId);
      }
    });

    setEditingId(fund.id);
    setForm({
      fundCode: fund.fundCode || '',
      fundName: fund.fundName || '',
      fundCategoryId: fund.fundCategoryId ? String(fund.fundCategoryId) : '',
      schemeStructureId: fund.schemeStructureId ? String(fund.schemeStructureId) : '',
      managingCompanyId: fund.managingCompanyId ? String(fund.managingCompanyId) : '',
      launchDate: fund.launchDate || '',
      status: fund.status || 'Active',
      riskRating: fund.riskRating || '',
      baseCurrency: fund.baseCurrency || 'LKR',
      benchmark: fund.benchmark || '',
      investmentObjective: fund.investmentObjective || '',
      investmentStrategy: fund.investmentStrategy || '',
      regulatoryStatus: fund.regulatoryStatus || '',
      distributionFrequency: fund.distributionFrequency || '',
      dividendPolicy: fund.dividendPolicy || '',
      notes: fund.notes || '',
      providerIds,
    });
    setShowListView(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fund from the registry?')) return;
    try {
      await cisFundService.deleteFund(id);
      await loadFunds();
      setSubmitMessage('Fund deleted.');
    } catch (error) {
      setSubmitMessage(error.message || 'Could not delete fund.');
    }
  };

  const getFieldType = (fieldName) => {
    const dateFields = ['launchDate'];
    const numberFields = [];
    const textareaFields = ['investmentObjective', 'investmentStrategy', 'notes'];

    if (dateFields.includes(fieldName)) return 'date';
    if (numberFields.includes(fieldName)) return 'number';
    if (textareaFields.includes(fieldName)) return 'textarea';
    return 'text';
  };

  const getSelectOptions = (fieldName) => {
    const options = {
      status: ['Active', 'Inactive', 'Suspended', 'Closed'],
      riskRating: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      baseCurrency: ['LKR'],
      distributionFrequency: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'None'],
      dividendPolicy: ['Distribution', 'Reinvestment', 'Both'],
    };
    return options[fieldName] || [];
  };

  const fieldLabel = (fieldName) =>
    fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());

  const renderField = (fieldName, value) => {
    const fieldType = getFieldType(fieldName);
    const selectOptions = getSelectOptions(fieldName);
    const isSelect = selectOptions.length > 0;
    const required = isRequired(fieldName);
    const label = fieldLabel(fieldName);

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
            className={`fm-form-select${fieldName === 'baseCurrency' ? ' fm-form-locked' : ''}`}
            disabled={fieldName === 'baseCurrency'}
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
          step={fieldName.includes('Fee') ? '0.01' : undefined}
          disabled={fieldName === 'fundCode' && editingId}
        />
      </div>
    );
  };

  const activeServiceProviders = serviceProviders.filter((p) => p.status === 'Active');

  if (showListView) {
    return (
      <div className="fm-container">
        <WealthPageHeader
          title="Fund Master List"
          blurb="Review and maintain the unit trusts available across Sherwood Wealth."
          actions={
            <button type="button" className="fm-btn fm-btn-primary" onClick={() => setShowListView(false)}>
              Add New Fund
            </button>
          }
        />

        {submitMessage && (
          <div className={`fm-message ${submitMessage.includes('Error') || submitMessage.includes('Could not') ? 'fm-error' : 'fm-success'}`}>
            {submitMessage}
          </div>
        )}

        <div className="fm-table-container">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Fund Code</th>
                <th>Fund Name</th>
                <th>Category</th>
                <th>Scheme Structure</th>
                <th>Published NAV</th>
                <th>Risk Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr>
                  <td colSpan={8}>Loading funds…</td>
                </tr>
              )}
              {!loadingList && fundsList.length === 0 && (
                <tr>
                  <td colSpan={8}>No funds in the registry yet.</td>
                </tr>
              )}
              {!loadingList &&
                fundsList.map((fund) => (
                  <tr key={fund.id}>
                    <td>{fund.fundCode}</td>
                    <td>{fund.fundName}</td>
                    <td>
                      <span className="fm-badge">{fund.categoryName || '—'}</span>
                    </td>
                    <td>{fund.schemeStructureName || '—'}</td>
                    <td>—</td>
                    <td>
                      <span
                        className={`fm-risk-badge fm-risk-${String(fund.riskRating || '')
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {fund.riskRating || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`fm-status-badge fm-status-${String(fund.status || '').toLowerCase()}`}>
                        {fund.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fm-action-btn fm-edit"
                        onClick={() => openFundConfiguration(onTabChange, fund.id)}
                      >
                        Configure
                      </button>
                      <button type="button" className="fm-action-btn fm-edit" onClick={() => handleEdit(fund)}>
                        Edit
                      </button>
                      <button type="button" className="fm-action-btn fm-delete" onClick={() => handleDelete(fund.id)}>
                        Delete
                      </button>
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
      <WealthPageHeader
        title={editingId ? 'Edit Fund' : 'Fund Master Entry'}
        blurb="Fund registry profile. Use Configure Fund for dealing, fees, NAV, calendar, and mandate."
        actions={
          <button type="button" className="fm-btn fm-btn-secondary" onClick={() => setShowListView(true)}>
            View Funds List
          </button>
        }
      />

      {submitMessage && (
        <div className={`fm-message ${submitMessage.includes('Error') || submitMessage.includes('required') ? 'fm-error' : 'fm-success'}`}>
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

              <div className="fm-field-group">
                <label className="fm-field-label">
                  Fund Category <span className="fm-required">*</span>
                </label>
                <select
                  name="fundCategoryId"
                  value={form.fundCategoryId}
                  onChange={handleChange}
                  className="fm-form-select"
                >
                  <option value="">Select Fund Category</option>
                  {categories
                    .filter((c) => c.status === 'Active')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryName} ({c.categoryCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="fm-field-group">
                <label className="fm-field-label">
                  Scheme Structure <span className="fm-required">*</span>
                </label>
                <select
                  name="schemeStructureId"
                  value={form.schemeStructureId}
                  onChange={handleChange}
                  className="fm-form-select"
                >
                  <option value="">Select Scheme Structure</option>
                  {schemeStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fm-field-group">
                <label className="fm-field-label">
                  Managing Company <span className="fm-required">*</span>
                </label>
                <select
                  name="managingCompanyId"
                  value={form.managingCompanyId}
                  onChange={handleManagingCompanyChange}
                  className="fm-form-select"
                >
                  <option value="">Select Managing Company</option>
                  {managingCompanies.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </div>

              {renderField('launchDate', form.launchDate)}
              {renderField('status', form.status)}
              {renderField('baseCurrency', form.baseCurrency)}
            </div>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Profile</h3>
            <p className="fm-hint" style={{ marginBottom: '0.75rem' }}>
              Minimum investment and fees are configured under Fund Configuration (Dealing / Fees).
            </p>
            <div className="fm-form-grid">
              {renderField('benchmark', form.benchmark)}
              {renderField('riskRating', form.riskRating)}
            </div>
            {editingId && (
              <button
                type="button"
                className="fm-btn fm-btn-secondary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => openFundConfiguration(onTabChange, editingId)}
              >
                Configure Fund
              </button>
            )}
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
              {PROVIDER_ROLES.map(({ key, label }) => (
                <div key={key} className="fm-field-group">
                  <label className="fm-field-label">{label}</label>
                  <select
                    value={form.providerIds[key]}
                    onChange={(e) => handleProviderChange(key, e.target.value)}
                    className="fm-form-select"
                  >
                    <option value="">None</option>
                    {activeServiceProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.legalName} ({p.providerCode})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="fm-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              Role is assigned per fund (FundServiceProvider). The same organization may hold different roles on different funds.
            </p>
          </div>

          <div className="fm-form-section">
            <h3 className="fm-section-title">Additional Information</h3>
            <div className="fm-form-grid">
              {renderField('regulatoryStatus', form.regulatoryStatus)}
              {renderField('notes', form.notes)}
            </div>
          </div>

          <div className="fm-form-actions">
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button type="submit" className="fm-btn fm-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : editingId ? 'Update Fund' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundMaster;
