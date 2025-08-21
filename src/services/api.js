const API_BASE_URL = 'http://localhost:8080/api';

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
      const response = await fetch(`${API_BASE_URL}/accounts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'DELETE',
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

  // Save buy transaction entry
  saveBuyTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trade-summary/save-buy-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch(`${API_BASE_URL}/trade-summary/buy-transactions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trade summaries:', error);
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
}; 

// API service for portfolio operations
export const portfolioAPI = {
  // Get all portfolios
  getAllPortfolios: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      throw error;
    }
  },

  // Create new portfolio
  createPortfolio: async (portfolioData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${API_BASE_URL}/portfolios/active`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      const response = await fetch(`${API_BASE_URL}/portfolio-strategy`);
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
    const response = await fetch(`${API_BASE_URL}/portfolios/by-name/${encodeURIComponent(portfolioName)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio by name:', error);
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
      const response = await fetch(`${API_BASE_URL}/portfolio-costing-method`);
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
  getAllEntries: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching general ledger entries:', error);
      throw error;
    }
  },

  // Get general ledger entries by buy transaction ID
  getByBuyTransactionId: async (buyTransactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/general-ledger/buy-transaction/${buyTransactionId}`);
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
      const response = await fetch(`${API_BASE_URL}/general-ledger/account/${accountCode}`);
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
      const response = await fetch(`${API_BASE_URL}/transaction-entries/by-portfolio?portfolio=${encodeURIComponent(portfolioName)}`);
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
    const res = await fetch(`http://localhost:8080/api/transaction-entries/companies?portfolio=${encodeURIComponent(portfolioName)}`);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },
  getTotalQuantity: async (portfolioName, companyName) => {
    const res = await fetch(`http://localhost:8080/api/transaction-entries/total-quantity?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`);
    if (!res.ok) throw new Error('Failed to fetch total quantity');
    return res.json();
  },
  getWAPByPortfolioAndCompany: async (portfolioName, companyName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/wap?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`);
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
      const response = await fetch(`${API_BASE_URL}/transaction-entries/fifo?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}&sellQuantity=${encodeURIComponent(sellQuantity)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FIFO cost:', error);
      throw error;
    }
  },
  saveSellTransaction: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell-by-portfolio?portfolio=${encodeURIComponent(portfolioName)}`);
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
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell-all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
  getAvailableBuyLots: async (portfolioName, companyName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/buy-lots?portfolio=${encodeURIComponent(portfolioName)}&company=${encodeURIComponent(companyName)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available buy lots:', error);
      throw error;
    }
  },
  saveSellTransactionWithAllocations: async (sellTransaction, allocations) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction-entries/sell-with-allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

export const chartOfAccountsAPI = {
  getAll: async () => {
    const response = await fetch('http://localhost:8080/api/chart-of-accounts');
    if (!response.ok) throw new Error('Failed to fetch chart of accounts');
    return await response.json();
  }
};
