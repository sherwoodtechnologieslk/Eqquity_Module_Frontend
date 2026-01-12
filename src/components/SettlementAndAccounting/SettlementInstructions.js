import React, { useState, useEffect } from 'react';
import { accountAPI, portfolioAPI } from '../../services/api';
import './Styles/SettlementInstructions.css';

const SettlementInstructions = () => {
  const [activeTab, setActiveTab] = useState('defaults');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default Settlement Accounts state
  const [accounts, setAccounts] = useState([]);
  const [defaultAccounts, setDefaultAccounts] = useState({
    buy: null,
    sell: null,
    other: null
  });

  // Portfolio Mapping state
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioMappings, setPortfolioMappings] = useState([]);

  // Settlement Preferences state
  const [preferences, setPreferences] = useState({
    defaultPaymentMethod: '',
    defaultSettlementDays: 3,
    defaultCurrency: 'LKR',
    autoPopulateSettlement: true,
    autoPopulatePaymentMethod: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch accounts
      const accountsData = await accountAPI.getAllAccounts();
      setAccounts(accountsData || []);

      // Fetch portfolios
      const portfoliosData = await portfolioAPI.getAllPortfolios();
      setPortfolios(portfoliosData || []);

      // Initialize portfolio mappings - merge with localStorage data
      const savedMappings = localStorage.getItem('portfolio_settlement_mappings');
      const savedMappingsData = savedMappings ? JSON.parse(savedMappings) : [];
      const savedMappingsMap = new Map(savedMappingsData.map(m => [m.portfolioId, m]));
      
      const mappings = (portfoliosData || []).map(portfolio => {
        const portfolioId = portfolio.id || portfolio.portfolioId;
        const savedMapping = savedMappingsMap.get(portfolioId);
        return {
          portfolioId,
          portfolioName: portfolio.portfolio_name || portfolio.portfolioName || portfolio.name,
          accountId: savedMapping?.accountId || null,
          accountName: savedMapping?.accountName || '',
          paymentMethod: savedMapping?.paymentMethod || ''
        };
      });
      setPortfolioMappings(mappings);

      // Load default accounts from localStorage (or could be from API)
      const savedDefaults = localStorage.getItem('settlement_defaults');
      if (savedDefaults) {
        setDefaultAccounts(JSON.parse(savedDefaults));
      }

      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('settlement_preferences');
      if (savedPreferences) {
        const defaultPreferences = {
          defaultPaymentMethod: '',
          defaultSettlementDays: 3,
          defaultCurrency: 'LKR',
          autoPopulateSettlement: true,
          autoPopulatePaymentMethod: true
        };
        setPreferences({ ...defaultPreferences, ...JSON.parse(savedPreferences) });
      }
    } catch (err) {
      console.error('Error fetching settlement data:', err);
      setError('Failed to load settlement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAccount = (transactionType, accountId) => {
    const updated = {
      ...defaultAccounts,
      [transactionType]: accountId
    };
    setDefaultAccounts(updated);
    localStorage.setItem('settlement_defaults', JSON.stringify(updated));
  };

  const handleUpdatePortfolioMapping = (portfolioId, accountId, paymentMethod) => {
    const updated = portfolioMappings.map(mapping => {
      if (mapping.portfolioId === portfolioId) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        return {
          ...mapping,
          accountId,
          accountName: selectedAccount ? `${selectedAccount.account_name} - ${selectedAccount.account_number}` : '',
          paymentMethod
        };
      }
      return mapping;
    });
    setPortfolioMappings(updated);
    localStorage.setItem('portfolio_settlement_mappings', JSON.stringify(updated));
  };

  const handlePreferenceChange = (key, value) => {
    const updated = {
      ...preferences,
      [key]: value
    };
    setPreferences(updated);
    localStorage.setItem('settlement_preferences', JSON.stringify(updated));
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.account_name} - ${account.account_number} (${account.bank_name})` : 'Not Set';
  };

  if (loading) {
    return (
      <div className="si-container">
        <div className="si-loading">
          <div className="si-spinner"></div>
          <p>Loading settlement instructions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="si-container">
        <div className="si-error">
          <p>{error}</p>
          <button onClick={fetchData} className="si-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="si-container">
      <div className="si-header">
        <h1 className="si-title">Settlement Instructions</h1>
        <p className="si-subtitle">Configure default settlement accounts and preferences</p>
      </div>

      {/* Tabs */}
      <div className="si-tabs">
        <button
          className={`si-tab ${activeTab === 'defaults' ? 'active' : ''}`}
          onClick={() => setActiveTab('defaults')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Default Accounts
        </button>
        <button
          className={`si-tab ${activeTab === 'mapping' ? 'active' : ''}`}
          onClick={() => setActiveTab('mapping')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Portfolio Mapping
        </button>
        <button
          className={`si-tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          Preferences
        </button>
      </div>

      {/* Tab Content */}
      <div className="si-content">
        {/* Tab 1: Default Settlement Accounts */}
        {activeTab === 'defaults' && (
          <div className="si-tab-content">
            <div className="si-section-header">
              <h2>Default Settlement Accounts by Transaction Type</h2>
              <p>Set default settlement accounts for different transaction types. These will be used when no specific account is selected.</p>
            </div>

            <div className="si-default-accounts">
              {/* Buy Transactions Default */}
              <div className="si-default-card">
                <div className="si-card-header">
                  <div className="si-card-icon buy">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3>Buy Transactions</h3>
                    <p>Default account for purchasing securities</p>
                  </div>
                </div>
                <div className="si-card-body">
                  <label>Select Default Account</label>
                  <select
                    value={defaultAccounts.buy || ''}
                    onChange={(e) => handleSetDefaultAccount('buy', e.target.value || null)}
                    className="si-select"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.account_number} ({account.bank_name})
                      </option>
                    ))}
                  </select>
                  {defaultAccounts.buy && (
                    <div className="si-selected-account">
                      <strong>Selected:</strong> {getAccountName(defaultAccounts.buy)}
                    </div>
                  )}
                </div>
              </div>

              {/* Sell Transactions Default */}
              <div className="si-default-card">
                <div className="si-card-header">
                  <div className="si-card-icon sell">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13H5v-2h14v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3>Sell Transactions</h3>
                    <p>Default account for selling securities</p>
                  </div>
                </div>
                <div className="si-card-body">
                  <label>Select Default Account</label>
                  <select
                    value={defaultAccounts.sell || ''}
                    onChange={(e) => handleSetDefaultAccount('sell', e.target.value || null)}
                    className="si-select"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.account_number} ({account.bank_name})
                      </option>
                    ))}
                  </select>
                  {defaultAccounts.sell && (
                    <div className="si-selected-account">
                      <strong>Selected:</strong> {getAccountName(defaultAccounts.sell)}
                    </div>
                  )}
                </div>
              </div>

              {/* Other Transactions Default */}
              <div className="si-default-card">
                <div className="si-card-header">
                  <div className="si-card-icon other">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3>Other Transactions</h3>
                    <p>Default account for other financial transactions</p>
                  </div>
                </div>
                <div className="si-card-body">
                  <label>Select Default Account</label>
                  <select
                    value={defaultAccounts.other || ''}
                    onChange={(e) => handleSetDefaultAccount('other', e.target.value || null)}
                    className="si-select"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.account_number} ({account.bank_name})
                      </option>
                    ))}
                  </select>
                  {defaultAccounts.other && (
                    <div className="si-selected-account">
                      <strong>Selected:</strong> {getAccountName(defaultAccounts.other)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Portfolio-to-Settlement Account Mapping */}
        {activeTab === 'mapping' && (
          <div className="si-tab-content">
            <div className="si-section-header">
              <h2>Portfolio-to-Settlement Account Mapping</h2>
              <p>Map each portfolio to a default settlement account and payment method. These settings will override the default accounts above.</p>
            </div>

            <div className="si-mapping-table-container">
              <table className="si-mapping-table">
                <thead>
                  <tr>
                    <th>Portfolio</th>
                    <th>Settlement Account</th>
                    <th>Payment Method</th>
                    <th>Account Details</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioMappings.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="si-empty">
                        No portfolios found. Create portfolios in Portfolio Master first.
                      </td>
                    </tr>
                  ) : (
                    portfolioMappings.map((mapping) => {
                      const account = accounts.find(acc => acc.id === mapping.accountId);
                      return (
                        <tr key={mapping.portfolioId}>
                          <td>
                            <strong>{mapping.portfolioName}</strong>
                          </td>
                          <td>
                            <select
                              value={mapping.accountId || ''}
                              onChange={(e) => handleUpdatePortfolioMapping(
                                mapping.portfolioId,
                                e.target.value || null,
                                mapping.paymentMethod
                              )}
                              className="si-select-small"
                            >
                              <option value="">-- Select Account --</option>
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.account_name} - {acc.account_number}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={mapping.paymentMethod || ''}
                              onChange={(e) => handleUpdatePortfolioMapping(
                                mapping.portfolioId,
                                mapping.accountId,
                                e.target.value
                              )}
                              className="si-select-small"
                            >
                              <option value="">-- Select Method --</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Online Banking">Online Banking</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Cash">Cash</option>
                            </select>
                          </td>
                          <td>
                            {account ? (
                              <div className="si-account-details">
                                <div><strong>Bank:</strong> {account.bank_name}</div>
                                <div><strong>Branch:</strong> {account.branch_name}</div>
                                {account.swift_code && <div><strong>SWIFT:</strong> {account.swift_code}</div>}
                                {account.iban && <div><strong>IBAN:</strong> {account.iban}</div>}
                              </div>
                            ) : (
                              <span className="si-no-account">No account selected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Settlement Preferences */}
        {activeTab === 'preferences' && (
          <div className="si-tab-content">
            <div className="si-section-header">
              <h2>Settlement Preferences</h2>
              <p>Configure default settlement preferences that will be applied across all transactions.</p>
            </div>

            <div className="si-preferences">
              <div className="si-preference-card">
                <div className="si-preference-header">
                  <h3>Default Payment Method</h3>
                  <p>Select the default payment method for transactions</p>
                </div>
                <div className="si-preference-body">
                  <select
                    value={preferences.defaultPaymentMethod}
                    onChange={(e) => handlePreferenceChange('defaultPaymentMethod', e.target.value)}
                    className="si-select"
                  >
                    <option value="">-- Select Default Method --</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Banking">Online Banking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="si-preference-card">
                <div className="si-preference-header">
                  <h3>Settlement Date Preferences</h3>
                  <p>Default number of days for settlement (T+ days)</p>
                </div>
                <div className="si-preference-body">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={preferences.defaultSettlementDays}
                    onChange={(e) => handlePreferenceChange('defaultSettlementDays', parseInt(e.target.value) || 0)}
                    className="si-input"
                  />
                  <span className="si-input-help">Standard settlement is T+3 days</span>
                </div>
              </div>

              <div className="si-preference-card">
                <div className="si-preference-header">
                  <h3>Default Currency</h3>
                  <p>Default currency for settlements</p>
                </div>
                <div className="si-preference-body">
                  <select
                    value={preferences.defaultCurrency}
                    onChange={(e) => handlePreferenceChange('defaultCurrency', e.target.value)}
                    className="si-select"
                  >
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>

              <div className="si-preference-card">
                <div className="si-preference-header">
                  <h3>Auto-Populate Settings</h3>
                  <p>Automatically populate settlement details in transaction forms</p>
                </div>
                <div className="si-preference-body">
                  <div className="si-checkbox-group">
                    <label className="si-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.autoPopulateSettlement}
                        onChange={(e) => handlePreferenceChange('autoPopulateSettlement', e.target.checked)}
                        className="si-checkbox"
                      />
                      <span>Auto-populate settlement account details</span>
                    </label>
                    <label className="si-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.autoPopulatePaymentMethod}
                        onChange={(e) => handlePreferenceChange('autoPopulatePaymentMethod', e.target.checked)}
                        className="si-checkbox"
                      />
                      <span>Auto-populate payment method</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="si-preference-actions">
                <button className="si-btn si-btn-primary" onClick={() => {
                  localStorage.setItem('settlement_preferences', JSON.stringify(preferences));
                  alert('Preferences saved successfully!');
                }}>
                  Save Preferences
                </button>
                <button className="si-btn si-btn-secondary" onClick={() => {
                  const defaultPreferences = {
                    defaultPaymentMethod: '',
                    defaultSettlementDays: 3,
                    defaultCurrency: 'LKR',
                    autoPopulateSettlement: true,
                    autoPopulatePaymentMethod: true
                  };
                  setPreferences(defaultPreferences);
                  localStorage.setItem('settlement_preferences', JSON.stringify(defaultPreferences));
                }}>
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementInstructions;




