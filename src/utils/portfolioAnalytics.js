/**
 * Portfolio analytics — single source of truth for the Portfolio Overview screen.
 * Pure functions only (no React / no API) so they stay easy to test and reuse.
 *
 * Holdings shape (from portfolioAPI.getPortfolioOverview -> data.holdings):
 *   { symbol, companyName, quantity, avgPrice, currentPrice, marketValue, pnl, sector, ... }
 * Summary shape (data.summary):
 *   { totalValue, totalPnL, totalCost, cashBalance, numberOfPositions, realizedPnL }
 */

const SECTOR_PALETTE = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#ef4444', '#14b8a6', '#6366f1', '#84cc16',
  '#f97316', '#06b6d4', '#a855f7', '#22c55e', '#eab308'
];

export const sectorColor = (i) => SECTOR_PALETTE[i % SECTOR_PALETTE.length];

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Derived cost: prefer (marketValue - pnl) when both present, else quantity * avgPrice. */
const costOf = (h) => {
  const mv = num(h.marketValue);
  const pnl = num(h.pnl);
  if (h.marketValue != null && h.pnl != null) return mv - pnl;
  return num(h.quantity) * num(h.avgPrice);
};

export const formatLkrCompact = (value) => {
  const n = num(value);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}LKR ${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}LKR ${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e5) return `${sign}LKR ${(abs / 1e3).toFixed(0)}K`;
  return `${sign}LKR ${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const formatLkrFull = (value) =>
  `LKR ${num(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const formatPct = (value, dp = 1) => {
  const n = num(value);
  return `${n >= 0 ? '+' : ''}${n.toFixed(dp)}%`;
};

const EMPTY = {
  hasData: false,
  valuation: {
    marketValue: 0, cost: 0, unrealized: 0, unrealizedPct: 0,
    realized: 0, totalPnL: 0, cash: 0
  },
  positions: { count: 0, sectors: 0 },
  score: 0, status: 'No data', statusKey: 'no-data',
  scoreBreakdown: [],
  diversification: { label: '—', effectiveN: 0 },
  concentration: { label: '—', topWeightPct: 0, topSymbol: '—' },
  topSector: { name: '—', pct: 0 },
  stats: { winners: 0, losers: 0, flat: 0, winRatePct: 0 },
  best: null, worst: null,
  sectors: [],
  holdings: [],
  topHoldings: [],
  movers: { gainers: [], losers: [] },
  alerts: []
};

/**
 * Full portfolio analysis used by the Portfolio Overview tab.
 * @param {Array} holdings
 * @param {Object} summary
 * @returns {typeof EMPTY}
 */
export function analyzePortfolio(holdings, summary = {}) {
  const list = Array.isArray(holdings) ? holdings.filter((h) => num(h.marketValue) > 0) : [];
  const totalMarketValue = list.reduce((s, h) => s + num(h.marketValue), 0);

  if (list.length === 0 || totalMarketValue <= 0) {
    return EMPTY;
  }

  const totalCost = list.reduce((s, h) => s + costOf(h), 0);
  const unrealizedPnL = list.reduce((s, h) => s + num(h.pnl), 0);
  const unrealizedReturnPct = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0;
  const realizedPnL = num(summary.realizedPnL);
  const cash = num(summary.cashBalance);

  // Enrich holdings with weight + return.
  const enriched = list
    .map((h) => {
      const mv = num(h.marketValue);
      const pnl = num(h.pnl);
      const cost = costOf(h);
      return {
        symbol: h.symbol || '—',
        name: h.companyName || h.company_name || h.name || h.symbol || '—',
        sector: h.sector || 'Unknown',
        quantity: num(h.quantity),
        avgPrice: num(h.avgPrice),
        currentPrice: num(h.currentPrice),
        marketValue: mv,
        cost,
        pnl,
        weightPct: totalMarketValue > 0 ? (mv / totalMarketValue) * 100 : 0,
        returnPct: cost > 0 ? (pnl / cost) * 100 : 0
      };
    })
    .sort((a, b) => b.marketValue - a.marketValue);

  // Sector allocation.
  const sectorMap = new Map();
  enriched.forEach((h) => {
    const cur = sectorMap.get(h.sector) || { name: h.sector, value: 0, cost: 0 };
    cur.value += h.marketValue;
    cur.cost += h.cost;
    sectorMap.set(h.sector, cur);
  });
  const sectors = [...sectorMap.values()]
    .sort((a, b) => b.value - a.value)
    .map((s, i) => ({
      name: s.name,
      value: s.value,
      cost: s.cost,
      pnl: s.value - s.cost,
      pct: totalMarketValue > 0 ? (s.value / totalMarketValue) * 100 : 0,
      color: sectorColor(i)
    }));

  // Concentration via Herfindahl index → effective number of holdings.
  const hhi = enriched.reduce((s, h) => {
    const w = h.marketValue / totalMarketValue;
    return s + w * w;
  }, 0);
  const effectiveN = hhi > 0 ? 1 / hhi : 0;

  const topHolding = enriched[0] || {};
  const topWeightPct = num(topHolding.weightPct);
  const topSymbol = topHolding.symbol || '—';
  const topSector = sectors[0] || { name: '—', pct: 0 };

  // Score: diversification (0-40) + concentration (0-30) + performance (0-30).
  const divScore = Math.max(0, Math.min(40, (effectiveN / 10) * 40));
  const concScore = Math.max(0, Math.min(30, 30 - Math.max(0, topWeightPct - 10) * 1.2));
  const perfScore = Math.max(0, Math.min(30, 15 + unrealizedReturnPct));
  const score = Math.round(divScore + concScore + perfScore);

  const status = score >= 75 ? 'Healthy' : score >= 50 ? 'Moderate' : 'At risk';
  const statusKey = status.toLowerCase().replace(/\s+/g, '-');
  const diversificationLabel = effectiveN >= 8 ? 'Good' : effectiveN >= 4 ? 'Moderate' : 'Low';
  const concentrationLabel = topWeightPct <= 10 ? 'Low' : topWeightPct <= 20 ? 'Moderate' : 'High';

  const scoreBreakdown = [
    { key: 'diversification', label: 'Diversification', points: Math.round(divScore), max: 40, value: divScore / 40 },
    { key: 'concentration', label: 'Concentration', points: Math.round(concScore), max: 30, value: concScore / 30 },
    { key: 'performance', label: 'Performance', points: Math.round(perfScore), max: 30, value: perfScore / 30 }
  ];

  // Winners / losers.
  const winners = enriched.filter((h) => h.pnl > 0);
  const losers = enriched.filter((h) => h.pnl < 0);
  const flat = enriched.length - winners.length - losers.length;
  const winRatePct = enriched.length > 0 ? (winners.length / enriched.length) * 100 : 0;

  const byReturnDesc = [...enriched].sort((a, b) => b.returnPct - a.returnPct);
  const best = byReturnDesc[0] && byReturnDesc[0].pnl > 0 ? byReturnDesc[0] : null;
  const worst = byReturnDesc[byReturnDesc.length - 1] && byReturnDesc[byReturnDesc.length - 1].pnl < 0
    ? byReturnDesc[byReturnDesc.length - 1]
    : null;

  const gainers = [...winners].sort((a, b) => b.returnPct - a.returnPct).slice(0, 3);
  const losersSorted = [...losers].sort((a, b) => a.returnPct - b.returnPct).slice(0, 3);

  // Derived alerts / insights.
  const alerts = [];
  if (topWeightPct > 15) {
    alerts.push({
      severity: topWeightPct > 25 ? 'high' : 'medium',
      title: 'High single-name exposure',
      message: `${topSymbol} is ${topWeightPct.toFixed(1)}% of portfolio value`
    });
  }
  if (topSector.pct > 40) {
    alerts.push({
      severity: 'medium',
      title: 'Sector concentration',
      message: `${topSector.name} makes up ${topSector.pct.toFixed(1)}% of holdings`
    });
  }
  if (effectiveN < 4) {
    alerts.push({
      severity: 'medium',
      title: 'Low diversification',
      message: `Effective holdings ≈ ${effectiveN.toFixed(1)}; consider spreading risk wider`
    });
  }
  if (losers.length > 0) {
    const worstLoser = [...losers].sort((a, b) => a.pnl - b.pnl)[0];
    alerts.push({
      severity: losers.length > enriched.length / 2 ? 'medium' : 'low',
      title: `${losers.length} position${losers.length > 1 ? 's' : ''} in loss`,
      message: `${worstLoser.symbol} down ${formatLkrCompact(Math.abs(worstLoser.pnl))} unrealized`
    });
  }
  if (best) {
    alerts.push({
      severity: 'low',
      title: 'Top performer',
      message: `${best.symbol} up ${best.returnPct.toFixed(1)}% (${formatLkrCompact(best.pnl)})`
    });
  }
  if (unrealizedReturnPct > 0) {
    alerts.push({
      severity: 'low',
      title: 'Portfolio in profit',
      message: `Unrealized return of ${unrealizedReturnPct.toFixed(1)}% across ${enriched.length} holdings`
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      severity: 'low',
      title: 'No risk flags',
      message: 'Well balanced — no major concentration or losses'
    });
  }

  return {
    hasData: true,
    valuation: {
      marketValue: totalMarketValue,
      cost: totalCost,
      unrealized: totalMarketValue - totalCost,
      unrealizedPct: unrealizedReturnPct,
      realized: realizedPnL,
      totalPnL: realizedPnL + unrealizedPnL,
      cash
    },
    positions: { count: enriched.length, sectors: sectors.length },
    score, status, statusKey,
    scoreBreakdown,
    diversification: { label: diversificationLabel, effectiveN },
    concentration: { label: concentrationLabel, topWeightPct, topSymbol },
    topSector: { name: topSector.name, pct: topSector.pct },
    stats: { winners: winners.length, losers: losers.length, flat, winRatePct },
    best,
    worst,
    sectors,
    holdings: enriched,
    topHoldings: enriched.slice(0, 5),
    movers: { gainers, losers: losersSorted },
    alerts: alerts.slice(0, 6)
  };
}
