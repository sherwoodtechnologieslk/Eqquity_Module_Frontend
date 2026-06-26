import React, { useCallback, useEffect, useState } from 'react';
import { governanceService } from '../../services/governanceApi';
import './AdminGovernancePortal.css';

const EVENT_LABELS = {
  COMPANY_MIGRATED: 'Company migrated',
  ADMIN_CREATED: 'Admin created',
  ADMIN_REVOKED: 'Admin revoked',
  ADMIN_REACTIVATED: 'Admin reactivated',
  ADMIN_PERMISSIONS_UPDATED: 'Admin permissions updated',
  ADMIN_GOVERNANCE_REQUEST_CREATED: 'Superuser request submitted',
  ADMIN_GOVERNANCE_REQUEST_APPROVED: 'Superuser request approved',
  ADMIN_GOVERNANCE_REQUEST_REJECTED: 'Superuser request rejected',
  USER_REQUEST_CREATED: 'User request created',
  USER_REQUEST_APPROVED: 'User request approved',
  USER_REQUEST_REJECTED: 'User request rejected',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
  PASSWORD_RESET_OTP_FAILED: 'Password reset code failed',
  PASSWORD_RESET_OTP_LOCKED: 'Password reset code locked',
  PASSWORD_RESET_COMPLETED: 'Password reset completed',
  PASSWORD_CHANGE_REQUESTED: 'Password change requested',
  PASSWORD_CHANGE_OTP_FAILED: 'Password change code failed',
  PASSWORD_CHANGE_OTP_LOCKED: 'Password change code locked',
  PASSWORD_CHANGED: 'Password changed',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatActor(event) {
  if (!event.actor_email) return 'System';
  const name = `${event.actor_first_name || ''} ${event.actor_last_name || ''}`.trim();
  const role = event.actor_company_role ? ` (${event.actor_company_role.replace('_', ' ')})` : '';
  return `${name || event.actor_email}${role}`;
}

function formatPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const parts = [];
  if (payload.email) parts.push(`User: ${payload.email}`);
  if (payload.action_type) parts.push(`Action: ${payload.action_type}`);
  if (payload.rejection_reason) parts.push(`Reason: ${payload.rejection_reason}`);
  if (payload.via) parts.push(`Via: ${payload.via.replace(/_/g, ' ')}`);
  if (payload.reason && !payload.rejection_reason) {
    parts.push(`Reason: ${payload.reason.replace(/_/g, ' ')}`);
  }
  if (payload.attempts_remaining != null) parts.push(`Attempts left: ${payload.attempts_remaining}`);
  if (payload.email_delivery) parts.push(`Email: ${payload.email_delivery.replace(/_/g, ' ')}`);
  return parts.length ? parts.join(' · ') : JSON.stringify(payload);
}

const PAGE_SIZE = 15;

const GovernanceActivityLog = ({ company }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const pageIndex = Math.min(page, totalPages - 1);
  const pageStart = pageIndex * PAGE_SIZE;
  const pageEvents = events.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = events.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, events.length);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await governanceService.listAuditEvents(200);
      setEvents(res.data.events || []);
      setPage(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="agp-root">
      <header className="agp-page-header">
        <div className="agp-header-main">
          <div className="agp-header-icon" aria-hidden>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="agp-header-text">
            <h1>Activity Log</h1>
            <p>
              Governance audit trail for <strong>{company?.company_name || 'your company'}</strong>
            </p>
          </div>
        </div>
        <div className="agp-header-stats">
          <div className="agp-stat">
            <span className="agp-stat-value">{events.length}</span>
            <span className="agp-stat-label">Total events</span>
          </div>
        </div>
      </header>

      <div className="agp-context-bar agp-context-bar--plain">
        <p className="agp-workflow-hint">
          Superuser actions, admin user requests, password security events, and company owner approvals are recorded here.
        </p>
      </div>

      {error && <div className="agp-alert agp-alert--error" role="alert">{error}</div>}

      {loading ? (
        <div className="agp-loading">
          <div className="agp-spinner" />
          <span>Loading activity log…</span>
        </div>
      ) : (
        <section className="agp-panel agp-panel--list">
          <div className="agp-panel-head">
            <h2>Recent events</h2>
            <p>Chronological record of governance activity.</p>
          </div>

          {events.length === 0 ? (
            <div className="agp-empty">
              <h3>No events yet</h3>
              <p>Governance actions will appear here as they occur.</p>
            </div>
          ) : (
            <>
              <ul className="agp-request-list agp-activity-list">
                {pageEvents.map((event) => (
                  <li key={event.id} className="agp-request-item agp-activity-item">
                    <div className="agp-request-main">
                      <div className="agp-request-top">
                        <strong>{EVENT_LABELS[event.event_type] || event.event_type}</strong>
                        <span className="agp-tag">{event.entity_type}</span>
                      </div>
                      <div className="agp-request-meta">
                        <span>{formatActor(event)}</span>
                      </div>
                      {formatPayload(event.payload) && (
                        <p className="agp-reviewed-by">{formatPayload(event.payload)}</p>
                      )}
                    </div>
                    <time className="agp-activity-time" dateTime={event.created_at}>
                      {formatDate(event.created_at)}
                    </time>
                  </li>
                ))}
              </ul>

              {events.length > PAGE_SIZE && (
                <div className="agp-activity-pagination">
                  <button
                    type="button"
                    className="agp-pagination-btn"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={pageIndex === 0}
                  >
                    Previous
                  </button>
                  <span className="agp-pagination-meta">
                    Showing {showingFrom}–{showingTo} of {events.length} · Page {pageIndex + 1} of{' '}
                    {totalPages}
                  </span>
                  <button
                    type="button"
                    className="agp-pagination-btn"
                    onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default GovernanceActivityLog;
