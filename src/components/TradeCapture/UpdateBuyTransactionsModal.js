import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { transactionEntryAPI, tradeSummaryAPI, accountAPI, portfolioSettlementMappingAPI, parsedTradeTransactionAPI } from '../../services/api';
import './Styles/UpdateBuyTransactionsModal.css';

// Helper function to extract sequence from deal number
const extractSequenceFromDealNumber = (dealNumber) => {
  const match = dealNumber.match(/-(\d{6})$/);
  return match ? parseInt(match[1], 10) : 0;
};

// Generate unique deal numbers by checking existing transactions
const generateDealNumbers = async (count, transactionEntryAPI) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `BUY-${year}${month}${day}-`;
  
  let startSequence = 1;
  
  try {
    // Fetch existing buy transactions to find the max sequence
    const existingTransactions = await transactionEntryAPI.getAllBuyTransactions();
    
    // Filter transactions for today and extract sequence numbers
    const todayTransactions = (existingTransactions || []).filter(t => {
      if (!t.deal_number) return false;
      return t.deal_number.startsWith(datePrefix);
    });
    
    if (todayTransactions.length > 0) {
      const maxSequence = Math.max(
        ...todayTransactions.map(t => extractSequenceFromDealNumber(t.deal_number))
      );
      startSequence = maxSequence + 1;
    }
  } catch (error) {
    console.log('Could not fetch existing transactions, starting from 1:', error);
  }
  
  // Generate unique deal numbers for all transactions
  const dealNumbers = [];
  for (let i = 0; i < count; i++) {
    const sequence = String(startSequence + i).padStart(6, '0');
    dealNumbers.push(`${datePrefix}${sequence}`);
  }
  
  return dealNumbers;
};

