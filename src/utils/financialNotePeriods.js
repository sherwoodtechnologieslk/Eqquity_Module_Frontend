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

/**
 * Build comparative columns from the selected as-at date:
 * - SOFP / balance-sheet notes: balances as at that date vs prior-year same day
 * - P&L notes: YTD from 1 Jan through as-at date (both years)
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
