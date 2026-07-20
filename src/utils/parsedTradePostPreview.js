import { tradeSummaryAPI } from '../services/api';

const BUY_SETTLEMENT_PAYABLE = '249-101-270-001-44';
const SELL_SETTLEMENT_RECEIVABLE = '131-101-290-001-44';
const SELL_CAPITAL_GAIN_LOSS = '467-101-190-001-44';
const DEFAULT_INVESTMENT = '131-101-350-001-44';

export const buildParsedSymbol = (transaction) => {
  const t = transaction || {};
  return `${t.company_id || ''}.${t.main_type || ''}${t.sub_type || ''}`;
};

export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return String(dateString).split('T')[0].replace(/\//g, '-');
};

const calculateFeesFallback = (grossValue) => {
  let brokerage;
  let stl;

  if (grossValue <= 100000000) {
    brokerage = Math.round(grossValue * 0.00640 * 100) / 100;
    stl = Math.round(grossValue * 0.003 * 100) / 100;
  } else {
    const first100M = 100000000;
    const excess = grossValue - 100000000;
    brokerage = Math.round(first100M * 0.00640 * 100) / 100 + Math.round(excess * 0.00200 * 100) / 100;
    stl = Math.round(first100M * 0.003 * 100) / 100 + Math.round(excess * 0.003 * 100) / 100;
  }

  return { brokerage, stl };
};

export const extractSequenceFromDealNumber = (dealNumber, prefix) => {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = dealNumber && dealNumber.match(new RegExp(`${escaped}(\\d{6})$`));
  return match ? parseInt(match[1], 10) : 0;
};

export const generateDealNumber = async (side, transactionEntryAPI) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const prefix = side === 'buy' ? `BUY-${year}${month}${day}-` : `SELL-${year}${month}${day}-`;

  let startSequence = 1;

  try {
    const existing = side === 'buy'
      ? await transactionEntryAPI.getAllBuyTransactions()
      : await transactionEntryAPI.getAllSellTransactions();

    const todayRows = (existing || []).filter((row) => row.deal_number && row.deal_number.startsWith(prefix));
    if (todayRows.length > 0) {
      startSequence = Math.max(...todayRows.map((row) => extractSequenceFromDealNumber(row.deal_number, prefix))) + 1;
    }
  } catch (err) {
    console.warn('Could not fetch existing deal numbers:', err);
  }

  return `${prefix}${String(startSequence).padStart(6, '0')}`;
};

export const buildParsedTradeSummary = async (transaction, equities, side) => {
  const symbol = buildParsedSymbol(transaction);
  const equity = (equities || []).find((e) => e.symbol === symbol);
  const companyName = equity ? equity.name : '';
  const quantity = parseFloat(transaction.quantity) || 0;
  const price = parseFloat(transaction.price) || 0;
  const baseGross = quantity * price;

  let grossValue = baseGross;
  let brokerage = 0;
  let cdsFees = 0;
  let cseFees = 0;
  let clearingFees = 0;
  let sec = 0;
  let stl = 0;
  let netValue = 0;

  if (side === 'buy') {
    try {
      const calc = await tradeSummaryAPI.calculateBuyTransaction({ quantity, price, costOfFunds: null });
      if (calc) {
        grossValue = parseFloat(calc.grossValue) || baseGross;
        brokerage = parseFloat(calc.brokerage) || 0;
        cdsFees = parseFloat(calc.cdsFees) || 0;
        cseFees = parseFloat(calc.cseFees) || 0;
        clearingFees = parseFloat(calc.clearingFees) || 0;
        sec = parseFloat(calc.sec) || 0;
        stl = parseFloat(calc.stl) || 0;
        netValue = parseFloat(calc.netValue) || 0;
      }
    } catch (err) {
      console.warn('Buy fee calc failed, using parsed/fallback values:', err);
    }

    if (!netValue) {
      const fallback = calculateFeesFallback(baseGross);
      brokerage = brokerage || fallback.brokerage;
      stl = stl || fallback.stl;
      cdsFees = cdsFees || parseFloat(transaction.cds_fees) || 0;
      cseFees = cseFees || parseFloat(transaction.cse_fees) || 0;
      clearingFees = clearingFees || parseFloat(transaction.clearing_fees) || 0;
      sec = sec || parseFloat(transaction.sec_cess) || 0;
      grossValue = baseGross;
      netValue = grossValue + brokerage + cdsFees + cseFees + clearingFees + sec + stl;
    }
  } else {
    try {
      const calc = await tradeSummaryAPI.calculateSellTransaction({
        quantity,
        soldPrice: price,
        costOfFunds: null,
        holdingDays: 0,
      });
      if (calc) {
        grossValue = parseFloat(calc.grossValue) || baseGross;
        brokerage = parseFloat(calc.brokerage) || 0;
        cdsFees = parseFloat(calc.cdsFees) || 0;
        cseFees = parseFloat(calc.cseFees) || 0;
        clearingFees = parseFloat(calc.clearingFees) || 0;
        sec = parseFloat(calc.sec) || 0;
        stl = parseFloat(calc.stl) || 0;
        netValue = parseFloat(calc.netValue) || 0;
      }
    } catch (err) {
      console.warn('Sell fee calc failed, using parsed values:', err);
    }

    if (!netValue) {
      brokerage = parseFloat(transaction.brokerage) || 0;
      cdsFees = parseFloat(transaction.cds_fees) || 0;
      cseFees = parseFloat(transaction.cse_fees) || 0;
      clearingFees = parseFloat(transaction.clearing_fees) || 0;
      sec = parseFloat(transaction.sec_cess) || 0;
      stl = parseFloat(transaction.stl) || 0;
      grossValue = baseGross;
      netValue = grossValue - brokerage - cseFees - cdsFees - clearingFees - sec - stl;
    }
  }

  const totalFees = brokerage + cdsFees + cseFees + clearingFees + sec + stl;
  const settlementAmount = side === 'buy' ? netValue : netValue;

  return {
    side,
    symbol,
    companyName,
    companyId: transaction.company_id || symbol,
    quantity,
    price,
    grossValue,
    brokerage,
    cdsFees,
    cseFees,
    clearingFees,
    sec,
    stl,
    totalFees,
    netValue,
    settlementAmount,
    tradeDate: formatDateForInput(transaction.trade_date),
    settlementDate: formatDateForInput(transaction.settlement_date),
    executionId: transaction.execution_id || transaction.order_id || 'N/A',
    contractNumber: side === 'buy'
      ? (transaction.buying_contract_no || transaction.execution_id || '')
      : (transaction.selling_contract_no || transaction.execution_id || ''),
    boughtPrice: 0,
    costBasis: 0,
    capitalGain: 0,
  };
};

