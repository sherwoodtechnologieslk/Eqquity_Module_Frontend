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
import SIPCalculator from '../SIPCalculator';
import './Styles/PreOnboardingPlanner.css';

const BENEFITS = [
  {
    title: 'No market timing',
    text: 'Invest a fixed amount each month and stay invested through market cycles.',
  },
  {
    title: 'Build discipline',
    text: 'Automate saving habits with a monthly SIP from LKR 1,000.',
  },
  {
    title: 'Rupee cost averaging',
    text: 'Buy more units when prices are low and fewer when prices are high.',
  },
  {
    title: 'Compound over time',
    text: 'See how consistent contributions can grow with assumed long-term returns.',
  },
];

export default function PreOnboardingPlanner({ onGetStarted, onNavigate }) {
  return (
    <CpPage onNavigate={onNavigate} onGetStarted={onGetStarted}>
      <CpHero
        tone="land"
        eyebrow="Investment Planner"
        title="Plan your investments"
        lead="Use the SIP calculator to project monthly investing, then open an account when you are ready to start."
        actions={
          <CpButton onClick={onGetStarted}>
            Open an account
            <CpCtaArrow />
          </CpButton>
        }
      />

      <CpSection eyebrow="Why SIP" title="Invest regularly with purpose">
        <CpGrid cols={4}>
          {BENEFITS.map((b) => (
            <CpCard key={b.title} title={b.title} text={b.text} />
          ))}
        </CpGrid>
      </CpSection>

      <CpSection
        mint
        eyebrow="Calculator"
        title="Estimate your SIP"
        blurb="Illustrative only. Actual returns vary. Assumes 12% p.a. for projection."
      >
        <div className="cp-planner-embed">
          <SIPCalculator embedded onGetStarted={onGetStarted} />
        </div>
      </CpSection>

      <CpCtaBanner
        title="Ready to put your plan into action?"
        subtitle="Open an account online and set up subscriptions or SIPs from LKR 1,000."
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
