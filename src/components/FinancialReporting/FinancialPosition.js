import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialPosition.css';
import { financialPositionAPI, profitLossAPI } from '../../services/api';
import {
  buildSofpExportRows,
  SOFP_EXPORT_HEADERS,
  computeDisplayedAssetBuckets,
  resolveSofpGroups,
  deriveBalanceTypeFromBalance,
  parseNetProfit
} from '../../utils/sofpExport';
import { enrichNotesContext } from '../../utils/financialNotesRegistry';

const FinancialPosition = ({ onTabChange }) => {
  const initialAsOfDate = new Date().toISOString().split('T')[0];
  const [financialPositionData, setFinancialPositionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [netProfit, setNetProfit] = useState(null); // from P&L -> used for retained earnings display
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [isStatementPoppedOut, setIsStatementPoppedOut] = useState(false);
  const [showMtmData, setShowMtmData] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  // Draft filter inputs — changing these must NOT auto-reload the statement.
  const [filters, setFilters] = useState({
    asOfDate: initialAsOfDate
  });
  // Applied query drives fetches (Refresh + MTM/Notes toggles + initial load).
  const [appliedQuery, setAppliedQuery] = useState({
    asOfDate: initialAsOfDate,
    withMtmData: false,
    withNotes: false
  });
  const hasLoadedDataRef = useRef(false);

  const periodLabel = useMemo(() => {
    const dateStr = financialPositionData?.asOfDate || appliedQuery.asOfDate;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Period';
    // Example output: "Mar, 26" -> "Mar-26"
    const formatted = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return formatted.replace(',', '').replace(/\s+/g, '-');
  }, [financialPositionData, appliedQuery.asOfDate]);

  const equityDisplayRows = useMemo(
    () => financialPositionData?.equity || [],
    [financialPositionData]
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

  const fetchFinancialPosition = useCallback(async (query) => {
    const active = query || appliedQuery;
    const hasExistingData = hasLoadedDataRef.current;

    try {
      if (hasExistingData) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const asOfDate = active.asOfDate;
      const asOfDateObj = new Date(asOfDate);
      const startOfYear = Number.isNaN(asOfDateObj.getTime())
        ? null
        : new Date(asOfDateObj.getFullYear(), 0, 1).toISOString().split('T')[0];

      const profitLossFilters = {
        startDate: startOfYear || undefined,
        endDate: asOfDate
      };

      const [fpResp, plResp] = await Promise.all([
        financialPositionAPI.getFinancialPosition({
          asOfDate: active.asOfDate,
          withMtmData: active.withMtmData,
          withNotes: active.withNotes
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
        hasLoadedDataRef.current = true;
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
      hasLoadedDataRef.current = false;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    fetchFinancialPosition(appliedQuery);
    setExpandedKeys(new Set());
    // Intentionally keyed to appliedQuery only — draft date edits do not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery]);

  useEffect(() => {
    if (!isStatementPoppedOut) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsStatementPoppedOut(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isStatementPoppedOut]);

  const applyFiltersAndFetch = useCallback(() => {
    setAppliedQuery({
      asOfDate: filters.asOfDate,
      withMtmData: showMtmData,
      withNotes: showNotes
    });
  }, [filters, showMtmData, showNotes]);

  const goToNotes = (account, group = null) => {
    if (!account) return;
    const ctx = enrichNotesContext({
      source: 'SOFP',
      accountCode: account.accountCode || '',
      accountName: account.accountName || '',
      transactionTypeName:
        account.transactionTypeName || group?.transactionTypeName || '',
      accountCategory: account.accountCategory || group?.accountCategory || '',
      balance: Number(account.balance) || 0,
      balanceType: account.balanceType || '',
      asOfDate: financialPositionData?.asOfDate || appliedQuery.asOfDate,
      portfolioId: '',
      portfolioLabel: financialPositionData?.portfolio || 'All Portfolios',
      displayLabel: getSofpRowLabel(account) || group?.label || ''
    });
    onTabChange?.('Financial Reporting Notes', ctx);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleMtm = (checked) => {
    const next = Boolean(checked);
    setShowMtmData(next);
    setAppliedQuery({
      asOfDate: filters.asOfDate,
      withMtmData: next,
      withNotes: showNotes
    });
  };

  const handleToggleNotes = (checked) => {
    const next = Boolean(checked);
    setShowNotes(next);
    setAppliedQuery({
      asOfDate: filters.asOfDate,
      withMtmData: showMtmData,
      withNotes: next
    });
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

  // Prefer backend groups (section → transaction type → accounts); local fallback if absent.
  const nonCurrentAssetGroups = useMemo(
    () =>
      resolveSofpGroups(
        financialPositionData,
        'nonCurrentAssets',
        displayedAssetBuckets.nonCurrentAssets,
        netProfit
      ),
    [financialPositionData, displayedAssetBuckets, netProfit]
  );
  const currentAssetGroups = useMemo(
    () =>
      resolveSofpGroups(
        financialPositionData,
        'currentAssets',
        displayedAssetBuckets.currentAssets,
        netProfit
      ),
    [financialPositionData, displayedAssetBuckets, netProfit]
  );
  const equityGroups = useMemo(
    () => resolveSofpGroups(financialPositionData, 'equity', equityDisplayRows, netProfit),
    [financialPositionData, equityDisplayRows, netProfit]
  );
  const nonCurrentLiabilityGroups = useMemo(
    () =>
      resolveSofpGroups(
        financialPositionData,
        'nonCurrentLiabilities',
        financialPositionData?.liabilities?.nonCurrentLiabilities,
        netProfit
      ),
    [financialPositionData, netProfit]
  );
  const currentLiabilityGroups = useMemo(
    () =>
      resolveSofpGroups(
        financialPositionData,
        'currentLiabilities',
        financialPositionData?.liabilities?.currentLiabilities,
        netProfit
      ),
    [financialPositionData, netProfit]
  );

  /** Group label is chart_of_accounts.transaction_type (from backend). */
  const getSofpRowLabel = (account) => {
    const t = String(account?.transactionTypeName || '').trim();
    return t || 'Unassigned';
  };

  const toggleGroupExpanded = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderGroupRow = (group, index, normalBalanceType) => {
    const balanceType = deriveBalanceTypeFromBalance(group.balance, normalBalanceType);
    const state = getLineState(balanceType, normalBalanceType);
    const count = group.accounts.length;
    const groupKey = group.key || `group-${index}`;
    const isExpanded = expandedKeys.has(groupKey);
    const canExpand = count > 0;

    return (
      <React.Fragment key={groupKey}>
        <tr className={`fp-account-row${isExpanded ? ' fp-account-row--expanded' : ''}`}>
          <td className="fp-account-name">
            <button
              type="button"
              className="fp-account-link"
              onClick={() => canExpand && toggleGroupExpanded(groupKey)}
              aria-expanded={canExpand ? isExpanded : undefined}
              disabled={!canExpand}
            >
              <span className={`fp-expand-caret${isExpanded ? ' is-open' : ''}`} aria-hidden="true">
                ▸
              </span>
              <span className="fp-account-link-text">{group.label}</span>
              {count > 1 && <span className="fp-account-count">{count} accounts</span>}
            </button>
          </td>
          <td className="fp-amount-cell">
            <span className={`fp-account-balance ${state}`}>
              {formatCurrency(Number(group.balance) || 0)}
            </span>
          </td>
          <td className="fp-drcr-cell">
            <span className={`fp-drcr-badge ${state}`}>
              {balanceType === 'ZERO' ? '—' : balanceType}
            </span>
          </td>
        </tr>
        {isExpanded &&
          group.accounts.map((acc, i) => {
            const detailBalanceType =
              acc.balanceType ||
              deriveBalanceTypeFromBalance(Number(acc.balance) || 0, normalBalanceType);
            const detailState = getLineState(detailBalanceType, normalBalanceType);
            return (
              <tr key={`${groupKey}-detail-${acc.accountCode || i}`} className={`fp-detail-row${i % 2 === 1 ? ' fp-detail-row--alt' : ''}`}>
                <td className="fp-account-name">
                  <div className="fp-detail-line">
                    <span className="fp-detail-code">
                      {acc.accountCode?.trim() ? acc.accountCode : '—'}
                    </span>
                    <span className="fp-detail-name">
                      {acc.accountName?.trim() ? acc.accountName : '—'}
                    </span>
                    <button
                      type="button"
                      className="fp-detail-notes"
                      onClick={() => goToNotes(acc, group)}
                      disabled={!acc.accountCode?.trim()}
                      title={
                        acc.accountCode?.trim()
                          ? 'View notes for this account'
                          : 'No GL account behind this line'
                      }
                    >
                      Notes
                    </button>
                  </div>
                </td>
                <td className="fp-amount-cell">
                  <span className={`fp-account-balance ${detailState}`}>
                    {formatCurrency(Number(acc.balance) || 0)}
                  </span>
                </td>
                <td className="fp-drcr-cell">
                  <span className={`fp-drcr-badge ${detailState}`}>
                    {detailBalanceType === 'ZERO' ? '—' : detailBalanceType}
                  </span>
                </td>
              </tr>
            );
          })}
      </React.Fragment>
    );
  };

  const renderSubtotalRow = (label, amount) => (
    <tr key={`subtotal-${label}`} className="fp-subtotal-row">
      <td className="fp-subtotal-label">
        <strong>{label}</strong>
      </td>
      <td className="fp-amount-cell">
        <span className="fp-subtotal-balance positive">
          <strong>{formatCurrency(Number(amount) || 0)}</strong>
        </span>
      </td>
      <td className="fp-drcr-cell" aria-hidden="true" />
    </tr>
  );

  const renderStatementGrid = () => (
    <div className="fp-statement-grid">
      <div className="fp-side-card">
        <div className="fp-side-card-header">
          <div>
            <h2 className="fp-side-title">Assets</h2>
            <div className="fp-side-asof">As at {periodLabel}</div>
          </div>
        </div>

        <div className="fp-side-card-body">
          <div className="fp-subsection">
            <h3 className="fp-subsection-title">Non-current assets</h3>
            <div className="fp-table-container">
              <table className="fp-data-table">
                <thead>
                  <tr className="fp-table-header">
                    <th className="fp-th-name">Transaction type</th>
                    <th className="fp-th-balance">Amount</th>
                    <th className="fp-th-drcr">DR/CR</th>
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

          <div className="fp-subsection">
            <h3 className="fp-subsection-title">Current assets</h3>
            <div className="fp-table-container">
              <table className="fp-data-table">
                <thead>
                  <tr className="fp-table-header">
                    <th className="fp-th-name">Transaction type</th>
                    <th className="fp-th-balance">Amount</th>
                    <th className="fp-th-drcr">DR/CR</th>
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
            <span className="fp-total-strip-value">
              {formatCurrency(Number(financialPositionData?.totals?.totalAssets) || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="fp-side-card">
        <div className="fp-side-card-header">
          <div>
            <h2 className="fp-side-title">Equity & Liabilities</h2>
            <div className="fp-side-asof">As at {periodLabel}</div>
          </div>
        </div>

        <div className="fp-side-card-body">
          <div className="fp-subsection">
            <h3 className="fp-subsection-title">Equity</h3>
            <div className="fp-table-container">
              <table className="fp-data-table">
                <thead>
                  <tr className="fp-table-header">
                    <th className="fp-th-name">Transaction type</th>
                    <th className="fp-th-balance">Amount</th>
                    <th className="fp-th-drcr">DR/CR</th>
                  </tr>
                </thead>
                <tbody>
                  {equityGroups.map((group, index) => renderGroupRow(group, index, 'CR'))}
                  {equityGroups.length > 0 &&
                    renderSubtotalRow('Total Equity', equityTotalsForDisplay?.totalEquity || 0)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fp-subsection-divider" />

          <div className="fp-subsection">
            <h3 className="fp-subsection-title">Non-current liabilities</h3>
            <div className="fp-table-container">
              <table className="fp-data-table">
                <thead>
                  <tr className="fp-table-header">
                    <th className="fp-th-name">Transaction type</th>
                    <th className="fp-th-balance">Amount</th>
                    <th className="fp-th-drcr">DR/CR</th>
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
                    <th className="fp-th-drcr">DR/CR</th>
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
            <span className="fp-total-strip-value">
              {formatCurrency(Number(equityTotalsForDisplay?.totalLiabilitiesAndEquity) || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading && !financialPositionData) {
    return (
      <div className="fp-loading-container">
        <div className="fp-loading-spinner"></div>
        <p className="fp-loading-text">Loading Financial Position...</p>
      </div>
    );
  }

  if (error && !financialPositionData) {
    return (
      <div className="fp-error-container">
        <h2 className="fp-error-title">Error</h2>
        <p className="fp-error-message">{error}</p>
        <button className="fp-retry-button" onClick={applyFiltersAndFetch}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`fp-main-container${isRefreshing ? ' fp-is-refreshing' : ''}`}>
      {/* Header */}
      <div className="fp-header-section">
        <div className="fp-header-left">
          <h1 className="fp-main-title">STATEMENT OF FINANCIAL POSITION</h1>
          <div className="fp-period-info">
            <span className="fp-period-label">As at the period ended:</span>
            <span className="fp-period-date">
              {formatDate(financialPositionData?.asOfDate || appliedQuery.asOfDate)}
            </span>
            <span className="fp-portfolio-info">
              ({financialPositionData?.portfolio || 'All Portfolios'})
            </span>
          </div>
        </div>
        <div className="fp-header-right">
          <div className="fp-generated-info">
            {isRefreshing
              ? 'Refreshing…'
              : `Generated: ${new Date(financialPositionData?.generatedDate || Date.now()).toLocaleString()}`}
          </div>
          <button
            type="button"
            className="fp-export-button"
            onClick={() => setIsStatementPoppedOut(true)}
            disabled={isStatementPoppedOut}
          >
            Open fullscreen
          </button>
        </div>
      </div>

      {/* Filters + options */}
      <div className="fp-filters-section">
        <div className="fp-filters-row">
          <div className="fp-filter-group">
            <label className="fp-filter-label" htmlFor="fp-as-of-date">
              As of Date:
            </label>
            <input
              id="fp-as-of-date"
              type="date"
              className="fp-filter-input"
              value={filters.asOfDate}
              onChange={(e) => handleFilterChange('asOfDate', e.target.value)}
            />
          </div>

          <div className="fp-option-group" role="group" aria-label="Statement options">
            <label className="fp-option-check" htmlFor="fp-with-mtm">
              <input
                id="fp-with-mtm"
                type="checkbox"
                checked={showMtmData}
                onChange={(e) => handleToggleMtm(e.target.checked)}
              />
              <span>MTM data</span>
            </label>
            <label className="fp-option-check" htmlFor="fp-with-notes">
              <input
                id="fp-with-notes"
                type="checkbox"
                checked={showNotes}
                onChange={(e) => handleToggleNotes(e.target.checked)}
              />
              <span>Notes</span>
            </label>
          </div>

          <div className="fp-filter-actions">
            <button
              type="button"
              className="fp-btn fp-btn--pdf"
              onClick={exportSofpPdf}
            >
              Export PDF
            </button>
            <button
              type="button"
              className="fp-btn fp-btn--excel"
              onClick={exportSofpExcel}
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={applyFiltersAndFetch}
              className="fp-btn fp-btn--refresh"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
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
        Click a transaction type to expand its GL accounts. Use Notes on an account to open reporting notes.
      </div>

      {isStatementPoppedOut && (
        <div className="fp-statement-placeholder">
          Statement is open in fullscreen. Press Esc or Close to return.
        </div>
      )}

      {!isStatementPoppedOut && (
        <div className="fp-statement-content">{renderStatementGrid()}</div>
      )}

      {isStatementPoppedOut &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fp-statement-popout-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Statement of Financial Position"
            onClick={() => setIsStatementPoppedOut(false)}
          >
            <div
              className="fp-statement-popout-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="fp-statement-popout-bar">
                <div className="fp-statement-popout-title-wrap">
                  <div className="fp-statement-popout-title">
                    Statement of Financial Position
                  </div>
                  <div className="fp-statement-popout-meta">
                    As at {formatDate(financialPositionData?.asOfDate || appliedQuery.asOfDate)}
                    {' · '}
                    {financialPositionData?.portfolio || 'All Portfolios'}
                  </div>
                </div>
                <div className="fp-statement-popout-actions">
                  <button
                    type="button"
                    className="fp-refresh-button"
                    onClick={() => setIsStatementPoppedOut(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="fp-statement-popout-body">{renderStatementGrid()}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FinancialPosition;
