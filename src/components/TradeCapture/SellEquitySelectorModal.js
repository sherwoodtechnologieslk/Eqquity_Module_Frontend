import React, { useState, useEffect } from 'react';
import './Styles/SellEquitySelectorModal.css';

const SKIP_WORDS = new Set(['PLC', 'LTD', 'LIMITED', 'THE', 'AND', '&', 'PVT', 'PRIVATE']);

const companyNameOf = (company) =>
  typeof company === 'object' ? (company.company_name || company.name || '') : String(company || '');

const avatarLabel = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((part) => part && !SKIP_WORDS.has(part.toUpperCase()));
  if (parts.length === 0) return 'CO';
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const SellEquitySelectorModal = ({ isOpen, onClose, onSelect, companies, selectedCompany, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  useEffect(() => {
    const list = Array.isArray(companies) ? companies : [];
    if (searchTerm.trim() === '') {
      setFilteredCompanies(list);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredCompanies(
        list.filter((company) => companyNameOf(company).toLowerCase().includes(q))
      );
    }
  }, [searchTerm, companies]);

  const handleCompanySelect = (company) => {
    onSelect(companyNameOf(company));
    setSearchTerm('');
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  const totalCount = Array.isArray(companies) ? companies.length : 0;

  return (
    <div className="sell-equity-modal-overlay" onClick={handleClose}>
      <div className="sell-equity-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="sell-equity-modal-header">
          <div className="sell-equity-modal-heading">
            <p className="sell-equity-modal-eyebrow">Trade Capture · Sell</p>
            <h2 className="sell-equity-modal-title">Select Company</h2>
          </div>
          <button type="button" className="sell-equity-modal-close" onClick={handleClose} aria-label="Close">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </header>

        <div className="sell-equity-modal-search">
          <div className="sell-equity-search-input-wrapper">
            <svg className="sell-equity-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            </svg>
            <input
              type="text"
              className="sell-equity-search-input"
              placeholder="Search companies…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm ? (
              <button
                type="button"
                className="sell-equity-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        <div className="sell-equity-modal-body">
          {loading ? (
            <div className="sell-equity-loading">
              <div className="sell-equity-loading-spinner"></div>
              <span>Loading companies…</span>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="sell-equity-no-results">
              <span className="sell-equity-no-results__title">No matching companies</span>
              <span className="sell-equity-no-results__text">
                {searchTerm
                  ? 'Try a different company name.'
                  : 'No holdings found for this portfolio.'}
              </span>
            </div>
          ) : (
            <div className="sell-equity-list">
              {filteredCompanies.map((company, index) => {
                const companyName = companyNameOf(company);
                const isSelected = companyName === selectedCompany;

                return (
                  <button
                    type="button"
                    key={`${companyName}-${index}`}
                    className={`sell-equity-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <span className="sell-equity-avatar" aria-hidden>
                      {avatarLabel(companyName)}
                    </span>
                    <span className="sell-equity-company-name">{companyName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="sell-equity-modal-footer">
          <div className="sell-equity-results-count">
            {!loading ? (
              <span>
                {filteredCompanies.length} of {totalCount}{' '}
                {totalCount === 1 ? 'company' : 'companies'}
              </span>
            ) : null}
          </div>
          <button type="button" className="sell-equity-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SellEquitySelectorModal;
