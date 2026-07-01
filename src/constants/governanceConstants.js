export const PERMISSION_LABELS = {
  'governance.user.request': 'Create user requests',
  'governance.user.approve': 'Approve / reject requests',
  'business_approval.view': 'View business approval requests',
  'trade.view': 'View trades (all trade areas)',
  'trade.buy.create': 'Create buy transactions',
  'trade.sell.create': 'Create sell transactions',
  'trade.buy.make': 'Maker: buy transactions',
  'trade.buy.check': 'Checker: buy transactions',
  'trade.sell.make': 'Maker: sell transactions',
  'trade.sell.check': 'Checker: sell transactions',
  'gsec.entries.make': 'Maker: GSec entries (all screens)',
  'gsec.entries.check': 'Checker: GSec entries (all screens)',
  'accounting.view': 'View accounting (all GL areas)',
  'accounting.journal.create': 'Post journal entries',
  'accounting.journal.make': 'Maker: journal entries',
  'accounting.journal.check': 'Checker: journal entries',
  'accounting.non_trading.make': 'Maker: non-trading transactions',
  'accounting.non_trading.check': 'Checker: non-trading transactions',
  'reports.view': 'View reports (all reporting areas)',
  'master_data.view': 'View master data',
  'master_data.manage': 'Manage master data',
  'master_data.make': 'Maker: master data changes',
  'master_data.check': 'Checker: master data changes',
  'feature.dashboard.view': 'Dashboard',
  'feature.view_portfolio.view': 'View Portfolio',
  'feature.master_data_mgmt.view': 'Master Data Management',
  'feature.holiday_calendar.view': 'Holiday Calendar',
  'feature.funds_centers.view': 'Funds Centers',
  'feature.equity_entries.view': 'Equity Entries',
  'feature.gsec_entries.view': 'GSec Entries',
  'feature.accounting_entries.view': 'Accounting Entries',
  'feature.fixed_assets.view': 'Fixed Assets',
  'feature.financial_reporting.view': 'Financial Reporting',
  'feature.financial_reports_export.view': 'Financial Reports Export',
  'feature.settlement_accounting.view': 'Settlement and Accounting',
  'feature.account_management.view': 'Account Management',
  'feature.opening_balance.view': 'Opening Balance Management',
  'feature.trade_capture.view': 'Trade Capture',
  'feature.batch_import.view': 'Batch Transaction Import',
  'feature.valuation_mtm.view': 'Valuation and MTM',
  'feature.charts_insights.view': 'Charts and Insights',
  'feature.pvm.view': 'Predictive Valuation Model (PVM)',
  'feature.cse_announcements.view': 'CSE Announcements',
  'feature.tradecore.view': 'TradeCore',
  'feature.corporate_actions.view': 'Corporate Actions',
  'feature.security_identity.view': 'Security Identity',
  'feature.voluntary_corporate_actions.view': 'Voluntary Corporate Actions',
  'feature.mandatory_corporate_actions.view': 'Mandatory Corporate Actions',
  'feature.ipo.view': 'IPO',
  'feature.portfolio_monitoring.view': 'Portfolio Monitoring',
  'feature.risk_limit_management.view': 'Risk and Limit Management',
  'feature.reporting_compliance.view': 'Reporting and Compliance',
  'feature.integration_automation.view': 'Integration and Automation',
  'feature.portfolio_transfers.view': 'Portfolio Transfers',
};

export const MODULE_TITLES = {
  governance: 'User management',
  business_approval: 'Business approvals',
  trade: 'Trading (module-wide)',
  gsec: 'GSec',
  accounting: 'Accounting (module-wide)',
  reports: 'Reporting (module-wide)',
  master_data: 'Master data',
  features: 'Sidebar & features',
};

export const MODULE_ORDER = ['governance', 'business_approval', 'features', 'trade', 'gsec', 'accounting', 'reports', 'master_data'];

