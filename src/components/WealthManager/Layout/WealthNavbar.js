import React, { useEffect, useMemo, useRef } from 'react';
import './WealthLayout.css';

const WealthNavbar = ({ activeTab, visibleTabs = [], onTabChange, user, onOpenProfile }) => {
  const tabs = useMemo(() => visibleTabs, [visibleTabs]);
  const pillsRef = useRef(null);

  useEffect(() => {
    const active = pillsRef.current?.querySelector('.wm-pill.is-active');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTab, tabs]);

  return (
    <nav className="wm-navbar" aria-label="Wealth manager navigation">
      <div className="wm-navbar-inner">
        <div className="wm-navbar-brand">
          <div className="wm-navbar-brand-icon" aria-hidden="true">
            <svg className="wm-navbar-brand-logo" viewBox="0 0 20 20" fill="currentColor">
              <rect x="5.5" y="4.2" width="9" height="2.5" rx="1.25" />
              <rect x="3" y="8.75" width="14" height="2.5" rx="1.25" />
              <rect x="5.5" y="13.3" width="9" height="2.5" rx="1.25" />
            </svg>
          </div>
        </div>

        <div className="wm-navbar-center">
          <div className="wm-navbar-pills" role="tablist" ref={pillsRef}>
            {tabs.length === 0 ? (
              <span className="wm-navbar-empty">No tabs available</span>
            ) : (
              tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t}
                  onClick={() => onTabChange && onTabChange(t)}
                  className={`wm-pill${activeTab === t ? ' is-active' : ''}`}
                  title={t}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="wm-navbar-actions">
          <button
            type="button"
            onClick={onOpenProfile}
            title="User Profile"
            className="wm-avatar"
            aria-label="Open user profile"
          >
            {(user?.first_name?.[0] || 'U') + (user?.last_name?.[0] || '')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default WealthNavbar;
