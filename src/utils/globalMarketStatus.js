// Shared helpers for parsing Alpha Vantage MARKET_STATUS payloads.
// Mirrors the logic that lives inline inside Dashboard.js, kept here so other
// screens (e.g. Funds Centers → Global Markets) can render the same data without
// drifting from the Dashboard's behavior.

export function extractMarketsArray(data) {
  if (data == null) return [];
  if (typeof data === 'string') {
    try {
      return extractMarketsArray(JSON.parse(data));
    } catch {
      return [];
    }
  }
  if (Array.isArray(data)) {
    const looksLikeVenue = (row) =>
      row &&
      typeof row === 'object' &&
      ('market_type' in row || 'current_status' in row || 'primary_exchanges' in row);
    return data.length > 0 && looksLikeVenue(data[0]) ? data : [];
  }
  if (typeof data !== 'object') return [];

  const pick = (v) => (Array.isArray(v) && v.length && typeof v[0] === 'object' ? v : null);
  const direct =
    pick(data.markets) ||
    pick(data.Markets) ||
    pick(data.market) ||
    pick(data.results);
  if (direct) return direct;

  if (data.data && typeof data.data === 'object') {
    return extractMarketsArray(data.data);
  }
  return [];
}

export function parseGlobalMarketPayload(data) {
  const markets = extractMarketsArray(data);
  const noteOrInfo =
    data && typeof data === 'object'
      ? [data.Note, data.Information]
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .find(Boolean)
      : '';

  if (markets.length > 0) {
    return { markets, apiMessage: noteOrInfo || null, rawKeys: null };
  }

  if (data && typeof data === 'object' && data['Error Message']) {
    return { markets: [], apiMessage: String(data['Error Message']), rawKeys: null };
  }
  if (
    data &&
    typeof data === 'object' &&
    typeof data.Information === 'string' &&
    data.Information.trim()
  ) {
    return { markets: [], apiMessage: data.Information.trim(), rawKeys: null };
  }
  if (
    data &&
    typeof data === 'object' &&
    typeof data.Note === 'string' &&
    data.Note.trim()
  ) {
    return { markets: [], apiMessage: data.Note.trim(), rawKeys: null };
  }

  let rawKeys = null;
  if (data && typeof data === 'object') {
    rawKeys = Object.keys(data).join(', ');
  } else if (typeof data === 'string') {
    rawKeys = data.length > 120 ? `${data.slice(0, 120)}…` : data;
  }
  return { markets: [], apiMessage: null, rawKeys };
}

export function isGlobalVenueOpen(m) {
  return String(m?.current_status || '').toLowerCase() === 'open';
}

export function normalizeMarketType(t) {
  const v = String(t || '').toLowerCase();
  if (v === 'equity') return 'Equity';
  if (v === 'forex') return 'Forex';
  if (v === 'cryptocurrency' || v === 'crypto') return 'Cryptocurrency';
  return t || 'Other';
}

export function groupMarketsByType(markets) {
  const norm = (t) => String(t || '').toLowerCase();
  const matchType = (m, typeKey) => {
    const mt = norm(m.market_type);
    if (typeKey === 'Equity') return mt === 'equity';
    if (typeKey === 'Forex') return mt === 'forex';
    if (typeKey === 'Cryptocurrency') {
      return mt === 'cryptocurrency' || mt === 'crypto';
    }
    return false;
  };
  const order = [
    { typeKey: 'Equity', heading: 'Equity markets' },
    { typeKey: 'Forex', heading: 'Forex markets' },
    { typeKey: 'Cryptocurrency', heading: 'Crypto markets' }
  ];
  const used = new Set();
  const groups = order.map(({ typeKey, heading }) => {
    const rows = [];
    markets.forEach((m, i) => {
      if (matchType(m, typeKey)) {
        rows.push(m);
        used.add(i);
      }
    });
    return { typeKey, heading, rows };
  });
  const primary = groups.filter((g) => g.rows.length > 0);
  const otherRows = markets.filter((_, i) => !used.has(i));
  if (otherRows.length > 0) {
    primary.push({ typeKey: 'Other', heading: 'Other markets', rows: otherRows });
  }
  return primary;
}
