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
        <div className="wm-sidebar__logo">
          <span className="wm-sidebar__logo-line1">Sherwood</span>
          <span className="wm-sidebar__logo-line2">Wealth</span>
        </div>

        <div className="wm-sidebar__actions">
          {onManagerChange && (
            <button
              type="button"
              className="wm-sidebar__btn wm-sidebar__btn--ghost"
              onClick={() => onManagerChange('equity')}
              title="Back to Equity Manager"
            >
              Switch to Equity
            </button>
          )}
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
