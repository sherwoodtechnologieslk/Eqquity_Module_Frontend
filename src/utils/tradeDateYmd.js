/** Local calendar YYYY-MM-DD (avoids UTC day shift from toISOString). */
export function toLocalYmd(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Normalize API trade dates to YYYY-MM-DD — same rules as Portfolio Selection date filter. */
export function txTradeDateYmd(tx) {
  if (!tx) return null;
  const raw =
    tx.trade_date ??
    tx.tradeDate ??
    tx.tradeDateTime ??
    tx.trade_datetime ??
    tx.date ??
    tx.transaction_date ??
    tx.transactionDate;
  if (!raw) return null;
  if (raw instanceof Date) return toLocalYmd(raw);
  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d+)?Z$/i.test(s)) return s.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return toLocalYmd(d);
  }

  const isoDatePrefix = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDatePrefix && !/T/.test(s)) {
    return `${isoDatePrefix[1]}-${isoDatePrefix[2]}-${isoDatePrefix[3]}`;
  }

  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const dd = String(dmy[1]).padStart(2, '0');
    const mm = String(dmy[2]).padStart(2, '0');
    return `${dmy[3]}-${mm}-${dd}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toLocalYmd(d);
  return s.slice(0, 10);
}
