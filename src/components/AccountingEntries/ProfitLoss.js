import React, { useState, useEffect, useCallback } from 'react';
import './Styles/ProfitLoss.css';
import { profitLossAPI, transactionEntryAPI } from '../../services/api';
import { portfolioAPI } from '../../services/api';

const ProfitLoss = () => {
  const [profitLossData, setProfitLossData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [mtmLoading, setMtmLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0],
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'

  const fetchProfitLoss = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await profitLossAPI.getProfitLoss(filters);
      
      if (data.success) {
        setProfitLossData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch P&L data');
      }
    } catch (err) {
      console.error('Error fetching P&L:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfitLoss();
    fetchPortfolios();
  }, [fetchProfitLoss]);

  const fetchPortfolios = async () => {
    try {
      const data = await portfolioAPI.getActivePortfolios();
      setAvailablePortfolios(data);
      setPortfolios(data); // Also set portfolios for MTM calculations
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    }
  };

  // Function to fetch MTM data and calculate unrealized capital gains
  const fetchMTMData = async () => {
    setMtmLoading(true);
    try {
      let totalUnrealizedCapitalGains = 0;
      
      // Fetch MTM data for all portfolios
      for (const portfolio of portfolios) {
        try {
          const mtmData = await transactionEntryAPI.getPortfolioPositions(portfolio.id);
          
          // Calculate unrealized capital gains for this portfolio
          const portfolioUnrealizedGains = mtmData.reduce((sum, item) => {
            return sum + (item.unrealizedGainLoss || 0);
          }, 0);
          
          totalUnrealizedCapitalGains += portfolioUnrealizedGains;
        } catch (error) {
          console.error(`Error fetching MTM data for portfolio ${portfolio.portfolioName}:`, error);
        }
      }
      
      // Update the profit loss data with the calculated unrealized capital gains
      if (profitLossData) {
        const updatedData = {
          ...profitLossData,
          totals: {
            ...profitLossData.totals,
            unrealized_capital_gains: totalUnrealizedCapitalGains,
            net_profit: (profitLossData.totals.operating_profit || 0) + totalUnrealizedCapitalGains
          }
        };
        setProfitLossData(updatedData);
      }
      
      console.log('✅ MTM data fetched successfully. Total unrealized capital gains:', totalUnrealizedCapitalGains);
    } catch (error) {
      console.error('❌ Error fetching MTM data:', error);
      setError('Failed to fetch MTM data. Please try again.');
    } finally {
      setMtmLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  };

  const renderAccountRow = (account, index) => (
    <tr key={account.account_code} className="profit-loss-account-row">
      <td className="profit-loss-account-code">{account.account_code}</td>
      <td className="profit-loss-account-name">{account.account_name}</td>
      <td className="profit-loss-account-type">{account.account_type}</td>
      <td className={`profit-loss-account-balance ${getBalanceColor(account.balance)}`}>
        {formatCurrency(Math.abs(account.balance))} {account.balance_type}
      </td>
    </tr>
  );

  const renderTypeSubtotal = (type, subtotal) => (
    <tr key={`subtotal-${type}`} className="profit-loss-type-subtotal-row">
      <td colSpan="2" className="profit-loss-subtotal-label">
        <strong>{type} Subtotal</strong>
      </td>
      <td className="profit-loss-subtotal-type">{type}</td>
      <td className={`profit-loss-subtotal-balance ${getBalanceColor(subtotal.balance)}`}>
        <strong>{formatCurrency(Math.abs(subtotal.balance))} {subtotal.balance > 0 ? 'DR' : 'CR'}</strong>
      </td>
    </tr>
  );

  const renderCategorySubtotal = (categoryName, subtotal) => (
    <tr key={`category-subtotal-${categoryName}`} className="profit-loss-category-subtotal-row">
      <td colSpan="2" className="profit-loss-category-subtotal-label">
        <strong>{categoryName} Subtotal</strong>
      </td>
      <td className="profit-loss-category-subtotal-type">{categoryName}</td>
      <td className={`profit-loss-category-subtotal-balance ${getBalanceColor(subtotal)}`}>
        <strong>{formatCurrency(Math.abs(subtotal))} {subtotal > 0 ? 'CR' : 'DR'}</strong>
      </td>
    </tr>
  );

  const renderCategorySection = (categoryName, accounts, isExpense = false) => {
    if (!accounts || accounts.length === 0) return null;
    
    return (
      <React.Fragment key={categoryName}>
        <tr className="profit-loss-category-header-row">
          <td colSpan="4" className="profit-loss-category-header">
            <strong>{categoryName}</strong>
          </td>
        </tr>
        {accounts.map((account, index) => renderAccountRow(account, index))}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <div className="profit-loss-loading-container">
        <div className="profit-loss-loading-spinner"></div>
        <p className="profit-loss-loading-text">Loading Profit & Loss Statement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profit-loss-error-container">
        <h3 className="profit-loss-error-title">Error Loading P&L Statement</h3>
        <p className="profit-loss-error-message">{error}</p>
        <button onClick={fetchProfitLoss} className="profit-loss-retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profit-loss-main-container">
      {/* Header */}
      <div className="profit-loss-header-section">
        <div className="profit-loss-header-left">
          <h1 className="profit-loss-main-title">Profit & Loss Statement</h1>
          <div className="profit-loss-period-info">
            <span className="profit-loss-period-label">Period:</span>
            <span className="profit-loss-period-dates">
              {formatDate(profitLossData?.period.startDate)} - {formatDate(profitLossData?.period.endDate)}
            </span>
            <span className="profit-loss-portfolio-info">
              ({profitLossData?.period.portfolio})
            </span>
          </div>
        </div>
        <div className="profit-loss-header-right">
          <div className="profit-loss-generated-info">
            Generated: {new Date(profitLossData?.totals.generated_date).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="profit-loss-filters-section">
        <div className="profit-loss-filters-row">
          <div className="profit-loss-filter-group">
            <label className="profit-loss-filter-label">Start Date:</label>
            <input
              type="date"
              className="profit-loss-filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="profit-loss-filter-group">
            <label className="profit-loss-filter-label">End Date:</label>
            <input
              type="date"
              className="profit-loss-filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="profit-loss-filter-group">
            <label className="profit-loss-filter-label">Portfolio:</label>
            <select
              className="profit-loss-filter-select"
              value={filters.portfolio}
              onChange={(e) => handleFilterChange('portfolio', e.target.value)}
            >
              <option value="">All Portfolios</option>
              {availablePortfolios.map(portfolio => (
                <option key={portfolio.portfolioId} value={portfolio.portfolioId}>
                  {portfolio.portfolioName}
                </option>
              ))}
            </select>
          </div>
          <div className="profit-loss-filter-group">
            <label className="profit-loss-filter-label">View:</label>
            <select
              className="profit-loss-filter-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="detailed">Detailed View</option>
              <option value="summary">Summary View</option>
            </select>
          </div>
          <div className="profit-loss-filter-actions">
            <button onClick={fetchProfitLoss} className="profit-loss-refresh-button">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div className="profit-loss-summary-cards">
        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">Total Revenue</div>
          <div className="profit-loss-card-value positive">{formatCurrency(profitLossData?.totals.total_revenue || 0)}</div>
          <div className="profit-loss-card-subtitle">Revenue from all sources (before expenses)</div>
        </div>

        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">Realized Capital Gains</div>
          <div className={`profit-loss-card-value ${getBalanceColor(profitLossData?.totals.realized_capital_gains || 0)}`}>
            {formatCurrency(profitLossData?.totals.realized_capital_gains || 0)}
          </div>
          <div className="profit-loss-card-subtitle">Gains/losses from selling shares</div>
        </div>

        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">Total Expenses</div>
          <div className="profit-loss-card-value negative">{formatCurrency(profitLossData?.totals.total_expenses || 0)}</div>
          <div className="profit-loss-card-subtitle">Operating and other costs</div>
        </div>

        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">Operating Profit</div>
          <div className={`profit-loss-card-value ${getBalanceColor(profitLossData?.totals.operating_profit || 0)}`}>
            {formatCurrency(profitLossData?.totals.operating_profit || 0)}
          </div>
          <div className="profit-loss-card-subtitle">Revenue minus expenses (Income/Profit)</div>
        </div>

        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">
            <span>Unrealized Capital Gain</span>
            <button 
              className="profit-loss-get-data-button"
              onClick={fetchMTMData}
              disabled={mtmLoading || portfolios.length === 0}
              title="Fetch current MTM data from all portfolios"
            >
              {mtmLoading ? 'Loading...' : 'Get data'}
            </button>
          </div>
          <div className={`profit-loss-card-value ${getBalanceColor(profitLossData?.totals.unrealized_capital_gains || 0)}`}>
            {formatCurrency(profitLossData?.totals.unrealized_capital_gains || 0)}
          </div>
          <div className="profit-loss-card-subtitle">Unrealized gains/losses</div>
        </div>

        <div className="profit-loss-summary-card">
          <div className="profit-loss-card-header">Net Profit/Loss</div>
          <div className={`profit-loss-card-value ${getBalanceColor(profitLossData?.totals.net_profit || 0)}`}>
            {formatCurrency(profitLossData?.totals.net_profit || 0)}
          </div>
          <div className="profit-loss-card-subtitle">Final P&L after unrealized gains</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profit-loss-main-content">
        {viewMode === 'detailed' ? (
          <div className="profit-loss-detailed-view">
            {/* Revenue Section */}
            <div className="profit-loss-section">
              <h3 className="profit-loss-section-title">Revenue</h3>
              <div className="profit-loss-table-container">
                <table className="profit-loss-data-table">
                  <thead>
                    <tr className="profit-loss-table-header">
                      <th className="profit-loss-th-account-code">Account Code</th>
                      <th className="profit-loss-th-account-name">Account Name</th>
                      <th className="profit-loss-th-type">Type</th>
                      <th className="profit-loss-th-balance">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossData?.revenueByCategory && Object.keys(profitLossData.revenueByCategory).length > 0 ? (
                      Object.keys(profitLossData.revenueByCategory).map(category => (
                        <React.Fragment key={category}>
                          {renderCategorySection(category, profitLossData.revenueByCategory[category], false)}
                          {profitLossData.revenueCategorySubtotals && profitLossData.revenueCategorySubtotals[category] && 
                            renderCategorySubtotal(category, profitLossData.revenueCategorySubtotals[category])
                          }
                        </React.Fragment>
                      ))
                    ) : (
                      profitLossData?.revenueAccounts?.map((account, index) => renderAccountRow(account, index))
                    )}
                    {profitLossData?.revenueSubtotal && 
                      renderTypeSubtotal('Total Revenue', profitLossData.revenueSubtotal)
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Realized Capital Gains Section */}
            <div className="profit-loss-section">
              <h3 className="profit-loss-section-title">Realized Capital Gains</h3>
              <div className="profit-loss-table-container">
                <table className="profit-loss-data-table">
                  <thead>
                    <tr className="profit-loss-table-header">
                      <th className="profit-loss-th-account-code">Account Code</th>
                      <th className="profit-loss-th-account-name">Account Name</th>
                      <th className="profit-loss-th-type">Type</th>
                      <th className="profit-loss-th-balance">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossData?.capitalGainsByCategory && Object.keys(profitLossData.capitalGainsByCategory).length > 0 ? (
                      Object.keys(profitLossData.capitalGainsByCategory).map(category => (
                        <React.Fragment key={category}>
                          {renderCategorySection(category, profitLossData.capitalGainsByCategory[category], false)}
                          {profitLossData.capitalGainsCategorySubtotals && profitLossData.capitalGainsCategorySubtotals[category] && 
                            renderCategorySubtotal(category, profitLossData.capitalGainsCategorySubtotals[category])
                          }
                        </React.Fragment>
                      ))
                    ) : (
                      profitLossData?.realizedCapitalGainAccounts?.map((account, index) => renderAccountRow(account, index))
                    )}
                    {profitLossData?.realizedCapitalGainsSubtotal && 
                      renderTypeSubtotal('Total Realized Capital Gains', profitLossData.realizedCapitalGainsSubtotal)
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="profit-loss-section">
              <h3 className="profit-loss-section-title">Expenses</h3>
              <div className="profit-loss-table-container">
                <table className="profit-loss-data-table">
                  <thead>
                    <tr className="profit-loss-table-header">
                      <th className="profit-loss-th-account-code">Account Code</th>
                      <th className="profit-loss-th-account-name">Account Name</th>
                      <th className="profit-loss-th-type">Type</th>
                      <th className="profit-loss-th-balance">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossData?.expensesByCategory && Object.keys(profitLossData.expensesByCategory).length > 0 ? (
                      Object.keys(profitLossData.expensesByCategory).map(category => (
                        <React.Fragment key={category}>
                          {renderCategorySection(category, profitLossData.expensesByCategory[category], true)}
                          {profitLossData.expenseCategorySubtotals && profitLossData.expenseCategorySubtotals[category] && 
                            renderCategorySubtotal(category, profitLossData.expenseCategorySubtotals[category])
                          }
                        </React.Fragment>
                      ))
                    ) : (
                      profitLossData?.expenseAccounts?.map((account, index) => renderAccountRow(account, index))
                    )}
                    {profitLossData?.expenseSubtotal && 
                      renderTypeSubtotal('Total Expenses', profitLossData.expenseSubtotal)
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unrealized Capital Gains Section */}
            <div className="profit-loss-section">
              <h3 className="profit-loss-section-title">Unrealized Capital Gains</h3>
              <div className="profit-loss-table-container">
                <table className="profit-loss-data-table">
                  <thead>
                    <tr className="profit-loss-table-header">
                      <th className="profit-loss-th-account-code">Portfolio</th>
                      <th className="profit-loss-th-account-name">Description</th>
                      <th className="profit-loss-th-type">Type</th>
                      <th className="profit-loss-th-balance">Unrealized Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossData?.unrealizedCapitalGains?.map((adjustment, index) => (
                      <tr key={`unrealized-${index}`} className="profit-loss-account-row">
                        <td className="profit-loss-account-code">{adjustment.portfolio}</td>
                        <td className="profit-loss-account-name">{adjustment.description}</td>
                        <td className="profit-loss-account-type">UNREALIZED</td>
                        <td className={`profit-loss-account-balance ${getBalanceColor(adjustment.amount)}`}>
                          {formatCurrency(Math.abs(adjustment.amount))} {adjustment.amount > 0 ? 'GAIN' : 'LOSS'}
                        </td>
                      </tr>
                    ))}
                    {profitLossData?.unrealizedCapitalGainsSubtotal && 
                      renderTypeSubtotal('Unrealized Capital Gains', profitLossData.unrealizedCapitalGainsSubtotal)
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net P&L Summary */}
            <div className="profit-loss-net-summary">
              <div className="profit-loss-net-summary-card">
                <h3 className="profit-loss-net-title">Net Profit/Loss Summary</h3>
                <div className="profit-loss-net-breakdown">
                  <div className="profit-loss-net-item">
                    <span className="profit-loss-net-label">Operating Profit:</span>
                    <span className={`profit-loss-net-value ${getBalanceColor(profitLossData?.totals.operating_profit || 0)}`}>
                      {formatCurrency(profitLossData?.totals.operating_profit || 0)}
                    </span>
                  </div>
                  <div className="profit-loss-net-item">
                    <span className="profit-loss-net-label">Realized Capital Gains:</span>
                    <span className={`profit-loss-net-value ${getBalanceColor(profitLossData?.totals.realized_capital_gains || 0)}`}>
                      {formatCurrency(profitLossData?.totals.realized_capital_gains || 0)}
                    </span>
                  </div>
                  <div className="profit-loss-net-item">
                    <span className="profit-loss-net-label">Unrealized Capital Gains:</span>
                    <span className={`profit-loss-net-value ${getBalanceColor(profitLossData?.totals.unrealized_capital_gains || 0)}`}>
                      {formatCurrency(profitLossData?.totals.unrealized_capital_gains || 0)}
                    </span>
                  </div>
                  <div className="profit-loss-net-item profit-loss-net-total">
                    <span className="profit-loss-net-label">Net Profit/Loss:</span>
                    <span className={`profit-loss-net-value ${getBalanceColor(profitLossData?.totals.net_profit || 0)}`}>
                      {formatCurrency(profitLossData?.totals.net_profit || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profit-loss-summary-view">
            <div className="profit-loss-summary-cards-grid">
              {profitLossData?.summary && profitLossData.summary.map((typeSummary, index) => (
                <div key={index} className="profit-loss-summary-card">
                  <h3 className="profit-loss-summary-card-title">{typeSummary.account_type}</h3>
                  <div className="profit-loss-summary-details">
                    <div className="profit-loss-summary-item">
                      <span className="profit-loss-summary-label">Total Amount:</span>
                      <span className={`profit-loss-summary-value ${getBalanceColor(typeSummary.total_amount)}`}>
                        {formatCurrency(Math.abs(typeSummary.total_amount))} {typeSummary.total_amount > 0 ? 'DR' : 'CR'}
                      </span>
                    </div>
                    <div className="profit-loss-summary-item">
                      <span className="profit-loss-summary-label">Account Count:</span>
                      <span className="profit-loss-summary-value">{typeSummary.account_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitLoss;
