import React, { useState, useEffect } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import SetNewPassword from './SetNewPassword';
import './Auth.css';

const AuthContainer = ({ onAuthSuccess }) => {
    const [view, setView] = useState('login'); // 'login', 'signup', 'forgot-password', 'set-new-password'
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');

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
        setResetCode('');
    };

    const switchToForgotPassword = () => {
        setView('forgot-password');
    };

    const switchToSetNewPassword = (email, code) => {
        setResetEmail(email);
        setResetCode(code);
        setView('set-new-password');
    };

    return (
        <div className="auth-wrapper">
            {view === 'login' && (
                <Login onLogin={handleLogin} switchToSignup={switchToSignup} switchToForgotPassword={switchToForgotPassword} />
            )}
            {view === 'signup' && (
                <Signup onSignup={handleSignup} switchToLogin={switchToLogin} />
            )}
            {view === 'forgot-password' && (
                <ForgotPassword switchToLogin={switchToLogin} switchToChangePassword={switchToSetNewPassword} />
            )}
            {view === 'set-new-password' && (
                <SetNewPassword email={resetEmail} code={resetCode} switchToLogin={switchToLogin} />
            )}
        </div>
    );
};

export default AuthContainer;










