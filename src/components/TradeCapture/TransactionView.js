import React, { useEffect, useState } from 'react';
import { tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import './Styles/TransactionView.css';

const TransactionView = () => {
  const [buyTransactions, setBuyTransactions] = useState([]);
  const [sellTransactions, setSellTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'buy', 'sell'

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [buyData, sellData] = await Promise.all([
        tradeSummaryAPI.getBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions()
      ]);
      setBuyTransactions(buyData);
      setSellTransactions(sellData);
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

  // Combine and sort all transactions by date
  const allTransactions = [
    ...buyTransactions.map(tx => ({ ...tx, type: 'BUY' })),
    ...sellTransactions.map(tx => ({ ...tx, type: 'SELL' }))
  ].sort((a, b) => new Date(b.trade_date || b.created_at) - new Date(a.trade_date || a.created_at));

  const filteredTransactions = activeTab === 'all' 
    ? allTransactions 
    : activeTab === 'buy' 
    ? buyTransactions.map(tx => ({ ...tx, type: 'BUY' }))
    : sellTransactions.map(tx => ({ ...tx, type: 'SELL' }));

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="transaction-view-container">
      <div className="transaction-view-header">
        <h2 className="transaction-view-title">All Transactions</h2>
        <button 
          onClick={fetchTransactions} 
          className="transaction-refresh-btn"
          disabled={loading}
        >
          <svg className="refresh-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="transaction-tabs">
        <button 
          className={`transaction-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Transactions ({allTransactions.length})
        </button>
        <button 
          className={`transaction-tab ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          Buy Transactions ({buyTransactions.length})
        </button>
        <button 
          className={`transaction-tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          Sell Transactions ({sellTransactions.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="transaction-table-container">
        {loading ? (
          <div className="transaction-loading">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="transaction-empty">No transactions found.</div>
        ) : (
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
                  <th>Trade Date</th>
                  <th>Settlement Date</th>
                  <th>Broker</th>
                  <th>Contract #</th>
                  {activeTab !== 'sell' && <th>Money Gen Cost (Daily)</th>}
                  {activeTab !== 'buy' && <th>Capital Gain</th>}
                </tr>
              </thead>
              <tbody className="transaction-table-body">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className={`transaction-row ${transaction.type.toLowerCase()}-row`}>
                    <td className="transaction-type-cell">
                      <span className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="transaction-company-cell">
                      {transaction.company_name || transaction.companyName || '-'}
                    </td>
                    <td className="transaction-portfolio-cell">
                      {transaction.portfolio || transaction.portfolioName || '-'}
                    </td>
                    <td className="transaction-deal-cell">
                      {transaction.deal_number || transaction.contractNumber || '-'}
                    </td>
                    <td className="transaction-quantity-cell">
                      {formatCurrency(transaction.quantity)}
                    </td>
                    <td className="transaction-price-cell">
                      {formatCurrency(transaction.price || transaction.soldPrice || transaction.boughtPrice)}
                    </td>
                    <td className="transaction-gross-cell">
                      {formatCurrency(transaction.gross_value || transaction.grossValue)}
                    </td>
                    <td className="transaction-net-cell">
                      {formatCurrency(transaction.net_value || transaction.netValue)}
                    </td>
                    <td className="transaction-trade-date-cell">
                      {formatDate(transaction.trade_date || transaction.tradeDate)}
                    </td>
                    <td className="transaction-settlement-date-cell">
                      {formatDate(transaction.settlement_date || transaction.settlementDate)}
                    </td>
                    <td className="transaction-broker-cell">
                      {transaction.broker_name || transaction.brokerName || '-'}
                    </td>
                    <td className="transaction-contract-cell">
                      {transaction.contract_number || transaction.contractNumber || '-'}
                    </td>
                    {activeTab !== 'sell' && (
                      <td className="transaction-money-gen-cell">
                        {formatCurrency(transaction.money_generation_cost || transaction.moneyGenerationCost)}
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
        )}
      </div>
    </div>
  );
};

export default TransactionView;
