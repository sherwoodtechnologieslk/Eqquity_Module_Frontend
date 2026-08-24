import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './WealthModal.css';

/**
 * Shared Wealth Manager modal.
 * Portals to document.body so it sits above the app shell and is not
 * flattened by the .wm-root sharp-corner override.
 *
 * Use for deal detail, confirmations, forms, and any future overlay.
 */
const WealthModal = ({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  badge = null,
  size = 'lg',
  footer = null,
  fields = null,
  children,
  closeOnOverlay = true,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleOverlay = (event) => {
    if (closeOnOverlay && event.target === event.currentTarget) onClose?.();
  };

  return createPortal(
    <div className="wm-modal-overlay" onClick={handleOverlay} role="presentation">
      <div
        className={`wm-modal wm-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wm-modal__head">
          <div className="wm-modal__titles">
            {eyebrow ? <p className="wm-modal__eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2 id="wm-modal-title" className="wm-modal__title">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="wm-modal__subtitle">{subtitle}</p> : null}
          </div>
          <div className="wm-modal__head-actions">
            {badge}
            <button type="button" className="wm-modal__close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="wm-modal__body">
          {Array.isArray(fields) && fields.length > 0 ? (
            <div className="wm-modal__fields">
              {fields.map((field) => (
                <div key={field.k || field.label} className="wm-modal__field">
                  <span>{field.k || field.label}</span>
                  <strong>{field.v ?? field.value ?? '—'}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {children}
        </div>

        {footer ? <footer className="wm-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
};

export default WealthModal;
