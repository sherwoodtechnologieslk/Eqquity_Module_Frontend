import React, { useState, useEffect, useMemo } from 'react';
import './ViewTransactions.css';
import { transactionEntryAPI } from '../../services/api';

const formatLkr = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(d);
  }
};

const ViewTransactions = () => {
  const [buyList, setBuyList] = useState([]);
  const [sellList, setSellList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPortfolio, setFilterPortfolio] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [buys, sells] = await Promise.all([
        transactionEntryAPI.getAllBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions(),
      ]);
      setBuyList(Array.isArray(buys) ? buys : []);
      setSellList(Array.isArray(sells) ? sells : []);
    } catch (e) {
      console.error('ViewTransactions load error:', e);
      setError(e.message || 'Failed to load transactions.');
      setBuyList([]);
      setSellList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const portfolios = useMemo(() => {
    const set = new Set();
    buyList.forEach((t) => t.portfolio && set.add(t.portfolio));
    sellList.forEach((t) => (t.portfolio_name || t.portfolio) && set.add(t.portfolio_name || t.portfolio));
    return [...set].sort();
  }, [buyList, sellList]);

  const unified = useMemo(() => {
    const items = [];
    buyList.forEach((t) => {
      items.push({
        id: `buy_${t.id}`,
        type: 'BUY',
        symbol: t.symbol || t.company_symbol || '—',
        companyName: t.company_name || '—',
        portfolio: t.portfolio || '—',
        quantity: parseFloat(t.quantity) || 0,
        price: parseFloat(t.price) || 0,
        netValue: parseFloat(t.net_value) || 0,
        tradeDate: t.trade_date || t.created_at,
        dealNumber: t.deal_number || '—',
      });
    });
    sellList.forEach((t) => {
      const qty = Math.abs(parseFloat(t.quantity) || 0);
      const price = parseFloat(t.sold_price || t.price) || 0;
      items.push({
        id: `sell_${t.id}`,
        type: 'SELL',
        symbol: t.symbol || t.company_symbol || '—',
        companyName: t.company_name || '—',
        portfolio: t.portfolio_name || t.portfolio || '—',
        quantity: qty,
        price,
        netValue: parseFloat(t.net_value) || 0,
        tradeDate: t.trade_date || t.created_at,
        dealNumber: t.deal_number || '—',
      });
    });
    items.sort((a, b) => new Date(b.tradeDate || 0) - new Date(a.tradeDate || 0));
    return items;
  }, [buyList, sellList]);

  const filtered = useMemo(() => {
    let list = unified;
    if (filterType === 'buy') list = list.filter((i) => i.type === 'BUY');
    else if (filterType === 'sell') list = list.filter((i) => i.type === 'SELL');
    if (filterPortfolio) list = list.filter((i) => (i.portfolio || '').toLowerCase() === filterPortfolio.toLowerCase());
    if (searchSymbol.trim()) {
      const term = searchSymbol.trim().toLowerCase();
      list = list.filter((i) => (i.symbol || '').toLowerCase().includes(term) || (i.companyName || '').toLowerCase().includes(term));
    }
    return list;
  }, [unified, filterType, filterPortfolio, searchSymbol]);

  const summary = useMemo(() => {
    const buyCount = buyList.length;
    const sellCount = sellList.length;
    const buyValue = buyList.reduce((s, t) => s + (parseFloat(t.net_value) || 0), 0);
    const sellValue = sellList.reduce((s, t) => s + (parseFloat(t.net_value) || 0), 0);
    return { buyCount, sellCount, buyValue, sellValue };
  }, [buyList, sellList]);

  if (loading) {
    return (
      <div className="vt-root">
        <div className="vt-header">
          <div>
            <h1 className="vt-title">View Transactions</h1>
            <p className="vt-subtitle">All buy and sell transactions across portfolios</p>
          </div>
        </div>
        <div className="vt-loading">
          <div className="vt-spinner" />
          <p>Loading transactions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vt-root">
      <div className="vt-header">
        <div>
          <h1 className="vt-title">View Transactions</h1>
          <p className="vt-subtitle">All buy and sell transactions across portfolios</p>
        </div>
        <div className="vt-header-actions">
          <button type="button" className="vt-btn vt-btn-ghost" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="vt-error">
          <span>{error}</span>
          <button type="button" className="vt-btn vt-btn-ghost" onClick={loadData}>Retry</button>
        </div>
      )}

      <div className="vt-summary-cards">
        <div className="vt-summary-card">
          <span className="vt-summary-label">Total Buys</span>
          <span className="vt-summary-value">{summary.buyCount}</span>
          <span className="vt-summary-amount">LKR {formatLkr(summary.buyValue)}</span>
        </div>
        <div className="vt-summary-card">
          <span className="vt-summary-label">Total Sells</span>
          <span className="vt-summary-value">{summary.sellCount}</span>
          <span className="vt-summary-amount">LKR {formatLkr(summary.sellValue)}</span>
        </div>
        <div className="vt-summary-card vt-summary-card-wide">
          <span className="vt-summary-label">Transactions Shown</span>
          <span className="vt-summary-value">{filtered.length}</span>
        </div>
      </div>

      <div className="vt-toolbar">
        <div className="vt-filters">
          <div className="vt-filter-group">
            <label>Type</label>
            <div className="vt-filter-buttons">
              {['all', 'buy', 'sell'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`vt-filter-btn ${filterType === t ? 'active' : ''}`}
                  onClick={() => setFilterType(t)}
                >
                  {t === 'all' ? 'All' : t === 'buy' ? 'Buy' : 'Sell'}
                </button>
              ))}
            </div>
          </div>
          <div className="vt-filter-group">
            <label>Portfolio</label>
            <select
              className="vt-select"
              value={filterPortfolio}
              onChange={(e) => setFilterPortfolio(e.target.value)}
            >
              <option value="">All portfolios</option>
              {portfolios.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="vt-filter-group">
            <label>Symbol / Company</label>
            <input
              type="text"
              className="vt-input"
              placeholder="Search…"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="vt-card vt-list-card">
        {filtered.length === 0 ? (
          <div className="vt-empty">No transactions match the current filters.</div>
        ) : (
          <ul className="vt-list">
            {filtered.map((item) => (
              <li key={item.id} className={`vt-list-item vt-list-item-${item.type.toLowerCase()}`}>
                <div className="vt-item-badge">{item.type}</div>
                <div className="vt-item-main">
                  <div className="vt-item-row">
                    <span className="vt-item-symbol">{item.symbol}</span>
                    <span className="vt-item-company">{item.companyName}</span>
                  </div>
                  <div className="vt-item-meta">
                    {item.portfolio} · {formatDate(item.tradeDate)} · Deal: {item.dealNumber}
                  </div>
                </div>
                <div className="vt-item-figures">
                  <span className="vt-item-qty">{item.quantity.toLocaleString()} @ {formatLkr(item.price)}</span>
                  <span className="vt-item-value">LKR {formatLkr(item.netValue)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ViewTransactions;
