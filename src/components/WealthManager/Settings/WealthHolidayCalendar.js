import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisFundConfigService, { CONFIG_DOMAINS } from '../../../services/cisFundConfigService';
import { openFundConfiguration } from '../Fund Master/FundConfiguration';
import '../Fund Master/Styles/FundMaster.css';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WealthHolidayCalendar = ({ onTabChange }) => {
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
      .getCurrent(fundId, CONFIG_DOMAINS.calendar)
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [fundId]);

  const fund = useMemo(() => funds.find((f) => String(f.id) === String(fundId)), [funds, fundId]);

  return (
    <div className="fm-container">
      <WealthPageHeader
        title="Holiday Calendar"
        blurb="Fund calendar configuration (weekday pattern and dated exceptions). 0 = Sunday … 6 = Saturday."
        actions={
          fundId ? (
            <button
              type="button"
              className="fm-btn fm-btn-primary"
              onClick={() => openFundConfiguration(onTabChange, fundId)}
            >
              Edit fund calendar
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
        <>
          <div className="fm-form-section">
            <h3 className="fm-section-title">Weekday pattern</h3>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Dealing</th>
                  <th>Valuation</th>
                  <th>Non-business</th>
                </tr>
              </thead>
              <tbody>
                {(config.weekdays || []).map((w) => (
                  <tr key={w.dayOfWeek}>
                    <td>
                      {DOW[w.dayOfWeek]} ({w.dayOfWeek})
                    </td>
                    <td>{w.isDealingEligible ? 'Yes' : 'No'}</td>
                    <td>{w.isValuationEligible ? 'Yes' : 'No'}</td>
                    <td>{w.isNonBusiness ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fm-form-section">
            <h3 className="fm-section-title">Exceptions</h3>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Non-business</th>
                </tr>
              </thead>
              <tbody>
                {(config.exceptions || []).map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.exceptionDate}</td>
                    <td>{ex.name}</td>
                    <td>{ex.isNonBusiness == null ? '—' : ex.isNonBusiness ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {(config.exceptions || []).length === 0 && (
                  <tr>
                    <td colSpan={3}>No exceptions configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="fm-hint">No active calendar for {fund?.fundName || 'selected fund'}.</p>
      )}
    </div>
  );
};

export default WealthHolidayCalendar;
