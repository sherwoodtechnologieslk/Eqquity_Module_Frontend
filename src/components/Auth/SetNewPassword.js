import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const SetNewPassword = ({ email, code, switchToLogin }) => {
    const [formData, setFormData] = useState({
        verificationCode: code || '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
        setServerError('');
        setSuccessMessage('');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.verificationCode) {
            newErrors.verificationCode = 'Verification code is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        if (!email) {
            setServerError('Email is required. Please go back and try again.');
            return;
        }

        setIsLoading(true);
        setServerError('');
        setSuccessMessage('');

        try {
            // Set new password using the code for verification
            await authService.setNewPassword(email, formData.verificationCode, formData.newPassword);
            
            setSuccessMessage('Password changed successfully! Redirecting to login...');
            
            setTimeout(() => {
                if (switchToLogin) {
                    switchToLogin();
                }
            }, 2000);
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400 && (error.response.data.message?.includes('Invalid') || error.response.data.message?.includes('code'))) {
                    setServerError('Verification code is incorrect. Please check the code and try again.');
                } else {
                    setServerError(error.response.data.message || 'Failed to change password');
                }
            } else {
                setServerError(error.message || 'Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Set New Password</h2>
                <p className="auth-subtitle">Enter your verification code and new password</p>
                
                {email && (
                    <div style={{ 
                        backgroundColor: '#eff6ff', 
                        color: '#1e40af', 
                        padding: '0.75rem', 
                        borderRadius: '0.5rem', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        Resetting password for: <strong>{email}</strong>
                    </div>
                )}
                
                {serverError && (
                    <div className="error-message">
                        {serverError}
                    </div>
                )}

                {successMessage && (
                    <div className="success-message" style={{ 
                        backgroundColor: '#d1fae5', 
                        color: '#065f46', 
                        padding: '1rem', 
                        borderRadius: '0.5rem', 
                        marginBottom: '1.5rem' 
                    }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="verificationCode">Verification Code</label>
                        <input
                            type="text"
                            id="verificationCode"
                            name="verificationCode"
                            value={formData.verificationCode}
                            onChange={handleChange}
                            className={errors.verificationCode ? 'error' : ''}
                            placeholder="Enter the code you received"
                            disabled={!!code} // Disable if code is pre-filled
                        />
                        {errors.verificationCode && <span className="error-text">{errors.verificationCode}</span>}
                        {code && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Code is pre-filled. You can edit it if needed.
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className={errors.newPassword ? 'error' : ''}
                            placeholder="Enter your new password"
                        />
                        {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Confirm your new password"
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <button 
                            type="button" 
                            className="link-button"
                            onClick={switchToLogin}
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetNewPassword;

