import React, { useEffect, useMemo, useState } from 'react';
import { accountCategoryAPI, accountReconciliationAPI, trialBalanceAPI } from '../../services/api';
import AccountDetailsModal from '../EquityEntries/AccountDetailsModal';
import './Styles/CombinedTrialBalance.css';
import './Styles/AccountSummaries.css';

const getDefaultDateRange = () => {
  return { startDate: '', endDate: '' };
};

const resolveDates = (f) => {
  const s = f?.startDate != null ? String(f.startDate).trim() : '';
  const e = f?.endDate != null ? String(f.endDate).trim() : '';
  return { startDate: s, endDate: e };
};

const toKey = (value) => String(value ?? '').trim().toLowerCase();
const toLabel = (value) => {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** account_type from a row (snake_case or camelCase). */
const rowAccountType = (c) => toKey(c?.account_type ?? c?.accountType);

/**
 * Distinct account_type from account_categories for the logged-in user.
 * Uses getAll() (parent rows) AND getAllTransactionTypes() — getAll() excludes rows where
 * transaction_type_name IS set, so types would be missing if only TT rows exist.
 */
const buildCategoryTypesFromAccountCategoryRows = (...rowArrays) => {
  const merged = [];
  for (const rows of rowArrays) {
    if (Array.isArray(rows)) merged.push(...rows);
  }
  const distinctTypes = Array.from(new Set(merged.map(rowAccountType).filter(Boolean))).map((k) => ({
    key: k,
    label: toLabel(k)
  }));
  distinctTypes.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  return distinctTypes;
};

const glSourceLabel = (glSource) => {
  if (glSource === 'opening_balance_entries') return 'Opening balance';
  if (glSource === 'general_ledger_entries') return 'General ledger';
  if (glSource === 'other_transaction_gl_entries') return 'Other transactions';
  if (glSource === 'gsec_entries') return 'GSec';
  return glSource || '—';
};

/** Map account-reconciliation /transactions response into AccountDetailsModal shape */
const mapReconciliationToModalData = (accountCode, accountName, startDate, endDate, api) => {
  const txs = Array.isArray(api?.transactions) ? api.transactions : [];
  const total_debit = txs.reduce((s, t) => s + (Number(t.debit) || 0), 0);
  const total_credit = txs.reduce((s, t) => s + (Number(t.credit) || 0), 0);
  const net_balance = total_debit - total_credit;
  return {
    accountCode,
    accountName: accountName || '—',
    period: {
      startDate,
      endDate,
      portfolio: 'GL · Other · GSec · Opening balance'
    },
    entries: txs.map((t) => ({
      date: t.date,
      description: t.description || '—',
      reference: t.reference != null && String(t.reference).trim() !== '' ? String(t.reference) : '—',
      debit: Number(t.debit) || 0,
      credit: Number(t.credit) || 0,
      transaction_type: glSourceLabel(t.gl_source)
    })),
    totals: {
      total_debit,
      total_credit,
      net_balance,
      balance_type: net_balance > 0.005 ? 'DR' : net_balance < -0.005 ? 'CR' : 'ZERO'
    }
  };
};

const AccountSummaries = () => {
  const [filters, setFilters] = useState(() => getDefaultDateRange());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  /** Period last successfully loaded with Apply (used for drill-down so it matches TB data). */
  const [appliedPeriod, setAppliedPeriod] = useState(null);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalCode, setAccountModalCode] = useState('');
  const [accountModalData, setAccountModalData] = useState(null);
  const [accountModalError, setAccountModalError] = useState('');

  const formatDate = (dateString) => {
    if (dateString == null || String(dateString).trim() === '') return '';
    const s = String(dateString).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const local = new Date(y, mo - 1, d);
      if (!Number.isNaN(local.getTime())) {
        return local.toLocaleDateString('en-LK');
      }
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-LK');
  };

  const filterDisplayDates = useMemo(() => resolveDates(filters), [filters]);
  const hasValidPeriod = useMemo(() => {
    return (
      filterDisplayDates.startDate !== '' &&
      filterDisplayDates.endDate !== '' &&
      filterDisplayDates.startDate <= filterDisplayDates.endDate
    );
  }, [filterDisplayDates]);

  // Tabs: distinct account_type from account_categories (parent + transaction-type rows).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawCats, transactionTypes] = await Promise.all([
          accountCategoryAPI.getAll().catch(() => []),
          accountCategoryAPI.getAllTransactionTypes().catch(() => [])
        ]);
        if (cancelled) return;
        setCategoryTypes(buildCategoryTypesFromAccountCategoryRows(rawCats, transactionTypes));
      } catch (e) {
        if (!cancelled) {
          setCategoryTypes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const base = [{ key: 'all', label: 'All' }, ...(categoryTypes || [])];
    // Dedupe by key and drop blanks
    const seen = new Set();
    return base.filter((t) => {
      const k = toKey(t?.key);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [categoryTypes]);

  const activeRow = useMemo(() => {
    const rows = summary?.summary || [];
    if (toKey(activeCategory) === 'all') {
      const debit = rows.reduce((s, r) => s + (Number(r?.total_debit) || 0), 0);
      const credit = rows.reduce((s, r) => s + (Number(r?.total_credit) || 0), 0);
      return { label: 'All', debit, credit, net: debit - credit };
    }
    const key = toKey(activeCategory);
    const r = rows.find((x) => toKey(x?.account_type) === key);
    const debit = Number(r?.total_debit) || 0;
    const credit = Number(r?.total_credit) || 0;
    const net = Number(r?.net_balance);
    const label =
      categories.find((c) => toKey(c?.key) === key)?.label || toLabel(activeCategory) || '—';
    return {
      label,
      debit,
      credit,
      net: Number.isFinite(net) ? net : debit - credit
    };
  }, [summary, activeCategory, categories]);

  const filteredAccounts = useMemo(() => {
    const key = toKey(activeCategory);
    const rows = Array.isArray(accounts) ? accounts : [];
    if (key === 'all') return rows;
    return rows.filter((a) => toKey(a?.account_type) === key);
  }, [accounts, activeCategory]);

  const formatCurrency = (amount) => {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(n);
  };

  const handleDateChange = (field, value) => {
    const defaults = getDefaultDateRange();
    const raw = value != null ? String(value).trim() : '';
    const next =
      raw !== ''
        ? raw
        : field === 'startDate'
          ? defaults.startDate
          : defaults.endDate;
    setFilters((prev) => ({ ...prev, [field]: next }));
  };

  const loadSummary = async (range) => {
    const resolved = resolveDates(range);
    if (!resolved.startDate || !resolved.endDate) {
      setError('Select Start Date and End Date');
      return;
    }
    if (resolved.startDate > resolved.endDate) {
      setError('Start Date must be before End Date');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [summaryRes, tbRes, catsRes, ttRes] = await Promise.all([
        trialBalanceAPI.getTrialBalanceSummary({
          startDate: resolved.startDate,
          endDate: resolved.endDate
        }),
        trialBalanceAPI.getTrialBalance({
          startDate: resolved.startDate,
          endDate: resolved.endDate
        }),
        accountCategoryAPI.getAll().catch(() => []),
        accountCategoryAPI.getAllTransactionTypes().catch(() => [])
      ]);

      if (!summaryRes?.success) {
        throw new Error(summaryRes?.error || 'Failed to load trial balance summary');
      }
      if (!tbRes?.success) {
        throw new Error(tbRes?.error || 'Failed to load trial balance accounts');
      }

      const tbData = tbRes?.data || null;
      const tbAccounts = Array.isArray(tbData?.accounts) ? tbData.accounts : [];
      setAccounts(tbAccounts);

      let nextTabs = buildCategoryTypesFromAccountCategoryRows(
        Array.isArray(catsRes) ? catsRes : [],
        Array.isArray(ttRes) ? ttRes : []
      );
      if (nextTabs.length === 0) {
        const rows = summaryRes?.data?.summary || [];
        nextTabs = Array.from(new Set(rows.map((r) => toKey(r?.account_type)).filter(Boolean))).map((k) => ({
          key: k,
          label: toLabel(k)
        }));
        nextTabs.sort((a, b) => String(a.label).localeCompare(String(b.label)));
      }
      setCategoryTypes(nextTabs);

      setSummary(summaryRes.data || null);
      setAppliedPeriod({ startDate: resolved.startDate, endDate: resolved.endDate });

      // Ensure active category still exists in current tabs.
      setActiveCategory((prev) => {
        const pk = toKey(prev);
        if (!pk) return 'all';
        if (pk === 'all') return 'all';
        return nextTabs.some((t) => toKey(t.key) === pk) ? pk : 'all';
      });
    } catch (e) {
      console.error('AccountSummaries summary:', e);
      setError(e.message || 'Failed to load account categories');
      setSummary(null);
      setAccounts([]);
      setAppliedPeriod(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    loadSummary(filters);
  };

  const clearFilters = () => {
    const next = getDefaultDateRange();
    setFilters(next);
    setSummary(null);
    setAccounts([]);
    setAppliedPeriod(null);
    setError('');
  };

  const handleCloseAccountModal = () => {
    setAccountModalOpen(false);
    setAccountModalData(null);
    setAccountModalError('');
    setAccountModalCode('');
  };

  const handleAccountDrillDown = async (acc, evt) => {
    if (evt) evt.stopPropagation();
    const code = acc?.account_code != null ? String(acc.account_code).trim() : '';
    if (!code || !appliedPeriod?.startDate || !appliedPeriod?.endDate) return;

    setAccountModalOpen(true);
    setAccountModalCode(code);
    setAccountModalData(null);
    setAccountModalError('');

    try {
      const res = await accountReconciliationAPI.getAccountTransactions(code, {
        startDate: appliedPeriod.startDate,
        endDate: appliedPeriod.endDate
      });
      if (res?.error) {
        throw new Error(res.error);
      }
      setAccountModalData(
        mapReconciliationToModalData(
          code,
          acc?.account_name,
          appliedPeriod.startDate,
          appliedPeriod.endDate,
          res
        )
      );
    } catch (err) {
      console.error('AccountSummaries drill-down:', err);
      setAccountModalError(err.message || 'Failed to load entries');
    }
  };

  const periodStart = filterDisplayDates.startDate;
  const periodEnd = filterDisplayDates.endDate;

  return (
    <div className="ctb-page-container">
      <div className="ctb-content-wrapper">
        <div className="ctb-header-section cas-header-wrap">
          <div className="ctb-header-icon">
            <svg className="ctb-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4zm8 1h2v2h-2v-2z" />
            </svg>
          </div>
          <div className="ctb-header-text-group">
            <h1 className="ctb-main-title">Account Summaries</h1>
            <p className="ctb-subtitle">
              High-level debit and credit totals by account classification for Equity and by category
              for GSec over the selected period.
            </p>
          </div>
          <div className="ctb-header-meta">
            <div className="ctb-period">
              Period:&nbsp;
              <span>
                {hasValidPeriod ? `${formatDate(periodStart)} — ${formatDate(periodEnd)}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="ctb-filters-card">
          <div className="ctb-card-header">
            <h2 className="ctb-card-title">Period</h2>
          </div>
          <div className="ctb-filters-content">
            <div className="ctb-filters-grid">
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">Start Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filterDisplayDates.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group">
                <label className="ctb-filter-label">End Date</label>
                <input
                  type="date"
                  lang="en-US"
                  className="ctb-filter-input"
                  value={filterDisplayDates.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
              <div className="ctb-filter-group ctb-filter-actions">
                <button
                  type="button"
                  className="ctb-apply-btn"
                  onClick={handleApply}
                  disabled={loading || !hasValidPeriod}
                  title={!hasValidPeriod ? 'Select a valid Start/End date range' : undefined}
                >
                  Apply
                </button>
                <button type="button" className="ctb-clear-btn" onClick={clearFilters}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="cas-tabs-card">
          <div className="cas-tabs-row" role="tablist" aria-label="Main account categories">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={toKey(activeCategory) === toKey(c.key)}
                className={`cas-tab ${toKey(activeCategory) === toKey(c.key) ? 'active' : ''}`}
                onClick={() => setActiveCategory(toKey(c.key))}
                disabled={loading}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cas-metrics">
          {error ? (
            <div className="cas-error">{error}</div>
          ) : loading ? (
            <div className="cas-loading">Loading categories…</div>
          ) : summary == null ? (
            <div className="cas-loading">Click Apply to load categories.</div>
          ) : (
            <>
              <div className="cas-metric-card">
                <div className="cas-metric-label">{activeRow.label} Debit</div>
                <div className="cas-metric-value debit">{formatCurrency(activeRow.debit)}</div>
              </div>
              <div className="cas-metric-card">
                <div className="cas-metric-label">{activeRow.label} Credit</div>
                <div className="cas-metric-value credit">{formatCurrency(activeRow.credit)}</div>
              </div>
              <div className="cas-metric-card">
                <div className="cas-metric-label">{activeRow.label} Net</div>
                <div className={`cas-metric-value ${activeRow.net >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(activeRow.net)}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="cas-accounts-card">
          <div className="cas-accounts-header">
            <div className="cas-accounts-title">
              {toKey(activeCategory) === 'all' ? 'Accounts (All)' : `Accounts (${activeRow.label})`}
            </div>
            <div className="cas-accounts-meta">
              {filteredAccounts.length} accounts
              {appliedPeriod ? (
                <span className="cas-accounts-hint">
                  {' '}
                  · Click code or name for entries (general ledger, other transactions, GSec)
                </span>
              ) : null}
            </div>
          </div>

          <div className="ctb-table-container">
            {filteredAccounts.length === 0 ? null : (
              <table className="ctb-data-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Net</th>
                    <th>DR / CR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((a, idx) => (
                    <tr key={String(a?.account_code || a?.accountCode || `${a?.account_name || 'acc'}-${idx}`)}>
                      <td
                        className={`ctb-account-code ${appliedPeriod ? 'ctb-account-drilldown' : ''}`}
                        onClick={appliedPeriod ? (e) => handleAccountDrillDown(a, e) : undefined}
                        role={appliedPeriod ? 'button' : undefined}
                        tabIndex={appliedPeriod ? 0 : undefined}
                        title={
                          appliedPeriod
                            ? 'View entries from general ledger, other transactions, and GSec'
                            : undefined
                        }
                        onKeyDown={
                          appliedPeriod
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleAccountDrillDown(a, e);
                                }
                              }
                            : undefined
                        }
                      >
                        {a.account_code}
                      </td>
                      <td
                        className={`ctb-account-name ${appliedPeriod ? 'ctb-account-drilldown' : ''}`}
                        onClick={appliedPeriod ? (e) => handleAccountDrillDown(a, e) : undefined}
                        role={appliedPeriod ? 'button' : undefined}
                        tabIndex={appliedPeriod ? 0 : undefined}
                        title={
                          appliedPeriod
                            ? 'View entries from general ledger, other transactions, and GSec'
                            : undefined
                        }
                        onKeyDown={
                          appliedPeriod
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleAccountDrillDown(a, e);
                                }
                              }
                            : undefined
                        }
                      >
                        {a.account_name}
                      </td>
                      <td className="ctb-debit">
                        {Number(a.total_debit) > 0 ? formatCurrency(a.total_debit) : '—'}
                      </td>
                      <td className="ctb-credit">
                        {Number(a.total_credit) > 0 ? formatCurrency(a.total_credit) : '—'}
                      </td>
                      <td
                        className={`ctb-net-balance${
                          Number(a.net_balance) > 0.005
                            ? ' positive'
                            : Number(a.net_balance) < -0.005
                              ? ' negative'
                              : ''
                        }`}
                      >
                        {Math.abs(Number(a.net_balance) || 0) < 0.005 ? '—' : formatCurrency(a.net_balance)}
                      </td>
                      <td className="ctb-balance-type-cell">{a.balance_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AccountDetailsModal
        isOpen={accountModalOpen}
        onClose={handleCloseAccountModal}
        accountCode={accountModalCode}
        accountData={accountModalData}
        loadError={accountModalError}
        detailSource="Combined (GL · Other · GSec · OB)"
      />
    </div>
  );
};

export default AccountSummaries;
