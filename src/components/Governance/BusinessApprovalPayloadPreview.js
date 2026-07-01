import React, { useMemo, useState } from 'react';
import { GSEC_SOURCE_LABELS } from '../../utils/gsecMakerChecker';
import { NON_TRADING_SOURCE_LABELS } from '../../utils/nonTradingMakerChecker';

const PAGE_SIZE = 25;

const NON_TRADING_SUMMARY_FIELDS = [
  { key: 'voucherNumber', label: 'Voucher' },
  { key: 'accountType', label: 'Account type' },
  { key: 'transactionType', label: 'Transaction type' },
  { key: 'amount', label: 'Amount', format: 'amount' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'glAccountCode', label: 'GL account' },
  { key: 'coaDescription', label: 'GL description' },
  { key: 'debitGlAccountCode', label: 'Debit GL' },
  { key: 'creditGlAccountCode', label: 'Credit GL' },
  { key: 'currency', label: 'Currency' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'counterparty', label: 'Counterparty' },
  { key: 'notes', label: 'Notes' },
];

const REVERSE_SUMMARY_FIELDS = [
  { key: 'voucherNumber', label: 'Original voucher' },
  { key: 'amount', label: 'Reversal amount', format: 'amount' },
  { key: 'date', label: 'Reversal date', format: 'date' },
  { key: 'cashFlowOnSettlement', label: 'Cash flow', format: 'amount' },
  { key: 'notes', label: 'Notes' },
];

const GSEC_COLUMNS = [
  { key: 'entry_date', label: 'Entry date', width: 150 },
  { key: 'deal_number', label: 'Deal', width: 160 },
  { key: 'account_code', label: 'Account', width: 110 },
  { key: 'account_name', label: 'Name', width: 180 },
  { key: 'debit_amount', label: 'Debit', width: 100, align: 'right' },
  { key: 'credit_amount', label: 'Credit', width: 100, align: 'right' },
  { key: 'currency', label: 'CCY', width: 60 },
  { key: 'description', label: 'Description', width: 200 },
];

function formatDateTime(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-LK');
}

function formatAmount(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n === 0) return '0';
  return n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatCell(key, value) {
  if (value == null || value === '') return '—';
  if (key === 'entry_date') return formatDateTime(value);
  if (key === 'debit_amount' || key === 'credit_amount') return formatAmount(value);
  return String(value);
}

