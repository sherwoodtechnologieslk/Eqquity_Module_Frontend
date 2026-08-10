import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import './Styles/PurchaseSubscription.css';

const FUNDS = [
  { id: 'EGF', name: 'Equity Growth Fund', category: 'Equity', nav: 25.45, currency: 'LKR' },
  { id: 'BIF', name: 'Balanced Income Fund', category: 'Balanced', nav: 18.92, currency: 'LKR' },
  { id: 'FIF', name: 'Fixed Income Fund', category: 'Fixed Income', nav: 10.25, currency: 'LKR' },
  { id: 'MMF', name: 'Money Market Fund', category: 'Money Market', nav: 1.0, currency: 'LKR' },
];

const CLIENTS = [
  { code: 'CLT-000128', name: 'Client 1', segment: 'Individual' },
  { code: 'CLT-000257', name: 'Client 2', segment: 'Treasury' },
  { code: 'CLT-000389', name: 'Client 3', segment: 'Private Wealth' },
  { code: 'CLT-000412', name: 'Client 4', segment: 'Individual' },
];

const PAYMENT_METHODS = ['Bank Transfer', 'Direct Debit', 'Cheque', 'Internal Transfer'];
const CHANNELS = ['RM Assisted', 'Branch', 'Client Portal', 'Call Centre'];
const STATUS_TABS = ['All', 'Pending', 'Awaiting Funds', 'Allotted', 'Rejected'];

