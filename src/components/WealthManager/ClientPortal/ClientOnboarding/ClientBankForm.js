import React, { useState } from 'react';
import './Styles/ClientBankForm.css';

const FUNDS = [
  { id: 'EIF', name: 'Equity Income Fund (EIF)' },
  { id: 'CMT', name: 'Cash Management Trust Fund (CMT)' },
  { id: 'SBF', name: 'Sri Lanka Bond Fund (SBF)' },
];

const ClientBankForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [formData, setFormData] = useState({
    bankName: initialData.bankName || '',
    branch: initialData.branch || '',
    accountNumber: initialData.accountNumber || '',
    accountName: initialData.accountName || '',
    accountType: initialData.accountType || '',
    preferredFund: initialData.preferredFund || '',
    initialInvestment: initialData.initialInvestment || '',
    dividendInstruction: initialData.dividendInstruction || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      onNext(formData);
    }
  };

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <div className="cp-signup-form-header">
          <h1>Bank &amp; Fund Details</h1>
          <p>Provide the bank account for subscriptions and redemptions, and choose your first fund</p>
        </div>

        <div className="cp-signup-form-content">
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
                  <h3>Own-name account</h3>
                  <p>The bank account must be in the same name as the unit-trust account you are opening.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Redemption proceeds</h3>
                  <p>Withdrawals are paid only to this nominated account after the standard T+2 cycle.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Minimum investment</h3>
                  <p>You can start from LKR 1,000. You can add more funds later from the portal.</p>
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

          <form className="cp-signup-form" onSubmit={handleSubmit}>
            <div className="cp-form-section">
              <h3 className="cp-section-title">Nominated bank account</h3>

              <div className="cp-form-group">
                <label htmlFor="bankName">Bank name</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="branch">Branch</label>
                  <input
                    type="text"
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="accountType">Account type</label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>
              </div>

              <div className="cp-form-group">
                <label htmlFor="accountName">Account name</label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="accountNumber">Account number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>
            </div>

            <div className="cp-form-section">
              <h3 className="cp-section-title">Initial fund</h3>
              <p className="cp-section-helper">
                Choose the fund you want to start with. You can subscribe to other funds after your account is active.
              </p>

              <div className="cp-form-group">
                <label htmlFor="preferredFund">Preferred fund</label>
                <select
                  id="preferredFund"
                  name="preferredFund"
                  value={formData.preferredFund}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  <option value="">Select a fund</option>
                  {FUNDS.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="initialInvestment">Initial investment (LKR)</label>
                  <input
                    type="number"
                    id="initialInvestment"
                    name="initialInvestment"
                    min="1000"
                    step="100"
                    value={formData.initialInvestment}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="dividendInstruction">Dividend instruction</label>
                  <select
                    id="dividendInstruction"
                    name="dividendInstruction"
                    value={formData.dividendInstruction}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="">Select instruction</option>
                    <option value="Reinvest">Reinvest in the fund</option>
                    <option value="Pay to bank">Pay to nominated bank</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="cp-form-actions">
              <button type="button" className="cp-previous-btn" onClick={onPrevious}>
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
