import React, { useEffect, useMemo, useRef, useState } from 'react';
import { wealthManagerMenuItems } from '../../Home/Sidebar';
import SherwoodManagerMark from '../../Home/SherwoodManagerMark';
import './WealthSidebar.css';

const WealthSidebar = ({
  onSelect,
  activeIndex = 0,
  onLogout,
  onManagerChange,
  isClientView = false,
  onClientViewToggle,
}) => {
  const [active, setActive] = useState(activeIndex);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownButtonRef = useRef(null);

  useEffect(() => {
    setActive(activeIndex);
  }, [activeIndex]);

  const menuItems = useMemo(() => wealthManagerMenuItems, []);

  const handleClick = (i) => {
    setActive(i);
    if (onSelect && menuItems[i]) {
      onSelect(i, menuItems[i].subTopics || []);
    }
  };

  useEffect(() => {
    if (isDropdownOpen && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        !event.target.closest('.manager-dropdown-container') &&
        !event.target.closest('.manager-dropdown-menu')
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <aside className="wm-sidebar" aria-label="Wealth navigation">
      {/* Brand section — mirrors equity .sidebar-brand */}
      <div className="wm-sidebar__brand sidebar-brand">
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg className="brand-logo" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="brand-text-container">
            <div className="manager-dropdown-container">
              <button
                ref={dropdownButtonRef}
                className="app-name-switcher"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <SherwoodManagerMark tier="wealth" />
                <svg
                  className={`switch-icon ${isDropdownOpen ? 'open' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div
                  className="manager-dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  {onManagerChange && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onManagerChange('equity');
                      }}
                    >
                      <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="dropdown-item-brand">
                        <SherwoodManagerMark tier="equity" compact />
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="dropdown-item active"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M14 4a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2h6zm-1 3a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="dropdown-item-brand">
                      <SherwoodManagerMark tier="wealth" compact />
                    </span>
                    <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Client / Admin View toggle — mirrors equity .client-view-toggle */}
              {onClientViewToggle && (
                <div
                  className="client-view-toggle"
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.10)',
                    borderRadius: '0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onClientViewToggle(!isClientView)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: isClientView ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.30)',
                      borderRadius: '0',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                    title={isClientView ? 'Switch to Admin View' : 'Switch to Client View'}
                  >
                    {isClientView ? (
                      <>
                        <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Admin View</span>
                      </>
                    ) : (
                      <>
                        <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Client Portal</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu — mirrors equity .sidebar-content > .menu-section */}
      <div className="wm-sidebar__nav sidebar-content">
        <div className="menu-section">
          <h3 className="menu-title wm-sidebar__section-label">Navigation</h3>
          <ul className="wm-sidebar__list sidebar-menu">
            {menuItems.length > 0 ? (
              menuItems.map((item, i) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className={`wm-sidebar__item sidebar-item${active === i ? ' is-active active' : ''}`}
                    onClick={() => handleClick(i)}
                    aria-pressed={active === i}
                  >
                    <span className="wm-sidebar__icon-wrap item-icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="wm-sidebar__label item-text">{item.name}</span>
                    <span className="wm-sidebar__active-dot item-indicator" aria-hidden />
                  </button>
                </li>
              ))
            ) : (
              <li className="sidebar-empty-state">
                <span className="empty-state-text">Menu items coming soon...</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer — mirrors equity .sidebar-footer */}
      <div className="wm-sidebar__footer sidebar-footer">
        <div className="footer-content">
          {onLogout && (
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={onLogout}
              title="Logout"
            >
              <svg className="logout-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z" />
                <circle cx="12" cy="15" r="2" />
              </svg>
              <span className="logout-text">Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default WealthSidebar;
