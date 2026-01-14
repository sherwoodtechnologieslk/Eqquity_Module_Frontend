import React, { useState, useEffect } from 'react';
import { parsedTradeTransactionAPI } from '../../services/api';
import './Styles/TradeConfirmation.css';

const TradeConfirmation = () => {
  const [activeTab, setActiveTab] = useState('trade-confirmation');
  const [transactions, setTransactions] = useState([]);
  const [groupedData, setGroupedData] = useState({ sales: {}, purchases: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all parsed transactions for the user
      const data = await parsedTradeTransactionAPI.getParsedTransactions();
      
      // Find the latest trade date
      if (data && data.length > 0) {
        // Get all unique trade dates and find the latest one
        const tradeDates = data
          .map(t => t.trade_date)
          .filter(date => date) // Remove null/undefined dates
          .sort((a, b) => {
            // Sort dates in descending order (newest first)
            return new Date(b) - new Date(a);
          });
        
        const latestTradeDate = tradeDates[0];
        
        // Filter transactions to show only the latest trade date
        const filteredData = data.filter(t => t.trade_date === latestTradeDate);
        
        setTransactions(filteredData);
        groupTransactions(filteredData);
      } else {
        setTransactions([]);
        groupTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const groupTransactions = (data) => {
    const sales = {};
    const purchases = {};

    data.forEach(transaction => {
      const companyId = transaction.company_id || 'UNKNOWN';
      const buySell = (transaction.buy_sell || '').toUpperCase();
      
      if (buySell === 'S') {
        if (!sales[companyId]) {
          sales[companyId] = [];
        }
        sales[companyId].push(transaction);
      } else if (buySell === 'B') {
        if (!purchases[companyId]) {
          purchases[companyId] = [];
        }
        purchases[companyId].push(transaction);
      }
    });

    setGroupedData({ sales, purchases });
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateTransactionValue = (transaction) => {
    const qty = parseFloat(transaction.quantity) || 0;
    const price = parseFloat(transaction.price) || 0;
    return qty * price;
  };

  const calculateFees = (transaction) => {
    const brokerage = parseFloat(transaction.brokerage) || 0;
    const cdsFees = parseFloat(transaction.cds_fees) || 0;
    const cseFees = parseFloat(transaction.cse_fees) || 0;
    const clearingFees = parseFloat(transaction.clearing_fees) || 0;
    const secCess = parseFloat(transaction.sec_cess) || 0;
    const govCess = parseFloat(transaction.government_cess) || 0;
    const foreignBrokerage = parseFloat(transaction.foreign_brokerage) || 0;
    
    return brokerage + cdsFees + cseFees + clearingFees + secCess + govCess + foreignBrokerage;
  };

  const calculateGroupTotals = (groupTransactions) => {
    let totalAmount = 0;
    let totalQuantity = 0;
    let totalBrokerage = 0;
    let totalClearingFees = 0;
    let totalFees = 0;
    let totalNet = 0;
    let avgPrice = 0;

    groupTransactions.forEach(t => {
      const value = calculateTransactionValue(t);
      const qty = parseFloat(t.quantity) || 0;
      const brokerage = parseFloat(t.brokerage) || 0;
      const clearingFees = parseFloat(t.clearing_fees) || 0;
      const fees = calculateFees(t);
      const net = value - fees;

      totalAmount += value;
      totalQuantity += qty;
      totalBrokerage += brokerage;
      totalClearingFees += clearingFees;
      totalFees += fees;
      totalNet += net;
    });

    avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    return {
      totalAmount,
      totalQuantity,
      totalBrokerage,
      totalClearingFees,
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
          <h3 className="tc-company-title">
            {isSale ? 'Sale of' : 'Purchase of'} {companyId} ({companyId}.N0000 / LK{companyId.padStart(4, '0')}N00000)
          </h3>
        </div>

        <div className="tc-table-container">
          <table className="tc-transaction-table">
             <thead>
               <tr className="tc-table-header-row">
                 <th className="tc-col-trade-date">Trade Date</th>
                 <th className="tc-col-amount">Amount</th>
                 <th className="tc-col-qty">Qty</th>
                 <th className="tc-col-brokerage">Brokerage</th>
                 <th className="tc-col-price">Price</th>
                 <th className="tc-col-clearing">Clearing Fees</th>
                 <th className="tc-col-cse">CSE Fees</th>
                 <th className="tc-col-net">Net Amount</th>
                 <th className="tc-col-exec-id">Execution ID</th>
                 <th className="tc-col-settlement">Settlement Date</th>
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
                 <td className="tc-col-cse">{formatCurrency(totals.totalFees - totals.totalBrokerage - totals.totalClearingFees)}</td>
                 <td className="tc-col-net">{formatCurrency(totals.totalNet)}</td>
                 <td className="tc-col-exec-id" colSpan="2"></td>
               </tr>
             </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const calculateOverallTotals = () => {
    let purchaseTotal = 0;
    let salesTotal = 0;

    Object.values(groupedData.purchases).forEach(group => {
      const totals = calculateGroupTotals(group);
      purchaseTotal += totals.totalNet;
    });

    Object.values(groupedData.sales).forEach(group => {
      const totals = calculateGroupTotals(group);
      salesTotal += totals.totalNet;
    });

    const netSettlement = salesTotal - purchaseTotal;

    return { purchaseTotal, salesTotal, netSettlement };
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

  const overallTotals = calculateOverallTotals();
  const hasData = Object.keys(groupedData.sales).length > 0 || Object.keys(groupedData.purchases).length > 0;

  const handleUpdateBuyTransactions = () => {
    // TODO: Implement update buy transactions functionality
    console.log('Update Buy Transactions clicked');
    // This can be implemented to update/manage buy transactions
  };

  const handleUpdateSellTransactions = () => {
    // TODO: Implement update sell transactions functionality
    console.log('Update Sell Transactions clicked');
    // This can be implemented to update/manage sell transactions
  };

  const renderPortfolioUpdate = () => {
    // Calculate portfolio holdings
    const portfolio = {};
    
    transactions.forEach(transaction => {
      const companyId = transaction.company_id || 'UNKNOWN';
      const buySell = (transaction.buy_sell || '').toUpperCase();
      const qty = parseFloat(transaction.quantity) || 0;
      const price = parseFloat(transaction.price) || 0;
      
      if (!portfolio[companyId]) {
        portfolio[companyId] = {
          companyId,
          quantity: 0,
          totalCost: 0,
          avgPrice: 0,
          currentValue: 0
        };
      }
      
      if (buySell === 'B') {
        // Purchase - add to holdings
        portfolio[companyId].quantity += qty;
        portfolio[companyId].totalCost += (qty * price);
      } else if (buySell === 'S') {
        // Sale - reduce holdings
        portfolio[companyId].quantity -= qty;
        portfolio[companyId].totalCost -= (qty * price);
      }
    });

    // Calculate averages - show all companies including zero/negative holdings
    const holdings = Object.values(portfolio)
      .map(h => ({
        ...h,
        avgPrice: h.quantity !== 0 ? h.totalCost / h.quantity : 0,
        currentValue: h.quantity * (h.quantity !== 0 ? h.totalCost / h.quantity : 0)
      }))
      .sort((a, b) => a.companyId.localeCompare(b.companyId));

    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalGainLoss = totalPortfolioValue - totalCost;

    return (
      <div className="tc-portfolio-update">
        <div className="tc-portfolio-header">
          <h2>Portfolio Holdings</h2>
          <div className="tc-portfolio-actions">
            <button onClick={handleUpdateBuyTransactions} className="tc-update-btn tc-update-buy-btn">
              Update Buy Transactions
            </button>
            <button onClick={handleUpdateSellTransactions} className="tc-update-btn tc-update-sell-btn">
              Update Sell Transactions
            </button>
            <button onClick={fetchTransactions} className="tc-refresh-btn">Refresh</button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="tc-no-data">
            <p>No portfolio holdings found.</p>
          </div>
        ) : (
          <>
            <div className="tc-portfolio-table-container">
              <table className="tc-transaction-table">
                <thead>
                  <tr className="tc-table-header-row">
                    <th className="tc-col-company">Company ID</th>
                    <th className="tc-col-qty">Quantity</th>
                    <th className="tc-col-price">Avg. Price</th>
                    <th className="tc-col-amount">Total Cost</th>
                    <th className="tc-col-amount">Current Value</th>
                    <th className="tc-col-net">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => {
                    const gainLoss = holding.currentValue - holding.totalCost;
                    const isSelected = selectedCompany === holding.companyId;
                    const companyTransactions = transactions.filter(
                      t => (t.company_id || 'UNKNOWN') === holding.companyId
                    ).sort((a, b) => {
                      // Sort by trade date and time
                      const dateA = a.trade_date || '';
                      const dateB = b.trade_date || '';
                      if (dateA !== dateB) return dateB.localeCompare(dateA);
                      return (b.trade_time || '').localeCompare(a.trade_time || '');
                    });

                    return (
                      <React.Fragment key={index}>
                        <tr 
                          className={`tc-transaction-row ${isSelected ? 'tc-row-selected' : ''} tc-clickable-row`}
                          onClick={() => setSelectedCompany(isSelected ? null : holding.companyId)}
                        >
                          <td className="tc-col-company">
                            {holding.companyId}
                            <span className="tc-expand-icon">{isSelected ? '▼' : '▶'}</span>
                          </td>
                          <td className="tc-col-qty">{formatCurrency(holding.quantity)}</td>
                          <td className="tc-col-price">{formatCurrency(holding.avgPrice)}</td>
                          <td className="tc-col-amount">{formatCurrency(holding.totalCost)}</td>
                          <td className="tc-col-amount">{formatCurrency(holding.currentValue)}</td>
                          <td className={`tc-col-net ${gainLoss >= 0 ? 'tc-positive' : 'tc-negative'}`}>
                            {formatCurrency(gainLoss)}
                          </td>
                        </tr>
                        {isSelected && companyTransactions.length > 0 && (
                          <tr className="tc-expanded-row">
                            <td colSpan="6" className="tc-expanded-cell">
                              <div className="tc-company-transactions">
                                <h4 className="tc-transactions-title">Transactions for {holding.companyId}</h4>
                                <div className="tc-transactions-table-container">
                                  <table className="tc-transaction-table">
                                    <thead>
                                      <tr className="tc-table-header-row">
                                        <th className="tc-col-trade-date">Trade Date</th>
                                        <th className="tc-col-trade-time">Trade Time</th>
                                        <th>Type</th>
                                        <th className="tc-col-qty">Quantity</th>
                                        <th className="tc-col-price">Price</th>
                                        <th className="tc-col-amount">Amount</th>
                                        <th className="tc-col-exec-id">Execution ID</th>
                                        <th className="tc-col-settlement">Settlement Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {companyTransactions.map((transaction, txIndex) => {
                                        const value = calculateTransactionValue(transaction);
                                        const buySell = (transaction.buy_sell || '').toUpperCase();
                                        return (
                                          <tr key={txIndex} className="tc-transaction-row">
                                            <td className="tc-col-trade-date">{transaction.trade_date || 'N/A'}</td>
                                            <td className="tc-col-trade-time">{transaction.trade_time || 'N/A'}</td>
                                            <td>
                                              <span className={buySell === 'B' ? 'tc-buy-badge' : 'tc-sell-badge'}>
                                                {buySell === 'B' ? 'BUY' : 'SELL'}
                                              </span>
                                            </td>
                                            <td className="tc-col-qty">{formatCurrency(transaction.quantity || 0)}</td>
                                            <td className="tc-col-price">{formatCurrency(transaction.price || 0)}</td>
                                            <td className="tc-col-amount">{formatCurrency(value)}</td>
                                            <td className="tc-col-exec-id">{transaction.execution_id || 'N/A'}</td>
                                            <td className="tc-col-settlement">{transaction.settlement_date || 'N/A'}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="tc-total-row">
                    <td className="tc-col-company">
                      <strong>Total</strong>
                    </td>
                    <td className="tc-col-qty"></td>
                    <td className="tc-col-price"></td>
                    <td className="tc-col-amount">{formatCurrency(totalCost)}</td>
                    <td className="tc-col-amount">{formatCurrency(totalPortfolioValue)}</td>
                    <td className={`tc-col-net ${totalGainLoss >= 0 ? 'tc-positive' : 'tc-negative'}`}>
                      <strong>{formatCurrency(totalGainLoss)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTradeConfirmation = () => {
    return (
      <>
        {!hasData ? (
          <div className="tc-no-data">
            <p>No transactions found.</p>
          </div>
        ) : (
          <>
            <div className="tc-report-section">
              {/* Sales Section */}
              {Object.keys(groupedData.sales).length > 0 && (
                <div className="tc-section">
                  {Object.entries(groupedData.sales).map(([companyId, transactions]) =>
                    renderCompanyGroup(companyId, transactions, 'sale')
                  )}
                </div>
              )}

              {/* Purchases Section */}
              {Object.keys(groupedData.purchases).length > 0 && (
                <div className="tc-section">
                  {Object.entries(groupedData.purchases).map(([companyId, transactions]) =>
                    renderCompanyGroup(companyId, transactions, 'purchase')
                  )}
                </div>
              )}

               {/* Overall Summary */}
               <div className="tc-summary-section">
                 <div className="tc-summary-row">
                   <span className="tc-summary-label">Purchase Total:</span>
                   <span className="tc-summary-value">{formatCurrency(overallTotals.purchaseTotal)}</span>
                 </div>
                 <div className="tc-summary-row">
                   <span className="tc-summary-label">Sales Total:</span>
                   <span className="tc-summary-value">{formatCurrency(overallTotals.salesTotal)}</span>
                 </div>
               </div>
             </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="tc-container">
      <div className="tc-header">
        <div className="tc-header-top">
          <div className="tc-header-left">
            <h1 className="tc-main-title">Trade Confirmation</h1>
          </div>
          <div className="tc-filters">
            <button onClick={fetchTransactions} className="tc-refresh-btn">Refresh</button>
          </div>
        </div>
        <div className="tc-tabs">
          <button
            className={`tc-tab ${activeTab === 'trade-confirmation' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('trade-confirmation')}
          >
            Trade Confirmation Report
          </button>
          <button
            className={`tc-tab ${activeTab === 'portfolio-update' ? 'tc-tab-active' : ''}`}
            onClick={() => setActiveTab('portfolio-update')}
          >
            Portfolio Update
          </button>
        </div>
      </div>

      <div className="tc-tab-content">
        {activeTab === 'trade-confirmation' && renderTradeConfirmation()}
        {activeTab === 'portfolio-update' && renderPortfolioUpdate()}
      </div>
    </div>
  );
};

export default TradeConfirmation;
