// src/components/SellDealSlip.js
import React from 'react';
import './Styles/SellDealSlip.css';

const SellDealSlip = ({ transaction }) => {
  if (!transaction) return <p>No transaction selected.</p>;

  return (
    <div className="sell-slip-container">
      <h2 className="sell-slip-title">Sell Deal Slip</h2>
      <div className="sell-slip-grid">
        <div><strong>Company Name:</strong> {transaction.companyName}</div>
        <div><strong>Contract Number:</strong> {transaction.contractNumber}</div>
        <div><strong>Quantity:</strong> {transaction.quantity}</div>
        <div><strong>Bought Price:</strong> Rs. {transaction.boughtPrice}</div>
        <div><strong>Sold Price:</strong> Rs. {transaction.soldPrice}</div>
        <div><strong>Capital Gain:</strong> Rs. {transaction.capitalGain}</div>
        <div><strong>Holding Cost:</strong> Rs. {transaction.holdingCost || '—'}</div>
        <div><strong>Net Profit/Loss:</strong> Rs. {transaction.profitLoss}</div>
        <div><strong>Broker Name:</strong> {transaction.brokerName}</div>
        <div><strong>Trade Date:</strong> {transaction.tradeDate}</div>
        <div><strong>Settlement Date:</strong> {transaction.settlementDate}</div>
        <div><strong>Settlement Account:</strong> {transaction.settlementAccount || '—'}</div>
        <div><strong>Holding Days:</strong> {transaction.hdays}</div>
        <div><strong>WAP:</strong> Rs. {transaction.wap || '—'}</div>
        <div><strong>CP (Closing Price):</strong> Rs. {transaction.cp || '—'}</div>
        <div><strong>Buy Contract Ref:</strong> {transaction.buyContract || '—'}</div>
        <div><strong>Cost of Funds (%):</strong> {transaction.costOfFunds || '—'}</div>
      </div>
    </div>
  );
};

export default SellDealSlip;
