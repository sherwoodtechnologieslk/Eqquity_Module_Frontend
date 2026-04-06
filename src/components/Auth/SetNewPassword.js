import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const SetNewPassword = ({ email, pin, switchToLogin, goBackToPin }) => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
        setServerError('');
        setSuccessMessage('');
    };

    const validateForm = () => {
        const newErrors = {};

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

        if (!email || !pin) {
            setServerError('Session expired. Please start forgot password again.');
            return;
        }

        setIsLoading(true);
        setServerError('');
        setSuccessMessage('');

        try {
            await authService.setNewPassword(email, pin, formData.newPassword);

            setSuccessMessage('Password changed successfully. Redirecting to sign in…');

            setTimeout(() => {
                if (switchToLogin) {
                    switchToLogin();
                }
            }, 2000);
        } catch (error) {
            if (error.response) {
                const msg = error.response.data.message || '';
                if (
                    error.response.status === 400 &&
                    (msg.includes('Invalid') || msg.includes('code') || msg.includes('expired'))
                ) {
                    setServerError(
                        msg.includes('expired')
                            ? 'Verification code expired. Go back and request a new code.'
                            : 'Verification code is incorrect. Check the code from your email or go back to re-enter it.'
                    );
                } else {
                    setServerError(msg || 'Failed to change password');
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
                <h2>Set new password</h2>
                <p className="auth-subtitle">Choose a new password for your account</p>

                {email && (
                    <div
                        style={{
                            backgroundColor: '#eff6ff',
                            color: '#1e40af',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                        }}
                    >
                        Account: <strong>{email}</strong>
                    </div>
                )}

                {serverError && <div className="error-message">{serverError}</div>}

                {successMessage && (
                    <div
                        className="success-message"
                        style={{
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="newPassword">New password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className={errors.newPassword ? 'error' : ''}
                            placeholder="Enter your new password"
                            autoComplete="new-password"
                        />
                        {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm new password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Confirm your new password"
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && (
                            <span className="error-text">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <button type="submit" className="auth-button primary" disabled={isLoading}>
                        {isLoading ? 'Updating…' : 'Update password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {goBackToPin && (
                            <>
                                <button type="button" className="link-button" onClick={goBackToPin}>
                                    Back to verification code
                                </button>
                                <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>·</span>
                            </>
                        )}
                        <button type="button" className="link-button" onClick={switchToLogin}>
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetNewPassword;
