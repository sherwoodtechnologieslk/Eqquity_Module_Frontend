import React from 'react';
import './Styles/premiumModal.css';

const VARIANT_COPY = {
  default: {
    title: 'Premium Feature',
    message: (
      <>
        This feature is available in our <strong>Premium Plan</strong> or coming soon.
      </>
    ),
    submessage:
      'Upgrade your account to access advanced features and unlock the full potential of our platform.',
  },
  wealth: {
    title: 'Sherwood Wealth',
    message: (
      <>
        Sherwood Wealth is available in our <strong>Premium Plan</strong> or coming soon.
      </>
    ),
    submessage:
      'Upgrade to access wealth management, client operations, fund tools, and the full Sherwood Wealth workspace.',
  },
};

const PremiumModal = ({ isOpen, onClose, onContactSales, variant = 'default' }) => {
  if (!isOpen) return null;

  const copy = VARIANT_COPY[variant] || VARIANT_COPY.default;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="em-premium-modal-overlay" onClick={handleOverlayClick}>
      <div className="em-premium-modal-container">
        <div className="em-premium-modal-header">
          <div className="em-premium-modal-icon-wrapper">
            <svg 
              className="em-premium-modal-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="em-premium-modal-title">{copy.title}</h2>
        </div>
        
        <div className="em-premium-modal-content">
          <p className="em-premium-modal-message">{copy.message}</p>
          <p className="em-premium-modal-submessage">{copy.submessage}</p>
        </div>

        <div className="em-premium-modal-actions">
          <button 
            className="em-premium-modal-btn-secondary"
            onClick={onClose}
          >
            Maybe Later
          </button>
          <button 
            className="em-premium-modal-btn-primary"
            onClick={onContactSales}
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;




