import React, { useState } from 'react';
import './Styles/StatementOfComprehensiveIncome.css';

const StatementOfComprehensiveIncome = () => {
  // Mock data as provided
  const mockData = {
    period: {
      endDate: '30th September 2025',
      ytdSeptember2025: 'YTD September 2025',
      ytdAugust2025: 'YTD August 2025',
      sep25: 'Sep-25'
    },
    revenue: {
      note: '3',
      ytdSeptember2025: 328457244,
      ytdAugust2025: 302471628,
      sep25: 25985616
    },
    otherIncome: {
      note: '4',
      ytdSeptember2025: 111058729,
      ytdAugust2025: 88152347,
      sep25: 22906383
    },
    profitFromOperatingActivities: {
      ytdSeptember2025: 439515973,
      ytdAugust2025: 390623974,
      sep25: 48891999
    },
    changeInFairValueOfFinancialAssets: {
      ytdSeptember2025: -103010663,
      ytdAugust2025: -124829151,
      sep25: 21818488
    },
    changeInFairValueOfInvestmentInShares: {
      ytdSeptember2025: 63181799,
      ytdAugust2025: 49314320,
      sep25: 13867479
    },
    sellingAndDistributionExpenses: {
      ytdSeptember2025: -753950,
      ytdAugust2025: -625000,
      sep25: -128950
    },
    administrativeExpenses: {
      ytdSeptember2025: -58532512,
      ytdAugust2025: -34686909,
      sep25: -23845603
    },
    financeCost: {
      note: '5',
      ytdSeptember2025: -69538210,
      ytdAugust2025: -63306460,
      sep25: -6231750
    },
    profitBeforeTax: {
      ytdSeptember2025: 270862437,
      ytdAugust2025: 216490774,
      sep25: 54371663
    },
    incomeTaxExpense: {
      note: '6',
      ytdSeptember2025: -34683954,
      ytdAugust2025: -28292370,
      sep25: -6391584
    },
    profitForThePeriod: {
      ytdSeptember2025: 236178483,
      ytdAugust2025: 188198404,
      sep25: 47980079
    },
    actuarialLossOnDefinedBenefitPlans: {
      note: '15',
      ytdSeptember2025: 0,
      ytdAugust2025: 0,
      sep25: 0
    },
    deferredTaxEffect: {
      ytdSeptember2025: 0,
      ytdAugust2025: 0,
      sep25: 0
    },
    otherComprehensiveExpense: {
      ytdSeptember2025: 0,
      ytdAugust2025: 0,
      sep25: 0
    },
    totalComprehensiveIncome: {
      ytdSeptember2025: 236178483,
      ytdAugust2025: 188198404,
      sep25: 47980079
    }
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
    <div className="comprehensive-income">
      <div className="ci-header">
        <h1>STATEMENT OF COMPREHENSIVE INCOME</h1>
        <div className="ci-period">
          For the period ended {mockData.period.endDate}
        </div>
      </div>

      <div className="ci-content">
        <table className="ci-table">
          <thead>
            <tr>
              <th className="ci-label-col"></th>
              <th className="ci-note-col">Note</th>
              <th className="ci-amount-col">{mockData.period.ytdSeptember2025}</th>
              <th className="ci-amount-col">{mockData.period.ytdAugust2025}</th>
              <th className="ci-amount-col">{mockData.period.sep25}</th>
            </tr>
            <tr>
              <th className="ci-label-col"></th>
              <th className="ci-note-col"></th>
              <th className="ci-amount-col">LKR</th>
              <th className="ci-amount-col">LKR</th>
              <th className="ci-amount-col">LKR</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <tr className="ci-section-row">
              <td className="ci-label">Revenue</td>
              <td className="ci-note">{mockData.revenue.note}</td>
              <td className={`ci-amount ${getAmountClass(mockData.revenue.ytdSeptember2025)}`}>
                {formatNumber(mockData.revenue.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.revenue.ytdAugust2025)}`}>
                {formatNumber(mockData.revenue.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.revenue.sep25)}`}>
                {formatNumber(mockData.revenue.sep25)}
              </td>
            </tr>

            {/* Other Income */}
            <tr className="ci-section-row">
              <td className="ci-label">Other Income</td>
              <td className="ci-note">{mockData.otherIncome.note}</td>
              <td className={`ci-amount ${getAmountClass(mockData.otherIncome.ytdSeptember2025)}`}>
                {formatNumber(mockData.otherIncome.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.otherIncome.ytdAugust2025)}`}>
                {formatNumber(mockData.otherIncome.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.otherIncome.sep25)}`}>
                {formatNumber(mockData.otherIncome.sep25)}
              </td>
            </tr>

            {/* Profit from operating activities */}
            <tr className="ci-total-row">
              <td className="ci-label"><strong>Profit from operating activities</strong></td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.profitFromOperatingActivities.ytdSeptember2025)}`}>
                <strong>{formatNumber(mockData.profitFromOperatingActivities.ytdSeptember2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitFromOperatingActivities.ytdAugust2025)}`}>
                <strong>{formatNumber(mockData.profitFromOperatingActivities.ytdAugust2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitFromOperatingActivities.sep25)}`}>
                <strong>{formatNumber(mockData.profitFromOperatingActivities.sep25)}</strong>
              </td>
            </tr>

            {/* Change in Fair Value of Financial Assets */}
            <tr className="ci-section-row">
              <td className="ci-label">Change in Fair Value of Financial Assets measured at Fair Value Through Profit or Loss</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfFinancialAssets.ytdSeptember2025)}`}>
                {formatNumber(mockData.changeInFairValueOfFinancialAssets.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfFinancialAssets.ytdAugust2025)}`}>
                {formatNumber(mockData.changeInFairValueOfFinancialAssets.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfFinancialAssets.sep25)}`}>
                {formatNumber(mockData.changeInFairValueOfFinancialAssets.sep25)}
              </td>
            </tr>

            {/* Change in Fair Value of Investment in Shares */}
            <tr className="ci-section-row">
              <td className="ci-label">Change in Fair Value of Investment in Shares</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfInvestmentInShares.ytdSeptember2025)}`}>
                {formatNumber(mockData.changeInFairValueOfInvestmentInShares.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfInvestmentInShares.ytdAugust2025)}`}>
                {formatNumber(mockData.changeInFairValueOfInvestmentInShares.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.changeInFairValueOfInvestmentInShares.sep25)}`}>
                {formatNumber(mockData.changeInFairValueOfInvestmentInShares.sep25)}
              </td>
            </tr>

            {/* Selling & Distribution Expenses */}
            <tr className="ci-section-row">
              <td className="ci-label">Selling & Distribution Expenses</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.sellingAndDistributionExpenses.ytdSeptember2025)}`}>
                {formatNumber(mockData.sellingAndDistributionExpenses.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.sellingAndDistributionExpenses.ytdAugust2025)}`}>
                {formatNumber(mockData.sellingAndDistributionExpenses.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.sellingAndDistributionExpenses.sep25)}`}>
                {formatNumber(mockData.sellingAndDistributionExpenses.sep25)}
              </td>
            </tr>

            {/* Administrative Expenses */}
            <tr className="ci-section-row">
              <td className="ci-label">Administrative Expenses</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.administrativeExpenses.ytdSeptember2025)}`}>
                {formatNumber(mockData.administrativeExpenses.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.administrativeExpenses.ytdAugust2025)}`}>
                {formatNumber(mockData.administrativeExpenses.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.administrativeExpenses.sep25)}`}>
                {formatNumber(mockData.administrativeExpenses.sep25)}
              </td>
            </tr>

            {/* Finance Cost */}
            <tr className="ci-section-row">
              <td className="ci-label">Finance Cost</td>
              <td className="ci-note">{mockData.financeCost.note}</td>
              <td className={`ci-amount ${getAmountClass(mockData.financeCost.ytdSeptember2025)}`}>
                {formatNumber(mockData.financeCost.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.financeCost.ytdAugust2025)}`}>
                {formatNumber(mockData.financeCost.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.financeCost.sep25)}`}>
                {formatNumber(mockData.financeCost.sep25)}
              </td>
            </tr>

            {/* Profit Before Tax */}
            <tr className="ci-total-row">
              <td className="ci-label"><strong>Profit Before Tax</strong></td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.profitBeforeTax.ytdSeptember2025)}`}>
                <strong>{formatNumber(mockData.profitBeforeTax.ytdSeptember2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitBeforeTax.ytdAugust2025)}`}>
                <strong>{formatNumber(mockData.profitBeforeTax.ytdAugust2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitBeforeTax.sep25)}`}>
                <strong>{formatNumber(mockData.profitBeforeTax.sep25)}</strong>
              </td>
            </tr>

            {/* Income Tax Expense */}
            <tr className="ci-section-row">
              <td className="ci-label">Income Tax Expense</td>
              <td className="ci-note">{mockData.incomeTaxExpense.note}</td>
              <td className={`ci-amount ${getAmountClass(mockData.incomeTaxExpense.ytdSeptember2025)}`}>
                {formatNumber(mockData.incomeTaxExpense.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.incomeTaxExpense.ytdAugust2025)}`}>
                {formatNumber(mockData.incomeTaxExpense.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.incomeTaxExpense.sep25)}`}>
                {formatNumber(mockData.incomeTaxExpense.sep25)}
              </td>
            </tr>

            {/* Profit for The Period */}
            <tr className="ci-total-row">
              <td className="ci-label"><strong>Profit for The Period</strong></td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.profitForThePeriod.ytdSeptember2025)}`}>
                <strong>{formatNumber(mockData.profitForThePeriod.ytdSeptember2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitForThePeriod.ytdAugust2025)}`}>
                <strong>{formatNumber(mockData.profitForThePeriod.ytdAugust2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.profitForThePeriod.sep25)}`}>
                <strong>{formatNumber(mockData.profitForThePeriod.sep25)}</strong>
              </td>
            </tr>

            {/* Other Comprehensive Income Section */}
            <tr className="ci-section-header">
              <td colSpan="5" className="ci-label"><strong>Other Comprehensive Income</strong></td>
            </tr>

            {/* Actuarial Loss on Defined Benefit Plans */}
            <tr className="ci-section-row">
              <td className="ci-label">Actuarial Loss on Defined Benefit Plans</td>
              <td className="ci-note">{mockData.actuarialLossOnDefinedBenefitPlans.note}</td>
              <td className={`ci-amount ${getAmountClass(mockData.actuarialLossOnDefinedBenefitPlans.ytdSeptember2025)}`}>
                {formatNumber(mockData.actuarialLossOnDefinedBenefitPlans.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.actuarialLossOnDefinedBenefitPlans.ytdAugust2025)}`}>
                {formatNumber(mockData.actuarialLossOnDefinedBenefitPlans.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.actuarialLossOnDefinedBenefitPlans.sep25)}`}>
                {formatNumber(mockData.actuarialLossOnDefinedBenefitPlans.sep25)}
              </td>
            </tr>

            {/* Deferred tax effect on the above */}
            <tr className="ci-section-row">
              <td className="ci-label">Deferred tax effect on the above</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.deferredTaxEffect.ytdSeptember2025)}`}>
                {formatNumber(mockData.deferredTaxEffect.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.deferredTaxEffect.ytdAugust2025)}`}>
                {formatNumber(mockData.deferredTaxEffect.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.deferredTaxEffect.sep25)}`}>
                {formatNumber(mockData.deferredTaxEffect.sep25)}
              </td>
            </tr>

            {/* Other Comprehensive Expense for the Year, net of tax */}
            <tr className="ci-section-row">
              <td className="ci-label">Other Comprehensive Expense for the Year, net of tax</td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.otherComprehensiveExpense.ytdSeptember2025)}`}>
                {formatNumber(mockData.otherComprehensiveExpense.ytdSeptember2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.otherComprehensiveExpense.ytdAugust2025)}`}>
                {formatNumber(mockData.otherComprehensiveExpense.ytdAugust2025)}
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.otherComprehensiveExpense.sep25)}`}>
                {formatNumber(mockData.otherComprehensiveExpense.sep25)}
              </td>
            </tr>

            {/* Total Comprehensive Income for the Year, net of tax */}
            <tr className="ci-total-row ci-final-row">
              <td className="ci-label"><strong>Total Comprehensive Income for the Year, net of tax</strong></td>
              <td className="ci-note"></td>
              <td className={`ci-amount ${getAmountClass(mockData.totalComprehensiveIncome.ytdSeptember2025)}`}>
                <strong>{formatNumber(mockData.totalComprehensiveIncome.ytdSeptember2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.totalComprehensiveIncome.ytdAugust2025)}`}>
                <strong>{formatNumber(mockData.totalComprehensiveIncome.ytdAugust2025)}</strong>
              </td>
              <td className={`ci-amount ${getAmountClass(mockData.totalComprehensiveIncome.sep25)}`}>
                <strong>{formatNumber(mockData.totalComprehensiveIncome.sep25)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="ci-footer">
          <p>The accounting policies and notes on pages 07 through 21 form an integral part of the financial statements.</p>
        </div>
      </div>
    </div>
  );
};

export default StatementOfComprehensiveIncome;










