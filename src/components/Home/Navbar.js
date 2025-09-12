import React, { useState, useEffect, useRef } from 'react';
import './Styles/Navbar.css';

const Navbar = ({ activeTab, onTabChange, visibleTabs = [], user, onLogout, onOpenProfile }) => {
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

  // Add Dashboard tab when Dashboard-related tabs are visible
  const tabsWithDashboard = visibleTabs.length > 0 && visibleTabs.includes('Portfolio Overview') 
    ? ['Dashboard', ...visibleTabs] 
    : visibleTabs;

  const tabs = tabsWithDashboard.map(name => ({
    name,
    className: allTabDefinitions[name]?.className || 'nav-default',
    icon: allTabDefinitions[name]?.icon || <></>,
    description: allTabDefinitions[name]?.description || ''
  }));

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

  const handleTabClick = (tabName) => {
    setTimeout(() => onTabChange(tabName), 100);
  };

  const handleTabHover = (tabName) => setHoveredTab(tabName);
  const handleTabLeave = () => setHoveredTab(null);

  const getDynamicStyles = () => ({
    background: `linear-gradient(${135 + mousePosition.x * 20}deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)`,
    transform: `perspective(1000px) rotateX(${mousePosition.y * 2 - 1}deg) rotateY(${mousePosition.x * 2 - 1}deg)`
  });

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
      className={`main-navbar ${isScrolled ? 'scrolled' : ''}`}
      style={getDynamicStyles()}
    >
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg className="brand-logo" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
         
        </div>

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
                <span className="tab-text">{tab.name}</span>
                {activeTab === tab.name && <div className="active-indicator"></div>}
              </button>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {/* Action buttons remain unchanged */}
          <button className="action-button" aria-label="Notifications" onClick={() => console.log('Notifications clicked')} title="View notifications">
            <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
          


          <button 
  className="action-button" 
  aria-label="Print"
  onClick={() => window.print()}
  title="Print current page"
>
  <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/>
  </svg>
</button>
          <div className="user-section">
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
