import { financialPositionAPI, profitLossAPI, portfolioAPI, financialNotesAPI } from '../services/api';
import {
  listCategories,
  listAssets,
  computeAssetSnapshot
} from '../components/FixedAssets/fixedAssetStore';
import { buildNotePeriods, buildPpeNotePeriods } from './financialNotePeriods';
import { getNoteById } from './financialNotesRegistry';
import { resolveCustomNoteRows } from './resolveCustomNoteRows';

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const matchesPatterns = (text, patterns = []) =>
  patterns.some((p) => text.includes(normalizeText(p)));

const absAmount = (n) => Math.abs(Number(n) || 0);

const normalizeSide = (value) => {
  const s = String(value || '')
    .trim()
    .toUpperCase();
  if (s === 'DR' || s === 'DEBIT') return 'DR';
  if (s === 'CR' || s === 'CREDIT') return 'CR';
  return '';
};

/** Build a linked-account ref with absolute amount + DR/CR side. */
const makeAccountRef = (code, name, signedAmount, balanceType) => {
  const signed = Number(signedAmount) || 0;
  const side =
    normalizeSide(balanceType) ||
    (Math.abs(signed) < 0.005 ? '' : signed >= 0 ? 'DR' : 'CR');
  return {
    code: String(code || '').trim(),
    name: String(name || code || '-').trim(),
    amount: absAmount(signed),
    side
  };
};

/** Fixed Note 3 Revenue descriptions (fallback if backend mappings unavailable). */
const NOTE3_REVENUE_DESCRIPTIONS = [
  'Capital Gain on Treasury Bonds',
  'Capital Gain on Treasury Bills',
  'Accrued Interest income on Treasury Bonds & Bills'
];

/** Fixed Note 4 Other Income descriptions (fallback if backend mappings unavailable). */
const NOTE4_OTHER_INCOME_DESCRIPTIONS = [
  'Interest income on repo investment',
  'Sundry Income',
  'Interest Income-Other',
  'Dividend Income',
  'Other Income Profit on share trading'
];

/** Fixed Note 5 Finance Cost descriptions (fallback if backend mappings unavailable). */
const NOTE5_FINANCE_COST_DESCRIPTIONS = [
  'Interest expences on reverse repo',
  'Interest expenses on loan',
  'Interest paid on Sell- Buy',
  'Interest on Lease'
];

/**
 * Fixed-description comparative notes (e.g. Note 3 / 4 / 5).
 * Descriptions + optional account codes from backend; amounts from Combined TB.
 */
const loadMappedComparativeNote = async (noteId, fallbackDescriptions, periods) => {
  let mappedLines = (fallbackDescriptions || []).map((description) => ({
    description,
    accountCodes: [],
    accounts: []
  }));

  try {
    const resp = await financialNotesAPI.getMappings(noteId);
    if (resp?.success && Array.isArray(resp.lines) && resp.lines.length) {
      mappedLines = resp.lines.map((line) => ({
        description: line.description,
        accountCodes: line.accountCodes || [],
        accounts: line.accounts || []
      }));
    }
  } catch (err) {
    console.warn(
      `Financial note mappings unavailable for ${noteId}; using fallback descriptions:`,
      err?.message || err
    );
  }

  const defs = mappedLines.map((line, idx) => ({
    id: `${noteId}-${idx}`,
    label: line.description,
    accountCodes: line.accountCodes || [],
    accountNames: (line.accounts || []).map((a) => a.name || a.code || '')
  }));

  let resolved = defs.map((d) => ({
    ...d,
    current: 0,
    prior: 0,
    accountDetails: []
  }));

  try {
    resolved = await resolveCustomNoteRows(defs, periods);
  } catch (err) {
    console.warn(
      `Could not resolve Combined TB amounts for ${noteId} mappings:`,
      err?.message || err
    );
  }

  const rows = mappedLines.map((line, idx) => {
    const hit = resolved[idx] || {};
    const backendAccounts = line.accounts || [];
    const details = hit.accountDetails || [];
    const accounts =
      details.length > 0
        ? details.map((d, i) => ({
            code: d.code || backendAccounts[i]?.code || '',
            name: d.name || backendAccounts[i]?.name || d.code || '',
            currentAmount: d.currentAmount,
            currentSide: d.currentSide,
            priorAmount: d.priorAmount,
            priorSide: d.priorSide
          }))
        : (line.accountCodes || []).map((code, i) => ({
            code,
            name: backendAccounts[i]?.name || code,
            currentAmount: 0,
            currentSide: '',
            priorAmount: 0,
            priorSide: ''
          }));

    return {
      label: line.description,
      current: Number(hit.current) || 0,
      prior: Number(hit.prior) || 0,
      accounts
    };
  });

  return {
    template: 'comparative',
    rows,
    total: sumComparative(rows)
  };
};

