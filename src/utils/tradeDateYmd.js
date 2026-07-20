/** Local calendar YYYY-MM-DD (avoids UTC day shift from toISOString). */
export function toLocalYmd(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** App business calendar today (Sri Lanka / Asia/Colombo). */
export function getAppTodayYmd(timeZone = 'Asia/Colombo') {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return toLocalYmd(new Date());
  }
}

export function isSettlementDateReached(settlementYmd, todayYmd = getAppTodayYmd()) {
  if (!settlementYmd || !todayYmd) return false;
  return settlementYmd <= todayYmd;
}

/** Normalize settlement_date on a buy row to YYYY-MM-DD. */
export function txSettlementDateYmd(row) {
  if (!row) return null;
  const raw = row.settlement_date ?? row.settlementDate;
  if (!raw) return null;
  if (raw instanceof Date) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(raw);
    } catch {
      return toLocalYmd(raw);
    }
  }
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d+)?Z$/i.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Colombo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d);
      } catch {
        return toLocalYmd(d);
      }
    }
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
  if (!Number.isNaN(d.getTime())) return txSettlementDateYmd({ settlement_date: d });
  return s.slice(0, 10);
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
