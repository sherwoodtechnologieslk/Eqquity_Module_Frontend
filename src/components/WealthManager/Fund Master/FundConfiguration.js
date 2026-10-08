import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisFundConfigService, { CONFIG_DOMAINS } from '../../../services/cisFundConfigService';
import {
  CalendarEditor,
  DealingEditor,
  FeesEditor,
  MandateEditor,
  NavEditor,
  editorFromResponse,
  emptyDomain,
  payloadFromEditor,
  toDateInput,
} from './FundConfigSections';
import './Styles/FundMaster.css';

const FUND_CONFIG_STORAGE_KEY = 'cis.config.fundId';

const SECTION_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'mandate', label: 'Investment Mandate', domain: CONFIG_DOMAINS.mandate },
  { key: 'dealing', label: 'Dealing', domain: CONFIG_DOMAINS.dealing },
  { key: 'navPricing', label: 'NAV & Pricing', domain: CONFIG_DOMAINS.navPricing },
  { key: 'fees', label: 'Fees', domain: CONFIG_DOMAINS.fee },
  { key: 'calendar', label: 'Calendar', domain: CONFIG_DOMAINS.calendar },
  { key: 'serviceProviders', label: 'Service Providers' },
];

const ASSIGNMENT_ROLES = [
  { value: 'FUND_MANAGER', label: 'Fund Manager' },
  { value: 'TRUSTEE', label: 'Trustee' },
  { value: 'CUSTODIAN', label: 'Custodian' },
  { value: 'REGISTRAR', label: 'Registrar' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'BANK', label: 'Bank' },
  { value: 'OTHER', label: 'Other' },
];

const roleLabel = (role) => ASSIGNMENT_ROLES.find((item) => item.value === role)?.label || role || '—';

const displayDate = (value) => toDateInput(value) || '—';

const activeOnly = (rows) =>
  (rows || []).filter((row) => row.isActive !== false && row.isActive !== 0);

