import React, { useState } from 'react';
import './Auth.css';

const ResetEnterPin = ({ email, switchToLogin, switchToSetNewPassword }) => {
    const [pin, setPin] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(v);
        if (errors.pin) {
            setErrors({ ...errors, pin: '' });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!pin || pin.length !== 6) {
            newErrors.pin = 'Enter the 6-digit code from your email';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (switchToSetNewPassword) {
            switchToSetNewPassword(email, pin);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Enter verification code</h2>
                <p className="auth-subtitle">
                    We sent a 6-digit code to your email. Enter it below to continue.
                </p>

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
                        Code sent to: <strong>{email}</strong>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="pin">Verification code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            id="pin"
                            name="pin"
                            value={pin}
                            onChange={handleChange}
                            className={errors.pin ? 'error' : ''}
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                        />
                        {errors.pin && <span className="error-text">{errors.pin}</span>}
                    </div>

                    <button type="submit" className="auth-button primary" style={{ width: '100%' }}>
                        Continue
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        <button type="button" className="link-button" onClick={switchToLogin}>
                            Back to sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetEnterPin;
