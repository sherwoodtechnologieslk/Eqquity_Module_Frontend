import React from 'react';
import './Styles/PreOnboardingAbout.css';

const MILESTONES = [
  { year: '2008', title: 'Founded', desc: 'Established as a licensed investment management firm focused on unit trust products.' },
  { year: '2012', title: 'First Fund Launch', desc: 'Launched the Cash Management Trust, providing retail investors access to money market instruments.' },
  { year: '2016', title: 'Equity Fund', desc: 'Introduced the Equity Income Fund, opening the share market to small and medium investors.' },
  { year: '2019', title: 'Bond Fund', desc: 'Launched the Sri Lanka Bond Fund, offering access to government securities through a single fund.' },
  { year: '2023', title: 'Digital Portal', desc: 'Launched the fully digital client portal for online onboarding, portfolio tracking, and transactions.' },
];

const TEAM = [
  {
    name: 'Portfolio Management',
    role: 'Investment Committee',
    desc: 'A dedicated team of CFA charterholders and senior analysts responsible for fund strategy and allocation decisions.',
    initial: 'PM',
  },
  {
    name: 'Risk & Compliance',
    role: 'Regulatory Affairs',
    desc: 'Ensuring all funds operate within regulatory guidelines and investor assets are protected at all times.',
    initial: 'RC',
  },
  {
    name: 'Client Relations',
    role: 'Investor Services',
    desc: 'Dedicated relationship managers to assist clients with onboarding, queries, and investment guidance.',
    initial: 'CR',
  },
];

const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Integrity',
    desc: 'We act in the best interests of our investors at all times, with full transparency in fees, performance, and operations.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Research-Driven',
    desc: 'Every investment decision is backed by rigorous analysis, market data, and disciplined portfolio construction.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Accessible',
    desc: 'We believe wealth creation should not be limited to the few. Our funds start from LKR 1,000 so anyone can invest.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    title: 'Long-term Focus',
    desc: 'We manage funds with a long-term horizon, resisting short-term noise in favour of compounding returns over time.',
  },
];

export default function PreOnboardingAbout({ onGetStarted }) {
  return (
    <div className="poa-root">

      {/* ── Hero ── */}
      <section className="poa-hero">
        <div className="poa-hero-inner">
          <span className="poa-eyebrow">About Us</span>
          <h1 className="poa-hero-heading">
            Built for investors.<br />Driven by trust.
          </h1>
          <p className="poa-hero-lead">
            We are a licensed investment management firm dedicated to helping individuals and institutions
            grow their wealth through professionally managed unit trust funds — with transparency,
            discipline, and a long-term perspective.
          </p>
          <button type="button" className="poa-btn-primary" onClick={onGetStarted}>
            Start Investing Today
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="poa-hero-stat-panel">
          <div className="poa-hero-stat">
            <div className="poa-hero-stat-val">15+</div>
            <div className="poa-hero-stat-lbl">Years of Operation</div>
          </div>
          <div className="poa-hero-stat-divider" />
          <div className="poa-hero-stat">
            <div className="poa-hero-stat-val">3</div>
            <div className="poa-hero-stat-lbl">Active Funds</div>
          </div>
          <div className="poa-hero-stat-divider" />
          <div className="poa-hero-stat">
            <div className="poa-hero-stat-val">10,000+</div>
            <div className="poa-hero-stat-lbl">Investors Served</div>
          </div>
          <div className="poa-hero-stat-divider" />
          <div className="poa-hero-stat">
            <div className="poa-hero-stat-val">SEC</div>
            <div className="poa-hero-stat-lbl">Regulated & Licensed</div>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="poa-section poa-mission-section">
        <div className="poa-mission-grid">
          <div className="poa-mission-block poa-mission-block--dark">
            <div className="poa-mission-label">Our Mission</div>
            <div className="poa-mission-text">
              To democratise wealth creation by providing every Sri Lankan investor — regardless of income level —
              access to professionally managed investment products that grow their savings over time.
            </div>
          </div>
          <div className="poa-mission-block">
            <div className="poa-mission-label">Our Vision</div>
            <div className="poa-mission-text">
              To be the most trusted name in unit trust investment management in Sri Lanka, known for
              consistent performance, investor education, and world-class digital access.
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="poa-section">
        <div className="poa-section-head">
          <span className="poa-section-eyebrow">Our Values</span>
          <h2 className="poa-section-title">What guides every decision we make</h2>
        </div>
        <div className="poa-values-grid">
          {VALUES.map((v, i) => (
            <div key={i} className="poa-value-card">
              <div className="poa-value-icon">{v.icon}</div>
              <div className="poa-value-title">{v.title}</div>
              <div className="poa-value-desc">{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="poa-section poa-timeline-section">
        <div className="poa-section-head">
          <span className="poa-section-eyebrow">Our Journey</span>
          <h2 className="poa-section-title">Milestones that shaped who we are</h2>
        </div>
        <div className="poa-timeline">
          {MILESTONES.map((m, i) => (
            <div key={i} className="poa-timeline-item">
              <div className="poa-timeline-year">{m.year}</div>
              <div className="poa-timeline-line">
                <div className="poa-timeline-dot" />
                {i < MILESTONES.length - 1 && <div className="poa-timeline-connector" />}
              </div>
              <div className="poa-timeline-body">
                <div className="poa-timeline-title">{m.title}</div>
                <div className="poa-timeline-desc">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section className="poa-section poa-team-section">
        <div className="poa-section-head">
          <span className="poa-section-eyebrow">Our Team</span>
          <h2 className="poa-section-title">The people behind your portfolio</h2>
        </div>
        <div className="poa-team-cards">
          {TEAM.map((t, i) => (
            <div key={i} className="poa-team-card">
              <div className="poa-team-avatar">{t.initial}</div>
              <div className="poa-team-name">{t.name}</div>
              <div className="poa-team-role">{t.role}</div>
              <div className="poa-team-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="poa-cta-banner">
        <div>
          <h3 className="poa-cta-heading">Ready to invest with a team you can trust?</h3>
          <p className="poa-cta-sub">Open an account in minutes. No paperwork, no branch visits.</p>
        </div>
        <button type="button" className="poa-btn-primary" onClick={onGetStarted}>
          Open an Account
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </section>

    </div>
  );
}
