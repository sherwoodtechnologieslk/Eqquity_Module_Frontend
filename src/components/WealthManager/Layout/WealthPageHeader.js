import React from 'react';
import './WealthPageHeader.css';

/**
 * Shared Wealth Manager page header (ops rail).
 * Use on every Wealth screen for consistent Sherwood Wealth branding.
 */
const WealthPageHeader = ({
  title,
  blurb,
  eyebrow = 'Sherwood Wealth',
  actions = null,
  className = '',
}) => {
  return (
    <header className={`wm-page-header${className ? ` ${className}` : ''}`}>
      <div className="wm-page-header__brand">
        <div>
          {eyebrow ? <p className="wm-page-header__eyebrow">{eyebrow}</p> : null}
          <h1 className="wm-page-header__title">{title}</h1>
          {blurb ? <p className="wm-page-header__blurb">{blurb}</p> : null}
        </div>
      </div>
      {actions ? <div className="wm-page-header__actions">{actions}</div> : null}
    </header>
  );
};

export default WealthPageHeader;
