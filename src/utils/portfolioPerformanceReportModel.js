/** Shared logic for Portfolio Performance Report (screen + download center). */

export const PERIODS = ['MTD', 'QTD', 'YTD', '1Y'];

const dash = '—';

export function endOfDayMs(d) {
  const x = d instanceof Date ? new Date(d.getTime()) : new Date(String(d || ''));
  if (Number.isNaN(x.getTime())) return Date.now();
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

export function periodStartDate(period, refDate) {
  const now = refDate instanceof Date && !Number.isNaN(refDate.getTime()) ? refDate : new Date();
  if (period === 'MTD') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'QTD') {
    const q = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), q, 1);
  }
  if (period === 'YTD') return new Date(now.getFullYear(), 0, 1);
  if (period === '1Y') {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return new Date(now.getFullYear(), 0, 1);
}

export function parseHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => ({
      t: new Date(d.date).getTime(),
      date: new Date(d.date),
      value: parseFloat(d.value) || 0
    }))
    .filter((p) => Number.isFinite(p.value) && p.value >= 0)
    .sort((a, b) => a.t - b.t);
}

export function valueOnOrBefore(points, targetMs) {
  let best = null;
  for (const p of points) {
    if (p.t <= targetMs && p.value > 0) best = p.value;
  }
  return best;
}

export function valueOnOrAfter(points, targetMs) {
  for (const p of points) {
    if (p.t >= targetMs && p.value > 0) return p.value;
  }
  return null;
}

export function sliceHistory(points, fromMs, toMs) {
  return points.filter((p) => p.t >= fromMs && p.t <= toMs);
}

export function periodReturnPercent(points, period, refDate) {
  const refEndMs = endOfDayMs(refDate);
  const filtered = points.filter((p) => p.t <= refEndMs);
  if (!filtered.length) return null;
  const endVal = filtered[filtered.length - 1].value;
  if (endVal <= 0) return null;
  const startMs = periodStartDate(period, refDate).getTime();
  let startVal = valueOnOrBefore(filtered, startMs);
  if (startVal == null) startVal = valueOnOrAfter(filtered, startMs);
  if (startVal == null || startVal <= 0) return null;
  return ((endVal / startVal) - 1) * 100;
}

