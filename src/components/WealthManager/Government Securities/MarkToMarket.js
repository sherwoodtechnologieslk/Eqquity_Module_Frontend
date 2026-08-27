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
const fmtNum4 = (value) => parseNum(value).toFixed(4);
const fmtText = (value) => (value == null || value === '' ? '—' : String(value));
const fmtDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return ymd(value);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const signedClass = (value) => {
  const n = parseNum(value);
  if (n > 0) return 'num wos-up';
  if (n < 0) return 'num wos-down';
  return 'num';
};

const fmtInstrument = (value) => fmtText(value).replace(/_/g, ' ');

const PRICE_FIELDS = [
  { k: 'Series', key: 'series', render: fmtText },
  { k: 'ISIN', key: 'isin', render: fmtText },
  { k: 'Instrument', key: 'instrument_type', render: fmtInstrument },
  { k: 'Quote source', key: 'quote_source', render: fmtText },
  { k: 'Issuer', key: 'isin_issuer', render: fmtText },
  { k: 'Maturity', key: 'maturity_date', render: ymd },
  { k: 'Buy price', key: 'buying_price', num: true, render: fmtNum4 },
  { k: 'Sell price', key: 'selling_price', num: true, render: fmtNum4 },
  { k: 'Avg price', key: 'average_price', num: true, render: fmtNum4 },
  { k: 'Dirty price', key: 'dirty_price', num: true, render: fmtNum4 },
  { k: 'Buy yield', key: 'buying_yield', num: true, render: fmtPct },
  { k: 'Sell yield', key: 'selling_yield', num: true, render: fmtPct },
  { k: 'Avg yield', key: 'average_yield', num: true, render: fmtPct },
  { k: 'Balance', key: 'balance', num: true, render: (v) => formatMoney(parseNum(v)) },
  { k: 'WAP', key: 'wap', num: true, render: fmtNum4 },
  {
    k: 'Unrealized P&L',
    key: 'unrealized_gain',
    num: true,
    signed: true,
    render: (v) => formatMoney(parseNum(v)),
  },
  { k: 'Last updated', key: 'last_updated', render: fmtDateTime },
  { k: 'Excel source', key: 'excel_source', render: fmtText },
];

const DETAIL_FIELDS = PRICE_FIELDS;

const VIEW_TABS = [
  { id: 'prices', label: 'Prices' },
  { id: 'sells', label: 'Outstanding sells' },
  { id: 'buybacks', label: 'Buybacks' },
];

const labelize = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isNumericKey = (key) =>
  /price|yield|gain|amount|value|qty|quantity|face|pnl|rate|balance|wap/i.test(String(key || ''));

const isDateKey = (key) => /date|updated|maturity/i.test(String(key || ''));

const renderOutstandingValue = (key, value) => {
  if (value == null || value === '') return '—';
  if (isDateKey(key)) return ymd(value);
  if (isNumericKey(key) && !Number.isNaN(parseNum(value))) {
    if (/yield|rate/i.test(key)) return fmtPct(value);
    if (/price/i.test(key)) return fmtNum4(value);
    return formatMoney(parseNum(value));
  }
  return fmtText(value);
};

const outstandingColumns = (rows) => {
  const keys = [];
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!keys.includes(key)) keys.push(key);
    });
  });
  return keys.map((key) => ({
    k: labelize(key),
    key,
    num: isNumericKey(key),
    render: (v) => renderOutstandingValue(key, v),
  }));
};

const rowKey = (row, index) =>
  row?.isin || row?.series || row?.id || row?.deal_number || `row-${index}`;

