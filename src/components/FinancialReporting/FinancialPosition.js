import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialPosition.css';
import { portfolioAPI, financialPositionAPI, profitLossAPI } from '../../services/api';
import {
  buildSofpExportRows,
  SOFP_EXPORT_HEADERS,
  computeDisplayedAssetBuckets,
  computeEquityDisplayRows,
  groupByTransactionType,
  deriveBalanceTypeFromBalance,
  parseNetProfit
} from '../../utils/sofpExport';

const FinancialPosition = ({ onTabChange }) => {
  const [financialPositionData, setFinancialPositionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [netProfit, setNetProfit] = useState(null); // from P&L -> used for retained earnings display
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMtmData, setShowMtmData] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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

  const equityDisplayRows = useMemo(
    () => computeEquityDisplayRows(financialPositionData, netProfit),
    [financialPositionData, netProfit]
  );

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

    // Add Current P&L on top of backend equity (retained earnings stays under equity).
    const adjustedTotalEquity = baseTotalEquity + netProfit;
    const adjustedTotalLiabilitiesAndEquity = baseTotalLiabilities + adjustedTotalEquity;
    const difference = Math.abs(baseTotalAssets - adjustedTotalLiabilitiesAndEquity);
    const isBalanced = difference < 0.01;

    return {
      totalEquity: adjustedTotalEquity,
      totalLiabilitiesAndEquity: adjustedTotalLiabilitiesAndEquity,
      isBalanced,
      difference
    };
  }, [financialPositionData, netProfit]);

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
        financialPositionAPI.getFinancialPosition({
          ...filters,
          withMtmData: showMtmData,
          withNotes: showNotes
        }),
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
        const net = parseNetProfit(plResp.data?.totals?.net_profit);
        setNetProfit(net != null ? net : null);
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
  }, [filters, showMtmData, showNotes]);

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

  const handleGroupClick = (group, normalBalanceType) => {
    setSelectedGroup({ ...group, normalBalanceType });
  };

  const goToNotes = (account) => {
    if (!account) return;
    const ctx = {
      source: 'SOFP',
      accountCode: account.accountCode || '',
      accountName: account.accountName || '',
      transactionTypeName:
        account.transactionTypeName || selectedGroup?.transactionTypeName || '',
      accountCategory: account.accountCategory || selectedGroup?.accountCategory || '',
      balance: Number(account.balance) || 0,
      balanceType: account.balanceType || '',
      asOfDate: financialPositionData?.asOfDate || filters.asOfDate,
      portfolioId: filters.portfolio || '',
      portfolioLabel: financialPositionData?.portfolio || 'All Portfolios',
      displayLabel: getSofpRowLabel(account) || selectedGroup?.label || ''
    };
    setSelectedGroup(null);
    onTabChange?.('Financial Reporting Notes', ctx);
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

  const sanitizeFilePart = (name) =>
    (String(name || 'export')
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'export');

  const downloadCsv = (filenameBase, headers, rows) => {
    const escapeCell = (value) => {
      const s = value == null ? '' : String(value);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSofpPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const portfolioLabel = financialPositionData?.portfolio || 'All Portfolios';
    const asOfDate = financialPositionData?.asOfDate || filters.asOfDate;
    const subtitle = `Portfolio: ${portfolioLabel}   |   As of: ${asOfDate}`;

    doc.setFontSize(11);
    doc.text('Statement of Financial Position', 40, 34);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 40, 50);
    doc.setTextColor(15, 23, 42);

    autoTable(doc, {
      startY: 62,
      theme: 'grid',
      head: [SOFP_EXPORT_HEADERS],
      body: buildSofpExportRows({ financialPositionData, netProfit }),
      styles: {
        fontSize: 7,
        cellPadding: 3,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.6
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 40, right: 40 },
      columnStyles: {
        0: { cellWidth: 160 },
        1: { cellWidth: 300 },
        2: { cellWidth: 110, halign: 'right' },
        3: { cellWidth: 60, halign: 'center' }
      }
    });

    const base = `SOFP_${sanitizeFilePart(portfolioLabel)}_${sanitizeFilePart(asOfDate)}`;
    doc.save(`${base}.pdf`);
  };

  const exportSofpExcel = () => {
    const portfolioLabel = financialPositionData?.portfolio || 'All Portfolios';
    const asOfDate = financialPositionData?.asOfDate || filters.asOfDate;
    const base = `SOFP_${sanitizeFilePart(portfolioLabel)}_${sanitizeFilePart(asOfDate)}`;
    downloadCsv(base, SOFP_EXPORT_HEADERS, buildSofpExportRows({ financialPositionData, netProfit }));
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

  const displayedAssetBuckets = useMemo(
    () => computeDisplayedAssetBuckets(financialPositionData),
    [financialPositionData]
  );

  // One row per transaction type for each statement bucket.
  const nonCurrentAssetGroups = useMemo(
    () => groupByTransactionType(displayedAssetBuckets.nonCurrentAssets),
    [displayedAssetBuckets]
  );
  const currentAssetGroups = useMemo(
    () => groupByTransactionType(displayedAssetBuckets.currentAssets),
    [displayedAssetBuckets]
  );
  const equityGroups = useMemo(
    () => groupByTransactionType(equityDisplayRows),
    [equityDisplayRows]
  );
  const nonCurrentLiabilityGroups = useMemo(
    () => groupByTransactionType(financialPositionData?.liabilities?.nonCurrentLiabilities),
    [financialPositionData]
  );
  const currentLiabilityGroups = useMemo(
    () => groupByTransactionType(financialPositionData?.liabilities?.currentLiabilities),
    [financialPositionData]
  );

  /** SOFP first column: chart_of_accounts.transaction_type when set, else GL account name */
  const getSofpRowLabel = (account) => {
    const t = String(account?.transactionTypeName || '').trim();
    return t || account?.accountName || '';
  };

  const renderGroupRow = (group, index, normalBalanceType) => {
    const balanceType = deriveBalanceTypeFromBalance(group.balance, normalBalanceType);
    const state = getLineState(balanceType, normalBalanceType);
    const count = group.accounts.length;
    return (
      <tr key={group.key || index} className="fp-account-row">
        <td className="fp-account-name">
          <button
            type="button"
            className="fp-account-link"
            onClick={() => handleGroupClick(group, normalBalanceType)}
          >
            {group.label}
            {count > 1 && <span className="fp-account-count">{count} accounts</span>}
          </button>
        </td>
        <td className="fp-amount-cell">
          <div className="fp-balance-cell">
            <span className={`fp-account-balance ${state}`}>
              {formatCurrency(Number(group.balance) || 0)}
            </span>
            <span className={`fp-drcr-badge ${state}`}>
              {balanceType === 'ZERO' ? '' : balanceType}
            </span>
          </div>
        </td>
      </tr>
    );
  };

  const renderSubtotalRow = (label, amount) => (
    <tr key={`subtotal-${label}`} className="fp-subtotal-row">
      <td colSpan="1" className="fp-subtotal-label">
        <strong>{label}</strong>
      </td>
      <td className="fp-amount-cell">
        <div className="fp-balance-cell">
          <span className="fp-subtotal-balance positive">
            <strong>{formatCurrency(Number(amount) || 0)}</strong>
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
          <button className="fp-export-button" onClick={exportSofpPdf}>
            Export PDF
          </button>
          <button className="fp-export-button" onClick={exportSofpExcel}>
            Export to Excel
          </button>
          <button
            className={`fp-export-button ${showMtmData ? 'active' : ''}`}
            onClick={() => setShowMtmData((prev) => !prev)}
          >
            With MTM data
          </button>
          <button
            className={`fp-export-button ${showNotes ? 'active' : ''}`}
            onClick={() => setShowNotes((prev) => !prev)}
          >
            With notes
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
            {formatCurrency(Number(financialPositionData?.totals?.totalAssets) || 0)}
          </div>
          <div className="fp-card-subtitle">All assets combined</div>
        </div>

        <div className="fp-summary-card liabilities">
          <div className="fp-card-header">Total Liabilities</div>
          <div className="fp-card-value positive">
            {formatCurrency(Number(financialPositionData?.totals?.totalLiabilities) || 0)}
          </div>
          <div className="fp-card-subtitle">All liabilities combined</div>
        </div>

        <div className="fp-summary-card equity">
          <div className="fp-card-header">Total Equity</div>
          <div className="fp-card-value positive">
            {formatCurrency(Number(equityTotalsForDisplay?.totalEquity) || 0)}
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
                      {nonCurrentAssetGroups.map((group, index) =>
                        renderGroupRow(group, index, 'DR')
                      )}
                      {nonCurrentAssetGroups.length > 0 &&
                        renderSubtotalRow(
                          'Total Non-current assets',
                          displayedAssetBuckets.totalNonCurrentAssets || 0
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
                      {currentAssetGroups.map((group, index) =>
                        renderGroupRow(group, index, 'DR')
                      )}
                      {currentAssetGroups.length > 0 &&
                        renderSubtotalRow(
                          'Total Current assets',
                          displayedAssetBuckets.totalCurrentAssets || 0
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fp-total-strip">
                <span className="fp-total-strip-label">Total Assets</span>
                <span className="fp-total-strip-value positive">
                  {formatCurrency(Number(financialPositionData?.totals?.totalAssets) || 0)}
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
                      {equityGroups.map((group, index) => renderGroupRow(group, index, 'CR'))}
                      {equityGroups.length > 0 &&
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
                      {nonCurrentLiabilityGroups.map((group, index) =>
                        renderGroupRow(group, index, 'CR')
                      )}
                      {nonCurrentLiabilityGroups.length > 0 &&
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
                      {currentLiabilityGroups.map((group, index) =>
                        renderGroupRow(group, index, 'CR')
                      )}
                      {currentLiabilityGroups.length > 0 &&
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
                  {formatCurrency(Number(equityTotalsForDisplay?.totalLiabilitiesAndEquity) || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction type drill-down modal */}
      {selectedGroup && (
        <div
          className="fp-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedGroup(null)}
        >
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fp-modal-header">
              <div className="fp-modal-title">{selectedGroup.label || 'Transaction type'}</div>
              <button
                type="button"
                className="fp-modal-close"
                onClick={() => setSelectedGroup(null)}
              >
                Close
              </button>
            </div>
            <div className="fp-modal-body">
              <p className="fp-modal-table-intro">
                {selectedGroup.accounts.length > 1
                  ? 'GL accounts under this transaction type. Choose an account to view its notes.'
                  : 'GL account for this transaction type. Choose View notes to see its entries.'}
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
                      <th scope="col" className="fp-modal-table-action" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.accounts.map((acc, i) => (
                      <tr key={acc.accountCode || i}>
                        <td>{acc.accountCode?.trim() ? acc.accountCode : '—'}</td>
                        <td>{acc.accountName?.trim() ? acc.accountName : '—'}</td>
                        <td className="fp-modal-table-amount">
                          <span className="fp-modal-table-amount-num">
                            {formatCurrency(Number(acc.balance) || 0)}
                          </span>
                          {acc.balanceType && acc.balanceType !== 'ZERO' ? (
                            <span className="fp-modal-table-drcr">{acc.balanceType}</span>
                          ) : null}
                        </td>
                        <td className="fp-modal-table-action">
                          <button
                            type="button"
                            className="fp-modal-row-notes"
                            onClick={() => goToNotes(acc)}
                            disabled={!acc.accountCode?.trim()}
                            title={
                              acc.accountCode?.trim()
                                ? 'View notes for this account'
                                : 'No GL account behind this line'
                            }
                          >
                            View notes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {selectedGroup.accounts.length > 1 && (
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="fp-modal-total-label">
                          Total
                        </td>
                        <td className="fp-modal-table-amount">
                          <span className="fp-modal-table-amount-num">
                            {formatCurrency(Number(selectedGroup.balance) || 0)}
                          </span>
                        </td>
                        <td className="fp-modal-table-action" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPosition;
