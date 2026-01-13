import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const ChangePassword = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
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

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
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

        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setServerError('');
        setSuccessMessage('');

        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword);
            setSuccessMessage('Password changed successfully!');
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Failed to change password');
            } else {
                setServerError(error.message || 'Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="auth-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Change Password</h2>
                <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>Update your account password</p>
                
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
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className={errors.currentPassword ? 'error' : ''}
                            placeholder="Enter your current password"
                        />
                        {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
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

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button 
                            type="submit" 
                            className="auth-button primary"
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            {isLoading ? 'Changing...' : 'Change Password'}
                        </button>
                        {onCancel && (
                            <button 
                                type="button" 
                                className="auth-button"
                                onClick={onCancel}
                                disabled={isLoading}
                                style={{ flex: 1, backgroundColor: '#e5e7eb', color: '#374151' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;


