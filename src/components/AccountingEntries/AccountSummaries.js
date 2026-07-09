import React, { useEffect, useMemo, useState } from 'react';
import { accountCategoryAPI, trialBalanceAPI, gsecEntriesAPI } from '../../services/api';
import AccountDetailsModal from '../EquityEntries/AccountDetailsModal';
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

/** Map a GSec balance-sheet account entry into the AccountDetailsModal entry shape. */
const mapGsecEntry = (e) => ({
  source: 'GSec',
  ledgerSource: 'gsec',
  lineId: e.id,
  date: e.entry_date,
  description: e.description || '—',
  reference: e.deal_number != null && e.deal_number !== '' ? String(e.deal_number) : '—',
  debit: Number(e.debit_amount) || 0,
  credit: Number(e.credit_amount) || 0,
  transaction_type: [e.account_category, e.currency].filter(Boolean).join(' · ') || 'GSec',
});

/** Map an Equity trial-balance account entry into the AccountDetailsModal entry shape. */
const mapEquityEntry = (e) => {
  const isOpening =
    e.entry_source === 'OpeningBalance' ||
    (!!e.description && /opening/i.test(String(e.description)));
  const ledgerSource =
    e.entry_source === 'OtherTransaction'
      ? 'other'
      : e.entry_source === 'GeneralLedger'
        ? 'equity'
        : null;

  return {
    ...e,
    source: isOpening ? 'Opening Balance' : 'Equity',
    ledgerSource: isOpening ? null : ledgerSource,
    lineId: isOpening ? null : e.id,
    transaction_type:
      e.transaction_type ||
      (isOpening ? 'Opening balance' : null) ||
      e.status ||
      '—',
  };
};

