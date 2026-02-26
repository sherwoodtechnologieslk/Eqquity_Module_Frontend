import React, { useState } from 'react';
import './Styles/ClientBankForm.css';

const sourceOfFundsOptions = [
  'Commission Income',
  'Contract Proceeds',
  'Donations/Charities (Local/Foreign)',
  'Export Proceeds',
  'Family Remittances',
  'Gift',
  'Investment Proceeds/Savings',
  'Membership Contribution',
  'Others (Specify)',
  'Salary/Profit Income',
  'Sale of Property/Assets',
  'Sales and Business Turnover'
];

const ClientBankForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [formState, setFormState] = useState({
    bankName: initialData.bankName || 'Seylan Bank PLC',
    branchName: initialData.branchName || 'Attidiya',
    accountType: initialData.accountType || 'Savings',
    accountNumber: initialData.accountNumber || '',
    expectedValueOfInvestment:
      initialData.expectedValueOfInvestment || 'Less than Rs. 100,000',
    allowTransfer:
      initialData.allowTransfer !== undefined ? initialData.allowTransfer : 'Yes',
    isUSPersonFATCA:
      initialData.isUSPersonFATCA !== undefined ? initialData.isUSPersonFATCA : 'No'
  });

  const [selectedSources, setSelectedSources] = useState(
    Array.isArray(initialData.sourceOfFunds) ? initialData.sourceOfFunds : []
  );

  const [showJustPayInfo, setShowJustPayInfo] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSourceToggle = (option) => {
    setSelectedSources((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      onNext({
        ...formState,
        sourceOfFunds: selectedSources
      });
    }
  };

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <div className="cp-signup-form-header">
          <div className="cp-header-top">
            <span className="cp-header-pill">Bank &amp; Fund Details Video Guide</span>
          </div>
          <h1>Bank &amp; Fund Details</h1>
          <p>Please enter your personal bank account details and funding information</p>
        </div>

        <div className="cp-signup-form-content">
          {/* Pro Tips Section */}
          <div className="cp-pro-tips-section">
            <div className="cp-tips-header">
              <div className="cp-tips-icon">
                <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2>Pro Tips</h2>
            </div>
            <div className="cp-tips-content">
              <div className="cp-tip-item">
                <div className="cp-tip-number">01</div>
                <div className="cp-tip-text">
                  <h3>Personal Account Only</h3>
                  <p>
                    Enter your own personal bank account details. Third-party or
                    joint accounts may require additional verification.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Match Bank Statement</h3>
                  <p>
                    Make sure the account number and name exactly match your bank
                    statement to avoid fund transfer issues.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Funding Transparency</h3>
                  <p>
                    Select all applicable sources of funds to support compliance
                    and regulatory requirements.
                  </p>
                </div>
              </div>
            </div>
            <div className="cp-tips-footer">
              <div className="cp-tips-badge">
                <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure &amp; Verified</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="cp-signup-form" onSubmit={handleSubmit}>
            {/* Bank Details */}
            <div className="cp-form-section">
              <p className="cp-section-helper">
                Please enter your own personal bank account details
              </p>

              <div className="cp-form-group">
                <label htmlFor="bankName">Bank Name</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formState.bankName}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="branchName">Branch Name</label>
                  <input
                    type="text"
                    id="branchName"
                    name="branchName"
                    value={formState.branchName}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="accountType">Account Type</label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formState.accountType}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="cp-form-group">
                <label htmlFor="accountNumber">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formState.accountNumber}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              {/* JustPay Info */}
              <div className="cp-justpay-box">
                <div className="cp-justpay-header">
                  <span className="cp-justpay-title">JustPay verification</span>
                  <button
                    type="button"
                    className="cp-justpay-toggle"
                    onClick={() => setShowJustPayInfo((prev) => !prev)}
                  >
                    {showJustPayInfo ? 'Hide info' : 'More info'}
                  </button>
                </div>
                {showJustPayInfo && (
                  <div className="cp-justpay-body">
                    <p>
                      Verifying your bank account through JustPay may accelerate the
                      approval process for your application.
                    </p>
                    <ul>
                      <li>Internet/SMS banking needs to be enabled.</li>
                      <li>Foreign currency accounts not allowed.</li>
                      <li>Dormant and lease accounts not allowed.</li>
                      <li>
                        HNB account holders: please call HNB Customer Service to
                        activate JustPay.
                      </li>
                      <li>
                        If JustPay verification fails or is unavailable, you can use
                        the standard process by uploading your bank statement.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Investment & Source of Funds */}
            <div className="cp-form-section">
              <div className="cp-form-group">
                <label htmlFor="expectedValueOfInvestment">
                  Expected Value of Investment
                </label>
                <select
                  id="expectedValueOfInvestment"
                  name="expectedValueOfInvestment"
                  value={formState.expectedValueOfInvestment}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  <option value="Less than Rs. 100,000">
                    Less than Rs. 100,000
                  </option>
                  <option value="Rs 100,000 to Rs 500,000">
                    Rs 100,000 to Rs 500,000
                  </option>
                  <option value="Rs 500,000 to Rs 1,000,000">
                    Rs 500,000 to Rs 1,000,000
                  </option>
                  <option value="Rs 1,000,000 to Rs 2,000,000">
                    Rs 1,000,000 to Rs 2,000,000
                  </option>
                  <option value="Rs 2,000,000 to Rs 3,000,000">
                    Rs 2,000,000 to Rs 3,000,000
                  </option>
                  <option value="Rs 3,000,000 to Rs 4,000,000">
                    Rs 3,000,000 to Rs 4,000,000
                  </option>
                  <option value="Rs 4,000,000 to Rs 5,000,000">
                    Rs 4,000,000 to Rs 5,000,000
                  </option>
                </select>
              </div>

              <div className="cp-form-group">
                <label className="cp-source-label">
                  Source of Funds <span className="cp-required">*</span>{' '}
                  <span className="cp-source-hint">
                    (Can select multiple options)
                  </span>
                </label>
                <div className="cp-source-grid">
                  {sourceOfFundsOptions.map((option) => (
                    <label key={option} className="cp-source-option">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(option)}
                        onChange={() => handleSourceToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance Questions */}
            <div className="cp-form-section">
              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Allow transfer of funds for settlement between CAL Investments &amp;
                  CAL Securities (Equity Account) - if applicable
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="allowTransfer"
                      value="Yes"
                      checked={formState.allowTransfer === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="allowTransfer"
                      value="No"
                      checked={formState.allowTransfer === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Are you a US person under the Foreign Account Tax Compliance
                  Act (FATCA) of the US?
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="isUSPersonFATCA"
                      value="Yes"
                      checked={formState.isUSPersonFATCA === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="isUSPersonFATCA"
                      value="No"
                      checked={formState.isUSPersonFATCA === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="cp-form-actions">
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
              <button type="submit" className="cp-next-btn">
                Next
                <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientBankForm;

