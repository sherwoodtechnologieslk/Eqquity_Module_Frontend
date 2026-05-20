export const OTHER_REPORT_TYPES = {
  borrowings: { defaultLabel: 'Borrowings' },
  tbonds: { defaultLabel: 'T bonds' },
  equity: { defaultLabel: 'Equity' },
  shareHoldings: { defaultLabel: 'Share Holdings' },
  groupDashboard: { defaultLabel: 'Group Dashboard' },
  dashboardReport: { defaultLabel: 'Dashboard Report' },
  equitySummary: { defaultLabel: 'Equity Summary' }
};

export const STORAGE_KEY = 'equity-module-other-reports-customize-tabs';

const newTabId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createDefaultTabs = () =>
  Object.entries(OTHER_REPORT_TYPES).map(([reportType, meta]) => ({
    tabId: newTabId(),
    reportType,
    label: meta.defaultLabel
  }));

export const loadSavedTabs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .filter((t) => t && OTHER_REPORT_TYPES[t.reportType])
      .map((t) => ({
        tabId: t.tabId || newTabId(),
        reportType: t.reportType,
        label: String(t.label || OTHER_REPORT_TYPES[t.reportType].defaultLabel)
      }));
  } catch {
    return null;
  }
};

export const saveTabs = (tabs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    /* ignore quota errors */
  }
};

export const labelForNewTab = (reportType, existingTabs) => {
  const base = OTHER_REPORT_TYPES[reportType]?.defaultLabel || 'Report';
  const count = existingTabs.filter((t) => t.reportType === reportType).length;
  return count === 0 ? base : `${base} (${count + 1})`;
};

export { newTabId };
