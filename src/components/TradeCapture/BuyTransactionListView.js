import React, { useEffect, useMemo, useState } from 'react';
import { tradeSummaryAPI } from '../../services/api';
import './Styles/BuyTransactionListView.css';

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value) =>
  toNum(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatQty = (value) =>
  toNum(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatCompact = (value) => {
  const n = toNum(value);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
};

const initials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const BuyTransactionListView = ({ onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await tradeSummaryAPI.getBuyTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((tx) =>
      [
        tx.company_name,
        tx.symbol,
        tx.portfolio,
        tx.deal_number,
        tx.broker_name,
        tx.contract_number
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [transactions, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, tx) => {
        acc.quantity += toNum(tx.quantity);
        acc.gross += toNum(tx.gross_value);
        acc.net += toNum(tx.net_value);
        return acc;
      },
      { quantity: 0, gross: 0, net: 0 }
    );
  }, [filtered]);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const detailSections = (tx) => [
    {
      title: 'Identifiers',
      items: [
        ['Transaction ID', tx.id],
        ['Portfolio ID', tx.portfolioId || '—'],
        ['Contract Number', tx.contract_number || '—'],
        ['Description', tx.description || '—']
      ]
    },
    {
      title: 'Fees & charges',
      items: [
        ['Brokerage', formatMoney(tx.brokerage)],
        ['CDS Fees', formatMoney(tx.cds_fees)],
        ['CSE Fees', formatMoney(tx.cse_fees)],
        ['Clearing Fees', formatMoney(tx.clearing_fees)],
        ['SEC', formatMoney(tx.sec)],
        ['STL', formatMoney(tx.stl)]
      ]
    },
    {
      title: 'Settlement',
      items: [
        ['Broker Name', tx.broker_name || '—'],
        ['Settlement Account', tx.settlement_account || '—'],
        ['Cash Flow on Settlement', formatMoney(tx.cash_flow_on_settlement)],
        ['Settlement Date', formatDate(tx.settlement_date)]
      ]
    },
    {
      title: 'Payment & funding',
      items: [
        ['Payment Method', tx.payment_method || '—'],
        ['Generate Payment', tx.generate_payment || '—'],
        ['Money Generation Cost (Daily)', formatMoney(tx.money_generation_cost)],
        ['Cost of Funds', formatMoney(tx.cost_of_funds)],
        ['Created At', formatDateTime(tx.created_at)]
      ]
    }
  ];

  return (
    <div className="btlv-page">
      {/* Toolbar */}
      <header className="btlv-toolbar">
        <div className="btlv-toolbar__left">
          <button onClick={onBack} className="btlv-back" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <div className="btlv-toolbar__heading">
            <p className="btlv-eyebrow">Trade Capture · Buy</p>
            <h2 className="btlv-title">Submitted Transactions</h2>
            <span className="btlv-subtitle">
              {loading
                ? 'Loading buy transactions…'
                : `${filtered.length} buy transaction${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>

        <div className="btlv-toolbar__actions">
          <div className="btlv-search">
            <svg className="btlv-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="btlv-search__input"
              placeholder="Search company, symbol, deal, broker…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btlv-search__clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button onClick={fetchTransactions} className="btlv-refresh" type="button" disabled={loading}>
            <svg className={`btlv-refresh__icon${loading ? ' is-spinning' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="btlv-summary" aria-label="Summary">
        <div className="btlv-kpi">
          <span className="btlv-kpi__label">Transactions</span>
          <span className="btlv-kpi__value">{filtered.length}</span>
        </div>
        <div className="btlv-kpi">
          <span className="btlv-kpi__label">Total Quantity</span>
          <span className="btlv-kpi__value">{formatQty(totals.quantity)}</span>
        </div>
        <div className="btlv-kpi">
          <span className="btlv-kpi__label">Gross Value</span>
          <span className="btlv-kpi__value">
            <span className="btlv-kpi__ccy">LKR</span> {formatCompact(totals.gross)}
          </span>
        </div>
        <div className="btlv-kpi btlv-kpi--accent">
          <span className="btlv-kpi__label">Net Value</span>
          <span className="btlv-kpi__value">
            <span className="btlv-kpi__ccy">LKR</span> {formatCompact(totals.net)}
          </span>
        </div>
      </section>

      {/* Content */}
      {loading ? (
        <div className="btlv-state">
          <div className="btlv-spinner" />
          <span>Loading transactions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="btlv-state">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          <span className="btlv-state__title">
            {search ? 'No matching transactions' : 'No transactions submitted yet'}
          </span>
          <span className="btlv-state__text">
            {search
              ? 'Try a different company, symbol, deal number or broker.'
              : 'Submitted buy transactions will appear here.'}
          </span>
        </div>
      ) : (
        <div className="btlv-card">
          <div className="btlv-table-scroll">
            <table className="btlv-table">
              <thead>
                <tr>
                  <th className="btlv-th btlv-th--toggle" aria-label="Expand" />
                  <th className="btlv-th">Deal / Company</th>
                  <th className="btlv-th">Portfolio</th>
                  <th className="btlv-th btlv-th--num">Quantity</th>
                  <th className="btlv-th btlv-th--num">Price</th>
                  <th className="btlv-th btlv-th--num">Gross Value</th>
                  <th className="btlv-th btlv-th--num">Net Value</th>
                  <th className="btlv-th">Trade Date</th>
                  <th className="btlv-th">Settlement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const isOpen = expandedId === tx.id;
                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        className={`btlv-row${isOpen ? ' is-open' : ''}`}
                        onClick={() => toggleRow(tx.id)}
                      >
                        <td className="btlv-td btlv-td--toggle">
                          <span className={`btlv-chevron${isOpen ? ' is-open' : ''}`} aria-hidden>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </td>
                        <td className="btlv-td btlv-td--primary">
                          <div className="btlv-company">
                            <span className="btlv-avatar" aria-hidden>{initials(tx.company_name)}</span>
                            <div className="btlv-company__text">
                              <span className="btlv-company__name">{tx.company_name || '—'}</span>
                              <span className="btlv-company__meta">
                                <span className="btlv-symbol">{tx.symbol || '—'}</span>
                                <span className="btlv-deal">{tx.deal_number || '—'}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="btlv-td">{tx.portfolio || '—'}</td>
                        <td className="btlv-td btlv-td--num">{formatQty(tx.quantity)}</td>
                        <td className="btlv-td btlv-td--num">{formatMoney(tx.price)}</td>
                        <td className="btlv-td btlv-td--num">{formatMoney(tx.gross_value)}</td>
                        <td className="btlv-td btlv-td--num btlv-td--net">{formatMoney(tx.net_value)}</td>
                        <td className="btlv-td btlv-td--date">{formatDate(tx.trade_date)}</td>
                        <td className="btlv-td btlv-td--date">{formatDate(tx.settlement_date)}</td>
                      </tr>
                      {isOpen && (
                        <tr className="btlv-detail-row">
                          <td className="btlv-detail-cell" colSpan={9}>
                            <div className="btlv-detail">
                              {detailSections(tx).map((section) => (
                                <div className="btlv-detail__group" key={section.title}>
                                  <div className="btlv-detail__group-title">{section.title}</div>
                                  <dl className="btlv-detail__list">
                                    {section.items.map(([label, value]) => (
                                      <div className="btlv-detail__item" key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyTransactionListView;
