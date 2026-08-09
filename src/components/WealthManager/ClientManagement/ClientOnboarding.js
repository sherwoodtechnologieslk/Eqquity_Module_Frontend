import React, { useMemo, useState } from 'react';
import './Styles/ClientOnboarding.css';

const STATUS_TABS = ['All', 'New Lead', 'Documents Pending', 'Under Review', 'Approved', 'Rejected'];

const applications = [
  {
    id: 1,
    applicant: 'Kasun Jayawardena',
    code: 'ONB-2026-014',
    segment: 'Individual',
    channel: 'Branch',
    owner: 'Private Client Desk',
    submitted: '2026-07-28',
    status: 'Documents Pending',
    progress: 45,
    product: 'Unit Trust + Discretionary',
    email: 'kasun.j@email.com',
    phone: '+94 77 441 2201',
    checklist: [
      { label: 'Application form', done: true },
      { label: 'NIC / Passport', done: true },
      { label: 'Proof of address', done: false },
      { label: 'Source of funds', done: false },
      { label: 'Risk questionnaire', done: true }
    ]
  },
  {
    id: 2,
    applicant: 'Ceylon Spice Exports (Pvt) Ltd',
    code: 'ONB-2026-015',
    segment: 'Corporate',
    channel: 'Relationship Manager',
    owner: 'Corporate Coverage',
    submitted: '2026-07-22',
    status: 'Under Review',
    progress: 78,
    product: 'Corporate Treasury UT',
    email: 'treasury@ceylonspice.lk',
    phone: '+94 11 255 8800',
    checklist: [
      { label: 'Board resolution', done: true },
      { label: 'Company extract', done: true },
      { label: 'UBO declaration', done: true },
      { label: 'Authorized signatories', done: true },
      { label: 'Compliance clearance', done: false }
    ]
  },
  {
    id: 3,
    applicant: 'Perera Family Education Trust',
    code: 'ONB-2026-011',
    segment: 'Trust / Foundation',
    channel: 'Client Portal',
    owner: 'Sherwood Wealth Team',
    submitted: '2026-07-12',
    status: 'Approved',
    progress: 100,
    product: 'Growth Unit Trust',
    email: 'trustee@pereratrust.org',
    phone: '+94 76 112 3344',
    checklist: [
      { label: 'Trust deed', done: true },
      { label: 'Trustee IDs', done: true },
      { label: 'Bank mandate', done: true },
      { label: 'KYC pack', done: true },
      { label: 'Account activation', done: true }
    ]
  },
  {
    id: 4,
    applicant: 'Amaya Fernando',
    code: 'ONB-2026-018',
    segment: 'Private Wealth',
    channel: 'Referral',
    owner: 'Private Client Desk',
    submitted: '2026-08-01',
    status: 'New Lead',
    progress: 15,
    product: 'Private Wealth Mandate',
    email: 'amaya.f@email.com',
    phone: '+94 71 900 4412',
    checklist: [
      { label: 'Discovery call', done: true },
      { label: 'Application form', done: false },
      { label: 'Identity documents', done: false },
      { label: 'Risk questionnaire', done: false },
      { label: 'Funding instructions', done: false }
    ]
  },
  {
    id: 5,
    applicant: 'Harbor Staff Provident Fund',
    code: 'ONB-2026-009',
    segment: 'Institutional',
    channel: 'Institutional Desk',
    owner: 'Institutional Desk',
    submitted: '2026-06-30',
    status: 'Rejected',
    progress: 60,
    product: 'Fixed Income UT',
    email: 'ops@harborins.lk',
    phone: '+94 11 700 1200',
    checklist: [
      { label: 'Mandate letter', done: true },
      { label: 'Trustee approvals', done: true },
      { label: 'AML screening', done: true },
      { label: 'Investment policy', done: false },
      { label: 'Final compliance sign-off', done: false }
    ]
  },
  {
    id: 6,
    applicant: 'Ruwani Silva',
    code: 'ONB-2026-016',
    segment: 'Individual',
    channel: 'Client Portal',
    owner: 'Sherwood Wealth Team',
    submitted: '2026-07-25',
    status: 'Under Review',
    progress: 82,
    product: 'Balanced Unit Trust',
    email: 'ruwani.s@email.com',
    phone: '+94 75 333 7788',
    checklist: [
      { label: 'Application form', done: true },
      { label: 'NIC / Passport', done: true },
      { label: 'Proof of address', done: true },
      { label: 'Source of funds', done: true },
      { label: 'Compliance clearance', done: false }
    ]
  },
  {
    id: 7,
    applicant: 'Island Hotels Group Treasury',
    code: 'ONB-2026-017',
    segment: 'Corporate',
    channel: 'Relationship Manager',
    owner: 'Corporate Coverage',
    submitted: '2026-07-30',
    status: 'Documents Pending',
    progress: 52,
    product: 'Money Market + Bond UT',
    email: 'treasury@islandhotels.lk',
    phone: '+94 11 249 5000',
    checklist: [
      { label: 'Board resolution', done: true },
      { label: 'Company extract', done: true },
      { label: 'UBO declaration', done: false },
      { label: 'Authorized signatories', done: true },
      { label: 'Bank details', done: false }
    ]
  },
  {
    id: 8,
    applicant: 'D. Wijesinghe – Retirement',
    code: 'ONB-2026-012',
    segment: 'Individual',
    channel: 'Branch',
    owner: 'Private Client Desk',
    submitted: '2026-07-08',
    status: 'Approved',
    progress: 100,
    product: 'Conservative Income UT',
    email: 'd.wijesinghe@email.com',
    phone: '+94 77 210 9981',
    checklist: [
      { label: 'Application form', done: true },
      { label: 'Identity documents', done: true },
      { label: 'Proof of address', done: true },
      { label: 'Risk questionnaire', done: true },
      { label: 'Account activation', done: true }
    ]
  }
];

const statusPill = (status) => {
  if (status === 'Approved') return 'wmco-pill--ok';
  if (status === 'Rejected') return 'wmco-pill--bad';
  if (status === 'Under Review') return 'wmco-pill--info';
  if (status === 'Documents Pending') return 'wmco-pill--warn';
  return 'wmco-pill--soft';
};

const ClientOnboarding = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(applications[0].id);
  const [toast, setToast] = useState('');

  const segments = useMemo(
    () => Array.from(new Set(applications.map((a) => a.segment))),
    []
  );

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchSegment = segmentFilter === 'All' || a.segment === segmentFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.applicant.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.product.toLowerCase().includes(q);
      return matchStatus && matchSegment && matchSearch;
    });
  }, [statusFilter, segmentFilter, search]);

  const selected =
    filtered.find((a) => a.id === selectedId) ||
    filtered[0] ||
    applications.find((a) => a.id === selectedId) ||
    null;

  const summary = useMemo(() => {
    const by = (s) => applications.filter((a) => a.status === s).length;
    return {
      total: applications.length,
      newLead: by('New Lead'),
      docs: by('Documents Pending'),
      review: by('Under Review'),
      approved: by('Approved'),
      rejected: by('Rejected')
    };
  }, []);

  const flash = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="wmco">
      <header className="wmco-rail">
        <div className="wmco-rail__brand">
          <div>
            <p className="wmco-rail__eyebrow">Sherwood Wealth</p>
            <h1 className="wmco-rail__title">Client Onboarding</h1>
            <p className="wmco-rail__blurb">
              Track new wealth applications from lead capture through documentation,
              compliance review, and account activation.
            </p>
          </div>
        </div>
        <div className="wmco-rail__actions">
          <button type="button" className="wmco-btn wmco-btn--ghost" onClick={() => flash('Onboarding pack template downloaded.')}>
            Download pack
          </button>
          <button type="button" className="wmco-btn wmco-btn--solid" onClick={() => flash('New onboarding case started.')}>
            New application
          </button>
        </div>
      </header>

      {toast && <div className="wmco-toast" role="status">{toast}</div>}

      <section className="wmco-spotlight" aria-label="Onboarding pipeline">
        <article className="wmco-stat">
          <span className="wmco-label">Pipeline</span>
          <strong>{summary.total}</strong>
          <span className="wmco-stat__meta">Open + closed cases</span>
        </article>
        <article className="wmco-stat">
          <span className="wmco-label">New leads</span>
          <strong>{summary.newLead}</strong>
          <span className="wmco-pill wmco-pill--soft">Intake</span>
        </article>
        <article className="wmco-stat">
          <span className="wmco-label">Docs pending</span>
          <strong>{summary.docs}</strong>
          <span className="wmco-pill wmco-pill--warn">Action needed</span>
        </article>
        <article className="wmco-stat">
          <span className="wmco-label">Under review</span>
          <strong>{summary.review}</strong>
          <span className="wmco-pill wmco-pill--info">Compliance</span>
        </article>
        <article className="wmco-stat">
          <span className="wmco-label">Approved</span>
          <strong>{summary.approved}</strong>
          <span className="wmco-pill wmco-pill--ok">Ready to fund</span>
        </article>
      </section>

      <section className="wmco-toolbar">
        <div className="wmco-tabs" role="tablist" aria-label="Status filter">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab}
              className={`wmco-tab${statusFilter === tab ? ' is-on' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="wmco-toolbar__right">
          <label className="wmco-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search applicant, code, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="wmco-select">
            <span>Segment</span>
            <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
              <option value="All">All</option>
              {segments.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="wmco-btn wmco-btn--ghost"
            onClick={() => {
              setStatusFilter('All');
              setSegmentFilter('All');
              setSearch('');
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <div className="wmco-board">
        <section className="wmco-panel wmco-panel--main">
          <div className="wmco-panel__head">
            <div>
              <h2>Onboarding cases</h2>
              <p>{filtered.length} matching · select a case for checklist and actions</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="wmco-empty">No applications match your filters.</div>
          ) : (
            <div className="wmco-table-wrap">
              <table className="wmco-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Segment</th>
                    <th>Product</th>
                    <th>Channel</th>
                    <th>Owner</th>
                    <th>Submitted</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className={selected?.id === a.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(a.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(a.id);
                        }
                      }}
                    >
                      <td>
                        <div className="wmco-entity">
                          <strong>{a.applicant}</strong>
                          <span>{a.code}</span>
                        </div>
                      </td>
                      <td>{a.segment}</td>
                      <td>{a.product}</td>
                      <td>{a.channel}</td>
                      <td>{a.owner}</td>
                      <td>{a.submitted}</td>
                      <td>
                        <div className="wmco-progress">
                          <div className="wmco-progress__track">
                            <div className="wmco-progress__fill" style={{ width: `${a.progress}%` }} />
                          </div>
                          <span>{a.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`wmco-pill ${statusPill(a.status)}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="wmco-side">
          <section className="wmco-panel">
            {!selected ? (
              <div className="wmco-empty">Select an application to view details.</div>
            ) : (
              <>
                <div className="wmco-panel__head">
                  <div>
                    <h2>Case detail</h2>
                    <p>Checklist, contacts, and desk actions for this application.</p>
                  </div>
                </div>

                <div className="wmco-detail">
                  <p className="wmco-label">Applicant</p>
                  <strong className="wmco-detail__name">{selected.applicant}</strong>
                  <p className="wmco-detail__meta">
                    {selected.code} · {selected.segment} · {selected.channel}
                  </p>
                  <div className="wmco-detail__chips">
                    <span className={`wmco-pill ${statusPill(selected.status)}`}>{selected.status}</span>
                    <span className="wmco-pill wmco-pill--soft">{selected.product}</span>
                  </div>

                  <dl className="wmco-facts">
                    <div>
                      <dt>Owner</dt>
                      <dd>{selected.owner}</dd>
                    </div>
                    <div>
                      <dt>Submitted</dt>
                      <dd>{selected.submitted}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selected.email}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{selected.phone}</dd>
                    </div>
                  </dl>

                  <h3 className="wmco-subhead">Onboarding checklist</h3>
                  <ul className="wmco-check">
                    {selected.checklist.map((item) => (
                      <li key={item.label} className={item.done ? 'is-done' : ''}>
                        <span>{item.done ? '✓' : '○'}</span>
                        {item.label}
                      </li>
                    ))}
                  </ul>

                  <div className="wmco-detail__actions">
                    <button
                      type="button"
                      className="wmco-btn wmco-btn--solid"
                      onClick={() => flash(`Reminder sent to ${selected.applicant}.`)}
                    >
                      Request documents
                    </button>
                    <button
                      type="button"
                      className="wmco-btn wmco-btn--ghost"
                      onClick={() => flash(`Case ${selected.code} moved to compliance review.`)}
                    >
                      Send to review
                    </button>
                    <button
                      type="button"
                      className="wmco-btn wmco-btn--ghost"
                      onClick={() => flash(`Activation pack prepared for ${selected.code}.`)}
                    >
                      Activate account
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="wmco-panel wmco-panel--notes">
            <div className="wmco-panel__head">
              <div>
                <h2>Desk playbook</h2>
                <p>Standard onboarding controls for Sherwood Wealth.</p>
              </div>
            </div>
            <ul className="wmco-notes">
              <li>Identity and address evidence must be dated within the last 3 months.</li>
              <li>Corporate cases require UBO declaration before compliance clearance.</li>
              <li>Approved cases move to Client Accounts with LKR as base currency.</li>
              <li>Rejected cases keep the audit trail and may re-enter as a new lead.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ClientOnboarding;
