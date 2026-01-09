import React, { useState, useEffect } from 'react';
import { parsedTradeTransactionAPI } from '../../services/api';
import './Styles/TradeConfirmation.css';

const TradeConfirmation = () => {
  const [transactions, setTransactions] = useState([]);
  const [groupedData, setGroupedData] = useState({ sales: {}, purchases: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all parsed transactions for the user
      const data = await parsedTradeTransactionAPI.getParsedTransactions();
      
      setTransactions(data);
      groupTransactions(data);
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

  return (
    <div className="tc-container">
      <div className="tc-header">
        <div className="tc-header-left">
          <h1 className="tc-main-title">Trade Confirmation</h1>
          <p className="tc-report-date">This is a computer generated report on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="tc-filters">
          <button onClick={fetchTransactions} className="tc-refresh-btn">Refresh</button>
        </div>
      </div>

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
    </div>
  );
};

export default TradeConfirmation;


