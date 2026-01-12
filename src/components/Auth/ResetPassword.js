import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const ResetPassword = ({ switchToLogin, token: propToken }) => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Get token from prop or URL query string
    const getToken = () => {
        if (propToken) return propToken;
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    };
    
    const token = getToken();

    useEffect(() => {
        if (!token) {
            setServerError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

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

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setServerError('Invalid reset link. Please request a new password reset.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setServerError('');
        setSuccessMessage('');

        try {
            await authService.resetPassword(token, formData.password);
            setSuccessMessage('Password has been reset successfully! Redirecting to login...');
            setTimeout(() => {
                if (switchToLogin) {
                    switchToLogin();
                }
            }, 2000);
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Failed to reset password');
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
                <h2>Reset Password</h2>
                <p className="auth-subtitle">Enter your new password</p>
                
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

                {token && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                placeholder="Enter your new password"
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
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
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

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

export default ResetPassword;

