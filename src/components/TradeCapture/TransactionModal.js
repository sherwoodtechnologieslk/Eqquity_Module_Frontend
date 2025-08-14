import React, { useState, useEffect } from 'react';
import './Styles/TransactionModal.css';

const TransactionModal = ({ transaction, onClose, onConfirm }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (transaction) {
      setIsVisible(true);
    }
  }, [transaction]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onConfirm();
    setIsConfirming(false);
  };

  const formatKey = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  const formatValue = (value) => {
    if (typeof value === 'number' && value.toString().includes('.')) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value?.toString() || '';
  };

  if (!transaction) return null;

  return (
    <div className={`modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-form-card">
          <div className="modal-header">
            <div className="modal-header-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="modal-icon">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM20.05 19L18.64 17.59L17.23 19L18.64 20.41L20.05 19ZM22.88 17.58L20.07 14.77C19.68 14.38 19.05 14.38 18.66 14.77L16.95 16.48L20.17 19.7L21.88 17.99C22.27 17.6 22.27 16.97 21.88 16.58Z"/>
              </svg>
            </div>
            <div className="modal-title-section">
              <h2 className="modal-title">Transaction Authorization</h2>
              <p className="modal-subtitle">Review and confirm transaction details</p>
            </div>
            <button className="modal-close-btn" onClick={handleClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-scroll-container">
              <div className="modal-transaction-form">
                {Object.entries(transaction).map(([key, value], index) => (
                  <div key={key} className="modal-form-group">
                    <label className="modal-label">{formatKey(key)}</label>
                    <div className="modal-input-wrapper">
                      <input
                        type="text"
                        className="modal-input"
                        value={formatValue(value)}
                        readOnly
                      />
                      <div className="input-accent"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn cancel" onClick={handleClose} disabled={isConfirming}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancel
            </button>
            <button
              className={`modal-btn confirm ${isConfirming ? 'loading' : ''}`}
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              {isConfirming ? 'Authorizing...' : 'Authorize Transaction'}
              {isConfirming && <span className="btn-spinner"></span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;