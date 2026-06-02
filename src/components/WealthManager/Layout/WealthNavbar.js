import React, { useMemo } from 'react';
import './WealthLayout.css';

const WealthNavbar = ({ activeTab, visibleTabs = [], onTabChange, user, onOpenProfile }) => {
  const tabs = useMemo(() => visibleTabs, [visibleTabs]);

  return (
    <div className="wm-navbar">
      <div style={{ minWidth: 220 }}>
        <div className="wm-navbar-title">{activeTab || 'Wealth Manager'}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="wm-navbar-pills">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange && onTabChange(t)}
              className={`wm-pill ${activeTab === t ? 'is-active' : ''}`}
              title={t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ minWidth: 360, display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
        <div className="wm-kpi-chip">
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>AUM</div>
            <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>—</div>
          </div>
          <div style={{ width: 1, height: 22, background: 'rgba(15,23,42,0.10)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Clients</div>
            <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>—</div>
          </div>
          <div style={{ width: 1, height: 22, background: 'rgba(15,23,42,0.10)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Funds</div>
            <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>—</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          title="User Profile"
          className="wm-avatar"
        >
          {(user?.first_name?.[0] || 'U') + (user?.last_name?.[0] || '')}
        </button>
      </div>
    </div>
  );
};

export default WealthNavbar;

