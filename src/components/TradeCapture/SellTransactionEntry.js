import React, { useState, useEffect } from 'react';
import './Styles/SellTransactionEntry.css';
import { portfolioAPI } from '../../services/api';
import { equityAPI } from '../../services/api';
import { portfolioCostingMethodAPI } from '../../services/api'; // <-- Add this import
import { transactionEntryAPI } from '../../services/api'; // <-- Add this import
import { costOfFundsAPI, tradeSummaryAPI, accountAPI, glAccountMappingAPI, portfolioSettlementMappingAPI } from '../../services/api';
import SellTransactionListView from './SellTransactionListView';
import TransactionDetails from './TransactionDetails';
import SellEquitySelectorModal from './SellEquitySelectorModal';
import holidayService from '../../services/holidayService';

const getToday = () => new Date().toISOString().slice(0, 10);

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

// Function to get today's date string in YYYYMMDD format
const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Function to extract sequence number from deal number
const extractSequenceFromDealNumber = (dealNumber) => {
  // Format: SELL-YYYYMMDD-XXXXXX where XXXXXX is the sequence
  const match = dealNumber.match(/SELL-\d{8}-(\d{6})/);
  return match ? parseInt(match[1], 10) : 0;
};

// Function to generate unique deal numbers with sequential numbering per day for SELL transactions
const generateSellDealNumber = async () => {
  const todayDateString = getTodayDateString();
  const datePrefix = `SELL-${todayDateString}-`;
  
  try {
    // Try to fetch all sell transactions from the backend
    // We'll check for today's transactions to find the max sequence
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/transaction-entries/sell-all`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (response.ok) {
      const transactions = await response.json();
      // Filter transactions for today and extract sequence numbers
      const todayTransactions = (transactions || []).filter(t => {
        if (!t.deal_number) return false;
        return t.deal_number.startsWith(datePrefix);
      });
      
      if (todayTransactions.length > 0) {
        const maxSequence = Math.max(
          ...todayTransactions.map(t => extractSequenceFromDealNumber(t.deal_number))
        );
        const nextSequence = maxSequence + 1;
        return `${datePrefix}${String(nextSequence).padStart(6, '0')}`;
      }
    }
  } catch (error) {
    console.log('Could not fetch sell transactions from backend, using default:', error);
  }
  
  // If no transactions found for today, start from 000001
  return `${datePrefix}000001`;
};

const SellTransactionEntry = ({ setFifoParams, setActiveTab }) => {
  const [form, setForm] = useState({
    
    companyName: '',
    symbol: '', // <-- Add symbol to form state
    portfolioName: '',
    portfolioId: '', // <-- Add this field
    valuationMethod: '', // <-- Added field
    dealNumber: '', // Will be set in useEffect
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
  const [accountsWithMapping, setAccountsWithMapping] = useState([]); // Accounts that have GL mappings
  
  // Add state for available deal numbers
  const [availableDealNumbers, setAvailableDealNumbers] = useState([]);
  const [dealNumbersLoading, setDealNumbersLoading] = useState(false);

  // Holidays for date validation
  const [holidays, setHolidays] = useState([]);
  const [dateErrors, setDateErrors] = useState({
    tradeDate: '',
    settlementDate: ''
  });

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

  // Helper function to check if a date is a holiday
  // For recurring holidays, matches by month and day (ignoring year)
  // For non-recurring holidays, matches exact date
  const isHoliday = (dateString) => {
    if (!dateString || holidays.length === 0) return null;
    
    // Normalize the input date to YYYY-MM-DD format (from HTML date input, should already be YYYY-MM-DD)
    const checkDate = normalizeDate(dateString);
    if (!checkDate) {
      console.warn('Could not normalize date for holiday check:', dateString);
      return null;
    }
    
    // Find matching holiday
    const holiday = holidays.find(h => {
      // Holiday dates are already normalized when fetched, but normalize again to be safe
      const holidayDate = normalizeDate(h.date);
      if (!holidayDate) return false;
      
      // If holiday is recurring, match by month and day (MM-DD)
      if (h.isRecurring) {
        const checkMonthDay = checkDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        const holidayMonthDay = holidayDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        return checkMonthDay === holidayMonthDay;
      }
      
      // For non-recurring holidays, match exact date
      const matches = String(holidayDate) === String(checkDate);
      
      // Debug log for troubleshooting
      if (matches) {
        console.log('Holiday match found:', {
          checkDate,
          holidayDate,
          holidayName: h.name,
          isRecurring: h.isRecurring,
          originalInput: dateString,
          originalHolidayDate: h.date
        });
      }
      
      return matches;
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
    } else {
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
      return true;
    }
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
        // Keep the field empty if no active cost of funds is found
      }
    };

    fetchActiveCostOfFunds();
  }, []);

  // Fetch holidays for date validation on mount
  useEffect(() => {
    holidayService.getAllHolidays()
      .then(data => {
        // Normalize all holiday dates to YYYY-MM-DD format to avoid timezone issues
        // WORKAROUND: Add one day to compensate for timezone shift (dates read as one day early)
        const normalizedHolidays = (data || []).map(holiday => {
          // Store original for debugging
          const originalDate = holiday.date;
          
          // Normalize the date and add one day to compensate for timezone shift
          let normalizedDate = normalizeDate(holiday.date, true); // true = add one day
          
          // If normalization failed, log for debugging
          if (!normalizedDate && holiday.date) {
            console.warn('Could not normalize holiday date:', {
              original: holiday.date,
              type: typeof holiday.date,
              holidayName: holiday.name
            });
            
            // Final fallback: try to extract YYYY-MM-DD pattern from string representation
            const dateStr = String(holiday.date);
            const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
            if (match && match[1]) {
              // Add one day to the extracted date
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
        }).filter(holiday => {
          // Only keep holidays with valid normalized dates
          const isValid = holiday.date && /^\d{4}-\d{2}-\d{2}$/.test(holiday.date);
          if (!isValid) {
            console.warn('Filtered out holiday with invalid date:', holiday);
          }
          return isValid;
        });
        
        setHolidays(normalizedHolidays);
      })
      .catch(err => {
        console.error('Error loading holidays:', err);
        setHolidays([]);
      });
  }, []);

  // Initialize deal number on component mount
  useEffect(() => {
    const initDealNumber = async () => {
      const newDealNumber = await generateSellDealNumber();
      setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
    };
    initDealNumber();
  }, []);

  // Function to regenerate deal number
  const regenerateDealNumber = async () => {
    const newDealNumber = await generateSellDealNumber();
    setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
  };

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
    // Fetch accounts and GL mappings
    Promise.all([
      accountAPI.getAllAccounts().catch(() => []),
      glAccountMappingAPI.getAll().catch(() => [])
    ])
      .then(([accountData, mappingData]) => {
        setAccounts(accountData);
        
        // Build list of account IDs that have GL mappings
        const mappedAccountIds = [];
        if (mappingData && Array.isArray(mappingData)) {
          mappingData.forEach(mapping => {
            mappedAccountIds.push(mapping.account_id);
          });
        }
        setAccountsWithMapping(mappedAccountIds);
      })
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

  // Auto-fill bank account details when portfolio changes
  useEffect(() => {
    const fetchAndFillBankAccount = async () => {
      const currentPortfolio = form.portfolioName;
      
      if (!currentPortfolio) {
        return;
      }

      try {
        console.log('🔄 Sell useEffect: Portfolio changed, fetching mappings...', {
          portfolio: currentPortfolio
        });

        const response = await portfolioSettlementMappingAPI.getAllMappings();
        console.log('🔍 Sell useEffect: Raw API response:', response);

        // Handle different response formats
        let mappings = [];
        if (Array.isArray(response)) {
          mappings = response;
        } else if (response && Array.isArray(response.data)) {
          mappings = response.data;
        } else if (response && response.success && Array.isArray(response.data)) {
          mappings = response.data;
        }

        console.log('📋 Sell useEffect: Processed mappings:', mappings);
        console.log('📝 Sell useEffect: Looking for portfolio name:', currentPortfolio);

        // Try to find mapping by portfolio_name (compare as strings, case-insensitive)
        const mapping = mappings.find(m => {
          const mappingPortfolioName = String(m.portfolio_name || '').trim();
          const searchPortfolioName = String(currentPortfolio || '').trim();
          const matches = mappingPortfolioName.toLowerCase() === searchPortfolioName.toLowerCase();
          console.log(`🔍 Sell useEffect: Comparing portfolio names: "${mappingPortfolioName}" === "${searchPortfolioName}" ? ${matches}`);
          return matches;
        });

        console.log('✅ Sell useEffect: Found mapping:', mapping);

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
          console.log('💾 Sell useEffect: Auto-filling bank account details:', bankAccountData);
          
          setForm(prevForm => {
            // Only update if portfolio hasn't changed (to avoid race conditions)
            if (prevForm.portfolioName === currentPortfolio) {
              console.log('✅ Sell useEffect: Updating form with bank account data');
              return {
                ...prevForm,
                ...bankAccountData
              };
            }
            console.log('⚠️ Sell useEffect: Portfolio changed, skipping update');
            return prevForm;
          });
        } else {
          console.log('❌ Sell useEffect: No mapping found');
        }
      } catch (error) {
        console.error('❌ Sell useEffect: Error fetching portfolio settlement mapping:', error);
      }
    };

    fetchAndFillBankAccount();
  }, [form.portfolioName]);

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
    // Contract Number is now optional - validation removed
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

    // Validate dates against holidays
    const tradeDateHoliday = isHoliday(form.tradeDate);
    const settlementDateHoliday = isHoliday(form.settlementDate);

    if (tradeDateHoliday) {
      validateDateField('tradeDate', form.tradeDate); // Show error message
      newErrors.tradeDate = `${tradeDateHoliday.name} - ${tradeDateHoliday.type}. Please select a business day.`;
    }

    if (settlementDateHoliday) {
      validateDateField('settlementDate', form.settlementDate); // Show error message
      newErrors.settlementDate = `${settlementDateHoliday.name} - ${settlementDateHoliday.type}. Please select a business day.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  // Input handler with non-blocking calculations and no hard caps on quantity
  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Normalize date values to YYYY-MM-DD format to avoid timezone issues
    let normalizedValue = value;
    if ((name === 'tradeDate' || name === 'settlementDate') && value) {
      normalizedValue = normalizeDate(value) || value;
    }
    
    // Broker Name: allow only letters and spaces
    if (name === 'brokerName') {
      normalizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    // Quantity: no negative numbers
    if (name === 'quantity' && (value.startsWith('-') || (value !== '' && parseFloat(value) < 0))) {
      return;
    }
    
    // Selling Price: no negative numbers
    if (name === 'soldPrice' && (value.startsWith('-') || (value !== '' && parseFloat(value) < 0))) {
      return;
    }
    
    // Check for holiday dates BEFORE updating form - prevent selection
    if (name === 'tradeDate' && normalizedValue) {
      const holiday = isHoliday(normalizedValue);
      if (holiday) {
        // Reset to previous valid date or today (ensure it's normalized)
        const previousDate = normalizeDate(form.tradeDate) || getToday();
        e.target.value = previousDate;
        setDateErrors(prev => ({
          ...prev,
          tradeDate: `${holiday.name} - ${holiday.type}. Please select a business day.`
        }));
        return; // Prevent form update
      }
    }
    
    if (name === 'settlementDate' && normalizedValue) {
      const holiday = isHoliday(normalizedValue);
      if (holiday) {
        // Reset to previous valid date or today (ensure it's normalized)
        const previousDate = normalizeDate(form.settlementDate) || getToday();
        e.target.value = previousDate;
        setDateErrors(prev => ({
          ...prev,
          settlementDate: `${holiday.name} - ${holiday.type}. Please select a business day.`
        }));
        return; // Prevent form update
      }
    }
    
    // If portfolioName changes, clear valuationMethod (it will be autofilled by useEffect)
    if (name === 'portfolioName') {
      const selectedPortfolio = portfolios.find(p => p.portfolioName === value);
      const portfolioId = selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '';
      
      // Update form immediately with portfolio and portfolioId
      setForm({
        ...form,
        [name]: value,
        valuationMethod: '',
        portfolioId: portfolioId
      });
      
      // Fetch portfolio settlement mapping if portfolio is selected (async)
      if (value) {
        portfolioSettlementMappingAPI.getAllMappings()
          .then(response => {
            console.log('🔍 Sell: Raw API response:', response);
            
            // Handle different response formats
            let mappings = [];
            if (Array.isArray(response)) {
              mappings = response;
            } else if (response && Array.isArray(response.data)) {
              mappings = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
              mappings = response.data;
            }
            
            console.log('📋 Sell: Processed mappings array:', mappings);
            console.log('📦 Sell: Selected portfolio name:', value);
            
            // Try to find mapping by portfolio_name (compare as strings, case-insensitive)
            const mapping = mappings.find(m => {
              const mappingPortfolioName = String(m.portfolio_name || '').trim();
              const searchPortfolioName = String(value || '').trim();
              const matches = mappingPortfolioName.toLowerCase() === searchPortfolioName.toLowerCase();
              console.log(`🔍 Sell: Comparing portfolio names: "${mappingPortfolioName}" === "${searchPortfolioName}" ? ${matches}`);
              return matches;
            });
            
            console.log('✅ Sell: Found mapping:', mapping);
            
            if (mapping && mapping.account_id) {
              // Auto-fill bank account details from the mapping
              const bankAccountData = {
                settlementAccount: mapping.account_name && mapping.account_number 
                  ? `${mapping.account_name} - ${mapping.account_number}` 
                  : mapping.account_number || '',
                accountName: mapping.account_name || '',
                accountNumber: mapping.account_number || '',
                bankName: mapping.bank_name || '',
                branchName: mapping.branch_name || ''
              };
              console.log('💾 Sell: Auto-filling bank account details:', bankAccountData);
              
              setForm(prevForm => {
                // Only update if portfolio hasn't changed (to avoid race conditions)
                if (prevForm.portfolioName === value) {
                  return {
                    ...prevForm,
                    ...bankAccountData
                  };
                }
                return prevForm;
              });
            } else {
              console.log('❌ Sell: No mapping found for portfolio:', value);
              // Clear bank account fields if no mapping exists
              setForm(prevForm => ({
                ...prevForm,
                settlementAccount: '',
                accountName: '',
                accountNumber: '',
                bankName: '',
                branchName: ''
              }));
            }
          })
          .catch(error => {
            console.error('❌ Sell: Error fetching portfolio settlement mapping:', error);
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
      } else {
        // Clear bank account fields if portfolio is deselected
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
      
      return; // Return early to prevent further processing
    } else {
      // Use normalized value for date fields, original value for others
      let updatedForm = { ...form, [name]: normalizedValue };

      // Autofill symbol when companyName changes
      if (name === 'companyName') {
        const selectedEquity = equities.find(eq => eq.name === value);
        updatedForm.symbol = selectedEquity ? selectedEquity.symbol : '';
      }

      // Auto-set settlement date to 2 business days after trade date (excluding weekends)
      if (name === 'tradeDate' && normalizedValue) {
        let settlementDate = addBusinessDays(normalizedValue, 2);
        
        // Normalize the calculated settlement date
        settlementDate = normalizeDate(settlementDate) || settlementDate;
        
        // Check if the auto-calculated settlement date is a holiday
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loop
        while (isHoliday(settlementDate) && attempts < maxAttempts) {
          // Skip to next business day if settlement date falls on a holiday
          settlementDate = addBusinessDays(settlementDate, 1);
          settlementDate = normalizeDate(settlementDate) || settlementDate;
          attempts++;
        }
        
        updatedForm.settlementDate = settlementDate;
        
        // Clear any previous errors since date is valid
        setDateErrors(prev => ({
          ...prev,
          tradeDate: '',
          settlementDate: ''
        }));
      }

      // Clear error when settlement date is manually changed to a valid date
      if (name === 'settlementDate' && normalizedValue) {
        setDateErrors(prev => ({
          ...prev,
          settlementDate: ''
        }));
      }
      
      // Always update form state immediately to avoid input lag
      setForm(updatedForm);

      // Recalculate only when quantity or soldPrice changes, in the background
      if (name === 'quantity' || name === 'soldPrice') {
        const latestQuantity = name === 'quantity' ? value : updatedForm.quantity;
        const latestSoldPrice = name === 'soldPrice' ? value : updatedForm.soldPrice;

        // If either value is empty, clear calculated fields and skip API
        if (!latestQuantity || !latestSoldPrice) {
          setForm(prev => ({
            ...prev,
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
          }));
        } else {
        try {
          const calc = await tradeSummaryAPI.calculateSellTransaction({
              quantity: latestQuantity,
              soldPrice: latestSoldPrice,
            costOfFunds: updatedForm.costOfFunds,
            holdingDays: updatedForm.hdays || 0
          });

            // Only apply results if quantity/soldPrice haven't changed since we started the call
            setForm(prev => {
              if (prev.quantity !== latestQuantity || prev.soldPrice !== latestSoldPrice) {
                return prev;
              }
              return {
                ...prev,
            grossValue: calc.grossValue,
            brokerage: calc.brokerage,
            cseFees: calc.cseFees,
            cdsFees: calc.cdsFees,
            clearingFees: calc.clearingFees,
            sec: calc.sec,
            stl: calc.stl,
            netValue: calc.netValue,
            stepUp: calc.stepUp,
                moneyGenerationCost: calc.moneyGenerationCost ?? prev.moneyGenerationCost
              };
          });
        } catch (err) {
          console.error('Error calculating sell transaction:', err);
        }
        }
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
      deal_number: form.dealNumber,
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
      // Generate new deal number for next transaction
      const newDealNumber = await generateSellDealNumber();
      setForm(prev => ({ ...prev, dealNumber: newDealNumber }));
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to save sell transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const newDealNumber = await generateSellDealNumber();
    setForm({
      companyName: '',
      symbol: '', // <-- Add to reset
      portfolioName: '',
      portfolioId: '', // <-- Reset this field
      valuationMethod: '', // <-- Added reset
      dealNumber: newDealNumber, // <-- Generate new deal number on reset
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
      {portfolios.map((p, index) => (
        <option key={`portfolio-${p.id}-${index}`} value={p.portfolioName}>{p.portfolioName}</option>
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
                  <label htmlFor="dealNumber">Deal Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      id="dealNumber"
                      name="dealNumber"
                      value={form.dealNumber}
                      readOnly
                      className="sell-form-input"
                      placeholder="Auto-generated"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={regenerateDealNumber}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    >
                      Regenerate
                    </button>
                  </div>
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
                    min="0"
                    value={form.quantity}
                    onChange={handleChange}
                    className={getFieldClassName('quantity')}
                    placeholder="Number of shares"
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
                  <label htmlFor="capitalGain">Capital Gain (LKR)</label>
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
                    className={`${getFieldClassName('tradeDate')} ${dateErrors.tradeDate ? 'error' : ''}`}
                  />
                  {dateErrors.tradeDate && (
                    <div className="sell-date-error-message">
                      <svg className="sell-error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{dateErrors.tradeDate}</span>
                    </div>
                  )}
                  {errors.tradeDate && !dateErrors.tradeDate && <span className="sell-error-text">{errors.tradeDate}</span>}
                </div>
                <div className="sell-form-group">
                  <label htmlFor="settlementDate">Settlement Date *</label>
                  <input
                    type="date"
                    id="settlementDate"
                    name="settlementDate"
                    value={form.settlementDate}
                    onChange={handleChange}
                    className={`${getFieldClassName('settlementDate')} ${dateErrors.settlementDate ? 'error' : ''}`}
                  />
                  {dateErrors.settlementDate && (
                    <div className="sell-date-error-message">
                      <svg className="sell-error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{dateErrors.settlementDate}</span>
                    </div>
                  )}
                  {errors.settlementDate && !dateErrors.settlementDate && <span className="sell-error-text">{errors.settlementDate}</span>}
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
                    {accounts.map(account => {
                      const hasMapping = accountsWithMapping.includes(account.id);
                      return (
                        <option 
                          key={account.id} 
                          value={hasMapping ? `${account.account_name} - ${account.account_number}` : ''}
                          disabled={!hasMapping}
                        >
                          {account.account_name} - {account.account_number} ({account.bank_name})
                          {!hasMapping ? ' - No GL Mapping' : ''}
                        </option>
                      );
                    })}
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
