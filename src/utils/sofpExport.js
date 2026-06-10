/**
 * Shared SOFP export rows — must match Statement of Financial Position screen
 * (FinancialPosition.js) so PDF/Excel from Download Center match screen exports.
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

/** Same logic as FinancialPosition — defensive re-bucket for non-current-like current assets. */
export const isNonCurrentAssetLike = (account) => {
  const text = `${account?.accountCategory || ''} ${account?.transactionTypeName || ''} ${account?.accountName || ''}`
    .toLowerCase()
    .trim();
  return (
    text.includes('non current') ||
    text.includes('non-current') ||
    text.includes('fixed asset') ||
    text.includes('property, plant') ||
    text.includes('ppe')
  );
};

/** Mirrors displayedAssetBuckets useMemo in FinancialPosition.js */
export const computeDisplayedAssetBuckets = (financialPositionData) => {
  const nonCurrentFromApi = financialPositionData?.assets?.nonCurrentAssets || [];
  const currentFromApi = financialPositionData?.assets?.currentAssets || [];

  const reclassifiedFromCurrent = currentFromApi.filter(isNonCurrentAssetLike);
  const keptCurrent = currentFromApi.filter((acc) => !isNonCurrentAssetLike(acc));

  const combinedNonCurrent = [...nonCurrentFromApi, ...reclassifiedFromCurrent];
  const sumBalance = (rows) => rows.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  return {
    nonCurrentAssets: combinedNonCurrent,
    currentAssets: keptCurrent,
    totalNonCurrentAssets: sumBalance(combinedNonCurrent),
    totalCurrentAssets: sumBalance(keptCurrent)
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
        balance: np,
        balanceType: derivedBalanceTypeFromBalance(np),
        accountCode: ''
      }
    ];
  }

  return equityAccounts;
};

/**
 * Collapses SOFP accounts into one entry per transaction type, preserving first-seen
 * order. Accounts with no transaction type stay individual (keyed by account code/name).
 * Balances are summed (signed, mirroring the backend); consumers derive DR/CR from sign.
 * Shared by the SOFP screen and the PDF/Excel exports so both stay in sync.
 * @returns {Array<{ key: string, label: string, transactionTypeName: string,
 *   accountCategory: string, balance: number, accounts: object[] }>}
 */
export const groupByTransactionType = (accounts) => {
  const groups = [];
  const indexByKey = new Map();

  (accounts || []).forEach((account, i) => {
    const ttName = String(account?.transactionTypeName || '').trim();
    const fallbackLabel = String(account?.accountName || account?.accountCategory || '').trim();
    const hasType = ttName.length > 0;
    const key = hasType
      ? `tt:${ttName.toLowerCase()}`
      : `acc:${account?.accountCode || fallbackLabel || i}`;

    let group = indexByKey.get(key);
    if (!group) {
      group = {
        key,
        label: hasType ? ttName : fallbackLabel || 'Account',
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
  const sum = (list) => (list || []).reduce((acc, a) => acc + (Number(a?.balance) || 0), 0);

  const pushGroup = (section, list, normal, subtotalLabel) => {
    groupByTransactionType(list).forEach((g) => {
      const drcr = deriveBalanceTypeFromBalance(g.balance, normal);
      rows.push([
        section,
        g.label,
        formatCurrency(Math.abs(Number(g.balance) || 0)),
        drcr === 'ZERO' ? normal : drcr
      ]);
    });
    if (subtotalLabel && (list || []).length > 0) {
      rows.push([section, subtotalLabel, formatCurrency(Math.abs(sum(list))), normal]);
    }
  };

  const { nonCurrentAssets, currentAssets } = computeDisplayedAssetBuckets(financialPositionData);
  const nonCurrentLiabilities = financialPositionData?.liabilities?.nonCurrentLiabilities || [];
  const currentLiabilities = financialPositionData?.liabilities?.currentLiabilities || [];
  const equity = computeEquityDisplayRows(financialPositionData, netProfit);

  pushGroup('Assets · Non-current', nonCurrentAssets, 'DR', 'Total Non-current assets');
  pushGroup('Assets · Current', currentAssets, 'DR', 'Total Current assets');
  rows.push(['', 'Total Assets', formatCurrency(Math.abs(sum(nonCurrentAssets) + sum(currentAssets))), 'DR']);

  pushGroup('Equity', equity, 'CR', 'Total Equity');
  pushGroup('Liabilities · Non-current', nonCurrentLiabilities, 'CR', 'Total Non-current liabilities');
  pushGroup('Liabilities · Current', currentLiabilities, 'CR', 'Total Current liabilities');
  rows.push([
    '',
    'Total Equity & Liabilities',
    formatCurrency(Math.abs(sum(equity) + sum(nonCurrentLiabilities) + sum(currentLiabilities))),
    'CR'
  ]);

  return rows;
};
