import React, { useState } from 'react';
import './Styles/ClientEmploymentForm.css';

const ClientEmploymentForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [formData, setFormData] = useState({
    employmentStatus: initialData.employmentStatus || 'Employed',
    natureOfEmployment: initialData.natureOfEmployment || 'Salaried (Private Company)',
    occupation: initialData.occupation || 'Associate Software Engineer',
    organizationName: initialData.organizationName || 'Sherwood Technologies (PVT) LTD',
    organizationAddress: initialData.organizationAddress || '8th Floor, 100/1 Elvitigala Mawatha, Colombo 00800',
    businessEmail: initialData.businessEmail || 'arani@sherwood.lk',
    workingRemotely: initialData.workingRemotely || false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
          <h1>Employment Details</h1>
          <p>Please provide your employment and professional information</p>
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
                  <h3>Current Information</h3>
                  <p>Provide your current employment status and details as they appear in your official records.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Accurate Details</h3>
                  <p>Ensure your organization name and address match your employment documentation.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Business Email</h3>
                  <p>Use your official business email address for professional correspondence.</p>
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
              <div className="cp-form-group">
                <label htmlFor="employmentStatus">Employment Status</label>
                <select
                  id="employmentStatus"
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  <option value="Self Employed">Self Employed</option>
                  <option value="Employed">Employed</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                  <option value="Un-Employed">Un-Employed</option>
                </select>
              </div>

              <div className="cp-form-group">
                <label htmlFor="natureOfEmployment">Nature of Employment</label>
                <select
                  id="natureOfEmployment"
                  name="natureOfEmployment"
                  value={formData.natureOfEmployment}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  <option value="Salaried (Private Company)">Salaried (Private Company)</option>
                  <option value="Salaried (Government)">Salaried (Government)</option>
                  <option value="Salaried (Semi-Government)">Salaried (Semi-Government)</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="cp-form-group">
                <label htmlFor="occupation">Occupation</label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="organizationName">Organization / Business Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="organizationAddress">Organization / Business Address</label>
                <input
                  type="text"
                  id="organizationAddress"
                  name="organizationAddress"
                  value={formData.organizationAddress}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="businessEmail">Business Email</label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="workingRemotely" className="cp-checkbox-label">
                  <input
                    type="checkbox"
                    id="workingRemotely"
                    name="workingRemotely"
                    checked={formData.workingRemotely}
                    onChange={handleInputChange}
                    className="cp-checkbox-input"
                  />
                  <span>Working Remotely from Sri Lanka</span>
                </label>
              </div>
            </div>

            <div className="cp-form-actions">
              <button 
                type="button" 
                className="cp-previous-btn"
                onClick={onPrevious}
              >
                <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                </svg>
                Previous
              </button>
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

export default ClientEmploymentForm;
