import React, { useState, useEffect } from 'react';
import './Styles/SellEquitySelectorModal.css';

const SellEquitySelectorModal = ({ isOpen, onClose, onSelect, companies, selectedCompany, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => {
        const companyName = typeof company === 'object' ? company.company_name : company;
        return companyName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const handleCompanySelect = (company) => {
    const companyName = typeof company === 'object' ? company.company_name : company;
    onSelect(companyName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sell-equity-modal-overlay">
      <div className="sell-equity-modal-content">
        {/* Header */}
        <div className="sell-equity-modal-header">
          <h2 className="sell-equity-modal-title">Select Company</h2>
          <button onClick={onClose} className="sell-equity-modal-close">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Search Section */}
        <div className="sell-equity-modal-search">
          <div className="sell-equity-search-input-wrapper">
            <svg className="sell-equity-search-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="sell-equity-search-input"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="sell-equity-modal-body">
          {loading ? (
            <div className="sell-equity-loading">
              <div className="sell-equity-loading-spinner"></div>
              <p>Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="sell-equity-no-results">
              <p>No companies found</p>
            </div>
          ) : (
            <div className="sell-equity-list">
              {filteredCompanies.map((company, index) => {
                const companyName = typeof company === 'object' ? company.company_name : company;
                const isSelected = companyName === selectedCompany;
                
                return (
                  <div
                    key={index}
                    className={`sell-equity-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <div className="sell-equity-company-name">
                      {companyName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sell-equity-modal-footer">
          <div className="sell-equity-results-count">
            {filteredCompanies.length} company{filteredCompanies.length !== 1 ? 's' : ''} found
          </div>
          <button onClick={onClose} className="sell-equity-modal-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellEquitySelectorModal;