const UpdateBuyTransactionsModal = ({ 
  isOpen, 
  onClose, 
  purchaseTransactions, 
  equities, 
  portfolios,
  latestTradeDate 
}) => {
  const [transactionForms, setTransactionForms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  const logSaveStatus = async ({ parsedTradeTransactionId, status, reason, dealNumber }) => {
    if (!parsedTradeTransactionId) return;
    try {
      await parsedTradeTransactionAPI.createSaveLog({
        parsed_trade_transaction_id: parsedTradeTransactionId,
        target_table: 'transaction_entries',
        deal_number: dealNumber || null,
        status,
        reason
      });
    } catch (err) {
      console.error('Error logging parsed trade save status:', err);
    }
  };

  const calculateFeesFallback = (grossValue) => {
    let brokerage, stl;

    if (grossValue <= 100000000) {
      brokerage = Math.round(grossValue * 0.00640 * 100) / 100; // 0.640%
      stl = Math.round(grossValue * 0.003 * 100) / 100; // 0.300%
    } else {
      const first100M = 100000000;
      const excess = grossValue - 100000000;
      const first100MBrokerage = Math.round(first100M * 0.00640 * 100) / 100;
      const first100MSTL = Math.round(first100M * 0.003 * 100) / 100;
      const excessBrokerage = Math.round(excess * 0.00200 * 100) / 100;
      const excessSTL = Math.round(excess * 0.003 * 100) / 100;
      brokerage = first100MBrokerage + excessBrokerage;
      stl = first100MSTL + excessSTL;
    }

    return { brokerage, stl };
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const normalized = dateString.split('T')[0].replace(/\//g, '-');
    return normalized;
  };

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const initializeForms = useCallback(async () => {
    // Generate unique deal numbers for all transactions first
    const dealNumbers = await generateDealNumbers(purchaseTransactions.length, transactionEntryAPI);
    
    const forms = await Promise.all(purchaseTransactions.map(async (transaction, index) => {
      // Build symbol: company_id.main_typesub_type (dot between company_id and main_type, no dot between main_type and sub_type)
      const symbol = `${transaction.company_id || ''}.${transaction.main_type || ''}${transaction.sub_type || ''}`;
      
      // Find company name from equities
      const equity = equities.find(e => e.symbol === symbol);
      const companyName = equity ? equity.name : '';

      // Calculate values
      const quantity = parseFloat(transaction.quantity) || 0;
      const price = parseFloat(transaction.price) || 0;
      const baseGrossValue = quantity * price;

      let calc = null;
      let grossValue = baseGrossValue;
      let brokerage = 0;
      let cdsFees = 0;
      let cseFees = 0;
      let clearingFees = 0;
      let secCess = 0;
      let stl = 0;
      let netValue = 0;

      try {
        const response = await tradeSummaryAPI.calculateBuyTransaction({
          quantity,
          price,
          costOfFunds: null
        });
        calc = response;
      } catch (err) {
        console.warn('Fee calc failed, using fallback values:', err);
      }

      if (calc) {
        grossValue = parseFloat(calc.grossValue) || baseGrossValue;
        brokerage = parseFloat(calc.brokerage) || 0;
        cdsFees = parseFloat(calc.cdsFees) || 0;
        cseFees = parseFloat(calc.cseFees) || 0;
        clearingFees = parseFloat(calc.clearingFees) || 0;
        secCess = parseFloat(calc.sec) || 0;
        stl = parseFloat(calc.stl) || 0;
        netValue = parseFloat(calc.netValue) || 0;
      } else {
        const fallbackFees = calculateFeesFallback(baseGrossValue);
        grossValue = baseGrossValue;
        brokerage = fallbackFees.brokerage;
        stl = fallbackFees.stl;
        cdsFees = parseFloat(transaction.cds_fees) || 0;
        cseFees = parseFloat(transaction.cse_fees) || 0;
        clearingFees = parseFloat(transaction.clearing_fees) || 0;
        secCess = parseFloat(transaction.sec_cess) || 0;
        netValue = grossValue + brokerage + cdsFees + cseFees + clearingFees + secCess + stl;
      }

      // Get unique deal number from pre-generated list
      const dealNumber = dealNumbers[index];

      return {
        id: `transaction-${index}`,
        originalTransaction: transaction,
        companyName: companyName,
        symbol: symbol,
        portfolio: globalPortfolio,
        portfolioId: globalPortfolioId,
        dealNumber: dealNumber,
        description: companyName ? `Purchase ${companyName} shares` : 'Purchase shares',
        quantity: quantity,
        price: price,
        grossValue: grossValue,
        brokerage: brokerage,
        cdsFees: cdsFees,
        cseFees: cseFees,
        clearingFees: clearingFees,
        sec: secCess,
        stl: stl,
        netValue: netValue,
        contractNumber: transaction.buying_contract_no || '',
        brokerName: globalBrokerName,
        tradeDate: formatDateForInput(transaction.trade_date || latestTradeDate || ''),
        settlementDate: formatDateForInput(transaction.settlement_date || ''),
        settlementAccount: globalSettlementAccount,
        accountName: globalAccountName,
        accountNumber: globalAccountNumber,
        bankName: globalBankName,
        branchName: globalBranchName,
        cashFlowOnSettlement: netValue,
        paymentMethod: '',
        generatePayment: 'No',
        moneyGenerationCost: '',
        costOfFunds: ''
      };
    }));
    setTransactionForms(forms);
  }, [
    purchaseTransactions,
    equities,
    latestTradeDate,
    globalPortfolio,
    globalPortfolioId,
    globalBrokerName,
    globalSettlementAccount,
    globalAccountName,
    globalAccountNumber,
    globalBankName,
    globalBranchName
  ]);

  useEffect(() => {
    if (isOpen && purchaseTransactions.length > 0) {
      initializeForms();
    }
  }, [isOpen, purchaseTransactions, initializeForms]);

  useEffect(() => {
    if (!isOpen) return;

    const loadAccounts = async () => {
      try {
        const data = await accountAPI.getAllAccounts();
        setAccounts(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setAccounts([]);
      }
    };

    loadAccounts();
  }, [isOpen]);

  const handleFieldChange = (formIndex, field, value) => {
    setTransactionForms(prev => {
      const updated = [...prev];
      updated[formIndex] = { ...updated[formIndex], [field]: value };
      
      // If portfolio changes, update portfolioId
      if (field === 'portfolio') {
        const selectedPortfolio = portfolios.find(p => p.portfolioName === value || p.id === value);
        if (selectedPortfolio) {
          updated[formIndex].portfolioId = selectedPortfolio.portfolioId || selectedPortfolio.id || '';
        }
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[`${formIndex}-${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${formIndex}-${field}`];
        return newErrors;
      });
    }
  };

  const applyGlobalChange = (field, value) => {
    setTransactionForms(prev =>
      prev.map(form => ({
        ...form,
        [field]: value
      }))
    );
  };

  const handleGlobalPortfolioChange = async (value) => {
    setGlobalPortfolio(value);
    const selectedPortfolio = portfolios.find(p => p.portfolioName === value || p.id === value);
    const portfolioId = selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '';
    setGlobalPortfolioId(portfolioId);
    applyGlobalChange('portfolio', value);
    applyGlobalChange('portfolioId', portfolioId);

    // Try auto-fill bank account mapping for portfolio
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
        const searchPortfolioName = String(value || '').trim();
        return mappingPortfolioName.toLowerCase() === searchPortfolioName.toLowerCase();
      });

      if (mapping && mapping.account_id) {
        const settlementAccount = mapping.account_name && mapping.account_number
          ? `${mapping.account_name} - ${mapping.account_number}`
          : mapping.account_number || '';

        setGlobalSettlementAccount(settlementAccount);
        setGlobalAccountName(mapping.account_name || '');
        setGlobalAccountNumber(mapping.account_number || '');
        setGlobalBankName(mapping.bank_name || '');
        setGlobalBranchName(mapping.branch_name || '');
        setGlobalPaymentMethod(mapping.payment_method || '');

        applyGlobalChange('settlementAccount', settlementAccount);
        applyGlobalChange('accountName', mapping.account_name || '');
        applyGlobalChange('accountNumber', mapping.account_number || '');
        applyGlobalChange('bankName', mapping.bank_name || '');
        applyGlobalChange('branchName', mapping.branch_name || '');
        applyGlobalChange('paymentMethod', mapping.payment_method || '');
      }
    } catch (err) {
      console.error('Error fetching portfolio settlement mapping:', err);
    }

    if (errors.globalPortfolio) {
      setErrors(prev => {
        const nextErrors = { ...prev };
        delete nextErrors.globalPortfolio;
        return nextErrors;
      });
    }
  };

  const handleGlobalAccountSelect = (accountId) => {
    const account = accounts.find(a => String(a.id) === String(accountId));
    if (!account) return;

    const settlementAccount = account.account_name && account.account_number
      ? `${account.account_name} - ${account.account_number}`
      : account.account_number || '';

    setGlobalSettlementAccount(settlementAccount);
    setGlobalAccountName(account.account_name || '');
    setGlobalAccountNumber(account.account_number || '');
    setGlobalBankName(account.bank_name || '');
    setGlobalBranchName(account.branch_name || '');
    setGlobalPaymentMethod(account.payment_method || '');

    applyGlobalChange('settlementAccount', settlementAccount);
    applyGlobalChange('accountName', account.account_name || '');
    applyGlobalChange('accountNumber', account.account_number || '');
    applyGlobalChange('bankName', account.bank_name || '');
    applyGlobalChange('branchName', account.branch_name || '');
    applyGlobalChange('paymentMethod', account.payment_method || '');
  };

  const handleSubmit = async () => {
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

      // Validate each transaction individually
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
        if (!form.price || form.price <= 0) {
          rowErrors.price = 'Price must be greater than 0';
        }

        if (Object.keys(rowErrors).length > 0) {
          newErrors[`${i}-description`] = rowErrors.description;
          newErrors[`${i}-companyName`] = rowErrors.companyName;
          newErrors[`${i}-quantity`] = rowErrors.quantity;
          newErrors[`${i}-price`] = rowErrors.price;
          const reasonDetails = Object.values(rowErrors).filter(Boolean).join(', ') || 'Validation error';
          skippedTransactions.push({
            index: i,
            companyName: form.companyName,
            reason: reasonDetails,
            parsedTradeTransactionId: form.originalTransaction?.id,
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
          const errorReasons = [];
          
          if (newErrors[`${t.index}-description`]) errorReasons.push('missing description');
          if (newErrors[`${t.index}-companyName`]) errorReasons.push('missing company name');
          if (newErrors[`${t.index}-quantity`]) errorReasons.push(newErrors[`${t.index}-quantity`].toLowerCase());
          if (newErrors[`${t.index}-price`]) errorReasons.push('invalid price');
          
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

      // Save only valid transactions
      const savePromises = validTransactions.map(({ form }) => {
        const transactionData = {
            parsed_trade_transaction_id: form.originalTransaction?.id,
          company_name: form.companyName,
          symbol: form.symbol,
          portfolio: form.portfolio,
          portfolioId: form.portfolioId,
          deal_number: form.dealNumber,
          description: form.description,
          quantity: form.quantity,
          price: form.price,
          gross_value: form.grossValue,
          brokerage: form.brokerage,
          cds_fees: form.cdsFees,
          cse_fees: form.cseFees,
          clearing_fees: form.clearingFees,
          sec: form.sec,
          stl: form.stl,
          net_value: form.netValue,
          contract_number: form.contractNumber,
          broker_name: form.brokerName,
          trade_date: form.tradeDate,
          settlement_date: form.settlementDate,
          settlement_account: form.settlementAccount,
          account_name: form.accountName,
          account_number: form.accountNumber,
          bank_name: form.bankName,
          branch_name: form.branchName,
          cash_flow_on_settlement: form.cashFlowOnSettlement,
          payment_method: form.paymentMethod,
          generate_payment: form.generatePayment,
          money_generation_cost: form.moneyGenerationCost,
          cost_of_funds: form.costOfFunds
        };
        
        return transactionEntryAPI.saveBuyTransaction(transactionData).catch(async (error) => {
          await logSaveStatus({
            parsedTradeTransactionId: form.originalTransaction?.id,
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

      setSuccessMessage(message || 'All buy transactions saved successfully!');
      setErrorMessage('');
      
      // Auto-close modal after 3 seconds (longer to read the message)
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving transactions:', error);
      const message = error?.message?.includes('409')
        ? 'Duplicate entries detected. These transactions were already saved.'
        : 'Error saving transactions. Please try again.';
      setErrorMessage(message);
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="ubtm-modal-overlay" onClick={onClose}>
      <div className="ubtm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ubtm-modal-header">
          <h2>Update Buy Transactions</h2>
          <button className="ubtm-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="ubtm-modal-body">
          {successMessage && (
            <div className="ubtm-message ubtm-message-success">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="ubtm-message ubtm-message-error">
              {errorMessage}
            </div>
          )}
          <div className="ubtm-global-section">
            <h3>Apply to All Transactions</h3>
            <div className="ubtm-form-grid">
              <div className="ubtm-form-group">
                <label>Portfolio *</label>
                <select
                  value={globalPortfolio}
                  onChange={(e) => handleGlobalPortfolioChange(e.target.value)}
                  className={`ubtm-input ${errors.globalPortfolio ? 'ubtm-error' : ''}`}
                >
                  <option value="">Select Portfolio</option>
                  {portfolios.map(portfolio => (
                    <option key={portfolio.id || portfolio.portfolioId} value={portfolio.portfolioName || portfolio.portfolio}>
                      {portfolio.portfolioName || portfolio.portfolio}
                    </option>
                  ))}
                </select>
                {errors.globalPortfolio && (
                  <span className="ubtm-error-text">{errors.globalPortfolio}</span>
                )}
              </div>

              <div className="ubtm-form-group">
                <label>Portfolio ID</label>
                <input
                  type="text"
                  value={globalPortfolioId}
                  readOnly
                  className="ubtm-input ubtm-readonly"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Broker Name</label>
                <input
                  type="text"
                  value={globalBrokerName}
                  onChange={(e) => {
                    setGlobalBrokerName(e.target.value);
                    applyGlobalChange('brokerName', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter broker name"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Settlement Account</label>
                <input
                  type="text"
                  value={globalSettlementAccount}
                  onChange={(e) => {
                    setGlobalSettlementAccount(e.target.value);
                    applyGlobalChange('settlementAccount', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter settlement account"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Bank Account</label>
                <select
                  value=""
                  onChange={(e) => handleGlobalAccountSelect(e.target.value)}
                  className="ubtm-input"
                >
                  <option value="">Select Bank Account (optional)</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.account_name ? `${account.account_name} - ` : ''}{account.account_number} ({account.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ubtm-form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={globalAccountName}
                  onChange={(e) => {
                    setGlobalAccountName(e.target.value);
                    applyGlobalChange('accountName', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter account name"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={globalAccountNumber}
                  onChange={(e) => {
                    setGlobalAccountNumber(e.target.value);
                    applyGlobalChange('accountNumber', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter account number"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={globalBankName}
                  onChange={(e) => {
                    setGlobalBankName(e.target.value);
                    applyGlobalChange('bankName', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter bank name"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  value={globalBranchName}
                  onChange={(e) => {
                    setGlobalBranchName(e.target.value);
                    applyGlobalChange('branchName', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter branch name"
                />
              </div>

              <div className="ubtm-form-group">
                <label>Payment Method</label>
                <input
                  type="text"
                  value={globalPaymentMethod}
                  onChange={(e) => {
                    setGlobalPaymentMethod(e.target.value);
                    applyGlobalChange('paymentMethod', e.target.value);
                  }}
                  className="ubtm-input"
                  placeholder="Enter payment method"
                />
              </div>
            </div>
          </div>

          {transactionForms.length === 0 ? (
            <p>No purchase transactions found.</p>
          ) : (
            <div className="ubtm-transactions-list">
              {transactionForms.map((form, index) => (
                <div key={form.id} className="ubtm-transaction-form">
                  <h3>Transaction {index + 1}</h3>
                  
                  <div className="ubtm-form-grid">
                    <div className="ubtm-form-group">
                      <label>Company Name</label>
                      <input 
                        type="text" 
                        value={form.companyName} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Symbol</label>
                      <input 
                        type="text" 
                        value={form.symbol} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Deal Number</label>
                      <input 
                        type="text" 
                        value={form.dealNumber} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group ubtm-full-width">
                      <label>Description *</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                        className={`ubtm-input ${errors[`${index}-description`] ? 'ubtm-error' : ''}`}
                        placeholder="Enter description"
                      />
                      {errors[`${index}-description`] && (
                        <span className="ubtm-error-text">{errors[`${index}-description`]}</span>
                      )}
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Quantity</label>
                      <input 
                        type="number" 
                        value={form.quantity} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Price</label>
                      <input 
                        type="number" 
                        value={form.price} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Gross Value</label>
                      <input 
                        type="number" 
                        value={form.grossValue.toFixed(2)} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Brokerage</label>
                      <input 
                        type="number" 
                        value={form.brokerage} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>CSE Fees</label>
                      <input 
                        type="number" 
                        value={form.cseFees} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>CDS Fees</label>
                      <input 
                        type="number" 
                        value={form.cdsFees} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Clearing Fees</label>
                      <input 
                        type="number" 
                        value={form.clearingFees} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>SEC</label>
                      <input 
                        type="number" 
                        value={form.sec} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>STL</label>
                      <input 
                        type="number" 
                        value={form.stl} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Net Value</label>
                      <input 
                        type="number" 
                        value={form.netValue.toFixed(2)} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Contract Number</label>
                      <input 
                        type="text" 
                        value={form.contractNumber} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Trade Date</label>
                      <input 
                        type="date" 
                        value={form.tradeDate} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                    
                    <div className="ubtm-form-group">
                      <label>Settlement Date</label>
                      <input 
                        type="date" 
                        value={form.settlementDate} 
                        readOnly 
                        className="ubtm-input ubtm-readonly"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="ubtm-modal-footer">
          <button className="ubtm-btn ubtm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="ubtm-btn ubtm-btn-submit" 
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

export default UpdateBuyTransactionsModal;

