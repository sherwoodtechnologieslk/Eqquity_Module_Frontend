import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/FinancialReportsDownloadCenter.css';
import {
  financialPositionAPI,
  portfolioAPI,
  profitLossAPI,
  trialBalanceAPI,
  gsecEntriesAPI,
  parsedTradeTransactionAPI,
  transactionEntryAPI
} from '../../services/api';
import {
  getLatestDayTradeReportState,
  exportTradeReportToExcel,
  exportTradeReportToPdf
} from '../../utils/tradeReportExport';
import { buildHoldingsForPortfolioPositions } from '../../utils/portfolioHoldingsExport';
import {
  computeMtmPortfolioTotals,
  exportMtmPositionDetailsToPdf,
  exportMtmPositionDetailsToExcel
} from '../../utils/mtmPositionDetailsExport';
import { buildSofpExportRows, SOFP_EXPORT_HEADERS, loadSofpDataForExport } from '../../utils/sofpExport';
import {
  exportGsecGeneralLedgerToExcel,
  exportGsecGeneralLedgerToPdf
} from '../../utils/gsecGeneralLedgerExport';

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

const pdfTable = ({ title, subtitle, head, body, foot, filenameBase, tableOptions }) => {
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
    margin: { left: 40, right: 40 },
    ...(tableOptions || {})
  });

  doc.save(`${filenameBase}.pdf`);
};

const toFixedNumber = (value, decimals) => {
  const n = Number(value) || 0;
  return Number(n.toFixed(decimals));
};

const formatPortfolioQty = (value) => Number(value || 0).toLocaleString();
const formatPortfolio2 = (value) =>
  Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPortfolio4 = (value) =>
  Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

/* ── SOCI ── */
const SOCI_HEADERS = ['Line', 'Amount'];

const buildSociRows = (data) =>
  (data.statement || data.lines || []).map((l) => [
    String(l.label || l.name || l.accountName || ''),
    fmt(Number(l.amount) || 0, 2)
  ]);

/* ── Equity Portfolio Snapshot (this screen uses 4 dp for WACC / some MV fields) ── */
const SNAPSHOT_HEADERS = [
  'Counter',
  'No. of Shares',
  'WACC',
  'Total Cost',
  'BEC Based on WACC',
  'BEC Based on 31 March - MV',
  'Mkt value / Per share',
  'Total Mkt Value',
  'Unrealised Gain/(Loss) Based on WACC & MV',
  'Unrealised Gain/(Loss) Based on MV (31-Mar vs current)'
];

const buildSnapshotBodyRows = (t) =>
  (t.rows || []).map((r) => [
    r.counter ?? '',
    fmt(r.numberOfShares, 0),
    fmt(r.wacc, 4),
    fmt(r.totalCost, 2),
    fmt(r.becBasedOnWacc, 4),
    r.becBasedOnMarchMv != null ? fmt(r.becBasedOnMarchMv, 2) : (r.becBasedOnMarchMvNote || ''),
    fmt(r.marketValuePerShare, 4),
    fmt(r.totalMarketValue, 2),
    fmt(r.unrealizedGainLossCostBasis, 2),
    fmt(r.unrealizedGainLossMvToMv, 2)
  ]);

