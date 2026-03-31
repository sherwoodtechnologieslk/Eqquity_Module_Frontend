import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialReportsDownloadCenter.css';
import { financialPositionAPI, portfolioAPI, profitLossAPI, trialBalanceAPI, gsecEntriesAPI } from '../../services/api';

const fmt = (value, decimals = 2) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

const escapeCsvCell = (value) => {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const sanitizeFilePart = (name) => {
  const withoutControl = String(name || 'export')
    .split('')
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('');
  return (
    withoutControl
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'export'
  );
};

const asOfYearStart = (asOfDate) => {
  const d = new Date(String(asOfDate || ''));
  if (Number.isNaN(d.getTime())) return new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
};

const downloadCsv = (filenameBase, headers, rows) => {
  const lines = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))];
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const pdfTable = ({ title, subtitle, head, body, foot, filenameBase }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(11);
  doc.text(title, 40, 34);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 40, 50);
    doc.setTextColor(15, 23, 42);
  }

  autoTable(doc, {
    startY: subtitle ? 62 : 50,
    theme: 'grid',
    head: [head],
    body,
    foot: foot ? [foot] : undefined,
    showFoot: foot ? 'lastPage' : 'never',
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
      fontStyle: 'bold'
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

  doc.save(`${filenameBase}.pdf`);
};

const FinancialReportsDownloadCenter = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    portfolioId: ''
  });
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');

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
    } catch (e) {
      console.error('Failed to load portfolios:', e);
    }
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const portfolioLabel = useMemo(() => {
    const match = portfolios.find((p) => String(p.portfolioId || p.id || '') === String(filters.portfolioId || ''));
    return match?.portfolioName || match?.name || filters.portfolioId || 'All';
  }, [portfolios, filters.portfolioId]);

  const baseName = useMemo(() => {
    const p = sanitizeFilePart(portfolioLabel);
    const d = sanitizeFilePart(filters.asOfDate);
    return `${p}_${d}`;
  }, [portfolioLabel, filters.asOfDate]);

  const run = async (key, fn) => {
    try {
      setBusyKey(key);
      setError('');
      await fn();
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Export failed');
    } finally {
      setBusyKey('');
    }
  };

  const exportSofpPdf = () =>
    run('sofp-pdf', async () => {
      const resp = await financialPositionAPI.getFinancialPosition({
        asOfDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Financial Position');
      const data = resp.data || {};

      const head = ['Section', 'Transaction type', 'Amount', 'DR/CR'];
      const rows = [];
      const pushGroup = (section, list, normal) => {
        (list || []).forEach((a) => {
          rows.push([
            section,
            String(a.transactionTypeName || a.accountCategory || a.accountName || ''),
            fmt(Math.abs(a.balance || 0), 2),
            String(a.balanceType || normal || '')
          ]);
        });
      };

      pushGroup('Assets · Non-current', data.assets?.nonCurrentAssets, 'DR');
      pushGroup('Assets · Current', data.assets?.currentAssets, 'DR');
      pushGroup('Liabilities · Non-current', data.liabilities?.nonCurrentLiabilities, 'CR');
      pushGroup('Liabilities · Current', data.liabilities?.currentLiabilities, 'CR');
      pushGroup('Equity', data.equity, 'CR');

      pdfTable({
        title: 'Statement of Financial Position',
        subtitle: `Portfolio: ${portfolioLabel}   |   As of: ${filters.asOfDate}`,
        head,
        body: rows,
        filenameBase: `SOFP_${baseName}`
      });
    });

  const exportSofpExcel = () =>
    run('sofp-xls', async () => {
      const resp = await financialPositionAPI.getFinancialPosition({
        asOfDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Financial Position');
      const data = resp.data || {};
      const headers = ['Section', 'Transaction type', 'Amount', 'DR/CR'];
      const rows = [];
      const pushGroup = (section, list, normal) => {
        (list || []).forEach((a) => {
          rows.push([
            section,
            String(a.transactionTypeName || a.accountCategory || a.accountName || ''),
            fmt(Math.abs(a.balance || 0), 2),
            String(a.balanceType || normal || '')
          ]);
        });
      };
      pushGroup('Assets · Non-current', data.assets?.nonCurrentAssets, 'DR');
      pushGroup('Assets · Current', data.assets?.currentAssets, 'DR');
      pushGroup('Liabilities · Non-current', data.liabilities?.nonCurrentLiabilities, 'CR');
      pushGroup('Liabilities · Current', data.liabilities?.currentLiabilities, 'CR');
      pushGroup('Equity', data.equity, 'CR');
      downloadCsv(`SOFP_${baseName}`, headers, rows);
    });

  const exportSociPdf = () =>
    run('soci-pdf', async () => {
      const resp = await profitLossAPI.getProfitLoss({
        startDate: asOfYearStart(filters.asOfDate),
        endDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Comprehensive Income');
      const data = resp.data || {};
      const head = ['Line', 'Amount'];
      const body = (data.statement || data.lines || []).map((l) => [
        String(l.label || l.name || l.accountName || ''),
        fmt(Number(l.amount) || 0, 2)
      ]);
      pdfTable({
        title: 'Statement of Comprehensive Income',
        subtitle: `Portfolio: ${portfolioLabel}   |   Period: ${asOfYearStart(filters.asOfDate)} to ${filters.asOfDate}`,
        head,
        body,
        filenameBase: `SOCI_${baseName}`
      });
    });

  const exportSociExcel = () =>
    run('soci-xls', async () => {
      const resp = await profitLossAPI.getProfitLoss({
        startDate: asOfYearStart(filters.asOfDate),
        endDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Comprehensive Income');
      const data = resp.data || {};
      const headers = ['Line', 'Amount'];
      const rows = (data.statement || data.lines || []).map((l) => [
        String(l.label || l.name || l.accountName || ''),
        fmt(Number(l.amount) || 0, 2)
      ]);
      downloadCsv(`SOCI_${baseName}`, headers, rows);
    });

  const exportSnapshotPdf = () =>
    run('snap-pdf', async () => {
      const resp = await financialPositionAPI.getPortfolioExportTable({
        asOfDate: filters.asOfDate,
        portfolioId: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Equity Portfolio Snapshot');
      const t = resp.data || {};
      const head = [
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
      const body = (t.rows || []).map((r) => [
        r.counter ?? '',
        fmt(r.numberOfShares, 0),
        fmt(r.wacc, 4),
        fmt(r.totalCost, 2),
        fmt(r.becBasedOnWacc, 4),
        fmt(r.becCostAfterDividends, 2),
        fmt(r.becBasedOnMarchMv, 2),
        fmt(r.marketValuePerShare, 4),
        fmt(r.totalMarketValue, 2),
        fmt(r.unrealizedGainLossCostBasis, 2),
        fmt(r.unrealizedGainLossMvToMv, 2)
      ]);
      const totals = t.totals || {};
      const foot = [
        'Total',
        fmt(totals.numberOfShares, 0),
        '-',
        fmt(totals.totalCost, 2),
        fmt(totals.becBasedOnWacc, 4),
        fmt(totals.becCostAfterDividends, 2),
        fmt(totals.becBasedOnMarchMv, 2),
        '-',
        fmt(totals.totalMarketValue, 2),
        fmt(totals.unrealizedGainLossCostBasis, 2),
        fmt(totals.unrealizedGainLossMvToMv, 2)
      ];

      pdfTable({
        title: 'Equity Portfolio Snapshot',
        subtitle: `Portfolio: ${t.portfolioName || portfolioLabel}   |   As of: ${t.asOfDate || filters.asOfDate}`,
        head,
        body,
        foot,
        filenameBase: `SNAPSHOT_${baseName}`
      });
    });

  const exportSnapshotExcel = () =>
    run('snap-xls', async () => {
      const resp = await financialPositionAPI.getPortfolioExportTable({
        asOfDate: filters.asOfDate,
        portfolioId: filters.portfolioId || undefined
      });
      if (!resp?.success) throw new Error(resp?.error || 'Failed to load Equity Portfolio Snapshot');
      const t = resp.data || {};
      const headers = [
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
      const rows = (t.rows || []).map((r) => [
        r.counter ?? '',
        fmt(r.numberOfShares, 0),
        fmt(r.wacc, 4),
        fmt(r.totalCost, 2),
        fmt(r.becBasedOnWacc, 4),
        fmt(r.becCostAfterDividends, 2),
        fmt(r.becBasedOnMarchMv, 2),
        fmt(r.marketValuePerShare, 4),
        fmt(r.totalMarketValue, 2),
        fmt(r.unrealizedGainLossCostBasis, 2),
        fmt(r.unrealizedGainLossMvToMv, 2)
      ]);
      const totals = t.totals || {};
      rows.push([
        'Total',
        fmt(totals.numberOfShares, 0),
        '-',
        fmt(totals.totalCost, 2),
        fmt(totals.becBasedOnWacc, 4),
        fmt(totals.becCostAfterDividends, 2),
        fmt(totals.becBasedOnMarchMv, 2),
        '-',
        fmt(totals.totalMarketValue, 2),
        fmt(totals.unrealizedGainLossCostBasis, 2),
        fmt(totals.unrealizedGainLossMvToMv, 2)
      ]);
      downloadCsv(`SNAPSHOT_${baseName}`, headers, rows);
    });

  const exportCombinedTrialBalanceExcel = () =>
    run('ctb-xls', async () => {
      const blob = await trialBalanceAPI.exportCombinedTrialBalanceExcel({
        startDate: asOfYearStart(filters.asOfDate),
        endDate: filters.asOfDate
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = sanitizeFilePart(filters.asOfDate);
      a.href = downloadUrl;
      a.download = `combined-trial-balance-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    });

  const exportCombinedTrialBalancePdf = () =>
    run('ctb-pdf', async () => {
      const startDate = asOfYearStart(filters.asOfDate);
      const endDate = filters.asOfDate;

      const [tbRes, gsecRes] = await Promise.all([
        trialBalanceAPI.getTrialBalance({ startDate, endDate }),
        gsecEntriesAPI.getBalanceSheet({ startDate, endDate })
      ]);

      if (!tbRes?.success) {
        throw new Error(tbRes?.error || 'Failed to fetch equity trial balance');
      }
      if (!gsecRes?.success) {
        throw new Error(gsecRes?.error || 'Failed to fetch GSec balance sheet');
      }

      const equityAccounts = (tbRes.data?.accounts || []).map((a) => ({
        source: 'Equity',
        account_code: a.account_code,
        account_name: a.account_name,
        account_type: a.account_type,
        total_debit: Number(a.total_debit) || 0,
        total_credit: Number(a.total_credit) || 0,
        net_balance: Number(a.net_balance) || 0,
        balance_type: a.balance_type
      }));

      const gsecAccounts = (gsecRes.data?.accounts || []).map((g) => {
        const net = (Number(g.total_debit) || 0) - (Number(g.total_credit) || 0);
        return {
          source: 'GSec',
          account_code: g.account_code,
          account_name: g.account_name,
          account_type: g.account_category || 'GSec',
          total_debit: Number(g.total_debit) || 0,
          total_credit: Number(g.total_credit) || 0,
          net_balance: net,
          balance_type: net > 0 ? 'DR' : net < 0 ? 'CR' : 'ZERO'
        };
      });

      const combinedAccounts = [...equityAccounts, ...gsecAccounts];

      const totals = combinedAccounts.reduce(
        (acc, a) => {
          acc.debit += a.total_debit || 0;
          acc.credit += a.total_credit || 0;
          return acc;
        },
        { debit: 0, credit: 0 }
      );

      const head = [
        'Source',
        'Account Code',
        'Account Name',
        'Type / Category',
        'Debit',
        'Credit',
        'Net',
        'DR/CR'
      ];

      const body = combinedAccounts.map((acc) => [
        acc.source,
        acc.account_code,
        acc.account_name,
        acc.account_type,
        fmt(acc.total_debit, 2),
        fmt(acc.total_credit, 2),
        fmt(acc.net_balance, 2),
        acc.balance_type
      ]);

      const foot = [
        'Totals',
        '',
        '',
        '',
        fmt(totals.debit, 2),
        fmt(totals.credit, 2),
        '',
        Math.abs(totals.debit - totals.credit) < 0.01 ? 'BALANCED' : 'OUT OF BALANCE'
      ];

      pdfTable({
        title: 'Combined Trial Balance',
        subtitle: `Includes equity and GSec ledgers (trading and non-trading) · Period: ${startDate} to ${endDate}`,
        head,
        body,
        foot,
        filenameBase: `CTB_${baseName}`
      });
    });

  const disabledKey = Boolean(!filters.portfolioId);

  return (
    <div className="frdc-wrap">
      <div className="frdc-header">
        <div>
          <h2>Financial Reports Export</h2>
          <p>Download financial reports as PDF or Excel (CSV).</p>
        </div>
      </div>

      <div className="frdc-filters">
        <label>
          Portfolio
          <select value={filters.portfolioId} onChange={(e) => setFilters((p) => ({ ...p, portfolioId: e.target.value }))}>
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
          <input type="date" value={filters.asOfDate} onChange={(e) => setFilters((p) => ({ ...p, asOfDate: e.target.value }))} />
        </label>
      </div>

      {error ? <div className="frdc-error">{error}</div> : null}

      <div className="frdc-grid">
        <div className="frdc-card">
          <div className="frdc-card-title">Statement of Financial Position</div>
          <div className="frdc-card-sub">As at {filters.asOfDate}</div>
          <div className="frdc-actions">
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSofpPdf}>
              {busyKey === 'sofp-pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSofpExcel}>
              {busyKey === 'sofp-xls' ? 'Preparing…' : 'Download Excel'}
            </button>
          </div>
        </div>

        <div className="frdc-card">
          <div className="frdc-card-title">Statement of Comprehensive Income</div>
          <div className="frdc-card-sub">Period {asOfYearStart(filters.asOfDate)} to {filters.asOfDate}</div>
          <div className="frdc-actions">
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSociPdf}>
              {busyKey === 'soci-pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSociExcel}>
              {busyKey === 'soci-xls' ? 'Preparing…' : 'Download Excel'}
            </button>
          </div>
        </div>

        <div className="frdc-card">
          <div className="frdc-card-title">Equity Portfolio Snapshot</div>
          <div className="frdc-card-sub">As at {filters.asOfDate}</div>
          <div className="frdc-actions">
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSnapshotPdf}>
              {busyKey === 'snap-pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" disabled={disabledKey || busyKey !== ''} onClick={exportSnapshotExcel}>
              {busyKey === 'snap-xls' ? 'Preparing…' : 'Download Excel'}
            </button>
          </div>
        </div>

        <div className="frdc-card">
          <div className="frdc-card-title">Combined Trial Balance</div>
          <div className="frdc-card-sub">
            A single trial balance that combines equity and GSec ledgers, covering both trading and non-trading transactions.
          </div>
          <div className="frdc-actions">
            <button type="button" disabled={busyKey !== ''} onClick={exportCombinedTrialBalancePdf}>
              {busyKey === 'ctb-pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" disabled={busyKey !== ''} onClick={exportCombinedTrialBalanceExcel}>
              {busyKey === 'ctb-xls' ? 'Preparing…' : 'Download Excel'}
            </button>
          </div>
        </div>

        <div className="frdc-card frdc-card-disabled" title="No export endpoint yet">
          <div className="frdc-card-title">Cash Flow</div>
          <div className="frdc-card-sub">Coming soon</div>
          <div className="frdc-actions">
            <button type="button" disabled>
              Download PDF
            </button>
            <button type="button" disabled>
              Download Excel
            </button>
          </div>
        </div>

        <div className="frdc-card frdc-card-disabled" title="No export endpoint yet">
          <div className="frdc-card-title">Financial Reporting Notes</div>
          <div className="frdc-card-sub">Coming soon</div>
          <div className="frdc-actions">
            <button type="button" disabled>
              Download PDF
            </button>
            <button type="button" disabled>
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsDownloadCenter;

