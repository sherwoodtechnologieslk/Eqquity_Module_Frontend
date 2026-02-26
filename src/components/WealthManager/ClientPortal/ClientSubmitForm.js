import React from 'react';
import './Styles/ClientSubmitForm.css';

const ClientSubmitForm = ({ onPrevious, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <form className="cp-submit-form" onSubmit={handleSubmit}>
          <div className="cp-submit-body">
            <h1 className="cp-submit-title">Almost done, just click submit.</h1>
            <p className="cp-submit-subtitle">
              You&apos;ve completed the application to sign up for Unit Trust Funds! Now,
              submit your application by clicking the button below and start investing
              soon.
            </p>

            <div className="cp-submit-illustration">
              <div className="cp-submit-documents">
                <div className="cp-submit-doc cp-submit-doc-back" />
                <div className="cp-submit-doc cp-submit-doc-front" />
              </div>
              <div className="cp-submit-check">
                <svg viewBox="0 0 20 20" width="36" height="36">
                  <circle cx="10" cy="10" r="10" fill="#ef4444" />
                  <path
                    d="M6.5 10.5l2.2 2.2 4.8-5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="cp-submit-divider" />

          <div className="cp-form-actions cp-submit-actions">
            <button
              type="button"
              className="cp-previous-btn"
              onClick={onPrevious}
            >
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Previous
            </button>
            <button type="submit" className="cp-submit-btn">
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientSubmitForm;

