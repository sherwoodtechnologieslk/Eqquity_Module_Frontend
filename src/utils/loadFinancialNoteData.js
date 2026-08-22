import { financialPositionAPI, profitLossAPI } from '../services/api';
import { listCategories } from '../components/FixedAssets/fixedAssetStore';
import { buildNotePeriods, buildPpeNotePeriods } from './financialNotePeriods';
import { getNoteById } from './financialNotesRegistry';

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const matchesPatterns = (text, patterns = []) =>
  patterns.some((p) => text.includes(normalizeText(p)));

const absAmount = (n) => Math.abs(Number(n) || 0);

/** Flatten P&L category map into rows with label + balance. */
const flattenPlAccounts = (byCategory) => {
  if (!byCategory || typeof byCategory !== 'object') return [];
  const rows = [];
  Object.values(byCategory).forEach((accounts) => {
    (accounts || []).forEach((acc) => {
      const balance = Number(acc.balance) || 0;
      if (balance === 0) return;
      rows.push({
        label: (acc.account_name || acc.accountName || acc.account_code || '-').trim(),
        amount: absAmount(balance)
      });
    });
  });
  return rows;
};

const filterExpenseRows = (plData, predicate) => {
  const byCategory = plData?.expensesByCategory || {};
  const rows = [];
  Object.entries(byCategory).forEach(([category, accounts]) => {
    if (!predicate(category)) return;
    (accounts || []).forEach((acc) => {
      const balance = Number(acc.balance) || 0;
      if (balance === 0) return;
      rows.push({
        label: (acc.account_name || acc.accountName || category).trim(),
        amount: absAmount(balance)
      });
    });
  });
  return rows;
};

