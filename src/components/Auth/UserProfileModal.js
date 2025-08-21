import React from 'react';
import './UserProfileModal.css';

const UserProfileModal = ({ user, isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName ? firstName.charAt(0) : '';
        const last = lastName ? lastName.charAt(0) : '';
        return (first + last).toUpperCase();
    };

    return (
        <div className="upm-modal-overlay" onClick={handleBackdropClick}>
            <div className="upm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="upm-modal-header">
                    <div className="upm-header-content">
                        <div className="upm-header-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="upm-header-text">
                            <h2>User Profile</h2>
                            <p>Manage your account information</p>
                        </div>
                    </div>
                    <button className="upm-close-button" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div className="upm-modal-body">
                    <div className="upm-profile-section">
                        <div className="upm-profile-avatar">
                            {getInitials(user?.first_name, user?.last_name)}
                        </div>
                        <div className="upm-profile-info">
                            <h3>{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'User Name'}</h3>
                            <span className="upm-user-role">Active User</span>
                        </div>
                    </div>
                    
                    <div className="upm-form-section">
                        <h4>Account Details</h4>
                        <div className="upm-form-row">
                            <div className="upm-form-group">
                                <label>Email Address</label>
                                <div className="upm-readonly-input">
                                    {user?.email || 'N/A'}
                                </div>
                            </div>
                            <div className="upm-form-group">
                                <label>User ID</label>
                                <div className="upm-readonly-input">
                                    {user?.id || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="upm-form-row">
                            <div className="upm-form-group">
                                <label>First Name</label>
                                <div className="upm-readonly-input">
                                    {user?.first_name || 'N/A'}
                                </div>
                            </div>
                            <div className="upm-form-group">
                                <label>Last Name</label>
                                <div className="upm-readonly-input">
                                    {user?.last_name || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="upm-form-group">
                            <label>Account Status</label>
                            <div className="upm-status-badge">
                                <span className="upm-status-dot"></span>
                                Active
                            </div>
                        </div>
                    </div>
                </div>
                

            </div>
        </div>
    );
};

export default UserProfileModal;
