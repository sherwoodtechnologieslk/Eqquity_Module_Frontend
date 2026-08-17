/**
 * Shared SOFP export / display helpers.
 * Asset current vs non-current and transaction-type grouping are owned by the backend.
 * Frontend helpers mirror backend grouping only as a fallback when `data.groups` is absent.
 */

export const SOFP_EXPORT_HEADERS = ['Section', 'Transaction type', 'Amount', 'DR/CR'];

/** Backend may return net_profit as number or numeric string */
export const parseNetProfit = (raw) => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Same requests as FinancialPosition.js fetch (FP + YTD P&L for Current P&L line).
 * Pass portfolio as undefined for all portfolios (matches SOFP screen empty filter).
 */
export const loadSofpDataForExport = async ({ getFinancialPosition, getProfitLoss, asOfDate, portfolio }) => {
  const asOfDateObj = new Date(asOfDate);
  const startOfYear = Number.isNaN(asOfDateObj.getTime())
    ? null
    : new Date(asOfDateObj.getFullYear(), 0, 1).toISOString().split('T')[0];

  const [fpResp, plResp] = await Promise.all([
    getFinancialPosition({ asOfDate, portfolio }),
    getProfitLoss({
      startDate: startOfYear || undefined,
      endDate: asOfDate,
      portfolio: portfolio || undefined
    }).catch(() => null)
  ]);

  if (!fpResp?.success) {
    throw new Error(fpResp?.error || 'Failed to load Statement of Financial Position');
  }

  const netProfit = plResp?.success ? parseNetProfit(plResp.data?.totals?.net_profit) : undefined;

  return { financialPositionData: fpResp.data, netProfit };
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

/**
 * Opening-balance SOFP: current vs non-current from chart_of_accounts.account_category only.
 */
export const isNonCurrentAssetLike = (account) => {
  const c = String(account?.accountCategory || account?.account_category || '')
    .toLowerCase()
    .trim();
  if (!c) return false;
  return (
    c.includes('non-current') ||
    c.includes('non current') ||
    c.includes('noncurrent') ||
    c.includes('fixed asset') ||
    c.includes('intangible')
  );
};

/** Trust backend buckets; no client-side reclassification. */
export const computeDisplayedAssetBuckets = (financialPositionData) => {
  const nonCurrentAssets = financialPositionData?.assets?.nonCurrentAssets || [];
  const currentAssets = financialPositionData?.assets?.currentAssets || [];
  const sumBalance = (rows) => rows.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  return {
    nonCurrentAssets,
    currentAssets,
    totalNonCurrentAssets:
      financialPositionData?.totals?.totalNonCurrentAssets ?? sumBalance(nonCurrentAssets),
    totalCurrentAssets:
      financialPositionData?.totals?.totalCurrentAssets ?? sumBalance(currentAssets)
  };
};

/** Mirrors equityDisplayRows useMemo in FinancialPosition.js */
export const computeEquityDisplayRows = (financialPositionData, netProfit) => {
  const equityAccounts = financialPositionData?.equity || [];
  const currentPlLabel = 'Current P&L';

  const derivedBalanceTypeFromBalance = (balance) => {
    if (Math.abs(balance) < 0.00001) return 'ZERO';
    return balance >= 0 ? 'CR' : 'DR';
  };

  const np = parseNetProfit(netProfit);
  if (np != null) {
    return [
      ...equityAccounts,
      {
        accountName: currentPlLabel,
        transactionTypeName: currentPlLabel,
        balance: np,
        balanceType: derivedBalanceTypeFromBalance(np),
        accountCode: ''
      }
    ];
  }

  return equityAccounts;
};

/**
 * Mirrors backend groupAccountsByTransactionType.
 * Groups by transaction type only — never promote account name to a type row.
 * @returns {Array<{ key: string, label: string, transactionTypeName: string,
 *   accountCategory: string, balance: number, accounts: object[] }>}
 */
export const groupByTransactionType = (accounts) => {
  const groups = [];
  const indexByKey = new Map();

  (accounts || []).forEach((account) => {
    const ttName = String(account?.transactionTypeName || '').trim() || 'Unassigned';
    const key = `g:${ttName.toLowerCase()}`;

    let group = indexByKey.get(key);
    if (!group) {
      group = {
        key,
        label: ttName,
        transactionTypeName: ttName,
        accountCategory: account?.accountCategory || '',
        balance: 0,
        accounts: []
      };
      indexByKey.set(key, group);
      groups.push(group);
    }
    group.balance += Number(account?.balance) || 0;
    group.accounts.push(account);
  });

  return groups;
};

/**
 * Prefer backend `data.groups[sectionKey]`; fall back to local grouping of flat accounts.
 * For equity, inject Current P&L into the flat list before grouping when groups are absent;
 * when backend groups exist, append Current P&L as its own group.
 */
export const resolveSofpGroups = (financialPositionData, sectionKey, flatAccounts, netProfit) => {
  const backendGroups = financialPositionData?.groups?.[sectionKey];

  if (sectionKey === 'equity') {
    const equityRows = computeEquityDisplayRows(financialPositionData, netProfit);
    if (Array.isArray(backendGroups)) {
      const np = parseNetProfit(netProfit);
      if (np == null) return backendGroups;
      const plGroup = groupByTransactionType([
        {
          accountName: 'Current P&L',
          transactionTypeName: 'Current P&L',
          balance: np,
          accountCode: ''
        }
      ])[0];
      return plGroup ? [...backendGroups, plGroup] : backendGroups;
    }
    return groupByTransactionType(equityRows);
  }

  if (Array.isArray(backendGroups)) return backendGroups;
  return groupByTransactionType(flatAccounts);
};

/** Normal-balance-aware DR/CR for a signed (summed) balance. */
export const deriveBalanceTypeFromBalance = (balance, normalBalanceType) => {
  const b = Number(balance) || 0;
  if (Math.abs(b) < 0.005) return 'ZERO';
  if (b > 0) return normalBalanceType;
  return normalBalanceType === 'DR' ? 'CR' : 'DR';
};

/**
 * @param {{ financialPositionData: object, netProfit?: number | null }} params
 * @returns {string[][]} rows for PDF body / CSV
 */
export const buildSofpExportRows = ({ financialPositionData, netProfit }) => {
  const rows = [];
  const sumAccounts = (list) => (list || []).reduce((acc, a) => acc + (Number(a?.balance) || 0), 0);
  const sumGroups = (list) => (list || []).reduce((acc, g) => acc + (Number(g?.balance) || 0), 0);

  const pushGroup = (section, groups, normal, subtotalLabel) => {
    (groups || []).forEach((g) => {
      const drcr =
        g.balanceType ||
        deriveBalanceTypeFromBalance(g.balance, normal);
      rows.push([
        section,
        g.label,
        formatCurrency(Math.abs(Number(g.balance) || 0)),
        drcr === 'ZERO' ? normal : drcr
      ]);
    });
    if (subtotalLabel && (groups || []).length > 0) {
      rows.push([
        section,
        subtotalLabel,
        formatCurrency(Math.abs(sumGroups(groups))),
        normal
      ]);
    }
  };

  const { nonCurrentAssets, currentAssets } = computeDisplayedAssetBuckets(financialPositionData);
  const nonCurrentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentAssets',
    nonCurrentAssets,
    netProfit
  );
  const currentAssetGroups = resolveSofpGroups(
    financialPositionData,
    'currentAssets',
    currentAssets,
    netProfit
  );
  const equityGroups = resolveSofpGroups(
    financialPositionData,
    'equity',
    financialPositionData?.equity,
    netProfit
  );
  const nonCurrentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'nonCurrentLiabilities',
    financialPositionData?.liabilities?.nonCurrentLiabilities,
    netProfit
  );
  const currentLiabilityGroups = resolveSofpGroups(
    financialPositionData,
    'currentLiabilities',
    financialPositionData?.liabilities?.currentLiabilities,
    netProfit
  );

  const totalAssets =
    financialPositionData?.totals?.totalAssets ??
    sumAccounts(nonCurrentAssets) + sumAccounts(currentAssets);

  pushGroup('Assets · Non-current', nonCurrentAssetGroups, 'DR', 'Total Non-current assets');
  pushGroup('Assets · Current', currentAssetGroups, 'DR', 'Total Current assets');
  rows.push(['', 'Total Assets', formatCurrency(Math.abs(totalAssets)), 'DR']);

  pushGroup('Equity', equityGroups, 'CR', 'Total Equity');
  pushGroup(
    'Liabilities · Non-current',
    nonCurrentLiabilityGroups,
    'CR',
    'Total Non-current liabilities'
  );
  pushGroup(
    'Liabilities · Current',
    currentLiabilityGroups,
    'CR',
    'Total Current liabilities'
  );
  rows.push([
    '',
    'Total Equity & Liabilities',
    formatCurrency(
      Math.abs(
        sumGroups(equityGroups) +
          sumGroups(nonCurrentLiabilityGroups) +
          sumGroups(currentLiabilityGroups)
      )
    ),
    'CR'
  ]);

  return rows;
};
