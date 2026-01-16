import React, { useState, useEffect } from 'react';
import { accountAPI, portfolioAPI, portfolioSettlementMappingAPI } from '../../services/api';
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
  const [savingMappings, setSavingMappings] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

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

      // Fetch portfolio settlement mappings from API
      try {
        const savedMappingsData = await portfolioSettlementMappingAPI.getAllMappings();
        // Convert portfolio_id to string for consistent comparison
        const savedMappingsMap = new Map((savedMappingsData || []).map(m => [String(m.portfolio_id), m]));
        
        // Filter out duplicates and create mappings
        const seenPortfolioIds = new Set();
        const mappings = (portfoliosData || []).filter(portfolio => {
          const portfolioId = portfolio.id || portfolio.portfolioId;
          if (!portfolioId || seenPortfolioIds.has(String(portfolioId))) {
            return false; // Skip duplicates or invalid IDs
          }
          seenPortfolioIds.add(String(portfolioId));
          return true;
        }).map(portfolio => {
          const portfolioId = String(portfolio.id || portfolio.portfolioId);
          const savedMapping = savedMappingsMap.get(portfolioId);
          return {
            portfolioId,
            portfolioName: portfolio.portfolio_name || portfolio.portfolioName || portfolio.name,
            // Store accountId as string to match <select> value
            accountId: savedMapping?.account_id != null ? String(savedMapping.account_id) : '',
            accountName: savedMapping?.account_name || '',
            paymentMethod: savedMapping?.payment_method || ''
          };
        });
        setPortfolioMappings(mappings);
      } catch (mappingError) {
        console.error('Error fetching portfolio settlement mappings:', mappingError);
        // Fallback to empty mappings if API fails
        const seenPortfolioIds = new Set();
        const mappings = (portfoliosData || []).filter(portfolio => {
          const portfolioId = portfolio.id || portfolio.portfolioId;
          if (!portfolioId || seenPortfolioIds.has(portfolioId)) {
            return false; // Skip duplicates or invalid IDs
          }
          seenPortfolioIds.add(portfolioId);
          return true;
        }).map(portfolio => {
          const portfolioId = portfolio.id || portfolio.portfolioId;
          return {
            portfolioId,
            portfolioName: portfolio.portfolio_name || portfolio.portfolioName || portfolio.name,
            accountId: null,
            accountName: '',
            paymentMethod: ''
          };
        });
        setPortfolioMappings(mappings);
      }

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
        // Ensure we compare IDs as strings so number/string differences don't break the match
        const selectedAccount = accounts.find(acc => String(acc.id) === String(accountId));
        // If account is deselected, clear payment method as well
        const finalAccountId = accountId || null;
        const finalPaymentMethod = finalAccountId ? paymentMethod : '';
        return {
          ...mapping,
          accountId: finalAccountId,
          accountName: selectedAccount ? `${selectedAccount.account_name} - ${selectedAccount.account_number}` : '',
          paymentMethod: finalPaymentMethod
        };
      }
      return mapping;
    });
    setPortfolioMappings(updated);
    // Clear save message when user makes changes
    setSaveMessage({ type: '', text: '' });
  };

  const handleSavePortfolioMappings = async () => {
    setSavingMappings(true);
    setSaveMessage({ type: '', text: '' });
    
    try {
      // Separate mappings into those to save and those to delete
      const mappingsToSave = portfolioMappings.filter(m => m.accountId);
      const mappingsToDelete = portfolioMappings.filter(m => !m.accountId);
      
      const savePromises = [];
      
      // Save/update mappings that have an account selected
      mappingsToSave.forEach(mapping => {
        // Convert account_id to number for database
        const accountIdNum = parseInt(mapping.accountId, 10);
        if (isNaN(accountIdNum)) {
          console.error('Invalid account_id:', mapping.accountId);
          return; // Skip invalid account IDs
        }
        
        savePromises.push(
          portfolioSettlementMappingAPI.upsertMapping({
            portfolio_id: String(mapping.portfolioId), // Ensure portfolio_id is string for consistency
            portfolio_name: mapping.portfolioName,
            account_id: accountIdNum, // Send as number
            payment_method: mapping.paymentMethod || ''
          })
        );
      });
      
      // Delete mappings that have been deselected
      // The API now handles 404 gracefully (treats as success), so we can just call it
      mappingsToDelete.forEach(mapping => {
        savePromises.push(
          portfolioSettlementMappingAPI.deleteMappingByPortfolio(mapping.portfolioId)
        );
      });

      if (savePromises.length === 0) {
        setSaveMessage({ type: 'info', text: 'No changes to save.' });
        setSavingMappings(false);
        return;
      }

      await Promise.all(savePromises);
      
      const saveCount = mappingsToSave.length;
      const deleteCount = mappingsToDelete.length;
      let message = '';
      
      if (saveCount > 0 && deleteCount > 0) {
        message = `Successfully saved ${saveCount} mapping(s) and removed ${deleteCount} mapping(s)!`;
      } else if (saveCount > 0) {
        message = `Successfully saved ${saveCount} portfolio mapping(s)!`;
      } else if (deleteCount > 0) {
        message = `Successfully removed ${deleteCount} portfolio mapping(s)!`;
      }
      
      setSaveMessage({ type: 'success', text: message });
      
      // Refresh mappings from API to get updated state
      try {
        const updatedMappingsData = await portfolioSettlementMappingAPI.getAllMappings();
        // Convert portfolio_id to string for consistent comparison
        const savedMappingsMap = new Map((updatedMappingsData || []).map(m => [String(m.portfolio_id), m]));
        
        // Filter out duplicates and create mappings
        const seenPortfolioIds = new Set();
        const updatedMappings = portfolios.filter(portfolio => {
          const portfolioId = portfolio.id || portfolio.portfolioId;
          if (!portfolioId || seenPortfolioIds.has(String(portfolioId))) {
            return false; // Skip duplicates or invalid IDs
          }
          seenPortfolioIds.add(String(portfolioId));
          return true;
        }).map(portfolio => {
          const portfolioId = String(portfolio.id || portfolio.portfolioId);
          const savedMapping = savedMappingsMap.get(portfolioId);
          return {
            portfolioId,
            portfolioName: portfolio.portfolio_name || portfolio.portfolioName || portfolio.name,
            // Store accountId as string to match <select> value
            accountId: savedMapping?.account_id != null ? String(savedMapping.account_id) : '',
            accountName: savedMapping?.account_name || '',
            paymentMethod: savedMapping?.payment_method || ''
          };
        });
        setPortfolioMappings(updatedMappings);
      } catch (refreshError) {
        console.error('Error refreshing mappings:', refreshError);
        // Continue even if refresh fails
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving portfolio mappings:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save portfolio mappings. Please try again.' 
      });
    } finally {
      setSavingMappings(false);
    }
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
    const account = accounts.find(acc => String(acc.id) === String(accountId));
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
                    portfolioMappings.map((mapping, index) => {
                      const account = accounts.find(acc => String(acc.id) === String(mapping.accountId));
                      return (
                        <tr key={`portfolio-${mapping.portfolioId}-${index}`}>
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
                              disabled={!mapping.accountId}
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

            {/* Save Button and Message */}
            <div className="si-mapping-actions">
              <button 
                className="si-btn si-btn-primary" 
                onClick={handleSavePortfolioMappings}
                disabled={savingMappings}
              >
                {savingMappings ? (
                  <>
                    <span className="si-spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    Save Portfolio Mappings
                  </>
                )}
              </button>
              {saveMessage.text && (
                <div className={`si-save-message si-save-message-${saveMessage.type}`}>
                  {saveMessage.type === 'success' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                  {saveMessage.type === 'error' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  )}
                  {saveMessage.type === 'warning' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                  )}
                  {saveMessage.type === 'info' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}
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




