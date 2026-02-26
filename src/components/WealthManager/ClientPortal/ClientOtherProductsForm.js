import React, { useState, useRef } from 'react';
import './Styles/ClientOtherProductsForm.css';

const optionalFunds = [
  'Balanced Fund',
  'Corporate Treasury Fund',
  'Gilt Trading Fund',
  'Islamic Money Market Fund',
  'Medium Risk Fixed Deposit and Gilt Fund'
];

const defaultFunds = [
  'Income Fund',
  'CAL Fixed Income Opportunities Fund',
  'Gilt Fund',
  'High Yield Fund',
  'Investment Grade Fund',
  'Money Market Fund',
  'Quantitative Equity Fund'
];

const ClientOtherProductsForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [selectedFunds, setSelectedFunds] = useState(
    Array.isArray(initialData.optionalFunds) ? initialData.optionalFunds : []
  );

  const [showEquityDetails, setShowEquityDetails] = useState(false);
  const [showMainTerms, setShowMainTerms] = useState(false);
  const [showEmailIndemnity, setShowEmailIndemnity] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [equityState, setEquityState] = useState({
    enableEquity:
      initialData.enableEquity !== undefined ? initialData.enableEquity : false,
    hasCDSCode: initialData.hasCDSCode || 'No',
    agreeTerms: initialData.agreeTerms || false,
    understandCDS: initialData.understandCDS || false,
    understandProcessing: initialData.understandProcessing || false,
    signupEquity: initialData.signupEquity || false,
    agreeMainTerms: initialData.agreeMainTerms || false,
    accountType: initialData.accountType || 'internet' // 'internet' | 'standard'
  });

  const toggleFund = (fund) => {
    setSelectedFunds((prev) =>
      prev.includes(fund)
        ? prev.filter((f) => f !== fund)
        : [...prev, fund]
    );
  };

  const handleEquityChange = (e) => {
    const { name, type, checked, value } = e.target;
    setEquityState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      onNext({
        optionalFunds: selectedFunds,
        ...equityState
      });
    }
  };

  const startDrawing = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const continueDrawing = (x, y) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    continueDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    continueDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <div className="cp-signup-form-header">
          <h1>Other Investment Products / T&amp;C Agreement</h1>
          <p>Select additional unit trust products and review CAL Equity options</p>
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
                  <h3>Diversification</h3>
                  <p>
                    Selecting multiple funds with different risk levels can help
                    diversify your overall portfolio.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Default Enrolments</h3>
                  <p>
                    You are already enrolled for a core set of income and money
                    market funds to keep your portfolio active.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Equity Trading</h3>
                  <p>
                    CAL Equity / Stock Brokering gives you access to the stock
                    market. Review the terms carefully before enabling.
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
                <span>Customise your product set</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="cp-signup-form" onSubmit={handleSubmit}>
            {/* Optional funds */}
            <div className="cp-form-section">
              <p className="cp-section-helper">
                Please select any of our other unit trust funds should you wish to be
                enrolled.
              </p>
              <div className="cp-fund-grid">
                {optionalFunds.map((fund) => {
                  const selected = selectedFunds.includes(fund);
                  return (
                    <button
                      key={fund}
                      type="button"
                      className={
                        selected ? 'cp-fund-card cp-fund-card-selected' : 'cp-fund-card'
                      }
                      onClick={() => toggleFund(fund)}
                    >
                      <span className="cp-fund-name">{fund}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default funds */}
            <div className="cp-form-section">
              <p className="cp-section-helper">
                You have been enrolled for the below ongoing funds by default.
              </p>
              <div className="cp-default-funds-grid">
                {defaultFunds.map((fund) => (
                  <div key={fund} className="cp-default-fund-card">
                    {fund}
                  </div>
                ))}
              </div>
            </div>

            {/* CAL Equity section */}
            <div className="cp-form-section cp-equity-section">
              <div className="cp-form-group">
                <label className="cp-equity-question">
                  Would you like to enable the CAL Equity/Stock Brokering product as
                  well?
                </label>
                <button
                  type="button"
                  className="cp-see-more-btn"
                  onClick={() => setShowEquityDetails((prev) => !prev)}
                >
                  {showEquityDetails ? 'Hide Details' : 'See More Details'}
                </button>
              </div>

              {showEquityDetails && (
                <div className="cp-equity-details">
                  <div className="cp-form-group">
                    <label className="cp-radio-label">
                      Do you have an existing CDS code
                    </label>
                    <div className="cp-radio-group">
                      <label className="cp-radio-option">
                        <input
                          type="radio"
                          name="hasCDSCode"
                          value="Yes"
                          checked={equityState.hasCDSCode === 'Yes'}
                          onChange={handleEquityChange}
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="cp-radio-option">
                        <input
                          type="radio"
                          name="hasCDSCode"
                          value="No"
                          checked={equityState.hasCDSCode === 'No'}
                          onChange={handleEquityChange}
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="cp-equity-tcs">
                    <label className="cp-checkbox-row">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={equityState.agreeTerms}
                        onChange={handleEquityChange}
                      />
                      <span>I agree to the CAL Equity Terms and Conditions</span>
                    </label>
                    <label className="cp-checkbox-row">
                      <input
                        type="checkbox"
                        name="understandCDS"
                        checked={equityState.understandCDS}
                        onChange={handleEquityChange}
                      />
                      <span>
                        I understand that this will open a CDS/CSE account (if you
                        don’t have one already)
                      </span>
                    </label>
                    <label className="cp-checkbox-row">
                      <input
                        type="checkbox"
                        name="understandProcessing"
                        checked={equityState.understandProcessing}
                        onChange={handleEquityChange}
                      />
                      <span>
                        I understand that due to the above the application will require
                        extended processing time
                      </span>
                    </label>
                    <label className="cp-checkbox-row">
                      <input
                        type="checkbox"
                        name="signupEquity"
                        checked={equityState.signupEquity}
                        onChange={handleEquityChange}
                      />
                      <span>
                        I would like to signup for an Equity Stock Brokering account
                        (Please select account type below)
                      </span>
                    </label>
                  </div>

                  {/* Account type options */}
                  <div className="cp-account-options">
                    <button
                      type="button"
                      className={
                        equityState.accountType === 'internet'
                          ? 'cp-account-option selected'
                          : 'cp-account-option'
                      }
                      onClick={() =>
                        setEquityState((prev) => ({ ...prev, accountType: 'internet' }))
                      }
                    >
                      <div className="cp-account-radio-indicator" />
                      <div className="cp-account-content">
                        <div className="cp-account-title">
                          Internet Trading Only account (no margin)
                        </div>
                        <div className="cp-account-text">
                          This provides you with access to our online trading platform
                          only, with access to our research portal.
                        </div>
                        <div className="cp-account-note">
                          Please note this is a SELF TRADE ACCOUNT, you are responsible
                          for your investment decisions.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={
                        equityState.accountType === 'standard'
                          ? 'cp-account-option selected'
                          : 'cp-account-option'
                      }
                      onClick={() =>
                        setEquityState((prev) => ({ ...prev, accountType: 'standard' }))
                      }
                    >
                      <div className="cp-account-radio-indicator" />
                      <div className="cp-account-content">
                        <div className="cp-account-title">
                          Standard Account with Stock Broker assistance and Internet
                          Trading
                        </div>
                        <div className="cp-account-text">
                          Please note you need to have a starting investment of Rs 5Mn
                          to open this account.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Agreement / Email Indemnity */}
            <div className="cp-form-section cp-terms-section">
              <div className="cp-form-group">
                <label className="cp-checkbox-row cp-main-terms-row">
                  <input
                    type="checkbox"
                    name="agreeMainTerms"
                    checked={equityState.agreeMainTerms}
                    onChange={handleEquityChange}
                  />
                  <span>I Agree to the Terms &amp; Agreement and Email Indemnity.</span>
                </label>
                <button
                  type="button"
                  className="cp-see-more-btn"
                  onClick={() => setShowMainTerms((prev) => !prev)}
                >
                  {showMainTerms ? 'Hide' : 'View'}
                </button>
              </div>

              {showMainTerms && (
                <div className="cp-terms-panel">
                  <h3 className="cp-terms-title">Terms and Conditions</h3>
                  <p className="cp-terms-text">
                    <strong>
                      Consent to obtain verification of the client’s identity with the
                      Department of Registration of Persons
                    </strong>
                    <br />
                    You consent to the verification of your identity and authentication
                    of any data or document furnished by you to us (including but not
                    limited to your name, address, date of birth, National Identity Card
                    number and image) with the Department of the Registration of Persons
                    via any IT system or facility maintained by the said Department.
                  </p>

                  <p className="cp-terms-text">
                    <strong>Email Indemnity for instructions given by Clients</strong>
                    <br />
                    I/We the undersigned (“Client”) hereby request Sherwood Technologies
                    (PVT) LTD (as applicable) (“Company”) to accept and act upon my/our
                    instructions sent via electronic mail address set out herein
                    (“Instructions”) with regard to any transaction notwithstanding the
                    fact that the identity of the sender cannot be verified by the
                    Company.
                  </p>

                  <p className="cp-terms-text">
                    The Company shall not be liable to the Client or any third party, and
                    the Client shall indemnify the Company at all times against, any
                    loss, damage, claim, expense or liability, whether involving fraud or
                    not, and whether arising in contract, tort or otherwise, howsoever in
                    connection with any Instruction which appears to originate from the
                    Client or its authorized representative. Client is responsible for
                    ensuring sufficient safeguards are in place to prevent any
                    unauthorized Instructions being sent from the client’s systems.
                  </p>

                  <p className="cp-terms-text">
                    Until such time as the Company acknowledges the Instructions by
                    return mail, the instructions shall not be deemed delivered and the
                    Company shall have no liability for errors delays or losses caused as
                    a result thereof. The Company has absolute discretion to reject/not
                    act on an instruction and request the Client to provide a written
                    confirmation duly signed by the Client.
                  </p>

                  <p className="cp-terms-text">
                    <strong>Risk Disclosure</strong>
                    <br />
                    I/We hereby declare that I/We understand that my/our investments are
                    subject to market and/or interest rate risks and volatility and the
                    Capital Alliance Group shall not hold any responsibility or liability
                    for the same.
                  </p>

                  <p className="cp-terms-text">
                    <strong>Terms &amp; Conditions</strong>
                    <br />
                    I/We hereby declare that the above information given by me/us is true
                    and correct and agree to give notice in writing of any change of
                    particulars given. I/We hereby give consent to open a CDS
                    Account/PWM Account/UT Fund Account and declare that I/we have read
                    and understood the contents of the Unit Trust Terms &amp; Conditions,
                    Key Investor Information Document and Trust Deed of the respective
                    funds/CAS Client Agreement/ Portfolio Management Agreement. Applicant
                    is required to read and understand the Key Investor Information
                    Document (KIID) governing the respective Capital Alliance Investments
                    Ltd (CALI) Unit Trust Fund/s the Applicant is investing in.
                  </p>

                  <p className="cp-terms-text">
                    Applicant shall forward to CALI a Redemption request for any part or
                    all of the Unit Trust funds subject to the terms of the KIID. If
                    Applicant has not already provided instructions prior to sending an
                    instruction for remittance of income payment, the Applicant may
                    nominate a bank account to which funds may be remitted along with the
                    instructions. The applicant shall submit a bank statement (within
                    three months) of a bank account which is maintained under the
                    Applicant’s name and Applicant shall notify CALI in writing of any
                    changes.
                  </p>

                  {/* Email Indemnity accordion */}
                  <div className="cp-accordion">
                    <button
                      type="button"
                      className="cp-accordion-header"
                      onClick={() =>
                        setShowEmailIndemnity((prev) => !prev)
                      }
                    >
                      <span>Email Indemnity</span>
                      <span className="cp-accordion-icon">
                        {showEmailIndemnity ? '−' : '+'}
                      </span>
                    </button>
                    {showEmailIndemnity && (
                      <div className="cp-accordion-body">
                        <p className="cp-terms-text">
                          I/We the undersigned hereby request the Company to accept
                          my/our instructions by email subject to the following
                          conditions:
                        </p>
                        <p className="cp-terms-text">
                          Company is hereby authorized to accept and execute Client
                          instructions received via electronic mail (“E-Mail”) with
                          regard to any matters or transactions whatsoever
                          notwithstanding the fact that the identity of the person giving
                          any such E-Mail cannot be authenticated by the Company.
                        </p>
                        <p className="cp-terms-text">
                          Any Instruction via E-Mail which appears to the Company to
                          originate from Client or Client’s authorized representative
                          shall be conclusively presumed for the Company’s benefit to be
                          duly authorized by and legally binding on the Client, and the
                          Client shall be fully responsible for the same.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Privacy Notice accordion */}
                  <div className="cp-accordion">
                    <button
                      type="button"
                      className="cp-accordion-header"
                      onClick={() =>
                        setShowPrivacyNotice((prev) => !prev)
                      }
                    >
                      <span>Privacy Notice</span>
                      <span className="cp-accordion-icon">
                        {showPrivacyNotice ? '−' : '+'}
                      </span>
                    </button>
                    {showPrivacyNotice && (
                      <div className="cp-accordion-body">
                        <p className="cp-terms-text">
                          We are steadfast in our commitment to respecting your privacy.
                          Our privacy policy is available on our website and is deemed
                          incorporated by reference.
                        </p>
                        <p className="cp-terms-text">
                          The collection of your personal data for the purposes of this
                          application is an essential pre-requisite for us to provide you
                          with our services and to comply with applicable legal and
                          regulatory requirements, including the Personal Data Protection
                          Act, No. 09 of 2022 (PDPA).
                        </p>
                        <p className="cp-terms-text">
                          You have rights under the PDPA, including the right to access,
                          rectify and request erasure of your personal data, subject to
                          statutory limitations. For further details, please contact
                          calcompliance@cal.lk.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Applicant Signature */}
            <div className="cp-form-section cp-signature-section">
              <div className="cp-form-group">
                <label className="cp-signature-label">Applicant Signature</label>
                <p className="cp-signature-instruction">
                  Click and hold your mouse button (or use your finger on touch
                  devices) to draw your signature in the box below.
                </p>
              </div>
              <div className="cp-signature-box">
                <canvas
                  ref={canvasRef}
                  className="cp-signature-canvas"
                  width={800}
                  height={160}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={endDrawing}
                />
              </div>
              <button
                type="button"
                className="cp-signature-clear"
                onClick={clearSignature}
              >
                Clear Signature
              </button>
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

export default ClientOtherProductsForm;

