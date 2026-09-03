import React, { useCallback, useEffect, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import { PERMISSION_LABELS } from '../../constants/governanceConstants';
import GovernanceActionModal from './GovernanceActionModal';
import './AdminGovernancePortal.css';

const ACTION_LABELS = {
  create_admin: 'Create admin',
  revoke_admin: 'Revoke admin',
  update_permissions: 'Update permissions',
  reactivate_admin: 'Reactivate admin',
};

const STATUS_LABELS = {
  pending_owner_approval: 'Pending your approval',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const OwnerAdminApprovals = ({ user, company }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionModal, setActionModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await governanceService.listAdminRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin approval requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = requests.filter((r) => r.status === 'pending_owner_approval').length;

  const runApprove = async (request) => {
    setError('');
    setSuccess('');
    setActionId(request.id);
    try {
      await governanceService.approveAdminRequest(request.id);
      setSuccess('Request approved and applied.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionId(null);
    }
  };

  const runReject = async (request, reason) => {
    setError('');
    setSuccess('');
    setActionId(request.id);
    try {
      await governanceService.rejectAdminRequest(request.id, reason || undefined);
      setSuccess('Request rejected.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionId(null);
    }
  };

  const handleModalConfirm = async (reason) => {
    if (!actionModal || actionId) return;
    if (actionModal.type === 'approve') {
      await runApprove(actionModal.request);
    } else {
      await runReject(actionModal.request, reason);
    }
    setActionModal(null);
  };

  const displayName = (request) => {
    if (request.action_type === 'create_admin') {
      return `${request.first_name} ${request.last_name}`;
    }
    if (request.target_admin_first_name || request.target_admin_email) {
      return `${request.target_admin_first_name || ''} ${request.target_admin_last_name || ''}`.trim() ||
        request.target_admin_email;
    }
    return 'Admin';
  };

  return (
    <div className="agp-root agp-root--plain">
      <header className="agp-rail">
        <div className="agp-rail__brand">
          <p className="agp-rail__eyebrow">Governance</p>
          <h1 className="agp-rail__title">Admin Approvals</h1>
          <p className="agp-rail__blurb">
            Review superuser requests for <strong>{company?.company_name || 'your company'}</strong>
          </p>
        </div>
        <div className="agp-rail__actions">
          <div className="agp-rail__stats">
            <div className="agp-rail__stat">
              <span className="agp-rail__stat-value">{pendingCount}</span>
              <span className="agp-rail__stat-label">Pending</span>
            </div>
            <div className="agp-rail__stat">
              <span className="agp-rail__stat-value">{requests.length}</span>
              <span className="agp-rail__stat-label">Total</span>
            </div>
          </div>
        </div>
      </header>

      <div className="agp-context-bar">
        <p className="agp-workflow-hint">
          Superuser submits admin changes → you approve or reject → changes take effect only after approval
        </p>
      </div>

      {error && <div className="agp-alert agp-alert--error" role="alert">{error}</div>}
      {success && <div className="agp-alert agp-alert--success" role="status">{success}</div>}

      {loading ? (
        <div className="agp-loading">
          <div className="agp-spinner" />
          <span>Loading approval requests…</span>
        </div>
      ) : (
        <section className="agp-panel agp-panel--list">
          <div className="agp-panel-head">
            <h2>Superuser requests</h2>
            <p>Approve or reject admin create, revoke, permission, and reactivate requests.</p>
          </div>

          {requests.length === 0 ? (
            <div className="agp-empty">
              <h3>No admin requests yet</h3>
              <p>When the superuser proposes admin changes, they will appear here for your approval.</p>
            </div>
          ) : (
            <ul className="agp-request-list">
              {requests.map((req) => (
                <li key={req.id} className="agp-request-item">
                  <div className="agp-request-main">
                    <div className="agp-request-top">
                      <strong>{displayName(req)}</strong>
                      <span className={`agp-status agp-status--${req.status}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </div>
                    <div className="agp-request-email">
                      {ACTION_LABELS[req.action_type] || req.action_type}
                      {req.email ? ` · ${req.email}` : req.target_admin_email ? ` · ${req.target_admin_email}` : ''}
                    </div>
                    <div className="agp-request-meta">
                      <span>Requested by {req.requested_by_email || 'superuser'}</span>
                      <span>{formatDate(req.created_at)}</span>
                      {req.expires_at && req.status === 'pending_owner_approval' && (
                        <span>Expires {formatDate(req.expires_at)}</span>
                      )}
                    </div>
                    {(req.permissions || []).length > 0 && (
                      <div className="agp-request-tags">
                        {req.permissions.map((key) => (
                          <span key={key} className="agp-tag">
                            {PERMISSION_LABELS[key] || key}
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
                  </div>
                  {user?.company_role === 'company_owner' &&
                    req.status === 'pending_owner_approval' && (
                      <div className="agp-request-actions">
                        <button
                          type="button"
                          className="agp-btn-ghost-success"
                          disabled={actionId === req.id}
                          onClick={() => setActionModal({ type: 'approve', request: req })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="agp-btn-ghost-danger"
                          disabled={actionId === req.id}
                          onClick={() => setActionModal({ type: 'reject', request: req })}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <GovernanceActionModal
        open={!!actionModal}
        title={
          actionModal?.type === 'approve'
            ? 'Approve admin request'
            : 'Reject admin request'
        }
        message={
          actionModal
            ? actionModal.type === 'approve'
              ? `Approve this ${ACTION_LABELS[actionModal.request.action_type] || actionModal.request.action_type} request?`
              : `Reject this ${ACTION_LABELS[actionModal.request.action_type] || actionModal.request.action_type} request?`
            : ''
        }
        variant={actionModal?.type === 'reject' ? 'prompt' : 'confirm'}
        confirmLabel={actionModal?.type === 'approve' ? 'Approve' : 'Reject'}
        confirmTone={actionModal?.type === 'approve' ? 'success' : 'danger'}
        loading={!!actionId}
        onConfirm={handleModalConfirm}
        onCancel={() => !actionId && setActionModal(null)}
      />
    </div>
  );
};

export default OwnerAdminApprovals;
