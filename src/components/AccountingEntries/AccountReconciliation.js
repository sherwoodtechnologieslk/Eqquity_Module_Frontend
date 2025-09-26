import React, { useState, useEffect } from 'react';
import { generalLedgerAPI, chartOfAccountsAPI, accountReconciliationAPI } from '../../services/api';
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

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load GL transactions when filters change
  useEffect(() => {
    if (filters.accountCode) {
      loadGlTransactions();
    }
  }, [filters]);

  const loadAccounts = async () => {
    try {
      const data = await chartOfAccountsAPI.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load chart of accounts');
    }
  };

  const loadGlTransactions = async () => {
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
  };

  const loadExternalTransactions = async () => {
    // This would typically load from uploaded bank statements or external APIs
    // For now, we'll simulate with sample data
    const sampleExternalData = [
      {
        id: 'EXT001',
        date: '2024-01-15',
        reference: 'Deposit #123',
        description: 'Customer Payment',
        debit: 5000,
        credit: 0,
        balance: 55000
      },
      {
        id: 'EXT002',
        date: '2024-01-20',
        reference: 'Cheque #456',
        description: 'Vendor Payment',
        debit: 0,
        credit: 3000,
        balance: 52000
      },
      {
        id: 'EXT003',
        date: '2024-01-25',
        reference: 'Bank Fee',
        description: 'Monthly Service Charge',
        debit: 0,
        credit: 500,
        balance: 51500
      }
    ];
    
    setExternalTransactions(sampleExternalData);
    setExternalOpeningBalance(50000);
    setExternalClosingBalance(51500);
    setUnmatchedExternal(sampleExternalData);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualMatch = (glTransaction, externalTransaction) => {
    // Remove from unmatched lists
    setUnmatchedGl(prev => prev.filter(t => t.id !== glTransaction.id));
    setUnmatchedExternal(prev => prev.filter(t => t.id !== externalTransaction.id));
    
    // Add to matched list
    setMatchedTransactions(prev => [...prev, {
      id: `match_${Date.now()}`,
      glTransaction,
      externalTransaction,
      matchType: 'manual',
      matchedAt: new Date().toISOString()
    }]);
    
    // Recalculate differences
    calculateDifferences();
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

  const selectedAccount = accounts.find(acc => acc.account_code === filters.accountCode);

  return (
    <div className="account-reconciliation">
      {/* Header Section */}
      <div className="account-reconciliation-header">
        <div className="account-reconciliation-header-left">
          <h1>Account Reconciliation</h1>
          {selectedAccount && (
            <div className="account-reconciliation-info">
              <span className="account-reconciliation-code">{selectedAccount.account_code}</span>
              <span className="account-reconciliation-name">{selectedAccount.account_name}</span>
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
            {accounts.map(account => (
              <option key={account.account_code} value={account.account_code}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
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
      {showImportModal && (
        <div className="reconciliation-modal-overlay">
          <div className="reconciliation-modal-content">
            <div className="reconciliation-modal-header">
              <h3>Import External Statement</h3>
              <button 
                className="reconciliation-modal-close"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="reconciliation-modal-body">
              <div className="reconciliation-file-upload">
                <input
                  type="file"
                  accept=".csv,.xlsx,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="reconciliation-file-input"
                />
                <div className="reconciliation-file-info">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </div>
              </div>
              <div className="reconciliation-upload-actions">
                <button 
                  className="reconciliation-btn"
                  onClick={() => {/* Handle file upload */}}
                >
                  Upload
                </button>
                <button 
                  className="reconciliation-btn reconciliation-btn-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
