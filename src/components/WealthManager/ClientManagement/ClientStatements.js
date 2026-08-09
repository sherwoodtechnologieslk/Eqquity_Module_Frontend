import React, { useMemo, useState } from 'react';
import './Styles/ClientStatements.css';

const clients = [
  { id: 1, name: 'Weerathungage Arani Sehansa', code: 'CLT-000128', segment: 'Individual' },
  { id: 2, name: 'ePortfolio – Corporate Treasury', code: 'CLT-000257', segment: 'Corporate' },
  { id: 3, name: 'Family Trust – Growth', code: 'CLT-000389', segment: 'Trust / Foundation' },
  { id: 4, name: 'Nimal Perera – Retirement', code: 'CLT-000441', segment: 'Individual' },
  { id: 5, name: 'Lanka Logistics PLC – Surplus', code: 'CLT-000512', segment: 'Corporate' },
  { id: 6, name: 'Dias Education Endowment', code: 'CLT-000603', segment: 'Trust / Foundation' },
  { id: 7, name: 'S. Fernando – High Net Worth', code: 'CLT-000718', segment: 'Private Wealth' },
  { id: 8, name: 'Harbor Insurance – Reserves', code: 'CLT-000804', segment: 'Institutional' }
];

const seedStatements = [
  { id: 1, clientId: 1, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '2.4 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 2, clientId: 1, type: 'Monthly', period: 'May 2026', issued: '2026-06-01', format: 'PDF', size: '2.3 MB', status: 'Available', delivery: 'Portal' },
  { id: 3, clientId: 1, type: 'Quarterly', period: 'Q2 2026', issued: '2026-07-05', format: 'PDF', size: '5.1 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 4, clientId: 1, type: 'Tax', period: 'FY 2025/26', issued: '2026-04-10', format: 'PDF', size: '1.4 MB', status: 'Available', delivery: 'Portal' },
  { id: 5, clientId: 2, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '3.1 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 6, clientId: 2, type: 'Quarterly', period: 'Q2 2026', issued: '2026-07-05', format: 'PDF', size: '6.8 MB', status: 'Generating', delivery: 'Pending' },
  { id: 7, clientId: 3, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '2.0 MB', status: 'Available', delivery: 'Portal' },
  { id: 8, clientId: 3, type: 'Annual', period: '2025', issued: '2026-02-15', format: 'PDF', size: '11.2 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 9, clientId: 4, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '1.8 MB', status: 'Available', delivery: 'Email' },
  { id: 10, clientId: 4, type: 'Tax', period: 'FY 2025/26', issued: '2026-04-12', format: 'PDF', size: '1.1 MB', status: 'Available', delivery: 'Portal' },
  { id: 11, clientId: 5, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '4.2 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 12, clientId: 5, type: 'Quarterly', period: 'Q2 2026', issued: '2026-07-06', format: 'PDF', size: '7.5 MB', status: 'Available', delivery: 'Portal' },
  { id: 13, clientId: 6, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '2.6 MB', status: 'Failed', delivery: 'Retry needed' },
  { id: 14, clientId: 6, type: 'Annual', period: '2025', issued: '2026-02-20', format: 'PDF', size: '9.4 MB', status: 'Available', delivery: 'Portal' },
  { id: 15, clientId: 7, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '3.8 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 16, clientId: 7, type: 'Quarterly', period: 'Q2 2026', issued: '2026-07-05', format: 'PDF', size: '8.1 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 17, clientId: 8, type: 'Monthly', period: 'June 2026', issued: '2026-07-01', format: 'PDF', size: '5.6 MB', status: 'Available', delivery: 'SFTP' },
  { id: 18, clientId: 8, type: 'Quarterly', period: 'Q2 2026', issued: '2026-07-07', format: 'PDF', size: '10.2 MB', status: 'Generating', delivery: 'Pending' },
  { id: 19, clientId: 2, type: 'Annual', period: '2025', issued: '2026-02-18', format: 'PDF', size: '14.0 MB', status: 'Available', delivery: 'Portal + Email' },
  { id: 20, clientId: 8, type: 'Tax', period: 'FY 2025/26', issued: '2026-04-15', format: 'PDF', size: '2.0 MB', status: 'Available', delivery: 'SFTP' }
];

const TYPE_TABS = ['All', 'Monthly', 'Quarterly', 'Annual', 'Tax'];

const ClientStatements = () => {
  const [clientFilter, setClientFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(seedStatements[0].id);
  const [toast, setToast] = useState('');

  const statements = useMemo(
    () =>
      seedStatements.map((s) => {
        const client = clients.find((c) => c.id === s.clientId);
        return {
          ...s,
          clientName: client?.name || '—',
          clientCode: client?.code || '—',
          segment: client?.segment || '—'
        };
      }),
    []
  );

  const filtered = useMemo(() => {
    return statements.filter((s) => {
      const matchClient =
        clientFilter === 'All' || String(s.clientId) === String(clientFilter);
      const matchType = typeFilter === 'All' || s.type === typeFilter;
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.clientName.toLowerCase().includes(q) ||
        s.clientCode.toLowerCase().includes(q) ||
        s.period.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q);
      return matchClient && matchType && matchStatus && matchSearch;
    });
  }, [statements, clientFilter, typeFilter, statusFilter, search]);

  const selected =
    filtered.find((s) => s.id === selectedId) ||
    filtered[0] ||
    statements.find((s) => s.id === selectedId) ||
    null;

  const summary = useMemo(() => {
    const available = statements.filter((s) => s.status === 'Available').length;
    const generating = statements.filter((s) => s.status === 'Generating').length;
    const failed = statements.filter((s) => s.status === 'Failed').length;
    const monthly = statements.filter((s) => s.type === 'Monthly').length;
    return {
      total: statements.length,
      available,
      generating,
      failed,
      monthly,
      clients: clients.length
    };
  }, [statements]);

  const flash = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const clearFilters = () => {
    setClientFilter('All');
    setTypeFilter('All');
    setStatusFilter('All');
    setSearch('');
  };

  return (
    <div className="wmcls">
      <header className="wmcls-rail">
        <div className="wmcls-rail__brand">
          <div>
            <p className="wmcls-rail__eyebrow">Sherwood Wealth</p>
            <h1 className="wmcls-rail__title">Client Statements</h1>
            <p className="wmcls-rail__blurb">
              Generate, review, and deliver monthly, quarterly, annual, and tax statements
              across client books.
            </p>
          </div>
        </div>
        <div className="wmcls-rail__actions">
          <button type="button" className="wmcls-btn wmcls-btn--ghost" onClick={() => flash('Bulk export queued for available PDFs.')}>
            Export list
          </button>
          <button type="button" className="wmcls-btn wmcls-btn--solid" onClick={() => flash('Statement generation run started for current period.')}>
            Generate statements
          </button>
        </div>
      </header>

      {toast && <div className="wmcls-toast" role="status">{toast}</div>}

      <section className="wmcls-spotlight" aria-label="Statement summary">
        <article className="wmcls-stat">
          <span className="wmcls-label">Total statements</span>
          <strong>{summary.total}</strong>
          <span className="wmcls-stat__meta">Across {summary.clients} clients</span>
        </article>
        <article className="wmcls-stat">
          <span className="wmcls-label">Available</span>
          <strong>{summary.available}</strong>
          <span className="wmcls-pill wmcls-pill--ok">Ready to download</span>
        </article>
        <article className="wmcls-stat">
          <span className="wmcls-label">Generating</span>
          <strong>{summary.generating}</strong>
          <span className="wmcls-pill wmcls-pill--warn">In progress</span>
        </article>
        <article className="wmcls-stat">
          <span className="wmcls-label">Failed</span>
          <strong>{summary.failed}</strong>
          <span className="wmcls-pill wmcls-pill--bad">Needs retry</span>
        </article>
        <article className="wmcls-stat">
          <span className="wmcls-label">Monthly packs</span>
          <strong>{summary.monthly}</strong>
          <span className="wmcls-stat__meta">Current cycle volume</span>
        </article>
      </section>

      <section className="wmcls-toolbar">
        <div className="wmcls-tabs" role="tablist" aria-label="Statement type">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab}
              className={`wmcls-tab${typeFilter === tab ? ' is-on' : ''}`}
              onClick={() => setTypeFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="wmcls-toolbar__right">
          <label className="wmcls-search">
            <span className="wmcls-search__icon" aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search client, code, or period…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="wmcls-select">
            <span>Client</span>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="All">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wmcls-select">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Available">Available</option>
              <option value="Generating">Generating</option>
              <option value="Failed">Failed</option>
            </select>
          </label>
          <button type="button" className="wmcls-btn wmcls-btn--ghost" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </section>

      <div className="wmcls-board">
        <section className="wmcls-panel wmcls-panel--main">
          <div className="wmcls-panel__head">
            <div>
              <h2>Statement register</h2>
              <p>
                {filtered.length} matching · select a row for delivery details and actions
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="wmcls-empty">No statements match your filters.</div>
          ) : (
            <div className="wmcls-table-wrap">
              <table className="wmcls-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Issued</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className={selected?.id === s.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(s.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(s.id);
                        }
                      }}
                    >
                      <td>
                        <div className="wmcls-entity">
                          <strong>{s.clientName}</strong>
                          <span>
                            {s.clientCode} · {s.segment}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="wmcls-pill wmcls-pill--soft">{s.type}</span>
                      </td>
                      <td>{s.period}</td>
                      <td>{s.issued}</td>
                      <td>{s.format}</td>
                      <td>{s.size}</td>
                      <td>
                        <span
                          className={`wmcls-pill ${
                            s.status === 'Available'
                              ? 'wmcls-pill--ok'
                              : s.status === 'Generating'
                                ? 'wmcls-pill--warn'
                                : 'wmcls-pill--bad'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>{s.delivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="wmcls-side">
          <section className="wmcls-panel">
            {!selected ? (
              <div className="wmcls-empty">Select a statement to view details.</div>
            ) : (
              <>
                <div className="wmcls-panel__head">
                  <div>
                    <h2>Statement detail</h2>
                    <p>Preview metadata and desk actions for the selected pack.</p>
                  </div>
                </div>

                <div className="wmcls-detail">
                  <p className="wmcls-label">Client</p>
                  <strong className="wmcls-detail__name">{selected.clientName}</strong>
                  <p className="wmcls-detail__meta">
                    {selected.clientCode} · {selected.segment}
                  </p>

                  <div className="wmcls-detail__chips">
                    <span className="wmcls-pill wmcls-pill--soft">{selected.type}</span>
                    <span
                      className={`wmcls-pill ${
                        selected.status === 'Available'
                          ? 'wmcls-pill--ok'
                          : selected.status === 'Generating'
                            ? 'wmcls-pill--warn'
                            : 'wmcls-pill--bad'
                      }`}
                    >
                      {selected.status}
                    </span>
                  </div>

                  <dl className="wmcls-facts">
                    <div>
                      <dt>Period</dt>
                      <dd>{selected.period}</dd>
                    </div>
                    <div>
                      <dt>Issued</dt>
                      <dd>{selected.issued}</dd>
                    </div>
                    <div>
                      <dt>Format</dt>
                      <dd>{selected.format}</dd>
                    </div>
                    <div>
                      <dt>Size</dt>
                      <dd>{selected.size}</dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>{selected.delivery}</dd>
                    </div>
                    <div>
                      <dt>Statement ID</dt>
                      <dd>STM-{String(selected.id).padStart(5, '0')}</dd>
                    </div>
                  </dl>

                  <div className="wmcls-detail__actions">
                    <button
                      type="button"
                      className="wmcls-btn wmcls-btn--solid"
                      disabled={selected.status !== 'Available'}
                      onClick={() => flash(`Download started for ${selected.period} (${selected.type}).`)}
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="wmcls-btn wmcls-btn--ghost"
                      disabled={selected.status !== 'Available'}
                      onClick={() => flash(`Email delivery queued for ${selected.clientName}.`)}
                    >
                      Email client
                    </button>
                    <button
                      type="button"
                      className="wmcls-btn wmcls-btn--ghost"
                      onClick={() =>
                        flash(
                          selected.status === 'Failed'
                            ? `Retry queued for ${selected.period}.`
                            : `Regeneration requested for ${selected.period}.`
                        )
                      }
                    >
                      {selected.status === 'Failed' ? 'Retry generate' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="wmcls-panel wmcls-panel--notes">
            <div className="wmcls-panel__head">
              <div>
                <h2>Ops notes</h2>
                <p>Cut-off and delivery conventions for the wealth desk.</p>
              </div>
            </div>
            <ul className="wmcls-notes">
              <li>Monthly packs publish on the 1st business day after month-end NAV lock.</li>
              <li>Quarterly and annual packs include performance commentary and fee schedule.</li>
              <li>Tax statements are frozen after FY close — corrections require a revision pack.</li>
              <li>Failed runs should be retried after custodian feed reconciliation.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ClientStatements;
