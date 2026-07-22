import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://98.91.201.168/api';

/** YYYY-MM-DD in local calendar (avoids day shift from toISOString() in non-UTC timezones). */
const toLocalYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const defaultMonthStartYmd = () => toLocalYmd(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const defaultTodayYmd = () => toLocalYmd(new Date());
const defaultYearStartYmd = () => toLocalYmd(new Date(new Date().getFullYear(), 0, 1));

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to clear auth and redirect to login (mirrors authService 401 handling)
const clearAuthAndRedirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        clearAuthAndRedirectToLogin();
        throw new Error('No token, authorization denied');
    }

    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        clearAuthAndRedirectToLogin();
        let errorMessage = 'Session expired or invalid. Please log in again.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
            // use default
        }
        throw new Error(errorMessage);
    }

    if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            // Prefer detail (FastAPI / ML proxy) over generic wrapper text
            errorMessage =
                errorData.detail ||
                errorData.message ||
                errorData.error ||
                errorMessage;
            if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage);
            }
        } catch (e) {
            // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
    }

    return await response.json();
};

// Helper function to get headers with auth and content type
const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...getAuthHeaders()
});

// API service for equity operations
export const equityAPI = {
  // Get all equities
  getAllEquities: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching equities:', error);
      throw error;
    }
  },

  // Create new equity
  createEquity: async (equityData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equityData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating equity:', error);
      throw error;
    }
  },

  // Update equity
  updateEquity: async (id, equityData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equityData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating equity:', error);
      throw error;
    }
  },

  // Delete equity
  deleteEquity: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting equity:', error);
      throw error;
    }
  },

  // Get only active equities
  getActiveEquities: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities/active`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching active equities:', error);
      throw error;
    }
  },

  // Check if symbol exists
  checkSymbolExists: async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/equities/check-symbol/${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking symbol:', error);
      throw error;
    }
  },
};

// API service for account operations
export const accountAPI = {
  // Create new account
  createAccount: async (accountData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(accountData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },
  
  // Get all accounts
  getAllAccounts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Get account by ID
  getAccountById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching account by ID:', error);
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(accountData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  // Get accounts by payment method
  getAccountsByPaymentMethod: async (method) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/by-payment-method/${encodeURIComponent(method)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching accounts by payment method:', error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

// API service for trade summary upload operations
export const tradeSummaryAPI = {
  // Upload trade summary file
  uploadTradeSummary: async (file, tradeDate) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tradeDate', tradeDate);
      
      const response = await fetch(`${API_BASE_URL}/trade-summary/upload`, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header when using FormData
        // The browser will automatically set it with the boundary
      });
      
      if (!response.ok) {
        // Get the error response data
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data: errorData, status: response.status };
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading trade summary:', error);
      throw error;
    }
  },

  // Calculate buy transaction breakdown
  calculateBuyTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trade-summary/calculate-buy-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating buy transaction:', error);
      throw error;
    }
  },

  // Calculate sell transaction breakdown
  calculateSellTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trade-summary/calculate-sell-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating sell transaction:', error);
      throw error;
    }
  },

  // Save buy transaction entry
  saveBuyTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trade-summary/save-buy-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving buy transaction:', error);
      throw error;
    }
  },

  // Get all buy transactions
  getBuyTransactions: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/trade-summary/buy-transactions`);
    } catch (error) {
      console.error('Error fetching buy transactions:', error);
      throw error;
    }
  },

  // Get all trade summaries
  getTradeSummaries: async (tradeDate = null) => {
    try {
      let url = `${API_BASE_URL}/trade-summary`;
      if (tradeDate) {
        url += `?tradeDate=${tradeDate}`;
      }
      return await makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching trade summaries:', error);
      throw error;
    }
  },

  // Paginated trade summaries (Trade Summary Data screen only)
  getTradeSummariesPaginated: async ({ page = 1, limit = 500, tradeDate = null, search = null } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (tradeDate) params.set('tradeDate', tradeDate);
      if (search && String(search).trim()) params.set('search', String(search).trim());
      return await makeAuthenticatedRequest(`${API_BASE_URL}/trade-summary/paginated?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching paginated trade summaries:', error);
      throw error;
    }
  },

  // Get unique company names and symbols for dropdown
  getCompanyList: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/trade-summary/companies`);
    } catch (error) {
      console.error('Error fetching company list:', error);
      throw error;
    }
  },

  // Extract text from PDF file
  extractPdfText: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/trade-summary/extract-pdf-text`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data: errorData, status: response.status };
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  },

  // Get trade summary data for a specific company
  getCompanyData: async (symbol, startDate = null, endDate = null) => {
    try {
      let url = `${API_BASE_URL}/trade-summary/company/${encodeURIComponent(symbol)}`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching company data:', error);
      throw error;
    }
  },

  /** Sector equal-weight risk (ann. vol %) vs return (total %) from trade_summaries + equities */
  getSectorRiskReturn: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const url = `${API_BASE_URL}/trade-summary/sector-risk-return?${params.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sector risk-return:', error);
      throw error;
    }
  },

  /** Sector time-series (multi-line): equal-weight index (base 100) by day */
  getSectorRiskReturnTimeseries: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const url = `${API_BASE_URL}/trade-summary/sector-risk-return/timeseries?${params.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sector risk-return timeseries:', error);
      throw error;
    }
  },
}; 

// API service for parsed trade transactions
export const parsedTradeTransactionAPI = {
  // Save parsed trade transactions
  saveParsedTransactions: async (transactions) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parsed-trade-transactions/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ transactions }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data: errorData, status: response.status };
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving parsed transactions:', error);
      throw error;
    }
  },

  // Get parsed trade transactions
  getParsedTransactions: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/parsed-trade-transactions`);
    } catch (error) {
      console.error('Error fetching parsed transactions:', error);
      throw error;
    }
  },

  // Get parsed trade transactions by date
  getParsedTransactionsByDate: async (tradeDate) => {
    try {
      const normalized = String(tradeDate || '').trim().replace(/\//g, '-');
      return await makeAuthenticatedRequest(
        `${API_BASE_URL}/parsed-trade-transactions/by-date?tradeDate=${encodeURIComponent(normalized)}`
      );
    } catch (error) {
      console.error('Error fetching parsed transactions by date:', error);
      throw error;
    }
  },

  // Delete parsed trade transactions
  deleteParsedTransactions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/parsed-trade-transactions`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting parsed transactions:', error);
      throw error;
    }
  },

  // Get parsed trade transactions not updated to portfolio
  getUnupdatedParsedTransactions: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/parsed-trade-transactions/unupdated`);
    } catch (error) {
      console.error('Error fetching unupdated parsed transactions:', error);
      throw error;
    }
  },

  // Create a parsed trade transaction save log
  createSaveLog: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parsed-trade-transactions/save-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating parsed trade save log:', error);
      throw error;
    }
  }
};

