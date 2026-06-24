import { financialPositionAPI, profitLossAPI } from '../services/api';
import {
  listAssets,
  listCategories,
  computeAssetSnapshot
} from '../components/FixedAssets/fixedAssetStore';
import { buildNotePeriods } from './financialNotePeriods';
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
        label: (acc.account_name || acc.accountName || acc.account_code || '—').trim(),
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

const buildPpeNote = (periods) => {
  const categories = listCategories();
  const assets = listAssets().filter((a) => a.status !== 'DISPOSED');
  const asOfCurrent = periods.current.asOfDate || periods.current.endDate;
  const asOfPrior = periods.prior.asOfDate || periods.prior.endDate;

  const byCategory = categories.map((cat) => {
    const catAssets = assets.filter((a) => a.categoryId === cat.id);
    let costCurrent = 0;
    let costPrior = 0;
    let depCurrent = 0;
    let depPrior = 0;
    let additions = 0;

    catAssets.forEach((asset) => {
      const snapCur = computeAssetSnapshot(asset, cat, asOfCurrent);
      const snapPrior = computeAssetSnapshot(asset, cat, asOfPrior);
      costCurrent += snapCur.cost;
      costPrior += snapPrior.cost;
      depCurrent += snapCur.accumulated;
      depPrior += snapPrior.accumulated;
      const purchase = asset.purchaseDate || '';
      if (purchase >= periods.current.startDate && purchase <= periods.current.endDate) {
        additions += Number(asset.cost) || 0;
      }
    });

    return {
      categoryName: cat.name,
      usefulLifeYears: cat.usefulLifeYears,
      cost: {
        opening: costPrior,
        additions,
        disposals: 0,
        closing: costCurrent
      },
      depreciation: {
        opening: depPrior,
        charge: Math.max(depCurrent - depPrior, 0),
        disposals: 0,
        closing: depCurrent
      },
      nbv: { current: costCurrent - depCurrent, prior: costPrior - depPrior }
    };
  });

  return { template: 'ppe', sections: byCategory.filter((c) => c.cost.closing > 0 || c.cost.opening > 0) };
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
    (acc.transactionTypeName || acc.accountName || acc.accountCode || '—').trim();

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
  'note-7': (p) => Promise.resolve(buildPpeNote(p)),
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

  const periods = buildNotePeriods(asOfDate);
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
