import React, { useState } from 'react';
import axios from 'axios';
import { validatePasswordStrength } from '../../utils/passwordValidation';
import PasswordRequirements from './PasswordRequirements';
import './Auth.css';

const Signup = ({ onSignup, switchToLogin }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        fundsCenter: 'Colombo (Colombo Stock Exchange – CSE) 🇱🇰'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    
    const fundsCenters = [
        { name: 'Colombo (Colombo Stock Exchange – CSE)', flag: '🇱🇰' },
        { name: 'New York (NYSE, NASDAQ)', flag: '🇺🇸' },
        { name: 'Chicago (CBOE)', flag: '🇺🇸' },
        { name: 'London (London Stock Exchange)', flag: '🇬🇧' },
        { name: 'Tokyo (Tokyo Stock Exchange)', flag: '🇯🇵' },
        { name: 'Sydney (ASX)', flag: '🇦🇺' },
        { name: 'Singapore (SGX)', flag: '🇸🇬' },
        { name: 'Shanghai (SSE)', flag: '🇨🇳' }
    ];

    const handleChange = (e) => {
        // Prevent changing fundsCenter - keep it locked to Colombo
        if (e.target.name === 'fundsCenter') {
            return;
        }
        
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

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const strength = validatePasswordStrength(formData.password);
            if (!strength.valid) {
                newErrors.password = `Password must include: ${strength.errors.join(', ')}`;
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.fundsCenter) {
            newErrors.fundsCenter = 'Funds center is required';
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
            const { confirmPassword, ...signupData } = formData;
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/auth/signup`, signupData);
            
            if (response.data.token) {
                // Store token in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Call parent callback
                onSignup(response.data.user, response.data.token);
            }
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Signup failed');
            } else {
                setServerError('Network error. Please try again.');
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
                    <h1 className="auth-brand-headline">Manage investment operations with integrated accounting and financial controls.</h1>
                    <p className="auth-brand-copy">
                        Create an account to capture trades, track performance, and stay audit-ready.
                    </p>
                </div>
                <p className="auth-brand-bottom auth-brand-meta">Sherwood Technologies (Pvt) Ltd</p>
            </aside>

            <div className="auth-card auth-card--compact">
                <div className="auth-card-header">
                    <h2>Create account</h2>
                    <p className="auth-subtitle">Set up access in a few steps</p>
                </div>

                {serverError && (
                    <div className="error-message">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className={errors.first_name ? 'error' : ''}
                                placeholder="Enter your first name"
                            />
                            {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name">Last Name</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className={errors.last_name ? 'error' : ''}
                                placeholder="Enter your last name"
                            />
                            {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                        </div>
                    </div>

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
                        <label htmlFor="fundsCenter">Funds Center</label>
                        <select
                            id="fundsCenter"
                            name="fundsCenter"
                            value={formData.fundsCenter}
                            onChange={handleChange}
                            className={errors.fundsCenter ? 'error' : 'locked'}
                            title="Colombo is the default funds center - view only"
                        >
                            {fundsCenters.map((center, index) => (
                                <option key={index} value={`${center.name} ${center.flag}`}>
                                    {center.name} {center.flag}
                                </option>
                            ))}
                        </select>
                        {errors.fundsCenter && <span className="error-text">{errors.fundsCenter}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
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
                        <PasswordRequirements password={formData.password} />
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
                            placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
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

export default Signup;










