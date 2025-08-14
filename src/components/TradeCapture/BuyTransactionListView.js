import React, { useEffect, useState } from 'react';
import { tradeSummaryAPI } from '../../services/api';
import './Styles/BuyTransactionListView.css';

const BuyTransactionListView = ({ onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await tradeSummaryAPI.getBuyTransactions();
      setTransactions(data);
    } catch (err) {
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="BTLV-table-section">
      <div className="BTLV-view-toggle">
        <button onClick={onBack} className="BTLV-back-btn">
          Back to Entry Form
        </button>
        <button onClick={fetchTransactions} className="BTLV-refresh-btn" style={{marginLeft: 12}}>
          <svg className="BTLV-refresh-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          Refresh
        </button>
      </div>
      <h3 className="BTLV-table-title">Submitted Transactions</h3>
      {loading ? (
        <div className="BTLV-table-empty">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="BTLV-table-empty">No transactions submitted yet.</div>
      ) : (
        <div className="BTLV-table-wrapper">
          <table className="BTLV-transactions-table">
            <thead className="BTLV-table-head">
              <tr className="BTLV-table-header-row">
                <th className="BTLV-table-header">ID</th>
                <th className="BTLV-table-header">Company Name</th>
                <th className="BTLV-table-header">Portfolio</th>
                <th className="BTLV-table-header">Deal Number</th>
                <th className="BTLV-table-header">Quantity</th>
                <th className="BTLV-table-header">Price</th>
                <th className="BTLV-table-header">Gross Value</th>
                <th className="BTLV-table-header">Brokerage</th>
                <th className="BTLV-table-header">CDS Fees</th>
                <th className="BTLV-table-header">CSE Fees</th>
                <th className="BTLV-table-header">SEC</th>
                <th className="BTLV-table-header">STL</th>
                <th className="BTLV-table-header">Net Value</th>
                <th className="BTLV-table-header">Contract Number</th>
                <th className="BTLV-table-header">Broker Name</th>
                <th className="BTLV-table-header">Trade Date</th>
                <th className="BTLV-table-header">Settlement Date</th>
                <th className="BTLV-table-header">Settlement Account</th>
                <th className="BTLV-table-header">Cash Flow On Settlement</th>
                <th className="BTLV-table-header">Payment Method</th>
                <th className="BTLV-table-header">Generate Payment</th>
                <th className="BTLV-table-header">Money Generation Cost</th>
                <th className="BTLV-table-header">Cost of Funds</th>
                <th className="BTLV-table-header">Created At</th>
              </tr>
            </thead>
            <tbody className="BTLV-table-body">
              {transactions.map(tx => (
                <tr key={tx.id} className="BTLV-table-row">
                  <td className="BTLV-table-cell">{tx.id}</td>
                  <td className="BTLV-table-cell">{tx.company_name}</td>
                  <td className="BTLV-table-cell">{tx.portfolio}</td>
                  <td className="BTLV-table-cell">{tx.deal_number}</td>
                  <td className="BTLV-table-cell">{tx.quantity}</td>
                  <td className="BTLV-table-cell">{tx.price}</td>
                  <td className="BTLV-table-cell">{tx.gross_value}</td>
                  <td className="BTLV-table-cell">{tx.brokerage}</td>
                  <td className="BTLV-table-cell">{tx.cds_fees}</td>
                  <td className="BTLV-table-cell">{tx.cse_fees}</td>
                  <td className="BTLV-table-cell">{tx.sec}</td>
                  <td className="BTLV-table-cell">{tx.stl}</td>
                  <td className="BTLV-table-cell">{tx.net_value}</td>
                  <td className="BTLV-table-cell">{tx.contract_number}</td>
                  <td className="BTLV-table-cell">{tx.broker_name}</td>
                  <td className="BTLV-table-cell">{tx.trade_date}</td>
                  <td className="BTLV-table-cell">{tx.settlement_date}</td>
                  <td className="BTLV-table-cell">{tx.settlement_account}</td>
                  <td className="BTLV-table-cell">{tx.cash_flow_on_settlement}</td>
                  <td className="BTLV-table-cell">{tx.payment_method}</td>
                  <td className="BTLV-table-cell">{tx.generate_payment}</td>
                  <td className="BTLV-table-cell">{tx.money_generation_cost}</td>
                  <td className="BTLV-table-cell">{tx.cost_of_funds}</td>
                  <td className="BTLV-table-cell">{tx.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuyTransactionListView;