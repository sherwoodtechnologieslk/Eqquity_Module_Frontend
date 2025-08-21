import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

const AuthContainer = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);

    const handleLogin = (user, token) => {
        onAuthSuccess(user, token);
    };

    const handleSignup = (user, token) => {
        onAuthSuccess(user, token);
    };

    const switchToSignup = () => {
        setIsLogin(false);
    };

    const switchToLogin = () => {
        setIsLogin(true);
    };

    return (
        <div className="auth-wrapper">
            {isLogin ? (
                <Login onLogin={handleLogin} switchToSignup={switchToSignup} />
            ) : (
                <Signup onSignup={handleSignup} switchToLogin={switchToLogin} />
            )}
        </div>
    );
};

export default AuthContainer;




