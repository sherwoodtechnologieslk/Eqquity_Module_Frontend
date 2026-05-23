import React, { useState, useEffect, useRef } from 'react';
import './Styles/StatementOfComprehensiveIncome.css';
import { profitLossAPI } from '../../services/api';

const SECTIONS = [
  {
    id: 'operating',
    title: 'Operating Activities',
    lines: [
      { label: 'Revenue', key: 'revenue' },
      { label: 'Other Income', key: 'otherIncome' }
    ],
    subtotal: {
      label: 'Profit from Operating Activities',
      key: 'profitFromOperatingActivities'
    }
  },
  {
    id: 'fair-value',
    title: 'Fair Value Changes',
    lines: [
      {
        label:
          'Change in Fair Value of Financial Assets measured at Fair Value Through Profit or Loss',
        key: 'changeInFairValueOfFinancialAssets'
      },
      {
        label: 'Change in Fair Value of Investment in Shares',
        key: 'changeInFairValueOfInvestmentInShares'
      }
    ]
  },
  {
    id: 'expenses',
    title: 'Operating Expenses',
    lines: [
      {
        label: 'Selling & Distribution Expenses',
        key: 'sellingAndDistributionExpenses'
      },
      { label: 'Administrative Expenses', key: 'administrativeExpenses' },
      { label: 'Finance Cost', key: 'financeCost' }
    ],
    subtotal: { label: 'Profit Before Tax', key: 'profitBeforeTax' }
  },
  {
    id: 'tax',
    title: 'Taxation',
    lines: [{ label: 'Income Tax Expense', key: 'incomeTaxExpense' }],
    subtotal: { label: 'Profit for The Period', key: 'profitForThePeriod' }
  },
  {
    id: 'oci',
    title: 'Other Comprehensive Income',
    lines: [
      {
        label: 'Actuarial Loss on Defined Benefit Plans',
        key: 'actuarialLossOnDefinedBenefitPlans'
      },
      { label: 'Deferred tax effect on the above', key: 'deferredTaxEffect' },
      {
        label: 'Other Comprehensive Expense for the Year, net of tax',
        key: 'otherComprehensiveExpense'
      }
    ],
    subtotal: {
      label: 'Total Comprehensive Income for the Year, net of tax',
      key: 'totalComprehensiveIncome',
      isFinal: true
    }
  }
];

const KPI_TILES = [
  { label: 'Revenue', key: 'revenue', tone: 'positive' },
  { label: 'Profit Before Tax', key: 'profitBeforeTax', tone: 'neutral' },
  { label: 'Profit for The Period', key: 'profitForThePeriod', tone: 'neutral' },
  {
    label: 'Total Comprehensive Income',
    key: 'totalComprehensiveIncome',
    tone: 'highlight'
  }
];

