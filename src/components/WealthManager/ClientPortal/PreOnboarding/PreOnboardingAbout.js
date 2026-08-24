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
  CpStatRow,
} from '../shared/CpUi';

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
    <CpPage>
      <CpHero
        split
        eyebrow="Sherwood Wealth · About"
        title={
          <>
            Built for investors.
            <br />
            Driven by trust.
          </>
        }
        lead="We are a licensed investment management firm dedicated to helping individuals and institutions grow their wealth through professionally managed unit trust funds — with transparency, discipline, and a long-term perspective."
        actions={
          <CpButton onClick={onGetStarted}>
            Start Investing Today
            <CpCtaArrow />
          </CpButton>
        }
        aside={
          <CpPanel>
            <CpStatRow
              items={[
                { value: '15+', label: 'Years of Operation' },
                { value: '3', label: 'Active Funds' },
                { value: '10,000+', label: 'Investors Served' },
                { value: 'SEC', label: 'Regulated & Licensed' },
              ]}
            />
          </CpPanel>
        }
      />

      <CpSection>
        <CpGrid cols={2}>
          <CpCard variant="accent" title="Our Mission" text="To democratise wealth creation by providing every Sri Lankan investor — regardless of income level — access to professionally managed investment products that grow their savings over time." />
          <CpCard variant="mint" title="Our Vision" text="To be the most trusted name in unit trust investment management in Sri Lanka, known for consistent performance, investor education, and world-class digital access." />
        </CpGrid>
      </CpSection>

      <CpSection mint eyebrow="Our Values" title="What guides every decision we make">
        <CpGrid cols={4}>
          {VALUES.map((v) => (
            <CpCard key={v.title} icon={v.icon} title={v.title} text={v.desc} />
          ))}
        </CpGrid>
      </CpSection>

      <CpSection eyebrow="Our Journey" title="Milestones that shaped who we are">
        <div className="cp-timeline">
          {MILESTONES.map((m, i) => (
            <div key={m.year} className="cp-timeline__item">
              <div className="cp-timeline__year">{m.year}</div>
              <div className="cp-timeline__rail">
                <div className="cp-timeline__dot" />
                {i < MILESTONES.length - 1 ? <div className="cp-timeline__connector" /> : null}
              </div>
              <div className="cp-timeline__body">
                <div className="cp-timeline__title">{m.title}</div>
                <div className="cp-timeline__desc">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </CpSection>

      <CpSection mint eyebrow="Our Team" title="The people behind your portfolio">
        <CpGrid cols={3}>
          {TEAM.map((t) => (
            <CpCard
              key={t.name}
              icon={<span className="cp-team-avatar">{t.initial}</span>}
              title={t.name}
            >
              <span className="cp-eyebrow">{t.role}</span>
              <p className="cp-card__text">{t.desc}</p>
            </CpCard>
          ))}
        </CpGrid>
      </CpSection>

      <CpCtaBanner
        title="Ready to invest with a team you can trust?"
        subtitle="Open an account in minutes. No paperwork, no branch visits."
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