const loadRevenueNoteTemplate = (periods) =>
  loadMappedComparativeNote('note-3', NOTE3_REVENUE_DESCRIPTIONS, periods);

const loadOtherIncomeNoteTemplate = (periods) =>
  loadMappedComparativeNote('note-4', NOTE4_OTHER_INCOME_DESCRIPTIONS, periods);

const loadFinanceCostNoteTemplate = (periods) =>
  loadMappedComparativeNote('note-5', NOTE5_FINANCE_COST_DESCRIPTIONS, periods);

/** Fallback Note 6 structure if backend mappings unavailable. */
const NOTE6_INCOME_TAX_FALLBACK = [
  { id: 'n6-sec-current', description: 'Current Income Tax', type: 'section', block: 'summary' },
  {
    id: 'n6-current-tax-expense',
    description: 'Current Tax Expense on Ordinary Activities for the Year (Note 6.1)',
    type: 'line',
    block: 'summary',
    indent: 1
  },
  { id: 'n6-sec-deferred', description: 'Deferred Income Tax', type: 'section', block: 'summary' },
  {
    id: 'n6-deferred-charge',
    description: 'Deferred Taxation Charge (Note 9)',
    type: 'line',
    block: 'summary',
    indent: 1
  },
  {
    id: 'n6-expense-reported',
    description: 'Income Tax Expense Reported in the Income Statement',
    type: 'total',
    block: 'summary'
  },
  {
    id: 'n6-recon-heading',
    description:
      '6.1 Reconciliation between current tax expense and the product of accounting profit',
    type: 'heading',
    block: 'reconciliation'
  },
  {
    id: 'n6-accounting-profit',
    description: 'Accounting profit before Income Tax',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-repo-interest-adj',
    description: 'Repo interest income',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-loss-fv',
    description: 'Loss From Change in Fair Value of Financial Assets',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-profit-share-trading',
    description: 'Profit on share trading',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-fairvalue-gain',
    description: 'Fairvalue gain',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-dividend-income',
    description: 'Dividend Income',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-other-interest-adj',
    description: 'Other Interest Income',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-sec-disallowed',
    description: 'Aggregate Disallowed items',
    type: 'section',
    block: 'reconciliation'
  },
  {
    id: 'n6-disallowed-fv',
    description: 'Change in Fair Value of Financial Assets',
    type: 'line',
    block: 'reconciliation',
    indent: 1
  },
  {
    id: 'n6-disallowed-share-cost',
    description: 'Share Transaction cost',
    type: 'line',
    block: 'reconciliation',
    indent: 1
  },
  {
    id: 'n6-disallowed-dep',
    description: 'Accounting depreciations on PPE',
    type: 'line',
    block: 'reconciliation',
    indent: 1
  },
  {
    id: 'n6-aggregate-allowable',
    description: 'Aggregate allowable Expenses',
    type: 'line',
    block: 'reconciliation'
  },
  {
    id: 'n6-taxable-business',
    description: 'Taxable Income from Business',
    type: 'subtotal',
    block: 'reconciliation'
  },
  {
    id: 'n6-sec-other-sources',
    description: 'Income from other sources',
    type: 'section',
    block: 'reconciliation'
  },
  {
    id: 'n6-repo-interest-other',
    description: 'Repo interest income',
    type: 'line',
    block: 'reconciliation',
    indent: 1
  },
  {
    id: 'n6-other-interest-other',
    description: 'Other Interest Income',
    type: 'line',
    block: 'reconciliation',
    indent: 1
  },
  {
    id: 'n6-total-taxable',
    description: 'Total Taxable Income',
    type: 'total',
    block: 'reconciliation'
  },
  {
    id: 'n6-tax-at-rate',
    description: 'Tax on Taxable Income @ 30%',
    type: 'line',
    block: 'reconciliation'
  }
];

const isAmountLineType = (type) =>
  type === 'line' || type === 'subtotal' || type === 'total';

