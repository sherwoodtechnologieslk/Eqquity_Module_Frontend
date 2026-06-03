import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DashboardBody } from './GroupFinanceDashboard';
import { cloneGroupData } from './groupFinanceData';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/GroupFinanceDashboard.css';

const DashboardReport = ({ open, onClose, embedded = false }) => {
  const [viewOnly, setViewOnly] = useState(false);
  const [data, setData] = useState(() => cloneGroupData());
  const [savedData, setSavedData] = useState(null);

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  useEffect(() => {
    if (open || embedded) {
      setData(cloneGroupData());
      setSavedData(null);
      setViewOnly(false);
    }
  }, [open, embedded]);

  const handleSave = () => {
    setSavedData(cloneGroupData(data));
    setViewOnly(true);
  };
  const handleEditAgain = () => setViewOnly(false);

  const displayData = viewOnly && savedData ? savedData : data;

  if (!open && !embedded) return null;

  const reportMarkup = (
    <div
      className={embedded ? 'bfr-embedded-root' : 'bfr-modal-root'}
      role={embedded ? undefined : 'presentation'}
      onClick={
        embedded
          ? undefined
          : (e) => {
              if (e.target === e.currentTarget) onClose?.();
            }
      }
    >
      <div className="bfr-modal-cluster" onClick={(e) => e.stopPropagation()}>
        <div
          className="bfr-modal-shell gdr-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gdr-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          {!embedded ? (
            <button type="button" className="bfr-modal-close" onClick={onClose} aria-label="Close dashboard report">
              ×
            </button>
          ) : null}
          <div className="bfr-doc gdr-doc">
            <span id="gdr-dialog-title" className="bfr-sr-only">
              Dashboard report - AMC, AMH and CCH
            </span>
            <DashboardBody
              viewOnly={viewOnly}
              data={displayData}
              onDataChange={viewOnly ? undefined : setData}
            />
            <p className="bfr-footnote gdr-footnote">
              {viewOnly ? (
                <>
                  Saved read-only dashboard. Use <strong>Edit</strong> beside this panel to refresh the view.
                </>
              ) : (
                <>
                  KPIs, charts, and tables for AMC, AMH, and CCH. Use <strong>Save</strong> beside this panel for a
                  fixed snapshot layout.
                </>
              )}
            </p>
          </div>
        </div>
        <div
          className="bfr-modal-floating-actions"
          role="toolbar"
          aria-label="Dashboard report controls"
          onClick={(e) => e.stopPropagation()}
        >
          {viewOnly ? (
            <button type="button" className="bfr-btn-edit bfr-btn-floating" onClick={handleEditAgain}>
              Edit
            </button>
          ) : (
            <button type="button" className="bfr-btn-save bfr-btn-floating" onClick={handleSave}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return reportMarkup;
  return createPortal(reportMarkup, document.body);
};

export default DashboardReport;
