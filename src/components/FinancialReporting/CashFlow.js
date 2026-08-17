import React, { useState } from 'react';
import './Styles/CashFlow.css';
import './Styles/FinancialNoteLinks.css';
import {
  enrichNotesContext,
  resolveNoteForCashFlowLine
} from '../../utils/financialNotesRegistry';

const CashFlow = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState('operating');
  const periodEnd = new Date().toISOString().split('T')[0];

  const goToNote = (lineKey, lineLabel) => {
    const note = resolveNoteForCashFlowLine(lineKey);
    if (!note || typeof onTabChange !== 'function') return;
    onTabChange(
      'Financial Reporting Notes',
      enrichNotesContext({
        source: 'CASH_FLOW',
        lineKey,
        lineLabel,
        asOfDate: periodEnd,
        note
      })
    );
  };

  const renderNoteLink = (lineKey, lineLabel) => {
    const note = resolveNoteForCashFlowLine(lineKey);
    if (!note || typeof onTabChange !== 'function') return null;
    return (
      <button
        type="button"
        className="fr-note-link"
        onClick={() => goToNote(lineKey, lineLabel)}
        title={`View ${note.title} (Note ${note.number})`}
      >
        Note {note.number}
      </button>
    );
  };

  const renderOpLabel = (label, lineKey) => (
    <span className="cf-label-with-note">
      <span>{label}</span>
      {lineKey ? renderNoteLink(lineKey, label) : null}
    </span>
  );

  const renderTableLabel = (label, lineKey, { indent = false } = {}) => (
    <td className={indent ? 'cf-label-indent' : 'cf-label'}>
      <span className="cf-label-with-note">
        <span>{label}</span>
        {lineKey ? renderNoteLink(lineKey, label) : null}
      </span>
    </td>
  );

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
      <header className="cf-header">
        <div className="cf-header-left">
          <div className="cf-header-text-group">
            <p className="cf-eyebrow">Accounting · Reporting</p>
            <h1 className="cf-main-title">Statement of Cash Flows</h1>
            <p className="cf-subtitle">Operating, investing &amp; financing cash movements for the period</p>
          </div>
        </div>
        <div className="cf-period-info">
          <span className="cf-period-label">Period ended</span>
          <span className="cf-period-date">
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </header>

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
            <div className="cf-op-page-header">
              <div>
                <h2 className="cf-section-title">Operating Activities</h2>
                <p className="cf-op-subtitle">Cash flows generated from core business operations</p>
              </div>
            </div>

            <div className="cf-op-layout">
              {/* Left: Grouped Cards */}
              <div className="cf-op-groups">

                {/* Starting Point */}
                <div className="cf-op-group cf-op-group--base">
                  <div className="cf-op-group-header">
                    <span className="cf-op-group-title">Starting Point</span>
                  </div>
                  <div className="cf-op-row cf-op-row--highlight">
                    <span className="cf-op-row-label">Profit before tax</span>
                    <span className={`cf-op-row-value ${getAmountClass(operatingCashFlowData.profitBeforeTax)}`}>
                      LKR {formatNumber(operatingCashFlowData.profitBeforeTax)}
                    </span>
                  </div>
                </div>

                {/* Non-cash Adjustments */}
                <div className="cf-op-group cf-op-group--adjustments">
                  <div className="cf-op-group-header">
                    <span className="cf-op-group-title">Non-cash Adjustments</span>
                  </div>
                  <div className="cf-op-rows">
                    {[
                      { key: 'depreciation', label: 'Depreciation', value: operatingCashFlowData.adjustments.depreciation },
                      { key: 'amortization', label: 'Amortization', value: operatingCashFlowData.adjustments.amortization },
                      { key: 'changeInFairValue', label: 'Change in fair value of financial assets', value: operatingCashFlowData.adjustments.changeInFairValue },
                      { key: 'interestExpense', label: 'Interest expense', value: operatingCashFlowData.adjustments.interestExpense },
                      { key: 'otherNonCash', label: 'Other non-cash items', value: operatingCashFlowData.adjustments.otherNonCash },
                    ].map((item) => (
                      <div key={item.key} className="cf-op-row">
                        <span className="cf-op-row-label">{renderOpLabel(item.label, item.key)}</span>
                        <span className={`cf-op-row-value ${getAmountClass(item.value)}`}>
                          <span className="cf-op-sign">{item.value < 0 ? '−' : '+'}</span>
                          {formatNumber(Math.abs(item.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="cf-op-subtotal">
                    <span className="cf-op-subtotal-label">Cash from operations</span>
                    <span className={`cf-op-subtotal-value ${getAmountClass(operatingCashFlowData.cashFromOperations)}`}>
                      LKR {formatNumber(operatingCashFlowData.cashFromOperations)}
                    </span>
                  </div>
                </div>

                {/* Working Capital Changes */}
                <div className="cf-op-group cf-op-group--working-capital">
                  <div className="cf-op-group-header">
                    <span className="cf-op-group-title">Changes in Working Capital</span>
                  </div>
                  <div className="cf-op-rows">
                    {[
                      { key: 'tradeReceivables', label: 'Trade and other receivables', value: operatingCashFlowData.workingCapitalChanges.tradeReceivables },
                      { key: 'tradePayables', label: 'Trade and other payables', value: operatingCashFlowData.workingCapitalChanges.tradePayables },
                      { key: 'inventories', label: 'Inventories', value: operatingCashFlowData.workingCapitalChanges.inventories },
                      { key: 'prepayments', label: 'Prepayments', value: operatingCashFlowData.workingCapitalChanges.prepayments },
                      { key: 'otherCurrentAssets', label: 'Other current assets', value: operatingCashFlowData.workingCapitalChanges.otherCurrentAssets },
                    ].map((item) => (
                      <div key={item.key} className="cf-op-row">
                        <span className="cf-op-row-label">{renderOpLabel(item.label, item.key)}</span>
                        <span className={`cf-op-row-value ${getAmountClass(item.value)}`}>
                          <span className="cf-op-sign">{item.value < 0 ? '−' : '+'}</span>
                          {formatNumber(Math.abs(item.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax & Interest */}
                <div className="cf-op-group cf-op-group--tax">
                  <div className="cf-op-group-header">
                    <span className="cf-op-group-title">Tax &amp; Interest Payments</span>
                  </div>
                  <div className="cf-op-rows">
                    {[
                      { key: 'interestPaid', label: 'Interest paid', value: operatingCashFlowData.interestPaid },
                      { key: 'incomeTaxPaid', label: 'Income tax paid', value: operatingCashFlowData.incomeTaxPaid },
                    ].map((item) => (
                      <div key={item.key} className="cf-op-row">
                        <span className="cf-op-row-label">{renderOpLabel(item.label, item.key)}</span>
                        <span className={`cf-op-row-value ${getAmountClass(item.value)}`}>
                          <span className="cf-op-sign">{item.value < 0 ? '−' : '+'}</span>
                          {formatNumber(Math.abs(item.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Net Total */}
                <div className="cf-op-net-total">
                  <span className="cf-op-net-total-label">Net Cash from Operating Activities</span>
                  <span className={`cf-op-net-total-value ${getAmountClass(operatingCashFlowData.netCashFromOperatingActivities)}`}>
                    LKR {formatNumber(operatingCashFlowData.netCashFromOperatingActivities)}
                  </span>
                </div>

              </div>

              {/* Right: Flow Summary */}
              <div className="cf-op-summary">
                <div className="cf-op-summary-title">Cash Flow Breakdown</div>

                <div className="cf-op-flow">
                  <div className="cf-op-flow-step">
                    <div className="cf-op-flow-body">
                      <div className="cf-op-flow-label">Profit before tax</div>
                      <div className={`cf-op-flow-value ${getAmountClass(operatingCashFlowData.profitBeforeTax)}`}>
                        {formatNumber(operatingCashFlowData.profitBeforeTax)}
                      </div>
                    </div>
                  </div>
                  <div className="cf-op-flow-connector"></div>

                  <div className="cf-op-flow-step">
                    <div className="cf-op-flow-body">
                      <div className="cf-op-flow-label">After non-cash adjustments</div>
                      <div className={`cf-op-flow-value ${getAmountClass(operatingCashFlowData.cashFromOperations)}`}>
                        {formatNumber(operatingCashFlowData.cashFromOperations)}
                      </div>
                    </div>
                  </div>
                  <div className="cf-op-flow-connector"></div>

                  <div className="cf-op-flow-step">
                    <div className="cf-op-flow-body">
                      <div className="cf-op-flow-label">After working capital</div>
                      <div className="cf-op-flow-value">
                        {formatNumber(
                          operatingCashFlowData.cashFromOperations +
                          Object.values(operatingCashFlowData.workingCapitalChanges).reduce((a, b) => a + b, 0)
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="cf-op-flow-connector"></div>

                  <div className="cf-op-flow-step cf-op-flow-step--final">
                    <div className="cf-op-flow-body">
                      <div className="cf-op-flow-label">Net operating cash</div>
                      <div className={`cf-op-flow-value cf-op-flow-value--final ${getAmountClass(operatingCashFlowData.netCashFromOperatingActivities)}`}>
                        {formatNumber(operatingCashFlowData.netCashFromOperatingActivities)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cf-op-summary-breakdown">
                  <div className="cf-op-summary-breakdown-title">Component Contributions</div>
                  {[
                    {
                      label: 'Profit before tax',
                      value: operatingCashFlowData.profitBeforeTax
                    },
                    {
                      label: 'Adjustments',
                      value: Object.values(operatingCashFlowData.adjustments).reduce((a, b) => a + b, 0)
                    },
                    {
                      label: 'Working capital',
                      value: Object.values(operatingCashFlowData.workingCapitalChanges).reduce((a, b) => a + b, 0)
                    },
                    {
                      label: 'Tax & interest',
                      value: operatingCashFlowData.interestPaid + operatingCashFlowData.incomeTaxPaid
                    },
                  ].map((item, i) => (
                    <div key={i} className="cf-op-breakdown-row">
                      <div className="cf-op-breakdown-label">{item.label}</div>
                      <div className={`cf-op-breakdown-value ${getAmountClass(item.value)}`}>
                        {item.value >= 0 ? '+' : '−'}{formatNumber(Math.abs(item.value))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                    {renderTableLabel('Purchase of property, plant and equipment', 'purchaseOfProperty', { indent: true })}
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.purchaseOfProperty)}`}>
                      {formatNumber(investingCashFlowData.purchaseOfProperty)}
                    </td>
                  </tr>
                  
                  <tr>
                    {renderTableLabel('Purchase of equipment', 'purchaseOfEquipment', { indent: true })}
                    <td className={`cf-amount ${getAmountClass(investingCashFlowData.purchaseOfEquipment)}`}>
                      {formatNumber(investingCashFlowData.purchaseOfEquipment)}
                    </td>
                  </tr>
                  
                  <tr>
                    {renderTableLabel('Purchase of financial assets', 'purchaseOfFinancialAssets', { indent: true })}
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
                    {renderTableLabel('Sale of financial assets', 'saleOfFinancialAssets', { indent: true })}
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
                    {renderTableLabel('Proceeds from borrowings', 'proceedsFromBorrowings', { indent: true })}
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.proceedsFromBorrowings)}`}>
                      {formatNumber(financingCashFlowData.proceedsFromBorrowings)}
                    </td>
                  </tr>
                  
                  <tr className="cf-subsection-header">
                    <td colSpan="2"><strong>Cash payments for:</strong></td>
                  </tr>
                  
                  <tr>
                    {renderTableLabel('Repayment of borrowings', 'repaymentOfBorrowings', { indent: true })}
                    <td className={`cf-amount ${getAmountClass(financingCashFlowData.repaymentOfBorrowings)}`}>
                      {formatNumber(financingCashFlowData.repaymentOfBorrowings)}
                    </td>
                  </tr>
                  
                  <tr>
                    {renderTableLabel('Payment of lease liabilities', 'paymentOfLeaseLiabilities', { indent: true })}
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
                          <td className="cf-summary-label">
                            <span className="cf-label-with-note">
                              <strong>Net increase in cash and cash equivalents</strong>
                              {renderNoteLink('netIncreaseInCash', 'Net increase in cash and cash equivalents')}
                            </span>
                          </td>
                          <td className={`cf-summary-value ${getAmountClass(summaryData.netIncreaseInCash)}`}>
                            <strong>{formatCurrency(summaryData.netIncreaseInCash)}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td className="cf-summary-label">
                            <span className="cf-label-with-note">
                              <span>Cash and cash equivalents at beginning of period</span>
                              {renderNoteLink('cashAtBeginning', 'Cash and cash equivalents at beginning of period')}
                            </span>
                          </td>
                          <td className="cf-summary-value">
                            {formatCurrency(summaryData.cashAtBeginning)}
                          </td>
                        </tr>
                        <tr className="cf-summary-total">
                          <td className="cf-summary-label">
                            <span className="cf-label-with-note">
                              <strong>Cash and cash equivalents at end of period</strong>
                              {renderNoteLink('cashAtEnd', 'Cash and cash equivalents at end of period')}
                            </span>
                          </td>
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
