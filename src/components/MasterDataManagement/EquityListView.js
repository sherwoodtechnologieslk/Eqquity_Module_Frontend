import React, { useState, useEffect } from 'react';
import { equityAPI } from '../../services/api';
import './Styles/EquityListView.css';

const EquityListView = () => {
  const [equities, setEquities] = useState([]);
  const [filteredEquities, setFilteredEquities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchEquities();
  }, []);

  useEffect(() => {
    filterEquities();
  }, [searchQuery, equities]);

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

  if (loading) {
    return (
      <div className="eqt-list-container">
        <div className="eqt-loading">
          <div className="eqt-loading-spinner"></div>
          <p>Loading equities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eqt-list-container">

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
              {filteredEquities.length} of {equities.length} equities found
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
          <p>{searchQuery ? `No equities found matching "${searchQuery}". Try adjusting your search terms.` : 'Add your first equity using the Equity Master Entry form to get started.'}</p>
        </div>
      ) : (
        <div className="eqt-table-container">
        
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
                {filteredEquities.map((equity, index) => (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquityListView;