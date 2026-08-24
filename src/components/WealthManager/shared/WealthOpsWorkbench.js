import React, { useEffect, useMemo, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import { IconPlus, IconSearch, statusClass } from './wealthOpsKit';
import './WealthOps.css';

const stripClass = (count) => {
  if (count <= 4) return 'wos-strip wos-strip--4';
  if (count === 5) return 'wos-strip wos-strip--5';
  return 'wos-strip';
};

const WealthOpsWorkbench = ({
  title,
  blurb,
  newLabel,
  formTitle,
  formHint,
  formFields = [],
  initialForm,
  estimate,
  validateForm,
  buildRow,
  seedRows = [],
  idPrefix = 'REC',
  stats,
  statusTabs = ['All'],
  extraFilter,
  searchKeys = ['id'],
  searchPlaceholder = 'Search…',
  columns = [],
  boardTitle = 'Records',
  detailEyebrow = 'Record detail',
  detailTitle,
  detailSubtitle,
  detailFields = [],
  notesKey = 'notes',
  statusActions = {},
  afterStats = null,
}) => {
  const [form, setForm] = useState(initialForm || {});
  const [showForm, setShowForm] = useState(Boolean(formFields.length));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [extraValue, setExtraValue] = useState('All');
  const [selectedId, setSelectedId] = useState(seedRows[0]?.id || null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [rows, setRows] = useState(seedRows);

  const summary = useMemo(() => (typeof stats === 'function' ? stats(rows) : stats || []), [rows, stats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        searchKeys.some((key) =>
          String(row[key] ?? '')
            .toLowerCase()
            .includes(q)
        );
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const matchesExtra =
        !extraFilter || extraValue === 'All' || String(row[extraFilter.key]) === extraValue;
      return matchesSearch && matchesStatus && matchesExtra;
    });
  }, [rows, search, searchKeys, statusFilter, extraFilter, extraValue]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!filtered.some((row) => row.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) || null,
    [rows, selectedId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitMessage('');
  };

  const handleReset = () => {
    setForm(initialForm || {});
    setSubmitMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateForm ? validateForm(form) : '';
    if (error) {
      setSubmitMessage(error);
      return;
    }
    const next = buildRow
      ? buildRow(form, rows)
      : { ...form, id: `${idPrefix}-${String(rows.length + 1).padStart(4, '0')}`, status: 'Pending' };
    setRows((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setStatusFilter('All');
    setSubmitMessage(`${next.id} submitted.`);
    setForm(initialForm || {});
  };

  const updateStatus = (id, status) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  const extraOptions = useMemo(() => {
    if (!extraFilter) return [];
    return Array.from(new Set(rows.map((row) => row[extraFilter.key]).filter(Boolean)));
  }, [rows, extraFilter]);

  const renderCell = (col, row) => {
    if (col.render) return col.render(row);
    const value = row[col.key];
    if (col.badge) return <span className={statusClass(value)}>{value}</span>;
    if (col.sub) {
      return (
        <>
          <strong>{value}</strong>
          <span className="wos-sub">{row[col.sub]}</span>
        </>
      );
    }
    return value;
  };

  return (
    <div className="wos">
      <WealthPageHeader
        title={title}
        blurb={blurb}
        actions={
          formFields.length ? (
            <>
              <button
                type="button"
                className="wos-btn wos-btn--ghost"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Hide form' : 'Show form'}
              </button>
              <button
                type="button"
                className="wos-btn wos-btn--solid"
                onClick={() => {
                  setShowForm(true);
                  setForm(initialForm || {});
                  setSubmitMessage('');
                }}
              >
                <IconPlus />
                {newLabel || 'New record'}
              </button>
            </>
          ) : null
        }
      />

      {summary.length > 0 && (
        <section className={stripClass(summary.length)} aria-label={`${title} summary`}>
          {summary.map((item) => (
            <article key={item.k} className={`wos-stat${item.focus ? ' wos-stat--focus' : ''}`}>
              <span className="wos-k">{item.k}</span>
              <strong>{item.v}</strong>
              <span className="wos-m">{item.m}</span>
            </article>
          ))}
        </section>
      )}

      {afterStats}

      {showForm && formFields.length > 0 && (
        <section className="wos-form-panel" aria-label={formTitle || 'New record'}>
          <header className="wos-panel-head">
            <div>
              <h2>{formTitle || 'New record'}</h2>
              <p>{typeof formHint === 'function' ? formHint(form) : formHint}</p>
            </div>
          </header>
          <form className="wos-form" onSubmit={handleSubmit}>
            <div className="wos-form-grid">
              {formFields.map((field) => (
                <label
                  key={field.name}
                  className={`wos-field${field.wide ? ' wos-field--wide' : ''}`}
                >
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select name={field.name} value={form[field.name] || ''} onChange={handleChange}>
                      {(field.options || []).map((opt) => (
                        <option key={opt.value || opt} value={opt.value || opt}>
                          {opt.label || opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      value={form[field.name] || ''}
                      placeholder={field.placeholder}
                      onChange={handleChange}
                    />
                  ) : (
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      min={field.min}
                      step={field.step}
                      placeholder={field.placeholder}
                      value={form[field.name] || ''}
                      onChange={handleChange}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="wos-form-footer">
              <div className="wos-estimate">
                <span>{estimate ? 'Estimate' : 'Instruction'}</span>
                <strong>
                  {typeof estimate === 'function' ? estimate(form) : estimate || 'Ready to submit'}
                </strong>
              </div>
              <div className="wos-form-actions">
                <button type="button" className="wos-btn wos-btn--ghost" onClick={handleReset}>
                  Reset
                </button>
                <button type="submit" className="wos-btn wos-btn--solid">
                  {newLabel || 'Submit'}
                </button>
              </div>
            </div>
            {submitMessage ? <p className="wos-message">{submitMessage}</p> : null}
          </form>
        </section>
      )}

      <section className="wos-toolbar">
        <div className="wos-tabs" role="tablist">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab}
              className={`wos-tab${statusFilter === tab ? ' is-on' : ''}`}
              onClick={() => setStatusFilter(tab)}
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
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {extraFilter ? (
            <label className="wos-select">
              <span>{extraFilter.label}</span>
              <select value={extraValue} onChange={(e) => setExtraValue(e.target.value)}>
                <option value="All">All</option>
                {extraOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className="wos-btn wos-btn--ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setExtraValue('All');
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="wos-board">
        <header className="wos-board__head">
          <div>
            <h2>{boardTitle}</h2>
            <p>
              {filtered.length} matching · select a row for details
            </p>
          </div>
        </header>
        {filtered.length === 0 ? (
          <div className="wos-empty">No records match the current filters.</div>
        ) : (
          <div className="wos-table-wrap">
            <table className="wos-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={col.num ? 'num' : undefined}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(row.id)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={col.num ? 'num' : undefined}>
                        {renderCell(col, row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <aside className="wos-detail">
          <header className="wos-detail__head">
            <div>
              <p className="wos-detail__eyebrow">{detailEyebrow}</p>
              <h3>{detailTitle ? detailTitle(selected) : selected.id}</h3>
              <p>{detailSubtitle ? detailSubtitle(selected) : selected.clientName || selected.fundName}</p>
            </div>
            {selected.status ? (
              <span className={statusClass(selected.status)}>{selected.status}</span>
            ) : null}
          </header>
          <div className="wos-detail__grid">
            {detailFields.map((field) => (
              <div key={field.k}>
                <span className="wos-k">{field.k}</span>
                <strong>{field.get ? field.get(selected) : selected[field.key]}</strong>
              </div>
            ))}
          </div>
          {selected[notesKey] ? <p className="wos-detail__notes">{selected[notesKey]}</p> : null}
          {statusActions[selected.status] ? (
            <div className="wos-detail__actions">
              {statusActions[selected.status].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`wos-btn wos-btn--${action.variant || 'ghost'}`}
                  onClick={() => updateStatus(selected.id, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
};

export default WealthOpsWorkbench;
