import React, { useEffect, useMemo, useState } from 'react';
import './Styles/ClientAccounts.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${Math.abs(value).toFixed(2)}%`;

const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
    <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconDownload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const statusClass = (status) =>
  `wca-badge wca-badge--${status.toLowerCase().replace(/\s+/g, '-')}`;

const kycClass = (kyc) =>
  `wca-badge wca-badge--kyc-${kyc.toLowerCase().replace(/\s+/g, '-')}`;

const ClientAccounts = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const [accounts] = useState([
    {
      id: 1,
      clientName: 'Weerathungage Arani Sehansa',
      clientCode: 'CLT-000128',
      accountType: 'Individual',
      segment: 'Individual',
      status: 'Active',
      rm: 'Sherwood Wealth Team',
      openedDate: '2022-07-15',
      lastActivity: '2025-12-18',
      currency: 'LKR',
      balance: 502_000_000,
      holdingsCount: 4,
      riskProfile: 'Moderate Growth',
      kycStatus: 'Verified',
      aumChangePct: 7.26,
      email: 'arani.sehansa@email.com',
      phone: '+94 77 123 4567',
      products: ['Unit Trust', 'Portfolio Management'],
    },
    {
      id: 2,
      clientName: 'Omega Holdings (Pvt) Ltd',
      clientCode: 'CLT-000257',
      accountType: 'Corporate',
      segment: 'Treasury',
      status: 'Active',
      rm: 'Corporate Coverage',
      openedDate: '2021-03-10',
      lastActivity: '2025-12-20',
      currency: 'LKR',
      balance: 890_000_000,
      holdingsCount: 7,
      riskProfile: 'Balanced Income',
      kycStatus: 'Verified',
      aumChangePct: 5.33,
      email: 'treasury@omega.lk',
      phone: '+94 11 234 5678',
      products: ['Unit Trust', 'Treasury Bills', 'Fixed Income'],
    },
    {
      id: 3,
      clientName: 'Client 3',
      clientCode: 'CLT-000389',
      accountType: 'Trust',
      segment: 'Private Wealth',
      status: 'Pending KYC',
      rm: 'Sherwood Wealth Team',
      openedDate: '2025-01-05',
      lastActivity: '2025-12-10',
      currency: 'LKR',
      balance: 325_000_000,
      holdingsCount: 3,
      riskProfile: 'Aggressive Growth',
      kycStatus: 'Pending',
      aumChangePct: 16.07,
      email: 'admin@sunrisetrust.org',
      phone: '+94 76 555 1020',
      products: ['Unit Trust'],
    },
  ]);

  const summary = useMemo(() => {
    const totalClients = accounts.length;
    const active = accounts.filter((a) => a.status === 'Active').length;
    const pending = accounts.filter((a) => a.status === 'Pending KYC').length;
    const inactive = accounts.filter((a) => a.status === 'Inactive').length;
    const segments = new Set(accounts.map((a) => a.segment)).size;
    const totalAumLkr = accounts
      .filter((a) => a.currency === 'LKR')
      .reduce((sum, a) => sum + a.balance, 0);
    const totalAumUsd = accounts
      .filter((a) => a.currency === 'USD')
      .reduce((sum, a) => sum + a.balance, 0);
    return { totalClients, active, pending, inactive, segments, totalAumLkr, totalAumUsd };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        !search ||
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.clientCode.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchesSegment = segmentFilter === 'All' || a.segment === segmentFilter;
      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [accounts, search, statusFilter, segmentFilter]);

  const uniqueSegments = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.segment))),
    [accounts]
  );

  useEffect(() => {
    if (!filteredAccounts.length) {
      setSelectedAccountId(null);
      return;
    }
    const stillExists = filteredAccounts.some((a) => a.id === selectedAccountId);
    if (!stillExists) setSelectedAccountId(filteredAccounts[0].id);
  }, [filteredAccounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setSegmentFilter('All');
  };

  const statusTabs = ['All', 'Active', 'Pending KYC', 'Inactive'];

  return (
    <div className="wca">
      <header className="wca-top">
        <div className="wca-top__copy">
          <p className="wca-eyebrow">Client Management</p>
          <h1 className="wca-title">Client Accounts</h1>
          <p className="wca-sub">
            View and manage all wealth management client accounts, with quick access to their
            portfolio details.
          </p>
        </div>
        <div className="wca-top__actions">
          <button type="button" className="wca-btn wca-btn--ghost" onClick={() => {}}>
            <IconDownload />
            Export
          </button>
          <button type="button" className="wca-btn wca-btn--solid" onClick={() => {}}>
            <IconPlus />
            New Client
          </button>
        </div>
      </header>

      <section className="wca-strip" aria-label="Account summary">
        <article className="wca-aum">
          <span className="wca-k">AUM (LKR)</span>
          <strong>LKR {formatCurrency(summary.totalAumLkr)}</strong>
          <span className="wca-m">Local currency total</span>
        </article>
        <div className="wca-strip__stats">
          <article>
            <span className="wca-k">Total clients</span>
            <strong>{summary.totalClients}</strong>
            <span className="wca-m">Across {summary.segments} segments</span>
          </article>
          <article>
            <span className="wca-k">Active</span>
            <strong>{summary.active}</strong>
            <span className="wca-m">Currently onboarded</span>
          </article>
          <article>
            <span className="wca-k">Pending KYC</span>
            <strong>{summary.pending}</strong>
            <span className="wca-m">Action required</span>
          </article>
          <article>
            <span className="wca-k">Inactive</span>
            <strong>{summary.inactive}</strong>
            <span className="wca-m">Dormant / closed</span>
          </article>
          <article>
            <span className="wca-k">AUM (USD)</span>
            <strong>USD {formatCurrency(summary.totalAumUsd)}</strong>
            <span className="wca-m">Foreign currency total</span>
          </article>
        </div>
      </section>

      <section className="wca-toolbar">
        <div className="wca-tabs" role="tablist" aria-label="Status filter">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab}
              className={`wca-tab${statusFilter === tab ? ' is-on' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="wca-toolbar__right">
          <label className="wca-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="wca-select">
            <span>Segment</span>
            <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
              <option>All</option>
              {uniqueSegments.map((seg) => (
                <option key={seg}>{seg}</option>
              ))}
            </select>
          </label>
          <button type="button" className="wca-btn wca-btn--ghost" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </section>

      <div className="wca-stage">
        <section className="wca-list" aria-label="Accounts overview">
          <header className="wca-list__head">
            <div>
              <h2>Accounts</h2>
              <p>
                {filteredAccounts.length} matching · select a client for details
              </p>
            </div>
          </header>

          {filteredAccounts.length === 0 ? (
            <div className="wca-empty">No accounts match your filters.</div>
          ) : (
            <ul className="wca-cards">
              {filteredAccounts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`wca-card${a.id === selectedAccountId ? ' is-selected' : ''}`}
                    onClick={() => setSelectedAccountId(a.id)}
                  >
                    <div className="wca-card__top">
                      <div className="wca-card__id">
                        <strong>{a.clientName}</strong>
                        <span>
                          {a.clientCode} · {a.accountType}
                        </span>
                      </div>
                      <span className={statusClass(a.status)}>{a.status}</span>
                    </div>

                    <div className="wca-card__meta">
                      <span>{a.segment}</span>
                      <span>{a.riskProfile}</span>
                      <span className={kycClass(a.kycStatus)}>KYC {a.kycStatus}</span>
                    </div>

                    <div className="wca-card__foot">
                      <div>
                        <em>Balance</em>
                        <b>
                          {a.currency} {formatCurrency(a.balance)}
                        </b>
                      </div>
                      <div>
                        <em>Holdings</em>
                        <b>{a.holdingsCount}</b>
                      </div>
                      <div>
                        <em>AUM Δ</em>
                        <b className={a.aumChangePct >= 0 ? 'is-up' : 'is-down'}>
                          {formatPct(a.aumChangePct)}
                        </b>
                      </div>
                      <div>
                        <em>Last activity</em>
                        <b>{a.lastActivity}</b>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="wca-detail" aria-label="Selected client">
          {!selectedAccount ? (
            <div className="wca-empty wca-empty--panel">
              No client selected. Adjust filters to see results.
            </div>
          ) : (
            <>
              <div className="wca-detail__hero">
                <p className="wca-eyebrow">Selected client</p>
                <h2>{selectedAccount.clientName}</h2>
                <p>
                  {selectedAccount.clientCode} · {selectedAccount.accountType} ·{' '}
                  {selectedAccount.segment}
                </p>
                <div className="wca-detail__badges">
                  <span className={statusClass(selectedAccount.status)}>
                    {selectedAccount.status}
                  </span>
                  <span className={kycClass(selectedAccount.kycStatus)}>
                    KYC: {selectedAccount.kycStatus}
                  </span>
                </div>
              </div>

              <dl className="wca-facts">
                <div>
                  <dt>Relationship Manager</dt>
                  <dd>{selectedAccount.rm}</dd>
                </div>
                <div>
                  <dt>Risk Profile</dt>
                  <dd>{selectedAccount.riskProfile}</dd>
                </div>
                <div>
                  <dt>Balance</dt>
                  <dd>
                    {selectedAccount.currency} {formatCurrency(selectedAccount.balance)}
                  </dd>
                </div>
                <div>
                  <dt>AUM Change</dt>
                  <dd className={selectedAccount.aumChangePct >= 0 ? 'is-up' : 'is-down'}>
                    {formatPct(selectedAccount.aumChangePct)}
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{selectedAccount.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{selectedAccount.phone}</dd>
                </div>
                <div>
                  <dt>Opened</dt>
                  <dd>{selectedAccount.openedDate}</dd>
                </div>
                <div>
                  <dt>Last activity</dt>
                  <dd>{selectedAccount.lastActivity}</dd>
                </div>
              </dl>

              <div className="wca-products">
                <h3>Enrolled products</h3>
                <div>
                  {selectedAccount.products.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                </div>
              </div>

              <div className="wca-detail__actions">
                <button type="button" className="wca-btn wca-btn--solid" onClick={() => {}}>
                  Open Client Portfolio
                </button>
                <button type="button" className="wca-btn wca-btn--ghost" onClick={() => {}}>
                  Message Client
                </button>
                <button type="button" className="wca-btn wca-btn--ghost" onClick={() => {}}>
                  Download KYC
                </button>
              </div>

              <div className="wca-ops">
                <h3>Ops checklist</h3>
                <ul>
                  <li>Verify KYC and documentation</li>
                  <li>Confirm product enrollment and mandates</li>
                  <li>Review suitability / risk profile alignment</li>
                  <li>Schedule review meeting / quarterly update</li>
                </ul>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ClientAccounts;
