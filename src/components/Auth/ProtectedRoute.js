import React from 'react';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children, fallback = null }) => {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        return fallback || <div>Please log in to access this page.</div>;
    }

    return children;
};

export default ProtectedRoute;




