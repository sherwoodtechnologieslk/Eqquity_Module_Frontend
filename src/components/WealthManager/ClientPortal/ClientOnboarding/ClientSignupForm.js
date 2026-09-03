import React, { useState } from 'react';
import './Styles/ClientSignupForm.css';

const ClientSignupForm = ({ onNext, initialData = {} }) => {
  const [formData, setFormData] = useState({
    gender: initialData.gender || '',
    title: initialData.title || '',
    lastName: initialData.lastName || '',
    initialsWithoutSurname: initialData.initialsWithoutSurname || '',
    fullNameExceptLastName: initialData.fullNameExceptLastName || '',
    dateOfBirth: initialData.dateOfBirth || '',
    nationality: initialData.nationality || '',
    nicDateOfIssue: initialData.nicDateOfIssue || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
          <h1>Personal Details</h1>
          <p>Please provide your personal information to continue</p>
        </div>

        <div className="cp-signup-form-content">
          {/* Pro Tips Section */}
          <div className="cp-pro-tips-section">
            <div className="cp-tips-header">
              <div className="cp-tips-icon">
                <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2>Pro Tips</h2>
            </div>
            <div className="cp-tips-content">
              <div className="cp-tip-item">
                <div className="cp-tip-number">01</div>
                <div className="cp-tip-text">
                  <h3>Accuracy Matters</h3>
                  <p>Ensure all information matches exactly with your supporting documents to prevent processing delays.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Document Verification</h3>
                  <p>Double-check your name spelling, dates, and identification numbers before submitting.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Complete Information</h3>
                  <p>Fill in all required fields accurately. Incomplete or incorrect data may require resubmission.</p>
                </div>
              </div>
            </div>
            <div className="cp-tips-footer">
              <div className="cp-tips-badge">
                <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Secure & Verified</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="cp-signup-form" onSubmit={handleSubmit}>
          <div className="cp-form-section">
            <div className="cp-form-row">
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
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

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
                  <option value="MISS.">MISS.</option>
                  <option value="MR.">MR.</option>
                  <option value="MRS.">MRS.</option>
                  <option value="MS.">MS.</option>
                  <option value="DR.">DR.</option>
                  <option value="PROF.">PROF.</option>
                </select>
              </div>
            </div>

            <div className="cp-form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="cp-form-input"
                required
              />
            </div>

            <div className="cp-form-group">
              <label htmlFor="initialsWithoutSurname">Initials without Surname</label>
              <input
                type="text"
                id="initialsWithoutSurname"
                name="initialsWithoutSurname"
                value={formData.initialsWithoutSurname}
                onChange={handleInputChange}
                className="cp-form-input"
                required
                placeholder="e.g., WAS"
              />
            </div>

            <div className="cp-form-group">
              <label htmlFor="fullNameExceptLastName">Full Name Except the Last Name</label>
              <input
                type="text"
                id="fullNameExceptLastName"
                name="fullNameExceptLastName"
                value={formData.fullNameExceptLastName}
                onChange={handleInputChange}
                className="cp-form-input"
                required
              />
            </div>

            <div className="cp-form-row">
              <div className="cp-form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
                <small className="cp-form-hint">YYYY/MM/DD</small>
              </div>

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
            </div>

            <div className="cp-form-group">
              <label htmlFor="nicDateOfIssue">NIC Date Of Issue</label>
              <input
                type="date"
                id="nicDateOfIssue"
                name="nicDateOfIssue"
                value={formData.nicDateOfIssue}
                onChange={handleInputChange}
                className="cp-form-input"
                required
              />
            </div>
          </div>

          <div className="cp-form-actions">
            <button type="submit" className="cp-next-btn">
              Next
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
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
