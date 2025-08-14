import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/api';
import './Styles/PortfolioListView.css';

const PortfolioListView = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolios();
    // eslint-disable-next-line
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioAPI.getAllPortfolios();
      setPortfolios(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch portfolios');
      console.error('Error fetching portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await portfolioAPI.deletePortfolio(id);
        setPortfolios(portfolios.filter((portfolio) => portfolio.id !== id));
      } catch (err) {
        alert('Failed to delete portfolio');
        console.error('Error deleting portfolio:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="portfolio-list-container">
        <div className="portfolio-loading">
          <div className="portfolio-loading-spinner"></div>
          <p>Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-list-container">
      {error && (
        <div className="portfolio-error-message">
          <svg className="portfolio-error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="portfolio-empty-state">
          <div className="portfolio-empty-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3>No Portfolios Found</h3>
          <p>Add your first portfolio using the Portfolio Master Entry form to get started.</p>
        </div>
      ) : (
        <div className="portfolio-table-container">
          <div className="portfolio-table-wrapper">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Portfolio ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Fund Manager</th>
                  <th>Base Currency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((portfolio, idx) => (
                  <tr key={portfolio.id} className={idx % 2 === 0 ? 'portfolio-row-even' : 'portfolio-row-odd'}>
                    <td className="portfolio-cell-id">{portfolio.id}</td>
                    <td>{portfolio.portfolioId}</td>
                    <td className="portfolio-cell-name">{portfolio.portfolioName}</td>
                    <td>{portfolio.portfolioType}</td>
                    <td>{portfolio.entity}</td>
                    <td>{portfolio.fundManager}</td>
                    <td>{portfolio.baseCurrency}</td>
                    <td className="portfolio-cell-status">
                      <span className={`portfolio-status-badge ${portfolio.status === 'Active' ? 'active' : 'inactive'}`}>
                        <span className="portfolio-status-dot"></span>
                        {portfolio.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(portfolio.id)}
                        className="portfolio-delete-btn"
                        title="Delete portfolio"
                      >
                        <svg className="portfolio-delete-icon" fill="currentColor" viewBox="0 0 20 20">
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

export default PortfolioListView;
