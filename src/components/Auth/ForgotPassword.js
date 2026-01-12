import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const ForgotPassword = ({ switchToLogin, switchToChangePassword }) => {
    const [formData, setFormData] = useState({
        email: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [userEmail, setUserEmail] = useState('');

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
        setSuccessMessage('');

        try {
            const response = await authService.forgotPassword(formData.email);
            if (response.code) {
                setGeneratedCode(response.code);
                setUserEmail(formData.email);
                setSuccessMessage(response.message || 'A temporary password code has been generated.');
            } else {
                setSuccessMessage(response.message || 'If an account with that email exists, a temporary password code has been generated.');
            }
        } catch (error) {
            if (error.response) {
                setServerError(error.response.data.message || 'Failed to generate reset code');
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
                <h2>Forgot Password</h2>
                <p className="auth-subtitle">Enter your email to reset your password</p>
                
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

                {generatedCode ? (
                    <div>
                        <div style={{ 
                            backgroundColor: '#fef3c7', 
                            border: '2px solid #f59e0b',
                            color: '#92400e', 
                            padding: '1.5rem', 
                            borderRadius: '0.75rem', 
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Your Temporary Password Code:
                            </div>
                            <div style={{ 
                                fontSize: '2rem', 
                                fontWeight: 'bold', 
                                letterSpacing: '0.2em',
                                fontFamily: 'monospace',
                                color: '#1e293b'
                            }}>
                                {generatedCode}
                            </div>
                            <div style={{ fontSize: '0.875rem', marginTop: '1rem', color: '#92400e' }}>
                                Please save this code. Your password has been temporarily set to this code.
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                            <p>Please change your password to your own password now.</p>
                        </div>

                        <button 
                            type="button" 
                            className="auth-button primary"
                            onClick={() => switchToChangePassword && switchToChangePassword(userEmail, generatedCode)}
                            style={{ width: '100%' }}
                        >
                            Change Password Now
                        </button>
                    </div>
                ) : (
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

                        <button 
                            type="submit" 
                            className="auth-button primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Generating Code...' : 'Generate Reset Code'}
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

export default ForgotPassword;

