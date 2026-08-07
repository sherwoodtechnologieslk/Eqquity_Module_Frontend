import React, { useState, useEffect } from 'react';
import './Styles/DealSlipScreen.css';

const DealSlipScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dealSlips, setDealSlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDealSlips();
  }, []);

  const loadDealSlips = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      setDealSlips([]);
    } catch (error) {
      console.error('Error loading deal slips:', error);
      setDealSlips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const filteredSlips = dealSlips.filter((slip) => {
    const matchesSearch =
      slip.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slip.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || slip.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    completed: dealSlips.filter((slip) => slip.status === 'completed').length,
    pending: dealSlips.filter((slip) => slip.status === 'pending').length,
    draft: dealSlips.filter((slip) => slip.status === 'draft').length,
    total: dealSlips.length
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'ds-status--completed';
      case 'pending':
        return 'ds-status--pending';
      case 'draft':
        return 'ds-status--draft';
      default:
        return 'ds-status--default';
    }
  };

  if (isLoading) {
    return (
      <div className="ds-root">
        <div className="ds-loading">
          <div className="ds-spinner" />
          <p>Loading deal slips…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-root">
      <header className="ds-rail">
        <div>
          <p className="ds-rail__eyebrow">Accounting</p>
          <h1 className="ds-rail__title">Deal Slips</h1>
          <p className="ds-rail__blurb">Manage and track your deal slips.</p>
        </div>
      </header>

      <div className="ds-card">
        <div className="ds-toolbar">
          <div className="ds-search-bar">
            <svg className="ds-search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by client name or deal ID…"
              value={searchQuery}
              onChange={handleSearchChange}
              className="ds-search-input"
            />
            <button type="button" className="ds-btn ds-btn--primary">
              Search
            </button>
          </div>

          <nav className="ds-filters" aria-label="Deal slip filters">
            {['all', 'completed', 'pending', 'draft'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`ds-filter${selectedFilter === filter ? ' active' : ''}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="ds-stats">
          <div className="ds-stat">
            <div className="ds-stat__label">Completed</div>
            <div className="ds-stat__value ds-stat__value--ok">{stats.completed}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat__label">Pending</div>
            <div className="ds-stat__value ds-stat__value--warn">{stats.pending}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat__label">Draft</div>
            <div className="ds-stat__value">{stats.draft}</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat__label">Total</div>
            <div className="ds-stat__value ds-stat__value--blue">{stats.total}</div>
          </div>
        </div>
      </div>

      {filteredSlips.length > 0 ? (
        <div className="ds-grid">
          {filteredSlips.map((slip) => (
            <div key={slip.id} className="ds-slip-card">
              <div className="ds-slip-card__head">
                <div className="ds-slip-id">{slip.id}</div>
                <span className={`ds-status ${getStatusClass(slip.status)}`}>{slip.status}</span>
              </div>

              <div className="ds-slip-card__body">
                <h4 className="ds-client">{slip.client}</h4>
                <div className="ds-amount">{slip.amount}</div>
                <div className="ds-meta">
                  <span className="ds-type">{slip.type}</span>
                  <span className="ds-date">{slip.date}</span>
                </div>
              </div>

              <div className="ds-slip-card__actions">
                <button type="button" className="ds-btn ds-btn--secondary">
                  View
                </button>
                <button type="button" className="ds-btn ds-btn--primary">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ds-empty">
          <h3>No deal slips found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DealSlipScreen;
