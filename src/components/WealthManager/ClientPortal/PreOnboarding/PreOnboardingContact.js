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
} from '../shared/CpUi';
import ContactGlobe from './ContactGlobe';

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

export default function PreOnboardingContact({ onGetStarted, onNavigate }) {
  return (
    <CpPage onNavigate={onNavigate} onGetStarted={onGetStarted}>
      <CpHero
        tone="land"
        visual={<ContactGlobe />}
        eyebrow="Contact"
        title="We're here to help."
        lead="Have questions about our funds, your account, or how to get started? Reach out by phone, email, or visit our office. Our team is ready to assist you."
        actions={
          <CpButton onClick={onGetStarted}>
            Open an Account
            <CpCtaArrow />
          </CpButton>
        }
      />

      <CpSection className="cp-contact-methods" eyebrow="Get in Touch" title="Contact options">
        <CpGrid cols={3}>
          {CONTACT_METHODS.map((m) => (
            <CpCard key={m.title} icon={m.icon} title={m.title}>
              <p className="cp-card__text" style={{ color: 'var(--cp-ink)', fontWeight: 650 }}>
                {m.primary}
              </p>
              <p className="cp-card__text">{m.secondary}</p>
            </CpCard>
          ))}
        </CpGrid>
      </CpSection>

      <CpSection mint eyebrow="Common Questions" title="FAQ">
        <CpGrid cols={1}>
          {FAQ_ITEMS.map((item) => (
            <CpCard key={item.q} title={item.q} text={item.a} />
          ))}
        </CpGrid>
      </CpSection>

      <CpCtaBanner
        title="Ready to start investing?"
        subtitle="Open an account online in minutes, no branch visit required."
        action={
          <CpButton onClick={onGetStarted}>
            Get Started
            <CpCtaArrow />
          </CpButton>
        }
      />
    </CpPage>
  );
}
