/** AMC / AMH / CCH group snapshot - equity 28-May-2025, valuation 23-Mar-2026 */
export const GROUP_FINANCE_DATA = {
  date: '2025-05-28',
  valuationDate: '2026-03-23',
  companies: [
    {
      code: 'AMC',
      name: 'Ambeon Capital PLC',
      treasuryBond: 0,
      equityPortfolio: 2230035305,
      otherInvestments: 566000000,
      totalLiquidAssets: 2796035305,
      externalBorrowings: 3513720779,
      internalBorrowings: 1868100000,
      totalBorrowings: 5381820779
    },
    {
      code: 'AMH',
      name: 'Ambeon Holdings PLC',
      treasuryBond: 3120610,
      equityPortfolio: 9561527592,
      otherInvestments: 894835000,
      totalLiquidAssets: 10459483202,
      externalBorrowings: 3733787415,
      internalBorrowings: 0,
      totalBorrowings: 3733787415
    },
    {
      code: 'CCH',
      name: 'Colombo City Holdings',
      treasuryBond: 22580800,
      equityPortfolio: 667929620,
      otherInvestments: 585000000,
      totalLiquidAssets: 1275510420,
      externalBorrowings: 0,
      internalBorrowings: 8693919,
      totalBorrowings: 8693919
    }
  ]
};

export const ASSET_COLORS = {
  treasuryBond: '#6366f1',
  equityPortfolio: '#0ea5e9',
  otherInvestments: '#14b8a6'
};

export const CHART_PALETTE = ['#2563eb', '#7c3aed', '#059669'];

const newCompanyId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function parseMoney(value) {
  if (value === null || value === undefined) return null;
  const t = String(value).trim().replace(/,/g, '');
  if (t === '' || t === '-' || t === '—') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function normalizeCompany(company) {
  const treasuryBond = parseMoney(company.treasuryBond) ?? 0;
  const equityPortfolio = parseMoney(company.equityPortfolio) ?? 0;
  const otherInvestments = parseMoney(company.otherInvestments) ?? 0;
  const externalBorrowings = parseMoney(company.externalBorrowings) ?? 0;
  const internalBorrowings = parseMoney(company.internalBorrowings) ?? 0;
  const totalLiquidAssets = treasuryBond + equityPortfolio + otherInvestments;
  const totalBorrowings = externalBorrowings + internalBorrowings;

  const code = String(company.code ?? '')
    .trim()
    .toUpperCase();
  const safeCode = code || 'CO';

  return {
    ...company,
    companyId: company.companyId || newCompanyId(),
    code: safeCode,
    name: String(company.name ?? '').trim() || safeCode,
    treasuryBond,
    equityPortfolio,
    otherInvestments,
    externalBorrowings,
    internalBorrowings,
    totalLiquidAssets,
    totalBorrowings
  };
}

export function cloneGroupData(data = GROUP_FINANCE_DATA) {
  return {
    date: data.date,
    valuationDate: data.valuationDate,
    companies: data.companies.map((c) => normalizeCompany({ ...c }))
  };
}

export function sumField(companies, field) {
  return companies.reduce((s, c) => s + (Number(c[field]) || 0), 0);
}

export function deriveGroupMetrics(data = GROUP_FINANCE_DATA) {
  const companies = data.companies.map((c) => {
    const normalized = normalizeCompany(c);
    return {
      ...normalized,
      netPosition: normalized.totalLiquidAssets - normalized.totalBorrowings
    };
  });

  const totalLiquidAssets = sumField(companies, 'totalLiquidAssets');
  const totalBorrowings = sumField(companies, 'totalBorrowings');
  const totalExternalBorrowings = sumField(companies, 'externalBorrowings');
  const totalInternalBorrowings = sumField(companies, 'internalBorrowings');
  const netPosition = totalLiquidAssets - totalBorrowings;

  const highestExposure = companies.reduce((best, c) =>
    c.totalLiquidAssets > (best?.totalLiquidAssets ?? 0) ? c : best
  , companies[0]);

  const mostLeveraged = companies.reduce((worst, c) => {
    const ratio = c.totalBorrowings / (c.totalLiquidAssets || 1);
    const worstRatio = worst ? worst.totalBorrowings / (worst.totalLiquidAssets || 1) : 0;
    return ratio > worstRatio ? c : worst;
  }, null);

  const strongestNet = companies.reduce((best, c) =>
    c.netPosition > (best?.netPosition ?? -Infinity) ? c : best
  , companies[0]);

  return {
    companies,
    totalLiquidAssets,
    totalBorrowings,
    totalExternalBorrowings,
    totalInternalBorrowings,
    netPosition,
    highestExposure,
    mostLeveraged,
    strongestNet
  };
}

export function formatCurrency(value, { compact = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatDisplayDate(ymd) {
  const s = String(ymd ?? '').slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
