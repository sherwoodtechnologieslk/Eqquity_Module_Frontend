import React from 'react';
import './Styles/ManagerSelection.css';
import sherwoodMarkWireframe from './assets/sherwood-mark-wire-clean.png';
import { TREASURY_MANAGER_URL } from '../../constants/externalManagers';

const managerOptions = [
  {
    id: 'equity',
    eyebrow: 'Trading & accounting',
    title: 'Equity Manager',
    description: 'Manage portfolios, trades, valuations, corporate actions, and financial reporting.',
    highlights: ['Portfolios', 'Trades', 'Valuations', 'Reporting'],
    action: 'Enter',
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
    highlights: ['Funds', 'Clients', 'Performance', 'AUM'],
    action: 'Enter',
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
    highlights: ['G-Sec', 'Money market', 'Repo', 'Settlements'],
    action: 'Enter',
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
      <div className="manager-selection__shell">
        <aside className="manager-selection__brand-panel" aria-label="Sherwood">
          <div className="manager-selection__brand-glow" aria-hidden="true" />
          <img
            src={sherwoodMarkWireframe}
            alt=""
            className="manager-selection__brand-watermark"
            aria-hidden="true"
          />

          {!preAuth && onLogout && (
            <div className="manager-selection__brand-top">
              <button type="button" className="manager-selection__back" onClick={onLogout}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M13 10H4M8 6l-4 4 4 4" />
                </svg>
                Sign out
              </button>
            </div>
          )}

          <div className="manager-selection__brand-copy">
            <p className="manager-selection__kicker">
              <span className="manager-selection__kicker-dot" aria-hidden="true" />
              Sherwood Technologies
            </p>
            <div className="manager-selection__title-block">
              <h1 className="manager-selection__brand">Sherwood</h1>
              <p className="manager-selection__platform">
                <span className="manager-selection__platform-line" aria-hidden="true" />
                Platform
              </p>
            </div>
            <p className="manager-selection__lede">Select a manager to continue.</p>
          </div>
        </aside>

        <section className="manager-selection__panel">
          <header className="manager-selection__panel-head">
            <p className="manager-selection__panel-kicker">Workspace</p>
          </header>

          <div className="manager-selection__lanes" role="list">
            {managerOptions.map((option, i) => (
              <button
                type="button"
                role="listitem"
                className={`manager-lane manager-lane--${option.id}`}
                style={{ '--lane-delay': `${0.14 + i * 0.07}s` }}
                onClick={() => handleSelect(option)}
                key={option.id}
              >
                <span className="manager-lane__wash" aria-hidden="true" />

                <span className="manager-lane__main">
                  <span className="manager-lane__icon">{option.icon}</span>
                  <span className="manager-lane__body">
                    <span className="manager-lane__eyebrow">{option.eyebrow}</span>
                    <span className="manager-lane__title">{option.title}</span>
                    <span className="manager-lane__description">{option.description}</span>
                    <span className="manager-lane__tags">
                      {option.highlights.map((tag) => (
                        <span className="manager-lane__tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>

                <span className="manager-lane__cta">
                  <span className="manager-lane__cta-label">{option.action}</span>
                  <span className="manager-lane__arrow" aria-hidden="true">
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
      </div>
    </main>
  );
};

export default ManagerSelection;
