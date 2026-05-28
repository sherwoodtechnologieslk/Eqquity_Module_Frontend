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

    const fullName =
        user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : 'User Name';

    return (
        <div className="upm-modal-overlay" onClick={handleBackdropClick}>
            <div className="upm-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Identity Header */}
                <div className="upm-modal-header">
                    <button
                        className="upm-close-button"
                        onClick={onClose}
                        aria-label="Close profile"
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div className="upm-header-meta">
                        <span className="upm-header-eyebrow">User Profile</span>
                        <span className="upm-header-tagline">
                            Manage your account information
                        </span>
                    </div>

                    <div className="upm-identity">
                        <div className="upm-profile-avatar">
                            {getInitials(user?.first_name, user?.last_name)}
                        </div>
                        <div className="upm-identity-text">
                            <h2 className="upm-identity-name">{fullName}</h2>
                            <div className="upm-identity-badges">
                                <span className="upm-status-badge">
                                    <span className="upm-status-dot"></span>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Details Grid */}
                <div className="upm-modal-body">
                    <div className="upm-section-heading">
                        <h4>Account Details</h4>
                    </div>

                    <div className="upm-info-grid">
                        <div className="upm-info-cell">
                            <span className="upm-info-label">Email Address</span>
                            <span className="upm-info-value">
                                {user?.email || 'N/A'}
                            </span>
                        </div>
                        <div className="upm-info-cell">
                            <span className="upm-info-label">User ID</span>
                            <span className="upm-info-value">
                                {user?.id || 'N/A'}
                            </span>
                        </div>
                        <div className="upm-info-cell">
                            <span className="upm-info-label">First Name</span>
                            <span className="upm-info-value">
                                {user?.first_name || 'N/A'}
                            </span>
                        </div>
                        <div className="upm-info-cell">
                            <span className="upm-info-label">Last Name</span>
                            <span className="upm-info-value">
                                {user?.last_name || 'N/A'}
                            </span>
                        </div>
                        <div className="upm-info-cell upm-info-cell--wide">
                            <span className="upm-info-label">Funds Center</span>
                            <span className="upm-info-value upm-info-value--funds">
                                {user?.fundsCenter ||
                                    'Colombo (Colombo Stock Exchange – CSE) 🇱🇰'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
