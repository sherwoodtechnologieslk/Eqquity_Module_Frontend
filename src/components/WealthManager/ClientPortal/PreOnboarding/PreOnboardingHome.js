import React from 'react';
import './Styles/PreOnboardingHome.css';

const FUNDS = [
  {
    code: 'CEF',
    name: 'Ceylan Equity Fund',
    tagline: 'Growth through the share market',
    category: 'Equity',
    risk: 'Medium',
    minInvest: 'LKR 1,000',
    return: '10–14%',
    color: '#0f766e',
  },
  {
    code: 'CMT',
    name: 'Cash Management Trust',
    tagline: 'An alternative to your savings account',
    category: 'Money Market',
    risk: 'Low',
    minInvest: 'LKR 1,000',
    return: '6–8%',
    color: '#0369a1',
  },
  {
    code: 'SBF',
    name: 'Sri Lanka Bond Fund',
    tagline: 'Access to Government Securities',
    category: 'Fixed Income',
    risk: 'Low–Medium',
    minInvest: 'LKR 1,000',
    return: '8–10%',
    color: '#7c3aed',
  },
];

const STATS = [
  { value: '3', label: 'Unit Trust Funds' },
  { value: 'LKR 1,000', label: 'Minimum Investment' },
  { value: '12%+', label: 'Avg. Equity Return' },
  { value: '100%', label: 'Online Access' },
];

const WHY_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Regulated & Secure',
    text: 'All funds are regulated and held under a trusted custodian for your peace of mind.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Withdraw Anytime',
    text: 'Redeem your investments at any time, subject to dealing cut-off times.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    title: 'Expert Management',
    text: 'Your money is managed by experienced portfolio managers with a proven track record.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Full Digital Access',
    text: 'Manage, monitor, and transact on your portfolio entirely online through the client portal.',
  },
];

const RISK_COLOR = {
  'Low': '#16a34a',
  'Low–Medium': '#0369a1',
  'Medium': '#d97706',
  'High': '#dc2626',
};

export default function PreOnboardingHome({ onGetStarted, onViewFunds }) {
  return (
    <div className="poh-root">

      {/* ── Hero ── */}
      <section className="poh-hero">
        <div className="poh-hero-inner">
          <div className="poh-hero-text">
            <span className="poh-hero-eyebrow">Wealth Management · Client Portal</span>
            <h1 className="poh-hero-heading">
              Grow your wealth<br />with confidence.
            </h1>
            <p className="poh-hero-lead">
              Invest in professionally managed unit trust funds starting from as little as LKR 1,000.
              Build long-term wealth with full digital access to your portfolio.
            </p>
            <div className="poh-hero-actions">
              <button type="button" className="poh-btn-primary" onClick={onGetStarted}>
                Open an Account
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
              <button type="button" className="poh-btn-ghost" onClick={onViewFunds}>
                Browse Our Funds
              </button>
            </div>
          </div>
          <div className="poh-hero-visual">
            <div className="poh-hero-card">
              <div className="poh-hero-card-label">Projected value in 10 years</div>
              <div className="poh-hero-card-amount">LKR 20,655,200</div>
              <div className="poh-hero-card-sub">Investing LKR 10,000 / month at 12% p.a.</div>
              <div className="poh-hero-card-bar-wrap">
                <div className="poh-hero-bar" style={{ width: '25%' }}>
                  <span>Today</span>
                </div>
                <div className="poh-hero-bar poh-hero-bar--projected" style={{ width: '100%' }}>
                  <span>Year 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="poh-stats-bar">
        {STATS.map((s, i) => (
          <div key={i} className="poh-stat">
            <div className="poh-stat-value">{s.value}</div>
            <div className="poh-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Funds ── */}
      <section className="poh-section">
        <div className="poh-section-header">
          <div className="poh-section-eyebrow">Our Funds</div>
          <h2 className="poh-section-title">Choose the right fund for your goals</h2>
        </div>
        <div className="poh-fund-cards">
          {FUNDS.map((f) => (
            <div key={f.code} className="poh-fund-card" style={{ '--fund-color': f.color }}>
              <div className="poh-fund-card-top">
                <div className="poh-fund-code">{f.code}</div>
                <span
                  className="poh-fund-risk"
                  style={{ color: RISK_COLOR[f.risk] || '#64748b', background: `${RISK_COLOR[f.risk]}18` }}
                >
                  {f.risk} Risk
                </span>
              </div>
              <div className="poh-fund-name">{f.name}</div>
              <div className="poh-fund-tagline">{f.tagline}</div>
              <div className="poh-fund-meta">
                <div className="poh-fund-meta-item">
                  <div className="poh-fund-meta-label">Category</div>
                  <div className="poh-fund-meta-val">{f.category}</div>
                </div>
                <div className="poh-fund-meta-item">
                  <div className="poh-fund-meta-label">Min. Investment</div>
                  <div className="poh-fund-meta-val">{f.minInvest}</div>
                </div>
                <div className="poh-fund-meta-item">
                  <div className="poh-fund-meta-label">Est. Return</div>
                  <div className="poh-fund-meta-val poh-fund-return">{f.return}%</div>
                </div>
              </div>
              <button type="button" className="poh-fund-cta" onClick={onGetStarted}>
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="poh-section poh-why-section">
        <div className="poh-section-header">
          <div className="poh-section-eyebrow">Why Choose Us</div>
          <h2 className="poh-section-title">Everything you need to invest with confidence</h2>
        </div>
        <div className="poh-why-grid">
          {WHY_ITEMS.map((item, i) => (
            <div key={i} className="poh-why-card">
              <div className="poh-why-icon">{item.icon}</div>
              <div className="poh-why-title">{item.title}</div>
              <div className="poh-why-text">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA banner ── */}
      <section className="poh-cta-banner">
        <div className="poh-cta-banner-text">
          <h3 className="poh-cta-banner-heading">Ready to start your investment journey?</h3>
          <p className="poh-cta-banner-sub">Open an account in minutes and start investing from LKR 1,000.</p>
        </div>
        <button type="button" className="poh-btn-primary" onClick={onGetStarted}>
          Get Started Today
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </section>

    </div>
  );
}
