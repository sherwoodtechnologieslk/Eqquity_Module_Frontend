import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
    }
};

export default authService;



