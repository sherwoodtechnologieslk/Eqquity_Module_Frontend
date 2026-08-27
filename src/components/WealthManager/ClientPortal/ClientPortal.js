import React, { useState, useEffect } from 'react';
import ClientSidebar from './ClientSidebar';
import ClientNavbar, {
  hashToTab,
  setPublicHash,
  PUBLIC_PAGE_TITLES,
} from './ClientNavbar';
import ClientDashboard from './ClientGateway/ClientDashboard';
import MyPortfolio from './ClientGateway/MyPortfolio';
import Create from './ClientGateway/Create';
import Redeem from './ClientGateway/Redeem';
import Transfer from './ClientGateway/Transfer';
import Statements from './ClientGateway/Statements';
import ClientTransactions from './ClientGateway/ClientTransactions';
import FundInformation from './FundInformation';
import ClientSettings from './ClientGateway/ClientSettings';
import ClientSignupForm from './ClientOnboarding/ClientSignupForm';
import ClientContactForm from './ClientOnboarding/ClientContactForm';
import ClientEmploymentForm from './ClientOnboarding/ClientEmploymentForm';
import ClientBankForm from './ClientOnboarding/ClientBankForm';
import ClientAdditionalDetailsForm from './ClientOnboarding/ClientAdditionalDetailsForm';
import ClientOtherProductsForm from './ClientOnboarding/ClientOtherProductsForm';
import ClientDocumentUploadForm from './ClientOnboarding/ClientDocumentUploadForm';
import ClientVideoVerificationForm from './ClientOnboarding/ClientVideoVerificationForm';
import ClientSubmitForm from './ClientOnboarding/ClientSubmitForm';
import PreOnboardingHome from './PreOnboarding/PreOnboardingHome';
import PreOnboardingAbout from './PreOnboarding/PreOnboardingAbout';
import PreOnboardingFunds from './PreOnboarding/PreOnboardingFunds';
import PreOnboardingPlanner from './PreOnboarding/PreOnboardingPlanner';
import PreOnboardingFundDocuments from './PreOnboarding/PreOnboardingFundDocuments';
import PreOnboardingContact from './PreOnboarding/PreOnboardingContact';
import './Styles/ClientPortal.css';

