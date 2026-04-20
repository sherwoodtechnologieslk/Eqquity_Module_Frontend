import React, { useEffect, useMemo, useState } from 'react';
import { wealthManagerMenuItems } from '../../Home/Sidebar';
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
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);

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

  return (
    <aside className="wm-sidebar" aria-label="Wealth navigation">
      <div className="wm-sidebar__brand">
        <div className="wm-sidebar__brandRow">
          <button
            type="button"
            className="wm-sidebar__brandTrigger"
            onClick={() => setIsBrandMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isBrandMenuOpen}
            title="Switch manager"
          >
            <span className="wm-sidebar__logo">
              <span className="wm-sidebar__logo-line1">Sherwood</span>
              <span className="wm-sidebar__logo-line2">Wealth</span>
            </span>
            <span className="wm-sidebar__caret" aria-hidden>
              {isBrandMenuOpen ? '▴' : '▾'}
            </span>
          </button>

          {isBrandMenuOpen && (
            <div className="wm-sidebar__brandMenu" role="menu" aria-label="Manager switch">
              <button type="button" className="wm-sidebar__brandItem is-active" role="menuitem">
                Wealth Manager
              </button>
              {onManagerChange && (
                <button
                  type="button"
                  className="wm-sidebar__brandItem"
                  role="menuitem"
                  onClick={() => {
                    setIsBrandMenuOpen(false);
                    onManagerChange('equity');
                  }}
                >
                  Equity Manager
                </button>
              )}
            </div>
          )}
        </div>

        <div className="wm-sidebar__actions">
          {onClientViewToggle && (
            <button
              type="button"
              className={`wm-sidebar__btn ${isClientView ? 'wm-sidebar__btn--accent' : 'wm-sidebar__btn--ghost'}`}
              onClick={() => onClientViewToggle(!isClientView)}
              title={isClientView ? 'Switch to Admin View' : 'Switch to Client Portal'}
            >
              {isClientView ? 'Admin View' : 'Client Portal'}
            </button>
          )}
        </div>
      </div>

      <nav className="wm-sidebar__nav" aria-label="Private banking">
        <div className="wm-sidebar__section-label">Private banking</div>
        <ul className="wm-sidebar__list">
          {menuItems.map((item, i) => (
            <li key={item.name}>
              <button
                type="button"
                className={`wm-sidebar__item${active === i ? ' is-active' : ''}`}
                onClick={() => handleClick(i)}
                aria-pressed={active === i}
              >
                <span className="wm-sidebar__icon-wrap" aria-hidden>
                  {item.icon}
                </span>
                <span className="wm-sidebar__label">{item.name}</span>
                <span className="wm-sidebar__active-dot" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {onLogout && (
        <div className="wm-sidebar__footer">
          <button type="button" className="wm-sidebar__logout" onClick={onLogout} title="Logout">
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default WealthSidebar;
