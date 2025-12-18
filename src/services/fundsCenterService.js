import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/funds-centers';

const fundsCenterService = {
    // Get all funds centers
    getAllFundsCenters: async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching funds centers:', error);
            throw error;
        }
    },

    // Create new funds center
    createFundsCenter: async (fundsCenter) => {
        try {
            const response = await axios.post(API_BASE_URL, fundsCenter);
            return response.data;
        } catch (error) {
            console.error('Error creating funds center:', error);
            throw error;
        }
    },

    // Delete funds center
    deleteFundsCenter: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting funds center:', error);
            throw error;
        }
    }
};

export default fundsCenterService;








