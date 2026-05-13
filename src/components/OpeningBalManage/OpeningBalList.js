import React, { useState, useEffect, useMemo } from 'react';
import './Styles/OpeningBalList.css';
import { chartOfAccountsAPI, openingBalanceAPI } from '../../services/api';
import { isNonCurrentAssetLike } from '../../utils/sofpExport';
import {
  exportOpeningTrialBalanceToExcel,
  exportOpeningTrialBalanceToPdf,
} from '../../utils/openingTrialBalanceExport';

const DEFERRED_TAX_ASSET_LABEL = 'Deferred tax Assets';
const MTM_FAIR_VALUE_ACCOUNT_LABEL = 'Liability Change in fair value for share investments';
const INVESTMENTS_IN_SHARES_LABEL = 'Investments in shares';
const BANK_OVERDRAFT_LABEL = 'Bank Overdraft';
const DEPRECIATION_PROVISION_PAIRS = [
  {
    provision: 'Provision for depreciation - office equipments',
    asset: 'Fixed assets - office equipment'
  },
  {
    provision: 'Provision for depreciation - Computer Equipments',
    asset: 'Fixed assets - computer equipment'
  }
];

const isProvisionOnDeferredTax = (accountName) =>
  String(accountName || '').toLowerCase().includes('provision on deferred tax');

const isMtmFairValueAccount = (accountName) =>
  String(accountName || '').toLowerCase().includes(MTM_FAIR_VALUE_ACCOUNT_LABEL.toLowerCase());

const isInvestmentsInShares = (accountName) =>
  String(accountName || '').toLowerCase().includes(INVESTMENTS_IN_SHARES_LABEL.toLowerCase());

const getDepreciationProvisionPair = (accountName) =>
  DEPRECIATION_PROVISION_PAIRS.find((pair) =>
    String(accountName || '').toLowerCase().includes(pair.provision.toLowerCase())
  );

const matchesDepreciationTargetAsset = (accountName, pair) =>
  pair && String(accountName || '').toLowerCase().includes(pair.asset.toLowerCase());

const normalizeAccountCode = (code) => String(code || '').trim();

const isCashAndShortTermDeposits = (accountMeta) => {
  const text = `${accountMeta?.account_category || accountMeta?.accountCategory || ''} ${accountMeta?.account_type || accountMeta?.accountType || ''} ${accountMeta?.transaction_type || accountMeta?.transactionType || ''}`
    .toLowerCase()
    .trim();
  return text.includes('cash and short term deposits');
};

const detectAccountSide = (balance) => {
  const type = (balance.account_type || balance.accountType || '').toLowerCase();
  const category = (balance.account_category || balance.accountCategory || '').toLowerCase();
  const code = String(balance.account_code || balance.accountCode || '').trim();
  const firstDigit = code.charAt(0);

  if (type.includes('asset') || category.includes('asset') || firstDigit === '1') {
    return 'asset';
  }
  if (type.includes('liab') || category.includes('liab') || firstDigit === '2') {
    return 'liability';
  }

  return null;
};

const detectAccountType = (balance) => {
  const type = (balance.account_type || balance.accountType || '').toLowerCase();
  const category = (balance.account_category || balance.accountCategory || '').toLowerCase();
  const code = String(balance.account_code || balance.accountCode || '').trim();
  const firstDigit = code.charAt(0);

  if (isProvisionOnDeferredTax(balance.account_name || balance.accountName)) return 'asset';
  if (type.includes('asset') || category.includes('asset') || firstDigit === '1') return 'asset';
  if (type.includes('equity') || category.includes('equity') || firstDigit === '8' || firstDigit === '3') return 'equity';
  if (type.includes('liab') || category.includes('liab') || firstDigit === '2') return 'liability';
  return 'other';
};

