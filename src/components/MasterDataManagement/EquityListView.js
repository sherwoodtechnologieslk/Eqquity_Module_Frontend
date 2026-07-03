import React, { useState, useEffect, useRef, useCallback } from 'react';
import { equityAPI } from '../../services/api';
import './Styles/EquityListView.css';

const PAGE_SIZE = 20;

const EquityListView = ({ embedded = false, refreshKey = 0 }) => {
  const [equities, setEquities] = useState([]);
  const [filteredEquities, setFilteredEquities] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [editingEquity, setEditingEquity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const loadMoreRef = useRef(null);
  const scrollAreaRef = useRef(null);
  useEffect(() => {
    fetchEquities();
  }, [refreshKey]);

  useEffect(() => {
    filterEquities();
  }, [searchQuery, equities]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, refreshKey, filteredEquities.length]);

  const loadMore = useCallback(() => {
    setVisibleCount((count) => {
      if (count >= filteredEquities.length) {
        return count;
      }
      return Math.min(count + PAGE_SIZE, filteredEquities.length);
    });
  }, [filteredEquities.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const scrollRoot = scrollAreaRef.current;
    if (!sentinel || filteredEquities.length <= visibleCount) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        root: scrollRoot,
        rootMargin: '80px',
        threshold: 0.1
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredEquities.length, visibleCount, loadMore]);

  const fetchEquities = async () => {
    try {
      setLoading(true);
      const data = await equityAPI.getAllEquities();
      setEquities(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch equities');
      console.error('Error fetching equities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEquities = () => {
    if (!searchQuery.trim()) {
      setFilteredEquities(equities);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = equities.filter(equity => 
      equity.name?.toLowerCase().includes(query) ||
      equity.symbol?.toLowerCase().includes(query) ||
      equity.isin?.toLowerCase().includes(query) ||
      equity.sector?.toLowerCase().includes(query) ||
      equity.market?.toLowerCase().includes(query) ||
      equity.country?.toLowerCase().includes(query)
    );
    setFilteredEquities(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equity?')) {
      try {
        await equityAPI.deleteEquity(id);
        setEquities(equities.filter(equity => equity.id !== id));
      } catch (err) {
        alert('Failed to delete equity');
        console.error('Error deleting equity:', err);
      }
    }
  };

  const handleEdit = (equity) => {
    setEditingEquity(equity);
    setShowEditModal(true);
  };

  const handleUpdateEquity = async (updatedEquity) => {
    try {
      await equityAPI.updateEquity(editingEquity.id, updatedEquity);
      setEquities(equities.map(equity => 
        equity.id === editingEquity.id ? { ...equity, ...updatedEquity } : equity
      ));
      setShowEditModal(false);
      setEditingEquity(null);
    } catch (err) {
      alert('Failed to update equity');
      console.error('Error updating equity:', err);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingEquity(null);
  };

  const containerClass = embedded
    ? 'eqt-list-container eqt-list-container--embedded'
    : 'eqt-list-container';

  const visibleEquities = filteredEquities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEquities.length;

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="eqt-loading">
          <div className="eqt-loading-spinner"></div>
          <p>Loading equities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>

      {/* Unique Search Bar */}
      <div className="eqt-search-container">
        <div className={`eqt-search-wrapper ${searchFocused ? 'focused' : ''}`}>
          <div className="eqt-search-icon-container">
            <svg className="eqt-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="eqt-search-input"
            placeholder="Search equities by name, symbol, ISIN, sector, market, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery && (
            <button
              className="eqt-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="eqt-search-ripple"></div>
        </div>
        {searchQuery && (
          <div className="eqt-search-results-info">
            <span className="eqt-search-count">
              Showing {Math.min(visibleCount, filteredEquities.length)} of {filteredEquities.length} matches
              {hasMore ? ' — scroll down for more' : ''}
            </span>
          </div>
        )}
        {!searchQuery && filteredEquities.length > 0 && (
          <div className="eqt-search-results-info">
            <span className="eqt-search-count">
              Showing {Math.min(visibleCount, filteredEquities.length)} of {filteredEquities.length} equities
              {hasMore ? ' — scroll down for more' : ''}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="eqt-error-message">
          <svg className="eqt-error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {filteredEquities.length === 0 ? (
        <div className="eqt-empty-state">
          <div className="eqt-empty-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3>{searchQuery ? 'No Search Results' : 'No Equities Found'}</h3>
          <p>{searchQuery ? `No equities found matching "${searchQuery}". Try adjusting your search terms.` : 'Add your first equity using the form above.'}</p>
        </div>
      ) : (
        <div className="eqt-table-container">
          <div className="eqt-table-scroll-area" ref={scrollAreaRef}>
            <div className="eqt-table-wrapper">
              <table className="eqt-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Symbol</th>
                    <th>ISIN</th>
                    <th>Sector</th>
                    <th>Market</th>
                    <th>Country</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEquities.map((equity, index) => (
                    <tr key={equity.id} className={index % 2 === 0 ? 'eqt-row-even' : 'eqt-row-odd'}>
                    <td className="eqt-cell-name">{equity.name}</td>
                    <td className="eqt-cell-symbol">{equity.symbol}</td>
                    <td className="eqt-cell-isin">{equity.isin}</td>
                    <td className="eqt-cell-sector">{equity.sector}</td>
                    <td className="eqt-cell-market">{equity.market}</td>
                    <td className="eqt-cell-country">{equity.country}</td>
                    <td className="eqt-cell-currency">{equity.currency}</td>
                    <td className="eqt-cell-status">
                      <span className={`eqt-status-badge ${equity.isActive ? 'active' : 'inactive'}`}>
                        <span className="eqt-status-dot"></span>
                        {equity.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="eqt-cell-actions">
                      <div className="eqt-action-buttons">
                        <button
                          onClick={() => handleEdit(equity)}
                          className="eqt-edit-btn"
                          title="Edit equity"
                        >
                          <svg className="eqt-edit-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(equity.id)}
                          className="eqt-delete-btn"
                          title="Delete equity"
                        >
                          <svg className="eqt-delete-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
                  {hasMore && (
                    <tr ref={loadMoreRef} className="eqt-load-more-row">
                      <td colSpan="9">
                        <div className="eqt-load-more-indicator">
                          <div className="eqt-load-more-spinner"></div>
                          <span>Loading more equities...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEquity && (
        <EditEquityModal
          equity={editingEquity}
          onUpdate={handleUpdateEquity}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};

// Edit Equity Modal Component
const EditEquityModal = ({ equity, onUpdate, onClose }) => {
  const [form, setForm] = useState({
    companyName: equity.name || '',
    tickerSymbol: equity.symbol || '',
    isin: equity.isin || '',
    sector: equity.sector || '',
    market: equity.market || 'Colombo Stock Exchange',
    country: equity.country || 'Sri Lanka',
    currency: equity.currency || 'LKR',
    status: equity.isActive !== false,
    notes: equity.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['companyName', 'tickerSymbol'];
    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Check if ticker symbol already exists (excluding current equity)
    try {
      const symbolCheck = await equityAPI.checkSymbolExists(form.tickerSymbol.trim());
      if (symbolCheck.exists && form.tickerSymbol.trim() !== equity.symbol) {
        alert(`Ticker Symbol "${form.tickerSymbol.trim()}" already exists. Please use a different symbol.`);
        return;
      }
    } catch (error) {
      console.error('Error checking symbol:', error);
      alert('Error checking ticker symbol. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const equityData = {
        name: form.companyName,
        symbol: form.tickerSymbol.trim(),
        isin: form.isin,
        sector: form.sector,
        market: form.market,
        country: form.country,
        currency: form.currency,
        isActive: form.status,
        notes: form.notes
      };

      await onUpdate(equityData);
      setSubmitMessage('Equity updated successfully!');
      
    } catch (error) {
      console.error('Error updating equity:', error);
      setSubmitMessage('Error updating equity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eqt-modal-overlay">
      <div className="eqt-modal">
        <div className="eqt-modal-header">
          <h2>Edit Equity</h2>
          <button onClick={onClose} className="eqt-modal-close">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <div className="eqt-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="eqt-form-grid">
              {/* Company Name */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Company Name *</label>
                <input
                  name="companyName"
                  placeholder="Enter company name"
                  value={form.companyName}
                  onChange={handleChange}
                  className="eqt-form-input"
                />
              </div>

              {/* Ticker Symbol */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Ticker Symbol *</label>
                <input
                  name="tickerSymbol"
                  placeholder="e.g., AAPL"
                  value={form.tickerSymbol}
                  onChange={handleChange}
                  className="eqt-form-input"
                />
              </div>

              {/* ISIN */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">ISIN</label>
                <input
                  name="isin"
                  placeholder="e.g., US0378331005"
                  value={form.isin}
                  onChange={handleChange}
                  className="eqt-form-input"
                />
              </div>

              {/* Sector */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Sector</label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="eqt-form-select"
                >
                  <option value="">Select Sector</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Consumer Goods">Consumer Goods</option>
                  <option value="Energy">Energy</option>
                  <option value="Construction & Engineering">Construction & Engineering</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Real Estate & Property Development">Real Estate & Property Development</option>
                  <option value="Retail & Trading">Retail & Trading</option>
                  <option value="Investment Trusts & Holdings">Investment Trusts & Holdings</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Plantations/Agriculture">Plantations/Agriculture</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Market */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Market</label>
                <input
                  name="market"
                  value={form.market}
                  readOnly
                  className="eqt-form-input eqt-readonly-field"
                />
              </div>

              {/* Country */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Country</label>
                <input
                  name="country"
                  value={form.country}
                  readOnly
                  className="eqt-form-input eqt-readonly-field"
                />
              </div>

              {/* Currency */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Currency</label>
                <input
                  name="currency"
                  value={form.currency}
                  readOnly
                  className="eqt-form-input eqt-readonly-field"
                />
              </div>

              {/* Status Toggle */}
              <div className="eqt-field-group">
                <label className="eqt-field-label">Status</label>
                <div className="eqt-status-container">
                  <label className="eqt-toggle-wrapper">
                    <input
                      type="checkbox"
                      name="status"
                      checked={form.status}
                      onChange={handleChange}
                      className="eqt-toggle-input"
                    />
                    <div className={`eqt-toggle-slider ${form.status ? 'active' : ''}`}>
                      <div className="eqt-toggle-thumb"></div>
                    </div>
                  </label>
                  <span className={`eqt-status-text ${form.status ? 'active' : ''}`}>
                    {form.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="eqt-notes-section">
              <label className="eqt-field-label">Notes & Description</label>
              <textarea
                name="notes"
                placeholder="Add any additional notes or description about this equity..."
                value={form.notes}
                onChange={handleChange}
                rows="4"
                className="eqt-form-textarea"
              ></textarea>
            </div>

            {/* Success/Error Message */}
            {submitMessage && (
              <div className={`eqt-message ${submitMessage.includes('Error') ? 'eqt-error' : 'eqt-success'}`}>
                {submitMessage}
              </div>
            )}

            {/* Buttons */}
            <div className="eqt-button-section">
              <button
                type="button"
                onClick={onClose}
                className="eqt-btn eqt-btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="eqt-btn eqt-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Equity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquityListView;