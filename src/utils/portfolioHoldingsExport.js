// Shared portfolio holdings calculation — always running WAP (price-based), grouped by company_name like MTM.

import { computeRunningWapFromBuySellTransactions, chronologicalSortKey } from './runningWap';

const normalize = (v) => String(v || '').toLowerCase().trim();

/** Group key matches backend MTM: company_name first. */
const getKey = (tx) => {
  const name = normalize(tx.company_name || tx.companyName || tx.company);
  const symbol = normalize(tx.symbol);
  const equityId = tx.equity_id || tx.equityId || '';
  return name || symbol || String(equityId) || 'unknown';
};

const getDisplayName = (tx, key) => {
  const candidate = tx.company_name || tx.companyName || tx.company || tx.symbol || key;
  return String(candidate || key).trim() || 'Unknown';
};

function computeChargesForGroup(buys, netQuantity) {
  const totalBuyQuantity = buys.reduce((sum, tx) => sum + (parseFloat(tx.quantity) || 0), 0);
  const totalBuyCharges = buys.reduce((sum, tx) => {
    const brokerage = parseFloat(tx.brokerage) || 0;
    const cdsFees = parseFloat(tx.cds_fees) || 0;
    const cseFees = parseFloat(tx.cse_fees) || 0;
    const clearingFees = parseFloat(tx.clearing_fees) || 0;
    const sec = parseFloat(tx.sec) || 0;
    const stl = parseFloat(tx.stl) || 0;
    return sum + brokerage + cdsFees + cseFees + clearingFees + sec + stl;
  }, 0);
  const calculatedCharges =
    totalBuyQuantity > 0 ? totalBuyCharges * (netQuantity / totalBuyQuantity) : 0;
  return { totalBuyQuantity, calculatedCharges };
}

function mapGroupToHolding(g) {
  const running = computeRunningWapFromBuySellTransactions(g.buys, g.sells);
  const wap = running.wap;
  const calculatedNetQuantity = running.quantity;
  const calculatedCostValue = calculatedNetQuantity * wap;
  const { calculatedCharges } = computeChargesForGroup(g.buys, calculatedNetQuantity);
  const netValue = calculatedCostValue + calculatedCharges;
  const costPerShare = calculatedNetQuantity > 0 ? netValue / calculatedNetQuantity : 0;

  const lastTradeDate =
    [...g.buys, ...g.sells]
      .map((t) => chronologicalSortKey(t).tradeDate)
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || null;

  return {
    companyName: g.displayName,
    companyKey: g.key,
    companyId: null,
    netQuantity: calculatedNetQuantity,
    avgBuyPrice: wap,
    costValue: calculatedCostValue,
    totalCharges: calculatedCharges,
    netValue,
    costPerShare,
    lastTradeDate,
  };
}

function groupTransactions(buyTransactions, sellTransactions) {
  const groupMap = new Map();

  (buyTransactions || []).forEach((tx) => {
    const key = getKey(tx);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, displayName: getDisplayName(tx, key), buys: [], sells: [] });
    }
    groupMap.get(key).buys.push(tx);
  });

  (sellTransactions || []).forEach((tx) => {
    const key = getKey(tx);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, displayName: getDisplayName(tx, key), buys: [], sells: [] });
    }
    groupMap.get(key).sells.push(tx);
  });

  return groupMap;
}

/** Running WAP from buy/sell transactions (used when date filter is active). */
export const buildHoldingsFromTransactions = (buyTransactions, sellTransactions) => {
  const groupMap = groupTransactions(buyTransactions, sellTransactions);

  return Array.from(groupMap.values())
    .map(mapGroupToHolding)
    .filter((h) => (h.netQuantity || 0) > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
};

/**
 * Holdings from backend getPortfolioPositions — same Cost Price / qty as Mark-to-Market.
 * Charges still derived from actual buy transactions.
 */
export const buildHoldingsFromBackendPositions = (positionsData, buyTransactions, sellTransactions) => {
  const groupMap = groupTransactions(buyTransactions, sellTransactions);

  return (positionsData || [])
    .map((position) => {
      const companyName = position.companyName || position.company_name || 'Unknown';
      const companyKey = normalize(companyName);
      const group = groupMap.get(companyKey);

      const netQuantity = parseFloat(position.quantity) || 0;
      const wap = parseFloat(position.costPrice) || 0;
      const costValue = parseFloat(position.costValue) || netQuantity * wap;

      const buys = group?.buys || [];
      const { calculatedCharges } = computeChargesForGroup(buys, netQuantity);
      const netValue = costValue + calculatedCharges;
      const costPerShare = netQuantity > 0 ? netValue / netQuantity : 0;

      const lastTradeDate = group
        ? [...group.buys, ...group.sells]
            .map((t) => chronologicalSortKey(t).tradeDate)
            .filter(Boolean)
            .sort()
            .slice(-1)[0] || null
        : null;

      return {
        companyName,
        companyKey,
        companyId: null,
        netQuantity,
        avgBuyPrice: wap,
        costValue,
        totalCharges: calculatedCharges,
        netValue,
        costPerShare,
        lastTradeDate,
      };
    })
    .filter((h) => (h.netQuantity || 0) > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
};

export const buildHoldingsForPortfolioPositions = ({
  positionsData,
  allBuyTransactions,
  allSellTransactions,
  portfolioName,
}) => {
  const pName = normalize(portfolioName);

  const buyTransactions = (allBuyTransactions || []).filter(
    (tx) => tx.portfolio && normalize(tx.portfolio) === pName
  );
  const sellTransactions = (allSellTransactions || []).filter(
    (tx) => tx.portfolio_name && normalize(tx.portfolio_name) === pName
  );

  return buildHoldingsFromBackendPositions(positionsData, buyTransactions, sellTransactions);
};
