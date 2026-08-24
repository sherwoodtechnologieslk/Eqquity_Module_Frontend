import React from 'react';
import './Styles/ClientNavbar.css';

const ClientNavbar = ({ activeTab, onTabChange, onBackToHome, variant = 'default', hideTabs = false }) => {
  const navItems = [
    { label: 'Home', key: 'home', tab: 'Dashboard' },
    { label: 'About', key: 'about', tab: 'About' },
    { label: 'Our Funds', key: 'our-funds', tab: 'Fund Information' },
    { label: 'Investment Planner', key: 'planner', tab: 'My Portfolio' },
    { label: 'Fund Documents', key: 'documents', tab: 'Statements' },
    { label: 'Contact', key: 'contact', tab: 'Contact' }
  ];

  const handleNavClick = (item) => {
    if (item.tab && onTabChange) {
      onTabChange(item.tab);
    }
  };

  const isItemActive = (item) => {
    if (item.tab && activeTab === item.tab) return true;
    return false;
  };

  return (
    <header className={`cp-navbar ${variant === 'gateway' ? 'cp-navbar-gateway' : ''}`}>
      <div className="cp-navbar-inner">
        <div className="cp-navbar-brand">
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
        </div>

        {!onBackToHome && !hideTabs && (
          <nav className="cp-navbar-links" aria-label="Main">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`cp-navbar-link ${isItemActive(item) ? 'cp-navbar-link-active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="cp-navbar-meta">
          {onBackToHome && (
            <button type="button" className="cp-navbar-back-btn" onClick={onBackToHome}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
              </svg>
              Back to Home
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ClientNavbar;
