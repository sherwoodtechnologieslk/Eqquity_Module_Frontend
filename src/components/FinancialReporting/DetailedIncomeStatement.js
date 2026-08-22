import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/DetailedIncomeStatement.css';
import { profitLossAPI } from '../../services/api';
import {
  fiscalYearStartFor,
  formatLongDate,
  formatMonthYearShort,
  formatYtdMonthLabel,
  monthStart,
  parseYmd,
  previousMonthEnd,
  toLocalYmd
} from '../../utils/statementOfChangesInEquity';

const todayYmd = () => toLocalYmd(new Date());

const formatAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.5) return '-';
  const abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return n < 0 ? `(${abs})` : abs;
};

const isSellingAccount = (account) => {
  const blob = `${account.category || ''} ${account.name || ''}`.toLowerCase();
  return /selling|distribution/.test(blob);
};

const accountKey = (account) =>
  String(account.account_code || account.accountCode || account.account_name || account.accountName || '');

const indexExpenseAccounts = (plData) => {
  const map = new Map();
  (plData?.expenseAccounts || []).forEach((account) => {
    const key = accountKey(account);
    if (!key) return;
    map.set(key, {
      code: String(account.account_code || account.accountCode || ''),
      name: account.account_name || account.accountName || key,
      category: account.account_category || account.accountCategory || '',
      balance: Number(account.balance) || 0
    });
  });
  return map;
};

const sumCols = (rows) =>
  rows.reduce(
    (acc, row) => ({
      ytd: acc.ytd + (Number(row.ytd) || 0),
      priorYtd: acc.priorYtd + (Number(row.priorYtd) || 0),
      month: acc.month + (Number(row.month) || 0)
    }),
    { ytd: 0, priorYtd: 0, month: 0 }
  );

