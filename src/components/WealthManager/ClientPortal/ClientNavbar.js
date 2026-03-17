import React from 'react';
import './Styles/ClientNavbar.css';

const ClientNavbar = ({ activeTab, onTabChange, user, onLogout, onBackToHome, variant = 'default', hideTabs = false }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

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
        <div className="cp-navbar-logo-mark">
          <div className="cp-logo-wealth-wordmark">
            <span className="cp-logo-wealth-text">WEALTH</span>
            <span className="cp-logo-plus-wrap">
              <span className="cp-logo-plus-glow" />
              <span className="cp-logo-plus-text">+</span>
            </span>
          </div>
          <div className="cp-logo-tagline-row">
            <span className="cp-logo-rule cp-logo-rule-left" />
            <span className="cp-logo-diamond" />
            <span className="cp-logo-rule cp-logo-rule-right" />
          </div>
          <div className="cp-logo-tagline">
            Wealth Management · Refined
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
          <div className="cp-navbar-time">
            <span className="cp-time-display">{formatTime(currentTime)}</span>
            <span className="cp-date-display">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientNavbar;
