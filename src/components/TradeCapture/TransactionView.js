import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { transactionEntryAPI } from '../../services/api';
import TransactionDetailsModal from './TransactionDetailsModal';
import './Styles/TransactionView.css';

const ENTRIES_PER_PAGE = 25;

const normalizeDateKey = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const getCompany = (tx) => tx.company_name || tx.companyName || '';
const getPortfolio = (tx) => tx.portfolio || tx.portfolio_name || tx.portfolioName || '';
const getDeal = (tx) => tx.deal_number || tx.contract_number || tx.contractNumber || '';
const getContract = (tx) => tx.contract_number || tx.contractNumber || '';
const getBroker = (tx) => tx.broker_name || tx.brokerName || '';
const getTradeDate = (tx) => tx.trade_date || tx.tradeDate || tx.created_at || '';

const TransactionView = ({ onTabChange }) => {
  const [buyTransactions, setBuyTransactions] = useState([]);
  const [sellTransactions, setSellTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'buy', 'sell'
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dealNumberSearch, setDealNumberSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [buyData, sellData] = await Promise.all([
        transactionEntryAPI.getAllBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions(),
      ]);
      setBuyTransactions(Array.isArray(buyData) ? buyData : []);
      setSellTransactions(Array.isArray(sellData) ? sellData : []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setBuyTransactions([]);
      setSellTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCompany, selectedPortfolio, dateFrom, dateTo, searchTerm, dealNumberSearch]);

  const allTransactions = useMemo(
    () =>
      [
        ...buyTransactions.map((tx) => ({ ...tx, type: 'BUY' })),
        ...sellTransactions.map((tx) => ({ ...tx, type: 'SELL' })),
      ].sort(
        (a, b) =>
          new Date(getTradeDate(b) || 0).getTime() - new Date(getTradeDate(a) || 0).getTime()
      ),
    [buyTransactions, sellTransactions]
  );

  const companies = useMemo(
    () =>
      [...new Set(allTransactions.map(getCompany).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allTransactions]
  );

  const portfolios = useMemo(
    () =>
      [...new Set(allTransactions.map(getPortfolio).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allTransactions]
  );

  const applySharedFilters = useCallback(
    (transactions) => {
      const search = searchTerm.trim().toLowerCase();
      const dealSearch = dealNumberSearch.trim().toLowerCase();

      return transactions.filter((tx) => {
        if (selectedCompany && getCompany(tx) !== selectedCompany) return false;
        if (selectedPortfolio && getPortfolio(tx) !== selectedPortfolio) return false;

        const dateKey = normalizeDateKey(getTradeDate(tx));
        if (dateFrom && (!dateKey || dateKey < dateFrom)) return false;
        if (dateTo && (!dateKey || dateKey > dateTo)) return false;

        if (dealSearch) {
          const deal = String(getDeal(tx) || '').toLowerCase();
          if (!deal.includes(dealSearch)) return false;
        }

        if (search) {
          const haystack = [
            tx.type,
            getCompany(tx),
            getPortfolio(tx),
            getDeal(tx),
            getContract(tx),
            getBroker(tx),
            tx.symbol || '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }

        return true;
      });
    },
    [selectedCompany, selectedPortfolio, dateFrom, dateTo, searchTerm, dealNumberSearch]
  );

  const filteredTransactions = useMemo(() => {
    const byTab =
      activeTab === 'all'
        ? allTransactions
        : activeTab === 'buy'
          ? allTransactions.filter((tx) => tx.type === 'BUY')
          : allTransactions.filter((tx) => tx.type === 'SELL');

    return applySharedFilters(byTab);
  }, [activeTab, allTransactions, applySharedFilters]);

  const allTabCount = useMemo(
    () => applySharedFilters(allTransactions).length,
    [allTransactions, applySharedFilters]
  );

  const buyCount = useMemo(
    () => applySharedFilters(allTransactions.filter((tx) => tx.type === 'BUY')).length,
    [allTransactions, applySharedFilters]
  );

  const sellCount = useMemo(
    () => applySharedFilters(allTransactions.filter((tx) => tx.type === 'SELL')).length,
    [allTransactions, applySharedFilters]
  );

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ENTRIES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfFirst = filteredTransactions.length === 0 ? 0 : (safePage - 1) * ENTRIES_PER_PAGE;
  const indexOfLast = Math.min(safePage * ENTRIES_PER_PAGE, filteredTransactions.length);
  const currentEntries = filteredTransactions.slice(indexOfFirst, indexOfLast);

  const formatCurrency = (value) =>
    parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const calculatePricePerShare = (transaction) => {
    const netValue = parseFloat(transaction.net_value || transaction.netValue || 0);
    const quantity = parseFloat(transaction.quantity || 0);
    if (quantity === 0) return 0;
    return netValue / quantity;
  };

  const getPrice = (transaction) =>
    transaction.type === 'SELL'
      ? transaction.sold_price || transaction.soldPrice || transaction.price || 0
      : transaction.price || transaction.boughtPrice || 0;

  const clearFilters = () => {
    setSelectedCompany('');
    setSelectedPortfolio('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setDealNumberSearch('');
    setCurrentPage(1);
  };

  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleSave = async () => {
    await fetchTransactions();
  };

  const buildExportRows = (rows) =>
    rows.map((tx) => ({
      Type: tx.type,
      Company: getCompany(tx) || '',
      Portfolio: getPortfolio(tx) || '',
      'Deal Number': getDeal(tx) || '',
      Quantity: Number(tx.quantity) || 0,
      Price: Number(getPrice(tx)) || 0,
      'Gross Value': Number(tx.gross_value || tx.grossValue) || 0,
      'Net Value': Number(tx.net_value || tx.netValue) || 0,
      'Avg Price/Share': Number(calculatePricePerShare(tx)) || 0,
      'Trade Date': formatDate(getTradeDate(tx)),
      'Settlement Date': formatDate(tx.settlement_date || tx.settlementDate),
      Broker: getBroker(tx) || '',
      'Contract #': getContract(tx) || '',
      'Money Gen Cost': Number(tx.money_generation_cost || tx.moneyGenerationCost) || 0,
      'Capital Gain': Number(tx.capital_gain || tx.capitalGain) || 0,
    }));

  const handleExportExcel = () => {
    setExporting(true);
    setExportError('');
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const data = buildExportRows(filteredTransactions);
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 18 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      XLSX.writeFile(wb, `all-transactions-${stamp}.xlsx`);
    } catch (err) {
      console.error('Failed to export transactions Excel:', err);
      setExportError(err.message || 'Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    setExportError('');
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(14);
      doc.text('All Transactions', 40, 36);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const filterSummary = [
        `Tab=${activeTab}`,
        selectedCompany ? `Company=${selectedCompany}` : null,
        selectedPortfolio ? `Portfolio=${selectedPortfolio}` : null,
        dateFrom ? `From=${dateFrom}` : null,
        dateTo ? `To=${dateTo}` : null,
        searchTerm ? `Search="${searchTerm}"` : null,
        dealNumberSearch ? `Deal=${dealNumberSearch}` : null,
        `Rows=${filteredTransactions.length}`,
      ]
        .filter(Boolean)
        .join('  •  ');

      doc.text(filterSummary || `Export date: ${stamp}`, 40, 52);
      doc.setTextColor(15, 23, 42);

      const body = filteredTransactions.map((tx) => [
        tx.type,
        getCompany(tx) || '',
        getPortfolio(tx) || '',
        getDeal(tx) || '',
        formatCurrency(tx.quantity),
        formatCurrency(getPrice(tx)),
        formatCurrency(tx.gross_value || tx.grossValue),
        formatCurrency(tx.net_value || tx.netValue),
        formatCurrency(calculatePricePerShare(tx)),
        formatDate(getTradeDate(tx)),
        formatDate(tx.settlement_date || tx.settlementDate),
        getBroker(tx) || '',
        getContract(tx) || '',
      ]);

      autoTable(doc, {
        startY: 66,
        head: [[
          'Type',
          'Company',
          'Portfolio',
          'Deal #',
          'Qty',
          'Price',
          'Gross',
          'Net',
          'Avg/Share',
          'Trade Date',
          'Settle Date',
          'Broker',
          'Contract #',
        ]],
        body,
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 28, right: 28 },
      });

      doc.save(`all-transactions-${stamp}.pdf`);
    } catch (err) {
      console.error('Failed to export transactions PDF:', err);
      setExportError(err.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters =
    !!selectedCompany ||
    !!selectedPortfolio ||
    !!dateFrom ||
    !!dateTo ||
    !!searchTerm.trim() ||
    !!dealNumberSearch.trim();

  return (
    <div className="transaction-view-container">
      <div className="transaction-view-header">
        <h2 className="transaction-view-title">All Transactions</h2>
        <div className="transaction-header-controls">
          <button
            type="button"
            className="transaction-export-btn"
            onClick={handleExportPdf}
            disabled={loading || exporting || filteredTransactions.length === 0}
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            type="button"
            className="transaction-export-btn"
            onClick={handleExportExcel}
            disabled={loading || exporting || filteredTransactions.length === 0}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
          <button
            type="button"
            onClick={fetchTransactions}
            className="transaction-refresh-btn"
            disabled={loading}
          >
            <svg className="refresh-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <section className="transaction-filters" aria-label="Transaction filters">
        <div className="transaction-filters__row">
          <div className="transaction-filter-field">
            <label htmlFor="tx-date-from">Date From</label>
            <input
              id="tx-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="transaction-filter-field">
            <label htmlFor="tx-date-to">Date To</label>
            <input
              id="tx-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="transaction-filter-field">
            <label htmlFor="company-filter">Company</label>
            <select
              id="company-filter"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={loading}
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div className="transaction-filter-field">
            <label htmlFor="portfolio-filter">Portfolio</label>
            <select
              id="portfolio-filter"
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              disabled={loading}
            >
              <option value="">All Portfolios</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio} value={portfolio}>
                  {portfolio}
                </option>
              ))}
            </select>
          </div>
          <div className="transaction-filter-field">
            <label htmlFor="tx-deal-search">Deal Number</label>
            <input
              id="tx-deal-search"
              type="search"
              placeholder="e.g. BUY-20260721-000098"
              value={dealNumberSearch}
              onChange={(e) => setDealNumberSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="transaction-filter-field transaction-filter-field--search">
            <label htmlFor="tx-search">Search</label>
            <input
              id="tx-search"
              type="search"
              placeholder="Company, portfolio, broker…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="transaction-filter-actions">
            <button
              type="button"
              className="transaction-clear-btn"
              onClick={clearFilters}
              disabled={loading || !hasActiveFilters}
            >
              Clear
            </button>
          </div>
        </div>
        {exportError && (
          <p className="transaction-export-error" role="alert">
            {exportError}
          </p>
        )}
      </section>

      <div className="transaction-tabs" role="tablist" aria-label="Transaction type">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`transaction-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="transaction-tab__label">All Transactions</span>
          <span className="transaction-tab__count">{allTabCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'buy'}
          className={`transaction-tab transaction-tab--buy ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          <span className="transaction-tab__label">Buy Transactions</span>
          <span className="transaction-tab__count">{buyCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sell'}
          className={`transaction-tab transaction-tab--sell ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          <span className="transaction-tab__label">Sell Transactions</span>
          <span className="transaction-tab__count">{sellCount}</span>
        </button>
      </div>

      <div className="transaction-table-container">
        {loading ? (
          <div className="transaction-loading">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="transaction-empty">No transactions found.</div>
        ) : (
          <>
            <div className="transaction-table-wrapper">
              <table className="transaction-table">
                <thead className="transaction-table-head">
                  <tr>
                    <th>Type</th>
                    <th>Company</th>
                    <th>Portfolio</th>
                    <th>Deal Number</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Gross Value</th>
                    <th>Net Value</th>
                    <th>Avg Price/Share</th>
                    <th>Trade Date</th>
                    <th>Settlement Date</th>
                    <th>Broker</th>
                    <th>Contract #</th>
                    {activeTab !== 'sell' && <th>Money Gen Cost (Daily)</th>}
                    {activeTab !== 'buy' && <th>Capital Gain</th>}
                  </tr>
                </thead>
                <tbody className="transaction-table-body">
                  {currentEntries.map((transaction) => (
                    <tr
                      key={`${transaction.type}-${transaction.id}`}
                      className={`transaction-row ${transaction.type.toLowerCase()}-row`}
                      onClick={() => handleRowClick(transaction)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="transaction-type-cell">
                        <span className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="transaction-company-cell">{getCompany(transaction) || '-'}</td>
                      <td className="transaction-portfolio-cell">{getPortfolio(transaction) || '-'}</td>
                      <td className="transaction-deal-cell">{getDeal(transaction) || '-'}</td>
                      <td className="transaction-quantity-cell">
                        {formatCurrency(transaction.quantity)}
                      </td>
                      <td className="transaction-price-cell">
                        {formatCurrency(getPrice(transaction))}
                      </td>
                      <td className="transaction-gross-cell">
                        {formatCurrency(transaction.gross_value || transaction.grossValue)}
                      </td>
                      <td className="transaction-net-cell">
                        {formatCurrency(transaction.net_value || transaction.netValue)}
                      </td>
                      <td className="transaction-avg-price-cell">
                        {formatCurrency(calculatePricePerShare(transaction))}
                      </td>
                      <td className="transaction-trade-date-cell">
                        {formatDate(getTradeDate(transaction))}
                      </td>
                      <td className="transaction-settlement-date-cell">
                        {formatDate(transaction.settlement_date || transaction.settlementDate)}
                      </td>
                      <td className="transaction-broker-cell">{getBroker(transaction) || '-'}</td>
                      <td className="transaction-contract-cell">{getContract(transaction) || '-'}</td>
                      {activeTab !== 'sell' && (
                        <td className="transaction-money-gen-cell">
                          {formatCurrency(
                            transaction.money_generation_cost || transaction.moneyGenerationCost
                          )}
                        </td>
                      )}
                      {activeTab !== 'buy' && (
                        <td className="transaction-capital-gain-cell">
                          {formatCurrency(transaction.capital_gain || transaction.capitalGain)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="transaction-pagination">
                <button
                  type="button"
                  className="transaction-pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={safePage === 1}
                >
                  Previous
                </button>
                <div className="transaction-pagination-info">
                  Page {safePage} of {totalPages}
                  <span>
                    Showing {indexOfFirst + 1}–{indexOfLast} of {filteredTransactions.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="transaction-pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={safePage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default TransactionView;