// API service for portfolio operations
export const portfolioAPI = {
  // Get all portfolios
  getAllPortfolios: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/portfolios`);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      throw error;
    }
  },

  // Create new portfolio
  createPortfolio: async (portfolioData) => {
    try {
      console.log('Sending portfolio data:', portfolioData);
      const response = await fetch(`${API_BASE_URL}/portfolios`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(portfolioData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        throw new Error(`HTTP error! status: ${response.status}. ${errorData.error || errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Portfolio created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  },

  // Update portfolio
  updatePortfolio: async (id, portfolioData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(portfolioData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  },

  // Delete portfolio
  deletePortfolio: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      throw error;
    }
  },

  // Get only active portfolios
  getActivePortfolios: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/portfolios/active`);
    } catch (error) {
      console.error('Error fetching active portfolios:', error);
      throw error;
    }
  },
};

export const portfolioStrategyAPI = {
  // Assign a strategy to a portfolio
  assignStrategy: async (assignmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(assignmentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error assigning strategy:', error);
      throw error;
    }
  },

  // Get all portfolio-strategy assignments
  getAllPortfolioStrategies: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio-strategy`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio-strategy assignments:', error);
      throw error;
    }
  },
};

// Add a function to get a portfolio by name
portfolioAPI.getPortfolioByName = async (portfolioName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/portfolios/by-name/${encodeURIComponent(portfolioName)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio by name:', error);
    throw error;
  }
};

// Add a function to get portfolio overview
portfolioAPI.getPortfolioOverview = async (portfolioId = null) => {
  try {
    let url = `${API_BASE_URL}/portfolios/overview`;
    if (portfolioId && portfolioId !== 'all') {
      url += `?portfolioId=${portfolioId}`;
    }
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio overview:', error);
    throw error;
  }
};

portfolioAPI.getPortfolioValueHistory = async (portfolioId = null, timeRange = '3M') => {
  try {
    let url = `${API_BASE_URL}/portfolios/value-history?timeRange=${timeRange}`;
    if (portfolioId && portfolioId !== 'all') {
      url += `&portfolioId=${portfolioId}`;
    }
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching portfolio value history:', error);
    throw error;
  }
};

export const portfolioCostingMethodAPI = {
  // Assign a costing method to a portfolio
  assignCostingMethod: async (assignmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio-costing-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(assignmentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error assigning costing method:', error);
      throw error;
    }
  },
  // Fetch all assigned portfolio costing methods
  getAllAssignedCostingMethods: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio-costing-method`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching assigned costing methods:', error);
      throw error;
    }
  },
};

export const getEquities = async () => {
  const res = await fetch('/api/equities'); // Adjust if your backend uses a different path
  if (!res.ok) throw new Error('Failed to fetch equities');
  return await res.json();
};

// API service for general ledger operations
export const generalLedgerAPI = {
  // Get all general ledger entries
  getAllEntries: async (portfolio = null) => {
    try {
      let url = `${API_BASE_URL}/general-ledger`;
      if (portfolio) {
        url += `?portfolio=${encodeURIComponent(portfolio)}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries:', error);
      throw error;
    }
  },

  /** Paginated Equity + GSec combined ledger for Combined General Ledger screen */
  getCombinedEntries: async (filters = {}) => {
    const queryParams = new URLSearchParams({
      _ts: Date.now().toString(),
    });

    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.source && filters.source !== 'all') queryParams.append('source', filters.source);
    if (filters.account_code) queryParams.append('account_code', filters.account_code);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.search) queryParams.append('search', filters.search);

    return await makeAuthenticatedRequest(
      `${API_BASE_URL}/general-ledger/combined?${queryParams.toString()}`,
      { method: 'GET' }
    );
  },

  // Get general ledger entries by portfolio
  getByPortfolio: async (portfolio) => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/portfolio/${encodeURIComponent(portfolio)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries by portfolio:', error);
      throw error;
    }
  },

  // Get all available portfolios for filtering
  getAvailablePortfolios: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/portfolios`, {
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

  // Get general ledger entries by buy transaction ID
  getByBuyTransactionId: async (buyTransactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/buy-transaction/${buyTransactionId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries for buy transaction:', error);
      throw error;
    }
  },

  // Get general ledger entries by account code
  getByAccountCode: async (accountCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/account/${accountCode}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries by account code:', error);
      throw error;
    }
  },

  // Get general ledger entries by date range
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/date-range?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries by date range:', error);
      throw error;
    }
  },

  // Get general ledger summary
  getSummary: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/summary`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger summary:', error);
      throw error;
    }
  }
};

