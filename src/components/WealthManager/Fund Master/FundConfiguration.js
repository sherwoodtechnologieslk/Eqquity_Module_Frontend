import React, { useCallback, useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisFundConfigService, { CONFIG_DOMAINS } from '../../../services/cisFundConfigService';
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

const DOW_LABELS = ['Sun (0)', 'Mon (1)', 'Tue (2)', 'Wed (3)', 'Thu (4)', 'Fri (5)', 'Sat (6)'];

const emptyDomainBody = (section) => {
  switch (section) {
    case 'mandate':
      return { assetClasses: [], rules: [] };
    case 'dealing':
      return { settings: {}, cutoffs: [] };
    case 'navPricing':
      return { settings: {}, publishedPriceTypes: [] };
    case 'fees':
      return { feeLines: [] };
    case 'calendar':
      return { weekdays: [], exceptions: [] };
    default:
      return {};
  }
};

const FundConfiguration = ({ onTabChange }) => {
  const [fundId, setFundId] = useState(() => sessionStorage.getItem(FUND_CONFIG_STORAGE_KEY) || '');
  const [funds, setFunds] = useState([]);
  const [fundProfile, setFundProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [draftConfigId, setDraftConfigId] = useState(null);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [notes, setNotes] = useState('');
  const [refs, setRefs] = useState({});
  const [domainPayload, setDomainPayload] = useState({});

  const activeTabMeta = SECTION_TABS.find((t) => t.key === activeSection);
  const domain = activeTabMeta?.domain;

  const loadFunds = useCallback(async () => {
    const rows = await cisFundService.listFunds();
    setFunds(rows);
    if (!fundId && rows[0]?.id) {
      setFundId(String(rows[0].id));
    }
  }, [fundId]);

  useEffect(() => {
    loadFunds().catch((e) => setMessage(e.message));
  }, [loadFunds]);

  useEffect(() => {
    if (fundId) sessionStorage.setItem(FUND_CONFIG_STORAGE_KEY, fundId);
  }, [fundId]);

  const loadProfile = useCallback(async () => {
    if (!fundId) return;
    const profile = await cisFundService.getFund(fundId);
    setFundProfile(profile);
  }, [fundId]);

  const loadReferences = useCallback(async () => {
    const r = cisFundConfigService.listReference;
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
      r.mandateRuleDimensions(),
      r.mandateLimitTypes(),
      r.mandateLimitUnits(),
      r.dealingCutoffTypes(),
      r.roundingMethods(),
      r.settlementConventions(),
      r.valuationFrequencies(),
      r.pricingMethods(),
      r.publishedPriceTypes(),
      r.assetClasses(),
      r.feeCalculationBases(),
    ]);
    setRefs({
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
    });
  }, []);

  const loadVersions = useCallback(async () => {
    if (!fundId || !domain) return;
    const rows = await cisFundConfigService.listVersions(fundId, domain);
    setVersions(rows);
    const draft = rows.find((v) => v.status === 'DRAFT');
    setDraftConfigId(draft?.id || null);
  }, [fundId, domain]);

  const loadDomainDraft = useCallback(async () => {
    if (!fundId || !domain) return;
    await loadVersions();
    const rows = await cisFundConfigService.listVersions(fundId, domain);
    const draft = rows.find((v) => v.status === 'DRAFT');
    if (draft) {
      const full = await cisFundConfigService.getById(fundId, domain, draft.id);
      setEffectiveFrom(full.header?.effectiveFrom || '');
      setNotes(full.header?.notes || '');
      setDomainPayload(full);
    } else {
      setEffectiveFrom('');
      setNotes('');
      setDomainPayload(emptyDomainBody(activeSection));
    }
  }, [fundId, domain, activeSection, loadVersions]);

  useEffect(() => {
    if (activeSection === 'profile') {
      loadProfile().catch((e) => setMessage(e.message));
    } else if (activeSection === 'serviceProviders') {
      loadProfile().catch((e) => setMessage(e.message));
    } else if (domain) {
      setLoading(true);
      Promise.all([loadReferences(), loadDomainDraft()])
        .catch((e) => setMessage(e.message))
        .finally(() => setLoading(false));
    }
  }, [activeSection, domain, loadProfile, loadReferences, loadDomainDraft]);

  const buildSavePayload = () => {
    const base = { effectiveFrom, notes };
    if (activeSection === 'mandate') {
      return { ...base, assetClasses: domainPayload.assetClasses || [], rules: domainPayload.rules || [] };
    }
    if (activeSection === 'dealing') {
      return { ...base, settings: domainPayload.settings || {}, cutoffs: domainPayload.cutoffs || [] };
    }
    if (activeSection === 'navPricing') {
      return {
        ...base,
        settings: domainPayload.settings || {},
        publishedPriceTypes: domainPayload.publishedPriceTypes || [],
      };
    }
    if (activeSection === 'fees') {
      return { ...base, feeLines: domainPayload.feeLines || [] };
    }
    if (activeSection === 'calendar') {
      return { ...base, weekdays: domainPayload.weekdays || [], exceptions: domainPayload.exceptions || [] };
    }
    return base;
  };

  const handleCreateDraft = async () => {
    if (!effectiveFrom) {
      setMessage('Effective from date is required for a new draft.');
      return;
    }
    try {
      setLoading(true);
      await cisFundConfigService.createDraft(fundId, domain, buildSavePayload());
      setMessage('Draft created.');
      await loadDomainDraft();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftConfigId) {
      await handleCreateDraft();
      return;
    }
    try {
      setLoading(true);
      await cisFundConfigService.updateDraft(fundId, domain, draftConfigId, buildSavePayload());
      setMessage('Draft saved.');
      await loadDomainDraft();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!draftConfigId) {
      setMessage('Save a draft before activating.');
      return;
    }
    try {
      setLoading(true);
      await cisFundConfigService.activate(fundId, domain, draftConfigId);
      setMessage('Configuration activated.');
      await loadDomainDraft();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftConfigId || !window.confirm('Delete this draft version?')) return;
    try {
      setLoading(true);
      await cisFundConfigService.deleteDraft(fundId, domain, draftConfigId);
      setMessage('Draft deleted.');
      await loadDomainDraft();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedFund = useMemo(
    () => funds.find((f) => String(f.id) === String(fundId)),
    [funds, fundId]
  );

  const renderVersionList = () => (
    <div className="fm-form-section" style={{ marginTop: '1rem' }}>
      <h4 className="fm-section-title">Versions</h4>
      <table className="fm-table">
        <thead>
          <tr>
            <th>Ver</th>
            <th>Status</th>
            <th>Effective</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.id}>
              <td>{v.versionNumber}</td>
              <td>{v.status}</td>
              <td>{v.effectiveFrom}</td>
              <td>{v.effectiveTo || '—'}</td>
            </tr>
          ))}
          {versions.length === 0 && (
            <tr>
              <td colSpan={4}>No versions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMandateEditor = () => (
    <>
      <p className="fm-hint">Define permitted asset classes and limit rules (values optional until confirmed).</p>
      <div className="fm-form-grid">
        <div className="fm-field-group">
          <label className="fm-field-label">Add asset class</label>
          <select
            className="fm-form-select"
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!id) return;
              setDomainPayload((p) => ({
                ...p,
                assetClasses: [...(p.assetClasses || []), { assetClassId: id, isPermitted: true }],
              }));
            }}
          >
            <option value="">Select…</option>
            {(refs.assetClasses || []).map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(domainPayload.assetClasses || []).map((row, idx) => (
        <div key={idx} className="fm-form-grid">
          <span>Class #{row.assetClassId}</span>
          <label>
            <input
              type="checkbox"
              checked={row.isPermitted !== false}
              onChange={(e) => {
                const next = [...domainPayload.assetClasses];
                next[idx] = { ...next[idx], isPermitted: e.target.checked };
                setDomainPayload((p) => ({ ...p, assetClasses: next }));
              }}
            />{' '}
            Permitted
          </label>
        </div>
      ))}
    </>
  );

  const renderDealingEditor = () => {
    const st = domainPayload.settings || {};
    return (
      <>
        <div className="fm-form-grid">
          <div className="fm-field-group">
            <label className="fm-field-label">Min initial investment (authoritative)</label>
            <input
              className="fm-form-input"
              type="number"
              value={st.minInitialInvestment ?? ''}
              onChange={(e) =>
                setDomainPayload((p) => ({
                  ...p,
                  settings: { ...st, minInitialInvestment: e.target.value === '' ? null : Number(e.target.value) },
                }))
              }
            />
          </div>
          <div className="fm-field-group">
            <label className="fm-field-label">Min additional investment</label>
            <input
              className="fm-form-input"
              type="number"
              value={st.minAdditionalInvestment ?? ''}
              onChange={(e) =>
                setDomainPayload((p) => ({
                  ...p,
                  settings: { ...st, minAdditionalInvestment: e.target.value === '' ? null : Number(e.target.value) },
                }))
              }
            />
          </div>
        </div>
        <div className="fm-form-grid">
          {['subscriptionEnabled', 'redemptionEnabled', 'switchEnabled', 'unitTransferEnabled'].map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={!!st[key]}
                onChange={(e) =>
                  setDomainPayload((p) => ({
                    ...p,
                    settings: { ...st, [key]: e.target.checked },
                  }))
                }
              />{' '}
              {key.replace(/Enabled/, ' enabled')}
            </label>
          ))}
        </div>
      </>
    );
  };

  const renderNavEditor = () => {
    const st = domainPayload.settings || {};
    return (
      <div className="fm-form-grid">
        <div className="fm-field-group">
          <label className="fm-field-label">Valuation frequency</label>
          <select
            className="fm-form-select"
            value={st.valuationFrequencyId || ''}
            onChange={(e) =>
              setDomainPayload((p) => ({
                ...p,
                settings: { ...st, valuationFrequencyId: e.target.value ? Number(e.target.value) : null },
              }))
            }
          >
            <option value="">—</option>
            {(refs.valuationFrequencies || []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="fm-field-group">
          <label className="fm-field-label">Pricing method</label>
          <select
            className="fm-form-select"
            value={st.pricingMethodId || ''}
            onChange={(e) =>
              setDomainPayload((p) => ({
                ...p,
                settings: { ...st, pricingMethodId: e.target.value ? Number(e.target.value) : null },
              }))
            }
          >
            <option value="">—</option>
            {(refs.pricingMethods || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderCalendarEditor = () => (
    <>
      <p className="fm-hint">Day of week: 0 = Sunday through 6 = Saturday.</p>
      <div className="fm-form-grid">
        {DOW_LABELS.map((label, dow) => {
          const row = (domainPayload.weekdays || []).find((w) => w.dayOfWeek === dow) || { dayOfWeek: dow };
          return (
            <div key={dow} className="fm-field-group">
              <label className="fm-field-label">{label}</label>
              <label>
                <input
                  type="checkbox"
                  checked={!!row.isDealingEligible}
                  onChange={(e) => {
                    const others = (domainPayload.weekdays || []).filter((w) => w.dayOfWeek !== dow);
                    setDomainPayload((p) => ({
                      ...p,
                      weekdays: [...others, { ...row, dayOfWeek: dow, isDealingEligible: e.target.checked }],
                    }));
                  }}
                />{' '}
                Dealing eligible
              </label>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderDomainEditor = () => {
    if (loading) return <p>Loading…</p>;
    return (
      <>
        <div className="fm-form-grid">
          <div className="fm-field-group">
            <label className="fm-field-label">Effective from *</label>
            <input
              className="fm-form-input"
              type="date"
              value={effectiveFrom || ''}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div className="fm-field-group">
            <label className="fm-field-label">Notes</label>
            <input className="fm-form-input" value={notes || ''} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {activeSection === 'mandate' && renderMandateEditor()}
        {activeSection === 'dealing' && renderDealingEditor()}
        {activeSection === 'navPricing' && renderNavEditor()}
        {activeSection === 'calendar' && renderCalendarEditor()}
        {activeSection === 'fees' && (
          <p className="fm-hint">Attach fee definitions to this fund in draft mode. Manage definitions under Fee Structure.</p>
        )}
        <div className="fm-form-actions">
          <button type="button" className="fm-btn fm-btn-secondary" onClick={handleSaveDraft} disabled={loading}>
            {draftConfigId ? 'Save draft' : 'Create draft'}
          </button>
          <button type="button" className="fm-btn fm-btn-primary" onClick={handleActivate} disabled={loading || !draftConfigId}>
            Activate draft
          </button>
          {draftConfigId && (
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleDeleteDraft} disabled={loading}>
              Delete draft
            </button>
          )}
        </div>
        {renderVersionList()}
      </>
    );
  };

  return (
    <div className="fm-container">
      <WealthPageHeader
        title="Fund Configuration"
        blurb="Versioned per-fund configuration keyed by CIS fund registry ID."
        actions={
          <>
            <button
              type="button"
              className="fm-btn fm-btn-secondary"
              onClick={() => onTabChange?.('Fund Master')}
            >
              Back to Fund Master
            </button>
          </>
        }
      />

      {message && (
        <div
          className={`fm-message ${
            message.toLowerCase().includes('fail') || message.includes('required') ? 'fm-error' : 'fm-success'
          }`}
        >
          {message}
        </div>
      )}

      <div className="fm-form-section">
        <label className="fm-field-label">Fund (cis_fund.id)</label>
        <select className="fm-form-select" value={fundId} onChange={(e) => setFundId(e.target.value)}>
          <option value="">Select fund</option>
          {funds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fundCode} — {f.fundName}
            </option>
          ))}
        </select>
      </div>

      <div className="fm-form-actions" style={{ marginBottom: '1rem' }}>
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`fm-btn ${activeSection === tab.key ? 'fm-btn-primary' : 'fm-btn-secondary'}`}
            onClick={() => setActiveSection(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && fundProfile && (
        <div className="fm-form-section">
          <h3 className="fm-section-title">{selectedFund?.fundName || 'Profile'}</h3>
          <p>
            <strong>Code:</strong> {fundProfile.fundCode} · <strong>Category:</strong> {fundProfile.categoryName}
          </p>
          <p className="fm-hint">
            Minimum investment and fund fees are maintained under Dealing and Fees tabs (not legacy Fund Master fields).
          </p>
        </div>
      )}

      {activeSection === 'serviceProviders' && fundProfile && (
        <div className="fm-form-section">
          <h3 className="fm-section-title">Effective-dated assignments</h3>
          <table className="fm-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Provider</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(fundProfile.serviceProviders || []).map((sp) => (
                <tr key={sp.id}>
                  <td>{sp.role}</td>
                  <td>{sp.legalName}</td>
                  <td>{sp.effectiveFrom}</td>
                  <td>{sp.effectiveTo || '—'}</td>
                  <td>{sp.status || 'ACTIVE'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {domain && renderDomainEditor()}
    </div>
  );
};

export default FundConfiguration;

export function openFundConfiguration(onTabChange, fundId) {
  if (fundId) sessionStorage.setItem(FUND_CONFIG_STORAGE_KEY, String(fundId));
  onTabChange?.('Fund Configuration');
}
