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
import GovernanceActionModal from './GovernanceActionModal';
import './AdminGovernancePortal.css';
import './GovernanceScreen.css';

const PORTAL_TABS = [
  { id: 'request', label: 'Request new user' },
  { id: 'rights', label: 'User rights' },
  { id: 'requests', label: 'All requests' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const AdminGovernancePortal = ({ user, company }) => {
  const [permissions, setPermissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
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

  const visibleTabs = useMemo(
    () =>
      PORTAL_TABS.filter((tab) => {
        if (tab.id === 'request') return canRequest;
        if (tab.id === 'rights') return canRequest || isOwner;
        if (tab.id === 'requests') return canRequest || canApprove || isOwner;
        return true;
      }),
    [canApprove, canRequest, isOwner]
  );

  const [activeTab, setActiveTab] = useState(() => (canRequest ? 'request' : 'requests'));

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    funds_center: '',
    permission_ids: [],
  });

  const [editForm, setEditForm] = useState({
    user_id: '',
    permission_ids: [],
  });

  const [actionModal, setActionModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const shouldLoadUserGovernance = canRequest || canApprove || isOwner;
      const [permRes, reqRes, userRes] = await Promise.all([
        shouldLoadUserGovernance
          ? governanceService.listPermissions()
          : Promise.resolve({ data: { permissions: [] } }),
        shouldLoadUserGovernance
          ? governanceService.listUserRequests()
          : Promise.resolve({ data: { requests: [] } }),
        (canRequest || isOwner)
          ? governanceService.listCompanyUsers()
          : Promise.resolve({ data: { users: [] } }),
      ]);
      const catalog = permissionsForUserCreation(permRes.data.permissions || []);
      setPermissions(catalog);
      setRequests(reqRes.data.requests || []);
      setCompanyUsers(userRes.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, [canApprove, canRequest, isOwner]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const permissionIdByKey = useMemo(() => {
    const map = new Map();
    permissions.forEach((permission) => map.set(permission.permission_key, permission.id));
    return map;
  }, [permissions]);

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

  const selectedUser = useMemo(
    () => companyUsers.find((companyUser) => String(companyUser.id) === String(editForm.user_id)),
    [companyUsers, editForm.user_id]
  );

  const selectUserForEdit = (userId) => {
    const target = companyUsers.find((companyUser) => String(companyUser.id) === String(userId));
    setEditForm({
      user_id: userId,
      permission_ids: (target?.permissions || [])
        .map((key) => permissionIdByKey.get(key))
        .filter(Boolean),
    });
  };

  const toggleEditPermission = (id) => {
    setEditForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((x) => x !== id)
        : [...prev.permission_ids, id],
    }));
  };

  const selectAllEditGroup = (items) => {
    const ids = items.map((p) => p.id);
    setEditForm((prev) => {
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

  const handleRightsUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await governanceService.updateUserPermissions(selectedUser.id, editForm.permission_ids);
      setSuccess(
        `Permission update for ${selectedUser.email} was submitted. Their current rights stay active until another admin approves.`
      );
      setEditForm({ user_id: '', permission_ids: [] });
      setActiveTab('requests');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit permission update request');
    } finally {
      setSubmitting(false);
    }
  };

  const runApprove = async (request) => {
    setError('');
    setSuccess('');
    setActionId(request.id);
    try {
      const res = await governanceService.approveUserRequest(request.id);
      const temp = res.data.temporary_password;
      const emailed = res.data.email_sent;
      const isPermissionUpdate = request.request_type === 'update_permissions';
      setSuccess(
        isPermissionUpdate
          ? `Permission update for ${request.email} was approved. The new rights are now active.`
          : temp
            ? emailed
              ? `User ${request.email} was created. Temporary password: ${temp} — also emailed to the user. Ask them to open their profile and update their password under Security.`
              : `User ${request.email} was created. Temporary password: ${temp} — share securely and ask them to open their profile and update their password under Security.`
            : `User request for ${request.email} was approved.`
      );
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
      await governanceService.rejectUserRequest(request.id, reason || undefined);
      setSuccess(`Request for ${request.email} was rejected.`);
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

  const canReviewRequest = (request) =>
    canApprove &&
    request.status === 'pending_second_admin_approval' &&
    request.requested_by_user_id !== user?.id;

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'requests');
    }
  }, [visibleTabs, activeTab]);

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
                    {req.request_type === 'update_permissions'
                      ? `Permission update for ${req.target_first_name || req.first_name || ''} ${req.target_last_name || req.last_name || ''}`.trim()
                      : `${req.first_name} ${req.last_name}`}
                  </strong>
                  <span className={`agp-status agp-status--${req.status}`}>
                    {REQUEST_STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>
                <div className="agp-request-email">
                  {req.email}
                  {req.request_type === 'update_permissions' && ' · rights change'}
                </div>
                <div className="agp-request-meta">
                  <span>Requested by {req.requested_by_email || '—'}</span>
                  <span>{formatDate(req.created_at)}</span>
                  {req.request_type === 'update_permissions' && (
                    <span>User stays active with existing rights until approval</span>
                  )}
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

  const rightsPanel = (
    <section className="agp-panel">
      <div className="agp-panel-head">
        <h2>User rights</h2>
        <p>
          Edit an active user's screen/module access. Changes stay pending until a different
          admin approves them.
        </p>
      </div>

      {companyUsers.length === 0 ? (
        <div className="agp-empty">
          <h3>No users yet</h3>
          <p>Create users through the Request new user tab before editing rights.</p>
        </div>
      ) : (
        <form onSubmit={handleRightsUpdate} className="agp-form">
          <div className="agp-field">
            <label htmlFor="agp-edit-user">Select user</label>
            <select
              id="agp-edit-user"
              value={editForm.user_id}
              onChange={(e) => selectUserForEdit(e.target.value)}
              disabled={!canRequest}
            >
              <option value="">Choose a user</option>
              {companyUsers.map((companyUser) => (
                <option key={companyUser.id} value={companyUser.id}>
                  {companyUser.first_name} {companyUser.last_name} — {companyUser.email}
                  {companyUser.pending_permission_request_id ? ' (pending update)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedUser?.pending_permission_request_id && (
            <div className="agp-alert agp-alert--info" role="status">
              A permission update for this user is already pending approval from another admin.
            </div>
          )}

          {selectedUser && (
            <div className="agp-form-section">
              <h3>Proposed permissions</h3>
              <p className="agp-section-hint">
                The current permissions are preselected. Submitting will create an approval request
                and will not change the user's active rights yet.
              </p>
              <GovernancePermissionPicker
                groupedPermissions={groupedPermissions}
                selectedIds={editForm.permission_ids}
                onToggle={toggleEditPermission}
                onToggleGroup={selectAllEditGroup}
              />
            </div>
          )}

          {canRequest ? (
            <button
              type="submit"
              className="agp-btn-primary"
              disabled={
                !selectedUser ||
                !editForm.permission_ids.length ||
                !!selectedUser.pending_permission_request_id ||
                submitting
              }
            >
              {submitting ? 'Submitting…' : 'Submit permission update'}
            </button>
          ) : (
            <div className="agp-empty">
              <h3>View only</h3>
              <p>Only admins with request permission can submit permission changes.</p>
            </div>
          )}
        </form>
      )}
    </section>
  );

  return (
    <div className="agp-root agp-root--plain agp-root--gov">
      <header className="agp-rail">
        <div className="agp-rail__brand">
          <p className="agp-rail__eyebrow">Governance · Maker-checker</p>
          <h1 className="agp-rail__title">User Requests</h1>
          <p className="agp-rail__blurb">
            Maker–checker workflow for <strong>{company?.company_name || 'your company'}</strong>
            {isOwner ? ' — view only' : ''}
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
        <div className="agp-context-tags">
          {company?.company_email && (
            <span className="agp-context-tag">{company.company_email}</span>
          )}
          {canRequest && <span className="agp-context-tag agp-context-tag--text">Can request users</span>}
          {canApprove && <span className="agp-context-tag agp-context-tag--text">Can approve requests</span>}
          {isOwner && <span className="agp-context-tag">Company owner</span>}
        </div>
        <p className="agp-workflow-hint">
          Maker submits request → different checker approves → change becomes active
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
            {visibleTabs.map((tab) => (
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
            ) : activeTab === 'rights' ? (
              rightsPanel
            ) : (
              requestList
            )}
          </div>
        </>
      )}

      <GovernanceActionModal
        open={!!actionModal}
        title={
          actionModal?.type === 'approve'
            ? 'Approve user request'
            : 'Reject user request'
        }
        message={
          actionModal
            ? actionModal.type === 'approve'
              ? actionModal.request.request_type === 'update_permissions'
                ? `Approve the permission update for ${actionModal.request.email}? The new rights will become active immediately after approval.`
                : `Create the user account for ${actionModal.request.email}? A temporary password will be shown here and emailed to them.`
              : `Reject the request for ${actionModal.request.email}?`
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

export default AdminGovernancePortal;
