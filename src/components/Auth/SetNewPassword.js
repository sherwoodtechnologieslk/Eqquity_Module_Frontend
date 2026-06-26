import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { getApiErrorMessage, validatePasswordStrength } from '../../utils/passwordValidation';
import PasswordRequirements from './PasswordRequirements';
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
        } else {
            const strength = validatePasswordStrength(formData.newPassword);
            if (!strength.valid) {
                newErrors.newPassword = `Password must include: ${strength.errors.join(', ')}`;
            }
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
            const result = await authService.setNewPassword(email, pin, formData.newPassword);

            setSuccessMessage(result.message || 'Password changed successfully. Redirecting to sign in…');

            setTimeout(() => {
                if (switchToLogin) {
                    if (result.logout_required) {
                        sessionStorage.setItem(
                            'authNotice',
                            result.message || 'Password updated successfully. Sign in with your new password.'
                        );
                    }
                    switchToLogin();
                }
            }, 2000);
        } catch (error) {
            setServerError(getApiErrorMessage(error, 'Failed to change password'));
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
                        <PasswordRequirements password={formData.newPassword} />
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
