import React, { useState } from 'react';
import './Styles/ClientContactForm.css';

const ClientContactForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [formData, setFormData] = useState({
    mobileNo: initialData.mobileNo || '',
    email: initialData.email || '',
    emailVerified: initialData.emailVerified || false,
    telephoneNo: initialData.telephoneNo || '',
    mailingInstructions: initialData.mailingInstructions || '',
    addressLine1: initialData.addressLine1 || '',
    addressLine2: initialData.addressLine2 || '',
    city: initialData.city || '',
    postalCode: initialData.postalCode || '',
    district: initialData.district || '',
    country: initialData.country || '',
    usePermanentAsCorrespondence: initialData.usePermanentAsCorrespondence || ''
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
          <h1>Contact Details</h1>
          <p>Please provide your contact information and address details</p>
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
                  <h3>Valid Contact Information</h3>
                  <p>Ensure your mobile number and email are active and accessible for important notifications.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <h3>Accurate Address</h3>
                  <p>Enter your address exactly as it appears on your NIC to avoid verification issues.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <h3>Postal Code</h3>
                  <p>Use the correct postal code for your area to ensure timely delivery of documents.</p>
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
            {/* Contact Details Section */}
            <div className="cp-form-section">
              <h3 className="cp-section-title">Contact Details</h3>
              
              <div className="cp-form-group">
                <label htmlFor="mobileNo">Mobile No</label>
                <input
                  type="tel"
                  id="mobileNo"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="emailVerified" className="cp-checkbox-label">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    name="emailVerified"
                    checked={formData.emailVerified}
                    onChange={handleInputChange}
                    className="cp-checkbox-input"
                  />
                  <span>Email Verified</span>
                </label>
              </div>

              <div className="cp-form-group">
                <label htmlFor="telephoneNo">Telephone No <span className="cp-optional">(Optional)</span></label>
                <input
                  type="tel"
                  id="telephoneNo"
                  name="telephoneNo"
                  value={formData.telephoneNo}
                  onChange={handleInputChange}
                  className="cp-form-input"
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="mailingInstructions">Mailing Instructions</label>
                <select
                  id="mailingInstructions"
                  name="mailingInstructions"
                  value={formData.mailingInstructions}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                >
                  <option value="">Select mailing instruction</option>
                  <option value="Email to above e-mail address">Email to above e-mail address</option>
                  <option value="Post to address below">Post to address below</option>
                  <option value="Both email and post">Both email and post</option>
                </select>
              </div>
            </div>

            {/* Address Section */}
            <div className="cp-form-section">
              <h3 className="cp-section-title">Enter Address as per your NIC (Permanent Address)</h3>
              
              <div className="cp-form-group">
                <label htmlFor="addressLine1">Address Line 1</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="cp-form-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="cp-form-input"
                />
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="postalCode">Postal Code (Find Code)</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label htmlFor="district">District</label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Correspondence Address Section */}
            <div className="cp-form-section">
              <div className="cp-form-group">
                <label className="cp-radio-label">Use Permanent Address as Correspondence/Current Address</label>
                <div className="cp-radio-group">
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="usePermanentAsCorrespondence"
                      value="Yes"
                      checked={formData.usePermanentAsCorrespondence === 'Yes'}
                      onChange={handleInputChange}
                      className="cp-radio-input"
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="cp-radio-option">
                    <input
                      type="radio"
                      name="usePermanentAsCorrespondence"
                      value="No"
                      checked={formData.usePermanentAsCorrespondence === 'No'}
                      onChange={handleInputChange}
                      className="cp-radio-input"
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

export default ClientContactForm;
