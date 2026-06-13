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

// Map an Alpha Vantage MARKET_STATUS "region" to a representative IANA timezone.
// The provider doesn't return a timezone, so we infer one from the region in
// order to derive how far a venue is through its trading session. The chosen
// zone matches the region's primary exchange (e.g. United States -> NYSE).
const REGION_TIMEZONES = {
  'united states': 'America/New_York',
  'canada': 'America/Toronto',
  'mexico': 'America/Mexico_City',
  'brazil': 'America/Sao_Paulo',
  'united kingdom': 'Europe/London',
  'ireland': 'Europe/Dublin',
  'germany': 'Europe/Berlin',
  'euro zone': 'Europe/Berlin',
  'eurozone': 'Europe/Berlin',
  'france': 'Europe/Paris',
  'spain': 'Europe/Madrid',
  'italy': 'Europe/Rome',
  'portugal': 'Europe/Lisbon',
  'netherlands': 'Europe/Amsterdam',
  'belgium': 'Europe/Brussels',
  'austria': 'Europe/Vienna',
  'switzerland': 'Europe/Zurich',
  'sweden': 'Europe/Stockholm',
  'norway': 'Europe/Oslo',
  'denmark': 'Europe/Copenhagen',
  'finland': 'Europe/Helsinki',
  'russia': 'Europe/Moscow',
  'south africa': 'Africa/Johannesburg',
  'india': 'Asia/Kolkata',
  'china': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'taiwan': 'Asia/Taipei',
  'japan': 'Asia/Tokyo',
  'south korea': 'Asia/Seoul',
  'singapore': 'Asia/Singapore',
  'malaysia': 'Asia/Kuala_Lumpur',
  'indonesia': 'Asia/Jakarta',
  'thailand': 'Asia/Bangkok',
  'sri lanka': 'Asia/Colombo',
  'australia': 'Australia/Sydney',
  'new zealand': 'Pacific/Auckland'
};

export function getRegionTimeZone(region) {
  return REGION_TIMEZONES[String(region || '').trim().toLowerCase()] || null;
}

// Parse a "HH:MM" (24h) string into minutes-since-midnight. Returns null if it
// isn't a valid clock time (e.g. blank, or a 24/7 venue with no fixed hours).
function parseClockToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || '').trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

// Current minutes-since-midnight in a given IANA timezone.
function nowMinutesInTimeZone(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    let h = 0;
    let m = 0;
    parts.forEach((p) => {
      if (p.type === 'hour') h = Number(p.value);
      if (p.type === 'minute') m = Number(p.value);
    });
    if (h === 24) h = 0; // some engines emit 24 at midnight
    return h * 60 + m;
  } catch {
    return null;
  }
}

// How far a venue is through its current trading session.
// Returns { fraction (0..1), remainingMinutes, elapsedMinutes } or null when it
// can't be computed (market closed, unknown timezone, or no fixed hours).
export function getSessionProgress(m) {
  if (!isGlobalVenueOpen(m)) return null;
  const tz = getRegionTimeZone(m?.region);
  if (!tz) return null;

  const open = parseClockToMinutes(m?.local_open);
  let close = parseClockToMinutes(m?.local_close);
  const now = nowMinutesInTimeZone(tz);
  if (open == null || close == null || now == null) return null;

  // Handle sessions that span midnight (close earlier than open).
  if (close <= open) close += 24 * 60;
  let cursor = now;
  if (cursor < open) cursor += 24 * 60;

  const total = close - open;
  if (total <= 0) return null;

  const elapsed = Math.max(0, Math.min(total, cursor - open));
  const fraction = elapsed / total;
  return {
    fraction,
    elapsedMinutes: elapsed,
    remainingMinutes: Math.max(0, total - elapsed)
  };
}

// Compact "3h 12m" / "45m" formatter for remaining-session time.
export function formatDurationShort(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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
