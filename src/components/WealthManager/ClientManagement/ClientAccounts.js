import React, { useEffect, useMemo, useState } from 'react';
import './Styles/ClientAccounts.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${Math.abs(value).toFixed(2)}%`;

const IconSearch = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M16.2 16.2 21 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconDownload = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 3v10m0 0 4-4m-4 4-4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconPlus = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

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
      products: ['Unit Trust', 'Portfolio Management']
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
      products: ['Unit Trust', 'Treasury Bills', 'Fixed Income']
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
      products: ['Unit Trust']
    }
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

      const matchesStatus =
        statusFilter === 'All' || a.status === statusFilter;

      const matchesSegment =
        segmentFilter === 'All' || a.segment === segmentFilter;

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

    // Keep selection stable; if it disappears due to filters, select the first row.
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

  return (
    <div className="wmca-container">
      {/* Header & filters */}
      <div className="wmca-header-card wmca-header-accent">
        <div className="wmca-header-main">
          <div className="wmca-header-left">
            <div className="wmca-header-label">Client Management</div>
            <h1 className="wmca-header-title">Client Accounts</h1>
            <p className="wmca-header-subtitle">
              View and manage all wealth management client accounts, with
              quick access to their portfolio details.
            </p>
          </div>
          <div className="wmca-header-actions">
            <button
              type="button"
              className="wmca-btn wmca-btn-secondary"
              onClick={() => {}}
            >
              <IconDownload size={18} />
              Export
            </button>
            <button
              type="button"
              className="wmca-btn wmca-btn-primary"
              onClick={() => {}}
            >
              <IconPlus size={18} />
              New Client
            </button>
          </div>
        </div>

        <div className="wmca-metrics-grid">
          <div className="wmca-metric wmca-metric-teal">
            <div className="wmca-metric-label">Total Clients</div>
            <div className="wmca-metric-value">{summary.totalClients}</div>
            <div className="wmca-metric-sub">Across {summary.segments} segments</div>
          </div>
          <div className="wmca-metric wmca-metric-blue">
            <div className="wmca-metric-label">Active Accounts</div>
            <div className="wmca-metric-value">{summary.active}</div>
            <div className="wmca-metric-sub">Currently onboarded</div>
          </div>
          <div className="wmca-metric wmca-metric-amber">
            <div className="wmca-metric-label">Pending KYC</div>
            <div className="wmca-metric-value">{summary.pending}</div>
            <div className="wmca-metric-sub">Action required</div>
          </div>
          <div className="wmca-metric wmca-metric-red">
            <div className="wmca-metric-label">Inactive</div>
            <div className="wmca-metric-value">{summary.inactive}</div>
            <div className="wmca-metric-sub">Dormant / closed</div>
          </div>
          <div className="wmca-metric wmca-metric-purple">
            <div className="wmca-metric-label">AUM (LKR)</div>
            <div className="wmca-metric-value">LKR {formatCurrency(summary.totalAumLkr)}</div>
            <div className="wmca-metric-sub">Local currency total</div>
          </div>
          <div className="wmca-metric wmca-metric-slate">
            <div className="wmca-metric-label">AUM (USD)</div>
            <div className="wmca-metric-value">USD {formatCurrency(summary.totalAumUsd)}</div>
            <div className="wmca-metric-sub">Foreign currency total</div>
          </div>
        </div>

        <div className="wmca-filters-row">
          <div className="wmca-search-wrapper">
            <span className="wmca-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              className="wmca-search-input"
              placeholder="Search by client name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="wmca-clear-btn"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="wmca-filter-group">
            <div className="wmca-filter">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending KYC</option>
              </select>
            </div>
            <div className="wmca-filter">
              <label>Segment</label>
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option>All</option>
                {uniqueSegments.map((seg) => (
                  <option key={seg}>{seg}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="wmca-btn wmca-btn-ghost"
              onClick={clearFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="wmca-main-grid">
        {/* Accounts table */}
        <div className="wmca-card wmca-table-card">
          <div className="wmca-card-header wmca-card-header-row">
            <div>
              <h2>Accounts Overview</h2>
              <p>
                {filteredAccounts.length} accounts matching your filters. Select a
                client to view details.
              </p>
            </div>
            <div className="wmca-header-hint">
              Tip: use search + filters to quickly narrow down results.
            </div>
          </div>

          <div className="wmca-table-wrapper">
            <table className="wmca-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>KYC</th>
                  <th>RM / Team</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th className="wmca-num">Holdings</th>
                  <th className="wmca-num">Balance</th>
                  <th className="wmca-num">AUM</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a) => (
                  <tr
                    key={a.id}
                    className={a.id === selectedAccountId ? 'wmca-row-selected' : ''}
                    onClick={() => setSelectedAccountId(a.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedAccountId(a.id);
                    }}
                  >
                    <td>
                      <div className="wmca-client-cell">
                        <div className="wmca-client-name">{a.clientName}</div>
                        <div className="wmca-client-sub">
                          <span className="wmca-pill wmca-pill-segment">{a.segment}</span>
                          <span className="wmca-pill">{a.currency}</span>
                        </div>
                      </div>
                    </td>
                    <td className="wmca-mono">{a.clientCode}</td>
                    <td>{a.accountType}</td>
                    <td>
                      <span className="wmca-pill wmca-pill-risk">{a.riskProfile}</span>
                    </td>
                    <td>
                      <span
                        className={`wmca-pill wmca-pill-kyc wmca-kyc-${a.kycStatus
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {a.kycStatus}
                      </span>
                    </td>
                    <td>{a.rm}</td>
                    <td>
                      <span
                        className={`wmca-status-pill wmca-status-${a.status
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="wmca-mono">{a.lastActivity}</td>
                    <td className="wmca-num wmca-mono">{a.holdingsCount}</td>
                    <td className="wmca-num wmca-mono">
                      {a.currency} {formatCurrency(a.balance)}
                    </td>
                    <td
                      className={`wmca-num wmca-mono ${a.aumChangePct >= 0 ? 'wmca-pos' : 'wmca-neg'}`}
                    >
                      {formatPct(a.aumChangePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected client detail panel */}
        <div className="wmca-side-column">
          <div className="wmca-card wmca-detail-card">
            <div className="wmca-card-header">
              <h2>Selected Client</h2>
              <p>Quick view and actions for the selected account.</p>
            </div>

            {!selectedAccount ? (
              <div className="wmca-empty-state">
                No client selected. Adjust filters to see results.
              </div>
            ) : (
              <>
                <div className="wmca-detail-hero">
                  <div className="wmca-detail-title">{selectedAccount.clientName}</div>
                  <div className="wmca-detail-sub">
                    <span className="wmca-mono">{selectedAccount.clientCode}</span> •{' '}
                    {selectedAccount.accountType} • {selectedAccount.segment}
                  </div>
                  <div className="wmca-detail-badges">
                    <span
                      className={`wmca-status-pill wmca-status-${selectedAccount.status
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      {selectedAccount.status}
                    </span>
                    <span
                      className={`wmca-pill wmca-pill-kyc wmca-kyc-${selectedAccount.kycStatus
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      KYC: {selectedAccount.kycStatus}
                    </span>
                  </div>
                </div>

                <div className="wmca-detail-grid">
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">Relationship Manager</div>
                    <div className="wmca-detail-value">{selectedAccount.rm}</div>
                  </div>
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">Risk Profile</div>
                    <div className="wmca-detail-value">{selectedAccount.riskProfile}</div>
                  </div>
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">Balance</div>
                    <div className="wmca-detail-value">
                      {selectedAccount.currency} {formatCurrency(selectedAccount.balance)}
                    </div>
                  </div>
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">AUM Change</div>
                    <div
                      className={`wmca-detail-value ${selectedAccount.aumChangePct >= 0 ? 'wmca-pos' : 'wmca-neg'}`}
                    >
                      {formatPct(selectedAccount.aumChangePct)}
                    </div>
                  </div>
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">Email</div>
                    <div className="wmca-detail-value">{selectedAccount.email}</div>
                  </div>
                  <div className="wmca-detail-item">
                    <div className="wmca-detail-label">Phone</div>
                    <div className="wmca-detail-value">{selectedAccount.phone}</div>
                  </div>
                </div>

                <div className="wmca-products">
                  <div className="wmca-products-title">Enrolled Products</div>
                  <div className="wmca-products-tags">
                    {selectedAccount.products.map((p) => (
                      <span key={p} className="wmca-tag">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="wmca-detail-actions">
                  <button type="button" className="wmca-btn wmca-btn-primary" onClick={() => {}}>
                    Open Client Portfolio
                  </button>
                  <button type="button" className="wmca-btn wmca-btn-secondary" onClick={() => {}}>
                    Message Client
                  </button>
                  <button type="button" className="wmca-btn wmca-btn-ghost" onClick={() => {}}>
                    Download KYC
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="wmca-card wmca-ops-card">
            <div className="wmca-card-header">
              <h2>Ops Checklist</h2>
              <p>Common steps for onboarding and maintenance.</p>
            </div>

            <ul className="wmca-checklist">
              <li>
                <span className="wmca-check-bullet wmca-check-teal" />
                Verify KYC and documentation
              </li>
              <li>
                <span className="wmca-check-bullet wmca-check-blue" />
                Confirm product enrollment and mandates
              </li>
              <li>
                <span className="wmca-check-bullet wmca-check-amber" />
                Review suitability / risk profile alignment
              </li>
              <li>
                <span className="wmca-check-bullet wmca-check-purple" />
                Schedule review meeting / quarterly update
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAccounts;

