const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const realizedPnLService = {
  // Get complete realized P&L data for frontend (all data in one call)
  getCompleteData: async (portfolioId, timeRange = '1Y') => {
    try {
      console.log('Making API call to:', `${API_BASE_URL}/realized-pnl/complete-data?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`);
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/complete-data?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching complete realized P&L data:', error);
      throw error;
    }
  },

  // Get portfolio summary only
  getPortfolioSummary: async (portfolioId, timeRange = '1Y') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/portfolio-summary?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      throw error;
    }
  },

  // Get trade history only
  getTradeHistory: async (portfolioId, timeRange = '1Y') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/trade-history?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    }
  },

  // Get performance by period
  getPerformanceByPeriod: async (portfolioId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/performance-by-period?portfolioId=${encodeURIComponent(portfolioId)}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance by period:', error);
      throw error;
    }
  },

  // Get top performers
  getTopPerformers: async (portfolioId, timeRange = '1Y', limit = 10) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/top-performers?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}&limit=${limit}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  },

  // Get tax summary
  getTaxSummary: async (portfolioId, timeRange = '1Y') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/tax-summary?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching tax summary:', error);
      throw error;
    }
  },

  // Get available portfolios for selection
  getAvailablePortfolios: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available portfolios:', error);
      throw error;
    }
  },

  // Export realized P&L data to Excel (placeholder for future implementation)
  exportToExcel: async (portfolioId, timeRange = '1Y') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/export-excel?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `realized-pnl-${portfolioId}-${timeRange}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },

  // Generate realized P&L report (placeholder for future implementation)
  generateReport: async (portfolioId, timeRange = '1Y', reportType = 'summary') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/realized-pnl/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            portfolioId,
            timeRange,
            reportType
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
};
