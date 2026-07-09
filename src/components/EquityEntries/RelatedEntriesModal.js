import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Styles/RelatedEntriesModal.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

const formatDate = (dateString) => {
  if (dateString == null || String(dateString).trim() === '') return '—';
  const s = String(dateString).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!Number.isNaN(local.getTime())) {
      return local.toLocaleDateString('en-US');
    }
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return s;
  return parsed.toLocaleDateString('en-US');
};

const RelatedEntriesModal = ({
  isOpen,
  onClose,
  groupData,
  loading,
  error,
  currentAccountCode,
  onAccountClick,
  institutional = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 220);
  };

  if (!isOpen) {
    return null;
  }

  const entries = groupData?.entries || [];
  const highlightLineId = groupData?.highlightLineId;
  const highlightSource = groupData?.highlightSource;

  const isHighlighted = (entry) => {
    if (highlightLineId == null) return false;
    if (Number(entry.id) === Number(highlightLineId)) {
      if (!highlightSource || !entry.source) return true;
      return String(entry.source) === String(highlightSource);
    }
    return false;
  };

  return createPortal(
    <div
      className={`related-entries-overlay${
        institutional ? ' related-entries-overlay--institutional' : ''
      } ${isVisible ? 'visible' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`related-entries-modal${
          institutional ? ' related-entries-modal--institutional' : ''
        } ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="related-entries-header">
          <div>
            <h3 className="related-entries-title">Double Entry Details</h3>
            <p className="related-entries-subtitle">
              {groupData?.sourceLabel || 'Ledger'}
              {groupData?.reference ? ` · Ref ${groupData.reference}` : ''}
              {groupData?.date ? ` · ${formatDate(groupData.date)}` : ''}
            </p>
          </div>
          <button type="button" className="related-entries-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="related-entries-body">
          {loading && (
            <div className="related-entries-loading">
              <div className="related-entries-spinner" />
              <p>Loading related entries...</p>
            </div>
          )}

          {!loading && error && (
            <div className="related-entries-error">{error}</div>
          )}

          {!loading && !error && groupData && (
            <>
              <div
                className={
                  institutional
                    ? 'rem-institutional-summary'
                    : 'related-entries-summary'
                }
              >
                <div
                  className={
                    institutional
                      ? 'rem-institutional-summary__item'
                      : 'related-entries-summary-item'
                  }
                >
                  <span>Total Debit</span>
                  <strong className="debit">{formatCurrency(groupData.totals?.total_debit)}</strong>
                </div>
                <div
                  className={
                    institutional
                      ? 'rem-institutional-summary__item'
                      : 'related-entries-summary-item'
                  }
                >
                  <span>Total Credit</span>
                  <strong className="credit">{formatCurrency(groupData.totals?.total_credit)}</strong>
                </div>
                <div
                  className={
                    institutional
                      ? 'rem-institutional-summary__item'
                      : 'related-entries-summary-item'
                  }
                >
                  <span>Status</span>
                  <strong className={groupData.totals?.is_balanced ? 'balanced' : 'unbalanced'}>
                    {groupData.totals?.is_balanced ? 'Balanced' : 'Unbalanced'}
                  </strong>
                </div>
              </div>

              <p
                className={
                  institutional ? 'rem-institutional-hint' : 'related-entries-hint'
                }
              >
                Click an account code to open that account&apos;s ledger. The highlighted row is the line you selected.
              </p>

              <div
                className={
                  institutional
                    ? 'rem-institutional-table-wrap'
                    : 'related-entries-table-wrap'
                }
              >
                <table
                  className={
                    institutional
                      ? 'rem-institutional-table'
                      : 'related-entries-table'
                  }
                >
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Account Name</th>
                      <th>Description</th>
                      <th>Debit</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const highlighted = isHighlighted(entry);
                      const isCurrentAccount =
                        currentAccountCode &&
                        String(entry.account_code) === String(currentAccountCode);

                      return (
                        <tr
                          key={`${entry.source || 'line'}-${entry.id}-${entry.account_code}`}
                          className={highlighted ? 'is-highlighted' : ''}
                        >
                          <td>
                            {onAccountClick && entry.account_code ? (
                              <button
                                type="button"
                                className={`related-account-link${
                                  isCurrentAccount ? ' is-current' : ''
                                }${
                                  institutional ? ' rem-institutional-account-link' : ''
                                }`}
                                onClick={() => onAccountClick(entry.account_code)}
                                title={`Open account ${entry.account_code}`}
                              >
                                {entry.account_code}
                              </button>
                            ) : (
                              entry.account_code || '—'
                            )}
                          </td>
                          <td>{entry.account_name || '—'}</td>
                          <td>{entry.description || '—'}</td>
                          <td className="debit">{entry.debit > 0 ? formatCurrency(entry.debit) : '—'}</td>
                          <td className="credit">{entry.credit > 0 ? formatCurrency(entry.credit) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="related-entries-footer">
          <button
            type="button"
            className={
              institutional
                ? 'rem-institutional-back-btn'
                : 'related-entries-back-btn'
            }
            onClick={handleClose}
          >
            Back to account
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RelatedEntriesModal;
