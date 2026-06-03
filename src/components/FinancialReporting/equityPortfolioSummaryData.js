/**
 * Seed data for Equity Portfolio Summary - derived from the line-level Equity report.
 * Each holding belongs to one company (AMC / AMH / CCH) and has a default sector.
 * Users can edit any field (incl. sector) in the report itself.
 */

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_SECTORS = [
  'Banks',
  'Diversified Financials',
  'Hotels & Travel',
  'Materials',
  'Manufacturing',
  'Beverage Food & Tobacco',
  'Telecommunications',
  'Construction & Engineering',
  'Other'
];

const HOLDINGS_SEED = [
  // AMC
  { company: 'AMC', counter: 'COMB',           sector: 'Banks',                  shares: 29109,    totalCost: 0,           totalMV: 5567096 },
  { company: 'AMC', counter: 'Capital Metals', sector: 'Materials',              shares: 59701000, totalCost: 600000000,   totalMV: 1235362047 },
  { company: 'AMC', counter: 'MDL.N',          sector: 'Manufacturing',          shares: 18500000, totalCost: 158720656,   totalMV: 381100000 },
  { company: 'AMC', counter: 'CHOT',           sector: 'Hotels & Travel',        shares: 19425117, totalCost: 584277635,   totalMV: 608006162 },

  // AMH
  { company: 'AMH', counter: 'HNB.X',          sector: 'Banks',                  shares: 607538,   totalCost: 171305615,   totalMV: 200487540 },
  { company: 'AMH', counter: 'COMB',           sector: 'Banks',                  shares: 3050000,  totalCost: 549904256,   totalMV: 583312500 },
  { company: 'AMH', counter: 'HAY',            sector: 'Diversified Financials', shares: 15697,    totalCost: 2751050,     totalMV: 3221809 },
  { company: 'AMH', counter: 'SAM',            sector: 'Hotels & Travel',        shares: 20837,    totalCost: 1873783,     totalMV: 3151596 },
  { company: 'AMH', counter: 'DFCC',           sector: 'Banks',                  shares: 38275412, totalCost: 3507196459,  totalMV: 4947097001 },
  { company: 'AMH', counter: 'SEYB',           sector: 'Banks',                  shares: 30296829, totalCost: 1914445564,  totalMV: 3029682900 },
  { company: 'AMH', counter: 'CHOT',           sector: 'Hotels & Travel',        shares: 5000000,  totalCost: 201732500,   totalMV: 156500000 },
  { company: 'AMH', counter: 'KHC.N',          sector: 'Diversified Financials', shares: 45904622, totalCost: 554736954,   totalMV: 638074246 },

  // CCH
  { company: 'CCH', counter: 'DFCC',           sector: 'Banks',                  shares: 5167734,  totalCost: 436662688,   totalMV: 667929620 }
];

export const EQUITY_SUMMARY_DATA = {
  asOfDate: '2026-03-23',
  companies: [
    { companyId: 'AMC', code: 'AMC', name: 'Ambeon Capital PLC' },
    { companyId: 'AMH', code: 'AMH', name: 'Ambeon Holdings PLC' },
    { companyId: 'CCH', code: 'CCH', name: 'Colombo City Holdings PLC' }
  ],
  holdings: HOLDINGS_SEED.map((h) => ({
    id: newId(),
    company: h.company,
    counter: h.counter,
    sector: h.sector,
    shares: h.shares,
    totalCost: h.totalCost,
    totalMV: h.totalMV
  }))
};

export function parseMoney(value) {
  if (value === null || value === undefined) return null;
  const t = String(value).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === '—') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function deriveHolding(holding) {
  const shares = parseMoney(holding.shares) ?? 0;
  const totalCost = parseMoney(holding.totalCost) ?? 0;
  const totalMV = parseMoney(holding.totalMV) ?? 0;
  const unrealised = totalMV - totalCost;
  return { ...holding, shares, totalCost, totalMV, unrealised };
}

export function cloneEquitySummaryData(data = EQUITY_SUMMARY_DATA) {
  return {
    asOfDate: data.asOfDate,
    companies: data.companies.map((c) => ({ ...c })),
    holdings: data.holdings.map((h) => ({ ...h, id: h.id || newId() }))
  };
}

export { newId };

export const SUMMARY_COLUMNS = [
  { key: 'counter', label: 'Counter', alwaysOn: true },
  { key: 'sector', label: 'Sector' },
  { key: 'company', label: 'Company' },
  { key: 'shares', label: 'No. of shares', numeric: true },
  { key: 'totalCost', label: 'Total cost', numeric: true },
  { key: 'totalMV', label: 'Total market value', numeric: true },
  { key: 'unrealised', label: 'Unrealised gain / (loss)', numeric: true },
  { key: 'weight', label: '% of portfolio', numeric: true }
];

export const GROUPING_OPTIONS = [
  { key: 'company', label: 'By company' },
  { key: 'sector', label: 'By sector' },
  { key: 'none', label: 'Flat list' }
];

export function formatNumber(value, { decimals = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(value, { decimals = 2 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(decimals)}%`;
}

export function formatDisplayDate(ymd) {
  const s = String(ymd ?? '').slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