export const transactionEntryAPI = {
  getByPortfolio: async (portfolioName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/by-portfolio?portfolio=${encodeURIComponent(portfolioName)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction entries:', error);
      throw error;
    }
  },
  getCompaniesByPortfolio: async (portfolioName) => {
    const res = await fetch(`${API_BASE_URL}/transaction-entries/companies?portfolio=${encodeURIComponent(portfolioName)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },
  getTotalQuantity: async (portfolioName, companyName) => {
    const res = await fetch(`${API_BASE_URL}/transaction-entries/total-quantity?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch total quantity');
    return res.json();
  },
  getWAPByPortfolioAndCompany: async (portfolioName, companyName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/wap?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching WAP:', error);
      throw error;
    }
  },
  getFifoCostByPortfolioAndCompany: async (portfolioName, companyName, sellQuantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/fifo?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}&sellQuantity=${encodeURIComponent(sellQuantity)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FIFO cost:', error);
      throw error;
    }
  },
  getDetailedFifoAllocation: async (portfolioName, companyName, sellQuantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/detailed-fifo?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}&sellQuantity=${encodeURIComponent(sellQuantity)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching detailed FIFO allocation:', error);
      throw error;
    }
  },
  getAvailableBuyLots: async (portfolioName, companyName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/buy-lots?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available buy lots:', error);
      throw error;
    }
  },
  saveBuyTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error('Error saving buy transaction:', error);
      throw error;
    }
  },
  saveSellTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error('Error saving sell transaction:', error);
      throw error;
    }
  },
  getSellTransactionsByPortfolio: async (portfolioName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell-by-portfolio?portfolio=${encodeURIComponent(portfolioName)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sell transactions:', error);
      throw error;
    }
  },
  getAllSellTransactions: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/transaction-entries/sell-all`);
    } catch (error) {
      console.error('Error fetching all sell transactions:', error);
      throw error;
    }
  },
  updateBuyTransaction: async (id, transactionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating buy transaction:', error);
      throw error;
    }
  },
  updateSellTransaction: async (id, transactionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating sell transaction:', error);
      throw error;
    }
  },
  getFifoDetails: async (sellTransactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/${sellTransactionId}/fifo-details`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FIFO details:', error);
      throw error;
    }
  },
  saveSellTransactionWithAllocations: async (sellTransaction, allocations) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell-with-allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ sellTransaction, allocations }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving sell transaction with allocations:', error);
      throw error;
    }
  },

  // Get portfolio positions with MTM calculations
  getPortfolioPositions: async (portfolioId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/portfolio/${portfolioId}/positions`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio positions:', error);
      throw error;
    }
  },

  /** Server-side risk–return scatter (bulk DB + one response) */
  getPortfolioRiskReturnScatter: async (portfolioId, timeRange) => {
    const params = new URLSearchParams();
    if (timeRange) params.set('timeRange', timeRange);
    const q = params.toString();
    const url = `${API_BASE_URL}/transaction-entries/portfolio/${portfolioId}/risk-return-scatter${q ? `?${q}` : ''}`;
    try {
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio risk-return scatter:', error);
      throw error;
    }
  },
  getAllBuyTransactions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/buy-all`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all buy transactions:', error);
      throw error;
    }
  },
  getPendingPostEntryBuys: async () => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/pending-post-entries`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  postBuyTradeGl: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/${transactionId}/post-trade-gl`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  postBuyTradeGlBulk: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/post-trade-gl/bulk`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  getPendingSettlementBuys: async () => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/pending-settlement`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  postBuySettlementGl: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/${transactionId}/post-settlement-gl`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error || `HTTP error! status: ${response.status}`);
      err.settlementDate = data.settlementDate;
      err.serverToday = data.serverToday;
      throw err;
    }
    return data;
  },
  postBuySettlementGlBulk: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/buy/post-settlement-gl/bulk`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  getPendingPostEntrySells: async () => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/pending-post-entries`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  postSellTradeGl: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/${transactionId}/post-trade-gl`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  postSellTradeGlBulk: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/post-trade-gl/bulk`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  getPendingSettlementSells: async () => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/pending-settlement`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  },
  postSellSettlementGl: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/${transactionId}/post-settlement-gl`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      err.settlementDate = data.settlementDate;
      err.serverToday = data.serverToday;
      throw err;
    }
    return data;
  },
  postSellSettlementGlBulk: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/transaction-entries/sell/post-settlement-gl/bulk`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }
};

// API service for cost of funds operations
export const costOfFundsAPI = {
  // Get all cost of funds definitions
  getAllCostOfFunds: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cost of funds definitions:', error);
      throw error;
    }
  },

  // Get cost of funds by ID
  getCostOfFundsById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cost of funds by ID:', error);
      throw error;
    }
  },

  // Get active cost of funds for a specific date (or today)
  getActiveCostOfFunds: async (date = null) => {
    try {
      const endpoint = date 
        ? `${API_BASE_URL}/cost-of-funds/active/${date}`
        : `${API_BASE_URL}/cost-of-funds/active`;
      
      const response = await fetch(endpoint, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching active cost of funds:', error);
      throw error;
    }
  },

  // Create new cost of funds definition
  createCostOfFunds: async (costOfFundsData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(costOfFundsData),
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating cost of funds definition:', error);
      throw error;
    }
  },

  // Update cost of funds definition
  updateCostOfFunds: async (id, costOfFundsData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(costOfFundsData),
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating cost of funds definition:', error);
      throw error;
    }
  },

  // Delete cost of funds definition
  deleteCostOfFunds: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) {
        throw new Error('Unauthorized. You may not have access to cost of funds.');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error deleting cost of funds definition:', error);
      throw error;
    }
  }
};

// API service for Other Transactions operations
export const otherTransactionAPI = {
  // Get all other transactions
  getAllTransactions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching other transactions:', error);
      throw error;
    }
  },

  // Get other transaction by ID
  getTransactionById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching other transaction by ID:', error);
      throw error;
    }
  },

  // Create new other transaction
  createTransaction: async (transactionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating other transaction:', error);
      throw error;
    }
  },

  /** Maker-checker submit for non-trading / other transaction screens. */
  submitNonTradingForApproval: async (data, { source, action_type = 'create' } = {}) => {
    try {
      const payload =
        action_type === 'post'
          ? { source: source || 'reverse', operation: 'reverse', ...data }
          : { source, transaction: data };

      return await makeAuthenticatedRequest(`${API_BASE_URL}/governance/business-requests`, {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'non_trading_transaction',
          action_type,
          payload,
        }),
      });
    } catch (error) {
      console.error('Error submitting non-trading transaction for approval:', error);
      const message = error.message || 'Failed to submit non-trading transaction for approval';
      throw new Error(message);
    }
  },

  /** Create directly or submit for checker approval depending on user role. */
  saveOrSubmitTransaction: async (transactionData, { source } = {}) => {
    const user = authService.getStoredUser();
    const needsApproval =
      user?.account_kind === 'company_member' &&
      ['admin', 'user'].includes(user?.company_role);

    if (needsApproval) {
      return otherTransactionAPI.submitNonTradingForApproval(transactionData, { source, action_type: 'create' });
    }
    return otherTransactionAPI.createTransaction(transactionData);
  },

  /** Reverse directly or submit for checker approval depending on user role. */
  reverseOrSubmit: async (reverseData) => {
    const user = authService.getStoredUser();
    const needsApproval =
      user?.account_kind === 'company_member' &&
      ['admin', 'user'].includes(user?.company_role);

    if (needsApproval) {
      return otherTransactionAPI.submitNonTradingForApproval(reverseData, {
        source: 'reverse',
        action_type: 'post',
      });
    }
    return otherTransactionAPI.reverse(reverseData);
  },

  // Update other transaction
  updateTransaction: async (id, transactionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating other transaction:', error);
      throw error;
    }
  },

  // Delete other transaction
  deleteTransaction: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting other transaction:', error);
      throw error;
    }
  },

  // Get transactions by user email
  getTransactionsByUser: async (userEmail) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions/user/transactions?userEmail=${encodeURIComponent(userEmail)}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions by user:', error);
      throw error;
    }
  },

  // Reverse an existing other transaction by voucher number
  reverse: async ({ voucherNumber, amount, date, notes }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transactions/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ voucherNumber, amount, date, notes })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error reversing other transaction:', error);
      throw error;
    }
  }
};

