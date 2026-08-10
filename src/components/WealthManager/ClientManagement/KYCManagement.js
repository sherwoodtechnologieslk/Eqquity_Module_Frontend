import React, { useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import './Styles/KYCManagement.css';

const STATUS_TABS = ['All', 'Verified', 'Under Review', 'Pending', 'Expired', 'Rejected'];

const cases = [
  {
    id: 1,
    client: 'Weerathungage Arani Sehansa',
    code: 'CLT-000128',
    kycRef: 'KYC-2026-128',
    segment: 'Individual',
    risk: 'Medium',
    status: 'Verified',
    lastReview: '2026-03-12',
    nextReview: '2027-03-12',
    owner: 'Compliance Desk',
    docs: [
      { name: 'NIC', status: 'Verified' },
      { name: 'Proof of address', status: 'Verified' },
      { name: 'Source of funds', status: 'Verified' },
      { name: 'Selfie / liveness', status: 'Verified' }
    ]
  },
  {
    id: 2,
    client: 'ePortfolio – Corporate Treasury',
    code: 'CLT-000257',
    kycRef: 'KYC-2026-257',
    segment: 'Corporate',
    risk: 'Low',
    status: 'Under Review',
    lastReview: '2026-07-20',
    nextReview: '2026-08-20',
    owner: 'Corporate Compliance',
    docs: [
      { name: 'Company extract', status: 'Verified' },
      { name: 'UBO declaration', status: 'Under Review' },
      { name: 'Board resolution', status: 'Verified' },
      { name: 'Signatory IDs', status: 'Pending' }
    ]
  },
  {
    id: 3,
    client: 'Family Trust – Growth',
    code: 'CLT-000389',
    kycRef: 'KYC-2026-389',
    segment: 'Trust / Foundation',
    risk: 'Medium',
    status: 'Pending',
    lastReview: '2026-06-01',
    nextReview: '2026-08-01',
    owner: 'Compliance Desk',
    docs: [
      { name: 'Trust deed', status: 'Verified' },
      { name: 'Trustee IDs', status: 'Pending' },
      { name: 'Bank mandate', status: 'Pending' },
      { name: 'Source of funds', status: 'Under Review' }
    ]
  },
  {
    id: 4,
    client: 'Nimal Perera – Retirement',
    code: 'CLT-000441',
    kycRef: 'KYC-2025-441',
    segment: 'Individual',
    risk: 'Low',
    status: 'Expired',
    lastReview: '2025-04-18',
    nextReview: '2026-04-18',
    owner: 'Private Client Desk',
    docs: [
      { name: 'NIC', status: 'Expired' },
      { name: 'Proof of address', status: 'Expired' },
      { name: 'Source of funds', status: 'Verified' },
      { name: 'Risk profile', status: 'Verified' }
    ]
  },
  {
    id: 5,
    client: 'Lanka Logistics PLC – Surplus',
    code: 'CLT-000512',
    kycRef: 'KYC-2026-512',
    segment: 'Corporate',
    risk: 'Medium',
    status: 'Verified',
    lastReview: '2026-01-09',
    nextReview: '2027-01-09',
    owner: 'Corporate Compliance',
    docs: [
      { name: 'Company extract', status: 'Verified' },
      { name: 'UBO declaration', status: 'Verified' },
      { name: 'Board resolution', status: 'Verified' },
      { name: 'AML screening', status: 'Verified' }
    ]
  },
  {
    id: 6,
    client: 'Dias Education Endowment',
    code: 'CLT-000603',
    kycRef: 'KYC-2026-603',
    segment: 'Trust / Foundation',
    risk: 'Low',
    status: 'Verified',
    lastReview: '2025-11-22',
    nextReview: '2026-11-22',
    owner: 'Compliance Desk',
    docs: [
      { name: 'Trust deed', status: 'Verified' },
      { name: 'Trustee IDs', status: 'Verified' },
      { name: 'Bank mandate', status: 'Verified' },
      { name: 'Source of funds', status: 'Verified' }
    ]
  },
  {
    id: 7,
    client: 'S. Fernando – High Net Worth',
    code: 'CLT-000718',
    kycRef: 'KYC-2026-718',
    segment: 'Private Wealth',
    risk: 'High',
    status: 'Under Review',
    lastReview: '2026-07-29',
    nextReview: '2026-08-15',
    owner: 'AML Specialist',
    docs: [
      { name: 'Passport', status: 'Verified' },
      { name: 'Proof of address', status: 'Verified' },
      { name: 'Source of wealth', status: 'Under Review' },
      { name: 'Enhanced due diligence', status: 'Pending' }
    ]
  },
  {
    id: 8,
    client: 'Harbor Insurance – Reserves',
    code: 'CLT-000804',
    kycRef: 'KYC-2026-804',
    segment: 'Institutional',
    risk: 'Low',
    status: 'Verified',
    lastReview: '2026-02-03',
    nextReview: '2027-02-03',
    owner: 'Institutional Desk',
    docs: [
      { name: 'Regulator license', status: 'Verified' },
      { name: 'Board approvals', status: 'Verified' },
      { name: 'Authorized persons', status: 'Verified' },
      { name: 'AML screening', status: 'Verified' }
    ]
  },
  {
    id: 9,
    client: 'Kasun Jayawardena',
    code: 'ONB-2026-014',
    kycRef: 'KYC-2026-914',
    segment: 'Individual',
    risk: 'Medium',
    status: 'Pending',
    lastReview: '—',
    nextReview: '2026-08-10',
    owner: 'Onboarding Desk',
    docs: [
      { name: 'NIC', status: 'Verified' },
      { name: 'Proof of address', status: 'Pending' },
      { name: 'Source of funds', status: 'Pending' },
      { name: 'Risk questionnaire', status: 'Verified' }
    ]
  },
  {
    id: 10,
    client: 'Harbor Staff Provident Fund',
    code: 'ONB-2026-009',
    kycRef: 'KYC-2026-909',
    segment: 'Institutional',
    risk: 'High',
    status: 'Rejected',
    lastReview: '2026-07-05',
    nextReview: '—',
    owner: 'Compliance Desk',
    docs: [
      { name: 'Mandate letter', status: 'Verified' },
      { name: 'Trustee approvals', status: 'Verified' },
      { name: 'Investment policy', status: 'Rejected' },
      { name: 'AML screening', status: 'Rejected' }
    ]
  }
];

const statusPill = (status) => {
  if (status === 'Verified') return 'wmkyc-pill--ok';
  if (status === 'Rejected' || status === 'Expired') return 'wmkyc-pill--bad';
  if (status === 'Under Review') return 'wmkyc-pill--info';
  if (status === 'Pending') return 'wmkyc-pill--warn';
  return 'wmkyc-pill--soft';
};

const riskPill = (risk) => {
  if (risk === 'Low') return 'wmkyc-pill--ok';
  if (risk === 'High') return 'wmkyc-pill--bad';
  return 'wmkyc-pill--warn';
};

const KYCManagement = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchRisk = riskFilter === 'All' || c.risk === riskFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.client.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.kycRef.toLowerCase().includes(q);
      return matchStatus && matchRisk && matchSearch;
    });
  }, [statusFilter, riskFilter, search]);

  const selected =
    filtered.find((c) => c.id === selectedId) ||
    filtered[0] ||
    cases.find((c) => c.id === selectedId) ||
    null;

  const summary = useMemo(() => {
    const by = (s) => cases.filter((c) => c.status === s).length;
    return {
      total: cases.length,
      verified: by('Verified'),
      review: by('Under Review'),
      pending: by('Pending'),
      expired: by('Expired'),
      rejected: by('Rejected'),
      highRisk: cases.filter((c) => c.risk === 'High').length
    };
  }, []);

  const flash = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="wmkyc">
      <WealthPageHeader
        title="KYC Management"
        blurb="Monitor KYC status, document completeness, risk ratings, and renewal dates across wealth clients and onboarding cases."
        actions={
          <>
            <button type="button" className="wmkyc-btn wmkyc-btn--ghost" onClick={() => flash('KYC ageing report exported.')}>
              Export ageing
            </button>
            <button type="button" className="wmkyc-btn wmkyc-btn--solid" onClick={() => flash('Renewal campaign started for expired cases.')}>
              Run renewals
            </button>
          </>
        }
      />

      {toast && <div className="wmkyc-toast" role="status">{toast}</div>}

      <section className="wmkyc-spotlight" aria-label="KYC summary">
        <article className="wmkyc-stat">
          <span className="wmkyc-label">KYC cases</span>
          <strong>{summary.total}</strong>
          <span className="wmkyc-stat__meta">{summary.highRisk} high risk</span>
        </article>
        <article className="wmkyc-stat">
          <span className="wmkyc-label">Verified</span>
          <strong>{summary.verified}</strong>
          <span className="wmkyc-pill wmkyc-pill--ok">Current</span>
        </article>
        <article className="wmkyc-stat">
          <span className="wmkyc-label">Under review</span>
          <strong>{summary.review}</strong>
          <span className="wmkyc-pill wmkyc-pill--info">Compliance queue</span>
        </article>
        <article className="wmkyc-stat">
          <span className="wmkyc-label">Pending</span>
          <strong>{summary.pending}</strong>
          <span className="wmkyc-pill wmkyc-pill--warn">Docs outstanding</span>
        </article>
        <article className="wmkyc-stat">
          <span className="wmkyc-label">Expired / rejected</span>
          <strong>{summary.expired + summary.rejected}</strong>
          <span className="wmkyc-pill wmkyc-pill--bad">Action required</span>
        </article>
      </section>

      <section className="wmkyc-toolbar">
        <div className="wmkyc-tabs" role="tablist" aria-label="KYC status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab}
              className={`wmkyc-tab${statusFilter === tab ? ' is-on' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="wmkyc-toolbar__right">
          <label className="wmkyc-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search client, code, or KYC ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="wmkyc-select">
            <span>Risk</span>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <button
            type="button"
            className="wmkyc-btn wmkyc-btn--ghost"
            onClick={() => {
              setStatusFilter('All');
              setRiskFilter('All');
              setSearch('');
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <div className="wmkyc-board">
        <section className="wmkyc-panel wmkyc-panel--main">
          <div className="wmkyc-panel__head">
            <div>
              <h2>KYC register</h2>
              <p>{filtered.length} matching · select a case for documents and actions</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="wmkyc-empty">No KYC cases match your filters.</div>
          ) : (
            <div className="wmkyc-table-wrap">
              <table className="wmkyc-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>KYC Ref</th>
                    <th>Segment</th>
                    <th>Risk</th>
                    <th>Owner</th>
                    <th>Last review</th>
                    <th>Next review</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={selected?.id === c.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(c.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(c.id);
                        }
                      }}
                    >
                      <td>
                        <div className="wmkyc-entity">
                          <strong>{c.client}</strong>
                          <span>{c.code}</span>
                        </div>
                      </td>
                      <td>{c.kycRef}</td>
                      <td>{c.segment}</td>
                      <td>
                        <span className={`wmkyc-pill ${riskPill(c.risk)}`}>{c.risk}</span>
                      </td>
                      <td>{c.owner}</td>
                      <td>{c.lastReview}</td>
                      <td>{c.nextReview}</td>
                      <td>
                        <span className={`wmkyc-pill ${statusPill(c.status)}`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="wmkyc-side">
          <section className="wmkyc-panel">
            {!selected ? (
              <div className="wmkyc-empty">Select a KYC case to view details.</div>
            ) : (
              <>
                <div className="wmkyc-panel__head">
                  <div>
                    <h2>KYC detail</h2>
                    <p>Document pack, risk rating, and compliance actions.</p>
                  </div>
                </div>

                <div className="wmkyc-detail">
                  <p className="wmkyc-label">Client</p>
                  <strong className="wmkyc-detail__name">{selected.client}</strong>
                  <p className="wmkyc-detail__meta">
                    {selected.code} · {selected.kycRef} · {selected.segment}
                  </p>
                  <div className="wmkyc-detail__chips">
                    <span className={`wmkyc-pill ${statusPill(selected.status)}`}>{selected.status}</span>
                    <span className={`wmkyc-pill ${riskPill(selected.risk)}`}>{selected.risk} risk</span>
                  </div>

                  <dl className="wmkyc-facts">
                    <div>
                      <dt>Owner</dt>
                      <dd>{selected.owner}</dd>
                    </div>
                    <div>
                      <dt>Last review</dt>
                      <dd>{selected.lastReview}</dd>
                    </div>
                    <div>
                      <dt>Next review</dt>
                      <dd>{selected.nextReview}</dd>
                    </div>
                    <div>
                      <dt>Documents</dt>
                      <dd>{selected.docs.length} items</dd>
                    </div>
                  </dl>

                  <h3 className="wmkyc-subhead">Document pack</h3>
                  <ul className="wmkyc-docs">
                    {selected.docs.map((d) => (
                      <li key={d.name}>
                        <span>{d.name}</span>
                        <span className={`wmkyc-pill ${statusPill(d.status)}`}>{d.status}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="wmkyc-detail__actions">
                    <button
                      type="button"
                      className="wmkyc-btn wmkyc-btn--solid"
                      onClick={() => flash(`Document request sent for ${selected.kycRef}.`)}
                    >
                      Request documents
                    </button>
                    <button
                      type="button"
                      className="wmkyc-btn wmkyc-btn--ghost"
                      onClick={() => flash(`${selected.kycRef} marked verified.`)}
                    >
                      Mark verified
                    </button>
                    <button
                      type="button"
                      className="wmkyc-btn wmkyc-btn--ghost"
                      onClick={() => flash(`Renewal workflow opened for ${selected.client}.`)}
                    >
                      Start renewal
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="wmkyc-panel wmkyc-panel--notes">
            <div className="wmkyc-panel__head">
              <div>
                <h2>Compliance notes</h2>
                <p>KYC operating standards for the wealth desk.</p>
              </div>
            </div>
            <ul className="wmkyc-notes">
              <li>Individual KYC renews annually; high-risk clients renew every 6 months.</li>
              <li>Expired identity documents block subscriptions until refreshed.</li>
              <li>Enhanced due diligence is mandatory for High risk Private Wealth cases.</li>
              <li>Rejected packs retain the audit trail and cannot be overwritten in place.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default KYCManagement;
