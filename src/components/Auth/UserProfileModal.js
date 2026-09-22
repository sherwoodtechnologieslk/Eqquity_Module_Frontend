import React, { useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/authService';
import { getApiErrorMessage, validatePasswordStrength } from '../../utils/passwordValidation';
import PasswordRequirements from './PasswordRequirements';
import './UserProfileModal.css';

const PIN_VALIDITY_SECONDS = 2 * 60;

/** Derive human-readable account type + function from governance fields. */
const resolveAccountIdentity = (user) => {
  const kind = String(user?.account_kind || '').toLowerCase();
  const role = String(user?.company_role || '').toLowerCase();

  if (kind === 'company_member' || user?.company_id) {
    let functionLabel = 'Company member';
    if (role === 'admin') functionLabel = 'Admin';
    else if (role === 'user') functionLabel = 'Normal user';
    else if (role === 'company_owner') functionLabel = 'Company owner';
    else if (role === 'superuser') functionLabel = 'Superuser';

    return {
      accountType: 'Company account',
      accountTypeKey: 'company',
      functionLabel,
      functionKey: role || 'member',
      companyName: user?.company?.company_name || user?.company?.name || null,
    };
  }

  return {
    accountType: 'Individual account',
    accountTypeKey: 'single',
    functionLabel: 'Account holder',
    functionKey: 'individual',
    companyName: null,
  };
};

const UserProfileModal = ({ user, isOpen, onClose, onPasswordChanged, variant = 'equity' }) => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationCode: '',
    });
    const [passwordStep, setPasswordStep] = useState('form');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [otpSentMessage, setOtpSentMessage] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(PIN_VALIDITY_SECONDS);

    const isOtpExpired = secondsLeft <= 0;
    const canResendOtp = passwordStep === 'verify' && isOtpExpired && !passwordSubmitting;

    const otpTimerLabel = useMemo(() => {
        if (secondsLeft <= 0) return '0:00';
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }, [secondsLeft]);

    useEffect(() => {
        if (!isOpen) return;
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            verificationCode: '',
        });
        setPasswordStep('form');
        setPasswordError('');
        setPasswordSuccess('');
        setOtpSentMessage('');
        setSecondsLeft(PIN_VALIDITY_SECONDS);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || passwordStep !== 'verify') return undefined;

        setSecondsLeft(PIN_VALIDITY_SECONDS);
        const timer = setInterval(() => {
            setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, passwordStep]);

    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName ? firstName.charAt(0) : '';
        const last = lastName ? lastName.charAt(0) : '';
        return (first + last).toUpperCase();
    };

    const fullName =
        user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : 'User Name';

    const identity = resolveAccountIdentity(user);
    const isActive =
        user?.is_active === false || user?.is_active === 0 ? false : true;

    const validatePasswordForm = () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword) {
            setPasswordError('Current password is required.');
            return false;
        }
        const strength = validatePasswordStrength(newPassword);
        if (!strength.valid) {
            setPasswordError(`Password must include: ${strength.errors.join(', ')}`);
            return false;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return false;
        }
        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from your current password.');
            return false;
        }
        return true;
    };

    const requestVerificationCode = async () => {
        if (!validatePasswordForm()) return;

        setPasswordSubmitting(true);
        setPasswordError('');
        setPasswordSuccess('');
        setOtpSentMessage('');

        try {
            const result = await authService.requestChangePasswordCode(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            setPasswordStep('verify');
            setSecondsLeft(PIN_VALIDITY_SECONDS);
            setOtpSentMessage(
                result.message ||
                    `Verification code sent to ${user?.email || 'your email'}.`
            );
            setPasswordForm((prev) => ({ ...prev, verificationCode: '' }));
        } catch (err) {
            setPasswordError(getApiErrorMessage(err, 'Failed to send verification code. Please try again.'));
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordStep === 'form') {
            await requestVerificationCode();
            return;
        }

        if (!passwordForm.verificationCode.trim()) {
            setPasswordError('Enter the verification code from your email.');
            return;
        }

        if (isOtpExpired) {
            setPasswordError('Verification code expired. Request a new code.');
            return;
        }

        setPasswordSubmitting(true);
        try {
            const result = await authService.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword,
                passwordForm.verificationCode.trim()
            );

            if (result.logout_required && onPasswordChanged) {
                onPasswordChanged(result.message);
                return;
            }

            setPasswordSuccess(result.message || 'Password updated successfully.');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                verificationCode: '',
            });
            setPasswordStep('form');
            setOtpSentMessage('');
            setSecondsLeft(PIN_VALIDITY_SECONDS);
        } catch (err) {
            setPasswordError(getApiErrorMessage(err, 'Failed to update password. Please try again.'));
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handleBackToForm = () => {
        setPasswordStep('form');
        setPasswordError('');
        setOtpSentMessage('');
        setSecondsLeft(PIN_VALIDITY_SECONDS);
        setPasswordForm((prev) => ({ ...prev, verificationCode: '' }));
    };

    return (
        <div
            className={`upm-modal-overlay${variant === 'wealth' ? ' upm-modal-overlay--wealth' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`upm-modal-content${variant === 'wealth' ? ' upm-modal-content--wealth' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="upm-modal-header">
                    <button
                        className="upm-close-button"
                        onClick={onClose}
                        aria-label="Close profile"
                        type="button"
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div className="upm-identity">
                        <div className="upm-profile-avatar" aria-hidden="true">
                            {getInitials(user?.first_name, user?.last_name)}
                        </div>
                        <div className="upm-identity-text">
                            <p className="upm-header-eyebrow">User profile</p>
                            <h2 className="upm-identity-name">{fullName}</h2>
                            <div className="upm-identity-chips">
                                <span className="upm-chip">{identity.accountType}</span>
                                <span className="upm-chip">{identity.functionLabel}</span>
                                <span
                                    className={`upm-chip upm-chip--status${
                                        isActive ? '' : ' upm-chip--inactive'
                                    }`}
                                >
                                    <span className="upm-chip-dot" aria-hidden="true" />
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="upm-modal-body">
                    <section className="upm-section">
                        <h3 className="upm-section-title">Account</h3>
                        <dl className="upm-detail-list">
                            {identity.companyName && (
                                <div className="upm-detail-row upm-detail-row--wide">
                                    <dt>Company</dt>
                                    <dd>{identity.companyName}</dd>
                                </div>
                            )}
                            <div className="upm-detail-row upm-detail-row--wide">
                                <dt>Email</dt>
                                <dd>{user?.email || 'N/A'}</dd>
                            </div>
                            <div className="upm-detail-row">
                                <dt>User ID</dt>
                                <dd>{user?.id || 'N/A'}</dd>
                            </div>
                            <div className="upm-detail-row">
                                <dt>Name</dt>
                                <dd>
                                    {[user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
                                        'N/A'}
                                </dd>
                            </div>
                            <div className="upm-detail-row upm-detail-row--wide">
                                <dt>Funds center</dt>
                                <dd className="upm-detail-funds">
                                    {user?.fundsCenter ||
                                        'Colombo (Colombo Stock Exchange – CSE) 🇱🇰'}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="upm-section">
                        <h3 className="upm-section-title">Change password</h3>

                    <form className="upm-password-form" onSubmit={handlePasswordSubmit}>
                        <p className="upm-password-hint">
                            {passwordStep === 'form'
                                ? 'We will email a one-time code to confirm your new password.'
                                : `Enter the 6-digit code sent to ${user?.email || 'your email'}. Expires in 2 minutes.`}
                        </p>

                        {passwordError && (
                            <div className="upm-password-alert upm-password-alert--error" role="alert">
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="upm-password-alert upm-password-alert--success" role="status">
                                {passwordSuccess}
                            </div>
                        )}
                        {otpSentMessage && passwordStep === 'verify' && (
                            <div className="upm-password-alert upm-password-alert--info" role="status">
                                {otpSentMessage}
                            </div>
                        )}

                        {passwordStep === 'form' ? (
                            <div className="upm-password-grid">
                                <label className="upm-password-field upm-password-field--wide">
                                    <span>Current password</span>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                        }
                                        autoComplete="current-password"
                                        disabled={passwordSubmitting}
                                    />
                                </label>
                                <label className="upm-password-field upm-password-field--wide">
                                    <span>New password</span>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                        }
                                        autoComplete="new-password"
                                        disabled={passwordSubmitting}
                                    />
                                    <PasswordRequirements password={passwordForm.newPassword} />
                                </label>
                                <label className="upm-password-field upm-password-field--wide">
                                    <span>Confirm new password</span>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                        }
                                        autoComplete="new-password"
                                        disabled={passwordSubmitting}
                                    />
                                </label>
                            </div>
                        ) : (
                            <>
                                <div className="upm-password-otp-meta">
                                    <span className={isOtpExpired ? 'upm-password-otp-expired' : ''}>
                                        {isOtpExpired ? (
                                            <strong>Code expired.</strong>
                                        ) : (
                                            <>
                                                Code expires in <strong>{otpTimerLabel}</strong>
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="upm-password-grid">
                                    <label className="upm-password-field upm-password-field--wide">
                                        <span>Verification code</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            placeholder="6-digit code"
                                            value={passwordForm.verificationCode}
                                            onChange={(e) =>
                                                setPasswordForm({
                                                    ...passwordForm,
                                                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                                                })
                                            }
                                            disabled={passwordSubmitting}
                                        />
                                    </label>
                                </div>
                            </>
                        )}

                        <div className="upm-password-actions">
                            {passwordStep === 'verify' && (
                                <>
                                    <button
                                        type="button"
                                        className="upm-password-secondary"
                                        onClick={handleBackToForm}
                                        disabled={passwordSubmitting}
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        className="upm-password-secondary"
                                        onClick={requestVerificationCode}
                                        disabled={!canResendOtp}
                                    >
                                        Resend code
                                    </button>
                                </>
                            )}
                            <button
                                type="submit"
                                className="upm-password-submit"
                                disabled={passwordSubmitting || (passwordStep === 'verify' && isOtpExpired)}
                            >
                                {passwordSubmitting
                                    ? 'Please wait…'
                                    : passwordStep === 'form'
                                      ? 'Send verification code'
                                      : 'Confirm password change'}
                            </button>
                        </div>
                    </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