// API service for Other Transaction GL Entry operations
export const otherTransactionGLEntryAPI = {
  // Get all GL entries
  getAllEntries: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all GL entries:', error);
      throw error;
    }
  },

  // Get GL entries by user email
  getEntriesByUser: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/user`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching GL entries by user:', error);
      throw error;
    }
  },

  // Get GL entries by transaction ID
  getEntriesByTransactionId: async (transactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/transaction/${transactionId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching GL entries by transaction ID:', error);
      throw error;
    }
  },

  // Get GL entries by date range
  getEntriesByDateRange: async (startDate, endDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/date-range?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching GL entries by date range:', error);
      throw error;
    }
  },

  // Get GL entries by account code
  getEntriesByAccountCode: async (accountCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/account/${accountCode}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching GL entries by account code:', error);
      throw error;
    }
  },

  // Update GL entry
  updateEntry: async (entryId, entryData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(entryData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating GL entry:', error);
      throw error;
    }
  },

  // Delete GL entry
  deleteEntry: async (entryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/other-transaction-gl-entries/${entryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting GL entry:', error);
      throw error;
    }
  }
};

export const chartOfAccountsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/chart-of-accounts`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch chart of accounts');
    return await response.json();
  },
  
  getSystemAccounts: async () => {
    const response = await fetch(`${API_BASE_URL}/chart-of-accounts/system-accounts`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch system accounts');
    return await response.json();
  },

  importSystemAccounts: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chart-of-accounts/system-accounts/import`, {
      method: 'POST'
    });
    return response;
  },
  
  update: async (id, accountData) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chart-of-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData)
    });
    return response;
  }
};

// Investment account mapping API (per user + per portfolio)
export const investmentAccountAPI = {
  getMappings: async () => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/investment-account-mappings`);
  },
  saveMapping: async (mappingData) => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/investment-account-mappings`, {
      method: 'POST',
      body: JSON.stringify(mappingData)
    });
  },
  deleteMapping: async (id) => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/investment-account-mappings/${id}`, {
      method: 'DELETE'
    });
  }
};

// API service for Account Categories operations
export const accountCategoryAPI = {
  getAll: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories`, {
        method: 'GET'
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch account categories');
    }
  },

  getByType: async (accountType) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/type/${accountType}`, {
        method: 'GET'
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories by type');
    }
  },

  create: async (categoryData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories`, {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
    } catch (error) {
      // Try to extract error message from response if available
      const errorMessage = error.message || 'Failed to create account category';
      throw new Error(errorMessage);
    }
  },

  update: async (id, categoryData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to update account category';
      throw new Error(errorMessage);
    }
  },

  delete: async (id) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete account category';
      throw new Error(errorMessage);
    }
  },

  deleteByType: async (accountType) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/type/${accountType}`, {
        method: 'DELETE'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete categories by type';
      throw new Error(errorMessage);
    }
  },

  // Transaction Type methods
  getAllTransactionTypes: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch transaction types';
      throw new Error(errorMessage);
    }
  },

  createTransactionType: async (transactionTypeData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types`, {
        method: 'POST',
        body: JSON.stringify(transactionTypeData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to create transaction type';
      throw new Error(errorMessage);
    }
  },

  getTransactionTypesByCategory: async (categoryId) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types/category/${categoryId}`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch transaction types';
      throw new Error(errorMessage);
    }
  },
  
  getTransactionTypesByCategoryName: async (categoryName, accountType) => {
    try {
      const encodedCategoryName = encodeURIComponent(categoryName);
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types/category-name/${encodedCategoryName}/type/${accountType}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Error fetching transaction types by category name:', error);
      throw error;
    }
  },

  updateTransactionType: async (id, transactionTypeData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionTypeData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to update transaction type';
      throw new Error(errorMessage);
    }
  },

  deleteTransactionType: async (id) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/account-categories/transaction-types/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete transaction type';
      throw new Error(errorMessage);
    }
  }
};

// API service for Custom Account Types operations
export const customAccountTypeAPI = {
  getAll: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/custom-account-types`, {
        method: 'GET'
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch custom account types');
    }
  },

  create: async (typeData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/custom-account-types`, {
        method: 'POST',
        body: JSON.stringify(typeData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to create custom account type';
      throw new Error(errorMessage);
    }
  },

  update: async (id, typeData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/custom-account-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(typeData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to update custom account type';
      throw new Error(errorMessage);
    }
  },

  delete: async (value) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/custom-account-types/${value}`, {
        method: 'DELETE'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete custom account type';
      throw new Error(errorMessage);
    }
  }
};

// API service for GL Account Mappings operations
export const glAccountMappingAPI = {
  // Get all mappings for the current user
  getAll: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings`);
    return response;
  },

  // Get mapping by account ID
  getByAccountId: async (accountId) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings/${accountId}`);
    return response;
  },

  // Save a single mapping
  save: async (mapping) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings`, {
      method: 'POST',
      body: JSON.stringify(mapping)
    });
    return response;
  },

  // Save multiple mappings (bulk)
  saveBulk: async (mappings) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings/bulk`, {
      method: 'POST',
      body: JSON.stringify({ mappings })
    });
    return response;
  },

  // Update a mapping
  update: async (accountId, mapping) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(mapping)
    });
    return response;
  },

  // Delete a mapping
  delete: async (accountId) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-account-mappings/${accountId}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// API service for GL Accounts operations
export const glAccountAPI = {
  // Get all GL accounts
  getAll: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts`);
    return response;
  },

  // Get user-created GL accounts
  getUserAccounts: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts/user`);
    return response;
  },

  // Get GL accounts by type
  getByType: async (type) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts/type/${type}`);
    return response;
  },

  // Get a single GL account by ID
  getById: async (id) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts/${id}`);
    return response;
  },

  // Create a new GL account
  create: async (accountData) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts`, {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
    return response;
  },

  // Update a GL account
  update: async (id, accountData) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData)
    });
    return response;
  },

  // Delete a GL account
  delete: async (id) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/gl-accounts/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// API service for Other Transaction Types operations
