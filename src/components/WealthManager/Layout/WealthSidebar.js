import React, { useEffect, useMemo, useRef, useState } from 'react';
import { wealthManagerMenuItems } from '../../Home/Sidebar';
import SherwoodManagerMark from '../../Home/SherwoodManagerMark';
import './WealthSidebar.css';

const WealthSidebar = ({
  onSelect,
  activeIndex = 0,
  onLogout,
  onManagerChange,
}) => {
  const [active, setActive] = useState(activeIndex);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownButtonRef = useRef(null);

  const openClientPortal = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('clientPortal', '1');

    // Chrome routes same-origin target=_blank into the installed
    // "Create React App Sample" PWA window. localhost ↔ 127.0.0.1 are
    // different origins, so this opens a real browser tab instead.
    const host = url.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      url.hostname = host === 'localhost' ? '127.0.0.1' : 'localhost';
      const token = localStorage.getItem('token');
      if (token) {
        const handoff = {
          token,
          user: localStorage.getItem('user'),
          authSession: localStorage.getItem('authSession'),
        };
        url.searchParams.set(
          'cpHandoff',
          btoa(unescape(encodeURIComponent(JSON.stringify(handoff))))
        );
      }
    }

    const link = document.createElement('a');
    link.href = url.toString();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    setActive(activeIndex);
  }, [activeIndex]);

  const menuItems = useMemo(() => wealthManagerMenuItems, []);

  const handleClick = (i) => {
    setActive(i);
    if (onSelect && menuItems[i]) {
      onSelect(i, menuItems[i].subTopics || [], 'wealth');
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
      <div className="wm-sidebar__brand sidebar-brand">
        <div className="navbar-brand">
          <div className="brand-icon" aria-hidden="true">
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
                      className="dropdown-item dropdown-item--equity"
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
                    className="dropdown-item dropdown-item--wealth active"
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
            </div>
          </div>
        </div>

        <div className="wm-portal-entry">
          <div className="wm-portal-entry__meta">
            <span className="wm-portal-entry__label">Client access</span>
          </div>
          <button
            type="button"
            className="wm-portal-entry__btn"
            onClick={openClientPortal}
            title="Open Client Portal in a new tab"
          >
            <span className="wm-portal-entry__icon" aria-hidden>
              <svg fill="none" viewBox="0 0 20 20" width="15" height="15">
                <path
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 5H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3M11 3h6v6M10 10l7-7"
                />
              </svg>
            </span>
            <span className="wm-portal-entry__text">Client Portal</span>
            <span className="wm-portal-entry__chevron" aria-hidden>
              <svg fill="currentColor" viewBox="0 0 20 20" width="12" height="12">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>

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
