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
        <div className="cp-signup-form-header cp-submit-header">
          <div className="cp-header-top">
            <span className="cp-header-pill">Complete</span>
          </div>
          <h1>Almost done, just click submit.</h1>
          <p>
            You&apos;ve completed the application to sign up for Unit Trust Funds! Now,
            submit your application by clicking the button below and start investing
            soon.
          </p>
        </div>

        <form className="cp-submit-form" onSubmit={handleSubmit}>
          <div className="cp-submit-body">
            <div className="cp-submit-ready-card">
              <div className="cp-submit-check" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6.5 10.5l2.2 2.2 4.8-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="cp-submit-ready-copy">
                <span className="cp-submit-ready-label">Application status</span>
                <span className="cp-submit-ready-value">Ready to submit</span>
              </div>
            </div>
          </div>

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
            <button type="submit" className="cp-next-btn cp-submit-btn">
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientSubmitForm;
