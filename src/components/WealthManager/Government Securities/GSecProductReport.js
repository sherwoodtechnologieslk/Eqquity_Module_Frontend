import React, { useCallback, useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import WealthModal from '../shared/WealthModal';
import { gsecEntriesAPI } from '../../../services/api';
import { IconSearch, formatCompact, formatMoney, statusClass, todayISO } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const parseNum = (value) => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return parseFloat(String(value).replace(/,/g, '')) || 0;
};

const ymd = (value) => (value ? String(value).slice(0, 10) : '—');

const fmtPct = (value) => {
  const n = parseNum(value);
  return `${n.toFixed(2)}%`;
};

const fmtNum4 = (value) => parseNum(value).toFixed(4);
const fmtText = (value) => (value == null || value === '' ? '—' : String(value));

const DEAL_FIELDS = [
  { k: 'Deal number', key: 'deal_number', render: fmtText },
  { k: 'Product', key: 'product_type', render: fmtText },
  { k: 'Portfolio', key: 'portfolio', render: fmtText },
  { k: 'Custodian', key: 'custodian', render: fmtText },
  { k: 'ISIN', key: 'isin', render: fmtText },
  { k: 'Counterparty', key: 'counterparty', render: fmtText },
  { k: 'Face value', key: 'face_value', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Issue date', key: 'issue_date', render: ymd },
  { k: 'Last coupon date', key: 'last_coupon_date', render: ymd },
  { k: 'Next coupon date', key: 'next_coupon_date', render: ymd },
  { k: 'Value date', key: 'value_date', render: ymd },
  { k: 'Maturity date', key: 'maturity_date', render: ymd },
  { k: 'Coupon rate', key: 'coupon_rate', num: true, render: fmtPct },
  { k: 'Coupon interest', key: 'coupon_interest', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Clean price', key: 'clean_price', num: true, render: fmtNum4 },
  { k: 'Dirty price', key: 'dirty_price', num: true, render: fmtNum4 },
  { k: 'Clean amount', key: 'clean_price_amount', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Dirty amount', key: 'dirty_price_amount', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Yield', key: 'yield', num: true, render: fmtPct },
  { k: 'DTM', key: 'dtm', num: true, render: fmtText },
  { k: 'Balance', key: 'balance', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Available balance', key: 'available_balance', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'WAP', key: 'wap', num: true, render: fmtNum4 },
  { k: 'NVP', key: 'nvp', num: true, render: fmtNum4 },
  { k: 'Accrued interest', key: 'accrued_interest', num: true, render: fmtNum4 },
  { k: 'Repo collateral', key: 'repo_collateral', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Sell back', key: 'sell_back', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Daily accrual', key: 'daily_accrual', num: true, render: fmtNum4 },
  { k: 'Daily amortization', key: 'daily_amortization', num: true, render: fmtNum4 },
  { k: 'Cumulative accrual', key: 'cumulative_accrual', num: true, render: fmtNum4 },
  { k: 'Cumulative amortization', key: 'cumulative_amortization', num: true, render: fmtNum4 },
  { k: 'Transaction type', key: 'transaction_type', render: fmtText },
];

const SUMMARY_FIELDS = [
  { k: 'ISIN', key: 'isin', render: fmtText },
  { k: 'Maturity', key: 'maturity_date', render: ymd },
  { k: 'Deals', key: 'deal_count', num: true, render: fmtText },
  { k: 'Face value', key: 'total_face_value', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'Wtd avg price', key: 'weighted_avg_price', num: true, render: fmtNum4 },
  { k: 'Wtd yield', key: 'weighted_yield', num: true, render: fmtPct },
];

const VIEW_TABS = ['Deals', 'By ISIN'];

const GSecProductReport = () => {
  const [asAtDate, setAsAtDate] = useState(todayISO());
  const [draftDate, setDraftDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [isinSummary, setIsinSummary] = useState([]);
  const [view, setView] = useState('Deals');
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadReport = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const payload = await gsecEntriesAPI.getProductReport({ asAtDate: date });
      const deals = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const summary = Array.isArray(payload?.summary) ? payload.summary : [];
      setRows(deals);
      setIsinSummary(summary);
      setSelectedId(null);
      setDetailOpen(false);
    } catch (err) {
      setRows([]);
      setIsinSummary([]);
      setSelectedId(null);
      setError(err.message || 'Failed to load GSec product report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(asAtDate);
  }, [asAtDate, loadReport]);

  const products = useMemo(
    () => Array.from(new Set(rows.map((r) => r.product_type).filter(Boolean))),
    [rows]
  );

  const totals = useMemo(() => {
    const face = rows.reduce((s, r) => s + parseNum(r.face_value), 0);
    const dirty = rows.reduce((s, r) => s + parseNum(r.dirty_price_amount), 0);
    const isins = new Set(rows.map((r) => r.isin).filter(Boolean)).size;
    const wtdYield =
      isinSummary.length > 0
        ? isinSummary.reduce((s, r) => s + parseNum(r.weighted_yield) * parseNum(r.total_face_value), 0) /
          (isinSummary.reduce((s, r) => s + parseNum(r.total_face_value), 0) || 1)
        : 0;
    return { face, dirty, isins, deals: rows.length, wtdYield };
  }, [rows, isinSummary]);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesProduct = productFilter === 'All' || r.product_type === productFilter;
      const hay = [r.deal_number, r.isin, r.portfolio, r.counterparty, r.transaction_type, r.product_type]
        .join(' ')
        .toLowerCase();
      return matchesProduct && (!q || hay.includes(q));
    });
  }, [rows, search, productFilter]);

  const filteredSummary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return isinSummary.filter((r) => !q || String(r.isin || '').toLowerCase().includes(q));
  }, [isinSummary, search]);

  useEffect(() => {
    if (!detailOpen) return;
    if (!filteredDeals.length) {
      setSelectedId(null);
      setDetailOpen(false);
      return;
    }
    const still = filteredDeals.some((r) => (r.id ?? r.deal_number) === selectedId);
    if (!still) {
      setSelectedId(null);
      setDetailOpen(false);
    }
  }, [filteredDeals, selectedId, detailOpen]);

  const selected = useMemo(
    () => rows.find((r) => (r.id ?? r.deal_number) === selectedId) || null,
    [rows, selectedId]
  );

  const applyDate = () => {
    if (!draftDate) return;
    setAsAtDate(draftDate);
  };

  return (
    <div className="wos">
      <WealthPageHeader
        title="GSec Product Report"
        blurb="Live government-securities holdings and deals as at the selected valuation date."
        actions={
          <>
            <label className="wos-select">
              <span>As at</span>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
            </label>
            <button type="button" className="wos-btn wos-btn--solid" onClick={applyDate} disabled={loading}>
              Run report
            </button>
            <button
              type="button"
              className="wos-btn wos-btn--ghost"
              onClick={() => loadReport(asAtDate)}
              disabled={loading}
            >
              Refresh
            </button>
          </>
        }
      />

      <section className="wos-strip wos-strip--5">
        <article className="wos-stat wos-stat--focus">
          <span className="wos-k">Face value</span>
          <strong>{loading ? '…' : formatCompact(totals.face)}</strong>
          <span className="wos-m">As at {asAtDate}</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Dirty value</span>
          <strong>{loading ? '…' : formatCompact(totals.dirty)}</strong>
          <span className="wos-m">Clean + accrued</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Deals</span>
          <strong>{loading ? '…' : totals.deals}</strong>
          <span className="wos-m">Open tickets</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">ISINs</span>
          <strong>{loading ? '…' : totals.isins}</strong>
          <span className="wos-m">Distinct lines</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Wtd yield</span>
          <strong>{loading ? '…' : fmtPct(totals.wtdYield)}</strong>
          <span className="wos-m">Face-weighted</span>
        </article>
      </section>

      {error ? <p className="wos-message wos-message--warn">{error}</p> : null}

      <section className="wos-toolbar">
        <div className="wos-tabs" role="tablist">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              className={`wos-tab${view === tab ? ' is-on' : ''}`}
              onClick={() => setView(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="wos-toolbar__right">
          <label className="wos-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search deal, ISIN, counterparty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {view === 'Deals' ? (
            <label className="wos-select">
              <span>Product</span>
              <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                <option value="All">All</option>
                {products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="wos-board">
        {loading ? (
          <div className="wos-empty">Loading GSec product report…</div>
        ) : view === 'By ISIN' ? (
          filteredSummary.length === 0 ? (
            <div className="wos-empty">No ISIN summary for this date.</div>
          ) : (
            <div className="wos-table-wrap">
              <table className="wos-table">
                <thead>
                  <tr>
                    {SUMMARY_FIELDS.map((col) => (
                      <th key={col.key} className={col.num ? 'num' : undefined}>
                        {col.k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.map((row) => (
                    <tr key={row.isin} className="is-static">
                      {SUMMARY_FIELDS.map((col) => (
                        <td key={col.key} className={col.num ? 'num' : undefined}>
                          {col.key === 'isin' ? <strong>{col.render(row[col.key])}</strong> : col.render(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredDeals.length === 0 ? (
          <div className="wos-empty">No deals match the current filters.</div>
        ) : (
          <div className="wos-table-wrap">
            <table className="wos-table">
              <thead>
                <tr>
                  {DEAL_FIELDS.map((col) => (
                    <th key={col.key} className={col.num ? 'num' : undefined}>
                      {col.k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((row) => {
                  const key = row.id ?? row.deal_number;
                  return (
                    <tr
                      key={key}
                      className={selectedId === key && detailOpen ? 'is-selected' : ''}
                      onClick={() => {
                        setSelectedId(key);
                        setDetailOpen(true);
                      }}
                    >
                      {DEAL_FIELDS.map((col) => (
                        <td key={col.key} className={col.num ? 'num' : undefined}>
                          {col.key === 'deal_number' ? (
                            <strong>{col.render(row[col.key])}</strong>
                          ) : (
                            col.render(row[col.key])
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <WealthModal
        open={Boolean(selected) && detailOpen}
        onClose={() => setDetailOpen(false)}
        size="xl"
        eyebrow="Deal detail"
        title={selected?.deal_number}
        subtitle={selected ? `${selected.isin} · ${selected.portfolio}` : ''}
        badge={
          selected ? (
            <span className={statusClass(selected.transaction_type || 'Buy')}>
              {selected.transaction_type || 'Buy'}
            </span>
          ) : null
        }
        fields={
          selected
            ? DEAL_FIELDS.map((field) => ({
                k: field.k,
                v: field.render(selected[field.key]),
              }))
            : null
        }
        footer={
          <button type="button" className="wm-modal__btn" onClick={() => setDetailOpen(false)}>
            Close
          </button>
        }
      />
    </div>
  );
};

export default GSecProductReport;
