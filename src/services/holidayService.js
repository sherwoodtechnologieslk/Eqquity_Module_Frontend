import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const holidayService = {
    // Get all holidays
    getAllHolidays: async () => {
        try {
            const response = await axios.get(`${API_URL}/holidays`);
            return response.data;
        } catch (error) {
            console.error('Error fetching holidays:', error);
            throw error;
        }
    },

    // Get holiday by ID
    getHolidayById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching holiday:', error);
            throw error;
        }
    },

    // Create new holiday
    createHoliday: async (holidayData) => {
        try {
            const response = await axios.post(`${API_URL}/holidays`, holidayData);
            return response.data;
        } catch (error) {
            console.error('Error creating holiday:', error);
            throw error;
        }
    },

    // Update existing holiday
    updateHoliday: async (id, holidayData) => {
        try {
            const response = await axios.put(`${API_URL}/holidays/${id}`, holidayData);
            return response.data;
        } catch (error) {
            console.error('Error updating holiday:', error);
            throw error;
        }
    },

    // Delete holiday
    deleteHoliday: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/holidays/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting holiday:', error);
            throw error;
        }
    },

    // Get holidays by date range
    getHolidaysByDateRange: async (startDate, endDate) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/range/search`, {
                params: { startDate, endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching holidays by date range:', error);
            throw error;
        }
    },

    // Get holidays by type
    getHolidaysByType: async (type) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/type/${type}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching holidays by type:', error);
            throw error;
        }
    },

    // Get holidays by year
    getHolidaysByYear: async (year) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/year/${year}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching holidays by year:', error);
            throw error;
        }
    },

    // Get upcoming holidays
    getUpcomingHolidays: async (limit = 10) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/upcoming/list`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching upcoming holidays:', error);
            throw error;
        }
    },

    // Check if date exists
    checkDateExists: async (date) => {
        try {
            const response = await axios.get(`${API_URL}/holidays/check-date/${date}`);
            return response.data;
        } catch (error) {
            console.error('Error checking date:', error);
            throw error;
        }
    }
};

export default holidayService;

































