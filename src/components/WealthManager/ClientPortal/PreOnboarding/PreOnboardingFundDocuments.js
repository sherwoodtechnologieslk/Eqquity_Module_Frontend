import React from 'react';
import './Styles/PreOnboardingFundDocuments.css';

const DOC_CATEGORIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Prospectus',
    desc: 'Full fund prospectus with objectives, risks, fees, and regulatory disclosures for each unit trust.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    title: 'Fact Sheets',
    desc: 'One-page summaries for each fund: performance, allocation, key facts, and minimum investment.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Annual & Quarterly Reports',
    desc: 'Audited annual reports and quarterly portfolio updates for all funds you hold.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    title: 'KIID (Key Investor Information)',
    desc: 'Regulatory key investor information documents outlining risks and costs in plain language.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    title: 'Account Statements',
    desc: 'Monthly or on-demand statements showing your holdings, transactions, and unit balances.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: 'Application & Forms',
    desc: 'Subscription, redemption, and transfer forms plus tax and compliance documents.',
  },
];

export default function PreOnboardingFundDocuments({ onGetStarted }) {
  return (
    <div className="pofd-root">

      {/* ── Hero ── */}
      <section className="pofd-hero">
        <div className="pofd-hero-inner">
          <span className="pofd-eyebrow">Fund Documents</span>
          <h1 className="pofd-hero-heading">
            All your fund documents in one place.
          </h1>
          <p className="pofd-hero-lead">
            Once you open an account, you get instant access to prospectuses, fact sheets, reports,
            and statements for every fund you hold — plus application forms and regulatory documents.
          </p>
          <button type="button" className="pofd-btn-primary" onClick={onGetStarted}>
            Open an Account to Access Documents
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Document categories ── */}
      <section className="pofd-section">
        <div className="pofd-section-head">
          <span className="pofd-section-eyebrow">What You’ll Have Access To</span>
          <h2 className="pofd-section-title">Document types available in the portal</h2>
        </div>
        <div className="pofd-doc-grid">
          {DOC_CATEGORIES.map((doc, i) => (
            <div key={i} className="pofd-doc-card">
              <div className="pofd-doc-icon">{doc.icon}</div>
              <div className="pofd-doc-body">
                <div className="pofd-doc-title">{doc.title}</div>
                <div className="pofd-doc-desc">{doc.desc}</div>
              </div>
              <div className="pofd-doc-badge">Available after signup</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Info strip ── */}
      <section className="pofd-info-strip">
        <div className="pofd-info-inner">
          <div className="pofd-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="pofd-info-text">
            <strong>Download anytime.</strong> All documents are available in the portal as PDFs. You can view or download them from your dashboard whenever you need.
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pofd-cta-banner">
        <div>
          <h3 className="pofd-cta-heading">Ready to access your fund documents?</h3>
          <p className="pofd-cta-sub">Open an account and get instant access to prospectuses, reports, and statements.</p>
        </div>
        <button type="button" className="pofd-btn-primary" onClick={onGetStarted}>
          Open an Account
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </section>

    </div>
  );
}
