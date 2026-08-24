import React from 'react';
import './Styles/ManagerSelection.css';
import heroDesk from './assets/manager-hero-desk.png';
import { TREASURY_MANAGER_URL } from '../../constants/externalManagers';

const IconEquity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17.5 9.2 11.8 13 15.2 20 6.5" />
    <path d="M15.2 6.5H20V11" />
    <path d="M4 19.5h16" />
  </svg>
);

const IconWealth = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 18V10.5M10 18V7M15 18v-6.5M20 18V5.5" />
    <path d="M3.5 19.5h17" />
  </svg>
);

const IconTreasury = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="9" width="16" height="11" rx="1.6" />
    <path d="M8 9V7a4 4 0 0 1 8 0v2" />
    <path d="M4 13.5h16" />
    <circle cx="12" cy="16.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 10h11" />
    <path d="M11 5.5 15.5 10 11 14.5" />
  </svg>
);

const IconExternal = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 5.5H5.5A1.5 1.5 0 0 0 4 7v7.5A1.5 1.5 0 0 0 5.5 16H13a1.5 1.5 0 0 0 1.5-1.5V12" />
    <path d="M11 4h5v5" />
    <path d="M10 10 16 4" />
  </svg>
);

const managerOptions = [
  {
    id: 'equity',
    eyebrow: 'Trading & accounting',
    title: 'Equity Manager',
    description: 'Manage portfolios, trades, valuations, corporate actions, and financial reporting.',
    highlights: ['Portfolios', 'Trades', 'Valuations', 'Reporting'],
    action: 'Enter',
    icon: <IconEquity />,
  },
  {
    id: 'wealth',
    eyebrow: 'Funds & clients',
    title: 'Wealth Manager',
    description: 'Manage funds, client accounts, portfolios, performance, and assets under management.',
    highlights: ['Funds', 'Clients', 'Performance', 'AUM'],
    action: 'Enter',
    icon: <IconWealth />,
  },
  {
    id: 'treasury',
    eyebrow: 'Fixed income & markets',
    title: 'Treasury Manager',
    description:
      'Run government securities, T-bill, T-bond, money market, repo, and buyback desks, with maturity handling, settlements, and treasury reporting.',
    highlights: ['G-Sec', 'Money market', 'Repo', 'Settlements'],
    action: 'Enter',
    externalUrl: TREASURY_MANAGER_URL,
    icon: <IconTreasury />,
  },
];

const ManagerSelection = ({ onSelect, onLogout, preAuth = false }) => {
  const handleSelect = (option) => {
    if (option.externalUrl) {
      window.open(option.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onSelect(option.id);
  };

  return (
    <main className="ms-screen">
      <div className="ms-bg" aria-hidden="true">
        <img src={heroDesk} alt="" className="ms-bg__img" />
        <div className="ms-bg__wash" />
      </div>

      {!preAuth && onLogout ? (
        <button type="button" className="ms-logout" onClick={onLogout}>
          Sign out
        </button>
      ) : null}

      <div className="ms-shell">
        <section className="ms-content">
          <header className="ms-intro">
            <p className="ms-intro__eyebrow">Sherwood Platform</p>
          </header>

          <div className="ms-tiles" role="list">
            {managerOptions.map((option, i) => (
              <button
                type="button"
                role="listitem"
                className={`ms-tile ms-tile--${option.id}`}
                style={{ '--ms-delay': `${0.08 + i * 0.07}s` }}
                onClick={() => handleSelect(option)}
                key={option.id}
              >
                <span className="ms-tile__top">
                  <span className="ms-tile__index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ms-tile__icon" aria-hidden="true">
                    {option.icon}
                  </span>
                </span>

                <span className="ms-tile__eyebrow">{option.eyebrow}</span>
                <span className="ms-tile__title">{option.title}</span>
                <span className="ms-tile__desc">{option.description}</span>

                <span className="ms-tile__tags">
                  {option.highlights.map((tag) => (
                    <span className="ms-tile__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </span>

                <span className="ms-tile__cta">
                  <span>{option.action}</span>
                  <span className="ms-tile__arrow" aria-hidden="true">
                    {option.externalUrl ? <IconExternal /> : <IconArrow />}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ManagerSelection;
