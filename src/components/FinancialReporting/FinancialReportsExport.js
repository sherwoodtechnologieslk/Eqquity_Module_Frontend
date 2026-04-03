import React, { useCallback, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialReportsExport.css';
import { financialPositionAPI, portfolioAPI } from '../../services/api';
import ExportPdfExcelButtons from './ExportPdfExcelButtons';

const fmt = (value, decimals = 2) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * Single source of truth for Equity Portfolio Snapshot table + CSV + PDF.
 * Order here defines column order everywhere.
 */
const PORTFOLIO_EXPORT_COLUMNS = [
  {
    id: 'counter',
    header: 'Counter',
    getExportValue: (row) => row.counter ?? '',
    getFooterValue: () => 'Total',
    getCellClassName: () => '',
    footerClassName: '',
    getDisplayValue: (row) => row.counter ?? ''
  },
  {
    id: 'numberOfShares',
    header: 'No. of Shares',
    getExportValue: (row) => fmt(row.numberOfShares, 0),
    getFooterValue: (t) => fmt(t?.numberOfShares, 0),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.numberOfShares, 0)
  },
  {
    id: 'wacc',
    header: 'WACC',
    getExportValue: (row) => fmt(row.wacc, 2),
    getFooterValue: () => '-',
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.wacc, 2)
  },
  {
    id: 'totalCost',
    header: 'Total Cost',
    getExportValue: (row) => fmt(row.totalCost, 2),
    getFooterValue: (t) => fmt(t?.totalCost, 2),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.totalCost, 2)
  },
  {
    id: 'becBasedOnWacc',
    header: 'BEC Based on WACC',
    getExportValue: (row) => fmt(row.becBasedOnWacc, 2),
    getFooterValue: (t) => fmt(t?.becBasedOnWacc, 2),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.becBasedOnWacc, 2)
  },
  {
    id: 'becCostAfterDividends',
    header: 'BEC Cost (after deducting dividends)',
    getExportValue: (row) => fmt(row.becCostAfterDividends, 2),
    getFooterValue: (t) => fmt(t?.becCostAfterDividends, 2),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.becCostAfterDividends, 2)
  },
  {
    id: 'becBasedOnMarchMv',
    header: 'BEC Based on 31 March - MV',
    getExportValue: (row) => fmt(row.becBasedOnMarchMv, 2),
    getFooterValue: (t) => fmt(t?.becBasedOnMarchMv, 2),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.becBasedOnMarchMv, 2)
  },
  {
    id: 'marketValuePerShare',
    header: 'Mkt value / Per share',
    getExportValue: (row) => fmt(row.marketValuePerShare, 2),
    getFooterValue: () => '-',
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.marketValuePerShare, 2)
  },
  {
    id: 'totalMarketValue',
    header: 'Total Mkt Value',
    getExportValue: (row) => fmt(row.totalMarketValue, 2),
    getFooterValue: (t) => fmt(t?.totalMarketValue, 2),
    getCellClassName: () => 'num',
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.totalMarketValue, 2)
  },
  {
    id: 'unrealizedGainLossCostBasis',
    header: 'Unrealised Gain/(Loss) Based on WACC & MV',
    getExportValue: (row) => fmt(row.unrealizedGainLossCostBasis, 2),
    getFooterValue: (t) => fmt(t?.unrealizedGainLossCostBasis, 2),
    getCellClassName: (row) =>
      `num ${row.unrealizedGainLossCostBasis >= 0 ? 'pos' : 'neg'}`,
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.unrealizedGainLossCostBasis, 2)
  },
  {
    id: 'unrealizedGainLossMvToMv',
    header: 'Unrealised Gain/(Loss) Based on MV (31-Mar vs current)',
    getExportValue: (row) => fmt(row.unrealizedGainLossMvToMv, 2),
    getFooterValue: (t) => fmt(t?.unrealizedGainLossMvToMv, 2),
    getCellClassName: (row) =>
      `num ${row.unrealizedGainLossMvToMv >= 0 ? 'pos' : 'neg'}`,
    footerClassName: 'num',
    getDisplayValue: (row) => fmt(row.unrealizedGainLossMvToMv, 2)
  }
];

const EXPORT_HEADERS = PORTFOLIO_EXPORT_COLUMNS.map((c) => c.header);

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
  const body = (tableData.rows || []).map((row) =>
    PORTFOLIO_EXPORT_COLUMNS.map((col) => col.getExportValue(row))
  );
  const t = tableData.totals || {};
  const foot = [PORTFOLIO_EXPORT_COLUMNS.map((col) => col.getFooterValue(t))];
  return { body, foot };
}

function downloadCsv(tableData) {
  const { body, foot } = buildRowsFromTableData(tableData);
  const lines = [
    EXPORT_HEADERS.map(escapeCsvCell).join(','),
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
    head: [EXPORT_HEADERS],
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
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    footStyles: {
      fillColor: [241, 245, 249],
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
          <ExportPdfExcelButtons
            exportDisabled={exportDisabled}
            onExportExcel={() => tableData && downloadCsv(tableData)}
            onExportPdf={() => tableData && downloadPdf(tableData)}
          />
        </div>
      </div>

      <div className="fre-panel fre-filters">
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
        <div className="fre-panel fre-table-card">
          <div className="fre-meta">
            <span><strong>Portfolio:</strong> {tableData.portfolioName}</span>
            <span><strong>As of:</strong> {tableData.asOfDate}</span>
            <span><strong>Base date (31-Mar):</strong> {baseDate31MarFromAsOf(tableData.asOfDate, tableData.baseDate)}</span>
          </div>

          <div className="fre-table-wrap">
            <table className="fre-table">
              <thead>
                <tr>
                  {PORTFOLIO_EXPORT_COLUMNS.map((col) => (
                    <th key={col.id}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tableData.rows || []).map((row) => (
                  <tr key={`${row.counter}-${row.companyName}`}>
                    {PORTFOLIO_EXPORT_COLUMNS.map((col) => (
                      <td key={col.id} className={col.getCellClassName(row)}>
                        {col.getDisplayValue(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  {PORTFOLIO_EXPORT_COLUMNS.map((col) => (
                    <td key={col.id} className={col.footerClassName}>
                      {col.getFooterValue(tableData.totals || {})}
                    </td>
                  ))}
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