const OpeningBalList = () => {
  const [openingBalances, setOpeningBalances] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBalanceType, setFilterBalanceType] = useState('All');
  const [activeTab, setActiveTab] = useState('entries');
  const [showMtmData, setShowMtmData] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [tbExporting, setTbExporting] = useState(false);

  useEffect(() => {
    loadOpeningBalances();
  }, []);

  const loadOpeningBalances = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [response, accounts] = await Promise.all([
        openingBalanceAPI.getAll(),
        chartOfAccountsAPI.getAll().catch((err) => {
          console.error('Error loading chart of accounts for opening balance list:', err);
          return [];
        })
      ]);
      
      if (response.success && response.data) {
        setOpeningBalances(response.data);
        setChartOfAccounts(Array.isArray(accounts) ? accounts : []);
      } else {
        throw new Error(response.error || 'Failed to load opening balances');
      }
      
    } catch (err) {
      console.error('Error loading opening balances:', err);
      setError(err.message || 'Failed to load opening balances. Please try again.');
      setOpeningBalances([]);
      setChartOfAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter opening balances
  const filteredBalances = openingBalances.filter(balance => {
    if (!balance) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const accountCode = (balance.account_code || balance.accountCode || '').toLowerCase();
    const accountName = (balance.account_name || balance.accountName || '').toLowerCase();
    const description = (balance.description || '').toLowerCase();
    
    const matchesSearch = 
      accountCode.includes(searchLower) ||
      accountName.includes(searchLower) ||
      description.includes(searchLower);
    
    const debit = parseFloat(balance.debit) || 0;
    const credit = parseFloat(balance.credit) || 0;
    const matchesType = 
      filterBalanceType === 'All' ||
      (filterBalanceType === 'Debit' && debit > 0) ||
      (filterBalanceType === 'Credit' && credit > 0);
    
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totals = filteredBalances.reduce((acc, balance) => {
    if (!balance) return acc;
    acc.totalDebit += parseFloat(balance.debit) || 0;
    acc.totalCredit += parseFloat(balance.credit) || 0;
    return acc;
  }, { totalDebit: 0, totalCredit: 0 });

  const assetsLiabilitiesTotals = filteredBalances.reduce((acc, balance) => {
    if (!balance) return acc;

    const debit = parseFloat(balance.debit) || 0;
    const credit = parseFloat(balance.credit) || 0;
    const side = detectAccountSide(balance);
    const net = debit - credit;

    if (side === 'asset') {
      acc.assetDebit += debit;
      acc.assetCredit += credit;
      acc.assetNet += net;
      acc.assetCount += 1;
    } else if (side === 'liability') {
      acc.liabilityDebit += debit;
      acc.liabilityCredit += credit;
      acc.liabilityNet += net;
      acc.liabilityCount += 1;
    } else {
      acc.otherCount += 1;
    }
    return acc;
  }, {
    assetDebit: 0,
    assetCredit: 0,
    assetNet: 0,
    assetCount: 0,
    liabilityDebit: 0,
    liabilityCredit: 0,
    liabilityNet: 0,
    liabilityCount: 0,
    otherCount: 0
  });

  const assetEntries = filteredBalances.filter((balance) => detectAccountSide(balance) === 'asset');
  const liabilityEntries = filteredBalances.filter((balance) => detectAccountSide(balance) === 'liability');
  const uncategorizedEntries = filteredBalances.filter((balance) => !detectAccountSide(balance));
  const chartOfAccountsByCode = chartOfAccounts.reduce((acc, account) => {
    const code = normalizeAccountCode(account.account_code || account.accountCode);
    if (code) acc[code] = account;
    return acc;
  }, {});

  const openingBalanceStatementBase = filteredBalances.reduce(
    (acc, balance) => {
      const debit = parseFloat(balance.debit) || 0;
      const credit = parseFloat(balance.credit) || 0;
      const accountCode = balance.account_code || balance.accountCode || '-';
      const coaAccount = chartOfAccountsByCode[normalizeAccountCode(accountCode)] || {};
      const isDeferredTaxAsset = isProvisionOnDeferredTax(balance.account_name || balance.accountName);
      const isMtmFairValue = isMtmFairValueAccount(balance.account_name || balance.accountName);
      const depreciationProvisionPair = getDepreciationProvisionPair(
        balance.account_name || balance.accountName
      );
      const accountType = detectAccountType(balance);

      // Opening-balance-only SOFP sign convention:
      // Asset = DR-CR, Liability/Equity = CR-DR
      const rawNet =
        accountType === 'liability' || accountType === 'equity'
          ? credit - debit
          : debit - credit;
      const net = isDeferredTaxAsset && rawNet !== 0 ? Math.abs(rawNet) : rawNet;
      const openingCashOverdraftAmount =
        accountType === 'asset' && isCashAndShortTermDeposits(coaAccount) && net < 0
          ? Math.abs(net)
          : 0;

      const row = {
        id: balance.id,
        accountCode,
        accountName: isDeferredTaxAsset
          ? DEFERRED_TAX_ASSET_LABEL
          : balance.account_name || balance.accountName || '-',
        accountCategory: isDeferredTaxAsset
          ? 'Current Assets'
          : coaAccount.account_category || coaAccount.accountCategory || balance.account_category || balance.accountCategory || '',
        isDeferredTaxAsset,
        balanceDate: balance.opening_balance_date || balance.openingBalanceDate,
        description: balance.description || '-',
        debit,
        credit,
        net
      };

      if (isMtmFairValue && !showMtmData) {
        acc.mtmInvestmentAdjustment += debit - credit;
        return acc;
      }

      if (depreciationProvisionPair && !showNotes) {
        const key = depreciationProvisionPair.asset;
        acc.depreciationAdjustments[key] = (acc.depreciationAdjustments[key] || 0) + net;
        acc.depreciationRows[key] = [...(acc.depreciationRows[key] || []), row];
        return acc;
      }

      if (openingCashOverdraftAmount > 0) {
        acc.liabilities.push({
          ...row,
          accountName: BANK_OVERDRAFT_LABEL,
          accountCategory: 'Current Liabilities',
          net: openingCashOverdraftAmount
        });
        acc.totals.totalLiabilities += openingCashOverdraftAmount;
        return acc;
      }

      if (accountType === 'asset') {
        acc.assets.push(row);
        acc.totals.totalAssets += net;
      } else if (accountType === 'liability') {
        acc.liabilities.push(row);
        acc.totals.totalLiabilities += net;
      } else if (accountType === 'equity') {
        acc.equity.push(row);
        acc.totals.totalEquity += net;
      } else {
        acc.others.push(row);
      }

      return acc;
    },
    {
      assets: [],
      liabilities: [],
      equity: [],
      others: [],
      mtmInvestmentAdjustment: 0,
      depreciationAdjustments: {},
      depreciationRows: {},
      totals: {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0
      }
    }
  );

  const openingBalanceStatement = (() => {
    let assets = openingBalanceStatementBase.assets;
    let liabilities = openingBalanceStatementBase.liabilities;
    const totals = { ...openingBalanceStatementBase.totals };

    const mtmAdjustment = Number(openingBalanceStatementBase.mtmInvestmentAdjustment) || 0;
    if (!showMtmData && Math.abs(mtmAdjustment) >= 0.00001) {
      let adjustmentApplied = false;
      assets = assets.map((row) => {
        if (!adjustmentApplied && isInvestmentsInShares(row.accountName)) {
          adjustmentApplied = true;
          return {
            ...row,
            net: (Number(row.net) || 0) + mtmAdjustment
          };
        }
        return row;
      });

      if (adjustmentApplied) {
        totals.totalAssets += mtmAdjustment;
      }
    }

    if (!showNotes) {
      Object.entries(openingBalanceStatementBase.depreciationAdjustments).forEach(
        ([targetAsset, depreciationAdjustment]) => {
          const adjustment = Number(depreciationAdjustment) || 0;
          if (Math.abs(adjustment) < 0.00001) return;

          let depreciationApplied = false;
          assets = assets.map((row) => {
            if (!depreciationApplied && matchesDepreciationTargetAsset(row.accountName, { asset: targetAsset })) {
              depreciationApplied = true;
              return {
                ...row,
                net: (Number(row.net) || 0) - adjustment
              };
            }
            return row;
          });

          if (depreciationApplied) {
            totals.totalAssets -= adjustment;
          } else {
            liabilities = [
              ...liabilities,
              ...(openingBalanceStatementBase.depreciationRows[targetAsset] || [])
            ];
            totals.totalLiabilities += adjustment;
          }
        }
      );
    }

    return {
      ...openingBalanceStatementBase,
      assets,
      liabilities,
      totals
    };
  })();

  const totalLiabilitiesAndEquity =
    openingBalanceStatement.totals.totalLiabilities + openingBalanceStatement.totals.totalEquity;
  const openingStatementDifference = Math.abs(
    openingBalanceStatement.totals.totalAssets - totalLiabilitiesAndEquity
  );
  const openingStatementBalanced = openingStatementDifference < 0.01;

  const bsAssetRowMeta = (row) => ({
    accountCategory: row.accountCategory,
    accountName: row.accountName
  });

  const bsNonCurrentAssets = openingBalanceStatement.assets.filter((row) =>
    !row.isDeferredTaxAsset && isNonCurrentAssetLike(bsAssetRowMeta(row))
  );
  const bsCurrentAssets = openingBalanceStatement.assets.filter(
    (row) => row.isDeferredTaxAsset || !isNonCurrentAssetLike(bsAssetRowMeta(row))
  );
  const bsTotalNonCurrentAssets = bsNonCurrentAssets.reduce((s, r) => s + (Number(r.net) || 0), 0);
  const bsTotalCurrentAssets = bsCurrentAssets.reduce((s, r) => s + (Number(r.net) || 0), 0);

  const openingTrialBalanceRows = useMemo(
    () =>
      [...filteredBalances]
        .filter(Boolean)
        .map((balance) => {
          const debit = parseFloat(balance.debit) || 0;
          const credit = parseFloat(balance.credit) || 0;
          const net = debit - credit;
          const t = detectAccountType(balance);
          const typeLabel =
            t === 'asset'
              ? 'Asset'
              : t === 'liability'
                ? 'Liability'
                : t === 'equity'
                  ? 'Equity'
                  : 'Other';
          return {
            id: balance.id,
            accountCode: balance.account_code || balance.accountCode || '-',
            accountName: balance.account_name || balance.accountName || '-',
            typeLabel,
            debit,
            credit,
            net,
            balanceType:
              Math.abs(net) < 0.00001 ? 'ZERO' : net > 0 ? 'DR' : 'CR',
          };
        })
        .sort((a, b) =>
          String(a.accountCode).localeCompare(String(b.accountCode), undefined, { numeric: true })
        ),
    [filteredBalances]
  );

  const openingTbTotals = useMemo(
    () =>
      openingTrialBalanceRows.reduce(
        (acc, row) => {
          acc.debit += row.debit;
          acc.credit += row.credit;
          return acc;
        },
        { debit: 0, credit: 0 }
      ),
    [openingTrialBalanceRows]
  );

  const openingTbNetDiff = openingTbTotals.debit - openingTbTotals.credit;
  const openingTbBalanced = Math.abs(openingTbNetDiff) < 0.01;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBsDrCr = (value, normalType) => {
    if (Math.abs(Number(value) || 0) < 0.00001) return 'ZERO';
    if (normalType === 'CR') return value >= 0 ? 'CR' : 'DR';
    return value >= 0 ? 'DR' : 'CR';
  };

  const runOpeningTbExport = (exporter) => {
    try {
      setTbExporting(true);
      exporter({
        rows: openingTrialBalanceRows,
        totals: openingTbTotals,
        netDiff: openingTbNetDiff,
        balanced: openingTbBalanced
      });
    } catch (e) {
      console.error('Opening TB export failed:', e);
    } finally {
      setTbExporting(false);
    }
  };

  const renderCategoryEntriesTable = (title, entries, categoryClassName) => (
    <div className={`category-entries-card ${categoryClassName}`}>
      <div className="category-entries-header">
        <h3>{title}</h3>
        <span>{entries.length} entries</span>
      </div>
      {entries.length === 0 ? (
        <div className="category-entries-empty">No entries under this category for current filters.</div>
      ) : (
        <div className="table-wrapper">
          <table className="opening-bal-list-table">
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Date</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((balance) => {
                const accountCode = balance.account_code || balance.accountCode || '-';
                const accountName = balance.account_name || balance.accountName || '-';
                const balanceDate = balance.opening_balance_date || balance.openingBalanceDate;
                const debit = parseFloat(balance.debit) || 0;
                const credit = parseFloat(balance.credit) || 0;
                const description = balance.description || '-';

                return (
                  <tr key={`cat-${balance.id}`}>
                    <td className="account-code-cell">
                      <span className="code-text">{accountCode}</span>
                    </td>
                    <td className="account-name-cell">{accountName}</td>
                    <td>{formatDate(balanceDate)}</td>
                    <td className={debit > 0 ? 'debit-amount' : ''}>{debit > 0 ? formatCurrency(debit) : '-'}</td>
                    <td className={credit > 0 ? 'credit-amount' : ''}>{credit > 0 ? formatCurrency(credit) : '-'}</td>
                    <td className="description-cell">{description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="opening-bal-list-container">
      {/* Error Message */}
      {error && (
        <div className="opening-bal-list-error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
          <button className="error-close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Data Card */}
      <div className="opening-bal-list-data-card">
        {/* Search and Filter Section */}
        <div className="opening-bal-list-search-container">
          <div className="opening-bal-list-search-wrapper">
            <input
              type="text"
              className="opening-bal-list-search-input"
              placeholder="Search by account code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="opening-bal-list-filters">
            <div className="filter-group">
              <label htmlFor="filterBalanceType" className="filter-label">Type:</label>
              <select
                id="filterBalanceType"
                className="filter-select"
                value={filterBalanceType}
                onChange={(e) => setFilterBalanceType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            
            <button
              className="filter-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterBalanceType('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="opening-bal-list-tabs">
          <button
            type="button"
            className={`opening-bal-list-tab-btn ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => setActiveTab('entries')}
          >
            Entries
          </button>
          <button
            type="button"
            className={`opening-bal-list-tab-btn ${activeTab === 'assets-liabilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets-liabilities')}
          >
            Assets / Liabilities Totals
          </button>
          <button
            type="button"
            className={`opening-bal-list-tab-btn ${activeTab === 'opening-tb' ? 'active' : ''}`}
            onClick={() => setActiveTab('opening-tb')}
          >
            Opening TB
          </button>
          <button
            type="button"
            className={`opening-bal-list-tab-btn ${activeTab === 'balance-sheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance-sheet')}
          >
            Balance Sheet
          </button>
        </div>

        {/* Table Section */}
        <div className="opening-bal-list-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading opening balances...</p>
            </div>
          ) : filteredBalances.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <h3>No Opening Balances Found</h3>
              <p>{searchTerm || filterBalanceType !== 'All' 
                ? 'Try adjusting your search or filters.' 
                : 'No opening balances have been created yet.'}</p>
            </div>
          ) : activeTab === 'entries' ? (
            <>
              <div className="table-wrapper">
                <table className="opening-bal-list-table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Date</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalances.map((balance) => {
                      if (!balance) return null;
                      const accountCode = balance.account_code || balance.accountCode || '-';
                      const accountName = balance.account_name || balance.accountName || '-';
                      const balanceDate = balance.opening_balance_date || balance.openingBalanceDate;
                      const debit = parseFloat(balance.debit) || 0;
                      const credit = parseFloat(balance.credit) || 0;
                      const description = balance.description || '-';
                      
                      return (
                        <tr key={balance.id}>
                          <td className="account-code-cell">
                            <span className="code-text">{accountCode}</span>
                          </td>
                          <td className="account-name-cell">{accountName}</td>
                          <td>{formatDate(balanceDate)}</td>
                          <td className={debit > 0 ? 'debit-amount' : ''}>
                            {debit > 0 ? formatCurrency(debit) : '-'}
                          </td>
                          <td className={credit > 0 ? 'credit-amount' : ''}>
                            {credit > 0 ? formatCurrency(credit) : '-'}
                          </td>
                          <td className="description-cell">
                            {description}
                          </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="3" className="totals-label">Total</td>
                      <td className="debit-amount total-amount">
                        {formatCurrency(totals.totalDebit)}
                      </td>
                      <td className="credit-amount total-amount">
                        {formatCurrency(totals.totalCredit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="table-summary">
                <p>
                  Showing <strong>{filteredBalances.length}</strong> of <strong>{openingBalances.length}</strong> opening balance{openingBalances.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          ) : activeTab === 'assets-liabilities' ? (
            <>
              <div className="assets-liabilities-summary-grid">
                <div className="assets-liabilities-card asset-card">
                  <h3>Assets</h3>
                  <p className="summary-count">{assetsLiabilitiesTotals.assetCount} account(s)</p>
                  <p>Debit: <strong>{formatCurrency(assetsLiabilitiesTotals.assetDebit)}</strong></p>
                  <p>Credit: <strong>{formatCurrency(assetsLiabilitiesTotals.assetCredit)}</strong></p>
                  <p>Net (DR - CR): <strong>{formatCurrency(assetsLiabilitiesTotals.assetNet)}</strong></p>
                </div>
                <div className="assets-liabilities-card liability-card">
                  <h3>Liabilities</h3>
                  <p className="summary-count">{assetsLiabilitiesTotals.liabilityCount} account(s)</p>
                  <p>Debit: <strong>{formatCurrency(assetsLiabilitiesTotals.liabilityDebit)}</strong></p>
                  <p>Credit: <strong>{formatCurrency(assetsLiabilitiesTotals.liabilityCredit)}</strong></p>
                  <p>Net (DR - CR): <strong>{formatCurrency(assetsLiabilitiesTotals.liabilityNet)}</strong></p>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="opening-bal-list-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Account Count</th>
                      <th>Total Debit</th>
                      <th>Total Credit</th>
                      <th>Net (DR - CR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Assets</td>
                      <td>{assetsLiabilitiesTotals.assetCount}</td>
                      <td className="debit-amount">{formatCurrency(assetsLiabilitiesTotals.assetDebit)}</td>
                      <td className="credit-amount">{formatCurrency(assetsLiabilitiesTotals.assetCredit)}</td>
                      <td className={assetsLiabilitiesTotals.assetNet >= 0 ? 'debit-amount' : 'credit-amount'}>
                        {formatCurrency(assetsLiabilitiesTotals.assetNet)}
                      </td>
                    </tr>
                    <tr>
                      <td>Liabilities</td>
                      <td>{assetsLiabilitiesTotals.liabilityCount}</td>
                      <td className="debit-amount">{formatCurrency(assetsLiabilitiesTotals.liabilityDebit)}</td>
                      <td className="credit-amount">{formatCurrency(assetsLiabilitiesTotals.liabilityCredit)}</td>
                      <td className={assetsLiabilitiesTotals.liabilityNet >= 0 ? 'debit-amount' : 'credit-amount'}>
                        {formatCurrency(assetsLiabilitiesTotals.liabilityNet)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="table-summary">
                <p>
                  Classified <strong>{assetsLiabilitiesTotals.assetCount + assetsLiabilitiesTotals.liabilityCount}</strong> of <strong>{filteredBalances.length}</strong> filtered opening balance entries
                  {assetsLiabilitiesTotals.otherCount > 0 ? ` (${assetsLiabilitiesTotals.otherCount} not in Asset/Liability)` : ''}
                </p>
              </div>

              <div className="category-entries-section">
                {renderCategoryEntriesTable('Asset Entries', assetEntries, 'asset-card')}
                {renderCategoryEntriesTable('Liability Entries', liabilityEntries, 'liability-card')}
                {uncategorizedEntries.length > 0 &&
                  renderCategoryEntriesTable('Uncategorized Entries', uncategorizedEntries, 'uncategorized-card')}
              </div>
            </>
          ) : activeTab === 'opening-tb' ? (
            <>
              <div className="opening-tb-header">
                <div className="opening-tb-header-top">
                  <div className="opening-tb-header-text">
                    <h3>Opening trial balance</h3>
                    <p>
                      One line per opening balance account (current search / filters). Net = Debit −
                      Credit.
                    </p>
                  </div>
                  <div className="opening-tb-header-actions">
                    <button
                      type="button"
                      className="opening-tb-export-btn"
                      disabled={tbExporting}
                      onClick={() => runOpeningTbExport(exportOpeningTrialBalanceToPdf)}
                    >
                      {tbExporting ? 'Preparing…' : 'Export to PDF'}
                    </button>
                    <button
                      type="button"
                      className="opening-tb-export-btn"
                      disabled={tbExporting}
                      onClick={() => runOpeningTbExport(exportOpeningTrialBalanceToExcel)}
                    >
                      {tbExporting ? 'Preparing…' : 'Export to Excel'}
                    </button>
                  </div>
                </div>
                <div
                  className={`opening-tb-balance-pill ${openingTbBalanced ? 'balanced' : 'unbalanced'}`}
                >
                  {openingTbBalanced ? 'Balanced' : 'Unbalanced'} · Net (DR − CR):{' '}
                  {formatCurrency(openingTbNetDiff)}
                </div>
              </div>
              <div className="table-wrapper">
                <table className="opening-bal-list-table opening-tb-table">
                  <thead>
                    <tr>
                      <th>Account code</th>
                      <th>Account name</th>
                      <th>Type</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Net</th>
                      <th>DR / CR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openingTrialBalanceRows.map((row) => (
                      <tr key={row.id}>
                        <td className="account-code-cell">
                          <span className="code-text">{row.accountCode}</span>
                        </td>
                        <td className="account-name-cell">{row.accountName}</td>
                        <td>{row.typeLabel}</td>
                        <td className={row.debit > 0 ? 'debit-amount' : ''}>
                          {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                        </td>
                        <td className={row.credit > 0 ? 'credit-amount' : ''}>
                          {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                        </td>
                        <td
                          className={
                            row.net > 0.00001
                              ? 'debit-amount'
                              : row.net < -0.00001
                                ? 'credit-amount'
                                : ''
                          }
                        >
                          {Math.abs(row.net) < 0.00001 ? '—' : formatCurrency(row.net)}
                        </td>
                        <td>{row.balanceType}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="3" className="totals-label">
                        Total
                      </td>
                      <td className="debit-amount total-amount">
                        {formatCurrency(openingTbTotals.debit)}
                      </td>
                      <td className="credit-amount total-amount">
                        {formatCurrency(openingTbTotals.credit)}
                      </td>
                      <td
                        className={
                          openingTbNetDiff > 0.00001
                            ? 'debit-amount'
                            : openingTbNetDiff < -0.00001
                              ? 'credit-amount'
                              : ''
                        }
                      >
                        {formatCurrency(openingTbNetDiff)}
                      </td>
                      <td>{openingTbBalanced ? 'BALANCED' : 'CHECK'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="table-summary">
                <p>
                  <strong>{openingTrialBalanceRows.length}</strong> account
                  {openingTrialBalanceRows.length === 1 ? '' : 's'} (filtered)
                </p>
              </div>
            </>
          ) : activeTab === 'balance-sheet' ? (
            <>
              <div className="opening-bs-header">
                <h3>Statement of Financial Position (Opening Balances Only)</h3>
                <div className="opening-bs-header-actions">
                  <button
                    type="button"
                    className={`opening-bs-mtm-button ${showMtmData ? 'active' : ''}`}
                    onClick={() => setShowMtmData((prev) => !prev)}
                  >
                    With MTM data
                  </button>
                  <button
                    type="button"
                    className={`opening-bs-mtm-button ${showNotes ? 'active' : ''}`}
                    onClick={() => setShowNotes((prev) => !prev)}
                  >
                    With notes
                  </button>
                  <div className={`opening-bs-balance-pill ${openingStatementBalanced ? 'balanced' : 'unbalanced'}`}>
                    {openingStatementBalanced ? 'Balanced' : 'Unbalanced'} · Diff:{' '}
                    {formatCurrency(openingStatementDifference)}
                  </div>
                </div>
              </div>

              <div className="opening-bs-grid">
                <div className="opening-bs-card">
                  <div className="opening-bs-card-title">Assets</div>
                  {openingBalanceStatement.assets.length === 0 ? (
                    <div className="category-entries-empty">No asset opening-balance entries.</div>
                  ) : (
                    <>
                      <div className="opening-bs-subsection-title">Non-current assets</div>
                      {bsNonCurrentAssets.length === 0 ? (
                        <div className="category-entries-empty opening-bs-subsection-empty">
                          No non-current asset entries (by category / name).
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="opening-bal-list-table">
                            <thead>
                              <tr>
                                <th>Transaction Type</th>
                                <th>Amount</th>
                                <th>DR/CR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bsNonCurrentAssets.map((row) => (
                                <tr key={`bs-asset-nc-${row.id}`}>
                                  <td className="account-name-cell">{row.accountName}</td>
                                  <td className="debit-amount">{formatCurrency(Math.abs(row.net))}</td>
                                  <td>{getBsDrCr(row.net, 'DR')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {bsNonCurrentAssets.length > 0 && (
                        <div className="opening-bs-subtotal">
                          Total Non-current assets:{' '}
                          <strong>{formatCurrency(bsTotalNonCurrentAssets)}</strong>
                        </div>
                      )}

                      <div className="opening-bs-subsection-title opening-bs-subsection-title-spaced">
                        Current assets
                      </div>
                      {bsCurrentAssets.length === 0 ? (
                        <div className="category-entries-empty opening-bs-subsection-empty">
                          No current asset entries.
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="opening-bal-list-table">
                            <thead>
                              <tr>
                                <th>Transaction Type</th>
                                <th>Amount</th>
                                <th>DR/CR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bsCurrentAssets.map((row) => (
                                <tr key={`bs-asset-c-${row.id}`}>
                                  <td className="account-name-cell">{row.accountName}</td>
                                  <td className="debit-amount">{formatCurrency(Math.abs(row.net))}</td>
                                  <td>{getBsDrCr(row.net, 'DR')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {bsCurrentAssets.length > 0 && (
                        <div className="opening-bs-subtotal">
                          Total Current assets: <strong>{formatCurrency(bsTotalCurrentAssets)}</strong>
                        </div>
                      )}
                    </>
                  )}
                  <div className="opening-bs-total">
                    Total Assets: <strong>{formatCurrency(openingBalanceStatement.totals.totalAssets)}</strong>
                  </div>
                </div>

                <div className="opening-bs-card">
                  <div className="opening-bs-card-title">Equity</div>
                  {openingBalanceStatement.equity.length === 0 ? (
                    <div className="category-entries-empty">No equity opening-balance entries.</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="opening-bal-list-table">
                        <thead>
                          <tr>
                            <th>Transaction Type</th>
                            <th>Amount</th>
                            <th>DR/CR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openingBalanceStatement.equity.map((row) => (
                            <tr key={`bs-eq-${row.id}`}>
                              <td className="account-name-cell">{row.accountName}</td>
                              <td className="credit-amount">{formatCurrency(Math.abs(row.net))}</td>
                              <td>{getBsDrCr(row.net, 'CR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="opening-bs-subtotal">
                    Total Equity: <strong>{formatCurrency(openingBalanceStatement.totals.totalEquity)}</strong>
                  </div>

                  <div className="opening-bs-card-title">Liabilities</div>
                  {openingBalanceStatement.liabilities.length === 0 ? (
                    <div className="category-entries-empty">No liability opening-balance entries.</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="opening-bal-list-table">
                        <thead>
                          <tr>
                            <th>Transaction Type</th>
                            <th>Amount</th>
                            <th>DR/CR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openingBalanceStatement.liabilities.map((row) => (
                            <tr key={`bs-liab-${row.id}`}>
                              <td className="account-name-cell">{row.accountName}</td>
                              <td className="credit-amount">{formatCurrency(Math.abs(row.net))}</td>
                              <td>{getBsDrCr(row.net, 'CR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="opening-bs-subtotal">
                    Total Liabilities: <strong>{formatCurrency(openingBalanceStatement.totals.totalLiabilities)}</strong>
                  </div>

                  <div className="opening-bs-total">
                    Total Liabilities + Equity:{' '}
                    <strong>{formatCurrency(totalLiabilitiesAndEquity)}</strong>
                  </div>
                </div>
              </div>

              {openingBalanceStatement.others.length > 0 && (
                <div className="table-summary">
                  <p>
                    <strong>{openingBalanceStatement.others.length}</strong> opening-balance entries are uncategorized and excluded from the balance sheet totals.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
};

export default OpeningBalList;