export const buildPhase1GlPreview = (summary) => {
  if (!summary) return [];

  const feeTotal = summary.totalFees || 0;
  const lines = [];

  if (summary.side === 'buy') {
    lines.push({
      direction: 'Dr',
      account: DEFAULT_INVESTMENT,
      label: 'Investment',
      amount: summary.grossValue,
    });
    if (feeTotal > 0) {
      lines.push({
        direction: 'Dr',
        account: '651-101-120-*',
        label: 'Fees',
        amount: feeTotal,
      });
    }
    lines.push({
      direction: 'Cr',
      account: BUY_SETTLEMENT_PAYABLE,
      label: 'Settlement Payable',
      amount: summary.settlementAmount,
    });
    return lines;
  }

  const costBasis = summary.costBasis || 0;
  if (costBasis > 0) {
    lines.push({
      direction: 'Cr',
      account: DEFAULT_INVESTMENT,
      label: 'Investment (cost basis)',
      amount: costBasis,
    });
  }
  if (feeTotal > 0) {
    lines.push({
      direction: 'Dr',
      account: '651-101-120-*',
      label: 'Fees',
      amount: feeTotal,
    });
  }
  if (summary.capitalGain !== 0) {
    lines.push({
      direction: summary.capitalGain > 0 ? 'Cr' : 'Dr',
      account: SELL_CAPITAL_GAIN_LOSS,
      label: summary.capitalGain > 0 ? 'Capital gain' : 'Capital loss',
      amount: Math.abs(summary.capitalGain),
    });
  }
  lines.push({
    direction: 'Dr',
    account: SELL_SETTLEMENT_RECEIVABLE,
    label: 'Settlement Receivable',
    amount: summary.settlementAmount,
  });

  return lines;
};

export const buildBuyPostPayload = ({
  transaction,
  summary,
  dealNumber,
  portfolioName,
  portfolioId,
  brokerName,
  settlement,
}) => ({
  parsed_trade_transaction_id: transaction.id,
  company_name: summary.companyName,
  symbol: summary.symbol,
  portfolio: portfolioName,
  portfolioId,
  deal_number: dealNumber,
  description: summary.companyName ? `Purchase ${summary.companyName} shares` : 'Purchase shares',
  quantity: summary.quantity,
  price: summary.price,
  gross_value: summary.grossValue,
  brokerage: summary.brokerage,
  cds_fees: summary.cdsFees,
  cse_fees: summary.cseFees,
  clearing_fees: summary.clearingFees,
  sec: summary.sec,
  stl: summary.stl,
  net_value: summary.netValue,
  contract_number: summary.contractNumber,
  broker_name: brokerName,
  trade_date: summary.tradeDate,
  settlement_date: summary.settlementDate,
  settlement_account: settlement.settlementAccount || '',
  account_name: settlement.accountName || '',
  account_number: settlement.accountNumber || '',
  bank_name: settlement.bankName || '',
  branch_name: settlement.branchName || '',
  cash_flow_on_settlement: summary.netValue,
  payment_method: settlement.paymentMethod || '',
  generate_payment: 'No',
  money_generation_cost: '',
  cost_of_funds: '',
});

export const buildSellPostPayload = ({
  transaction,
  summary,
  dealNumber,
  portfolioName,
  portfolioId,
  brokerName,
  settlement,
  valuationMethod,
}) => ({
  parsed_trade_transaction_id: transaction.id,
  company_name: summary.companyName,
  symbol: summary.symbol,
  portfolio_name: portfolioName,
  portfolioId,
  valuation_method: valuationMethod || '',
  deal_number: dealNumber,
  contract_number: summary.contractNumber,
  quantity: summary.quantity,
  sold_price: summary.price,
  bought_price: summary.boughtPrice,
  trade_date: summary.tradeDate,
  settlement_date: summary.settlementDate,
  broker_name: brokerName,
  settlement_account: settlement.settlementAccount || '',
  account_name: settlement.accountName || '',
  account_number: settlement.accountNumber || '',
  bank_name: settlement.bankName || '',
  branch_name: settlement.branchName || '',
  gross_value: summary.grossValue,
  brokerage: summary.brokerage,
  cse_fees: summary.cseFees,
  cds_fees: summary.cdsFees,
  clearing_fees: summary.clearingFees,
  sec: summary.sec,
  stl: summary.stl,
  net_value: summary.netValue,
  capital_gain: summary.capitalGain,
  description: summary.companyName ? `Sale ${summary.companyName} shares` : 'Sale shares',
});
