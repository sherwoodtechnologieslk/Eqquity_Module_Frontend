import React, { useState, useEffect } from 'react';
import './Styles/TrialBalance.css';
import { trialBalanceAPI } from '../../services/api';

const TrialBalance = () => {
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);

  useEffect(() => {
    fetchTrialBalance();
    fetchPortfolios();
  }, [filters]);

  const fetchTrialBalance = async () => {
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
  };

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/general-ledger/portfolios');
      if (response.ok) {
        const data = await response.json();
        setAvailablePortfolios(data);
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    }
  };

  const fetchAccountDetails = async (accountCode) => {
    try {
      const data = await trialBalanceAPI.getAccountDetails(accountCode, filters);
      
      if (data.success) {
        setAccountDetails(data.data);
        setSelectedAccount(accountCode);
      }
    } catch (err) {
      console.error('Error fetching account details:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export functionality
    console.log('Export to Excel functionality to be implemented');
  };

  const printReport = () => {
    window.print();
  };

  const getBalanceColor = (balance, balanceType) => {
    if (balanceType === 'ZERO') return 'neutral';
    return balance > 0 ? 'positive' : 'negative';
  };

  const renderAccountRow = (account, index) => (
    <tr key={account.account_code} className="trial-balance-row">
      <td className="account-code">{account.account_code}</td>
      <td className="account-name">{account.account_name}</td>
      <td className="account-type">{account.account_type}</td>
      <td className="debit-balance">
        {account.balance_type === 'DR' ? formatCurrency(account.net_balance) : '-'}
      </td>
      <td className="credit-balance">
        {account.balance_type === 'CR' ? formatCurrency(Math.abs(account.net_balance)) : '-'}
      </td>
      <td className={`net-balance ${getBalanceColor(account.net_balance, account.balance_type)}`}>
        {formatCurrency(Math.abs(account.net_balance))} {account.balance_type}
      </td>
      <td className="actions">
        <button 
          className="view-details-btn"
          onClick={() => fetchAccountDetails(account.account_code)}
          title="View Account Details"
        >
          View Details
        </button>
      </td>
    </tr>
  );

  const renderTypeSubtotal = (type, subtotal) => (
    <tr key={`subtotal-${type}`} className="type-subtotal-row">
      <td colSpan="3" className="subtotal-label">
        <strong>{type} Subtotal</strong>
      </td>
      <td className="debit-balance">
        {subtotal.debit > 0 ? formatCurrency(subtotal.debit) : '-'}
      </td>
      <td className="credit-balance">
        {subtotal.credit > 0 ? formatCurrency(subtotal.credit) : '-'}
      </td>
      <td className={`net-balance ${getBalanceColor(subtotal.net, 'DR')}`}>
        {formatCurrency(Math.abs(subtotal.net))} {subtotal.net > 0 ? 'DR' : 'CR'}
      </td>
      <td></td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="trial-balance-loading">
        <div className="loading-spinner"></div>
        <p>Loading Trial Balance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trial-balance-error">
        <h3>Error Loading Trial Balance</h3>
        <p>{error}</p>
        <button onClick={fetchTrialBalance} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="trial-balance">
      {/* Header */}
      <div className="trial-balance-header">
        <div className="header-left">
          <h1>Trial Balance</h1>
          <div className="period-info">
            <span className="period-label">Period:</span>
            <span className="period-dates">
              {formatDate(trialBalanceData?.period.startDate)} - {formatDate(trialBalanceData?.period.endDate)}
            </span>
            <span className="portfolio-info">
              ({trialBalanceData?.period.portfolio})
            </span>
          </div>
        </div>
        <div className="header-right">
          <div className="generated-info">
            Generated: {new Date(trialBalanceData?.totals.generated_date).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="trial-balance-filters">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Portfolio:</label>
          <select
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
        <div className="filter-group">
          <label>View:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="detailed">Detailed View</option>
            <option value="summary">Summary View</option>
          </select>
        </div>
        <button onClick={fetchTrialBalance} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Balance Status */}
      <div className={`balance-status ${trialBalanceData?.totals.is_balanced ? 'balanced' : 'unbalanced'}`}>
        <div className="status-indicator">
          {trialBalanceData?.totals.is_balanced ? '✓' : '✗'}
        </div>
        <div className="status-text">
          {trialBalanceData?.totals.is_balanced ? 'Balanced' : 'Out of Balance'}
        </div>
        <div className="status-details">
          Total Debits: {formatCurrency(trialBalanceData?.totals.total_debits)} | 
          Total Credits: {formatCurrency(trialBalanceData?.totals.total_credits)} | 
          Accounts: {trialBalanceData?.totals.account_count}
        </div>
      </div>

      {/* Main Content */}
      <div className="trial-balance-content">
        {viewMode === 'detailed' ? (
          <div className="detailed-view">
            <div className="trial-balance-table-container">
              <table className="trial-balance-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th>Debit Balance</th>
                    <th>Credit Balance</th>
                    <th>Net Balance</th>
                    <th>Actions</th>
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
                  <tr className="grand-total-row">
                    <td colSpan="3"><strong>GRAND TOTAL</strong></td>
                    <td className="debit-balance">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_debits)}</strong>
                    </td>
                    <td className="credit-balance">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_credits)}</strong>
                    </td>
                    <td className="net-balance">
                      <strong>{formatCurrency(trialBalanceData?.totals.total_debits - trialBalanceData?.totals.total_credits)}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="summary-view">
            <div className="summary-cards">
              {trialBalanceData?.summary && trialBalanceData.summary.map((typeSummary, index) => (
                <div key={index} className="summary-card">
                  <h3>{typeSummary.account_type}</h3>
                  <div className="summary-details">
                    <div className="summary-item">
                      <span>Debits:</span>
                      <span>{formatCurrency(typeSummary.total_debit)}</span>
                    </div>
                    <div className="summary-item">
                      <span>Credits:</span>
                      <span>{formatCurrency(typeSummary.total_credit)}</span>
                    </div>
                    <div className="summary-item">
                      <span>Net:</span>
                      <span className={getBalanceColor(typeSummary.net_balance, 'DR')}>
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

        {/* Account Details Modal */}
        {selectedAccount && accountDetails && (
          <div className="account-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Account Details: {accountDetails.accountName}</h3>
                <button 
                  className="close-modal"
                  onClick={() => {
                    setSelectedAccount(null);
                    setAccountDetails(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="account-summary">
                  <div className="summary-item">
                    <span>Account Code:</span>
                    <span>{accountDetails.accountCode}</span>
                  </div>
                  <div className="summary-item">
                    <span>Period:</span>
                    <span>{formatDate(accountDetails.period.startDate)} - {formatDate(accountDetails.period.endDate)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total Debits:</span>
                    <span>{formatCurrency(accountDetails.totals.total_debit)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total Credits:</span>
                    <span>{formatCurrency(accountDetails.totals.total_credit)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Net Balance:</span>
                    <span className={getBalanceColor(accountDetails.totals.net_balance, accountDetails.totals.balance_type)}>
                      {formatCurrency(Math.abs(accountDetails.totals.net_balance))} {accountDetails.totals.balance_type}
                    </span>
                  </div>
                </div>
                <div className="account-entries">
                  <h4>Transaction Entries</h4>
                  <table className="entries-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Reference</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountDetails.entries.map((entry, index) => (
                        <tr key={index}>
                          <td>{formatDate(entry.date)}</td>
                          <td>{entry.description}</td>
                          <td>{entry.reference}</td>
                          <td>{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                          <td>{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                          <td className={getBalanceColor(entry.balance, 'DR')}>
                            {formatCurrency(Math.abs(entry.balance))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="trial-balance-actions">
        <button onClick={exportToExcel} className="action-btn">
          Export to Excel
        </button>
        <button onClick={printReport} className="action-btn">
          Print Report
        </button>
        <button onClick={fetchTrialBalance} className="action-btn">
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default TrialBalance;
