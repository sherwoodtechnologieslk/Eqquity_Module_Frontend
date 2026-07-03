import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './Styles/TrialBalance.css';
import { trialBalanceAPI, transactionEntryAPI, portfolioAPI } from '../../services/api';
import AccountDetailsModal from './AccountDetailsModal';

const TrialBalance = () => {
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccountData, setSelectedAccountData] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [mtmData, setMtmData] = useState({
    totalUnrealizedCapitalGain: 0,
    fairValueAdjustment: 0
  });
  const [mtmLoading, setMtmLoading] = useState(false);

  const fetchTrialBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await trialBalanceAPI.getTrialBalance(filters);
      
      if (data.success) {
        setTrialBalanceData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch trial balance data');
      }
    } catch (err) {
      console.error('Error fetching trial balance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchPortfolios = useCallback(async () => {
    try {
      // Fetch portfolios for filter dropdown (from general ledger)
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/general-ledger/portfolios`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePortfolios(Array.isArray(data) ? data : []);
      }
      
      // Fetch active portfolios with proper IDs for MTM calculations
      const activePortfolios = await portfolioAPI.getActivePortfolios();
      setPortfolios(Array.isArray(activePortfolios) ? activePortfolios : []);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setAvailablePortfolios([]);
      setPortfolios([]);
    }
  }, []);

  useEffect(() => {
    fetchTrialBalance();
    fetchPortfolios();
  }, [fetchTrialBalance, fetchPortfolios]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewDetails = async (accountCode) => {
    try {
      setShowAccountModal(true);
      setSelectedAccountData(null); // Show loading state
      
      // Fetch account details using the existing API
      const data = await trialBalanceAPI.getAccountDetails(accountCode, filters);
      
      if (data.success) {
        setSelectedAccountData(data.data);
      } else {
        console.error('Failed to fetch account details:', data.error);
        // You could show an error message here
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      // You could show an error message here
    }
  };

  const handleCloseModal = () => {
    setShowAccountModal(false);
    setSelectedAccountData(null);
  };

  // Function to fetch MTM data and calculate unrealized capital gains (same logic as Mark-to-Market Valuation screen)
  const fetchMTMData = useCallback(async () => {
    console.log('🚀 Starting MTM data fetch...');
    console.log('📊 Portfolios available:', portfolios.length);
    
    setMtmLoading(true);
    try {
      let totalUnrealizedCapitalGain = 0;
      
      // Fetch MTM data for all portfolios (same as Mark-to-Market Valuation screen)
      for (const portfolio of portfolios) {
        // Prefer numeric primary key `id`; fall back to string `portfolioId` if needed
        const portfolioId = portfolio.id || portfolio.portfolioId || portfolio.portfolio_id;
        
        if (!portfolioId) {
          console.warn(`⚠️ Skipping portfolio "${portfolio.portfolioName || portfolio.portfolio}" - no portfolio ID found`);
          continue;
        }
        
        console.log(`📈 Fetching MTM data for portfolio: ${portfolio.portfolioName || portfolio.portfolio} (ID: ${portfolioId})`);
        
        try {
          const mtmResponse = await transactionEntryAPI.getPortfolioPositions(portfolioId);
          const positions = Array.isArray(mtmResponse) ? mtmResponse : [];
          console.log(`📊 MTM data for ${portfolio.portfolioName || portfolio.portfolio}:`, positions);
          
          // Calculate portfolio totals (same logic as Mark-to-Market Valuation screen)
          const totalCost = positions.reduce((sum, item) => sum + (item.costValue || 0), 0);
          const totalGrossSales = positions.reduce((sum, item) => sum + (item.grossSales || 0), 0);
          
          // Calculate unrealized capital gain (same as Mark-to-Market Valuation: totalGrossSales - totalCost)
          const portfolioUnrealizedCapitalGain = totalGrossSales - totalCost;
          
          console.log(`💰 Portfolio ${portfolio.portfolioName || portfolio.portfolio}:`);
          console.log(`   Total Cost: ${totalCost}`);
          console.log(`   Total Gross Sales: ${totalGrossSales}`);
          console.log(`   Unrealized Capital Gain: ${portfolioUnrealizedCapitalGain}`);
          
          totalUnrealizedCapitalGain += portfolioUnrealizedCapitalGain;
        } catch (error) {
          console.error(`Error fetching MTM data for portfolio ${portfolio.portfolioName || portfolio.portfolio}:`, error);
        }
      }
      
      // Update MTM data state with single total value
      setMtmData({
        totalUnrealizedCapitalGain,
        fairValueAdjustment: totalUnrealizedCapitalGain
      });
      
      console.log('✅ MTM data auto-fetched for Trial Balance');
      console.log('Total Unrealized Capital Gain (from Mark-to-Market Valuation):', totalUnrealizedCapitalGain);
      console.log('Fair Value Adjustment:', totalUnrealizedCapitalGain);
    } catch (error) {
      console.error('❌ Error auto-fetching MTM data:', error);
    } finally {
      setMtmLoading(false);
    }
  }, [portfolios]);

  // Auto-fetch MTM data when portfolios are loaded
  useEffect(() => {
    if (portfolios.length > 0) {
      console.log('🚀 Portfolios loaded, fetching MTM data...');
      fetchMTMData();
    }
  }, [portfolios, fetchMTMData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatPeriodRange = () => {
    const { startDate, endDate } = filters;
    if (!startDate && !endDate) return null;
    if (startDate && endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    if (startDate) return `From ${formatDate(startDate)}`;
    return `Through ${formatDate(endDate)}`;
  };


  const getBalanceColor = (balance, balanceType) => {
    if (balanceType === 'ZERO') return 'neutral';
    return balance > 0 ? 'positive' : 'negative';
  };

  // Add hardcoded MTM accounts to trial balance data (only if they don't already exist)
  const addMTMAccounts = useCallback((data) => {
    if (!data || !data.accountsByType) return data;

    console.log('🔍 Adding MTM accounts with data:', mtmData);
    console.log('🔍 MTM Loading state:', mtmLoading);
    console.log('🔍 Portfolios available:', portfolios.length);

    // Create MTM accounts with real-time data (using new format: XXX-XXX-XXX-XX)
    const mtmAccounts = [
      {
        account_code: '100-101-001-001-44',
        account_name: 'Asset Fair Value Adjustment',
        account_type: 'Asset',
        total_debit: mtmData.fairValueAdjustment > 0 ? mtmData.fairValueAdjustment : 0,
        total_credit: mtmData.fairValueAdjustment < 0 ? Math.abs(mtmData.fairValueAdjustment) : 0,
        net_balance: mtmData.fairValueAdjustment,
        balance_type: mtmData.fairValueAdjustment > 0 ? 'DR' : mtmData.fairValueAdjustment < 0 ? 'CR' : 'ZERO'
      },
      {
        account_code: '417-101-001-001-44',
        account_name: 'Other Revenue Unrealized Capital Gain/Loss',
        account_type: 'Other',
        total_debit: mtmData.totalUnrealizedCapitalGain < 0 ? Math.abs(mtmData.totalUnrealizedCapitalGain) : 0,
        total_credit: mtmData.totalUnrealizedCapitalGain > 0 ? mtmData.totalUnrealizedCapitalGain : 0,
        net_balance: -mtmData.totalUnrealizedCapitalGain,
        balance_type: mtmData.totalUnrealizedCapitalGain > 0 ? 'CR' : mtmData.totalUnrealizedCapitalGain < 0 ? 'DR' : 'ZERO'
      }
    ];

    console.log('🔍 Created MTM accounts:', mtmAccounts);

    // Add MTM accounts to their respective categories (only if they don't already exist)
    const updatedData = { ...data };
    const updatedAccountsByType = { ...data.accountsByType };

    console.log('🔍 Original accountsByType:', updatedAccountsByType);

    mtmAccounts.forEach(account => {
      const type = account.account_type;
      console.log(`🔍 Processing account ${account.account_code} for type ${type}`);
      
      if (!updatedAccountsByType[type]) {
        console.log(`🔍 Creating new ${type} array`);
        updatedAccountsByType[type] = [];
      }
      
      // Check if account already exists
      const accountExists = updatedAccountsByType[type].some(existingAccount => 
        existingAccount.account_code === account.account_code
      );
      
      console.log(`🔍 Account ${account.account_code} exists:`, accountExists);
      
      // Only add if it doesn't exist
      if (!accountExists) {
        console.log(`🔍 Adding account ${account.account_code} to ${type}`);
        updatedAccountsByType[type].push(account);
      }
    });

    console.log('🔍 Updated accountsByType:', updatedAccountsByType);

    // Sort accounts within each type by account code
    Object.keys(updatedAccountsByType).forEach(type => {
      updatedAccountsByType[type].sort((a, b) => a.account_code.localeCompare(b.account_code));
    });

    // Recalculate type subtotals after adding MTM accounts
    const updatedTypeSubtotals = {};
    const updatedSummary = [];
    Object.keys(updatedAccountsByType).forEach(type => {
      const typeAccounts = updatedAccountsByType[type];
      const subtotal = typeAccounts.reduce((acc, account) => {
        acc.debit += parseFloat(account.total_debit) || 0;
        acc.credit += parseFloat(account.total_credit) || 0;
        acc.net += parseFloat(account.net_balance) || 0;
        return acc;
      }, { debit: 0, credit: 0, net: 0 });
      
      updatedTypeSubtotals[type] = subtotal;
      updatedSummary.push({
        account_type: type,
        total_debit: subtotal.debit,
        total_credit: subtotal.credit,
        net_balance: subtotal.net
      });
    });

    // Recalculate grand totals
    const updatedTotals = Object.values(updatedTypeSubtotals).reduce((acc, subtotal) => {
      acc.total_debits += subtotal.debit;
      acc.total_credits += subtotal.credit;
      return acc;
    }, { total_debits: 0, total_credits: 0 });

    const isBalanced = Math.abs(updatedTotals.total_debits - updatedTotals.total_credits) < 0.01;

    updatedData.accountsByType = updatedAccountsByType;
    updatedData.typeSubtotals = updatedTypeSubtotals;
    updatedData.summary = updatedSummary;
    updatedData.totals = {
      ...updatedTotals,
      is_balanced: isBalanced,
      account_count: Object.values(updatedAccountsByType).reduce((sum, accounts) => sum + accounts.length, 0),
      generated_date: data.totals?.generated_date || new Date().toISOString()
    };
    
    console.log('🔍 Final updatedData:', updatedData);
    return updatedData;
  }, [mtmData, mtmLoading, portfolios.length]);

  // Compute enhanced trial balance data with MTM accounts
  const enhancedTrialBalanceData = useMemo(() => {
    if (!trialBalanceData) return null;
    return addMTMAccounts(trialBalanceData);
  }, [trialBalanceData, addMTMAccounts]);

  const renderAccountRow = (account, index) => (
    <tr key={account.account_code} className="tb-account-row">
      <td className="tb-col-code tb-account-code" title={account.account_code || ''}>
        {account.account_code}
      </td>
      <td className="tb-col-name tb-account-name" title={account.account_name || ''}>
        {account.account_name}
      </td>
      <td className="tb-col-type tb-account-type">{account.account_type}</td>
      <td className="tb-col-amount tb-debit-balance">
        {account.total_debit > 0 ? formatCurrency(account.total_debit) : '—'}
      </td>
      <td className="tb-col-amount tb-credit-balance">
        {account.total_credit > 0 ? formatCurrency(account.total_credit) : '—'}
      </td>
      <td className={`tb-col-amount tb-net-balance ${getBalanceColor(account.net_balance, account.balance_type)}`}>
        {formatCurrency(Math.abs(account.net_balance))} {account.balance_type}
      </td>
      <td className="tb-col-actions tb-account-actions">
        <button
          type="button"
          className="tb-view-details-button"
          onClick={() => handleViewDetails(account.account_code)}
          title="View account details"
        >
          View Details
        </button>
      </td>
    </tr>
  );

  const renderTypeSubtotal = (type, subtotal) => (
    <tr key={`subtotal-${type}`} className="tb-type-subtotal-row">
      <td colSpan="3" className="tb-subtotal-label">
        <strong>{type} Subtotal</strong>
      </td>
      <td className="tb-col-amount tb-subtotal-debit">
        {subtotal.debit > 0 ? formatCurrency(subtotal.debit) : '—'}
      </td>
      <td className="tb-col-amount tb-subtotal-credit">
        {subtotal.credit > 0 ? formatCurrency(subtotal.credit) : '—'}
      </td>
      <td className={`tb-col-amount tb-subtotal-net ${getBalanceColor(subtotal.net, 'DR')}`}>
        {formatCurrency(Math.abs(subtotal.net))} {subtotal.net > 0 ? 'DR' : 'CR'}
      </td>
      <td className="tb-col-actions tb-subtotal-actions" />
    </tr>
  );

  if (isLoading) {
    return (
      <div className="tb-loading-container">
        <div className="tb-loading-spinner"></div>
        <p className="tb-loading-text">Loading Trial Balance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tb-error-container">
        <h3 className="tb-error-title">Error Loading Trial Balance</h3>
        <p className="tb-error-message">{error}</p>
        <button onClick={fetchTrialBalance} className="tb-retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="tb-main-container">
      <div className="tb-content-wrapper">
      {/* Header */}
      <div className="tb-header-section">
        <div className="tb-header-left">
          <h1 className="tb-main-title">Trial Balance</h1>
          <p className="tb-subtitle">
            Account-level debit and credit totals. Select dates to filter by period.
          </p>
          {formatPeriodRange() && (
            <div className="tb-period-info">
              <span className="tb-period-label">Period:</span>
              <span className="tb-period-dates">{formatPeriodRange()}</span>
              {trialBalanceData?.period?.portfolio && (
                <span className="tb-portfolio-info">({trialBalanceData.period.portfolio})</span>
              )}
            </div>
          )}
        </div>
        <div className="tb-header-right">
          <div className="tb-generated-info">
            Generated: {new Date(trialBalanceData?.totals.generated_date).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tb-filters-section">
        <div className="tb-filters-row">
          <div className="tb-filter-group">
            <label className="tb-filter-label">Start Date:</label>
            <input
              type="date"
              className="tb-filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="tb-filter-group">
            <label className="tb-filter-label">End Date:</label>
            <input
              type="date"
              className="tb-filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="tb-filter-group">
            <label className="tb-filter-label">Portfolio:</label>
            <select
              className="tb-filter-select"
              value={filters.portfolio}
              onChange={(e) => handleFilterChange('portfolio', e.target.value)}
            >
              <option value="">All Portfolios</option>
              {availablePortfolios.map(portfolio => (
                <option key={portfolio.portfolioId || portfolio.id} value={portfolio.portfolioId || portfolio.id || portfolio.portfolio}>
                  {portfolio.portfolioName || portfolio.portfolio}
                </option>
              ))}
            </select>
          </div>
          <div className="tb-filter-group">
            <label className="tb-filter-label">View:</label>
            <select
              className="tb-filter-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="detailed">Detailed View</option>
              <option value="summary">Summary View</option>
            </select>
          </div>
          <div className="tb-filter-actions">
            <button onClick={fetchTrialBalance} className="tb-refresh-button">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Balance Status */}
      <div className={`tb-balance-status ${trialBalanceData?.totals.is_balanced ? 'tb-balanced' : 'tb-unbalanced'}`}>
        <span className="tb-status-text">
          {trialBalanceData?.totals.is_balanced ? 'BALANCED' : 'OUT OF BALANCE'}
        </span>
        <span className="tb-status-details">
          Total Debits: {formatCurrency(trialBalanceData?.totals.total_debits)} | 
          Total Credits: {formatCurrency(trialBalanceData?.totals.total_credits)} | 
          Accounts: {trialBalanceData?.totals.account_count}
          {mtmLoading && ' | Loading MTM Data...'}
          {!mtmLoading && portfolios.length > 0 && ` | MTM Data: ${mtmData.totalUnrealizedCapitalGain.toFixed(2)}`}
        </span>
      </div>

      {/* Main Content */}
      <div className="tb-main-content">
        {viewMode === 'detailed' ? (
          <div className="tb-detailed-view">
            <div className="tb-table-scroll">
              <table className="tb-data-table">
                <thead>
                  <tr className="tb-table-header">
                    <th className="tb-col-code">Account Code</th>
                    <th className="tb-col-name">Account Name</th>
                    <th className="tb-col-type">Type</th>
                    <th className="tb-col-amount">Debit Balance</th>
                    <th className="tb-col-amount">Credit Balance</th>
                    <th className="tb-col-amount">Net Balance</th>
                    <th className="tb-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancedTrialBalanceData?.accountsByType && Object.entries(enhancedTrialBalanceData.accountsByType).map(([type, accounts]) => (
                    <React.Fragment key={type}>
                      {accounts.map((account, index) => renderAccountRow(account, index))}
                      {enhancedTrialBalanceData.typeSubtotals && enhancedTrialBalanceData.typeSubtotals[type] &&
                        renderTypeSubtotal(type, enhancedTrialBalanceData.typeSubtotals[type])
                      }
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tb-grand-total-row">
                    <td colSpan="3" className="tb-grand-total-label"><strong>GRAND TOTAL</strong></td>
                    <td className="tb-col-amount tb-grand-total-debit">
                      <strong>{formatCurrency(enhancedTrialBalanceData?.totals?.total_debits || trialBalanceData?.totals?.total_debits || 0)}</strong>
                    </td>
                    <td className="tb-col-amount tb-grand-total-credit">
                      <strong>{formatCurrency(enhancedTrialBalanceData?.totals?.total_credits || trialBalanceData?.totals?.total_credits || 0)}</strong>
                    </td>
                    <td className="tb-col-amount tb-grand-total-net">
                      <strong>{formatCurrency((enhancedTrialBalanceData?.totals?.total_debits || trialBalanceData?.totals?.total_debits || 0) - (enhancedTrialBalanceData?.totals?.total_credits || trialBalanceData?.totals?.total_credits || 0))}</strong>
                    </td>
                    <td className="tb-col-actions tb-grand-total-actions" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="tb-summary-view">
            <div className="tb-table-card-header">
              <h2 className="tb-table-card-title">Trial Balance — Summary</h2>
            </div>
            <div className="tb-summary-cards">
              {enhancedTrialBalanceData?.summary && enhancedTrialBalanceData.summary.map((typeSummary, index) => (
                <div key={index} className="tb-summary-card">
                  <h3 className="tb-summary-card-title">{typeSummary.account_type}</h3>
                  <div className="tb-summary-details">
                    <div className="tb-summary-item">
                      <span className="tb-summary-label">Debits:</span>
                      <span className="tb-summary-value">{formatCurrency(typeSummary.total_debit)}</span>
                    </div>
                    <div className="tb-summary-item">
                      <span className="tb-summary-label">Credits:</span>
                      <span className="tb-summary-value">{formatCurrency(typeSummary.total_credit)}</span>
                    </div>
                    <div className="tb-summary-item">
                      <span className="tb-summary-label">Net:</span>
                      <span className={`tb-summary-value ${getBalanceColor(typeSummary.net_balance, 'DR')}`}>
                        {formatCurrency(Math.abs(typeSummary.net_balance))} 
                        {typeSummary.net_balance > 0 ? ' DR' : ' CR'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Account Details Modal */}
      <AccountDetailsModal
        isOpen={showAccountModal}
        onClose={handleCloseModal}
        accountCode={selectedAccountData?.accountCode}
        accountData={selectedAccountData}
        onNavigateAccount={handleViewDetails}
      />
      </div>
    </div>
  );
};

export default TrialBalance;
