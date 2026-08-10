import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './GovernanceActionModal.css';
import './BusinessApprovalsExportModal.css';

/**
 * Filter dialog shown before Business Approvals Excel export.
 */
const BusinessApprovalsExportModal = ({
  open,
  exporting = false,
  modules = [],
  moduleSummary = {},
  filters,
  onChangeFilter,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !exporting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, exporting, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="gov-modal-overlay agp-export-overlay"
      role="presentation"
      onClick={exporting ? undefined : onClose}
    >
      <div
        className="gov-modal agp-export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agp-export-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gov-modal-header">
          <div>
            <p className="agp-export-modal__eyebrow">Business Approvals</p>
            <h2 id="agp-export-title">Export to Excel</h2>
          </div>
          <button
            type="button"
            className="gov-modal-close"
            onClick={onClose}
            disabled={exporting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="gov-modal-body">
          <p className="gov-modal-message">
            Choose a category and optional date ranges. Leave dates blank to include all dates.
          </p>

          <fieldset className="agp-export-fieldset">
            <legend>Category</legend>
            <div className="agp-export-modules" role="group" aria-label="Export category">
              {modules.map((mod) => {
                const summary = moduleSummary[mod.id] || { total: 0 };
                const selected = filters.moduleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`agp-export-module${selected ? ' agp-export-module--selected' : ''}`}
                    onClick={() => onChangeFilter('moduleId', mod.id)}
                    disabled={exporting}
                    aria-pressed={selected}
                  >
                    <span className="agp-export-module-label">{mod.label}</span>
                    <span className="agp-export-module-count">{summary.total ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="agp-export-fieldset">
            <legend>Entry date</legend>
            <div className="agp-export-date-row">
              <label className="agp-export-date-field">
                <span>From</span>
                <input
                  type="date"
                  value={filters.entryFrom || ''}
                  onChange={(e) => onChangeFilter('entryFrom', e.target.value)}
                  disabled={exporting}
                />
              </label>
              <label className="agp-export-date-field">
                <span>To</span>
                <input
                  type="date"
                  value={filters.entryTo || ''}
                  onChange={(e) => onChangeFilter('entryTo', e.target.value)}
                  disabled={exporting}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="agp-export-fieldset">
            <legend>Created date</legend>
            <div className="agp-export-date-row">
              <label className="agp-export-date-field">
                <span>From</span>
                <input
                  type="date"
                  value={filters.createdFrom || ''}
                  onChange={(e) => onChangeFilter('createdFrom', e.target.value)}
                  disabled={exporting}
                />
              </label>
              <label className="agp-export-date-field">
                <span>To</span>
                <input
                  type="date"
                  value={filters.createdTo || ''}
                  onChange={(e) => onChangeFilter('createdTo', e.target.value)}
                  disabled={exporting}
                />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="gov-modal-actions">
          <button
            type="button"
            className="gov-modal-btn gov-modal-btn--ghost"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gov-modal-btn gov-modal-btn--success"
            onClick={onConfirm}
            disabled={exporting || !filters.moduleId}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BusinessApprovalsExportModal;
