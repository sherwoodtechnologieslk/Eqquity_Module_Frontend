import React, { useCallback, useState } from 'react';
import { CpSiteFooter } from '../shared/CpUi';
import SiteAtmosphere from './SiteAtmosphere';
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
    spark: 'M2 28 C 18 24, 28 18, 42 16 S 68 22, 86 10 S 118 14, 142 8',
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
    spark: 'M2 22 C 22 21, 38 20, 54 19 S 86 18, 110 16 S 128 15, 142 14',
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
    spark: 'M2 26 C 20 24, 34 20, 50 18 S 78 21, 98 12 S 122 16, 142 9',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Open your account',
    text: 'Complete digital KYC online, identity, bank details, and preferences in one flow.',
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

const TRUST = ['SEC licensed', 'From LKR 1,000', 'Digital KYC', 'T+2 settlement'];

const Sparkline = ({ d }) => (
  <svg className="cp-site-spark" viewBox="0 0 144 36" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const Arrow = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default function PreOnboardingHome({ onGetStarted, onViewFunds, onNavigate }) {
  const [heroDark, setHeroDark] = useState(() => {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  });
  const onDarkChange = useCallback((dark) => setHeroDark(Boolean(dark)), []);

  return (
    <div className="cp-site">
      <section className={`cp-land${heroDark ? ' cp-land--dark' : ''}`}>
        <SiteAtmosphere embedded onDarkChange={onDarkChange} />
        <div className="cp-site-shell cp-land__content">
          <div className="cp-land__copy">
            <p className="cp-site-kicker">Unit trusts · Sri Lanka</p>
            <h1>Subscribe, redeem, and track in one portal.</h1>
            <p className="cp-site-lead">
              Open an account in minutes. Compare our funds, set up a SIP, and redeem when you need
              to, all in one portal.
            </p>
            <div className="cp-site-hero__actions">
              <button type="button" className="cp-site-btn cp-site-btn--primary" onClick={onGetStarted}>
                Open an account
                <Arrow />
              </button>
              <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onViewFunds}>
                Browse funds
              </button>
            </div>
            <ul className="cp-site-trust">
              {TRUST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="cp-site-board" aria-label="Indicative fund NAVs">
            <div className="cp-site-board__head">
              <div>
                <p className="cp-site-kicker">Today&apos;s NAVs</p>
                <strong>Indicative prices</strong>
              </div>
              <span className="cp-site-board__live">Delayed</span>
            </div>
            <ul className="cp-site-board__list">
              {FUNDS.map((f) => (
                <li key={f.code}>
                  <div className="cp-site-board__meta">
                    <span className="cp-site-fund__code">{f.code}</span>
                    <em>{f.name}</em>
                  </div>
                  <Sparkline d={f.spark} />
                  <div className="cp-site-board__px">
                    <strong>{f.nav}</strong>
                    <span className="is-up">{f.change}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="cp-site-board__note">Orders before 1:00 PM are processed at today&apos;s NAV.</p>
          </aside>
        </div>

        <div className="cp-land__stats" aria-label="Key figures">
          <div className="cp-site-shell">
            <div className="cp-site-stats__grid">
              {STATS.map((s) => (
                <div key={s.label} className="cp-site-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cp-site-section" id="funds">
        <div className="cp-site-shell">
          <header className="cp-site-section__head">
            <div>
              <p className="cp-site-kicker">Our funds</p>
              <h2 className="cp-site-heading-sm">Unit trusts for every goal</h2>
              <p>
                Equity, money market, and fixed income, professionally managed from LKR 1,000.
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
                  <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onGetStarted}>
                    Invest
                    <Arrow />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-site-section cp-site-section--panel">
        <div className="cp-site-shell">
          <header className="cp-site-section__head">
            <div>
              <p className="cp-site-kicker">How it works</p>
              <h2>From signup to portfolio in four steps</h2>
              <p>A simple digital path, no paperwork queues, no branch visit required.</p>
            </div>
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
        <div className="cp-site-shell">
          <div className="cp-site-cta__card">
            <div>
              <p className="cp-site-kicker">Get started</p>
              <h2>Ready to open your account?</h2>
              <p>Complete onboarding in minutes, secure, regulated, and fully digital.</p>
            </div>
            <div className="cp-site-cta__actions">
              <button type="button" className="cp-site-btn cp-site-btn--primary" onClick={onGetStarted}>
                Start onboarding
                <Arrow />
              </button>
              <button type="button" className="cp-site-btn cp-site-btn--secondary" onClick={onViewFunds}>
                Compare funds first
              </button>
            </div>
          </div>
        </div>
      </section>

      <CpSiteFooter onNavigate={onNavigate} onGetStarted={onGetStarted} />
    </div>
  );
}