export const otherTransactionTypeAPI = {
  // Get all transaction types for the current user
  getAll: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types`);
    return response;
  },

  // Get active transaction types for the current user
  getActive: async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/active`);
    return response;
  },

  // Get transaction types by category
  getByCategory: async (category) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/category/${category}`);
    return response;
  },

  // Get a single transaction type by ID
  getById: async (id) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/${id}`);
    return response;
  },

  // Create a new transaction type
  create: async (transactionType) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types`, {
      method: 'POST',
      body: JSON.stringify(transactionType)
    });
    return response;
  },

  // Update a transaction type
  update: async (id, transactionType) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionType)
    });
    return response;
  },

  // Deactivate a transaction type (soft delete)
  deactivate: async (id) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/${id}/deactivate`, {
      method: 'PATCH'
    });
    return response;
  },

  // Delete a transaction type (hard delete)
  delete: async (id) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/other-transaction-types/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

// API service for Trial Balance operations
export const trialBalanceAPI = {
  // Get Trial Balance data
  getTrialBalance: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        _ts: Date.now().toString()
      });

      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance?${queryParams}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        let details = '';
        try {
          const errJson = await response.json();
          details = errJson?.error || errJson?.message || errJson?.details || JSON.stringify(errJson);
        } catch (e) {
          try {
            details = await response.text();
          } catch (e2) {
            // ignore
          }
        }
        throw new Error(details ? `HTTP ${response.status}: ${details}` : `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      throw error;
    }
  },

  // Get Trial Balance summary
  getTrialBalanceSummary: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate || defaultMonthStartYmd(),
        endDate: filters.endDate || defaultTodayYmd(),
        _ts: Date.now().toString()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance/summary?${queryParams}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        let details = '';
        try {
          const errJson = await response.json();
          details = errJson?.error || errJson?.message || errJson?.details || JSON.stringify(errJson);
        } catch (e) {
          try {
            details = await response.text();
          } catch (e2) {
            // ignore
          }
        }
        throw new Error(details ? `HTTP ${response.status}: ${details}` : `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trial balance summary:', error);
      throw error;
    }
  },

  // Get account details
  getAccountDetails: async (accountCode, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        _ts: Date.now().toString()
      });

      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance/account/${accountCode}?${queryParams}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        let details = '';
        try {
          const errJson = await response.json();
          details = errJson?.error || errJson?.message || errJson?.details || JSON.stringify(errJson);
        } catch (e) {
          try {
            details = await response.text();
          } catch (e2) {
            // ignore
          }
        }
        throw new Error(details ? `HTTP ${response.status}: ${details}` : `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  },

  /** Combined Equity + GSec trial balance as Excel (.xlsx) blob */
  exportCombinedTrialBalanceExcel: async (filters = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token, authorization denied');
    }

    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);
    if (filters.search) params.append('search', filters.search);

    const qs = params.toString();
    const url = `${API_BASE_URL}/trial-balance/combined/export${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      clearAuthAndRedirectToLogin();
      throw new Error('Session expired or invalid. Please log in again.');
    }

    if (!response.ok) {
      let msg = `Failed to export (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        msg = errJson?.error || errJson?.message || msg;
      } catch (e) {
        // ignore
      }
      throw new Error(msg);
    }

    return await response.blob();
  }
};

// Account Reconciliation API
export const accountReconciliationAPI = {
  // Get account transactions for reconciliation
  getAccountTransactions: async (accountCode, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        accountCode: accountCode,
        startDate: filters.startDate || defaultMonthStartYmd(),
        endDate: filters.endDate || defaultTodayYmd()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/transactions?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw error;
    }
  },

  // Save reconciliation (persists matched pairs for this account + period only)
  saveReconciliation: async (reconciliationData) => {
    try {
      if (!localStorage.getItem('token')) {
        clearAuthAndRedirectToLogin();
        throw new Error('No token, authorization denied');
      }
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/save`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reconciliationData)
      });

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const body = await response.json();
          message = body?.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      throw error;
    }
  },

  getReconciliationMatches: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.accountCode) {
        queryParams.append('accountCode', filters.accountCode);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/account-reconciliation/matches?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const body = await response.json();
          message = body?.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reconciliation matches:', error);
      throw error;
    }
  },

  // Get reconciliation history
  getReconciliationHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.accountCode) {
        queryParams.append('accountCode', filters.accountCode);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/history?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching reconciliation history:', error);
      throw error;
    }
  },

  // Upload external statement
  uploadExternalStatement: async (file, accountCode, password = '') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountCode', accountCode);
      if (password) {
        formData.append('password', password);
      }
      
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/upload-statement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const body = await response.json();
          message = body?.error || message;
        } catch {
          // Keep the status message if the server didn't return JSON.
        }
        throw new Error(message);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading external statement:', error);
      throw error;
    }
  },

  // Save previewed statement entries to database
  passStatementEntries: async ({ accountCode, sourceFileName, entries }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/pass-entries`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountCode,
          sourceFileName,
          entries
        })
      });

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const body = await response.json();
          message = body?.error || message;
        } catch {
          // Keep the status message if the server didn't return JSON.
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Error passing statement entries:', error);
      throw error;
    }
  },

  // Load saved statement entries from database
  getStatementEntries: async (accountCode, filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (accountCode) {
        queryParams.append('accountCode', accountCode);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/account-reconciliation/statement-entries?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const body = await response.json();
          message = body?.error || message;
        } catch {
          // Keep the status message if the server didn't return JSON.
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statement entries:', error);
      throw error;
    }
  }
};

// API service for Profit & Loss operations
export const profitLossAPI = {
  // Get Profit & Loss Statement data
  getProfitLoss: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate || defaultYearStartYmd(),
        endDate: filters.endDate || defaultTodayYmd()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/profit-loss?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching profit & loss:', error);
      throw error;
    }
  },

  // Get P&L Summary
  getProfitLossSummary: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate || defaultYearStartYmd(),
        endDate: filters.endDate || defaultTodayYmd()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/profit-loss/summary?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching P&L summary:', error);
      throw error;
    }
  }
};

export const financialPositionAPI = {
  // Get Statement of Financial Position (Balance Sheet) data
  getFinancialPosition: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        asOfDate: filters.asOfDate || defaultTodayYmd()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolioId', filters.portfolio);
      }
      if (filters.withMtmData) {
        queryParams.append('withMtmData', 'true');
      }
      if (filters.withNotes) {
        queryParams.append('withNotes', 'true');
      }
      
      const response = await fetch(`${API_BASE_URL}/financial-position?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial position:', error);
      throw error;
    }
  },

  // Get Financial Position Summary
  getFinancialPositionSummary: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        asOfDate: filters.asOfDate || defaultTodayYmd()
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolioId', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/financial-position/summary?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial position summary:', error);
      throw error;
    }
  },

  // Get portfolio export table (counter/share/WACC/MV analytics)
  getPortfolioExportTable: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        asOfDate: filters.asOfDate || defaultTodayYmd()
      });

      if (filters.portfolioId) {
        queryParams.append('portfolioId', filters.portfolioId);
      }

      const response = await fetch(`${API_BASE_URL}/financial-position/portfolio-export-table?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio export table:', error);
      throw error;
    }
  }
};

// API service for GSec entries (sell transaction report)
export const gsecEntriesAPI = {
  // Get sell transaction report for GSec entries
  getSellTransactionReport: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Map UI filters to GSEC general-ledger API contract
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      // Pagination: API uses limit/offset; UI uses page/pageSize
      if (filters.pageSize) {
        queryParams.append('limit', filters.pageSize);
      }
      if (filters.page && filters.pageSize) {
        const offset = (Number(filters.page) - 1) * Number(filters.pageSize);
        queryParams.append('offset', String(offset));
      }

      const url = queryParams.toString()
        ? `${API_BASE_URL}/gsec/reports/sell-transaction?${queryParams.toString()}`
        : `${API_BASE_URL}/gsec/reports/sell-transaction`;

      // Use authenticated request so it works like the rest of the app, and
      // benefits from existing 401 handling and token forwarding.
      return await makeAuthenticatedRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('Error fetching GSec sell transaction report:', error);
      throw error;
    }
  },

  // Save current GSec entries into backend gsec_entries table
  saveEntriesToDatabase: async (entries) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/gsec-entries/import`, {
        method: 'POST',
        body: JSON.stringify({ entries })
      });
    } catch (error) {
      console.error('Error saving GSec entries to database:', error);
      const message = error.message || 'Failed to save GSec entries to database';
      throw new Error(message);
    }
  },

  /** GSec Ledger Entries screen only — owner may post from this flow. */
  saveLedgerEntriesToDatabase: async (entries) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/gsec-entries/import`, {
        method: 'POST',
        body: JSON.stringify({ entries })
      });
    } catch (error) {
      console.error('Error saving GSec ledger entries to database:', error);
      const message = error.message || 'Failed to save GSec entries to database';
      throw new Error(message);
    }
  },

  submitLedgerEntriesForApproval: async (entries) => {
    return gsecEntriesAPI.submitGsecEntriesForApproval(entries, {
      source: 'gsec_ledger_entries',
    });
  },

  /** Shared maker-checker submit for all GSec posting screens. */
  submitGsecEntriesForApproval: async (entries, { source, passDuplicates = false } = {}) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/governance/business-requests`, {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'gsec_ledger_entry',
          action_type: 'post',
          payload: {
            source,
            passDuplicates: !!passDuplicates,
            entries,
          },
        }),
      });
    } catch (error) {
      console.error('Error submitting GSec entries for approval:', error);
      const message = error.message || 'Failed to submit GSec entries for approval';
      throw new Error(message);
    }
  },

  checkGsecDuplicates: async (entries) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/gsec-entries/check-duplicates`, {
        method: 'POST',
        body: JSON.stringify({ entries }),
      });
    } catch (error) {
      console.error('Error checking GSec duplicates:', error);
      const message = error.message || 'Failed to check GSec duplicates';
      throw new Error(message);
    }
  },

  /** GSec Manual Entry Posting only: duplicate-aware save with optional bypass */
  manualPostEntries: async (entries, { passDuplicates = false } = {}) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/gsec-entries/manual-post`, {
        method: 'POST',
        body: JSON.stringify({ entries, passDuplicates })
      });
    } catch (error) {
      console.error('Error posting GSec manual entries:', error);
      const message = error.message || 'Failed to post GSec manual entries';
      throw new Error(message);
    }
  },

  // Remote rows not in local gsec_entries (deal_number + entry date, time ignored)
  getMissingFromRemote: async ({ force = false } = {}) => {
    try {
      const url = force
        ? `${API_BASE_URL}/gsec-entries/missing-from-remote?force=1`
        : `${API_BASE_URL}/gsec-entries/missing-from-remote`;
      return await makeAuthenticatedRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('Error fetching missing GSec entries:', error);
      const message = error.message || 'Failed to fetch missing GSec entries';
      throw new Error(message);
    }
  },

  // Get remote rows for a single date that are missing from the local table.
  // Only the selected entry date is fetched/compared (fast).
  getMissingByDate: async (date) => {
    try {
      const url = `${API_BASE_URL}/gsec-entries/missing-by-date?date=${encodeURIComponent(date)}`;
      return await makeAuthenticatedRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('Error fetching missing GSec entries by date:', error);
      const message = error.message || 'Failed to fetch missing GSec entries for the selected date';
      throw new Error(message);
    }
  },

  // Paginated GSec ledger entries (avoids API Gateway 413 on large datasets)
  // Accepts filters object, or legacy string deal_number for older callers.
  getSavedLedgerEntries: async (filters = {}) => {
    try {
      if (typeof filters === 'string') {
        filters = { deal_number: filters };
      } else if (filters == null) {
        filters = {};
      }

      const queryParams = new URLSearchParams({
        _ts: Date.now().toString(),
        page: String(filters.page || 1),
        limit: String(Math.min(Math.max(parseInt(filters.limit, 10) || 50, 1), 100)),
      });

      if (filters.deal_number) queryParams.append('deal_number', filters.deal_number);
      if (filters.account_code) queryParams.append('account_code', filters.account_code);
      if (filters.account_category) queryParams.append('account_category', filters.account_category);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.search) queryParams.append('search', filters.search);

      return await makeAuthenticatedRequest(
        `${API_BASE_URL}/gsec-entries?${queryParams.toString()}`,
        { method: 'GET' }
      );
    } catch (error) {
      console.error('Error fetching saved GSec ledger entries:', error);
      const message = error.message || 'Failed to fetch saved GSec ledger entries';
      throw new Error(message);
    }
  },

  // Get Balance Sheet-style summary for GSec entries
  getBalanceSheet: async ({ startDate, endDate, accountCode } = {}) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (accountCode) params.append('accountCode', accountCode);

      const url = params.toString()
        ? `${API_BASE_URL}/gsec-entries/balance-sheet?${params.toString()}`
        : `${API_BASE_URL}/gsec-entries/balance-sheet`;

      return await makeAuthenticatedRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('Error fetching GSec balance sheet data:', error);
      const message = error.message || 'Failed to fetch GSec balance sheet data';
      throw new Error(message);
    }
  },

  // Get detailed GSec entries for a specific account (Balance Sheet "View Details")
  getBalanceSheetAccountDetails: async (accountCode, { startDate, endDate } = {}) => {
    try {
      if (!accountCode) {
        throw new Error('Account code is required');
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const baseUrl = `${API_BASE_URL}/gsec-entries/balance-sheet/account/${encodeURIComponent(
        accountCode
      )}`;
      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

      return await makeAuthenticatedRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('Error fetching GSec account details:', error);
      const message = error.message || 'Failed to fetch GSec account details';
      throw new Error(message);
    }
  }
};

// API service for journal / double-entry operations
export const journalEntriesAPI = {
  getDoubleEntryGroup: async (source, lineId) => {
    try {
      const queryParams = new URLSearchParams({
        source: String(source),
        lineId: String(lineId),
        _ts: Date.now().toString()
      });

      return await makeAuthenticatedRequest(
        `${API_BASE_URL}/journal-entries/double-entries/group?${queryParams}`,
        { method: 'GET', cache: 'no-store' }
      );
    } catch (error) {
      console.error('Error fetching double-entry group:', error);
      throw error;
    }
  }
};

// API service for Opening Balance operations
export const openingBalanceAPI = {
  // Create a new opening balance entry
  create: async (openingBalanceData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances`, {
        method: 'POST',
        body: JSON.stringify(openingBalanceData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to create opening balance entry';
      throw new Error(errorMessage);
    }
  },

  // Get all opening balance entries
  getAll: async () => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch opening balance entries';
      throw new Error(errorMessage);
    }
  },

  // Get opening balance entry by ID
  getById: async (id) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances/${id}`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch opening balance entry';
      throw new Error(errorMessage);
    }
  },

  // Get opening balances by account code
  getByAccountCode: async (accountCode) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances/account/${accountCode}`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch opening balances by account code';
      throw new Error(errorMessage);
    }
  },

  // Get opening balances by date range
  getByDateRange: async (startDate, endDate) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances/date-range?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch opening balances by date range';
      throw new Error(errorMessage);
    }
  },

  // Update opening balance entry
  update: async (id, openingBalanceData) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(openingBalanceData)
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to update opening balance entry';
      throw new Error(errorMessage);
    }
  },

  // Delete opening balance entry
  delete: async (id) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/opening-balances/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete opening balance entry';
      throw new Error(errorMessage);
    }
  }
};

// API service for portfolio settlement mappings
export const portfolioSettlementMappingAPI = {
  // Get all portfolio settlement mappings for current user
  getAllMappings: async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/portfolio-settlement-mappings`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching portfolio settlement mappings:', error);
      throw error;
    }
  },

  // Create or update a portfolio settlement mapping
  upsertMapping: async (mappingData) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/portfolio-settlement-mappings`, {
        method: 'POST',
        body: JSON.stringify(mappingData)
      });
      return response;
    } catch (error) {
      console.error('Error saving portfolio settlement mapping:', error);
      throw error;
    }
  },

  // Delete a portfolio settlement mapping by id
  deleteMapping: async (id) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/portfolio-settlement-mappings/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting portfolio settlement mapping:', error);
      throw error;
    }
  },

  // Delete a portfolio settlement mapping by portfolio_id
  deleteMappingByPortfolio: async (portfolioId) => {
    try {
      return await makeAuthenticatedRequest(`${API_BASE_URL}/portfolio-settlement-mappings/portfolio/${portfolioId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      // If mapping doesn't exist (404), that's fine - treat as success (idempotent)
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        return { success: true, message: 'Mapping already deleted' };
      }
      console.error('Error deleting portfolio settlement mapping:', error);
      throw error;
    }
  }
};

