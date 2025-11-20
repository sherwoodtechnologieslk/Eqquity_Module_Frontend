const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
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
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trade summaries:', error);
      throw error;
    }
  },

  // Get unique company names and symbols for dropdown
  getCompanyList: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trade-summary/companies`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
  }
};

// API service for cost of funds operations
export const costOfFundsAPI = {
  // Get all cost of funds definitions
  getAllCostOfFunds: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-of-funds`);
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
      const response = await fetch(`${API_BASE_URL}/cost-of-funds/${id}`);
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
      
      const response = await fetch(endpoint);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(costOfFundsData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(costOfFundsData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
  
  update: async (id, accountData) => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chart-of-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData)
    });
    return response;
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
        startDate: filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        startDate: filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance/summary?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        startDate: filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/trial-balance/account/${accountCode}?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  }
};

// Account Reconciliation API
export const accountReconciliationAPI = {
  // Get account transactions for reconciliation
  getAccountTransactions: async (accountCode, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        accountCode: accountCode,
        startDate: filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolio', filters.portfolio);
      }
      
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/transactions?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw error;
    }
  },

  // Save reconciliation
  saveReconciliation: async (reconciliationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reconciliationData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving reconciliation:', error);
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
  uploadExternalStatement: async (file, accountCode) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountCode', accountCode);
      
      const response = await fetch(`${API_BASE_URL}/account-reconciliation/upload-statement`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading external statement:', error);
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
        startDate: filters.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
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
        startDate: filters.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
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
        asOfDate: filters.asOfDate || new Date().toISOString().split('T')[0]
      });
      
      if (filters.portfolio) {
        queryParams.append('portfolioId', filters.portfolio);
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
        asOfDate: filters.asOfDate || new Date().toISOString().split('T')[0]
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