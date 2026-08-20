import React from 'react';
import './Styles/premiumModal.css';

const DEFAULT_BENEFITS = [
  'Unlimited GL Accounts',
  'Advanced Reporting',
  'Portfolio Analytics',
  'Priority Support',
];

const VARIANT_COPY = {
  default: {
    featureName: 'this feature',
    comingSoon: false,
    benefits: DEFAULT_BENEFITS,
  },
  wealth: {
    featureName: 'Sherwood Wealth',
    comingSoon: true,
    benefits: [
      'Wealth management workspace',
      'Client operations & onboarding',
      'Fund tools & NAV management',
      'Priority support & onboarding',
    ],
  },
  clientPortal: {
    featureName: 'Sherwood Wealth Client Portal',
    comingSoon: true,
    benefits: [
      'Client onboarding & digital KYC',
      'Portfolio view & fund documents',
      'Investment planner & statements',
      'Secure client self-service access',
    ],
  },
  portfolioTransfers: {
    featureName: 'Portfolio Transfers',
    comingSoon: true,
    benefits: [
      'Advanced portfolio analytics',
      'Priority support & onboarding',
      'Broker & custodian integrations',
    ],
  },
  integrationAutomation: {
    featureName: 'Integration and Automation',
    comingSoon: true,
    benefits: [
      'Broker & custodian integrations',
      'Automated trade feed & reconciliation',
      'Accounting system interface',
      'Priority support & onboarding',
    ],
  },
  riskLimitManagement: {
    featureName: 'Risk and Limit Management',
    comingSoon: true,
    benefits: [
      'Counterparty & position limit controls',
      'Concentration risk monitoring',
      'Real-time breach alerts',
      'Priority support & onboarding',
    ],
  },
  reportingCompliance: {
    featureName: 'Reporting and Compliance',
    comingSoon: true,
    benefits: [
      'Daily holdings & P&L reporting',
      'Trade blotter & audit trail',
      'Compliance-ready export packs',
      'Priority support & onboarding',
    ],
  },
  portfolioMonitoring: {
    featureName: 'Portfolio Monitoring',
    comingSoon: true,
    benefits: [
      'Holdings dashboard & live portfolio view',
      'Performance metrics & benchmarking',
      'Sector & exposure analysis',
      'Priority support & onboarding',
    ],
  },
  ipo: {
    featureName: 'IPO',
    comingSoon: true,
    benefits: [
      'IPO entry & subscription management',
      'Allocation & lot distribution',
      'Refund processing & reconciliation',
      'Priority support & onboarding',
    ],
  },
  tradeCore: {
    featureName: 'TradeCore',
    comingSoon: true,
    benefits: [
      'Advanced trade capture & execution',
      'Real-time trade monitoring',
      'Deal slip & confirmation workflow',
      'Priority support & onboarding',
    ],
  },
  corporateActions: {
    featureName: 'Corporate Actions',
    comingSoon: true,
    benefits: [
      'Dividend processing & tracking',
      'Stock split & reverse split handling',
      'Automated position adjustments',
      'Priority support & onboarding',
    ],
  },
  securityIdentity: {
    featureName: 'Security Identity',
    comingSoon: true,
    benefits: [
      'Merger & acquisition handling',
      'Spin-off & demerger processing',
      'Ticker / ISIN change management',
      'Priority support & onboarding',
    ],
  },
  voluntaryCorporateActions: {
    featureName: 'Voluntary Corporate Actions',
    comingSoon: true,
    benefits: [
      'Rights issue & buyback processing',
      'Tender offer management',
      'Dividend option elections',
      'Priority support & onboarding',
    ],
  },
  mandatoryCorporateActions: {
    featureName: 'Mandatory Corporate Actions',
    comingSoon: true,
    benefits: [
      'Mandatory dividend processing',
      'Splits, bonus & rights issue handling',
      'Pending dividend tracking',
      'Priority support & onboarding',
    ],
  },
  chartsAndInsights: {
    featureName: 'Charts and Insights',
    comingSoon: true,
    benefits: [
      'Live CSE ASPI & market index tracking',
      'Sector index performance & analysis',
      'Interactive market charts & insights',
      'Priority support & onboarding',
    ],
  },
};

const PremiumDiamondIcon = () => (
  <svg
    className="em-premium-modal-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2.5L4.5 9.5L12 21.5L19.5 9.5L12 2.5Z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 9.5H19.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M8.5 9.5L12 2.5L15.5 9.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M12 21.5V9.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const PremiumModal = ({
  isOpen,
  onClose,
  onContactSales,
  variant = 'default',
  featureName,
}) => {
  if (!isOpen) return null;

  const variantCopy = VARIANT_COPY[variant] || VARIANT_COPY.default;
  const resolvedFeatureName = featureName || variantCopy.featureName;
  const { comingSoon, benefits } = variantCopy;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="em-premium-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="em-premium-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="em-premium-modal-title"
      >
        <div className="em-premium-modal-header">
          <button
            type="button"
            className="em-premium-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

          <div className="em-premium-modal-icon-wrapper">
            <span className="em-premium-modal-icon-glow" aria-hidden="true" />
            <PremiumDiamondIcon />
          </div>
          <h2 id="em-premium-modal-title" className="em-premium-modal-title">
            Unlock Premium
          </h2>
        </div>

        <div className="em-premium-modal-content">
          <p className="em-premium-modal-feature-label">You&apos;re trying to access</p>
          <p className="em-premium-modal-feature-name">{resolvedFeatureName}</p>

          {comingSoon ? (
            <>
              <p className="em-premium-modal-message">
                This feature is coming soon.
              </p>
              <p className="em-premium-modal-submessage">
                Upgrade to Premium to receive it as soon as it launches.
              </p>
            </>
          ) : (
            <p className="em-premium-modal-message">
              This feature is available exclusively with the{' '}
              <span className="em-premium-modal-plan-pill">Premium Plan</span>.
            </p>
          )}

          {comingSoon && (
            <p className="em-premium-modal-plan-row">
              Available in{' '}
              <span className="em-premium-modal-plan-pill">Premium Plan</span>
            </p>
          )}

          <div className="em-premium-modal-benefits">
            <p className="em-premium-modal-benefits-title">Premium includes</p>
            <ul className="em-premium-modal-benefits-list">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="em-premium-modal-actions">
          <button
            type="button"
            className="em-premium-modal-btn-primary"
            onClick={onContactSales}
          >
            Upgrade Now
          </button>
          <button
            type="button"
            className="em-premium-modal-btn-secondary"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>

        <div className="em-premium-modal-footer">
          <p className="em-premium-modal-footer-text">
            Have questions?{' '}
            <button
              type="button"
              className="em-premium-modal-footer-link"
              onClick={onContactSales}
            >
              Contact Sales
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