// API service for monthly portfolio updates
export const monthlyPortfolioUpdateAPI = {
  // Save CSV data to database
  saveMonthlyPortfolioData: async (data) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/monthly-portfolio-updates/save`, {
        method: 'POST',
        body: JSON.stringify({ data })
      });
      return response;
    } catch (error) {
      console.error('Error saving monthly portfolio data:', error);
      throw error;
    }
  },

  // Get all monthly portfolio updates
  getAllMonthlyPortfolioUpdates: async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/monthly-portfolio-updates/all`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching monthly portfolio updates:', error);
      throw error;
    }
  },

  // Get monthly portfolio updates by date range
  getMonthlyPortfolioUpdatesByDateRange: async (startDate, endDate) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/monthly-portfolio-updates/by-date-range?startDate=${startDate}&endDate=${endDate}`
      );
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching monthly portfolio updates by date range:', error);
      throw error;
    }
  }
};

// API service for dashboard (market summary uses real CSE data from trade_summaries)
export const dashboardAPI = {
  getMarketSummary: async () => {
    try {
      console.log('🔍 Fetching market summary from:', `${API_BASE_URL}/dashboard/market-summary`);
      const response = await fetch(`${API_BASE_URL}/dashboard/market-summary`, {
        headers: getAuthHeaders()
      });
      
      console.log('🔍 Market summary response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Market summary API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      console.log('🔍 Market summary API response:', json);
      
      // Handle both wrapped { success: true, data: {...} } and direct data responses
      const data = json.success !== undefined ? (json.data || json) : json;
      
      console.log('✅ Market summary data extracted:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching market summary:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }
  ,
  getGlobalMarketStatus: async () => {
    try {
      // Server-side proxy keeps Alpha Vantage API key off the browser
      const response = await fetch(`${API_BASE_URL}/dashboard/global-market-status`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || `HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      // route returns { success, data, ... }
      return json?.data ?? json;
    } catch (error) {
      console.error('Error fetching global market status:', error);
      throw error;
    }
  }
};

