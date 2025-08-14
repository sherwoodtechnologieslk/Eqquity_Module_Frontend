import React, { useState } from 'react';
import './Styles/DealSlipScreen.css';

const DealSlipScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  // Mock data for demonstration
  const dealSlips = [
    {
      id: 'DS-001',
      client: 'Acme Corporation',
      amount: '$15,450.00',
      status: 'pending',
      date: '2025-06-10',
      type: 'Purchase'
    },
    {
      id: 'DS-002',
      client: 'TechFlow Solutions',
      amount: '$8,200.00',
      status: 'completed',
      date: '2025-06-12',
      type: 'Sale'
    },
    {
      id: 'DS-003',
      client: 'Global Industries',
      amount: '$22,750.00',
      status: 'draft',
      date: '2025-06-13',
      type: 'Purchase'
    },
    {
      id: 'DS-004',
      client: 'Innovation Labs',
      amount: '$12,300.00',
      status: 'pending',
      date: '2025-06-11',
      type: 'Sale'
    }
  ];

  const filteredSlips = dealSlips.filter(slip => {
    const matchesSearch = slip.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         slip.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || slip.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'draft': return 'status-draft';
      default: return 'status-default';
    }
  };

  return (
    <div className="deal-slip-container">
      <div className="deal-slip-content-wrapper">
        {/* Header Section - Updated to match equity master style */}
        <div className="deal-slip-header-section">
          <div className="deal-slip-header-icon">
            <svg className="deal-slip-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="deal-slip-header-text-group">
            <h1 className="deal-slip-main-title">Deal Slips</h1>
            <p className="deal-slip-subtitle">Manage and track your deal slips</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="deal-slip-controls">
          <div className="deal-slip-search-bar">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search by client name or deal ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="deal-slip-search-input"
              />
            </div>
            <button className="deal-slip-search-button">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Search
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {['all', 'completed', 'pending', 'draft'].map(filter => (
              <button
                key={filter}
                className={`filter-tab ${selectedFilter === filter ? 'active' : ''}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon completed">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>1</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>2</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon draft">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>1</h3>
              <p>Draft</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>4</h3>
              <p>Total</p>
            </div>
          </div>
        </div>

        {/* Deal Slips Grid */}
        <div className="deal-slips-grid">
          {filteredSlips.map(slip => (
            <div key={slip.id} className="deal-slip-card">
              <div className="card-header">
                <div className="deal-id">{slip.id}</div>
                <span className={`status-badge ${getStatusColor(slip.status)}`}>
                  {slip.status}
                </span>
              </div>
              
              <div className="card-content">
                <h4 className="client-name">{slip.client}</h4>
                <div className="deal-amount">{slip.amount}</div>
                <div className="deal-meta">
                  <span className="deal-type">{slip.type}</span>
                  <span className="deal-date">{slip.date}</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="action-button view">View</button>
                <button className="action-button edit">Edit</button>
              </div>
            </div>
          ))}
        </div>

        {filteredSlips.length === 0 && (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
            <h3>No deal slips found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealSlipScreen;