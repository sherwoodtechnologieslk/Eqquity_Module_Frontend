import React, { useState } from 'react';
import './Styles/ClientAdditionalDetailsForm.css';

const residencyOptions = [
  'Board / Lodging',
  "Friend’s / Relative’s",
  'Lease / Rent',
  'Official',
  'Owner',
  'With Parents'
];

const ClientAdditionalDetailsForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [formData, setFormData] = useState({
    statusOfResidency: initialData.statusOfResidency || 'With Parents',
    dualCitizenship: initialData.dualCitizenship || 'No',
    connectedBusinesses: initialData.connectedBusinesses || '',
    otherRemarks: initialData.otherRemarks || 'N/A',
    pepDomestic: initialData.pepDomestic || 'No',
    pepDomesticExplanation: initialData.pepDomesticExplanation || '',
    pepForeign: initialData.pepForeign || 'No',
    pepForeignExplanation: initialData.pepForeignExplanation || '',
    pepRelated: initialData.pepRelated || 'No',
    pepRelatedExplanation: initialData.pepRelatedExplanation || '',
    pepCloselyAssociated: initialData.pepCloselyAssociated || 'No',
    pepCloselyAssociatedExplanation:
      initialData.pepCloselyAssociatedExplanation || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
          <h1>Additional Details Verification</h1>
          <p>Please provide residency and PEP related information</p>
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
              <h2>Why we ask</h2>
            </div>
            <div className="cp-tips-content">
              <div className="cp-tip-item">
                <div className="cp-tip-number">01</div>
                <div className="cp-tip-text">
                  <h3>Residency Status</h3>
                  <p>
                    Your status of residency helps us comply with local regulations
                    and determine appropriate documentation.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Dual Citizenship</h3>
                  <p>
                    Dual citizenship details are used only for regulatory reporting
                    and tax-related requirements.
                  </p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>PEP Screening</h3>
                  <p>
                    Politically Exposed Person (PEP) questions help us meet global
                    AML/CFT standards and keep your account secure.
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
                <span>Confidential &amp; compliant</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="cp-signup-form" onSubmit={handleSubmit}>
            {/* Residency & Dual Citizenship */}
            <div className="cp-form-section">
              <div className="cp-form-group">
                <label htmlFor="statusOfResidency">Status Of Residency</label>
                <select
                  id="statusOfResidency"
                  name="statusOfResidency"
                  value={formData.statusOfResidency}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  {residencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Dual Citizenship Details (Optional)
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="dualCitizenship"
                      value="Yes"
                      checked={formData.dualCitizenship === 'Yes'}
                      onChange={handleInputChange}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="dualCitizenship"
                      value="No"
                      checked={formData.dualCitizenship === 'No'}
                      onChange={handleInputChange}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="cp-form-group">
                <label htmlFor="connectedBusinesses">
                  Any Other Connected Businesses / Professional Activities
                </label>
                <textarea
                  id="connectedBusinesses"
                  name="connectedBusinesses"
                  value={formData.connectedBusinesses}
                  onChange={handleInputChange}
                  className="cp-form-input cp-textarea"
                  rows={3}
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="otherRemarks">Other Remarks</label>
                <textarea
                  id="otherRemarks"
                  name="otherRemarks"
                  value={formData.otherRemarks}
                  onChange={handleInputChange}
                  className="cp-form-input cp-textarea"
                  rows={2}
                />
              </div>
            </div>

            {/* PEP Questions */}
            <div className="cp-form-section">
              {/* Domestic PEP */}
              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Are you an individual who is or has been entrusted domestically with
                  prominent public functions?
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepDomestic"
                      value="Yes"
                      checked={formData.pepDomestic === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepDomestic"
                      value="No"
                      checked={formData.pepDomestic === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.pepDomestic === 'Yes' && (
                  <textarea
                    name="pepDomesticExplanation"
                    value={formData.pepDomesticExplanation}
                    onChange={handleInputChange}
                    className="cp-form-input cp-textarea"
                    placeholder='If "Yes" please provide explanation'
                    rows={2}
                  />
                )}
              </div>

              {/* Foreign PEP */}
              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Are you an individual who is or has been entrusted with prominent
                  public functions by a foreign country?
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepForeign"
                      value="Yes"
                      checked={formData.pepForeign === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepForeign"
                      value="No"
                      checked={formData.pepForeign === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.pepForeign === 'Yes' && (
                  <textarea
                    name="pepForeignExplanation"
                    value={formData.pepForeignExplanation}
                    onChange={handleInputChange}
                    className="cp-form-input cp-textarea"
                    placeholder='If "Yes" please provide explanation'
                    rows={2}
                  />
                )}
              </div>

              {/* Related to PEP */}
              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Are you an individual who is related to Politically Exposed Persons
                  (PEPs) either directly (consanguinity) or through marriage or similar
                  (civil) forms of partnership?
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepRelated"
                      value="Yes"
                      checked={formData.pepRelated === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepRelated"
                      value="No"
                      checked={formData.pepRelated === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.pepRelated === 'Yes' && (
                  <textarea
                    name="pepRelatedExplanation"
                    value={formData.pepRelatedExplanation}
                    onChange={handleInputChange}
                    className="cp-form-input cp-textarea"
                    placeholder='If "Yes" please explain the relationship'
                    rows={2}
                  />
                )}
              </div>

              {/* Closely connected to PEP */}
              <div className="cp-form-group">
                <label className="cp-radio-label">
                  Are you an individual who is closely connected to a Politically
                  Exposed Person (PEP), either socially or professionally?
                </label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepCloselyAssociated"
                      value="Yes"
                      checked={formData.pepCloselyAssociated === 'Yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="pepCloselyAssociated"
                      value="No"
                      checked={formData.pepCloselyAssociated === 'No'}
                      onChange={handleInputChange}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.pepCloselyAssociated === 'Yes' && (
                  <textarea
                    name="pepCloselyAssociatedExplanation"
                    value={formData.pepCloselyAssociatedExplanation}
                    onChange={handleInputChange}
                    className="cp-form-input cp-textarea"
                    placeholder='If "Yes" please explain the relationship'
                    rows={2}
                  />
                )}
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

export default ClientAdditionalDetailsForm;

