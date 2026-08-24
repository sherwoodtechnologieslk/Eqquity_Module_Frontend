import React, { useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import '../shared/WealthOps.css';

const TOGGLES = [
  { id: 'cutoff', label: 'Enforce dealing cut-off', hint: 'Reject portal orders after 13:00 on dealing days.' },
  { id: 'fourEye', label: 'Four-eye on large deals', hint: 'Require checker approval above LKR 10,000,000.' },
  { id: 'navLock', label: 'Lock NAV after publish', hint: 'Published NAVs cannot be edited without a reversal journal.' },
  { id: 'kycGate', label: 'Block dealing without KYC', hint: 'Pending KYC clients cannot subscribe or redeem.' },
  { id: 'stmtPortal', label: 'Auto-publish statements', hint: 'Push monthly statements to the client portal on T+2.' },
];

const SystemSettings = () => {
  const [on, setOn] = useState({ cutoff: true, fourEye: true, navLock: true, kycGate: true, stmtPortal: false });
  const [baseCcy, setBaseCcy] = useState('LKR');
  const [cutoff, setCutoff] = useState('13:00');
  const [message, setMessage] = useState('');

  return (
    <div className="wos">
      <WealthPageHeader
        title="System Settings"
        blurb="House rules for dealing, NAV lock, and client-portal publication across Sherwood Wealth."
        actions={
          <button
            type="button"
            className="wos-btn wos-btn--solid"
            onClick={() => setMessage('Settings saved for this session.')}
          >
            Save settings
          </button>
        }
      />
      {message ? <p className="wos-message">{message}</p> : null}

      <div className="wos-split">
        <section className="wos-card">
          <h2>Operating rules</h2>
          <p>These flags apply to all funds unless overridden on the fund master.</p>
          {TOGGLES.map((t) => (
            <div className="wos-toggle" key={t.id}>
              <div>
                <strong>{t.label}</strong>
                <span className="wos-m">{t.hint}</span>
              </div>
              <button
                type="button"
                className={`wos-switch${on[t.id] ? ' is-on' : ''}`}
                aria-pressed={on[t.id]}
                onClick={() => setOn((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
              />
            </div>
          ))}
        </section>

        <section className="wos-form-panel">
          <header className="wos-panel-head">
            <div>
              <h2>House defaults</h2>
              <p>Used when a fund or portfolio does not override.</p>
            </div>
          </header>
          <div className="wos-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="wos-field">
              <span>Base currency</span>
              <select value={baseCcy} onChange={(e) => setBaseCcy(e.target.value)}>
                <option>LKR</option>
                <option>USD</option>
              </select>
            </label>
            <label className="wos-field">
              <span>Dealing cut-off</span>
              <input type="time" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemSettings;
