/**
 * Running WAP — single method for cost per share (matches backend runningWapCalculator.js).
 * Buys recalculate WAP; sells reduce qty at current WAP; sell price is ignored.
 */

import { txTradeDateYmd } from './tradeDateYmd';

export function computeRunningWapFromEvents(events) {
  let currentQty = 0;
  let currentCostBasis = 0;
  let currentWAP = 0;

  (events || []).forEach(({ quantity, price }) => {
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty === 0) return;

    if (qty > 0) {
      const p = parseFloat(price);
      if (!Number.isFinite(p)) return;
      currentQty += qty;
      currentCostBasis += qty * p;
      currentWAP = currentCostBasis / currentQty;
    } else {
      const sellQty = Math.abs(qty);
      currentQty -= sellQty;
      if (currentQty > 0) {
        currentCostBasis = currentQty * currentWAP;
      } else {
        currentQty = 0;
        currentCostBasis = 0;
        currentWAP = 0;
      }
    }
  });

  return {
    wap: currentWAP,
    quantity: Math.max(0, currentQty),
    costBasis: currentCostBasis,
  };
}

export function chronologicalSortKey(tx) {
  const tradeDate = txTradeDateYmd(tx) || '';
  const createdAt = tx.created_at ?? tx.createdAt ?? tx.id ?? 0;
  return { tradeDate, createdAt: String(createdAt) };
}

export function buildChronologicalEvents(buyTransactions, sellTransactions) {
  const events = [];

  (buyTransactions || []).forEach((tx) => {
    const { tradeDate, createdAt } = chronologicalSortKey(tx);
    events.push({
      quantity: parseFloat(tx.quantity) || 0,
      price: parseFloat(tx.price) || 0,
      tradeDate,
      createdAt,
    });
  });

  (sellTransactions || []).forEach((tx) => {
    const { tradeDate, createdAt } = chronologicalSortKey(tx);
    events.push({
      quantity: -(parseFloat(tx.quantity) || 0),
      price: 0,
      tradeDate,
      createdAt,
    });
  });

  events.sort((a, b) => {
    if (a.tradeDate !== b.tradeDate) return a.tradeDate.localeCompare(b.tradeDate);
    return a.createdAt.localeCompare(b.createdAt);
  });

  return events;
}

export function computeRunningWapFromBuySellTransactions(buyTransactions, sellTransactions) {
  return computeRunningWapFromEvents(
    buildChronologicalEvents(buyTransactions, sellTransactions)
  );
}
