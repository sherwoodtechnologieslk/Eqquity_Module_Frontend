import React, { useState, useEffect } from 'react';
import fundsCenterService from '../../services/fundsCenterService';
import './FundsCenters.css';

const FundsCenters = () => {
  const [fundsCenters, setFundsCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFundsCenter, setNewFundsCenter] = useState({
    name: '',
    flag: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadFundsCenters();
  }, []);

  const loadFundsCenters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fundsCenterService.getAllFundsCenters();
      if (response.success && response.data) {
        setFundsCenters(response.data);
      } else {
        setFundsCenters([]);
      }
    } catch (err) {
      setError('Failed to load funds centers');
      console.error('Error loading funds centers:', err);
      setFundsCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFundsCenter.name.trim()) {
      alert('Please enter a funds center name');
      return;
    }

    try {
      await fundsCenterService.createFundsCenter({
        name: newFundsCenter.name.trim(),
        flag: newFundsCenter.flag.trim() || null
      });
      setSuccessMessage('Funds center added successfully');
      setShowAddModal(false);
      setNewFundsCenter({ name: '', flag: '' });
      await loadFundsCenters();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert('This funds center already exists');
      } else {
        alert('Failed to add funds center. Please try again.');
        console.error('Error adding funds center:', err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this funds center?')) {
      try {
        await fundsCenterService.deleteFundsCenter(id);
        setSuccessMessage('Funds center deleted successfully');
        await loadFundsCenters();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        alert('Failed to delete funds center. Please try again.');
        console.error('Error deleting funds center:', err);
      }
    }
  };

  const filteredFundsCenters = fundsCenters.filter(center => {
    const query = searchQuery.toLowerCase();
    const name = (center.name || '').toLowerCase();
    const flag = (center.flag || '').toLowerCase();
    return name.includes(query) || flag.includes(query);
  });

  const totalCount = fundsCenters.length;
  const customCount = fundsCenters.filter(c => c.isCustom).length;
  const defaultCount = totalCount - customCount;
  const withFlagCount = fundsCenters.filter(c => c.flag && c.flag !== '0' && c.flag !== 0).length;

  return (
    <div className="fc-container">
      <div className="fc-content-wrapper">
      {/* Toolbar */}
      <header className="fc-header">
        <div className="fc-header-left">
          <p className="fc-eyebrow">Master Data · Funds</p>
          <h1 className="fc-title">Funds Centers</h1>
          <p className="fc-subtitle">Manage portfolio funds centers and their regional flags</p>
        </div>
        <div className="fc-header-actions">
          <button
            type="button"
            className="fc-refresh-btn"
            onClick={loadFundsCenters}
            disabled={loading}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            className="fc-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="fc-add-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
            </svg>
            Add Funds Center
          </button>
        </div>
      </header>

      {/* KPI Summary */}
      <section className="fc-kpis" aria-label="Funds centers summary">
        <div className="fc-kpi">
          <span className="fc-kpi__value">{totalCount}</span>
          <span className="fc-kpi__label">Total Centers</span>
        </div>
        <div className="fc-kpi">
          <span className="fc-kpi__value">{defaultCount}</span>
          <span className="fc-kpi__label">Default</span>
        </div>
        <div className="fc-kpi">
          <span className="fc-kpi__value">{customCount}</span>
          <span className="fc-kpi__label">Custom</span>
        </div>
        <div className="fc-kpi">
          <span className="fc-kpi__value">{withFlagCount}</span>
          <span className="fc-kpi__label">With Flag</span>
        </div>
      </section>

      {successMessage && (
        <div className="fc-success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="fc-error-message">
          {error}
        </div>
      )}

      <div className="fc-search-container">
        <div className="fc-search-box">
          <svg className="fc-search-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            className="fc-search-input"
            placeholder="Search funds centers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="fc-table-container">
        {loading ? (
          <div className="fc-loading">
            <div className="fc-loading-spinner"></div>
            <p>Loading funds centers...</p>
          </div>
        ) : (
          <>
        {filteredFundsCenters.length === 0 ? (
          <div className="fc-empty-state">
            <p>No funds centers found</p>
          </div>
        ) : (
          <table className="fc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Flag</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFundsCenters.map((center) => (
                <tr key={center.id}>
                  <td>{center.id}</td>
                  <td className="fc-name-cell">{center.name}</td>
                  <td className="fc-flag-cell">
                    {center.flag && center.flag !== '0' && center.flag !== 0 ? (
                      <span className="fc-flag">{center.flag}</span>
                    ) : (
                      <span className="fc-no-flag">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`fc-type-badge ${center.isCustom ? 'fc-custom' : 'fc-default'}`}>
                      {center.isCustom ? 'Custom' : 'Default'}
                    </span>
                  </td>
                  <td className="fc-actions-cell">
                    {center.isCustom && (
                      <button
                        onClick={() => handleDelete(center.id)}
                        className="fc-delete-btn"
                        title="Delete funds center"
                      >
                        <svg className="fc-delete-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        Delete
                      </button>
                    )}
                    {!center.isCustom && (
                      <span className="fc-readonly">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fc-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h2>Add Funds Center</h2>
              <button
                className="fc-modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setNewFundsCenter({ name: '', flag: '' });
                }}
              >
                ×
              </button>
            </div>
            <form className="fc-modal-form" onSubmit={handleAdd}>
              <div className="fc-form-group">
                <label htmlFor="name" className="fc-label">
                  Name <span className="fc-required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="fc-input"
                  value={newFundsCenter.name}
                  onChange={(e) => setNewFundsCenter({ ...newFundsCenter, name: e.target.value })}
                  placeholder="Enter funds center name"
                  required
                />
              </div>
              <div className="fc-form-group">
                <label htmlFor="flag" className="fc-label">
                  Flag (Optional)
                </label>
                <input
                  type="text"
                  id="flag"
                  className="fc-input"
                  value={newFundsCenter.flag}
                  onChange={(e) => setNewFundsCenter({ ...newFundsCenter, flag: e.target.value })}
                  placeholder="Enter flag (e.g., 🇱🇰)"
                />
              </div>
              <div className="fc-modal-actions">
                <button
                  type="button"
                  className="fc-cancel-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFundsCenter({ name: '', flag: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="fc-submit-btn">
                  Add Funds Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FundsCenters;
