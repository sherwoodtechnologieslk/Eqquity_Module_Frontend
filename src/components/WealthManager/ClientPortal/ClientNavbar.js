import React from 'react';
import SherwoodManagerMark from '../../Home/SherwoodManagerMark';
import './Styles/ClientNavbar.css';

export const PUBLIC_NAV_ITEMS = [
  { label: 'Home', navLabel: 'Home', key: 'home', tab: 'Dashboard' },
  { label: 'About', navLabel: 'About', key: 'about', tab: 'About' },
  { label: 'Our Funds', navLabel: 'Funds', key: 'funds', tab: 'Fund Information' },
  { label: 'Investment Planner', navLabel: 'Planner', key: 'planner', tab: 'My Portfolio' },
  { label: 'Fund Documents', navLabel: 'Documents', key: 'documents', tab: 'Statements' },
  { label: 'Contact', navLabel: 'Contact', key: 'contact', tab: 'Contact' },
];

export const PUBLIC_PAGE_TITLES = {
  Dashboard: 'Sherwood Wealth',
  About: 'About · Sherwood Wealth',
  'Fund Information': 'Our Funds · Sherwood Wealth',
  'My Portfolio': 'Investment Planner · Sherwood Wealth',
  Statements: 'Fund Documents · Sherwood Wealth',
  Contact: 'Contact · Sherwood Wealth',
};

export const hashToTab = (hash) => {
  const raw = String(hash || '')
    .replace(/^#/, '')
    .trim()
    .toLowerCase();
  const aliases = { 'our-funds': 'funds' };
  const key = aliases[raw] || raw || 'home';
  return PUBLIC_NAV_ITEMS.find((item) => item.key === key)?.tab || 'Dashboard';
};

export const tabToHash = (tab) => PUBLIC_NAV_ITEMS.find((item) => item.tab === tab)?.key || 'home';

export const setPublicHash = (tab) => {
  if (typeof window === 'undefined') return;
  const next = `#${tabToHash(tab)}`;
  if (window.location.hash === next) return;
  const url = new URL(window.location.href);
  url.hash = tabToHash(tab);
  window.history.pushState(null, '', url);
};

const ClientNavbar = ({
  activeTab,
  onTabChange,
  onBackToHome,
  variant = 'default',
  hideTabs = false,
}) => {
  const handleNavClick = (item) => {
    if (item.tab && onTabChange) {
      onTabChange(item.tab);
    }
  };

  const isItemActive = (item) => item.tab && activeTab === item.tab;
  const goHome = () => {
    if (onTabChange) onTabChange('Dashboard');
    else onBackToHome?.();
  };

  return (
    <header className={`cp-navbar ${variant === 'gateway' ? 'cp-navbar-gateway' : 'cp-navbar-site'}`}>
      <div className="cp-navbar-inner">
        <button type="button" className="cp-navbar-brand" onClick={goHome} aria-label="Sherwood Wealth">
          <div className="cp-navbar-brand-icon" aria-hidden="true">
            <svg className="cp-navbar-brand-logo" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <SherwoodManagerMark tier="wealth" />
        </button>

        {!onBackToHome && !hideTabs && (
          <nav className="cp-navbar-links" aria-label="Primary">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`cp-navbar-link ${isItemActive(item) ? 'cp-navbar-link-active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                {item.navLabel || item.label}
              </button>
            ))}
          </nav>
        )}

        {onBackToHome ? (
          <div className="cp-navbar-meta">
            <button type="button" className="cp-navbar-back-btn" onClick={onBackToHome}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Home
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default ClientNavbar;
