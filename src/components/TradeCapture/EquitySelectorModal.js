import React, { useState, useEffect } from 'react';
import { equityAPI } from '../../services/api';
import './Styles/EquitySelectorModal.css';

const EquitySelectorModal = ({ isOpen, onClose, onSelect, selectedEquity }) => {
  const [equities, setEquities] = useState([]);
  const [filteredEquities, setFilteredEquities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEquities();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEquities(equities);
    } else {
      const filtered = equities.filter(equity =>
        equity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equity.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equity.isin.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquities(filtered);
    }
  }, [searchTerm, equities]);

  const fetchEquities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await equityAPI.getActiveEquities();
      setEquities(data);
      setFilteredEquities(data);
    } catch (err) {
      setError('Failed to fetch equities');
      console.error('Error fetching equities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquitySelect = (equity) => {
    onSelect(equity);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="equity-modal-overlay" onClick={handleClose}>
      <div className="equity-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="equity-modal-header">
          <h2 className="equity-modal-title">Select Equity</h2>
          <button className="equity-modal-close" onClick={handleClose}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <div className="equity-modal-search">
          <div className="equity-search-input-wrapper">
            <svg className="equity-search-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              placeholder="Search by company name, symbol, or ISIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="equity-search-input"
              autoFocus
            />
          </div>
        </div>

        <div className="equity-modal-body">
          {loading ? (
            <div className="equity-loading">
              <div className="equity-loading-spinner"></div>
              <p>Loading equities...</p>
            </div>
          ) : error ? (
            <div className="equity-error">
              <p>{error}</p>
              <button onClick={fetchEquities} className="equity-retry-btn">Retry</button>
            </div>
          ) : filteredEquities.length === 0 ? (
            <div className="equity-no-results">
              <p>No equities found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="equity-list">
              {filteredEquities.map((equity) => (
                <div
                  key={equity.id}
                  className={`equity-item ${selectedEquity?.id === equity.id ? 'selected' : ''}`}
                  onClick={() => handleEquitySelect(equity)}
                >
                  <div className="equity-item-main">
                    <div className="equity-company-name">{equity.name}</div>
                    <div className="equity-symbol">{equity.symbol}</div>
                  </div>
                  <div className="equity-item-details">
                    <div className="equity-isin">ISIN: {equity.isin}</div>
                    <div className="equity-sector">{equity.sector}</div>
                    <div className="equity-market">{equity.market}</div>
                  </div>
                  <div className="equity-item-status">
                    <span className={`equity-status-badge ${equity.isActive ? 'active' : 'inactive'}`}>
                      {equity.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="equity-modal-footer">
          <div className="equity-results-count">
            {!loading && !error && (
              <span>{filteredEquities.length} of {equities.length} equities</span>
            )}
          </div>
          <button className="equity-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquitySelectorModal;
