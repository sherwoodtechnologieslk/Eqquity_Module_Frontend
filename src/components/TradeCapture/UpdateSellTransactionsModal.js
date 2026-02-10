import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { transactionEntryAPI, tradeSummaryAPI, accountAPI, portfolioSettlementMappingAPI, portfolioCostingMethodAPI, parsedTradeTransactionAPI } from '../../services/api';
import './Styles/UpdateSellTransactionsModal.css';

// Helper: extract numeric sequence from SELL deal number
const extractSequenceFromSellDealNumber = (dealNumber) => {
  const match = dealNumber && dealNumber.match(/SELL-\d{8}-(\d{6})$/);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper: generate unique SELL deal numbers for today
const generateSellDealNumbers = async (count, transactionEntryAPI) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `SELL-${year}${month}${day}-`;

  let startSequence = 1;

  try {
    const existingTransactions = await transactionEntryAPI.getAllSellTransactions();

    const todayTransactions = (existingTransactions || []).filter(t => {
      if (!t.deal_number) return false;
      return t.deal_number.startsWith(datePrefix);
    });

    if (todayTransactions.length > 0) {
      const maxSequence = Math.max(
        ...todayTransactions.map(t => extractSequenceFromSellDealNumber(t.deal_number))
      );
      startSequence = maxSequence + 1;
    }
  } catch (error) {
    console.log('Could not fetch existing sell transactions, starting from 1:', error);
  }

  const dealNumbers = [];
  for (let i = 0; i < count; i++) {
    const sequence = String(startSequence + i).padStart(6, '0');
    dealNumbers.push(`${datePrefix}${sequence}`);
  }

  return dealNumbers;
};

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return String(dateString).split('T')[0].replace(/\//g, '-');
};

