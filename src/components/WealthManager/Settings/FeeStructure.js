import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisFundConfigService, { CONFIG_DOMAINS } from '../../../services/cisFundConfigService';
import { openFundConfiguration } from '../Fund Master/FundConfiguration';
import '../Fund Master/Styles/FundMaster.css';

const FeeStructure = ({ onTabChange }) => {
  const [definitions, setDefinitions] = useState([]);
  const [funds, setFunds] = useState([]);
  const [fundId, setFundId] = useState('');
  const [feeConfig, setFeeConfig] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([cisFundConfigService.listFeeDefinitions(), cisFundService.listFunds()])
      .then(([defs, fundRows]) => {
        setDefinitions(defs);
        setFunds(fundRows);
        if (fundRows[0]?.id) setFundId(String(fundRows[0].id));
      })
      .catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!fundId) return;
    cisFundConfigService
      .getCurrent(fundId, CONFIG_DOMAINS.fee)
      .then(setFeeConfig)
      .catch(() => setFeeConfig(null));
  }, [fundId]);

  const fund = useMemo(() => funds.find((f) => String(f.id) === String(fundId)), [funds, fundId]);

  return (
    <div className="fm-container">
      <WealthPageHeader
        title="Fee Structure"
        blurb="Managing-company fee definitions and per-fund fee configuration (not operational accrual)."
        actions={
          fundId ? (
            <button
              type="button"
              className="fm-btn fm-btn-primary"
              onClick={() => openFundConfiguration(onTabChange, fundId)}
            >
              Configure fund fees
            </button>
          ) : null
        }
      />
      {message && <div className="fm-message fm-error">{message}</div>}

      <div className="fm-form-section">
        <h3 className="fm-section-title">Fee definitions (MC scope)</h3>
        <table className="fm-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((d) => (
              <tr key={d.id}>
                <td>{d.feeCode}</td>
                <td>{d.name}</td>
                <td>{d.feeTypeName}</td>
                <td>{d.status}</td>
              </tr>
            ))}
            {definitions.length === 0 && (
              <tr>
                <td colSpan={4}>No fee definitions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fm-form-section">
        <label className="fm-field-label">Fund fee configuration</label>
        <select className="fm-form-select" value={fundId} onChange={(e) => setFundId(e.target.value)}>
          {funds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fundCode} — {f.fundName}
            </option>
          ))}
        </select>
        {feeConfig?.header ? (
          <table className="fm-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Fee</th>
                <th>Rate</th>
                <th>Basis</th>
              </tr>
            </thead>
            <tbody>
              {(feeConfig.feeLines || []).map((line) => (
                <tr key={line.id}>
                  <td>{line.feeDefinitionName || line.feeCode}</td>
                  <td>{line.rate ?? '—'}</td>
                  <td>{line.calculationBasisId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="fm-hint">No active fee configuration for {fund?.fundName || 'selected fund'}.</p>
        )}
      </div>
    </div>
  );
};

export default FeeStructure;
