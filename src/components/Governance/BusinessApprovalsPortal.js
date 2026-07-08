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
import GovernanceActionModal from './GovernanceActionModal';
import './AdminGovernancePortal.css';

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

  if (!canView) {
    return (
      <div className="agp-root agp-root--plain">
        <div className="agp-empty">
          <h3>Access denied</h3>
          <p>You do not have permission to view business approval requests.</p>
        </div>
      </div>
    );
  }

  if (!visibleModules.length) {
    return (
      <div className="agp-root agp-root--plain">
        <div className="agp-empty">
          <h3>No module access</h3>
          <p>You do not have maker or checker permissions for any business approval module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agp-root agp-root--plain">
      <header className="agp-page-header">
        <div className="agp-header-main">
          <div className="agp-header-icon" aria-hidden>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="agp-header-text">
            <h1>Business Approvals</h1>
            <p>
              {activeModuleMeta?.label || 'Module'} approvals for{' '}
              <strong>{company?.company_name || 'your company'}</strong>
              {isOwner ? ' — view only' : ''}
            </p>
          </div>
        </div>
        <div className="agp-header-stats">
          <div className="agp-stat">
            <span className="agp-stat-value">{pendingCount}</span>
            <span className="agp-stat-label">Pending</span>
          </div>
          <div className="agp-stat">
            <span className="agp-stat-value">{totalCount}</span>
            <span className="agp-stat-label">Total requests</span>
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
    </div>
  );
};

export default BusinessApprovalsPortal;