export const REQUEST_STATUS_LABELS = {
  pending_second_admin_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const OPERATIONAL_VIEW_KEYS = [
  'trade.view',
  'accounting.view',
  'reports.view',
  'master_data.view',
];

const MASTER_DATA_KEYS = ['master_data.view', 'master_data.manage'];
const TRADE_KEYS = ['trade.view'];
const ACCOUNTING_KEYS = ['accounting.view'];
const REPORTS_KEYS = ['reports.view'];
const GSEC_KEYS = [
  'feature.gsec_entries.view',
  'gsec.entries.make',
  'gsec.entries.check',
  'accounting.view',
];
/** Maker + checker keys used to show the Business Approvals sidebar section. */
export const BUSINESS_APPROVAL_SECTION_KEYS = [
  'business_approval.view',
  'trade.buy.make',
  'trade.buy.check',
  'trade.sell.make',
  'trade.sell.check',
  'gsec.entries.make',
  'gsec.entries.check',
  'accounting.journal.make',
  'accounting.journal.check',
  'accounting.non_trading.make',
  'accounting.non_trading.check',
  'master_data.make',
  'master_data.check',
];

/** Sidebar section → feature permission key */
export const SECTION_FEATURE_KEYS = {
  Dashboard: 'feature.dashboard.view',
  'View Portfolio': 'feature.view_portfolio.view',
  'Master Data Management': 'feature.master_data_mgmt.view',
  'Holiday Calendar': 'feature.holiday_calendar.view',
  'Funds Centers': 'feature.funds_centers.view',
  'Equity Entries': 'feature.equity_entries.view',
  'GSec Entries': 'feature.gsec_entries.view',
  'Accounting Entries': 'feature.accounting_entries.view',
  'Fixed Assets': 'feature.fixed_assets.view',
  'Financial Reporting': 'feature.financial_reporting.view',
  'Financial Reports Export': 'feature.financial_reports_export.view',
  'Settlement and Accounting': 'feature.settlement_accounting.view',
  'Account Management': 'feature.account_management.view',
  'Opening Balance Management': 'feature.opening_balance.view',
  'Trade Capture': 'feature.trade_capture.view',
  'Batch Transaction Import': 'feature.batch_import.view',
  'Valuation and MTM': 'feature.valuation_mtm.view',
  'Charts and Insights': 'feature.charts_insights.view',
  'Predictive Valuation Model (PVM)': 'feature.pvm.view',
  'CSE Announcements': 'feature.cse_announcements.view',
  TradeCore: 'feature.tradecore.view',
  'Corporate Actions': 'feature.corporate_actions.view',
  'Security Identity': 'feature.security_identity.view',
  'Voluntary Corporate Actions': 'feature.voluntary_corporate_actions.view',
  'Mandatory Corporate Actions': 'feature.mandatory_corporate_actions.view',
  IPO: 'feature.ipo.view',
  'Portfolio Monitoring': 'feature.portfolio_monitoring.view',
  'Risk and Limit Management': 'feature.risk_limit_management.view',
  'Reporting and Compliance': 'feature.reporting_compliance.view',
  'Integration and Automation': 'feature.integration_automation.view',
  'Portfolio Transfers': 'feature.portfolio_transfers.view',
};

function sectionAccessKeys(sectionName, fallbackKeys = []) {
  const featureKey = SECTION_FEATURE_KEYS[sectionName];
  if (featureKey) {
    return [featureKey, ...(fallbackKeys || [])];
  }
  return fallbackKeys;
}

/** null = visible to all restricted users (legacy public areas) */
const MENU_SECTION_PERMISSIONS = {
  Dashboard: sectionAccessKeys('Dashboard', OPERATIONAL_VIEW_KEYS),
  'Company Governance': 'governance',
  'Business Approvals': 'business_approvals',
  'View Portfolio': sectionAccessKeys('View Portfolio', TRADE_KEYS),
  'Master Data Management': sectionAccessKeys('Master Data Management', MASTER_DATA_KEYS),
  'Holiday Calendar': sectionAccessKeys('Holiday Calendar', MASTER_DATA_KEYS),
  'Funds Centers': sectionAccessKeys('Funds Centers'),
  'Equity Entries': sectionAccessKeys('Equity Entries', ACCOUNTING_KEYS),
  'GSec Entries': sectionAccessKeys('GSec Entries', GSEC_KEYS),
  'Accounting Entries': sectionAccessKeys('Accounting Entries', ACCOUNTING_KEYS),
  'Fixed Assets': sectionAccessKeys('Fixed Assets', ACCOUNTING_KEYS),
  'Financial Reporting': sectionAccessKeys('Financial Reporting', REPORTS_KEYS),
  'Financial Reports Export': sectionAccessKeys('Financial Reports Export', REPORTS_KEYS),
  'Settlement and Accounting': sectionAccessKeys('Settlement and Accounting', [...MASTER_DATA_KEYS, ...ACCOUNTING_KEYS]),
  'Account Management': sectionAccessKeys('Account Management', ACCOUNTING_KEYS),
  'Opening Balance Management': sectionAccessKeys('Opening Balance Management', ACCOUNTING_KEYS),
  'Trade Capture': sectionAccessKeys('Trade Capture', TRADE_KEYS),
  'Batch Transaction Import': sectionAccessKeys('Batch Transaction Import', TRADE_KEYS),
  'Valuation and MTM': sectionAccessKeys('Valuation and MTM', TRADE_KEYS),
  'Charts and Insights': sectionAccessKeys('Charts and Insights'),
  'Predictive Valuation Model (PVM)': sectionAccessKeys('Predictive Valuation Model (PVM)'),
  'CSE Announcements': sectionAccessKeys('CSE Announcements'),
  TradeCore: sectionAccessKeys('TradeCore', TRADE_KEYS),
  'Corporate Actions': sectionAccessKeys('Corporate Actions', TRADE_KEYS),
  'Security Identity': sectionAccessKeys('Security Identity', TRADE_KEYS),
  'Voluntary Corporate Actions': sectionAccessKeys('Voluntary Corporate Actions', TRADE_KEYS),
  'Mandatory Corporate Actions': sectionAccessKeys('Mandatory Corporate Actions', TRADE_KEYS),
  IPO: sectionAccessKeys('IPO', TRADE_KEYS),
  'Portfolio Monitoring': sectionAccessKeys('Portfolio Monitoring', TRADE_KEYS),
  'Risk and Limit Management': sectionAccessKeys('Risk and Limit Management', TRADE_KEYS),
  'Reporting and Compliance': sectionAccessKeys('Reporting and Compliance', [...REPORTS_KEYS, ...TRADE_KEYS]),
  'Integration and Automation': sectionAccessKeys('Integration and Automation', TRADE_KEYS),
  'Portfolio Transfers': sectionAccessKeys('Portfolio Transfers', TRADE_KEYS),
};

const TAB_PERMISSIONS = {
  Dashboard: OPERATIONAL_VIEW_KEYS,
  'Portfolio Overview': TRADE_KEYS,
  'Market Summary': null,
  'Recent Activity': OPERATIONAL_VIEW_KEYS,
  'Performance Metrics': [...TRADE_KEYS, ...REPORTS_KEYS],
  'User Requests': 'governance',

  'Business Approvals': 'business_approvals',

  'Admin Approvals': 'company_owner_only',
  'Activity Log': 'company_owner_only',

  'View Portfolio': TRADE_KEYS,
  'View Transactions': TRADE_KEYS,
  'Sector Allocation & Performance': TRADE_KEYS,

  'Equity Master': MASTER_DATA_KEYS,
  'Account Master': MASTER_DATA_KEYS,
  'Valuation Method': MASTER_DATA_KEYS,
  'Portfolio Master': MASTER_DATA_KEYS,
  'Strategy Master': MASTER_DATA_KEYS,

  'Holiday Calendar': MASTER_DATA_KEYS,
  'Holiday List': MASTER_DATA_KEYS,
  'Add Holiday': MASTER_DATA_KEYS,
  'Holiday Settings': MASTER_DATA_KEYS,

  'Funds Centers': null,
  'View Map': null,
  'Global Markets': null,

  'Journal Entries': ACCOUNTING_KEYS,
  'General Ledger': ACCOUNTING_KEYS,
  'Trial Balance': ACCOUNTING_KEYS,
  'P&L': ACCOUNTING_KEYS,
  'Portfolio MTM': ACCOUNTING_KEYS,

  'GSEC ENTRIES': GSEC_KEYS,
  'Missing GSec Entries': GSEC_KEYS,
  'Gsec Trial Balance': GSEC_KEYS,
  'GSec General Ledger': GSEC_KEYS,
  'GSec Manual Entry Posting': GSEC_KEYS,
  'GSec Bulk Entry Grid': GSEC_KEYS,

  'Combined General Ledger': ACCOUNTING_KEYS,
  'Combined Trial Balance': ACCOUNTING_KEYS,
  'Account Summaries': ACCOUNTING_KEYS,
  'Double Entries': ACCOUNTING_KEYS,

  'Asset Register': ACCOUNTING_KEYS,
  'Add Asset': ACCOUNTING_KEYS,
  'Asset Categories': ACCOUNTING_KEYS,

  'Statement of Financial Position': REPORTS_KEYS,
  'Financial Reporting Notes': REPORTS_KEYS,
  'Statement of Comprehensive Income': REPORTS_KEYS,
  'Cash Flow': REPORTS_KEYS,

  'Equity Portfolio Snapshot': REPORTS_KEYS,
  'Financial Reports Export': REPORTS_KEYS,
  'Performance Report': REPORTS_KEYS,
  'Other Reports': REPORTS_KEYS,

  'Settlement Instructions': MASTER_DATA_KEYS,
  'Cash Flow Mapping': MASTER_DATA_KEYS,
  'GL Mapping': MASTER_DATA_KEYS,
  'Deal Slip': TRADE_KEYS,

  'Chart Of Accounts': ACCOUNTING_KEYS,
  'New GL Account': ACCOUNTING_KEYS,
  'Account Reconciliation': ACCOUNTING_KEYS,
  'Other Transactions': ACCOUNTING_KEYS,

  'Opening Balance Entry': ACCOUNTING_KEYS,
  'Opening Balance List': ACCOUNTING_KEYS,
  'Account Balance Setup': ACCOUNTING_KEYS,

  Buy: ['trade.buy.create'],
  Sell: ['trade.sell.create'],
  Transactions: TRADE_KEYS,
  Portfolio: TRADE_KEYS,
  'Avg Cost Calculator': TRADE_KEYS,
  'Cost of Funds': MASTER_DATA_KEYS,
  'Equity GL Mapping': MASTER_DATA_KEYS,

  'Bulk Buy Entry': ['trade.buy.create'],
  'Bulk Sell Entry': ['trade.sell.create'],
  'Import History': TRADE_KEYS,
  'Trade Confirmation': TRADE_KEYS,
  'Trade Report': TRADE_KEYS,

  'Market Price Feed': TRADE_KEYS,
  'Mark-to-Market Valuation': TRADE_KEYS,
  'Realized Gain/Loss Tracking': TRADE_KEYS,
  'Trade Summary Data': TRADE_KEYS,

  'CSE ASPI': null,
  'CSE Sector Indices': null,

  'Risk Management Chart': null,
  'Share Price Prediction': null,
  'Prediction Indicators': null,
  'Block Analysis Dashboard': null,
  'ML Stock Predictor': null,

  'Market Announcements': null,
  'Corporate Notices': null,
  'Trading Updates': null,
  'Regulatory Updates': null,
  'Financial Reports': null,
  'News & Events': null,

  TradeCore: TRADE_KEYS,

  Dividend: TRADE_KEYS,
  'Stock Split': TRADE_KEYS,
  'Reverse Stock Split': TRADE_KEYS,
  Dividends: TRADE_KEYS,
  'Pending Dividends': TRADE_KEYS,
  'Splits & Bonus': TRADE_KEYS,
  'Rights Issue': TRADE_KEYS,
  'Rights Issues': TRADE_KEYS,

  'IPO Entry': TRADE_KEYS,
  'IPO Allocation': TRADE_KEYS,
  'Refund Processing': TRADE_KEYS,
  'Allocation Summary': TRADE_KEYS,

  'Holdings Dashboard': TRADE_KEYS,
  'Sector/Exposure Analysis': TRADE_KEYS,
};

export function permissionsForAdminCreation(catalog = []) {
  return catalog.filter((p) => p.permission_key !== 'governance.admin.manage');
}

/** End users: module + sidebar features; no governance admin keys */
export function permissionsForUserCreation(catalog = []) {
  return catalog.filter((p) => !p.permission_key.startsWith('governance.'));
}

export function groupPermissionsByModule(catalog = []) {
  const byModule = {};
  for (const p of catalog) {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push(p);
  }
  return MODULE_ORDER.filter((m) => byModule[m]?.length).map((m) => ({
    module: m,
    title: MODULE_TITLES[m] || m,
    items: byModule[m],
  }));
}

export function hasPermission(user, key) {
  if (user?.company_role === 'company_owner') return true;
  return (user?.permissions || []).includes(key);
}

export function hasAnyPermission(user, keys) {
  return keys.some((key) => hasPermission(user, key));
}

export function isPermissionRestrictedUser(user) {
  return (
    user?.account_kind === 'company_member' &&
    (user?.company_role === 'admin' || user?.company_role === 'user')
  );
}

export function canAccessGovernance(user) {
  if (!user) return false;
  if (user.company_role === 'company_owner') return true;
  return (
    hasPermission(user, 'governance.user.request') ||
    hasPermission(user, 'governance.user.approve')
  );
}

export function canAccessBusinessApprovals(user) {
  if (!user) return false;
  if (user.company_role === 'company_owner') return true;
  return hasAnyPermission(user, BUSINESS_APPROVAL_SECTION_KEYS);
}

function resolveRule(rule, user) {
  if (rule === 'governance') return canAccessGovernance(user);
  if (rule === 'business_approvals') return canAccessBusinessApprovals(user);
  if (rule === 'company_owner_only') return user?.company_role === 'company_owner';
  if (rule === null) return true;
  if (!rule) return false;
  return hasAnyPermission(user, rule);
}

export function canAccessGovernanceSection(user) {
  if (!user) return false;
  if (user.company_role === 'company_owner') return true;
  return canAccessGovernance(user);
}

export function canAccessMenuSection(user, sectionName) {
  if (!isPermissionRestrictedUser(user)) return true;
  if (sectionName === 'Company Governance') return canAccessGovernanceSection(user);
  const rule = MENU_SECTION_PERMISSIONS[sectionName];
  if (rule === undefined) return false;
  return resolveRule(rule, user);
}

export function canAccessTab(user, tabName, menuItems = null) {
  if (!isPermissionRestrictedUser(user)) return true;

  const explicitRule = TAB_PERMISSIONS[tabName];
  if (explicitRule === 'company_owner_only') {
    return user?.company_role === 'company_owner';
  }
  if (explicitRule === 'governance') {
    return canAccessGovernance(user);
  }
  if (explicitRule === 'business_approvals') {
    return canAccessBusinessApprovals(user);
  }
  if (Array.isArray(explicitRule)) {
    return hasAnyPermission(user, explicitRule);
  }
  if (explicitRule === null) {
    return true;
  }

  if (menuItems?.length) {
    const parent = menuItems.find((item) => item.subTopics?.includes(tabName));
    if (parent && canAccessMenuSection(user, parent.name)) {
      return true;
    }
  }

  if (explicitRule === undefined) return false;
  return resolveRule(explicitRule, user);
}

export function filterEquityMenuItems(user, menuItems) {
  if (!isPermissionRestrictedUser(user)) {
    return menuItems;
  }

  return menuItems
    .filter((item) => canAccessMenuSection(user, item.name))
    .map((item) => ({
      ...item,
      subTopics: item.subTopics
        ? item.subTopics.filter((tab) => canAccessTab(user, tab, menuItems))
        : item.subTopics,
    }))
    .filter((item) => !item.subTopics || item.subTopics.length > 0);
}

export function getInitialEquityNavigation(user, menuItems) {
  const filtered = filterEquityMenuItems(user, menuItems);
  const first = filtered[0];
  if (!first) {
    return { sectionIndex: 0, tab: '', visibleTabs: [] };
  }

  const originalIndex = menuItems.findIndex((item) => item.name === first.name);
  const visibleTabs = first.subTopics || [];
  const tab = visibleTabs[0] || '';

  return {
    sectionIndex: originalIndex >= 0 ? originalIndex : 0,
    tab,
    visibleTabs,
  };
}

export function equityTabsForUser(user, menuItems = []) {
  const dashboardItem = filterEquityMenuItems(user, menuItems).find(
    (item) => item.name === 'Dashboard'
  );
  if (dashboardItem?.subTopics?.length) {
    return [...dashboardItem.subTopics];
  }

  const tabs = ['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']
    .filter((tab) => canAccessTab(user, tab, menuItems));

  if (canAccessGovernance(user)) {
    tabs.push('User Requests');
  }

  return tabs;
}
