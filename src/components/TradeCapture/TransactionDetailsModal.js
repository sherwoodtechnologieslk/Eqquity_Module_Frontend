import React, { useState, useEffect } from 'react';
import { transactionEntryAPI, tradeSummaryAPI } from '../../services/api';
import './Styles/TransactionDetailsModal.css';

const TransactionDetailsModal = ({ transaction, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (transaction) {
      const transactionType = transaction.type || (transaction.deal_number ? 'BUY' : 'SELL');
      const isBuyTransaction = transactionType === 'BUY';
      
      // Initialize form data from transaction
      setFormData({
        company_name: transaction.company_name || transaction.companyName || '',
        portfolio: transaction.portfolio || transaction.portfolio_name || transaction.portfolioName || '',
        deal_number: transaction.deal_number || transaction.contract_number || transaction.contractNumber || '',
        contract_number: transaction.contract_number || transaction.contractNumber || '',
        quantity: transaction.quantity || '',
        price: isBuyTransaction 
          ? (transaction.price || transaction.boughtPrice || '')
          : (transaction.sold_price || transaction.soldPrice || transaction.price || ''),
        gross_value: transaction.gross_value || transaction.grossValue || '',
        net_value: transaction.net_value || transaction.netValue || '',
        trade_date: transaction.trade_date || transaction.tradeDate || '',
        settlement_date: transaction.settlement_date || transaction.settlementDate || '',
        broker_name: transaction.broker_name || transaction.brokerName || '',
        brokerage: transaction.brokerage || transaction.brokerageFee || '',
        cds_fees: transaction.cds_fees || transaction.cdsFees || '',
        cse_fees: transaction.cse_fees || transaction.cseFees || '',
        clearing_fees: transaction.clearing_fees || transaction.clearingFees || '',
        sec: transaction.sec || transaction.secFee || '',
        stl: transaction.stl || transaction.stampDuty || '',
        money_generation_cost: transaction.money_generation_cost || transaction.moneyGenerationCost || '',
        capital_gain: transaction.capital_gain || transaction.capitalGain || ''
      });
    }
  }, [transaction]);

  if (!transaction) return null;

  const transactionType = transaction.type || (transaction.deal_number ? 'BUY' : 'SELL');
  const isBuy = transactionType === 'BUY';
  const transactionId = transaction.id;

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculatePricePerShare = () => {
    const netValue = parseFloat(formData.net_value || 0);
    const quantity = parseFloat(formData.quantity || 0);
    
    if (quantity === 0) return 0;
    return netValue / quantity;
  };

  const handleInputChange = async (field, value) => {
    const nextForm = {
      ...formData,
      [field]: value
    };

    setFormData(nextForm);
    setError('');
    setSuccess('');

    // Recalculate dependent amounts when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      try {
        if (isBuy) {
          const calc = await tradeSummaryAPI.calculateBuyTransaction({
            quantity: nextForm.quantity,
            price: nextForm.price,
            costOfFunds: transaction.cost_of_funds || transaction.costOfFunds || null
          });
          setFormData(prev => ({
            ...prev,
            gross_value: calc.grossValue,
            brokerage: calc.brokerage,
            cse_fees: calc.cseFees,
            cds_fees: calc.cdsFees,
            clearing_fees: calc.clearingFees,
            sec: calc.sec,
            stl: calc.stl,
            net_value: calc.netValue,
            money_generation_cost: calc.moneyGenerationCost ?? prev.money_generation_cost
          }));
        } else {
          const calc = await tradeSummaryAPI.calculateSellTransaction({
            quantity: nextForm.quantity,
            soldPrice: nextForm.price,
            costOfFunds: transaction.cost_of_funds || transaction.costOfFunds || null,
            holdingDays: transaction.hdays || transaction.holding_days || 0
          });
          setFormData(prev => ({
            ...prev,
            gross_value: calc.grossValue,
            brokerage: calc.brokerage,
            cse_fees: calc.cseFees,
            cds_fees: calc.cdsFees,
            clearing_fees: calc.clearingFees,
            sec: calc.sec,
            stl: calc.stl,
            net_value: calc.netValue,
            money_generation_cost: calc.moneyGenerationCost ?? prev.money_generation_cost
          }));
        }
      } catch (err) {
        // keep user input; surface error softly
        console.error('Recalc failed', err);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Saving transaction:', {
        transactionId,
        transactionType,
        isBuy,
        transaction: transaction
      });

      // Prepare the update data
      const updateData = {
        company_name: formData.company_name,
        portfolio: formData.portfolio,
        portfolioId: transaction.portfolioId || transaction.portfolio_id || '',
        contract_number: formData.contract_number,
        quantity: parseFloat(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        gross_value: parseFloat(formData.gross_value) || 0,
        net_value: parseFloat(formData.net_value) || 0,
        trade_date: formData.trade_date,
        settlement_date: formData.settlement_date,
        broker_name: formData.broker_name,
        // Preserve existing fields that aren't editable
        symbol: transaction.symbol || '',
        brokerage: parseFloat(formData.brokerage) || 0,
        cds_fees: parseFloat(formData.cds_fees) || 0,
        cse_fees: parseFloat(formData.cse_fees) || 0,
        clearing_fees: parseFloat(formData.clearing_fees) || 0,
        sec: parseFloat(formData.sec) || 0,
        stl: parseFloat(formData.stl) || 0,
        settlement_account: transaction.settlement_account || '',
        account_name: transaction.account_name || '',
        account_number: transaction.account_number || '',
        bank_name: transaction.bank_name || '',
        branch_name: transaction.branch_name || '',
        cash_flow_on_settlement: transaction.cash_flow_on_settlement || 0,
        payment_method: transaction.payment_method || ''
      };

      // Add type-specific fields
      if (isBuy) {
        updateData.money_generation_cost = parseFloat(formData.money_generation_cost) || 0;
        updateData.cost_of_funds = transaction.cost_of_funds || 0;
      } else {
        updateData.sold_price = parseFloat(formData.price) || 0;
        updateData.capital_gain = parseFloat(formData.capital_gain) || 0;
      }

      // Call the appropriate update API
      if (isBuy) {
        await transactionEntryAPI.updateBuyTransaction(transactionId, updateData);
      } else {
        await transactionEntryAPI.updateSellTransaction(transactionId, updateData);
      }

      setSuccess('Transaction updated successfully!');
      setIsEditing(false);
      
      // Call onSave callback to refresh the transaction list
      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset form data to original transaction values
    if (transaction) {
      const transactionType = transaction.type || (transaction.deal_number ? 'BUY' : 'SELL');
      const isBuyTransaction = transactionType === 'BUY';
      
      setFormData({
        company_name: transaction.company_name || transaction.companyName || '',
        portfolio: transaction.portfolio || transaction.portfolio_name || transaction.portfolioName || '',
        deal_number: transaction.deal_number || transaction.contract_number || transaction.contractNumber || '',
        contract_number: transaction.contract_number || transaction.contractNumber || '',
        quantity: transaction.quantity || '',
        price: isBuyTransaction 
          ? (transaction.price || transaction.boughtPrice || '')
          : (transaction.sold_price || transaction.soldPrice || transaction.price || ''),
        gross_value: transaction.gross_value || transaction.grossValue || '',
        net_value: transaction.net_value || transaction.netValue || '',
        trade_date: transaction.trade_date || transaction.tradeDate || '',
        settlement_date: transaction.settlement_date || transaction.settlementDate || '',
        broker_name: transaction.broker_name || transaction.brokerName || '',
        brokerage: transaction.brokerage || transaction.brokerageFee || '',
        cds_fees: transaction.cds_fees || transaction.cdsFees || '',
        cse_fees: transaction.cse_fees || transaction.cseFees || '',
        clearing_fees: transaction.clearing_fees || transaction.clearingFees || '',
        sec: transaction.sec || transaction.secFee || '',
        stl: transaction.stl || transaction.stampDuty || '',
        money_generation_cost: transaction.money_generation_cost || transaction.moneyGenerationCost || '',
        capital_gain: transaction.capital_gain || transaction.capitalGain || ''
      });
    }
  };

  const renderField = (label, fieldName, type = 'text', formatFn = null, readOnly = false) => {
    const value = formData[fieldName] || '';
    const displayValue = isEditing 
      ? (type === 'date' ? formatDateForInput(value) : value)
      : (formatFn ? formatFn(value) : (type === 'date' ? formatDate(value) : value));

    if (isEditing && !readOnly) {
      return (
        <div className="transaction-details-row">
          <span className="transaction-details-label">{label}:</span>
          <input
            type={type}
            className="transaction-details-input"
            value={displayValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={loading}
          />
        </div>
      );
    } else {
      return (
        <div className="transaction-details-row">
          <span className="transaction-details-label">{label}:</span>
          <span className="transaction-details-value">
            {displayValue || '-'}
          </span>
        </div>
      );
    }
  };

  const renderCurrencyField = (label, fieldName, highlightClass = '') => {
    if (isEditing) {
      return (
        <div className="transaction-details-row">
          <span className="transaction-details-label">{label}:</span>
          <input
            type="number"
            step="0.01"
            className="transaction-details-input"
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={loading}
          />
        </div>
      );
    } else {
      return (
        <div className="transaction-details-row">
          <span className="transaction-details-label">{label}:</span>
          <span className={`transaction-details-value ${highlightClass}`}>
            {formatCurrency(formData[fieldName])}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="transaction-details-overlay" onClick={!isEditing ? onClose : undefined}>
      <div className="transaction-details-modal" onClick={e => e.stopPropagation()}>
        <div className="transaction-details-header">
          <div className="transaction-details-title-section">
            <div className={`transaction-details-type-badge ${transactionType.toLowerCase()}`}>
              {transactionType}
            </div>
            <h2 className="transaction-details-title">
              {isEditing ? 'Edit Transaction' : 'Transaction Details'}
            </h2>
          </div>
          {!isEditing && (
            <button className="transaction-details-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="transaction-details-body">
          {error && (
            <div className="transaction-details-message error">
              {error}
            </div>
          )}
          {success && (
            <div className="transaction-details-message success">
              {success}
            </div>
          )}

          <div className="transaction-details-grid">
            {/* Basic Information */}
            <div className="transaction-details-section">
              <h3 className="transaction-details-section-title">Basic Information</h3>
              {renderField('Company Name', 'company_name')}
              {renderField('Portfolio', 'portfolio')}
              {renderField('Deal Number', 'deal_number', 'text', null, true)}
              {renderField('Contract Number', 'contract_number')}
            </div>

            {/* Trade Information */}
            <div className="transaction-details-section">
              <h3 className="transaction-details-section-title">Trade Information</h3>
              {renderCurrencyField('Quantity', 'quantity')}
              {renderCurrencyField('Price per Share', 'price')}
              {renderCurrencyField('Gross Value', 'gross_value')}
              {renderCurrencyField('Net Value', 'net_value', 'highlight')}
              {!isEditing && (
                <div className="transaction-details-row">
                  <span className="transaction-details-label">Average Price/Share:</span>
                  <span className="transaction-details-value highlight-purple">
                    {formatCurrency(calculatePricePerShare())}
                  </span>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="transaction-details-section">
              <h3 className="transaction-details-section-title">Dates</h3>
              {renderField('Trade Date', 'trade_date', 'date')}
              {renderField('Settlement Date', 'settlement_date', 'date')}
            </div>

            {/* Broker Information */}
            <div className="transaction-details-section">
              <h3 className="transaction-details-section-title">Broker Information</h3>
              {renderField('Broker Name', 'broker_name')}
            </div>

            {/* Fees */}
            <div className="transaction-details-section">
              <h3 className="transaction-details-section-title">Fees & Charges</h3>
              {renderCurrencyField('Brokerage', 'brokerage')}
              {renderCurrencyField('CDS Fees', 'cds_fees')}
              {renderCurrencyField('CSE Fees', 'cse_fees')}
              {renderCurrencyField('Clearing Fees', 'clearing_fees')}
              {renderCurrencyField('SEC', 'sec')}
              {renderCurrencyField('STL', 'stl')}
            </div>

            {/* Additional Information */}
            {isBuy && (
              <div className="transaction-details-section">
                <h3 className="transaction-details-section-title">Cost Information</h3>
                {renderCurrencyField('Money Generation Cost (Daily)', 'money_generation_cost', 'highlight-green')}
              </div>
            )}

            {!isBuy && (
              <div className="transaction-details-section">
                <h3 className="transaction-details-section-title">Gain/Loss Information</h3>
                {renderCurrencyField('Capital Gain', 'capital_gain', 
                  parseFloat(formData.capital_gain || 0) >= 0 ? 'highlight-green' : 'highlight-red')}
              </div>
            )}
          </div>
        </div>

        <div className="transaction-details-footer">
          {isEditing ? (
            <>
              <button 
                className="transaction-details-cancel-btn" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="transaction-details-save-btn" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button 
                className="transaction-details-edit-btn" 
                onClick={() => setIsEditing(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Transaction
              </button>
              <button className="transaction-details-close-btn" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
