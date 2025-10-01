import React, { useState, useEffect } from 'react';
import './Styles/ImportHistory.css';

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

  // Mock data for demonstration
  const mockImportHistory = [
    {
      id: 'BULK-BUY-20250930-122531',
      type: 'Bulk Buy',
      fileName: 'bulk_buy_transactions_20250930.csv',
      totalTransactions: 25,
      successfulTransactions: 24,
      failedTransactions: 1,
      status: 'success',
      importedBy: 'John Doe',
      importedAt: '2025-09-30T12:25:31Z',
      totalValue: 1250000.50,
      portfolio: 'Main Portfolio',
      errors: [
        {
          row: 15,
          field: 'quantity',
          error: 'Invalid quantity format',
          value: 'abc'
        }
      ]
    },
    {
      id: 'BULK-BUY-20250928-143022',
      type: 'Bulk Buy',
      fileName: 'equity_purchases_20250928.xlsx',
      totalTransactions: 50,
      successfulTransactions: 50,
      failedTransactions: 0,
      status: 'success',
      importedBy: 'Jane Smith',
      importedAt: '2025-09-28T14:30:22Z',
      totalValue: 2500000.75,
      portfolio: 'Growth Portfolio',
      errors: []
    },
    {
      id: 'BULK-BUY-20250925-091545',
      type: 'Bulk Buy',
      fileName: 'bulk_trades_20250925.csv',
      totalTransactions: 15,
      successfulTransactions: 0,
      failedTransactions: 15,
      status: 'failed',
      importedBy: 'Mike Johnson',
      importedAt: '2025-09-25T09:15:45Z',
      totalValue: 0,
      portfolio: 'Conservative Portfolio',
      errors: [
        {
          row: 1,
          field: 'equity_code',
          error: 'Equity code not found',
          value: 'INVALID001'
        },
        {
          row: 3,
          field: 'date',
          error: 'Invalid date format',
          value: '32/09/2025'
        }
      ]
    },
    {
      id: 'BULK-SELL-20250922-165430',
      type: 'Bulk Sell',
      fileName: 'sell_transactions_20250922.csv',
      totalTransactions: 30,
      successfulTransactions: 30,
      failedTransactions: 0,
      status: 'success',
      importedBy: 'Sarah Wilson',
      importedAt: '2025-09-22T16:54:30Z',
      totalValue: 1800000.25,
      portfolio: 'Trading Portfolio',
      errors: []
    },
    {
      id: 'BULK-BUY-20250920-110205',
      type: 'Bulk Buy',
      fileName: 'ipo_allocations_20250920.xlsx',
      totalTransactions: 100,
      successfulTransactions: 95,
      failedTransactions: 5,
      status: 'success',
      importedBy: 'David Brown',
      importedAt: '2025-09-20T11:02:05Z',
      totalValue: 5000000.00,
      portfolio: 'IPO Portfolio',
      errors: [
        {
          row: 23,
          field: 'allocation_amount',
          error: 'Allocation amount exceeds available',
          value: '50000'
        }
      ]
    }
  ];

  useEffect(() => {
    fetchImportHistory();
  }, [filters]);

  const fetchImportHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredData = mockImportHistory;
      
      // Apply filters
      if (filters.transactionType !== 'all') {
        filteredData = filteredData.filter(item => 
          item.type.toLowerCase().replace(' ', '-') === filters.transactionType
        );
      }
      
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(item => item.status === filters.status);
      }
      
      // Apply date filter
      filteredData = filteredData.filter(item => {
        const importDate = new Date(item.importedAt).toISOString().split('T')[0];
        return importDate >= filters.startDate && importDate <= filters.endDate;
      });
      
      // Apply search filter
      if (searchTerm) {
        filteredData = filteredData.filter(item =>
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.importedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.portfolio.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setImportHistory(filteredData);
    } catch (err) {
      console.error('Error fetching import history:', err);
      setError('Failed to fetch import history');
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
              <option value="bulk-buy">Bulk Buy</option>
              <option value="bulk-sell">Bulk Sell</option>
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
                <th className="ih-th-id">Import ID</th>
                <th className="ih-th-type">Type</th>
                <th className="ih-th-file">File Name</th>
                <th className="ih-th-transactions">Transactions</th>
                <th className="ih-th-status">Status</th>
                <th className="ih-th-value">Total Value</th>
                <th className="ih-th-user">Imported By</th>
                <th className="ih-th-date">Imported At</th>
                <th className="ih-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {importHistory.map((item) => (
                <tr key={item.id} className="ih-import-row">
                  <td className="ih-import-id">{item.id}</td>
                  <td className="ih-import-type">
                    <span className={`ih-type-badge ${item.type.toLowerCase().replace(' ', '-')}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="ih-file-name">{item.fileName}</td>
                  <td className="ih-transactions">
                    <div className="ih-transaction-stats">
                      <span className="ih-success-count">{item.successfulTransactions}</span>
                      <span className="ih-separator">/</span>
                      <span className="ih-total-count">{item.totalTransactions}</span>
                      {item.failedTransactions > 0 && (
                        <span className="ih-failed-count"> ({item.failedTransactions} failed)</span>
                      )}
                    </div>
                  </td>
                  <td className="ih-status">
                    <div className="ih-status-badge" style={{ backgroundColor: getStatusColor(item.status) }}>
                      {getStatusIcon(item.status)}
                      <span className="ih-status-text">{item.status.toUpperCase()}</span>
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
                  <label>Portfolio:</label>
                  <span>{selectedImport.portfolio}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Total Transactions:</label>
                  <span>{selectedImport.totalTransactions}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Successful:</label>
                  <span className="ih-success-text">{selectedImport.successfulTransactions}</span>
                </div>
                <div className="ih-detail-item">
                  <label>Failed:</label>
                  <span className="ih-failed-text">{selectedImport.failedTransactions}</span>
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
              
              {selectedImport.errors && selectedImport.errors.length > 0 && (
                <div className="ih-errors-section">
                  <h4 className="ih-errors-title">Errors Found:</h4>
                  <div className="ih-errors-list">
                    {selectedImport.errors.map((error, index) => (
                      <div key={index} className="ih-error-item">
                        <span className="ih-error-row">Row {error.row}:</span>
                        <span className="ih-error-field">{error.field}</span>
                        <span className="ih-error-message">{error.error}</span>
                        <span className="ih-error-value">Value: "{error.value}"</span>
                      </div>
                    ))}
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