/** Note 6 — structured Income Tax + 6.1 reconciliation (descriptions first). */
const loadIncomeTaxNoteTemplate = async (periods) => {
  let mappedLines = NOTE6_INCOME_TAX_FALLBACK.map((line) => ({
    ...line,
    accountCodes: [],
    accounts: []
  }));

  try {
    const resp = await financialNotesAPI.getMappings('note-6');
    if (resp?.success && Array.isArray(resp.lines) && resp.lines.length) {
      mappedLines = resp.lines.map((line, idx) => ({
        id: line.id || `n6-${idx}`,
        description: line.description,
        type: line.type || 'line',
        block: line.block || 'summary',
        indent: Number(line.indent) || 0,
        accountCodes: line.accountCodes || [],
        accounts: line.accounts || []
      }));
    }
  } catch (err) {
    console.warn(
      'Financial note mappings unavailable for note-6; using fallback structure:',
      err?.message || err
    );
  }

  const amountDefs = mappedLines
    .filter((line) => isAmountLineType(line.type) && (line.accountCodes || []).length)
    .map((line) => ({
      id: line.id,
      label: line.description,
      accountCodes: line.accountCodes || [],
      accountNames: (line.accounts || []).map((a) => a.name || a.code || '')
    }));

  let resolvedById = new Map();
  if (amountDefs.length) {
    try {
      const resolved = await resolveCustomNoteRows(amountDefs, periods);
      resolved.forEach((row) => {
        resolvedById.set(row.id, row);
      });
    } catch (err) {
      console.warn(
        'Could not resolve Combined TB amounts for Note 6 mappings:',
        err?.message || err
      );
    }
  }

  const rows = mappedLines.map((line) => {
    const hit = resolvedById.get(line.id) || {};
    const backendAccounts = line.accounts || [];
    const details = hit.accountDetails || [];
    const accounts =
      details.length > 0
        ? details.map((d, i) => ({
            code: d.code || backendAccounts[i]?.code || '',
            name: d.name || backendAccounts[i]?.name || d.code || '',
            currentAmount: d.currentAmount,
            currentSide: d.currentSide,
            priorAmount: d.priorAmount,
            priorSide: d.priorSide
          }))
        : (line.accountCodes || []).map((code, i) => ({
            code,
            name: backendAccounts[i]?.name || code,
            currentAmount: 0,
            currentSide: '',
            priorAmount: 0,
            priorSide: ''
          }));

    return {
      id: line.id,
      label: line.description,
      type: line.type || 'line',
      block: line.block || 'summary',
      indent: Number(line.indent) || 0,
      current: Number(hit.current) || 0,
      prior: Number(hit.prior) || 0,
      accounts
    };
  });

  return {
    template: 'incomeTax',
    rows,
    total: { current: 0, prior: 0 }
  };
};

const filterExpenseRows = (plData, predicate) => {
  const byCategory = plData?.expensesByCategory || {};
  const rows = [];
  Object.entries(byCategory).forEach(([category, accounts]) => {
    if (!predicate(category)) return;
    (accounts || []).forEach((acc) => {
      const balance = Number(acc.balance) || 0;
      if (balance === 0) return;
      const code = String(acc.account_code || acc.accountCode || '').trim();
      const name = String(acc.account_name || acc.accountName || category).trim();
      rows.push({
        label: name,
        amount: absAmount(balance),
        accounts: [
          makeAccountRef(code, name, balance, acc.balance_type || acc.balanceType || 'DR')
        ]
      });
    });
  });
  return rows;
};

const mergeAccountRefs = (existing = [], incoming = []) => {
  const map = new Map();
  [...existing, ...incoming].forEach((a) => {
    const code = String(a?.code || '').trim();
    const name = String(a?.name || '').trim();
    const key = code || name;
    if (!key) return;
    const prev = map.get(key) || {
      code,
      name: name || code,
      currentAmount: undefined,
      currentSide: '',
      priorAmount: undefined,
      priorSide: ''
    };
    const next = {
      ...prev,
      code: prev.code || code,
      name: prev.name || name || code
    };
    if (a.currentAmount != null) {
      next.currentAmount = (Number(prev.currentAmount) || 0) + (Number(a.currentAmount) || 0);
      next.currentSide = a.currentSide || prev.currentSide || '';
    }
    if (a.priorAmount != null) {
      next.priorAmount = (Number(prev.priorAmount) || 0) + (Number(a.priorAmount) || 0);
      next.priorSide = a.priorSide || prev.priorSide || '';
    }
    // Legacy single-period refs (amount/side) — treat as current if no period fields.
    if (
      a.currentAmount == null &&
      a.priorAmount == null &&
      a.amount != null
    ) {
      next.currentAmount = (Number(prev.currentAmount) || 0) + (Number(a.amount) || 0);
      next.currentSide = a.side || prev.currentSide || '';
    }
    map.set(key, next);
  });
  return [...map.values()];
};

