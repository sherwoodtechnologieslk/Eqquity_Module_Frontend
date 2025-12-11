import React, { useState } from 'react';
import './Styles/CashFlow.css';

const CashFlow = () => {
  const [activeTab, setActiveTab] = useState('operating');

  // Sample data for Operating Cash Flow
  const operatingCashFlowData = {
    profitBeforeTax: 270862437,
    adjustments: {
      depreciation: 12500000,
      amortization: 3500000,
      changeInFairValue: -103010663,
      interestExpense: 69538210,
      otherNonCash: 8500000
    },
    workingCapitalChanges: {
      tradeReceivables: -2500000,
      tradePayables: 1800000,
      inventories: -1200000,
      prepayments: 500000,
      otherCurrentAssets: -300000
    },
    cashFromOperations: 236178483,
    interestPaid: -6231750,
    incomeTaxPaid: -6391584,
    netCashFromOperatingActivities: 223715149
  };

  // Sample data for Investing Cash Flow
  const investingCashFlowData = {
    purchaseOfProperty: -15000000,
    purchaseOfEquipment: -8500000,
    purchaseOfFinancialAssets: -50000000,
    saleOfProperty: 5000000,
    saleOfEquipment: 1200000,
    saleOfFinancialAssets: 15000000,
    interestReceived: 2500000,
    dividendsReceived: 8500000,
    netCashUsedInInvestingActivities: -50150000
  };

  // Sample data for Financing Cash Flow
  const financingCashFlowData = {
    proceedsFromShareIssue: 0,
    proceedsFromBorrowings: 100000000,
    repaymentOfBorrowings: -25000000,
    paymentOfLeaseLiabilities: -500000,
    dividendsPaid: -45000000,
    interestPaid: -6231750,
    netCashFromFinancingActivities: 23728250
  };

  // Summary data
  const summaryData = {
    netCashFromOperating: 223715149,
    netCashUsedInInvesting: -50150000,
    netCashFromFinancing: 23728250,
    netIncreaseInCash: 197443399,
    cashAtBeginning: 241250,
    cashAtEnd: 197684649
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getAmountClass = (amount) => {
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'neutral';
  };

  return (
    <div className="cash-flow-container">
      {/* Header */}
      <div className="cf-header">
        <h1 className="cf-main-title">STATEMENT OF CASH FLOWS</h1>
        <div className="cf-period-info">
          <span className="cf-period-label">For the period ended:</span>
          <span className="cf-period-date">
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cf-summary-cards">
        <div className="cf-summary-card operating">
          <div className="cf-card-inner">
            <div className="cf-card-header-wrapper">
              <div className="cf-card-header">Operating Activities</div>
              <div className="cf-card-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>
            <div className="cf-card-value-wrapper">
              <div className={`cf-card-value ${getAmountClass(summaryData.netCashFromOperating)}`}>
                {formatCurrency(summaryData.netCashFromOperating)}
              </div>
              <div className="cf-card-subtitle">Cash from operations</div>
            </div>
          </div>
        </div>
        <div className="cf-summary-card investing">
          <div className="cf-card-inner">
            <div className="cf-card-header-wrapper">
              <div className="cf-card-header">Investing Activities</div>
              <div className="cf-card-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <div className="cf-card-value-wrapper">
              <div className={`cf-card-value ${getAmountClass(summaryData.netCashUsedInInvesting)}`}>
                {formatCurrency(summaryData.netCashUsedInInvesting)}
              </div>
              <div className="cf-card-subtitle">Net investment flow</div>
            </div>
          </div>
        </div>
        <div className="cf-summary-card financing">
          <div className="cf-card-inner">
            <div className="cf-card-header-wrapper">
              <div className="cf-card-header">Financing Activities</div>
              <div className="cf-card-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <div className="cf-card-value-wrapper">
              <div className={`cf-card-value ${getAmountClass(summaryData.netCashFromFinancing)}`}>
                {formatCurrency(summaryData.netCashFromFinancing)}
              </div>
              <div className="cf-card-subtitle">Capital transactions</div>
            </div>
          </div>
        </div>
        <div className="cf-summary-card net">
          <div className="cf-card-inner">
            <div className="cf-card-header-wrapper">
              <div className="cf-card-header">Net Increase in Cash</div>
              <div className="cf-card-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  <circle cx="19" cy="19" r="2"/>
                </svg>
              </div>
            </div>
            <div className="cf-card-value-wrapper">
              <div className={`cf-card-value ${getAmountClass(summaryData.netIncreaseInCash)}`}>
                {formatCurrency(summaryData.netIncreaseInCash)}
              </div>
              <div className="cf-card-subtitle">Total cash movement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="cf-tabs-container">
        <button
          className={`cf-tab ${activeTab === 'operating' ? 'active' : ''}`}
          onClick={() => setActiveTab('operating')}
        >
          Operating Cash Flow
        </button>
        <button
          className={`cf-tab ${activeTab === 'investing' ? 'active' : ''}`}
          onClick={() => setActiveTab('investing')}
        >
          Investing Cash Flow
        </button>
        <button
          className={`cf-tab ${activeTab === 'financing' ? 'active' : ''}`}
          onClick={() => setActiveTab('financing')}
        >
          Financing Cash Flow
        </button>
        <button
          className={`cf-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Cash Flow Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="cf-content">
        {activeTab === 'operating' && (
          <div className="cf-tab-content">
            <h2 className="cf-section-title">Operating Activities</h2>
            
            <div className="cf-table-section">
              <table className="cf-data-table">
                <thead>
                  <tr>
                    <th className="cf-th-label">Description</th>
                    <th className="cf-th-amount">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cf-section-header-row">
                    <td colSpan="2"><strong>Cash flows from operating activities</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label">Profit before tax</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.profitBeforeTax)}`}>
                      {formatNumber(operatingCashFlowData.profitBeforeTax)}
                    </td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Adjustments for:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Depreciation</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.adjustments.depreciation)}`}>
                      {formatNumber(operatingCashFlowData.adjustments.depreciation)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Amortization</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.adjustments.amortization)}`}>
                      {formatNumber(operatingCashFlowData.adjustments.amortization)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Change in fair value of financial assets</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.adjustments.changeInFairValue)}`}>
                      {formatNumber(operatingCashFlowData.adjustments.changeInFairValue)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Interest expense</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.adjustments.interestExpense)}`}>
                      {formatNumber(operatingCashFlowData.adjustments.interestExpense)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Other non-cash items</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.adjustments.otherNonCash)}`}>
                      {formatNumber(operatingCashFlowData.adjustments.otherNonCash)}
                    </td>
                  </tr>
                  
                  <tr className="cf-total-row">
                    <td className="cf-label"><strong>Cash from operations</strong></td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.cashFromOperations)}`}>
                      <strong>{formatNumber(operatingCashFlowData.cashFromOperations)}</strong>
                    </td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Changes in working capital:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Trade and other receivables</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.workingCapitalChanges.tradeReceivables)}`}>
                      {formatNumber(operatingCashFlowData.workingCapitalChanges.tradeReceivables)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Trade and other payables</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.workingCapitalChanges.tradePayables)}`}>
                      {formatNumber(operatingCashFlowData.workingCapitalChanges.tradePayables)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Inventories</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.workingCapitalChanges.inventories)}`}>
                      {formatNumber(operatingCashFlowData.workingCapitalChanges.inventories)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Prepayments</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.workingCapitalChanges.prepayments)}`}>
                      {formatNumber(operatingCashFlowData.workingCapitalChanges.prepayments)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Other current assets</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.workingCapitalChanges.otherCurrentAssets)}`}>
                      {formatNumber(operatingCashFlowData.workingCapitalChanges.otherCurrentAssets)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label">Interest paid</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.interestPaid)}`}>
                      {formatNumber(operatingCashFlowData.interestPaid)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label">Income tax paid</td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.incomeTaxPaid)}`}>
                      {formatNumber(operatingCashFlowData.incomeTaxPaid)}
                    </td>
                  </tr>
                  
                  <tr className="cf-final-total-row">
                    <td className="cf-label"><strong>Net cash from operating activities</strong></td>
                    <td className={`cf-amount ${getAmountClass(operatingCashFlowData.netCashFromOperatingActivities)}`}>
                      <strong>{formatNumber(operatingCashFlowData.netCashFromOperatingActivities)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'investing' && (
          <div className="cf-tab-content">
            <h2 className="cf-section-title">Investing Activities</h2>
            
            <div className="cf-table-section">
              <table className="cf-data-table">
                <thead>
                  <tr>
                    <th className="cf-th-label">Description</th>
                    <th className="cf-th-amount">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cf-section-header-row">
                    <td colSpan="2"><strong>Cash flows from investing activities</strong></td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Cash payments for:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Purchase of property, plant and equipment</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.purchaseOfProperty)}`}>
                      {formatNumber(investingCashFlowData.purchaseOfProperty)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Purchase of equipment</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.purchaseOfEquipment)}`}>
                      {formatNumber(investingCashFlowData.purchaseOfEquipment)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Purchase of financial assets</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.purchaseOfFinancialAssets)}`}>
                      {formatNumber(investingCashFlowData.purchaseOfFinancialAssets)}
                    </td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Cash receipts from:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Sale of property</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.saleOfProperty)}`}>
                      {formatNumber(investingCashFlowData.saleOfProperty)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Sale of equipment</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.saleOfEquipment)}`}>
                      {formatNumber(investingCashFlowData.saleOfEquipment)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Sale of financial assets</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.saleOfFinancialAssets)}`}>
                      {formatNumber(investingCashFlowData.saleOfFinancialAssets)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Interest received</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.interestReceived)}`}>
                      {formatNumber(investingCashFlowData.interestReceived)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Dividends received</td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.dividendsReceived)}`}>
                      {formatNumber(investingCashFlowData.dividendsReceived)}
                    </td>
                  </tr>
                  
                  <tr className="cf-final-total-row">
                    <td className="cf-label"><strong>Net cash used in investing activities</strong></td>
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.netCashUsedInInvestingActivities)}`}>
                      <strong>{formatNumber(investingCashFlowData.netCashUsedInInvestingActivities)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'financing' && (
          <div className="cf-tab-content">
            <h2 className="cf-section-title">Financing Activities</h2>
            
            <div className="cf-table-section">
              <table className="cf-data-table">
                <thead>
                  <tr>
                    <th className="cf-th-label">Description</th>
                    <th className="cf-th-amount">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cf-section-header-row">
                    <td colSpan="2"><strong>Cash flows from financing activities</strong></td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Cash receipts from:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Proceeds from issue of shares</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.proceedsFromShareIssue)}`}>
                      {formatNumber(financingCashFlowData.proceedsFromShareIssue)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Proceeds from borrowings</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.proceedsFromBorrowings)}`}>
                      {formatNumber(financingCashFlowData.proceedsFromBorrowings)}
                    </td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Cash payments for:</strong></td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Repayment of borrowings</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.repaymentOfBorrowings)}`}>
                      {formatNumber(financingCashFlowData.repaymentOfBorrowings)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Payment of lease liabilities</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.paymentOfLeaseLiabilities)}`}>
                      {formatNumber(financingCashFlowData.paymentOfLeaseLiabilities)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Dividends paid</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.dividendsPaid)}`}>
                      {formatNumber(financingCashFlowData.dividendsPaid)}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="cf-label-indent">Interest paid</td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.interestPaid)}`}>
                      {formatNumber(financingCashFlowData.interestPaid)}
                    </td>
                  </tr>
                  
                  <tr className="cf-final-total-row">
                    <td className="cf-label"><strong>Net cash from financing activities</strong></td>
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.netCashFromFinancingActivities)}`}>
                      <strong>{formatNumber(financingCashFlowData.netCashFromFinancingActivities)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="cf-tab-content">
            <h2 className="cf-section-title">Cash Flow Analysis</h2>
            
            <div className="cf-analysis-section">
              <div className="cf-analysis-cards">
                <div className="cf-analysis-card">
                  <div className="cf-analysis-card-header">Cash Flow Summary</div>
                  <div className="cf-analysis-card-content">
                    <table className="cf-summary-table">
                      <tbody>
                        <tr>
                          <td className="cf-summary-label">Net cash from operating activities</td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.netCashFromOperating)}`}>
                            {formatCurrency(summaryData.netCashFromOperating)}
                          </td>
                        </tr>
                        <tr>
                          <td className="cf-summary-label">Net cash used in investing activities</td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.netCashUsedInInvesting)}`}>
                            {formatCurrency(summaryData.netCashUsedInInvesting)}
                          </td>
                        </tr>
                        <tr>
                          <td className="cf-summary-label">Net cash from financing activities</td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.netCashFromFinancing)}`}>
                            {formatCurrency(summaryData.netCashFromFinancing)}
                          </td>
                        </tr>
                        <tr className="cf-summary-total">
                          <td className="cf-summary-label"><strong>Net increase in cash and cash equivalents</strong></td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.netIncreaseInCash)}`}>
                            <strong>{formatCurrency(summaryData.netIncreaseInCash)}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td className="cf-summary-label">Cash and cash equivalents at beginning of period</td>
                          <td className="cf-summary-value">
                            {formatCurrency(summaryData.cashAtBeginning)}
                          </td>
                        </tr>
                        <tr className="cf-summary-total">
                          <td className="cf-summary-label"><strong>Cash and cash equivalents at end of period</strong></td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.cashAtEnd)}`}>
                            <strong>{formatCurrency(summaryData.cashAtEnd)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="cf-analysis-card">
                  <div className="cf-analysis-card-header">Key Metrics</div>
                  <div className="cf-analysis-card-content">
                    <div className="cf-metric-item">
                      <span className="cf-metric-label">Operating Cash Flow Ratio</span>
                      <span className="cf-metric-value positive">1.15</span>
                    </div>
                    <div className="cf-metric-item">
                      <span className="cf-metric-label">Free Cash Flow</span>
                      <span className={`cf-metric-value ${getAmountClass(summaryData.netCashFromOperating + summaryData.netCashUsedInInvesting)}`}>
                        {formatCurrency(summaryData.netCashFromOperating + summaryData.netCashUsedInInvesting)}
                      </span>
                    </div>
                    <div className="cf-metric-item">
                      <span className="cf-metric-label">Cash Conversion Cycle (Days)</span>
                      <span className="cf-metric-value">45</span>
                    </div>
                    <div className="cf-metric-item">
                      <span className="cf-metric-label">Cash Flow Margin (%)</span>
                      <span className="cf-metric-value positive">68.2%</span>
                    </div>
                  </div>
                </div>

                <div className="cf-analysis-card">
                  <div className="cf-analysis-card-header">Trend Analysis</div>
                  <div className="cf-analysis-card-content">
                    <div className="cf-trend-item">
                      <span className="cf-trend-label">Operating Cash Flow Trend</span>
                      <span className="cf-trend-value positive">↑ Increasing</span>
                    </div>
                    <div className="cf-trend-item">
                      <span className="cf-trend-label">Investing Activities Trend</span>
                      <span className="cf-trend-value negative">↓ Net Outflow</span>
                    </div>
                    <div className="cf-trend-item">
                      <span className="cf-trend-label">Financing Activities Trend</span>
                      <span className="cf-trend-value positive">↑ Net Inflow</span>
                    </div>
                    <div className="cf-trend-item">
                      <span className="cf-trend-label">Overall Cash Position</span>
                      <span className="cf-trend-value positive">↑ Strong</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cf-insights-section">
                <h3 className="cf-insights-title">Key Insights</h3>
                <ul className="cf-insights-list">
                  <li className="cf-insight-item positive">
                    <strong>Strong Operating Performance:</strong> The company generated LKR {formatCurrency(summaryData.netCashFromOperating)} from operating activities, indicating healthy cash generation from core business operations.
                  </li>
                  <li className="cf-insight-item">
                    <strong>Investment Activities:</strong> Net cash outflow of LKR {formatCurrency(Math.abs(summaryData.netCashUsedInInvesting))} reflects strategic investments in assets and financial instruments.
                  </li>
                  <li className="cf-insight-item positive">
                    <strong>Financing Activities:</strong> Positive cash flow from financing activities suggests the company is effectively managing its capital structure.
                  </li>
                  <li className="cf-insight-item positive">
                    <strong>Cash Position:</strong> The net increase in cash of LKR {formatCurrency(summaryData.netIncreaseInCash)} demonstrates strong liquidity management.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlow;
