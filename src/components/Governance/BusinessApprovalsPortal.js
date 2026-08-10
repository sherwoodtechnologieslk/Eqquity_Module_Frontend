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
  acc[mod.id] = { total: 0, pending_count: 0 };
  return acc;
}, {});

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

const BusinessApprovalsPortal = ({ user, company }) => {
  const visibleModules = useMemo(() => getVisibleBusinessApprovalModules(user), [user]);
  const [activeModule, setActiveModule] = useState('trade');
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

  const isOwner = user?.company_role === 'company_owner';
  const canView = canAccessBusinessApprovals(user);
  const activeModuleMeta = visibleModules.find((mod) => mod.id === activeModule) || visibleModules[0];

  useEffect(() => {
    if (!visibleModules.length) return;
    if (!visibleModules.some((mod) => mod.id === activeModule)) {
      setActiveModule(visibleModules[0].id);
      setListPage(1);
    }
  }, [visibleModules, activeModule]);

  const fetchPage = useCallback(
    async (page, module) => {
      if (!canView || !module) {
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
        });
        const data = businessReqRes.data;
        const requests = data.requests || [];
        const nextTotal = data.total ?? 0;
        const nextTotalPages = data.total_pages ?? 0;
        const nextPage = data.page ?? page;

        if (requests.length === 0 && nextTotal > 0 && nextPage > 1) {
          setListPage(nextPage - 1);
          return;
        }

        setBusinessRequests(requests);
        setTotalCount(nextTotal);
        setPendingCount(data.pending_count ?? 0);
        setTotalPages(nextTotalPages);
        setModuleSummary({ ...EMPTY_MODULE_SUMMARY, ...(data.module_summary || {}) });
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
    if (activeModuleMeta?.id) {
      fetchPage(listPage, activeModuleMeta.id);
    }
  }, [listPage, activeModuleMeta?.id, fetchPage]);

  const listStart = totalCount === 0 ? 0 : (listPage - 1) * LIST_PAGE_SIZE + 1;
  const listEnd = Math.min(listPage * LIST_PAGE_SIZE, totalCount);

  const handleModuleChange = (moduleId) => {
    if (moduleId === activeModule) return;
    setActiveModule(moduleId);
    setListPage(1);
  };

  const runBusinessApprove = async (request) => {
    setError('');
    setSuccess('');
    setBusinessActionId(request.id);
    try {
      await governanceService.approveBusinessApprovalRequest(request.id);
      setSuccess(`${request.label || request.entity_type} request was approved and posted to live data.`);
      await fetchPage(listPage, activeModuleMeta.id);
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
      await fetchPage(listPage, activeModuleMeta.id);
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
      setError('Entry date from cannot be after to.');
      return;
    }
    if (
      exportFilters.createdFrom &&
      exportFilters.createdTo &&
      exportFilters.createdFrom > exportFilters.createdTo
    ) {
      setError('Created date from cannot be after to.');
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
              <span className="agp-rail__stat-value">{totalCount}</span>
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
          {isOwner && <span className="agp-context-tag">Company owner</span>}
        </div>
        <p className="agp-workflow-hint">
          Maker submits data → different checker approves → data posts to live tables
        </p>
      </div>

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
            <span>Loading {activeModuleMeta?.label?.toLowerCase() || 'module'} approvals…</span>
          </div>
        ) : totalCount === 0 ? (
          <div className="agp-empty">
            <h3>No {activeModuleMeta?.label?.toLowerCase() || 'module'} approval requests yet</h3>
            <p>{activeModuleMeta?.emptyHint}</p>
          </div>
        ) : (
          <>
            <ul className="agp-request-list">
              {businessRequests.map((req) => (
                <li key={req.id} className="agp-request-item">
                  <div className="agp-request-main">
                    <div className="agp-request-top">
                      <strong>{req.label || req.entity_type}</strong>
                      <span className={`agp-status agp-status--${req.status}`}>
                        {req.status === 'pending' ? 'Pending approval' : req.status}
                      </span>
                    </div>
                    <div className="agp-request-email">
                      {req.action_type}
                      {(req.source_label || req.payload?.source) && (
                        <>
                          {' · '}
                          {req.source_label ||
                            GSEC_SOURCE_LABELS[req.payload?.source] ||
                            NON_TRADING_SOURCE_LABELS[req.payload?.source] ||
                            req.payload?.source}
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
              ))}
            </ul>
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
