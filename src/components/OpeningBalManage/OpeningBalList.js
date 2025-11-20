import React, { useState, useEffect } from 'react';
import './Styles/OpeningBalList.css';
import { openingBalanceAPI } from '../../services/api';

const OpeningBalList = () => {
  const [openingBalances, setOpeningBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterBalanceType, setFilterBalanceType] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadOpeningBalances();
  }, []);

  const loadOpeningBalances = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await openingBalanceAPI.getAll();
      
      if (response.success && response.data) {
        setOpeningBalances(response.data);
      } else {
        throw new Error(response.error || 'Failed to load opening balances');
      }
      
    } catch (err) {
      console.error('Error loading opening balances:', err);
      setError(err.message || 'Failed to load opening balances. Please try again.');
      setOpeningBalances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      const response = await openingBalanceAPI.delete(id);
      
      if (response.success) {
        // Remove from list after successful deletion
        setOpeningBalances(prev => prev.filter(ob => ob.id !== id));
        setDeleteConfirm(null);
      } else {
        throw new Error(response.error || 'Failed to delete opening balance');
      }
    } catch (err) {
      console.error('Error deleting opening balance:', err);
      setError(err.message || 'Failed to delete opening balance. Please try again.');
    }
  };

  // Filter opening balances
  const filteredBalances = openingBalances.filter(balance => {
    if (!balance) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const accountCode = (balance.account_code || balance.accountCode || '').toLowerCase();
    const accountName = (balance.account_name || balance.accountName || '').toLowerCase();
    const description = (balance.description || '').toLowerCase();
    
    const matchesSearch = 
      accountCode.includes(searchLower) ||
      accountName.includes(searchLower) ||
      description.includes(searchLower);
    
    const balanceDate = balance.opening_balance_date || balance.openingBalanceDate;
    const matchesDate = !filterDate || balanceDate === filterDate;
    
    const debit = parseFloat(balance.debit) || 0;
    const credit = parseFloat(balance.credit) || 0;
    const matchesType = 
      filterBalanceType === 'All' ||
      (filterBalanceType === 'Debit' && debit > 0) ||
      (filterBalanceType === 'Credit' && credit > 0);
    
    return matchesSearch && matchesDate && matchesType;
  });

  // Calculate totals
  const totals = filteredBalances.reduce((acc, balance) => {
    if (!balance) return acc;
    acc.totalDebit += parseFloat(balance.debit) || 0;
    acc.totalCredit += parseFloat(balance.credit) || 0;
    return acc;
  }, { totalDebit: 0, totalCredit: 0 });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="opening-bal-list-container">
      {/* Header Section */}
      <div className="opening-bal-list-header-section">
        <div className="opening-bal-list-header-icon">
          <svg className="opening-bal-list-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="opening-bal-list-header-text-group">
          <h1 className="opening-bal-list-main-title">Opening Balance List</h1>
          <p className="opening-bal-list-subtitle">View and manage all opening balance entries</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="opening-bal-list-error-message">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
          <button className="error-close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Data Card */}
      <div className="opening-bal-list-data-card">
        {/* Search and Filter Section */}
        <div className="opening-bal-list-search-container">
          <div className="opening-bal-list-search-wrapper">
            <input
              type="text"
              className="opening-bal-list-search-input"
              placeholder="Search by account code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="opening-bal-list-filters">
            <div className="filter-group">
              <label htmlFor="filterDate" className="filter-label">Date:</label>
              <input
                type="date"
                id="filterDate"
                className="filter-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="filterBalanceType" className="filter-label">Type:</label>
              <select
                id="filterBalanceType"
                className="filter-select"
                value={filterBalanceType}
                onChange={(e) => setFilterBalanceType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            
            <button
              className="filter-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
                setFilterBalanceType('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="opening-bal-list-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading opening balances...</p>
            </div>
          ) : filteredBalances.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <h3>No Opening Balances Found</h3>
              <p>{searchTerm || filterDate || filterBalanceType !== 'All' 
                ? 'Try adjusting your search or filters.' 
                : 'No opening balances have been created yet.'}</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="opening-bal-list-table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Date</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalances.map((balance) => {
                      if (!balance) return null;
                      const accountCode = balance.account_code || balance.accountCode || '-';
                      const accountName = balance.account_name || balance.accountName || '-';
                      const balanceDate = balance.opening_balance_date || balance.openingBalanceDate;
                      const debit = parseFloat(balance.debit) || 0;
                      const credit = parseFloat(balance.credit) || 0;
                      const description = balance.description || '-';
                      
                      return (
                        <tr key={balance.id}>
                          <td className="account-code-cell">
                            <span className="code-text">{accountCode}</span>
                          </td>
                          <td className="account-name-cell">{accountName}</td>
                          <td>{formatDate(balanceDate)}</td>
                          <td className={debit > 0 ? 'debit-amount' : ''}>
                            {debit > 0 ? formatCurrency(debit) : '-'}
                          </td>
                          <td className={credit > 0 ? 'credit-amount' : ''}>
                            {credit > 0 ? formatCurrency(credit) : '-'}
                          </td>
                          <td className="description-cell">
                            {description}
                          </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn view-btn"
                              title="View Details"
                              onClick={() => {
                                // TODO: Implement view functionality
                                console.log('View:', balance);
                              }}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                              </svg>
                            </button>
                            <button
                              className="action-btn edit-btn"
                              title="Edit"
                              onClick={() => {
                                // TODO: Implement edit functionality
                                console.log('Edit:', balance);
                              }}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                              </svg>
                            </button>
                            <button
                              className="action-btn delete-btn"
                              title="Delete"
                              onClick={() => setDeleteConfirm(balance.id)}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="3" className="totals-label">Total</td>
                      <td className="debit-amount total-amount">
                        {formatCurrency(totals.totalDebit)}
                      </td>
                      <td className="credit-amount total-amount">
                        {formatCurrency(totals.totalCredit)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="table-summary">
                <p>
                  Showing <strong>{filteredBalances.length}</strong> of <strong>{openingBalances.length}</strong> opening balance{openingBalances.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this opening balance entry? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningBalList;

