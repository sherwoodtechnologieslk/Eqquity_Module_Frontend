import React, { useState, useEffect, useCallback } from 'react';
import './Styles/FinancialPosition.css';
import { portfolioAPI, financialPositionAPI } from '../../services/api';

// Mock data as provided
const mockData = {
    period: {
      endDate: '30TH September 2025',
      sep25: 'Sep-25',
      mar25: 'Mar-25'
    },
    assets: {
      nonCurrentAssets: [
        { accountCode: '', accountName: 'Property, Plant & Equipment', balance: 1012183, balanceType: 'DR', note: '7' },
        { accountCode: '', accountName: 'Financial Assets at amortised cost', balance: 0, balanceType: 'DR', note: '8' },
        { accountCode: '', accountName: 'Right of Use Assets', balance: 0, balanceType: 'DR', note: '10' }
      ],
      currentAssets: [
        { accountCode: '', accountName: 'Prepayments & Receivables', balance: 3033766, balanceType: 'DR', note: '11' },
        { accountCode: '', accountName: 'Trade & Other Receivable', balance: 15023468, balanceType: 'DR', note: '12' },
        { accountCode: '', accountName: 'Financial Assets at Fair Value through Profit or Loss', balance: 2334213299, balanceType: 'DR', note: '13' },
        { accountCode: '', accountName: 'Cash and Short Term Deposits', balance: 241250, balanceType: 'DR', note: '14' }
      ]
    },
    equity: [
      { accountCode: '', accountName: 'Stated Capital', balance: 300000020, balanceType: 'CR', note: '15' },
      { accountCode: '', accountName: 'Retained Earnings', balance: 1159722525, balanceType: 'CR', note: '' }
    ],
    liabilities: {
      nonCurrentLiabilities: [
        { accountCode: '', accountName: 'Employee Benefits Liabilities', balance: 335078, balanceType: 'CR', note: '16' },
        { accountCode: '', accountName: 'Deferred tax Liabilities', balance: 37836045, balanceType: 'CR', note: '9' },
        { accountCode: '', accountName: 'Lease Liability', balance: 0, balanceType: 'CR', note: '17' }
      ],
      currentLiabilities: [
        { accountCode: '', accountName: 'Trade and Other Payables', balance: 55528587, balanceType: 'CR', note: '18' },
        { accountCode: '', accountName: 'Bank Overdraft', balance: 10365, balanceType: 'CR', note: '' },
        { accountCode: '', accountName: 'Interest Bearing Loans &Borrowings', balance: 764316448, balanceType: 'CR', note: '19' },
        { accountCode: '', accountName: 'Lease Liability', balance: 0, balanceType: 'CR', note: '17' },
        { accountCode: '', accountName: 'Provision', balance: 16103215, balanceType: 'CR', note: '' },
        { accountCode: '', accountName: 'Income Tax Payable', balance: 19671684, balanceType: 'CR', note: '' }
      ]
    },
    totals: {
      totalNonCurrentAssets: 1012183,
      totalCurrentAssets: 2352511782,
      totalAssets: 2353523966,
      totalEquity: 1459722545,
      totalNonCurrentLiabilities: 38171122,
      totalCurrentLiabilities: 855630298,
      totalLiabilities: 893801420,
      totalLiabilitiesAndEquity: 2353523966,
      isBalanced: true
    },
    subtotals: {
      assetSubtotal: 2353523966,
      liabilitySubtotal: 893801420,
      equitySubtotal: 1459722545
    },
    asOfDate: '2025-09-30',
    portfolio: 'All Portfolios',
    generatedDate: new Date().toISOString()
};

