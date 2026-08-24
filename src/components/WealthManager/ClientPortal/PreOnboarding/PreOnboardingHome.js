import React from 'react';
import './Styles/PreOnboardingHome.css';

const FUNDS = [
  {
    code: 'EIF',
    name: 'Equity Income Fund',
    tagline: 'Growth through listed equities with an income tilt.',
    category: 'Equity',
    risk: 'Medium',
    nav: '20.5463',
    change: '+0.35%',
    min: 'LKR 1,000',
  },
  {
    code: 'CMT',
    name: 'Cash Management Trust',
    tagline: 'A liquid alternative to traditional savings accounts.',
    category: 'Money market',
    risk: 'Low',
    nav: '44.6913',
    change: '+0.02%',
    min: 'LKR 1,000',
  },
  {
    code: 'SBF',
    name: 'Sri Lanka Bond Fund',
    tagline: 'Access government securities through one fund.',
    category: 'Fixed income',
    risk: 'Low–Medium',
    nav: '12.1840',
    change: '+0.08%',
    min: 'LKR 1,000',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Open your account',
    text: 'Complete digital KYC online — identity, bank details, and preferences in one flow.',
  },
  {
    n: '02',
    title: 'Choose a fund',
    text: 'Compare unit trusts by risk, horizon, and objective before you invest.',
  },
  {
    n: '03',
    title: 'Invest or start a SIP',
    text: 'Subscribe from LKR 1,000, or set up a monthly investment plan.',
  },
  {
    n: '04',
    title: 'Track & transact',
    text: 'View holdings, redeem, switch funds, and download statements anytime.',
  },
];

const STATS = [
  { value: '3', label: 'Unit trust funds' },
  { value: 'LKR 1,000', label: 'Minimum investment' },
  { value: 'SIP ready', label: 'Monthly from LKR 1,000' },
  { value: 'T+2', label: 'Settlement cycle' },
];

export default function PreOnboardingHome({ onGetStarted, onViewFunds }) {
  return (
    <div className="cp-site">
      <section className="cp-site-hero">
        <div className="cp-site-shell cp-site-hero__row">
          <div className="cp-site-hero__copy">
            <p className="cp-site-kicker">Sherwood Wealth · Client Portal</p>
            <h1>Invest online with confidence</h1>
            <p className="cp-site-lead">
              Open an account, compare unit trusts from LKR 1,000, and manage subscriptions,
              SIPs, and redemptions in one secure portal.
            </p>
            <div className="cp-site-hero__actions">
              <button type="button" className="cp-site-btn cp-site-btn--primary" onClick={onGetStarted}>
                Open an account
              </button>
              <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onViewFunds}>
                Browse funds
              </button>
            </div>
          </div>
          <aside className="cp-site-hero__panel" aria-label="At a glance">
            <p className="cp-site-kicker">At a glance</p>
            <ul>
              <li>
                <span>Funds available</span>
                <strong>3</strong>
              </li>
              <li>
                <span>Minimum ticket</span>
                <strong>LKR 1,000</strong>
              </li>
              <li>
                <span>Dealing cut-off</span>
                <strong>1:00 PM</strong>
              </li>
              <li>
                <span>Settlement</span>
                <strong>T+2</strong>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="cp-site-stats" aria-label="Key figures">
        <div className="cp-site-shell cp-site-stats__grid">
          {STATS.map((s) => (
            <div key={s.label} className="cp-site-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cp-site-section" id="funds">
        <div className="cp-site-shell">
          <header className="cp-site-section__head">
            <div>
              <p className="cp-site-kicker">Our funds</p>
              <h2>Unit trusts for every goal</h2>
              <p>
                Equity, money market, and fixed income — professionally managed from LKR 1,000.
              </p>
            </div>
            <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onViewFunds}>
              View all funds
            </button>
          </header>

          <div className="cp-site-funds">
            {FUNDS.map((f) => (
              <article key={f.code} className="cp-site-fund">
                <div className="cp-site-fund__top">
                  <span className="cp-site-fund__code">{f.code}</span>
                  <span className={`cp-site-fund__risk cp-site-fund__risk--${f.risk.replace(/–/g, '-').toLowerCase()}`}>
                    {f.risk}
                  </span>
                </div>
                <h3>{f.name}</h3>
                <p>{f.tagline}</p>
                <div className="cp-site-fund__row">
                  <div>
                    <span>NAV</span>
                    <strong>{f.nav}</strong>
                  </div>
                  <div>
                    <span>1D</span>
                    <strong className="is-up">{f.change}</strong>
                  </div>
                  <div>
                    <span>Min.</span>
                    <strong>{f.min}</strong>
                  </div>
                </div>
                <div className="cp-site-fund__foot">
                  <span>{f.category}</span>
                  <button type="button" className="cp-site-btn cp-site-btn--primary" onClick={onGetStarted}>
                    Invest
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-site-section cp-site-section--panel">
        <div className="cp-site-shell">
          <header className="cp-site-section__head cp-site-section__head--center">
            <p className="cp-site-kicker">How it works</p>
            <h2>From signup to portfolio in four steps</h2>
            <p>A simple digital path — no paperwork queues, no branch visit required.</p>
          </header>
          <div className="cp-site-steps">
            {STEPS.map((s) => (
              <article key={s.n} className="cp-site-step">
                <span className="cp-site-step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-site-section">
        <div className="cp-site-shell">
          <div className="cp-site-split">
            <div>
              <p className="cp-site-kicker">Dealing desk</p>
              <h2>Today&apos;s cut-offs</h2>
              <p>
                Orders received before cut-off are processed at today&apos;s NAV. Settlement follows
                the standard T+2 cycle.
              </p>
            </div>
            <dl className="cp-site-deal">
              <div>
                <dt>Subscription</dt>
                <dd>1:00 PM</dd>
              </div>
              <div>
                <dt>Redemption</dt>
                <dd>1:00 PM</dd>
              </div>
              <div>
                <dt>Settlement</dt>
                <dd>T+2 business days</dd>
              </div>
              <div>
                <dt>NAV published</dt>
                <dd>Daily · after close</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="cp-site-cta">
        <div className="cp-site-shell cp-site-cta__card">
          <div>
            <p className="cp-site-kicker">Get started</p>
            <h2>Ready to open your account?</h2>
            <p>Complete onboarding in minutes — secure, regulated, and fully digital.</p>
          </div>
          <div className="cp-site-cta__actions">
            <button type="button" className="cp-site-btn cp-site-btn--primary" onClick={onGetStarted}>
              Start onboarding
            </button>
            <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onViewFunds}>
              Compare funds first
            </button>
          </div>
        </div>
      </section>

      <footer className="cp-site-footer">
        <div className="cp-site-shell">
          <span>Sherwood Wealth</span>
          <span>Client Portal · Regulated unit trust investing</span>
        </div>
      </footer>
    </div>
  );
}
