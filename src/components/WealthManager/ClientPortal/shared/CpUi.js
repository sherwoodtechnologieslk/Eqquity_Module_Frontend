import React from 'react';
import './CpUi.css';
import { PUBLIC_NAV_ITEMS } from '../ClientNavbar';

/** Shared site footer for all public Client Portal pages. */
export const CpSiteFooter = ({ onNavigate, onGetStarted }) => (
  <footer className="cp-site-footer">
    <div className="cp-site-shell">
      <div className="cp-site-footer__grid">
        <div className="cp-site-footer__brand">
          <strong>Sherwood Wealth</strong>
          <p>Licensed unit trust investing for Sri Lankan investors, from LKR 1,000.</p>
          {onGetStarted ? (
            <button type="button" className="cp-site-footer__cta" onClick={onGetStarted}>
              Open an account
            </button>
          ) : null}
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button type="button" onClick={() => onNavigate?.(item.tab)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Invest</h4>
          <ul>
            <li>
              <button type="button" onClick={() => onNavigate?.('Fund Information')}>
                Our funds
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate?.('My Portfolio')}>
                SIP planner
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate?.('Statements')}>
                Documents
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <p>+94 11 2 345 678</p>
          <p>investors@wealthplus.lk</p>
          <p>Colombo, Sri Lanka</p>
        </div>
      </div>
      <div className="cp-site-footer__legal">
        <span>© {new Date().getFullYear()} Sherwood Wealth. All rights reserved.</span>
        <span>Regulated unit trust investing</span>
      </div>
    </div>
  </footer>
);

/** Full-bleed public page: heroes and sections own their inner shells. */
export const CpPage = ({ children, className = '', footer = true, onNavigate, onGetStarted }) => (
  <div className={`cp-site cp-ui${className ? ` ${className}` : ''}`}>
    {children}
    {footer ? <CpSiteFooter onNavigate={onNavigate} onGetStarted={onGetStarted} /> : null}
  </div>
);

export const CpButton = ({ children, variant = 'solid', type = 'button', className = '', ...rest }) => (
  <button
    type={type}
    className={`cp-btn cp-btn--${variant}${className ? ` ${className}` : ''}`}
    {...rest}
  >
    {children}
  </button>
);

export const CpHero = ({
  eyebrow,
  title,
  lead,
  actions = null,
  aside = null,
  split = false,
  tone = 'paper',
  visual = null,
  className = '',
  children,
}) => (
  <section
    className={`cp-hero${split ? ' cp-hero--split' : ''}${tone === 'land' ? ' cp-hero--land' : ''}${
      visual ? ' cp-hero--has-visual' : ''
    }${className ? ` ${className}` : ''}`}
  >
    {visual ? <div className="cp-hero__visual">{visual}</div> : null}
    <div className="cp-site-shell">
      {split ? (
        <div className="cp-hero__layout">
          <div className="cp-hero__inner">
            {eyebrow ? <p className="cp-site-kicker">{eyebrow}</p> : null}
            {title ? <h1 className="cp-hero__title">{title}</h1> : null}
            {lead ? <p className="cp-hero__lead">{lead}</p> : null}
            {actions ? <div className="cp-hero__actions">{actions}</div> : null}
            {children}
          </div>
          {aside}
        </div>
      ) : (
        <div className="cp-hero__inner">
          {eyebrow ? <p className="cp-site-kicker">{eyebrow}</p> : null}
          {title ? <h1 className="cp-hero__title">{title}</h1> : null}
          {lead ? <p className="cp-hero__lead">{lead}</p> : null}
          {actions ? <div className="cp-hero__actions">{actions}</div> : null}
          {children}
        </div>
      )}
    </div>
  </section>
);

export const CpSection = ({
  eyebrow,
  title,
  blurb,
  mint = false,
  children,
  className = '',
}) => (
  <section className={`cp-section${mint ? ' cp-section--mint' : ''}${className ? ` ${className}` : ''}`}>
    <div className="cp-site-shell">
      {(eyebrow || title || blurb) && (
        <header className="cp-section__head">
          {eyebrow ? <p className="cp-site-kicker">{eyebrow}</p> : null}
          {title ? <h2 className="cp-section__title">{title}</h2> : null}
          {blurb ? <p className="cp-section__blurb">{blurb}</p> : null}
        </header>
      )}
      {children}
    </div>
  </section>
);

export const CpCard = ({
  icon,
  title,
  text,
  children,
  className = '',
}) => (
  <article className={`cp-card${className ? ` ${className}` : ''}`}>
    {icon ? <div className="cp-card__icon">{icon}</div> : null}
    {title ? <h3 className="cp-card__title">{title}</h3> : null}
    {text ? <p className="cp-card__text">{text}</p> : null}
    {children}
  </article>
);

export const CpGrid = ({ cols = 3, children, className = '' }) => (
  <div className={`cp-grid cp-grid--${cols}${className ? ` ${className}` : ''}`}>{children}</div>
);

export const CpPanel = ({ children, className = '' }) => (
  <div className={`cp-panel${className ? ` ${className}` : ''}`}>{children}</div>
);

export const CpStatRow = ({ items = [] }) => (
  <div className="cp-stat-row">
    {items.map((item) => (
      <div key={item.label} className="cp-stat">
        <div className="cp-stat__value">{item.value}</div>
        <div className="cp-stat__label">{item.label}</div>
      </div>
    ))}
  </div>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export const CpCtaArrow = ArrowIcon;

/** Full-bleed bottom CTA used across public site pages. */
export const CpCtaBanner = ({ title, subtitle, action }) => (
  <section className="cp-cta-banner">
    <div className="cp-site-shell cp-cta-banner__inner">
      <div>
        <p className="cp-site-kicker">Get started</p>
        {title ? <h2 className="cp-section__title">{title}</h2> : null}
        {subtitle ? <p className="cp-section__blurb">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  </section>
);
