import React, { useCallback, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialReportsExport.css';
import { financialPositionAPI, portfolioAPI } from '../../services/api';

const fmt = (value, decimals = 2) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

const TABLE_HEADERS = [
  'Counter',
  'No. of Shares',
  'WACC',
  'Total Cost',
  'BEC Based on WACC',
  'BEC Cost (after deducting dividends)',
  'BEC Based on 31 March - MV',
  'Mkt value / Per share',
  'Total Mkt Value',
  'Unrealised Gain/(Loss) Based on WACC & MV',
  'Unrealised Gain/(Loss) Based on MV (31-Mar vs current)'
];

function escapeCsvCell(value) {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function sanitizeFilePart(name) {
  const withoutControl = String(name || 'export')
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('');
  return withoutControl
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'export';
}

function buildRowsFromTableData(tableData) {
  const body = (tableData.rows || []).map((row) => [
    row.counter ?? '',
    fmt(row.numberOfShares, 0),
    fmt(row.wacc, 2),
    fmt(row.totalCost, 2),
    fmt(row.becBasedOnWacc, 2),
    fmt(row.becCostAfterDividends, 2),
    fmt(row.becBasedOnMarchMv, 2),
    fmt(row.marketValuePerShare, 2),
    fmt(row.totalMarketValue, 2),
    fmt(row.unrealizedGainLossCostBasis, 2),
    fmt(row.unrealizedGainLossMvToMv, 2)
  ]);
  const t = tableData.totals || {};
  const foot = [
    [
      'Total',
      fmt(t.numberOfShares, 0),
      '-',
      fmt(t.totalCost, 2),
      fmt(t.becBasedOnWacc, 2),
      fmt(t.becCostAfterDividends, 2),
      fmt(t.becBasedOnMarchMv, 2),
      '-',
      fmt(t.totalMarketValue, 2),
      fmt(t.unrealizedGainLossCostBasis, 2),
      fmt(t.unrealizedGainLossMvToMv, 2)
    ]
  ];
  return { body, foot };
}

function downloadCsv(tableData) {
  const { body, foot } = buildRowsFromTableData(tableData);
  const lines = [
    TABLE_HEADERS.map(escapeCsvCell).join(','),
    ...body.map((row) => row.map(escapeCsvCell).join(',')),
    ...foot.map((row) => row.map(escapeCsvCell).join(','))
  ];
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = sanitizeFilePart(
    `${tableData.portfolioName || 'portfolio'}-${tableData.asOfDate || 'export'}`
  );
  a.href = url;
  a.download = `${base}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(tableData) {
  const { body, foot } = buildRowsFromTableData(tableData);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const title = `Equity Portfolio Snapshot — ${tableData.portfolioName || ''} (${tableData.asOfDate || ''})`;
  doc.setFontSize(10);
  doc.text(title, 40, 36);
  autoTable(doc, {
    startY: 48,
    head: [TABLE_HEADERS],
    body,
    foot,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.6
    },
    headStyles: {
      fillColor: [15, 23, 42], // match .fre-table th background
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    footStyles: {
      fillColor: [241, 245, 249], // match tfoot background
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    margin: { left: 40, right: 40 }
  });
  const base = sanitizeFilePart(
    `${tableData.portfolioName || 'portfolio'}-${tableData.asOfDate || 'export'}`
  );
  doc.save(`${base}.pdf`);
}

function baseDate31MarFromAsOf(asOfDate, fallback) {
  const d = new Date(String(asOfDate || ''));
  const year = Number.isNaN(d.getTime()) ? null : d.getFullYear();
  return year ? `${year}-03-31` : (fallback || '');
}

const FinancialReportsExport = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    portfolioId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableData, setTableData] = useState(null);

  const loadPortfolios = useCallback(async () => {
    try {
      const data = await portfolioAPI.getActivePortfolios();
      const safe = Array.isArray(data) ? data : [];
      setPortfolios(safe);
      if (safe.length > 0) {
        setFilters((prev) => ({
          ...prev,
          portfolioId: prev.portfolioId || String(safe[0].portfolioId || safe[0].id || '')
        }));
      }
    } catch (err) {
      console.error('Failed to load portfolios:', err);
    }
  }, []);

  const loadTable = useCallback(async () => {
    if (!filters.portfolioId) return;
    try {
      setLoading(true);
      setError('');
      const response = await financialPositionAPI.getPortfolioExportTable(filters);
      if (response?.success) {
        setTableData(response.data);
      } else {
        setError(response?.error || 'Failed to load export table');
        setTableData(null);
      }
    } catch (err) {
      console.error('Failed to load export table:', err);
      setError(err.message || 'Failed to load export table');
      setTableData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    if (filters.portfolioId) {
      loadTable();
    }
  }, [filters.portfolioId, loadTable]);

  const exportDisabled = !tableData || loading;

  return (
    <div className="fre-wrap">
      <div className="fre-header">
        <div>
          <h2>Equity Portfolio Snapshot</h2>
          <p>Portfolio analytics table with cost and market-based measures.</p>
        </div>
        <div className="fre-header-actions">
          <button type="button" className="fre-refresh" onClick={loadTable} disabled={!filters.portfolioId || loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            type="button"
            className="fre-export-btn fre-export-excel"
            disabled={exportDisabled}
            onClick={() => tableData && downloadCsv(tableData)}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="fre-export-btn fre-export-pdf"
            disabled={exportDisabled}
            onClick={() => tableData && downloadPdf(tableData)}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="fre-filters">
        <label>
          Portfolio
          <select
            value={filters.portfolioId}
            onChange={(e) => setFilters((prev) => ({ ...prev, portfolioId: e.target.value }))}
          >
            <option value="">Select portfolio</option>
            {portfolios.map((p) => {
              const id = String(p.portfolioId || p.id || '');
              const name = p.portfolioName || p.name || id;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          As of date
          <input
            type="date"
            value={filters.asOfDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, asOfDate: e.target.value }))}
          />
        </label>
      </div>

      {error ? <div className="fre-error">{error}</div> : null}

      {tableData ? (
        <div className="fre-table-card">
          <div className="fre-meta">
            <span><strong>Portfolio:</strong> {tableData.portfolioName}</span>
            <span><strong>As of:</strong> {tableData.asOfDate}</span>
            <span><strong>Base date (31-Mar):</strong> {baseDate31MarFromAsOf(tableData.asOfDate, tableData.baseDate)}</span>
          </div>

          <div className="fre-table-wrap">
            <table className="fre-table">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h}>
                      {h === 'Unrealised Gain/(Loss) Based on WACC & MV' ? (
                        <>
                          Unrealised Gain/(Loss) Based on WACC {'&'} MV
                        </>
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tableData.rows || []).map((row) => (
                  <tr key={`${row.counter}-${row.companyName}`}>
                    <td>{row.counter}</td>
                    <td className="num">{fmt(row.numberOfShares, 0)}</td>
                    <td className="num">{fmt(row.wacc, 2)}</td>
                    <td className="num">{fmt(row.totalCost, 2)}</td>
                    <td className="num">{fmt(row.becBasedOnWacc, 2)}</td>
                    <td className="num">{fmt(row.becCostAfterDividends, 2)}</td>
                    <td className="num">{fmt(row.becBasedOnMarchMv, 2)}</td>
                    <td className="num">{fmt(row.marketValuePerShare, 2)}</td>
                    <td className="num">{fmt(row.totalMarketValue, 2)}</td>
                    <td className={`num ${row.unrealizedGainLossCostBasis >= 0 ? 'pos' : 'neg'}`}>
                      {fmt(row.unrealizedGainLossCostBasis, 2)}
                    </td>
                    <td className={`num ${row.unrealizedGainLossMvToMv >= 0 ? 'pos' : 'neg'}`}>
                      {fmt(row.unrealizedGainLossMvToMv, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{fmt(tableData.totals?.numberOfShares, 0)}</td>
                  <td className="num">-</td>
                  <td className="num">{fmt(tableData.totals?.totalCost, 2)}</td>
                  <td className="num">{fmt(tableData.totals?.becBasedOnWacc, 2)}</td>
                  <td className="num">{fmt(tableData.totals?.becCostAfterDividends, 2)}</td>
                  <td className="num">{fmt(tableData.totals?.becBasedOnMarchMv, 2)}</td>
                  <td className="num">-</td>
                  <td className="num">{fmt(tableData.totals?.totalMarketValue, 2)}</td>
                  <td className="num">{fmt(tableData.totals?.unrealizedGainLossCostBasis, 2)}</td>
                  <td className="num">{fmt(tableData.totals?.unrealizedGainLossMvToMv, 2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FinancialReportsExport;
