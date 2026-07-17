import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  transactionEntryAPI,
  portfolioSettlementMappingAPI,
  portfolioCostingMethodAPI,
} from '../../services/api';
import {
  buildParsedTradeSummary,
  buildPhase1GlPreview,
  buildBuyPostPayload,
  buildSellPostPayload,
  generateDealNumber,
} from '../../utils/parsedTradePostPreview';
import './Styles/PostParsedTradeModal.css';

const formatMoney = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseSaveError = async (error) => {
  if (error?.message && !error.message.startsWith('HTTP error')) {
    return error.message;
  }
  return error?.message || 'Failed to post parsed trade.';
};

const PostParsedTradeModal = ({
  isOpen,
  onClose,
  transaction,
  equities,
  portfolios,
}) => {
  const side = (transaction?.buy_sell || '').toUpperCase() === 'B' ? 'buy' : 'sell';

  const [portfolioId, setPortfolioId] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [valuationMethod, setValuationMethod] = useState('');
  const [settlement, setSettlement] = useState({
    settlementAccount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    paymentMethod: '',
  });
  const [summary, setSummary] = useState(null);
  const [dealNumber, setDealNumber] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedPortfolio = useMemo(() => {
    return (portfolios || []).find(
      (p) => String(p.portfolioId || p.portfolio_id || p.id || '') === String(portfolioId || '')
    );
  }, [portfolios, portfolioId]);

  const portfolioName = selectedPortfolio
    ? (selectedPortfolio.portfolioName || selectedPortfolio.portfolio || selectedPortfolio.portfolio_name || selectedPortfolio.name || '')
    : '';

  const loadSettlementMapping = useCallback(async (name) => {
    if (!name) {
      setSettlement({
        settlementAccount: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        branchName: '',
        paymentMethod: '',
      });
      return;
    }

    try {
      const response = await portfolioSettlementMappingAPI.getAllMappings();
      let mappings = [];
      if (Array.isArray(response)) mappings = response;
      else if (response?.data) mappings = response.data;

      const mapping = mappings.find(
        (m) => String(m.portfolio_name || '').trim().toLowerCase() === String(name).trim().toLowerCase()
      );

      if (mapping) {
        setSettlement({
          settlementAccount: mapping.account_name && mapping.account_number
            ? `${mapping.account_name} - ${mapping.account_number}`
            : mapping.account_number || '',
          accountName: mapping.account_name || '',
          accountNumber: mapping.account_number || '',
          bankName: mapping.bank_name || '',
          branchName: mapping.branch_name || '',
          paymentMethod: mapping.payment_method || '',
        });
      }
    } catch (err) {
      console.error('Error loading settlement mapping:', err);
    }
  }, []);

  const loadValuationMethod = useCallback(async (id) => {
    if (!id) {
      setValuationMethod('');
      return;
    }
    try {
      const data = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
      const assigned = (data || []).find((a) => String(a.portfolioId) === String(id));
      setValuationMethod(assigned?.costing_method ? String(assigned.costing_method).toUpperCase() : '');
    } catch (err) {
      console.error('Error loading valuation method:', err);
      setValuationMethod('');
    }
  }, []);

  const enrichSellSummary = useCallback(async (baseSummary) => {
    if (!baseSummary || baseSummary.side !== 'sell' || !portfolioName || !baseSummary.companyName) {
      return baseSummary;
    }

    let boughtPrice = 0;
    if (valuationMethod === 'WAP') {
      const res = await transactionEntryAPI.getWAPByPortfolioAndCompany(portfolioName, baseSummary.companyName);
      boughtPrice = parseFloat(res?.wap) || 0;
    } else if (valuationMethod === 'FIFO') {
      const res = await transactionEntryAPI.getFifoCostByPortfolioAndCompany(
        portfolioName,
        baseSummary.companyName,
        baseSummary.quantity
      );
      boughtPrice = parseFloat(res?.fifoCost) || 0;
    }

    const costBasis = boughtPrice * baseSummary.quantity;
    const capitalGain = (baseSummary.price - boughtPrice) * baseSummary.quantity;

    return {
      ...baseSummary,
      boughtPrice,
      costBasis,
      capitalGain,
    };
  }, [portfolioName, valuationMethod]);

  const refreshPreview = useCallback(async () => {
    if (!transaction) return;
    setLoadingPreview(true);
    setErrorMessage('');
    try {
      let baseSummary = await buildParsedTradeSummary(transaction, equities, side);
      if (side === 'sell' && portfolioName) {
        baseSummary = await enrichSellSummary(baseSummary);
      }
      setSummary(baseSummary);
    } catch (err) {
      console.error('Error building preview:', err);
      setErrorMessage('Failed to load trade preview.');
    } finally {
      setLoadingPreview(false);
    }
  }, [transaction, equities, side, portfolioName, enrichSellSummary]);

  useEffect(() => {
    if (!isOpen || !transaction) return;

    setPortfolioId('');
    setBrokerName('');
    setValuationMethod('');
    setSettlement({
      settlementAccount: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      paymentMethod: '',
    });
    setErrorMessage('');

    let cancelled = false;

    const init = async () => {
      const deal = await generateDealNumber(side, transactionEntryAPI);
      if (cancelled) return;
      setDealNumber(deal);
      setLoadingPreview(true);
      try {
        const baseSummary = await buildParsedTradeSummary(transaction, equities, side);
        if (!cancelled) setSummary(baseSummary);
      } catch (err) {
        if (!cancelled) setErrorMessage('Failed to load trade preview.');
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [isOpen, transaction, side, equities]);

  useEffect(() => {
    if (!isOpen || !transaction || side !== 'sell' || !portfolioName) return;
    refreshPreview();
  }, [isOpen, transaction, side, portfolioName, valuationMethod, refreshPreview]);

  useEffect(() => {
    if (!isOpen || !portfolioId) return;
    loadSettlementMapping(portfolioName);
    loadValuationMethod(portfolioId);
  }, [isOpen, portfolioId, portfolioName, loadSettlementMapping, loadValuationMethod]);

  const glPreview = useMemo(() => buildPhase1GlPreview(summary), [summary]);

  const handlePortfolioChange = (event) => {
    setPortfolioId(event.target.value);
    setErrorMessage('');
  };

  const handlePost = async () => {
    if (!transaction || !summary) return;

    if (!portfolioId || !portfolioName) {
      setErrorMessage('Portfolio is required.');
      return;
    }
    if (!brokerName.trim()) {
      setErrorMessage('Broker is required.');
      return;
    }

    if (side === 'sell') {
      try {
        const res = await transactionEntryAPI.getTotalQuantity(portfolioName, summary.companyName);
        const available = parseFloat(res?.total_quantity || 0);
        if (summary.quantity > available) {
          setErrorMessage(`Insufficient holdings. Available: ${available}, requested: ${summary.quantity}.`);
          return;
        }
      } catch (err) {
        setErrorMessage('Could not verify portfolio holdings.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      let saved;
      let transactionId;
      if (side === 'buy') {
        const payload = buildBuyPostPayload({
          transaction,
          summary,
          dealNumber,
          portfolioName,
          portfolioId,
          brokerName: brokerName.trim(),
          settlement,
        });
        saved = await transactionEntryAPI.saveBuyTransaction(payload);
        transactionId = saved.transactionId || saved.id;
      } else {
        const payload = buildSellPostPayload({
          transaction,
          summary,
          dealNumber,
          portfolioName,
          portfolioId,
          brokerName: brokerName.trim(),
          settlement,
          valuationMethod,
        });
        saved = await transactionEntryAPI.saveSellTransaction(payload);
        transactionId = saved.id || saved.transactionId;
      }

      try {
        if (side === 'buy') {
          await transactionEntryAPI.postBuyTradeGl(transactionId);
        } else {
          await transactionEntryAPI.postSellTradeGl(transactionId);
        }
      } catch (glErr) {
        setErrorMessage(
          `Saved to portfolio (ID ${transactionId}), but Phase 1 GL posting failed: ${glErr.message || 'Unknown error'}. `
          + 'The trade will appear under Pending Settlement once GL is posted manually.'
        );
        onClose(true, saved);
        return;
      }

      onClose(true, saved);
    } catch (err) {
      console.error('Error posting parsed trade:', err);
      setErrorMessage(await parseSaveError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return createPortal(
    <div className="pptm-modal-overlay" onClick={() => !submitting && onClose(false)}>
      <div className="pptm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pptm-modal-header">
          <h2>Post Parsed Trade</h2>
          <button type="button" className="pptm-close-btn" onClick={() => !submitting && onClose(false)}>×</button>
        </div>

        <div className="pptm-modal-body">
          {errorMessage && <div className="pptm-error">{errorMessage}</div>}

          <div className="pptm-section pptm-section-inputs">
            <h3>Required inputs</h3>
            <div className="pptm-form-grid">
              <div className="pptm-field">
                <label htmlFor="pptm-portfolio">Portfolio *</label>
                <select
                  id="pptm-portfolio"
                  value={portfolioId}
                  onChange={handlePortfolioChange}
                  disabled={submitting}
                >
                  <option value="">Select portfolio</option>
                  {(portfolios || []).map((p) => {
                    const id = p.portfolioId || p.portfolio_id || p.id;
                    const name = p.portfolioName || p.portfolio || p.portfolio_name || p.name || id;
                    return (
                      <option key={id} value={id}>{name}</option>
                    );
                  })}
                </select>
              </div>
              <div className="pptm-field">
                <label htmlFor="pptm-broker">Broker *</label>
                <input
                  id="pptm-broker"
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  placeholder="Enter broker name"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {loadingPreview ? (
            <div className="pptm-loading">Loading trade preview...</div>
          ) : summary && (
            <>
              <div className="pptm-section pptm-section-card">
                <div className="pptm-section-head">
                  <h3>Trade summary</h3>
                  <span className={`pptm-side-badge pptm-side-badge-${side}`}>
                    {side === 'buy' ? 'BUY' : 'SELL'}
                  </span>
                </div>

                <div className="pptm-summary-grid">
                  <div className="pptm-summary-item pptm-summary-item-wide">
                    <span className="pptm-summary-label">Company / Symbol</span>
                    <span className="pptm-summary-value">{summary.companyName || summary.symbol}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Trade date</span>
                    <span className="pptm-summary-value">{summary.tradeDate || 'N/A'}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Settlement date</span>
                    <span className="pptm-summary-value">{summary.settlementDate || 'N/A'}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Quantity</span>
                    <span className="pptm-summary-value pptm-mono">{formatMoney(summary.quantity)}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Price</span>
                    <span className="pptm-summary-value pptm-mono">{formatMoney(summary.price)}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Gross value</span>
                    <span className="pptm-summary-value pptm-mono">{formatMoney(summary.grossValue)}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Net value</span>
                    <span className="pptm-summary-value pptm-mono pptm-highlight">{formatMoney(summary.netValue)}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Execution ID</span>
                    <span className="pptm-summary-value pptm-mono">{summary.executionId}</span>
                  </div>
                  <div className="pptm-summary-item">
                    <span className="pptm-summary-label">Settlement amount</span>
                    <span className="pptm-summary-value pptm-mono pptm-highlight">{formatMoney(summary.settlementAmount)}</span>
                  </div>
                  {side === 'sell' && (
                    <>
                      <div className="pptm-summary-item">
                        <span className="pptm-summary-label">Cost basis</span>
                        <span className="pptm-summary-value pptm-mono">{formatMoney(summary.costBasis)}</span>
                      </div>
                      <div className="pptm-summary-item">
                        <span className="pptm-summary-label">Capital gain / loss</span>
                        <span className={`pptm-summary-value pptm-mono ${summary.capitalGain >= 0 ? 'pptm-gain' : 'pptm-loss'}`}>
                          {formatMoney(summary.capitalGain)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pptm-fees-panel">
                  <div className="pptm-fees-title">Fees breakdown</div>
                  <div className="pptm-fees-grid">
                    <div className="pptm-fee-row"><span>Brokerage</span><span>{formatMoney(summary.brokerage)}</span></div>
                    <div className="pptm-fee-row"><span>CSE fees</span><span>{formatMoney(summary.cseFees)}</span></div>
                    <div className="pptm-fee-row"><span>CDS fees</span><span>{formatMoney(summary.cdsFees)}</span></div>
                    <div className="pptm-fee-row"><span>Clearing fees</span><span>{formatMoney(summary.clearingFees)}</span></div>
                    <div className="pptm-fee-row"><span>SEC</span><span>{formatMoney(summary.sec)}</span></div>
                    <div className="pptm-fee-row"><span>STL</span><span>{formatMoney(summary.stl)}</span></div>
                    <div className="pptm-fee-row pptm-fee-total"><span>Total fees</span><span>{formatMoney(summary.totalFees)}</span></div>
                  </div>
                </div>
              </div>

              <div className="pptm-section pptm-section-card pptm-section-gl">
                <h3>GL to be posted <span className="pptm-phase-tag">Phase 1 — trade date</span></h3>
                <div className="pptm-gl-table-wrap">
                  <table className="pptm-gl-table">
                    <thead>
                      <tr>
                        <th>Dr / Cr</th>
                        <th>Account</th>
                        <th>Description</th>
                        <th className="pptm-col-amount">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {glPreview.map((line, idx) => (
                        <tr key={`${line.account}-${idx}`}>
                          <td>
                            <span className={`pptm-dr-cr pptm-dr-cr-${line.direction.toLowerCase()}`}>
                              {line.direction}
                            </span>
                          </td>
                          <td className="pptm-account-code">{line.account}</td>
                          <td>{line.label}</td>
                          <td className="pptm-col-amount pptm-mono">{formatMoney(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pptm-note">
                  Bank GL (Phase 2) will post on settlement date ({summary.settlementDate || 'TBD'}) from Pending Settlement.
                  {settlement.settlementAccount && (
                    <> Settlement account: {settlement.settlementAccount}.</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pptm-modal-footer">
          <button type="button" className="pptm-btn pptm-btn-cancel" onClick={() => onClose(false)} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="pptm-btn pptm-btn-submit" onClick={handlePost} disabled={submitting || loadingPreview}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostParsedTradeModal;
