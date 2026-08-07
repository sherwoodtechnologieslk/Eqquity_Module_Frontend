import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cashFlowAPI, portfolioAPI, accountAPI } from '../../services/api';
import './Styles/CashFlowMapping.css';

const DEFAULT_SUMMARY = {
  totalInflows: 0,
  totalOutflows: 0,
  netCashFlow: 0,
  transactionCount: 0,
  buyCount: 0,
  sellCount: 0,
  otherCount: 0,
};

const CashFlowMapping = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [cashFlows, setCashFlows] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [groupBy, setGroupBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filterKey = [
    activeTab,
    startDate,
    endDate,
    selectedPortfolio,
    selectedAccount,
    debouncedSearch,
    limit,
  ].join('|');
  const prevFilterKeyRef = useRef(filterKey);

  const fetchCashFlows = useCallback(async (pageOverride) => {
    const requestId = ++fetchIdRef.current;
    const pageToFetch = pageOverride ?? page;
    setLoading(true);
    setError(null);
    try {
      const result = await cashFlowAPI.getCashFlows({
        page: pageToFetch,
        limit,
        tab: activeTab,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        portfolio: selectedPortfolio !== 'all' ? selectedPortfolio : undefined,
        account: selectedAccount !== 'all' ? selectedAccount : undefined,
        search: debouncedSearch || undefined,
      });

      if (requestId !== fetchIdRef.current) return;

      setCashFlows(result?.data || []);
      setSummary(result?.summary || DEFAULT_SUMMARY);

      const pagination = result?.pagination || {};
      setTotalPages(pagination.totalPages || 1);
      setTotalRecords(pagination.total || 0);
      if (pagination.page && pagination.page !== pageToFetch) {
        setPage(pagination.page);
      }
    } catch (err) {
      if (requestId !== fetchIdRef.current) return;
      console.error('Error fetching cash flows:', err);
      setError(`Failed to load cash flow data: ${err.message || 'Unknown error'}`);
      setCashFlows([]);
      setSummary(DEFAULT_SUMMARY);
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false);
        setInitialLoadDone(true);
      }
    }
  }, [
    page,
    limit,
    activeTab,
    startDate,
    endDate,
    selectedPortfolio,
    selectedAccount,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchCashFlows();
  }, [filterKey, page, fetchCashFlows]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [portfolioData, accountData] = await Promise.all([
          portfolioAPI.getAllPortfolios().catch(() => []),
          accountAPI.getAllAccounts().catch(() => []),
        ]);
        setPortfolios(portfolioData || []);
        setAccounts(accountData || []);
      } catch (err) {
        console.error('Error loading filter lookups:', err);
      }
    };
    loadLookups();
  }, []);

  const formatCurrency = (amount) => {
    const n = Number(amount);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  };

  const typeClass = (type) => String(type || 'other').toLowerCase();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const exportToCSV = async () => {
    try {
      const result = await cashFlowAPI.getCashFlows({
        page: 1,
        limit: 5000,
        export: 1,
        tab: activeTab,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        portfolio: selectedPortfolio !== 'all' ? selectedPortfolio : undefined,
        account: selectedAccount !== 'all' ? selectedAccount : undefined,
        search: debouncedSearch || undefined,
      });

      const rowsData = result?.data || [];
      const headers = [
        'Type', 'Settlement Date', 'Trade Date', 'Portfolio', 'Symbol', 'Company',
        'Quantity', 'Price', 'Cash Flow Amount', 'Settlement Account', 'Account Name',
        'Account Number', 'Bank Name', 'Branch Name', 'Broker', 'Deal Number',
        'Contract Number', 'Payment Method', 'Description',
      ];

      const rows = rowsData.map((cf) => [
        cf.type,
        cf.settlementDate || '',
        cf.tradeDate || '',
        cf.portfolio || '',
        cf.symbol || '',
        cf.companyName || '',
        cf.quantity || 0,
        cf.price || 0,
        cf.cashFlowAmount || 0,
        cf.settlementAccount || '',
        cf.accountName || '',
        cf.accountNumber || '',
        cf.bankName || '',
        cf.branchName || '',
        cf.brokerName || '',
        cf.dealNumber || '',
        cf.contractNumber || '',
        cf.paymentMethod || '',
        cf.description || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cash_flow_mapping_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  const groupedCashFlows = () => {
    if (groupBy === 'date') {
      const grouped = {};
      cashFlows.forEach((cf) => {
        const key = cf.settlementDate || cf.tradeDate || 'No Date';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(cf);
      });
      return Object.entries(grouped)
        .sort(([a], [b]) => {
          if (a === 'No Date' || b === 'No Date') return a === 'No Date' ? 1 : -1;
          return new Date(b) - new Date(a);
        })
        .map(([date, flows]) => ({ date, flows }));
    }

    if (groupBy === 'portfolio') {
      const grouped = {};
      cashFlows.forEach((cf) => {
        const key = cf.portfolio || 'N/A';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(cf);
      });
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([portfolio, flows]) => ({ portfolio, flows }));
    }

    if (groupBy === 'account') {
      const grouped = {};
      cashFlows.forEach((cf) => {
        const key = cf.settlementAccount || 'N/A';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(cf);
      });
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([account, flows]) => ({ account, flows }));
    }

    return [{ flows: cashFlows }];
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages && nextPage !== page) {
      setPage(nextPage);
    }
  };

  if (!initialLoadDone && loading) {
    return (
      <div className="cfm-root">
        <div className="cfm-loading">
          <div className="cfm-spinner" />
          <p>Loading cash flow data…</p>
        </div>
      </div>
    );
  }

  if (error && !initialLoadDone) {
    return (
      <div className="cfm-root">
        <div className="cfm-error">
          <p>{error}</p>
          <button type="button" onClick={fetchCashFlows} className="cfm-btn cfm-btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rangeStart = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalRecords);

  return (
    <div className="cfm-root">
      <header className="cfm-rail">
        <div>
          <p className="cfm-rail__eyebrow">Accounting</p>
          <h1 className="cfm-rail__title">Cash Flow Mapping</h1>
          <p className="cfm-rail__blurb">
            Track and manage cash flows from trading, GSec, and other transactions.
          </p>
        </div>
      </header>

      <nav className="cfm-tabs" aria-label="Cash flow views">
        <button
          type="button"
          className={`cfm-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => changeTab('all')}
        >
          All Transactions
        </button>
        <button
          type="button"
          className={`cfm-tab${activeTab === 'trading' ? ' active' : ''}`}
          onClick={() => changeTab('trading')}
        >
          Trading Transactions
        </button>
        <button
          type="button"
          className={`cfm-tab${activeTab === 'gsec' ? ' active' : ''}`}
          onClick={() => changeTab('gsec')}
        >
          GSec Transactions
        </button>
        <button
          type="button"
          className={`cfm-tab${activeTab === 'other' ? ' active' : ''}`}
          onClick={() => changeTab('other')}
        >
          Other Transactions
        </button>
      </nav>

      <div className="cfm-summary-cards">
        <div className="cfm-summary-card">
          <div className="cfm-card-label">Total inflows</div>
          <div className="cfm-card-value positive">{formatCurrency(summary.totalInflows)}</div>
        </div>

        <div className="cfm-summary-card">
          <div className="cfm-card-label">Total outflows</div>
          <div className="cfm-card-value negative">{formatCurrency(summary.totalOutflows)}</div>
        </div>

        <div className="cfm-summary-card">
          <div className="cfm-card-label">Net cash flow</div>
          <div className={`cfm-card-value ${summary.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.netCashFlow)}
          </div>
        </div>

        <div className="cfm-summary-card">
          <div className="cfm-card-label">Total transactions</div>
          <div className="cfm-card-value cfm-card-value--blue">{summary.transactionCount}</div>
          <div className="cfm-card-breakdown">
            Buy: {summary.buyCount} · Sell: {summary.sellCount} · Other: {summary.otherCount}
          </div>
        </div>
      </div>

      <div className="cfm-filters">
        <div className="cfm-filter-row">
          <div className="cfm-filter-group">
            <label htmlFor="cfm-start-date">Start date</label>
            <input
              id="cfm-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="cfm-input"
            />
          </div>
          <div className="cfm-filter-group">
            <label htmlFor="cfm-end-date">End date</label>
            <input
              id="cfm-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="cfm-input"
            />
          </div>
          <div className="cfm-filter-group">
            <label htmlFor="cfm-portfolio">Portfolio</label>
            <select
              id="cfm-portfolio"
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              className="cfm-select"
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.portfolio_name || p.name}>
                  {p.portfolio_name || p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="cfm-filter-group">
            <label htmlFor="cfm-account">Settlement account</label>
            <select
              id="cfm-account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="cfm-select"
            >
              <option value="all">All Accounts</option>
              {[...new Set(accounts.map((a) => a.account_name || a.name))].map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="cfm-filter-group">
            <label htmlFor="cfm-group-by">Group by</label>
            <select
              id="cfm-group-by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="cfm-select"
            >
              <option value="date">Settlement Date</option>
              <option value="portfolio">Portfolio</option>
              <option value="account">Settlement Account</option>
              <option value="none">No Grouping</option>
            </select>
          </div>
          <div className="cfm-filter-group">
            <label htmlFor="cfm-page-size">Rows per page</label>
            <select
              id="cfm-page-size"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="cfm-select"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="cfm-filter-toolbar">
          <div className="cfm-filter-group cfm-search-group">
            <label htmlFor="cfm-search">Search</label>
            <input
              id="cfm-search"
              type="text"
              placeholder="Search by symbol, company, deal number, contract…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cfm-input cfm-search-input"
            />
          </div>
          <div className="cfm-filter-actions">
            <button type="button" onClick={exportToCSV} className="cfm-btn cfm-btn--primary">
              Export CSV
            </button>
            <button type="button" onClick={fetchCashFlows} className="cfm-btn cfm-btn--secondary">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="cfm-inline-error">
          <p>{error}</p>
          <button type="button" onClick={fetchCashFlows} className="cfm-btn cfm-btn--secondary">
            Retry
          </button>
        </div>
      )}

      <div className={`cfm-table-wrap${loading ? ' cfm-table-wrap--loading' : ''}`}>
        <table className="cfm-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Settlement Date</th>
              <th>Trade Date</th>
              <th>Portfolio</th>
              <th>Symbol</th>
              <th>Company</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Cash Flow Amount</th>
              <th>Settlement Account</th>
              <th>Bank</th>
              <th>Broker</th>
              <th>Deal Number</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {groupedCashFlows().map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {(group.date || group.portfolio || group.account) && (
                  <tr className="cfm-group-header">
                    <td colSpan="14">
                      <strong>
                        {group.date && `Settlement Date: ${formatDate(group.date)}`}
                        {group.portfolio && `Portfolio: ${group.portfolio}`}
                        {group.account && `Settlement Account: ${group.account}`}
                        <span className="cfm-group-total">
                          ({group.flows.length} transactions, Total: {formatCurrency(
                            group.flows.reduce((sum, cf) => sum + (parseFloat(cf.cashFlowAmount) || 0), 0)
                          )})
                        </span>
                      </strong>
                    </td>
                  </tr>
                )}
                {group.flows.map((cf, index) => (
                  <tr key={`${cf.id}-${index}`} className={`cfm-row cfm-row-${typeClass(cf.type)}`}>
                    <td>
                      <span className={`cfm-type-badge cfm-type-${typeClass(cf.type)}`}>
                        {cf.type || 'Other'}
                      </span>
                    </td>
                    <td>{formatDate(cf.settlementDate)}</td>
                    <td>{formatDate(cf.tradeDate)}</td>
                    <td>{cf.portfolio || 'N/A'}</td>
                    <td>{cf.symbol || 'N/A'}</td>
                    <td>{cf.companyName || 'N/A'}</td>
                    <td>{cf.quantity ? parseFloat(cf.quantity).toLocaleString() : 'N/A'}</td>
                    <td>{cf.price ? formatCurrency(cf.price) : 'N/A'}</td>
                    <td className={`cfm-amount ${cf.cashFlowAmount >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(cf.cashFlowAmount)}
                    </td>
                    <td>{cf.settlementAccount || 'N/A'}</td>
                    <td>{cf.bankName || 'N/A'}</td>
                    <td>{cf.brokerName || 'N/A'}</td>
                    <td>{cf.dealNumber || 'N/A'}</td>
                    <td className="cfm-description">{cf.description || 'N/A'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {cashFlows.length === 0 && !loading && (
              <tr>
                <td colSpan="14" className="cfm-empty">
                  {totalRecords === 0 && !startDate && !endDate && selectedPortfolio === 'all'
                    && selectedAccount === 'all' && !debouncedSearch ? (
                    <div className="cfm-empty-panel">
                      <p className="cfm-empty-title">No cash flow data found.</p>
                      <p className="cfm-empty-text">This could mean:</p>
                      <ul className="cfm-empty-list">
                        <li>No transactions exist in the database for your account</li>
                        <li>Transactions exist but don't have cash flow settlement information</li>
                        <li>You need to create buy/sell transactions first</li>
                      </ul>
                      <p className="cfm-empty-text">
                        Try creating a transaction from the <strong>Trade Capture</strong> section.
                      </p>
                    </div>
                  ) : (
                    'No cash flow data found matching the selected filters. Try adjusting your filter criteria.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cfm-pagination">
        <div className="cfm-pagination__info">
          Showing {rangeStart}–{rangeEnd} of {totalRecords}
        </div>
        <div className="cfm-pagination__controls">
          <button
            type="button"
            className="cfm-btn cfm-btn--secondary"
            onClick={() => goToPage(1)}
            disabled={page <= 1 || loading}
          >
            First
          </button>
          <button
            type="button"
            className="cfm-btn cfm-btn--secondary"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className="cfm-pagination__page">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="cfm-btn cfm-btn--secondary"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
          <button
            type="button"
            className="cfm-btn cfm-btn--secondary"
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages || loading}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashFlowMapping;