const DetailedIncomeStatement = () => {
  const [asOfDate, setAsOfDate] = useState(() => todayYmd());
  const [sellingRows, setSellingRows] = useState([]);
  const [adminRows, setAdminRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchIdRef = useRef(0);

  const asOf = useMemo(() => parseYmd(asOfDate) || new Date(), [asOfDate]);
  const priorEnd = useMemo(() => previousMonthEnd(asOf), [asOf]);

  const columns = useMemo(
    () => [
      { key: 'ytd', label: formatMonthYearShort(asOf) },
      {
        key: 'priorYtd',
        label: formatYtdMonthLabel(priorEnd)
      },
      { key: 'month', label: formatMonthYearShort(asOf) }
    ],
    [asOf, priorEnd]
  );

  const loadStatement = useCallback(async (asOfYmd, fetchId) => {
    const date = parseYmd(asOfYmd) || new Date();
    const yearStart = fiscalYearStartFor(date);
    const monthBegin = monthStart(date);
    const prior = previousMonthEnd(date);
    const includePrior = prior >= yearStart;

    setIsLoading(true);
    setError('');

    try {
      const [ytdResp, priorResp, monthResp] = await Promise.all([
        profitLossAPI.getProfitLoss({
          startDate: toLocalYmd(yearStart),
          endDate: toLocalYmd(date)
        }),
        includePrior
          ? profitLossAPI.getProfitLoss({
              startDate: toLocalYmd(yearStart),
              endDate: toLocalYmd(prior)
            })
          : Promise.resolve({ success: true, data: { expenseAccounts: [] } }),
        profitLossAPI.getProfitLoss({
          startDate: toLocalYmd(monthBegin),
          endDate: toLocalYmd(date)
        })
      ]);

      if (fetchIdRef.current !== fetchId) return;

      if (!ytdResp?.success) {
        throw new Error(ytdResp?.error || 'Failed to load detailed income statement');
      }

      const ytdMap = indexExpenseAccounts(ytdResp.data);
      const priorMap = indexExpenseAccounts(priorResp?.data);
      const monthMap = indexExpenseAccounts(monthResp?.success ? monthResp.data : null);

      const keys = new Set([...ytdMap.keys(), ...priorMap.keys(), ...monthMap.keys()]);
      const selling = [];
      const admin = [];

      [...keys]
        .sort((a, b) => {
          const left = ytdMap.get(a) || priorMap.get(a) || monthMap.get(a);
          const right = ytdMap.get(b) || priorMap.get(b) || monthMap.get(b);
          return String(left?.code || left?.name || a).localeCompare(
            String(right?.code || right?.name || b),
            undefined,
            { numeric: true }
          );
        })
        .forEach((key) => {
          const meta = ytdMap.get(key) || priorMap.get(key) || monthMap.get(key);
          const row = {
            key,
            code: meta.code,
            name: meta.name,
            ytd: ytdMap.get(key)?.balance || 0,
            priorYtd: priorMap.get(key)?.balance || 0,
            month: monthMap.get(key)?.balance || 0
          };
          if (isSellingAccount(meta)) selling.push(row);
          else admin.push(row);
        });

      setSellingRows(selling);
      setAdminRows(admin);
    } catch (err) {
      if (fetchIdRef.current !== fetchId) return;
      console.error(err);
      setError(err.message || 'Failed to load detailed income statement');
      setSellingRows([]);
      setAdminRows([]);
    } finally {
      if (fetchIdRef.current === fetchId) {
        setIsLoading(false);
      }
    }
  }, []);

  const runLoad = useCallback(
    (asOfYmd) => {
      const fetchId = fetchIdRef.current + 1;
      fetchIdRef.current = fetchId;
      loadStatement(asOfYmd, fetchId);
    },
    [loadStatement]
  );

  useEffect(() => {
    runLoad(asOfDate);
  }, [asOfDate, runLoad]);

  const applyAsOfDate = (nextDate) => {
    if (!nextDate || !parseYmd(nextDate)) return;
    setAsOfDate(nextDate);
  };

  const handleAsOfDateChange = (event) => {
    applyAsOfDate(event.currentTarget.value);
  };

  const sellingTotals = useMemo(() => sumCols(sellingRows), [sellingRows]);
  const adminTotals = useMemo(() => sumCols(adminRows), [adminRows]);
  const grandTotals = useMemo(
    () => ({
      ytd: sellingTotals.ytd + adminTotals.ytd,
      priorYtd: sellingTotals.priorYtd + adminTotals.priorYtd,
      month: sellingTotals.month + adminTotals.month
    }),
    [sellingTotals, adminTotals]
  );

  const periodEndedLabel = formatLongDate(asOf, { withOrdinal: true });
  const hasRows = sellingRows.length + adminRows.length > 0;

  const exportRows = () => {
    const pushSection = (title, rows, totals) => [
      [title, '', '', ''],
      ...rows.map((row) => [
        row.name,
        formatAmount(row.ytd),
        formatAmount(row.priorYtd),
        formatAmount(row.month)
      ]),
      [title, formatAmount(totals.ytd), formatAmount(totals.priorYtd), formatAmount(totals.month)]
    ];

    return [
      ...pushSection('Selling & Distribution Cost', sellingRows, sellingTotals),
      ...pushSection('Administration Expense', adminRows, adminTotals),
      ['Total expenses', formatAmount(grandTotals.ytd), formatAmount(grandTotals.priorYtd), formatAmount(grandTotals.month)]
    ];
  };

  const exportCsv = () => {
    const header = ['', columns[0].label, columns[1].label, columns[2].label];
    const lines = [header.join(','), ...exportRows().map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Detailed-Income-Statement-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(13);
    doc.text('DETAILED INCOME STATEMENT', 14, 16);
    doc.setFontSize(10);
    doc.text(`For the period ended ${periodEndedLabel}`, 14, 22);
    doc.text('APPENDIX 11', 196, 16, { align: 'right' });
    autoTable(doc, {
      startY: 28,
      head: [['', `${columns[0].label} LKR`, `${columns[1].label} LKR`, `${columns[2].label} LKR`]],
      body: exportRows(),
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
    doc.save(`Detailed-Income-Statement-${asOfDate}.pdf`);
  };

  const renderAmountCells = (row) =>
    columns.map((col) => (
      <td key={col.key} className="dis-td-num">
        {formatAmount(row[col.key])}
      </td>
    ));

  const renderSection = (title, rows, totals) => (
    <>
      <tr className="dis-row-section">
        <td className="dis-td-label" colSpan={4}>
          {title}
        </td>
      </tr>
      {rows.length === 0 ? (
        <tr className="dis-row-line">
          <td className="dis-td-label">No accounts in this section</td>
          <td className="dis-td-num">-</td>
          <td className="dis-td-num">-</td>
          <td className="dis-td-num">-</td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={row.key} className="dis-row-line">
            <td className="dis-td-label">{row.name}</td>
            {renderAmountCells(row)}
          </tr>
        ))
      )}
      <tr className="dis-row-total">
        <td className="dis-td-label">{title}</td>
        {renderAmountCells(totals)}
      </tr>
    </>
  );

  return (
    <div className="dis-page">
      <div className="dis-wrap">
        <div className="dis-header">
          <div>
            <h1 className="dis-title">Detailed Income Statement</h1>
            <p className="dis-subtitle">
              Selling &amp; distribution and administration expenses for the financial year
              starting 1 April.
            </p>
          </div>
          <div className="dis-actions">
            <button type="button" className="dis-btn" onClick={exportPdf} disabled={isLoading || !hasRows}>
              Export PDF
            </button>
            <button type="button" className="dis-btn" onClick={exportCsv} disabled={isLoading || !hasRows}>
              Export Excel
            </button>
            <button
              type="button"
              className="dis-btn dis-btn--refresh"
              onClick={() => runLoad(asOfDate)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="dis-filters">
          <label className="dis-filter" htmlFor="dis-as-of">
            Period ended
            <input
              id="dis-as-of"
              type="date"
              value={asOfDate}
              onChange={handleAsOfDateChange}
              onInput={handleAsOfDateChange}
              onBlur={handleAsOfDateChange}
            />
          </label>
          <span className="dis-note">
            Year-to-date from 1 April, prior month YTD, and the selected month.
          </span>
          {isLoading && <span className="dis-status dis-status--loading">Loading…</span>}
          {error && <span className="dis-status dis-status--error">{error}</span>}
        </div>

        <div className="dis-paper">
          <div className="dis-doc-top">
            <div>
              <h2 className="dis-doc-title">Detailed Income Statement</h2>
              <p className="dis-doc-period">For the period ended {periodEndedLabel}</p>
            </div>
            <div className="dis-appendix">Appendix 11</div>
          </div>

          {isLoading && !hasRows ? (
            <div className="dis-loading">
              <div className="dis-spinner" />
              <p>Loading expense lines…</p>
            </div>
          ) : (
            <div className="dis-table-wrap">
              <table className="dis-table">
                <thead>
                  <tr>
                    <th className="dis-th-label" />
                    {columns.map((col) => (
                      <th key={col.key} className="dis-th-num">
                        {col.label}
                        <span className="dis-th-unit">LKR</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!hasRows ? (
                    <tr>
                      <td className="dis-empty" colSpan={4}>
                        No expense accounts were found for this period.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {renderSection('Selling & Distribution Cost', sellingRows, sellingTotals)}
                      {renderSection('Administration Expense', adminRows, adminTotals)}
                      <tr className="dis-row-grand">
                        <td className="dis-td-label">Total expenses</td>
                        {renderAmountCells(grandTotals)}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedIncomeStatement;