export function maxDrawdownFromSlice(slice) {
  if (!slice.length) return null;
  let peak = slice[0].value;
  let maxDd = 0;
  for (const p of slice) {
    if (p.value > peak) peak = p.value;
    if (peak > 0) {
      const dd = ((p.value - peak) / peak) * 100;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

export function volatilityAndSharpe(slice) {
  const rets = [];
  for (let i = 1; i < slice.length; i++) {
    const a = slice[i - 1].value;
    const b = slice[i].value;
    if (a > 0) rets.push((b - a) / a);
  }
  if (rets.length < 2) return { volatility: null, sharpe: null };
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1 || 1);
  const std = Math.sqrt(variance);
  const daySpan = Math.max(1, (slice[slice.length - 1].t - slice[0].t) / 86400000);
  const periodsPerYear = Math.max(12, Math.min(252, (rets.length / daySpan) * 365));
  const volPct = std * Math.sqrt(periodsPerYear) * 100;
  const sharpe = std > 1e-12 ? (mean / std) * Math.sqrt(periodsPerYear) : null;
  return { volatility: volPct, sharpe };
}

export function buildHoldingRows(positions, sectorBySymbol) {
  const list = Array.isArray(positions) ? positions : [];
  const totalMkt = list.reduce(
    (s, p) => s + (parseFloat(p.marketPrice) || 0) * (parseFloat(p.quantity) || 0),
    0
  );
  return list
    .map((p) => {
      const qty = parseFloat(p.quantity) || 0;
      const costPrice = parseFloat(p.costPrice) || 0;
      const currentPrice = parseFloat(p.marketPrice) || 0;
      const symKey = (p.symbol || '').trim().toUpperCase();
      const sector = sectorBySymbol?.get?.(symKey) || 'Unclassified';
      const cost = qty * costPrice;
      const mkt = qty * currentPrice;
      const gl = mkt - cost;
      const ret = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;
      const weight = totalMkt > 0 ? (mkt / totalMkt) * 100 : 0;
      return {
        symbol: p.symbol,
        name: p.companyName || dash,
        sector,
        qty,
        costPrice,
        currentPrice,
        cost,
        mkt,
        gl,
        ret,
        weight
      };
    })
    .sort((a, b) => b.mkt - a.mkt);
}

export function buildSectorRows(holdingRows) {
  const bySec = new Map();
  for (const r of holdingRows) {
    if (!bySec.has(r.sector)) bySec.set(r.sector, { mkt: 0, weightedRet: 0 });
    const g = bySec.get(r.sector);
    g.mkt += r.mkt;
    g.weightedRet += r.mkt * r.ret;
  }
  const totalMkt = holdingRows.reduce((s, r) => s + r.mkt, 0);
  return [...bySec.entries()]
    .map(([sector, { mkt, weightedRet }]) => ({
      sector,
      weight: totalMkt > 0 ? (mkt / totalMkt) * 100 : 0,
      periodReturn: mkt > 0 ? weightedRet / mkt : 0
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * @param {object} opts
 * @param {Array} opts.positions - raw positions from API
 * @param {*} opts.historyRaw - portfolio value history API payload (if historyPoints not set)
 * @param {Array} [opts.historyPoints] - pre-parsed history points (skips parseHistory on raw)
 * @param {Map} opts.sectorBySymbol
 * @param {string} opts.period - MTD | QTD | YTD | 1Y
 * @param {Date|string} opts.referenceDate - as-of date for period boundaries and history cutoff
 */
export function buildPerformanceReportModel({
  positions,
  historyRaw,
  historyPoints: preParsed,
  sectorBySymbol,
  period,
  referenceDate
}) {
  const refDate =
    referenceDate instanceof Date
      ? referenceDate
      : new Date(String(referenceDate || '').slice(0, 10) || Date.now());
  const historyPoints =
    Array.isArray(preParsed) && preParsed.length
      ? [...preParsed].sort((a, b) => a.t - b.t)
      : parseHistory(historyRaw?.data || historyRaw || []);
  const refEndMs = endOfDayMs(refDate);
  const historyFiltered = historyPoints.filter((p) => p.t <= refEndMs);

  const holdingRows = buildHoldingRows(positions, sectorBySymbol);
  const sectorRows = buildSectorRows(holdingRows);

  const metricsByPeriod = {};
  PERIODS.forEach((p) => {
    metricsByPeriod[p] = {
      totalReturn: periodReturnPercent(historyPoints, p, refDate),
      benchmarkReturn: null
    };
  });

  const startMs = periodStartDate(period, refDate).getTime();
  const slice = sliceHistory(historyFiltered, startMs, refEndMs);
  const useSlice = slice.length >= 2 ? slice : historyFiltered;
  const totalReturn = periodReturnPercent(historyPoints, period, refDate);
  const portfolioValue = holdingRows.reduce((s, r) => s + r.mkt, 0);
  const maxDrawdown = maxDrawdownFromSlice(useSlice.length ? useSlice : historyFiltered);
  const { volatility, sharpe } = volatilityAndSharpe(
    useSlice.length >= 3 ? useSlice : historyFiltered
  );

  const m = {
    totalReturn,
    benchmarkReturn: null,
    sharpe,
    beta: null,
    alpha: null,
    maxDrawdown,
    volatility,
    portfolioValue
  };

  const totCost = holdingRows.reduce((s, r) => s + r.cost, 0);
  const totMkt = holdingRows.reduce((s, r) => s + r.mkt, 0);
  const totGL = totMkt - totCost;
  const totRet = totCost > 0 ? (totGL / totCost) * 100 : null;

  const sectorContribTotal = sectorRows.reduce((s, x) => s + (x.weight / 100) * x.periodReturn, 0);

  return {
    refDate,
    historyFiltered,
    holdingRows,
    sectorRows,
    metricsByPeriod,
    m,
    totCost,
    totMkt,
    totGL,
    totRet,
    sectorContribTotal
  };
}
