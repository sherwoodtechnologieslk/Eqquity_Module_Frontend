import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/StatementOfChangesInEquity.css';
import { financialPositionAPI, profitLossAPI } from '../../services/api';
import {
  buildSociEPeriods,
  equityAtDate,
  formatLongDate,
  parseNetProfit,
  parseYmd,
  toLocalYmd
} from '../../utils/statementOfChangesInEquity';

const todayYmd = () => toLocalYmd(new Date());

const formatAmount = (value, { dashZero = false } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.5) {
    return dashZero ? '-' : '0';
  }
  const abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return n < 0 ? `(${abs})` : abs;
};

const StatementOfChangesInEquity = () => {
  const [asOfDate, setAsOfDate] = useState(todayYmd);
  const [appliedAsOf, setAppliedAsOf] = useState(todayYmd);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const periodModel = useMemo(() => buildSociEPeriods(appliedAsOf), [appliedAsOf]);

  const loadStatement = useCallback(async (asOf) => {
    const model = buildSociEPeriods(asOf);
    setIsLoading(true);
    setError('');

    try {
      const snapshots = await Promise.all(
        model.points.map(async (point) => {
          const ymd = toLocalYmd(point);
          const calendarYearStart = toLocalYmd(new Date(point.getFullYear(), 0, 1));

          const [fpResp, plResp] = await Promise.all([
            financialPositionAPI.getFinancialPosition({ asOfDate: ymd }),
            profitLossAPI
              .getProfitLoss({
                startDate: calendarYearStart,
                endDate: ymd
              })
              .catch(() => null)
          ]);

          if (!fpResp?.success) {
            throw new Error(fpResp?.error || `Failed to load equity as at ${ymd}`);
          }

          const netProfit = plResp?.success
            ? parseNetProfit(plResp.data?.totals?.net_profit)
            : 0;

          return {
            ymd,
            equity: equityAtDate(fpResp.data, netProfit)
          };
        })
      );

      const equityByDate = new Map(snapshots.map((s) => [s.ymd, s.equity]));

      const periodProfits = await Promise.all(
        model.periods.map(async (period) => {
          const plResp = await profitLossAPI
            .getProfitLoss({
              startDate: period.startDate,
              endDate: period.endDate
            })
            .catch(() => null);
          return plResp?.success ? parseNetProfit(plResp.data?.totals?.net_profit) : 0;
        })
      );

      const nextRows = [];
      const openingYmd = toLocalYmd(model.opening);
      const openingEq = equityByDate.get(openingYmd) || {
        statedCapital: 0,
        retained: 0,
        total: 0
      };

      nextRows.push({
        key: `bal-${openingYmd}`,
        kind: 'balance',
        label: `Balance as at ${formatLongDate(model.opening)}`,
        statedCapital: openingEq.statedCapital,
        retained: openingEq.retained,
        total: openingEq.total
      });

      model.periods.forEach((period, index) => {
        const openYmd = toLocalYmd(period.startExclusive);
        const closeYmd = period.endDate;
        const openEq = equityByDate.get(openYmd) || openingEq;
        const closeEq = equityByDate.get(closeYmd) || openEq;
        const profit = periodProfits[index] || 0;
        const capitalMove = closeEq.statedCapital - openEq.statedCapital;
        const residualRe = closeEq.retained - openEq.retained - profit;
        const dividendPaid = residualRe < -0.5 ? residualRe : 0;
        const otherRe = residualRe > 0.5 ? residualRe : 0;

        nextRows.push({
          key: `profit-${closeYmd}`,
          kind: 'movement',
          label: 'Profit for the period',
          statedCapital: 0,
          retained: profit,
          total: profit
        });

        nextRows.push({
          key: `oci-${closeYmd}`,
          kind: 'movement',
          label: 'Other Comprehensive Expense',
          statedCapital: 0,
          retained: 0,
          total: 0
        });

        if (Math.abs(capitalMove) >= 0.5) {
          nextRows.push({
            key: `capital-${closeYmd}`,
            kind: 'movement',
            label: capitalMove > 0 ? 'Issue of shares' : 'Reduction of capital',
            statedCapital: capitalMove,
            retained: 0,
            total: capitalMove
          });
        }

        nextRows.push({
          key: `div-${closeYmd}`,
          kind: 'movement',
          label: 'Dividend paid',
          statedCapital: 0,
          retained: dividendPaid,
          total: dividendPaid
        });

        if (Math.abs(otherRe) >= 0.5) {
          nextRows.push({
            key: `other-${closeYmd}`,
            kind: 'movement',
            label: 'Other equity movements',
            statedCapital: 0,
            retained: otherRe,
            total: otherRe
          });
        }

        nextRows.push({
          key: `bal-${closeYmd}`,
          kind: 'balance',
          label: period.closeLabel,
          statedCapital: closeEq.statedCapital,
          retained: closeEq.retained,
          total: closeEq.total
        });
      });

      setRows(nextRows);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load Statement of Changes in Equity');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatement(appliedAsOf);
  }, [appliedAsOf, loadStatement]);

  const applyFilters = () => {
    const parsed = parseYmd(asOfDate);
    setAppliedAsOf(parsed ? toLocalYmd(parsed) : todayYmd());
  };

  const periodEndedLabel = formatLongDate(periodModel.asOf, { withOrdinal: true });

  const exportCsv = () => {
    const headers = [
      '',
      'Stated capital LKR',
      'Retained earnings LKR',
      'Total LKR'
    ];
    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        [
          `"${row.label.replace(/"/g, '""')}"`,
          formatAmount(row.statedCapital, { dashZero: row.kind === 'movement' }),
          formatAmount(row.retained, { dashZero: row.kind === 'movement' }),
          formatAmount(row.total, { dashZero: row.kind === 'movement' })
        ].join(',')
      )
    ];
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement-of-Changes-in-Equity-${appliedAsOf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(13);
    doc.text('STATEMENT OF CHANGES IN EQUITY', 14, 16);
    doc.setFontSize(10);
    doc.text(`For the period ended ${periodEndedLabel}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['', 'Stated capital LKR', 'Retained earnings LKR', 'Total LKR']],
      body: rows.map((row) => [
        row.label,
        formatAmount(row.statedCapital, { dashZero: row.kind === 'movement' }),
        formatAmount(row.retained, { dashZero: row.kind === 'movement' }),
        formatAmount(row.total, { dashZero: row.kind === 'movement' })
      ]),
      styles: { fontSize: 8, cellPadding: 1.6 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      didParseCell: (data) => {
        const row = rows[data.row.index];
        if (data.section === 'body' && row?.kind === 'balance') {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    doc.save(`Statement-of-Changes-in-Equity-${appliedAsOf}.pdf`);
  };

  return (
    <div className="sce-page">
      <div className="sce-wrap">
        <div className="sce-header">
          <div>
            <h1 className="sce-title">Statement of Changes in Equity</h1>
            <p className="sce-subtitle">
              Stated capital, retained earnings, and period movements for the financial year
              ending 31 March.
            </p>
          </div>
          <div className="sce-actions">
            <button type="button" className="sce-btn" onClick={exportPdf} disabled={isLoading || !rows.length}>
              Export PDF
            </button>
            <button type="button" className="sce-btn" onClick={exportCsv} disabled={isLoading || !rows.length}>
              Export Excel
            </button>
            <button
              type="button"
              className="sce-btn sce-btn--refresh"
              onClick={applyFilters}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="sce-filters">
          <label className="sce-filter" htmlFor="sce-as-of">
            Period ended
            <input
              id="sce-as-of"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </label>
          <span className="sce-note">Shows three prior year-ends plus the selected period.</span>
          {isLoading && <span className="sce-status sce-status--loading">Loading…</span>}
          {error && <span className="sce-status sce-status--error">{error}</span>}
        </div>

        <div className="sce-paper">
          <h2 className="sce-doc-title">Statement of Changes in Equity</h2>
          <p className="sce-doc-period">For the period ended {periodEndedLabel}</p>

          {isLoading && !rows.length ? (
            <div className="sce-loading">
              <div className="sce-spinner" />
              <p>Loading equity movements…</p>
            </div>
          ) : (
            <div className="sce-table-wrap">
              <table className="sce-table">
                <thead>
                  <tr>
                    <th className="sce-th-label" />
                    <th className="sce-th-num">
                      Stated capital
                      <span className="sce-th-unit">LKR</span>
                    </th>
                    <th className="sce-th-num">
                      Retained earnings
                      <span className="sce-th-unit">LKR</span>
                    </th>
                    <th className="sce-th-num">
                      Total
                      <span className="sce-th-unit">LKR</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="sce-empty" colSpan={4}>
                        No equity balances were found for this period.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.key}
                        className={row.kind === 'balance' ? 'sce-row-balance' : 'sce-row-movement'}
                      >
                        <td className="sce-td-label">{row.label}</td>
                        <td className="sce-td-num">
                          {formatAmount(row.statedCapital, { dashZero: row.kind === 'movement' })}
                        </td>
                        <td className={`sce-td-num${row.retained < 0 ? ' sce-neg' : ''}`}>
                          {formatAmount(row.retained, { dashZero: row.kind === 'movement' })}
                        </td>
                        <td className={`sce-td-num${row.total < 0 ? ' sce-neg' : ''}`}>
                          {formatAmount(row.total, { dashZero: row.kind === 'movement' })}
                        </td>
                      </tr>
                    ))
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

export default StatementOfChangesInEquity;
