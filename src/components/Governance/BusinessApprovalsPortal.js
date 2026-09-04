import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import {
  canAccessBusinessApprovals,
  hasAnyPermission,
  hasPermission,
} from '../../constants/governanceConstants';
import { GSEC_SOURCE_LABELS } from '../../utils/gsecMakerChecker';
import { NON_TRADING_SOURCE_LABELS } from '../../utils/nonTradingMakerChecker';
import BusinessApprovalPayloadPreview from './BusinessApprovalPayloadPreview';
import BusinessApprovalsExportModal from './BusinessApprovalsExportModal';
import GovernanceActionModal from './GovernanceActionModal';
import {
  exportBusinessApprovalsToExcel,
  fetchAllBusinessApprovalRequests,
  filterBusinessApprovalRequests,
} from '../../utils/businessApprovalsExport';
import './AdminGovernancePortal.css';
import './GovernanceScreen.css';

const EMPTY_EXPORT_FILTERS = {
  moduleId: '',
  entryFrom: '',
  entryTo: '',
  createdFrom: '',
  createdTo: '',
};

const EMPTY_DATE_FILTERS = {
  entryFrom: '',
  entryTo: '',
  createdFrom: '',
  createdTo: '',
};

const LIST_PAGE_SIZE = 15;

const BUSINESS_APPROVAL_MODULES = [
  {
    id: 'trade',
    label: 'Trade',
    emptyHint: 'Buy and sell transaction approvals will appear here.',
    permissions: ['trade.buy.make', 'trade.buy.check', 'trade.sell.make', 'trade.sell.check'],
  },
  {
    id: 'gsec',
    label: 'GSec',
    emptyHint: 'GSec ledger entry approvals will appear here.',
    permissions: ['gsec.entries.make', 'gsec.entries.check'],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    emptyHint: 'Journal entry and non-trading transaction approvals will appear here.',
    permissions: [
      'accounting.journal.make',
      'accounting.journal.check',
      'accounting.non_trading.make',
      'accounting.non_trading.check',
    ],
  },
  {
    id: 'master_data',
    label: 'Master data',
    emptyHint: 'Master data change approvals will appear here.',
    permissions: ['master_data.make', 'master_data.check'],
  },
];

const EMPTY_MODULE_SUMMARY = BUSINESS_APPROVAL_MODULES.reduce((acc, mod) => {
  acc[mod.id] = { total: 0, pending_count: 0, approved_count: 0, rejected_count: 0 };
  return acc;
}, {});

const STATUS_TABS = [
  { id: 'pending', label: 'Pending Approval', emptyHint: 'No requests waiting for checker approval.' },
  { id: 'approved', label: 'Approved', emptyHint: 'No approved requests in this category yet.' },
  { id: 'rejected', label: 'Rejected', emptyHint: 'No rejected requests in this category yet.' },
];

function getVisibleBusinessApprovalModules(user) {
  if (!user) return [];
  if (user.company_role === 'company_owner') return BUSINESS_APPROVAL_MODULES;
  if (hasPermission(user, 'business_approval.view')) return BUSINESS_APPROVAL_MODULES;
  return BUSINESS_APPROVAL_MODULES.filter((mod) => hasAnyPermission(user, mod.permissions));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function getRequestSourceLabel(req) {
  return (
    req.source_label ||
    GSEC_SOURCE_LABELS[req.payload?.source] ||
    NON_TRADING_SOURCE_LABELS[req.payload?.source] ||
    req.payload?.source ||
    null
  );
}

/** App/sidebar screen the maker used to submit the request. */
function getRequestScreenName(req) {
  const source = req.source || req.payload?.source;
  if (source && GSEC_SOURCE_LABELS[source]) {
    if (source === 'gsec_ledger_entries') return 'GSEC ENTRIES';
    return GSEC_SOURCE_LABELS[source];
  }
  if (source && NON_TRADING_SOURCE_LABELS[source]) {
    return 'Other Transactions';
  }
  const label = req.source_label || null;
  if (label && Object.values(NON_TRADING_SOURCE_LABELS).includes(label)) {
    return 'Other Transactions';
  }
  if (label && Object.values(GSEC_SOURCE_LABELS).includes(label)) {
    if (label === GSEC_SOURCE_LABELS.gsec_ledger_entries) return 'GSEC ENTRIES';
    return label;
  }
  return getRequestSourceLabel(req);
}

function getRequestStatusLabel(status) {
  if (status === 'pending') return 'Pending approval';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'expired') return 'Expired';
  return status || '—';
}