const entryDateValue = (e) => {
  const t = new Date(e.date).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Merge equity trial-balance accounts (which already cover general ledger, other
 * transactions and opening balances) with GSec balance-sheet accounts, keyed by
 * account_code. This makes GSec-only accounts appear in the list so they can be
 * selected and drilled into. GSec account_category is used as the type when the
 * code is GSec-only; overlapping codes keep both labels.
 */
const mergeEquityAndGsecAccounts = (equityAccounts, gsecAccounts) => {
  const byCode = new Map();

  const ensure = (code) => {
    const key = String(code ?? '').trim();
    if (!key) return null;
    if (!byCode.has(key)) {
      byCode.set(key, {
        account_code: key,
        account_name: '',
        account_type: '',
        total_debit: 0,
        total_credit: 0
      });
    }
    return byCode.get(key);
  };

  (Array.isArray(equityAccounts) ? equityAccounts : []).forEach((a) => {
    const row = ensure(a?.account_code);
    if (!row) return;
    row.total_debit += Number(a?.total_debit) || 0;
    row.total_credit += Number(a?.total_credit) || 0;
    row.account_name = row.account_name || a?.account_name || '';
    if (!row.account_type) row.account_type = a?.account_type || '';
  });

  (Array.isArray(gsecAccounts) ? gsecAccounts : []).forEach((g) => {
    const row = ensure(g?.account_code);
    if (!row) return;
    row.total_debit += Number(g?.total_debit) || 0;
    row.total_credit += Number(g?.total_credit) || 0;
    row.account_name = row.account_name || g?.account_name || '';
    const gsecType = g?.account_category || 'GSec';
    if (!row.account_type) {
      row.account_type = gsecType;
    } else if (toKey(row.account_type) !== toKey(gsecType)) {
      row.account_type = `${row.account_type} / ${gsecType}`;
    }
  });

  return Array.from(byCode.values())
    .map((row) => {
      const net = row.total_debit - row.total_credit;
      return {
        ...row,
        net_balance: net,
        balance_type: net > 0.005 ? 'DR' : net < -0.005 ? 'CR' : 'ZERO'
      };
    })
    .sort((a, b) =>
      String(a.account_code).localeCompare(String(b.account_code), undefined, { numeric: true })
    );
};

const IconInfo = () => (
  <svg className="cas-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeWidth="1.5" d="M10 9v4M10 7h.01" />
  </svg>
);

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

  const activeCategoryLabel = useMemo(() => {
    const key = toKey(activeCategory);
    if (key === 'all') return 'All';
    return categories.find((c) => toKey(c?.key) === key)?.label || toLabel(activeCategory) || '—';
  }, [activeCategory, categories]);

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

  const formatNetBalance = (net) => {
    const n = Number(net) || 0;
    if (Math.abs(n) < 0.005) return { text: '—', side: null };
    const side = n > 0 ? 'DR' : 'CR';
    return { text: formatCurrency(Math.abs(n)), side };
  };

  const periodLabel = appliedPeriod
    ? `${formatDate(appliedPeriod.startDate)} – ${formatDate(appliedPeriod.endDate)}`
    : hasValidPeriod
      ? `${formatDate(filterDisplayDates.startDate)} – ${formatDate(filterDisplayDates.endDate)}`
      : 'Select dates';

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
      const [summaryRes, tbRes, gsecBsRes, catsRes, ttRes] = await Promise.all([
        trialBalanceAPI.getTrialBalanceSummary({
          startDate: resolved.startDate,
          endDate: resolved.endDate
        }),
        trialBalanceAPI.getTrialBalance({
          startDate: resolved.startDate,
          endDate: resolved.endDate
        }),
        // GSec failure must not break the screen — equity data still shows.
        gsecEntriesAPI
          .getBalanceSheet({ startDate: resolved.startDate, endDate: resolved.endDate })
          .catch((err) => ({ success: false, error: err?.message })),
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
      const gsecAccounts =
        gsecBsRes?.success && Array.isArray(gsecBsRes?.data?.accounts)
          ? gsecBsRes.data.accounts
          : [];
      const mergedAccounts = mergeEquityAndGsecAccounts(tbAccounts, gsecAccounts);
      setAccounts(mergedAccounts);

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
      }
      // Ensure every account_type present in the merged accounts (including GSec
      // categories) is reachable as a tab, so no account is hidden.
      const existingTabKeys = new Set(nextTabs.map((t) => toKey(t.key)));
      Array.from(new Set(mergedAccounts.map((a) => toKey(a?.account_type)).filter(Boolean))).forEach(
        (k) => {
          if (!existingTabKeys.has(k)) {
            nextTabs.push({ key: k, label: toLabel(k) });
            existingTabKeys.add(k);
          }
        }
      );
      nextTabs.sort((a, b) => String(a.label).localeCompare(String(b.label)));
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
      const queryFilters = {
        startDate: appliedPeriod.startDate,
        endDate: appliedPeriod.endDate,
      };

      const [equityRes, gsecRes] = await Promise.all([
        trialBalanceAPI
          .getAccountDetails(code, queryFilters)
          .catch((err) => ({ success: false, error: err?.message || 'Equity fetch failed' })),
        gsecEntriesAPI
          .getBalanceSheetAccountDetails(code, queryFilters)
          .catch((err) => ({ success: false, error: err?.message || 'GSec fetch failed' })),
      ]);

      const equityEntries =
        equityRes?.success && Array.isArray(equityRes?.data?.entries)
          ? equityRes.data.entries.map(mapEquityEntry)
          : [];
      const gsecEntries =
        gsecRes?.success && Array.isArray(gsecRes?.data?.entries)
          ? gsecRes.data.entries.map(mapGsecEntry)
          : [];

      const mergedEntries = [...equityEntries, ...gsecEntries].sort(
        (a, b) => entryDateValue(b) - entryDateValue(a)
      );

      if (
        mergedEntries.length === 0 &&
        equityRes?.success === false &&
        gsecRes?.success === false
      ) {
        throw new Error(
          equityRes?.error || gsecRes?.error || 'Failed to load account details'
        );
      }

      const total_debit = mergedEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
      const total_credit = mergedEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
      const net_balance = total_debit - total_credit;

      const sources = [];
      if (equityEntries.length > 0) sources.push('Equity');
      if (gsecEntries.length > 0) sources.push('GSec');

      setAccountModalData({
        accountCode: code,
        accountName:
          equityRes?.data?.accountName ||
          gsecRes?.data?.accountName ||
          acc?.account_name ||
          '',
        period: {
          startDate: appliedPeriod.startDate,
          endDate: appliedPeriod.endDate,
          portfolio:
            equityRes?.data?.period?.portfolio ||
            (sources.length > 0 ? sources.join(' + ') : 'GL · Other · GSec · Opening balance'),
        },
        entries: mergedEntries,
        totals: {
          total_debit,
          total_credit,
          net_balance,
          balance_type: net_balance > 0.005 ? 'DR' : net_balance < -0.005 ? 'CR' : 'ZERO',
        },
      });
    } catch (err) {
      console.error('AccountSummaries drill-down:', err);
      setAccountModalError(err.message || 'Failed to load entries');
    }
  };

  const periodStart = filterDisplayDates.startDate;
  const periodEnd = filterDisplayDates.endDate;
  const accountsTitle =
    toKey(activeCategory) === 'all' ? 'Accounts (All)' : `Accounts (${activeCategoryLabel})`;

  return (
    <div className="cas-page-container">
      <div className="cas-content-wrapper">
        <header className="cas-masthead">
          <div className="cas-masthead__primary">
            <p className="cas-eyebrow">Financial Reporting</p>
            <h1 className="cas-main-title">Account Summaries</h1>
            <p className="cas-subtitle">
              High-level debit and credit totals by account classification for Equity and by category
              for GSec over the selected period.
            </p>
          </div>
          <div className="cas-masthead__meta">
            <div className="cas-meta-chip">
              <span className="cas-meta-chip__label">Reporting Period</span>
              <span className="cas-meta-chip__value">{periodLabel}</span>
            </div>
            <div className="cas-meta-chip">
              <span className="cas-meta-chip__label">Category</span>
              <span className="cas-meta-chip__value">{activeCategoryLabel}</span>
            </div>
            <div className="cas-meta-chip">
              <span className="cas-meta-chip__label">Accounts</span>
              <span className="cas-meta-chip__value">{filteredAccounts.length}</span>
            </div>
          </div>
        </header>

        <section className="cas-toolbar" aria-label="Report filters">
          <div className="cas-toolbar__row">
            <div className="cas-field">
              <label className="cas-field__label" htmlFor="cas-start-date">Start Date</label>
              <input
                id="cas-start-date"
                type="date"
                lang="en-US"
                className="cas-field__input"
                value={periodStart}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="cas-field">
              <label className="cas-field__label" htmlFor="cas-end-date">End Date</label>
              <input
                id="cas-end-date"
                type="date"
                lang="en-US"
                className="cas-field__input"
                value={periodEnd}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
            <div className="cas-toolbar__actions">
              <button
                type="button"
                className="cas-btn cas-btn--primary"
                onClick={handleApply}
                disabled={loading || !hasValidPeriod}
                title={!hasValidPeriod ? 'Select a valid Start/End date range' : undefined}
              >
                Apply Filters
              </button>
              <button type="button" className="cas-btn cas-btn--ghost" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
          {!hasValidPeriod && (
            <p className="cas-toolbar__hint" role="status">
              Select a <strong>Start Date</strong> and <strong>End Date</strong>, then click Apply Filters to load
              account summaries.
            </p>
          )}
        </section>

        <section className="cas-categories" aria-label="Account categories">
          <div className="cas-categories__row" role="tablist" aria-label="Main account categories">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={toKey(activeCategory) === toKey(c.key)}
                className={`cas-categories__tab${
                  toKey(activeCategory) === toKey(c.key) ? ' cas-categories__tab--active' : ''
                }`}
                onClick={() => setActiveCategory(toKey(c.key))}
                disabled={loading}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="cas-error-banner" role="alert">
            <p className="cas-error-banner__title">Unable to load summaries</p>
            <p className="cas-error-banner__text">{error}</p>
          </div>
        ) : null}

        <section className="cas-report" aria-label="Account summaries report">
          <div className="cas-report__header">
            <div className="cas-report__heading">
              <h2 className="cas-report__title">{accountsTitle}</h2>
              <p className="cas-report__meta">
                {periodLabel} · {activeCategoryLabel} · {filteredAccounts.length} accounts
              </p>
            </div>
          </div>

          {appliedPeriod ? (
            <div className="cas-info-banner" role="note">
              <span className="cas-info-banner__icon" aria-hidden="true">
                <IconInfo />
              </span>
              <p className="cas-info-banner__text">
                Click an <strong>account code</strong> or <strong>account name</strong> to view every entry for that
                account from general ledger, other transactions, opening balances, and GSec.
              </p>
            </div>
          ) : null}

          <div className="cas-table-wrap">
            {loading ? (
              <div className="cas-empty-state">
                <p className="cas-empty-state__title">Loading account summaries…</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="cas-empty-state">
                <p className="cas-empty-state__title">No accounts to display</p>
                <p className="cas-empty-state__text">
                  {summary == null
                    ? 'Apply filters to load accounts for the selected period.'
                    : 'No accounts match the selected category.'}
                </p>
              </div>
            ) : (
              <table className="cas-grid">
                <thead>
                  <tr>
                    <th className="cas-col-code">Account Code</th>
                    <th className="cas-col-name">Account Name</th>
                    <th className="cas-col-num">Debit</th>
                    <th className="cas-col-num">Credit</th>
                    <th className="cas-col-num">Net</th>
                    <th className="cas-col-drcr">DR / CR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((a, idx) => {
                    const netDisplay = formatNetBalance(a.net_balance);
                    const canDrill = Boolean(appliedPeriod);
                    return (
                      <tr
                        key={String(a?.account_code || a?.accountCode || `${a?.account_name || 'acc'}-${idx}`)}
                        className={idx % 2 === 1 ? 'cas-grid__row--alt' : ''}
                      >
                        <td className="cas-col-code">
                          <span
                            className={`cas-code${canDrill ? ' cas-drilldown' : ''}`}
                            onClick={canDrill ? (e) => handleAccountDrillDown(a, e) : undefined}
                            role={canDrill ? 'button' : undefined}
                            tabIndex={canDrill ? 0 : undefined}
                            title={
                              canDrill
                                ? 'View entries from general ledger, other transactions, and GSec'
                                : undefined
                            }
                            onKeyDown={
                              canDrill
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
                          </span>
                        </td>
                        <td className="cas-col-name">
                          <span
                            className={canDrill ? 'cas-drilldown' : ''}
                            onClick={canDrill ? (e) => handleAccountDrillDown(a, e) : undefined}
                            role={canDrill ? 'button' : undefined}
                            tabIndex={canDrill ? 0 : undefined}
                            title={
                              canDrill
                                ? 'View entries from general ledger, other transactions, and GSec'
                                : undefined
                            }
                            onKeyDown={
                              canDrill
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
                          </span>
                        </td>
                        <td className="cas-col-num">
                          <span className="cas-amount cas-amount--debit">
                            {Number(a.total_debit) > 0 ? formatCurrency(a.total_debit) : '—'}
                          </span>
                        </td>
                        <td className="cas-col-num">
                          <span className="cas-amount cas-amount--credit">
                            {Number(a.total_credit) > 0 ? formatCurrency(a.total_credit) : '—'}
                          </span>
                        </td>
                        <td className="cas-col-num">
                          <span
                            className={`cas-amount${
                              netDisplay.side === 'DR'
                                ? ' cas-amount--debit'
                                : netDisplay.side === 'CR'
                                  ? ' cas-amount--credit'
                                  : ''
                            }`}
                          >
                            {netDisplay.text}
                          </span>
                        </td>
                        <td className="cas-col-drcr">{a.balance_type || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <AccountDetailsModal
        isOpen={accountModalOpen}
        onClose={handleCloseAccountModal}
        accountCode={accountModalCode}
        accountData={accountModalData}
        loadError={accountModalError}
        detailSource="Combined (GL · Other · GSec · OB)"
        softHeader
        onNavigateAccount={(code) =>
          handleAccountDrillDown({ account_code: code, account_name: '' })
        }
      />
    </div>
  );
};

export default AccountSummaries;
