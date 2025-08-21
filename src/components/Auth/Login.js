import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const Login = ({ onLogin, switchToSignup }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

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
            const response = await axios.post('http://localhost:8080/api/auth/login', formData);
            
            if (response.data.token) {
                // Store token in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Call parent callback
                onLogin(response.data.user, response.data.token);
            }
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Login failed');
            } else {
                setServerError('Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Sign In to Equity Module</h2>
                <p className="auth-subtitle">Sign in to your account</p>
                
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



