import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Styles/NewGLAccount.css';
import { accountAPI, chartOfAccountsAPI, glAccountMappingAPI, glAccountAPI, accountCategoryAPI, customAccountTypeAPI } from '../../services/api';

const NewGLAccount = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('newGLAccount'); // 'newGLAccount', 'accountCategory', 'glMapping', or 'journalEntry'
  
  const [formData, setFormData] = useState({
    accountCode: '',
    accountCodePart1: '', // First 3 digits (Category + Subcategory)
    accountCodePart2: '', // Second 3 digits (Branch)
    accountCodePart3: '', // Third 3 digits (Transaction type)
    accountCodePart4: '', // Fourth 3 digits (Account Name)
    accountCodePart5: '', // Last 2 digits (44 or 54)
    description: '',
    accountType: '',
    parentAccount: '',
    activeStatus: 'Yes',
    accountCategory: '',
    transactionType: '',
    normalBalance: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');

  // Account Category Management states
  const [categoryInputs, setCategoryInputs] = useState({}); // { accountType: 'new category name' }
  const [categoryNumberInputs, setCategoryNumberInputs] = useState({}); // { accountType: '01' }
  const [editingCategory, setEditingCategory] = useState({}); // { accountType: { oldName: 'newName', oldNumber: '01', newNumber: '01' } }
  const [customAccountTypes, setCustomAccountTypes] = useState([]); // Array of custom account types: [{ value: 'custom1', label: 'Custom 1' }]
  const [newAccountTypeName, setNewAccountTypeName] = useState('');
  const [newAccountTypeCode, setNewAccountTypeCode] = useState('');

  // GL Mapping states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [mappings, setMappings] = useState({}); // { bankAccountId: glAccountCode }
  const [loading, setLoading] = useState(false);
  const [mappingErrors, setMappingErrors] = useState({});
  const [coaSearchByAccount, setCoaSearchByAccount] = useState({}); // { bankAccountId: term }
  const [showCoaListByAccount, setShowCoaListByAccount] = useState({}); // { bankAccountId: boolean }
  const [coaDropdownPosByAccount, setCoaDropdownPosByAccount] = useState({}); // { id: {left, top, width} }

  const updateDropdownPosition = (accountId, inputEl) => {
    if (!inputEl || typeof window === 'undefined') return;
    const rect = inputEl.getBoundingClientRect();
    setCoaDropdownPosByAccount(prev => ({
      ...prev,
      [accountId]: { left: rect.left, top: rect.bottom, width: rect.width }
    }));
  };

  // Account type options based on existing chart of accounts
  const baseAccountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];
  
  // Combine base and custom account types
  const accountTypes = [...baseAccountTypes, ...customAccountTypes];

  // Account categories for better organization (loaded from database)
  const [accountCategories, setAccountCategories] = useState({});
  const [categoryIds, setCategoryIds] = useState({}); // Store category IDs for updates/deletes: { accountType: { categoryName: id } }
  const [categoryNumbers, setCategoryNumbers] = useState({}); // Store category numbers: { accountType: { categoryName: number } }
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Transaction types under each category: { accountType: { categoryName: [{ name: 'Type 1', code: '001' }, ...] } }
  const [accountNames, setAccountNames] = useState({});
  // Input state for adding new transaction types: { accountType: { categoryName: 'new transaction type' } }
  const [accountNameInputs, setAccountNameInputs] = useState({});
  // Input state for transaction type codes: { accountType: { categoryName: '001' } }
  const [accountNameCodes, setAccountNameCodes] = useState({});
  // Editing state for transaction types: { accountType: { categoryName: { oldName: 'newName', oldCode: '001', newCode: '001' } } }
  const [editingAccountNames, setEditingAccountNames] = useState({});

  // Generate suggested account code based on type and category
  const generateAccountCode = (type, category) => {
    const codeMap = {
      asset: '1',
      liability: '2',
      equity: '3',
      revenue: '4',
      expense: '5',
      bank: '1',
      investment: '1'
    };

    const baseCode = codeMap[type] || '1';
    const randomSuffix1 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const randomSuffix2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const randomSuffix3 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const ending = '44';
    return `${baseCode}${randomSuffix1}-${randomSuffix2}-${randomSuffix3}-001-${ending}`;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle account code parts separately
    if (name.startsWith('accountCodePart')) {
      // Only allow digits and limit length
      const numericValue = value.replace(/\D/g, '').slice(0, name === 'accountCodePart5' ? 2 : 3);
      setFormData(prev => {
        const updated = {
          ...prev,
          [name]: numericValue
        };
        // Combine parts into full account code
        const part1 = updated.accountCodePart1 || '';
        const part2 = updated.accountCodePart2 || '';
        const part3 = updated.accountCodePart3 || '';
        const part4 = updated.accountCodePart4 || '';
        const part5 = updated.accountCodePart5 || '';
        updated.accountCode = [part1, part2, part3, part4, part5].filter(p => p).join('-');
        return updated;
      });
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear transaction type when account type or category changes
    if (name === 'accountType') {
      setFormData(prev => ({
        ...prev,
        accountCategory: '',
        transactionType: '',
        accountCodePart1: '',
        accountCodePart3: ''
      }));
    } else if (name === 'accountCategory') {
      setFormData(prev => ({
        ...prev,
        transactionType: '',
        accountCodePart3: ''
      }));
    }

    // Auto-fill account code part 1 (Category + Subcategory) when account type and category are selected
    if (name === 'accountType' || name === 'accountCategory') {
      const newType = name === 'accountType' ? value : formData.accountType;
      const newCategory = name === 'accountCategory' ? value : formData.accountCategory;
      
      // If both type and category are selected, auto-fill the first 3 digits
      if (newType && newCategory && categoryNumbers[newType]?.[newCategory]) {
        const categoryNumber = categoryNumbers[newType][newCategory];
        // category_number stores the full 3-digit first segment (e.g., 101, 201, 801)
        setFormData(prev => {
          const updated = {
            ...prev,
            accountCodePart1: categoryNumber
          };
          // Update the full account code
          const part1 = updated.accountCodePart1 || '';
          const part2 = updated.accountCodePart2 || '';
          const part3 = updated.accountCodePart3 || '';
          const part4 = updated.accountCodePart4 || '';
          const part5 = updated.accountCodePart5 || '';
          updated.accountCode = [part1, part2, part3, part4, part5].filter(p => p).join('-');
          return updated;
        });
      } else if (!newType || !newCategory) {
        // If account type or category is cleared, clear part 1
        setFormData(prev => {
          const updated = {
            ...prev,
            accountCodePart1: ''
          };
          const part1 = updated.accountCodePart1 || '';
          const part2 = updated.accountCodePart2 || '';
          const part3 = updated.accountCodePart3 || '';
          const part4 = updated.accountCodePart4 || '';
          const part5 = updated.accountCodePart5 || '';
          updated.accountCode = [part1, part2, part3, part4, part5].filter(p => p).join('-');
          return updated;
        });
      }
    }

    // Auto-fill account code part 3 (Transaction Type) when transaction type is selected
    if (name === 'transactionType') {
      const accountType = formData.accountType;
      const accountCategory = formData.accountCategory;
      const selectedTransactionType = value;
      
      console.log('🔍 Frontend - Transaction Type selected:', selectedTransactionType);
      
      if (accountType && accountCategory && selectedTransactionType) {
        // Find the transaction type code from accountNames
        const transactionTypes = accountNames[accountType]?.[accountCategory] || [];
        const transactionTypeObj = transactionTypes.find(t => {
          const typeName = typeof t === 'string' ? t : t.name;
          return typeName === selectedTransactionType;
        });
        
        if (transactionTypeObj) {
          const transactionTypeCode = typeof transactionTypeObj === 'string' ? null : transactionTypeObj.code;
          if (transactionTypeCode) {
            setFormData(prev => {
              const updated = {
                ...prev,
                transactionType: selectedTransactionType, // Explicitly set transactionType
                accountCodePart3: transactionTypeCode
              };
              // Update the full account code
              const part1 = updated.accountCodePart1 || '';
              const part2 = updated.accountCodePart2 || '';
              const part3 = updated.accountCodePart3 || '';
              const part4 = updated.accountCodePart4 || '';
              const part5 = updated.accountCodePart5 || '';
              updated.accountCode = [part1, part2, part3, part4, part5].filter(p => p).join('-');
              console.log('🔍 Frontend - Updated formData.transactionType:', updated.transactionType);
              return updated;
            });
          }
        }
      } else if (!selectedTransactionType) {
        // If transaction type is cleared, clear part 3
        setFormData(prev => {
          const updated = {
            ...prev,
            transactionType: '', // Explicitly clear transactionType
            accountCodePart3: ''
          };
          const part1 = updated.accountCodePart1 || '';
          const part2 = updated.accountCodePart2 || '';
          const part3 = updated.accountCodePart3 || '';
          const part4 = updated.accountCodePart4 || '';
          const part5 = updated.accountCodePart5 || '';
          updated.accountCode = [part1, part2, part3, part4, part5].filter(p => p).join('-');
          return updated;
        });
      }
    }
      
    // Generate suggested code when type or category changes (for display only, don't auto-fill)
    if (name === 'accountType' || name === 'accountCategory') {
      const newType = name === 'accountType' ? value : formData.accountType;
      const newCategory = name === 'accountCategory' ? value : formData.accountCategory;
      if (newType) {
        const suggested = generateAccountCode(newType, newCategory);
        setSuggestedCode(suggested);
        // Don't auto-populate parts from suggested code - only Part 1 and Part 3 are auto-filled from dropdown selections
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Validate account code parts
    if (!formData.accountCodePart1 || formData.accountCodePart1.length !== 3) {
      newErrors.accountCode = 'Category + Subcategory (first 3 digits) is required';
    } else if (!formData.accountCodePart2 || formData.accountCodePart2.length !== 3) {
      newErrors.accountCode = 'Branch (second 3 digits) is required';
    } else if (!formData.accountCodePart3 || formData.accountCodePart3.length !== 3) {
      newErrors.accountCode = 'Transaction Type (third 3 digits) is required';
    } else if (!formData.accountCodePart4 || formData.accountCodePart4.length !== 3) {
      newErrors.accountCode = 'Account Name (fourth 3 digits) is required';
    } else if (!formData.accountCodePart5 || formData.accountCodePart5.length !== 2) {
      newErrors.accountCode = 'Ending (last 2 digits) is required';
    } else if (!/^\d{3}-\d{3}-\d{3}-\d{3}-\d{2}$/.test(formData.accountCode)) {
      newErrors.accountCode = 'Account Code must follow format: XXX-XXX-XXX-XXX-XX';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Account Type is required';
    }

    if (!formData.accountCategory) {
      newErrors.accountCategory = 'Account Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const accountData = {
        accountCode: formData.accountCode,
        description: formData.description,
        accountType: formData.accountType,
        accountCategory: formData.accountCategory,
        normalBalance: formData.normalBalance,
        parentAccount: formData.parentAccount || null,
        activeStatus: formData.activeStatus,
        transactionType: formData.transactionType || null
      };

      console.log('🚀 Frontend - Submitting GL Account with transactionType:', formData.transactionType);
      console.log('🚀 Frontend - Full accountData being sent:', JSON.stringify(accountData, null, 2));

      // Call the API to create GL account
      await glAccountAPI.create(accountData);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          accountCode: '',
          accountCodePart1: '',
          accountCodePart2: '',
          accountCodePart3: '',
          accountCodePart4: '',
          accountCodePart5: '',
          description: '',
          accountType: '',
          parentAccount: '',
          activeStatus: 'Yes',
          accountCategory: '',
          transactionType: '',
          normalBalance: ''
        });
        setSuggestedCode('');
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating GL account:', error);
      setIsSubmitting(false);
      
      // Parse error message from response
      let errorMessage = 'Failed to create GL account. Please try again.';
      
      // Try to extract the actual error message from the backend
      if (error.message) {
        // Check if it's a specific error code
        if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = 'An account with this code already exists. Please use a different account code.';
        } else if (error.message.includes('400') || error.message.includes('Invalid account code format')) {
          // Use the backend's error message if available
          if (error.message.includes('Invalid account code format')) {
            errorMessage = error.message;
          } else {
            errorMessage = 'Invalid account code format. Must follow pattern: XXX-XXX-XXX-XXX-XX (e.g., 101-101-555-001-44)';
          }
        } else if (error.message.includes('required')) {
          errorMessage = error.message;
        } else {
          // Use the error message directly if it's informative
          errorMessage = error.message;
        }
      }
      
      // Set error for accountCode field
      setErrors({ accountCode: errorMessage });
      
      // Also show alert for visibility
      alert(errorMessage);
    }
  };

  // Handle reset form
  const handleReset = () => {
    setFormData({
      accountCode: '',
      accountCodePart1: '',
      accountCodePart2: '',
      accountCodePart3: '',
      accountCodePart4: '',
      accountCodePart5: '',
      description: '',
      accountType: '',
      parentAccount: '',
      activeStatus: 'Yes',
      accountCategory: '',
      transactionType: '',
      normalBalance: ''
    });
    setErrors({});
    setSuggestedCode('');
    setShowSuccess(false);
  };

  // Use suggested code
  const useSuggestedCode = () => {
    // Parse suggested code and populate all parts
    const parts = suggestedCode.split('-');
    if (parts.length === 5) {
      setFormData(prev => ({
        ...prev,
        accountCodePart1: parts[0],
        accountCodePart2: parts[1],
        accountCodePart3: parts[2],
        accountCodePart4: parts[3],
        accountCodePart5: parts[4],
        accountCode: suggestedCode
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        accountCode: suggestedCode
      }));
    }
    if (errors.accountCode) {
      setErrors(prev => ({
        ...prev,
        accountCode: ''
      }));
    }
  };

  // Account Category Management Handlers
  const handleCategoryInputChange = (accountType, value) => {
    setCategoryInputs(prev => ({
      ...prev,
      [accountType]: value
    }));
  };

  const handleAddCategory = (accountType) => {
    const newCategory = categoryInputs[accountType]?.trim();
    if (!newCategory) {
      alert('Please enter a category name');
      return;
    }

    if (accountCategories[accountType]?.includes(newCategory)) {
      alert('This category already exists');
      return;
    }

    // Get the raw input value
    const rawCategoryNumber = categoryNumberInputs[accountType];
    let categoryNumber = null;
    
    if (rawCategoryNumber && rawCategoryNumber.trim()) {
      // Remove any non-digit characters
      const cleaned = rawCategoryNumber.replace(/\D/g, '');
      
      if (cleaned.length > 0) {
        // Take only first 2 digits
        const digits = cleaned.slice(0, 2);
        
        // Pad with leading zero if it's a single digit (e.g., "1" becomes "01")
        if (digits.length === 1) {
          categoryNumber = '0' + digits;
        } else if (digits.length === 2) {
          categoryNumber = digits;
        }
        
        // Validate the number is between 00 and 99
        const numValue = parseInt(categoryNumber, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 99) {
          alert('Category number must be between 00 and 99');
          return;
        }
      }
    }
    
    // Get the account type prefix (first digit)
    let typePrefix = '';
    if (accountType === 'asset') typePrefix = '1';
    else if (accountType === 'liability') typePrefix = '2';
    else if (accountType === 'equity') typePrefix = '8';
    else if (accountType === 'revenue') typePrefix = '3';
    else if (accountType === 'expense') typePrefix = '6';
    else {
      // For custom account types, get from accountTypes array
      const customType = accountTypes.find(t => t.value === accountType);
      if (customType && customType.codePrefix) {
        typePrefix = customType.codePrefix.charAt(0);
      }
    }

    // Combine type prefix with category number to create full first segment (3 digits)
    const fullCategoryNumber = categoryNumber && typePrefix ? `${typePrefix}${categoryNumber}` : null;

    // Check if this category_number is already used by another sub-category in the same account_type
    if (fullCategoryNumber) {
      const existingCategories = accountCategories[accountType] || [];
      for (const existingCat of existingCategories) {
        const existingCatNumber = categoryNumbers[accountType]?.[existingCat];
        if (existingCatNumber === fullCategoryNumber) {
          alert(`Category number "${fullCategoryNumber}" is already used by "${existingCat}" in ${accountType}. Please use a different category number.`);
          return;
        }
      }
    }

    // Update local state only (NO database save)
    setAccountCategories(prev => ({
      ...prev,
      [accountType]: [...(prev[accountType] || []), newCategory]
    }));

    // Store a temporary ID for local reference (not from database)
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    setCategoryIds(prev => ({
      ...prev,
      [accountType]: {
        ...(prev[accountType] || {}),
        [newCategory]: tempId
      }
    }));

    // Store the full 3-digit category number (e.g., "101", "201", "801")
    if (fullCategoryNumber) {
      setCategoryNumbers(prev => ({
        ...prev,
        [accountType]: {
          ...(prev[accountType] || {}),
          [newCategory]: fullCategoryNumber
        }
      }));
    }

    setCategoryInputs(prev => ({
      ...prev,
      [accountType]: ''
    }));

    setCategoryNumberInputs(prev => ({
      ...prev,
      [accountType]: ''
    }));
  };

  const handleDeleteCategory = (accountType, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      // Update local state only (NO database delete since categories aren't saved to DB)
      setAccountCategories(prev => ({
        ...prev,
        [accountType]: prev[accountType].filter(cat => cat !== categoryName)
      }));

      // Remove from IDs
      setCategoryIds(prev => {
        const updated = { ...prev };
        if (updated[accountType]) {
          delete updated[accountType][categoryName];
        }
        return updated;
      });

      // Remove from category numbers
      setCategoryNumbers(prev => {
        const updated = { ...prev };
        if (updated[accountType]) {
          delete updated[accountType][categoryName];
        }
        return updated;
      });

      // Also remove transaction types for this category from local state
      setAccountNames(prev => {
        const updated = { ...prev };
        if (updated[accountType] && updated[accountType][categoryName]) {
          delete updated[accountType][categoryName];
        }
        return updated;
      });
    }
  };

  const handleStartEditCategory = (accountType, categoryName) => {
    const fullCategoryNumber = categoryNumbers[accountType]?.[categoryName] || '';
    // Extract the last 2 digits from the full 3-digit number for editing
    const categoryNumberOnly = fullCategoryNumber && fullCategoryNumber.length === 3 
      ? fullCategoryNumber.substring(1) 
      : '';
    
    setEditingCategory(prev => ({
      ...prev,
      [accountType]: { 
        oldName: categoryName, 
        newName: categoryName,
        oldNumber: categoryNumberOnly,
        newNumber: categoryNumberOnly
      }
    }));
  };

  const handleCategoryEditChange = (accountType, value, field = 'newName') => {
    setEditingCategory(prev => ({
      ...prev,
      [accountType]: { ...prev[accountType], [field]: value }
    }));
  };

  const handleSaveCategoryEdit = async (accountType) => {
    const editData = editingCategory[accountType];
    if (!editData || !editData.newName?.trim()) {
      alert('Please enter a valid category name');
      return;
    }

    const newName = editData.newName.trim();
    const newNumber = editData.newNumber?.trim() || null;
    
    // Get the account type prefix (first digit)
    let typePrefix = '';
    if (accountType === 'asset') typePrefix = '1';
    else if (accountType === 'liability') typePrefix = '2';
    else if (accountType === 'equity') typePrefix = '8';
    else if (accountType === 'revenue') typePrefix = '3';
    else if (accountType === 'expense') typePrefix = '6';
    else {
      // For custom account types, get from accountTypes array
      const customType = accountTypes.find(t => t.value === accountType);
      if (customType && customType.codePrefix) {
        typePrefix = customType.codePrefix.charAt(0);
      }
    }
    
    // Validate category number if provided (must be 2 digits, 00-99)
    if (newNumber && (!/^\d{2}$/.test(newNumber) || parseInt(newNumber) < 0 || parseInt(newNumber) > 99)) {
      alert('Category number must be a 2-digit number between 00 and 99');
      return;
    }

    // Combine type prefix with category number to create full first segment (3 digits)
    const fullCategoryNumber = newNumber && typePrefix ? `${typePrefix}${newNumber}` : null;

    const nameChanged = newName !== editData.oldName;
    const numberChanged = newNumber !== (editData.oldNumber || '');

    if (!nameChanged && !numberChanged) {
      setEditingCategory(prev => {
        const updated = { ...prev };
        delete updated[accountType];
        return updated;
      });
      return;
    }

    if (nameChanged && accountCategories[accountType]?.includes(newName)) {
      alert('This category name already exists');
      return;
    }

    // Update local state only (NO database update since categories aren't saved to DB)
    if (nameChanged) {
      setAccountCategories(prev => ({
        ...prev,
        [accountType]: prev[accountType].map(cat => 
          cat === editData.oldName ? newName : cat
        )
      }));

      // Update IDs mapping
      setCategoryIds(prev => {
        const updated = { ...prev };
        if (updated[accountType] && updated[accountType][editData.oldName]) {
          const id = updated[accountType][editData.oldName];
          delete updated[accountType][editData.oldName];
          updated[accountType][newName] = id;
        }
        return updated;
      });
    }

    // Update category numbers (store full 3-digit number)
    setCategoryNumbers(prev => {
      const updated = { ...prev };
      if (!updated[accountType]) {
        updated[accountType] = {};
      }
      if (nameChanged) {
        if (fullCategoryNumber) {
          updated[accountType][newName] = fullCategoryNumber;
        } else {
          delete updated[accountType][editData.oldName];
        }
      } else if (numberChanged) {
        if (fullCategoryNumber) {
          updated[accountType][editData.oldName] = fullCategoryNumber;
        } else {
          delete updated[accountType][editData.oldName];
        }
      }
      return updated;
    });

    setEditingCategory(prev => {
      const updated = { ...prev };
      delete updated[accountType];
      return updated;
    });
  };

  const handleCancelEditCategory = (accountType) => {
    setEditingCategory(prev => {
      const updated = { ...prev };
      delete updated[accountType];
      return updated;
    });
  };

  // Transaction Type Management Handlers
  const handleAddAccountName = async (accountType, categoryName) => {
    const newAccountName = (accountNameInputs[accountType]?.[categoryName] || '').trim();
    if (!newAccountName) {
      alert('Please enter a transaction type');
      return;
    }

    // Get the three-digit code
    const rawCode = (accountNameCodes[accountType]?.[categoryName] || '').trim();
    let threeDigitCode = '';
    
    if (rawCode) {
      // Remove any non-digit characters and take first 3 digits
      const cleaned = rawCode.replace(/\D/g, '').slice(0, 3);
      if (cleaned.length > 0) {
        // Pad with leading zeros to make it 3 digits
        threeDigitCode = cleaned.padStart(3, '0');
      }
    }

    // Get existing types for this category
    const existingTypes = accountNames[accountType]?.[categoryName] || [];

    // Check if code already exists for this category (if provided)
    // Only check code uniqueness - if code is different, allow adding (even if name is the same)
    if (threeDigitCode) {
      const existingCodes = existingTypes.map(t => {
        if (typeof t === 'string') return null;
        return t.code;
      }).filter(c => c);
      if (existingCodes.includes(threeDigitCode)) {
        alert('This code already exists for this category');
        return;
      }
    }

    try {
      // Get category number for transaction type data
      const categoryNumber = categoryNumbers[accountType]?.[categoryName] || null;

      // Check if this category_number is already used by a different sub-category in the same account_type
      if (categoryNumber) {
        // Check all sub-categories in this account_type
        const allSubCategories = accountCategories[accountType] || [];
        for (const subCat of allSubCategories) {
          if (subCat !== categoryName) {
            // Check if this other sub-category uses the same category_number
            const otherCategoryNumber = categoryNumbers[accountType]?.[subCat];
            if (otherCategoryNumber === categoryNumber) {
              alert(`Category number "${categoryNumber}" is already used by "${subCat}" in ${accountType}. Please use a different category number for "${categoryName}".`);
              return;
            }
          }
        }
      }

      // Create the transaction type in database (backend will handle category creation if needed)
      const transactionTypeResult = await accountCategoryAPI.createTransactionType({
        account_type: accountType,
        category_name: categoryName,
        category_number: categoryNumber,
        transaction_type_name: newAccountName,
        transaction_type_code: threeDigitCode || null
      });

      // Add to local state (store as object with name, code, and id)
      const newType = { 
        name: newAccountName, 
        code: threeDigitCode || null,
        id: transactionTypeResult.id
      };
      
      // Update transaction types
      setAccountNames(prev => ({
        ...prev,
        [accountType]: {
          ...(prev[accountType] || {}),
          [categoryName]: [...existingTypes, newType]
        }
      }));
      
      // Ensure the category exists in accountCategories (for display)
      setAccountCategories(prev => {
        const typeCategories = prev[accountType] || [];
        if (!typeCategories.includes(categoryName)) {
          return {
            ...prev,
            [accountType]: [...typeCategories, categoryName]
          };
        }
        return prev;
      });
      
      // Ensure category number is stored if provided
      if (categoryNumber) {
        setCategoryNumbers(prev => ({
          ...prev,
          [accountType]: {
            ...(prev[accountType] || {}),
            [categoryName]: categoryNumber
          }
        }));
      }

      // Clear inputs
      setAccountNameInputs(prev => ({
        ...prev,
        [accountType]: {
          ...(prev[accountType] || {}),
          [categoryName]: ''
        }
      }));
      setAccountNameCodes(prev => ({
        ...prev,
        [accountType]: {
          ...(prev[accountType] || {}),
          [categoryName]: ''
        }
      }));
    } catch (error) {
      console.error('Error adding transaction type:', error);
      alert(error.message || 'Failed to add transaction type. Please try again.');
    }
  };

  const handleStartEditAccountName = (accountType, categoryName, accountName) => {
    // Find the transaction type object to get the code
    const existingTypes = accountNames[accountType]?.[categoryName] || [];
    const typeObj = existingTypes.find(t => {
      const name = typeof t === 'string' ? t : t.name;
      return name === accountName;
    });
    const currentCode = typeObj && typeof typeObj !== 'string' ? typeObj.code : '';

    setEditingAccountNames(prev => ({
      ...prev,
      [accountType]: {
        ...(prev[accountType] || {}),
        [categoryName]: {
          oldName: accountName,
          newName: accountName,
          oldCode: currentCode || '',
          newCode: currentCode || ''
        }
      }
    }));
  };

  const handleAccountNameEditChange = (accountType, categoryName, field, value) => {
    setEditingAccountNames(prev => ({
      ...prev,
      [accountType]: {
        ...(prev[accountType] || {}),
        [categoryName]: {
          ...(prev[accountType]?.[categoryName] || {}),
          [field]: value
        }
      }
    }));
  };

  const handleSaveAccountNameEdit = async (accountType, categoryName) => {
    const editData = editingAccountNames[accountType]?.[categoryName];
    if (!editData) return;

    const newName = editData.newName.trim();
    if (!newName) {
      alert('Transaction type cannot be empty');
      return;
    }

    // Process the code
    const rawCode = (editData.newCode || '').trim();
    let threeDigitCode = '';
    if (rawCode) {
      const cleaned = rawCode.replace(/\D/g, '').slice(0, 3);
      if (cleaned.length > 0) {
        threeDigitCode = cleaned.padStart(3, '0');
      }
    }

    // Check if new name already exists (excluding the one being edited)
    const existingTypes = accountNames[accountType]?.[categoryName] || [];
    const existingNames = existingTypes.map(t => {
      const name = typeof t === 'string' ? t : t.name;
      return name;
    });
    if (newName !== editData.oldName && existingNames.includes(newName)) {
      alert('This transaction type already exists for this category');
      return;
    }

    // Check if code already exists (if provided and changed)
    if (threeDigitCode && threeDigitCode !== editData.oldCode) {
      const existingCodes = existingTypes.map(t => {
        if (typeof t === 'string') return null;
        return t.code;
      }).filter(c => c);
      if (existingCodes.includes(threeDigitCode)) {
        alert('This code already exists for this category');
        return;
      }
    }

    try {
      // Find the transaction type ID
      const transactionType = existingTypes.find(t => {
        const name = typeof t === 'string' ? t : t.name;
        return name === editData.oldName;
      });
      
      if (transactionType && transactionType.id) {
        // Update in database
        await accountCategoryAPI.updateTransactionType(transactionType.id, {
          transaction_type_name: newName,
          transaction_type_code: threeDigitCode || null
        });
      }

      // Update local state
      setAccountNames(prev => {
        const updated = { ...prev };
        if (!updated[accountType]) {
          updated[accountType] = {};
        }
        if (!updated[accountType][categoryName]) {
          updated[accountType][categoryName] = [];
        }
        const index = updated[accountType][categoryName].findIndex(t => {
          const name = typeof t === 'string' ? t : t.name;
          return name === editData.oldName;
        });
        if (index !== -1) {
          updated[accountType][categoryName][index] = { 
            name: newName, 
            code: threeDigitCode || null,
            id: transactionType?.id || null
          };
        }
        return updated;
      });

      // Clear editing state
      setEditingAccountNames(prev => {
        const updated = { ...prev };
        if (updated[accountType]?.[categoryName]) {
          delete updated[accountType][categoryName];
          if (Object.keys(updated[accountType]).length === 0) {
            delete updated[accountType];
          }
        }
        return updated;
      });
    } catch (error) {
      console.error('Error updating transaction type:', error);
      alert(error.message || 'Failed to update transaction type. Please try again.');
    }
  };

  const handleCancelEditAccountName = (accountType, categoryName) => {
    setEditingAccountNames(prev => {
      const updated = { ...prev };
      if (updated[accountType]?.[categoryName]) {
        delete updated[accountType][categoryName];
        if (Object.keys(updated[accountType]).length === 0) {
          delete updated[accountType];
        }
      }
      return updated;
    });
  };

  const handleDeleteAccountName = async (accountType, categoryName, accountName) => {
    if (window.confirm(`Are you sure you want to delete "${accountName}"?`)) {
      try {
        // Find the transaction type to get its ID
        const existingTypes = accountNames[accountType]?.[categoryName] || [];
        const transactionType = existingTypes.find(t => {
          const name = typeof t === 'string' ? t : t.name;
          return name === accountName;
        });

        // Delete from database if it has an ID
        if (transactionType && transactionType.id) {
          await accountCategoryAPI.deleteTransactionType(transactionType.id);
        }

        // Update local state
        setAccountNames(prev => {
          const updated = { ...prev };
          if (updated[accountType]?.[categoryName]) {
            updated[accountType][categoryName] = updated[accountType][categoryName].filter(t => {
              const name = typeof t === 'string' ? t : t.name;
              return name !== accountName;
            });
            if (updated[accountType][categoryName].length === 0) {
              delete updated[accountType][categoryName];
            }
          }
          return updated;
        });
      } catch (error) {
        console.error('Error deleting transaction type:', error);
        alert(error.message || 'Failed to delete transaction type. Please try again.');
      }
    }
  };

  // Handle adding new account type category
  const handleAddAccountType = async () => {
    const trimmedName = newAccountTypeName.trim();
    const trimmedCode = newAccountTypeCode.trim();
    
    if (!trimmedName) {
      alert('Please enter an account type name');
      return;
    }
    
    if (!trimmedCode) {
      alert('Please enter an account code prefix (e.g., 4XX, 5XX, 7XX, 9XX)');
      return;
    }
    
    // Check if code format is valid (should be like 4XX, 5XX, etc.)
    if (!/^\dXX$/.test(trimmedCode)) {
      alert('Account code prefix must be in format: XXX (e.g., 4XX, 5XX, 7XX, 9XX)');
      return;
    }
    
    // Check if account type already exists
    const valueKey = trimmedName.toLowerCase().replace(/\s+/g, '_');
    if (accountTypes.some(type => type.value === valueKey)) {
      alert('This account type already exists');
      return;
    }
    
    // Check if we already have 4 custom types (including 9XX option)
    if (customAccountTypes.length >= 4) {
      alert('You can only add up to 4 custom account type categories');
      return;
    }
    
    try {
      // Save to database
      const result = await customAccountTypeAPI.create({
        account_type_name: trimmedName,
        account_type_value: valueKey,
        code_prefix: trimmedCode.toUpperCase()
      });
      
      // Add new account type to local state
      const newType = {
        value: valueKey,
        label: trimmedName,
        codePrefix: trimmedCode.toUpperCase()
      };
      
      setCustomAccountTypes(prev => [...prev, newType]);
      
      // Initialize empty categories array for this new type
      setAccountCategories(prev => ({
        ...prev,
        [valueKey]: []
      }));
      
      // Clear inputs
      setNewAccountTypeName('');
      setNewAccountTypeCode('');
    } catch (error) {
      console.error('Error adding custom account type:', error);
      alert(error.message || 'Failed to add custom account type. Please try again.');
    }
  };

  // Handle deleting custom account type
  const handleDeleteAccountType = async (accountTypeValue) => {
    if (window.confirm(`Are you sure you want to delete this account type and all its categories?`)) {
      try {
        // Delete from database
        await customAccountTypeAPI.delete(accountTypeValue);
        
        // Remove from local state
        setCustomAccountTypes(prev => prev.filter(type => type.value !== accountTypeValue));
        setAccountCategories(prev => {
          const updated = { ...prev };
          delete updated[accountTypeValue];
          return updated;
        });
        
        // Also remove category numbers and IDs for this type
        setCategoryIds(prev => {
          const updated = { ...prev };
          delete updated[accountTypeValue];
          return updated;
        });
        setCategoryNumbers(prev => {
          const updated = { ...prev };
          delete updated[accountTypeValue];
          return updated;
        });
      } catch (error) {
        console.error('Error deleting custom account type:', error);
        alert(error.message || 'Failed to delete custom account type. Please try again.');
      }
    }
  };

  // Track which accounts already have mappings (loaded from database)
  const [existingMappings, setExistingMappings] = useState({});

  // Load account categories and custom account types from database on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCategories(true);
        
        // Load categories, transaction types, and custom account types in parallel
        const [categories, transactionTypes, customTypes] = await Promise.all([
          accountCategoryAPI.getAll().catch(() => []),
          accountCategoryAPI.getAllTransactionTypes().catch(() => []),
          customAccountTypeAPI.getAll().catch(() => [])
        ]);
        
        // Load custom account types
        const loadedCustomTypes = customTypes.map(type => ({
          value: type.account_type_value,
          label: type.account_type_name,
          codePrefix: type.code_prefix
        }));
        setCustomAccountTypes(loadedCustomTypes);
        
        // Group categories by account_type (normalize to lowercase for consistency)
        const grouped = {};
        const ids = {};
        
        categories.forEach(cat => {
          // Normalize account_type to lowercase to match dropdown values
          const normalizedType = (cat.account_type || '').toLowerCase();
          if (!grouped[normalizedType]) {
            grouped[normalizedType] = [];
            ids[normalizedType] = {};
          }
          grouped[normalizedType].push(cat.category_name);
          ids[normalizedType][cat.category_name] = cat.id;
        });
        
        // Store category numbers (normalize account_type to lowercase)
        const numbers = {};
        categories.forEach(cat => {
          // Normalize account_type to lowercase to match dropdown values
          const normalizedType = (cat.account_type || '').toLowerCase();
          if (!numbers[normalizedType]) {
            numbers[normalizedType] = {};
          }
          if (cat.category_number) {
            numbers[normalizedType][cat.category_name] = cat.category_number;
          }
        });
        
        // Group transaction types by account_type and category_name
        // Also extract sub-categories from transaction types
        const transactionTypesGrouped = {};
        const subCategoriesFromTransactionTypes = {};
        const categoryNumbersFromTransactionTypes = {};
        
        transactionTypes.forEach(tt => {
          // Normalize account_type to lowercase to match dropdown values
          const normalizedType = (tt.account_type || '').toLowerCase();
          
          if (!transactionTypesGrouped[normalizedType]) {
            transactionTypesGrouped[normalizedType] = {};
          }
          if (!transactionTypesGrouped[normalizedType][tt.category_name]) {
            transactionTypesGrouped[normalizedType][tt.category_name] = [];
          }
          transactionTypesGrouped[normalizedType][tt.category_name].push({
            name: tt.transaction_type_name,
            code: tt.transaction_type_code,
            id: tt.id
          });
          
          // Extract sub-categories from transaction types
          if (tt.category_name) {
            if (!subCategoriesFromTransactionTypes[normalizedType]) {
              subCategoriesFromTransactionTypes[normalizedType] = [];
            }
            if (!subCategoriesFromTransactionTypes[normalizedType].includes(tt.category_name)) {
              subCategoriesFromTransactionTypes[normalizedType].push(tt.category_name);
            }
            
            // Extract category numbers from transaction types
            if (tt.category_number) {
              if (!categoryNumbersFromTransactionTypes[normalizedType]) {
                categoryNumbersFromTransactionTypes[normalizedType] = {};
              }
              categoryNumbersFromTransactionTypes[normalizedType][tt.category_name] = tt.category_number;
            }
          }
        });
        
        // Merge categories from database with sub-categories from transaction types
        const mergedCategories = { ...grouped };
        Object.keys(subCategoriesFromTransactionTypes).forEach(accountType => {
          if (!mergedCategories[accountType]) {
            mergedCategories[accountType] = [];
          }
          subCategoriesFromTransactionTypes[accountType].forEach(subCat => {
            if (!mergedCategories[accountType].includes(subCat)) {
              mergedCategories[accountType].push(subCat);
            }
          });
        });
        
        // Merge category numbers from database with those from transaction types
        const mergedCategoryNumbers = { ...numbers };
        Object.keys(categoryNumbersFromTransactionTypes).forEach(accountType => {
          if (!mergedCategoryNumbers[accountType]) {
            mergedCategoryNumbers[accountType] = {};
          }
          Object.keys(categoryNumbersFromTransactionTypes[accountType]).forEach(catName => {
            mergedCategoryNumbers[accountType][catName] = categoryNumbersFromTransactionTypes[accountType][catName];
          });
        });
        
        setAccountCategories(mergedCategories);
        setCategoryIds(ids);
        setCategoryNumbers(mergedCategoryNumbers);
        setAccountNames(transactionTypesGrouped);
      } catch (error) {
        console.error('Error loading data:', error);
        // Initialize with default categories if database is empty or error
        const defaultCategories = {
          asset: ['Current Assets', 'Non-Current Assets', 'Fixed Assets', 'Intangible Assets'],
          liability: ['Current Liabilities', 'Non-Current Liabilities', 'Long-term Debt'],
          equity: ['Share Capital', 'Retained Earnings', 'Reserves'],
          revenue: ['Operating Revenue', 'Non-Operating Revenue', 'Interest Income'],
          expense: ['Operating Expenses', 'Administrative Expenses', 'Financial Expenses']
        };
        setAccountCategories(defaultCategories);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch bank accounts and chart of accounts for GL Mapping
  useEffect(() => {
    const fetchDataForMapping = async () => {
      if (activeTab === 'glMapping') {
        setLoading(true);
        try {
          const [accountsResponse, chartResponse, existingMappingsData] = await Promise.all([
            accountAPI.getAllAccounts(),
            chartOfAccountsAPI.getAll(),
            glAccountMappingAPI.getAll().catch(() => []) // Fetch existing mappings, return empty array if none exist
          ]);
          
          // Filter only active accounts
          const activeAccounts = accountsResponse.filter(acc => acc.active_status !== 'No');
          setBankAccounts(activeAccounts);
          setChartOfAccounts(chartResponse);
          
          // Populate existing mappings into state (for display - these won't be saved again)
          const mappingsObj = {};
          const existingMappingsObj = {};
          existingMappingsData.forEach(mapping => {
            mappingsObj[mapping.account_id] = mapping.gl_account_code;
            existingMappingsObj[mapping.account_id] = {
              gl_account_code: mapping.gl_account_code,
              gl_account_name: mapping.gl_account_name || ''
            };
          });
          setMappings(mappingsObj);
          setExistingMappings(existingMappingsObj);
        } catch (error) {
          console.error('Error fetching data for GL Mapping:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDataForMapping();
  }, [activeTab]);

  // Handle GL mapping changes
  const handleMappingChange = (bankAccountId, glAccountCode) => {
    setMappings(prev => ({
      ...prev,
      [bankAccountId]: glAccountCode
    }));
    
    // Clear error for this mapping
    if (mappingErrors[bankAccountId]) {
      setMappingErrors(prev => ({
        ...prev,
        [bankAccountId]: ''
      }));
    }
  };

  // Handle save mappings
  const handleSaveMappings = async () => {
    // Validate only NEW mappings (not existing ones)
    const newErrors = {};
    let hasErrors = false;

    // Check if all accounts that don't have existing mappings have been mapped
    bankAccounts.forEach(account => {
      if (!existingMappings[account.id] && !mappings[account.id]) {
        newErrors[account.id] = 'Please select a GL account';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setMappingErrors(newErrors);
      return;
    }

    // Prepare mappings for API (exclude accounts that already have mappings in the database)
    const mappingsArray = Object.entries(mappings)
      .filter(([accountId, glAccountCode]) => {
        // Only include new mappings (not already in the database)
        return glAccountCode && !existingMappings[accountId];
      })
      .map(([accountId, glAccountCode]) => {
        // Find the GL account name
        const glAccount = chartOfAccounts.find(coa => coa.account_code === glAccountCode);
        return {
          account_id: parseInt(accountId),
          gl_account_code: glAccountCode,
          gl_account_name: glAccount ? glAccount.description : ''
        };
      });

    // If no new mappings to save, show a message
    if (mappingsArray.length === 0) {
      alert('All accounts are already mapped. No new mappings to save.');
      return;
    }

    try {
      // Save only new mappings to the backend
      await glAccountMappingAPI.saveBulk(mappingsArray);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving GL mappings:', error);
      alert('Failed to save GL mappings. Please try again.');
    }
  };

  return (
    <div className="new-gl-account-container">
      {/* Header Section */}
      <div className="new-gl-header-section">
        <div className="new-gl-header-icon">
          <svg className="new-gl-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="new-gl-header-text-group">
          <h1 className="new-gl-main-title">GL Account Specification</h1>
          <p className="new-gl-subtitle">Define general ledger account mappings for your chart of accounts</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="new-gl-success-message">
          <div className="success-icon">✓</div>
          <div className="success-text">
            <h3>Account Created Successfully!</h3>
            <p>Your GL account specification has been added to the chart of accounts.</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('newGLAccount')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'newGLAccount' ? '600' : '400',
            color: activeTab === 'newGLAccount' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'newGLAccount' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          New GL Account
        </button>
        <button
          onClick={() => setActiveTab('accountCategory')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'accountCategory' ? '600' : '400',
            color: activeTab === 'accountCategory' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'accountCategory' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Account Category
        </button>
        <button
          onClick={() => setActiveTab('glMapping')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'glMapping' ? '600' : '400',
            color: activeTab === 'glMapping' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'glMapping' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          GL Mapping
        </button>
        <button
          onClick={() => setActiveTab('journalEntry')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'journalEntry' ? '600' : '400',
            color: activeTab === 'journalEntry' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'journalEntry' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          General Ledger - Journal Entry
        </button>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'newGLAccount' ? (
      /* New GL Account Form */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">Account Details</h2>
          <p className="new-gl-form-subtitle">Define the GL account specification details below</p>
        </div>

        <form onSubmit={handleSubmit} className="new-gl-form">
          {/* Account Classification Section */}
          <div className="form-section">
            <h3 className="form-section-title">Account Classification</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountType" className="form-label">
                  Account Type <span className="required">*</span>
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className={`form-select ${errors.accountType ? 'error' : ''}`}
                >
                  <option value="">Select Account Type</option>
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.accountType && <span className="error-message">{errors.accountType}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="accountCategory" className="form-label">
                  Account Category <span className="required">*</span>
                </label>
                <select
                  id="accountCategory"
                  name="accountCategory"
                  value={formData.accountCategory}
                  onChange={handleInputChange}
                  className={`form-select ${errors.accountCategory ? 'error' : ''}`}
                  disabled={!formData.accountType}
                >
                  <option value="">Select Category</option>
                  {formData.accountType && accountCategories[formData.accountType]?.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.accountCategory && <span className="error-message">{errors.accountCategory}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="transactionType" className="form-label">
                  Transaction Type
                </label>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className={`form-select ${errors.transactionType ? 'error' : ''}`}
                  disabled={!formData.accountType || !formData.accountCategory}
                >
                  <option value="">Select Transaction Type</option>
                  {formData.accountType && formData.accountCategory && accountNames[formData.accountType]?.[formData.accountCategory]?.map((typeObj, index) => {
                    const typeName = typeof typeObj === 'string' ? typeObj : typeObj.name;
                    return (
                      <option key={index} value={typeName}>
                        {typeName}
                      </option>
                    );
                  })}
                </select>
                {errors.transactionType && <span className="error-message">{errors.transactionType}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="activeStatus" className="form-label">
                  Status
                </label>
                <select
                  id="activeStatus"
                  name="activeStatus"
                  value={formData.activeStatus}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Yes">Active</option>
                  <option value="No">Inactive</option>
                </select>
                <div className="input-hint">Active accounts can be used in transactions</div>
              </div>
            </div>
          </div>

          {/* Account Code Section */}
          <div className="form-section">
            <h3 className="form-section-title">Account Identification</h3>
            
            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label className="form-label">
                  Account Code <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', width: '100%' }}>
                  <div style={{ flex: '1 1 0', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                      Category + Subcategory (XXX)
                    </div>
                    <input
                      type="text"
                      id="accountCodePart1"
                      name="accountCodePart1"
                      value={formData.accountCodePart1}
                      onChange={handleInputChange}
                      className={`form-input ${errors.accountCode ? 'error' : ''}`}
                      placeholder="101"
                      maxLength={3}
                      style={{ textAlign: 'center', width: '100%' }}
                    />
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#6b7280', paddingBottom: '1.5rem', fontWeight: '600' }}>-</span>
                  <div style={{ flex: '1 1 0', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                      Branch (XXX)
                    </div>
                    <input
                      type="text"
                      id="accountCodePart2"
                      name="accountCodePart2"
                      value={formData.accountCodePart2}
                      onChange={handleInputChange}
                      className={`form-input ${errors.accountCode ? 'error' : ''}`}
                      placeholder="101"
                      maxLength={3}
                      style={{ textAlign: 'center', width: '100%' }}
                    />
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#6b7280', paddingBottom: '1.5rem', fontWeight: '600' }}>-</span>
                  <div style={{ flex: '1 1 0', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                      Transaction Type (XXX)
                    </div>
                    <input
                      type="text"
                      id="accountCodePart3"
                      name="accountCodePart3"
                      value={formData.accountCodePart3}
                      onChange={handleInputChange}
                      className={`form-input ${errors.accountCode ? 'error' : ''}`}
                      placeholder="555"
                      maxLength={3}
                      style={{ textAlign: 'center', width: '100%' }}
                    />
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#6b7280', paddingBottom: '1.5rem', fontWeight: '600' }}>-</span>
                  <div style={{ flex: '1 1 0', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                      Account Name (XXX)
                    </div>
                    <input
                      type="text"
                      id="accountCodePart4"
                      name="accountCodePart4"
                      value={formData.accountCodePart4}
                      onChange={handleInputChange}
                      className={`form-input ${errors.accountCode ? 'error' : ''}`}
                      placeholder="001"
                      maxLength={3}
                      style={{ textAlign: 'center', width: '100%' }}
                    />
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#6b7280', paddingBottom: '1.5rem', fontWeight: '600' }}>-</span>
                  <div style={{ flex: '1 1 0', minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                      Ending (XX)
                    </div>
                    <input
                      type="text"
                      id="accountCodePart5"
                      name="accountCodePart5"
                      value={formData.accountCodePart5}
                      onChange={handleInputChange}
                      className={`form-input ${errors.accountCode ? 'error' : ''}`}
                      placeholder="44"
                      maxLength={2}
                      style={{ textAlign: 'center', width: '100%' }}
                    />
                  </div>
                </div>
                {errors.accountCode && <span className="error-message">{errors.accountCode}</span>}
                <div className="input-hint">Format: XXX-XXX-XXX-XXX-XX (e.g., 101-101-555-001-44)</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Account Description <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`form-input ${errors.description ? 'error' : ''}`}
                  placeholder="e.g., Asset Motor Vehicles"
                  maxLength={255}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                <div className="input-hint">Enter a clear, descriptive name for the account</div>
              </div>

              <div className="form-group">
                <label htmlFor="normalBalance" className="form-label">
                  Normal Balance (Optional)
                </label>
                <select
                  id="normalBalance"
                  name="normalBalance"
                  value={formData.normalBalance}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select if applicable</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
                <div className="input-hint">Leave empty if debit/credit depends on transaction context</div>
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parentAccount" className="form-label">
                  Parent Account (Optional)
                </label>
                <input
                  type="text"
                  id="parentAccount"
                  name="parentAccount"
                  value={formData.parentAccount}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., 1-000-01-01-01"
                />
                <div className="input-hint">Link to a parent account for hierarchical organization</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      ) : activeTab === 'accountCategory' ? (
      /* Account Category Management Tab */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">Account Category Management</h2>
          <p className="new-gl-form-subtitle">Manage account categories for each account type</p>
        </div>

        <div style={{ padding: '2rem' }}>
          <div className="gl-mapping-instructions">
            <div className="gl-mapping-instructions-content">
              <p className="gl-mapping-instructions-title">
                Instructions
              </p>
              <p className="gl-mapping-instructions-text">
                Add, edit, or delete account categories for each account type. These categories will be available when creating new GL accounts. You can add up to 4 custom account type categories (e.g., 4XX, 5XX, 7XX, 9XX).
              </p>
            </div>
          </div>

          {/* Add New Account Type Section */}
          {customAccountTypes.length < 4 && (
            <div style={{ 
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem',
              border: '2px dashed #3b82f6'
            }}>
              <h3 style={{ 
                marginTop: 0,
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Add New Account Type Category ({customAccountTypes.length}/4)
              </h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    Account Type Name
                  </label>
                  <input
                    type="text"
                    value={newAccountTypeName}
                    onChange={(e) => setNewAccountTypeName(e.target.value)}
                    placeholder="e.g., Bank Account, Investment"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    Account Code Prefix (XXX)
                  </label>
                  <input
                    type="text"
                    value={newAccountTypeCode}
                    onChange={(e) => setNewAccountTypeCode(e.target.value.toUpperCase())}
                    placeholder="e.g., 4XX, 5XX, 7XX, 9XX"
                    maxLength={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: '#fff',
                      fontFamily: 'monospace',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <button
                  onClick={handleAddAccountType}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#fff',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  Add Account Type
                </button>
              </div>
            </div>
          )}

          {accountTypes.map(accountType => {
            const typeKey = accountType.value;
            const categories = accountCategories[typeKey] || [];
            const isEditing = editingCategory[typeKey];
            
            return (
              <div key={typeKey} style={{ 
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  marginTop: 0,
                  marginBottom: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {accountType.value === 'asset' && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      1XX-XXX-XXX-XXX-XX
                    </span>
                  )}
                  {accountType.value === 'liability' && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      2XX-XXX-XXX-XXX-XX
                    </span>
                  )}
                  {accountType.value === 'equity' && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      8XX-XXX-XXX-XXX-XX
                    </span>
                  )}
                  {accountType.value === 'revenue' && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      3XX-XXX-XXX-XXX-XX
                    </span>
                  )}
                  {accountType.value === 'expense' && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      6XX-XXX-XXX-XXX-XX
                    </span>
                  )}
                  {accountType.codePrefix && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      {accountType.codePrefix}-XXX-XXX-XXX-XX
                    </span>
                  )}
                  <span style={{ flex: 1 }}>{accountType.label} Categories</span>
                  {customAccountTypes.some(t => t.value === accountType.value) && (
                    <button
                      onClick={() => handleDeleteAccountType(accountType.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: '1px solid #dc2626',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                      title="Delete Account Type"
                    >
                      Delete Type
                    </button>
                  )}
                </h3>

                {/* Add New Category */}
                <div style={{ 
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <input
                    type="text"
                    placeholder="Enter new category name"
                    value={categoryInputs[typeKey] || ''}
                    onChange={(e) => handleCategoryInputChange(typeKey, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory(typeKey);
                      }
                    }}
                    style={{
                      flex: 2,
                      minWidth: '200px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: '#fff'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Number (00-99)"
                    value={categoryNumberInputs[typeKey] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setCategoryNumberInputs(prev => ({
                        ...prev,
                        [typeKey]: value
                      }));
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory(typeKey);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                  />
                  {/* Preview of full account code format */}
                  {categoryNumberInputs[typeKey] && categoryNumberInputs[typeKey].length > 0 && (() => {
                    // Get account type prefix
                    let typePrefix = '';
                    if (typeKey === 'asset') typePrefix = '1';
                    else if (typeKey === 'liability') typePrefix = '2';
                    else if (typeKey === 'equity') typePrefix = '8';
                    else if (typeKey === 'revenue') typePrefix = '3';
                    else if (typeKey === 'expense') typePrefix = '6';
                    else {
                      const customType = accountTypes.find(t => t.value === typeKey);
                      if (customType && customType.codePrefix) {
                        typePrefix = customType.codePrefix.charAt(0);
                      }
                    }
                    
                    // Pad the number to 2 digits
                    const paddedNumber = categoryNumberInputs[typeKey].padStart(2, '0');
                    const fullCategoryNumber = `${typePrefix}${paddedNumber}`;
                    const fullCode = `${fullCategoryNumber}-XXX-XXX-XXX-XX`;
                    
                    return (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#10b981',
                        backgroundColor: '#ecfdf5',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>
                        Preview: {fullCode}
                      </span>
                    );
                  })()}
                  <button
                    onClick={() => handleAddCategory(typeKey)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#fff',
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    Add Category
                  </button>
                </div>

                {/* Categories List */}
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {categories.map((category, index) => {
                    const isCurrentlyEditing = isEditing && isEditing.oldName === category;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#fff',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        {isCurrentlyEditing ? (
                          <>
                            <input
                              type="text"
                              value={isEditing.newName}
                              onChange={(e) => handleCategoryEditChange(typeKey, e.target.value, 'newName')}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveCategoryEdit(typeKey);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditCategory(typeKey);
                                }
                              }}
                              autoFocus
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.875rem',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.25rem',
                                minWidth: '150px'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Number"
                              value={isEditing.newNumber || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                                handleCategoryEditChange(typeKey, value, 'newNumber');
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveCategoryEdit(typeKey);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditCategory(typeKey);
                                }
                              }}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.875rem',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.25rem',
                                width: '60px',
                                textAlign: 'center',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              onClick={() => handleSaveCategoryEdit(typeKey)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#fff',
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                              }}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelEditCategory(typeKey)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#fff',
                                backgroundColor: '#6b7280',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                              }}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                          ) : (
                            <>
                              {categoryNumbers[typeKey]?.[category] && (() => {
                                const fullCategoryNumber = categoryNumbers[typeKey][category];
                                // category_number now stores the full 3-digit first segment (e.g., 101, 201, 801)
                                const fullCode = `${fullCategoryNumber}-XXX-XXX-XXX-XX`;
                                
                                return (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#fff',
                                    backgroundColor: '#10b981',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.05em',
                                    marginRight: '0.5rem'
                                  }}>
                                    {fullCode}
                                  </span>
                                );
                              })()}
                              <span style={{ color: '#374151' }}>
                                {category}
                              </span>
                            <button
                              onClick={() => handleStartEditCategory(typeKey, category)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#3b82f6',
                                backgroundColor: 'transparent',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                              }}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(typeKey, category)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                backgroundColor: 'transparent',
                                border: '1px solid #dc2626',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                              }}
                              title="Delete"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {categories.length === 0 && (
                    <div style={{ 
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontStyle: 'italic',
                      padding: '0.5rem'
                    }}>
                      No categories defined yet. Add one above.
                    </div>
                  )}
                </div>

                {/* Transaction Types Section for each category */}
                {categories.map((category) => {
                  const categoryAccountNames = accountNames[typeKey]?.[category] || [];
                  const isEditingAccountName = editingAccountNames[typeKey]?.[category];
                  const accountNameInput = accountNameInputs[typeKey]?.[category] || '';
                  const accountNameCodeInput = accountNameCodes[typeKey]?.[category] || '';

                  return (
                    <div
                      key={category}
                      style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#ffffff',
                        borderRadius: '0.375rem',
                        border: '1px solid #e5e7eb',
                        marginLeft: '1rem'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Transaction Types under "{category}"
                        </h4>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}>
                          {categoryAccountNames.length} type{categoryAccountNames.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Add Transaction Type Input */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{ flex: 1 }}>
                          <label style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                            display: 'block'
                          }}>
                            Transaction Type Name
                          </label>
                          <input
                            type="text"
                            placeholder="Enter transaction type"
                            value={accountNameInput}
                            onChange={(e) => {
                              setAccountNameInputs(prev => ({
                                ...prev,
                                [typeKey]: {
                                  ...(prev[typeKey] || {}),
                                  [category]: e.target.value
                                }
                              }));
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddAccountName(typeKey, category);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              backgroundColor: '#fff'
                            }}
                          />
                        </div>
                        <div style={{ width: '120px' }}>
                          <label style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                            display: 'block'
                          }}>
                            Code (3 digits)
                          </label>
                          <input
                            type="text"
                            placeholder="001"
                            value={accountNameCodeInput}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                              setAccountNameCodes(prev => ({
                                ...prev,
                                [typeKey]: {
                                  ...(prev[typeKey] || {}),
                                  [category]: value
                                }
                              }));
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddAccountName(typeKey, category);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              backgroundColor: '#fff',
                              textAlign: 'center',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleAddAccountName(typeKey, category)}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#fff',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            height: 'fit-content'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          Add Transaction Type
                        </button>
                      </div>

                      {/* Transaction Types List */}
                      {categoryAccountNames.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {categoryAccountNames.map((typeObj, nameIndex) => {
                            const accountName = typeof typeObj === 'string' ? typeObj : typeObj.name;
                            const typeCode = typeof typeObj === 'string' ? null : typeObj.code;
                            const isCurrentlyEditing = isEditingAccountName && isEditingAccountName.oldName === accountName;

                            return (
                              <div
                                key={nameIndex}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {isCurrentlyEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={isEditingAccountName.newName}
                                      onChange={(e) => handleAccountNameEditChange(typeKey, category, 'newName', e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveAccountNameEdit(typeKey, category);
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditAccountName(typeKey, category);
                                        }
                                      }}
                                      autoFocus
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '0.25rem',
                                        minWidth: '150px'
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Code"
                                      value={isEditingAccountName.newCode || ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                        handleAccountNameEditChange(typeKey, category, 'newCode', value);
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveAccountNameEdit(typeKey, category);
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditAccountName(typeKey, category);
                                        }
                                      }}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '0.25rem',
                                        width: '60px',
                                        textAlign: 'center',
                                        fontFamily: 'monospace'
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveAccountNameEdit(typeKey, category)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#fff',
                                        backgroundColor: '#10b981',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Save"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => handleCancelEditAccountName(typeKey, category)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#fff',
                                        backgroundColor: '#6b7280',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {typeCode && (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#fff',
                                        backgroundColor: '#6366f1',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.05em',
                                        marginRight: '0.5rem'
                                      }}>
                                        {typeCode}
                                      </span>
                                    )}
                                    <span style={{ color: '#374151' }}>
                                      {accountName}
                                    </span>
                                    <button
                                      onClick={() => handleStartEditAccountName(typeKey, category, accountName)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#3b82f6',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Edit"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAccountName(typeKey, category, accountName)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#dc2626',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #dc2626',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer'
                                      }}
                                      title="Delete"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {categoryAccountNames.length === 0 && (
                        <div style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          fontStyle: 'italic',
                          padding: '0.5rem'
                        }}>
                          No transaction types yet. Add one above.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      ) : activeTab === 'glMapping' ? (
      /* GL Mapping Tab */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">GL Account Mapping</h2>
          <p className="new-gl-form-subtitle">Map your payment accounts to specific GL account codes from the Chart of Accounts</p>
        </div>

        {loading ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem' }}>Loading accounts...</p>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No bank accounts found. Please add accounts first.</p>
          </div>
        ) : (
          <div style={{ padding: '2rem 0' }}>
            <div className="gl-mapping-instructions">
              <div className="gl-mapping-instructions-content">
                <p className="gl-mapping-instructions-title">
                  Instructions
                </p>
                <p className="gl-mapping-instructions-text">
                  Select the appropriate GL account from the Chart of Accounts for each payment account below. This mapping will be used for automatic posting of transactions.
                </p>
              </div>
            </div>

            {/* Mappings Table */}
            <div style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative' }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #e5e7eb'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      Bank Account
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      GL Account Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map(account => (
                    <tr key={account.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{account.bank_name}</strong>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                          {account.account_name} ({account.account_number})
                        </div>
                        {mappingErrors[account.id] && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {mappingErrors[account.id]}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', overflow: 'visible', position: 'relative' }}>
                        {(() => {
                          const hasExistingMapping = existingMappings[account.id];
                          const existingMapping = hasExistingMapping ? hasExistingMapping.gl_account_code : '';
                          
                          return hasExistingMapping ? (
                            <div style={{
                              padding: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#059669',
                              backgroundColor: '#d1fae5',
                              borderRadius: '6px',
                              border: '1px solid #059669'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                {existingMapping}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                                Already Mapped
                              </div>
                            </div>
                          ) : (
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                placeholder="Search GL (code or name)"
                                value={coaSearchByAccount[account.id] ?? (mappings[account.id] || '')}
                                onChange={(e) => {
                                  const term = e.target.value;
                                  setCoaSearchByAccount(prev => ({ ...prev, [account.id]: term }));
                                  setShowCoaListByAccount(prev => ({ ...prev, [account.id]: true }));
                                  updateDropdownPosition(account.id, e.target);
                                }}
                                onFocus={(e) => {
                                  setShowCoaListByAccount(prev => ({ ...prev, [account.id]: true }));
                                  updateDropdownPosition(account.id, e.target);
                                }}
                                onBlur={() => {
                                  // Delay to allow click selection
                                  setTimeout(() => setShowCoaListByAccount(prev => ({ ...prev, [account.id]: false })), 150);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  fontSize: '0.875rem',
                                  border: `1px solid ${mappingErrors[account.id] ? '#ef4444' : '#d1d5db'}`,
                                  borderRadius: '6px',
                                  backgroundColor: '#fff'
                                }}
                              />
                              {showCoaListByAccount[account.id] && coaDropdownPosByAccount[account.id] && typeof document !== 'undefined' && createPortal(
                                <div
                                  style={{
                                    position: 'fixed',
                                    left: coaDropdownPosByAccount[account.id].left,
                                    top: coaDropdownPosByAccount[account.id].top,
                                    width: coaDropdownPosByAccount[account.id].width,
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    zIndex: 10000,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {chartOfAccounts
                                    .filter(coa => coa.active_status === 'Yes')
                                    .filter((coa) => {
                                      const term = (coaSearchByAccount[account.id] || '').toLowerCase();
                                      if (!term) return true;
                                      return (
                                        (coa.account_code || '').toLowerCase().includes(term) ||
                                        (coa.description || '').toLowerCase().includes(term)
                                      );
                                    })
                                    .map((coa) => (
                                      <div
                                        key={`${account.id}-${coa.account_code}`}
                                        onClick={() => {
                                          handleMappingChange(account.id, coa.account_code);
                                          setCoaSearchByAccount(prev => ({ ...prev, [account.id]: `${coa.account_code} - ${coa.description}` }));
                                          setShowCoaListByAccount(prev => ({ ...prev, [account.id]: false }));
                                        }}
                                        style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                      >
                                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{coa.account_code}</div>
                                        <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{coa.description}</div>
                                      </div>
                                    ))}
                                  {chartOfAccounts.length === 0 && (
                                    <div style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>No accounts loaded</div>
                                  )}
                                </div>,
                                document.body
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              maxWidth: '90%'
            }}>
              <button
                onClick={handleSaveMappings}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Save Mappings
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
      /* General Ledger - Journal Entry Tab */
      <div className="new-gl-form-card">
        <div className="new-gl-form-header">
          <h2 className="new-gl-form-title">General Ledger - Journal Entry</h2>
          <p className="new-gl-form-subtitle">Create manual journal entries for GL adjustments</p>
        </div>
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>Journal Entry functionality coming soon</p>
        </div>
      </div>
      )}

      {/* Footer */}
      <div className="new-gl-footer-section">
        <p>SHERWOOD TECHNOLOGIES (PVT) LTD • General Ledger Account Management • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default NewGLAccount;