// API service for AI-powered analysis
export const aiAnalysisAPI = {
  // Enhance market narrative with AI
  enhanceMarketNarrative: async (technicalData, currentNarrative = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-analysis/narrative/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          technicalData,
          currentNarrative
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.enhancedNarrative || data.originalNarrative || currentNarrative;
    } catch (error) {
      console.error('Error enhancing narrative with AI:', error);
      throw error;
    }
  },

  // Answer questions about portfolio or market
  answerQuestion: async (question, portfolioId = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-analysis/question/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          question,
          portfolioId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error getting AI answer:', error);
      throw error;
    }
  },

  // Analyze financial news from URL
  analyzeFinancialNews: async (url, stockSymbol = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-analysis/news/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          url,
          stockSymbol
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing financial news:', error);
      throw error;
    }
  }
};

/** Grounded AI assistant (portfolio + market context from backend) */
export const aiChatAPI = {
  sendMessage: async (message, portfolioId = 'all') => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, portfolioId }),
    });
  },
};

/**
 * CSE Stock ML predictions (Python FastAPI behind the Node.js backend).
 * Proxied at /api/ml/* — see Equity_module_Backend/routes/mlPredictionRoutes.js
 */
export const mlPredictionAPI = {
  /** Probe the ML service. Returns { ok, ml_service, ml_service_url }. */
  health: async () => {
    const res = await fetch(`${API_BASE_URL}/ml/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },

  /** Model availability + most recent training summary. */
  status: async () => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/ml/status`, {
      method: 'GET',
    });
  },

  /**
   * Re-train all models from one or many CSV / TSV files.
   * @param {File|File[]} fileOrFiles Single file or array of File objects
   * @returns {Promise<object>} { message, files_processed, summary }
   */
  train: async (fileOrFiles) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const list = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    if (!list.length) throw new Error('Select at least one file to upload.');

    const form = new FormData();
    list.forEach((f) => form.append('files', f));

    const res = await fetch(`${API_BASE_URL}/ml/train`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || errBody.error || `Train failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * Predict for a single stock row.
   * payload = { company?, symbol?, open, high, low, prev_close,
   *             last_trade?, share_volume?, trade_volume? }
   */
  predict: async (payload) => {
    return await makeAuthenticatedRequest(`${API_BASE_URL}/ml/predict`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Notebook reproduction endpoints (require trained models)
  eda: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/eda`, { method: 'GET' }),
  correlation: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/correlation`, { method: 'GET' }),
  classificationDetails: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/classification/details`, { method: 'GET' }),
  regressionDetails: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/regression/details`, { method: 'GET' }),
  clusteringDetails: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/clustering/details`, { method: 'GET' }),
  anomalyDetails: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/anomaly/details`, { method: 'GET' }),
  volatilityDetails: async () =>
    makeAuthenticatedRequest(`${API_BASE_URL}/ml/volatility/details`, { method: 'GET' }),

  /** Paginated/filtered all-stocks results table. */
  results: async ({ limit = 0, onlyAnomalies = false, clusterLabel = '', search = '' } = {}) => {
    const qs = new URLSearchParams();
    if (limit) qs.set('limit', limit);
    if (onlyAnomalies) qs.set('only_anomalies', 'true');
    if (clusterLabel) qs.set('cluster_label', clusterLabel);
    if (search) qs.set('search', search);
    const url = `${API_BASE_URL}/ml/results${qs.toString() ? `?${qs}` : ''}`;
    return makeAuthenticatedRequest(url, { method: 'GET' });
  },

  /** Trigger CSV download of full enriched dataset. */
  downloadResultsCsv: async () => {
    await _downloadCsv(`${API_BASE_URL}/ml/results.csv`, 'cse_ml_results.csv');
  },

  /**
   * Buy signals (Notebook Cell 13) — sorted by buy_score then gainer_probability.
   * Filters: { limit, recommendation, minScore, clusterLabel, search }
   */
  recommendations: async ({
    limit = 0,
    recommendation = '',
    minScore = null,
    clusterLabel = '',
    search = '',
  } = {}) => {
    const qs = new URLSearchParams();
    if (limit) qs.set('limit', limit);
    if (recommendation) qs.set('recommendation', recommendation);
    if (minScore !== null && minScore !== '') qs.set('min_score', minScore);
    if (clusterLabel) qs.set('cluster_label', clusterLabel);
    if (search) qs.set('search', search);
    const url = `${API_BASE_URL}/ml/recommendations${qs.toString() ? `?${qs}` : ''}`;
    return makeAuthenticatedRequest(url, { method: 'GET' });
  },

  downloadRecommendationsCsv: async () => {
    await _downloadCsv(
      `${API_BASE_URL}/ml/recommendations.csv`,
      'stock_buy_recommendations.csv'
    );
  },

  /**
   * Next-day buy signals — one row per company.
   * Filters: { limit, recommendation, minProbability, search }
   * recommendation is one of STRONG BUY | BUY | WATCH | AVOID.
   * minProbability is between 0 and 1.
   */
  nextDay: async ({
    limit = 0,
    recommendation = '',
    minProbability = null,
    search = '',
  } = {}) => {
    const qs = new URLSearchParams();
    if (limit) qs.set('limit', limit);
    if (recommendation) qs.set('recommendation', recommendation);
    if (minProbability !== null && minProbability !== '') {
      qs.set('min_probability', minProbability);
    }
    if (search) qs.set('search', search);
    const url = `${API_BASE_URL}/ml/next-day${qs.toString() ? `?${qs}` : ''}`;
    return makeAuthenticatedRequest(url, { method: 'GET' });
  },

  downloadNextDayCsv: async () => {
    await _downloadCsv(
      `${API_BASE_URL}/ml/next-day.csv`,
      'next_day_recommendations.csv'
    );
  },
};

async function _downloadCsv(url, filename) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `CSV download failed (${res.status})`);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}