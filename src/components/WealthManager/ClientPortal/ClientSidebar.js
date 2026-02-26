import React from 'react';
import './Styles/ClientSidebar.css';

const ClientSidebar = ({ menuItems, onSelect, activeIndex, onLogout, user }) => {
  return (
    <div className="cp-sidebar">
      <div className="cp-sidebar-header">
        <div className="cp-logo">
          <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
          </svg>
          <span className="cp-logo-text">Client Portal</span>
        </div>
      </div>

      <div className="cp-sidebar-content">
        <div className="cp-user-info">
          <div className="cp-user-avatar">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="cp-user-details">
            <div className="cp-user-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="cp-user-email">{user?.email}</div>
          </div>
        </div>

        <nav className="cp-nav">
          {menuItems.map((item, index) => (
            <div key={index} className="cp-nav-section">
              <button
                className={`cp-nav-item ${activeIndex === index ? 'active' : ''}`}
                onClick={() => onSelect(index, item.subTopics)}
              >
                <span className="cp-nav-icon">{item.icon}</span>
                <span className="cp-nav-text">{item.name}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="cp-sidebar-footer">
        <button className="cp-logout-btn" onClick={onLogout}>
          <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm12 1v12H4V4h11z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M9.293 9.293a1 1 0 011.414 0L12 10.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd"/>
            <path d="M9 13a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ClientSidebar;
