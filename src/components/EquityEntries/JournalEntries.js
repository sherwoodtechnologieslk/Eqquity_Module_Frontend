import React, { useState, useEffect } from 'react';
import './Styles/JournalEntries.css';

const JournalEntries = ({ onTabChange }) => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [availablePortfolios, setAvailablePortfolios] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    transactionType: 'all',
    dateFrom: '',
    dateTo: '',
    portfolio: 'all'
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    account_code: '',
    account_name: '',
    description: '',
    reference: '',
    debit: '',
    credit: '',
    transaction_type: '',
    status: 'Draft'
  });

  useEffect(() => {
    loadJournalEntries();
    loadAccounts();
    loadPortfolios();
  }, []);

  useEffect(() => {
    loadJournalEntries();
  }, [filters.portfolio]);

  useEffect(() => {
    filterEntries();
  }, [entries, filters]);

  const loadJournalEntries = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Loading journal entries...', filters.portfolio !== 'all' ? `(portfolio: ${filters.portfolio})` : '');
      const token = localStorage.getItem('token');
      
      let url = `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries`;
      if (filters.portfolio && filters.portfolio !== 'all') {
        url += `?portfolio=${encodeURIComponent(filters.portfolio)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEntries(result.data);
          console.log(`📊 Loaded ${result.data.length} journal entries`);
        } else {
          console.error('API error:', result.error);
        }
      } else {
        console.error('Failed to fetch journal entries:', response.status);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolios = async () => {
    try {
      console.log('📋 Loading available portfolios...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/portfolios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Portfolios API response:', result);
        if (result.success) {
          setAvailablePortfolios(result.data || []);
          console.log(`📊 Loaded ${result.data?.length || 0} portfolios`);
          console.log('Portfolios data:', result.data);
        } else {
          console.error('API error:', result.error);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch portfolios:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      console.log('📋 Loading chart of accounts for Journal Entries...');
      const token = localStorage.getItem('token');
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/accounts/list`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success) {
          console.log(`✅ Loaded ${result.data?.length || 0} accounts`);
          setAccounts(result.data || []);
          
          if (!result.data || result.data.length === 0) {
            console.warn('⚠️ No accounts returned from API');
          }
        } else {
          console.error('API returned success=false:', result.error);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch accounts. Status:', response.status);
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      console.error('Error details:', error.message);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Filter by transaction type
    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(entry => entry.transaction_type === filters.transactionType);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(entry => entry.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => entry.date <= filters.dateTo);
    }

    setFilteredEntries(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format numeric inputs with thousands separators
    if (name === 'debit' || name === 'credit') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const formattedValue = numericValue ? formatCurrency(parseFloat(numericValue)) : '';
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAccountChange = (e) => {
    const accountCode = e.target.value;
    const selectedAccount = accounts.find(acc => acc.account_code === accountCode);
    
    setFormData(prev => ({
      ...prev,
      account_code: accountCode,
      account_name: selectedAccount ? selectedAccount.description : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingEntry 
        ? `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/${editingEntry.id}`
        : `${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries`;
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      // Convert formatted values back to numbers for API
      const submitData = {
        ...formData,
        debit: parseFloat(formData.debit.replace(/[^0-9.]/g, '')) || 0,
        credit: parseFloat(formData.credit.replace(/[^0-9.]/g, '')) || 0
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Journal entry saved successfully');
          loadJournalEntries();
          handleCloseModal();
        } else {
          console.error('API error:', result.error);
        }
      } else {
        console.error('Failed to save journal entry:', response.status);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      account_code: entry.account_code,
      account_name: entry.account_name,
      description: entry.description,
      reference: entry.reference,
      debit: formatCurrency(entry.debit),
      credit: formatCurrency(entry.credit),
      transaction_type: entry.transaction_type,
      status: entry.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/journal-entries/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log('✅ Journal entry deleted successfully');
            loadJournalEntries();
          }
        }
      } catch (error) {
        console.error('Error deleting journal entry:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      account_code: '',
      account_name: '',
      description: '',
      reference: '',
      debit: '',
      credit: '',
      transaction_type: '',
      status: 'Draft'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="journal-entries-loading">
        <div className="loading-spinner"></div>
        <p>Loading journal entries...</p>
      </div>
    );
  }

  return (
    <div className="journal-entries">
      <div className="journal-entries-header">
        <h1>Journal Entries</h1>
        <button 
          className="btn-primary"
          onClick={() => onTabChange && onTabChange('Buy')}
        >
          + New Entry
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Portfolio:</label>
          <select 
            value={filters.portfolio} 
            onChange={(e) => setFilters(prev => ({ ...prev, portfolio: e.target.value }))}
          >
            <option value="all">All Portfolios</option>
            {availablePortfolios.map((portfolio) => (
              <option key={portfolio.portfolioId || portfolio.portfolio} value={portfolio.portfolioId || portfolio.portfolio}>
                {portfolio.portfolioName || portfolio.portfolio}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Transaction Type:</label>
          <select 
            value={filters.transactionType} 
            onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="Trade">Trade</option>
            <option value="Dividend">Dividend</option>
            <option value="Corporate Action">Corporate Action</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div className="filter-group">
          <label>From Date:</label>
          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label>To Date:</label>
          <input 
            type="date" 
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>

        <button 
          className="btn-secondary"
          onClick={() => setFilters({
            status: 'all',
            transactionType: 'all',
            dateFrom: '',
            dateTo: '',
            portfolio: 'all'
          })}
        >
          Clear Filters
        </button>
      </div>

      {/* Entries Table */}
      <div className="entries-table-container">
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Payment Details</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  No journal entries found
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td title={entry.account_code || undefined}>{entry.account_code}</td>
                  <td>{entry.account_name}</td>
                  <td>{entry.description}</td>
                  <td>{entry.reference}</td>
                  <td>
                    {entry.transaction_account_name && (
                      <div className="payment-details">
                        <div><strong>{entry.transaction_account_name}</strong></div>
                        {entry.account_number && <div>Acc: {entry.account_number}</div>}
                        {entry.bank_name && <div>Bank: {entry.bank_name}</div>}
                        {entry.payment_method && <div>Method: {entry.payment_method}</div>}
                      </div>
                    )}
                  </td>
                  <td className="amount">{formatCurrency(entry.debit)}</td>
                  <td className="amount">{formatCurrency(entry.credit)}</td>
                  <td className="amount">{formatCurrency(entry.balance)}</td>
                  <td>{entry.transaction_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="journal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Account *</label>
                  <select
                    name="account_code"
                    value={formData.account_code}
                    onChange={handleAccountChange}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Reference</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Debit Amount</label>
                  <input
                    type="text"
                    name="debit"
                    value={formData.debit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Credit Amount</label>
                  <input
                    type="text"
                    name="credit"
                    value={formData.credit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Trade">Trade</option>
                    <option value="Dividend">Dividend</option>
                    <option value="Corporate Action">Corporate Action</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Posted">Posted</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEntry ? 'Update' : 'Create'} Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
