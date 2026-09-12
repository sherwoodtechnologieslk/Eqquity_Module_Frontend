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

/** Most recent 31 March strictly before the as-at date. */
export const lastMarch31Before = (date) => {
  const y = date.getFullYear();
  const mar31ThisYear = new Date(y, 2, 31);
  if (date.getTime() > mar31ThisYear.getTime()) return mar31ThisYear;
  return new Date(y - 1, 2, 31);
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
 * - Current: as-at date (P&L from 1 January of that year through as-at)
 * - Comparative: 31 March of the same year (P&L from 1 January through 31 March)
 * - PPE note: FY opening 01 April → as-at (see buildPpeNotePeriods)
 */
export const buildNotePeriods = (asOfDateYmd) => {
  const anchor = parseYmd(asOfDateYmd) || new Date();
  const yearEnd = lastMarch31Before(anchor);
  const currentStart = new Date(anchor.getFullYear(), 0, 1);
  const priorStart = new Date(yearEnd.getFullYear(), 0, 1);

  const currentLabel = formatAsAtLabel(anchor);
  const priorLabel = formatAsAtLabel(yearEnd);

  return {
    current: {
      year: anchor.getFullYear(),
      startDate: toLocalYmd(currentStart),
      endDate: toLocalYmd(anchor),
      asOfDate: toLocalYmd(anchor),
      label: currentLabel,
      shortLabel: formatShortMonthYear(anchor)
    },
    prior: {
      year: yearEnd.getFullYear(),
      startDate: toLocalYmd(priorStart),
      endDate: toLocalYmd(yearEnd),
      asOfDate: toLocalYmd(yearEnd),
      label: priorLabel,
      shortLabel: formatShortMonthYear(yearEnd)
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
