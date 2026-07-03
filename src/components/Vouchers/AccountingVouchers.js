import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { chartOfAccountsAPI, otherTransactionAPI, otherTransactionGLEntryAPI } from '../../services/api';
import { authService } from '../../services/authService';
import {
  NON_TRADING_SOURCES,
  nonTradingPostButtonLabel,
  nonTradingSubmittingLabel,
  shouldSubmitNonTradingForApproval
} from '../../utils/nonTradingMakerChecker';
import {
  VOUCHER_TYPES,
  PAYMENT_METHODS,
  getToday,
  emptyLine,
  createEmptyHeader,
  generateAccountingVoucherNumber,
  parseAmount,
  sumLines,
  validateSideLines,
  validateJournal,
  buildOtherTransactionPayload,
  isAccountingVoucherRecord,
  inferVoucherTypeFromRecord,
  getPartyLabel,
  showsBankSection,
  formatCurrency,
  formatDisplayDate,
  getVoucherTypeLabel,
  getVoucherTypeLabelFromRecord,
  mapGlEntriesToJournalLines
} from './accountingVoucherUtils';
import '../EquityEntries/Styles/OtherTransactions.css';
import './Styles/AccountingVouchers.css';

const AccountingVouchers = ({ initialVoucherType = 'payment' }) => {
  const [screenTab, setScreenTab] = useState('create');
  const [voucherType, setVoucherType] = useState(initialVoucherType);
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [chartAccountsLoading, setChartAccountsLoading] = useState(true);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [viewFilterType, setViewFilterType] = useState('all');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [header, setHeader] = useState(() =>
    createEmptyHeader(
      initialVoucherType,
      generateAccountingVoucherNumber(initialVoucherType, getToday(), [])
    )
  );
  const [debitLines, setDebitLines] = useState([emptyLine()]);
  const [creditLines, setCreditLines] = useState([emptyLine()]);
  const [debitFixed, setDebitFixed] = useState(false);
  const [creditFixed, setCreditFixed] = useState(false);
  const [debitFixMessage, setDebitFixMessage] = useState('');
  const [creditFixMessage, setCreditFixMessage] = useState('');

  const fetchVouchers = useCallback(async () => {
    try {
      setVouchersLoading(true);
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';
      const data = await otherTransactionAPI.getTransactionsByUser(userEmail);
      const accountingOnly = (data || []).filter(isAccountingVoucherRecord);
      setSavedVouchers(accountingOnly);
      return accountingOnly;
    } catch (error) {
      console.error('Error fetching accounting vouchers:', error);
      setSavedVouchers([]);
      return [];
    } finally {
      setVouchersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  useEffect(() => {
    if (screenTab === 'view') {
      fetchVouchers();
    }
  }, [screenTab, fetchVouchers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setChartAccountsLoading(true);
        const data = await chartOfAccountsAPI.getAll();
        if (!cancelled) setChartAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Chart of accounts load failed:', err);
        if (!cancelled) setChartAccounts([]);
      } finally {
        if (!cancelled) setChartAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regenerateVoucherNumber = useCallback(
    (type, date) => generateAccountingVoucherNumber(type, date, savedVouchers),
    [savedVouchers]
  );

  const resetForm = useCallback(
    (type = voucherType, vouchersList = savedVouchers) => {
      const date = getToday();
      setHeader(
        createEmptyHeader(
          type,
          generateAccountingVoucherNumber(type, date, vouchersList),
          date
        )
      );
      setDebitLines([emptyLine()]);
      setCreditLines([emptyLine()]);
      setDebitFixed(false);
      setCreditFixed(false);
      setDebitFixMessage('');
      setCreditFixMessage('');
      setSubmitMessage('');
    },
    [voucherType, savedVouchers]
  );

  const handleVoucherTypeChange = (type) => {
    setVoucherType(type);
    resetForm(type);
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader((prev) => {
      const next = { ...prev, [name]: value, voucherType };
      if (name === 'date') {
        next.voucherNumber = regenerateVoucherNumber(voucherType, value);
      }
      return next;
    });
  };

  const resolveAccountName = (code, fallback = '') => {
    const match = chartAccounts.find(
      (a) => String(a.account_code || '').trim() === String(code || '').trim()
    );
    return match?.description || fallback;
  };

  const updateLine = (setter, lineId, field, value) => {
    setter((lines) =>
      lines.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, [field]: value };
        if (field === 'accountCode') {
          next.accountName = resolveAccountName(value, line.accountName);
        }
        return next;
      })
    );
  };

  const fixSide = (lines, setFixed, setMessage, sideLabel) => {
    const result = validateSideLines(lines, sideLabel);
    if (!result.ok) {
      setMessage(result.message);
      setFixed(false);
      return;
    }
    setFixed(true);
    setMessage(`${sideLabel.charAt(0).toUpperCase() + sideLabel.slice(1)} lines saved.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');

    if (!debitFixed || !creditFixed) {
      setSubmitMessage('Save debit lines and credit lines before creating the voucher.');
      return;
    }

    const check = validateJournal(debitLines, creditLines);
    if (!check.ok) {
      setSubmitMessage(check.message);
      return;
    }

    if (voucherType === 'payment' && !String(header.party || '').trim()) {
      setSubmitMessage('Payee is required for payment vouchers.');
      return;
    }
    if (voucherType === 'receipt' && !String(header.party || '').trim()) {
      setSubmitMessage('Received from is required for receipt vouchers.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = authService.getStoredUser();
      const payload = buildOtherTransactionPayload({
        voucherType,
        header,
        debitLines,
        creditLines,
        drTotal: check.drTotal,
        userEmail: user?.email || ''
      });

      await otherTransactionAPI.saveOrSubmitTransaction(payload, {
        source: NON_TRADING_SOURCES.GL_TO_GL
      });

      const successMessage = shouldSubmitNonTradingForApproval(user)
        ? `${getVoucherTypeLabel(voucherType)} submitted for checker approval.`
        : `${getVoucherTypeLabel(voucherType)} saved to Other Transactions.`;

      setSubmitMessage(successMessage);
      const latest = await fetchVouchers();
      resetForm(voucherType, latest);
      setScreenTab('view');
    } catch (error) {
      console.error('Error saving accounting voucher:', error);
      setSubmitMessage(`Error saving voucher: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVoucherDetail = async (voucher) => {
    setSelectedVoucher(voucher);
    setDetailLoading(true);
    try {
      const entries = await otherTransactionGLEntryAPI.getEntriesByTransactionId(voucher.id);
      const { debitLines: dr, creditLines: cr } = mapGlEntriesToJournalLines(entries);
      setSelectedVoucher({ ...voucher, detailDebitLines: dr, detailCreditLines: cr });
    } catch (error) {
      console.error('Error loading voucher lines:', error);
      setSelectedVoucher({ ...voucher, detailDebitLines: [], detailCreditLines: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredVouchers = useMemo(() => {
    if (viewFilterType === 'all') return savedVouchers;
    return savedVouchers.filter(
      (v) => inferVoucherTypeFromRecord(v) === viewFilterType
    );
  }, [savedVouchers, viewFilterType]);

  const isErrorMessage = (message) => {
    const lower = String(message || '').toLowerCase();
    return (
      lower.includes('error') ||
      lower.includes('must') ||
      lower.includes('before') ||
      lower.includes('required') ||
      lower.includes('add at least')
    );
  };

  const drTotal = sumLines(debitLines);
  const crTotal = sumLines(creditLines);
  const balanceDiff = drTotal - crTotal;
  const partyLabel = getPartyLabel(voucherType);
  const bankVisible = showsBankSection(voucherType);

  const renderLineBlock = (
    side,
    lines,
    setLines,
    fixed,
    setFixed,
    fixMessage,
    setFixMessage,
    datalistId,
    onAdd,
    onRemove
  ) => (
    <div className="other-trans-field-group av-lines-block">
      <div className="other-trans-gl2gl-section-header">
        <div className="other-trans-gl2gl-section-title-row">
          <label className="other-trans-field-label other-trans-gl2gl-section-label">
            {side === 'debit' ? 'Debit lines' : 'Credit lines'}
          </label>
          {fixed ? (
            <>
              <span className="other-trans-gl2gl-fixed-badge">Saved</span>
              <button
                type="button"
                className="other-trans-gl2gl-edit-lines-btn"
                onClick={() => {
                  setFixed(false);
                  setFixMessage('');
                }}
              >
                Edit
              </button>
            </>
          ) : (
            <button
              type="button"
              className="other-trans-gl2gl-save-lines-btn"
              onClick={() => fixSide(lines, setFixed, setFixMessage, side)}
            >
              Save
            </button>
          )}
        </div>
        {!fixed && (
          <button type="button" onClick={onAdd} className="other-trans-btn other-trans-btn-secondary">
            + Add {side} line
          </button>
        )}
      </div>
      {fixMessage && (
        <p
          className={`other-trans-gl2gl-side-fix-message${
            fixed ? ' other-trans-gl2gl-fix-message--ok' : ' other-trans-gl2gl-fix-message--err'
          }`}
        >
          {fixMessage}
        </p>
      )}
      <datalist id={datalistId}>
        {chartAccounts.map((a) => (
          <option key={`${datalistId}-${a.account_code}`} value={a.account_code}>
            {a.description}
          </option>
        ))}
      </datalist>
      <div className="other-trans-gl2gl-lines">
        {lines.map((line, idx) => (
          <div
            key={line.id}
            className={`other-trans-gl2gl-line-card${fixed ? ' other-trans-gl2gl-line-card--locked' : ''}`}
          >
            <div className="other-trans-gl2gl-line-card-header">
              <span className="other-trans-gl2gl-line-title">
                {side === 'debit' ? 'Debit' : 'Credit'} line {idx + 1}
              </span>
              {!fixed && lines.length > 1 && (
                <button type="button" onClick={() => onRemove(line.id)} className="other-trans-gl2gl-remove-btn">
                  Remove
                </button>
              )}
            </div>
            <div className="other-trans-form-grid other-trans-form-grid--compact">
              <div className="other-trans-field-group">
                <label className="other-trans-field-label">GL code *</label>
                <input
                  value={line.accountCode}
                  onChange={(e) => updateLine(setLines, line.id, 'accountCode', e.target.value)}
                  className="other-trans-form-input"
                  list={fixed ? undefined : datalistId}
                  placeholder={chartAccountsLoading ? 'Loading…' : 'Account code'}
                  readOnly={fixed}
                />
              </div>
              <div className="other-trans-field-group">
                <label className="other-trans-field-label">Amount *</label>
                <input
                  type="number"
                  value={line.amount}
                  onChange={(e) => updateLine(setLines, line.id, 'amount', e.target.value)}
                  className="other-trans-form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  readOnly={fixed}
                />
              </div>
              <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="other-trans-field-label">Account description</label>
                <input
                  value={line.accountName}
                  onChange={(e) => updateLine(setLines, line.id, 'accountName', e.target.value)}
                  className="other-trans-form-input"
                  placeholder="From chart of accounts when code matches"
                  readOnly={fixed}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="av-root">
      <nav className="av-screen-tabs" aria-label="Accounting vouchers">
        <button
          type="button"
          className={`av-screen-tab${screenTab === 'create' ? ' active' : ''}`}
          onClick={() => setScreenTab('create')}
        >
          Create Voucher
        </button>
        <button
          type="button"
          className={`av-screen-tab${screenTab === 'view' ? ' active' : ''}`}
          onClick={() => setScreenTab('view')}
        >
          View Vouchers
          {savedVouchers.length > 0 && (
            <span className="av-tab-count">{savedVouchers.length}</span>
          )}
        </button>
      </nav>

      {screenTab === 'create' ? (
        <div className="other-trans-form-card av-form-card">
          <div className="other-trans-card-header">
            <h2 className="other-trans-card-title">Create accounting voucher</h2>
          </div>

          <div className="av-type-nav" role="tablist" aria-label="Voucher type">
            {VOUCHER_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                role="tab"
                aria-selected={voucherType === type.id}
                className={`av-type-btn${voucherType === type.id ? ' active' : ''}`}
                onClick={() => handleVoucherTypeChange(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="other-trans-form-content other-trans-form-content--gl2gl av-form-body">
            <div className="other-trans-form-grid">
              <div className="other-trans-field-group other-trans-field-group--full">
                <div className="other-trans-voucher-row">
                  <label className="other-trans-field-label other-trans-field-label--inline">Voucher number</label>
                  <button
                    type="button"
                    className="other-trans-btn-regenerate"
                    onClick={() =>
                      setHeader((prev) => ({
                        ...prev,
                        voucherNumber: regenerateVoucherNumber(voucherType, prev.date)
                      }))
                    }
                  >
                    Regenerate
                  </button>
                </div>
                <input
                  name="voucherNumber"
                  value={header.voucherNumber}
                  onChange={handleHeaderChange}
                  className="other-trans-form-input"
                />
                <small className="other-trans-field-hint">
                  Format: {VOUCHER_TYPES.find((t) => t.id === voucherType)?.prefix}-YYYYMMDD-001
                </small>
              </div>

              <div className="other-trans-field-group">
                <label className="other-trans-field-label">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={header.date}
                  onChange={handleHeaderChange}
                  className="other-trans-form-input"
                  required
                />
              </div>

              <div className="other-trans-field-group">
                <label className="other-trans-field-label">Journal balance</label>
                <div className="other-trans-gl2gl-balance-card">
                  <div><strong>Debits:</strong> {formatCurrency(drTotal)}</div>
                  <div><strong>Credits:</strong> {formatCurrency(crTotal)}</div>
                  <div
                    className={`other-trans-gl2gl-balance-outcome ${
                      Math.abs(balanceDiff) < 0.01
                        ? 'other-trans-gl2gl-balance-ok'
                        : 'other-trans-gl2gl-balance-warn'
                    }`}
                  >
                    <strong>Out of balance:</strong> {formatCurrency(balanceDiff)}
                  </div>
                </div>
              </div>

              <div className="other-trans-field-group">
                <label className="other-trans-field-label">
                  {partyLabel}
                  {(voucherType === 'payment' || voucherType === 'receipt') && ' *'}
                </label>
                <input
                  name="party"
                  value={header.party}
                  onChange={handleHeaderChange}
                  className="other-trans-form-input"
                  placeholder={voucherType === 'receipt' ? 'Customer or payer name' : 'Payee name'}
                />
              </div>

              {bankVisible && (
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Payment type</label>
                  <select
                    name="paymentMethod"
                    value={header.paymentMethod}
                    onChange={handleHeaderChange}
                    className="other-trans-form-select"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="other-trans-field-label">Narration / description</label>
                <input
                  name="description"
                  value={header.description}
                  onChange={handleHeaderChange}
                  className="other-trans-form-input"
                  placeholder="Purpose of this voucher"
                />
              </div>

              <div className="other-trans-field-group">
                <label className="other-trans-field-label">Document attached</label>
                <input
                  name="reference"
                  value={header.reference}
                  onChange={handleHeaderChange}
                  className="other-trans-form-input"
                  placeholder="Supporting document reference"
                />
              </div>

              {bankVisible && (
                <>
                  <div className="av-bank-section-label">Bank / cheque details</div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Branch code</label>
                    <input name="branchCode" value={header.branchCode} onChange={handleHeaderChange} className="other-trans-form-input" />
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Branch account</label>
                    <input name="branchAccount" value={header.branchAccount} onChange={handleHeaderChange} className="other-trans-form-input" />
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Branch name</label>
                    <input name="branchName" value={header.branchName} onChange={handleHeaderChange} className="other-trans-form-input" />
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Cheque no.</label>
                    <input name="chequeNumber" value={header.chequeNumber} onChange={handleHeaderChange} className="other-trans-form-input" />
                  </div>
                </>
              )}

              {renderLineBlock(
                'debit',
                debitLines,
                setDebitLines,
                debitFixed,
                setDebitFixed,
                debitFixMessage,
                setDebitFixMessage,
                'avDebitAccounts',
                () => setDebitLines((prev) => [...prev, emptyLine()]),
                (id) => setDebitLines((prev) => prev.filter((l) => l.id !== id))
              )}

              {renderLineBlock(
                'credit',
                creditLines,
                setCreditLines,
                creditFixed,
                setCreditFixed,
                creditFixMessage,
                setCreditFixMessage,
                'avCreditAccounts',
                () => setCreditLines((prev) => [...prev, emptyLine()]),
                (id) => setCreditLines((prev) => prev.filter((l) => l.id !== id))
              )}

              <p className="other-trans-gl2gl-helper">
                Select voucher type, complete header fields, then <strong>Save</strong> debit and credit lines.
                Totals must balance before posting. Vouchers are saved to <strong>Other Transactions</strong>.
              </p>

              <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="other-trans-field-label">Notes</label>
                <textarea
                  name="notes"
                  value={header.notes}
                  onChange={handleHeaderChange}
                  rows="2"
                  className="other-trans-form-textarea"
                  placeholder="Internal notes (optional)"
                />
              </div>
            </div>

            {submitMessage && (
              <div
                className={`other-trans-message ${
                  isErrorMessage(submitMessage) ? 'other-trans-error' : 'other-trans-success'
                }`}
              >
                {submitMessage}
              </div>
            )}

            <div className="other-trans-button-section">
              <button
                type="button"
                onClick={() => resetForm()}
                className="other-trans-btn other-trans-btn-secondary"
                disabled={isSubmitting}
              >
                Reset form
              </button>
              <button
                type="submit"
                className="other-trans-btn other-trans-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? nonTradingSubmittingLabel()
                  : nonTradingPostButtonLabel(`Save ${getVoucherTypeLabel(voucherType)}`)}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="av-view-panel">
          <div className="av-view-toolbar">
            <label className="av-filter">
              <span>Type</span>
              <select value={viewFilterType} onChange={(e) => setViewFilterType(e.target.value)}>
                <option value="all">All types</option>
                {VOUCHER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="av-btn-secondary" onClick={() => setScreenTab('create')}>
              + New voucher
            </button>
          </div>

          {vouchersLoading ? (
            <div className="av-empty">
              <p>Loading vouchers from Other Transactions…</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="av-empty">
              <p>No accounting vouchers found in Other Transactions yet.</p>
              <button type="button" className="av-btn-primary" onClick={() => setScreenTab('create')}>
                Create your first voucher
              </button>
            </div>
          ) : (
            <div className="av-table-wrap">
              <table className="av-data-table">
                <thead>
                  <tr>
                    <th>Voucher no.</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((v) => (
                    <tr key={v.id}>
                      <td>{v.voucher_number}</td>
                      <td>{getVoucherTypeLabelFromRecord(v)}</td>
                      <td>{formatDisplayDate(v.transaction_date)}</td>
                      <td>{v.counterparty || '—'}</td>
                      <td className="av-num">{formatCurrency(v.amount)}</td>
                      <td>
                        <button type="button" className="av-link-btn" onClick={() => openVoucherDetail(v)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedVoucher && (
        <div className="av-modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedVoucher(null)}>
          <div className="av-modal" onClick={(e) => e.stopPropagation()}>
            <div className="av-modal-header">
              <h3>{getVoucherTypeLabelFromRecord(selectedVoucher)}</h3>
              <button type="button" className="av-modal-close" onClick={() => setSelectedVoucher(null)}>Close</button>
            </div>
            <div className="av-modal-body">
              <div className="av-detail-grid">
                <div><span className="av-detail-lbl">Voucher no.</span><span>{selectedVoucher.voucher_number}</span></div>
                <div><span className="av-detail-lbl">Date</span><span>{formatDisplayDate(selectedVoucher.transaction_date)}</span></div>
                <div><span className="av-detail-lbl">Party</span><span>{selectedVoucher.counterparty || '—'}</span></div>
                <div><span className="av-detail-lbl">Payment type</span><span>{selectedVoucher.payment_method || '—'}</span></div>
                <div className="av-detail-full"><span className="av-detail-lbl">Narration</span><span>{selectedVoucher.description || '—'}</span></div>
                <div className="av-detail-full"><span className="av-detail-lbl">Document attached</span><span>{selectedVoucher.reference || '—'}</span></div>
              </div>
              <h4 className="av-lines-title">Journal lines</h4>
              {detailLoading ? (
                <p className="av-detail-loading">Loading posted lines…</p>
              ) : (
                <table className="av-lines-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Description</th>
                      <th>DR/CR</th>
                      <th className="av-num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedVoucher.detailDebitLines || []).map((line, i) => (
                      <tr key={`dr-${i}`}>
                        <td>{line.accountCode}</td>
                        <td>{line.accountName || '—'}</td>
                        <td>DR</td>
                        <td className="av-num">{formatCurrency(line.amount)}</td>
                      </tr>
                    ))}
                    {(selectedVoucher.detailCreditLines || []).map((line, i) => (
                      <tr key={`cr-${i}`}>
                        <td>{line.accountCode}</td>
                        <td>{line.accountName || '—'}</td>
                        <td>CR</td>
                        <td className="av-num">{formatCurrency(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total</strong></td>
                      <td className="av-num"><strong>{formatCurrency(selectedVoucher.amount)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingVouchers;
