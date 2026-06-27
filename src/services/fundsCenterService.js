import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/funds-centers`;

const fundsCenterAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

const notifyOwnerReadOnly = (data = {}) => {
    if (data?.code !== 'OWNER_READ_ONLY_WRITE_BLOCKED') return;
    window.dispatchEvent(new CustomEvent('owner-read-only-write-blocked', { detail: data }));
};

fundsCenterAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

fundsCenterAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        notifyOwnerReadOnly(error.response?.data);
        return Promise.reject(error);
    }
);

const fundsCenterService = {
    // Get all funds centers
    getAllFundsCenters: async () => {
        try {
            const response = await fundsCenterAPI.get('');
            return response.data;
        } catch (error) {
            console.error('Error fetching funds centers:', error);
            throw error;
        }
    },

    // Create new funds center
    createFundsCenter: async (fundsCenter) => {
        try {
            const response = await fundsCenterAPI.post('', fundsCenter);
            return response.data;
        } catch (error) {
            console.error('Error creating funds center:', error);
            throw error;
        }
    },

    // Delete funds center
    deleteFundsCenter: async (id) => {
        try {
            const response = await fundsCenterAPI.delete(`/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting funds center:', error);
            throw error;
        }
    }
};

export default fundsCenterService;











