const toPeriodAccountRefs = (accounts, periodKey) =>
  (accounts || []).map((a) => {
    const amount = Number(a.amount) || 0;
    const side = a.side || '';
    if (periodKey === 'prior') {
      return {
        code: a.code,
        name: a.name,
        priorAmount: amount,
        priorSide: side
      };
    }
    return {
      code: a.code,
      name: a.name,
      currentAmount: amount,
      currentSide: side
    };
  });

const mergeComparativeRows = (currentRows, priorRows) => {
  const map = new Map();
  const add = (rows, periodKey) => {
    rows.forEach((r) => {
      const k = r.label;
      if (!map.has(k)) {
        map.set(k, { label: k, current: 0, prior: 0, accounts: [] });
      }
      const entry = map.get(k);
      entry[periodKey] += r.amount;
      entry.accounts = mergeAccountRefs(
        entry.accounts,
        toPeriodAccountRefs(r.accounts || [], periodKey)
      );
    });
  };
  add(currentRows, 'current');
  add(priorRows, 'prior');
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const sumComparative = (rows) =>
  rows.reduce(
    (s, r) => ({
      current: s.current + (Number(r.current) || 0),
      prior: s.prior + (Number(r.prior) || 0)
    }),
    { current: 0, prior: 0 }
  );

const collectSofpAccounts = (fpData) => {
  const equityRows = Array.isArray(fpData?.equity)
    ? fpData.equity
    : fpData?.equity?.equity || [];

  const buckets = [
    ...(fpData?.assets?.nonCurrentAssets || []),
    ...(fpData?.assets?.currentAssets || []),
    ...(fpData?.liabilities?.nonCurrentLiabilities || []),
    ...(fpData?.liabilities?.currentLiabilities || []),
    ...equityRows
  ];
  return buckets.map((acc) => ({
    accountCode: acc.accountCode || acc.account_code || '',
    accountName: acc.accountName || acc.account_name || '',
    transactionTypeName: acc.transactionTypeName || acc.transaction_type || '',
    accountCategory: acc.accountCategory || acc.account_category || '',
    balance: absAmount(acc.balance ?? acc.net_balance),
    balanceType: normalizeSide(acc.balanceType || acc.balance_type) ||
      ((Number(acc.balance ?? acc.net_balance) || 0) >= 0 ? 'DR' : 'CR')
  }));
};

const accountSearchText = (acc) =>
  `${acc.transactionTypeName} ${acc.accountCategory} ${acc.accountName} ${acc.accountCode}`;

const filterSofpByPatterns = (accounts, patterns, { excludePatterns = [] } = {}) =>
  accounts.filter((acc) => {
    const text = accountSearchText(acc);
    if (excludePatterns.length && matchesPatterns(text, excludePatterns)) return false;
    return matchesPatterns(text, patterns);
  });

const filterSofpWithFallback = (accounts, patterns, fallbackPatterns, excludePatterns = []) => {
  const primary = filterSofpByPatterns(accounts, patterns, { excludePatterns });
  if (primary.length) return primary;
  return filterSofpByPatterns(accounts, fallbackPatterns, { excludePatterns });
};

/**
 * Locked Note 7 categories from Fixed Assets.
 * Movements come from the asset register (purchase + depreciation schedule),
 * not from SOFP closing-minus-opening diffs.
 */
const toYmd = (value) => String(value || '').trim().slice(0, 10);

const isAssetActiveStatus = (asset) => {
  const status = String(asset?.status || 'ACTIVE')
    .trim()
    .toUpperCase();
  return status !== 'DISPOSED' && status !== 'DELETED' && status !== 'INACTIVE';
};

const assetDisposalDate = (asset) =>
  toYmd(asset?.disposalDate || asset?.disposedAt || asset?.disposal_date);

const assetOwnedAt = (asset, asOfYmd) => {
  if (!asset || !asOfYmd || !isAssetActiveStatus(asset)) return false;
  const purchased = toYmd(asset.purchaseDate);
  if (!purchased || purchased > asOfYmd) return false;
  const disposed = assetDisposalDate(asset);
  if (disposed && disposed <= asOfYmd) return false;
  return true;
};

const rankPpeCategory = (name) => {
  const n = normalizeText(name);
  if (n.includes('computer')) return 0;
  if (n.includes('office') || n.includes('equipment')) return 1;
  return 2;
};

const loadPpeNoteFromRegister = async (periods) => {
  const openingDate = toYmd(periods.current?.startDate || periods.prior?.asOfDate);
  const closingDate = toYmd(periods.current?.asOfDate || periods.current?.endDate);

  const categories = [...(listCategories() || [])].sort((a, b) => {
    const d = rankPpeCategory(a.name) - rankPpeCategory(b.name);
    if (d !== 0) return d;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  const assets = (listAssets() || []).filter(isAssetActiveStatus);

  const sections = categories.map((cat) => {
    const catAssets = assets.filter((a) => a.categoryId === cat.id);
    const atOpen = catAssets.filter((a) => assetOwnedAt(a, openingDate));
    const atClose = catAssets.filter((a) => assetOwnedAt(a, closingDate));

    const costOpening = atOpen.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
    const costClosing = atClose.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

    const additions = catAssets
      .filter((a) => {
        const purchased = toYmd(a.purchaseDate);
        return purchased && purchased > openingDate && purchased <= closingDate;
      })
      .reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

    const disposedInPeriod = catAssets.filter((a) => {
      const disposed = assetDisposalDate(a);
      if (!disposed || disposed <= openingDate || disposed > closingDate) return false;
      const purchased = toYmd(a.purchaseDate);
      return !purchased || purchased <= closingDate;
    });

    const disposalsCost = disposedInPeriod.reduce(
      (sum, a) => sum + (Number(a.cost) || 0),
      0
    );

    const depOpening = atOpen.reduce(
      (sum, a) =>
        sum + (Number(computeAssetSnapshot(a, cat, openingDate).accumulated) || 0),
      0
    );
    const depClosing = atClose.reduce(
      (sum, a) =>
        sum + (Number(computeAssetSnapshot(a, cat, closingDate).accumulated) || 0),
      0
    );

    let charge = 0;
    let disposalsDep = 0;
    catAssets.forEach((asset) => {
      const purchased = toYmd(asset.purchaseDate);
      const disposed = assetDisposalDate(asset);
      if (purchased && purchased > closingDate) return;
      if (disposed && disposed <= openingDate) return;

      const ownedAtOpen =
        purchased &&
        purchased <= openingDate &&
        (!disposed || disposed > openingDate);
      const openAccum = ownedAtOpen
        ? Number(computeAssetSnapshot(asset, cat, openingDate).accumulated) || 0
        : 0;

      if (disposed && disposed > openingDate && disposed <= closingDate) {
        const atDisposal =
          Number(computeAssetSnapshot(asset, cat, disposed).accumulated) || 0;
        charge += Math.max(atDisposal - openAccum, 0);
        disposalsDep += atDisposal;
        return;
      }

      const closeAccum =
        Number(computeAssetSnapshot(asset, cat, closingDate).accumulated) || 0;
      charge += Math.max(closeAccum - openAccum, 0);
    });

    const accounts = [];
    const costCode = String(cat.assetGlAccountCode || '').trim();
    const depCode = String(cat.accumulatedDepGlAccountCode || '').trim();
    if (costCode) {
      accounts.push({
        code: costCode,
        name: `${cat.name} — Cost`,
        currentAmount: absAmount(costClosing),
        currentSide: 'DR',
        priorAmount: absAmount(costOpening),
        priorSide: 'DR'
      });
    }
    if (depCode) {
      accounts.push({
        code: depCode,
        name: `${cat.name} — Accumulated depreciation`,
        currentAmount: absAmount(depClosing),
        currentSide: 'CR',
        priorAmount: absAmount(depOpening),
        priorSide: 'CR'
      });
    }
    if (!accounts.length) {
      accounts.push({
        code: '',
        name: cat.name,
        currentAmount: absAmount(costClosing - depClosing),
        currentSide: 'DR',
        priorAmount: absAmount(costOpening - depOpening),
        priorSide: 'DR'
      });
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      accountCode: costCode,
      usefulLifeYears:
        Number(cat.usefulLifeYears) > 0 ? Number(cat.usefulLifeYears) : null,
      accounts,
      cost: {
        opening: costOpening,
        additions,
        disposals: disposalsCost,
        closing: costClosing
      },
      depreciation: {
        opening: depOpening,
        charge,
        disposals: disposalsDep,
        closing: depClosing
      },
      nbv: {
        current: costClosing - depClosing,
        prior: costOpening - depOpening
      }
    };
  });

  const totalAdditions = sections.reduce(
    (sum, r) => sum + (Number(r.cost?.additions) || 0),
    0
  );

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(Number(n) || 0));

  const footnote75 =
    totalAdditions <= 0.005
      ? '7.5 During the financial year the Company has not acquired Property, Plant & Equipment.'
      : `7.5 During the financial year the Company acquired Property, Plant & Equipment amounting to Rs.${formatMoney(totalAdditions)}/-.`;

  return {
    template: 'ppe',
    sections,
    footnote75,
    totals: {
      cost: sections.reduce(
        (sum, r) => ({
          opening: sum.opening + r.cost.opening,
          additions: sum.additions + r.cost.additions,
          disposals: sum.disposals + r.cost.disposals,
          closing: sum.closing + r.cost.closing
        }),
        { opening: 0, additions: 0, disposals: 0, closing: 0 }
      ),
      depreciation: sections.reduce(
        (sum, r) => ({
          opening: sum.opening + r.depreciation.opening,
          charge: sum.charge + r.depreciation.charge,
          disposals: sum.disposals + r.depreciation.disposals,
          closing: sum.closing + r.depreciation.closing
        }),
        { opening: 0, charge: 0, disposals: 0, closing: 0 }
      ),
      nbv: sections.reduce(
        (sum, r) => ({
          current: sum.current + r.nbv.current,
          prior: sum.prior + r.nbv.prior
        }),
        { current: 0, prior: 0 }
      )
    }
  };
};

const loadPlComparative = async (noteConfig, periods, portfolioId) => {
  const [curResp, priResp] = await Promise.all([
    profitLossAPI.getProfitLoss({
      startDate: periods.current.startDate,
      endDate: periods.current.endDate,
      portfolio: portfolioId || undefined
    }),
    profitLossAPI.getProfitLoss({
      startDate: periods.prior.startDate,
      endDate: periods.prior.endDate,
      portfolio: portfolioId || undefined
    })
  ]);

  if (!curResp?.success || !priResp?.success) {
    throw new Error(curResp?.error || priResp?.error || 'Failed to load P&L for note');
  }

  const cur = curResp.data;
  const pri = priResp.data;
  let currentRows = [];
  let priorRows = [];

  switch (noteConfig.plSource) {
    default:
      break;
  }

  const rows = mergeComparativeRows(currentRows, priorRows);
  return {
    template: 'comparative',
    rows,
    total: sumComparative(rows)
  };
};

const loadSofpComparative = async (noteConfig, periods, portfolioId) => {
  const currentAsOf = periods.current.asOfDate || periods.current.endDate;
  const priorAsOf = periods.prior.asOfDate || periods.prior.endDate;

  const [curResp, priResp] = await Promise.all([
    financialPositionAPI.getFinancialPosition({
      asOfDate: currentAsOf,
      portfolio: portfolioId || undefined
    }),
    financialPositionAPI.getFinancialPosition({
      asOfDate: priorAsOf,
      portfolio: portfolioId || undefined
    })
  ]);

  if (!curResp?.success || !priResp?.success) {
    throw new Error(curResp?.error || priResp?.error || 'Failed to load SOFP for note');
  }

  const allCur = collectSofpAccounts(curResp.data);
  const allPri = collectSofpAccounts(priResp.data);

  const pickAccounts = (accounts) => {
    if (noteConfig.sofpFallbackPatterns?.length) {
      return filterSofpWithFallback(
        accounts,
        noteConfig.sofpPatterns,
        noteConfig.sofpFallbackPatterns,
        noteConfig.sofpExcludePatterns || []
      );
    }
    return filterSofpByPatterns(accounts, noteConfig.sofpPatterns, {
      excludePatterns: noteConfig.sofpExcludePatterns || []
    });
  };

  const curAccounts = pickAccounts(allCur);
  const priAccounts = pickAccounts(allPri);

  const labelFor = (acc) =>
    (acc.transactionTypeName || acc.accountName || acc.accountCode || '-').trim();

  const currentRows = curAccounts
    .filter((a) => a.balance > 0)
    .map((a) => {
      const label = labelFor(a);
      const name = String(a.accountName || a.transactionTypeName || label).trim();
      const code = String(a.accountCode || '').trim();
      return {
        label,
        amount: a.balance,
        accounts: [makeAccountRef(code, name, a.balance, a.balanceType || 'DR')]
      };
    });
  const priorRows = priAccounts
    .filter((a) => a.balance > 0)
    .map((a) => {
      const label = labelFor(a);
      const name = String(a.accountName || a.transactionTypeName || label).trim();
      const code = String(a.accountCode || '').trim();
      return {
        label,
        amount: a.balance,
        accounts: [makeAccountRef(code, name, a.balance, a.balanceType || 'DR')]
      };
    });
  const rows = mergeComparativeRows(currentRows, priorRows);

  return {
    template: noteConfig.template === 'cash' ? 'cash' : 'comparative',
    rows,
    total: sumComparative(rows)
  };
};

const loadStatedCapital = async (periods, portfolioId) => {
  const noteConfig = {
    sofpPatterns: ['stated capital', 'share capital', 'ordinary share', 'issued capital']
  };
  const data = await loadSofpComparative(noteConfig, periods, portfolioId);
  return { ...data, template: 'statedCapital' };
};

const holdingKey = (row) => {
  const name = String(row.companyName || row.counter || '')
    .trim()
    .toLowerCase();
  const symbol = String(row.counter || '')
    .trim()
    .toLowerCase();
  return name || symbol || '';
};

const fetchPortfolioHoldingsAtDate = async (portfolioId, asOfDate) => {
  const resp = await financialPositionAPI.getPortfolioExportTable({
    portfolioId: String(portfolioId),
    asOfDate
  });
  if (!resp?.success) {
    throw new Error(resp?.error || 'Failed to load portfolio holdings');
  }
  return Array.isArray(resp?.data?.rows) ? resp.data.rows : [];
};

const resolvePortfolioIds = async (portfolioId) => {
  if (portfolioId) return [String(portfolioId)];
  const list = await portfolioAPI.getActivePortfolios();
  const safe = Array.isArray(list) ? list : [];
  return safe
    .map((p) => String(p.portfolioId || p.id || '').trim())
    .filter(Boolean);
};

/**
 * Note 11 — Investments in Equity Securities (Quoted)
 * Cost and market value by counter for as-at and comparative dates.
 */
const loadFvtplEquityNote = async (periods, portfolioId) => {
  const currentAsOf = periods.current.asOfDate || periods.current.endDate;
  const priorAsOf = periods.prior.asOfDate || periods.prior.endDate;

  const portfolioIds = await resolvePortfolioIds(portfolioId);
  if (!portfolioIds.length) {
    return {
      template: 'fvtplEquity',
      equityRows: [],
      equityTotals: {
        currentCost: 0,
        currentMv: 0,
        priorCost: 0,
        priorMv: 0
      }
    };
  }

  const mapAtDate = async (asOf) => {
    const byKey = new Map();
    await Promise.all(
      portfolioIds.map(async (id) => {
        const rows = await fetchPortfolioHoldingsAtDate(id, asOf);
        rows.forEach((row) => {
          const key = holdingKey(row);
          if (!key) return;
          const cost = Number(row.totalCost) || 0;
          const mv = Number(row.totalMarketValue) || 0;
          const shares = Number(row.numberOfShares) || 0;
          if (Math.abs(cost) < 0.005 && Math.abs(mv) < 0.005 && shares <= 0) return;
          const prev = byKey.get(key) || {
            label: row.companyName || row.counter || key,
            cost: 0,
            marketValue: 0
          };
          byKey.set(key, {
            label: prev.label,
            cost: prev.cost + cost,
            marketValue: prev.marketValue + mv
          });
        });
      })
    );
    return byKey;
  };

  const [currentMap, priorMap] = await Promise.all([
    mapAtDate(currentAsOf),
    mapAtDate(priorAsOf)
  ]);

  const keys = new Set([...currentMap.keys(), ...priorMap.keys()]);
  const equityRows = [...keys]
    .map((key) => {
      const cur = currentMap.get(key);
      const pri = priorMap.get(key);
      const label = cur?.label || pri?.label || key;
      return {
        label,
        currentCost: Number(cur?.cost) || 0,
        currentMv: Number(cur?.marketValue) || 0,
        priorCost: Number(pri?.cost) || 0,
        priorMv: Number(pri?.marketValue) || 0,
        accounts: [
          {
            code: '',
            name: label,
            currentAmount: Number(cur?.marketValue) || 0,
            currentSide: 'DR',
            priorAmount: Number(pri?.marketValue) || 0,
            priorSide: 'DR',
            currentCost: Number(cur?.cost) || 0,
            priorCost: Number(pri?.cost) || 0
          }
        ]
      };
    })
    .filter(
      (r) =>
        Math.abs(r.currentCost) >= 0.005 ||
        Math.abs(r.currentMv) >= 0.005 ||
        Math.abs(r.priorCost) >= 0.005 ||
        Math.abs(r.priorMv) >= 0.005
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  const equityTotals = equityRows.reduce(
    (s, r) => ({
      currentCost: s.currentCost + r.currentCost,
      currentMv: s.currentMv + r.currentMv,
      priorCost: s.priorCost + r.priorCost,
      priorMv: s.priorMv + r.priorMv
    }),
    { currentCost: 0, currentMv: 0, priorCost: 0, priorMv: 0 }
  );

  return {
    template: 'fvtplEquity',
    equityRows,
    equityTotals
  };
};

const NOTE_LOADERS = {
  'note-3': (p) => loadRevenueNoteTemplate(p),
  'note-4': (p) => loadOtherIncomeNoteTemplate(p),
  'note-5': (p) => loadFinanceCostNoteTemplate(p),
  'note-6': (p) => loadIncomeTaxNoteTemplate(p),
  'note-7': (p) => loadPpeNoteFromRegister(p),
  'note-8': (p, id) =>
    loadSofpComparative(
      { sofpPatterns: ['deferred tax'], template: 'comparative' },
      p,
      id
    ),
  'note-9': (p, id) =>
    loadSofpComparative(
      { sofpPatterns: ['right of use', 'right-of-use', 'rou asset'], template: 'comparative' },
      p,
      id
    ),
  'note-10': (p, id) =>
    loadSofpComparative(
      {
        sofpPatterns: ['receivable', 'prepayment', 'deposit', 'withholding tax receivable'],
        template: 'comparative'
      },
      p,
      id
    ),
  'note-11': (p, id) => loadFvtplEquityNote(p, id),
  'note-12': (p, id) =>
    loadSofpComparative(
      {
        sofpPatterns: ['cash and cash', 'cash at bank', 'bank balance', 'bank overdraft', 'overdraft'],
        template: 'cash'
      },
      p,
      id
    ),
  'note-13': (p, id) => loadStatedCapital(p, id),
  'note-14': (p, id) =>
    loadSofpComparative(
      { sofpPatterns: ['employee benefit', 'gratuity', 'defined benefit', 'pension'], template: 'comparative' },
      p,
      id
    ),
  'note-15': (p, id) =>
    loadSofpComparative(
      { sofpPatterns: ['lease liabilit', 'lease creditor'], template: 'comparative' },
      p,
      id
    ),
  'note-16': (p, id) =>
    loadSofpComparative(
      {
        sofpPatterns: [
          'trade payable',
          'other payable',
          'other payables',
          'creditor',
          'accounts payable',
          'accrued',
          'incentive',
          'brokerage',
          'audit fee',
          'sundry creditor'
        ],
        sofpFallbackPatterns: ['payable', 'accrued', 'creditor'],
        sofpExcludePatterns: ['borrow', 'loan', 'lease', 'reverse repo', 'repurchase', 'tax payable'],
        template: 'comparative'
      },
      p,
      id
    ),
  'note-17': (p, id) =>
    loadSofpComparative(
      {
        sofpPatterns: ['borrowing', 'loan', 'reverse repo', 'repurchase', 'sell buy', 'sell-buy'],
        template: 'comparative'
      },
      p,
      id
    ),
  'note-18': (p, id) =>
    loadSofpComparative(
      { sofpPatterns: ['related party', 'key management', 'director'], template: 'comparative' },
      p,
      id
    )
};

export const loadFinancialNoteData = async ({ noteId, asOfDate, portfolioId }) => {
  const note = getNoteById(noteId);
  if (!note) {
    throw new Error('Unknown note');
  }

  const periods =
    noteId === 'note-7' ? buildPpeNotePeriods(asOfDate) : buildNotePeriods(asOfDate);
  const loader = NOTE_LOADERS[noteId];

  if (!loader) {
    return {
      note,
      periods,
      template: 'unsupported',
      rows: [],
      total: { current: 0, prior: 0 }
    };
  }

  const payload = await loader(periods, portfolioId);
  return { note, periods, ...payload };
};
