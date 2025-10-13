import React, { useState, useEffect } from 'react';
import './Styles/SellTransactionEntry.css';
import { portfolioAPI } from '../../services/api';
import { equityAPI } from '../../services/api';
import { portfolioCostingMethodAPI } from '../../services/api'; // <-- Add this import
import { transactionEntryAPI } from '../../services/api'; // <-- Add this import
import { costOfFundsAPI, tradeSummaryAPI, accountAPI } from '../../services/api';
import SellTransactionListView from './SellTransactionListView';
import TransactionDetails from './TransactionDetails';
import SellEquitySelectorModal from './SellEquitySelectorModal';

const getToday = () => new Date().toISOString().slice(0, 10);

const SellTransactionEntry = ({ setFifoParams, setActiveTab }) => {
  const [form, setForm] = useState({
    
    companyName: '',
    symbol: '', // <-- Add symbol to form state
    portfolioName: '',
    portfolioId: '', // <-- Add this field
    valuationMethod: '', // <-- Added field
    contractNumber: '',
    quantity: '',
    soldPrice: '',
    boughtPrice: '',
    buyTransactionDates: '', // Buy transaction dates
    tradeDate: getToday(),
    settlementDate: getToday(),
    brokerName: '',
    settlementAccount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    capitalGain: '',
    costOfFunds: '',
    hdays: '',
    cp: '',
    buyContract: '',
    profitLoss: '',
    // Cost breakdown fields
    grossValue: '',
    brokerage: '',
    cseFees: '',
    cdsFees: '',
    clearingFees: '',
    sec: '',
    stl: '',
    netValue: '',
    stepUp: null,
    moneyGenerationCost: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [equities, setEquities] = useState([]);
  const [equitiesLoading, setEquitiesLoading] = useState(true);
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]); // <-- Add state
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  // Add new state for totalShares
  const [totalShares, setTotalShares] = useState('');
  const [remainingShares, setRemainingShares] = useState('');
  const [showListView, setShowListView] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showEquitySelector, setShowEquitySelector] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  
  // Add state for available deal numbers
  const [availableDealNumbers, setAvailableDealNumbers] = useState([]);
  const [dealNumbersLoading, setDealNumbersLoading] = useState(false);

  // Fetch active cost of funds on mount
  useEffect(() => {
    const fetchActiveCostOfFunds = async () => {
      try {
        const activeCostOfFunds = await costOfFundsAPI.getActiveCostOfFunds();
        if (activeCostOfFunds && activeCostOfFunds.after_tax_cost_of_funds) {
          setForm(prev => ({ 
            ...prev, 
            costOfFunds: parseFloat(activeCostOfFunds.after_tax_cost_of_funds).toFixed(2)
          }));
        }
      } catch (error) {
        console.log('No active cost of funds definition found, using default value');
        // Keep the field empty if no active cost of funds is found
      }
    };

    fetchActiveCostOfFunds();
  }, []);

  useEffect(() => {
    setPortfoliosLoading(true);
    setAccountsLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
    // Fetch assigned costing methods
    portfolioCostingMethodAPI.getAllAssignedCostingMethods()
      .then(data => setAssignedCostingMethods(data))
      .catch(() => setAssignedCostingMethods([]));
    // Fetch accounts
    accountAPI.getAllAccounts()
      .then(data => setAccounts(data))
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => {
    setEquitiesLoading(true);
    equityAPI.getActiveEquities()
      .then(data => setEquities(data))
      .catch(() => setEquities([]))
      .finally(() => setEquitiesLoading(false));
  }, []);

  // Fetch companies when portfolio changes
  useEffect(() => {
    if (form.portfolioName) {
      setCompaniesLoading(true);
      transactionEntryAPI.getCompaniesByPortfolio(form.portfolioName)
        .then(companies => setFilteredCompanies(companies))
        .catch(() => setFilteredCompanies([]))
        .finally(() => setCompaniesLoading(false));
      // Clear companyName and symbol if portfolio changes
      setForm(prev => ({ ...prev, companyName: '', symbol: '', buyTransactionDates: '' }));
    } else {
      setFilteredCompanies([]);
      setForm(prev => ({ ...prev, companyName: '', symbol: '', buyTransactionDates: '' }));
    }
  }, [form.portfolioName]);

  // --- Calculations ---
  // Calculate Gross Value: Quantity × Sold Price
  useEffect(() => {
    if (form.quantity && form.soldPrice) {
      const grossValue = parseFloat(form.quantity) * parseFloat(form.soldPrice);
      setForm(prev => ({ ...prev, grossValue: grossValue.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, grossValue: '' }));
    }
  }, [form.quantity, form.soldPrice]);

  useEffect(() => {
    if (form.soldPrice && form.boughtPrice && form.quantity) {
      const gain = (parseFloat(form.soldPrice) - parseFloat(form.boughtPrice)) * parseFloat(form.quantity);
      setForm(prev => ({ ...prev, capitalGain: gain.toFixed(2) }));
    }
  }, [form.soldPrice, form.boughtPrice, form.quantity]);

  useEffect(() => {
    if (form.capitalGain && form.holdingCost) {
      const profit = parseFloat(form.capitalGain) - parseFloat(form.holdingCost || 0);
      setForm(prev => ({ ...prev, profitLoss: profit.toFixed(2) }));
    }
  }, [form.capitalGain, form.holdingCost]);

  // Calculate holding days based on buy transaction settlement dates
  useEffect(() => {
    const calculateHoldingDays = async () => {
      if (
        form.portfolioName &&
        form.companyName &&
        form.quantity && 
        !isNaN(parseFloat(form.quantity)) && 
        parseFloat(form.quantity) > 0 &&
        form.settlementDate
      ) {
        try {
          const res = await transactionEntryAPI.getDetailedFifoAllocation(
            form.portfolioName,
            form.companyName,
            form.quantity
          );
          
          if (res.allocations && res.allocations.length > 0) {
            const sellSettlementDate = new Date(form.settlementDate);
            let totalWeightedDays = 0;
            let totalQuantity = 0;
            
            res.allocations.forEach(allocation => {
              // Create date objects and normalize to start of day to avoid timezone issues
              const sellDate = new Date(form.settlementDate);
              const buyDate = new Date(allocation.settlementDate);
              
              // Normalize to start of day (00:00:00) to avoid timezone/time issues
              sellDate.setHours(0, 0, 0, 0);
              buyDate.setHours(0, 0, 0, 0);
              
              const daysDiff = Math.ceil((sellDate - buyDate) / (1000 * 60 * 60 * 24));
              const quantity = parseFloat(allocation.quantity);
              
              // Debug logging for date calculation
              console.log('Date calculation debug:', {
                sellSettlementDate: form.settlementDate,
                buySettlementDate: allocation.settlementDate,
                sellDateNormalized: sellDate.toISOString(),
                buyDateNormalized: buyDate.toISOString(),
                daysDiff: daysDiff,
                quantity: quantity
              });
              
              // Include all transactions, including same-day (0 days) and positive holding days
              if (daysDiff >= 0) {
                totalWeightedDays += daysDiff * quantity;
                totalQuantity += quantity;
              }
            });
            
            const weightedAverageDays = totalQuantity > 0 ? Math.round(totalWeightedDays / totalQuantity) : 0;
            console.log('Holding days calculation result:', {
              totalWeightedDays,
              totalQuantity,
              weightedAverageDays,
              allocations: res.allocations
            });
            setForm(prev => ({ ...prev, hdays: weightedAverageDays >= 0 ? weightedAverageDays.toString() : '' }));
          } else {
            // No buy transactions found, clear holding days
            setForm(prev => ({ ...prev, hdays: '' }));
          }
        } catch (err) {
          console.error('Error calculating holding days:', err);
          setForm(prev => ({ ...prev, hdays: '' }));
        }
      } else {
        // Clear holding days if required fields are missing
        setForm(prev => ({ ...prev, hdays: '' }));
      }
    };
    
    calculateHoldingDays();
  }, [form.portfolioName, form.companyName, form.quantity, form.settlementDate]);

  // Autofill valuation method when portfolioName changes
  useEffect(() => {
    if (form.portfolioName && assignedCostingMethods.length > 0) {
      // Find the portfolioId for the selected portfolioName
      const selectedPortfolio = portfolios.find(p => p.portfolioName === form.portfolioName);
      if (selectedPortfolio) {
        const assigned = assignedCostingMethods.find(a => a.portfolioId === (selectedPortfolio.portfolioId || selectedPortfolio.id));
        if (assigned && assigned.costing_method) {
          setForm(prev => ({ ...prev, valuationMethod: assigned.costing_method }));
        } else {
          setForm(prev => ({ ...prev, valuationMethod: '' }));
        }
      } else {
        setForm(prev => ({ ...prev, valuationMethod: '' }));
      }
    }
  }, [form.portfolioName, assignedCostingMethods, portfolios]);

  useEffect(() => {
    if (form.portfolioName && form.companyName) {
      // Fetch total quantity
      transactionEntryAPI.getTotalQuantity(form.portfolioName, form.companyName)
        .then(res => {
          setTotalShares(res.total_quantity || '');
        })
        .catch(() => {
          setTotalShares('');
        });

      // Fetch available deal numbers
      setDealNumbersLoading(true);
      transactionEntryAPI.getAvailableBuyLots(form.portfolioName, form.companyName)
        .then(buyLots => {
          // Extract deal numbers from buy lots
          const dealNumbers = buyLots.map(lot => ({
            value: lot.deal_number || lot.contract_number || lot.id,
            label: lot.deal_number || lot.contract_number || `Transaction ${lot.id}`,
            id: lot.id,
            quantity: lot.remaining_quantity || lot.quantity,
            price: lot.price
          }));
          setAvailableDealNumbers(dealNumbers);
        })
        .catch(error => {
          console.error('Error fetching deal numbers:', error);
          setAvailableDealNumbers([]);
        })
        .finally(() => {
          setDealNumbersLoading(false);
        });
    } else {
      setTotalShares('');
      setAvailableDealNumbers([]);
    }
  }, [form.portfolioName, form.companyName]);

  useEffect(() => {
    const fetchAndSetWAP = async () => {
      if (
        form.portfolioName &&
        form.companyName &&
        form.valuationMethod &&
        form.valuationMethod.toUpperCase() === 'WAP'
      ) {
        try {
          const res = await transactionEntryAPI.getWAPByPortfolioAndCompany(form.portfolioName, form.companyName);
          setForm(prev => ({ ...prev, boughtPrice: res.wap ? parseFloat(res.wap).toFixed(2) : '' }));
        } catch (err) {
          setForm(prev => ({ ...prev, boughtPrice: '' }));
        }
      } else if (form.valuationMethod && form.valuationMethod.toUpperCase() === 'WAP') {
        setForm(prev => ({ ...prev, boughtPrice: '' }));
      }
    };
    fetchAndSetWAP();
  }, [form.portfolioName, form.companyName, form.valuationMethod]);

  useEffect(() => {
    const fetchAndSetFIFO = async () => {
      if (
        form.portfolioName &&
        form.companyName &&
        form.valuationMethod &&
        form.valuationMethod.toUpperCase() === 'FIFO' &&
        form.quantity && !isNaN(parseFloat(form.quantity)) && parseFloat(form.quantity) > 0
      ) {
        try {
          const res = await transactionEntryAPI.getFifoCostByPortfolioAndCompany(
            form.portfolioName,
            form.companyName,
            form.quantity
          );
          setForm(prev => ({ ...prev, boughtPrice: res.fifoCost ? parseFloat(res.fifoCost).toFixed(2) : '' }));
        } catch (err) {
          setForm(prev => ({ ...prev, boughtPrice: '' }));
        }
      } else if (form.valuationMethod && form.valuationMethod.toUpperCase() === 'FIFO') {
        setForm(prev => ({ ...prev, boughtPrice: '' }));
      }
    };
    fetchAndSetFIFO();
  }, [form.portfolioName, form.companyName, form.valuationMethod, form.quantity]);

  // Calculate remaining shares when totalShares or form.quantity changes
  useEffect(() => {
    const total = parseFloat(totalShares);
    const qty = parseFloat(form.quantity);
    if (!isNaN(total) && !isNaN(qty)) {
      setRemainingShares(Math.max(total - qty, 0));
    } else {
      setRemainingShares('');
    }
  }, [totalShares, form.quantity]);

  // Calculate Profit/Loss when relevant fields change
  useEffect(() => {
    if (form.capitalGain) {
      const capitalGain = parseFloat(form.capitalGain) || 0;
      const moneyGenCost = parseFloat(form.moneyGenerationCost) || 0; // Default to 0 if null/empty
      const profitLoss = capitalGain - moneyGenCost;
      setForm(prev => ({ ...prev, profitLoss: profitLoss.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, profitLoss: '' }));
    }
  }, [form.capitalGain, form.moneyGenerationCost]);

  // Recalculate Money Gen Cost when holding days change
  useEffect(() => {
    if (form.quantity && form.soldPrice && form.costOfFunds && form.hdays) {
      const recalculateMoneyGenCost = async () => {
        try {
          const calc = await tradeSummaryAPI.calculateSellTransaction({
            quantity: form.quantity,
            soldPrice: form.soldPrice,
            costOfFunds: form.costOfFunds,
            holdingDays: form.hdays
          });
          setForm(prev => ({ ...prev, moneyGenerationCost: calc.moneyGenerationCost ?? '' }));
        } catch (err) {
          console.error('Error recalculating money gen cost:', err);
        }
      };
      recalculateMoneyGenCost();
    }
  }, [form.hdays]);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!form.companyName) newErrors.companyName = 'Company name is required';
    if (!form.portfolioName) newErrors.portfolioName = 'Portfolio name is required';
    if (!form.valuationMethod) newErrors.valuationMethod = 'Valuation method is required'; // <-- Added validation
    if (!form.contractNumber) newErrors.contractNumber = 'Contract number is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    
    // Add quantity validation against total shares
    if (form.quantity && totalShares && parseFloat(form.quantity) > parseFloat(totalShares)) {
      newErrors.quantity = `Quantity cannot exceed total shares (${totalShares})`;
    }
    
    if (!form.soldPrice || form.soldPrice <= 0) newErrors.soldPrice = 'Valid sold price is required';
    if (!form.boughtPrice || form.boughtPrice <= 0) newErrors.boughtPrice = 'Valid bought price is required';
    if (!form.tradeDate) newErrors.tradeDate = 'Trade date is required';
    if (!form.settlementDate) newErrors.settlementDate = 'Settlement date is required';
    if (!form.brokerName) newErrors.brokerName = 'Broker name is required';
    if (!form.symbol) newErrors.symbol = 'Ticker Symbol is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Special handling for quantity field - prevent exceeding total shares
    if (name === 'quantity') {
      const quantity = parseFloat(value);
      const total = parseFloat(totalShares);
      
      // If user tries to exceed total shares, cap it at total shares
      if (!isNaN(quantity) && !isNaN(total) && quantity > total) {
        setForm(prev => ({ ...prev, [name]: totalShares }));
        return; // Don't proceed with normal update
      }
      
      // If value is empty or valid, proceed normally
      setForm(prev => ({ ...prev, [name]: value }));
      
      // Clear any existing quantity errors
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }
      return;
    }
    
    // If portfolioName changes, clear valuationMethod (it will be autofilled by useEffect)
    if (name === 'portfolioName') {
      // Autofill portfolioId
      const selectedPortfolio = portfolios.find(p => p.portfolioName === value);
      setForm({ ...form, [name]: value, valuationMethod: '', portfolioId: selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '' });
    } else {
      let updatedForm = { ...form, [name]: value };
      // Autofill symbol when companyName changes
      if (name === 'companyName') {
        const selectedEquity = equities.find(eq => eq.name === value);
        updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
      }
      
      // Only recalculate if quantity or soldPrice changes
      if (name === 'quantity' || name === 'soldPrice') {
        try {
          const calc = await tradeSummaryAPI.calculateSellTransaction({
            quantity: name === 'quantity' ? value : updatedForm.quantity,
            soldPrice: name === 'soldPrice' ? value : updatedForm.soldPrice,
            costOfFunds: updatedForm.costOfFunds,
            holdingDays: updatedForm.hdays || 0
          });
          setForm({
            ...updatedForm,
            grossValue: calc.grossValue,
            brokerage: calc.brokerage,
            cseFees: calc.cseFees,
            cdsFees: calc.cdsFees,
            clearingFees: calc.clearingFees,
            sec: calc.sec,
            stl: calc.stl,
            netValue: calc.netValue,
            stepUp: calc.stepUp,
            moneyGenerationCost: calc.moneyGenerationCost ?? ''
          });
        } catch (err) {
          console.error('Error calculating sell transaction:', err);
          setForm(updatedForm);
        }
      } else {
        setForm(updatedForm);
      }
    }
    
    // Clear error for this field
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const today = getToday();
    
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    const submitForm = {
      company_name: form.companyName,
      symbol: form.symbol,
      portfolio_name: form.portfolioName,
      portfolioId: form.portfolioId,
      valuation_method: form.valuationMethod,
      contract_number: form.contractNumber,
      quantity: parseFloat(form.quantity),
      sold_price: parseFloat(form.soldPrice),
      bought_price: parseFloat(form.boughtPrice),
      trade_date: form.tradeDate || today,
      settlement_date: form.settlementDate || today,
      broker_name: form.brokerName,
      settlement_account: form.settlementAccount,
      account_name: form.accountName || '',
      account_number: form.accountNumber || '',
      bank_name: form.bankName || '',
      branch_name: form.branchName || '',
      gross_value: parseFloat(form.grossValue) || 0,
      brokerage: parseFloat(form.brokerage) || 0,
      cse_fees: parseFloat(form.cseFees) || 0,
      cds_fees: parseFloat(form.cdsFees) || 0,
      clearing_fees: parseFloat(form.clearingFees) || 0,
      sec: parseFloat(form.sec) || 0,
      stl: parseFloat(form.stl) || 0,
      net_value: parseFloat(form.netValue) || 0,
      step_up: parseFloat(form.stepUp) || 0,
      money_generation_cost: parseFloat(form.moneyGenerationCost) || 0,
      capital_gain: parseFloat(form.capitalGain) || 0,
      cost_of_funds: parseFloat(form.costOfFunds) || 0,
      hdays: parseInt(form.hdays) || 0,
      cp: parseFloat(form.cp) || 0,
      buy_contract: form.buyContract || '',
      buy_transaction_dates: form.buyTransactionDates || '',
      holding_cost: parseFloat(form.holdingCost) || 0,
      profit_loss: parseFloat(form.profitLoss) || 0,
      total_shares: totalShares
    };
    
    try {
      console.log('Submitting sell transaction:', submitForm);
      await transactionEntryAPI.saveSellTransaction(submitForm);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      handleReset();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to save sell transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      symbol: '', // <-- Add to reset
      portfolioName: '',
      portfolioId: '', // <-- Reset this field
      valuationMethod: '', // <-- Added reset
      contractNumber: '',
      quantity: '',
      soldPrice: '',
      boughtPrice: '',
      tradeDate: getToday(),
      settlementDate: getToday(),
      brokerName: '',
      settlementAccount: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      capitalGain: '',
      costOfFunds: '',
      hdays: '',
      wap: '',
      cp: '',
      buyContract: '',
      holdingCost: '',
      profitLoss: ''
    });
    setErrors({});
    setShowSuccess(false);
  };

  const getFieldClassName = (fieldName) =>
    `sell-form-input${errors[fieldName] ? ' sell-error' : ''}`;

  // Handle equity selection from modal
  const handleEquitySelect = async (companyName) => {
    // Find the equity record to get the symbol
    const selectedEquity = equities.find(equity => equity.name === companyName);
    const symbol = selectedEquity ? selectedEquity.symbol : '';
    
    setForm(prev => ({
      ...prev,
      companyName: companyName,
      symbol: symbol
    }));
    
    // Fetch buy transaction dates for this company
    if (symbol && form.portfolioName) {
      try {
        const buyTransactions = await transactionEntryAPI.getByPortfolio(form.portfolioName);
        const companyBuyTransactions = buyTransactions.filter(tx => tx.symbol === symbol);
        
        // Format dates to user-friendly format
        const formatDate = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (error) {
            return dateString;
          }
        };
        
        const buyDates = companyBuyTransactions.map(tx => formatDate(tx.trade_date)).join(', ');
        
        setForm(prev => ({
          ...prev,
          buyTransactionDates: buyDates
        }));
      } catch (error) {
        console.error('Error fetching buy transaction dates:', error);
        setForm(prev => ({
          ...prev,
          buyTransactionDates: 'Error loading dates'
        }));
      }
    }
    
    // Clear any existing errors
    if (errors.companyName) {
      setErrors(prev => ({ ...prev, companyName: '' }));
    }
  };

  // Handle account selection
  const handleAccountSelect = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue) {
      // Find the account by matching the display value
      const selectedAccount = accounts.find(account => 
        `${account.account_name} - ${account.account_number}` === selectedValue
      );
      
      if (selectedAccount) {
        setForm(prev => ({
          ...prev,
          settlementAccount: `${selectedAccount.account_name} - ${selectedAccount.account_number}`,
          accountName: selectedAccount.account_name,
          accountNumber: selectedAccount.account_number,
          bankName: selectedAccount.bank_name,
          branchName: selectedAccount.branch_name,
          swiftCode: selectedAccount.swift_code,
          iban: selectedAccount.iban
        }));
      }
    } else {
      setForm(prev => ({
        ...prev,
        settlementAccount: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        branchName: '',
        swiftCode: '',
        iban: ''
      }));
    }
  };

  // Handle key press for quantity field to prevent exceeding total shares
  const handleQuantityKeyDown = (e) => {
    if (e.target.name === 'quantity' && totalShares) {
      const currentValue = e.target.value;
      const key = e.key;
      
      // Allow backspace, delete, arrow keys, tab, etc.
      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(key)) {
        return;
      }
      
      // Allow numbers and decimal point
      if (!/[\d.]/.test(key)) {
        e.preventDefault();
        return;
      }
      
      // Check if adding this key would exceed total shares
      const newValue = currentValue + key;
      const newQuantity = parseFloat(newValue);
      const total = parseFloat(totalShares);
      
      if (!isNaN(newQuantity) && newQuantity > total) {
        e.preventDefault();
        // Set to max allowed value
        setForm(prev => ({ ...prev, quantity: totalShares }));
      }
    }
  };

  // --- Render ---
  if (showListView) {
    return <SellTransactionListView onBack={() => setShowListView(false)} setActiveTab={setActiveTab} />;
  }

  if (showTransactionDetails) {
    return (
      <TransactionDetails 
        onBack={() => setShowTransactionDetails(false)} 
        companyName={form.companyName}
        portfolioName={form.portfolioName}
        quantity={form.quantity}
        sellTransaction={form}
        valuationMethod={form.valuationMethod}
      />
    );
  }

  return (
    <div className="sell-page">
      

      


      <div className="sell-content-wrapper">
        <div className="sell-header-section">
  <div className="sell-header-icon">
    <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
  </div>
  <div className="sell-header-text-group">
    <h1 className="sell-main-title">Sell Transaction Entry</h1>
    <p className="sell-subtitle">Record your stock sale transaction details</p>
  </div>
</div>
        <div className="sell-container">
          <div className="sell-card-header">
            <h2 className="sell-card-title">Transaction Details</h2>
          </div>
          <div className="sell-form-content">
            {showSuccess && (
              <div className="sell-success-banner">
                <div className="sell-success-icon">✓</div>
                <span>Transaction recorded successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="sell-form">
              {/* Section 1 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Basic Information</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <div className="sell-equity-selector">
                    <input
                      id="companyName"
                      name="companyName"
                      value={form.companyName}
                      readOnly
                      required
                      className="sell-form-input"
                      placeholder="Click to select company"
                      disabled={companiesLoading || !form.portfolioName}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEquitySelector(true)}
                      className="sell-equity-select-btn"
                      disabled={companiesLoading || !form.portfolioName}
                    >
                      <svg className="sell-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Select
                    </button>
                  </div>
                  {errors.companyName && <span className="sell-error-text">{errors.companyName}</span>}
                </div>
                <div className="sell-form-group">
    <label htmlFor="portfolioName">Choose Portfolio *</label>
    <select
      id="portfolioName"
      name="portfolioName"
      value={form.portfolioName}
      onChange={handleChange}
      className={getFieldClassName('portfolioName')}
      required
      disabled={portfoliosLoading}
    >
      <option value="">
        {portfoliosLoading
          ? 'Loading portfolios...'
          : portfolios.length === 0
            ? 'No active portfolios found'
            : 'Select Portfolio'}
      </option>
      {portfolios.map(p => (
        <option key={p.id} value={p.portfolioName}>{p.portfolioName}</option>
      ))}
    </select>
    {errors.portfolioName && <span className="sell-error-text">{errors.portfolioName}</span>}
  </div>
                {/* Portfolio ID field (read-only, autofilled) */}
                <div className="sell-form-group">
                  <label htmlFor="portfolioId">Portfolio ID</label>
                  <input
                    type="text"
                    id="portfolioId"
                    name="portfolioId"
                    value={form.portfolioId}
                    readOnly
                    className="sell-form-input"
                    placeholder="Auto-filled from portfolio"
                  />
                </div>
                {/* Valuation Method Field */}
                <div className="sell-form-group">
                  <label htmlFor="valuationMethod">Valuation Method *</label>
                  <input
                    type="text"
                    id="valuationMethod"
                    name="valuationMethod"
                    value={form.valuationMethod}
                    className={getFieldClassName('valuationMethod')}
                    readOnly
                    disabled
                    placeholder="Auto-filled from portfolio"
                  />
                  {errors.valuationMethod && <span className="sell-error-text">{errors.valuationMethod}</span>}
                  {form.portfolioName && !form.valuationMethod && (
                    <span className="sell-error-text">No costing method assigned to this portfolio.</span>
                  )}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="symbol">Ticker Symbol *</label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={form.symbol}
                    readOnly
                    required
                    className="sell-form-input"
                    placeholder="Auto-filled from company"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="totalShares">Total Shares *</label>
                  <input
                    type="number"
                    id="totalShares"
                    name="totalShares"
                    value={totalShares}
                    readOnly
                    className="sell-form-input"
                    placeholder="Auto-fetched total shares"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="contractNumber">Contract Number</label>
                  <input
                    type="text"
                    id="contractNumber"
                    name="contractNumber"
                    value={form.contractNumber}
                    onChange={handleChange}
                    className={getFieldClassName('contractNumber')}
                    placeholder="Enter contract number"
                  />
                  {errors.contractNumber && <span className="sell-error-text">{errors.contractNumber}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="brokerName">Broker Name *</label>
                  <input
                    type="text"
                    id="brokerName"
                    name="brokerName"
                    value={form.brokerName}
                    onChange={handleChange}
                    className={getFieldClassName('brokerName')}
                    placeholder="Enter broker name"
                  />
                  {errors.brokerName && <span className="sell-error-text">{errors.brokerName}</span>}
                </div>

              </div>
              {/* Section 2 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Transaction Details</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    onKeyDown={handleQuantityKeyDown}
                    className={getFieldClassName('quantity')}
                    placeholder={totalShares ? `Max: ${totalShares} shares` : "Number of shares"}
                    min="1"
                    max={totalShares || undefined}
                  />
                  {errors.quantity && <span className="sell-error-text">{errors.quantity}</span>}
                  {totalShares && !errors.quantity && (
                    <small className="sell-field-note">
                      Maximum: {totalShares} shares available
                    </small>
                  )}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="remainingShares">Remaining Shares</label>
                  <input
                    type="number"
                    id="remainingShares"
                    name="remainingShares"
                    value={remainingShares}
                    readOnly
                    className="sell-form-input"
                    placeholder="Remaining shares after sale"
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="soldPrice">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    id="soldPrice"
                    name="soldPrice"
                    value={form.soldPrice}
                    onChange={handleChange}
                    className={getFieldClassName('soldPrice')}
                    placeholder="Price per share"
                    step="0.01"
                    min="0"
                  />
                  {errors.soldPrice && <span className="sell-error-text">{errors.soldPrice}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="grossValue">Gross Value (LKR) *</label>
                  <input
                    type="number"
                    id="grossValue"
                    name="grossValue"
                    value={form.grossValue}
                    onChange={handleChange}
                    className="sell-form-input sell-calculated-field"
                    placeholder="Auto-calculated: Quantity × Sold Price"
                    step="0.01"
                    min="0"
                    readOnly
                  />
                </div>
                <div className="sell-form-group">
                  <label htmlFor="boughtPrice">Bought Price (LKR) *</label>
                  <input
                    type="number"
                    id="boughtPrice"
                    name="boughtPrice"
                    value={form.boughtPrice}
                    onChange={handleChange}
                    className={getFieldClassName('boughtPrice')}
                    placeholder="Original purchase price"
                    step="0.01"
                    min="0"
                    readOnly
                  />
                  {errors.boughtPrice && <span className="sell-error-text">{errors.boughtPrice}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="buyTransactionDates">Buy Transaction Dates</label>
                  <input
                    type="text"
                    id="buyTransactionDates"
                    name="buyTransactionDates"
                    value={form.buyTransactionDates}
                    onChange={handleChange}
                    className="sell-form-input"
                    placeholder="Dates of buy transactions being sold"
                    readOnly
                  />
                  <small className="sell-field-note">Dates of the original buy transactions</small>
                </div>
                <div className="sell-form-group">
                  <div className="sell-capital-gain-row">
                    <input
                      type="number"
                      id="capitalGain"
                      name="capitalGain"
                      value={form.capitalGain}
                      onChange={handleChange}
                      className="sell-form-input sell-calculated-field"
                      placeholder="Auto-calculated"
                      step="0.01"
                      readOnly
                    />
                    <button
                      type="button"
                      className="sell-view-details-btn"
                      onClick={() => setShowTransactionDetails(true)}
                    >
                      View Details
                    </button>
                  </div>
                  <small className="sell-field-note">Automatically calculated</small>
                </div>
              </div>
              
              {/* Cost Breakdown & Calculations Section */}
              <div className="sell-section-header">
                <div className="sell-section-icon calculation">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Cost Breakdown & Calculations</h3>
              </div>
              <div className="sell-fee-structure-note">
                <div className="sell-fee-structure-info">
                  <svg className="sell-info-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span><strong>Fee Structure:</strong> ≤100M: 1.12% total | &gt;100M: Reduced rates apply</span>
                </div>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label className="sell-field-label">Gross Value (Rs.)</label>
                  <input
                    name="grossValue"
                    value={form.grossValue}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">Brokerage (0.64% / 0.20%)</label>
                  <input
                    name="brokerage"
                    value={form.brokerage}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">CSE Fees (0.084% / 0.0525%)</label>
                  <input
                    name="cseFees"
                    value={form.cseFees}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">CDS Fees (0.012% / 0.0075%)</label>
                  <input
                    name="cdsFees"
                    value={form.cdsFees}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">Clearing Fees (0.012% / 0.0075%)</label>
                  <input
                    name="clearingFees"
                    value={form.clearingFees}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">SEC (0.072% / 0.045%)</label>
                  <input
                    name="sec"
                    value={form.sec}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
                <div className="sell-form-group">
                  <label className="sell-field-label">STL (0.300%)</label>
                  <input
                    name="stl"
                    value={form.stl}
                    readOnly
                    className="sell-form-input calculated"
                  />
                </div>
              </div>
              {/* Step-Up Cost Breakdown Section (for > 100M) */}
              {form.stepUp && (
                <div className="stepup-section">
                  <div className="stepup-header">
                    <h4>Step-Up Cost Breakdown (for Gross Value &gt; Rs. 100 Million)</h4>
                  </div>
                  <div className="stepup-table-wrapper">
                    <table className="stepup-table">
                      <thead>
                        <tr>
                          <th>Portion</th>
                          <th>Value (Rs.)</th>
                          <th>Rate (%)</th>
                          <th>Fees (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>First Rs. 100,000,000</td>
                          <td>{form.stepUp.first100M}</td>
                          <td>1.12</td>
                          <td>{form.stepUp.first100MFees}</td>
                        </tr>
                        <tr>
                          <td>Excess</td>
                          <td>{form.stepUp.excess}</td>
                          <td>0.6125</td>
                          <td>{form.stepUp.excessFees}</td>
                        </tr>
                        <tr className="stepup-total-row">
                          <td colSpan="3"><strong>Total Step-Up Fees</strong></td>
                          <td><strong>{form.stepUp.totalStepUpFees}</strong></td>
                        </tr>
                        <tr className="stepup-grandtotal-row">
                          <td colSpan="3"><strong>Gross Value + Step-Up Fees</strong></td>
                          <td><strong>{form.stepUp.total}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="stepup-note">
                    <em>* Step-up calculation: 1.12% for first Rs. 100M, 0.6125% for excess. Based on official fee structure: Brokerage (0.64%→0.20%), CSE (0.084%→0.0525%), CDS (0.012%→0.0075%), Clearing (0.012%→0.0075%), SEC (0.072%→0.045%), STL (0.300% unchanged).</em>
                  </div>
                </div>
              )}
              {/* Net Value - Highlighted */}
              <div className="sell-net-value-section left-align">
                <div className="sell-net-value-card small">
                  <label className="sell-net-value-label">Net Proceeds (After Fees)</label>
                  <div className="sell-net-value-amount">Rs. {form.netValue || '0.00'}</div>
                  <small className="sell-net-value-note">Amount you will receive</small>
                </div>
              </div>
              
              {/* Section 3 */}
              <div className="sell-section-header">
                <div className="sell-section-icon">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Dates & References</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="tradeDate">Trade Date *</label>
                  <input
                    type="date"
                    id="tradeDate"
                    name="tradeDate"
                    value={form.tradeDate}
                    onChange={handleChange}
                    className={getFieldClassName('tradeDate')}
                  />
                  {errors.tradeDate && <span className="sell-error-text">{errors.tradeDate}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="settlementDate">Settlement Date *</label>
                  <input
                    type="date"
                    id="settlementDate"
                    name="settlementDate"
                    value={form.settlementDate}
                    onChange={handleChange}
                    className={getFieldClassName('settlementDate')}
                  />
                  {errors.settlementDate && <span className="sell-error-text">{errors.settlementDate}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="buyContract">Related Deal Number</label>
                  <select
                    id="buyContract"
                    name="buyContract"
                    value={form.buyContract}
                    onChange={handleChange}
                    className="sell-form-input"
                    disabled={!form.companyName || !form.portfolioName || dealNumbersLoading}
                  >
                    <option value="">
                      {dealNumbersLoading ? 'Loading deal numbers...' : 
                       !form.companyName || !form.portfolioName ? 'Select Company and Portfolio first' :
                       availableDealNumbers.length === 0 ? 'No deal numbers available' :
                       'Select Deal Number'}
                    </option>
                    {availableDealNumbers.map((deal) => (
                      <option key={deal.id} value={deal.value}>
                        {deal.label} (Qty: {deal.quantity}, Price: {deal.price})
                      </option>
                    ))}
                  </select>
                  {availableDealNumbers.length > 0 && (
                    <small className="sell-field-note">
                      {availableDealNumbers.length} deal number(s) available for {form.companyName}
                    </small>
                  )}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="settlementAccount">Receiving Account *</label>
                  <select
                    id="settlementAccount"
                    name="settlementAccount"
                    value={form.settlementAccount}
                    onChange={handleAccountSelect}
                    className={getFieldClassName('settlementAccount')}
                    required
                    disabled={accountsLoading}
                  >
                    <option value="">
                      {accountsLoading ? 'Loading accounts...' : 'Select Account'}
                    </option>
                    {accounts.map(account => (
                      <option key={account.id} value={`${account.account_name} - ${account.account_number}`}>
                        {account.account_name} - {account.account_number} ({account.bank_name})
                      </option>
                    ))}
                  </select>
                  {errors.settlementAccount && <span className="sell-error-text">{errors.settlementAccount}</span>}
                  <small className="sell-field-note">Account where you will receive the sale proceeds</small>
                </div>
                <div className="sell-form-group">
                  <label htmlFor="accountName">Account Name</label>
                  <input
                    type="text"
                    id="accountName"
                    name="accountName"
                    value={form.accountName}
                    onChange={handleChange}
                    className={getFieldClassName('accountName')}
                    placeholder="Enter account holder name"
                  />
                  {errors.accountName && <span className="sell-error-text">{errors.accountName}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="accountNumber">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    className={getFieldClassName('accountNumber')}
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && <span className="sell-error-text">{errors.accountNumber}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="bankName">Bank Name</label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={form.bankName}
                    onChange={handleChange}
                    className={getFieldClassName('bankName')}
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && <span className="sell-error-text">{errors.bankName}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="branchName">Branch Name</label>
                  <input
                    type="text"
                    id="branchName"
                    name="branchName"
                    value={form.branchName}
                    onChange={handleChange}
                    className={getFieldClassName('branchName')}
                    placeholder="Enter branch name"
                  />
                  {errors.branchName && <span className="sell-error-text">{errors.branchName}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="hdays">Holding Days</label>
                  <input
                    type="number"
                    id="hdays"
                    name="hdays"
                    value={form.hdays}
                    onChange={handleChange}
                    className="sell-form-input"
                    placeholder="Days held Auto-calculated"
                    readOnly
                  />
                  <small className="sell-field-note">Automatically calculated</small>
                </div>
              </div>
              {/* Section 4 */}
              <div className="sell-section-header">
                <div className="sell-section-icon calculation">
                  <svg className="sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 className="sell-section-title">Financial Calculations</h3>
              </div>
              <div className="sell-form-grid">
                <div className="sell-form-group">
                  <label htmlFor="costOfFunds">Cost of Funds (After-Tax) (%)</label>
                  <input
                    type="number"
                    id="costOfFunds"
                    name="costOfFunds"
                    value={form.costOfFunds}
                    readOnly
                    className="sell-form-input sell-readonly-input"
                    placeholder="Auto-fetched from Cost of Funds Definition"
                    step="0.01"
                    title="This value is automatically fetched from the active Cost of Funds Definition (after-tax rate)"
                  />
                  <small className="sell-field-note">
                    Automatically fetched from Cost of Funds Definition (after-tax rate)
                  </small>
                </div>
                
                <div className="sell-form-group">
                  <label htmlFor="cp">CP (Closing Price)</label>
                  <input
                    type="number"
                    id="cp"
                    name="cp"
                    value={form.cp}
                    onChange={handleChange}
                    className="sell-form-input sell-disabled-field"
                    placeholder="Closing price"
                    step="0.01"
                    min="0"
                    disabled
                  />
                </div>
              </div>

              {/* Profit / Loss Card */}
              <div className="sell-profit-loss-section">
                <div className="sell-profit-loss-card">
                  <label htmlFor="profitLoss">Net Profit / Loss (LKR)</label>
                  <input
                    type="number"
                    id="profitLoss"
                    name="profitLoss"
                    value={form.profitLoss}
                    onChange={handleChange}
                    className="sell-form-input sell-profit-loss-input"
                    placeholder="Net result"
                    step="0.01"
                    readOnly
                  />
                  <small className="sell-field-note">Capital Gain - Money Generation Cost</small>
                </div>
              </div>

              {/* Actions */}
              <div className="sell-form-actions">
                <button
                  type="button"
                  onClick={handleReset}
                  className="sell-btn sell-btn-secondary"
                  disabled={isSubmitting}
                >
                  <span className="sell-btn-icon">↻</span>
                  Reset Form
                </button>
                <button
                  type="button"
                  className="sell-btn sell-btn-tertiary"
                  onClick={() => setShowListView(true)}
                  disabled={isSubmitting}
                >
                  View Transactions
                </button>
                <button
                  type="submit"
                  className="sell-btn sell-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="sell-btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="sell-btn-icon">✓</span>
                      Record Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="eqt-footer-section">
          <p>  SHERWOOD TECHNOLOGIES (PVT) LTD • Secure transaction recording • All calculations are automated and verified</p>
        </div>
      </div>

      {/* Equity Selector Modal */}
      {showEquitySelector && (
        <SellEquitySelectorModal
          isOpen={showEquitySelector}
          onClose={() => setShowEquitySelector(false)}
          onSelect={handleEquitySelect}
          companies={filteredCompanies}
          selectedCompany={form.companyName}
          loading={companiesLoading}
        />
      )}

    </div>
  );
};

export default SellTransactionEntry;
