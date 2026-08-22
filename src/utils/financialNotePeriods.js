/** Comparative periods for financial notes — driven by user-selected as-at date. */

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

export const toLocalYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatAsAtLabel = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Same calendar day one year earlier (handles 29-Feb). */
const sameDayPriorYear = (date) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

/** Sri Lanka-style FY: 1 April – 31 March containing the as-at date. */
export const getFinancialYearStart = (asOfDateYmd) => {
  const anchor = parseYmd(asOfDateYmd) || new Date();
  const fyStartYear = anchor.getMonth() >= 3 ? anchor.getFullYear() : anchor.getFullYear() - 1;
  return new Date(fyStartYear, 3, 1);
};

const formatLongBalanceDate = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const formatShortMonthYear = (d) => {
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon}-${yy}`;
};

/**
 * Build comparative columns from the selected as-at date:
 * - SOFP / balance-sheet notes: balances as at that date vs prior-year same day
 * - P&L notes: YTD from 1 Jan through as-at date (both years)
 * - PPE note: FY opening 01 April → as-at (see buildPpeNotePeriods)
 */
export const buildNotePeriods = (asOfDateYmd) => {
  const anchor = parseYmd(asOfDateYmd) || new Date();
  const priorAnchor = sameDayPriorYear(anchor);

  const currentYearStart = new Date(anchor.getFullYear(), 0, 1);
  const priorYearStart = new Date(priorAnchor.getFullYear(), 0, 1);

  const currentLabel = formatAsAtLabel(anchor);
  const priorLabel = formatAsAtLabel(priorAnchor);

  return {
    current: {
      year: anchor.getFullYear(),
      startDate: toLocalYmd(currentYearStart),
      endDate: toLocalYmd(anchor),
      asOfDate: toLocalYmd(anchor),
      label: currentLabel
    },
    prior: {
      year: priorAnchor.getFullYear(),
      startDate: toLocalYmd(priorYearStart),
      endDate: toLocalYmd(priorAnchor),
      asOfDate: toLocalYmd(priorAnchor),
      label: priorLabel
    },
    periodTitle: `As at ${currentLabel} (comparative: ${priorLabel})`
  };
};

/**
 * PPE disclosure periods (matches published note layout):
 * opening = 01 April of FY, closing = as-at date.
 * Opening balances use as-of 01 April (not 31 March) so OB / entries
 * dated on FY start are included in "Balance as at 01 April".
 */
export const buildPpeNotePeriods = (asOfDateYmd) => {
  const anchor = parseYmd(asOfDateYmd) || new Date();
  const fyStart = getFinancialYearStart(asOfDateYmd);
  const priorFyStart = new Date(fyStart.getFullYear() - 1, 3, 1);

  const currentLabel = formatAsAtLabel(anchor);
  const openingLabel = formatAsAtLabel(fyStart);

  return {
    current: {
      year: anchor.getFullYear(),
      startDate: toLocalYmd(fyStart),
      endDate: toLocalYmd(anchor),
      asOfDate: toLocalYmd(anchor),
      label: currentLabel,
      shortLabel: formatShortMonthYear(anchor),
      longLabel: formatLongBalanceDate(anchor)
    },
    prior: {
      year: fyStart.getFullYear(),
      startDate: toLocalYmd(priorFyStart),
      endDate: toLocalYmd(fyStart),
      asOfDate: toLocalYmd(fyStart),
      label: openingLabel,
      shortLabel: String(fyStart.getFullYear()),
      longLabel: formatLongBalanceDate(fyStart)
    },
    fyStartLabel: formatLongBalanceDate(fyStart),
    closingLabel: formatLongBalanceDate(anchor),
    periodTitle: `As at ${currentLabel}`
  };
};
