import { trialBalanceAPI, gsecEntriesAPI } from '../services/api';

const absAmount = (n) => Math.abs(Number(n) || 0);

/** Normalize account codes so COA / TB / GSec codes match reliably. */
export const normalizeAccountCode = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '');

const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const extractTbAccounts = (tbPayload) => {
  if (Array.isArray(tbPayload?.data?.accounts)) return tbPayload.data.accounts;
  if (Array.isArray(tbPayload?.accounts)) return tbPayload.accounts;
  return [];
};

const extractGsecAccounts = (gsecPayload) => {
  if (Array.isArray(gsecPayload?.data?.accounts)) return gsecPayload.data.accounts;
  if (Array.isArray(gsecPayload?.accounts)) return gsecPayload.accounts;
  return [];
};

/**
 * Same merge as Combined Trial Balance:
 * equity TB + GSec by account code, sum debits/credits, net = debit - credit.
 * Notes show the absolute closing balance (full amount on the TB).
 */
const buildCombinedTrialBalanceMaps = (equityAccounts, gsecAccounts) => {
  const byRawCode = new Map();

  const upsert = (key, init, merger) => {
    const existing = byRawCode.get(key);
    if (existing) merger(existing);
    else byRawCode.set(key, init());
  };

  (equityAccounts || []).forEach((a) => {
    const key = String(a.account_code || a.accountCode || '').trim();
    if (!key) return;
    const totalDebit = Number(a.total_debit) || 0;
    const totalCredit = Number(a.total_credit) || 0;

    upsert(
      key,
      () => ({
        account_code: key,
        account_name: a.account_name || a.accountName || '',
        total_debit: totalDebit,
        total_credit: totalCredit
      }),
      (row) => {
        row.total_debit += totalDebit;
        row.total_credit += totalCredit;
        row.account_name = row.account_name || a.account_name || a.accountName || '';
      }
    );
  });

  (gsecAccounts || []).forEach((g) => {
    const key = String(g.account_code || g.accountCode || '').trim();
    if (!key) return;
    const totalDebit = Number(g.total_debit) || 0;
    const totalCredit = Number(g.total_credit) || 0;

    upsert(
      key,
      () => ({
        account_code: key,
        account_name: g.account_name || g.accountName || '',
        total_debit: totalDebit,
        total_credit: totalCredit
      }),
      (row) => {
        row.total_debit += totalDebit;
        row.total_credit += totalCredit;
        row.account_name = row.account_name || g.account_name || g.accountName || '';
      }
    );
  });

  const byCode = new Map();
  const byName = new Map();

  byRawCode.forEach((row) => {
    const net = absAmount(row.total_debit - row.total_credit);
    const codeKey = normalizeAccountCode(row.account_code);
    const nameKey = normalizeName(row.account_name);
    if (codeKey) byCode.set(codeKey, (byCode.get(codeKey) || 0) + net);
    if (nameKey) byName.set(nameKey, (byName.get(nameKey) || 0) + net);
  });

  return { byCode, byName };
};

const fuzzyNameAmount = (byName, rawName) => {
  const key = normalizeName(rawName);
  if (!key) return 0;
  if (byName.has(key)) return byName.get(key) || 0;

  let best = 0;
  byName.forEach((amount, name) => {
    if (amount < 0.005) return;
    if (name.includes(key) || key.includes(name)) {
      best = Math.max(best, amount);
    }
  });
  return best;
};

/** Sum full Combined-TB amounts for every selected account on the row. */
const sumForRow = (maps, row) => {
  let sum = 0;
  let matchedByCode = false;

  (row.accountCodes || []).forEach((code) => {
    const amount = maps.byCode.get(normalizeAccountCode(code)) || 0;
    if (amount > 0.005) matchedByCode = true;
    sum += amount;
  });
  if (matchedByCode || sum > 0.005) return sum;

  (row.accountNames || []).forEach((name) => {
    sum += fuzzyNameAmount(maps.byName, name);
  });
  if (sum > 0.005) return sum;

  return fuzzyNameAmount(maps.byName, row.label);
};

const fetchWithRetry = async (fn, attempts = 2) => {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
  }
  throw lastErr;
};

const loadPeriodMaps = async (period) => {
  const startDate = period.startDate;
  const endDate = period.endDate || period.asOfDate;

  // Same two sources Combined Trial Balance loads (in parallel, with TB retry).
  const [tbResp, gsecResp] = await Promise.all([
    fetchWithRetry(() => trialBalanceAPI.getTrialBalance({ startDate, endDate })).catch((err) => {
      console.warn('Equity trial balance unavailable for note rows:', err?.message || err);
      return null;
    }),
    fetchWithRetry(() => gsecEntriesAPI.getBalanceSheet({ startDate, endDate })).catch((err) => {
      console.warn('GSec balance sheet unavailable for note rows:', err?.message || err);
      return null;
    })
  ]);

  const equityAccounts =
    tbResp && tbResp.success !== false ? extractTbAccounts(tbResp) : [];
  const gsecAccounts =
    gsecResp && gsecResp.success !== false ? extractGsecAccounts(gsecResp) : [];

  if (!equityAccounts.length && !gsecAccounts.length) {
    throw new Error(
      'Could not load Combined Trial Balance data (equity TB + GSec) for custom note rows'
    );
  }

  return buildCombinedTrialBalanceMaps(equityAccounts, gsecAccounts);
};

/**
 * Resolve session-only custom note rows from Combined Trial Balance amounts
 * (equity TB + GSec), matching the selected account code(s).
 */
export const resolveCustomNoteRows = async (rows, periods) => {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length || !periods?.current || !periods?.prior) {
    return list.map((r) => ({
      ...r,
      current: 0,
      prior: 0
    }));
  }

  // Sequential periods to reduce auth/DB pressure (was causing intermittent TB 500s).
  const currentMaps = await loadPeriodMaps(periods.current);
  const priorMaps = await loadPeriodMaps(periods.prior);

  return list.map((row) => ({
    ...row,
    current: sumForRow(currentMaps, row),
    prior: sumForRow(priorMaps, row)
  }));
};

export const sumCustomRows = (rows) =>
  (rows || []).reduce(
    (s, r) => ({
      current: s.current + (Number(r.current) || 0),
      prior: s.prior + (Number(r.prior) || 0)
    }),
    { current: 0, prior: 0 }
  );