const UpdateSellTransactionsModal = ({
  isOpen,
  onClose,
  sellTransactions,
  equities,
  portfolios,
  latestTradeDate
}) => {
  const [transactionForms, setTransactionForms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Global apply-to-all fields
  const [globalPortfolio, setGlobalPortfolio] = useState('');
  const [globalPortfolioId, setGlobalPortfolioId] = useState('');
  const [globalBrokerName, setGlobalBrokerName] = useState('');
  const [globalSettlementAccount, setGlobalSettlementAccount] = useState('');
  const [globalAccountName, setGlobalAccountName] = useState('');
  const [globalAccountNumber, setGlobalAccountNumber] = useState('');
  const [globalBankName, setGlobalBankName] = useState('');
  const [globalBranchName, setGlobalBranchName] = useState('');
  const [globalPaymentMethod, setGlobalPaymentMethod] = useState('');
  const [accounts, setAccounts] = useState([]);

  const [valuationMethod, setValuationMethod] = useState(''); // WAP / FIFO from portfolio

  const logSaveStatus = async ({ parsedTradeTransactionId, status, reason, dealNumber }) => {
    if (!parsedTradeTransactionId) return;
    try {
      await parsedTradeTransactionAPI.createSaveLog({
        parsed_trade_transaction_id: parsedTradeTransactionId,
        target_table: 'sell_transaction_entries',
        deal_number: dealNumber || null,
        status,
        reason
      });
    } catch (err) {
      console.error('Error logging parsed trade save status:', err);
    }
  };

  // Clear messages on open
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const initializeForms = useCallback(async () => {
    if (!sellTransactions || sellTransactions.length === 0) {
      setTransactionForms([]);
      return;
    }

    // Generate deal numbers up-front
    const dealNumbers = await generateSellDealNumbers(sellTransactions.length, transactionEntryAPI);

    const forms = await Promise.all(
      sellTransactions.map(async (transaction, index) => {
        // Symbol: company_id.main_typesub_type
        const symbol = `${transaction.company_id || ''}.${transaction.main_type || ''}${transaction.sub_type || ''}`;

        const equity = equities.find(e => e.symbol === symbol);
        const companyName = equity ? equity.name : '';

        const quantity = parseFloat(transaction.quantity) || 0;
        const soldPrice = parseFloat(transaction.price) || 0;
        const baseGross = quantity * soldPrice;

        let grossValue = baseGross;
        let brokerage = 0;
        let cseFees = 0;
        let cdsFees = 0;
        let clearingFees = 0;
        let sec = 0;
        let stl = 0;
        let netValue = 0;

        try {
          const calc = await tradeSummaryAPI.calculateSellTransaction({
            quantity,
            soldPrice,
            costOfFunds: null,
            holdingDays: 0
          });

          if (calc) {
            grossValue = parseFloat(calc.grossValue) || baseGross;
            brokerage = parseFloat(calc.brokerage) || 0;
            cseFees = parseFloat(calc.cseFees) || 0;
            cdsFees = parseFloat(calc.cdsFees) || 0;
            clearingFees = parseFloat(calc.clearingFees) || 0;
            sec = parseFloat(calc.sec) || 0;
            stl = parseFloat(calc.stl) || 0;
            netValue = parseFloat(calc.netValue) || 0;
          } else {
            netValue = grossValue - brokerage - cseFees - cdsFees - clearingFees - sec - stl;
          }
        } catch (err) {
          console.error('Error calculating sell transaction for modal:', err);
          netValue = grossValue - brokerage - cseFees - cdsFees - clearingFees - sec - stl;
        }

        return {
          id: transaction.id || index,
          raw: transaction,
          companyName,
          symbol,
          quantity,
          soldPrice,
          boughtPrice: 0, // will be filled from WAP/FIFO later
          grossValue,
          brokerage,
          cseFees,
          cdsFees,
          clearingFees,
          sec,
          stl,
          netValue,
          tradeDate: formatDateForInput(transaction.trade_date),
          settlementDate: formatDateForInput(transaction.settlement_date),
          dealNumber: dealNumbers[index],
          contractNumber: transaction.execution_id || '',
          portfolio: '',
          portfolioId: '',
          brokerName: '',
          settlementAccount: '',
          accountName: '',
          accountNumber: '',
          bankName: '',
          branchName: '',
          paymentMethod: '',
          description: companyName ? `Sale ${companyName} shares` : 'Sale shares',
          capitalGain: 0
        };
      })
    );

    setTransactionForms(forms);
  }, [sellTransactions, equities]);

  // Load accounts once
  useEffect(() => {
    if (!isOpen) return;

    const loadAccounts = async () => {
      try {
        const data = await accountAPI.getAllAccounts();
        setAccounts(data || []);
      } catch (err) {
        console.error('Error fetching accounts for sell modal:', err);
        setAccounts([]);
      }
    };

    loadAccounts();
  }, [isOpen]);

  // Initialize forms when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      initializeForms();
    }
  }, [isOpen, initializeForms]);

  const handleFieldChange = (index, field, value) => {
    setTransactionForms(prev =>
      prev.map((form, i) =>
        i === index ? { ...form, [field]: value } : form
      )
    );

    // Clear per-row field error
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[index] && newErrors[index][field]) {
        newErrors[index] = { ...newErrors[index], [field]: '' };
      }
      return newErrors;
    });
  };

  const handleGlobalPortfolioChange = (selectedPortfolioId) => {
    const selected = portfolios.find(p =>
      String(p.portfolioId || p.portfolio_id || p.id || '') === String(selectedPortfolioId || '')
    );
    const portfolioName =
      selected?.portfolioName ||
      selected?.portfolio ||
      selected?.portfolio_name ||
      selected?.name ||
      '';
    const portfolioId =
      selected?.portfolioId ||
      selected?.portfolio_id ||
      selected?.id ||
      '';

    setGlobalPortfolio(portfolioName);
    setGlobalPortfolioId(portfolioId);

    // Fetch costing method for this portfolio
    if (portfolioId) {
      portfolioCostingMethodAPI.getAllAssignedCostingMethods()
        .then(data => {
          const assigned = (data || []).find(a => String(a.portfolioId) === String(portfolioId));
          if (assigned && assigned.costing_method) {
            setValuationMethod(String(assigned.costing_method).toUpperCase());
          } else {
            setValuationMethod('');
          }
        })
        .catch(err => {
          console.error('Error fetching costing methods for sell modal:', err);
          setValuationMethod('');
        });
    } else {
      setValuationMethod('');
    }

    // Apply portfolio to all forms
    setTransactionForms(prev =>
      prev.map(form => ({
        ...form,
        portfolio: portfolioName,
        portfolioId
      }))
    );
  };

  const handleGlobalFieldChange = (field, value) => {
    if (field === 'portfolio') {
      handleGlobalPortfolioChange(value);
      return;
    }

    if (field === 'brokerName') {
      setGlobalBrokerName(value);
      setTransactionForms(prev => prev.map(form => ({ ...form, brokerName: value })));
      return;
    }

    if (field === 'settlementAccount' ||
        field === 'accountName' ||
        field === 'accountNumber' ||
        field === 'bankName' ||
        field === 'branchName' ||
        field === 'paymentMethod') {
      const setters = {
        settlementAccount: setGlobalSettlementAccount,
        accountName: setGlobalAccountName,
        accountNumber: setGlobalAccountNumber,
        bankName: setGlobalBankName,
        branchName: setGlobalBranchName,
        paymentMethod: setGlobalPaymentMethod
      };

      setters[field](value);

      setTransactionForms(prev =>
        prev.map(form => ({
          ...form,
          [field]: value
        }))
      );
    }
  };

  const handleAccountSelect = (event) => {
    const selectedValue = event.target.value;
    if (!selectedValue) {
      handleGlobalFieldChange('settlementAccount', '');
      handleGlobalFieldChange('accountName', '');
      handleGlobalFieldChange('accountNumber', '');
      handleGlobalFieldChange('bankName', '');
      handleGlobalFieldChange('branchName', '');
      return;
    }

    const account = accounts.find(
      acc => `${acc.account_name} - ${acc.account_number}` === selectedValue
    );

    if (account) {
      handleGlobalFieldChange(
        'settlementAccount',
        `${account.account_name} - ${account.account_number}`
      );
      handleGlobalFieldChange('accountName', account.account_name || '');
      handleGlobalFieldChange('accountNumber', account.account_number || '');
      handleGlobalFieldChange('bankName', account.bank_name || '');
      handleGlobalFieldChange('branchName', account.branch_name || '');
    }
  };

  const fetchPortfolioSettlementMapping = async (portfolioName) => {
    if (!portfolioName) return;

    try {
      const response = await portfolioSettlementMappingAPI.getAllMappings();
      let mappings = [];
      if (Array.isArray(response)) {
        mappings = response;
      } else if (response && Array.isArray(response.data)) {
        mappings = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        mappings = response.data;
      }

      const mapping = mappings.find(m => {
        const mappingPortfolioName = String(m.portfolio_name || '').trim();
        const searchPortfolioName = String(portfolioName || '').trim();
        return mappingPortfolioName.toLowerCase() === searchPortfolioName.toLowerCase();
      });

      if (mapping && mapping.account_id) {
        const bankAccountData = {
          settlementAccount: mapping.account_name && mapping.account_number
            ? `${mapping.account_name} - ${mapping.account_number}`
            : mapping.account_number || '',
          accountName: mapping.account_name || '',
          accountNumber: mapping.account_number || '',
          bankName: mapping.bank_name || '',
          branchName: mapping.branch_name || '',
          paymentMethod: mapping.payment_method || ''
        };

        handleGlobalFieldChange('settlementAccount', bankAccountData.settlementAccount);
        handleGlobalFieldChange('accountName', bankAccountData.accountName);
        handleGlobalFieldChange('accountNumber', bankAccountData.accountNumber);
        handleGlobalFieldChange('bankName', bankAccountData.bankName);
        handleGlobalFieldChange('branchName', bankAccountData.branchName);
        handleGlobalFieldChange('paymentMethod', bankAccountData.paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching portfolio settlement mapping for sell modal:', error);
    }
  };

  const handleSubmit = async () => {
    if (!transactionForms || transactionForms.length === 0) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    setErrors({});

    try {
      // Basic validation first
      if (!globalPortfolio) {
        setErrorMessage('Portfolio is required');
        setIsSubmitting(false);
        return;
      }

      // Validate each transaction individually and check holdings
      const validTransactions = [];
      const skippedTransactions = [];
      const newErrors = {};

      for (let i = 0; i < transactionForms.length; i++) {
        const form = transactionForms[i];
        const rowErrors = {};

        // Basic validation
        if (!form.description || !form.description.trim()) {
          rowErrors.description = 'Description is required';
        }
        if (!form.companyName) {
          rowErrors.companyName = 'Company name is required';
        }
        if (!form.quantity || form.quantity <= 0) {
          rowErrors.quantity = 'Quantity must be greater than 0';
        }
        if (!form.soldPrice || form.soldPrice <= 0) {
          rowErrors.soldPrice = 'Sold price must be greater than 0';
        }

        // Holdings validation
        let hasInsufficientHoldings = false;
        if (!rowErrors.quantity && form.companyName) {
          try {
            const res = await transactionEntryAPI.getTotalQuantity(globalPortfolio, form.companyName);
            const totalAvailable = parseFloat(res.total_quantity || 0);
            const sellQty = parseFloat(form.quantity || 0);
            if (!isNaN(sellQty) && sellQty > totalAvailable) {
              rowErrors.quantity = `Quantity cannot exceed available shares (${totalAvailable})`;
              hasInsufficientHoldings = true;
            }
          } catch (err) {
            console.error('Error validating holdings:', err);
            rowErrors.quantity = 'Error checking available holdings';
          }
        }

        if (Object.keys(rowErrors).length > 0) {
          newErrors[i] = rowErrors;
          const reasonDetails = Object.values(rowErrors).filter(Boolean).join(', ') ||
            (hasInsufficientHoldings ? 'Insufficient holdings' : 'Validation error');
          skippedTransactions.push({
            index: i,
            companyName: form.companyName,
            reason: reasonDetails,
            parsedTradeTransactionId: form.raw?.id,
            dealNumber: form.dealNumber
          });
        } else {
          validTransactions.push({ index: i, form });
        }
      }

      setErrors(newErrors);

      if (skippedTransactions.length > 0) {
        await Promise.all(
          skippedTransactions.map(item =>
            logSaveStatus({
              parsedTradeTransactionId: item.parsedTradeTransactionId,
              status: 'skipped',
              reason: item.reason,
              dealNumber: item.dealNumber
            })
          )
        );
      }

      // If no valid transactions, show detailed error and return
      if (validTransactions.length === 0) {
        const errorDetails = skippedTransactions.map(t => {
          const form = transactionForms[t.index];
          const errors = newErrors[t.index] || {};
          const errorReasons = [];
          
          if (errors.description) errorReasons.push('missing description');
          if (errors.companyName) errorReasons.push('missing company name');
          if (errors.quantity) errorReasons.push(errors.quantity.toLowerCase());
          if (errors.soldPrice) errorReasons.push('invalid sold price');
          
          const reasonText = errorReasons.length > 0 
            ? errorReasons.join(', ') 
            : 'validation error';
          
          return `${form.companyName || 'Unknown'}: ${reasonText}`;
        });
        
        const errorMessage = `Cannot save any transactions:\n\n${errorDetails.join('\n')}`;
        setErrorMessage(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Process and save only valid transactions
      const enhancedForms = [];

      for (const { form } of validTransactions) {
        let boughtPrice = form.boughtPrice || 0;
        if (valuationMethod && form.companyName && form.quantity) {
          try {
            if (valuationMethod.toUpperCase() === 'WAP') {
              const res = await transactionEntryAPI.getWAPByPortfolioAndCompany(globalPortfolio, form.companyName);
              if (res && res.wap) {
                boughtPrice = parseFloat(res.wap) || 0;
              }
            } else if (valuationMethod.toUpperCase() === 'FIFO') {
              const res = await transactionEntryAPI.getFifoCostByPortfolioAndCompany(
                globalPortfolio,
                form.companyName,
                form.quantity
              );
              if (res && res.fifoCost) {
                boughtPrice = parseFloat(res.fifoCost) || 0;
              }
            }
          } catch (err) {
            console.error('Error calculating bought price for sell modal:', err);
          }
        }

        const capitalGain =
          (parseFloat(form.soldPrice || 0) - parseFloat(boughtPrice || 0)) *
          parseFloat(form.quantity || 0);

        enhancedForms.push({
          ...form,
          boughtPrice,
          capitalGain
        });
      }

      const savePromises = enhancedForms.map(form => {
        const resolvedPortfolio = form.portfolio || globalPortfolio || '';
        const resolvedPortfolioId = form.portfolioId || globalPortfolioId || '';
        console.log('🧾 [SELL SAVE UI] Portfolio payload:', {
          portfolio: resolvedPortfolio,
          portfolioId: resolvedPortfolioId
        });
        const transactionData = {
            parsed_trade_transaction_id: form.raw?.id,
          company_name: form.companyName,
          symbol: form.symbol,
          portfolio_name: resolvedPortfolio,
          portfolio: resolvedPortfolio,
          portfolioId: resolvedPortfolioId,
          portfolio_id: resolvedPortfolioId,
          valuation_method: valuationMethod || '',
          deal_number: form.dealNumber,
          contract_number: form.contractNumber,
          quantity: parseFloat(form.quantity) || 0,
          sold_price: parseFloat(form.soldPrice) || 0,
          bought_price: parseFloat(form.boughtPrice) || 0,
          trade_date: form.tradeDate,
          settlement_date: form.settlementDate,
          broker_name: form.brokerName || globalBrokerName || '',
          settlement_account: form.settlementAccount || globalSettlementAccount || '',
          account_name: form.accountName || globalAccountName || '',
          account_number: form.accountNumber || globalAccountNumber || '',
          bank_name: form.bankName || globalBankName || '',
          branch_name: form.branchName || globalBranchName || '',
          gross_value: parseFloat(form.grossValue) || 0,
          brokerage: parseFloat(form.brokerage) || 0,
          cse_fees: parseFloat(form.cseFees) || 0,
          cds_fees: parseFloat(form.cdsFees) || 0,
          clearing_fees: parseFloat(form.clearingFees) || 0,
          sec: parseFloat(form.sec) || 0,
          stl: parseFloat(form.stl) || 0,
          net_value: parseFloat(form.netValue) || 0,
          capital_gain: parseFloat(form.capitalGain) || 0,
          description: form.description || '',
          payment_method: form.paymentMethod || globalPaymentMethod || ''
        };

        return transactionEntryAPI.saveSellTransaction(transactionData).catch(async (error) => {
          await logSaveStatus({
            parsedTradeTransactionId: form.raw?.id,
            status: 'failed',
            reason: error.message || 'API error',
            dealNumber: form.dealNumber
          });
          throw error;
        });
      });

      await Promise.all(savePromises);

      // Build success message with details
      const savedCompanies = [...new Set(validTransactions.map(t => t.form.companyName))];
      const skippedCompanies = [...new Set(skippedTransactions.map(t => t.companyName))];

      let message = '';
      if (savedCompanies.length > 0) {
        message = `Saved transactions for: ${savedCompanies.join(', ')}.`;
      }
      if (skippedCompanies.length > 0) {
        message += ` Skipped: ${skippedCompanies.join(', ')} (${skippedTransactions[0].reason}).`;
      }

      setSuccessMessage(message || 'All sell transactions saved successfully!');
      setErrorMessage('');

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving sell transactions from modal:', error);
      const message = error?.message?.includes('409')
        ? 'Duplicate entries detected. These transactions were already saved.'
        : 'Error saving sell transactions. Please try again.';
      setErrorMessage(message);
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="ustm-modal-overlay" onClick={onClose}>
      <div className="ustm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ustm-modal-header">
          <h2>Update Sell Transactions</h2>
          <button className="ustm-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ustm-modal-body">
          {successMessage && (
            <div className="ustm-message ustm-message-success">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="ustm-message ustm-message-error">
              {errorMessage}
            </div>
          )}

          <div className="ustm-global-section">
            <h3>Apply to All Transactions</h3>
            <div className="ustm-form-grid">
              <div className="ustm-form-group">
                <label>Portfolio *</label>
                <select
                  value={globalPortfolioId}
                  onChange={(e) => {
                    handleGlobalPortfolioChange(e.target.value);
                    const selected = portfolios.find(p =>
                      String(p.portfolioId || p.portfolio_id || p.id || '') === String(e.target.value || '')
                    );
                    const portfolioName =
                      selected?.portfolioName ||
                      selected?.portfolio ||
                      selected?.portfolio_name ||
                      selected?.name ||
                      '';
                    fetchPortfolioSettlementMapping(portfolioName);
                  }}
                  className={`ustm-input ${errors.globalPortfolio ? 'ustm-input-error' : ''}`}
                >
                  <option value="">Select Portfolio</option>
                  {portfolios.map(p => {
                    const optionValue = p.portfolioId || p.portfolio_id || p.id;
                    const optionLabel = p.portfolioName || p.portfolio || p.portfolio_name || p.name;
                    return (
                      <option key={optionValue} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
                {errors.globalPortfolio && (
                  <span className="ustm-error-text">{errors.globalPortfolio}</span>
                )}
                {valuationMethod && (
                  <small className="ustm-field-note">
                    Costing Method: {valuationMethod}
                  </small>
                )}
              </div>
              <div className="ustm-form-group">
                <label>Portfolio ID</label>
                <input
                  type="text"
                  value={globalPortfolioId}
                  readOnly
                  className="ustm-input ustm-readonly"
                />
              </div>

              <div className="ustm-form-group">
                <label>Broker Name</label>
                <input
                  type="text"
                  value={globalBrokerName}
                  onChange={(e) => handleGlobalFieldChange('brokerName', e.target.value)}
                  className="ustm-input"
                  placeholder="Broker name"
                />
              </div>

              <div className="ustm-form-group ustm-full-width">
                <label>Settlement Account</label>
                <select
                  value={globalSettlementAccount}
                  onChange={handleAccountSelect}
                  className="ustm-input"
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option
                      key={acc.id}
                      value={`${acc.account_name} - ${acc.account_number}`}
                    >
                      {acc.account_name} - {acc.account_number} ({acc.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ustm-form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={globalAccountName}
                  onChange={(e) => handleGlobalFieldChange('accountName', e.target.value)}
                  className="ustm-input"
                />
              </div>
              <div className="ustm-form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={globalAccountNumber}
                  onChange={(e) => handleGlobalFieldChange('accountNumber', e.target.value)}
                  className="ustm-input"
                />
              </div>
              <div className="ustm-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={globalBankName}
                  onChange={(e) => handleGlobalFieldChange('bankName', e.target.value)}
                  className="ustm-input"
                />
              </div>
              <div className="ustm-form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  value={globalBranchName}
                  onChange={(e) => handleGlobalFieldChange('branchName', e.target.value)}
                  className="ustm-input"
                />
              </div>
              <div className="ustm-form-group">
                <label>Payment Method</label>
                <input
                  type="text"
                  value={globalPaymentMethod}
                  onChange={(e) => handleGlobalFieldChange('paymentMethod', e.target.value)}
                  className="ustm-input"
                />
              </div>
            </div>
          </div>

          {!transactionForms.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              No sell transactions available for the latest trade date.
            </div>
          ) : (
            <div className="ustm-transactions-list">
              {transactionForms.map((form, index) => (
                <div key={form.id || index} className="ustm-transaction-form">
                  <h3>Sell Transaction {index + 1}</h3>
                  <div className="ustm-form-grid">
                    <div className="ustm-form-group">
                      <label>Company</label>
                      <input
                        type="text"
                        value={form.companyName}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Symbol</label>
                      <input
                        type="text"
                        value={form.symbol}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={form.quantity}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Sold Price</label>
                      <input
                        type="number"
                        value={form.soldPrice}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Gross Value</label>
                      <input
                        type="number"
                        value={form.grossValue}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Brokerage</label>
                      <input
                        type="number"
                        value={form.brokerage}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>CSE Fees</label>
                      <input
                        type="number"
                        value={form.cseFees}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>CDS Fees</label>
                      <input
                        type="number"
                        value={form.cdsFees}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Clearing Fees</label>
                      <input
                        type="number"
                        value={form.clearingFees}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>SEC</label>
                      <input
                        type="number"
                        value={form.sec}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>STL</label>
                      <input
                        type="number"
                        value={form.stl}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Net Value</label>
                      <input
                        type="number"
                        value={form.netValue}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Deal Number</label>
                      <input
                        type="text"
                        value={form.dealNumber}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Contract Number</label>
                      <input
                        type="text"
                        value={form.contractNumber}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Trade Date</label>
                      <input
                        type="date"
                        value={form.tradeDate}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group">
                      <label>Settlement Date</label>
                      <input
                        type="date"
                        value={form.settlementDate}
                        readOnly
                        className="ustm-input ustm-readonly"
                      />
                    </div>
                    <div className="ustm-form-group ustm-full-width">
                      <label>Description</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) =>
                          handleFieldChange(index, 'description', e.target.value)
                        }
                        className={`ustm-input ${
                          errors[index] && errors[index].description ? 'ustm-input-error' : ''
                        }`}
                      />
                      {errors[index] && errors[index].description && (
                        <span className="ustm-error-text">
                          {errors[index].description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ustm-modal-footer">
          <button className="ustm-btn ustm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ustm-btn ustm-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || transactionForms.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Update Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default UpdateSellTransactionsModal;