const EMPTY_SOCI = {
  revenue: 0,
  otherIncome: 0,
  profitFromOperatingActivities: 0,
  changeInFairValueOfFinancialAssets: 0,
  changeInFairValueOfInvestmentInShares: 0,
  sellingAndDistributionExpenses: 0,
  administrativeExpenses: 0,
  financeCost: 0,
  profitBeforeTax: 0,
  incomeTaxExpense: 0,
  profitForThePeriod: 0,
  actuarialLossOnDefinedBenefitPlans: 0,
  deferredTaxEffect: 0,
  otherComprehensiveExpense: 0,
  totalComprehensiveIncome: 0
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parse native date input value (YYYY-MM-DD) as local calendar date. */
const parseYmd = (ymd) => {
  const parts = String(ymd || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
};

/** YYYY-MM-DD in local calendar (avoids timezone shift from toISOString). */
const toLocalYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayYmd = () => toLocalYmd(new Date());

const formatMonthLabel = (date) =>
  `${MONTH_SHORT[date.getMonth()]}-${date.getFullYear()}`;

const formatDayMonthYearLabel = (date) =>
  `${String(date.getDate()).padStart(2, '0')}-${MONTH_SHORT[date.getMonth()]}-${date.getFullYear()}`;

/**
 * Same calendar day in the previous month, clamped to that month's last day
 * (e.g. 31-Mar → 28/29-Feb, 30-May → 30-Apr).
 */
const sameDayPreviousMonth = (date) => {
  const prevMonth = date.getMonth() - 1;
  const targetYear = prevMonth < 0 ? date.getFullYear() - 1 : date.getFullYear();
  const targetMonth = (prevMonth + 12) % 12;
  const lastDayOfPrevMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDayOfPrevMonth);
  return new Date(targetYear, targetMonth, day);
};

/**
 * Build the three SOCI columns from the selected as-at date:
 *   1. Current month-to-date  (1st of as-at month → as-at date)
 *   2. YTD to the as-at date  (1st Jan → as-at date)
 *   3. YTD to the same day of the previous month
 */
const buildColumns = (asOfDateYmd) => {
  const anchor = parseYmd(asOfDateYmd);
  if (!anchor) return [];

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const yearStart = new Date(anchor.getFullYear(), 0, 1);
  const prevMonthSameDay = sameDayPreviousMonth(anchor);
  const prevYearStart = new Date(prevMonthSameDay.getFullYear(), 0, 1);

  return [
    {
      key: `month_${toLocalYmd(monthStart)}_${toLocalYmd(anchor)}`,
      startDate: toLocalYmd(monthStart),
      endDate: toLocalYmd(anchor),
      label: formatMonthLabel(anchor)
    },
    {
      key: `ytd_${toLocalYmd(yearStart)}_${toLocalYmd(anchor)}`,
      startDate: toLocalYmd(yearStart),
      endDate: toLocalYmd(anchor),
      label: `YTD ${formatDayMonthYearLabel(anchor)}`
    },
    {
      key: `ytd_${toLocalYmd(prevYearStart)}_${toLocalYmd(prevMonthSameDay)}`,
      startDate: toLocalYmd(prevYearStart),
      endDate: toLocalYmd(prevMonthSameDay),
      label: `YTD ${formatDayMonthYearLabel(prevMonthSameDay)}`
    }
  ];
};

const mapProfitLossToSoci = (data) => {
  if (!data) return { ...EMPTY_SOCI };
  const totals = data.totals || {};
  const revenue = Number(totals.total_revenue) || 0;
  const otherIncome = Number(totals.total_other_income) || 0;
  const profitFromOperatingActivities = revenue + otherIncome;

  const unrealizedFromTotals = Number(totals.unrealized_capital_gains) || 0;

  const expenseCategorySubtotals = data.expenseCategorySubtotals || {};
  const provisionsCategorySubtotals = data.provisionsCategorySubtotals || {};

  let sellingAndDistribution = 0;
  let administrative = 0;
  let financeCost = 0;
  let incomeTax = 0;
  let otherExpenses = 0;
  let changeInFvShares = 0;

  Object.entries(expenseCategorySubtotals).forEach(([category, amount]) => {
    const cat = String(category).toLowerCase();
    const amt = Number(amount) || 0;
    if (cat.includes('selling') || cat.includes('distribution')) {
      sellingAndDistribution += amt;
    } else if (cat.includes('finance')) {
      financeCost += amt;
    } else if (cat.includes('admin')) {
      administrative += amt;
    } else if (cat.includes('tax')) {
      incomeTax += amt;
    } else {
      otherExpenses += amt;
    }
  });

  Object.entries(provisionsCategorySubtotals).forEach(([category, amount]) => {
    const cat = String(category).toLowerCase();
    const amt = Number(amount) || 0;
    if (cat.includes('tax')) {
      incomeTax += amt;
    } else if (cat.includes('share') || cat.includes('equity')) {
      changeInFvShares += amt;
    } else {
      otherExpenses += amt;
    }
  });

  const sellingAndDistributionExpenses = -sellingAndDistribution;
  const administrativeExpenses = -(administrative + otherExpenses);
  const financeCostNeg = -financeCost;
  const incomeTaxExpense = -incomeTax;

  const changeInFairValueOfFinancialAssets = unrealizedFromTotals;
  const changeInFairValueOfInvestmentInShares = changeInFvShares;

  const profitBeforeTax =
    profitFromOperatingActivities +
    changeInFairValueOfFinancialAssets +
    changeInFairValueOfInvestmentInShares +
    sellingAndDistributionExpenses +
    administrativeExpenses +
    financeCostNeg;

  const profitForThePeriod = profitBeforeTax + incomeTaxExpense;

  return {
    revenue,
    otherIncome,
    profitFromOperatingActivities,
    changeInFairValueOfFinancialAssets,
    changeInFairValueOfInvestmentInShares,
    sellingAndDistributionExpenses,
    administrativeExpenses,
    financeCost: financeCostNeg,
    profitBeforeTax,
    incomeTaxExpense,
    profitForThePeriod,
    actuarialLossOnDefinedBenefitPlans: 0,
    deferredTaxEffect: 0,
    otherComprehensiveExpense: 0,
    totalComprehensiveIncome: profitForThePeriod
  };
};

const StatementOfComprehensiveIncome = () => {
  const [asOfDate, setAsOfDate] = useState(() => todayYmd());
  const [columnData, setColumnData] = useState(() => [
    { ...EMPTY_SOCI },
    { ...EMPTY_SOCI },
    { ...EMPTY_SOCI }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState(
    () => new Set(SECTIONS.map((s) => s.id))
  );
  const fetchIdRef = useRef(0);

  const isSectionOpen = (id) => openSections.has(id);

  const toggleSection = (id) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setAllSectionsOpen = (open) =>
    setOpenSections(open ? new Set(SECTIONS.map((s) => s.id)) : new Set());

  // Recompute columns on every render from the current as-at date (no memo).
  const columns = buildColumns(asOfDate);

  const applyAsOfDate = (nextDate) => {
    if (!nextDate || !parseYmd(nextDate)) return;
    setAsOfDate(nextDate);
  };

  const handleAsOfDateChange = (event) => {
    applyAsOfDate(event.currentTarget.value);
  };

  useEffect(() => {
    const cols = buildColumns(asOfDate);
    if (!cols.length) return undefined;

    const fetchId = fetchIdRef.current + 1;
    fetchIdRef.current = fetchId;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const responses = await Promise.all(
          cols.map((c) =>
            profitLossAPI
              .getProfitLoss({ startDate: c.startDate, endDate: c.endDate })
              .catch((err) => {
                console.error('Error fetching P&L for', c.label, err);
                return null;
              })
          )
        );
        if (cancelled || fetchIdRef.current !== fetchId) return;

        const mapped = responses.map((resp) =>
          resp?.success ? mapProfitLossToSoci(resp.data) : { ...EMPTY_SOCI }
        );
        setColumnData(mapped);
      } catch (err) {
        if (cancelled || fetchIdRef.current !== fetchId) return;
        console.error('Error fetching Statement of Comprehensive Income:', err);
        setError(err.message || 'Failed to load Statement of Comprehensive Income');
        setColumnData(cols.map(() => ({ ...EMPTY_SOCI })));
      } finally {
        if (!cancelled && fetchIdRef.current === fetchId) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [asOfDate]);

  const formatNumber = (amount) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);

  const getAmountClass = (amount) => {
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'neutral';
  };

  const renderAmountCells = (key, { bold = false } = {}) =>
    columns.map((c, idx) => {
      const value = columnData[idx]?.[key] ?? 0;
      const display = isLoading ? '—' : formatNumber(value);
      return (
        <td
          key={c.key}
          className={`ci-amount ${isLoading ? 'loading' : getAmountClass(value)}`}
        >
          {bold ? <strong>{display}</strong> : display}
        </td>
      );
    });

  // KPI tiles are driven by the YTD-to-as-at column (index 1) when available.
  const kpiColumnIndex = columns.length > 1 ? 1 : 0;
  const kpiSourceLabel = columns[kpiColumnIndex]?.label || '';

  return (
    <div className="comprehensive-income">
      <div className="ci-page-header">
        <div className="ci-title-row">
          <div>
            <h1>Statement of Comprehensive Income</h1>
            <p className="ci-subtitle">
              Profit and loss summary with month-to-date, year-to-date, and prior-period
              comparisons.
            </p>
          </div>
          <div className="ci-toolbar">
            <button
              type="button"
              className="ci-toolbar-btn"
              onClick={() => setAllSectionsOpen(true)}
            >
              Expand all
            </button>
            <button
              type="button"
              className="ci-toolbar-btn"
              onClick={() => setAllSectionsOpen(false)}
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="ci-filter-row">
          <div className="ci-filter-group">
            <label htmlFor="ci-as-of-date">As at date</label>
            <input
              id="ci-as-of-date"
              type="date"
              value={asOfDate}
              onChange={handleAsOfDateChange}
              onInput={handleAsOfDateChange}
              onBlur={handleAsOfDateChange}
            />
          </div>
          {isLoading && <span className="ci-loading-tag">Loading…</span>}
          {error && <span className="ci-error">{error}</span>}
        </div>

        <div className="ci-kpi-row">
          {KPI_TILES.map((tile) => {
            const value = columnData[kpiColumnIndex]?.[tile.key] ?? 0;
            return (
              <div key={tile.key} className={`ci-kpi-tile ci-kpi-${tile.tone}`}>
                <div className="ci-kpi-label">{tile.label}</div>
                <div className={`ci-kpi-value ${getAmountClass(value)}`}>
                  {isLoading ? '—' : formatNumber(value)}
                </div>
                <div className="ci-kpi-meta">
                  {kpiSourceLabel ? `${kpiSourceLabel} · LKR` : 'LKR'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ci-sections" key={asOfDate}>
        {SECTIONS.map((section) => {
          const open = isSectionOpen(section.id);
          return (
            <section
              key={section.id}
              className={`ci-section-card ${open ? 'open' : 'closed'}`}
            >
              <button
                type="button"
                className="ci-section-toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={open}
                aria-controls={`ci-section-body-${section.id}`}
              >
                <span className={`ci-chevron ${open ? 'down' : 'right'}`} aria-hidden>
                  ▸
                </span>
                <span className="ci-section-title">{section.title}</span>
                {section.subtotal && (
                  <span className="ci-section-summary">
                    {section.subtotal.label}:{' '}
                    <strong
                      className={getAmountClass(
                        columnData[kpiColumnIndex]?.[section.subtotal.key] ?? 0
                      )}
                    >
                      {isLoading
                        ? '—'
                        : formatNumber(
                            columnData[kpiColumnIndex]?.[section.subtotal.key] ?? 0
                          )}
                    </strong>
                  </span>
                )}
              </button>

              {open && (
                <div
                  id={`ci-section-body-${section.id}`}
                  className="ci-section-body"
                >
                  <table className="ci-table">
                    <thead>
                      <tr>
                        <th className="ci-label-col" />
                        {columns.map((c) => (
                          <th key={c.key} className="ci-amount-col">
                            <div>{c.label}</div>
                            <div className="ci-amount-unit">LKR</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.lines.map((line) => (
                        <tr key={line.key} className="ci-section-row">
                          <td className="ci-label">{line.label}</td>
                          {renderAmountCells(line.key)}
                        </tr>
                      ))}
                      {section.subtotal && (
                        <tr
                          className={`ci-total-row ${
                            section.subtotal.isFinal ? 'ci-final-row' : ''
                          }`}
                        >
                          <td className="ci-label">
                            <strong>{section.subtotal.label}</strong>
                          </td>
                          {renderAmountCells(section.subtotal.key, { bold: true })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default StatementOfComprehensiveIncome;
