/**
 * Statement of Changes in Equity helpers.
 * Fiscal year-end is 31 March (Sri Lanka reporting convention used on the source statement).
 */

export const FY_END_MONTH = 2; // March (0-indexed)
export const FY_END_DAY = 31;
export const HISTORY_YEARS = 3;

const CAPITAL_PATTERNS = [
  'stated capital',
  'share capital',
  'issued capital',
  'ordinary share',
  'preference share',
  'preferred share'
];

const pad2 = (n) => String(n).padStart(2, '0');

export const toLocalYmd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseYmd = (ymd) => {
  const parts = String(ymd || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
};

export const addDays = (d, days) => {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return next;
};

export const fiscalYearEndOn = (year) => new Date(year, FY_END_MONTH, FY_END_DAY);

/** Most recent 31 March on or before the given date. */
export const lastFiscalYearEndOnOrBefore = (date) => {
  const candidate = fiscalYearEndOn(date.getFullYear());
  if (date < candidate) return fiscalYearEndOn(date.getFullYear() - 1);
  return candidate;
};

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const ordinal = (day) => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

export const formatLongDate = (d, { withOrdinal = false } = {}) => {
  const day = withOrdinal ? ordinal(d.getDate()) : String(d.getDate());
  return `${day} ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

/** 1 April of the financial year that contains `asOf` (year-end 31 March). */
export const fiscalYearStartFor = (asOf) => {
  const thisApril = new Date(asOf.getFullYear(), 3, 1);
  return asOf >= thisApril ? thisApril : new Date(asOf.getFullYear() - 1, 3, 1);
};

export const previousMonthEnd = (asOf) =>
  new Date(asOf.getFullYear(), asOf.getMonth(), 0);

export const monthStart = (asOf) =>
  new Date(asOf.getFullYear(), asOf.getMonth(), 1);

export const formatMonthYearShort = (d) =>
  `${MONTH_SHORT[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;

export const formatYtdMonthLabel = (d) =>
  `YTD ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;

export const isCapitalLabel = (label) => {
  const n = String(label || '').toLowerCase();
  return CAPITAL_PATTERNS.some((p) => n.includes(p));
};

export const isCurrentPlLabel = (label) => {
  const n = String(label || '').toLowerCase();
  return (
    n.includes('current p&l') ||
    n.includes('current pnl') ||
    n.includes('profit for the')
  );
};

export const splitEquityAccounts = (fpData) => {
  const accounts = fpData?.equity || [];
  let statedCapital = 0;
  let retained = 0;
  let hasCurrentPl = false;

  accounts.forEach((account) => {
    const label = `${account.transactionTypeName || ''} ${account.accountName || ''}`;
    const balance = Number(account.balance) || 0;
    if (isCurrentPlLabel(label)) hasCurrentPl = true;
    if (isCapitalLabel(label)) statedCapital += balance;
    else retained += balance;
  });

  return { statedCapital, retained, hasCurrentPl };
};

export const equityAtDate = (fpData, netProfit) => {
  const split = splitEquityAccounts(fpData);
  const profit = Number.isFinite(Number(netProfit)) ? Number(netProfit) : 0;
  const retained = split.hasCurrentPl ? split.retained : split.retained + profit;
  return {
    statedCapital: split.statedCapital,
    retained,
    total: split.statedCapital + retained
  };
};

/**
 * Opening FY-end, then each following year-end, then a stub to as-of when as-of is mid-year.
 */
export const buildSociEPeriods = (asOfDateYmd) => {
  const asOf = parseYmd(asOfDateYmd) || new Date();
  const latestFyEnd = lastFiscalYearEndOnOrBefore(asOf);
  const opening = fiscalYearEndOn(latestFyEnd.getFullYear() - HISTORY_YEARS);

  const closings = [];
  for (let year = opening.getFullYear() + 1; year <= latestFyEnd.getFullYear(); year += 1) {
    closings.push(fiscalYearEndOn(year));
  }

  const asOfYmd = toLocalYmd(asOf);
  const lastClosingYmd = closings.length ? toLocalYmd(closings[closings.length - 1]) : toLocalYmd(opening);
  if (asOfYmd > lastClosingYmd) {
    closings.push(asOf);
  }

  const points = [opening, ...closings];
  return {
    asOf,
    opening,
    points,
    periods: closings.map((close, index) => {
      const startExclusive = index === 0 ? opening : closings[index - 1];
      return {
        startExclusive,
        close,
        startDate: toLocalYmd(addDays(startExclusive, 1)),
        endDate: toLocalYmd(close),
        closeLabel: `Balance as at ${formatLongDate(close)}`
      };
    })
  };
};

export const parseNetProfit = (raw) => {
  if (raw == null || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};
