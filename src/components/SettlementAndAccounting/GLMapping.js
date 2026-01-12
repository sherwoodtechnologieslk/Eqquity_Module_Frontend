import React, { useState, useEffect } from 'react';
import { glAccountMappingAPI, investmentAccountAPI, accountAPI, portfolioAPI, chartOfAccountsAPI } from '../../services/api';
import './Styles/GLMapping.css';

const GLMapping = () => {
  const [activeTab, setActiveTab] = useState('bank');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bank Account to GL Account Mappings
  const [bankMappings, setBankMappings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);

  // Portfolio to Investment GL Account Mappings
  const [investmentMappings, setInvestmentMappings] = useState([]);
  const [portfolios, setPortfolios] = useState([]);

  // Filters
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [investmentSearchTerm, setInvestmentSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching GL mapping data...');

      // Fetch bank account mappings
      const bankMappingsData = await glAccountMappingAPI.getAll();
      console.log('✅ Bank account mappings:', bankMappingsData?.length || 0);
      setBankMappings(bankMappingsData || []);

      // Fetch investment account mappings
      const investmentMappingsData = await investmentAccountAPI.getMappings();
      console.log('✅ Investment account mappings:', investmentMappingsData?.length || 0);
      setInvestmentMappings(investmentMappingsData || []);

      // Fetch accounts for reference
      const accountsData = await accountAPI.getAllAccounts();
      setAccounts(accountsData || []);

      // Fetch portfolios for reference
      const portfoliosData = await portfolioAPI.getAllPortfolios();
      setPortfolios(portfoliosData || []);

      // Fetch GL accounts for reference
      const glAccountsData = await chartOfAccountsAPI.getAll();
      setGlAccounts(glAccountsData || []);

    } catch (err) {
      console.error('❌ Error fetching GL mapping data:', err);
      setError('Failed to load GL mapping data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBankMapping = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account GL mapping?')) {
      return;
    }

    try {
      await glAccountMappingAPI.delete(accountId);
      setBankMappings(prev => prev.filter(m => m.account_id !== accountId));
    } catch (err) {
      console.error('Error deleting bank mapping:', err);
      alert('Failed to delete mapping. Please try again.');
    }
  };

  const handleDeleteInvestmentMapping = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment account mapping?')) {
      return;
    }

    try {
      await investmentAccountAPI.deleteMapping(id);
      setInvestmentMappings(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting investment mapping:', err);
      alert('Failed to delete mapping. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.account_name} - ${account.account_number}` : 'Unknown Account';
  };

  const getPortfolioName = (portfolioId) => {
    const portfolio = portfolios.find(p => 
      p.id === portfolioId || p.portfolioId === portfolioId
    );
    return portfolio ? (portfolio.portfolio_name || portfolio.portfolioName || portfolio.name) : portfolioId;
  };

  const getGLAccountName = (accountCode) => {
    const glAccount = glAccounts.find(acc => acc.account_code === accountCode);
    return glAccount ? glAccount.description : 'Unknown';
  };

  // Filter bank mappings
  const filteredBankMappings = bankMappings.filter(mapping => {
    if (!bankSearchTerm) return true;
    const term = bankSearchTerm.toLowerCase();
    return (
      (mapping.account_name && mapping.account_name.toLowerCase().includes(term)) ||
      (mapping.account_number && mapping.account_number.toLowerCase().includes(term)) ||
      (mapping.bank_name && mapping.bank_name.toLowerCase().includes(term)) ||
      (mapping.gl_account_code && mapping.gl_account_code.toLowerCase().includes(term)) ||
      (mapping.gl_account_name && mapping.gl_account_name.toLowerCase().includes(term))
    );
  });

  // Filter investment mappings
  const filteredInvestmentMappings = investmentMappings.filter(mapping => {
    if (!investmentSearchTerm) return true;
    const term = investmentSearchTerm.toLowerCase();
    return (
      (mapping.portfolio_name && mapping.portfolio_name.toLowerCase().includes(term)) ||
      (mapping.portfolio_id && mapping.portfolio_id.toLowerCase().includes(term)) ||
      (mapping.account_code && mapping.account_code.toLowerCase().includes(term)) ||
      (mapping.account_name && mapping.account_name.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="glm-container">
        <div className="glm-loading">
          <div className="glm-spinner"></div>
          <p>Loading GL mappings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glm-container">
        <div className="glm-error">
          <p>{error}</p>
          <button onClick={fetchData} className="glm-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glm-container">
      <div className="glm-header">
        <h1 className="glm-title">GL Mapping</h1>
        <p className="glm-subtitle">View and manage all General Ledger account mappings</p>
      </div>

      {/* Tabs */}
      <div className="glm-tabs">
        <button
          className={`glm-tab ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Bank Account Mappings
          <span className="glm-tab-badge">{bankMappings.length}</span>
        </button>
        <button
          className={`glm-tab ${activeTab === 'investment' ? 'active' : ''}`}
          onClick={() => setActiveTab('investment')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Investment Account Mappings
          <span className="glm-tab-badge">{investmentMappings.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="glm-content">
        {/* Bank Account to GL Account Mappings */}
        {activeTab === 'bank' && (
          <div className="glm-tab-content">
            <div className="glm-section-header">
              <div>
                <h2>Bank Account to GL Account Mappings</h2>
                <p>These mappings link your bank accounts (from Account Master) to General Ledger accounts. Used for Buy/Sell transactions.</p>
              </div>
              <button onClick={fetchData} className="glm-btn glm-btn-refresh">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="glm-search-bar">
              <svg className="glm-search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search by bank name, account number, GL account code or name..."
                value={bankSearchTerm}
                onChange={(e) => setBankSearchTerm(e.target.value)}
                className="glm-search-input"
              />
            </div>

            {/* Summary Stats */}
            <div className="glm-stats">
              <div className="glm-stat-card">
                <div className="glm-stat-label">Total Mappings</div>
                <div className="glm-stat-value">{bankMappings.length}</div>
              </div>
              <div className="glm-stat-card">
                <div className="glm-stat-label">Filtered Results</div>
                <div className="glm-stat-value">{filteredBankMappings.length}</div>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="glm-table-container">
              <table className="glm-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Account Number</th>
                    <th>Bank Name</th>
                    <th>Branch</th>
                    <th>GL Account Code</th>
                    <th>GL Account Name</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBankMappings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="glm-empty">
                        {bankMappings.length === 0 
                          ? 'No bank account GL mappings found. Create mappings in Account Master or GL Account Mappings.'
                          : 'No mappings match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredBankMappings.map((mapping) => (
                      <tr key={mapping.account_id}>
                        <td><strong>{mapping.account_name || 'N/A'}</strong></td>
                        <td>{mapping.account_number || 'N/A'}</td>
                        <td>{mapping.bank_name || 'N/A'}</td>
                        <td>{mapping.branch_name || 'N/A'}</td>
                        <td>
                          <span className="glm-code-badge">{mapping.gl_account_code || 'N/A'}</span>
                        </td>
                        <td>{mapping.gl_account_name || 'N/A'}</td>
                        <td>{formatDate(mapping.created_at)}</td>
                        <td>{formatDate(mapping.updated_at)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteBankMapping(mapping.account_id)}
                            className="glm-btn-delete"
                            title="Delete Mapping"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Portfolio to Investment GL Account Mappings */}
        {activeTab === 'investment' && (
          <div className="glm-tab-content">
            <div className="glm-section-header">
              <div>
                <h2>Portfolio to Investment GL Account Mappings</h2>
                <p>These mappings link each portfolio to an Investment in Equity Securities GL account. Used for Buy transactions.</p>
              </div>
              <button onClick={fetchData} className="glm-btn glm-btn-refresh">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="glm-search-bar">
              <svg className="glm-search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search by portfolio name, portfolio ID, GL account code or name..."
                value={investmentSearchTerm}
                onChange={(e) => setInvestmentSearchTerm(e.target.value)}
                className="glm-search-input"
              />
            </div>

            {/* Summary Stats */}
            <div className="glm-stats">
              <div className="glm-stat-card">
                <div className="glm-stat-label">Total Mappings</div>
                <div className="glm-stat-value">{investmentMappings.length}</div>
              </div>
              <div className="glm-stat-card">
                <div className="glm-stat-label">Filtered Results</div>
                <div className="glm-stat-value">{filteredInvestmentMappings.length}</div>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="glm-table-container">
              <table className="glm-table">
                <thead>
                  <tr>
                    <th>Portfolio Name</th>
                    <th>Portfolio ID</th>
                    <th>GL Account Code</th>
                    <th>GL Account Name</th>
                    <th>Account Description</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestmentMappings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="glm-empty">
                        {investmentMappings.length === 0 
                          ? 'No portfolio investment account mappings found. Create mappings in Trade Capture → Equity GL Mapping.'
                          : 'No mappings match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredInvestmentMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td><strong>{mapping.portfolio_name || getPortfolioName(mapping.portfolio_id) || 'N/A'}</strong></td>
                        <td>
                          <span className="glm-id-badge">{mapping.portfolio_id || 'N/A'}</span>
                        </td>
                        <td>
                          <span className="glm-code-badge">{mapping.account_code || 'N/A'}</span>
                        </td>
                        <td>{mapping.account_name || 'N/A'}</td>
                        <td>{getGLAccountName(mapping.account_code) || 'N/A'}</td>
                        <td>{formatDate(mapping.created_at)}</td>
                        <td>{formatDate(mapping.updated_at)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteInvestmentMapping(mapping.id)}
                            className="glm-btn-delete"
                            title="Delete Mapping"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GLMapping;