const FundConfiguration = ({ onTabChange }) => {
  const [fundId, setFundId] = useState(() => sessionStorage.getItem(FUND_CONFIG_STORAGE_KEY) || '');
  const [funds, setFunds] = useState([]);
  const [fundProfile, setFundProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('success');
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [editorMode, setEditorMode] = useState('empty');
  const [workingId, setWorkingId] = useState(null);
  const [versionNumber, setVersionNumber] = useState(null);
  const [versionStatus, setVersionStatus] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [notes, setNotes] = useState('');
  const [domainValue, setDomainValue] = useState({});
  const [refs, setRefs] = useState({});
  const [asOfDate, setAsOfDate] = useState('');
  const [asOfText, setAsOfText] = useState('');
  const [providers, setProviders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    serviceProviderId: '',
    role: '',
    effectiveFrom: '',
    notes: '',
  });
  const [endDates, setEndDates] = useState({});
  const loadGeneration = useRef(0);

  const activeTabMeta = SECTION_TABS.find((tab) => tab.key === activeSection);
  const domain = activeTabMeta?.domain;
  const readOnly = editorMode === 'active' || editorMode === 'history' || loading;
  const activeVersion = versions.find((row) => row.status === 'ACTIVE');

  const notify = (text, tone = 'success') => {
    setMessage(text);
    setMessageTone(tone);
  };

  const loadFunds = useCallback(async () => {
    const rows = await cisFundService.listFunds();
    setFunds(rows);
    if (!fundId && rows[0]?.id) setFundId(String(rows[0].id));
  }, [fundId]);

  useEffect(() => {
    loadFunds().catch((error) => notify(error.message, 'error'));
  }, [loadFunds]);

  useEffect(() => {
    if (fundId) sessionStorage.setItem(FUND_CONFIG_STORAGE_KEY, fundId);
  }, [fundId]);

  const loadProfile = useCallback(async () => {
    if (!fundId) return null;
    const profile = await cisFundService.getFund(fundId);
    setFundProfile(profile);
    return profile;
  }, [fundId]);

  const loadReferences = useCallback(async () => {
    const reference = cisFundConfigService.listReference;
    const [
      mandateRuleDimensions,
      mandateLimitTypes,
      mandateLimitUnits,
      dealingCutoffTypes,
      roundingMethods,
      settlementConventions,
      valuationFrequencies,
      pricingMethods,
      publishedPriceTypes,
      assetClasses,
      feeCalculationBases,
    ] = await Promise.all([
      reference.mandateRuleDimensions(),
      reference.mandateLimitTypes(),
      reference.mandateLimitUnits(),
      reference.dealingCutoffTypes(),
      reference.roundingMethods(),
      reference.settlementConventions(),
      reference.valuationFrequencies(),
      reference.pricingMethods(),
      reference.publishedPriceTypes(),
      reference.assetClasses(),
      reference.feeCalculationBases(),
    ]);
    setRefs((current) => ({
      ...current,
      mandateRuleDimensions: activeOnly(mandateRuleDimensions),
      mandateLimitTypes: activeOnly(mandateLimitTypes),
      mandateLimitUnits: activeOnly(mandateLimitUnits),
      dealingCutoffTypes: activeOnly(dealingCutoffTypes),
      roundingMethods: activeOnly(roundingMethods),
      settlementConventions: activeOnly(settlementConventions),
      valuationFrequencies: activeOnly(valuationFrequencies),
      pricingMethods: activeOnly(pricingMethods),
      publishedPriceTypes: activeOnly(publishedPriceTypes),
      assetClasses: activeOnly(assetClasses),
      feeCalculationBases: activeOnly(feeCalculationBases),
    }));
  }, []);

  useEffect(() => {
    loadReferences().catch((error) => notify(error.message, 'error'));
  }, [loadReferences]);

  useEffect(() => {
    if (!fundId) return undefined;
    let cancelled = false;
    loadProfile()
      .then(async (profile) => {
        if (!profile || cancelled) return;
        const definitions = await cisFundConfigService.listFeeDefinitions(profile.managingCompanyId);
        if (!cancelled) setRefs((current) => ({ ...current, feeDefinitions: definitions || [] }));
      })
      .catch((error) => {
        if (!cancelled) notify(error.message, 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [fundId, loadProfile]);

  const applyConfig = (section, config, mode) => {
    const header = config?.header || {};
    setEditorMode(mode);
    setWorkingId(header.id || null);
    setVersionNumber(header.versionNumber ?? null);
    setVersionStatus(header.status || '');
    setEffectiveFrom(toDateInput(header.effectiveFrom));
    setEffectiveTo(toDateInput(header.effectiveTo));
    setNotes(header.notes || '');
    setDomainValue(config ? editorFromResponse(section, config) : emptyDomain(section));
  };

  const loadDomain = useCallback(async () => {
    if (!fundId || !domain) return;
    const generation = ++loadGeneration.current;
    const section = activeSection;
    const rows = await cisFundConfigService.listVersions(fundId, domain);
    if (generation !== loadGeneration.current) return;
    setVersions(Array.isArray(rows) ? rows : []);
    const draft = (rows || []).find((row) => row.status === 'DRAFT');
    const active = (rows || []).find((row) => row.status === 'ACTIVE');
    if (draft) {
      const full = await cisFundConfigService.getById(fundId, domain, draft.id);
      if (generation !== loadGeneration.current) return;
      applyConfig(section, full, 'draft');
      return;
    }
    if (active) {
      const full = await cisFundConfigService.getById(fundId, domain, active.id);
      if (generation !== loadGeneration.current) return;
      applyConfig(section, full, 'active');
      return;
    }
    if (generation !== loadGeneration.current) return;
    applyConfig(section, null, 'empty');
  }, [fundId, domain, activeSection]);

  const loadAssignments = useCallback(async () => {
    if (!fundId || !fundProfile?.managingCompanyId) return;
    const [providerRows, assignmentRows] = await Promise.all([
      cisFundService.listServiceProviders({ managingCompanyId: fundProfile.managingCompanyId }),
      cisFundService.listFundServiceProviders(fundId),
    ]);
    setProviders(providerRows || []);
    setAssignments(assignmentRows || []);
  }, [fundId, fundProfile]);

  useEffect(() => {
    if (!fundId) return undefined;
    let cancelled = false;
    setAsOfText('');
    if (activeSection === 'profile') return undefined;
    if (activeSection === 'serviceProviders') {
      if (!fundProfile) return undefined;
      setLoading(true);
      loadAssignments()
        .catch((error) => {
          if (!cancelled) notify(error.message, 'error');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    if (!domain) return undefined;
    setLoading(true);
    loadDomain()
      .catch((error) => {
        if (!cancelled) notify(error.message, 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSection, domain, fundId, fundProfile, loadAssignments, loadDomain]);

  const buildSavePayload = () => ({
    effectiveFrom,
    notes,
    ...payloadFromEditor(activeSection, domainValue),
  });

  const handleStartDraft = () => {
    loadGeneration.current += 1;
    setEditorMode('new');
    setWorkingId(null);
    setVersionNumber(null);
    setVersionStatus('DRAFT');
    setEffectiveTo('');
    notify('Draft started. Choose Save Draft to store it. The active version is unchanged.');
  };

  const handleDiscardNew = async () => {
    setLoading(true);
    try {
      await loadDomain();
      notify('Unsaved draft discarded.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const persistDraft = async () => {
    if (!effectiveFrom) {
      throw new Error('Effective from is required before a draft can be saved.');
    }
    const payload = buildSavePayload();
    if (editorMode === 'draft' && workingId) {
      return cisFundConfigService.updateDraft(fundId, domain, workingId, payload);
    }
    return cisFundConfigService.createDraft(fundId, domain, payload);
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await persistDraft();
      notify('Draft saved.');
      await loadDomain();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setLoading(true);
      const saved = await persistDraft();
      const configId = saved?.header?.id || workingId;
      if (!configId) throw new Error('Save a draft before activating.');
      await cisFundConfigService.activate(fundId, domain, configId);
      notify('Draft activated. It is now the active version and can no longer be edited.');
      await loadDomain();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (editorMode === 'new') {
      await handleDiscardNew();
      return;
    }
    if (!workingId || !window.confirm('Delete this draft version?')) return;
    try {
      setLoading(true);
      await cisFundConfigService.deleteDraft(fundId, domain, workingId);
      notify('Draft deleted.');
      await loadDomain();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (version) => {
    if (version.status === 'DRAFT') {
      await loadDomain();
      return;
    }
    try {
      setLoading(true);
      const full = await cisFundConfigService.getById(fundId, domain, version.id);
      const mode = version.status === 'ACTIVE' && !versions.some((row) => row.status === 'DRAFT') ? 'active' : 'history';
      applyConfig(activeSection, full, mode);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAsOf = async () => {
    if (!asOfDate) {
      notify('Choose a date to look up the version in force.', 'error');
      return;
    }
    try {
      const config = await cisFundConfigService.getAsOf(fundId, domain, asOfDate);
      if (!config?.header) {
        setAsOfText(`No configuration applies on ${asOfDate}.`);
        return;
      }
      const header = config.header;
      setAsOfText(
        `As of ${asOfDate}: version ${header.versionNumber} (${header.status}), effective ${displayDate(header.effectiveFrom)} to ${displayDate(header.effectiveTo)}.`
      );
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const handleAssignProvider = async () => {
    if (!assignmentForm.serviceProviderId || !assignmentForm.role || !assignmentForm.effectiveFrom) {
      notify('Provider, role, and effective from are required.', 'error');
      return;
    }
    try {
      setLoading(true);
      await cisFundConfigService.createServiceProviderAssignment(fundId, {
        serviceProviderId: Number(assignmentForm.serviceProviderId),
        role: assignmentForm.role,
        effectiveFrom: assignmentForm.effectiveFrom,
        notes: assignmentForm.notes || null,
        isPrimary: false,
      });
      setAssignmentForm({ serviceProviderId: '', role: '', effectiveFrom: '', notes: '' });
      notify('Provider assigned.');
      await loadAssignments();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEndAssignment = async (assignment) => {
    const effectiveTo = endDates[assignment.id];
    if (!effectiveTo) {
      notify('Choose the date this assignment ends.', 'error');
      return;
    }
    if (!window.confirm('End this assignment on the selected date?')) return;
    try {
      setLoading(true);
      await cisFundConfigService.endServiceProviderAssignment(fundId, assignment.id, { effectiveTo });
      notify('Assignment ended.');
      await loadAssignments();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedFund = useMemo(
    () => funds.find((fund) => String(fund.id) === String(fundId)),
    [funds, fundId]
  );

  const statusBanner = () => {
    if (editorMode === 'history') {
      return `Viewing version ${versionNumber || '—'} (${versionStatus}). This version cannot be changed.`;
    }
    if (editorMode === 'draft') {
      return `Editing draft version ${versionNumber}. The active version stays unchanged until you activate this draft.`;
    }
    if (editorMode === 'new') {
      return 'Unsaved draft. Save Draft stores it. Activate saves this draft and then makes it active.';
    }
    if (editorMode === 'active') {
      return `Active version ${versionNumber} is read only. Create Draft to change it without overwriting this version.`;
    }
    return 'No configuration version exists yet. Create Draft to start one.';
  };

  const renderProfile = () => {
    if (!fundProfile) return <p className="fcc-empty">Select a fund to view its registry profile.</p>;
    const fields = [
      ['Fund Code', fundProfile.fundCode],
      ['Fund Name', fundProfile.fundName],
      ['Fund Category', fundProfile.categoryName],
      ['Scheme Structure', fundProfile.schemeStructureName],
      ['Managing Company', fundProfile.managingCompanyName],
      ['Base Currency', fundProfile.baseCurrency],
      ['Launch Date', displayDate(fundProfile.launchDate)],
      ['Status', fundProfile.status],
      ['Benchmark', fundProfile.benchmark],
      ['Risk Rating', fundProfile.riskRating],
      ['Distribution Frequency', fundProfile.distributionFrequency],
      ['Dividend Policy', fundProfile.dividendPolicy],
    ];
    return (
      <div className="fm-form-section">
        <h3 className="fm-section-title">{selectedFund?.fundName || fundProfile.fundName}</h3>
        <p className="fcc-empty">Read only. This profile comes from the CIS fund registry.</p>
        <dl className="fcc-profile">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
          <div className="fcc-profile__wide">
            <dt>Investment Objective</dt>
            <dd>{fundProfile.investmentObjective || '—'}</dd>
          </div>
          <div className="fcc-profile__wide">
            <dt>Investment Strategy</dt>
            <dd>{fundProfile.investmentStrategy || '—'}</dd>
          </div>
        </dl>
      </div>
    );
  };

  const renderVersionBar = () => (
    <div className="fcc-version">
      <p className="fcc-banner">{statusBanner()}</p>
      <div className="fcc-version__grid">
        <div>
          <span>Version</span>
          <strong>{editorMode === 'new' ? 'Not saved' : versionNumber ?? '—'}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong className={`fcc-status fcc-status--${(versionStatus || 'none').toLowerCase()}`}>
            {versionStatus || 'None'}
          </strong>
        </div>
        <label>
          Effective from
          <input
            className="fm-form-input"
            type="date"
            value={effectiveFrom}
            disabled={readOnly}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </label>
        <div>
          <span>Effective to</span>
          <strong>{effectiveTo || 'Open'}</strong>
        </div>
      </div>
      <label className="fcc-notes">
        Notes
        <input
          className="fm-form-input"
          value={notes}
          disabled={readOnly}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      {activeVersion && editorMode !== 'active' && (
        <p className="fcc-empty">
          Active version {activeVersion.versionNumber} is effective {displayDate(activeVersion.effectiveFrom)}
          {' '}to {displayDate(activeVersion.effectiveTo)} and stays in force until a draft is activated.
        </p>
      )}
      <div className="fm-form-actions">
        {(editorMode === 'active' || editorMode === 'empty') && (
          <button type="button" className="fm-btn fm-btn-secondary" onClick={handleStartDraft} disabled={loading}>
            Create Draft
          </button>
        )}
        {(editorMode === 'draft' || editorMode === 'new') && (
          <>
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleSaveDraft} disabled={loading}>
              Save Draft
            </button>
            <button type="button" className="fm-btn fm-btn-primary" onClick={handleActivate} disabled={loading}>
              Activate
            </button>
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleDeleteDraft} disabled={loading}>
              Delete Draft
            </button>
          </>
        )}
        {editorMode === 'history' && (
          <button type="button" className="fm-btn fm-btn-secondary" onClick={() => loadDomain()} disabled={loading}>
            Back to working version
          </button>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="fcc-block">
      <h4 className="fcc-block__title">Version history</h4>
      <table className="fm-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Status</th>
            <th>Effective from</th>
            <th>Effective to</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => (
            <tr key={version.id}>
              <td>{version.versionNumber}</td>
              <td>{version.status}</td>
              <td>{displayDate(version.effectiveFrom)}</td>
              <td>{version.effectiveTo ? displayDate(version.effectiveTo) : 'Open'}</td>
              <td>
                <button type="button" className="fm-action-btn fm-edit" onClick={() => handleViewVersion(version)}>
                  View
                </button>
              </td>
            </tr>
          ))}
          {versions.length === 0 && (
            <tr>
              <td colSpan={5}>No versions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="fcc-asof">
        <label>
          As of
          <input className="fm-form-input" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} />
        </label>
        <button type="button" className="fm-btn fm-btn-secondary" onClick={handleAsOf}>
          Look up
        </button>
        {asOfText && <p className="fcc-empty">{asOfText}</p>}
      </div>
    </div>
  );

  const renderDomain = () => {
    if (loading && !versionStatus && editorMode === 'empty') return <p className="fcc-empty">Loading configuration…</p>;
    return (
      <div className="fm-form-section">
        {renderVersionBar()}
        {activeSection === 'mandate' && (
          <MandateEditor value={domainValue} onChange={setDomainValue} refs={refs} disabled={readOnly} />
        )}
        {activeSection === 'dealing' && (
          <DealingEditor value={domainValue} onChange={setDomainValue} refs={refs} disabled={readOnly} />
        )}
        {activeSection === 'navPricing' && (
          <NavEditor value={domainValue} onChange={setDomainValue} refs={refs} disabled={readOnly} />
        )}
        {activeSection === 'fees' && (
          <FeesEditor
            value={domainValue}
            onChange={setDomainValue}
            refs={refs}
            disabled={readOnly}
            onOpenFeeStructure={() => onTabChange?.('Fee Structure')}
          />
        )}
        {activeSection === 'calendar' && (
          <CalendarEditor value={domainValue} onChange={setDomainValue} disabled={readOnly} />
        )}
        {renderHistory()}
      </div>
    );
  };

  const assignableProviders = providers.filter((provider) => String(provider.status || '').toLowerCase() === 'active');

  const renderServiceProviders = () => (
    <div className="fm-form-section">
      <h3 className="fm-section-title">Service provider assignments</h3>
      <p className="fcc-empty">
        A provider can hold different roles on different funds. Ending an assignment sets its end date. It does not delete the provider.
      </p>
      {assignableProviders.length === 0 ? (
        <p className="fcc-empty">
          No service providers have been configured for this managing company.{' '}
          <button type="button" className="fcc-link" onClick={() => onTabChange?.('Fund Master')}>
            Open Fund Master
          </button>
        </p>
      ) : (
        <div className="fcc-card">
          <div className="fm-form-grid">
            <div className="fm-field-group">
              <label className="fm-field-label">Provider</label>
              <select
                className="fm-form-select"
                value={assignmentForm.serviceProviderId}
                onChange={(event) => setAssignmentForm((form) => ({ ...form, serviceProviderId: event.target.value }))}
              >
                <option value="">Select…</option>
                {assignableProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.providerCode ? `${provider.providerCode} — ` : ''}
                    {provider.legalName}
                  </option>
                ))}
              </select>
            </div>
            <div className="fm-field-group">
              <label className="fm-field-label">Role</label>
              <select
                className="fm-form-select"
                value={assignmentForm.role}
                onChange={(event) => setAssignmentForm((form) => ({ ...form, role: event.target.value }))}
              >
                <option value="">Select…</option>
                {ASSIGNMENT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="fm-field-group">
              <label className="fm-field-label">Effective from</label>
              <input
                className="fm-form-input"
                type="date"
                value={assignmentForm.effectiveFrom}
                onChange={(event) => setAssignmentForm((form) => ({ ...form, effectiveFrom: event.target.value }))}
              />
            </div>
            <div className="fm-field-group">
              <label className="fm-field-label">Notes</label>
              <input
                className="fm-form-input"
                value={assignmentForm.notes}
                onChange={(event) => setAssignmentForm((form) => ({ ...form, notes: event.target.value }))}
              />
            </div>
          </div>
          <button type="button" className="fm-btn fm-btn-primary" onClick={handleAssignProvider} disabled={loading}>
            Assign provider
          </button>
        </div>
      )}
      <table className="fm-table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Role</th>
            <th>Effective from</th>
            <th>Effective to</th>
            <th>Status</th>
            <th>End assignment</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => {
            const open = String(assignment.status || '').toUpperCase() === 'ACTIVE' && !assignment.effectiveTo;
            return (
              <tr key={assignment.id}>
                <td>{assignment.legalName}</td>
                <td>{roleLabel(assignment.role)}</td>
                <td>{displayDate(assignment.effectiveFrom)}</td>
                <td>{displayDate(assignment.effectiveTo)}</td>
                <td>{assignment.status || '—'}</td>
                <td>
                  {open ? (
                    <div className="fcc-end">
                      <input
                        className="fm-form-input"
                        type="date"
                        aria-label="End date"
                        value={endDates[assignment.id] || ''}
                        onChange={(event) =>
                          setEndDates((current) => ({ ...current, [assignment.id]: event.target.value }))
                        }
                      />
                      <button type="button" className="fm-btn fm-btn-secondary" onClick={() => handleEndAssignment(assignment)}>
                        End
                      </button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
          {assignments.length === 0 && (
            <tr>
              <td colSpan={6}>No assignments for this fund.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fm-container fcc">
      <WealthPageHeader
        title="Fund Configuration"
        blurb="Versioned fund administration settings for the selected CIS fund."
        actions={
          <button type="button" className="fm-btn fm-btn-secondary" onClick={() => onTabChange?.('Fund Master')}>
            Back to Fund Master
          </button>
        }
      />

      {message && <div className={`fm-message ${messageTone === 'error' ? 'fm-error' : 'fm-success'}`}>{message}</div>}

      <div className="fm-form-section">
        <label className="fm-field-label" htmlFor="fcc-fund">
          Fund
        </label>
        <select id="fcc-fund" className="fm-form-select" value={fundId} onChange={(event) => setFundId(event.target.value)}>
          <option value="">Select fund</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.fundCode} — {fund.fundName}
            </option>
          ))}
        </select>
      </div>

      <div className="fcc-tabs">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`fm-btn ${activeSection === tab.key ? 'fm-btn-primary' : 'fm-btn-secondary'}`}
            onClick={() => {
              setMessage('');
              setActiveSection(tab.key);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && renderProfile()}
      {activeSection === 'serviceProviders' && renderServiceProviders()}
      {domain && renderDomain()}
    </div>
  );
};

export default FundConfiguration;

export function openFundConfiguration(onTabChange, fundId) {
  if (fundId) sessionStorage.setItem(FUND_CONFIG_STORAGE_KEY, String(fundId));
  onTabChange?.('Fund Configuration');
}
