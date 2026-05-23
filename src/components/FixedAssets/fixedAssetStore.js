/**
 * Frontend-only store for the Fixed Assets module.
 *
 * Persists to localStorage so categories + assets survive reloads. When the
 * backend is ready, replace the body of every exported function with API
 * calls (the rest of the UI doesn't need to change).
 */

const STORAGE_KEYS = {
  categories: 'fa_categories_v1',
  assets: 'fa_assets_v1'
};

/** Default category seed mirrors the depreciation pairing the SOFP already uses. */
const DEFAULT_CATEGORIES = [
  {
    id: 'CAT-COMPUTER',
    code: 'COMPUTER',
    name: 'Office Computers',
    rate: 0.25,
    usefulLifeYears: 4,
    method: 'STRAIGHT_LINE',
    assetGlAccountCode: '1-FA-COMPUTER',
    accumulatedDepGlAccountCode: '1-PROV-COMPUTER',
    depreciationExpenseGlAccountCode: '6-DEP-COMPUTER'
  },
  {
    id: 'CAT-EQUIPMENT',
    code: 'EQUIPMENT',
    name: 'Office Equipment',
    rate: 0.20,
    usefulLifeYears: 5,
    method: 'STRAIGHT_LINE',
    assetGlAccountCode: '1-FA-EQUIPMENT',
    accumulatedDepGlAccountCode: '1-PROV-EQUIPMENT',
    depreciationExpenseGlAccountCode: '6-DEP-EQUIPMENT'
  }
];

const safeParse = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readCategories = () => {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  const raw = window.localStorage.getItem(STORAGE_KEYS.categories);
  if (raw == null) {
    window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return safeParse(raw, DEFAULT_CATEGORIES);
};

const readAssets = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEYS.assets), []);
};

const writeCategories = (rows) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(rows));
};

const writeAssets = (rows) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.assets, JSON.stringify(rows));
};

const uuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayYmd = () => new Date().toISOString().split('T')[0];

const toYmd = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().split('T')[0];
};

/**
 * Generate a monthly depreciation schedule for one asset.
 * Straight-line, prorated by month of depreciation_start_date.
 */
export const generateSchedule = (asset, category) => {
  if (!asset || !category) return [];
  const cost = Number(asset.cost) || 0;
  const residual = Number(asset.residualValue) || 0;
  const rate = Number(category.rate) || 0;
  const lifeYears = Number(category.usefulLifeYears) || 0;
  if (cost <= 0 || lifeYears <= 0 || rate <= 0) return [];

  const start = new Date(asset.depreciationStartDate || asset.purchaseDate || todayYmd());
  if (Number.isNaN(start.getTime())) return [];

  const annual = (cost - residual) * rate;
  const monthly = annual / 12;
  const totalMonths = lifeYears * 12;

  const rows = [];
  let accumulated = 0;
  for (let i = 0; i < totalMonths; i++) {
    const periodDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const remaining = Math.max(cost - residual - accumulated, 0);
    const depAmount = Math.min(monthly, remaining);
    accumulated += depAmount;
    const wdv = cost - accumulated;
    rows.push({
      periodKey: `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`,
      periodLabel: periodDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      year: periodDate.getFullYear(),
      month: periodDate.getMonth() + 1,
      depreciation: depAmount,
      accumulated,
      wdv,
      status: 'PLANNED'
    });
    if (depAmount === 0) break;
  }
  return rows;
};

/** Roll the per-month schedule into a derived view (acc dep + WDV as of a date). */
export const computeAssetSnapshot = (asset, category, asOfDate) => {
  if (!asset || !category) {
    return { cost: 0, accumulated: 0, wdv: 0, monthly: 0, annual: 0, schedule: [] };
  }
  const schedule = generateSchedule(asset, category);
  const asOf = asOfDate ? new Date(asOfDate) : new Date();
  const asOfKey = `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, '0')}`;

  const cutoff = schedule.filter((r) => r.periodKey <= asOfKey);
  const accumulated =
    cutoff.length > 0 ? cutoff[cutoff.length - 1].accumulated : 0;
  const cost = Number(asset.cost) || 0;
  const residual = Number(asset.residualValue) || 0;
  const annual = (cost - residual) * (Number(category.rate) || 0);
  const monthly = annual / 12;

  return {
    cost,
    accumulated,
    wdv: cost - accumulated,
    monthly,
    annual,
    schedule
  };
};

/** Public CRUD-ish helpers used by the screens. */

export const listCategories = () => readCategories();

export const upsertCategory = (cat) => {
  const rows = readCategories();
  const idx = rows.findIndex((r) => r.id === cat.id);
  const next = { ...cat, id: cat.id || `CAT-${uuid()}` };
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...next };
  } else {
    rows.push(next);
  }
  writeCategories(rows);
  return next;
};

export const deleteCategory = (id) => {
  const rows = readCategories().filter((r) => r.id !== id);
  writeCategories(rows);
};

export const listAssets = () => readAssets();

const nextAssetCode = (category) => {
  const prefix = `SHER/${(category?.code || 'GEN').slice(0, 4).toUpperCase()}/`;
  const existing = readAssets()
    .filter((a) => a.assetCode && a.assetCode.startsWith(prefix))
    .map((a) => Number(a.assetCode.split('/').pop()) || 0);
  const next = (existing.length ? Math.max(...existing) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

export const createAsset = (input) => {
  const cats = readCategories();
  const cat = cats.find((c) => c.id === input.categoryId);
  const asset = {
    id: uuid(),
    assetCode: input.assetCode?.trim() || nextAssetCode(cat),
    categoryId: input.categoryId,
    name: input.name?.trim() || '',
    description: input.description || '',
    serialNumber: input.serialNumber || '',
    purchaseDate: toYmd(input.purchaseDate) || todayYmd(),
    depreciationStartDate:
      toYmd(input.depreciationStartDate) || toYmd(input.purchaseDate) || todayYmd(),
    cost: Number(input.cost) || 0,
    residualValue: Number(input.residualValue) || 0,
    quantity: Number(input.quantity) || 1,
    supplier: input.supplier || '',
    invoiceNumber: input.invoiceNumber || '',
    location: input.location || '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const rows = readAssets();
  rows.push(asset);
  writeAssets(rows);
  return asset;
};

export const updateAsset = (id, patch) => {
  const rows = readAssets();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...patch };
  writeAssets(rows);
  return rows[idx];
};

export const deleteAsset = (id) => {
  const rows = readAssets().filter((r) => r.id !== id);
  writeAssets(rows);
};

export const findCategoryById = (id) =>
  readCategories().find((c) => c.id === id) || null;