const ClientPortal = ({ user, onLogout }) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PUBLIC_PAGE_TITLES.Dashboard;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const [showSignup, setShowSignup] = useState(true);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showEmploymentForm, setShowEmploymentForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [showOtherProductsForm, setShowOtherProductsForm] = useState(false);
  const [showDocumentUploadForm, setShowDocumentUploadForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [fundingStatus, setFundingStatus] = useState({
    isComplete: false,
    amount: null
  });
  const introFunds = [
    {
      id: 'EIF',
      code: 'EIF',
      name: 'Equity Income Fund (EIF)',
      category: 'Equity',
      riskLevel: 'Medium',
      riskMeterValue: 4,
      minInvestment: 1000,
      fundManager: 'Portfolio Management Team',
      launchDate: '2019-02-12',
      nav: 20.5463,
      buyPrice: 20.1021,
      sellPrice: 20.5463,
      lastUpdated: 'Today, 10:30 AM',
      dailyChangePercent: 0.35,
      objective:
        'The main objective of the fund is to generate returns from the share market whilst also preserving capital through disciplined equity and income investments.',
      benefits: [
        'Start with a small investment as low as LKR 1,000/-',
        'Withdraw anytime subject to dealing cut-off times',
        'Manage your investment portfolio through experienced portfolio managers',
        'Hold your investments under supervision of a trusted custodian'
      ],
      performance: { '1M': 2.1, '6M': 8.5, '1Y': 15.2, sinceInception: 52.4 },
      assetAllocation: [
        { name: 'Equity', percent: 55 },
        { name: 'Fixed Income', percent: 30 },
        { name: 'Cash', percent: 15 }
      ],
      investmentStrategy: 'Dynamic allocation between equity and fixed income to balance growth and capital preservation.',
      benchmark: 'CSE All Share Price Index',
      managementFee: '1.5% p.a.',
      exitFee: '0.5%',
      liquidity: 'T+2 (within 2 business days)',
      tag: 'Growth-oriented equity income strategy',
      recommendedHorizon: '3–5 years',
      similarFundIds: ['CMT', 'SBF']
    },
    {
      id: 'CMT',
      code: 'CMT',
      name: 'Cash Management Trust Fund (CMT)',
      category: 'Money Market',
      riskLevel: 'Low',
      riskMeterValue: 1,
      minInvestment: 1000,
      fundManager: 'Portfolio Management Team',
      launchDate: '2018-06-01',
      nav: 44.6913,
      buyPrice: 44.6913,
      sellPrice: 44.6913,
      lastUpdated: 'Today, 10:30 AM',
      dailyChangePercent: 0.02,
      objective:
        'The main objective of the fund is to generate returns above fixed deposit and bank savings rates by investing in a diversified portfolio of short-term fixed income securities.',
      benefits: [
        'Start with a small investment as low as LKR 1,000/-',
        'Daily liquidity with no long lock-in period',
        'A convenient alternative to your traditional savings account',
        'Professional management of your short-term cash'
      ],
      performance: { '1M': 0.6, '6M': 2.1, '1Y': 4.3, sinceInception: 8.6 },
      assetAllocation: [
        { name: 'Treasury Bills', percent: 50 },
        { name: 'Bank Deposits', percent: 35 },
        { name: 'Cash', percent: 15 }
      ],
      investmentStrategy: 'Short-term fixed income and money market instruments for capital preservation and liquidity.',
      benchmark: '7-Day FD Rate',
      managementFee: '0.75% p.a.',
      exitFee: 'Nil',
      liquidity: 'Same day',
      tag: 'An alternative to your savings account',
      recommendedHorizon: '1–12 months',
      similarFundIds: ['EIF', 'SBF']
    },
    {
      id: 'SBF',
      code: 'SBF',
      name: 'Sri Lanka Bond Fund (SBF)',
      category: 'Fixed Income / Bond',
      riskLevel: 'Low',
      riskMeterValue: 2,
      minInvestment: 1000,
      fundManager: 'Portfolio Management Team',
      launchDate: '2020-01-15',
      nav: 0.0799,
      buyPrice: 0.0799,
      sellPrice: 0.0799,
      lastUpdated: 'Today, 10:30 AM',
      dailyChangePercent: 0.01,
      objective:
        'The main objective of the fund is to generate secured returns from Sri Lanka Government Securities such as Treasury Bills and Treasury Bonds with different maturities.',
      benefits: [
        'Start with a small investment as low as LKR 1,000/-',
        'Exposure to Government Securities with a small investment',
        'Manage your investment portfolio through experienced portfolio managers',
        'Hold your investments under supervision of a trusted custodian'
      ],
      performance: { '1M': 0.5, '6M': 2.6, '1Y': 5.4, sinceInception: 12.5 },
      assetAllocation: [
        { name: 'Treasury Bills', percent: 45 },
        { name: 'Treasury Bonds', percent: 40 },
        { name: 'Cash', percent: 10 },
        { name: 'Corporate Bonds', percent: 5 }
      ],
      investmentStrategy: 'Invests in Sri Lanka Government Securities across maturities for stable income.',
      benchmark: 'Government Bond Index',
      managementFee: '1% p.a.',
      exitFee: '0.5%',
      liquidity: 'T+3 (within 3 business days)',
      tag: 'Access to Government Securities through a single fund',
      recommendedHorizon: '1–3 years',
      similarFundIds: ['EIF', 'CMT']
    }
  ];
  const [selectedIntroFundId, setSelectedIntroFundId] = useState(introFunds[0].id);
  const [fundDetailTab, setFundDetailTab] = useState('Overview');
  const [preOnboardingTab, setPreOnboardingTab] = useState(() => {
    try {
      return hashToTab(window.location.hash);
    } catch {
      return 'Dashboard';
    }
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);

  useEffect(() => {
    const applyHash = () => setPreOnboardingTab(hashToTab(window.location.hash));
    applyHash();
    window.addEventListener('hashchange', applyHash);
    window.addEventListener('popstate', applyHash);
    return () => {
      window.removeEventListener('hashchange', applyHash);
      window.removeEventListener('popstate', applyHash);
    };
  }, []);

  useEffect(() => {
    document.title = PUBLIC_PAGE_TITLES[preOnboardingTab] || PUBLIC_PAGE_TITLES.Dashboard;
  }, [preOnboardingTab]);

  useEffect(() => {
    if (showSignup) {
      document.body.classList.add('cp-public-active');
    } else {
      document.body.classList.remove('cp-public-active');
    }
    return () => document.body.classList.remove('cp-public-active');
  }, [showSignup]);

  // Client portal menu items
  const clientMenuItems = [
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      ),
      name: "Dashboard",
      subTopics: ["Dashboard"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
        </svg>
      ),
      name: "My Portfolio",
      subTopics: ["My Portfolio"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Create",
      subTopics: ["Create"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm4 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1zm-3 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Redeem",
      subTopics: ["Redeem"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v1a1 1 0 102 0V7a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 102 0V7a3 3 0 00-3-3H5zm0 7a1 1 0 00-1 1v1a1 1 0 01-1 1 1 1 0 100 2 3 3 0 003-3v-1a1 1 0 00-1-1zm5-1a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1zm-4 0a1 1 0 100 2h1a1 1 0 100-2H6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Transfer",
      subTopics: ["Transfer"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Statements",
      subTopics: ["Statements"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z"/>
          <path fillRule="evenodd" d="M14 4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8zm0 2H6v4h8V6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Transactions",
      subTopics: ["Transactions"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Fund Information",
      subTopics: ["Fund Information"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Settings",
      subTopics: ["Settings"]
    }
  ];

  const handleSidebarSelect = (index, subTopics) => {
    setActiveSidebarItem(index);
    if (Array.isArray(subTopics) && subTopics.length > 0) {
      setActiveTab(subTopics[0]);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    const sectionIndex = clientMenuItems.findIndex(
      (item) => item.subTopics && item.subTopics.includes(tabName)
    );
    if (sectionIndex >= 0) {
      setActiveSidebarItem(sectionIndex);
    }
  };

  const handleFundingComplete = (payload) => {
    const rawAmount =
      typeof payload?.amount === 'number'
        ? payload.amount
        : parseFloat(payload?.amount) || 0;

    const isComplete = rawAmount > 0;

    setFundingStatus({
      isComplete,
      amount: isComplete ? rawAmount : null
    });
  };

  // Onboarding steps (right-side stepper)
  const onboardingSteps = [
    { key: 'personal', label: 'Personal' },
    { key: 'contact', label: 'Contact' },
    { key: 'employment', label: 'Employment' },
    { key: 'bank', label: 'Bank & Fund' },
    { key: 'additional', label: 'Additional' },
    { key: 'other', label: 'T&C Agreement' },
    { key: 'documents', label: 'Documents' },
    { key: 'video', label: 'Video' },
    { key: 'submit', label: 'Complete' }
  ];

  const getCurrentOnboardingStep = () => {
    if (showPersonalForm) return 0;
    if (showContactForm) return 1;
    if (showEmploymentForm) return 2;
    if (showBankForm) return 3;
    if (showAdditionalForm) return 4;
    if (showOtherProductsForm) return 5;
    if (showDocumentUploadForm) return 6;
    if (showVideoForm) return 7;
    if (showSubmitForm) return 8;
    return null;
  };

  const goToOnboardingStep = (index) => {
    setShowPersonalForm(false);
    setShowContactForm(false);
    setShowEmploymentForm(false);
    setShowBankForm(false);
    setShowAdditionalForm(false);
    setShowOtherProductsForm(false);
    setShowDocumentUploadForm(false);
    setShowVideoForm(false);
    setShowSubmitForm(false);
    const steps = [
      () => setShowPersonalForm(true),
      () => setShowContactForm(true),
      () => setShowEmploymentForm(true),
      () => setShowBankForm(true),
      () => setShowAdditionalForm(true),
      () => setShowOtherProductsForm(true),
      () => setShowDocumentUploadForm(true),
      () => setShowVideoForm(true),
      () => setShowSubmitForm(true)
    ];
    if (index >= 0 && index < steps.length) steps[index]();
  };

  const renderOnboardingStepper = () => {
    const current = getCurrentOnboardingStep();
    if (current === null) return null;

    const stepIcons = [
      /* Personal - user */
      <svg key="0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>,
      /* Contact - map pin */
      <svg key="1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>,
      /* Employment - briefcase */
      <svg key="2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-1.352-7.43-2.308z"/></svg>,
      /* Bank - building */
      <svg key="3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.996.996 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 002.712-.654 1 1 0 011.083.02 3.946 3.946 0 003.41 0 1 1 0 011.083-.02A8.932 8.932 0 0014 14.935V17a1 1 0 001 1h2a1 1 0 001-1v-7.939a11.07 11.07 0 00-.712-4.06 1 1 0 01.712-1.36l.02-.02 2.15-.92a1 1 0 011.36.712 13.115 13.115 0 01.348 3.762 1 1 0 01-1.89.445 11.115 11.115 0 00-.25-3.762l-1.1.472-1.1-.472a1 1 0 01-.712-1.36A11.07 11.07 0 0018 9.061V7a1 1 0 00-1-1h-2a1 1 0 00-1 1v.939a11.07 11.07 0 01-.712 4.06 1 1 0 01.712 1.36l.02.02 2.15.92a1 1 0 11-.648 1.882l-1.502-.644a9.026 9.026 0 00-2.712.654V17z"/></svg>,
      /* Additional - clipboard list */
      <svg key="4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
      /* Other - document */
      <svg key="5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>,
      /* Documents - cloud upload */
      <svg key="6" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113 12.5H5.5z"/><path fillRule="evenodd" d="M8 9.5a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2A.5.5 0 008 9.5z" clipRule="evenodd"/><path fillRule="evenodd" d="M8 12.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5z" clipRule="evenodd"/></svg>,
      /* Video - camera */
      <svg key="7" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>,
      /* Submit - check circle */
      <svg key="8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
    ];

    const completedCount = current;

    return (
      <aside className="cp-onboarding-stepper">
        <div className="cp-onboarding-stepper-brand">
          <div className="cp-onboarding-stepper-brand-icon">
            <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="cp-onboarding-stepper-brand-text">
            <span className="cp-onboarding-stepper-brand-label">Onboarding</span>
            <span className="cp-onboarding-stepper-brand-sub">{completedCount} of {onboardingSteps.length} completed</span>
          </div>
        </div>

        <div className="cp-onboarding-stepper-progress-track">
          <div
            className="cp-onboarding-stepper-progress-fill"
            style={{ width: `${(completedCount / (onboardingSteps.length - 1)) * 100}%` }}
          />
        </div>

        <nav className="cp-onboarding-stepper-list">
          {onboardingSteps.map((step, idx) => {
            const isActive = idx === current;
            const isPast = idx < current;
            return (
              <button
                key={step.key}
                type="button"
                className={`cp-onboarding-step ${isActive ? 'cp-onboarding-step-active' : ''} ${isPast ? 'cp-onboarding-step-past' : ''}`}
                onClick={() => goToOnboardingStep(idx)}
                aria-label={step.label}
              >
                <span className="cp-onboarding-step-icon">
                  {isPast ? (
                    <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    stepIcons[idx]
                  )}
                </span>
                <div className="cp-onboarding-step-body">
                  <span className="cp-onboarding-step-num">Step {idx + 1}</span>
                  <span className="cp-onboarding-step-label">{step.label}</span>
                </div>
                {isActive && <span className="cp-onboarding-step-active-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="cp-onboarding-stepper-footer">
          <svg fill="currentColor" viewBox="0 0 20 20" width="14" height="14">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <span>Secure &amp; encrypted</span>
        </div>
      </aside>
    );
  };

  const wrapWithOnboardingLayout = (formContent) => (
    <>
      <ClientNavbar
        activeTab="Onboarding"
        user={user}
        onBackToHome={handleBackToHome}
      />
      <div className="cp-onboarding-layout">
        {renderOnboardingStepper()}
        <div className="cp-onboarding-main">{formContent}</div>
      </div>
    </>
  );

  // Tab component mappings
  const tabToComponent = {
    'Dashboard': <ClientDashboard />,
    'My Portfolio': <MyPortfolio />,
    'Create': <Create fundingStatus={fundingStatus} onFundingComplete={handleFundingComplete} />,
    'Redeem': <Redeem />,
    'Transfer': <Transfer />,
    'Statements': <Statements />,
    'Transactions': <ClientTransactions />,
    'Fund Information': <FundInformation />,
    'About': (
      <div className="cp-simple-page">
        <h2 className="cp-simple-page-title">About</h2>
        <p className="cp-simple-page-text">
          Welcome to Sherwood Wealth. Here you can explore our funds, track performance,
          and manage your investments in one place.
        </p>
      </div>
    ),
    'Contact': (
      <div className="cp-simple-page">
        <h2 className="cp-simple-page-title">Contact</h2>
        <p className="cp-simple-page-text">
          For assistance, please contact your relationship manager or reach us via the official support channels.
        </p>
      </div>
    ),
    'Settings': <ClientSettings user={user} />
  };

  const handleGetStarted = () => {
    setShowSignup(false);
    setShowPersonalForm(true);
  };

  const handleBackToHome = () => {
    setShowPersonalForm(false);
    setShowContactForm(false);
    setShowEmploymentForm(false);
    setShowBankForm(false);
    setShowAdditionalForm(false);
    setShowOtherProductsForm(false);
    setShowDocumentUploadForm(false);
    setShowVideoForm(false);
    setShowSubmitForm(false);
    setShowSignup(true);
    setPreOnboardingTab('Dashboard');
    setPublicHash('Dashboard');
    window.scrollTo(0, 0);
  };

  const handlePersonalFormNext = (data) => {
    // Store personal details and proceed to contact form
    setFormData(prev => ({ ...prev, ...data }));
    setShowPersonalForm(false);
    setShowContactForm(true);
  };

  const handleContactFormNext = (data) => {
    // Store contact details and proceed to employment form
    setFormData(prev => ({ ...prev, ...data }));
    setShowContactForm(false);
    setShowEmploymentForm(true);
  };

  const handleContactFormPrevious = () => {
    // Go back to personal details form
    setShowContactForm(false);
    setShowPersonalForm(true);
  };

  const handleEmploymentFormNext = (data) => {
    // Store employment details and proceed to bank & fund details form
    setFormData(prev => ({ ...prev, ...data }));
    setShowEmploymentForm(false);
    setShowBankForm(true);
  };

  const handleEmploymentFormPrevious = () => {
    // Go back to contact details form
    setShowEmploymentForm(false);
    setShowContactForm(true);
  };

  const handleBankFormNext = (data) => {
    // Store bank & fund details and proceed to additional details verification
    setFormData(prev => ({ ...prev, ...data }));
    setShowBankForm(false);
    setShowAdditionalForm(true);
  };

  const handleBankFormPrevious = () => {
    // Go back to employment details form
    setShowBankForm(false);
    setShowEmploymentForm(true);
  };

  const handleAdditionalFormNext = (data) => {
    // Store additional details and proceed to other investment products / T&C form
    setFormData(prev => ({ ...prev, ...data }));
    setShowAdditionalForm(false);
    setShowOtherProductsForm(true);
  };

  const handleAdditionalFormPrevious = () => {
    // Go back to bank & fund details form
    setShowAdditionalForm(false);
    setShowBankForm(true);
  };

  const handleOtherProductsFormNext = (data) => {
    // Store other products & equity selections and proceed to document upload
    setFormData(prev => ({ ...prev, ...data }));
    setShowOtherProductsForm(false);
    setShowDocumentUploadForm(true);
  };

  const handleOtherProductsFormPrevious = () => {
    // Go back to additional details verification form
    setShowOtherProductsForm(false);
    setShowAdditionalForm(true);
  };

  const handleDocumentUploadNext = (data) => {
    // Store document upload details and proceed to video verification
    setFormData(prev => ({ ...prev, ...data }));
    setShowDocumentUploadForm(false);
    setShowVideoForm(true);
  };

  const handleDocumentUploadPrevious = () => {
    // Go back to other investment products / T&C form
    setShowDocumentUploadForm(false);
    setShowOtherProductsForm(true);
  };

  const handleVideoFormNext = (data) => {
    // Store video verification acknowledgement and proceed to final submit screen
    setFormData(prev => ({ ...prev, ...data }));
    setShowVideoForm(false);
    setShowSubmitForm(true);
  };

  const handleVideoFormPrevious = () => {
    // Go back to document upload form
    setShowVideoForm(false);
    setShowDocumentUploadForm(true);
  };

  const handleSubmitFormPrevious = () => {
    // Go back to video verification form
    setShowSubmitForm(false);
    setShowVideoForm(true);
  };

  const handleSubmitFormSubmit = () => {
    // Final submission: for now just log and go to main client portal
    console.log('Final client portal signup data:', formData);
    setShowSubmitForm(false);
    // TODO: send data to backend
  };

  // Reusable funds view (Our Funds sidebar + fund detail + right panel). Used on signup intro and when "Our Funds" nav is selected in the portal.
  const renderFundsView = (opts) => {
    const { signupMode, onPrimaryAction } = opts;
    const selectedFund =
      introFunds.find((f) => f.id === selectedIntroFundId) || introFunds[0];

    return (
      <div className="cp-funds-intro-shell">
        {/* Left: Our Funds sidebar */}
        <aside className="cp-funds-sidebar">
          <div className="cp-funds-sidebar-title">Our Funds</div>
          <div className="cp-funds-sidebar-subtitle">
            Compare options and pick a fund that matches your risk profile.
          </div>
          <div className="cp-funds-list">
            {introFunds.map((fund) => {
              const isActive = fund.id === selectedIntroFundId;
              return (
                <button
                  key={fund.id}
                  type="button"
                  className={
                    isActive
                      ? 'cp-funds-list-item cp-funds-list-item-active'
                      : 'cp-funds-list-item'
                  }
                  onClick={() => { setSelectedIntroFundId(fund.id); setFundDetailTab('Overview'); }}
                >
                  <div className="cp-funds-list-top">
                    <span className="cp-funds-list-code">{fund.code}</span>
                    <span className="cp-funds-list-risk">{fund.riskLevel} Risk</span>
                  </div>
                  <span className="cp-funds-list-name">{fund.name}</span>
                  <div className="cp-funds-list-meta">
                    <span className="cp-funds-list-meta-item">{fund.category}</span>
                    <span className="cp-funds-list-meta-dot">•</span>
                    <span className="cp-funds-list-meta-item">
                      Min LKR {fund.minInvestment?.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

          {/* Middle: Tabbed fund detail layout */}
          <main className="cp-funds-main">
            <div className="cp-funds-main-inner">
              {/* Header: Fund name + NAV */}
              <div className="cp-fund-detail-header">
                <div className="cp-fund-detail-title-wrap">
                  <h1 className="cp-fund-detail-title">{selectedFund.name}</h1>
                  <div className="cp-fund-detail-subrow">
                    <span className="cp-fund-detail-pill">{selectedFund.category}</span>
                    <span className="cp-fund-detail-pill cp-fund-detail-pill-muted">{selectedFund.riskLevel} Risk</span>
                    <span className="cp-fund-detail-subtext">
                      Min investment: LKR {selectedFund.minInvestment?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="cp-fund-detail-nav-badge">
                  <span className="cp-fund-detail-nav-label">NAV</span>
                  <span className="cp-fund-detail-nav-value">{selectedFund.nav?.toFixed(4)}</span>
                  <span className={`cp-fund-detail-daily ${(selectedFund.dailyChangePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(selectedFund.dailyChangePercent ?? 0) >= 0 ? '+' : ''}{selectedFund.dailyChangePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Tab bar */}
              <div className="cp-fund-detail-tabs">
                {['Overview', 'Pricing', 'Performance', 'Allocation', 'Details', 'Documents'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`cp-fund-detail-tab ${fundDetailTab === tab ? 'active' : ''}`}
                    onClick={() => setFundDetailTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content panel */}
              <div className="cp-fund-detail-panel">
                {fundDetailTab === 'Overview' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block">
                      <h2 className="cp-fund-overview-block-title">At a glance</h2>
                      <div className="cp-fund-overview-grid">
                        <div className="cp-fund-overview-item">
                          <span className="cp-fund-overview-label">Category</span>
                          <span className="cp-fund-overview-value">{selectedFund.category}</span>
                        </div>
                        <div className="cp-fund-overview-item">
                          <span className="cp-fund-overview-label">Risk</span>
                          <span className="cp-fund-overview-value">{selectedFund.riskLevel}</span>
                        </div>
                        <div className="cp-fund-overview-item">
                          <span className="cp-fund-overview-label">Min. Investment</span>
                          <span className="cp-fund-overview-value">LKR {selectedFund.minInvestment?.toLocaleString()}</span>
                        </div>
                        <div className="cp-fund-overview-item">
                          <span className="cp-fund-overview-label">Fund Manager</span>
                          <span className="cp-fund-overview-value">{selectedFund.fundManager}</span>
                        </div>
                        <div className="cp-fund-overview-item">
                          <span className="cp-fund-overview-label">Launch Date</span>
                          <span className="cp-fund-overview-value">{selectedFund.launchDate}</span>
                        </div>
                      </div>
                    </section>

                    <section className="cp-fund-overview-block">
                      <h2 className="cp-fund-overview-block-title">Fund Objective</h2>
                      <p className="cp-fund-objective">{selectedFund.objective}</p>
                    </section>

                    <section className="cp-fund-overview-block">
                      <h2 className="cp-fund-overview-block-title">Key Benefits</h2>
                      <ul className="cp-fund-benefits-list">
                        {selectedFund.benefits.map((benefit, index) => (
                          <li key={index} className="cp-fund-benefit-item">{benefit}</li>
                        ))}
                      </ul>
                    </section>

                    <div className="cp-fund-actions-row">
                      <button type="button" className="cp-fund-action-btn cp-fund-action-primary" onClick={onPrimaryAction}>
                        Invest Now
                      </button>
                      <button type="button" className="cp-fund-action-btn cp-fund-action-secondary">Add to Watchlist</button>
                      <button type="button" className="cp-fund-action-btn cp-fund-action-secondary">Compare Funds</button>
                    </div>

                    <section className="cp-fund-overview-block cp-fund-similar-section">
                      <h2 className="cp-fund-overview-block-title">Similar Funds</h2>
                      <div className="cp-fund-similar-grid">
                        {(selectedFund.similarFundIds || [])
                          .map((id) => introFunds.find((f) => f.id === id))
                          .filter(Boolean)
                          .map((fund) => (
                            <button
                              key={fund.id}
                              type="button"
                              className="cp-fund-similar-card"
                              onClick={() => { setSelectedIntroFundId(fund.id); setFundDetailTab('Overview'); }}
                            >
                              <span className="cp-fund-similar-name">{fund.name}</span>
                              <span className="cp-fund-similar-tag">{fund.tag}</span>
                            </button>
                          ))}
                      </div>
                    </section>
                  </div>
                )}

                {fundDetailTab === 'Pricing' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block cp-fund-pricing-block">
                      <h2 className="cp-fund-overview-block-title">Live Fund Pricing</h2>
                      <div className="cp-fund-pricing-table">
                        <div className="cp-fund-pricing-row">
                          <span className="cp-fund-pricing-label">NAV</span>
                          <span className="cp-fund-pricing-value">{selectedFund.nav?.toFixed(4)}</span>
                        </div>
                        <div className="cp-fund-pricing-row">
                          <span className="cp-fund-pricing-label">Buy Price</span>
                          <span className="cp-fund-pricing-value">{selectedFund.buyPrice?.toFixed(4)}</span>
                        </div>
                        <div className="cp-fund-pricing-row">
                          <span className="cp-fund-pricing-label">Sell Price</span>
                          <span className="cp-fund-pricing-value">{selectedFund.sellPrice?.toFixed(4)}</span>
                        </div>
                        <div className="cp-fund-pricing-row">
                          <span className="cp-fund-pricing-label">Last Updated</span>
                          <span className="cp-fund-pricing-value">{selectedFund.lastUpdated}</span>
                        </div>
                        <div className="cp-fund-pricing-row cp-fund-pricing-row-highlight">
                          <span className="cp-fund-pricing-label">Daily Change</span>
                          <span className={`cp-fund-pricing-value cp-fund-daily-change ${(selectedFund.dailyChangePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                            {(selectedFund.dailyChangePercent ?? 0) >= 0 ? '+' : ''}{selectedFund.dailyChangePercent?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {fundDetailTab === 'Performance' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block cp-fund-performance-block">
                      <h2 className="cp-fund-overview-block-title">Fund Performance</h2>
                      <p className="cp-fund-performance-intro">Cumulative returns over different time periods (as of latest NAV).</p>
                      <div className="cp-fund-performance-grid">
                        <div className="cp-fund-performance-card">
                          <span className="cp-fund-performance-card-label">1 Month</span>
                          <span className="cp-fund-performance-card-value">{selectedFund.performance?.['1M'] ?? '–'}%</span>
                          <span className="cp-fund-performance-card-sublabel">Cumulative return</span>
                        </div>
                        <div className="cp-fund-performance-card">
                          <span className="cp-fund-performance-card-label">6 Months</span>
                          <span className="cp-fund-performance-card-value">{selectedFund.performance?.['6M'] ?? '–'}%</span>
                          <span className="cp-fund-performance-card-sublabel">Cumulative return</span>
                        </div>
                        <div className="cp-fund-performance-card">
                          <span className="cp-fund-performance-card-label">1 Year</span>
                          <span className="cp-fund-performance-card-value">{selectedFund.performance?.['1Y'] ?? '–'}%</span>
                          <span className="cp-fund-performance-card-sublabel">Cumulative return</span>
                        </div>
                        <div className="cp-fund-performance-card cp-fund-performance-card-featured">
                          <span className="cp-fund-performance-card-label">Since Inception</span>
                          <span className="cp-fund-performance-card-value">{selectedFund.performance?.sinceInception ?? '–'}%</span>
                          <span className="cp-fund-performance-card-sublabel">Total return to date</span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {fundDetailTab === 'Allocation' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block cp-fund-allocation-block">
                      <h2 className="cp-fund-overview-block-title">Asset Allocation</h2>
                      <p className="cp-fund-allocation-intro">Current portfolio mix by asset class.</p>
                      <div className="cp-fund-allocation-list">
                        {selectedFund.assetAllocation?.map((item, index) => (
                          <div key={index} className="cp-fund-allocation-row">
                            <div className="cp-fund-allocation-row-header">
                              <span className="cp-fund-allocation-label">{item.name}</span>
                              <span className="cp-fund-allocation-percent">{item.percent}%</span>
                            </div>
                            <div className="cp-fund-allocation-bar-wrap">
                              <div
                                className="cp-fund-allocation-bar"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="cp-fund-overview-block cp-fund-risk-block">
                      <h2 className="cp-fund-overview-block-title">Risk Level</h2>
                      <div className="cp-fund-risk-meter-wrap">
                        <div className="cp-fund-risk-meter">
                          <span className="cp-fund-risk-label">Low</span>
                          <div className="cp-fund-risk-track">
                            <div
                              className="cp-fund-risk-dot"
                              style={{ left: `${((selectedFund.riskMeterValue ?? 1) - 1) * 25}%` }}
                            />
                          </div>
                          <span className="cp-fund-risk-label">High</span>
                        </div>
                        <div className="cp-fund-risk-horizon-box">
                          <span className="cp-fund-risk-horizon-label">Recommended horizon</span>
                          <span className="cp-fund-risk-horizon">{selectedFund.recommendedHorizon}</span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {fundDetailTab === 'Details' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block cp-fund-details-strategy-block">
                      <h2 className="cp-fund-overview-block-title">Investment Strategy</h2>
                      <p className="cp-fund-details-strategy-text">{selectedFund.investmentStrategy}</p>
                    </section>
                    <section className="cp-fund-overview-block cp-fund-details-block">
                      <h2 className="cp-fund-overview-block-title">Fees &amp; Terms</h2>
                      <div className="cp-fund-details-grid">
                        <div className="cp-fund-details-card">
                          <span className="cp-fund-details-card-label">Benchmark</span>
                          <span className="cp-fund-details-card-value">{selectedFund.benchmark}</span>
                        </div>
                        <div className="cp-fund-details-card">
                          <span className="cp-fund-details-card-label">Management Fee</span>
                          <span className="cp-fund-details-card-value">{selectedFund.managementFee}</span>
                        </div>
                        <div className="cp-fund-details-card">
                          <span className="cp-fund-details-card-label">Exit Fee</span>
                          <span className="cp-fund-details-card-value">{selectedFund.exitFee}</span>
                        </div>
                        <div className="cp-fund-details-card">
                          <span className="cp-fund-details-card-label">Liquidity</span>
                          <span className="cp-fund-details-card-value">{selectedFund.liquidity}</span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {fundDetailTab === 'Documents' && (
                  <div className="cp-fund-overview-layout">
                    <section className="cp-fund-overview-block cp-fund-documents-block">
                      <h2 className="cp-fund-overview-block-title">Fund Documents</h2>
                      <p className="cp-fund-documents-intro">Download key documents for this fund.</p>
                      <div className="cp-fund-documents-grid">
                        <button type="button" className="cp-fund-doc-card">
                          <span className="cp-fund-doc-card-icon" aria-hidden="true">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </span>
                          <span className="cp-fund-doc-card-title">Fund Fact Sheet</span>
                          <span className="cp-fund-doc-card-desc">Summary and key facts</span>
                        </button>
                        <button type="button" className="cp-fund-doc-card">
                          <span className="cp-fund-doc-card-icon" aria-hidden="true">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </span>
                          <span className="cp-fund-doc-card-title">Prospectus</span>
                          <span className="cp-fund-doc-card-desc">Full offering document</span>
                        </button>
                        <button type="button" className="cp-fund-doc-card">
                          <span className="cp-fund-doc-card-icon" aria-hidden="true">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </span>
                          <span className="cp-fund-doc-card-title">Monthly Report</span>
                          <span className="cp-fund-doc-card-desc">Latest performance report</span>
                        </button>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right: Fund snapshot + signup call-to-action */}
          <div className="cp-funds-right">
            <div className="cp-fund-snapshot-card">
              <div className="cp-fund-snapshot-header">
                <div className="cp-fund-badge">{selectedFund.code}</div>
                <div className="cp-fund-date-block">
                  <div className="cp-fund-date-label">As of</div>
                  <div className="cp-fund-date-value">{selectedFund.lastUpdated}</div>
                </div>
              </div>
              <div className="cp-fund-price-row cp-fund-price-nav">
                <div className="cp-fund-price-item">
                  <div className="cp-fund-price-label">NAV</div>
                  <div className="cp-fund-price-value cp-fund-nav-value">
                    {selectedFund.nav?.toFixed(4)}
                  </div>
                </div>
                <div className={`cp-fund-daily-badge ${(selectedFund.dailyChangePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(selectedFund.dailyChangePercent ?? 0) >= 0 ? '+' : ''}{selectedFund.dailyChangePercent?.toFixed(2)}%
                </div>
              </div>
              <div className="cp-fund-price-row">
                <div className="cp-fund-price-item">
                  <div className="cp-fund-price-label">Buy Price</div>
                  <div className="cp-fund-price-value">
                    {selectedFund.buyPrice?.toFixed(4)}
                  </div>
                </div>
                <div className="cp-fund-price-item">
                  <div className="cp-fund-price-label">Sell Price</div>
                  <div className="cp-fund-price-value">
                    {selectedFund.sellPrice?.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="cp-fund-tagline">
                <span>{selectedFund.tag}</span>
              </div>
              <div className="cp-funds-right-cta">
                <div className="cp-intro-badge">Sherwood Wealth</div>
                {signupMode ? (
                  <>
                    <h2 className="cp-intro-title">Signup for this Product</h2>
                    <p className="cp-intro-subtitle">
                      Get secure, real-time access to your unit trust portfolios, performance,
                      and statements in one modern client portal.
                    </p>
                    <button
                      className="cp-intro-button"
                      type="button"
                      onClick={onPrimaryAction}
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="cp-intro-title">Invest in this fund</h2>
                    <p className="cp-intro-subtitle">
                      Add this fund to your portfolio or create a new investment from the Create tab.
                    </p>
                    <button
                      className="cp-intro-button"
                      type="button"
                      onClick={onPrimaryAction}
                    >
                      Go to Create
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
    );
  };

  const goToPublicTab = (tab) => {
    setPreOnboardingTab(tab);
    setPublicHash(tab);
    window.scrollTo(0, 0);
  };

  const renderPreOnboardingContent = () => {
    if (preOnboardingTab === 'Fund Information') {
      return <PreOnboardingFunds onGetStarted={handleGetStarted} onNavigate={goToPublicTab} />;
    }

    if (preOnboardingTab === 'Dashboard') {
      return (
        <PreOnboardingHome
          onGetStarted={handleGetStarted}
          onViewFunds={() => goToPublicTab('Fund Information')}
          onNavigate={goToPublicTab}
        />
      );
    }

    if (preOnboardingTab === 'About') {
      return <PreOnboardingAbout onGetStarted={handleGetStarted} onNavigate={goToPublicTab} />;
    }

    if (preOnboardingTab === 'My Portfolio') {
      return <PreOnboardingPlanner onGetStarted={handleGetStarted} onNavigate={goToPublicTab} />;
    }

    if (preOnboardingTab === 'Statements') {
      return <PreOnboardingFundDocuments onGetStarted={handleGetStarted} onNavigate={goToPublicTab} />;
    }

    if (preOnboardingTab === 'Contact') {
      return <PreOnboardingContact onGetStarted={handleGetStarted} onNavigate={goToPublicTab} />;
    }

    return (
      <PreOnboardingHome
        onGetStarted={handleGetStarted}
        onViewFunds={() => goToPublicTab('Fund Information')}
        onNavigate={goToPublicTab}
      />
    );
  };

  // Show signup intro screen (funds + signup CTA)
  if (showSignup) {
    return (
      <div className="cp-public">
        <ClientNavbar
          activeTab={preOnboardingTab}
          onTabChange={goToPublicTab}
          onGetStarted={handleGetStarted}
          user={user}
        />
        <main className="cp-public-main">{renderPreOnboardingContent()}</main>
      </div>
    );
  }

  // Show personal details form
  if (showPersonalForm) {
    return wrapWithOnboardingLayout(<ClientSignupForm onNext={handlePersonalFormNext} initialData={formData} />);
  }

  // Show contact details form
  if (showContactForm) {
    return wrapWithOnboardingLayout(
      <ClientContactForm 
        onNext={handleContactFormNext} 
        onPrevious={handleContactFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show employment details form
  if (showEmploymentForm) {
    return wrapWithOnboardingLayout(
      <ClientEmploymentForm 
        onNext={handleEmploymentFormNext} 
        onPrevious={handleEmploymentFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show bank & fund details form
  if (showBankForm) {
    return wrapWithOnboardingLayout(
      <ClientBankForm
        onNext={handleBankFormNext}
        onPrevious={handleBankFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show additional details verification form
  if (showAdditionalForm) {
    return wrapWithOnboardingLayout(
      <ClientAdditionalDetailsForm
        onNext={handleAdditionalFormNext}
        onPrevious={handleAdditionalFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show other investment products / T&C form
  if (showOtherProductsForm) {
    return wrapWithOnboardingLayout(
      <ClientOtherProductsForm
        onNext={handleOtherProductsFormNext}
        onPrevious={handleOtherProductsFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show document upload form
  if (showDocumentUploadForm) {
    return wrapWithOnboardingLayout(
      <ClientDocumentUploadForm
        onNext={handleDocumentUploadNext}
        onPrevious={handleDocumentUploadPrevious}
        initialData={formData}
      />
    );
  }

  // Show video verification form
  if (showVideoForm) {
    return wrapWithOnboardingLayout(
      <ClientVideoVerificationForm
        onNext={handleVideoFormNext}
        onPrevious={handleVideoFormPrevious}
      />
    );
  }

  // Show final submit confirmation form
  if (showSubmitForm) {
    return wrapWithOnboardingLayout(
      <ClientSubmitForm
        onPrevious={handleSubmitFormPrevious}
        onSubmit={handleSubmitFormSubmit}
      />
    );
  }

  return (
    <div className="cp-root">
      <ClientSidebar
        menuItems={clientMenuItems}
        onSelect={handleSidebarSelect}
        activeIndex={activeSidebarItem}
        onLogout={onLogout}
        user={user}
      />
      <div className="cp-main">
        <ClientNavbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          onLogout={onLogout}
          variant="gateway"
          hideTabs
        />
        <div className="cp-content">
          {activeTab === 'Fund Information' ? (
            <div className="cp-funds-intro-root cp-funds-in-portal">
              {renderFundsView({ signupMode: false, onPrimaryAction: () => handleTabChange('Create') })}
            </div>
          ) : tabToComponent[activeTab] || (
            <div className="cp-not-found">
              <h3>Page Not Found</h3>
              <p>The requested page is not available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
