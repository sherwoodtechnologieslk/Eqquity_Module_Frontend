import React, { useState, useEffect } from 'react';
import './Styles/BulkBuyEntry.css';
import PaymentMethodModal from '../TradeCapture/PaymentMethodModal';
import { equityAPI, portfolioAPI, tradeSummaryAPI, costOfFundsAPI, portfolioSettlementMappingAPI } from '../../services/api';
import EquitySelectorModal from '../TradeCapture/EquitySelectorModal';
import holidayService from '../../services/holidayService';


const getToday = () => new Date().toISOString().slice(0, 10);

const formatDisplayMoney = (value) => {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Function to add business days (excluding weekends)
const addBusinessDays = (dateString, businessDays) => {
  const date = new Date(dateString);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return date.toISOString().slice(0, 10);
};

// Helper function to normalize a date to YYYY-MM-DD format (avoiding timezone issues)
// IMPORTANT: Extract date string directly, never create Date objects to avoid timezone shifts
const normalizeDate = (dateInput, addOneDay = false) => {
  if (!dateInput) return null;
  
  let normalizedDate = null;
  
  // If it's already a string in YYYY-MM-DD format, use it directly
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Check if it's already in the correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      normalizedDate = trimmed;
    } else {
      // Extract YYYY-MM-DD pattern from any string format
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1]) {
        normalizedDate = dateMatch[1];
      }
    }
  }
  // If it's a Date object, extract date part
  else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    // Use local date components to avoid timezone conversion issues
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    normalizedDate = `${year}-${month}-${day}`;
  }
  // For any other type, convert to string and try to extract date
  else {
    const dateStr = String(dateInput).trim();
    const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      normalizedDate = dateMatch[1];
    }
  }
  
  // If we need to add one day (workaround for timezone shift)
  if (normalizedDate && addOneDay) {
    const date = new Date(normalizedDate + 'T12:00:00'); // Use noon to avoid timezone issues
    date.setDate(date.getDate() + 1); // Add one day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return normalizedDate;
};

// Function to generate unique deal numbers for bulk transactions
const generateDealNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `BULK-BUY-${year}${month}${day}-${hour}${minute}${second}`;
};

