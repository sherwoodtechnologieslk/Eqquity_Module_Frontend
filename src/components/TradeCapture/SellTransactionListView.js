import React, { useEffect, useState } from 'react';
import { transactionEntryAPI } from '../../services/api';
import './Styles/SellTransactionListView.css';

const SellTransactionListView = ({ onBack, setFifoParams, setActiveTab }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('Fetching all sell transactions...');
      const data = await transactionEntryAPI.getAllSellTransactions();
      console.log('Sell transactions fetched:', data);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching sell transactions:', err);
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="STLTV-table-section">
      <div className="STLTV-view-toggle">
        <button onClick={onBack} className="STLTV-back-btn">
          Back to Entry Form
        </button>
        <button onClick={fetchTransactions} className="STLTV-refresh-btn" style={{marginLeft: 12}}>
          <svg className="STLTV-refresh-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          Refresh
        </button>
      </div>
      <h3 className="STLTV-table-title">Submitted Sell Transactions</h3>
      {loading ? (
        <div className="STLTV-table-empty">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="STLTV-table-empty">No sell transactions submitted yet.</div>
      ) : (
        <div className="STLTV-table-wrapper">
          <table className="STLTV-transactions-table">
            <thead className="STLTV-table-head">
              <tr className="STLTV-table-header-row">
                <th className="STLTV-table-header">ID</th>
                <th className="STLTV-table-header">Company Name</th>
                <th className="STLTV-table-header">Symbol</th>
                <th className="STLTV-table-header">Portfolio</th>
                <th className="STLTV-table-header">Portfolio ID</th>
                <th className="STLTV-table-header">Contract Number</th>
                <th className="STLTV-table-header">Quantity</th>
                <th className="STLTV-table-header">Sold Price</th>
                <th className="STLTV-table-header">Bought Price</th>
                <th className="STLTV-table-header">Gross Value</th>
                <th className="STLTV-table-header">Brokerage</th>
                <th className="STLTV-table-header">CSE Fees</th>
                <th className="STLTV-table-header">CDS Fees</th>
                <th className="STLTV-table-header">Clearing Fees</th>
                <th className="STLTV-table-header">SEC</th>
                <th className="STLTV-table-header">STL</th>
                <th className="STLTV-table-header">Net Value</th>
                <th className="STLTV-table-header">Capital Gain</th>
                <th className="STLTV-table-header">Cost of Funds</th>
                <th className="STLTV-table-header">Holding Days</th>
                <th className="STLTV-table-header">Buy Contract</th>
                <th className="STLTV-table-header">Money Gen Cost</th>
                <th className="STLTV-table-header">Broker Name</th>
                <th className="STLTV-table-header">Trade Date</th>
                <th className="STLTV-table-header">Settlement Date</th>
                <th className="STLTV-table-header">Settlement Account</th>
                <th className="STLTV-table-header">Account Name</th>
                <th className="STLTV-table-header">Account Number</th>
                <th className="STLTV-table-header">Bank Name</th>
                <th className="STLTV-table-header">Branch Name</th>
                <th className="STLTV-table-header">Profit/Loss</th>
                <th className="STLTV-table-header">Created At</th>
              </tr>
            </thead>
            <tbody className="STLTV-table-body">
              {transactions.map(tx => (
                <tr key={tx.id} className="STLTV-table-row">
                  <td className="STLTV-table-cell">{tx.id}</td>
                  <td className="STLTV-table-cell">{tx.company_name}</td>
                  <td className="STLTV-table-cell">{tx.symbol || '-'}</td>
                  <td className="STLTV-table-cell">{tx.portfolio_name}</td>
                  <td className="STLTV-table-cell">{tx.portfolioId || '-'}</td>
                  <td className="STLTV-table-cell">{tx.contract_number}</td>
                  <td className="STLTV-table-cell">{tx.quantity}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.sold_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.bought_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.gross_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.brokerage || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.cse_fees || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.cds_fees || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.clearing_fees || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.sec || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.stl || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.net_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.capital_gain || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.cost_of_funds || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}%</td>
                  <td className="STLTV-table-cell">{tx.hdays || '-'}</td>
                  <td className="STLTV-table-cell">{tx.buy_contract || '-'}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.money_generation_cost || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{tx.broker_name}</td>
                  <td className="STLTV-table-cell">{tx.trade_date}</td>
                  <td className="STLTV-table-cell">{tx.settlement_date}</td>
                  <td className="STLTV-table-cell">{tx.settlement_account}</td>
                  <td className="STLTV-table-cell">{tx.account_name || '-'}</td>
                  <td className="STLTV-table-cell">{tx.account_number || '-'}</td>
                  <td className="STLTV-table-cell">{tx.bank_name || '-'}</td>
                  <td className="STLTV-table-cell">{tx.branch_name || '-'}</td>
                  <td className="STLTV-table-cell">{parseFloat(tx.profit_loss || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                  <td className="STLTV-table-cell">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellTransactionListView;