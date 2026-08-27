import React, { useState } from 'react';
import {
  CpPage,
  CpHero,
  CpSection,
  CpButton,
  CpCtaArrow,
  CpCtaBanner,
} from '../shared/CpUi';
import './Styles/PreOnboardingHome.css';
import './Styles/PreOnboardingFunds.css';

const FUNDS = [
  {
    id: 'EIF',
    code: 'EIF',
    name: 'Equity Income Fund',
    tagline: 'Growth through listed equities with an income tilt.',
    category: 'Equity',
    risk: 'Medium',
    nav: '20.5463',
    change: '+0.35%',
    min: 'LKR 1,000',
    horizon: '3–5 years',
    fee: '1.5% p.a.',
    objective:
      'Generate returns from the share market whilst preserving capital through disciplined equity and income investments.',
    benefits: [
      'Start from LKR 1,000',
      'Withdraw subject to dealing cut-off',
      'Professionally managed equity portfolio',
    ],
  },
  {
    id: 'CMT',
    code: 'CMT',
    name: 'Cash Management Trust',
    tagline: 'A liquid alternative to traditional savings accounts.',
    category: 'Money market',
    risk: 'Low',
    nav: '44.6913',
    change: '+0.02%',
    min: 'LKR 1,000',
    horizon: '1–12 months',
    fee: '0.75% p.a.',
    objective:
      'Generate returns above fixed deposit and bank savings rates via short-term fixed income securities.',
    benefits: [
      'Daily liquidity focus',
      'Alternative to savings accounts',
      'Short-term cash management',
    ],
  },
  {
    id: 'SBF',
    code: 'SBF',
    name: 'Sri Lanka Bond Fund',
    tagline: 'Access government securities through one fund.',
    category: 'Fixed income',
    risk: 'Low–Medium',
    nav: '12.1840',
    change: '+0.08%',
    min: 'LKR 1,000',
    horizon: '1–3 years',
    fee: '1% p.a.',
    objective:
      'Generate secured returns from Sri Lanka Government Securities such as Treasury Bills and Treasury Bonds.',
    benefits: [
      'Government securities exposure',
      'Stable income orientation',
      'Start from LKR 1,000',
    ],
  },
];

export default function PreOnboardingFunds({ onGetStarted, onNavigate }) {
  const [selectedId, setSelectedId] = useState(FUNDS[0].id);
  const selected = FUNDS.find((f) => f.id === selectedId) || FUNDS[0];

  return (
    <CpPage onNavigate={onNavigate} onGetStarted={onGetStarted}>
      <CpHero
        tone="land"
        className="cp-hero--title-sm"
        eyebrow="Our Funds"
        title="Unit trusts for every goal"
        lead="Compare equity, money market, and fixed income funds, professionally managed from LKR 1,000."
        actions={
          <CpButton onClick={onGetStarted}>
            Open an account
            <CpCtaArrow />
          </CpButton>
        }
      />

      <CpSection
        eyebrow="Fund range"
        title="Choose a fund to explore"
        blurb="Select a card to see objectives, fees, and dealing details."
      >
        <div className="cp-site-funds">
          {FUNDS.map((f) => {
            const active = f.id === selectedId;
            return (
              <button
                key={f.id}
                type="button"
                className={`cp-site-fund cp-funds-page-card${active ? ' is-active' : ''}`}
                onClick={() => setSelectedId(f.id)}
              >
                <div className="cp-site-fund__top">
                  <span className="cp-site-fund__code">{f.code}</span>
                  <span
                    className={`cp-site-fund__risk cp-site-fund__risk--${f.risk
                      .replace(/–/g, '-')
                      .toLowerCase()}`}
                  >
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
                  <span className="cp-funds-page-card__hint">{active ? 'Selected' : 'View details'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </CpSection>

      <CpSection mint eyebrow="Fund detail" title={selected.name}>
        <div className="cp-funds-page-detail">
          <p className="cp-funds-page-detail__objective">{selected.objective}</p>
          <dl className="cp-funds-page-detail__meta">
            <div>
              <dt>Risk</dt>
              <dd>{selected.risk}</dd>
            </div>
            <div>
              <dt>Horizon</dt>
              <dd>{selected.horizon}</dd>
            </div>
            <div>
              <dt>Management fee</dt>
              <dd>{selected.fee}</dd>
            </div>
            <div>
              <dt>Minimum</dt>
              <dd>{selected.min}</dd>
            </div>
          </dl>
          <ul className="cp-funds-page-detail__benefits">
            {selected.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="cp-funds-page-detail__actions">
            <CpButton variant="ghost" onClick={onGetStarted}>
              Invest in {selected.code}
              <CpCtaArrow />
            </CpButton>
          </div>
        </div>
      </CpSection>

      <CpCtaBanner
        title="Ready to invest in a unit trust?"
        subtitle="Open an account online, then subscribe, redeem, and track holdings in one portal."
        action={
          <CpButton onClick={onGetStarted}>
            Start onboarding
            <CpCtaArrow />
          </CpButton>
        }
      />
    </CpPage>
  );
}
