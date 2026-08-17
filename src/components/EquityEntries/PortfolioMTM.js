import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/api';
import './Styles/PortfolioMTM.css';

const PortfolioMTM = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Fetch portfolios
    const fetchPortfolios = async () => {
      try {
        setPortfoliosLoading(true);
        const portfoliosData = await portfolioAPI.getActivePortfolios();
        console.log('🔍 PORTFOLIO MTM - Loaded portfolios:', portfoliosData);
        setPortfolios(portfoliosData);
      } catch (err) {
        console.error('❌ PORTFOLIO MTM - Error loading active portfolios:', err);
        setError('Failed to fetch portfolios');
        setPortfolios([]);
      } finally {
        setPortfoliosLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  const getUniquePortfolios = () => {
    if (!portfolios || portfolios.length === 0) {
      return [''];
    }
    // Include empty string for "None" option, then portfolio IDs
    return ['', ...portfolios.map(portfolio => portfolio.id)];
  };

  const getPortfolioName = (portfolioId) => {
    if (portfolioId === '') return 'Select a portfolio...';
    const portfolio = portfolios.find(p => p.id === portfolioId);
    return portfolio ? portfolio.portfolioName : portfolioId;
  };

  if (loading) {
    return (
      <div className="portfolio-mtm-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Portfolio MTM Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-mtm-container">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-mtm-container">
      <header className="portfolio-mtm-header">
        <div className="portfolio-mtm-header-text">
          <p className="portfolio-mtm-eyebrow">Accounting · Valuation</p>
          <h1>Portfolio Mark-to-Market</h1>
          <p className="portfolio-mtm-blurb">Daily portfolio valuations and unrealized P&amp;L tracking</p>
        </div>
      </header>

      {/* Filters */}
      <div className="pmtm-filters-section">
        <div className="pmtm-filter-group">
          <label htmlFor="portfolio-filter">Portfolio:</label>
          <select
            id="portfolio-filter"
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            className="pmtm-filter-select"
            disabled={portfoliosLoading}
          >
            {portfoliosLoading ? (
              <option value="">Loading portfolios...</option>
            ) : (
              getUniquePortfolios().map(portfolioId => (
                <option key={portfolioId} value={portfolioId}>
                  {getPortfolioName(portfolioId)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="pmtm-filter-group">
          <label htmlFor="start-date">From Date:</label>
          <input
            id="start-date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="pmtm-filter-input"
          />
        </div>

        <div className="pmtm-filter-group">
          <label htmlFor="end-date">To Date:</label>
          <input
            id="end-date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="pmtm-filter-input"
          />
        </div>
      </div>
    </div>
  );
};

export default PortfolioMTM;
