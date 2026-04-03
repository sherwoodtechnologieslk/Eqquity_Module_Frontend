import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { trialBalanceAPI, gsecEntriesAPI } from '../../services/api';
import './Styles/CombinedTrialBalance.css';

const CombinedTrialBalance = ({ onTabChange }) => {
  const [equityTB, setEquityTB] = useState(null);
  const [gsecBS, setGsecBS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });
  const [sourceFilter, setSourceFilter] = useState('all'); // all | equity | gsec
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (options = {}) => {
    const { showLoader = true } = options;
    try {
      if (showLoader || !hasLoadedOnceRef.current) {
        setLoading(true);
      }
      setError('');

      const [tbRes, gsecRes] = await Promise.all([
        trialBalanceAPI.getTrialBalance(filters),
        gsecEntriesAPI.getBalanceSheet(filters),
      ]);

      if (!tbRes?.success) {
        throw new Error(tbRes?.error || 'Failed to fetch equity trial balance');
      }
      if (!gsecRes?.success) {
        throw new Error(gsecRes?.error || 'Failed to fetch GSec balance sheet');
      }

      setEquityTB(tbRes.data);
      setGsecBS(gsecRes.data);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.error('Error fetching combined trial balance:', err);
      setError(err.message || 'Failed to fetch combined trial balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ showLoader: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep screen fresh when transactions update elsewhere (tab often stays mounted).
  useEffect(() => {
    const refreshIfVisible = () => {
      if (!document.hidden) {
        fetchData({ showLoader: false });
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);
    const intervalId = window.setInterval(refreshIfVisible, 30000);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDateChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    fetchData({ showLoader: true });
  };

  const handleExportPdf = () => {
    setExporting(true);
    setError('');

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(11);
      doc.text('Combined Trial Balance', 40, 34);

      const periodLabel = `Period: ${formatDate(
        equityTB?.period?.startDate || gsecBS?.period?.startDate
      )} - ${formatDate(equityTB?.period?.endDate || gsecBS?.period?.endDate)}`;

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(periodLabel, 40, 50);
      doc.setTextColor(15, 23, 42);

      const head = [
        'Source',
        'Account Code',
        'Account Name',
        'Type / Category',
        'Debit',
        'Credit',
        'Net',
        'DR/CR'
      ];

      const body = filteredAccounts.map((acc) => [
        acc.source,
        acc.account_code,
        acc.account_name,
        acc.account_type,
        acc.total_debit > 0 ? formatCurrency(acc.total_debit) : '-',
        acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '-',
        formatCurrency(acc.net_balance),
        acc.balance_type
      ]);

      const foot = [
        'Totals',
        '',
        '',
        '',
        formatCurrency(totals.debit),
        formatCurrency(totals.credit),
        '',
        isBalanced ? 'BALANCED' : 'OUT OF BALANCE'
      ];

      autoTable(doc, {
        startY: 62,
        theme: 'grid',
        head: [head],
        body,
        foot: [foot],
        showFoot: 'lastPage',
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
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        margin: { left: 40, right: 40 }
      });

      const dateStamp = new Date().toISOString().slice(0, 10);
      doc.save(`combined-trial-balance-${dateStamp}.pdf`);
    } catch (err) {
      console.error('Failed to export combined trial balance PDF:', err);
      setError('Failed to export combined trial balance PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setError('');

    try {
      const blob = await trialBalanceAPI.exportCombinedTrialBalanceExcel({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        source: sourceFilter,
        search: searchTerm || undefined
      });
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = downloadUrl;
      a.download = `combined-trial-balance-${dateStamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export combined trial balance:', err);
      setError('Failed to export combined trial balance: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
    });
    setSourceFilter('all');
    setSearchTerm('');
  };

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(n);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-LK');
  };

  const combinedAccounts = useMemo(() => {
    const equityAccounts = (equityTB?.accounts || []).map((a) => ({
      id: `equity-${a.account_code}`,
      source: 'Equity',
      account_code: a.account_code,
      account_name: a.account_name,
      account_type: a.account_type,
      total_debit: Number(a.total_debit) || 0,
      total_credit: Number(a.total_credit) || 0,
      net_balance: Number(a.net_balance) || 0,
      balance_type: a.balance_type,
    }));

    const gsecAccounts = (gsecBS?.accounts || []).map((g) => {
      const net = (Number(g.total_debit) || 0) - (Number(g.total_credit) || 0);
      return {
        id: `gsec-${g.account_code}`,
        source: 'GSec',
        account_code: g.account_code,
        account_name: g.account_name,
        account_type: g.account_category || 'GSec',
        total_debit: Number(g.total_debit) || 0,
        total_credit: Number(g.total_credit) || 0,
        net_balance: net,
        balance_type: net > 0 ? 'DR' : net < 0 ? 'CR' : 'ZERO',
      };
    });

    return [...equityAccounts, ...gsecAccounts];
  }, [equityTB, gsecBS]);

  const filteredAccounts = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return combinedAccounts.filter((acc) => {
      if (sourceFilter === 'equity' && acc.source !== 'Equity') return false;
      if (sourceFilter === 'gsec' && acc.source !== 'GSec') return false;

      if (
        search &&
        !(
          (acc.account_code && acc.account_code.toLowerCase().includes(search)) ||
          (acc.account_name && acc.account_name.toLowerCase().includes(search)) ||
          (acc.account_type && acc.account_type.toLowerCase().includes(search)) ||
          (acc.source && acc.source.toLowerCase().includes(search))
        )
      ) {
        return false;
      }

      return true;
    });
  }, [combinedAccounts, sourceFilter, searchTerm]);

  const totals = filteredAccounts.reduce(
    (acc, a) => {
      acc.debit += a.total_debit || 0;
      acc.credit += a.total_credit || 0;
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  if (loading) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-loading">Loading Combined Trial Balance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ctb-page-container">
        <div className="ctb-error">
          <div className="ctb-error-title">Error loading Combined Trial Balance</div>
          <div className="ctb-error-message">{error}</div>
          <button className="ctb-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ctb-page-container">
      <div className="ctb-content-wrapper">
        {/* Header */}
        <div className="ctb-header-section">
          <div className="ctb-header-icon">
            <svg className="ctb-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a1 1 0 001.447.894L8 14.118l4.553 1.776A1 1 0 0014 15V5a2 2 0 00-2-2H4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ctb-header-text-group">
            <h1 className="ctb-main-title">Combined Trial Balance</h1>
            <p className="ctb-subtitle">
              Single trial balance view that combines equity and GSec ledgers, including both trading and non-trading transactions.
            </p>
          </div>
          <div className="ctb-header-meta">
            <div className="ctb-period">
              Period:&nbsp;
              <span>
                {formatDate(equityTB?.period?.startDate || gsecBS?.period?.startDate)} -{' '}
                {formatDate(equityTB?.period?.endDate || gsecBS?.period?.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ctb-filters-card">
          <div className="ctb-card-header">
            <h2 className="ctb-card-title">Filters</h2>
          </div>
          <div className="ctb-filters-content">
            <div className="ctb-filters-grid">
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Start Date</label>
                <input
                  type="date"
                  className="ctb-filter-input"
                  value={filters.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">End Date</label>
                <input
                  type="date"
                  className="ctb-filter-input"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Source</label>
                <select
                  className="ctb-filter-select"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="equity">Equity Only</option>
                  <option value="gsec">GSec Only</option>
                </select>
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Search</label>
                <input
                  type="text"
                  className="ctb-filter-input"
                  placeholder="Account code, name, type, or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="ctb-filter-group ctb-filter-actions">
                <button className="ctb-apply-btn" onClick={handleApply}>
                  Apply
                </button>
                <button className="ctb-clear-btn" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Balance status */}
        <div className={`ctb-balance-status ${isBalanced ? 'ctb-balanced' : 'ctb-unbalanced'}`}>
          <span className="ctb-status-text">
            {isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}
          </span>
          <span className="ctb-status-details">
            Total Debits: {formatCurrency(totals.debit)} | Total Credits:{' '}
            {formatCurrency(totals.credit)} | Accounts: {filteredAccounts.length}
          </span>
        </div>

        {/* Table */}
        <div className="ctb-table-card">
          <div className="ctb-card-header ctb-table-header">
            <h2 className="ctb-card-title">Combined Trial Balance</h2>
            <div className="ctb-export-actions">
              <button className="ctb-export-btn" onClick={handleExportPdf} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export to PDF'}
              </button>
              <button className="ctb-export-btn" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export to Excel'}
              </button>
            </div>
          </div>
          <div className="ctb-table-container">
            {filteredAccounts.length === 0 ? (
              <div className="ctb-no-data">
                No accounts found for the selected filters.
              </div>
            ) : (
              <table className="ctb-data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Type / Category</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="ctb-row">
                      <td
                        className="ctb-source-cell"
                        onClick={() => {
                          if (!onTabChange) return;
                          if (acc.source === 'Equity') {
                            onTabChange('Trial Balance');
                          } else if (acc.source === 'GSec') {
                            onTabChange('Balance Sheet');
                          }
                        }}
                      >
                        <span className="ctb-source" data-source={acc.source}>
                          {acc.source}
                        </span>
                      </td>
                      <td className="ctb-account-code">{acc.account_code}</td>
                      <td className="ctb-account-name">{acc.account_name}</td>
                      <td className="ctb-account-type">{acc.account_type}</td>
                      <td className="ctb-debit">
                        {acc.total_debit > 0 ? formatCurrency(acc.total_debit) : '-'}
                      </td>
                      <td className="ctb-credit">
                        {acc.total_credit > 0 ? formatCurrency(acc.total_credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedTrialBalance;

