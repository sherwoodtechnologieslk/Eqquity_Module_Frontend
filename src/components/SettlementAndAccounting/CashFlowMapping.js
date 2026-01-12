import React, { useState, useEffect, useCallback } from 'react';
import { transactionEntryAPI, otherTransactionAPI, portfolioAPI, accountAPI } from '../../services/api';
import './Styles/CashFlowMapping.css';

const CashFlowMapping = () => {
  const [cashFlows, setCashFlows] = useState([]);
  const [filteredCashFlows, setFilteredCashFlows] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [groupBy, setGroupBy] = useState('date'); // 'date', 'portfolio', 'account'
  const [searchTerm, setSearchTerm] = useState('');

  // Summary states
  const [summary, setSummary] = useState({
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    transactionCount: 0,
    buyCount: 0,
    sellCount: 0,
    otherCount: 0
  });

  useEffect(() => {
    fetchData();
    fetchPortfolios();
    fetchAccounts();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...cashFlows];
    console.log('🔍 Applying filters. Initial count:', filtered.length);

    // Date filter
    if (startDate) {
      const beforeDateFilter = filtered.length;
      filtered = filtered.filter(cf => {
        const cfDate = cf.settlementDate || cf.tradeDate;
        return cfDate && cfDate >= startDate;
      });
      console.log(`📅 After start date filter (${startDate}):`, beforeDateFilter, '->', filtered.length);
    }
    if (endDate) {
      const beforeDateFilter = filtered.length;
      filtered = filtered.filter(cf => {
        const cfDate = cf.settlementDate || cf.tradeDate;
        return cfDate && cfDate <= endDate;
      });
      console.log(`📅 After end date filter (${endDate}):`, beforeDateFilter, '->', filtered.length);
    }

    // Portfolio filter
    if (selectedPortfolio !== 'all') {
      filtered = filtered.filter(cf => 
        cf.portfolio === selectedPortfolio || cf.portfolioId === selectedPortfolio
      );
    }

    // Account filter
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(cf => 
        cf.settlementAccount === selectedAccount ||
        cf.accountName === selectedAccount ||
        cf.accountNumber === selectedAccount
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cf =>
        (cf.symbol && cf.symbol.toLowerCase().includes(term)) ||
        (cf.companyName && cf.companyName.toLowerCase().includes(term)) ||
        (cf.dealNumber && cf.dealNumber.toLowerCase().includes(term)) ||
        (cf.contractNumber && cf.contractNumber.toLowerCase().includes(term)) ||
        (cf.description && cf.description.toLowerCase().includes(term))
      );
    }

    console.log('✅ Final filtered count:', filtered.length);
    setFilteredCashFlows(filtered);

    // Calculate summary
    const totalInflows = filtered
      .filter(cf => cf.cashFlowAmount > 0)
      .reduce((sum, cf) => sum + (parseFloat(cf.cashFlowAmount) || 0), 0);
    
    const totalOutflows = filtered
      .filter(cf => cf.cashFlowAmount < 0)
      .reduce((sum, cf) => sum + Math.abs(parseFloat(cf.cashFlowAmount) || 0), 0);

    const netCashFlow = totalInflows - totalOutflows;

    const summaryData = {
      totalInflows,
      totalOutflows,
      netCashFlow,
      transactionCount: filtered.length,
      buyCount: filtered.filter(cf => cf.type === 'Buy').length,
      sellCount: filtered.filter(cf => cf.type === 'Sell').length,
      otherCount: filtered.filter(cf => cf.type === 'Other').length
    };
    
    console.log('📊 Summary:', summaryData);
    setSummary(summaryData);
  }, [cashFlows, startDate, endDate, selectedPortfolio, selectedAccount, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching cash flow data...');
      console.log('🔑 Auth token present:', !!localStorage.getItem('token'));
      
      // Fetch buy transactions
      let buyTransactions = [];
      try {
        buyTransactions = await transactionEntryAPI.getAllBuyTransactions();
        console.log('✅ Buy transactions fetched:', buyTransactions?.length || 0);
        if (buyTransactions?.length > 0) {
          console.log('📋 Sample buy transaction:', buyTransactions[0]);
        } else {
          console.warn('⚠️ No buy transactions found. Check if user has transactions in database.');
        }
      } catch (err) {
        console.error('❌ Error fetching buy transactions:', err);
        console.error('❌ Error details:', err.message, err.stack);
      }
      
      // Fetch sell transactions
      let sellTransactions = [];
      try {
        sellTransactions = await transactionEntryAPI.getAllSellTransactions();
        console.log('✅ Sell transactions fetched:', sellTransactions?.length || 0);
        if (sellTransactions?.length > 0) {
          console.log('📋 Sample sell transaction:', sellTransactions[0]);
        } else {
          console.warn('⚠️ No sell transactions found.');
        }
      } catch (err) {
        console.error('❌ Error fetching sell transactions:', err);
        console.error('❌ Error details:', err.message);
      }

      // Fetch other transactions
      let otherTransactions = [];
      try {
        otherTransactions = await otherTransactionAPI.getAllTransactions();
        console.log('✅ Other transactions fetched:', otherTransactions?.length || 0);
        if (otherTransactions?.length > 0) {
          console.log('📋 Sample other transaction:', otherTransactions[0]);
        } else {
          console.warn('⚠️ No other transactions found.');
        }
      } catch (err) {
        console.error('❌ Error fetching other transactions:', err);
        console.error('❌ Error details:', err.message);
      }

      // Transform buy transactions
      const buyCashFlows = (buyTransactions || []).map(tx => ({
        id: tx.id,
        type: 'Buy',
        transactionId: tx.id,
        portfolio: tx.portfolio || tx.portfolioId || 'N/A',
        portfolioId: tx.portfolioId,
        settlementDate: tx.settlement_date,
        tradeDate: tx.trade_date,
        symbol: tx.symbol,
        companyName: tx.company_name,
        quantity: tx.quantity,
        price: tx.price,
        netValue: tx.net_value,
        cashFlowAmount: tx.cash_flow_on_settlement || tx.net_value || 0,
        settlementAccount: tx.settlement_account || 'N/A',
        accountName: tx.account_name || 'N/A',
        accountNumber: tx.account_number || 'N/A',
        bankName: tx.bank_name || 'N/A',
        branchName: tx.branch_name || 'N/A',
        brokerName: tx.broker_name || 'N/A',
        dealNumber: tx.deal_number || 'N/A',
        contractNumber: tx.contract_number || 'N/A',
        paymentMethod: tx.payment_method || 'N/A',
        description: tx.description || `${tx.quantity} ${tx.symbol} @ ${tx.price}`,
        created_at: tx.created_at
      }));

      // Transform sell transactions
      const sellCashFlows = (sellTransactions || []).map(tx => ({
        id: `sell-${tx.id}`,
        type: 'Sell',
        transactionId: tx.id,
        portfolio: tx.portfolio_name || tx.portfolio || 'N/A',
        portfolioId: tx.portfolio_id,
        settlementDate: tx.settlement_date,
        tradeDate: tx.trade_date,
        symbol: tx.symbol,
        companyName: tx.company_name,
        quantity: tx.quantity,
        price: tx.sold_price || tx.price,
        netValue: tx.net_value || tx.total_value || 0,
        cashFlowAmount: tx.cash_flow_on_settlement || tx.net_value || tx.total_value || 0,
        settlementAccount: tx.settlement_account || 'N/A',
        accountName: tx.account_name || 'N/A',
        accountNumber: tx.account_number || 'N/A',
        bankName: tx.bank_name || 'N/A',
        branchName: tx.branch_name || 'N/A',
        brokerName: tx.broker_name || 'N/A',
        dealNumber: tx.deal_number || 'N/A',
        contractNumber: tx.contract_number || 'N/A',
        paymentMethod: tx.payment_method || 'N/A',
        description: tx.description || `Sold ${tx.quantity} ${tx.symbol} @ ${tx.sold_price || tx.price}`,
        created_at: tx.created_at
      }));

      // Transform other transactions
      const otherCashFlows = (otherTransactions || []).map(tx => ({
        id: `other-${tx.id}`,
        type: 'Other',
        transactionId: tx.id,
        portfolio: tx.account_type || 'N/A',
        portfolioId: null,
        settlementDate: tx.transaction_date,
        tradeDate: tx.transaction_date,
        symbol: 'N/A',
        companyName: 'N/A',
        quantity: 0,
        price: 0,
        netValue: tx.amount || 0,
        cashFlowAmount: tx.cash_flow_on_settlement || tx.amount || 0,
        settlementAccount: tx.payment_account_name || 'N/A',
        accountName: tx.payment_account_name || 'N/A',
        accountNumber: tx.payment_account_number || 'N/A',
        bankName: tx.payment_bank_name || 'N/A',
        branchName: tx.payment_branch_name || 'N/A',
        brokerName: 'N/A',
        dealNumber: tx.voucher_number || 'N/A',
        contractNumber: 'N/A',
        paymentMethod: tx.payment_method || 'N/A',
        description: tx.description || tx.transaction_type || 'Other Transaction',
        transactionType: tx.transaction_type,
        accountType: tx.account_type,
        created_at: tx.created_at
      }));

      const allCashFlows = [...buyCashFlows, ...sellCashFlows, ...otherCashFlows]
        .sort((a, b) => {
          const dateA = new Date(a.settlementDate || a.tradeDate || 0);
          const dateB = new Date(b.settlementDate || b.tradeDate || 0);
          return dateB - dateA;
        });

      console.log('📊 Total cash flows:', allCashFlows.length);
      console.log('📊 Cash flows breakdown:', {
        buy: buyCashFlows.length,
        sell: sellCashFlows.length,
        other: otherCashFlows.length,
        total: allCashFlows.length
      });
      console.log('📊 Sample cash flow:', allCashFlows[0]);

      if (allCashFlows.length === 0) {
        console.warn('⚠️ No cash flow data found. This could mean:');
        console.warn('   1. No transactions exist in the database for this user');
        console.warn('   2. Transactions exist but have no cash_flow_on_settlement values');
        console.warn('   3. Check if you have created any buy/sell/other transactions');
      }

      setCashFlows(allCashFlows);
    } catch (err) {
      console.error('❌ Error fetching cash flow data:', err);
      console.error('❌ Error stack:', err.stack);
      setError(`Failed to load cash flow data: ${err.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const data = await portfolioAPI.getAllPortfolios();
      setPortfolios(data || []);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await accountAPI.getAllAccounts();
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const exportToCSV = () => {
    const headers = [
      'Type', 'Settlement Date', 'Trade Date', 'Portfolio', 'Symbol', 'Company',
      'Quantity', 'Price', 'Cash Flow Amount', 'Settlement Account', 'Account Name',
      'Account Number', 'Bank Name', 'Branch Name', 'Broker', 'Deal Number',
      'Contract Number', 'Payment Method', 'Description'
    ];

    const rows = filteredCashFlows.map(cf => [
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
      cf.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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
  };

  const groupedCashFlows = () => {
    console.log('📦 Grouping cash flows by:', groupBy, 'Total:', filteredCashFlows.length);
    
    if (groupBy === 'date') {
      const grouped = {};
      filteredCashFlows.forEach(cf => {
        const key = cf.settlementDate || cf.tradeDate || 'No Date';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(cf);
      });
      const result = Object.entries(grouped)
        .sort(([a], [b]) => {
          if (a === 'No Date' || b === 'No Date') return a === 'No Date' ? 1 : -1;
          return new Date(b) - new Date(a);
        })
        .map(([date, flows]) => ({ date, flows }));
      console.log('📦 Grouped by date:', result.length, 'groups');
      return result;
    } else if (groupBy === 'portfolio') {
      const grouped = {};
      filteredCashFlows.forEach(cf => {
        const key = cf.portfolio || 'N/A';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(cf);
      });
      const result = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([portfolio, flows]) => ({ portfolio, flows }));
      console.log('📦 Grouped by portfolio:', result.length, 'groups');
      return result;
    } else if (groupBy === 'account') {
      const grouped = {};
      filteredCashFlows.forEach(cf => {
        const key = cf.settlementAccount || 'N/A';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(cf);
      });
      const result = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([account, flows]) => ({ account, flows }));
      console.log('📦 Grouped by account:', result.length, 'groups');
      return result;
    }
    // No grouping
    const result = [{ flows: filteredCashFlows }];
    console.log('📦 No grouping, returning flat list:', result[0].flows.length);
    return result;
  };

  if (loading) {
    return (
      <div className="cfm-container">
        <div className="cfm-loading">
          <div className="cfm-spinner"></div>
          <p>Loading cash flow data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cfm-container">
        <div className="cfm-error">
          <p>{error}</p>
          <button onClick={fetchData} className="cfm-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cfm-container">
      <div className="cfm-header">
        <h1 className="cfm-title">Cash Flow Mapping</h1>
        <p className="cfm-subtitle">Track and manage cash flows from all transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="cfm-summary-cards">
        <div className="cfm-summary-card cfm-card-inflow">
          <div className="cfm-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="cfm-card-content">
            <div className="cfm-card-label">Total Inflows</div>
            <div className="cfm-card-value positive">{formatCurrency(summary.totalInflows)}</div>
          </div>
        </div>

        <div className="cfm-summary-card cfm-card-outflow">
          <div className="cfm-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="cfm-card-content">
            <div className="cfm-card-label">Total Outflows</div>
            <div className="cfm-card-value negative">{formatCurrency(summary.totalOutflows)}</div>
          </div>
        </div>

        <div className="cfm-summary-card cfm-card-net">
          <div className="cfm-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="cfm-card-content">
            <div className="cfm-card-label">Net Cash Flow</div>
            <div className={`cfm-card-value ${summary.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.netCashFlow)}
            </div>
          </div>
        </div>

        <div className="cfm-summary-card cfm-card-count">
          <div className="cfm-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 11H7v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z"/>
            </svg>
          </div>
          <div className="cfm-card-content">
            <div className="cfm-card-label">Total Transactions</div>
            <div className="cfm-card-value">{summary.transactionCount}</div>
            <div className="cfm-card-breakdown">
              Buy: {summary.buyCount} | Sell: {summary.sellCount} | Other: {summary.otherCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cfm-filters">
        <div className="cfm-filter-row">
          <div className="cfm-filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="cfm-input"
            />
          </div>
          <div className="cfm-filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="cfm-input"
            />
          </div>
          <div className="cfm-filter-group">
            <label>Portfolio</label>
            <select
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              className="cfm-select"
            >
              <option value="all">All Portfolios</option>
              {portfolios.map(p => (
                <option key={p.id} value={p.portfolio_name || p.name}>
                  {p.portfolio_name || p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="cfm-filter-group">
            <label>Settlement Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="cfm-select"
            >
              <option value="all">All Accounts</option>
              {[...new Set(accounts.map(a => a.account_name || a.name))].map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="cfm-filter-group">
            <label>Group By</label>
            <select
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
        </div>
        <div className="cfm-filter-row">
          <div className="cfm-filter-group cfm-search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by symbol, company, deal number, contract..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cfm-input cfm-search-input"
            />
          </div>
          <div className="cfm-filter-actions">
            <button onClick={exportToCSV} className="cfm-btn cfm-btn-export">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
              Export CSV
            </button>
            <button onClick={fetchData} className="cfm-btn cfm-btn-refresh">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="cfm-table-container">
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
                  <tr key={`${cf.id}-${index}`} className={`cfm-row cfm-row-${cf.type.toLowerCase()}`}>
                    <td>
                      <span className={`cfm-type-badge cfm-type-${cf.type.toLowerCase()}`}>
                        {cf.type}
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
            {filteredCashFlows.length === 0 && cashFlows.length === 0 && !loading && (
              <tr>
                <td colSpan="14" className="cfm-empty">
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#4a5568' }}>
                      <strong>No cash flow data found.</strong>
                    </p>
                    <p style={{ color: '#718096', marginBottom: '0.5rem' }}>
                      This could mean:
                    </p>
                    <ul style={{ textAlign: 'left', display: 'inline-block', color: '#718096' }}>
                      <li>No transactions exist in the database for your account</li>
                      <li>Transactions exist but don't have cash flow settlement information</li>
                      <li>You need to create buy/sell transactions first</li>
                    </ul>
                    <p style={{ marginTop: '1rem', color: '#718096', fontSize: '0.9rem' }}>
                      Try creating a transaction from the <strong>Trade Capture</strong> section.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredCashFlows.length === 0 && cashFlows.length > 0 && !loading && (
              <tr>
                <td colSpan="14" className="cfm-empty">
                  No cash flow data found matching the selected filters. Try adjusting your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowMapping;

