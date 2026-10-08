import React, { useState } from 'react';
import './Styles/ClientSignupForm.css';

const ClientSignupForm = ({ onNext, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    fullName: initialData.fullName || '',
    otherNames: initialData.otherNames || '',
    nicNumber: initialData.nicNumber || '',
    dateOfBirth: initialData.dateOfBirth || '',
    gender: initialData.gender || '',
    nationality: initialData.nationality || 'Sri Lankan',
    countryOfBirth: initialData.countryOfBirth || 'Sri Lanka',
    maritalStatus: initialData.maritalStatus || '',
    mothersMaidenName: initialData.mothersMaidenName || '',
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
          <h1>Personal Details</h1>
          <p>Please provide your personal information exactly as it appears on your NIC</p>
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
                  <h3>Match your NIC</h3>
                  <p>Enter your full name and NIC number exactly as printed on your National Identity Card.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Date of birth</h3>
                  <p>Use the date of birth on your NIC. This is used for account verification.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Keep it accurate</h3>
                  <p>Incorrect personal details can delay KYC review and block dealing until they are corrected.</p>
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
              <h3 className="cp-section-title">Identity</h3>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="title">Title</label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="">Select title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Rev">Rev</option>
                  </select>
                </div>

                <div className="cp-form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="cp-form-group">
                <label htmlFor="fullName">Full name as per NIC</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="otherNames">
                  Other names <span className="cp-optional">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="otherNames"
                  name="otherNames"
                  value={formData.otherNames}
                  onChange={handleInputChange}
                  className="cp-form-input"
                />
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="nicNumber">NIC number</label>
                  <input
                    type="text"
                    id="nicNumber"
                    name="nicNumber"
                    value={formData.nicNumber}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="dateOfBirth">Date of birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="cp-form-section">
              <h3 className="cp-section-title">Background</h3>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="nationality">Nationality</label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="countryOfBirth">Country of birth</label>
                  <input
                    type="text"
                    id="countryOfBirth"
                    name="countryOfBirth"
                    value={formData.countryOfBirth}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="maritalStatus">Marital status</label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div className="cp-form-group">
                  <label htmlFor="mothersMaidenName">
                    Mother&apos;s maiden name <span className="cp-optional">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="mothersMaidenName"
                    name="mothersMaidenName"
                    value={formData.mothersMaidenName}
                    onChange={handleInputChange}
                    className="cp-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="cp-form-actions">
              <span />
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

export default ClientSignupForm;