const LIST_VIEW_KEY = 'businessApprovalsListView';

const BusinessApprovalsPortal = ({ user, company }) => {
  const visibleModules = useMemo(() => getVisibleBusinessApprovalModules(user), [user]);
  const [activeModule, setActiveModule] = useState('trade');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [businessRequests, setBusinessRequests] = useState([]);
  const [moduleSummary, setModuleSummary] = useState(EMPTY_MODULE_SUMMARY);
  const [listPage, setListPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessActionId, setBusinessActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [businessActionModal, setBusinessActionModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState(EMPTY_EXPORT_FILTERS);
  const [dateFilters, setDateFilters] = useState(EMPTY_DATE_FILTERS);
  const [appliedDateFilters, setAppliedDateFilters] = useState(EMPTY_DATE_FILTERS);
  const [listView, setListView] = useState(() => {
    try {
      const saved = localStorage.getItem(LIST_VIEW_KEY);
      return saved === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });
  const [expandedTableIds, setExpandedTableIds] = useState(() => new Set());

  const isOwner = user?.company_role === 'company_owner';
  const canView = canAccessBusinessApprovals(user);
  const activeModuleMeta = visibleModules.find((mod) => mod.id === activeModule) || visibleModules[0];
  const activeStatusMeta = STATUS_TABS.find((tab) => tab.id === activeStatus) || STATUS_TABS[0];
  const activeModuleCounts =
    moduleSummary[activeModuleMeta?.id] || {
      total: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
    };

  const hasDateFilters = Boolean(
    appliedDateFilters.entryFrom ||
      appliedDateFilters.entryTo ||
      appliedDateFilters.createdFrom ||
      appliedDateFilters.createdTo
  );

  const dateFilterParams = useMemo(() => {
    const params = {};
    if (appliedDateFilters.createdFrom) params.createdFrom = appliedDateFilters.createdFrom;
    if (appliedDateFilters.createdTo) params.createdTo = appliedDateFilters.createdTo;
    if (appliedDateFilters.entryFrom) params.entryFrom = appliedDateFilters.entryFrom;
    if (appliedDateFilters.entryTo) params.entryTo = appliedDateFilters.entryTo;
    return params;
  }, [appliedDateFilters]);

  useEffect(() => {
    if (!visibleModules.length) return;
    if (!visibleModules.some((mod) => mod.id === activeModule)) {
      setActiveModule(visibleModules[0].id);
      setListPage(1);
    }
  }, [visibleModules, activeModule]);

  const fetchPage = useCallback(
    async (page, module, status, dates = {}) => {
      if (!canView || !module || !status) {
        setBusinessRequests([]);
        setTotalCount(0);
        setPendingCount(0);
        setTotalPages(0);
        setModuleSummary(EMPTY_MODULE_SUMMARY);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const businessReqRes = await governanceService.listBusinessApprovalRequests({
          page,
          limit: LIST_PAGE_SIZE,
          module,
          status,
          ...dates,
        });
        const data = businessReqRes.data;
        const requests = data.requests || [];
        const nextTotal = data.total ?? 0;
        const nextTotalPages = data.total_pages ?? 0;
        const nextPage = data.page ?? page;
        const nextSummary = { ...EMPTY_MODULE_SUMMARY, ...(data.module_summary || {}) };

        if (requests.length === 0 && nextTotal > 0 && nextPage > 1) {
          setListPage(nextPage - 1);
          return;
        }

        setBusinessRequests(requests);
        setTotalCount(nextTotal);
        setPendingCount(nextSummary[module]?.pending_count ?? data.pending_count ?? 0);
        setTotalPages(nextTotalPages);
        setModuleSummary(nextSummary);
        if (nextPage !== page) {
          setListPage(nextPage);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load business approval requests');
      } finally {
        setLoading(false);
      }
    },
    [canView]
  );

  useEffect(() => {
    if (activeModuleMeta?.id && activeStatusMeta?.id) {
      fetchPage(listPage, activeModuleMeta.id, activeStatusMeta.id, dateFilterParams);
    }
  }, [listPage, activeModuleMeta?.id, activeStatusMeta?.id, dateFilterParams, fetchPage]);

  const listStart = totalCount === 0 ? 0 : (listPage - 1) * LIST_PAGE_SIZE + 1;
  const listEnd = Math.min(listPage * LIST_PAGE_SIZE, totalCount);

  const handleModuleChange = (moduleId) => {
    if (moduleId === activeModule) return;
    setActiveModule(moduleId);
    setListPage(1);
    setExpandedTableIds(new Set());
  };

  const handleStatusChange = (statusId) => {
    if (statusId === activeStatus) return;
    setActiveStatus(statusId);
    setListPage(1);
    setExpandedTableIds(new Set());
  };

  const updateDateFilter = (key, value) => {
    setDateFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyDateFilters = () => {
    setError('');
    if (
      dateFilters.entryFrom &&
      dateFilters.entryTo &&
      dateFilters.entryFrom > dateFilters.entryTo
    ) {
      setError('Transaction date from cannot be after to.');
      return;
    }
    if (
      dateFilters.createdFrom &&
      dateFilters.createdTo &&
      dateFilters.createdFrom > dateFilters.createdTo
    ) {
      setError('Entered date from cannot be after to.');
      return;
    }
    setAppliedDateFilters({ ...dateFilters });
    setListPage(1);
    setExpandedTableIds(new Set());
  };

  const clearDateFilters = () => {
    setDateFilters(EMPTY_DATE_FILTERS);
    setAppliedDateFilters(EMPTY_DATE_FILTERS);
    setListPage(1);
    setExpandedTableIds(new Set());
    setError('');
  };

  const handleListViewChange = (nextView) => {
    if (nextView === listView) return;
    setListView(nextView);
    try {
      localStorage.setItem(LIST_VIEW_KEY, nextView);
    } catch {
      /* ignore */
    }
  };

  const toggleTableRow = (requestId) => {
    setExpandedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  };

  const runBusinessApprove = async (request) => {
    setError('');
    setSuccess('');
    setBusinessActionId(request.id);
    try {
      await governanceService.approveBusinessApprovalRequest(request.id);
      setSuccess(`${request.label || request.entity_type} request was approved and posted to live data.`);
      await fetchPage(listPage, activeModuleMeta.id, activeStatusMeta.id, dateFilterParams);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve business request');
    } finally {
      setBusinessActionId(null);
    }
  };

  const runBusinessReject = async (request, reason) => {
    setError('');
    setSuccess('');
    setBusinessActionId(request.id);
    try {
      await governanceService.rejectBusinessApprovalRequest(request.id, reason || undefined);
      setSuccess(`${request.label || request.entity_type} request was rejected.`);
      await fetchPage(listPage, activeModuleMeta.id, activeStatusMeta.id, dateFilterParams);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject business request');
    } finally {
      setBusinessActionId(null);
    }
  };

  const handleBusinessModalConfirm = async (reason) => {
    if (!businessActionModal || businessActionId) return;
    if (businessActionModal.type === 'approve') {
      await runBusinessApprove(businessActionModal.request);
    } else {
      await runBusinessReject(businessActionModal.request, reason);
    }
    setBusinessActionModal(null);
  };

  const openExportModal = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setError('');
    setSuccess('');
    setExportFilters({
      ...EMPTY_EXPORT_FILTERS,
      moduleId: activeModuleMeta?.id || visibleModules[0]?.id || '',
      entryFrom: appliedDateFilters.entryFrom || '',
      entryTo: appliedDateFilters.entryTo || '',
      createdFrom: appliedDateFilters.createdFrom || '',
      createdTo: appliedDateFilters.createdTo || '',
    });
    setExportModalOpen(true);
  };

  const updateExportFilter = useCallback((key, value) => {
    setExportFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const closeExportModal = useCallback(() => {
    if (!exporting) setExportModalOpen(false);
  }, [exporting]);

  const handleExportExcel = async () => {
    if (exporting || !visibleModules.length) return;
    if (!exportFilters.moduleId) {
      setError('Select a category to export.');
      return;
    }

    const selectedModule = visibleModules.find((mod) => mod.id === exportFilters.moduleId);
    if (!selectedModule) {
      setError('You do not have access to that category.');
      return;
    }

    if (
      exportFilters.entryFrom &&
      exportFilters.entryTo &&
      exportFilters.entryFrom > exportFilters.entryTo
    ) {
      setError('Transaction date from cannot be after to.');
      return;
    }
    if (
      exportFilters.createdFrom &&
      exportFilters.createdTo &&
      exportFilters.createdFrom > exportFilters.createdTo
    ) {
      setError('Entered date from cannot be after to.');
      return;
    }

    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const allRequests = await fetchAllBusinessApprovalRequests([selectedModule.id]);
      const filtered = filterBusinessApprovalRequests(allRequests, {
        entryFrom: exportFilters.entryFrom,
        entryTo: exportFilters.entryTo,
        createdFrom: exportFilters.createdFrom,
        createdTo: exportFilters.createdTo,
      });
      const { requestCount, detailCount } = exportBusinessApprovalsToExcel(filtered, {
        companyName: company?.company_name || 'company',
        moduleLabel: selectedModule.id,
      });
      setExportModalOpen(false);
      setSuccess(
        `Exported ${requestCount} ${selectedModule.label} approval request${requestCount === 1 ? '' : 's'} (${detailCount} detail row${detailCount === 1 ? '' : 's'}) to Excel.`
      );
    } catch (err) {
      console.error('Business approvals Excel export failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  if (!canView) {
    return (
      <div className="agp-root agp-root--plain agp-root--gov">
        <div className="agp-empty">
          <h3>Access denied</h3>
          <p>You do not have permission to view business approval requests.</p>
        </div>
      </div>
    );
  }

  if (!visibleModules.length) {
    return (
      <div className="agp-root agp-root--plain agp-root--gov">
        <div className="agp-empty">
          <h3>No module access</h3>
          <p>You do not have maker or checker permissions for any business approval module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agp-root agp-root--plain agp-root--gov">
      <header className="agp-rail">
        <div className="agp-rail__brand">
          <p className="agp-rail__eyebrow">Governance · Maker-checker</p>
          <h1 className="agp-rail__title">Business Approvals</h1>
          <p className="agp-rail__blurb">
            {activeModuleMeta?.label || 'Module'} approvals for{' '}
            <strong>{company?.company_name || 'your company'}</strong>
            {isOwner ? ' — view only' : ''}
          </p>
        </div>
        <div className="agp-rail__actions">
          <button
            type="button"
            className="agp-btn-export"
            onClick={openExportModal}
            disabled={exporting}
            data-export-filters="true"
            title="Choose category and dates, then download Excel"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </button>
          <div className="agp-rail__stats">
            <div className="agp-rail__stat">
              <span className="agp-rail__stat-value">{pendingCount}</span>
              <span className="agp-rail__stat-label">Pending</span>
            </div>
            <div className="agp-rail__stat">
              <span className="agp-rail__stat-value">{activeModuleCounts.total || 0}</span>
              <span className="agp-rail__stat-label">Total</span>
            </div>
          </div>
        </div>
      </header>

      <div className="agp-context-bar">
        <div className="agp-context-tags">
          {company?.company_email && (
            <span className="agp-context-tag">{company.company_email}</span>
          )}
          <span className="agp-context-tag agp-context-tag--text">Business maker-checker</span>
          <span className="agp-context-tag">{activeModuleMeta?.label}</span>
          <span className="agp-context-tag">{activeStatusMeta?.label}</span>
          {isOwner && <span className="agp-context-tag">Company owner</span>}
        </div>
        <p className="agp-workflow-hint">
          Maker submits data → different checker approves → data posts to live tables
        </p>
      </div>

      <div className="agp-list-toolbar">
        <nav className="agp-tabs" aria-label="Business approval modules">
          {visibleModules.map((mod) => {
            const summary = moduleSummary[mod.id] || { total: 0, pending_count: 0 };
            return (
              <button
                key={mod.id}
                type="button"
                className={`agp-tab${activeModule === mod.id ? ' agp-tab--active' : ''}`}
                onClick={() => handleModuleChange(mod.id)}
                aria-selected={activeModule === mod.id}
              >
                {mod.label}
                {summary.pending_count > 0 && (
                  <span className="agp-tab-badge">{summary.pending_count}</span>
                )}
                {summary.pending_count === 0 && summary.total > 0 && (
                  <span className="agp-tab-badge agp-tab-badge--muted">{summary.total}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="agp-view-toggle" role="group" aria-label="List layout">
          <button
            type="button"
            className={`agp-view-toggle__btn${listView === 'cards' ? ' agp-view-toggle__btn--active' : ''}`}
            onClick={() => handleListViewChange('cards')}
            aria-pressed={listView === 'cards'}
            title="Card view"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M3 4.5A1.5 1.5 0 014.5 3h3A1.5 1.5 0 019 4.5v3A1.5 1.5 0 017.5 9h-3A1.5 1.5 0 013 7.5v-3zM11 4.5A1.5 1.5 0 0112.5 3h3A1.5 1.5 0 0117 4.5v3A1.5 1.5 0 0115.5 9h-3A1.5 1.5 0 0111 7.5v-3zM3 12.5A1.5 1.5 0 014.5 11h3A1.5 1.5 0 019 12.5v3A1.5 1.5 0 017.5 17h-3A1.5 1.5 0 013 15.5v-3zM11 12.5A1.5 1.5 0 0112.5 11h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 0111 15.5v-3z" />
            </svg>
            Cards
          </button>
          <button
            type="button"
            className={`agp-view-toggle__btn${listView === 'table' ? ' agp-view-toggle__btn--active' : ''}`}
            onClick={() => handleListViewChange('table')}
            aria-pressed={listView === 'table'}
            title="Table view"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M3 4.75A.75.75 0 013.75 4h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 4.75zM3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm0 5.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            Table
          </button>
        </div>
      </div>

      <div className="agp-shared-filters" aria-label="Filters for all statuses">
        <div className="agp-date-filters">
          <p className="agp-date-filters__shared-note">
            Date ranges apply to all status tabs below (Pending, Approved, Rejected).
          </p>
          <div className="agp-date-filters__row">
            <div className="agp-date-filters__group">
              <span className="agp-date-filters__legend">Transaction date</span>
              <label className="agp-date-filters__field">
                <span>From</span>
                <input
                  type="date"
                  value={dateFilters.entryFrom}
                  onChange={(e) => updateDateFilter('entryFrom', e.target.value)}
                />
              </label>
              <label className="agp-date-filters__field">
                <span>To</span>
                <input
                  type="date"
                  value={dateFilters.entryTo}
                  onChange={(e) => updateDateFilter('entryTo', e.target.value)}
                />
              </label>
            </div>
            <div className="agp-date-filters__group">
              <span className="agp-date-filters__legend">Entered date</span>
              <label className="agp-date-filters__field">
                <span>From</span>
                <input
                  type="date"
                  value={dateFilters.createdFrom}
                  onChange={(e) => updateDateFilter('createdFrom', e.target.value)}
                />
              </label>
              <label className="agp-date-filters__field">
                <span>To</span>
                <input
                  type="date"
                  value={dateFilters.createdTo}
                  onChange={(e) => updateDateFilter('createdTo', e.target.value)}
                />
              </label>
            </div>
            <div className="agp-date-filters__actions">
              <button type="button" className="agp-date-filters__apply" onClick={applyDateFilters}>
                Apply dates
              </button>
              <button
                type="button"
                className="agp-date-filters__clear"
                onClick={clearDateFilters}
                disabled={!hasDateFilters && !Object.values(dateFilters).some(Boolean)}
              >
                Clear
              </button>
              {hasDateFilters && (
                <span className="agp-date-filters__active" role="status">
                  Date filter active
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="agp-status-tabs" aria-label="Request status">
          {STATUS_TABS.map((tab) => {
            const countKey =
              tab.id === 'pending'
                ? 'pending_count'
                : tab.id === 'approved'
                  ? 'approved_count'
                  : 'rejected_count';
            const count = activeModuleCounts[countKey] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                className={`agp-status-tab${activeStatus === tab.id ? ' agp-status-tab--active' : ''}${
                  tab.id === 'pending' ? ' agp-status-tab--pending' : ''
                }${tab.id === 'approved' ? ' agp-status-tab--approved' : ''}${
                  tab.id === 'rejected' ? ' agp-status-tab--rejected' : ''
                }`}
                onClick={() => handleStatusChange(tab.id)}
                aria-selected={activeStatus === tab.id}
              >
                {tab.label}
                <span className="agp-status-tab__count">{count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {error && <div className="agp-alert agp-alert--error" role="alert">{error}</div>}
      {success && <div className="agp-alert agp-alert--success" role="status">{success}</div>}

      {isOwner && (
        <div className="agp-alert agp-alert--info" role="status">
          As company owner you can view business approval requests. Only checkers with the right permissions can approve them.
        </div>
      )}

      <section className="agp-panel agp-panel--list agp-tab-panel">
        {loading ? (
          <div className="agp-loading">
            <div className="agp-spinner" />
            <span>
              Loading {activeStatusMeta?.label?.toLowerCase() || 'status'}{' '}
              {activeModuleMeta?.label?.toLowerCase() || 'module'} approvals…
            </span>
          </div>
        ) : totalCount === 0 ? (
          <div className="agp-empty">
            <h3>
              No {activeStatusMeta?.label?.toLowerCase() || 'matching'}{' '}
              {activeModuleMeta?.label?.toLowerCase() || 'module'} requests
            </h3>
            <p>{activeStatusMeta?.emptyHint || activeModuleMeta?.emptyHint}</p>
          </div>
        ) : (
          <>
            {listView === 'cards' ? (
              <ul className="agp-request-list">
                {businessRequests.map((req) => {
                  const sourceLabel = getRequestSourceLabel(req);
                  return (
                    <li key={req.id} className="agp-request-item">
                      <div className="agp-request-main">
                        <div className="agp-request-top">
                          <strong>{req.label || req.entity_type}</strong>
                          <span className={`agp-status agp-status--${req.status}`}>
                            {getRequestStatusLabel(req.status)}
                          </span>
                        </div>
                        <div className="agp-request-email">
                          {req.action_type}
                          {sourceLabel && (
                            <>
                              {' · '}
                              {sourceLabel}
                            </>
                          )}
                          {req.voucher_number && (
                            <>
                              {' · '}
                              {req.voucher_number}
                            </>
                          )}
                          {req.entry_count != null && (
                            <>
                              {' · '}
                              {req.entry_count} {req.entry_count === 1 ? 'entry' : 'entries'}
                            </>
                          )}
                          {req.pass_duplicates && ' · duplicate check bypassed'}
                        </div>
                        <div className="agp-request-meta">
                          <span>Requested by {req.requested_by_email || '—'}</span>
                          <span>{formatDate(req.created_at)}</span>
                          {req.expires_at && req.status === 'pending' && (
                            <span>Expires {formatDate(req.expires_at)}</span>
                          )}
                        </div>
                        {(req.live_tables || []).length > 0 && (
                          <div className="agp-request-tags">
                            {req.live_tables.map((table) => (
                              <span key={table} className="agp-tag">
                                {table}
                              </span>
                            ))}
                          </div>
                        )}
                        {req.rejection_reason && (
                          <p className="agp-reject-reason">Reason: {req.rejection_reason}</p>
                        )}
                        {req.reviewed_by_email && (
                          <p className="agp-reviewed-by">
                            Reviewed by {req.reviewed_by_email} · {formatDate(req.reviewed_at)}
                          </p>
                        )}
                        <BusinessApprovalPayloadPreview request={req} />
                      </div>
                      {req.can_review && (
                        <div className="agp-request-actions agp-request-actions--business">
                          <button
                            type="button"
                            className="agp-biz-action-btn agp-biz-action-btn--approve"
                            disabled={businessActionId === req.id}
                            onClick={() => setBusinessActionModal({ type: 'approve', request: req })}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="agp-biz-action-btn agp-biz-action-btn--reject"
                            disabled={businessActionId === req.id}
                            onClick={() => setBusinessActionModal({ type: 'reject', request: req })}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'pending' && req.requested_by_user_id === user?.id && (
                        <p className="agp-self-note">You cannot approve your own business request.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="agp-table-wrap">
                <table className="agp-requests-table">
                  <thead>
                    <tr>
                      <th className="agp-requests-table__expand" aria-label="Expand" />
                      <th>Request</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Voucher / Entries</th>
                      <th>Requested by</th>
                      <th>Requested at</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessRequests.map((req) => {
                      const sourceLabel = getRequestSourceLabel(req);
                      const screenName = getRequestScreenName(req);
                      const expanded = expandedTableIds.has(req.id);
                      const voucherOrEntries =
                        req.voucher_number ||
                        (req.entry_count != null
                          ? `${req.entry_count} ${req.entry_count === 1 ? 'entry' : 'entries'}`
                          : '—');
                      return (
                        <React.Fragment key={req.id}>
                          <tr className={expanded ? 'agp-requests-table__row--expanded' : undefined}>
                            <td className="agp-requests-table__expand">
                              <button
                                type="button"
                                className={`agp-table-expand-btn${expanded ? ' agp-table-expand-btn--open' : ''}`}
                                onClick={() => toggleTableRow(req.id)}
                                aria-expanded={expanded}
                                aria-label={expanded ? 'Hide details' : 'Show details'}
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                  <path
                                    fillRule="evenodd"
                                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.24a.75.75 0 010 1.08l-4.5 4.24a.75.75 0 01-1.06-.02z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </td>
                            <td>
                              <div className="agp-table-request">
                                <strong>{req.label || req.entity_type}</strong>
                                {sourceLabel && sourceLabel !== screenName && (
                                  <span>{sourceLabel}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`agp-status agp-status--${req.status}`}>
                                {getRequestStatusLabel(req.status)}
                              </span>
                            </td>
                            <td>{screenName || '—'}</td>
                            <td>{voucherOrEntries}</td>
                            <td className="agp-table-email">{req.requested_by_email || '—'}</td>
                            <td className="agp-table-date">{formatDate(req.created_at)}</td>
                            <td className="agp-table-actions">
                              {req.can_review ? (
                                <div className="agp-request-actions agp-request-actions--business agp-request-actions--table">
                                  <button
                                    type="button"
                                    className="agp-biz-action-btn agp-biz-action-btn--approve"
                                    disabled={businessActionId === req.id}
                                    onClick={() =>
                                      setBusinessActionModal({ type: 'approve', request: req })
                                    }
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="agp-biz-action-btn agp-biz-action-btn--reject"
                                    disabled={businessActionId === req.id}
                                    onClick={() =>
                                      setBusinessActionModal({ type: 'reject', request: req })
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : req.status === 'pending' && req.requested_by_user_id === user?.id ? (
                                <span className="agp-self-note agp-self-note--inline">Own request</span>
                              ) : (
                                <span className="agp-table-muted">—</span>
                              )}
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="agp-requests-table__detail">
                              <td colSpan={8}>
                                <div className="agp-table-detail">
                                  <div className="agp-request-meta">
                                    {req.expires_at && req.status === 'pending' && (
                                      <span>Expires {formatDate(req.expires_at)}</span>
                                    )}
                                    {req.reviewed_by_email && (
                                      <span>
                                        Reviewed by {req.reviewed_by_email} ·{' '}
                                        {formatDate(req.reviewed_at)}
                                      </span>
                                    )}
                                    {req.rejection_reason && (
                                      <span>Reason: {req.rejection_reason}</span>
                                    )}
                                    {req.pass_duplicates && <span>Duplicate check bypassed</span>}
                                  </div>
                                  <BusinessApprovalPayloadPreview request={req} forceExpanded />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="agp-list-pagination">
                <span className="agp-payload-range">
                  Showing <strong>{listStart}</strong>–<strong>{listEnd}</strong> of{' '}
                  <strong>{totalCount}</strong>
                </span>
                <div className="agp-payload-pagination-actions">
                  <button
                    type="button"
                    className="agp-payload-page-btn"
                    disabled={listPage <= 1 || loading}
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="agp-payload-page-label">
                    Page {listPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="agp-payload-page-btn"
                    disabled={listPage >= totalPages || loading}
                    onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <GovernanceActionModal
        open={!!businessActionModal}
        title={
          businessActionModal?.type === 'approve'
            ? 'Approve business request'
            : 'Reject business request'
        }
        message={
          businessActionModal
            ? businessActionModal.type === 'approve'
              ? `Approve this ${businessActionModal.request.label || businessActionModal.request.entity_type} request? Review the submitted data below before confirming. It will be posted to live data.`
              : `Reject this ${businessActionModal.request.label || businessActionModal.request.entity_type} request?`
            : ''
        }
        variant={businessActionModal?.type === 'reject' ? 'prompt' : 'confirm'}
        confirmLabel={businessActionModal?.type === 'approve' ? 'Approve' : 'Reject'}
        confirmTone={businessActionModal?.type === 'approve' ? 'success' : 'danger'}
        loading={!!businessActionId}
        onConfirm={handleBusinessModalConfirm}
        onCancel={() => !businessActionId && setBusinessActionModal(null)}
      />

      <BusinessApprovalsExportModal
        open={exportModalOpen}
        exporting={exporting}
        modules={visibleModules}
        moduleSummary={moduleSummary}
        filters={exportFilters}
        onChangeFilter={updateExportFilter}
        onClose={closeExportModal}
        onConfirm={handleExportExcel}
      />
    </div>
  );
};

export default BusinessApprovalsPortal;
