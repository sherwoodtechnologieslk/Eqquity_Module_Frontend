import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { chartOfAccountsAPI, accountReconciliationAPI } from '../../services/api';
import './Styles/AccountReconciliation.css';

const AccountReconciliation = () => {
  // State for filters and configuration
  const [filters, setFilters] = useState({
    accountCode: '',
    period: 'month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    referenceType: 'bank', // bank, vendor, customer
    referenceNumber: ''
  });

  // State for data
  const [accounts, setAccounts] = useState([]);
  const [glTransactions, setGlTransactions] = useState([]);
  const [externalTransactions, setExternalTransactions] = useState([]);
  const [matchedTransactions, setMatchedTransactions] = useState([]);
  const [unmatchedGl, setUnmatchedGl] = useState([]);
  const [unmatchedExternal, setUnmatchedExternal] = useState([]);

  // State for balances
  const [glOpeningBalance, setGlOpeningBalance] = useState(0);
  const [glClosingBalance, setGlClosingBalance] = useState(0);
  const [externalOpeningBalance, setExternalOpeningBalance] = useState(0);
  const [externalClosingBalance, setExternalClosingBalance] = useState(0);

  // State for reconciliation
  const [reconciliationStatus, setReconciliationStatus] = useState('pending');
  const [differences, setDifferences] = useState({
    unrecordedDeposits: 0,
    outstandingCheques: 0,
    bankCharges: 0,
    otherDiscrepancies: 0,
    netDifference: 0
  });

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);
  const [statementUploadMessage, setStatementUploadMessage] = useState('');
  const [statementPreviewText, setStatementPreviewText] = useState('');
  const [statementPdfPages, setStatementPdfPages] = useState([]);
  const [statementPreviewError, setStatementPreviewError] = useState('');
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [pdfImportPassword, setPdfImportPassword] = useState('');
  const [pdfPasswordError, setPdfPasswordError] = useState('');

  // PDF.js worker - assumes public/pdf.worker.min.js exists (same as PendingDividends)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  const buildPdfTextLayoutPreview = async (file, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      password: password || undefined
    });
    const pdf = await loadingTask.promise;

    const maxPages = pdf.numPages || 1;
    const pages = [];

    for (let pageIndex = 1; pageIndex <= maxPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({ scale: 1.25 });
      const textContent = await page.getTextContent();

      // Convert PDF.js text items into positioned spans (approx "same format")
      const items = (textContent.items || [])
        .map((it) => ({
          ...it,
          str: typeof it.str === 'string' ? it.str.replace(/[^\x20-\x7E]/g, '') : ''
        }))
        .filter((it) => it && it.str.trim() !== '')
        .map((it, idx) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
          const fontSize = Math.max(1, Math.hypot(tx[0], tx[1]));
          const angle = Math.atan2(tx[1], tx[0]);
          const left = tx[4];
          const top = tx[5] - fontSize;

          return {
            key: `${pageIndex}-${idx}`,
            text: it.str,
            left,
            top,
            fontSize,
            angle
          };
        });

      pages.push({
        pageNumber: pageIndex,
        width: viewport.width,
        height: viewport.height,
        items
      });
    }

    return pages;
  };

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await chartOfAccountsAPI.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load chart of accounts');
    }
  };

  const loadGlTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await accountReconciliationAPI.getAccountTransactions(filters.accountCode, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      
      setGlTransactions(data.transactions || []);
      setGlOpeningBalance(data.openingBalance || 0);
      setGlClosingBalance(data.closingBalance || 0);
      
      // Initialize unmatched GL transactions
      setUnmatchedGl(data.transactions || []);
      
    } catch (error) {
      console.error('Error loading GL transactions:', error);
      setError('Failed to load general ledger transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.accountCode, filters.startDate, filters.endDate]);

  const loadExternalTransactions = async () => {
    // This would typically load from uploaded bank statements or external APIs
    // For now, using empty data - no mock data
    const emptyExternalData = [];
    
    setExternalTransactions(emptyExternalData);
    setExternalOpeningBalance(0);
    setExternalClosingBalance(0);
    setUnmatchedExternal(emptyExternalData);
  };

  // Load GL transactions when filters change
  useEffect(() => {
    if (filters.accountCode) {
      loadGlTransactions();
    }
  }, [filters, loadGlTransactions]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatementFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
    setStatementUploadMessage('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setStatementPreviewError('');
    setShowPdfPasswordModal(false);
    setPdfPassword('');
    setPdfImportPassword('');
    setPdfPasswordError('');

    if (!file) return;

    setIsPreparingPreview(true);
    try {
      const name = String(file.name || '').toLowerCase();

      if (name.endsWith('.pdf')) {
        setStatementPreviewError('');
        setStatementPreviewText('');
        setStatementPdfPages([]);
        setPdfPassword('');
        setPdfImportPassword('');
        setPdfPasswordError('Enter the PDF password to preview it.');
        setShowPdfPasswordModal(true);
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const raw = await file.text();
        const snippet = raw.length > 4000 ? `${raw.slice(0, 4000)}\n\n... (truncated preview)` : raw;
        setStatementPreviewText(snippet || '(Empty file)');
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        setStatementPreviewText(
          'Preview not available for Excel files yet. Please click Upload to import and view transactions.'
        );
      } else {
        setStatementPreviewText(
          'Preview not available for this file type. Please click Upload to import and view transactions.'
        );
      }
    } catch (err) {
      console.error('Error preparing statement preview:', err);
      setStatementPreviewError('Could not generate a preview for this file. You can still try uploading it.');
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handleRemoveStatementFile = () => {
    setSelectedFile(null);
    setStatementUploadMessage('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setStatementPreviewError('');
    setShowPdfPasswordModal(false);
    setPdfPassword('');
    setPdfImportPassword('');
    setPdfPasswordError('');
    // Reset file input so the same file can be re-selected
    const fileInput = document.getElementById('reconciliationStatementFile');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUploadStatement = async () => {
    if (!filters.accountCode) {
      setError('Please select an account to reconcile before uploading a statement.');
      setStatementUploadMessage('Select an account to reconcile, then upload the statement.');
      return;
    }
    if (!selectedFile) {
      setError('Please choose a statement file to upload.');
      setStatementUploadMessage('Please choose a file to upload.');
      return;
    }
    setIsUploadingStatement(true);
    setError('');
    setStatementUploadMessage('');

    try {
      const result = await accountReconciliationAPI.uploadExternalStatement(
        selectedFile,
        filters.accountCode,
        pdfImportPassword
      );

      // Support multiple backend response shapes
      const transactions =
        (result && Array.isArray(result.transactions) && result.transactions) ||
        (Array.isArray(result) && result) ||
        (result && Array.isArray(result.data) && result.data) ||
        [];

      const openingBalance =
        (result && (result.openingBalance ?? result.opening_balance)) ?? 0;
      const closingBalance =
        (result && (result.closingBalance ?? result.closing_balance)) ?? 0;

      setExternalTransactions(transactions);
      setUnmatchedExternal(transactions);
      setExternalOpeningBalance(Number(openingBalance) || 0);
      setExternalClosingBalance(Number(closingBalance) || 0);

      // Reset any previous matching state when new external data arrives
      setMatchedTransactions([]);
      setReconciliationStatus('pending');

      setShowImportModal(false);
      handleRemoveStatementFile();
      setStatementUploadMessage('Statement uploaded successfully. External transactions are now loaded.');
    } catch (err) {
      console.error('Error uploading external statement:', err);
      setError(err?.message || 'Failed to upload statement. Please try again.');
      setStatementUploadMessage(err?.message || 'Failed to upload statement. Please try again.');
    } finally {
      setIsUploadingStatement(false);
    }
  };

  const handlePdfPasswordSubmit = async () => {
    if (!pdfPassword.trim()) {
      setPdfPasswordError('Please enter a password');
      return;
    }
    if (!selectedFile) {
      setPdfPasswordError('Please select the PDF file again.');
      return;
    }

    setIsPreparingPreview(true);
    setStatementPreviewError('');
    setStatementPreviewText('');
    setStatementPdfPages([]);
    setPdfPasswordError('');

    try {
      const pages = await buildPdfTextLayoutPreview(selectedFile, pdfPassword);
      setStatementPdfPages(pages);
      setPdfImportPassword(pdfPassword);
      setShowPdfPasswordModal(false);
      setPdfPassword('');
      setPdfPasswordError('');
    } catch (err) {
      console.error('Error unlocking PDF for preview:', err);
      const passwordLike =
        err?.name === 'PasswordException' ||
        String(err?.message || '').toLowerCase().includes('password') ||
        String(err?.message || '').toLowerCase().includes('encrypted');
      if (passwordLike) {
        setPdfPasswordError('Incorrect password. Please try again.');
      } else {
        setPdfPasswordError(err?.message || 'Failed to unlock PDF.');
      }
    } finally {
      setIsPreparingPreview(false);
    }
  };


  const handleAutoMatch = () => {
    const newMatches = [];
    const remainingGl = [...unmatchedGl];
    const remainingExternal = [...unmatchedExternal];
    
    // Simple auto-matching by amount and date proximity
    remainingGl.forEach((glTrans, glIndex) => {
      const matchingExternal = remainingExternal.find((extTrans, extIndex) => {
        const amountMatch = Math.abs(glTrans.debit - extTrans.debit) < 0.01 || 
                           Math.abs(glTrans.credit - extTrans.credit) < 0.01;
        const dateMatch = Math.abs(new Date(glTrans.date) - new Date(extTrans.date)) <= 3 * 24 * 60 * 60 * 1000; // 3 days
        
        return amountMatch && dateMatch;
      });
      
      if (matchingExternal) {
        const extIndex = remainingExternal.findIndex(t => t.id === matchingExternal.id);
        newMatches.push({
          id: `auto_match_${Date.now()}_${Math.random()}`,
          glTransaction: glTrans,
          externalTransaction: matchingExternal,
          matchType: 'auto',
          matchedAt: new Date().toISOString()
        });
        
        remainingGl.splice(glIndex, 1);
        remainingExternal.splice(extIndex, 1);
      }
    });
    
    setMatchedTransactions(prev => [...prev, ...newMatches]);
    setUnmatchedGl(remainingGl);
    setUnmatchedExternal(remainingExternal);
    
    calculateDifferences();
  };

  const calculateDifferences = () => {
    const unrecordedDeposits = unmatchedExternal
      .filter(t => t.debit > 0)
      .reduce((sum, t) => sum + t.debit, 0);
    
    const outstandingCheques = unmatchedGl
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);
    
    const bankCharges = unmatchedExternal
      .filter(t => t.credit > 0 && t.description.toLowerCase().includes('fee'))
      .reduce((sum, t) => sum + t.credit, 0);
    
    const netDifference = (glClosingBalance + unrecordedDeposits - outstandingCheques) - externalClosingBalance;
    
    setDifferences({
      unrecordedDeposits,
      outstandingCheques,
      bankCharges,
      otherDiscrepancies: 0,
      netDifference
    });
  };

  const handleSaveReconciliation = async () => {
    try {
      setLoading(true);
      
      const reconciliationData = {
        accountCode: filters.accountCode,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        glBalance: glClosingBalance,
        externalBalance: externalClosingBalance,
        matchedTransactions,
        unmatchedGl,
        unmatchedExternal,
        differences,
        status: 'reconciled',
        reconciledAt: new Date().toISOString()
      };
      
      // Save to backend
      await accountReconciliationAPI.saveReconciliation(reconciliationData);
      
      setReconciliationStatus('reconciled');
      alert('Reconciliation saved successfully!');
      
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      setError('Failed to save reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Refresh GL transactions
      if (filters.accountCode) {
        await loadGlTransactions();
      }
      
      // Refresh external transactions
      await loadExternalTransactions();
      
      // Reset reconciliation status if needed
      if (reconciliationStatus === 'reconciled') {
        setReconciliationStatus('pending');
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      account: accounts.find(acc => acc.account_code === filters.accountCode),
      period: filters,
      glTransactions,
      externalTransactions,
      matchedTransactions,
      unmatchedGl,
      unmatchedExternal,
      balances: {
        glOpening: glOpeningBalance,
        glClosing: glClosingBalance,
        externalOpening: externalOpeningBalance,
        externalClosing: externalClosingBalance
      },
      differences,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconciliation_${filters.accountCode}_${filters.startDate}_${filters.endDate}.json`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-LK');
  };

  const selectedAccount = accounts.find(acc => {
    const code = acc.account_code || acc.accountCode || acc.code;
    return code === filters.accountCode;
  });

  return (
    <div className="account-reconciliation">
      {/* Header Section */}
      <div className="account-reconciliation-header">
        <div className="account-reconciliation-header-left">
          <h1>Account Reconciliation</h1>
          {selectedAccount && (
            <div className="account-reconciliation-info">
              <span className="account-reconciliation-code">
                {selectedAccount.account_code || selectedAccount.accountCode || selectedAccount.code}
              </span>
              <span className="account-reconciliation-name">
                {selectedAccount.account_name ||
                  selectedAccount.accountName ||
                  selectedAccount.name ||
                  selectedAccount.description ||
                  'Unnamed account'}
              </span>
            </div>
          )}
        </div>
        <div className="account-reconciliation-header-right">
          <div className="reconciliation-status-info">
            Status: {reconciliationStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="account-reconciliation-filters">
        <div className="reconciliation-filter-group">
          <label>Account to Reconcile:</label>
          <select
            value={filters.accountCode}
            onChange={(e) => handleFilterChange('accountCode', e.target.value)}
          >
            <option value="">Select Account</option>
            {accounts.map((account, idx) => {
              const code = account.account_code || account.accountCode || account.code || '';
              const name =
                account.account_name ||
                account.accountName ||
                account.name ||
                account.description ||
                '';
              return (
                <option key={code || account.id || `acc-${idx}`} value={code}>
                  {code} - {name || 'Unnamed account'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Period:</label>
          <select
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="month">Current Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="reconciliation-filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <div className="reconciliation-filter-group">
          <label>Reference Type:</label>
          <select
            value={filters.referenceType}
            onChange={(e) => handleFilterChange('referenceType', e.target.value)}
          >
            <option value="bank">Bank Statement</option>
            <option value="vendor">Vendor Statement</option>
            <option value="customer">Customer Statement</option>
          </select>
        </div>

        <div className="reconciliation-filter-group">
          <label>Reference Number:</label>
          <input
            type="text"
            value={filters.referenceNumber}
            onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
            placeholder="Statement/Invoice Number"
          />
        </div>

        <div className="reconciliation-action-buttons">
          <button 
            className="reconciliation-btn"
            onClick={loadExternalTransactions}
          >
            Load External Data
          </button>
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            Import Statement
          </button>
          <button 
            className="reconciliation-btn reconciliation-btn-success"
            onClick={handleAutoMatch}
          >
            Auto Match
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="reconciliation-balance-summary">
        <div className="reconciliation-balance-card">
          <h3>General Ledger</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Opening Balance:</span>
              <span>{formatCurrency(glOpeningBalance)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Closing Balance:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(glClosingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="reconciliation-balance-card">
          <h3>External Statement</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Opening Balance:</span>
              <span>{formatCurrency(externalOpeningBalance)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Closing Balance:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(externalClosingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="reconciliation-balance-card">
          <h3>Difference Analysis</h3>
          <div className="reconciliation-balance-details">
            <div className="reconciliation-balance-item">
              <span>Unrecorded Deposits:</span>
              <span className="reconciliation-balance-positive">{formatCurrency(differences.unrecordedDeposits)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Outstanding Cheques:</span>
              <span className="reconciliation-balance-negative">{formatCurrency(differences.outstandingCheques)}</span>
            </div>
            <div className="reconciliation-balance-item">
              <span>Bank Charges:</span>
              <span className="reconciliation-balance-negative">{formatCurrency(differences.bankCharges)}</span>
            </div>
            <div className="reconciliation-balance-item reconciliation-balance-item-total">
              <span>Net Difference:</span>
              <span className={differences.netDifference === 0 ? 'reconciliation-balance-balanced' : 'reconciliation-balance-unbalanced'}>
                {formatCurrency(differences.netDifference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Panels */}
      <div className="reconciliation-panels-container">
        {/* General Ledger Transactions Panel */}
        <div className="reconciliation-panel reconciliation-panel-gl">
          <div className="reconciliation-panel-header">
            <h3>General Ledger Transactions</h3>
            <span className="reconciliation-panel-count">({unmatchedGl.length} unmatched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Journal Entry ID</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedGl.map(transaction => (
                  <tr key={transaction.id} className="reconciliation-transaction-row">
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.reference}</td>
                    <td>{transaction.description}</td>
                    <td className="reconciliation-debit-amount">{transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}</td>
                    <td className="reconciliation-credit-amount">{transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}</td>
                    <td className="reconciliation-balance-amount">{formatCurrency(transaction.balance)}</td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-outline"
                        onClick={() => {/* Handle manual match */}}
                      >
                        Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* External Statement Panel */}
        <div className="reconciliation-panel reconciliation-panel-external">
          <div className="reconciliation-panel-header">
            <h3>External Statement Transactions</h3>
            <span className="reconciliation-panel-count">({unmatchedExternal.length} unmatched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedExternal.map(transaction => (
                  <tr key={transaction.id} className="reconciliation-transaction-row">
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.reference}</td>
                    <td>{transaction.description}</td>
                    <td className="reconciliation-debit-amount">{transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}</td>
                    <td className="reconciliation-credit-amount">{transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}</td>
                    <td className="reconciliation-balance-amount">{formatCurrency(transaction.balance)}</td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-outline"
                        onClick={() => {/* Handle manual match */}}
                      >
                        Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Matched Transactions */}
      {matchedTransactions.length > 0 && (
        <div className="reconciliation-matched-section">
          <div className="reconciliation-panel-header">
            <h3>Matched Transactions</h3>
            <span className="reconciliation-panel-count">({matchedTransactions.length} matched)</span>
          </div>
          <div className="reconciliation-panel-content">
            <table className="reconciliation-transactions-table">
              <thead>
                <tr>
                  <th>GL Date</th>
                  <th>GL Ref</th>
                  <th>GL Description</th>
                  <th>Ext Date</th>
                  <th>Ext Ref</th>
                  <th>Ext Description</th>
                  <th>Amount</th>
                  <th>Match Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matchedTransactions.map(match => (
                  <tr key={match.id} className="reconciliation-matched-row">
                    <td>{formatDate(match.glTransaction.date)}</td>
                    <td>{match.glTransaction.reference}</td>
                    <td>{match.glTransaction.description}</td>
                    <td>{formatDate(match.externalTransaction.date)}</td>
                    <td>{match.externalTransaction.reference}</td>
                    <td>{match.externalTransaction.description}</td>
                    <td className="reconciliation-amount-display">
                      {formatCurrency(match.glTransaction.debit || match.glTransaction.credit)}
                    </td>
                    <td>
                      <span className={`reconciliation-match-type reconciliation-match-type-${match.matchType}`}>
                        {match.matchType}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-danger"
                        onClick={() => {/* Handle unmatch */}}
                      >
                        Unmatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="reconciliation-actions-section">
        <div className="reconciliation-actions-buttons">
          <button 
            className="reconciliation-btn reconciliation-btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          <button 
            className="reconciliation-btn"
            onClick={handleSaveReconciliation}
            disabled={loading || reconciliationStatus === 'reconciled'}
          >
            {loading ? 'Saving...' : 'Save Reconciliation'}
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-success"
            onClick={handleExportReport}
          >
            Export Report
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-warning"
            onClick={() => {/* Handle print */}}
          >
            Print Report
          </button>
          
          <button 
            className="reconciliation-btn reconciliation-btn-warning"
            onClick={() => {/* Handle attach documents */}}
          >
            Attach Documents
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && createPortal((
        <div className="reconciliation-modal-overlay">
          <div className="reconciliation-modal-content reconciliation-import-modal-content">
            <div className="reconciliation-modal-header">
              <h3>Import External Statement</h3>
              <button 
                className="reconciliation-modal-close"
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  handleRemoveStatementFile();
                }}
              >
                ×
              </button>
            </div>
            <div className="reconciliation-modal-body">
              {!filters.accountCode && (
                <div className="reconciliation-error-message" style={{ marginBottom: 12 }}>
                  Select an <strong>Account to Reconcile</strong> first (required for uploading statements).
                </div>
              )}
              {statementUploadMessage && (
                <div
                  className="reconciliation-error-message"
                  style={{
                    marginBottom: 12,
                    background: statementUploadMessage.toLowerCase().includes('success')
                      ? '#ecfdf5'
                      : undefined,
                    borderColor: statementUploadMessage.toLowerCase().includes('success')
                      ? '#10b981'
                      : undefined,
                    color: statementUploadMessage.toLowerCase().includes('success')
                      ? '#065f46'
                      : undefined
                  }}
                >
                  {statementUploadMessage}
                </div>
              )}
              <div className="reconciliation-file-upload">
                <input
                  type="file"
                  id="reconciliationStatementFile"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleStatementFileChange}
                  className="reconciliation-file-input"
                />
                <div className="reconciliation-file-info">
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span>{selectedFile.name}</span>
                      <button
                        type="button"
                        className="reconciliation-btn reconciliation-btn-sm reconciliation-btn-danger"
                        onClick={handleRemoveStatementFile}
                        disabled={isUploadingStatement}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    'No file selected'
                  )}
                </div>
              </div>

              {(isPreparingPreview || statementPreviewText || statementPdfPages.length > 0 || statementPreviewError) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Statement preview</div>
                  {isPreparingPreview ? (
                    <div style={{ color: '#6b7280' }}>Preparing preview...</div>
                  ) : statementPreviewError && !showPdfPasswordModal ? (
                    <div className="reconciliation-error-message" style={{ marginBottom: 8 }}>
                      {statementPreviewError}
                    </div>
                  ) : null}
                  {statementPdfPages.length > 0 ? (
                    <div
                      style={{
                        maxHeight: 650,
                        overflow: 'auto',
                        borderRadius: 10,
                        border: '1px solid rgba(17,24,39,0.12)',
                        background: '#fff',
                        padding: 10
                      }}
                    >
                      {statementPdfPages.map((page) => (
                        <div key={page.pageNumber} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                            Page {page.pageNumber}
                          </div>
                          <div
                            style={{
                              position: 'relative',
                              width: page.width,
                              height: page.height,
                              background: '#fff',
                              border: '1px solid rgba(17,24,39,0.10)'
                            }}
                          >
                            {page.items.map((it) => (
                              <span
                                key={it.key}
                                style={{
                                  position: 'absolute',
                                  left: it.left,
                                  top: it.top,
                                  fontSize: it.fontSize,
                                  transform: it.angle ? `rotate(${it.angle}rad)` : undefined,
                                  transformOrigin: '0 0',
                                  whiteSpace: 'pre',
                                  color: '#111827'
                                }}
                              >
                                {it.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {statementPreviewText ? (
                    <pre
                      style={{
                        maxHeight: 220,
                        overflow: 'auto',
                        background: '#0b1220',
                        color: '#e5e7eb',
                        padding: 12,
                        borderRadius: 8,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                        lineHeight: 1.4,
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {statementPreviewText}
                    </pre>
                  ) : null}
                </div>
              )}

              <div className="reconciliation-upload-actions">
                <button 
                  className="reconciliation-btn"
                  type="button"
                  onClick={handleUploadStatement}
                  disabled={isUploadingStatement || !selectedFile || !filters.accountCode}
                >
                  {isUploadingStatement ? 'Uploading...' : 'Upload'}
                </button>
                <button 
                  className="reconciliation-btn reconciliation-btn-secondary"
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    handleRemoveStatementFile();
                  }}
                  disabled={isUploadingStatement}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* PDF Password Modal (preview only) */}
      {showImportModal && showPdfPasswordModal && createPortal((
        <div className="reconciliation-modal-overlay">
          <div className="reconciliation-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="reconciliation-modal-header">
              <h3>PDF Password Required</h3>
              <button
                className="reconciliation-modal-close"
                type="button"
                onClick={() => {
                  setShowPdfPasswordModal(false);
                  setPdfPassword('');
                  setPdfImportPassword('');
                  setPdfPasswordError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="reconciliation-modal-body">
              <p style={{ marginTop: 0, color: '#374151' }}>
                This PDF is password protected. Enter the password to preview it.
              </p>
              {pdfPasswordError && (
                <div className="reconciliation-error-message" style={{ marginBottom: 12 }}>
                  {pdfPasswordError}
                </div>
              )}
              <div className="reconciliation-filter-group" style={{ marginBottom: 0 }}>
                <label>Password:</label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setPdfPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePdfPasswordSubmit();
                    }
                  }}
                  placeholder="Enter PDF password"
                />
              </div>
              <div className="reconciliation-upload-actions" style={{ marginTop: 16 }}>
                <button
                  className="reconciliation-btn reconciliation-btn-secondary"
                  type="button"
                  onClick={() => {
                    setShowPdfPasswordModal(false);
                    setPdfPassword('');
                    setPdfImportPassword('');
                    setPdfPasswordError('');
                  }}
                  disabled={isPreparingPreview}
                >
                  Cancel
                </button>
                <button
                  className="reconciliation-btn"
                  type="button"
                  onClick={handlePdfPasswordSubmit}
                  disabled={isPreparingPreview || !pdfPassword.trim()}
                >
                  {isPreparingPreview ? 'Unlocking...' : 'Unlock & Preview'}
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
                The same password will be used when importing this PDF statement.
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Error Display */}
      {error && (
        <div className="reconciliation-error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default AccountReconciliation;
