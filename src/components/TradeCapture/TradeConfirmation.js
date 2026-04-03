import React, { useState, useEffect, useCallback } from 'react';
import { parsedTradeTransactionAPI, equityAPI, portfolioAPI } from '../../services/api';
import {
  getLatestDayTradeReportState,
  exportTradeReportToExcel as emitTradeReportExcel,
  exportTradeReportToPdf as emitTradeReportPdf,
  formatTradeDate,
  formatCurrency,
  calculateTransactionValue,
  calculateFees,
  getContractNo,
  calculateNetAmount,
  calculateReportTotals
} from '../../utils/tradeReportExport';
import UpdateBuyTransactionsModal from './UpdateBuyTransactionsModal';
import UpdateSellTransactionsModal from './UpdateSellTransactionsModal';
import './Styles/TradeConfirmation.css';
import ExportPdfExcelButtons from '../FinancialReporting/ExportPdfExcelButtons';

const TradeConfirmation = () => {
  const [activeTab, setActiveTab] = useState('purchases');
  const [groupedData, setGroupedData] = useState({ sales: {}, purchases: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [latestTradeDate, setLatestTradeDate] = useState(null);
  const [showUpdateBuyModal, setShowUpdateBuyModal] = useState(false);
  const [showUpdateSellModal, setShowUpdateSellModal] = useState(false);
  const [equities, setEquities] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [unupdatedByDate, setUnupdatedByDate] = useState({});
  const [unupdatedTransactions, setUnupdatedTransactions] = useState([]);
  const [unupdatedLoading, setUnupdatedLoading] = useState(false);
  const [unupdatedError, setUnupdatedError] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await parsedTradeTransactionAPI.getParsedTransactions();
      const { latestTradeDate: ld, groupedData: gd } = getLatestDayTradeReportState(data || []);
      setLatestTradeDate(ld);
      setGroupedData(gd);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchUnupdatedTransactions = useCallback(async () => {
    try {
      setUnupdatedLoading(true);
      setUnupdatedError('');
      const data = await parsedTradeTransactionAPI.getUnupdatedParsedTransactions();
      setUnupdatedTransactions(data || []);
      const grouped = (data || []).reduce((acc, transaction) => {
        const date = transaction.trade_date || 'Unknown';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(transaction);
        return acc;
      }, {});
      setUnupdatedByDate(grouped);
    } catch (err) {
      console.error('Error fetching unupdated transactions:', err);
      setUnupdatedError('Failed to fetch unupdated transactions. Please try again.');
    } finally {
      setUnupdatedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'to-be-updated' || activeTab === 'update-portfolio') {
      fetchUnupdatedTransactions();
    }
  }, [activeTab, fetchUnupdatedTransactions, showUpdateBuyModal, showUpdateSellModal]);

  const reportDate = latestTradeDate ? formatTradeDate(latestTradeDate) : 'N/A';

  const calculateGroupTotals = (groupTransactions) => {
    let totalAmount = 0;
    let totalQuantity = 0;
    let totalBrokerage = 0;
    let totalClearingFees = 0;
    let totalGovernmentCess = 0;
    let totalFees = 0;
    let totalNet = 0;
    let avgPrice = 0;

    groupTransactions.forEach(t => {
      const value = calculateTransactionValue(t);
      const qty = parseFloat(t.quantity) || 0;
      const brokerage = parseFloat(t.brokerage) || 0;
      const clearingFees = parseFloat(t.clearing_fees) || 0;
      const governmentCess = parseFloat(t.government_cess) || 0;
      const fees = calculateFees(t);
      const net = value - fees;

      totalAmount += value;
      totalQuantity += qty;
      totalBrokerage += brokerage;
      totalClearingFees += clearingFees;
      totalGovernmentCess += governmentCess;
      totalFees += fees;
      totalNet += net;
    });

    avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    return {
      totalAmount,
      totalQuantity,
      totalBrokerage,
      totalClearingFees,
      totalGovernmentCess,
      totalFees,
      totalNet,
      avgPrice
    };
  };

  const renderCompanyGroup = (companyId, transactions, type) => {
    const totals = calculateGroupTotals(transactions);
    const isSale = type === 'sale';

    return (
      <div key={companyId} className="tc-company-group">
        <div className="tc-company-header">
          <span className={`tc-company-badge ${isSale ? 'tc-company-badge--sale' : 'tc-company-badge--purchase'}`}>
            {isSale ? 'Sale' : 'Purchase'}
          </span>
          <h3 className="tc-company-title">
            {companyId} <span className="tc-company-symbol">({companyId}.N0000 / LK{companyId.padStart(4, '0')}N00000)</span>
          </h3>
        </div>

        <div className="tc-table-container">
          <table className="tc-transaction-table">
             <thead>
               <tr className="tc-table-header-row">
                 <th scope="col" className="tc-col-trade-date">Trade Date</th>
                 <th scope="col" className="tc-col-amount">Amount</th>
                 <th scope="col" className="tc-col-qty">Qty</th>
                 <th scope="col" className="tc-col-brokerage">Brokerage</th>
                 <th scope="col" className="tc-col-price">Price</th>
                 <th scope="col" className="tc-col-clearing">Clearing Fees</th>
                 <th scope="col" className="tc-col-cse">CSE Fees</th>
                 <th scope="col" className="tc-col-gov-cess">Government Cess</th>
                 <th scope="col" className="tc-col-net">Net Amount</th>
                 <th scope="col" className="tc-col-exec-id">Execution ID</th>
                 <th scope="col" className="tc-col-settlement">Settlement Date</th>
               </tr>
             </thead>
            <tbody>
              {transactions.map((transaction, index) => {
                const value = calculateTransactionValue(transaction);
                const qty = parseFloat(transaction.quantity) || 0;
                const price = parseFloat(transaction.price) || 0;
                const brokerage = parseFloat(transaction.brokerage) || 0;
                const clearingFees = parseFloat(transaction.clearing_fees) || 0;
                const cseFees = parseFloat(transaction.cse_fees) || 0;
                const governmentCess = parseFloat(transaction.government_cess) || 0;
                const fees = calculateFees(transaction);
                const netAmount = value - fees;

                 return (
                   <tr key={index} className="tc-transaction-row">
                     <td className="tc-col-trade-date">{transaction.trade_date || 'N/A'}</td>
                     <td className="tc-col-amount">{formatCurrency(value)}</td>
                     <td className="tc-col-qty">{formatCurrency(qty)}</td>
                     <td className="tc-col-brokerage">{formatCurrency(brokerage)}</td>
                     <td className="tc-col-price">{formatCurrency(price)}</td>
                     <td className="tc-col-clearing">{formatCurrency(clearingFees)}</td>
                     <td className="tc-col-cse">{formatCurrency(cseFees)}</td>
                     <td className="tc-col-gov-cess">{formatCurrency(governmentCess)}</td>
                     <td className="tc-col-net">{formatCurrency(netAmount)}</td>
                     <td className="tc-col-exec-id">{transaction.execution_id || 'N/A'}</td>
                     <td className="tc-col-settlement">{transaction.settlement_date || 'N/A'}</td>
                   </tr>
                 );
              })}
            </tbody>
             <tfoot>
               <tr className="tc-total-row">
                 <td className="tc-col-trade-date">
                   <strong>Total</strong>
                 </td>
                 <td className="tc-col-amount">{formatCurrency(totals.totalAmount)}</td>
                 <td className="tc-col-qty">{formatCurrency(totals.totalQuantity)}</td>
                 <td className="tc-col-brokerage">{formatCurrency(totals.totalBrokerage)}</td>
                 <td className="tc-col-price">{formatCurrency(totals.avgPrice)}</td>
                 <td className="tc-col-clearing">{formatCurrency(totals.totalClearingFees)}</td>
                 <td className="tc-col-cse">{formatCurrency(totals.totalFees - totals.totalBrokerage - totals.totalClearingFees - totals.totalGovernmentCess)}</td>
                 <td className="tc-col-gov-cess">{formatCurrency(totals.totalGovernmentCess)}</td>
                 <td className="tc-col-net">{formatCurrency(totals.totalNet)}</td>
                 <td className="tc-col-exec-id" colSpan="2"></td>
               </tr>
             </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="tc-container">
        <div className="tc-loading">
          <div className="tc-spinner"></div>
          <p>Loading Trade Confirmations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tc-container">
        <div className="tc-error">
          <h3>Error Loading Trade Confirmations</h3>
          <p>{error}</p>
          <button onClick={fetchTransactions} className="tc-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const renderPurchases = () => {
    const hasPurchases = Object.keys(groupedData.purchases).length > 0;

    return (
      <>
        {!hasPurchases ? (
          <div className="tc-no-data">
            <p>No purchase transactions found.</p>
          </div>
        ) : (
          Object.entries(groupedData.purchases).map(([companyId, transactions]) =>
            renderCompanyGroup(companyId, transactions, 'purchase')
          )
        )}
      </>
    );
  };

  const renderSales = () => {
    const hasSales = Object.keys(groupedData.sales).length > 0;
    
    return (
      <>
        {!hasSales ? (
          <div className="tc-no-data">
            <p>No sales transactions found.</p>
          </div>
        ) : (
          Object.entries(groupedData.sales).map(([companyId, transactions]) =>
            renderCompanyGroup(companyId, transactions, 'sale')
          )
        )}
      </>
    );
  };

  const renderToBeUpdated = () => {
    if (unupdatedLoading) {
      return (
        <div className="tc-loading">
          <div className="tc-spinner"></div>
          <p>Loading pending updates...</p>
        </div>
      );
    }

    if (unupdatedError) {
      return (
        <div className="tc-error">
          <h3>Error Loading Pending Updates</h3>
          <p>{unupdatedError}</p>
          <button onClick={fetchUnupdatedTransactions} className="tc-retry-btn">Retry</button>
        </div>
      );
    }

    const dates = Object.keys(unupdatedByDate).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return new Date(b) - new Date(a);
    });

    if (dates.length === 0) {
      return (
        <div className="tc-no-data">
          <p>No pending transactions to update.</p>
        </div>
      );
    }

    return (
      <div className="tc-unupdated-list">
        {dates.map(date => (
          <div key={date} className="tc-unupdated-group">
            <div className="tc-unupdated-header">
              <h3>Trade Date: {date}</h3>
            </div>
            <div className="tc-table-container">
              <table className="tc-unupdated-table">
                <thead>
                  <tr className="tc-table-header-row">
                    <th>Buy/Sell</th>
                    <th>Company</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Execution ID</th>
                    <th>Settlement Date</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {unupdatedByDate[date].map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{(transaction.buy_sell || '').toUpperCase() || 'N/A'}</td>
                      <td>{transaction.company_id || 'N/A'}</td>
                      <td>{formatCurrency(transaction.quantity)}</td>
                      <td>{formatCurrency(transaction.price)}</td>
                      <td>{transaction.execution_id || 'N/A'}</td>
                      <td>{transaction.settlement_date || 'N/A'}</td>
                      <td className="tc-unupdated-reason">
                        {transaction.not_updated_reason || 'Not saved yet'}
                          </td>
                        </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const fetchEquitiesAndPortfolios = async () => {
    try {
      const [equitiesData, portfoliosData] = await Promise.all([
        equityAPI.getAllEquities(),
        portfolioAPI.getAllPortfolios()
      ]);
      setEquities(equitiesData);
      setPortfolios(portfoliosData);
    } catch (err) {
      console.error('Error fetching equities/portfolios:', err);
    }
  };

  const handleUpdateBuyTransactions = () => {
    setShowUpdateBuyModal(true);
    fetchEquitiesAndPortfolios();
    fetchUnupdatedTransactions();
  };

  const handleUpdateSellTransactions = () => {
    setShowUpdateSellModal(true);
    fetchEquitiesAndPortfolios();
    fetchUnupdatedTransactions();
  };

  const renderUpdatePortfolio = () => {
    if (unupdatedLoading) {
      return (
        <div className="tc-loading">
          <div className="tc-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      );
    }

    if (unupdatedError) {
      return (
        <div className="tc-error">
          <h3>Error Loading Transactions</h3>
          <p>{unupdatedError}</p>
          <button onClick={fetchUnupdatedTransactions} className="tc-retry-btn">Retry</button>
        </div>
      );
    }

    // Only use unupdated transactions from database (checked against parsed_trade_transaction_save_logs)
    const purchaseTransactions = (unupdatedTransactions || []).filter(t => 
      (t.buy_sell || '').toUpperCase() === 'B'
    );
    const sellTransactions = (unupdatedTransactions || []).filter(t => 
      (t.buy_sell || '').toUpperCase() === 'S'
    );

    const formatNumber = (value) => {
      if (!value || value === 0) return '0.00';
      return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const getSummary = (transactions) => {
      const totalQuantity = transactions.reduce((sum, t) => {
        return sum + (parseFloat(t.quantity) || 0);
      }, 0);

      const totalValue = transactions.reduce((sum, t) => {
        return sum + calculateTransactionValue(t);
      }, 0);

      // Get unique companies from transactions
      const companies = [...new Set(transactions.map(t => t.company_id).filter(Boolean))];

      return {
        count: transactions.length,
        totalQuantity,
        totalValue,
        companies
      };
    };

    const purchaseSummary = getSummary(purchaseTransactions);
    const sellSummary = getSummary(sellTransactions);

    const purchaseCompanies = purchaseSummary.companies;
    const sellCompanies = sellSummary.companies;

    // Show message if no unupdated transactions
    if (purchaseTransactions.length === 0 && sellTransactions.length === 0) {
      return (
        <div className="tc-no-data">
          <p>No pending transactions to update. All transactions have been saved to the portfolio.</p>
        </div>
      );
    }

    return (
      <div className="tc-update-portfolio">
        <div className="tc-update-summary">
          <div className="tc-update-summary-header">
            <h2>Transactions Ready to Update</h2>
            <p>
              Convert these uploaded trade transactions into portfolio entries with automatic journal entries.
            </p>
          </div>
          <div className="tc-update-summary-grid">
            <div className="tc-update-card tc-update-card-buy">
              <div className="tc-update-card-header">
                <h3>Buy Transactions</h3>
                <span className="tc-update-count">{purchaseSummary.count} transactions</span>
              </div>
              <div className="tc-update-metrics">
                <div className="tc-update-metric">
                  <span>Companies:</span>
                  <strong>{purchaseCompanies.length}</strong>
                </div>
                <div className="tc-update-metric">
                  <span>Total Quantity:</span>
                  <strong>{formatNumber(purchaseSummary.totalQuantity)}</strong>
                </div>
                <div className="tc-update-metric">
                  <span>Total Value:</span>
                  <strong>Rs. {formatCurrency(purchaseSummary.totalValue)}</strong>
                </div>
              </div>
              <div className="tc-update-companies">
                <span>Companies:</span>
                <strong>
                  {purchaseCompanies.length > 0 ? purchaseCompanies.join(', ') : 'N/A'}
                </strong>
              </div>
              <button onClick={handleUpdateBuyTransactions} className="tc-update-btn tc-update-buy-btn">
                Update Buy Transactions
              </button>
            </div>

            <div className="tc-update-card tc-update-card-sell">
              <div className="tc-update-card-header">
                <h3>Sell Transactions</h3>
                <span className="tc-update-count">{sellSummary.count} transactions</span>
              </div>
              <div className="tc-update-metrics">
                <div className="tc-update-metric">
                  <span>Companies:</span>
                  <strong>{sellCompanies.length}</strong>
                </div>
                <div className="tc-update-metric">
                  <span>Total Quantity:</span>
                  <strong>{formatNumber(sellSummary.totalQuantity)}</strong>
                </div>
                <div className="tc-update-metric">
                  <span>Total Value:</span>
                  <strong>Rs. {formatCurrency(sellSummary.totalValue)}</strong>
                </div>
              </div>
              <div className="tc-update-companies">
                <span>Companies:</span>
                <strong>
                  {sellCompanies.length > 0 ? sellCompanies.join(', ') : 'N/A'}
                </strong>
                 </div>
              <button onClick={handleUpdateSellTransactions} className="tc-update-btn tc-update-sell-btn">
                Update Sell Transactions
              </button>
                 </div>
               </div>
             </div>
        {showUpdateBuyModal && (
          <UpdateBuyTransactionsModal
            isOpen={showUpdateBuyModal}
            onClose={() => setShowUpdateBuyModal(false)}
            purchaseTransactions={purchaseTransactions}
            equities={equities}
            portfolios={portfolios}
            latestTradeDate={latestTradeDate}
          />
        )}
        {showUpdateSellModal && (
          <UpdateSellTransactionsModal
            isOpen={showUpdateSellModal}
            onClose={() => setShowUpdateSellModal(false)}
            sellTransactions={sellTransactions}
            equities={equities}
            portfolios={portfolios}
            latestTradeDate={latestTradeDate}
          />
        )}
      </div>
    );
  };

  const renderTradeReport = () => {
    const renderReportSection = (companyId, transactions, type) => {
      const totals = calculateReportTotals(transactions);
      const isSale = type === 'sale';

      return (
        <div key={`${type}-${companyId}`} className="tc-report-section">
          <div className="tc-report-section-header">
            <h3>
              {isSale ? 'Sale of' : 'Purchase of'} {companyId}{' '}
              ({companyId}.N0000 / LK{companyId.padStart(4, '0')}N00000)
            </h3>
          </div>
          <div className="tc-report-table-wrapper">
            <table className="tc-report-table">
              <thead>
                <tr>
                  <th>Trade Date</th>
                  <th>Contract No</th>
                  <th>No of Shares</th>
                  <th>Price/Avg</th>
                  <th>Gross Amount</th>
                  <th>Brokerage</th>
                  <th>SEC</th>
                  <th>Exchange</th>
                  <th>CDS</th>
                  <th>GOV CESS</th>
                  <th>Clearing Fees</th>
                  <th>Net Amount</th>
                  <th>Settlement</th>
                  <th>Foreign Brokerage</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => {
                  const value = calculateTransactionValue(t);
                  return (
                    <tr key={`${companyId}-${idx}`}>
                      <td>{t.trade_date || 'N/A'}</td>
                      <td>{getContractNo(t)}</td>
                      <td>{formatCurrency(t.quantity)}</td>
                      <td>{formatCurrency(t.price)}</td>
                      <td>{formatCurrency(value)}</td>
                      <td>{formatCurrency(t.brokerage)}</td>
                      <td>{formatCurrency(t.sec_cess)}</td>
                      <td>{formatCurrency(t.cse_fees)}</td>
                      <td>{formatCurrency(t.cds_fees)}</td>
                      <td>{formatCurrency(t.government_cess)}</td>
                      <td>{formatCurrency(t.clearing_fees)}</td>
                      <td>{formatCurrency(calculateNetAmount(t))}</td>
                      <td>{t.settlement_date || 'N/A'}</td>
                      <td>{formatCurrency(t.foreign_brokerage)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td></td>
                  <td>{formatCurrency(totals.quantity)}</td>
                  <td></td>
                  <td>{formatCurrency(totals.gross)}</td>
                  <td>{formatCurrency(totals.brokerage)}</td>
                  <td>{formatCurrency(totals.sec)}</td>
                  <td>{formatCurrency(totals.exchange)}</td>
                  <td>{formatCurrency(totals.cds)}</td>
                  <td>{formatCurrency(totals.govCess)}</td>
                  <td>{formatCurrency(totals.clearing)}</td>
                  <td>{formatCurrency(totals.net)}</td>
                  <td></td>
                  <td>{formatCurrency(totals.foreignBrokerage)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    };

    const purchaseGroups = Object.entries(groupedData.purchases);
    const saleGroups = Object.entries(groupedData.sales);
    const purchaseTotals = calculateReportTotals(Object.values(groupedData.purchases).flat());
    const saleTotals = calculateReportTotals(Object.values(groupedData.sales).flat());
    const netSettlement = saleTotals.net - purchaseTotals.net;

    return (
      <div className="tc-trade-report">
        <div className="tc-trade-report-header">
          <p>Dear Sir/Madam,</p>
          <p>
            We wish to inform you that the following transaction(s) were done on {reportDate}.
          </p>
        </div>

        {saleGroups.map(([companyId, transactions]) =>
          renderReportSection(companyId, transactions, 'sale')
        )}

        {purchaseGroups.map(([companyId, transactions]) =>
          renderReportSection(companyId, transactions, 'purchase')
        )}

        <div className="tc-trade-report-summary">
          <div className="tc-trade-report-summary-row">
            <span>Purchase Total</span>
            <strong>{formatCurrency(purchaseTotals.net)}</strong>
          </div>
          <div className="tc-trade-report-summary-row">
            <span>Sales Total</span>
            <strong>{formatCurrency(saleTotals.net)}</strong>
          </div>
          <div className="tc-trade-report-summary-row tc-trade-report-net">
            <span>Net Settlement Value</span>
            <strong>{formatCurrency(netSettlement)}</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tc-container">
      <div className="tc-header-section">
        <div className="tc-header-left">
          <div className="tc-header-icon-wrap" aria-hidden="true">
            <svg className="tc-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <div className="tc-header-text-group">
            <h1 className="tc-main-title">Trade Confirmation</h1>
            <p className="tc-subtitle">
              {latestTradeDate
                ? `Trade report for ${formatTradeDate(latestTradeDate)}`
                : 'Review and manage parsed trade confirmations'}
            </p>
          </div>
        </div>
        <div className="tc-header-right">
          {latestTradeDate ? (
            <div className="tc-header-meta-badge" title="Latest trade date in uploaded data">
              <span className="tc-header-meta-label">Latest trade date</span>
              <span className="tc-header-meta-value">{formatTradeDate(latestTradeDate)}</span>
            </div>
          ) : (
            <span className="tc-header-meta-badge tc-header-meta-badge--empty">No trade sessions loaded</span>
          )}
          {activeTab === 'trade-report' ? (
            <div className="tc-trade-report-export">
              <ExportPdfExcelButtons
                exportDisabled={!latestTradeDate}
                onExportExcel={() =>
                  emitTradeReportExcel({ groupedData, latestTradeDate })
                }
                onExportPdf={() => emitTradeReportPdf({ groupedData, latestTradeDate })}
              />
            </div>
          ) : null}
          <button type="button" onClick={fetchTransactions} className="tc-refresh-btn">
            Refresh
          </button>
        </div>
      </div>
      <div className="tc-tabs-card">
        <div className="tc-tabs">
          <button
            className={`tc-tab ${activeTab === 'purchases' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            Purchases
          </button>
          <button
            className={`tc-tab ${activeTab === 'sales' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales
          </button>
          <button
            className={`tc-tab ${activeTab === 'trade-report' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('trade-report')}
          >
            Trade Report
          </button>
          <button
            className={`tc-tab ${activeTab === 'to-be-updated' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('to-be-updated')}
          >
            To Be Updated
          </button>
          <button
            className={`tc-tab ${activeTab === 'update-portfolio' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('update-portfolio')}
          >
            Update Portfolio
          </button>
        </div>
      </div>

      <div className="tc-tab-content">
        {activeTab === 'purchases' && renderPurchases()}
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'trade-report' && renderTradeReport()}
        {activeTab === 'to-be-updated' && renderToBeUpdated()}
        {activeTab === 'update-portfolio' && renderUpdatePortfolio()}
      </div>
    </div>
  );
};

export default TradeConfirmation;
