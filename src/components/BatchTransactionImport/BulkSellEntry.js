import React, { useState, useEffect } from 'react';
import { equityAPI, portfolioAPI, costOfFundsAPI, transactionEntryAPI, portfolioCostingMethodAPI, tradeSummaryAPI, accountAPI, glAccountMappingAPI, portfolioSettlementMappingAPI } from '../../services/api';
import SellEquitySelectorModal from '../TradeCapture/SellEquitySelectorModal';
import './Styles/BulkSellEntry.css';
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

const BulkSellEntry = () => {
  const [equities, setEquities] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [assignedCostingMethods, setAssignedCostingMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [showEquitySelector, setShowEquitySelector] = useState(false);
  const [totalShares, setTotalShares] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsWithMapping, setAccountsWithMapping] = useState([]); // Accounts that have GL mappings

  // Holidays for date validation
  const [holidays, setHolidays] = useState([]);
  const [dateErrors, setDateErrors] = useState({
    tradeDate: '',
    settlementDate: ''
  });

  const [form, setForm] = useState({
    companyName: '',
    symbol: '',
    portfolio: '',
    portfolioId: '',
    valuationMethod: '',
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
    cp: '',
    buyContract: '',
    profitLoss: '',
    dealNumber: '',
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

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setPortfoliosLoading(true);
        setAccountsLoading(true);
        console.log('Fetching active portfolios...');
        const [equitiesData, portfoliosData, accountsData, mappingData] = await Promise.all([
          equityAPI.getActiveEquities(),
          portfolioAPI.getActivePortfolios(),
          accountAPI.getAllAccounts(),
          glAccountMappingAPI.getAll().catch(() => [])
        ]);
        console.log('Active portfolios fetched:', portfoliosData);
        console.log('Portfolio structure:', portfoliosData[0]); // Log first portfolio structure
        console.log('Accounts fetched:', accountsData);
        setEquities(equitiesData);
        setPortfolios(portfoliosData);
        setAccounts(accountsData);
        
        // Build list of account IDs that have GL mappings
        const mappedAccountIds = [];
        if (mappingData && Array.isArray(mappingData)) {
          mappingData.forEach(mapping => {
            mappedAccountIds.push(mapping.account_id);
          });
        }
        setAccountsWithMapping(mappedAccountIds);
        
        // Fetch cost of funds separately since it has different API
        try {
          const costOfFundsData = await costOfFundsAPI.getActiveCostOfFunds();
          // Set cost of funds in form if available
          if (costOfFundsData && costOfFundsData.after_tax_cost_of_funds) {
            setForm(prev => ({ 
              ...prev, 
              costOfFunds: parseFloat(costOfFundsData.after_tax_cost_of_funds).toFixed(2)
            }));
          }
        } catch (costError) {
          console.log('No active cost of funds found, using default');
        }
        
        // Fetch assigned costing methods
        try {
          const costingMethodsData = await portfolioCostingMethodAPI.getAllAssignedCostingMethods();
          setAssignedCostingMethods(costingMethodsData);
        } catch (costingError) {
          console.log('No assigned costing methods found');
          setAssignedCostingMethods([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Set empty arrays on error to prevent undefined issues
        setEquities([]);
        setPortfolios([]);
      } finally {
        setPortfoliosLoading(false);
        setAccountsLoading(false);
      }
    };

    fetchInitialData();
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
            branchName: mapping.branch_name || ''
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
        const normalizedHolidays = (data || []).map(holiday => {
          const originalDate = holiday.date;

          // Normalize the date and add one day to compensate for timezone shift
          let normalizedDate = normalizeDate(holiday.date, true);

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

  // Fetch companies when portfolio changes
  useEffect(() => {
    if (form.portfolio) {
      setCompaniesLoading(true);
      transactionEntryAPI.getCompaniesByPortfolio(form.portfolio)
        .then(companies => {
          console.log('Companies fetched for portfolio:', companies);
          console.log('First company structure:', companies[0]);
          setFilteredCompanies(companies);
        })
        .catch(() => setFilteredCompanies([]))
        .finally(() => setCompaniesLoading(false));
      // Clear companyName and symbol if portfolio changes
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    } else {
      setFilteredCompanies([]);
      setForm(prev => ({ ...prev, companyName: '', symbol: '' }));
    }
  }, [form.portfolio]);

  // Autofill valuation method when portfolio changes
  useEffect(() => {
    if (form.portfolio && assignedCostingMethods.length > 0) {
      console.log('Portfolio changed, looking for costing method:', form.portfolio);
      console.log('Available costing methods:', assignedCostingMethods);
      
      // Find the portfolioId for the selected portfolio
      const selectedPortfolio = portfolios.find(p => (p.name === form.portfolio) || (p.portfolioName === form.portfolio));
      console.log('Selected portfolio:', selectedPortfolio);
      
      if (selectedPortfolio) {
        const assigned = assignedCostingMethods.find(a => a.portfolioId === (selectedPortfolio.portfolioId || selectedPortfolio.id));
        console.log('Found assigned costing method:', assigned);
        
        if (assigned && assigned.costing_method) {
          console.log('Setting valuation method to:', assigned.costing_method);
          setForm(prev => ({ ...prev, valuationMethod: assigned.costing_method }));
        } else {
          console.log('No costing method found for this portfolio');
          setForm(prev => ({ ...prev, valuationMethod: '' }));
        }
      } else {
        console.log('Portfolio not found in portfolios array');
        setForm(prev => ({ ...prev, valuationMethod: '' }));
      }
    }
  }, [form.portfolio, assignedCostingMethods, portfolios]);

  // Fetch total shares when portfolio and company are selected
  useEffect(() => {
    if (form.portfolio && form.companyName) {
      console.log('Fetching total shares for:', form.portfolio, form.companyName);
      // Fetch total quantity
      transactionEntryAPI.getTotalQuantity(form.portfolio, form.companyName)
        .then(res => {
          console.log('Total shares fetched:', res);
          setTotalShares(res.total_quantity || '');
        })
        .catch(error => {
          console.error('Error fetching total shares:', error);
          setTotalShares('');
        });
    } else {
      setTotalShares('');
    }
  }, [form.portfolio, form.companyName]);

  // Calculate holding days based on buy transaction settlement dates
  useEffect(() => {
    const calculateHoldingDays = async () => {
      if (
        form.portfolio &&
        form.companyName &&
        form.quantity && 
        !isNaN(parseFloat(form.quantity)) && 
        parseFloat(form.quantity) > 0 &&
        form.settlementDate
      ) {
        try {
          const res = await transactionEntryAPI.getDetailedFifoAllocation(
            form.portfolio,
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
  }, [form.portfolio, form.companyName, form.quantity, form.settlementDate]);

  // Calculate Gross Value: Quantity × Sold Price
  useEffect(() => {
    if (form.quantity && form.soldPrice) {
      const grossValue = parseFloat(form.quantity) * parseFloat(form.soldPrice);
      setForm(prev => ({ ...prev, grossValue: grossValue.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, grossValue: '' }));
    }
  }, [form.quantity, form.soldPrice]);

  // Calculate Capital Gain: (Sold Price - Bought Price) × Quantity
  useEffect(() => {
    if (form.soldPrice && form.boughtPrice && form.quantity) {
      const gain = (parseFloat(form.soldPrice) - parseFloat(form.boughtPrice)) * parseFloat(form.quantity);
      setForm(prev => ({ ...prev, capitalGain: gain.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, capitalGain: '' }));
    }
  }, [form.soldPrice, form.boughtPrice, form.quantity]);

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

  // Handle equity selection from modal
  const handleEquitySelect = (companyName) => {
    // Find the equity record to get the symbol
    const selectedEquity = equities.find(equity => equity.company_name === companyName || equity.name === companyName);
    const symbol = selectedEquity ? selectedEquity.symbol : '';
    
    setForm(prev => ({
      ...prev,
      companyName: companyName,
      symbol: symbol
    }));
    
    setShowEquitySelector(false);
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

  const handleInputChange = async (e) => {
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
      return;
    }
    
    // If portfolio changes, clear companyName and symbol (handled by useEffect)
    if (name === 'portfolio') {
      // Autofill portfolioId when portfolio is selected
      const selectedPortfolio = portfolios.find(p => (p.name === value) || (p.portfolioName === value));
      const portfolioId = selectedPortfolio ? (selectedPortfolio.portfolioId || selectedPortfolio.id || '') : '';
      
      // Update form immediately with portfolio and portfolioId
      setForm({ 
        ...form, 
        [name]: value, 
        portfolioId: portfolioId,
        companyName: '',
        symbol: ''
      });
      
      // Fetch portfolio settlement mapping if portfolio is selected (async)
      if (value) {
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
                branchName: mapping.branch_name || ''
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
                branchName: ''
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
              branchName: ''
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
          branchName: ''
        }));
      }
      
      return; // Return early to prevent further processing
    } else {
      let updatedForm = { ...form, [name]: normalizedValue };
      
      // Autofill symbol when companyName changes
      if (name === 'companyName') {
        console.log('Company selected:', value);
        console.log('Searching in equities:', equities.length, 'items');
        // Find the symbol from the equities array using the company name
        const selectedEquity = equities.find(eq => 
          eq.company_name === value || eq.name === value
        );
        console.log('Found equity:', selectedEquity);
        const symbol = selectedEquity ? selectedEquity.symbol : '';
        console.log('Symbol to set:', symbol);
        updatedForm.symbol = symbol;
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
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare form data for API submission
      const submitForm = {
        company_name: form.companyName,
        symbol: form.symbol,
        portfolio_name: form.portfolio,
        portfolioId: form.portfolioId,
        valuation_method: form.valuationMethod,
        contract_number: form.contractNumber,
        quantity: parseFloat(form.quantity),
        sold_price: parseFloat(form.soldPrice),
        bought_price: parseFloat(form.boughtPrice),
        trade_date: form.tradeDate || getToday(),
        settlement_date: form.settlementDate || getToday(),
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
        holding_cost: parseFloat(form.holdingCost) || 0,
        profit_loss: parseFloat(form.profitLoss) || 0,
        total_shares: totalShares
      };
      
      console.log('Submitting bulk sell transaction:', submitForm);

      // Validate dates against holidays before actual submit
      const tradeDateHoliday = isHoliday(form.tradeDate);
      const settlementDateHoliday = isHoliday(form.settlementDate);

      if (tradeDateHoliday) {
        validateDateField('tradeDate', form.tradeDate);
        alert(`${tradeDateHoliday.name} - ${tradeDateHoliday.type}. Please select a business day for Trade Date.`);
        setLoading(false);
        return;
      }

      if (settlementDateHoliday) {
        validateDateField('settlementDate', form.settlementDate);
        alert(`${settlementDateHoliday.name} - ${settlementDateHoliday.type}. Please select a business day for Settlement Date.`);
        setLoading(false);
        return;
      }
      
      // Call the actual API to save the sell transaction
      await transactionEntryAPI.saveSellTransaction(submitForm);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form
      setForm({
        companyName: '',
        symbol: '',
        portfolio: '',
        portfolioId: '',
        valuationMethod: '',
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
        cp: '',
        buyContract: '',
        holdingCost: '',
        profitLoss: '',
        dealNumber: '',
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
    } catch (error) {
      console.error('Error submitting bulk sell transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-sell-page-container">
      <div className="bulk-sell-content-wrapper">
        <header className="bulk-sell-toolbar">
          <div className="bulk-sell-toolbar__left">
            <div className="bulk-sell-toolbar__heading">
              <p className="bulk-sell-toolbar__eyebrow">Trade Capture · Bulk Sell</p>
              <h1 className="bulk-sell-toolbar__title">Bulk Sell Transaction Entry</h1>
              <p className="bulk-sell-toolbar__subtitle">
                Record multiple stock sales with automatic fee, gain and settlement calculations
              </p>
            </div>
          </div>
        </header>

        {showSuccess && (
          <div className="bulk-sell-success-banner">
            <div className="bulk-sell-success-icon">✓</div>
            <span>Bulk sell transactions recorded successfully!</span>
          </div>
        )}

        {(form.grossValue || form.netValue) ? (
          <section className="bulk-sell-live-summary" aria-label="Live calculation summary">
            <div className="bulk-sell-live-kpi">
              <span className="bulk-sell-live-kpi__label">Gross Value</span>
              <span className="bulk-sell-live-kpi__value">
                <span className="bulk-sell-live-kpi__ccy">LKR</span> {formatDisplayMoney(form.grossValue)}
              </span>
            </div>
            <div className="bulk-sell-live-kpi">
              <span className="bulk-sell-live-kpi__label">Capital Gain</span>
              <span
                className={`bulk-sell-live-kpi__value${
                  (parseFloat(form.capitalGain) || 0) > 0
                    ? ' is-positive'
                    : (parseFloat(form.capitalGain) || 0) < 0
                    ? ' is-negative'
                    : ''
                }`}
              >
                <span className="bulk-sell-live-kpi__ccy">LKR</span> {formatDisplayMoney(form.capitalGain)}
              </span>
            </div>
            <div className="bulk-sell-live-kpi bulk-sell-live-kpi--accent">
              <span className="bulk-sell-live-kpi__label">Net Proceeds</span>
              <span className="bulk-sell-live-kpi__value">
                <span className="bulk-sell-live-kpi__ccy">LKR</span> {formatDisplayMoney(form.netValue)}
              </span>
            </div>
          </section>
        ) : null}

        <div className="bulk-sell-form-shell">
            <form onSubmit={handleSubmit} className="bulk-sell-form">
              <section className="bulk-sell-section-card">
              {/* Section 1 - Basic Information */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Basic Information</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Company Name *</label>
                  <div className="bulk-sell-equity-selector">
                    <input
                      name="companyName"
                      value={form.companyName}
                      readOnly
                      required
                      className="bulk-sell-input"
                      placeholder="Click to select company"
                      disabled={companiesLoading || !form.portfolio}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEquitySelector(true)}
                      className="bulk-sell-equity-select-btn"
                      disabled={companiesLoading || !form.portfolio}
                    >
                      <svg className="bulk-sell-equity-select-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Choose Portfolio *</label>
                  <select
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                    required
                    disabled={portfoliosLoading}
                  >
                    <option value="">
                      {portfoliosLoading ? 'Loading portfolios...' : 'Select Portfolio'}
                    </option>
                    {portfolios && portfolios.length > 0 ? (
                      portfolios.map(portfolio => {
                        console.log('Rendering portfolio:', portfolio); // Debug log
                        return (
                          <option key={portfolio.id || portfolio.portfolioId} value={portfolio.name || portfolio.portfolioName}>
                            {portfolio.name || portfolio.portfolioName}
                          </option>
                        );
                      })
                    ) : (
                      !portfoliosLoading && <option value="" disabled>No active portfolios found</option>
                    )}
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Portfolio ID</label>
                  <input
                    type="text"
                    name="portfolioId"
                    value={form.portfolioId}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from portfolio"
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Valuation Method *</label>
                  <input
                    type="text"
                    name="valuationMethod"
                    value={form.valuationMethod}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from portfolio"
                    readOnly
                    required
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Ticker Symbol *</label>
                  <input
                    type="text"
                    name="symbol"
                    value={form.symbol}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Auto-filled from company"
                    required
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Total Shares *</label>
                  <input
                    type="number"
                    name="totalShares"
                    value={totalShares}
                    className="bulk-sell-input"
                    placeholder="Auto-fetched total shares"
                    readOnly
                    required
                    max={totalShares || undefined}
                  />
                  {totalShares && (
                    <small className="bulk-sell-field-note">
                      Available shares for this company
                    </small>
                  )}
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Contract Number</label>
                  <input
                    type="text"
                    name="contractNumber"
                    value={form.contractNumber}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter contract number"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Broker Name *</label>
                  <input
                    type="text"
                    name="brokerName"
                    value={form.brokerName}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter broker name"
                    required
                  />
                </div>

              </div>

            </section>

            <section className="bulk-sell-section-card">
              {/* Section 2 - Transaction Details */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Transaction Details</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Number of shares"
                    required
                    step="1"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    name="soldPrice"
                    value={form.soldPrice}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Price per share"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Gross Value (LKR) *</label>
                  <input
                    type="number"
                    name="grossValue"
                    value={form.grossValue}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-calculated-field"
                    placeholder="Auto-calculated: Quantity × Sold Price"
                    min="0"
                    step="0.01"
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Bought Price (LKR) *</label>
                  <input
                    type="number"
                    name="boughtPrice"
                    value={form.boughtPrice}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Original purchase price"
                    required
                    min="0"
                    step="0.01"
                    readOnly
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Capital Gain (LKR)</label>
                  <input
                    type="number"
                    name="capitalGain"
                    value={form.capitalGain}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-calculated-field"
                    placeholder="Auto-calculated"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Automatically calculated</small>
                </div>
              </div>

            </section>

            <section className="bulk-sell-section-card">
              {/* Cost Breakdown & Calculations Section */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon calculation">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Cost Breakdown & Calculations</h3>
              </div>
              <div className="bulk-sell-fee-structure-note">
                <div className="bulk-sell-fee-structure-info">
                  <svg className="bulk-sell-info-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span><strong>Fee Structure:</strong> ≤100M: 1.12% total | &gt;100M: Reduced rates apply</span>
                </div>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Gross Value (Rs.)</label>
                  <input
                    name="grossValue"
                    value={form.grossValue}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Brokerage (0.64% / 0.20%)</label>
                  <input
                    name="brokerage"
                    value={form.brokerage}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">CSE Fees (0.084% / 0.0525%)</label>
                  <input
                    name="cseFees"
                    value={form.cseFees}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">CDS Fees (0.012% / 0.0075%)</label>
                  <input
                    name="cdsFees"
                    value={form.cdsFees}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Clearing Fees (0.012% / 0.0075%)</label>
                  <input
                    name="clearingFees"
                    value={form.clearingFees}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">SEC (0.072% / 0.045%)</label>
                  <input
                    name="sec"
                    value={form.sec}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
                  />
                </div>
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">STL (0.300%)</label>
                  <input
                    name="stl"
                    value={form.stl}
                    readOnly
                    className="bulk-sell-input bulk-sell-calculated-field"
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
              <div className="bulk-sell-net-value-section left-align">
                <div className="bulk-sell-net-value-card small">
                  <label className="bulk-sell-net-value-label">Net Proceeds (After Fees)</label>
                  <div className="bulk-sell-net-value-amount">
                    <span className="bulk-sell-net-value-currency">LKR</span>
                    {formatDisplayMoney(form.netValue)}
                  </div>
                  <small className="bulk-sell-net-value-note">Amount you will receive</small>
                </div>
              </div>

            </section>

            <section className="bulk-sell-section-card">
              {/* Section 3 - Dates & References */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Dates & References</h3>
              </div>
              <div className="bulk-sell-form-grid">
              <div className="bulk-sell-form-group">
                <label className="bulk-sell-label">Trade Date *</label>
                <input
                  type="date"
                  name="tradeDate"
                  value={form.tradeDate}
                  onChange={handleInputChange}
                  className={`bulk-sell-input ${dateErrors.tradeDate ? 'error' : ''}`}
                  required
                />
                {dateErrors.tradeDate && (
                  <div className="bulk-sell-date-error-message">
                    <svg className="bulk-sell-error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{dateErrors.tradeDate}</span>
                  </div>
                )}
              </div>

              <div className="bulk-sell-form-group">
                <label className="bulk-sell-label">Settlement Date *</label>
                <input
                  type="date"
                  name="settlementDate"
                  value={form.settlementDate}
                  onChange={handleInputChange}
                  className={`bulk-sell-input ${dateErrors.settlementDate ? 'error' : ''}`}
                  required
                />
                {dateErrors.settlementDate && (
                  <div className="bulk-sell-date-error-message">
                    <svg className="bulk-sell-error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{dateErrors.settlementDate}</span>
                  </div>
                )}
              </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Related Deal Number</label>
                  <select
                    name="buyContract"
                    value={form.buyContract}
                    onChange={handleInputChange}
                    className="bulk-sell-select"
                  >
                    <option value="">Select Deal Number</option>
                    {/* Available deal numbers would be populated here */}
                  </select>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Receiving Account *</label>
                  <select
                    name="settlementAccount"
                    value={form.settlementAccount}
                    onChange={handleAccountSelect}
                    className="bulk-sell-select"
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
                  <small className="bulk-sell-field-note">Account where you will receive the sale proceeds</small>
                </div>


                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={form.accountName}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter account holder name"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter account number"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={form.bankName}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Branch Name</label>
                  <input
                    type="text"
                    name="branchName"
                    value={form.branchName}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Enter branch name"
                  />
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Holding Days</label>
                  <input
                    type="number"
                    name="hdays"
                    value={form.hdays}
                    onChange={handleInputChange}
                    className="bulk-sell-input"
                    placeholder="Days held - Auto-calculated"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Automatically calculated</small>
                </div>
              </div>

            </section>

            <section className="bulk-sell-section-card">
              {/* Section 4 - Financial Calculations */}
              <div className="bulk-sell-section-header">
                <div className="bulk-sell-section-icon calculation">
                  <svg className="bulk-sell-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 className="bulk-sell-section-title">Financial Calculations</h3>
              </div>
              <div className="bulk-sell-form-grid">
                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">Cost of Funds (After-Tax) (%)</label>
                  <input
                    type="number"
                    name="costOfFunds"
                    value={form.costOfFunds}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-readonly-input"
                    placeholder="Auto-fetched from Cost of Funds Definition"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">
                    Automatically fetched from Cost of Funds Definition (after-tax rate)
                  </small>
                </div>

                <div className="bulk-sell-form-group">
                  <label className="bulk-sell-label">CP (Closing Price)</label>
                  <input
                    type="number"
                    name="cp"
                    value={form.cp}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-disabled-field"
                    placeholder="Closing price"
                    step="0.01"
                    min="0"
                    disabled
                  />
                </div>

              </div>

              {/* Profit / Loss Card */}
              <div className="bulk-sell-profit-loss-section">
                <div className="bulk-sell-profit-loss-card">
                  <label className="bulk-sell-label">Net Profit / Loss (LKR)</label>
                  <input
                    type="number"
                    name="profitLoss"
                    value={form.profitLoss}
                    onChange={handleInputChange}
                    className="bulk-sell-input bulk-sell-profit-loss-input"
                    placeholder="Net result"
                    step="0.01"
                    readOnly
                  />
                  <small className="bulk-sell-field-note">Capital Gain - Money Generation Cost</small>
                </div>
              </div>

            </section>

              {/* Submit Button */}
              <div className="bulk-sell-form-actions">
                <button
                  type="submit"
                  className="bulk-sell-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Submit Bulk Sell Transactions'}
                </button>
              </div>
            </form>
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

export default BulkSellEntry;
