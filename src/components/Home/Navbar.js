import React, { useState, useEffect, useRef } from 'react';
import './Styles/Navbar.css';
import ThemeToggle from '../Common/ThemeToggle';

const Navbar = ({ activeTab, onTabChange, visibleTabs = [], user, onLogout, onOpenProfile, navBackdrop = null, fullWidth = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navbarRef = useRef(null);

  // All possible tabs with their properties
  const allTabDefinitions = {
    'Dashboard': {
      className: 'nav-dashboard',
      description: 'Main dashboard overview',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    'Holiday Calendar': {
      className: 'nav-calendar',
      description: 'View holidays on calendar',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
          <path d="M5 8h10v2H5V8zm0 4h6v2H5v-2z" />
        </svg>
      )
    },
    'Funds Centers': {
      className: 'nav-funds-centers',
      description: 'Manage funds centers',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      )
    },
    'View Map': {
      className: 'nav-view-map',
      description: 'View funds centers on map',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 17V7a1 1 0 00-.293-.707z" clipRule="evenodd"/>
        </svg>
      )
    },
    'Buy': {
      className: 'nav-buy',
      description: 'Purchase securities',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
      )
    },
    'Sell': {
      className: 'nav-sell',
      description: 'Sell securities',
      icon: (
        <svg className="tab-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )
    }
    
    // Add more entries as needed...
  };

  const tabs = visibleTabs.map(name => ({
    name,
    className: allTabDefinitions[name]?.className || 'nav-default',
    icon: allTabDefinitions[name]?.icon || <></>,
    description: allTabDefinitions[name]?.description || ''
  }));

  const displayTabName = (name) => name;

  // Scroll and mouse handlers (unchanged)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };
    const navbar = navbarRef.current;
    if (navbar) {
      navbar.addEventListener('mousemove', handleMouseMove);
      return () => navbar.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    const activeButton = navbarRef.current?.querySelector('.nav-button.active');
    if (activeButton && typeof activeButton.scrollIntoView === 'function') {
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTab]);

  const handleTabClick = (tabName) => {
    setTimeout(() => onTabChange(tabName), 100);
  };

  const handleTabHover = (tabName) => setHoveredTab(tabName);
  const handleTabLeave = () => setHoveredTab(null);

  // Keep the navbar feeling premium by avoiding mouse-driven 3D transforms.
  // Mouse position is still used for the subtle overlay highlight.
  const getDynamicStyles = () => ({});

  const createRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-effect 0.6s ease-out;
      pointer-events: none;
      z-index: 0;
    `;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <nav
      ref={navbarRef}
      className={['main-navbar', isScrolled && 'scrolled', navBackdrop && `main-navbar--${navBackdrop}`, fullWidth && 'main-navbar--home']
        .filter(Boolean)
        .join(' ')}
      style={getDynamicStyles()}
    >
      <div className="navbar-container">
        {fullWidth && onLogout ? (
          <button
            type="button"
            className="nav-home-logout"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <path d="M10 17l-5-5 5-5" />
              <path d="M15 12H3" />
            </svg>
            <span>Logout</span>
          </button>
        ) : null}

        <ul className="nav-list">
          {tabs.map(tab => (
            <li key={tab.name} className="nav-item">
              <button
                className={`nav-button ${tab.className} ${activeTab === tab.name ? 'active' : ''} ${hoveredTab === tab.name ? 'hovered' : ''}`}
                onClick={(e) => {
                  createRipple(e);
                  handleTabClick(tab.name);
                }}
                onMouseEnter={() => handleTabHover(tab.name)}
                onMouseLeave={handleTabLeave}
                aria-pressed={activeTab === tab.name}
                title={tab.description}
                style={{ position: 'relative', overflow: 'hidden', zIndex: 1 }}
              >
                {tab.icon}
                <span className="tab-text">{displayTabName(tab.name)}</span>
                {activeTab === tab.name && <div className="active-indicator"></div>}
              </button>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <div className="user-section">

            <button
              type="button"
              className="nav-alert-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg className="nav-alert-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>

            <ThemeToggle />

            <div className="user-avatar" title={`User Profile - ${user?.first_name} ${user?.last_name}`} onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
              <span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
            </div>

          </div>
        </div>
      </div>

      <div
        className="navbar-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none',
          opacity: hoveredTab ? 0.7 : 0.3,
          transition: 'opacity 0.3s ease'
        }}
              />
      </nav>
    );
  };

export default Navbar;
