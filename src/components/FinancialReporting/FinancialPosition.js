import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './Styles/FinancialPosition.css';
import { portfolioAPI, financialPositionAPI, profitLossAPI } from '../../services/api';

const FinancialPosition = ({ onTabChange }) => {
  const [financialPositionData, setFinancialPositionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [netProfit, setNetProfit] = useState(null); // from P&L -> used for retained earnings display
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    portfolio: ''
  });
  const [availablePortfolios, setAvailablePortfolios] = useState([]);

  const periodLabel = useMemo(() => {
    const dateStr = financialPositionData?.asOfDate || filters.asOfDate;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Period';
    // Example output: "Mar, 26" -> "Mar-26"
    const formatted = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return formatted.replace(',', '').replace(/\s+/g, '-');
  }, [financialPositionData, filters.asOfDate]);

  const equityDisplayRows = useMemo(() => {
    const equityAccounts = financialPositionData?.equity || [];

    const normalizeName = (name) => String(name || '').trim().toLowerCase();

    // Treat any row that contains "retained earnings" as part of the Retained Earnings line.
    const retainedMatches = equityAccounts.filter((acc) => normalizeName(acc.accountName).includes('retained earnings'));

    // Remove matched rows from the main list; we will re-add a single consolidated line.
    const retainedMatchKeys = new Set(
      retainedMatches.map((acc, idx) => acc.accountCode || String(idx))
    );

    const rowsWithoutRetained = equityAccounts.filter((acc, idx) => {
      const key = acc.accountCode || String(idx);
      return !retainedMatchKeys.has(key);
    });

    const derivedBalanceTypeFromBalance = (balance) => {
      if (Math.abs(balance) < 0.00001) return 'ZERO';
      return balance >= 0 ? 'CR' : 'DR';
    };

    // If we have net profit from P&L, use it as the Retained earnings amount for this SOFP period.
    if (typeof netProfit === 'number' && Number.isFinite(netProfit)) {
      return [
        ...rowsWithoutRetained,
        {
          accountName: 'Retained earnings',
          balance: netProfit,
          balanceType: derivedBalanceTypeFromBalance(netProfit),
          accountCode: ''
        }
      ];
    }

    // Otherwise, fall back to the retained earnings balances coming from the backend.
    if (retainedMatches.length === 0) {
      return [
        ...rowsWithoutRetained,
        { accountName: 'Retained earnings', balance: 0, balanceType: 'ZERO', accountCode: '' }
      ];
    }

    const totalRetainedBalance = retainedMatches.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const derivedBalanceType = derivedBalanceTypeFromBalance(totalRetainedBalance);

    return [
      ...rowsWithoutRetained,
      {
        accountName: 'Retained earnings',
        balance: totalRetainedBalance,
        balanceType: derivedBalanceType,
        accountCode: ''
      }
    ];
  }, [financialPositionData, netProfit]);

  const retainedEarningsOriginalBalanceSum = useMemo(() => {
    const equityAccounts = financialPositionData?.equity || [];
    const normalizeName = (name) => String(name || '').trim().toLowerCase();
    const retainedMatches = equityAccounts.filter((acc) => normalizeName(acc.accountName).includes('retained earnings'));
    return retainedMatches.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }, [financialPositionData]);

  const equityTotalsForDisplay = useMemo(() => {
    const baseTotalEquity = financialPositionData?.totals?.totalEquity || 0;
    const baseTotalAssets = financialPositionData?.totals?.totalAssets || 0;
    const baseTotalLiabilities = financialPositionData?.totals?.totalLiabilities || 0;

    if (typeof netProfit !== 'number' || !Number.isFinite(netProfit)) {
      const totalLiabilitiesAndEquity = (financialPositionData?.totals?.totalLiabilitiesAndEquity || 0);
      return {
        totalEquity: baseTotalEquity,
        totalLiabilitiesAndEquity,
        isBalanced: financialPositionData?.totals?.isBalanced ?? true,
        difference: Math.abs(baseTotalAssets - totalLiabilitiesAndEquity)
      };
    }

    // Replace retained earnings contribution with P&L net profit (UI reconciliation).
    const adjustedTotalEquity = baseTotalEquity - retainedEarningsOriginalBalanceSum + netProfit;
    const adjustedTotalLiabilitiesAndEquity = baseTotalLiabilities + adjustedTotalEquity;
    const difference = Math.abs(baseTotalAssets - adjustedTotalLiabilitiesAndEquity);
    const isBalanced = difference < 0.01;

    return {
      totalEquity: adjustedTotalEquity,
      totalLiabilitiesAndEquity: adjustedTotalLiabilitiesAndEquity,
      isBalanced,
      difference
    };
  }, [financialPositionData, netProfit, retainedEarningsOriginalBalanceSum]);

  const fetchFinancialPosition = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const asOfDate = filters.asOfDate;
      const asOfDateObj = new Date(asOfDate);
      const startOfYear = Number.isNaN(asOfDateObj.getTime())
        ? null
        : new Date(asOfDateObj.getFullYear(), 0, 1).toISOString().split('T')[0];

      const profitLossFilters = {
        startDate: startOfYear || undefined,
        endDate: asOfDate,
        portfolio: filters.portfolio || undefined
      };

      const [fpResp, plResp] = await Promise.all([
        financialPositionAPI.getFinancialPosition(filters),
        profitLossAPI
          .getProfitLoss(profitLossFilters)
          .catch((err) => {
            console.error('Error fetching P&L for retained earnings:', err);
            return null;
          })
      ]);

      if (fpResp?.success) {
        setFinancialPositionData(fpResp.data);
      } else {
        throw new Error(fpResp?.error || 'Failed to fetch Financial Position data');
      }

      if (plResp?.success) {
        const net = plResp.data?.totals?.net_profit;
        setNetProfit(typeof net === 'number' ? net : null);
      } else {
        setNetProfit(null);
      }
    } catch (err) {
      console.error('Error fetching Financial Position:', err);
      setError(err.message || 'Failed to load Financial Position statement');
      setFinancialPositionData(null);
      setNetProfit(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

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

  const handleAccountNameClick = (account) => {
    setSelectedAccount(account);
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

  const getLineState = (balanceType, normalBalanceType) => {
    if (!balanceType || balanceType === 'ZERO') return 'neutral';
    return balanceType === normalBalanceType ? 'positive' : 'negative';
  };

  /** SOFP first column: chart_of_accounts.transaction_type when set, else GL account name */
  const getSofpRowLabel = (account) => {
    const t = String(account?.transactionTypeName || '').trim();
    return t || account?.accountName || '';
  };

  const renderAccountRow = (account, index, normalBalanceType) => (
    <tr key={account.accountCode || index} className="fp-account-row">
      <td className="fp-account-name">
        <button
          type="button"
          className="fp-account-link"
          onClick={() => handleAccountNameClick(account)}
        >
          {getSofpRowLabel(account)}
        </button>
      </td>
      <td className="fp-amount-cell">
        <div className="fp-balance-cell">
          <span className={`fp-account-balance ${getLineState(account.balanceType, normalBalanceType)}`}>
            {formatCurrency(Math.abs(account.balance || 0))}
          </span>
          <span className={`fp-drcr-badge ${getLineState(account.balanceType, normalBalanceType)}`}>
            {account.balanceType || ''}
          </span>
        </div>
      </td>
    </tr>
  );

  const renderSubtotalRow = (label, amount) => (
    <tr key={`subtotal-${label}`} className="fp-subtotal-row">
      <td colSpan="1" className="fp-subtotal-label">
        <strong>{label}</strong>
      </td>
      <td className="fp-amount-cell">
        <div className="fp-balance-cell">
          <span className="fp-subtotal-balance positive">
            <strong>{formatCurrency(Math.abs(amount || 0))}</strong>
          </span>
        </div>
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

  if (error) {
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
              {formatDate(financialPositionData?.asOfDate || filters.asOfDate)}
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
          <button className="fp-export-button" onClick={() => alert('Export functionality coming soon')}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
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

      {/* Summary Cards */}
      <div className="fp-summary-cards">
        <div className="fp-summary-card assets">
          <div className="fp-card-header">Total Assets</div>
          <div className="fp-card-value positive">
            {formatCurrency(Math.abs(financialPositionData?.totals?.totalAssets || 0))}
          </div>
          <div className="fp-card-subtitle">All assets combined</div>
        </div>

        <div className="fp-summary-card liabilities">
          <div className="fp-card-header">Total Liabilities</div>
          <div className="fp-card-value positive">
            {formatCurrency(Math.abs(financialPositionData?.totals?.totalLiabilities || 0))}
          </div>
          <div className="fp-card-subtitle">All liabilities combined</div>
        </div>

        <div className="fp-summary-card equity">
          <div className="fp-card-header">Total Equity</div>
          <div className="fp-card-value positive">
            {formatCurrency(Math.abs(equityTotalsForDisplay?.totalEquity || 0))}
          </div>
          <div className="fp-card-subtitle">Shareholders' equity</div>
        </div>

        <div className="fp-summary-card balance">
          <div className="fp-card-header">Balance Check</div>
          <div className={`fp-card-value ${equityTotalsForDisplay?.isBalanced ? 'positive' : 'negative'}`}>
            {equityTotalsForDisplay?.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
          </div>
          <div className="fp-card-subtitle">
            Difference: {formatCurrency(
              equityTotalsForDisplay?.difference ?? 0
            )}
          </div>
        </div>
      </div>

      <div className="fp-notes-hint" role="note" aria-live="polite">
        Click any transaction type below to view details and go to notes for accounts.
      </div>

      {/* Main Content - Professional Statement Layout */}
      <div className="fp-statement-content">
        <div className="fp-statement-grid">
          {/* Assets */}
          <div className="fp-side-card">
            <div className="fp-side-card-header">
              <div>
                <h2 className="fp-side-title">Assets</h2>
                <div className="fp-side-asof">As at {periodLabel}</div>
              </div>
            </div>

            <div className="fp-side-card-body">
              {/* Non-current assets */}
              <div className="fp-subsection">
                <h3 className="fp-subsection-title">Non-current assets</h3>
                <div className="fp-table-container">
                  <table className="fp-data-table">
                    <thead>
                      <tr className="fp-table-header">
                        <th className="fp-th-name">Transaction type</th>
                        <th className="fp-th-balance">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialPositionData?.assets?.nonCurrentAssets || []).map((account, index) =>
                        renderAccountRow(
                          {
                            ...account,
                            accountName: account.accountCategory || account.accountName
                          },
                          index,
                          'DR'
                        )
                      )}
                      {financialPositionData?.assets?.nonCurrentAssets?.length > 0 &&
                        renderSubtotalRow(
                          'Total Non-current assets',
                          financialPositionData?.totals?.totalNonCurrentAssets || 0
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-subsection-divider" />

              {/* Current assets */}
              <div className="fp-subsection">
                <h3 className="fp-subsection-title">Current assets</h3>
                <div className="fp-table-container">
                  <table className="fp-data-table">
                    <thead>
                      <tr className="fp-table-header">
                        <th className="fp-th-name">Transaction type</th>
                        <th className="fp-th-balance">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialPositionData?.assets?.currentAssets || []).map((account, index) =>
                        renderAccountRow(account, index, 'DR')
                      )}
                      {financialPositionData?.assets?.currentAssets?.length > 0 &&
                        renderSubtotalRow(
                          'Total Current assets',
                          financialPositionData?.totals?.totalCurrentAssets || 0
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-total-strip">
                <span className="fp-total-strip-label">Total Assets</span>
                <span className="fp-total-strip-value positive">
                  {formatCurrency(Math.abs(financialPositionData?.totals?.totalAssets || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="fp-side-card">
            <div className="fp-side-card-header">
              <div>
                <h2 className="fp-side-title">Equity & Liabilities</h2>
                <div className="fp-side-asof">As at {periodLabel}</div>
              </div>
            </div>

            <div className="fp-side-card-body">
              {/* Equity */}
              <div className="fp-subsection">
                <h3 className="fp-subsection-title">Equity</h3>
                <div className="fp-table-container">
                  <table className="fp-data-table">
                    <thead>
                      <tr className="fp-table-header">
                        <th className="fp-th-name">Transaction type</th>
                        <th className="fp-th-balance">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equityDisplayRows.map((account, index) => renderAccountRow(account, index, 'CR'))}
                      {equityDisplayRows && equityDisplayRows.length > 0 &&
                      renderSubtotalRow('Total Equity', equityTotalsForDisplay?.totalEquity || 0)
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-subsection-divider" />

              {/* Liabilities */}
              <div className="fp-subsection">
                <h3 className="fp-subsection-title">Non-current liabilities</h3>
                <div className="fp-table-container">
                  <table className="fp-data-table">
                    <thead>
                      <tr className="fp-table-header">
                        <th className="fp-th-name">Transaction type</th>
                        <th className="fp-th-balance">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialPositionData?.liabilities?.nonCurrentLiabilities || []).map((account, index) =>
                        renderAccountRow(account, index, 'CR')
                      )}
                      {financialPositionData?.liabilities?.nonCurrentLiabilities?.length > 0 &&
                        renderSubtotalRow(
                          'Total Non-current liabilities',
                          financialPositionData?.totals?.totalNonCurrentLiabilities || 0
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-subsection-divider" />

              <div className="fp-subsection">
                <h3 className="fp-subsection-title">Current liabilities</h3>
                <div className="fp-table-container">
                  <table className="fp-data-table">
                    <thead>
                      <tr className="fp-table-header">
                        <th className="fp-th-name">Transaction type</th>
                        <th className="fp-th-balance">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialPositionData?.liabilities?.currentLiabilities || []).map((account, index) =>
                        renderAccountRow(account, index, 'CR')
                      )}
                      {financialPositionData?.liabilities?.currentLiabilities?.length > 0 &&
                        renderSubtotalRow(
                          'Total Current liabilities',
                          financialPositionData?.totals?.totalCurrentLiabilities || 0
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-total-strip">
                <span className="fp-total-strip-label">Total Equity & Liabilities</span>
                <span className="fp-total-strip-value positive">
                  {formatCurrency(Math.abs(equityTotalsForDisplay?.totalLiabilitiesAndEquity || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {selectedAccount && (
        <div
          className="fp-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedAccount(null)}
        >
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fp-modal-header">
              <div className="fp-modal-title">{getSofpRowLabel(selectedAccount) || 'Account'}</div>
              <button
                type="button"
                className="fp-modal-close"
                onClick={() => setSelectedAccount(null)}
              >
                Close
              </button>
            </div>
            <div className="fp-modal-body">
              <p className="fp-modal-table-intro">
                GL accounts for this line (amount shown on the statement):
              </p>
              <div className="fp-modal-table-wrap">
                <table className="fp-modal-table">
                  <thead>
                    <tr>
                      <th scope="col">Account code</th>
                      <th scope="col">Account name</th>
                      <th scope="col" className="fp-modal-table-amount">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedAccount.accountCode?.trim() ? selectedAccount.accountCode : '—'}</td>
                      <td>{selectedAccount.accountName?.trim() ? selectedAccount.accountName : '—'}</td>
                      <td className="fp-modal-table-amount">
                        <span className="fp-modal-table-amount-num">
                          {formatCurrency(Math.abs(selectedAccount.balance || 0))}
                        </span>
                        {selectedAccount.balanceType && selectedAccount.balanceType !== 'ZERO' ? (
                          <span className="fp-modal-table-drcr">{selectedAccount.balanceType}</span>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="fp-modal-actions">
                <button
                  type="button"
                  className="fp-modal-view-notes"
                  onClick={() => {
                    setSelectedAccount(null);
                    onTabChange?.('Financial Reporting Notes');
                  }}
                >
                  View notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPosition;
