import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetEnterPin from './ResetEnterPin';
import SetNewPassword from './SetNewPassword';
import './Auth.css';

const AuthContainer = ({ onAuthSuccess }) => {
    const [view, setView] = useState('login');
    const [resetEmail, setResetEmail] = useState('');
    const [resetPin, setResetPin] = useState('');

    const handleLogin = (user, token) => {
        onAuthSuccess(user, token);
    };

    const handleSignup = (user, token) => {
        onAuthSuccess(user, token);
    };

    const switchToSignup = () => {
        setView('signup');
    };

    const switchToLogin = () => {
        setView('login');
        setResetEmail('');
        setResetPin('');
    };

    const switchToForgotPassword = () => {
        setView('forgot-password');
    };

    const switchToEnterPin = (email) => {
        setResetEmail(email);
        setResetPin('');
        setView('reset-enter-pin');
    };

    const switchToSetNewPassword = (email, pin) => {
        setResetEmail(email);
        setResetPin(pin);
        setView('set-new-password');
    };

    const goBackToPinFromPassword = () => {
        setResetPin('');
        setView('reset-enter-pin');
    };

    return (
        <div className="auth-wrapper">
            {view === 'login' && (
                <Login
                    onLogin={handleLogin}
                    switchToSignup={switchToSignup}
                    switchToForgotPassword={switchToForgotPassword}
                />
            )}
            {view === 'signup' && <Signup onSignup={handleSignup} switchToLogin={switchToLogin} />}
            {view === 'forgot-password' && (
                <ForgotPassword switchToLogin={switchToLogin} switchToEnterPin={switchToEnterPin} />
            )}
            {view === 'reset-enter-pin' && (
                <ResetEnterPin
                    email={resetEmail}
                    switchToLogin={switchToLogin}
                    switchToSetNewPassword={switchToSetNewPassword}
                />
            )}
            {view === 'set-new-password' && (
                <SetNewPassword
                    email={resetEmail}
                    pin={resetPin}
                    switchToLogin={switchToLogin}
                    goBackToPin={goBackToPinFromPassword}
                />
            )}
        </div>
    );
};

export default AuthContainer;