const FinancialPosition = () => {
  const [financialPositionData, setFinancialPositionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [useMockData, setUseMockData] = useState(false);
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);

  const fetchFinancialPosition = useCallback(async () => {
    if (useMockData) {
      setIsLoading(false);
      setFinancialPositionData(mockData);
      setError('');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const data = await financialPositionAPI.getFinancialPosition(filters);
      
      if (data.success) {
        setFinancialPositionData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch Financial Position data');
      }
    } catch (err) {
      console.error('Error fetching Financial Position:', err);
      setError(err.message || 'Failed to load Financial Position statement');
      setFinancialPositionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, useMockData]);

  useEffect(() => {
    fetchFinancialPosition();
    fetchPortfolios();
  }, [fetchFinancialPosition]);

  const fetchPortfolios = async () => {
    try {
      const data = await portfolioAPI.getActivePortfolios();
      setAvailablePortfolios(data);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBalanceColor = (balance, balanceType) => {
    // For Assets: DR is positive, CR is negative
    // For Liabilities/Equity: CR is positive, DR is negative
    const value = balanceType === 'DR' ? balance : -balance;
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const renderAccountRow = (account, index) => (
    <tr key={account.accountCode || index} className="fp-account-row">
      <td className="fp-account-code">{account.accountCode || account.note || ''}</td>
      <td className="fp-account-name">{account.accountName || ''}</td>
      <td className={`fp-account-balance ${getBalanceColor(account.balance, account.balanceType)}`}>
        {formatCurrency(Math.abs(account.balance || 0))}
      </td>
    </tr>
  );

  const renderSubtotalRow = (label, amount, balanceType) => (
    <tr key={`subtotal-${label}`} className="fp-subtotal-row">
      <td colSpan="2" className="fp-subtotal-label">
        <strong>{label}</strong>
      </td>
      <td className={`fp-subtotal-balance ${getBalanceColor(amount, balanceType)}`}>
        <strong>{formatCurrency(Math.abs(amount || 0))}</strong>
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="fp-loading-container">
        <div className="fp-loading-spinner"></div>
        <p className="fp-loading-text">Loading Financial Position...</p>
      </div>
    );
  }

  if (error && !useMockData) {
    return (
      <div className="fp-error-container">
        <h2 className="fp-error-title">Error</h2>
        <p className="fp-error-message">{error}</p>
        <button className="fp-retry-button" onClick={fetchFinancialPosition}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fp-main-container">
      {/* Header */}
      <div className="fp-header-section">
        <div className="fp-header-left">
          <h1 className="fp-main-title">STATEMENT OF FINANCIAL POSITION</h1>
          <div className="fp-period-info">
            <span className="fp-period-label">As at the period ended:</span>
            <span className="fp-period-date">
              {useMockData ? mockData.period.endDate : formatDate(financialPositionData?.asOfDate || filters.asOfDate)}
            </span>
            <span className="fp-portfolio-info">
              ({financialPositionData?.portfolio || 'All Portfolios'})
            </span>
          </div>
        </div>
        <div className="fp-header-right">
          <div className="fp-generated-info">
            Generated: {new Date(financialPositionData?.generatedDate || Date.now()).toLocaleString()}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '16px' }}>
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Load Mock Data</span>
          </label>
          <button className="fp-export-button" onClick={() => alert('Export functionality coming soon')}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      {!useMockData && (
        <div className="fp-filters-section">
          <div className="fp-filters-row">
            <div className="fp-filter-group">
              <label className="fp-filter-label">As of Date:</label>
              <input
                type="date"
                className="fp-filter-input"
                value={filters.asOfDate}
                onChange={(e) => handleFilterChange('asOfDate', e.target.value)}
              />
            </div>
            <div className="fp-filter-group">
              <label className="fp-filter-label">Portfolio:</label>
              <select
                className="fp-filter-select"
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
            <div className="fp-filter-actions">
              <button onClick={fetchFinancialPosition} className="fp-refresh-button">
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="fp-summary-cards">
        <div className="fp-summary-card assets">
          <div className="fp-card-header">Total Assets</div>
          <div className="fp-card-value positive">
            {formatCurrency(financialPositionData?.totals?.totalAssets || 0)}
          </div>
          <div className="fp-card-subtitle">All assets combined</div>
        </div>

        <div className="fp-summary-card liabilities">
          <div className="fp-card-header">Total Liabilities</div>
          <div className="fp-card-value">
            {formatCurrency(financialPositionData?.totals?.totalLiabilities || 0)}
          </div>
          <div className="fp-card-subtitle">All liabilities combined</div>
        </div>

        <div className="fp-summary-card equity">
          <div className="fp-card-header">Total Equity</div>
          <div className="fp-card-value positive">
            {formatCurrency(financialPositionData?.totals?.totalEquity || 0)}
          </div>
          <div className="fp-card-subtitle">Shareholders' equity</div>
        </div>

        <div className="fp-summary-card balance">
          <div className="fp-card-header">Balance Check</div>
          <div className={`fp-card-value ${financialPositionData?.totals?.isBalanced ? 'positive' : 'negative'}`}>
            {financialPositionData?.totals?.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
          </div>
          <div className="fp-card-subtitle">
            Difference: {formatCurrency(
              Math.abs((financialPositionData?.totals?.totalAssets || 0) - 
                       (financialPositionData?.totals?.totalLiabilitiesAndEquity || 0))
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Balance Sheet Layout */}
      <div className="fp-main-content">
        <div className="fp-balance-sheet-layout">
          {/* Left Side - Assets */}
          <div className="fp-balance-sheet-column fp-assets-column">
            <h2 className="fp-column-title">ASSETS</h2>
            
            {/* Assets */}
            <div className="fp-section">
              <div className="fp-table-container">
                <table className="fp-data-table">
                  <thead>
                    <tr className="fp-table-header">
                      <th className="fp-th-code">Note</th>
                      <th className="fp-th-name">Account Name</th>
                      <th className="fp-th-balance">Sep-25</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(financialPositionData?.assets?.nonCurrentAssets || []),
                      ...(financialPositionData?.assets?.currentAssets || [])
                    ].map((account, index) => 
                      renderAccountRow(account, index)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Assets */}
            <div className="fp-total-section">
              <div className="fp-total-row">
                <span className="fp-total-label">Total Assets</span>
                <span className="fp-total-value positive">
                  {formatCurrency(financialPositionData?.totals?.totalAssets || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Liabilities & Equity */}
          <div className="fp-balance-sheet-column fp-liabilities-equity-column">
            <h2 className="fp-column-title">EQUITY AND LIABILITIES</h2>
            
            {/* Equity */}
            <div className="fp-section">
              <h3 className="fp-section-title">Equity</h3>
              <div className="fp-table-container">
                <table className="fp-data-table">
                  <thead>
                    <tr className="fp-table-header">
                      <th className="fp-th-code">Note</th>
                      <th className="fp-th-name">Account Name</th>
                      <th className="fp-th-balance">Sep-25</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialPositionData?.equity?.map((account, index) => 
                      renderAccountRow(account, index)
                    )}
                    {financialPositionData?.equity && financialPositionData.equity.length > 0 && 
                      renderSubtotalRow(
                        'Total Equity',
                        financialPositionData?.totals?.totalEquity || 0,
                        'CR'
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liabilities */}
            <div className="fp-section">
              <h3 className="fp-section-title">Liabilities</h3>
              <div className="fp-table-container">
                <table className="fp-data-table">
                  <thead>
                    <tr className="fp-table-header">
                      <th className="fp-th-code">Note</th>
                      <th className="fp-th-name">Account Name</th>
                      <th className="fp-th-balance">Sep-25</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(financialPositionData?.liabilities?.nonCurrentLiabilities || []),
                      ...(financialPositionData?.liabilities?.currentLiabilities || [])
                    ].map((account, index) => 
                      renderAccountRow(account, index)
                    )}
                    {[
                      ...(financialPositionData?.liabilities?.nonCurrentLiabilities || []),
                      ...(financialPositionData?.liabilities?.currentLiabilities || [])
                    ].length > 0 && 
                      renderSubtotalRow(
                        'Total Liabilities',
                        financialPositionData?.totals?.totalLiabilities || 0,
                        'CR'
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Liabilities & Equity */}
            <div className="fp-total-section">
              <div className="fp-total-row">
                <span className="fp-total-label">Total Equity and Liabilities</span>
                <span className="fp-total-value positive">
                  {formatCurrency(financialPositionData?.totals?.totalLiabilitiesAndEquity || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {useMockData && (
        <div style={{ marginTop: '2rem', padding: '1rem', textAlign: 'center', fontStyle: 'italic', color: '#64748b', fontSize: '12px' }}>
          I certify that these financial statements are in compliance with the requirements of the Companies Act No: 07 of 2007.
        </div>
      )}
    </div>
  );
};

export default FinancialPosition;
