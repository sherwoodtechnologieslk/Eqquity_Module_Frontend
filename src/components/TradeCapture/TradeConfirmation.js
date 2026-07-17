import React, { useState, useEffect, useCallback } from 'react';
import { parsedTradeTransactionAPI, equityAPI, portfolioAPI, transactionEntryAPI } from '../../services/api';
import {
  getLatestDayTradeReportState,
  groupTransactionsByCompany,
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
import {
  txTradeDateYmd,
  txSettlementDateYmd,
} from '../../utils/tradeDateYmd';
import UpdateBuyTransactionsModal from './UpdateBuyTransactionsModal';
import UpdateSellTransactionsModal from './UpdateSellTransactionsModal';
import PostParsedTradeModal from './PostParsedTradeModal';
import './Styles/TradeConfirmation.css';
import ExportPdfExcelButtons from '../FinancialReporting/ExportPdfExcelButtons';

const formatDisplayDate = (dateStr) => {
  const normalized = txTradeDateYmd({ trade_date: dateStr }) || txSettlementDateYmd({ settlement_date: dateStr });
  if (!normalized) return 'N/A';
  return normalized.replace(/-/g, '/');
};

const isSettlementReady = (row) => {
  return String(row?.settlement_status || '').toLowerCase() === 'ready';
};

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
  const [historicalSelectedDate, setHistoricalSelectedDate] = useState('');
  const [historicalGroupedData, setHistoricalGroupedData] = useState({ sales: {}, purchases: {} });
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState('');
  const [pendingSettlementBuys, setPendingSettlementBuys] = useState([]);
  const [pendingSettlementSells, setPendingSettlementSells] = useState([]);
  const [pendingSettlementLoading, setPendingSettlementLoading] = useState(false);
  const [pendingSettlementError, setPendingSettlementError] = useState('');
  const [settlingBuyIds, setSettlingBuyIds] = useState([]);
  const [settlingSellIds, setSettlingSellIds] = useState([]);
  const [bulkSettling, setBulkSettling] = useState(false);
  const [sessionSettledRows, setSessionSettledRows] = useState([]);
  const [postEntryTransactions, setPostEntryTransactions] = useState([]);
  const [postEntryLoading, setPostEntryLoading] = useState(false);
  const [postEntryError, setPostEntryError] = useState('');
  const [buyModalTransactions, setBuyModalTransactions] = useState([]);
  const [sellModalTransactions, setSellModalTransactions] = useState([]);
  const [showPostParsedModal, setShowPostParsedModal] = useState(false);
  const [postParsedTransaction, setPostParsedTransaction] = useState(null);

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

  const fetchPostEntries = useCallback(async () => {
    try {
      setPostEntryLoading(true);
      setPostEntryError('');
      const data = await parsedTradeTransactionAPI.getUnupdatedParsedTransactions();
      setPostEntryTransactions(data || []);
    } catch (err) {
      console.error('Error fetching post entries:', err);
      setPostEntryError('Failed to fetch parsed trades pending save. Please try again.');
      setPostEntryTransactions([]);
    } finally {
      setPostEntryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'post-entries') {
      fetchPostEntries();
    }
  }, [activeTab, fetchPostEntries, showUpdateBuyModal, showUpdateSellModal, showPostParsedModal]);

  const fetchPendingSettlements = useCallback(async () => {
    try {
      setPendingSettlementLoading(true);
      setPendingSettlementError('');
      let buys = [];
      let sells = [];
      const errors = [];

      try {
        buys = await transactionEntryAPI.getPendingSettlementBuys();
      } catch (err) {
        console.error('Error fetching pending buy settlements:', err);
        errors.push('buys');
      }

      try {
        sells = await transactionEntryAPI.getPendingSettlementSells();
      } catch (err) {
        console.error('Error fetching pending sell settlements:', err);
        errors.push('sells');
      }

      setPendingSettlementBuys(buys || []);
      setPendingSettlementSells(sells || []);

      if (errors.length === 2) {
        setPendingSettlementError('Failed to fetch pending settlements. Please try again.');
      } else if (errors.length === 1) {
        setPendingSettlementError(`Failed to fetch pending ${errors[0]}. ${errors[0] === 'buys' ? 'Sell' : 'Buy'} rows may still be shown.`);
      }
    } catch (err) {
      console.error('Error fetching pending settlements:', err);
      setPendingSettlementError('Failed to fetch pending settlements. Please try again.');
      setPendingSettlementBuys([]);
      setPendingSettlementSells([]);
    } finally {
      setPendingSettlementLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending-settlement') {
      fetchPendingSettlements();
    } else {
      setSessionSettledRows([]);
    }
  }, [activeTab, fetchPendingSettlements]);

  const settlementRowKey = (side, id) => `${side}-${id}`;

  const markSessionSettled = (side, row) => {
    const key = settlementRowKey(side, row.id);
    setSessionSettledRows((prev) => {
      if (prev.some((item) => settlementRowKey(item.side, item.id) === key)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...row,
          side,
          settlementAmount: side === 'buy'
            ? row.settlement_payable_amount ?? row.settlementAmount
            : row.settlement_receivable_amount ?? row.settlementAmount,
          sessionSettled: true,
        },
      ];
    });
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

  const openBuyModal = (transactions) => {
    setBuyModalTransactions(transactions || []);
    setShowUpdateBuyModal(true);
    fetchEquitiesAndPortfolios();
  };

  const openSellModal = (transactions) => {
    setSellModalTransactions(transactions || []);
    setShowUpdateSellModal(true);
    fetchEquitiesAndPortfolios();
  };

  const handleCloseBuyModal = () => {
    setShowUpdateBuyModal(false);
    fetchUnupdatedTransactions();
    fetchPostEntries();
  };

  const handleCloseSellModal = () => {
    setShowUpdateSellModal(false);
    fetchUnupdatedTransactions();
    fetchPostEntries();
  };

  const handleUpdateBuyTransactions = () => {
    const purchaseTransactions = (unupdatedTransactions || []).filter(
      (t) => (t.buy_sell || '').toUpperCase() === 'B'
    );
    openBuyModal(purchaseTransactions);
    fetchUnupdatedTransactions();
  };

  const handleUpdateSellTransactions = () => {
    const sellTransactions = (unupdatedTransactions || []).filter(
      (t) => (t.buy_sell || '').toUpperCase() === 'S'
    );
    openSellModal(sellTransactions);
    fetchUnupdatedTransactions();
  };

  const openPostParsedModal = (transaction) => {
    setPostParsedTransaction(transaction);
    setShowPostParsedModal(true);
    fetchEquitiesAndPortfolios();
  };

  const handleClosePostParsedModal = (didPost) => {
    setShowPostParsedModal(false);
    setPostParsedTransaction(null);
    if (didPost) {
      fetchPostEntries();
      fetchUnupdatedTransactions();
    }
  };

  const handlePostParsedEntry = (transaction) => {
    openPostParsedModal(transaction);
  };

  const handlePostAllParsedEntries = () => {
    if ((postEntryTransactions || []).length === 0) {
      window.alert('No parsed trades are pending post.');
      return;
    }
    window.alert('Please post transactions one at a time so portfolio and broker can be confirmed for each trade.');
  };

  const handleSettle = async (side, transactionId) => {
    const sourceList = side === 'buy' ? pendingSettlementBuys : pendingSettlementSells;
    const rowSnapshot = (sourceList || []).find((row) => row.id === transactionId);
    const setSettlingIds = side === 'buy' ? setSettlingBuyIds : setSettlingSellIds;
    setSettlingIds((prev) => [...prev, transactionId]);
    try {
      if (side === 'buy') {
        await transactionEntryAPI.postBuySettlementGl(transactionId);
      } else {
        await transactionEntryAPI.postSellSettlementGl(transactionId);
      }
      if (rowSnapshot) {
        markSessionSettled(side, rowSnapshot);
      }
      await fetchPendingSettlements();
    } catch (err) {
      console.error(`Error posting ${side} settlement GL:`, err);
      const detail = err.settlementDate && err.serverToday
        ? `\nSettlement: ${err.settlementDate}\nServer today: ${err.serverToday}`
        : '';
      window.alert((err.message || 'Failed to post settlement GL.') + detail);
    } finally {
      setSettlingIds((prev) => prev.filter((id) => id !== transactionId));
    }
  };

  const handleSettleAllReady = async () => {
    const readyQueue = [
      ...(pendingSettlementBuys || [])
        .filter((row) => isSettlementReady(row))
        .map((row) => ({ side: 'buy', id: row.id, row })),
      ...(pendingSettlementSells || [])
        .filter((row) => isSettlementReady(row))
        .map((row) => ({ side: 'sell', id: row.id, row })),
    ];

    if (readyQueue.length === 0) {
      window.alert('No transactions are ready to settle today.');
      return;
    }

    setBulkSettling(true);
    const failures = [];

    try {
      for (const item of readyQueue) {
        const setSettlingIds = item.side === 'buy' ? setSettlingBuyIds : setSettlingSellIds;
        setSettlingIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));

        try {
          if (item.side === 'buy') {
            await transactionEntryAPI.postBuySettlementGl(item.id);
          } else {
            await transactionEntryAPI.postSellSettlementGl(item.id);
          }
          markSessionSettled(item.side, item.row);
        } catch (err) {
          console.error(`Error settling ${item.side} #${item.id}:`, err);
          const detail = err.settlementDate && err.serverToday
            ? ` (settlement ${err.settlementDate}, server today ${err.serverToday})`
            : '';
          failures.push({
            side: item.side,
            id: item.id,
            message: (err.message || 'Failed to post settlement GL') + detail,
          });
        } finally {
          setSettlingIds((prev) => prev.filter((id) => id !== item.id));
        }
      }

      await fetchPendingSettlements();
      // After the full Settle All run, clear settled rows so they leave the table.
      setSessionSettledRows([]);

      if (failures.length > 0) {
        const succeeded = readyQueue.length - failures.length;
        const lines = failures
          .slice(0, 8)
          .map((f) => `${f.side.toUpperCase()} #${f.id}: ${f.message}`)
          .join('\n');
        const more = failures.length > 8 ? `\n…and ${failures.length - 8} more` : '';
        window.alert(
          `Settled ${succeeded} of ${readyQueue.length} ready transaction(s).\n\nFailed:\n${lines}${more}`
        );
      }
    } catch (err) {
      console.error('Error settling all ready transactions:', err);
      window.alert(err.message || 'Failed to settle ready transactions.');
      await fetchPendingSettlements();
      setSessionSettledRows([]);
    } finally {
      setBulkSettling(false);
      setSettlingBuyIds([]);
      setSettlingSellIds([]);
    }
  };

  const fetchHistoricalReport = useCallback(async (date) => {
    if (!date) {
      setHistoricalGroupedData({ sales: {}, purchases: {} });
      setHistoricalError('');
      return;
    }

    setHistoricalLoading(true);
    setHistoricalError('');

    try {
      const data = await parsedTradeTransactionAPI.getParsedTransactionsByDate(date);
      setHistoricalGroupedData(groupTransactionsByCompany(data || []));
    } catch (err) {
      console.error('Error fetching historical trade report:', err);
      setHistoricalError('Failed to load trade report for the selected date. Please try again.');
      setHistoricalGroupedData({ sales: {}, purchases: {} });
    } finally {
      setHistoricalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'by-date') return;

    if (!historicalSelectedDate && latestTradeDate) {
      setHistoricalSelectedDate(txTradeDateYmd({ trade_date: latestTradeDate }) || '');
      return;
    }

    if (historicalSelectedDate) {
      fetchHistoricalReport(historicalSelectedDate);
    }
  }, [activeTab, historicalSelectedDate, latestTradeDate, fetchHistoricalReport]);

  const hasGroupedTradeData = (data) =>
    Object.keys(data.sales).length > 0 || Object.keys(data.purchases).length > 0;

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
              <table className="tc-unupdated-table tc-to-be-updated-table">
                <thead>
                  <tr>
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

  const renderPostEntries = () => {
    if (postEntryLoading) {
      return (
        <div className="tc-loading">
          <div className="tc-spinner"></div>
          <p>Loading post entries...</p>
        </div>
      );
    }

    if (postEntryError) {
      return (
        <div className="tc-error">
          <h3>Error Loading Post Entries</h3>
          <p>{postEntryError}</p>
          <button onClick={fetchPostEntries} className="tc-retry-btn">Retry</button>
        </div>
      );
    }

    const entries = [...(postEntryTransactions || [])].sort((a, b) => {
      const dateA = txTradeDateYmd(a) || '';
      const dateB = txTradeDateYmd(b) || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    if (entries.length === 0) {
      return (
        <div className="tc-no-data">
          <p>No parsed trades are waiting to be posted.</p>
        </div>
      );
    }

    return (
      <div className="tc-unupdated-list">
        <div className="tc-unupdated-group">
          <div className="tc-unupdated-header">
            <h3>Post Entries</h3>
            <div className="tc-pending-settlement-actions">
              <span>{entries.length} parsed transaction{entries.length === 1 ? '' : 's'} not yet posted</span>
              <button
                type="button"
                className="tc-settle-all-btn"
                onClick={handlePostAllParsedEntries}
                disabled={entries.length === 0}
              >
                {`Post All (${entries.length})`}
              </button>
            </div>
          </div>
          <div className="tc-table-container">
            <table className="tc-unupdated-table tc-post-entries-table">
              <thead>
                <tr>
                  <th>Buy/Sell</th>
                  <th>Trade Date</th>
                  <th>Company</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Execution ID</th>
                  <th>Settlement Date</th>
                  <th>Status</th>
                  <th className="tc-col-action">Post</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => {
                  const side = (row.buy_sell || '').toUpperCase();
                  return (
                    <tr key={row.id}>
                      <td>{side === 'B' ? 'BUY' : side === 'S' ? 'SELL' : 'N/A'}</td>
                      <td>{formatDisplayDate(row.trade_date)}</td>
                      <td>{row.company_id || row.symbol || 'N/A'}</td>
                      <td>{formatCurrency(row.quantity)}</td>
                      <td>{formatCurrency(row.price)}</td>
                      <td>{row.execution_id || 'N/A'}</td>
                      <td>{formatDisplayDate(row.settlement_date)}</td>
                      <td className="tc-unupdated-reason">{row.not_updated_reason || 'Not saved yet'}</td>
                      <td className="tc-col-action">
                        <button
                          type="button"
                          className="tc-post-entry-btn"
                          onClick={() => handlePostParsedEntry(row)}
                          disabled={showPostParsedModal}
                        >
                          Post
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPendingSettlement = () => {
    if (pendingSettlementLoading) {
      return (
        <div className="tc-loading">
          <div className="tc-spinner"></div>
          <p>Loading pending settlements...</p>
        </div>
      );
    }

    if (pendingSettlementError) {
      return (
        <div className="tc-error">
          <h3>Error Loading Pending Settlement</h3>
          <p>{pendingSettlementError}</p>
          <button onClick={fetchPendingSettlements} className="tc-retry-btn">Retry</button>
        </div>
      );
    }

    const pendingRows = [
      ...(pendingSettlementBuys || []).map((row) => ({
        ...row,
        side: 'buy',
        settlementAmount: row.settlement_payable_amount,
      })),
      ...(pendingSettlementSells || []).map((row) => ({
        ...row,
        side: 'sell',
        settlementAmount: row.settlement_receivable_amount,
      })),
    ];

    const pendingKeys = new Set(
      pendingRows.map((row) => settlementRowKey(row.side, row.id))
    );

    const settledOnlyRows = (sessionSettledRows || []).filter(
      (row) => !pendingKeys.has(settlementRowKey(row.side, row.id))
    );

    const rows = [
      ...pendingRows.map((row) => {
        const settled = (sessionSettledRows || []).some(
          (item) => settlementRowKey(item.side, item.id) === settlementRowKey(row.side, row.id)
        );
        return { ...row, sessionSettled: settled };
      }),
      ...settledOnlyRows,
    ];

    const readyCount = rows.filter((row) => !row.sessionSettled && isSettlementReady(row)).length;
    const settledCount = rows.filter((row) => row.sessionSettled).length;

    if (rows.length === 0) {
      return (
        <div className="tc-no-data">
          <p>No buy or sell transactions awaiting bank settlement.</p>
        </div>
      );
    }

    return (
      <div className="tc-unupdated-list">
        <div className="tc-unupdated-group">
          <div className="tc-unupdated-header">
            <h3>Pending Settlement</h3>
            <div className="tc-pending-settlement-actions">
              <span>
                {rows.length - settledCount} pending
                {settledCount > 0 ? ` · ${settledCount} settled` : ''}
              </span>
              <button
                type="button"
                className="tc-settle-all-btn"
                onClick={handleSettleAllReady}
                disabled={bulkSettling || readyCount === 0}
              >
                {bulkSettling ? 'Settling...' : `Settle All Ready (${readyCount})`}
              </button>
            </div>
          </div>
          <div className="tc-table-container">
            <table className="tc-unupdated-table tc-pending-settlement-table">
              <thead>
                <tr>
                  <th>Buy/Sell</th>
                  <th>Trade Date</th>
                  <th>Settlement Date</th>
                  <th>Company</th>
                  <th>Quantity</th>
                  <th>Settlement Amount</th>
                  <th>Status</th>
                  <th className="tc-col-action">Settle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSettled = Boolean(row.sessionSettled);
                  const isReady = !isSettled && isSettlementReady(row);
                  const isSettling = row.side === 'buy'
                    ? settlingBuyIds.includes(row.id)
                    : settlingSellIds.includes(row.id);
                  return (
                    <tr
                      key={`${row.side}-${row.id}`}
                      className={isSettled ? 'tc-settlement-row-settled' : undefined}
                    >
                      <td>{row.side === 'buy' ? 'BUY' : 'SELL'}</td>
                      <td>{formatDisplayDate(row.trade_date)}</td>
                      <td>{formatDisplayDate(row.settlement_date)}</td>
                      <td>{row.symbol || row.company_name || 'N/A'}</td>
                      <td>{formatCurrency(row.quantity)}</td>
                      <td>{formatCurrency(row.settlementAmount)}</td>
                      <td>
                        <span
                          className={`tc-settlement-badge ${
                            isSettled
                              ? 'tc-settlement-badge-settled'
                              : isReady
                                ? 'tc-settlement-badge-ready'
                                : 'tc-settlement-badge-upcoming'
                          }`}
                        >
                          {isSettled ? 'Settled' : isReady ? 'Ready' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="tc-col-action">
                        {!isSettled && (
                          <button
                            type="button"
                            className="tc-post-entry-btn"
                            onClick={() => handleSettle(row.side, row.id)}
                            disabled={!isReady || isSettling || bulkSettling}
                          >
                            {isSettling ? 'Settling...' : 'Settle'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
      </div>
    );
  };

  const renderTradeReportBody = (reportGroupedData, tradeDateValue) => {
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

    const purchaseGroups = Object.entries(reportGroupedData.purchases);
    const saleGroups = Object.entries(reportGroupedData.sales);
    const purchaseTotals = calculateReportTotals(Object.values(reportGroupedData.purchases).flat());
    const saleTotals = calculateReportTotals(Object.values(reportGroupedData.sales).flat());
    const netSettlement = saleTotals.net - purchaseTotals.net;
    const formattedReportDate = tradeDateValue ? formatTradeDate(tradeDateValue) : 'N/A';

    return (
      <div className="tc-trade-report">
        <div className="tc-trade-report-header">
          <p>Dear Sir/Madam,</p>
          <p>
            We wish to inform you that the following transaction(s) were done on {formattedReportDate}.
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

  const renderTradeReport = () => renderTradeReportBody(groupedData, latestTradeDate);

  const renderTradeReportByDate = () => {
    const formattedSelectedDate = historicalSelectedDate
      ? formatTradeDate(historicalSelectedDate)
      : '';

    return (
      <div className="tc-by-date-report">
        <div className="tc-by-date-controls">
          <div className="tc-by-date-field">
            <label htmlFor="tc-trade-date-picker">Trade date</label>
            <input
              id="tc-trade-date-picker"
              type="date"
              value={historicalSelectedDate}
              onChange={(e) => setHistoricalSelectedDate(e.target.value)}
              className="tc-by-date-input"
            />
          </div>
          <p className="tc-by-date-hint">
            Select a date to view the trade confirmation report for that session.
          </p>
        </div>

        {!historicalSelectedDate && (
          <div className="tc-no-data">
            <p>Please select a trade date to view the report.</p>
          </div>
        )}

        {historicalSelectedDate && historicalLoading && (
          <div className="tc-loading">
            <div className="tc-spinner"></div>
            <p>Loading trade report for {formattedSelectedDate}...</p>
          </div>
        )}

        {historicalSelectedDate && historicalError && !historicalLoading && (
          <div className="tc-error">
            <h3>Error Loading Trade Report</h3>
            <p>{historicalError}</p>
            <button
              type="button"
              onClick={() => fetchHistoricalReport(historicalSelectedDate)}
              className="tc-retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {historicalSelectedDate &&
          !historicalLoading &&
          !historicalError &&
          !hasGroupedTradeData(historicalGroupedData) && (
            <div className="tc-no-data">
              <p>No trade confirmations found for {formattedSelectedDate}.</p>
            </div>
          )}

        {historicalSelectedDate &&
          !historicalLoading &&
          !historicalError &&
          hasGroupedTradeData(historicalGroupedData) &&
          renderTradeReportBody(historicalGroupedData, historicalSelectedDate)}
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
          {activeTab === 'by-date' ? (
            <div className="tc-trade-report-export">
              <ExportPdfExcelButtons
                exportDisabled={
                  !historicalSelectedDate ||
                  historicalLoading ||
                  !hasGroupedTradeData(historicalGroupedData)
                }
                onExportExcel={() =>
                  emitTradeReportExcel({
                    groupedData: historicalGroupedData,
                    latestTradeDate: historicalSelectedDate,
                    filenameBase: `trade-report-${historicalSelectedDate}`
                  })
                }
                onExportPdf={() =>
                  emitTradeReportPdf({
                    groupedData: historicalGroupedData,
                    latestTradeDate: historicalSelectedDate,
                    filenameBase: `trade-report-${historicalSelectedDate}`
                  })
                }
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
          <button
            className={`tc-tab ${activeTab === 'post-entries' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('post-entries')}
          >
            Post Entries
          </button>
          <button
            className={`tc-tab ${activeTab === 'pending-settlement' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('pending-settlement')}
          >
            Pending Settlement
          </button>
          <button
            className={`tc-tab ${activeTab === 'by-date' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('by-date')}
          >
            By Date
          </button>
        </div>
      </div>

      <div className="tc-tab-content">
        {activeTab === 'purchases' && renderPurchases()}
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'trade-report' && renderTradeReport()}
        {activeTab === 'to-be-updated' && renderToBeUpdated()}
        {activeTab === 'update-portfolio' && renderUpdatePortfolio()}
        {activeTab === 'post-entries' && renderPostEntries()}
        {activeTab === 'pending-settlement' && renderPendingSettlement()}
        {activeTab === 'by-date' && renderTradeReportByDate()}
      </div>

      {showUpdateBuyModal && (
        <UpdateBuyTransactionsModal
          isOpen={showUpdateBuyModal}
          onClose={handleCloseBuyModal}
          purchaseTransactions={buyModalTransactions}
          equities={equities}
          portfolios={portfolios}
          latestTradeDate={latestTradeDate}
        />
      )}
      {showUpdateSellModal && (
        <UpdateSellTransactionsModal
          isOpen={showUpdateSellModal}
          onClose={handleCloseSellModal}
          sellTransactions={sellModalTransactions}
          equities={equities}
          portfolios={portfolios}
          latestTradeDate={latestTradeDate}
        />
      )}
      {showPostParsedModal && postParsedTransaction && (
        <PostParsedTradeModal
          isOpen={showPostParsedModal}
          onClose={handleClosePostParsedModal}
          transaction={postParsedTransaction}
          equities={equities}
          portfolios={portfolios}
        />
      )}
    </div>
  );
};

export default TradeConfirmation;
