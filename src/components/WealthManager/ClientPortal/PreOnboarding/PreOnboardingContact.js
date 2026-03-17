import React from 'react';
import './Styles/PreOnboardingContact.css';

const CONTACT_METHODS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'Phone',
    primary: '+94 11 2 345 678',
    secondary: 'Mon–Fri, 8:30 AM – 5:00 PM',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: 'Email',
    primary: 'investors@wealthplus.lk',
    secondary: 'We aim to respond within 24 hours',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: 'Office',
    primary: '8th Floor, 100, 1 Elvitigala Mawatha',
    secondary: 'Sri Lanka',
  },
];

const FAQ_ITEMS = [
  { q: 'How do I open an investment account?', a: 'Click "Open an Account" anywhere on this portal and complete the online onboarding. You’ll need a valid ID and proof of address.' },
  { q: 'What is the minimum investment amount?', a: 'You can start investing from as little as LKR 1,000 in our unit trust funds.' },
  { q: 'Who can I speak to about my existing portfolio?', a: 'Once you have an account, your relationship manager’s contact details appear in the portal. You can also call or email us using the details above.' },
];

export default function PreOnboardingContact({ onGetStarted }) {
  return (
    <div className="poc-root">

      {/* ── Hero ── */}
      <section className="poc-hero">
        <div className="poc-hero-inner">
          <span className="poc-eyebrow">Contact</span>
          <h1 className="poc-hero-heading">
            We're here to help.
          </h1>
          <p className="poc-hero-lead">
            Have questions about our funds, your account, or how to get started? Reach out by phone,
            email, or visit our office. Our team is ready to assist you.
          </p>
          <button type="button" className="poc-btn-primary" onClick={onGetStarted}>
            Open an Account
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Contact methods ── */}
      <section className="poc-section">
        <div className="poc-section-head">
          <span className="poc-section-eyebrow">Get in Touch</span>
          <h2 className="poc-section-title">Contact options</h2>
        </div>
        <div className="poc-contact-grid">
          {CONTACT_METHODS.map((m, i) => (
            <div key={i} className="poc-contact-card">
              <div className="poc-contact-icon">{m.icon}</div>
              <div className="poc-contact-body">
                <div className="poc-contact-title">{m.title}</div>
                <div className="poc-contact-primary">{m.primary}</div>
                <div className="poc-contact-secondary">{m.secondary}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Office hours ── */}
      <section className="poc-hours-strip">
        <div className="poc-hours-inner">
          <div className="poc-hours-label">Office hours</div>
          <div className="poc-hours-value">Monday – Friday: 8:30 AM – 5:00 PM · Saturday: 9:00 AM – 1:00 PM (by appointment)</div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="poc-section poc-faq-section">
        <div className="poc-section-head">
          <span className="poc-section-eyebrow">Common Questions</span>
          <h2 className="poc-section-title">FAQ</h2>
        </div>
        <div className="poc-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="poc-faq-item">
              <div className="poc-faq-q">{item.q}</div>
              <div className="poc-faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="poc-cta-banner">
        <div>
          <h3 className="poc-cta-heading">Ready to start investing?</h3>
          <p className="poc-cta-sub">Open an account online in minutes — no branch visit required.</p>
        </div>
        <button type="button" className="poc-btn-primary" onClick={onGetStarted}>
          Get Started
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </section>

    </div>
  );
}
