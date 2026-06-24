import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import {
  PERMISSION_LABELS,
  REQUEST_STATUS_LABELS,
  groupPermissionsByModule,
  hasPermission,
  permissionsForUserCreation,
} from '../../constants/governanceConstants';
import GovernancePermissionPicker from './GovernancePermissionPicker';
import './AdminGovernancePortal.css';

const PORTAL_TABS = [
  { id: 'request', label: 'Request new user' },
  { id: 'requests', label: 'All requests' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const AdminGovernancePortal = ({ user, company }) => {
  const [permissions, setPermissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canRequest =
    user?.company_role === 'admin' && hasPermission(user, 'governance.user.request');
  const canApprove =
    user?.company_role === 'admin' && hasPermission(user, 'governance.user.approve');
  const isOwner = user?.company_role === 'company_owner';

  const [activeTab, setActiveTab] = useState(() =>
    user?.company_role === 'admin' && hasPermission(user, 'governance.user.request')
      ? 'request'
      : 'requests'
  );

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    funds_center: '',
    permission_ids: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [permRes, reqRes] = await Promise.all([
        governanceService.listPermissions(),
        governanceService.listUserRequests(),
      ]);
      const catalog = permissionsForUserCreation(permRes.data.permissions || []);
      setPermissions(catalog);
      setRequests(reqRes.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const pendingCount = requests.filter((r) => r.status === 'pending_second_admin_approval').length;

  const togglePermission = (id) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((x) => x !== id)
        : [...prev.permission_ids, id],
    }));
  };

  const selectAllInGroup = (items) => {
    const ids = items.map((p) => p.id);
    setForm((prev) => {
      const allSelected = ids.every((id) => prev.permission_ids.includes(id));
      if (allSelected) {
        return { ...prev, permission_ids: prev.permission_ids.filter((id) => !ids.includes(id)) };
      }
      return { ...prev, permission_ids: [...new Set([...prev.permission_ids, ...ids])] };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await governanceService.createUserRequest({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        funds_center: form.funds_center || undefined,
        permission_ids: form.permission_ids,
      });
      setSuccess(`User request submitted for ${form.email}. A different admin must approve it.`);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        funds_center: '',
        permission_ids: [],
      });
      setActiveTab('requests');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve user request for ${request.email}?`)) return;
    setError('');
    setSuccess('');
    setActionId(request.id);
    try {
      const res = await governanceService.approveUserRequest(request.id);
      const temp = res.data.temporary_password;
      setSuccess(
        temp
          ? `User ${request.email} was created. Temporary password: ${temp} — share securely and ask them to change it.`
          : `User request for ${request.email} was approved.`
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt(`Reject request for ${request.email}? Optional reason:`) ?? '';
    if (reason === null) return;
    setError('');
    setSuccess('');
    setActionId(request.id);
    try {
      await governanceService.rejectUserRequest(request.id, reason || undefined);
      setSuccess(`Request for ${request.email} was rejected.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionId(null);
    }
  };

  const canReviewRequest = (request) =>
    canApprove &&
    request.status === 'pending_second_admin_approval' &&
    request.requested_by_user_id !== user?.id;

  useEffect(() => {
    if (!canRequest && activeTab === 'request') {
      setActiveTab('requests');
    }
  }, [canRequest, activeTab]);

  const requestList = (
    <section className="agp-panel agp-panel--list">
      <div className="agp-panel-head">
        <h2>All requests</h2>
        <p>
          {canApprove
            ? 'Approve or reject pending requests from other admins.'
            : 'Track submitted user requests.'}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="agp-empty">
          <h3>No user requests yet</h3>
          <p>
            {canRequest
              ? 'Submit a request from the Request new user tab. Two active admins are required before requests can be created.'
              : 'Requests will appear here when admins submit them.'}
          </p>
        </div>
      ) : (
        <ul className="agp-request-list">
          {requests.map((req) => (
            <li key={req.id} className="agp-request-item">
              <div className="agp-request-main">
                <div className="agp-request-top">
                  <strong>
                    {req.first_name} {req.last_name}
                  </strong>
                  <span className={`agp-status agp-status--${req.status}`}>
                    {REQUEST_STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>
                <div className="agp-request-email">{req.email}</div>
                <div className="agp-request-meta">
                  <span>Requested by {req.requested_by_email || '—'}</span>
                  <span>{formatDate(req.created_at)}</span>
                  {req.expires_at && req.status === 'pending_second_admin_approval' && (
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
              {canReviewRequest(req) && (
                <div className="agp-request-actions">
                  <button
                    type="button"
                    className="agp-btn-ghost-success"
                    disabled={actionId === req.id}
                    onClick={() => handleApprove(req)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="agp-btn-ghost-danger"
                    disabled={actionId === req.id}
                    onClick={() => handleReject(req)}
                  >
                    Reject
                  </button>
                </div>
              )}
              {canApprove &&
                req.status === 'pending_second_admin_approval' &&
                req.requested_by_user_id === user?.id && (
                  <p className="agp-self-note">You cannot approve your own request.</p>
                )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="agp-root">
      <header className="agp-page-header">
        <div className="agp-header-main">
          <div className="agp-header-icon" aria-hidden>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div className="agp-header-text">
            <h1>User Requests</h1>
            <p>
              Maker–checker workflow for <strong>{company?.company_name || 'your company'}</strong>
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
            <span className="agp-stat-value">{requests.length}</span>
            <span className="agp-stat-label">Total requests</span>
          </div>
        </div>
      </header>

      <div className="agp-context-bar">
        <div className="agp-context-tags">
          {company?.company_email && (
            <span className="agp-context-tag">{company.company_email}</span>
          )}
          {canRequest && <span className="agp-context-tag agp-context-tag--active">Can request users</span>}
          {canApprove && <span className="agp-context-tag agp-context-tag--active">Can approve requests</span>}
          {isOwner && <span className="agp-context-tag">Company owner</span>}
        </div>
        <p className="agp-workflow-hint">
          Admin submits request → different admin approves → new user can sign in
        </p>
      </div>

      {error && <div className="agp-alert agp-alert--error" role="alert">{error}</div>}
      {success && <div className="agp-alert agp-alert--success" role="status">{success}</div>}

      {isOwner && (
        <div className="agp-alert agp-alert--info" role="status">
          As company owner you can view requests. Only admins with maker–checker permissions can create or approve users.
        </div>
      )}

      {loading ? (
        <div className="agp-loading">
          <div className="agp-spinner" />
          <span>Loading user requests…</span>
        </div>
      ) : (
        <>
          <nav className="agp-tabs" aria-label="User request sections">
            {PORTAL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`agp-tab${activeTab === tab.id ? ' agp-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
                {tab.id === 'requests' && pendingCount > 0 && (
                  <span className="agp-tab-badge">{pendingCount}</span>
                )}
                {tab.id === 'requests' && requests.length > 0 && pendingCount === 0 && (
                  <span className="agp-tab-badge agp-tab-badge--muted">{requests.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="agp-tab-panel">
            {activeTab === 'request' ? (
              canRequest ? (
                <section className="agp-panel">
                  <div className="agp-panel-head">
                    <h2>Request new user</h2>
                    <p>Submit a request for another admin to approve. You cannot approve your own request.</p>
                  </div>
                  <form onSubmit={handleCreate} className="agp-form">
                    <div className="agp-field-row">
                      <div className="agp-field">
                        <label htmlFor="agp-email">Email</label>
                        <input
                          id="agp-email"
                          type="email"
                          required
                          placeholder="user@company.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div className="agp-field">
                        <label htmlFor="agp-funds">Funds center (optional)</label>
                        <input
                          id="agp-funds"
                          placeholder="Default CSE center if empty"
                          value={form.funds_center}
                          onChange={(e) => setForm({ ...form, funds_center: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="agp-field-row">
                      <div className="agp-field">
                        <label htmlFor="agp-first">First name</label>
                        <input
                          id="agp-first"
                          required
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        />
                      </div>
                      <div className="agp-field">
                        <label htmlFor="agp-last">Last name</label>
                        <input
                          id="agp-last"
                          required
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="agp-form-section">
                      <h3>Permissions for new user</h3>
                      <p className="agp-section-hint">
                        Choose module access and sidebar features for this user. Governance admin permissions cannot be assigned to end users.
                      </p>
                      <GovernancePermissionPicker
                        groupedPermissions={groupedPermissions}
                        selectedIds={form.permission_ids}
                        onToggle={togglePermission}
                        onToggleGroup={selectAllInGroup}
                      />
                    </div>

                    <button
                      type="submit"
                      className="agp-btn-primary"
                      disabled={!form.permission_ids.length || submitting}
                    >
                      {submitting ? 'Submitting…' : 'Submit request'}
                    </button>
                  </form>
                </section>
              ) : (
                <section className="agp-panel">
                  <div className="agp-panel-head">
                    <h2>Request new user</h2>
                    <p>Only admins with request permission can submit new user proposals.</p>
                  </div>
                  <div className="agp-empty">
                    <h3>View only</h3>
                    <p>
                      {isOwner
                        ? 'As company owner you can view requests in the All requests tab. User creation is handled by admins with maker–checker permissions.'
                        : 'You do not have permission to create user requests. Switch to All requests to review pending items.'}
                    </p>
                  </div>
                </section>
              )
            ) : (
              requestList
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminGovernancePortal;
