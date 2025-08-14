import React, { useState, useEffect, useRef } from 'react';
import './Styles/Navbar.css';

const Navbar = ({ activeTab, onTabChange, visibleTabs = [] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navbarRef = useRef(null);

  // All possible tabs with their properties
  const allTabDefinitions = {
    
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
  aria-label="Settings"
  onClick={() => console.log('Settings clicked')}
  title="Open settings"
>
  <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>  </svg>
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
          <div className="user-avatar" title="User Profile - Arani Weerathunga" onClick={() => console.log('Profile clicked')} style={{ cursor: 'pointer' }}>
            <span>AW</span>
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
