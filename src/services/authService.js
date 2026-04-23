import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://98.91.201.168/api';

// Create axios instance with base configuration
const authAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
authAPI.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
authAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    // Sign up a new user
    signup: async (userData) => {
        const response = await authAPI.post('/auth/signup', userData);
        return response.data;
    },

    // Sign in existing user
    login: async (credentials) => {
        const response = await authAPI.post('/auth/login', credentials);
        return response.data;
    },

    // Get current user info
    getCurrentUser: async () => {
        const response = await authAPI.get('/auth/me');
        return response.data;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Validate stored token with backend
    validateStoredToken: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }

        try {
            const response = await authAPI.get('/auth/me');
            return true;
        } catch (error) {
            // Token is invalid or expired, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        }
    },

    // Get stored user data
    getStoredUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Get stored token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Set authentication data
    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Change password for authenticated user
    changePassword: async (currentPassword, newPassword) => {
        const response = await authAPI.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    // Request password reset
    forgotPassword: async (email) => {
        const response = await authAPI.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password using token
    resetPassword: async (token, password) => {
        const response = await authAPI.post('/auth/reset-password', {
            token,
            password
        });
        return response.data;
    },

    // Set new password using verification code
    setNewPassword: async (email, code, newPassword) => {
        const response = await authAPI.post('/auth/set-new-password', {
            email,
            code,
            newPassword
        });
        return response.data;
    },

    // Verify reset PIN (before allowing new password screen)
    verifyResetPin: async (email, code) => {
        const response = await authAPI.post('/auth/verify-reset-pin', {
            email,
            code
        });
        return response.data;
    }
};

export default authService;



