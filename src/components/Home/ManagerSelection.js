import React from 'react';
import './Styles/ManagerSelection.css';
import sherwoodMarkShadow from '../Auth/sherwood-mark-shadow-white.svg';

const TREASURY_MANAGER_URL = 'http://10.40.80.89/live1/login';

const managerOptions = [
  {
    id: 'equity',
    eyebrow: 'Trading & accounting',
    title: 'Equity Manager',
    description: 'Manage portfolios, trades, valuations, corporate actions, and financial reporting.',
    action: 'Enter Equity Manager',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="32" cy="13" r="7" />
        <path d="M32 9v8m-3-4h6" />
        <path d="M7 27h7l7 7h9c3 0 3-5 0-5h-7" />
        <path d="m14 27 5-4a4 4 0 0 1 5 0l5 5" />
        <path d="M7 26v13" />
        <path d="M14 38h18a6 6 0 0 0 5-3l5-8a3 3 0 0 0-5-1l-5 6" />
      </svg>
    ),
  },
  {
    id: 'wealth',
    eyebrow: 'Funds & clients',
    title: 'Wealth Manager',
    description: 'Manage funds, client accounts, portfolios, performance, and assets under management.',
    action: 'Enter Wealth Manager',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 38V23m10 15V15m10 23V27m10 11V8" />
        <path d="m7 17 10-8 10 8L39 5" />
      </svg>
    ),
  },
  {
    id: 'treasury',
    eyebrow: 'Fixed income & markets',
    title: 'Treasury Manager',
    description:
      'Run government securities, T-bill, T-bond, money market, repo, and buyback desks, with maturity handling, settlements, and treasury reporting.',
    action: 'Open Treasury Manager',
    externalUrl: TREASURY_MANAGER_URL,
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="14" width="32" height="22" rx="3" />
        <path d="M8 22h32" />
        <circle cx="24" cy="30" r="3.5" />
        <path d="M16 14V11a8 8 0 0 1 16 0v3" />
      </svg>
    ),
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
    <main className="manager-selection">
      {!preAuth && onLogout && (
        <button type="button" className="manager-selection__back" onClick={onLogout}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M13 10H4M8 6l-4 4 4 4" />
          </svg>
          Sign out
        </button>
      )}

      <section className="manager-selection__content">
        <div className="manager-selection__grid">
          {managerOptions.map((option) => (
            <button
              type="button"
              className={`manager-option manager-option--${option.id}`}
              onClick={() => handleSelect(option)}
              key={option.id}
            >
              <span className="manager-option__icon">{option.icon}</span>
              <span className="manager-option__eyebrow">{option.eyebrow}</span>
              <span className="manager-option__title">{option.title}</span>
              <span className="manager-option__description">{option.description}</span>
              <span className="manager-option__action">
                {option.action}
                <span aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    {option.externalUrl ? (
                      <>
                        <path d="M8 5H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3" />
                        <path d="M11 3h6v6" />
                        <path d="M10 10L17 3" />
                      </>
                    ) : (
                      <path d="M4 10h11M11 6l4 4-4 4" />
                    )}
                  </svg>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="manager-selection__footer">
        <img src={sherwoodMarkShadow} alt="" className="manager-selection__brand-mark" />
        <span className="manager-selection__brand-copy">Sherwood Technologies (Pvt) Ltd</span>
      </footer>
    </main>
  );
};

export default ManagerSelection;