const MarkToMarket = () => {
  const [asAtDate, setAsAtDate] = useState(todayISO());
  const [draftDate, setDraftDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [outstanding, setOutstanding] = useState({ sells: [], buybacks: [] });
  const [view, setView] = useState('prices');
  const [search, setSearch] = useState('');
  const [issuerFilter, setIssuerFilter] = useState('All');
  const [selectedKey, setSelectedKey] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadReport = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const payload = await gsecEntriesAPI.getMarkToMarket({
        asAtDate: date,
        page: 1,
        pageSize: 500,
      });
      const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setRows(data);
      setOutstanding({
        sells: Array.isArray(payload?.outstanding?.sells) ? payload.outstanding.sells : [],
        buybacks: Array.isArray(payload?.outstanding?.buybacks) ? payload.outstanding.buybacks : [],
      });
      setSelectedKey(null);
      setDetailOpen(false);
    } catch (err) {
      setRows([]);
      setOutstanding({ sells: [], buybacks: [] });
      setSelectedKey(null);
      setError(err.message || 'Failed to load mark-to-market prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(asAtDate);
  }, [asAtDate, loadReport]);

  const issuers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.isin_issuer).filter(Boolean))),
    [rows]
  );

  const totals = useMemo(() => {
    const pnl = rows.reduce((sum, r) => sum + parseNum(r.unrealized_gain), 0);
    const isins = new Set(rows.map((r) => r.isin).filter(Boolean)).size;
    const avgYield =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + parseNum(r.average_yield), 0) / rows.length
        : 0;
    const sources = Array.from(new Set(rows.map((r) => r.excel_source).filter(Boolean)));
    return { pnl, isins, lines: rows.length, avgYield, sources };
  }, [rows]);

  const filteredPrices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesIssuer = issuerFilter === 'All' || r.isin_issuer === issuerFilter;
      const hay = [r.series, r.isin, r.instrument_type, r.quote_source, r.isin_issuer, r.excel_source]
        .join(' ')
        .toLowerCase();
      return matchesIssuer && (!q || hay.includes(q));
    });
  }, [rows, search, issuerFilter]);

  const filteredSells = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return outstanding.sells;
    return outstanding.sells.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [outstanding.sells, search]);

  const filteredBuybacks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return outstanding.buybacks;
    return outstanding.buybacks.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [outstanding.buybacks, search]);

  useEffect(() => {
    if (!detailOpen) return;
    const still = filteredPrices.some((r, i) => rowKey(r, i) === selectedKey);
    if (!still) {
      setSelectedKey(null);
      setDetailOpen(false);
    }
  }, [filteredPrices, selectedKey, detailOpen]);

  const selected = useMemo(
    () => rows.find((r, i) => rowKey(r, i) === selectedKey) || null,
    [rows, selectedKey]
  );

  const applyDate = () => {
    if (!draftDate) return;
    setAsAtDate(draftDate);
  };

  const sellCols = useMemo(() => outstandingColumns(filteredSells), [filteredSells]);
  const buybackCols = useMemo(() => outstandingColumns(filteredBuybacks), [filteredBuybacks]);

  const renderTable = (list, fields, empty, interactive) => {
    if (list.length === 0) return <div className="wos-empty">{empty}</div>;
    return (
      <div className="wos-table-wrap">
        <table className="wos-table">
          <thead>
            <tr>
              {fields.map((col) => (
                <th key={col.key} className={col.num ? 'num' : undefined}>
                  {col.k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((row, index) => {
              const key = rowKey(row, index);
              return (
                <tr
                  key={key}
                  className={
                    interactive && selectedKey === key && detailOpen
                      ? 'is-selected'
                      : interactive
                        ? ''
                        : 'is-static'
                  }
                  onClick={
                    interactive
                      ? () => {
                          setSelectedKey(key);
                          setDetailOpen(true);
                        }
                      : undefined
                  }
                >
                  {fields.map((col) => (
                    <td
                      key={col.key}
                      className={col.signed ? signedClass(row[col.key]) : col.num ? 'num' : undefined}
                    >
                      {col.key === 'series' || col.key === 'isin' ? (
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
    );
  };

  return (
    <div className="wos">
      <WealthPageHeader
        title="Mark to Market"
        blurb="CBSL gilt prices, yields, and unrealized P&L as at the selected valuation date."
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
          <span className="wos-k">Unrealized P&L</span>
          <strong className={loading ? undefined : signedClass(totals.pnl).replace('num ', '')}>
            {loading ? '…' : formatCompact(totals.pnl)}
          </strong>
          <span className="wos-m">As at {asAtDate}</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Lines</span>
          <strong>{loading ? '…' : totals.lines}</strong>
          <span className="wos-m">Quoted series</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">ISINs</span>
          <strong>{loading ? '…' : totals.isins}</strong>
          <span className="wos-m">Distinct issues</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Avg yield</span>
          <strong>{loading ? '…' : fmtPct(totals.avgYield)}</strong>
          <span className="wos-m">Simple average</span>
        </article>
        <article className="wos-stat">
          <span className="wos-k">Source</span>
          <strong>{loading ? '…' : totals.sources.length || '—'}</strong>
          <span className="wos-m">
            {totals.sources.length === 1 ? totals.sources[0] : 'Excel files'}
          </span>
        </article>
      </section>

      {error ? <p className="wos-message wos-message--warn">{error}</p> : null}

      <section className="wos-toolbar">
        <div className="wos-tabs" role="tablist">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              className={`wos-tab${view === tab.id ? ' is-on' : ''}`}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
              {tab.id === 'sells' && outstanding.sells.length ? ` (${outstanding.sells.length})` : ''}
              {tab.id === 'buybacks' && outstanding.buybacks.length
                ? ` (${outstanding.buybacks.length})`
                : ''}
            </button>
          ))}
        </div>
        <div className="wos-toolbar__right">
          <label className="wos-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search series, ISIN, issuer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {view === 'prices' ? (
            <label className="wos-select">
              <span>Issuer</span>
              <select value={issuerFilter} onChange={(e) => setIssuerFilter(e.target.value)}>
                <option value="All">All</option>
                {issuers.map((issuer) => (
                  <option key={issuer} value={issuer}>
                    {issuer}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="wos-board">
        {loading ? (
          <div className="wos-empty">Loading mark-to-market prices…</div>
        ) : view === 'sells' ? (
          renderTable(filteredSells, sellCols, 'No outstanding sells for this date.', false)
        ) : view === 'buybacks' ? (
          renderTable(filteredBuybacks, buybackCols, 'No outstanding buybacks for this date.', false)
        ) : (
          renderTable(filteredPrices, PRICE_FIELDS, 'No mark-to-market prices match the current filters.', true)
        )}
      </section>

      <WealthModal
        open={Boolean(selected) && detailOpen}
        onClose={() => setDetailOpen(false)}
        size="xl"
        eyebrow="Mark to market"
        title={selected?.series}
        subtitle={selected ? `${selected.isin} · ${selected.isin_issuer || '—'}` : ''}
        fields={
          selected
            ? DETAIL_FIELDS.map((field) => ({
                k: field.k,
                v: field.render(selected[field.key]),
                className: field.signed ? signedClass(selected[field.key]).replace('num ', '') : undefined,
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

export default MarkToMarket;
