import React, { useState } from 'react';
import './Styles/ClientSettings.css';

const ClientSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    statementAlerts: true,
    navUpdates: true,
    transactionAlerts: true
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (key) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key]
    });
  };

  const handleSaveProfile = () => {
    alert('Profile update will be implemented with backend integration');
    console.log('Saving profile:', formData);
  };

  const handleChangePassword = () => {
    alert('Password change functionality will be implemented');
  };

  return (
    <div className="cp-settings">
      <div className="cp-settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="cp-settings-container">
        <div className="cp-settings-sidebar">
          <button 
            className={`cp-settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`cp-settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`cp-settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        <div className="cp-settings-content">
          {activeTab === 'profile' && (
            <div className="cp-settings-section">
              <h2>Profile Information</h2>
              <div className="cp-settings-form">
                <div className="cp-form-row">
                  <div className="cp-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="cp-form-input"
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="cp-form-input"
                    />
                  </div>
                </div>
                <div className="cp-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="cp-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>
                <div className="cp-form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="cp-form-input"
                    placeholder="Street address"
                  />
                </div>
                <div className="cp-form-row">
                  <div className="cp-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="cp-form-input"
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="cp-form-input"
                    />
                  </div>
                </div>
                <button className="cp-save-btn" onClick={handleSaveProfile}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="cp-settings-section">
              <h2>Notification Preferences</h2>
              <div className="cp-notification-settings">
                <div className="cp-notification-item">
                  <div className="cp-notification-info">
                    <h4>Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                    <span className="cp-toggle-slider"></span>
                  </label>
                </div>
                <div className="cp-notification-item">
                  <div className="cp-notification-info">
                    <h4>SMS Notifications</h4>
                    <p>Receive notifications via SMS</p>
                  </div>
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={() => handleNotificationChange('smsNotifications')}
                    />
                    <span className="cp-toggle-slider"></span>
                  </label>
                </div>
                <div className="cp-notification-item">
                  <div className="cp-notification-info">
                    <h4>Statement Alerts</h4>
                    <p>Get notified when new statements are available</p>
                  </div>
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.statementAlerts}
                      onChange={() => handleNotificationChange('statementAlerts')}
                    />
                    <span className="cp-toggle-slider"></span>
                  </label>
                </div>
                <div className="cp-notification-item">
                  <div className="cp-notification-info">
                    <h4>NAV Updates</h4>
                    <p>Receive daily NAV updates</p>
                  </div>
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.navUpdates}
                      onChange={() => handleNotificationChange('navUpdates')}
                    />
                    <span className="cp-toggle-slider"></span>
                  </label>
                </div>
                <div className="cp-notification-item">
                  <div className="cp-notification-info">
                    <h4>Transaction Alerts</h4>
                    <p>Get notified about transaction status</p>
                  </div>
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={notificationSettings.transactionAlerts}
                      onChange={() => handleNotificationChange('transactionAlerts')}
                    />
                    <span className="cp-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="cp-settings-section">
              <h2>Security Settings</h2>
              <div className="cp-security-settings">
                <div className="cp-security-item">
                  <div className="cp-security-info">
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <button className="cp-action-btn" onClick={handleChangePassword}>
                    Change Password
                  </button>
                </div>
                <div className="cp-security-item">
                  <div className="cp-security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="cp-action-btn secondary">
                    Enable 2FA
                  </button>
                </div>
                <div className="cp-security-item">
                  <div className="cp-security-info">
                    <h4>Login History</h4>
                    <p>View your recent login activity</p>
                  </div>
                  <button className="cp-action-btn secondary">
                    View History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
