import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const Login = ({ onLogin, switchToSignup, switchToForgotPassword, onBackToManagers }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [authNotice, setAuthNotice] = useState('');

    useEffect(() => {
        const notice = sessionStorage.getItem('authNotice');
        if (notice) {
            setAuthNotice(notice);
            sessionStorage.removeItem('authNotice');
        }
    }, []);

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
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
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

        try {
            const response = await authService.login(formData);
            
            if (response.token) {
                const sessionUser = authService.setAuthSession({
                    user: response.user,
                    account_kind: response.account_kind,
                    company_role: response.company_role,
                    permissions: response.permissions,
                    company: response.company,
                });
                localStorage.setItem('token', response.token);
                onLogin(sessionUser, response.token);
            }
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Login failed');
            } else {
                setServerError(error.message || 'Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <aside className="auth-brand-panel" aria-label="Sherwood Equity">
                <div className="auth-brand-top">
                    <div className="auth-brand-mark">
                        <span className="auth-brand-mark__sherwood">Sherwood</span>
                        <span className="auth-brand-mark__equity">Equity</span>
                    </div>
                    <h1 className="auth-brand-headline">Sign in to manage positions, valuations, and reporting.</h1>
                    <p className="auth-brand-copy">
                        Secure access to your portfolio
                    </p>
                </div>
                <p className="auth-brand-bottom auth-brand-meta">Sherwood</p>
            </aside>

            <div className="auth-card">
                {onBackToManagers && (
                    <button
                        type="button"
                        className="auth-managers-link"
                        onClick={onBackToManagers}
                    >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                                d="M12.5 4.5 7 10l5.5 5.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Back to managers
                    </button>
                )}
                <div className="auth-card-header">
                    <h2>Sign in</h2>
                    <p className="auth-subtitle">Welcome Back</p>
                </div>

                {authNotice && (
                    <div className="success-message" role="status">
                        {authNotice}
                    </div>
                )}

                {serverError && (
                    <div className="error-message">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Enter your email"
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <div className="form-group-label-row">
                            <label htmlFor="password">Password</label>
                            {switchToForgotPassword && (
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={switchToForgotPassword}
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Enter your password"
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    <button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            className="link-button"
                            onClick={switchToSignup}
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;



