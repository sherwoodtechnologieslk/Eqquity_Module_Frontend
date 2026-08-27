import React, { useCallback, useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import WealthModal from '../shared/WealthModal';
import { gsecEntriesAPI } from '../../../services/api';
import { IconSearch, formatCompact, formatMoney, todayISO } from '../shared/wealthOpsKit';
import '../shared/WealthOps.css';

const parseNum = (value) => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return parseFloat(String(value).replace(/,/g, '')) || 0;
};

const ymd = (value) => (value ? String(value).slice(0, 10) : '—');
const fmtPct = (value) => `${parseNum(value).toFixed(2)}%`;
const fmtNum2 = (value) => parseNum(value).toFixed(2);
const fmtInt = (value) => String(Math.round(parseNum(value)));
const fmtText = (value) => (value == null || value === '' ? '—' : String(value));
const fmtMoney = (value) => formatMoney(parseNum(value));

const DEAL_FIELDS = [
  { k: 'Deal number', key: 'deal_number', render: fmtText },
  { k: 'Trade date', key: 'trade_date', render: ymd },
  { k: 'Value date', key: 'value_date', render: ymd },
  { k: 'Type', key: 'transaction_type', render: fmtText },
  { k: 'Counterparty', key: 'counterparty', render: fmtText },
  { k: 'ISIN', key: 'isin_number', render: fmtText },
  { k: 'Maturity', key: 'maturity_date', render: ymd },
  { k: 'Face value', key: 'face_value', num: true, render: fmtMoney },
  { k: 'Discount rate', key: 'discount_rate_pct', num: true, render: fmtPct },
  { k: 'DTM', key: 'days_to_maturity', num: true, render: fmtInt },
  { k: 'Price / 100', key: 'price_per_100', num: true, render: fmtNum2 },
  { k: 'Settlement', key: 'settlement_amount', num: true, render: fmtMoney },
  { k: 'Portfolio', key: 'portfolio', render: fmtText },
  { k: 'Buy deal', key: 'buy_deal_number', render: fmtText },
  { k: 'Remaining face', key: 'remaining_face_value', num: true, render: fmtMoney },
  { k: 'Per-day accrual', key: 'per_day_accrual', num: true, render: fmtMoney },
  { k: 'Accrued interest', key: 'accrued_interest_to_date', num: true, render: fmtMoney },
  { k: 'Product', key: 'product_type', render: fmtText },
];

const rowKey = (row, index) => row?.id ?? row?.deal_number ?? `tbill-${index}`;

const TBills = () => {
  const [asAtDate, setAsAtDate] = useState(todayISO());
  const [draftDate, setDraftDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedKey, setSelectedKey] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadReport = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const payload = await gsecEntriesAPI.getTBills({ asAtDate: date });
      const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setRows(data);
      setSelectedKey(null);
      setDetailOpen(false);
    } catch (err) {
      setRows([]);
      setSelectedKey(null);
      setError(err.message || 'Failed to load T-bill deals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(asAtDate);
  }, [asAtDate, loadReport]);

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.transaction_type).filter(Boolean))),
    [rows]
  );

  const totals = useMemo(() => {
    const face = rows.reduce((sum, r) => sum + parseNum(r.face_value), 0);
    const remaining = rows.reduce((sum, r) => sum + parseNum(r.remaining_face_value), 0);
    const accrued = rows.reduce((sum, r) => sum + parseNum(r.accrued_interest_to_date), 0);
    const avgDiscount =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + parseNum(r.discount_rate_pct), 0) / rows.length
        : 0;
    return { face, remaining, accrued, deals: rows.length, avgDiscount };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesType = typeFilter === 'All' || r.transaction_type === typeFilter;
      const hay = [
        r.deal_number,
        r.isin_number,
        r.counterparty,
        r.portfolio,
        r.product_type,
        r.buy_deal_number,
      ]
        .join(' ')
        .toLowerCase();
      return matchesType && (!q || hay.includes(q));
    });
  }, [rows, search, typeFilter]);

  useEffect(() => {
    if (!detailOpen) return;
    const still = filtered.some((r, i) => rowKey(r, i) === selectedKey);
    if (!still) {
      setSelectedKey(null);
      setDetailOpen(false);
    }
  }, [filtered, selectedKey, detailOpen]);

  const selected = useMemo(
    () => rows.find((r, i) => rowKey(r, i) === selectedKey) || null,
    [rows, selectedKey]
  );

  const applyDate = () => {
    if (!draftDate) return;
    setAsAtDate(draftDate);
  };

  return (
    <div className="wos">
      <WealthPageHeader
        title="T-Bills"
        blurb="Treasury-bill deals as at the selected valuation date."
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
          <span className="wos-k">Remaining</span>
          <strong>{loading ? '…' : formatCompact(totals.remaining)}</strong>
          <span className="wos-m">Open face</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Deals</span>
          <strong>{loading ? '…' : totals.deals}</strong>
          <span className="wos-m">T-bill tickets</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Accrued</span>
          <strong>{loading ? '…' : formatCompact(totals.accrued)}</strong>
          <span className="wos-m">Interest to date</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Avg discount</span>
          <strong>{loading ? '…' : fmtPct(totals.avgDiscount)}</strong>
          <span className="wos-m">Simple average</span>
        </article>
      </section>

      {error ? <p className="wos-message wos-message--warn">{error}</p> : null}

      <section className="wos-toolbar">
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
          <label className="wos-select">
            <span>Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="wos-board">
        {loading ? (
          <div className="wos-empty">Loading T-bill deals…</div>
        ) : filtered.length === 0 ? (
          <div className="wos-empty">No T-bill deals match the current filters.</div>
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
                {filtered.map((row, index) => {
                  const key = rowKey(row, index);
                  return (
                    <tr
                      key={key}
                      className={selectedKey === key && detailOpen ? 'is-selected' : ''}
                      onClick={() => {
                        setSelectedKey(key);
                        setDetailOpen(true);
                      }}
                    >
                      {DEAL_FIELDS.map((col) => (
                        <td key={col.key} className={col.num ? 'num' : undefined}>
                          {col.key === 'deal_number' || col.key === 'isin_number' ? (
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
        eyebrow="T-Bill"
        title={selected?.deal_number}
        subtitle={selected ? `${selected.isin_number || '—'} · ${selected.counterparty || '—'}` : ''}
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

export default TBills;