const formatMoney = (value, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)}`;

const formatUnits = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

const statusClass = (status) =>
  `wps-badge wps-badge--${status.toLowerCase().replace(/\s+/g, '-')}`;

const emptyForm = () => ({
  clientCode: CLIENTS[0].code,
  fundId: FUNDS[0].id,
  entryMode: 'amount',
  amount: '',
  units: '',
  tradeDate: todayISO(),
  valueDate: todayISO(),
  paymentMethod: PAYMENT_METHODS[0],
  paymentRef: '',
  channel: CHANNELS[0],
  notes: '',
});

const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
    <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PurchaseSubscription = () => {
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fundFilter, setFundFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [orders, setOrders] = useState([
    {
      id: 'SUB-2025-00481',
      clientCode: 'CLT-000128',
      clientName: 'Client 1',
      fundId: 'EGF',
      fundName: 'Equity Growth Fund',
      amount: 2_500_000,
      units: 98_231.8271,
      nav: 25.45,
      currency: 'LKR',
      tradeDate: '2025-12-18',
      valueDate: '2025-12-19',
      paymentMethod: 'Bank Transfer',
      paymentRef: 'BT-889201',
      channel: 'RM Assisted',
      status: 'Pending',
      notes: 'Top-up into growth sleeve',
      createdBy: 'Sherwood Wealth Team',
    },
    {
      id: 'SUB-2025-00476',
      clientCode: 'CLT-000257',
      clientName: 'Client 2',
      fundId: 'MMF',
      fundName: 'Money Market Fund',
      amount: 15_000_000,
      units: 15_000_000,
      nav: 1.0,
      currency: 'LKR',
      tradeDate: '2025-12-17',
      valueDate: '2025-12-17',
      paymentMethod: 'Internal Transfer',
      paymentRef: 'INT-44102',
      channel: 'Branch',
      status: 'Allotted',
      notes: 'Treasury liquidity park',
      createdBy: 'Corporate Coverage',
    },
    {
      id: 'SUB-2025-00472',
      clientCode: 'CLT-000389',
      clientName: 'Client 3',
      fundId: 'BIF',
      fundName: 'Balanced Income Fund',
      amount: 750_000,
      units: 39_640.5919,
      nav: 18.92,
      currency: 'LKR',
      tradeDate: '2025-12-16',
      valueDate: '2025-12-17',
      paymentMethod: 'Cheque',
      paymentRef: 'CHQ-10233',
      channel: 'Client Portal',
      status: 'Awaiting Funds',
      notes: '',
      createdBy: 'Client Portal',
    },
    {
      id: 'SUB-2025-00468',
      clientCode: 'CLT-000412',
      clientName: 'Client 4',
      fundId: 'FIF',
      fundName: 'Fixed Income Fund',
      amount: 500_000,
      units: 48_780.4878,
      nav: 10.25,
      currency: 'LKR',
      tradeDate: '2025-12-15',
      valueDate: '2025-12-16',
      paymentMethod: 'Direct Debit',
      paymentRef: 'DD-7781',
      channel: 'Call Centre',
      status: 'Rejected',
      notes: 'Insufficient mandate limit',
      createdBy: 'Call Centre',
    },
  ]);

  const selectedFund = FUNDS.find((f) => f.id === form.fundId) || FUNDS[0];
  const selectedClient = CLIENTS.find((c) => c.code === form.clientCode) || CLIENTS[0];

  const numericAmount = parseFloat(form.amount) || 0;
  const numericUnits =
    form.entryMode === 'units'
      ? parseFloat(form.units) || 0
      : selectedFund
        ? numericAmount / selectedFund.nav
        : 0;
  const calculatedAmount =
    form.entryMode === 'amount'
      ? numericAmount
      : selectedFund
        ? (parseFloat(form.units) || 0) * selectedFund.nav
        : 0;

  const summary = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const awaiting = orders.filter((o) => o.status === 'Awaiting Funds').length;
    const allotted = orders.filter((o) => o.status === 'Allotted').length;
    const rejected = orders.filter((o) => o.status === 'Rejected').length;
    const pendingValue = orders
      .filter((o) => o.status === 'Pending' || o.status === 'Awaiting Funds')
      .reduce((sum, o) => sum + o.amount, 0);
    const allottedValue = orders
      .filter((o) => o.status === 'Allotted')
      .reduce((sum, o) => sum + o.amount, 0);
    return { pending, awaiting, allotted, rejected, pendingValue, allottedValue, total: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.clientCode.toLowerCase().includes(q) ||
        o.fundName.toLowerCase().includes(q) ||
        (o.paymentRef || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesFund = fundFilter === 'All' || o.fundId === fundFilter;
      return matchesSearch && matchesStatus && matchesFund;
    });
  }, [orders, search, statusFilter, fundFilter]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedId(null);
      return;
    }
    if (!filteredOrders.some((o) => o.id === selectedId)) {
      setSelectedId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedId]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitMessage('');
  };

  const handleReset = () => {
    setForm(emptyForm());
    setSubmitMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (calculatedAmount <= 0 || numericUnits <= 0) {
      setSubmitMessage('Enter a valid subscription amount or units.');
      return;
    }

    const newOrder = {
      id: `SUB-${new Date().getFullYear()}-${String(480 + orders.length + 1).padStart(5, '0')}`,
      clientCode: selectedClient.code,
      clientName: selectedClient.name,
      fundId: selectedFund.id,
      fundName: selectedFund.name,
      amount: calculatedAmount,
      units: numericUnits,
      nav: selectedFund.nav,
      currency: selectedFund.currency,
      tradeDate: form.tradeDate,
      valueDate: form.valueDate,
      paymentMethod: form.paymentMethod,
      paymentRef: form.paymentRef || 'N/A',
      channel: form.channel,
      status: 'Pending',
      notes: form.notes,
      createdBy: 'Sherwood Wealth Team',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedId(newOrder.id);
    setStatusFilter('All');
    setSubmitMessage(`Subscription ${newOrder.id} submitted for processing.`);
    setForm((prev) => ({
      ...emptyForm(),
      clientCode: prev.clientCode,
      fundId: prev.fundId,
      paymentMethod: prev.paymentMethod,
      channel: prev.channel,
    }));
  };

  const updateStatus = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setFundFilter('All');
  };

  return (
    <div className="wps">
      <WealthPageHeader
        title="Purchase / Subscription"
        blurb="Capture unit trust subscriptions for clients, track funding status, and allot units against the dealing NAV."
        actions={
          <>
            <button
              type="button"
              className="wps-btn wps-btn--ghost"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Hide form' : 'Show form'}
            </button>
            <button
              type="button"
              className="wps-btn wps-btn--solid"
              onClick={() => {
                setShowForm(true);
                setForm(emptyForm());
                setSubmitMessage('');
              }}
            >
              <IconPlus />
              New subscription
            </button>
          </>
        }
      />

      <section className="wps-strip" aria-label="Subscription summary">
        <article className="wps-stat wps-stat--focus">
          <span className="wps-k">In pipeline</span>
          <strong>{formatMoney(summary.pendingValue)}</strong>
          <span className="wps-m">Pending + awaiting funds</span>
        </article>
        <article className="wps-stat">
          <span className="wps-k">Orders</span>
          <strong>{summary.total}</strong>
          <span className="wps-m">All subscriptions</span>
        </article>
        <article className="wps-stat">
          <span className="wps-k">Pending</span>
          <strong>{summary.pending}</strong>
          <span className="wps-m">Ready to process</span>
        </article>
        <article className="wps-stat">
          <span className="wps-k">Awaiting funds</span>
          <strong>{summary.awaiting}</strong>
          <span className="wps-m">Payment outstanding</span>
        </article>
        <article className="wps-stat">
          <span className="wps-k">Allotted</span>
          <strong>{summary.allotted}</strong>
          <span className="wps-m">{formatMoney(summary.allottedValue)}</span>
        </article>
        <article className="wps-stat">
          <span className="wps-k">Rejected</span>
          <strong>{summary.rejected}</strong>
          <span className="wps-m">Needs follow-up</span>
        </article>
      </section>

      {showForm && (
        <section className="wps-form-panel" aria-label="New subscription">
          <header className="wps-panel-head">
            <div>
              <h2>New subscription instruction</h2>
              <p>
                Indicative NAV {formatMoney(selectedFund.nav)} · est. units{' '}
                {formatUnits(numericUnits)}
              </p>
            </div>
          </header>

          <form className="wps-form" onSubmit={handleSubmit}>
            <div className="wps-form-grid">
              <label className="wps-field">
                <span>Client</span>
                <select name="clientCode" value={form.clientCode} onChange={handleChange}>
                  {CLIENTS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wps-field">
                <span>Fund</span>
                <select name="fundId" value={form.fundId} onChange={handleChange}>
                  {FUNDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="wps-field">
                <span>Entry mode</span>
                <select name="entryMode" value={form.entryMode} onChange={handleChange}>
                  <option value="amount">By amount</option>
                  <option value="units">By units</option>
                </select>
              </label>

              {form.entryMode === 'amount' ? (
                <label className="wps-field">
                  <span>Subscription amount (LKR)</span>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                  />
                </label>
              ) : (
                <label className="wps-field">
                  <span>Units</span>
                  <input
                    name="units"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.0000"
                    value={form.units}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label className="wps-field">
                <span>Trade date</span>
                <input
                  name="tradeDate"
                  type="date"
                  value={form.tradeDate}
                  onChange={handleChange}
                />
              </label>

              <label className="wps-field">
                <span>Value date</span>
                <input
                  name="valueDate"
                  type="date"
                  value={form.valueDate}
                  onChange={handleChange}
                />
              </label>

              <label className="wps-field">
                <span>Payment method</span>
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label className="wps-field">
                <span>Payment reference</span>
                <input
                  name="paymentRef"
                  type="text"
                  placeholder="e.g. BT-889201"
                  value={form.paymentRef}
                  onChange={handleChange}
                />
              </label>

              <label className="wps-field">
                <span>Channel</span>
                <select name="channel" value={form.channel} onChange={handleChange}>
                  {CHANNELS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="wps-field wps-field--wide">
                <span>Notes</span>
                <input
                  name="notes"
                  type="text"
                  placeholder="Optional instruction notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="wps-form-footer">
              <div className="wps-estimate">
                <span>Estimated allotment</span>
                <strong>
                  {formatMoney(calculatedAmount)} · {formatUnits(numericUnits)} units @{' '}
                  {formatMoney(selectedFund.nav)}
                </strong>
              </div>
              <div className="wps-form-actions">
                <button type="button" className="wps-btn wps-btn--ghost" onClick={handleReset}>
                  Reset
                </button>
                <button type="submit" className="wps-btn wps-btn--solid">
                  Submit subscription
                </button>
              </div>
            </div>
            {submitMessage && <p className="wps-message">{submitMessage}</p>}
          </form>
        </section>
      )}

      <section className="wps-toolbar">
        <div className="wps-tabs" role="tablist" aria-label="Status filter">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab}
              className={`wps-tab${statusFilter === tab ? ' is-on' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="wps-toolbar__right">
          <label className="wps-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search order, client, fund…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="wps-select">
            <span>Fund</span>
            <select value={fundFilter} onChange={(e) => setFundFilter(e.target.value)}>
              <option value="All">All</option>
              {FUNDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="wps-btn wps-btn--ghost" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </section>

      <section className="wps-board" aria-label="Subscription orders">
        <header className="wps-board__head">
          <div>
            <h2>Subscription book</h2>
            <p>{filteredOrders.length} matching · select a row for details</p>
          </div>
        </header>

        {filteredOrders.length === 0 ? (
          <div className="wps-empty">No subscriptions match the current filters.</div>
        ) : (
          <div className="wps-table-wrap">
            <table className="wps-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Client</th>
                  <th>Fund</th>
                  <th>Amount</th>
                  <th>Units</th>
                  <th>Trade date</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={selectedId === order.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <td>
                      <strong>{order.id}</strong>
                      <span className="wps-sub">{order.paymentRef}</span>
                    </td>
                    <td>
                      <strong>{order.clientName}</strong>
                      <span className="wps-sub">{order.clientCode}</span>
                    </td>
                    <td>{order.fundName}</td>
                    <td>{formatMoney(order.amount, order.currency)}</td>
                    <td>{formatUnits(order.units)}</td>
                    <td>{order.tradeDate}</td>
                    <td>{order.channel}</td>
                    <td>
                      <span className={statusClass(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <aside className="wps-detail" aria-label="Subscription detail">
          <header className="wps-detail__head">
            <div>
              <p className="wps-detail__eyebrow">Instruction detail</p>
              <h3>{selectedOrder.id}</h3>
              <p>
                {selectedOrder.clientName} · {selectedOrder.fundName}
              </p>
            </div>
            <span className={statusClass(selectedOrder.status)}>{selectedOrder.status}</span>
          </header>

          <div className="wps-detail__grid">
            <div>
              <span className="wps-k">Amount</span>
              <strong>{formatMoney(selectedOrder.amount, selectedOrder.currency)}</strong>
            </div>
            <div>
              <span className="wps-k">Units</span>
              <strong>{formatUnits(selectedOrder.units)}</strong>
            </div>
            <div>
              <span className="wps-k">NAV</span>
              <strong>{formatMoney(selectedOrder.nav, selectedOrder.currency)}</strong>
            </div>
            <div>
              <span className="wps-k">Payment</span>
              <strong>
                {selectedOrder.paymentMethod}
                <span className="wps-sub">{selectedOrder.paymentRef}</span>
              </strong>
            </div>
            <div>
              <span className="wps-k">Trade / value</span>
              <strong>
                {selectedOrder.tradeDate} → {selectedOrder.valueDate}
              </strong>
            </div>
            <div>
              <span className="wps-k">Created by</span>
              <strong>{selectedOrder.createdBy}</strong>
            </div>
          </div>

          {selectedOrder.notes ? (
            <p className="wps-detail__notes">{selectedOrder.notes}</p>
          ) : null}

          <div className="wps-detail__actions">
            {selectedOrder.status === 'Pending' && (
              <>
                <button
                  type="button"
                  className="wps-btn wps-btn--ghost"
                  onClick={() => updateStatus(selectedOrder.id, 'Awaiting Funds')}
                >
                  Mark awaiting funds
                </button>
                <button
                  type="button"
                  className="wps-btn wps-btn--solid"
                  onClick={() => updateStatus(selectedOrder.id, 'Allotted')}
                >
                  Allot units
                </button>
                <button
                  type="button"
                  className="wps-btn wps-btn--danger"
                  onClick={() => updateStatus(selectedOrder.id, 'Rejected')}
                >
                  Reject
                </button>
              </>
            )}
            {selectedOrder.status === 'Awaiting Funds' && (
              <>
                <button
                  type="button"
                  className="wps-btn wps-btn--solid"
                  onClick={() => updateStatus(selectedOrder.id, 'Pending')}
                >
                  Funds received
                </button>
                <button
                  type="button"
                  className="wps-btn wps-btn--danger"
                  onClick={() => updateStatus(selectedOrder.id, 'Rejected')}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default PurchaseSubscription;
