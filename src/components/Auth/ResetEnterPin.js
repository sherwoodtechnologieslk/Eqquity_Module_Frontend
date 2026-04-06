import React, { useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

const ResetEnterPin = ({ email, switchToLogin, switchToSetNewPassword }) => {
    /** Must match server `setPasswordResetPin` expiry (2 minutes). */
    const PIN_VALIDITY_SECONDS = 2 * 60;
    const [pin, setPin] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(PIN_VALIDITY_SECONDS);
    const [resendLoading, setResendLoading] = useState(false);

    const isExpired = secondsLeft <= 0;
    const canResend = isExpired && !resendLoading && !!email;

    const handleChange = (e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(v);
        if (errors.pin) {
            setErrors({ ...errors, pin: '' });
        }
        if (serverError) setServerError('');
    };

    useEffect(() => {
        // Start/reset countdown when email changes (new reset session)
        setSecondsLeft(PIN_VALIDITY_SECONDS);
        setPin('');
        setErrors({});
        setServerError('');

        const timer = setInterval(() => {
            setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    const timerLabel = useMemo(() => {
        if (secondsLeft <= 0) return '0:00';
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }, [secondsLeft]);

    const validate = () => {
        const newErrors = {};
        if (!pin || pin.length !== 6) {
            newErrors.pin = 'Enter the 6-digit code from your email';
        }
        if (isExpired) {
            newErrors.pin = 'Verification code expired. Please request a new code.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (!email) {
            setServerError('Email is missing. Please start forgot password again.');
            return;
        }

        setIsLoading(true);
        setServerError('');

        authService
            .verifyResetPin(email, pin)
            .then(() => {
                if (switchToSetNewPassword) {
                    switchToSetNewPassword(email, pin);
                }
            })
            .catch((error) => {
                const msg = error?.response?.data?.message;
                setServerError(msg || 'Verification code is incorrect. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleResend = async () => {
        if (!email) {
            setServerError('Email is missing. Please start forgot password again.');
            return;
        }
        setResendLoading(true);
        setServerError('');
        setErrors({});
        setPin('');

        try {
            await authService.forgotPassword(email);
            // Restart countdown for the newly generated PIN
            setSecondsLeft(PIN_VALIDITY_SECONDS);
        } catch (error) {
            const msg = error?.response?.data?.message;
            setServerError(msg || 'Failed to resend verification code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Enter verification code</h2>
                <p className="auth-subtitle">
                    We sent a 6-digit code to your email. Enter it below to continue.
                </p>

                {serverError && <div className="error-message">{serverError}</div>}

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

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                        color: isExpired ? '#b45309' : '#64748b',
                        fontSize: '0.875rem',
                    }}
                >
                    <div>
                        {isExpired ? (
                            <strong>Code expired.</strong>
                        ) : (
                            <>
                                Code expires in <strong>{timerLabel}</strong>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        className="link-button"
                        onClick={handleResend}
                        disabled={!canResend}
                    >
                        {resendLoading ? 'Resending…' : 'Resend code'}
                    </button>
                </div>

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
                            disabled={isLoading || resendLoading}
                        />
                        {errors.pin && <span className="error-text">{errors.pin}</span>}
                    </div>

                    <button
                        type="submit"
                        className="auth-button primary"
                        style={{ width: '100%' }}
                        disabled={isLoading || resendLoading || isExpired}
                    >
                        {isLoading ? 'Verifying…' : 'Continue'}
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
