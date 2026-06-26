import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { getApiErrorMessage } from '../../utils/passwordValidation';
import './Auth.css';

const ForgotPassword = ({ switchToLogin, switchToEnterPin }) => {
    const [formData, setFormData] = useState({
        email: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

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
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
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

        const email = formData.email.trim().toLowerCase();

        try {
            await authService.forgotPassword(email);
            if (switchToEnterPin) {
                switchToEnterPin(email);
            }
        } catch (error) {
            setServerError(getApiErrorMessage(error, 'Failed to send verification code'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset password</h2>
                <p className="auth-subtitle">
                    Enter your account email. We will send a one-time verification code so you can set a new password.
                </p>

                {serverError && <div className="error-message">{serverError}</div>}

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

                    <button type="submit" className="auth-button primary" disabled={isLoading}>
                        {isLoading ? 'Sending…' : 'Send verification code'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <button type="button" className="link-button" onClick={switchToLogin}>
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
