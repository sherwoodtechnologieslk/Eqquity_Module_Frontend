import React from 'react';
import './CpUi.css';

/** Page shell for Client Portal public tabs (Home, About, Funds, Planner, Docs, Contact). */
export const CpPage = ({ children, className = '' }) => (
  <div className={`cp-ui${className ? ` ${className}` : ''}`}>{children}</div>
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
  children,
}) => (
  <section className={`cp-hero${split ? ' cp-hero--split' : ''}`}>
    {split ? (
      <div className="cp-hero__layout">
        <div className="cp-hero__inner">
          {eyebrow ? <span className="cp-eyebrow">{eyebrow}</span> : null}
          {title ? <h1 className="cp-hero__title">{title}</h1> : null}
          {lead ? <p className="cp-hero__lead">{lead}</p> : null}
          {actions ? <div className="cp-hero__actions">{actions}</div> : null}
          {children}
        </div>
        {aside}
      </div>
    ) : (
      <div className="cp-hero__inner">
        {eyebrow ? <span className="cp-eyebrow">{eyebrow}</span> : null}
        {title ? <h1 className="cp-hero__title">{title}</h1> : null}
        {lead ? <p className="cp-hero__lead">{lead}</p> : null}
        {actions ? <div className="cp-hero__actions">{actions}</div> : null}
        {children}
      </div>
    )}
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
    {(eyebrow || title || blurb) && (
      <header className="cp-section__head">
        {eyebrow ? <span className="cp-eyebrow">{eyebrow}</span> : null}
        {title ? <h2 className="cp-section__title">{title}</h2> : null}
        {blurb ? <p className="cp-section__blurb">{blurb}</p> : null}
      </header>
    )}
    {children}
  </section>
);

export const CpCard = ({
  icon,
  title,
  text,
  children,
  variant = 'paper',
  className = '',
}) => (
  <article
    className={`cp-card${variant === 'mint' ? ' cp-card--mint' : ''}${
      variant === 'accent' ? ' cp-card--accent' : ''
    }${className ? ` ${className}` : ''}`}
  >
    {icon ? <div className="cp-card__icon">{icon}</div> : null}
    {title ? <h3 className="cp-card__title">{title}</h3> : null}
    {text ? <p className="cp-card__text">{text}</p> : null}
    {children}
  </article>
);

export const CpGrid = ({ cols = 3, children, className = '' }) => (
  <div className={`cp-grid cp-grid--${cols}${className ? ` ${className}` : ''}`}>{children}</div>
);

export const CpPanel = ({ variant = 'accent', children, className = '' }) => (
  <div
    className={`cp-panel${variant === 'soft' ? ' cp-panel--soft' : ''}${
      variant === 'paper' ? ' cp-panel--paper' : ''
    }${className ? ` ${className}` : ''}`}
  >
    {children}
  </div>
);

export const CpStatRow = ({ items = [] }) => (
  <div className="cp-stat-row">
    {items.map((item, i) => (
      <React.Fragment key={item.label || i}>
        {i > 0 ? <div className="cp-stat-divider" aria-hidden /> : null}
        <div className="cp-stat">
          <div className="cp-stat__value">{item.value}</div>
          <div className="cp-stat__label">{item.label}</div>
        </div>
      </React.Fragment>
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

/** Bottom CTA strip used across public portal tabs. */
export const CpCtaBanner = ({ title, subtitle, action }) => (
  <section className="cp-section cp-section--mint cp-cta-banner">
    <div>
      {title ? <h3 className="cp-section__title">{title}</h3> : null}
      {subtitle ? <p className="cp-section__blurb">{subtitle}</p> : null}
    </div>
    {action}
  </section>
);
