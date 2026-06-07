import React, { useEffect, useMemo, useState } from 'react';
import { transactionEntryAPI } from '../../services/api';
import './Styles/SellTransactionListView.css';

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value) =>
  toNum(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatSigned = (value) => {
  const n = toNum(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${formatMoney(n)}`;
};

const formatQty = (value) =>
  toNum(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatCompact = (value) => {
  const n = toNum(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
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
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
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

const signClass = (value) => {
  const n = toNum(value);
  if (n > 0) return ' is-positive';
  if (n < 0) return ' is-negative';
  return '';
};

const SellTransactionListView = ({ onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionEntryAPI.getAllSellTransactions();
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
        tx.portfolio_name,
        tx.contract_number,
        tx.broker_name,
        tx.buy_contract
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [transactions, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, tx) => {
        acc.quantity += toNum(tx.quantity);
        acc.net += toNum(tx.net_value);
        acc.gain += toNum(tx.capital_gain);
        return acc;
      },
      { quantity: 0, net: 0, gain: 0 }
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
        ['Buy Contract', tx.buy_contract || '—']
      ]
    },
    {
      title: 'Pricing & P/L',
      items: [
        ['Bought Price', formatMoney(tx.bought_price)],
        ['Sold Price', formatMoney(tx.sold_price)],
        ['Capital Gain', formatSigned(tx.capital_gain)],
        ['Profit / Loss', formatSigned(tx.profit_loss)],
        ['Cost of Funds', `${formatMoney(tx.cost_of_funds)}%`],
        ['Holding Days', tx.hdays || '—']
      ]
    },
    {
      title: 'Fees & charges',
      items: [
        ['Brokerage', formatMoney(tx.brokerage)],
        ['CSE Fees', formatMoney(tx.cse_fees)],
        ['CDS Fees', formatMoney(tx.cds_fees)],
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
        ['Trade Date', formatDate(tx.trade_date)],
        ['Settlement Date', formatDate(tx.settlement_date)]
      ]
    },
    {
      title: 'Bank details',
      items: [
        ['Account Name', tx.account_name || '—'],
        ['Account Number', tx.account_number || '—'],
        ['Bank Name', tx.bank_name || '—'],
        ['Branch Name', tx.branch_name || '—']
      ]
    },
    {
      title: 'Other',
      items: [
        ['Money Generation Cost', formatMoney(tx.money_generation_cost)],
        ['Created At', formatDateTime(tx.created_at)]
      ]
    }
  ];

  return (
    <div className="stlv-page">
      {/* Toolbar */}
      <header className="stlv-toolbar">
        <div className="stlv-toolbar__left">
          <button onClick={onBack} className="stlv-back" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <div className="stlv-toolbar__heading">
            <h2 className="stlv-title">Submitted Sell Transactions</h2>
            <span className="stlv-subtitle">
              {loading
                ? 'Loading sell transactions…'
                : `${filtered.length} sell transaction${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>

        <div className="stlv-toolbar__actions">
          <div className="stlv-search">
            <svg className="stlv-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="stlv-search__input"
              placeholder="Search company, symbol, contract, broker…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="stlv-search__clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button onClick={fetchTransactions} className="stlv-refresh" type="button" disabled={loading}>
            <svg className={`stlv-refresh__icon${loading ? ' is-spinning' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <section className="stlv-summary" aria-label="Summary">
        <div className="stlv-kpi">
          <span className="stlv-kpi__label">Transactions</span>
          <span className="stlv-kpi__value">{filtered.length}</span>
        </div>
        <div className="stlv-kpi">
          <span className="stlv-kpi__label">Total Quantity</span>
          <span className="stlv-kpi__value">{formatQty(totals.quantity)}</span>
        </div>
        <div className="stlv-kpi stlv-kpi--accent">
          <span className="stlv-kpi__label">Net Proceeds</span>
          <span className="stlv-kpi__value">
            <span className="stlv-kpi__ccy">LKR</span> {formatCompact(totals.net)}
          </span>
        </div>
        <div className="stlv-kpi">
          <span className="stlv-kpi__label">Total Capital Gain</span>
          <span className={`stlv-kpi__value${signClass(totals.gain)}`}>
            <span className="stlv-kpi__ccy">LKR</span> {formatCompact(totals.gain)}
          </span>
        </div>
      </section>

      {/* Content */}
      {loading ? (
        <div className="stlv-state">
          <div className="stlv-spinner" />
          <span>Loading transactions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="stlv-state">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          <span className="stlv-state__title">
            {search ? 'No matching transactions' : 'No sell transactions submitted yet'}
          </span>
          <span className="stlv-state__text">
            {search
              ? 'Try a different company, symbol, contract number or broker.'
              : 'Submitted sell transactions will appear here.'}
          </span>
        </div>
      ) : (
        <div className="stlv-card">
          <div className="stlv-table-scroll">
            <table className="stlv-table">
              <thead>
                <tr>
                  <th className="stlv-th stlv-th--toggle" aria-label="Expand" />
                  <th className="stlv-th">Contract / Company</th>
                  <th className="stlv-th">Portfolio</th>
                  <th className="stlv-th stlv-th--num">Quantity</th>
                  <th className="stlv-th stlv-th--num">Sold Price</th>
                  <th className="stlv-th stlv-th--num">Gross Value</th>
                  <th className="stlv-th stlv-th--num">Net Value</th>
                  <th className="stlv-th stlv-th--num">Capital Gain</th>
                  <th className="stlv-th">Trade Date</th>
                  <th className="stlv-th">Settlement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const isOpen = expandedId === tx.id;
                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        className={`stlv-row${isOpen ? ' is-open' : ''}`}
                        onClick={() => toggleRow(tx.id)}
                      >
                        <td className="stlv-td stlv-td--toggle">
                          <span className={`stlv-chevron${isOpen ? ' is-open' : ''}`} aria-hidden>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </td>
                        <td className="stlv-td stlv-td--primary">
                          <div className="stlv-company">
                            <span className="stlv-avatar" aria-hidden>{initials(tx.company_name)}</span>
                            <div className="stlv-company__text">
                              <span className="stlv-company__name">{tx.company_name || '—'}</span>
                              <span className="stlv-company__meta">
                                <span className="stlv-symbol">{tx.symbol || '—'}</span>
                                <span className="stlv-deal">{tx.contract_number || '—'}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="stlv-td">{tx.portfolio_name || '—'}</td>
                        <td className="stlv-td stlv-td--num">{formatQty(tx.quantity)}</td>
                        <td className="stlv-td stlv-td--num">{formatMoney(tx.sold_price)}</td>
                        <td className="stlv-td stlv-td--num">{formatMoney(tx.gross_value)}</td>
                        <td className="stlv-td stlv-td--num stlv-td--net">{formatMoney(tx.net_value)}</td>
                        <td className={`stlv-td stlv-td--num stlv-td--pl${signClass(tx.capital_gain)}`}>
                          {formatSigned(tx.capital_gain)}
                        </td>
                        <td className="stlv-td stlv-td--date">{formatDate(tx.trade_date)}</td>
                        <td className="stlv-td stlv-td--date">{formatDate(tx.settlement_date)}</td>
                      </tr>
                      {isOpen && (
                        <tr className="stlv-detail-row">
                          <td className="stlv-detail-cell" colSpan={10}>
                            <div className="stlv-detail">
                              {detailSections(tx).map((section) => (
                                <div className="stlv-detail__group" key={section.title}>
                                  <div className="stlv-detail__group-title">{section.title}</div>
                                  <dl className="stlv-detail__list">
                                    {section.items.map(([label, value]) => {
                                      const isPL = label === 'Capital Gain' || label === 'Profit / Loss';
                                      const str = String(value);
                                      let plSign = '';
                                      if (isPL && str.startsWith('-')) plSign = ' is-negative';
                                      else if (isPL && str.startsWith('+') && parseFloat(str.replace(/[^0-9.]/g, '')) > 0) plSign = ' is-positive';
                                      const cls = isPL ? `stlv-detail__pl${plSign}` : '';
                                      return (
                                        <div className="stlv-detail__item" key={label}>
                                          <dt>{label}</dt>
                                          <dd className={cls}>{value}</dd>
                                        </div>
                                      );
                                    })}
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

export default SellTransactionListView;
