import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import SherwoodManagerMark from '../Home/SherwoodManagerMark';
import {
  PERMISSION_LABELS,
  groupPermissionsByModule,
  permissionsForAdminCreation,
} from '../../constants/governanceConstants';
import GovernancePermissionPicker from './GovernancePermissionPicker';
import './SuperuserPortal.css';

const PORTAL_TABS = [
  { id: 'create', label: 'Create admin' },
  { id: 'admins', label: 'Company admins' },
];

const REQUEST_ACTION_LABELS = {
  create_admin: 'Create admin',
  revoke_admin: 'Revoke admin',
  update_permissions: 'Update permissions',
  reactivate_admin: 'Reactivate admin',
};

const REQUEST_STATUS_LABELS = {
  pending_owner_approval: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

function formatRequestDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function requestDisplayName(req) {
  if (req.action_type === 'create_admin') {
    return `${req.first_name || ''} ${req.last_name || ''}`.trim() || req.email || 'New admin';
  }
  if (req.target_admin_first_name || req.target_admin_email) {
    return (
      `${req.target_admin_first_name || ''} ${req.target_admin_last_name || ''}`.trim() ||
      req.target_admin_email
    );
  }
  return 'Admin';
}

function OwnerRequestItem({ request }) {
  const statusClass = `sup-request-status sup-request-status--${request.status}`;
  return (
    <li
      className={`sup-admin-item${
        request.status === 'rejected' ? ' sup-admin-item--rejected' : ''
      }${request.status === 'approved' ? ' sup-admin-item--approved' : ''}`}
    >
      <div className="sup-admin-body">
        <div className="sup-admin-top">
          <strong>{requestDisplayName(request)}</strong>
          <span className={statusClass}>
            {REQUEST_STATUS_LABELS[request.status] || request.status}
          </span>
        </div>
        <div className="sup-admin-email">
          {REQUEST_ACTION_LABELS[request.action_type] || request.action_type}
          {request.email ? ` · ${request.email}` : request.target_admin_email ? ` · ${request.target_admin_email}` : ''}
        </div>
        <div className="sup-request-meta">
          <span>Submitted {formatRequestDate(request.created_at)}</span>
          {request.reviewed_at && (
            <span>
              {request.status === 'rejected' ? 'Rejected' : 'Reviewed'}{' '}
              {formatRequestDate(request.reviewed_at)}
            </span>
          )}
          {request.reviewed_by_email && request.status !== 'pending_owner_approval' && (
            <span>By {request.reviewed_by_email}</span>
          )}
        </div>
        {request.status === 'rejected' && request.rejection_reason && (
          <p className="sup-request-reason">
            <strong>Reason:</strong> {request.rejection_reason}
          </p>
        )}
      </div>
    </li>
  );
}

function initials(user) {
  const a = (user?.first_name || '').charAt(0);
  const b = (user?.last_name || '').charAt(0);
  return (a + b).toUpperCase() || '?';
}

function StatCard({ variant = 'neutral', value, label, icon }) {
  return (
    <div className={`sup-stat sup-stat--${variant}`}>
      <div className="sup-stat-icon" aria-hidden>
        {icon}
      </div>
      <div className="sup-stat-body">
        <span className="sup-stat-value">{value}</span>
        <span className="sup-stat-label">{label}</span>
      </div>
    </div>
  );
}

function permissionIdsFromKeys(catalog, keys = []) {
  const keySet = new Set(keys);
  return catalog.filter((p) => keySet.has(p.permission_key)).map((p) => p.id);
}

const SuperuserPortal = ({ user, company, onLogout }) => {
  const [permissions, setPermissions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    permission_ids: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [permRes, adminRes, reqRes] = await Promise.all([
        governanceService.listPermissions(),
        governanceService.listAdmins(),
        governanceService.listAdminRequests(),
      ]);
      const catalog = permissionsForAdminCreation(permRes.data.permissions || []);
      setPermissions(catalog);
      setAdmins(adminRes.data.admins || []);
      setAdminRequests(reqRes.data.requests || []);
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

  const activeAdminCount = admins.filter((a) => a.is_active).length;
  const pendingRequests = adminRequests.filter((r) => r.status === 'pending_owner_approval');
  const rejectedRequests = adminRequests.filter((r) => r.status === 'rejected');
  const approvedRequests = adminRequests.filter((r) => r.status === 'approved');
  const otherResolvedRequests = adminRequests.filter((r) =>
    ['expired', 'cancelled'].includes(r.status)
  );
  const pendingOwnerCount = pendingRequests.length;
  const rejectedOwnerCount = rejectedRequests.length;
  const canApproveUsers = activeAdminCount >= 2;

  const togglePermission = (id) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((x) => x !== id)
        : [...prev.permission_ids, id],
    }));
  };

  const selectAllInGroup = (items, selectedIds, setter) => {
    const ids = items.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setter(selectedIds.filter((id) => !ids.includes(id)));
      return;
    }
    setter([...new Set([...selectedIds, ...ids])]);
  };

  const startEditAdmin = (admin) => {
    setError('');
    setSuccess('');
    setEditingAdmin({
      mode: 'edit',
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      permission_ids: permissionIdsFromKeys(permissions, admin.permissions),
    });
  };

  const startReactivateAdmin = (admin) => {
    setError('');
    setSuccess('');
    setEditingAdmin({
      mode: 'reactivate',
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      permission_ids: permissionIdsFromKeys(permissions, admin.permissions),
    });
  };

  const closeEditAdmin = () => {
    if (!savingEdit) setEditingAdmin(null);
  };

  const toggleEditPermission = (id) => {
    setEditingAdmin((prev) => {
      if (!prev) return prev;
      const permission_ids = prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((x) => x !== id)
        : [...prev.permission_ids, id];
      return { ...prev, permission_ids };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAdmin?.permission_ids.length) return;
    setError('');
    setSuccess('');
    setSavingEdit(true);
    try {
      if (editingAdmin.mode === 'reactivate') {
        await governanceService.reactivateAdmin(
          editingAdmin.id,
          editingAdmin.permission_ids
        );
        setSuccess(`Reactivate request for ${editingAdmin.email} submitted for company owner approval.`);
      } else {
        await governanceService.updateAdminPermissions(
          editingAdmin.id,
          editingAdmin.permission_ids
        );
        setSuccess(`Permissions change for ${editingAdmin.email} submitted for company owner approval.`);
      }
      setEditingAdmin(null);
      await load();
    } catch (err) {
      const fallback =
        editingAdmin.mode === 'reactivate'
          ? 'Failed to reactivate admin'
          : 'Failed to update admin permissions';
      setError(err.response?.data?.message || fallback);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await governanceService.createAdmin(form);
      setSuccess(`Admin request for ${form.email} submitted for company owner approval.`);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        permission_ids: [],
      });
      await load();
      setActiveTab('create');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (adminId, email) => {
    if (!window.confirm(`Revoke admin access for ${email}?`)) return;
    setError('');
    setSuccess('');
    try {
      await governanceService.revokeAdmin(adminId);
      setSuccess(`Revoke request for ${email} submitted for company owner approval.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke admin');
    }
  };

  return (
    <div className="sup-layout">
      <aside className="sup-sidebar">
        <div className="sup-sidebar-brand">
          <SherwoodManagerMark tier="equity" />
          <span className="sup-sidebar-badge">Superuser portal</span>
        </div>

        <div className="sup-sidebar-identity">
          <div className="sup-sidebar-avatar" aria-hidden>{initials(user)}</div>
          <div className="sup-sidebar-identity-body">
            <p className="sup-sidebar-identity-name">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="sup-sidebar-identity-email">{user?.email}</p>
            <span className="sup-sidebar-role-pill">Company superuser</span>
          </div>
        </div>

        <div className="sup-company-card">
          <p className="sup-sidebar-label">Your company</p>
          <p className="sup-company-card-name">{company?.company_name || '—'}</p>
          <p className="sup-company-card-caption">
            You are the superuser for this company and manage its admins.
          </p>
          <div className="sup-company-card-meta">
            {company?.company_email && (
              <span className="sup-company-card-email">{company.company_email}</span>
            )}
            {company?.status && (
              <span className={`sup-company-status sup-company-status--${company.status}`}>
                {company.status}
              </span>
            )}
          </div>
        </div>

        <div className="sup-sidebar-footer">
          <div className="sup-sidebar-note">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Superuser proposals require company owner approval before they take effect.</span>
          </div>

          <button type="button" className="sup-sidebar-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="sup-main">
        <header className="sup-topbar">
          <div>
            <h1>{company?.company_name ? `${company.company_name} administration` : 'Company administration'}</h1>
            <p>
              Signed in as company superuser
              {company?.company_name ? ` for ${company.company_name}` : ''}
            </p>
          </div>
          <div className="sup-user-chip">
            <div className="sup-avatar" aria-hidden>{initials(user)}</div>
            <div>
              <div className="sup-user-name">{user?.first_name} {user?.last_name}</div>
              <div className="sup-user-email">{user?.email}</div>
              {company?.company_name && (
                <div className="sup-user-company">{company.company_name}</div>
              )}
            </div>
            <span className="sup-role-pill">Superuser</span>
          </div>
        </header>

        <div className="sup-content">
          {error && (
            <div className="sup-alert sup-alert--error" role="alert">{error}</div>
          )}
          {success && (
            <div className="sup-alert sup-alert--success" role="status">{success}</div>
          )}

          <div className="sup-stats">
            <StatCard
              variant="blue"
              value={activeAdminCount}
              label="Active admins"
              icon={
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              }
            />
            <StatCard
              variant={pendingOwnerCount ? 'amber' : 'green'}
              value={pendingOwnerCount}
              label="Pending owner approval"
              icon={
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              variant={rejectedOwnerCount > 0 ? 'red' : 'slate'}
              value={rejectedOwnerCount}
              label="Rejected by owner"
              icon={
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              variant={canApproveUsers ? 'green' : 'amber'}
              value={canApproveUsers ? 'Ready' : 'Need 2'}
              label="User approval workflow"
              icon={
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>

          <nav className="sup-tabs" aria-label="Superuser administration sections">
            {PORTAL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sup-tab${activeTab === tab.id ? ' sup-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
                {tab.id === 'create' && pendingOwnerCount > 0 && (
                  <span className="sup-tab-badge">{pendingOwnerCount}</span>
                )}
                {tab.id === 'admins' && admins.length > 0 && (
                  <span className="sup-tab-badge sup-tab-badge--muted">{activeAdminCount}</span>
                )}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="sup-loading">
              <div className="sup-spinner" />
              <span>Loading administration data…</span>
            </div>
          ) : activeTab === 'create' ? (
            <div className="sup-tab-panel">
            <div className="sup-create-layout">
              <div className="sup-create-top">
                <section className="sup-panel">
                  <div className="sup-panel-head">
                    <h2>Create admin</h2>
                    <p>Submit a proposal for the company owner to approve. Admins become active only after approval.</p>
                  </div>

                  <form id="sup-create-admin-form" onSubmit={handleCreate} className="sup-form">
                    <div className="sup-form-section">
                      <h3>Account details</h3>
                      <div className="sup-field-row">
                        <div className="sup-field">
                          <label htmlFor="sup-email">Email</label>
                          <input
                            id="sup-email"
                            type="email"
                            required
                            placeholder="admin@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                          />
                        </div>
                        <div className="sup-field">
                          <label htmlFor="sup-password">Temporary password</label>
                          <input
                            id="sup-password"
                            type="password"
                            required
                            minLength={6}
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="sup-field-row">
                        <div className="sup-field">
                          <label htmlFor="sup-first">First name</label>
                          <input
                            id="sup-first"
                            required
                            value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          />
                        </div>
                        <div className="sup-field">
                          <label htmlFor="sup-last">Last name</label>
                          <input
                            id="sup-last"
                            required
                            value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </section>

                <section className="sup-panel sup-panel--list">
                  <div className="sup-panel-head">
                    <h2>Owner approval requests</h2>
                    <p>
                      {pendingOwnerCount} pending
                      {rejectedOwnerCount > 0 ? ` · ${rejectedOwnerCount} rejected` : ''}
                      {approvedRequests.length > 0 ? ` · ${approvedRequests.length} approved` : ''}
                    </p>
                  </div>
                  {adminRequests.length === 0 ? (
                    <div className="sup-empty">
                      <p>No requests yet. Submissions you send to the company owner will appear here.</p>
                    </div>
                  ) : (
                    <div className="sup-request-sections">
                      {pendingRequests.length > 0 && (
                        <div className="sup-request-section">
                          <h3 className="sup-request-subhead">Pending</h3>
                          <ul className="sup-admin-list">
                            {pendingRequests.map((req) => (
                              <OwnerRequestItem key={req.id} request={req} />
                            ))}
                          </ul>
                        </div>
                      )}

                      {rejectedRequests.length > 0 && (
                        <div className="sup-request-section">
                          <h3 className="sup-request-subhead sup-request-subhead--rejected">
                            Rejected by company owner
                          </h3>
                          <ul className="sup-admin-list">
                            {rejectedRequests.map((req) => (
                              <OwnerRequestItem key={req.id} request={req} />
                            ))}
                          </ul>
                        </div>
                      )}

                      {approvedRequests.length > 0 && (
                        <div className="sup-request-section">
                          <h3 className="sup-request-subhead sup-request-subhead--approved">Approved</h3>
                          <ul className="sup-admin-list">
                            {approvedRequests.map((req) => (
                              <OwnerRequestItem key={req.id} request={req} />
                            ))}
                          </ul>
                        </div>
                      )}

                      {otherResolvedRequests.length > 0 && (
                        <div className="sup-request-section">
                          <h3 className="sup-request-subhead">Other</h3>
                          <ul className="sup-admin-list">
                            {otherResolvedRequests.map((req) => (
                              <OwnerRequestItem key={req.id} request={req} />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <section className="sup-panel sup-panel--permissions">
                <div className="sup-form-section">
                  <h3>Permissions</h3>
                  <p className="sup-section-hint">
                    Choose module access and sidebar features (Equity Entries, GSec, TradeCore, etc.) for this admin.
                  </p>
                  <GovernancePermissionPicker
                    groupedPermissions={groupedPermissions}
                    selectedIds={form.permission_ids}
                    onToggle={togglePermission}
                    onToggleGroup={(items) =>
                      selectAllInGroup(items, form.permission_ids, (permission_ids) =>
                        setForm((prev) => ({ ...prev, permission_ids }))
                      )
                    }
                  />
                </div>
                <div className="sup-form-actions">
                  <button
                    type="submit"
                    form="sup-create-admin-form"
                    className="sup-btn-primary"
                    disabled={!form.permission_ids.length || submitting}
                  >
                    {submitting ? 'Submitting…' : 'Submit for owner approval'}
                  </button>
                </div>
              </section>
            </div>
            </div>
          ) : (
            <div className="sup-tab-panel">
              <section className="sup-panel sup-panel--list">
                <div className="sup-panel-head">
                  <h2>Company admins</h2>
                  <p>{activeAdminCount} active · {admins.length} total</p>
                </div>

                {admins.length === 0 ? (
                  <div className="sup-empty">
                    <div className="sup-empty-icon" aria-hidden>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </div>
                    <h3>No admins yet</h3>
                    <p>Create at least two admins with approve permission before user requests can be processed.</p>
                    <button
                      type="button"
                      className="sup-btn-primary sup-btn-primary--inline"
                      onClick={() => setActiveTab('create')}
                    >
                      Create admin
                    </button>
                  </div>
                ) : (
                  <ul className="sup-admin-list">
                    {admins.map((admin) => (
                      <li key={admin.id} className={`sup-admin-item${admin.is_active ? '' : ' sup-admin-item--off'}`}>
                        <div className="sup-admin-avatar" aria-hidden>
                          {(admin.first_name?.[0] || '') + (admin.last_name?.[0] || '')}
                        </div>
                        <div className="sup-admin-body">
                          <div className="sup-admin-top">
                            <strong>{admin.first_name} {admin.last_name}</strong>
                            {!admin.is_active && <span className="sup-inactive-pill">Inactive</span>}
                          </div>
                          <div className="sup-admin-email">{admin.email}</div>
                          <div className="sup-admin-tags">
                            {(admin.permissions || []).length > 0 ? (
                              (admin.permissions || []).map((key) => (
                                <span
                                  key={key}
                                  className={`sup-tag${admin.is_active ? '' : ' sup-tag--prev'}`}
                                >
                                  {PERMISSION_LABELS[key] || key}
                                </span>
                              ))
                            ) : (
                              <span className="sup-tag sup-tag--empty">No permissions assigned</span>
                            )}
                          </div>
                        </div>
                        {admin.is_active ? (
                          <div className="sup-admin-actions">
                            <button
                              type="button"
                              className="sup-action-btn sup-action-btn--edit"
                              onClick={() => startEditAdmin(admin)}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="sup-action-btn sup-action-btn--revoke"
                              onClick={() => handleRevoke(admin.id, admin.email)}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <div className="sup-admin-actions">
                            <button
                              type="button"
                              className="sup-action-btn sup-action-btn--reactivate"
                              onClick={() => startReactivateAdmin(admin)}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Reactivate
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {editingAdmin && (
        <div
          className="sup-modal-backdrop"
          role="presentation"
          onClick={closeEditAdmin}
        >
          <div
            className="sup-modal"
            role="dialog"
            aria-labelledby="sup-edit-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sup-modal-head">
              <div>
                <h2 id="sup-edit-title">
                  {editingAdmin.mode === 'reactivate'
                    ? 'Reactivate admin'
                    : 'Edit admin permissions'}
                </h2>
                <p>
                  {editingAdmin.first_name} {editingAdmin.last_name} · {editingAdmin.email}
                </p>
              </div>
              <button
                type="button"
                className="sup-modal-close"
                onClick={closeEditAdmin}
                aria-label="Close"
                disabled={savingEdit}
              >
                ×
              </button>
            </div>

            <div className="sup-modal-body">
              <p className="sup-section-hint">
                {editingAdmin.mode === 'reactivate'
                  ? 'Restore access for this admin. Previous permissions are pre-selected — adjust if needed.'
                  : 'Update what this admin can do in the system.'}
              </p>
              <GovernancePermissionPicker
                groupedPermissions={groupedPermissions}
                selectedIds={editingAdmin.permission_ids}
                onToggle={toggleEditPermission}
                onToggleGroup={(items) =>
                  selectAllInGroup(items, editingAdmin.permission_ids, (permission_ids) =>
                    setEditingAdmin((prev) => (prev ? { ...prev, permission_ids } : prev))
                  )
                }
              />
            </div>

            <div className="sup-modal-foot">
              <button
                type="button"
                className="sup-btn-secondary"
                onClick={closeEditAdmin}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sup-btn-primary sup-btn-primary--inline"
                onClick={handleSaveEdit}
                disabled={!editingAdmin.permission_ids.length || savingEdit}
              >
                {savingEdit
                  ? 'Saving…'
                  : editingAdmin.mode === 'reactivate'
                    ? 'Reactivate admin'
                    : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperuserPortal;