const BulkBuyEntry = () => {
  // Equities for dropdown
  const [equities, setEquities] = useState([]);
  const [equitiesLoading, setEquitiesLoading] = useState(true);

  // Portfolios for dropdown
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);


  const [form, setForm] = useState({
    companyName: '',
    symbol: '',
    portfolio: '',
    portfolioId: '',
    dealNumber: generateDealNumber(),
    description: '',
    quantity: '',
    price: '',
    grossValue: '',
    brokerage: '',
    cseFees: '',
    cdsFees: '',
    clearingFees: '',
    sec: '',
    stl: '',
    netValue: '',
    contractNumber: '',
    brokerName: '',
    tradeDate: getToday(),
    settlementDate: getToday(),
    settlementAccount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    cashFlowOnSettlement: '',
    paymentMethod: '',
    generatePayment: 'No',
    moneyGenerationCost: '',
    costOfFunds: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [showEquitySelector, setShowEquitySelector] = useState(false);

  // Holidays for date validation
  const [holidays, setHolidays] = useState([]);
  const [dateErrors, setDateErrors] = useState({
    tradeDate: '',
    settlementDate: ''
  });

  // Function to regenerate deal number
  const regenerateDealNumber = () => {
    setForm(prev => ({ ...prev, dealNumber: generateDealNumber() }));
  };

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
      }
    };

    fetchActiveCostOfFunds();
  }, []);

  // Fetch equities for dropdown on mount
  useEffect(() => {
    setEquitiesLoading(true);
    equityAPI.getActiveEquities()
      .then(data => setEquities(data))
      .catch(() => setEquities([]))
      .finally(() => setEquitiesLoading(false));
  }, []);

  // Fetch active portfolios for dropdown on mount
  useEffect(() => {
    setPortfoliosLoading(true);
    portfolioAPI.getActivePortfolios()
      .then(data => setPortfolios(data))
      .catch(() => setPortfolios([]))
      .finally(() => setPortfoliosLoading(false));
  }, []);

  // Auto-fill bank account details when portfolio changes
  useEffect(() => {
    const fetchAndFillBankAccount = async () => {
      const currentPortfolio = form.portfolio;
      
      if (!currentPortfolio) {
        return;
      }

      try {
        const response = await portfolioSettlementMappingAPI.getAllMappings();

        // Handle different response formats
        let mappings = [];
        if (Array.isArray(response)) {
          mappings = response;
        } else if (response && Array.isArray(response.data)) {
          mappings = response.data;
        } else if (response && response.success && Array.isArray(response.data)) {
          mappings = response.data;
        }

        // Try to find mapping by portfolio_name (compare as strings, case-insensitive)
        const mapping = mappings.find(m => {
          const mappingPortfolioName = String(m.portfolio_name || '').trim();
          const searchPortfolioName = String(currentPortfolio || '').trim();
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
          
          setForm(prevForm => {
            // Only update if portfolio hasn't changed (to avoid race conditions)
            if (prevForm.portfolio === currentPortfolio) {
              return {
                ...prevForm,
                ...bankAccountData
              };
            }
            return prevForm;
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio settlement mapping:', error);
      }
    };

    fetchAndFillBankAccount();
  }, [form.portfolio]);

  // Fetch holidays for date validation on mount
  useEffect(() => {
    holidayService.getAllHolidays()
      .then(data => {
        // Normalize all holiday dates to YYYY-MM-DD format to avoid timezone issues
        // WORKAROUND: Add one day to compensate for timezone shift (dates read as one day early)
        const normalizedHolidays = (data || []).map(holiday => {
          const originalDate = holiday.date;

          // Normalize the date and add one day to compensate for timezone shift
          let normalizedDate = normalizeDate(holiday.date, true); // true = add one day

          if (!normalizedDate && holiday.date) {
            const dateStr = String(holiday.date);
            const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
            if (match && match[1]) {
              const date = new Date(match[1] + 'T12:00:00');
              date.setDate(date.getDate() + 1);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              normalizedDate = `${year}-${month}-${day}`;
            }
          }

          return {
            ...holiday,
            date: normalizedDate
          };
        }).filter(holiday => holiday.date && /^\d{4}-\d{2}-\d{2}$/.test(holiday.date));

        setHolidays(normalizedHolidays);
      })
      .catch(err => {
        console.error('Error loading holidays:', err);
        setHolidays([]);
      });
  }, []);

  // Helper function to check if a date is a holiday
  // For recurring holidays, matches by month and day (ignoring year)
  // For non-recurring holidays, matches exact date
  const isHoliday = (dateString) => {
    if (!dateString || holidays.length === 0) return null;

    const checkDate = normalizeDate(dateString);
    if (!checkDate) return null;

    const holiday = holidays.find(h => {
      const holidayDate = normalizeDate(h.date);
      if (!holidayDate) return false;
      
      // If holiday is recurring, match by month and day (MM-DD)
      if (h.isRecurring) {
        const checkMonthDay = checkDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        const holidayMonthDay = holidayDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        return checkMonthDay === holidayMonthDay;
      }
      
      // For non-recurring holidays, match exact date
      return String(holidayDate) === String(checkDate);
    });

    return holiday || null;
  };

  // Helper function to validate a date field
  const validateDateField = (fieldName, dateValue) => {
    const holiday = isHoliday(dateValue);

    if (holiday) {
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: `${holiday.name} - ${holiday.type}. Please select a business day.`
      }));
      return false;
    }

    setDateErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    return true;
  };


  const handleChange = async (e) => {
    const { name, value } = e.target;

    // Normalize date values to YYYY-MM-DD format to avoid timezone issues
    let normalizedValue = value;
    if ((name === 'tradeDate' || name === 'settlementDate') && value) {
      normalizedValue = normalizeDate(value) || value;
    }

    // Check for holiday dates BEFORE updating form - prevent selection
    if (name === 'tradeDate' && normalizedValue) {
      const holiday = isHoliday(normalizedValue);
      if (holiday) {
        const previousDate = normalizeDate(form.tradeDate) || getToday();
        e.target.value = previousDate;
        setDateErrors(prev => ({
          ...prev,
          tradeDate: `${holiday.name} - ${holiday.type}. Please select a business day.`
        }));
        return;
      }
    }

    if (name === 'settlementDate' && normalizedValue) {
      const holiday = isHoliday(normalizedValue);
      if (holiday) {
        const previousDate = normalizeDate(form.settlementDate) || getToday();
        e.target.value = previousDate;
        setDateErrors(prev => ({
          ...prev,
          settlementDate: `${holiday.name} - ${holiday.type}. Please select a business day.`
        }));
        return;
      }
    }

    let updatedForm = { ...form, [name]: normalizedValue };

    // Autofill portfolioId when portfolio name changes
    if (name === 'portfolio') {
      const selectedPortfolio = portfolios.find(p => p.portfolioName === value);
      // Only use the string portfolioId, never the numeric id
      const portfolioId = selectedPortfolio ? selectedPortfolio.portfolioId : '';
      updatedForm.portfolioId = portfolioId;
      
      // Fetch portfolio settlement mapping if portfolio is selected (async)
      if (value) {
        // Set form immediately with portfolio and portfolioId
        setForm(updatedForm);
        
        // Then fetch and update bank account details asynchronously
        portfolioSettlementMappingAPI.getAllMappings()
          .then(response => {
            // Handle different response formats
            let mappings = [];
            if (Array.isArray(response)) {
              mappings = response;
            } else if (response && Array.isArray(response.data)) {
              mappings = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
              mappings = response.data;
            }
            
            // Try to find mapping by portfolio_name (compare as strings, case-insensitive)
            const mapping = mappings.find(m => {
              const mappingPortfolioName = String(m.portfolio_name || '').trim();
              const searchPortfolioName = String(value || '').trim();
              return mappingPortfolioName.toLowerCase() === searchPortfolioName.toLowerCase();
            });
            
            if (mapping && mapping.account_id) {
              // Auto-fill bank account details from the mapping
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
              
              setForm(prevForm => {
                // Only update if portfolio hasn't changed (to avoid race conditions)
                if (prevForm.portfolio === value) {
                  return {
                    ...prevForm,
                    ...bankAccountData
                  };
                }
                return prevForm;
              });
            } else {
              // Clear bank account fields if no mapping exists
              setForm(prevForm => ({
                ...prevForm,
                settlementAccount: '',
                accountName: '',
                accountNumber: '',
                bankName: '',
                branchName: '',
                paymentMethod: ''
              }));
            }
          })
          .catch(error => {
            console.error('Error fetching portfolio settlement mapping:', error);
            // Clear bank account fields on error
            setForm(prevForm => ({
              ...prevForm,
              settlementAccount: '',
              accountName: '',
              accountNumber: '',
              bankName: '',
              branchName: '',
              paymentMethod: ''
            }));
          });
        
        // Return early to prevent double form update
        return;
      } else {
        // Clear bank account fields if portfolio is deselected
        updatedForm = {
          ...updatedForm,
          settlementAccount: '',
          accountName: '',
          accountNumber: '',
          bankName: '',
          branchName: '',
          paymentMethod: ''
        };
      }
    }

    // Autofill symbol when companyName changes
    if (name === 'companyName') {
      const selectedEquity = equities.find(eq => eq.name === value);
      updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
    }

    // Auto-set settlement date to 2 business days after trade date (excluding weekends)
    if (name === 'tradeDate' && normalizedValue) {
      let settlementDate = addBusinessDays(normalizedValue, 2);

      // Normalize calculated settlement date
      settlementDate = normalizeDate(settlementDate) || settlementDate;

      // Skip holidays
      let attempts = 0;
      const maxAttempts = 10;
      while (isHoliday(settlementDate) && attempts < maxAttempts) {
        settlementDate = addBusinessDays(settlementDate, 1);
        settlementDate = normalizeDate(settlementDate) || settlementDate;
        attempts++;
      }

      updatedForm.settlementDate = settlementDate;

      // Clear previous errors for dates
      setDateErrors(prev => ({
        ...prev,
        tradeDate: '',
        settlementDate: ''
      }));
    }

    // Clear error when settlement date is manually changed to a valid date
    if (name === 'settlementDate' && value) {
      setDateErrors(prev => ({
        ...prev,
        settlementDate: ''
      }));
    }

    // If Cost of Funds is cleared, also clear Money Generation Cost
    if (name === 'costOfFunds' && !value.trim()) {
      updatedForm = { ...updatedForm, moneyGenerationCost: '' };
    }

    // Handle payment method selection
    if (name === 'paymentMethod' && value) {
      setSelectedPaymentMethod(value);
      setShowPaymentModal(true);
      // Don't update form yet, wait for account selection
      return;
    }

    // Bulk Buy Logic: Calculate price and fees when quantity and grossValue are entered
    if (name === 'quantity' || name === 'grossValue') {
      try {
        const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(updatedForm.quantity);
        const grossValue = name === 'grossValue' ? parseFloat(value) : parseFloat(updatedForm.grossValue);
        
        // Only calculate if both quantity and grossValue are valid numbers
        if (quantity > 0 && grossValue > 0) {
          // Calculate price from quantity and gross value
          const calculatedPrice = grossValue / quantity;
          
          // Calculate fees using the calculated price
          const calc = await tradeSummaryAPI.calculateBuyTransaction({
            quantity: quantity,
            price: calculatedPrice,
            costOfFunds: updatedForm.costOfFunds
          });
          
          setForm({
            ...updatedForm,
            price: calculatedPrice.toFixed(2), // Set the calculated price
            grossValue: calc.grossValue ? parseFloat(calc.grossValue).toFixed(4) : '',
            brokerage: calc.brokerage ? parseFloat(calc.brokerage).toFixed(4) : '',
            cseFees: calc.cseFees ? parseFloat(calc.cseFees).toFixed(4) : '',
            cdsFees: calc.cdsFees ? parseFloat(calc.cdsFees).toFixed(4) : '',
            clearingFees: calc.clearingFees ? parseFloat(calc.clearingFees).toFixed(4) : '',
            sec: calc.sec ? parseFloat(calc.sec).toFixed(4) : '',
            stl: calc.stl ? parseFloat(calc.stl).toFixed(4) : '',
            netValue: calc.netValue ? parseFloat(calc.netValue).toFixed(4) : '',
            cashFlowOnSettlement: calc.netValue ? parseFloat(calc.netValue).toFixed(4) : '',
            stepUp: calc.stepUp,
            moneyGenerationCost: calc.moneyGenerationCost ? parseFloat(calc.moneyGenerationCost).toFixed(4) : ''
          });
        } else {
          // If either quantity or grossValue is invalid, just update the form
          setForm(updatedForm);
        }
      } catch (err) {
        console.error('Error calculating bulk buy transaction:', err);
        setForm(updatedForm);
      }
    } else {
      setForm(updatedForm);
    }
  };

  // Handle account selection from payment modal
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setForm(prev => ({
      ...prev,
      paymentMethod: selectedPaymentMethod,
      settlementAccount: `${account.accountName} - ${account.accountNumber}`
    }));
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
    // Reset payment method if no account was selected
    if (!selectedAccount) {
      setForm(prev => ({ ...prev, paymentMethod: '' }));
    }
  };

  // Handle equity selection from modal
  const handleEquitySelect = (equity) => {
    setForm(prev => ({
      ...prev,
      companyName: equity.name,
      symbol: equity.symbol
    }));
    setShowEquitySelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields validation
    const requiredFields = [
      'companyName', 'symbol', 'portfolio', 'quantity', 'price', 'contractNumber',
      'brokerName', 'tradeDate', 'settlementDate'
    ];

    const missingFields = requiredFields.filter(field => !form[field].toString().trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Validate dates against holidays
    const tradeDateHoliday = isHoliday(form.tradeDate);
    const settlementDateHoliday = isHoliday(form.settlementDate);

    if (tradeDateHoliday) {
      validateDateField('tradeDate', form.tradeDate);
      alert(`${tradeDateHoliday.name} - ${tradeDateHoliday.type}. Please select a business day for Trade Date.`);
      return;
    }

    if (settlementDateHoliday) {
      validateDateField('settlementDate', form.settlementDate);
      alert(`${settlementDateHoliday.name} - ${settlementDateHoliday.type}. Please select a business day for Settlement Date.`);
      return;
    }

    const today = getToday();
    const submitForm = {
      ...form,
      tradeDate: form.tradeDate || today,
      settlementDate: form.settlementDate || today
    };

    // Debug logging
    console.log('Submitting bulk buy form data:', JSON.stringify(submitForm, null, 2));

    try {
      const result = await tradeSummaryAPI.saveBuyTransaction(submitForm);
      console.log('Save bulk buy transaction result:', result);
      alert('Bulk Buy Transaction submitted successfully!');
      handleReset();
      // Generate new deal number for next transaction
      setForm(prev => ({ ...prev, dealNumber: generateDealNumber() }));
    } catch (err) {
      console.error('Error saving bulk buy transaction:', err);
      alert(`Failed to save bulk buy transaction: ${err.message || 'Unknown error'}`);
    }
  };

  const handleReset = () => {
    setForm({
      companyName: '',
      symbol: '',
      portfolio: '',
      portfolioId: '',
      dealNumber: generateDealNumber(),
      description: '',
      quantity: '',
      price: '',
      grossValue: '',
      brokerage: '',
      cdsFees: '',
      cseFees: '',
      clearingFees: '',
      sec: '',
      stl: '',
      netValue: '',
      contractNumber: '',
      brokerName: '',
      tradeDate: getToday(),
      settlementDate: getToday(),
      settlementAccount: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      cashFlowOnSettlement: '',
      paymentMethod: '',
      generatePayment: 'No',
      moneyGenerationCost: '',
      costOfFunds: ''
    });
    setSelectedAccount(null);
  };

  // Check if Cost of Funds has a value to enable Money Generation Cost field
  const isCostOfFundsEntered = form.costOfFunds && form.costOfFunds.trim() !== '';



  return (
    <div className="bulk-buy-page-container">
      <div className="bulk-buy-content-wrapper">
        <header className="bulk-buy-toolbar">
          <div className="bulk-buy-toolbar__left">
            <div className="bulk-buy-toolbar__heading">
              <p className="bulk-buy-toolbar__eyebrow">Trade Capture · Bulk Buy</p>
              <h1 className="bulk-buy-toolbar__title">Bulk Buy Transaction Entry</h1>
              <p className="bulk-buy-toolbar__subtitle">
                Record bulk equity purchases with automatic fee and settlement calculations
              </p>
            </div>
          </div>
          <div className="bulk-buy-toolbar__actions">
            {form.dealNumber ? (
              <span className="bulk-buy-deal-chip" title="Deal number">{form.dealNumber}</span>
            ) : null}
          </div>
        </header>

        {(form.grossValue || form.netValue) ? (
          <section className="bulk-buy-live-summary" aria-label="Live calculation summary">
            <div className="bulk-buy-live-kpi">
              <span className="bulk-buy-live-kpi__label">Gross Value</span>
              <span className="bulk-buy-live-kpi__value">
                <span className="bulk-buy-live-kpi__ccy">LKR</span> {formatDisplayMoney(form.grossValue)}
              </span>
            </div>
            <div className="bulk-buy-live-kpi">
              <span className="bulk-buy-live-kpi__label">Total Fees</span>
              <span className="bulk-buy-live-kpi__value">
                <span className="bulk-buy-live-kpi__ccy">LKR</span>{' '}
                {formatDisplayMoney(
                  (parseFloat(form.brokerage) || 0) +
                  (parseFloat(form.cseFees) || 0) +
                  (parseFloat(form.cdsFees) || 0) +
                  (parseFloat(form.clearingFees) || 0) +
                  (parseFloat(form.sec) || 0) +
                  (parseFloat(form.stl) || 0)
                )}
              </span>
            </div>
            <div className="bulk-buy-live-kpi bulk-buy-live-kpi--accent">
              <span className="bulk-buy-live-kpi__label">Net Value</span>
              <span className="bulk-buy-live-kpi__value">
                <span className="bulk-buy-live-kpi__ccy">LKR</span> {formatDisplayMoney(form.netValue)}
              </span>
            </div>
          </section>
        ) : null}

        <div className="bulk-buy-form-shell">
            <form onSubmit={handleSubmit} className="bulk-buy-form">
              <section className="bulk-buy-section-card">
          {/* Security & Trade Information */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Security & Trade Information</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Company Name *</label>
                <div className="bulk-buy-equity-selector">
                  <input
                    name="companyName"
                    value={form.companyName}
                    readOnly
                    required
                    className="bulk-buy-form-input"
                    placeholder="Click to select company"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEquitySelector(true)}
                    className="bulk-buy-equity-select-btn"
                    disabled={equitiesLoading}
                  >
                    <svg className="bulk-buy-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    Select
                  </button>
                </div>
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Ticker Symbol *</label>
                <input
                  name="symbol"
                  value={form.symbol}
                  readOnly
                  required
                  className="bulk-buy-form-input"
                  placeholder="Auto-filled from company"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Choose Portfolio *</label>
                <select
                  name="portfolio"
                  value={form.portfolio}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                  disabled={portfoliosLoading}
                >
                  <option value="">
                    {portfoliosLoading
                      ? 'Loading portfolios...'
                      : portfolios.length === 0
                        ? 'No active portfolios found'
                        : 'Select Portfolio'}
                  </option>
                  {portfolios.map(portfolio => (
                    <option key={portfolio.id} value={portfolio.portfolioName}>
                      {portfolio.portfolioName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Portfolio ID</label>
                <input
                  name="portfolioId"
                  value={form.portfolioId}
                  readOnly
                  className="bulk-buy-form-input"
                  placeholder="Auto-filled from portfolio"
                />
              </div>
            </div>
          </div>

            </section>

            <section className="bulk-buy-section-card">
          {/* Transaction Details */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Transaction Details</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Quantity Purchased *</label>
                <input
                  name="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Bought Price (Rs.) *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Auto-calculated from quantity and gross value"
                  value={form.price}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Contract Number</label>
                <input
                  name="contractNumber"
                  placeholder="Enter contract number"
                  value={form.contractNumber}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Broker Name *</label>
                <input
                  name="brokerName"
                  placeholder="Enter broker name"
                  value={form.brokerName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Deal Number</label>
                <div className="bulk-buy-deal-number-container">
                  <input
                    name="dealNumber"
                    value={form.dealNumber}
                    readOnly
                    className="bulk-buy-form-input bulk-buy-deal-number-input"
                    placeholder="Auto-generated"
                  />
                  <button
                    type="button"
                    onClick={regenerateDealNumber}
                    className="bulk-buy-btn bulk-buy-btn-tertiary bulk-buy-regenerate-deal-number-btn"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Description</label>
                <input
                  name="description"
                  placeholder="Enter description (optional)"
                  value={form.description}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Trade Date *</label>
                <input
                  type="date"
                  name="tradeDate"
                  value={form.tradeDate}
                  onChange={handleChange}
                  className={`bulk-buy-form-input ${dateErrors.tradeDate ? 'error' : ''}`}
                />
                {dateErrors.tradeDate && (
                  <div className="bulk-buy-date-error-message">
                    <svg className="bulk-buy-error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{dateErrors.tradeDate}</span>
                  </div>
                )}
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Settlement Date *</label>
                <input
                  type="date"
                  name="settlementDate"
                  value={form.settlementDate}
                  onChange={handleChange}
                  className={`bulk-buy-form-input ${dateErrors.settlementDate ? 'error' : ''}`}
                />
                {dateErrors.settlementDate && (
                  <div className="bulk-buy-date-error-message">
                    <svg className="bulk-buy-error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{dateErrors.settlementDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>


            </section>

            <section className="bulk-buy-section-card">
          {/* Cost Breakdown & Calculations */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon calculation">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Cost Breakdown & Calculations</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-fee-structure-note">
              <div className="bulk-buy-fee-structure-info">
                <svg className="bulk-buy-info-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <span><strong>Fee Structure:</strong> ≤100M: 1.12% total | &gt;100M: Reduced rates apply</span>
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Gross Value (Rs.)</label>
                <input
                  name="grossValue"
                  type="number"
                  step="0.01"
                  placeholder="Enter gross value"
                  value={form.grossValue}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Brokerage (0.64% / 0.20%)</label>
                <input
                  name="brokerage"
                  type="number"
                  step="0.0001"
                  value={form.brokerage}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">CSE Fees (0.084% / 0.0525%)</label>
                <input
                  name="cseFees"
                  type="number"
                  step="0.0001"
                  value={form.cseFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">CDS Fees (0.012% / 0.0075%)</label>
                <input
                  name="cdsFees"
                  type="number"
                  step="0.0001"
                  value={form.cdsFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Clearing Fees (0.012% / 0.0075%)</label>
                <input
                  name="clearingFees"
                  type="number"
                  step="0.0001"
                  value={form.clearingFees}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">SEC (0.072% / 0.045%)</label>
                <input
                  name="sec"
                  type="number"
                  step="0.0001"
                  value={form.sec}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">STL (0.300%)</label>
                <input
                  name="stl"
                  type="number"
                  step="0.0001"
                  value={form.stl}
                  readOnly
                  className="bulk-buy-form-input calculated"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                {/* Empty field to maintain grid alignment */}
              </div>
            </div>
            {/* Step-Up Cost Breakdown Section (for > 100M) */}
            {form.stepUp && (
              <div className="bulk-buy-stepup-section">
                <div className="bulk-buy-stepup-header">
                  <h4>Step-Up Cost Breakdown (for Gross Value &gt; Rs. 100 Million)</h4>
                </div>
                <div className="bulk-buy-stepup-table-wrapper">
                  <table className="bulk-buy-stepup-table">
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
                      <tr className="bulk-buy-stepup-total-row">
                        <td colSpan="3"><strong>Total Step-Up Fees</strong></td>
                        <td><strong>{form.stepUp.totalStepUpFees}</strong></td>
                      </tr>
                      <tr className="bulk-buy-stepup-grandtotal-row">
                        <td colSpan="3"><strong>Gross Value + Step-Up Fees</strong></td>
                        <td><strong>{form.stepUp.total}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bulk-buy-stepup-note">
                  <em>* Step-up calculation: 1.12% for first Rs. 100M, 0.6125% for excess. Based on official fee structure: Brokerage (0.64%→0.20%), CSE (0.084%→0.0525%), CDS (0.012%→0.0075%), Clearing (0.012%→0.0075%), SEC (0.072%→0.045%), STL (0.300% unchanged).</em>
                </div>
              </div>
            )}
            {/* Net Value - Highlighted */}
            <div className="bulk-buy-net-value-section left-align">
              <div className="bulk-buy-net-value-card small">
                <label className="bulk-buy-net-value-label">Total Net Value</label>
                <div className="bulk-buy-net-value-amount">
                  <span className="bulk-buy-net-value-currency">LKR</span>
                  {formatDisplayMoney(form.netValue)}
                </div>
              </div>
            </div>
          </div>

            </section>

            <section className="bulk-buy-section-card">
          {/* Settlement Information */}
          <div className="bulk-buy-section-header">
            <div className="bulk-buy-section-icon payment">
              <svg className="bulk-buy-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="bulk-buy-section-title">Settlement Information</h3>
          </div>
          <div className="bulk-buy-section">
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Settlement Account *</label>
                <input
                  name="settlementAccount"
                  placeholder="Enter settlement account"
                  value={form.settlementAccount}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                  required
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Account Name</label>
                <input
                  name="accountName"
                  placeholder="Enter account holder name"
                  value={form.accountName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Account Number</label>
                <input
                  name="accountNumber"
                  placeholder="Enter account number"
                  value={form.accountNumber}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Bank Name</label>
                <input
                  name="bankName"
                  placeholder="Enter bank name"
                  value={form.bankName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Branch Name</label>
                <input
                  name="branchName"
                  placeholder="Enter branch name"
                  value={form.branchName}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Cash Flow on Settlement</label>
                <input
                  name="cashFlowOnSettlement"
                  placeholder="Enter cash flow on settlement"
                  value={form.cashFlowOnSettlement}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                >
                  <option value="">Select Payment Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Banking">Online Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
                {selectedAccount && (
                  <div className="bulk-buy-selected-account-info">
                    <div className="bulk-buy-account-info-header">
                      <svg className="bulk-buy-account-info-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd"/>
                      </svg>
                      <span>Selected Account</span>
                    </div>
                    <div className="bulk-buy-account-info-details">
                      <div><strong>Account:</strong> {selectedAccount.accountName}</div>
                      <div><strong>Number:</strong> {selectedAccount.accountNumber}</div>
                      <div><strong>Bank:</strong> {selectedAccount.bankName}</div>
                      <div><strong>Branch:</strong> {selectedAccount.branch}</div>
                    </div>
                    <button 
                      type="button" 
                      className="bulk-buy-change-account-btn"
                      onClick={() => {
                        setSelectedAccount(null);
                        setForm(prev => ({ ...prev, paymentMethod: '', settlementAccount: '' }));
                      }}
                    >
                      Change Account
                    </button>
                  </div>
                )}
              </div>
              <div className="bulk-buy-field-wrapper">
                {/* Empty field to maintain grid alignment */}
              </div>
            </div>
            <div className="bulk-buy-field-group">
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Cost of Funds (%)</label>
                <input
                  name="costOfFunds"
                  type="number"
                  step="0.01"
                  placeholder="Enter cost of funds percentage"
                  value={form.costOfFunds}
                  onChange={handleChange}
                  className="bulk-buy-form-input"
                />
              </div>
              <div className="bulk-buy-field-wrapper">
                <label className="bulk-buy-field-label">Money Generation Cost (Rs.)</label>
                <input
                  name="moneyGenerationCost"
                  value={form.moneyGenerationCost}
                  readOnly
                  className="bulk-buy-form-input"
                  placeholder={isCostOfFundsEntered ? "Auto-calculated" : "Enter cost of funds first"}
                  disabled={!isCostOfFundsEntered}
                />
              </div>
            </div>
          </div>
            </section>

              {/* Form Actions */}
              <div className="bulk-buy-button-section">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bulk-buy-btn bulk-buy-btn-secondary"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="bulk-buy-btn bulk-buy-btn-primary"
                >
                  Submit Bulk Buy Transaction
                </button>
              </div>
            </form>
        </div>
      </div>

      {/* Modals */}
      {showEquitySelector && (
        <EquitySelectorModal
          isOpen={showEquitySelector}
          onClose={() => setShowEquitySelector(false)}
          onSelect={handleEquitySelect}
          selectedEquity={equities.find(eq => eq.name === form.companyName)}
        />
      )}

      {showPaymentModal && (
        <PaymentMethodModal
          paymentMethod={selectedPaymentMethod}
          onClose={handlePaymentModalClose}
          onSelectAccount={handleAccountSelect}
        />
      )}
    </div>
  );
};

export default BulkBuyEntry;