const mergeComparativeRows = (currentRows, priorRows) => {
  const map = new Map();
  const add = (rows, key) => {
    rows.forEach((r) => {
      const k = r.label;
      if (!map.has(k)) map.set(k, { label: k, current: 0, prior: 0 });
      map.get(k)[key] += r.amount;
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
    balance: absAmount(acc.balance ?? acc.net_balance)
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

const collectAllSofpAccounts = (fpData) => {
  const equityRows = Array.isArray(fpData?.equity)
    ? fpData.equity
    : fpData?.equity?.equity || [];

  return [
    ...(fpData?.assets?.nonCurrentAssets || []),
    ...(fpData?.assets?.currentAssets || []),
    ...(fpData?.liabilities?.nonCurrentLiabilities || []),
    ...(fpData?.liabilities?.currentLiabilities || []),
    ...equityRows
  ].map((acc) => ({
    accountCode: String(acc.accountCode || acc.account_code || '').trim(),
    accountName: String(acc.accountName || acc.account_name || '').trim(),
    transactionTypeName: String(acc.transactionTypeName || acc.transaction_type || '').trim(),
    accountCategory: String(acc.accountCategory || acc.account_category || '').trim(),
    balance: Number(acc.balance ?? acc.net_balance) || 0,
    balanceType: String(acc.balanceType || '').trim()
  }));
};

/** Same depreciation ↔ asset pairing used by SOFP presentation. */
const PPE_DEPRECIATION_PAIRS = [
  {
    provision: 'provision for depreciation - office equipments',
    asset: 'fixed assets - office equipment',
    label: 'Fixed assets - office equipment',
    match: (name) => name.includes('office')
  },
  {
    provision: 'provision for depreciation - computer equipments',
    asset: 'fixed assets - computer equipment',
    label: 'Fixed assets - computer equipment',
    match: (name) => name.includes('computer')
  }
];

const isDepreciationProvisionAccount = (name) =>
  /provision for depreciation/.test(normalizeText(name));

const isPpeCostAccount = (acc) => {
  const name = normalizeText(acc.accountName);
  const tt = normalizeText(acc.transactionTypeName);
  if (isDepreciationProvisionAccount(name)) return false;
  if (/property plant|plant equipment|ppe/.test(tt)) return true;
  return (
    /fixed assets|office equipment|computer equipment|plant and equipment|property plant/.test(
      name
    ) && !/investment in share/.test(name)
  );
};

const resolvePpeBucketKey = (accountName) => {
  const name = normalizeText(accountName);
  const pair = PPE_DEPRECIATION_PAIRS.find((p) => p.match(name));
  if (pair) return normalizeText(pair.asset);
  return null;
};

const findUsefulLifeYears = (accountName) => {
  const name = normalizeText(accountName);
  const categories = listCategories();
  const hit = categories.find((cat) => {
    const catName = normalizeText(cat.name);
    if (name.includes('computer') && catName.includes('computer')) return true;
    if (name.includes('office') && catName.includes('equipment')) return true;
    if (name.includes(catName) || catName.includes(name)) return true;
    return false;
  });
  return hit?.usefulLifeYears || null;
};

const indexPpeFromSofp = (fpData) => {
  const accounts = collectAllSofpAccounts(fpData);
  const costByKey = new Map();
  const depByKey = new Map();

  accounts.forEach((acc) => {
    const name = normalizeText(acc.accountName);
    if (!name) return;

    if (isDepreciationProvisionAccount(name)) {
      const key = resolvePpeBucketKey(acc.accountName) || `dep:${name}`;
      const pair = PPE_DEPRECIATION_PAIRS.find((p) => normalizeText(p.asset) === key);
      const prev = depByKey.get(key) || {
        accountCode: '',
        accountName: pair?.label || acc.accountName,
        balance: 0
      };
      depByKey.set(key, {
        accountCode: prev.accountCode || acc.accountCode,
        accountName: prev.accountName,
        balance: prev.balance + absAmount(acc.balance)
      });
      return;
    }

    if (isPpeCostAccount(acc)) {
      const key =
        resolvePpeBucketKey(acc.accountName) || `asset:${name}:${acc.accountCode}`;
      const pair = PPE_DEPRECIATION_PAIRS.find((p) => normalizeText(p.asset) === key);
      const label = pair?.label || acc.accountName;
      const prev = costByKey.get(key) || {
        accountCode: '',
        accountName: label,
        balance: 0
      };
      costByKey.set(key, {
        accountCode: prev.accountCode || acc.accountCode,
        accountName: label,
        balance: prev.balance + absAmount(acc.balance)
      });
    }
  });

  // Prefer cost account names/codes when we only found dep for a known pair
  PPE_DEPRECIATION_PAIRS.forEach((pair) => {
    const key = normalizeText(pair.asset);
    if (depByKey.has(key) && !costByKey.has(key)) {
      // keep dep; section builder still emits a row
    }
    if (costByKey.has(key) && depByKey.has(key)) {
      const cost = costByKey.get(key);
      const dep = depByKey.get(key);
      depByKey.set(key, { ...dep, accountName: cost.accountName, accountCode: cost.accountCode || dep.accountCode });
    }
  });

  return { costByKey, depByKey };
};

/**
 * Build Note 7 from SOFP GL lines (same source as the statement),
 * using withNotes so cost and depreciation provisions are separate.
 */
const loadPpeNoteFromSofp = async (periods, portfolioId) => {
  const asOfCurrent = periods.current.asOfDate || periods.current.endDate;
  // "Balance as at 01 April" — include entries / OB dated on FY start
  const asOfOpening = periods.current.startDate || periods.prior.asOfDate;
  const portfolio = portfolioId || undefined;

  const [curResp, openResp] = await Promise.all([
    financialPositionAPI.getFinancialPosition({
      asOfDate: asOfCurrent,
      portfolio,
      withNotes: true
    }),
    financialPositionAPI.getFinancialPosition({
      asOfDate: asOfOpening,
      portfolio,
      withNotes: true
    })
  ]);

  if (!curResp?.success) {
    throw new Error(curResp?.error || 'Failed to load SOFP for PPE note');
  }
  if (!openResp?.success) {
    throw new Error(openResp?.error || 'Failed to load opening SOFP for PPE note');
  }

  const closing = indexPpeFromSofp(curResp.data);
  const opening = indexPpeFromSofp(openResp.data);

  const keys = new Set([
    ...closing.costByKey.keys(),
    ...opening.costByKey.keys(),
    ...closing.depByKey.keys(),
    ...opening.depByKey.keys()
  ]);

  const sections = [];
  let totalAdditions = 0;

  [...keys]
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      const closeCost = closing.costByKey.get(key);
      const openCost = opening.costByKey.get(key);
      const closeDep = closing.depByKey.get(key);
      const openDep = opening.depByKey.get(key);

      const costOpening = Number(openCost?.balance) || 0;
      const costClosing = Number(closeCost?.balance) || 0;
      const depOpening = Number(openDep?.balance) || 0;
      const depClosing = Number(closeDep?.balance) || 0;

      if (
        costOpening < 0.005 &&
        costClosing < 0.005 &&
        depOpening < 0.005 &&
        depClosing < 0.005
      ) {
        return;
      }

      const costDelta = costClosing - costOpening;
      const additions = costDelta > 0.005 ? costDelta : 0;
      const disposalsCost = costDelta < -0.005 ? Math.abs(costDelta) : 0;
      const depDelta = depClosing - depOpening;
      const charge = depDelta > 0.005 ? depDelta : 0;
      const disposalsDep = depDelta < -0.005 ? Math.abs(depDelta) : 0;

      totalAdditions += additions;

      const accountName =
        closeCost?.accountName ||
        openCost?.accountName ||
        closeDep?.accountName ||
        openDep?.accountName ||
        'Property, plant and equipment';
      const accountCode = closeCost?.accountCode || openCost?.accountCode || '';

      sections.push({
        categoryName: accountName,
        accountCode,
        usefulLifeYears: findUsefulLifeYears(accountName),
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
      });
    });

  // Prefer SOFP statement order: computer then office, then others
  sections.sort((a, b) => {
    const an = normalizeText(a.categoryName);
    const bn = normalizeText(b.categoryName);
    const rank = (n) => {
      if (n.includes('computer')) return 0;
      if (n.includes('office')) return 1;
      return 2;
    };
    const d = rank(an) - rank(bn);
    if (d !== 0) return d;
    return an.localeCompare(bn);
  });

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(Number(n) || 0));

  let footnote75;
  if (totalAdditions <= 0.005) {
    footnote75 =
      '7.5 During the financial year the Company has not acquired Property, Plant & Equipment.';
  } else {
    footnote75 = `7.5 During the financial year the Company acquired Property, Plant & Equipment amounting to Rs.${formatMoney(totalAdditions)}/-.`;
  }

  return {
    template: 'ppe',
    sections,
    footnote75,
    totals: {
      cost: sections.reduce(
        (s, r) => ({
          opening: s.opening + r.cost.opening,
          additions: s.additions + r.cost.additions,
          disposals: s.disposals + r.cost.disposals,
          closing: s.closing + r.cost.closing
        }),
        { opening: 0, additions: 0, disposals: 0, closing: 0 }
      ),
      depreciation: sections.reduce(
        (s, r) => ({
          opening: s.opening + r.depreciation.opening,
          charge: s.charge + r.depreciation.charge,
          disposals: s.disposals + r.depreciation.disposals,
          closing: s.closing + r.depreciation.closing
        }),
        { opening: 0, charge: 0, disposals: 0, closing: 0 }
      ),
      nbv: sections.reduce(
        (s, r) => ({
          current: s.current + r.nbv.current,
          prior: s.prior + r.nbv.prior
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
    case 'revenue':
      currentRows = flattenPlAccounts(cur.revenueByCategory);
      priorRows = flattenPlAccounts(pri.revenueByCategory);
      break;
    case 'otherIncome':
      currentRows = flattenPlAccounts(cur.otherIncomeByCategory);
      priorRows = flattenPlAccounts(pri.otherIncomeByCategory);
      break;
    case 'financeCost':
      currentRows = filterExpenseRows(cur, (c) => normalizeText(c).includes('finance'));
      priorRows = filterExpenseRows(pri, (c) => normalizeText(c).includes('finance'));
      break;
    case 'incomeTax':
      currentRows = filterExpenseRows(
        cur,
        (c) => normalizeText(c).includes('tax') || normalizeText(c).includes('income tax')
      );
      priorRows = filterExpenseRows(
        pri,
        (c) => normalizeText(c).includes('tax') || normalizeText(c).includes('income tax')
      );
      break;
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
    .map((a) => ({ label: labelFor(a), amount: a.balance }));
  const priorRows = priAccounts
    .filter((a) => a.balance > 0)
    .map((a) => ({ label: labelFor(a), amount: a.balance }));
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

const NOTE_LOADERS = {
  'note-3': (p, id) => loadPlComparative({ plSource: 'revenue' }, p, id),
  'note-4': (p, id) => loadPlComparative({ plSource: 'otherIncome' }, p, id),
  'note-5': (p, id) => loadPlComparative({ plSource: 'financeCost' }, p, id),
  'note-6': (p, id) => loadPlComparative({ plSource: 'incomeTax' }, p, id),
  'note-7': (p, id) => loadPpeNoteFromSofp(p, id),
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
  'note-11': (p, id) =>
    loadSofpComparative(
      {
        sofpPatterns: [
          'fair value through profit',
          'fvtpl',
          'government securit',
          'treasury',
          'equity securit',
          'investment in shares',
          'quoted'
        ],
        template: 'comparative'
      },
      p,
      id
    ),
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
