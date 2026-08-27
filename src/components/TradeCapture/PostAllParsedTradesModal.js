import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  transactionEntryAPI,
  portfolioSettlementMappingAPI,
  portfolioCostingMethodAPI,
} from '../../services/api';
import {
  buildParsedTradeSummary,
  buildBuyPostPayload,
  buildSellPostPayload,
  getNextDealSequences,
  formatDealNumber,
} from '../../utils/parsedTradePostPreview';
import { txTradeDateYmd } from '../../utils/tradeDateYmd';
import './Styles/PostParsedTradeModal.css';

const formatMoney = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const tradeSide = (row) => ((row?.buy_sell || '').toUpperCase() === 'B' ? 'buy' : 'sell');

const parseSaveError = async (error) => {
  if (error?.message && !error.message.startsWith('HTTP error')) {
    return error.message;
  }
  return error?.message || 'Failed to post parsed trade.';
};

const PostAllParsedTradesModal = ({
  isOpen,
  onClose,
  transactions,
  equities,
  portfolios,
}) => {
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
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [rowStatus, setRowStatus] = useState({});
  const [postedAny, setPostedAny] = useState(false);

  const rows = useMemo(() => {
    return [...(transactions || [])].sort((a, b) => {
      const dateA = txTradeDateYmd(a) || '';
      const dateB = txTradeDateYmd(b) || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [transactions]);

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

  useEffect(() => {
    if (!isOpen) return;
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
    setProgressLabel('');
    setPostedAny(false);
    setRowStatus(
      Object.fromEntries((transactions || []).map((row) => [row.id, { status: 'pending', message: '' }]))
    );
  }, [isOpen, transactions]);

  useEffect(() => {
    if (!isOpen || !portfolioId) return;
    loadSettlementMapping(portfolioName);
    loadValuationMethod(portfolioId);
  }, [isOpen, portfolioId, portfolioName, loadSettlementMapping, loadValuationMethod]);

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

    return {
      ...baseSummary,
      boughtPrice,
      costBasis: boughtPrice * baseSummary.quantity,
      capitalGain: (baseSummary.price - boughtPrice) * baseSummary.quantity,
    };
  }, [portfolioName, valuationMethod]);

  const handleClose = () => {
    if (submitting) return;
    onClose(postedAny);
  };

  const handlePostAll = async () => {
    if (!portfolioId || !portfolioName) {
      setErrorMessage('Portfolio is required.');
      return;
    }
    if (!brokerName.trim()) {
      setErrorMessage('Broker is required.');
      return;
    }
    if (rows.length === 0) {
      setErrorMessage('No parsed trades are pending post.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setProgressLabel(`Posting 0 of ${rows.length}...`);

    let successCount = 0;
    let failureCount = 0;
    const broker = brokerName.trim();

    try {
      const sequences = await getNextDealSequences(transactionEntryAPI);
      let { buySeq, sellSeq } = sequences;

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const side = tradeSide(row);
        setProgressLabel(`Posting ${index + 1} of ${rows.length}...`);
        setRowStatus((prev) => ({ ...prev, [row.id]: { status: 'posting', message: '' } }));

        try {
          let summary = await buildParsedTradeSummary(row, equities, side);
          if (side === 'sell') {
            summary = await enrichSellSummary(summary);
            const res = await transactionEntryAPI.getTotalQuantity(portfolioName, summary.companyName);
            const available = parseFloat(res?.total_quantity || 0);
            if (summary.quantity > available) {
              throw new Error(`Insufficient holdings. Available: ${available}, requested: ${summary.quantity}.`);
            }
          }

          const dealNumber = side === 'buy'
            ? formatDealNumber(sequences.buyPrefix, buySeq)
            : formatDealNumber(sequences.sellPrefix, sellSeq);

          let saved;
          let transactionId;
          if (side === 'buy') {
            saved = await transactionEntryAPI.saveBuyTransaction(buildBuyPostPayload({
              transaction: row,
              summary,
              dealNumber,
              portfolioName,
              portfolioId,
              brokerName: broker,
              settlement,
            }));
            transactionId = saved.transactionId || saved.id;
            buySeq += 1;
          } else {
            saved = await transactionEntryAPI.saveSellTransaction(buildSellPostPayload({
              transaction: row,
              summary,
              dealNumber,
              portfolioName,
              portfolioId,
              brokerName: broker,
              settlement,
              valuationMethod,
            }));
            transactionId = saved.id || saved.transactionId;
            sellSeq += 1;
          }

          try {
            if (side === 'buy') {
              await transactionEntryAPI.postBuyTradeGl(transactionId);
            } else {
              await transactionEntryAPI.postSellTradeGl(transactionId);
            }
          } catch (glErr) {
            successCount += 1;
            setPostedAny(true);
            setRowStatus((prev) => ({
              ...prev,
              [row.id]: {
                status: 'posted',
                message: `Saved, but GL posting failed: ${glErr.message || 'Unknown error'}`,
              },
            }));
            continue;
          }

          successCount += 1;
          setPostedAny(true);
          setRowStatus((prev) => ({ ...prev, [row.id]: { status: 'posted', message: '' } }));
        } catch (err) {
          failureCount += 1;
          setRowStatus((prev) => ({
            ...prev,
            [row.id]: { status: 'failed', message: err?.message || 'Failed to post.' },
          }));
        }
      }
    } catch (err) {
      setErrorMessage(await parseSaveError(err));
    } finally {
      setSubmitting(false);
      setProgressLabel('');
    }

    if (failureCount === 0 && successCount === rows.length) {
      onClose(true);
      return;
    }

    if (failureCount > 0) {
      setErrorMessage(`Posted ${successCount} of ${rows.length}. ${failureCount} failed — review the list below.`);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="pptm-modal-overlay" onClick={handleClose}>
      <div className="pptm-modal-content pptm-modal-content-bulk" onClick={(e) => e.stopPropagation()}>
        <div className="pptm-modal-header">
          <h2>Post All Entries</h2>
          <button type="button" className="pptm-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="pptm-modal-body">
          {errorMessage && <div className="pptm-error">{errorMessage}</div>}

          <div className="pptm-section pptm-section-inputs">
            <h3>Apply to all {rows.length} trade{rows.length === 1 ? '' : 's'}</h3>
            <div className="pptm-form-grid">
              <div className="pptm-field">
                <label htmlFor="pptm-all-portfolio">Portfolio *</label>
                <select
                  id="pptm-all-portfolio"
                  value={portfolioId}
                  onChange={(e) => {
                    setPortfolioId(e.target.value);
                    setErrorMessage('');
                  }}
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
                <label htmlFor="pptm-all-broker">Broker *</label>
                <input
                  id="pptm-all-broker"
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  placeholder="Enter broker name"
                  disabled={submitting}
                />
              </div>
            </div>
            {settlement.settlementAccount && (
              <div className="pptm-note pptm-note-inline">
                Settlement account: {settlement.settlementAccount}
              </div>
            )}
          </div>

          <div className="pptm-section pptm-section-card">
            <h3>Trades to post</h3>
            <div className="pptm-gl-table-wrap">
              <table className="pptm-gl-table pptm-bulk-table">
                <thead>
                  <tr>
                    <th>Buy/Sell</th>
                    <th>Company</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const side = tradeSide(row);
                    const status = rowStatus[row.id]?.status || 'pending';
                    const message = rowStatus[row.id]?.message || '';
                    return (
                      <tr key={row.id}>
                        <td>
                          <span className={`pptm-side-badge pptm-side-badge-${side}`}>
                            {side === 'buy' ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td>{row.company_id || row.symbol || 'N/A'}</td>
                        <td className="pptm-mono">{formatMoney(row.quantity)}</td>
                        <td className="pptm-mono">{formatMoney(row.price)}</td>
                        <td>
                          <span className={`pptm-bulk-status pptm-bulk-status-${status}`}>
                            {status === 'posting' ? 'Posting' : status === 'posted' ? 'Posted' : status === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                          {message && <div className="pptm-bulk-status-msg">{message}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pptm-modal-footer">
          {progressLabel && <span className="pptm-progress-label">{progressLabel}</span>}
          <button type="button" className="pptm-btn pptm-btn-cancel" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="pptm-btn pptm-btn-submit"
            onClick={handlePostAll}
            disabled={submitting || rows.length === 0}
          >
            {submitting ? 'Posting...' : `Post All (${rows.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostAllParsedTradesModal;