const buildSnapshotTotalsRow = (totals) => {
  const t = totals || {};
  return [
    'Total',
    fmt(t.numberOfShares, 0),
    '-',
    fmt(t.totalCost, 2),
    fmt(t.becBasedOnWacc, 4),
    t.becBasedOnMarchMv != null ? fmt(t.becBasedOnMarchMv, 2) : '',
    '-',
    fmt(t.totalMarketValue, 2),
    fmt(t.unrealizedGainLossCostBasis, 2),
    fmt(t.unrealizedGainLossMvToMv, 2)
  ];
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

  const fetchFinancialPositionOrThrow = useCallback(async () => {
    const resp = await financialPositionAPI.getFinancialPosition({
      asOfDate: filters.asOfDate,
      portfolio: filters.portfolioId || undefined
    });
    if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Financial Position');
    return resp.data || {};
  }, [filters.asOfDate, filters.portfolioId]);

  const fetchProfitLossOrThrow = useCallback(async () => {
    const resp = await profitLossAPI.getProfitLoss({
      startDate: asOfYearStart(filters.asOfDate),
      endDate: filters.asOfDate,
      portfolio: filters.portfolioId || undefined
    });
    if (!resp?.success) throw new Error(resp?.error || 'Failed to load Statement of Comprehensive Income');
    return resp.data || {};
  }, [filters.asOfDate, filters.portfolioId]);

  const fetchPortfolioSnapshotOrThrow = useCallback(async () => {
    const resp = await financialPositionAPI.getPortfolioExportTable({
      asOfDate: filters.asOfDate,
      portfolioId: filters.portfolioId || undefined
    });
    if (!resp?.success) throw new Error(resp?.error || 'Failed to load Equity Portfolio Snapshot');
    return resp.data || {};
  }, [filters.asOfDate, filters.portfolioId]);

  const exportSofpPdf = () =>
    run('sofp-pdf', async () => {
      const { financialPositionData, netProfit } = await loadSofpDataForExport({
        getFinancialPosition: financialPositionAPI.getFinancialPosition,
        getProfitLoss: profitLossAPI.getProfitLoss,
        asOfDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      const body = buildSofpExportRows({ financialPositionData, netProfit });
      const subtitlePortfolio = financialPositionData?.portfolio || portfolioLabel;
      const subtitleAsOf = financialPositionData?.asOfDate || filters.asOfDate;
      pdfTable({
        title: 'Statement of Financial Position',
        subtitle: `Portfolio: ${subtitlePortfolio}   |   As of: ${subtitleAsOf}`,
        head: SOFP_EXPORT_HEADERS,
        body,
        filenameBase: `SOFP_${baseName}`,
        tableOptions: {
          // Prevent "DR/CR-3,349..." looking concatenated by allocating widths
          columnStyles: {
            0: { cellWidth: 160 }, // Section
            1: { cellWidth: 300 }, // Transaction type
            2: { cellWidth: 110, halign: 'right' }, // Amount
            3: { cellWidth: 60, halign: 'center' } // DR/CR
          }
        }
      });
    });

  const exportSofpExcel = () =>
    run('sofp-xls', async () => {
      const { financialPositionData, netProfit } = await loadSofpDataForExport({
        getFinancialPosition: financialPositionAPI.getFinancialPosition,
        getProfitLoss: profitLossAPI.getProfitLoss,
        asOfDate: filters.asOfDate,
        portfolio: filters.portfolioId || undefined
      });
      const rows = buildSofpExportRows({ financialPositionData, netProfit });
      downloadCsv(`SOFP_${baseName}`, SOFP_EXPORT_HEADERS, rows);
    });

  const exportSociPdf = () =>
    run('soci-pdf', async () => {
      const data = await fetchProfitLossOrThrow();
      const body = buildSociRows(data);
      pdfTable({
        title: 'Statement of Comprehensive Income',
        subtitle: `Portfolio: ${portfolioLabel}   |   Period: ${asOfYearStart(filters.asOfDate)} to ${filters.asOfDate}`,
        head: SOCI_HEADERS,
        body,
        filenameBase: `SOCI_${baseName}`
      });
    });

  const exportSociExcel = () =>
    run('soci-xls', async () => {
      const data = await fetchProfitLossOrThrow();
      const rows = buildSociRows(data);
      downloadCsv(`SOCI_${baseName}`, SOCI_HEADERS, rows);
    });

  const exportSnapshotPdf = () =>
    run('snap-pdf', async () => {
      const t = await fetchPortfolioSnapshotOrThrow();
      const body = buildSnapshotBodyRows(t);
      const foot = buildSnapshotTotalsRow(t.totals);
      pdfTable({
        title: 'Equity Portfolio Snapshot',
        subtitle: `Portfolio: ${t.portfolioName || portfolioLabel}   |   As of: ${t.asOfDate || filters.asOfDate}`,
        head: SNAPSHOT_HEADERS,
        body,
        foot,
        filenameBase: `SNAPSHOT_${baseName}`
      });
    });

  const exportSnapshotExcel = () =>
    run('snap-xls', async () => {
      const t = await fetchPortfolioSnapshotOrThrow();
      const rows = [...buildSnapshotBodyRows(t), buildSnapshotTotalsRow(t.totals)];
      downloadCsv(`SNAPSHOT_${baseName}`, SNAPSHOT_HEADERS, rows);
    });

  const exportHoldingsPdf = () =>
    run('holdings-pdf', async () => {
      const selectedPortfolioObj = portfolios.find(
        (p) => String(p.portfolioId || p.id || '') === String(filters.portfolioId || '')
      );
      const portfolioName = selectedPortfolioObj?.portfolioName || selectedPortfolioObj?.name || '';
      const portfolioBackendId = selectedPortfolioObj?.id || selectedPortfolioObj?.portfolioId || '';

      if (!portfolioName || !portfolioBackendId) {
        throw new Error('Portfolio holdings: portfolio information is missing.');
      }

      const [positionsData, allBuyTransactions, allSellTransactions] = await Promise.all([
        transactionEntryAPI.getPortfolioPositions(portfolioBackendId),
        transactionEntryAPI.getAllBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions()
      ]);

      const holdings = buildHoldingsForPortfolioPositions({
        positionsData,
        allBuyTransactions,
        allSellTransactions,
        portfolioName
      });

      const totalNetQty = holdings.reduce((sum, h) => sum + (Number(h.netQuantity) || 0), 0);
      const totalCostValue = holdings.reduce((sum, h) => sum + (Number(h.costValue) || 0), 0);
      const totalCharges = holdings.reduce((sum, h) => sum + (Number(h.totalCharges) || 0), 0);
      const totalNetValue = holdings.reduce((sum, h) => sum + (Number(h.netValue) || 0), 0);

      const avgBuyPriceTotal = totalNetQty > 0 ? totalCostValue / totalNetQty : 0;
      const costPerShareTotal = totalNetQty > 0 ? totalNetValue / totalNetQty : 0;

      const HEAD = [
        'Company',
        'Net Quantity',
        'Average Buy Price',
        'Cost Value',
        'Charges',
        'Net Value',
        'Cost per Share'
      ];

      const BODY = holdings.map((h) => [
        h.companyName,
        formatPortfolioQty(h.netQuantity),
        formatPortfolio2(h.avgBuyPrice),
        formatPortfolio4(h.costValue),
        formatPortfolio2(h.totalCharges),
        formatPortfolio4(h.netValue),
        formatPortfolio4(h.costPerShare)
      ]);

      const FOOT = [
        'Portfolio Totals',
        formatPortfolioQty(totalNetQty),
        formatPortfolio4(avgBuyPriceTotal),
        formatPortfolio4(totalCostValue),
        formatPortfolio2(totalCharges),
        formatPortfolio4(totalNetValue),
        formatPortfolio4(costPerShareTotal)
      ];

      pdfTable({
        title: 'Portfolio Holdings',
        subtitle: `As at ${filters.asOfDate} · Portfolio: ${portfolioName}`,
        head: HEAD,
        body: BODY,
        foot: FOOT,
        filenameBase: `HOLDINGS_${baseName}`
      });
    });

  const exportHoldingsExcel = () =>
    run('holdings-xls', async () => {
      const selectedPortfolioObj = portfolios.find(
        (p) => String(p.portfolioId || p.id || '') === String(filters.portfolioId || '')
      );
      const portfolioName = selectedPortfolioObj?.portfolioName || selectedPortfolioObj?.name || '';
      const portfolioBackendId = selectedPortfolioObj?.id || selectedPortfolioObj?.portfolioId || '';

      if (!portfolioName || !portfolioBackendId) {
        throw new Error('Portfolio holdings: portfolio information is missing.');
      }

      const [positionsData, allBuyTransactions, allSellTransactions] = await Promise.all([
        transactionEntryAPI.getPortfolioPositions(portfolioBackendId),
        transactionEntryAPI.getAllBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions()
      ]);

      const holdings = buildHoldingsForPortfolioPositions({
        positionsData,
        allBuyTransactions,
        allSellTransactions,
        portfolioName
      });

      const totalNetQty = holdings.reduce((sum, h) => sum + (Number(h.netQuantity) || 0), 0);
      const totalCostValue = holdings.reduce((sum, h) => sum + (Number(h.costValue) || 0), 0);
      const totalCharges = holdings.reduce((sum, h) => sum + (Number(h.totalCharges) || 0), 0);
      const totalNetValue = holdings.reduce((sum, h) => sum + (Number(h.netValue) || 0), 0);

      const avgBuyPriceTotal = totalNetQty > 0 ? totalCostValue / totalNetQty : 0;
      const costPerShareTotal = totalNetQty > 0 ? totalNetValue / totalNetQty : 0;

      const HEAD = [
        'Company',
        'Net Quantity',
        'Average Buy Price',
        'Cost Value',
        'Charges',
        'Net Value',
        'Cost per Share'
      ];

      const rows = holdings.map((h) => [
        h.companyName,
        Math.round(Number(h.netQuantity) || 0),
        toFixedNumber(h.avgBuyPrice, 2),
        toFixedNumber(h.costValue, 4),
        toFixedNumber(h.totalCharges, 2),
        toFixedNumber(h.netValue, 4),
        toFixedNumber(h.costPerShare, 4)
      ]);

      rows.push([
        'Portfolio Totals',
        Math.round(Number(totalNetQty) || 0),
        toFixedNumber(avgBuyPriceTotal, 4),
        toFixedNumber(totalCostValue, 4),
        toFixedNumber(totalCharges, 2),
        toFixedNumber(totalNetValue, 4),
        toFixedNumber(costPerShareTotal, 4)
      ]);

      downloadCsv(`HOLDINGS_${baseName}`, HEAD, rows);
    });

  const resolvePortfolioForMtm = () => {
    const selectedPortfolioObj = portfolios.find(
      (p) => String(p.portfolioId || p.id || '') === String(filters.portfolioId || '')
    );
    const portfolioName = selectedPortfolioObj?.portfolioName || selectedPortfolioObj?.name || '';
    const portfolioBackendId = selectedPortfolioObj?.id || selectedPortfolioObj?.portfolioId || '';
    if (!portfolioBackendId) {
      throw new Error('Mark-to-market: select a portfolio.');
    }
    return { portfolioName, portfolioBackendId };
  };

  const exportMtmPositionDetailsPdf = () =>
    run('mtm-pdf', async () => {
      const { portfolioName, portfolioBackendId } = resolvePortfolioForMtm();
      const mtmData = await transactionEntryAPI.getPortfolioPositions(portfolioBackendId);
      if (!Array.isArray(mtmData) || mtmData.length === 0) {
        throw new Error(
          'No mark-to-market position data for this portfolio. Record buy transactions and ensure positions exist.'
        );
      }
      const totals = computeMtmPortfolioTotals(mtmData);
      exportMtmPositionDetailsToPdf({
        mtmData,
        portfolioName,
        totals,
        lastUpdated: new Date(),
        filenameBase: `MTM_${baseName}`
      });
    });

  const exportMtmPositionDetailsExcel = () =>
    run('mtm-xls', async () => {
      const { portfolioName, portfolioBackendId } = resolvePortfolioForMtm();
      const mtmData = await transactionEntryAPI.getPortfolioPositions(portfolioBackendId);
      if (!Array.isArray(mtmData) || mtmData.length === 0) {
        throw new Error(
          'No mark-to-market position data for this portfolio. Record buy transactions and ensure positions exist.'
        );
      }
      const totals = computeMtmPortfolioTotals(mtmData);
      exportMtmPositionDetailsToExcel({
        mtmData,
        portfolioName,
        totals,
        filenameBase: `MTM_${baseName}`
      });
    });

  const exportTradeReportPdf = () =>
    run('trade-pdf', async () => {
      const data = await parsedTradeTransactionAPI.getParsedTransactions();
      const { groupedData, latestTradeDate } = getLatestDayTradeReportState(data || []);
      if (!latestTradeDate) {
        throw new Error('No parsed trade sessions found. Upload or parse trades in Trade Confirmation first.');
      }
      exportTradeReportToPdf({ groupedData, latestTradeDate, filenameBase: `TRADE_${baseName}` });
    });

  const exportTradeReportExcel = () =>
    run('trade-xls', async () => {
      const data = await parsedTradeTransactionAPI.getParsedTransactions();
      const { groupedData, latestTradeDate } = getLatestDayTradeReportState(data || []);
      if (!latestTradeDate) {
        throw new Error('No parsed trade sessions found. Upload or parse trades in Trade Confirmation first.');
      }
      exportTradeReportToExcel({ groupedData, latestTradeDate, filenameBase: `TRADE_${baseName}` });
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

  const normalizeGsecEntryDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const filterGsecEntriesByPeriod = (entries, asOfDate) => {
    const start = asOfYearStart(asOfDate);
    const end = String(asOfDate || '').slice(0, 10);
    if (!end) return [];
    return (Array.isArray(entries) ? entries : []).filter((e) => {
      const ed = normalizeGsecEntryDate(e.entry_date);
      return ed && ed >= start && ed <= end;
    });
  };

  const exportGsecGeneralLedgerPdf = () =>
    run('gsec-gl-pdf', async () => {
      const raw = await gsecEntriesAPI.getSavedLedgerEntries(null);
      const entries = filterGsecEntriesByPeriod(raw, filters.asOfDate);
      if (!entries.length) {
        throw new Error(
          'No GSec ledger entries in this period. Import GSec data or widen the as-of date range.'
        );
      }
      const totalDebits = entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
      const totalCredits = entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
      exportGsecGeneralLedgerToPdf({
        entries,
        totalDebits,
        totalCredits,
        filenameBase: `GSEC_GL_${baseName}`
      });
    });

  const exportGsecGeneralLedgerExcel = () =>
    run('gsec-gl-xls', async () => {
      const raw = await gsecEntriesAPI.getSavedLedgerEntries(null);
      const entries = filterGsecEntriesByPeriod(raw, filters.asOfDate);
      if (!entries.length) {
        throw new Error(
          'No GSec ledger entries in this period. Import GSec data or widen the as-of date range.'
        );
      }
      const totalDebits = entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
      const totalCredits = entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
      exportGsecGeneralLedgerToExcel({
        entries,
        totalDebits,
        totalCredits,
        filenameBase: `GSEC_GL_${baseName}`
      });
    });

  const disabledKey = Boolean(!filters.portfolioId);
  const busy = busyKey !== '';

  const reportCards = [
    {
      id: 'sofp',
      title: 'Statement of Financial Position',
      subtitle: `As at ${filters.asOfDate}`,
      pdfKey: 'sofp-pdf',
      excelKey: 'sofp-xls',
      onPdf: exportSofpPdf,
      onExcel: exportSofpExcel,
      lockWithoutPortfolio: false
    },
    {
      id: 'soci',
      title: 'Statement of Comprehensive Income',
      subtitle: `Period ${asOfYearStart(filters.asOfDate)} to ${filters.asOfDate}`,
      pdfKey: 'soci-pdf',
      excelKey: 'soci-xls',
      onPdf: exportSociPdf,
      onExcel: exportSociExcel,
      lockWithoutPortfolio: true
    },
    {
      id: 'snapshot',
      title: 'Equity Portfolio Snapshot',
      subtitle: `As at ${filters.asOfDate}`,
      pdfKey: 'snap-pdf',
      excelKey: 'snap-xls',
      onPdf: exportSnapshotPdf,
      onExcel: exportSnapshotExcel,
      lockWithoutPortfolio: true
    },
    {
      id: 'holdings',
      title: 'Portfolio Holdings',
      subtitle: `As at ${filters.asOfDate}`,
      pdfKey: 'holdings-pdf',
      excelKey: 'holdings-xls',
      onPdf: exportHoldingsPdf,
      onExcel: exportHoldingsExcel,
      lockWithoutPortfolio: true
    },
    {
      id: 'mtm',
      title: 'Mark-to-Market - Position Details',
      subtitle: `Live positions from transaction engine · As at ${filters.asOfDate} (reference date)`,
      pdfKey: 'mtm-pdf',
      excelKey: 'mtm-xls',
      onPdf: exportMtmPositionDetailsPdf,
      onExcel: exportMtmPositionDetailsExcel,
      lockWithoutPortfolio: true
    },
    {
      id: 'trade-report',
      title: 'Trade Report',
      subtitle:
        'Latest parsed trade session (newest trade date in uploaded data - same as Trade Confirmation › Trade Report).',
      pdfKey: 'trade-pdf',
      excelKey: 'trade-xls',
      onPdf: exportTradeReportPdf,
      onExcel: exportTradeReportExcel,
      lockWithoutPortfolio: false
    },
    {
      id: 'ctb',
      title: 'Combined Trial Balance',
      subtitle:
        'A single trial balance that combines equity and GSec ledgers, covering both trading and non-trading transactions.',
      pdfKey: 'ctb-pdf',
      excelKey: 'ctb-xls',
      onPdf: exportCombinedTrialBalancePdf,
      onExcel: exportCombinedTrialBalanceExcel,
      lockWithoutPortfolio: false
    },
    {
      id: 'gsec-gl',
      title: 'GSec General Ledger',
      subtitle: `Saved GSec ledger lines · Period ${asOfYearStart(filters.asOfDate)} to ${filters.asOfDate} (same export as GSec Entries › GSec General Ledger, date-scoped here)`,
      pdfKey: 'gsec-gl-pdf',
      excelKey: 'gsec-gl-xls',
      onPdf: exportGsecGeneralLedgerPdf,
      onExcel: exportGsecGeneralLedgerExcel,
      lockWithoutPortfolio: false
    }
  ];

  const placeholderCards = [
    { id: 'pnl', title: 'Profit and Loss Statement', subtitle: 'PDF and Excel export' },
    { id: 'cashflow', title: 'Cash Flow', subtitle: 'Coming soon' },
    { id: 'notes', title: 'Financial Reporting Notes', subtitle: 'Coming soon' }
  ];

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
        {reportCards.map((card) => {
          const lock = card.lockWithoutPortfolio && disabledKey;
          const disabled = busy || lock;
          return (
            <div key={card.id} className="frdc-card">
              <div className="frdc-card-title">{card.title}</div>
              <div className="frdc-card-sub">{card.subtitle}</div>
              <div className="frdc-actions">
                <button type="button" disabled={disabled} onClick={card.onPdf}>
                  {busyKey === card.pdfKey ? 'Preparing…' : 'Download PDF'}
                </button>
                <button type="button" disabled={disabled} onClick={card.onExcel}>
                  {busyKey === card.excelKey ? 'Preparing…' : 'Download Excel'}
                </button>
              </div>
            </div>
          );
        })}

        {placeholderCards.map((card) => (
          <div key={card.id} className="frdc-card frdc-card-disabled" title="No export endpoint yet">
            <div className="frdc-card-title">{card.title}</div>
            <div className="frdc-card-sub">{card.subtitle}</div>
            <div className="frdc-actions">
              <button type="button" disabled>
                Download PDF
              </button>
              <button type="button" disabled>
                Download Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialReportsDownloadCenter;
