import React, { useState, useEffect } from 'react';
import './Styles/ImportHistory.css';
import { parsedTradeTransactionAPI } from '../../services/api';

const ImportHistory = () => {
  const [importHistory, setImportHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    transactionType: 'all', // 'all', 'bulk-buy', 'bulk-sell'
    status: 'all' // 'all', 'success', 'failed', 'pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImport, setSelectedImport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);


  useEffect(() => {
    fetchImportHistory();
  }, [filters]);

  const fetchImportHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all parsed trade transactions for the current user
      const transactions = await parsedTradeTransactionAPI.getParsedTransactions();
      
      // Group transactions by created_at (import time) and trade_report_id
      // Transactions saved at the same time with the same trade_report_id are from the same import
      const importGroups = {};
      
      transactions.forEach(transaction => {
        // Use created_at as the key, rounded to the minute for grouping
        const importKey = transaction.created_at 
          ? new Date(transaction.created_at).toISOString().slice(0, 16) // Round to minute
          : new Date().toISOString().slice(0, 16);
        
        // Also use trade_report_id if available for better grouping
        const groupKey = transaction.trade_report_id 
          ? `${transaction.trade_report_id}_${importKey}`
          : importKey;
        
        if (!importGroups[groupKey]) {
          importGroups[groupKey] = {
            id: groupKey,
            transactions: [],
            created_at: transaction.created_at,
            trade_report_id: transaction.trade_report_id,
            user_email: transaction.user_email
          };
        }
        
        importGroups[groupKey].transactions.push(transaction);
      });
      
      // Transform grouped data to match UI format
      const importHistoryData = Object.values(importGroups).map(group => {
        const buyTransactions = group.transactions.filter(t => 
          t.buy_sell === 'B' || t.buy_sell === 'b'
        );
        const sellTransactions = group.transactions.filter(t => 
          t.buy_sell === 'S' || t.buy_sell === 's'
        );
      
        // Calculate total value (quantity * price for all transactions)
        const totalValue = group.transactions.reduce((sum, t) => {
          const qty = parseFloat(t.quantity) || 0;
          const price = parseFloat(t.price) || 0;
          return sum + (qty * price);
        }, 0);
        
        // Determine type based on transaction mix
        let type = 'Mixed';
        if (buyTransactions.length > 0 && sellTransactions.length === 0) {
          type = 'Bulk Buy';
        } else if (sellTransactions.length > 0 && buyTransactions.length === 0) {
          type = 'Bulk Sell';
        }
        
        // Generate a file name from trade_report_id or use a default
        const fileName = group.trade_report_id 
          ? `Trade Report - ${group.trade_report_id.substring(0, 20)}${group.trade_report_id.length > 20 ? '...' : ''}`
          : `Trade Import - ${new Date(group.created_at).toLocaleString()}`;
        
        return {
          id: group.id.substring(0, 20) + '...',
          type: type,
          fileName: fileName,
          trade_report_id: group.trade_report_id || null,
          totalTransactions: group.transactions.length,
          successfulTransactions: group.transactions.length, // All are successful if saved
          failedTransactions: 0,
          status: 'success', // All saved transactions are successful
          totalValue: totalValue,
          importedBy: group.user_email || 'Unknown',
          importedAt: group.created_at,
          buyCount: buyTransactions.length,
          sellCount: sellTransactions.length,
          transactions: group.transactions // Store full transaction data for details
        };
      });
      
      // Apply filters
      let filteredData = importHistoryData;
      
      // Filter by transaction type
      if (filters.transactionType !== 'all') {
        if (filters.transactionType === 'bulk-buy') {
          filteredData = filteredData.filter(item => item.buyCount > 0 && item.sellCount === 0);
        } else if (filters.transactionType === 'bulk-sell') {
          filteredData = filteredData.filter(item => item.sellCount > 0 && item.buyCount === 0);
      }
      }
      
      // Filter by status
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(item => item.status === filters.status);
      }
      
      // Apply date filter (based on importedAt)
      filteredData = filteredData.filter(item => {
        if (!item.importedAt) return false;
        const importDate = new Date(item.importedAt).toISOString().split('T')[0];
        return importDate >= filters.startDate && importDate <= filters.endDate;
      });
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(item =>
          item.id?.toLowerCase().includes(searchLower) ||
          item.fileName?.toLowerCase().includes(searchLower) ||
          item.importedBy?.toLowerCase().includes(searchLower) ||
          item.trade_report_id?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by importedAt descending (most recent first)
      filteredData.sort((a, b) => {
        const dateA = new Date(a.importedAt);
        const dateB = new Date(b.importedAt);
        return dateB - dateA;
      });
      
      setImportHistory(filteredData);
    } catch (err) {
      console.error('Error fetching import history:', err);
      setError('Failed to fetch import history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (importItem) => {
    setSelectedImport(importItem);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedImport(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return (
          <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        );
      case 'failed':
        return (
          <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
        );
      case 'pending':
        return (
          <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="import-history-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Import History...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="import-history-container">
        <div className="error-container">
          <h3 className="error-title">Error Loading Import History</h3>
          <p className="error-message">{error}</p>
          <button onClick={fetchImportHistory} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="import-history-container">
      {/* Header */}
      <div className="ih-header-section">
        <div className="ih-header-icon">
          <svg className="ih-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="ih-header-text-group">
          <h1 className="ih-main-title">Import History</h1>
          <p className="ih-subtitle">View and manage bulk transaction import history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ih-filters-section">
        <div className="ih-filters-row">
          <div className="ih-filter-group">
            <label className="ih-filter-label">Start Date:</label>
            <input
              type="date"
              className="ih-filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="ih-filter-group">
            <label className="ih-filter-label">End Date:</label>
            <input
              type="date"
              className="ih-filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="ih-filter-group">
            <label className="ih-filter-label">Type:</label>
            <select
              className="ih-filter-select"
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="bulk-buy">Buy</option>
              <option value="bulk-sell">Sell</option>
            </select>
          </div>
          <div className="ih-filter-group">
            <label className="ih-filter-label">Status:</label>
            <select
              className="ih-filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="ih-filter-group">
            <label className="ih-filter-label">Search:</label>
            <input
              type="text"
              className="ih-filter-input"
              placeholder="Search by ID, file, or user..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="ih-filter-actions">
            <button onClick={fetchImportHistory} className="ih-refresh-button">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="ih-summary-stats">
        <div className="ih-stat-card">
          <div className="ih-stat-value">{importHistory.length}</div>
          <div className="ih-stat-label">Total Imports</div>
        </div>
        <div className="ih-stat-card">
          <div className="ih-stat-value">
            {importHistory.filter(item => item.status === 'success').length}
          </div>
          <div className="ih-stat-label">Successful</div>
        </div>
        <div className="ih-stat-card">
          <div className="ih-stat-value">
            {importHistory.filter(item => item.status === 'failed').length}
          </div>
          <div className="ih-stat-label">Failed</div>
        </div>
        <div className="ih-stat-card">
          <div className="ih-stat-value">
            {importHistory.reduce((sum, item) => sum + item.totalTransactions, 0)}
          </div>
          <div className="ih-stat-label">Total Transactions</div>
        </div>
      </div>

      {/* Import History Table */}
      <div className="ih-main-content">
        <div className="ih-table-container">
          <table className="ih-data-table">
            <thead>
              <tr className="ih-table-header">
                <th className="ih-th-transactions-count">No. of Transactions</th>
                <th className="ih-th-trade-report-id">Trade Report ID</th>
                <th className="ih-th-transactions">Transactions</th>
                <th className="ih-th-value">Total Value</th>
                <th className="ih-th-user">Imported By</th>
                <th className="ih-th-date">Imported At</th>
                <th className="ih-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {importHistory.map((item, index) => (
                <tr key={item.id} className="ih-import-row">
                  <td className="ih-transactions-count">{index + 1}</td>
                  <td className="ih-trade-report-id">{item.trade_report_id || 'N/A'}</td>
                  <td className="ih-transactions">
                    <div className="ih-transaction-stats">
                      <span className="ih-success-count">B: {item.buyCount || 0}</span>
                      <span className="ih-separator"> | </span>
                      <span className="ih-failed-count">S: {item.sellCount || 0}</span>
                      <span className="ih-separator"> | </span>
                      <span className="ih-total-count">Total: {item.totalTransactions}</span>
                    </div>
                  </td>
                  <td className="ih-total-value">{formatCurrency(item.totalValue)}</td>
                  <td className="ih-imported-by">{item.importedBy}</td>
                  <td className="ih-imported-at">{formatDate(item.importedAt)}</td>
                  <td className="ih-actions">
                    <button 
                      className="ih-view-details-button"
                      onClick={() => handleViewDetails(item)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedImport && (
        <div className="ih-modal-overlay" onClick={handleCloseModal}>
          <div className="ih-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ih-modal-header">
              <h3 className="ih-modal-title">Import Details - {selectedImport.id}</h3>
              <button className="ih-modal-close" onClick={handleCloseModal}>
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="ih-modal-body">
              <div className="ih-details-grid">
                <div className="ih-detail-item">
                  <label>File Name:</label>
                  <span>{selectedImport.fileName}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Trade Report ID:</label>
                  <span>{selectedImport.trade_report_id || 'N/A'}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Total Transactions:</label>
                  <span>{selectedImport.totalTransactions}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Buy Transactions:</label>
                  <span className="ih-success-text">{selectedImport.buyCount || 0}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Sell Transactions:</label>
                  <span className="ih-failed-text">{selectedImport.sellCount || 0}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Total Value:</label>
                  <span>{formatCurrency(selectedImport.totalValue)}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Imported By:</label>
                  <span>{selectedImport.importedBy}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Imported At:</label>
                  <span>{formatDate(selectedImport.importedAt)}</span>
                </div>
              </div>
              
              {selectedImport.transactions && selectedImport.transactions.length > 0 && (
                <div className="ih-transactions-section" style={{ marginTop: '2rem' }}>
                  <h4 className="ih-errors-title">Transaction Details:</h4>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Trade Date</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Company ID</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Quantity</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Price</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Value</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Execution ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedImport.transactions.map((txn, index) => {
                          const qty = parseFloat(txn.quantity) || 0;
                          const price = parseFloat(txn.price) || 0;
                          const value = qty * price;
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.5rem' }}>{txn.trade_date || 'N/A'}</td>
                              <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  backgroundColor: (txn.buy_sell === 'B' || txn.buy_sell === 'b') ? '#dbeafe' : '#fef3c7',
                                  color: (txn.buy_sell === 'B' || txn.buy_sell === 'b') ? '#1e40af' : '#92400e'
                                }}>
                                  {txn.buy_sell === 'B' || txn.buy_sell === 'b' ? 'BUY' : 'SELL'}
                                </span>
                              </td>
                              <td style={{ padding: '0.5rem' }}>{txn.company_id || 'N/A'}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{qty.toLocaleString()}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{price.toFixed(4)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(value)}</td>
                              <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{txn.execution_id || 'N/A'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportHistory;
