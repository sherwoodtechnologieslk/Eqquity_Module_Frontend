import React, { useCallback, useEffect, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import { canAccessBusinessApprovals } from '../../constants/governanceConstants';
import { GSEC_SOURCE_LABELS } from '../../utils/gsecMakerChecker';
import { NON_TRADING_SOURCE_LABELS } from '../../utils/nonTradingMakerChecker';
import BusinessApprovalPayloadPreview from './BusinessApprovalPayloadPreview';
import GovernanceActionModal from './GovernanceActionModal';
import './AdminGovernancePortal.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const BusinessApprovalsPortal = ({ user, company }) => {
  const [businessRequests, setBusinessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessActionId, setBusinessActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [businessActionModal, setBusinessActionModal] = useState(null);

  const isOwner = user?.company_role === 'company_owner';
  const canView = canAccessBusinessApprovals(user);

  const load = useCallback(async () => {
    if (!canView) {
      setBusinessRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const businessReqRes = await governanceService.listBusinessApprovalRequests();
      setBusinessRequests(businessReqRes.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load business approval requests');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingBusinessCount = businessRequests.filter((r) => r.status === 'pending').length;

  const runBusinessApprove = async (request) => {
    setError('');
    setSuccess('');
    setBusinessActionId(request.id);
    try {
      await governanceService.approveBusinessApprovalRequest(request.id);
      setSuccess(`${request.label || request.entity_type} request was approved and posted to live data.`);
      await load();
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
      await load();
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
              Maker-submitted business data for <strong>{company?.company_name || 'your company'}</strong>
              {isOwner ? ' — view only' : ''}
            </p>
          </div>
        </div>
        <div className="agp-header-stats">
          <div className="agp-stat">
            <span className="agp-stat-value">{pendingBusinessCount}</span>
            <span className="agp-stat-label">Pending</span>
          </div>
          <div className="agp-stat">
            <span className="agp-stat-value">{businessRequests.length}</span>
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
          {isOwner && <span className="agp-context-tag">Company owner</span>}
        </div>
        <p className="agp-workflow-hint">
          Maker submits data → different checker approves → data posts to live tables
        </p>
      </div>

      {error && <div className="agp-alert agp-alert--error" role="alert">{error}</div>}
      {success && <div className="agp-alert agp-alert--success" role="status">{success}</div>}

      {isOwner && (
        <div className="agp-alert agp-alert--info" role="status">
          As company owner you can view business approval requests. Only checkers with the right permissions can approve them.
        </div>
      )}

      {loading ? (
        <div className="agp-loading">
          <div className="agp-spinner" />
          <span>Loading business approvals…</span>
        </div>
      ) : (
        <section className="agp-panel agp-panel--list">
          {businessRequests.length === 0 ? (
            <div className="agp-empty">
              <h3>No business approval requests yet</h3>
              <p>Pending trade, accounting, GSec, non-trading, and master data approvals will appear here.</p>
            </div>
          ) : (
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
                      {req.module} · {req.action_type}
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
          )}
        </section>
      )}

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