function GsecEntriesPreview({ request }) {
  const entries = useMemo(
    () => (Array.isArray(request.payload?.entries) ? request.payload.entries : []),
    [request.payload]
  );
  const [expanded, setExpanded] = useState(request.status === 'pending');
  const [page, setPage] = useState(1);

  if (!entries.length) {
    return (
      <p className="agp-payload-empty">No entry rows were included in this approval request.</p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = entries.slice(start, start + PAGE_SIZE);
  const sourceLabel =
    request.source_label ||
    GSEC_SOURCE_LABELS[request.payload?.source] ||
    request.payload?.source ||
    null;

  return (
    <div className="agp-payload-preview">
      <div className="agp-payload-preview-head">
        <button
          type="button"
          className={`agp-payload-toggle${expanded ? ' agp-payload-toggle--active' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="agp-payload-toggle-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor" focusable="false">
              {expanded ? (
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.24a.75.75 0 010 1.08l-4.5 4.24a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              )}
            </svg>
          </span>
          <span className="agp-payload-toggle-label">
            {expanded ? 'Hide submitted data' : 'View submitted data'}
          </span>
          <span className="agp-payload-count-badge">{entries.length}</span>
        </button>
        {sourceLabel && (
          <span className="agp-payload-source">
            <span className="agp-payload-source-label">Source</span>
            {sourceLabel}
          </span>
        )}
        {request.payload?.passDuplicates && (
          <span className="agp-payload-warn">Duplicate check bypassed</span>
        )}
      </div>

      {expanded && (
        <div className="agp-payload-card">
          <div className="agp-payload-table-wrap">
            <table className="agp-payload-table">
              <thead>
                <tr>
                  <th className="agp-payload-rownum">#</th>
                  {GSEC_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`agp-payload-th agp-payload-th--${col.key}`}
                      style={{ minWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <tr key={`${start + idx}-${row.deal_number}-${row.account_code}-${row.entry_date}`}>
                    <td className="agp-payload-rownum">{start + idx + 1}</td>
                    {GSEC_COLUMNS.map((col) => {
                      const raw = row[col.key];
                      const display = formatCell(col.key, raw);
                      const isZeroAmount =
                        (col.key === 'debit_amount' || col.key === 'credit_amount') &&
                        (raw === 0 || raw === '0' || display === '0');
                      return (
                        <td
                          key={col.key}
                          className={[
                            `agp-payload-td agp-payload-td--${col.key}`,
                            col.align === 'right' ? 'agp-payload-num' : '',
                            isZeroAmount ? 'agp-payload-zero' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="agp-payload-footer">
            <span className="agp-payload-range">
              Showing <strong>{start + 1}</strong>–<strong>{Math.min(start + PAGE_SIZE, entries.length)}</strong> of{' '}
              <strong>{entries.length}</strong>
            </span>
            {totalPages > 1 && (
              <div className="agp-payload-pagination-actions">
                <button
                  type="button"
                  className="agp-payload-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="agp-payload-page-label">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="agp-payload-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NonTradingPreview({ request }) {
  const isReverse =
    request.action_type === 'post' || request.payload?.operation === 'reverse';
  const transaction = useMemo(() => {
    if (isReverse) return request.payload || {};
    return request.payload?.transaction || request.payload || {};
  }, [request.payload, isReverse]);
  const [expanded, setExpanded] = useState(request.status === 'pending');

  const fields = isReverse ? REVERSE_SUMMARY_FIELDS : NON_TRADING_SUMMARY_FIELDS;
  const visibleFields = fields.filter((f) => {
    const v = transaction[f.key];
    return v != null && v !== '';
  });

  const debitLines = Array.isArray(transaction.glDebitLines) ? transaction.glDebitLines : [];
  const creditLines = Array.isArray(transaction.glCreditLines) ? transaction.glCreditLines : [];
  const sourceLabel =
    request.source_label ||
    NON_TRADING_SOURCE_LABELS[request.payload?.source] ||
    request.payload?.source ||
    null;

  return (
    <div className="agp-payload-preview">
      <div className="agp-payload-preview-head">
        <button
          type="button"
          className={`agp-payload-toggle${expanded ? ' agp-payload-toggle--active' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="agp-payload-toggle-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor" focusable="false">
              {expanded ? (
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.24a.75.75 0 010 1.08l-4.5 4.24a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              )}
            </svg>
          </span>
          <span className="agp-payload-toggle-label">
            {expanded ? 'Hide submitted data' : 'View submitted data'}
          </span>
        </button>
        {sourceLabel && (
          <span className="agp-payload-source">
            <span className="agp-payload-source-label">Source</span>
            {sourceLabel}
          </span>
        )}
      </div>

      {expanded && (
        <div className="agp-payload-card">
          {visibleFields.length === 0 ? (
            <p className="agp-payload-empty">No transaction details were included.</p>
          ) : (
            <div className="agp-payload-table-wrap">
              <table className="agp-payload-table">
                <tbody>
                  {visibleFields.map((field) => {
                    const raw = transaction[field.key];
                    let display = String(raw);
                    if (field.format === 'amount') display = formatAmount(raw);
                    if (field.format === 'date') display = formatDateTime(raw);
                    return (
                      <tr key={field.key}>
                        <th className="agp-payload-th" style={{ width: 180, textAlign: 'left' }}>
                          {field.label}
                        </th>
                        <td className="agp-payload-td">{display}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(debitLines.length > 0 || creditLines.length > 0) && (
            <div className="agp-payload-table-wrap" style={{ marginTop: 12 }}>
              {debitLines.length > 0 && (
                <>
                  <p className="agp-payload-source-label" style={{ margin: '8px 0 4px' }}>Debit lines</p>
                  <table className="agp-payload-table">
                    <thead>
                      <tr>
                        <th className="agp-payload-th">Account</th>
                        <th className="agp-payload-th">Name</th>
                        <th className="agp-payload-th agp-payload-num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debitLines.map((line, idx) => (
                        <tr key={`dr-${idx}`}>
                          <td className="agp-payload-td">{line.accountCode || line.account_code || '—'}</td>
                          <td className="agp-payload-td">{line.accountName || line.account_name || '—'}</td>
                          <td className="agp-payload-td agp-payload-num">{formatAmount(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {creditLines.length > 0 && (
                <>
                  <p className="agp-payload-source-label" style={{ margin: '12px 0 4px' }}>Credit lines</p>
                  <table className="agp-payload-table">
                    <thead>
                      <tr>
                        <th className="agp-payload-th">Account</th>
                        <th className="agp-payload-th">Name</th>
                        <th className="agp-payload-th agp-payload-num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditLines.map((line, idx) => (
                        <tr key={`cr-${idx}`}>
                          <td className="agp-payload-td">{line.accountCode || line.account_code || '—'}</td>
                          <td className="agp-payload-td">{line.accountName || line.account_name || '—'}</td>
                          <td className="agp-payload-td agp-payload-num">{formatAmount(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BusinessApprovalPayloadPreview({ request }) {
  if (!request?.payload) return null;

  if (request.entity_type === 'gsec_ledger_entry') {
    return <GsecEntriesPreview request={request} />;
  }

  if (request.entity_type === 'non_trading_transaction') {
    return <NonTradingPreview request={request} />;
  }

  return (
    <div className="agp-payload-preview">
      <p className="agp-payload-empty">
        Detailed preview is not available for {request.label || request.entity_type} yet.
      </p>
    </div>
  );
}
