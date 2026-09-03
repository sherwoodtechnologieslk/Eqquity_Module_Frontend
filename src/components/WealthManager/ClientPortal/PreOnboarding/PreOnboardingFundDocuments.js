import React from 'react';
import {
  CpPage,
  CpHero,
  CpSection,
  CpCard,
  CpGrid,
  CpButton,
  CpCtaArrow,
  CpCtaBanner,
  CpPanel,
} from '../shared/CpUi';

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

export default function PreOnboardingFundDocuments({ onGetStarted, onNavigate }) {
  return (
    <CpPage onNavigate={onNavigate} onGetStarted={onGetStarted}>
      <CpHero
        tone="land"
        className="cp-hero--grad"
        eyebrow="Fund Documents"
        title="All your fund documents in one place."
        lead="Once you open an account, you get instant access to prospectuses, fact sheets, reports, and statements for every fund you hold, plus application forms and regulatory documents."
        actions={
          <CpButton onClick={onGetStarted}>
            Open an Account to Access Documents
            <CpCtaArrow />
          </CpButton>
        }
      />

      <CpSection
        eyebrow="What You’ll Have Access To"
        title="Document types available in the portal"
      >
        <CpGrid cols={3}>
          {DOC_CATEGORIES.map((doc) => (
            <CpCard key={doc.title} icon={doc.icon} title={doc.title} text={doc.desc}>
              <span className="cp-site-kicker">Available after signup</span>
            </CpCard>
          ))}
        </CpGrid>
      </CpSection>

      <CpSection mint>
        <CpPanel>
          <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="cp-card__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="cp-section__blurb" style={{ margin: 0 }}>
              <strong style={{ color: 'var(--cp-ink)' }}>Download anytime.</strong> All documents are available in the portal as PDFs. You can view or download them from your dashboard whenever you need.
            </p>
          </div>
        </CpPanel>
      </CpSection>

      <CpCtaBanner
        title="Ready to access your fund documents?"
        subtitle="Open an account and get instant access to prospectuses, reports, and statements."
        action={
          <CpButton onClick={onGetStarted}>
            Open an Account
            <CpCtaArrow />
          </CpButton>
        }
      />
    </CpPage>
  );
}
