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

const sideFromNet = (net) => {
  const n = Number(net) || 0;
  if (Math.abs(n) < 0.005) return '';
  return n > 0 ? 'DR' : 'CR';
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
    const signed = (Number(row.total_debit) || 0) - (Number(row.total_credit) || 0);
    const entry = {
      amount: absAmount(signed),
      side: sideFromNet(signed),
      signed
    };
    const codeKey = normalizeAccountCode(row.account_code);
    const nameKey = normalizeName(row.account_name);
    if (codeKey) {
      const prev = byCode.get(codeKey);
      if (prev) {
        const nextSigned = prev.signed + signed;
        byCode.set(codeKey, {
          amount: absAmount(nextSigned),
          side: sideFromNet(nextSigned),
          signed: nextSigned
        });
      } else {
        byCode.set(codeKey, entry);
      }
    }
    if (nameKey) {
      const prev = byName.get(nameKey);
      if (prev) {
        const nextSigned = prev.signed + signed;
        byName.set(nameKey, {
          amount: absAmount(nextSigned),
          side: sideFromNet(nextSigned),
          signed: nextSigned
        });
      } else {
        byName.set(nameKey, { ...entry });
      }
    }
  });

  return { byCode, byName };
};

const lookupAmount = (maps, code, name) => {
  if (code) {
    const byCode = maps.byCode.get(normalizeAccountCode(code));
    if (byCode && byCode.amount > 0.005) return byCode;
  }
  if (name) {
    const key = normalizeName(name);
    if (key && maps.byName.has(key)) return maps.byName.get(key);
    let best = null;
    maps.byName.forEach((entry, mapName) => {
      if (!entry || entry.amount < 0.005) return;
      if (mapName.includes(key) || key.includes(mapName)) {
        if (!best || entry.amount > best.amount) best = entry;
      }
    });
    if (best) return best;
  }
  return { amount: 0, side: '', signed: 0 };
};

/** Sum full Combined-TB amounts for every selected account on the row. */
const sumForRow = (maps, row) => {
  let sum = 0;
  let matchedByCode = false;

  (row.accountCodes || []).forEach((code) => {
    const entry = lookupAmount(maps, code, '');
    if (entry.amount > 0.005) matchedByCode = true;
    sum += entry.amount;
  });
  if (matchedByCode || sum > 0.005) return sum;

  (row.accountNames || []).forEach((name) => {
    sum += lookupAmount(maps, '', name).amount;
  });
  if (sum > 0.005) return sum;

  return lookupAmount(maps, '', row.label).amount;
};

const detailsForRow = (currentMaps, priorMaps, row) => {
  const codes = row.accountCodes || [];
  const names = row.accountNames || [];
  if (!codes.length) {
    return (names.length ? names : [row.label]).map((name) => {
      const cur = lookupAmount(currentMaps, '', name);
      const pri = lookupAmount(priorMaps, '', name);
      return {
        code: '',
        name,
        currentAmount: cur.amount,
        currentSide: cur.side,
        priorAmount: pri.amount,
        priorSide: pri.side
      };
    });
  }

  return codes.map((code, i) => {
    const name = names[i] || code;
    const cur = lookupAmount(currentMaps, code, name);
    const pri = lookupAmount(priorMaps, code, name);
    return {
      code,
      name,
      currentAmount: cur.amount,
      currentSide: cur.side,
      priorAmount: pri.amount,
      priorSide: pri.side
    };
  });
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
      prior: 0,
      accountDetails: []
    }));
  }

  // Sequential periods to reduce auth/DB pressure (was causing intermittent TB 500s).
  const currentMaps = await loadPeriodMaps(periods.current);
  const priorMaps = await loadPeriodMaps(periods.prior);

  return list.map((row) => ({
    ...row,
    current: sumForRow(currentMaps, row),
    prior: sumForRow(priorMaps, row),
    accountDetails: detailsForRow(currentMaps, priorMaps, row)
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
