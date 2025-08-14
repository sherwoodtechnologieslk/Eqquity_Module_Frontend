// src/components/BuyDealSlip.js
import React from 'react';
import './Styles/BuyDealSlip.css';

const BuyDealSlip = ({ transaction }) => {
  if (!transaction) return <p>No transaction selected.</p>;

  return (
    <div className="buy-slip-container">
      <h2 className="buy-slip-title">Buy Deal Slip</h2>
      <div className="buy-slip-grid">
        <div><strong>Company Name:</strong> {transaction.companyName}</div>
        <div><strong>Portfolio:</strong> {transaction.portfolio || '—'}</div>
        <div><strong>Deal Number:</strong> {transaction.dealNumber || '—'}</div>
        <div><strong>Quantity:</strong> {transaction.quantity}</div>
        <div><strong>Price per Share:</strong> Rs. {transaction.price}</div>
        <div><strong>Gross Value:</strong> Rs. {transaction.grossValue}</div>
        <div><strong>Brokerage:</strong> Rs. {transaction.brokerage}</div>
        <div><strong>CDS Fees:</strong> Rs. {transaction.cdsFees}</div>
        <div><strong>CSE Fees:</strong> Rs. {transaction.cseFees}</div>
        <div><strong>SEC:</strong> Rs. {transaction.sec}</div>
        <div><strong>STL:</strong> Rs. {transaction.stl}</div>
        <div><strong>Net Value:</strong> Rs. {transaction.netValue}</div>
        <div><strong>Cash Flow on Settlement:</strong> Rs. {transaction.cashFlowOnSettlement}</div>
        <div><strong>Contract Number:</strong> {transaction.contractNumber}</div>
        <div><strong>Broker Name:</strong> {transaction.brokerName}</div>
        <div><strong>Trade Date:</strong> {transaction.tradeDate}</div>
        <div><strong>Settlement Date:</strong> {transaction.settlementDate}</div>
        <div><strong>Settlement Account:</strong> {transaction.settlementAccount}</div>
        <div><strong>Payment Method:</strong> {transaction.paymentMethod || '—'}</div>
        <div><strong>Cost of Funds (%):</strong> {transaction.costOfFunds || '—'}</div>
        <div><strong>Money Generation Cost:</strong> Rs. {transaction.moneyGenerationCost || '—'}</div>
        <div><strong>Generate Payment:</strong> {transaction.generatePayment}</div>
      </div>
    </div>
  );
};

export default BuyDealSlip;
