import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './GovernanceActionModal.css';

const GovernanceActionModal = ({
  open,
  title,
  message,
  variant = 'confirm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  reasonLabel = 'Reason (optional)',
  reasonPlaceholder = 'Add a note…',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open, title]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onConfirm(variant === 'prompt' ? reason : undefined);
  };

  return createPortal(
    <div className="gov-modal-overlay" role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className="gov-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gov-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gov-modal-header">
          <h2 id="gov-modal-title">{title}</h2>
          <button
            type="button"
            className="gov-modal-close"
            aria-label="Close"
            onClick={onCancel}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="gov-modal-body">
            {message && <p className="gov-modal-message">{message}</p>}
            {variant === 'prompt' && (
              <label className="gov-modal-field">
                <span>{reasonLabel}</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                  rows={3}
                  disabled={loading}
                />
              </label>
            )}
          </div>

          <div className="gov-modal-actions">
            <button type="button" className="gov-modal-btn gov-modal-btn--ghost" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`gov-modal-btn gov-modal-btn--${confirmTone}`}
              disabled={loading}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default GovernanceActionModal;
