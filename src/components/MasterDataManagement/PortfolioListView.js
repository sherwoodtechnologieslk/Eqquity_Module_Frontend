import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/api';
import './Styles/PortfolioListView.css';

const PortfolioListView = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        console.error('Error deleting portfolio:', err);
        
        // Check if it's a dependency error
        if (err.message && err.message.includes('dependencies')) {
          alert(`Cannot delete portfolio: ${err.message}\n\nPlease remove all related data first (costing methods, strategies, transactions) before deleting the portfolio.`);
        } else {
          alert('Failed to delete portfolio. Please try again.');
        }
      }
    }
  };

  const handleEdit = (portfolio) => {
    setEditingId(portfolio.id);
    setEditForm({
      portfolioId: portfolio.portfolioId,
      portfolioName: portfolio.portfolioName,
      portfolioType: portfolio.portfolioType,
      entity: portfolio.entity,
      fundManager: portfolio.fundManager,
      baseCurrency: portfolio.baseCurrency,
      status: portfolio.status,
      riskProfile: portfolio.riskProfile || '',
      benchmark: portfolio.benchmark || '',
      startDate: portfolio.startDate || '',
      endDate: portfolio.endDate || '',
      investmentHorizon: portfolio.investmentHorizon || '',
      targetYield: portfolio.targetYield || '',
      notes: portfolio.notes || ''
    });
  };

  const handleSave = async () => {
    try {
      await portfolioAPI.updatePortfolio(editingId, editForm);
      
      // Update local state
      setPortfolios(portfolios.map(portfolio => 
        portfolio.id === editingId 
          ? { ...portfolio, ...editForm }
          : portfolio
      ));
      
      setEditingId(null);
      setEditForm({});
      alert('Portfolio updated successfully!');
    } catch (err) {
      console.error('Error updating portfolio:', err);
      alert('Failed to update portfolio. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderEditableCell = (portfolio, field, type = 'text') => {
    if (editingId === portfolio.id) {
      if (type === 'select') {
        return (
          <select
            value={editForm[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="portfolio-edit-input"
          >
            <option value="">Select...</option>
            {field === 'status' && (
              <>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </>
            )}
            {field === 'riskProfile' && (
              <>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </>
            )}
            {field === 'baseCurrency' && (
              <>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </>
            )}
          </select>
        );
      }
      if (type === 'date') {
        return (
          <input
            type="date"
            value={editForm[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="portfolio-edit-input"
          />
        );
      }
      if (type === 'textarea') {
        return (
          <textarea
            value={editForm[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="portfolio-edit-input portfolio-edit-textarea"
            rows="2"
          />
        );
      }
      return (
        <input
          type="text"
          value={editForm[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="portfolio-edit-input"
        />
      );
    }
    return portfolio[field] || '-';
  };

  const renderActions = (portfolio) => {
    if (editingId === portfolio.id) {
      return (
        <div className="portfolio-edit-actions">
          <button
            onClick={handleSave}
            className="portfolio-save-btn"
            title="Save changes"
          >
            <svg className="portfolio-save-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Save
          </button>
          <button
            onClick={handleCancel}
            className="portfolio-cancel-btn"
            title="Cancel editing"
          >
            <svg className="portfolio-cancel-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="portfolio-action-buttons">
        <button
          onClick={() => handleEdit(portfolio)}
          className="portfolio-edit-btn"
          title="Edit portfolio"
        >
          <svg className="portfolio-edit-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
          Edit
        </button>
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
      </div>
    );
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
                  <th>Risk Profile</th>
                  <th>Benchmark</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((portfolio, idx) => (
                  <tr key={portfolio.id} className={idx % 2 === 0 ? 'portfolio-row-even' : 'portfolio-row-odd'}>
                    <td className="portfolio-cell-id">{portfolio.id}</td>
                    <td>{renderEditableCell(portfolio, 'portfolioId')}</td>
                    <td className="portfolio-cell-name">{renderEditableCell(portfolio, 'portfolioName')}</td>
                    <td>{renderEditableCell(portfolio, 'portfolioType')}</td>
                    <td>{renderEditableCell(portfolio, 'entity')}</td>
                    <td>{renderEditableCell(portfolio, 'fundManager')}</td>
                    <td>{renderEditableCell(portfolio, 'baseCurrency', 'select')}</td>
                    <td>{renderEditableCell(portfolio, 'riskProfile', 'select')}</td>
                    <td>{renderEditableCell(portfolio, 'benchmark')}</td>
                    <td className="portfolio-cell-status">
                      {editingId === portfolio.id ? (
                        renderEditableCell(portfolio, 'status', 'select')
                      ) : (
                        <span className={`portfolio-status-badge ${portfolio.status === 'Active' ? 'active' : 'inactive'}`}>
                          <span className="portfolio-status-dot"></span>
                          {portfolio.status}
                        </span>
                      )}
                    </td>
                    <td>{renderActions(portfolio)}</td>
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
