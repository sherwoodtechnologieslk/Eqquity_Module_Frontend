import React, { useState, useEffect } from 'react';
import { equityAPI } from '../../services/api';
import './Styles/EquitySelectorModal.css';

const SKIP_WORDS = new Set(['PLC', 'LTD', 'LIMITED', 'THE', 'AND', '&', 'PVT', 'PRIVATE']);

const avatarLabel = (symbol, name) => {
  const ticker = String(symbol || '')
    .split(/[.\s]/)[0]
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
  if (ticker.length >= 2) return ticker.slice(0, 4);

  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((part) => part && !SKIP_WORDS.has(part.toUpperCase()));
  if (parts.length === 0) return 'EQ';
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

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
      const q = searchTerm.toLowerCase();
      const filtered = equities.filter((equity) =>
        String(equity.name || '').toLowerCase().includes(q) ||
        String(equity.symbol || '').toLowerCase().includes(q) ||
        String(equity.isin || '').toLowerCase().includes(q)
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
        <header className="equity-modal-header">
          <div className="equity-modal-heading">
            <p className="equity-modal-eyebrow">Trade Capture · Buy</p>
            <h2 className="equity-modal-title">Select Equity</h2>
          </div>
          <button className="equity-modal-close" onClick={handleClose} aria-label="Close">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </header>

        <div className="equity-modal-search">
          <div className="equity-search-input-wrapper">
            <svg className="equity-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            </svg>
            <input
              type="text"
              placeholder="Search by company name, symbol, or ISIN…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="equity-search-input"
              autoFocus
            />
            {searchTerm ? (
              <button
                type="button"
                className="equity-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        <div className="equity-modal-body">
          {loading ? (
            <div className="equity-loading">
              <div className="equity-loading-spinner"></div>
              <span>Loading equities…</span>
            </div>
          ) : error ? (
            <div className="equity-error">
              <p>{error}</p>
              <button type="button" onClick={fetchEquities} className="equity-retry-btn">Retry</button>
            </div>
          ) : filteredEquities.length === 0 ? (
            <div className="equity-no-results">
              <span className="equity-no-results__title">No matching equities</span>
              <span className="equity-no-results__text">
                Try a different company name, ticker, or ISIN.
              </span>
            </div>
          ) : (
            <div className="equity-list">
              {filteredEquities.map((equity) => (
                <button
                  type="button"
                  key={equity.id}
                  className={`equity-item ${selectedEquity?.id === equity.id ? 'selected' : ''}`}
                  onClick={() => handleEquitySelect(equity)}
                >
                  <span className="equity-avatar" aria-hidden>
                    {avatarLabel(equity.symbol, equity.name)}
                  </span>
                  <span className="equity-item-main">
                    <span className="equity-company-name">{equity.name}</span>
                    <span className="equity-item-meta">
                      <span className="equity-symbol">{equity.symbol || '—'}</span>
                      {equity.isin ? <span className="equity-isin">{equity.isin}</span> : null}
                    </span>
                  </span>
                  <span className="equity-item-details">
                    {equity.sector ? <span className="equity-sector">{equity.sector}</span> : null}
                    {equity.market ? <span className="equity-market">{equity.market}</span> : null}
                  </span>
                  <span className={`equity-status-badge ${equity.isActive ? 'active' : 'inactive'}`}>
                    {equity.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="equity-modal-footer">
          <div className="equity-results-count">
            {!loading && !error ? (
              <span>{filteredEquities.length} of {equities.length} equities</span>
            ) : null}
          </div>
          <button type="button" className="equity-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EquitySelectorModal;
