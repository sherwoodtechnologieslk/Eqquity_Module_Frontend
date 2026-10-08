import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisFundConfigService, { CONFIG_DOMAINS } from '../../../services/cisFundConfigService';
import { openFundConfiguration } from './FundConfiguration';
import './Styles/FundMaster.css';

const FundPricing = ({ onTabChange }) => {
  const [funds, setFunds] = useState([]);
  const [fundId, setFundId] = useState('');
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    cisFundService
      .listFunds()
      .then((rows) => {
        setFunds(rows);
        if (rows[0]?.id) setFundId(String(rows[0].id));
      })
      .catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!fundId) return;
    cisFundConfigService
      .getCurrent(fundId, CONFIG_DOMAINS.navPricing)
      .then(setConfig)
      .catch((e) => setMessage(e.message));
  }, [fundId]);

  const fund = useMemo(() => funds.find((f) => String(f.id) === String(fundId)), [funds, fundId]);

  return (
    <div className="fm-container">
      <WealthPageHeader
        title="Fund Pricing"
        blurb="Read-only view of NAV & pricing configuration. Operational price publication is not in Phase 2."
        actions={
          fundId ? (
            <button
              type="button"
              className="fm-btn fm-btn-primary"
              onClick={() => openFundConfiguration(onTabChange, fundId)}
            >
              Edit NAV & Pricing config
            </button>
          ) : null
        }
      />
      {message && <div className="fm-message fm-error">{message}</div>}
      <div className="fm-form-section">
        <label className="fm-field-label">Fund</label>
        <select className="fm-form-select" value={fundId} onChange={(e) => setFundId(e.target.value)}>
          {funds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fundCode} — {f.fundName}
            </option>
          ))}
        </select>
      </div>
      {config?.header ? (
        <div className="fm-form-section">
          <p>
            Active version {config.header.versionNumber} · effective {config.header.effectiveFrom}
          </p>
          <pre style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(config.settings || {}, null, 2)}
          </pre>
          <h4 className="fm-section-title">Published price types (config only)</h4>
          <ul>
            {(config.publishedPriceTypes || []).map((p) => (
              <li key={p.id}>
                {p.code || p.publishedPriceTypeId}: {p.isEnabled ? 'enabled' : 'disabled'}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="fm-hint">No active NAV/pricing configuration for {fund?.fundName || 'this fund'}.</p>
      )}
    </div>
  );
};

export default FundPricing;
