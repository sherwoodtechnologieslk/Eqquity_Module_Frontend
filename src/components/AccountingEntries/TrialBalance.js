import React, { useState, useEffect, useCallback } from 'react';
import './Styles/TrialBalance.css';
import { trialBalanceAPI } from '../../services/api';
import AccountDetailsModal from './AccountDetailsModal';

const TrialBalance = () => {
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0],
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccountData, setSelectedAccountData] = useState(null);

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

  useEffect(() => {
    fetchTrialBalance();
    fetchPortfolios();
  }, [fetchTrialBalance]);

  const fetchPortfolios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/general-ledger/portfolios', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePortfolios(data);
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    }
  };


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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };


  const getBalanceColor = (balance, balanceType) => {
    if (balanceType === 'ZERO') return 'neutral';
    return balance > 0 ? 'positive' : 'negative';
  };

  const renderAccountRow = (account, index) => (
    <tr key={account.account_code} className="tb-account-row">
      <td className="tb-account-code">{account.account_code}</td>
      <td className="tb-account-name">{account.account_name}</td>
      <td className="tb-account-type">{account.account_type}</td>
      <td>
        {account.transaction_account_name && (
          <div className="payment-details">
            <div><strong>{account.transaction_account_name}</strong></div>
            {account.account_number && <div>Acc: {account.account_number}</div>}
            {account.bank_name && <div>Bank: {account.bank_name}</div>}
            {account.payment_method && <div>Method: {account.payment_method}</div>}
          </div>
        )}
      </td>
      <td className="tb-debit-balance">
        {account.balance_type === 'DR' ? formatCurrency(account.net_balance) : '-'}
      </td>
      <td className="tb-credit-balance">
        {account.balance_type === 'CR' ? formatCurrency(Math.abs(account.net_balance)) : '-'}
      </td>
      <td className={`tb-net-balance ${getBalanceColor(account.net_balance, account.balance_type)}`}>
        {formatCurrency(Math.abs(account.net_balance))} {account.balance_type}
      </td>
      <td className="tb-account-actions">
        <button 
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
      <td colSpan="4" className="tb-subtotal-label">
        <strong>{type} Subtotal</strong>
      </td>
      <td className="tb-subtotal-debit">
        {subtotal.debit > 0 ? formatCurrency(subtotal.debit) : '-'}
      </td>
      <td className="tb-subtotal-credit">
        {subtotal.credit > 0 ? formatCurrency(subtotal.credit) : '-'}
      </td>
      <td className={`tb-subtotal-net ${getBalanceColor(subtotal.net, 'DR')}`}>
        {formatCurrency(Math.abs(subtotal.net))} {subtotal.net > 0 ? 'DR' : 'CR'}
      </td>
      <td className="tb-subtotal-actions">
        {/* Empty cell for subtotal row */}
      </td>
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
      {/* Header */}
      <div className="tb-header-section">
        <div className="tb-header-left">
          <h1 className="tb-main-title">Trial Balance</h1>
          <div className="tb-period-info">
            <span className="tb-period-label">Period:</span>
            <span className="tb-period-dates">
              {formatDate(trialBalanceData?.period.startDate)} - {formatDate(trialBalanceData?.period.endDate)}
            </span>
            <span className="tb-portfolio-info">
              ({trialBalanceData?.period.portfolio})
            </span>
          </div>
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
                <option key={portfolio.portfolioId} value={portfolio.portfolio}>
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
        </span>
      </div>

      {/* Main Content */}
      <div className="tb-main-content">
        {viewMode === 'detailed' ? (
          <div className="tb-detailed-view">
            <div className="tb-table-container">
              <table className="tb-data-table">
                <thead>
                  <tr className="tb-table-header">
                    <th className="tb-th-account-code">Account Code</th>
                    <th className="tb-th-account-name">Account Name</th>
                    <th className="tb-th-type">Type</th>
                    <th className="tb-th-payment-details">Payment Details</th>
                    <th className="tb-th-debit">Debit Balance</th>
                    <th className="tb-th-credit">Credit Balance</th>
                    <th className="tb-th-net">Net Balance</th>
                    <th className="tb-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalanceData?.accountsByType && Object.entries(trialBalanceData.accountsByType).map(([type, accounts]) => (
                    <React.Fragment key={type}>
                      {accounts.map((account, index) => renderAccountRow(account, index))}
                      {trialBalanceData.typeSubtotals[type] && 
                        renderTypeSubtotal(type, trialBalanceData.typeSubtotals[type])
                      }
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tb-grand-total-row">
                    <td colSpan="4" className="tb-grand-total-label"><strong>GRAND TOTAL</strong></td>
                    <td className="tb-grand-total-debit">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_debits)}</strong>
                    </td>
                    <td className="tb-grand-total-credit">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_credits)}</strong>
                    </td>
                    <td className="tb-grand-total-net">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_debits - trialBalanceData?.totals.total_credits)}</strong>
                    </td>
                    <td className="tb-grand-total-actions">
                      {/* Empty cell for grand total row */}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="tb-summary-view">
            <div className="tb-summary-cards">
              {trialBalanceData?.summary && trialBalanceData.summary.map((typeSummary, index) => (
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
      />
    </div>
  );
};

export default TrialBalance;
