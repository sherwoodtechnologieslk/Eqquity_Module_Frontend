import React, { useState } from 'react';
import './Styles/FundInformation.css';

const FundInformation = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const funds = [
    {
      id: 1,
      name: 'Equity Growth Fund',
      category: 'Equity',
      nav: 25.45,
      change: 2.3,
      aum: 450000000,
      minInvestment: 10000,
      risk: 'High',
      return1Y: 15.2,
      return3Y: 18.5,
      return5Y: 22.1
    },
    {
      id: 2,
      name: 'Balanced Income Fund',
      category: 'Balanced',
      nav: 18.92,
      change: 1.8,
      aum: 320000000,
      minInvestment: 5000,
      risk: 'Moderate',
      return1Y: 12.5,
      return3Y: 14.8,
      return5Y: 16.2
    },
    {
      id: 3,
      name: 'Fixed Income Fund',
      category: 'Fixed Income',
      nav: 10.25,
      change: 0.5,
      aum: 280000000,
      minInvestment: 5000,
      risk: 'Low',
      return1Y: 6.5,
      return3Y: 7.2,
      return5Y: 8.1
    },
    {
      id: 4,
      name: 'Index Fund',
      category: 'Equity',
      nav: 32.15,
      change: 3.5,
      aum: 180000000,
      minInvestment: 10000,
      risk: 'High',
      return1Y: 14.2,
      return3Y: 16.5,
      return5Y: 18.8
    },
    {
      id: 5,
      name: 'Dividend Income Equity Fund',
      category: 'Equity',
      nav: 22.80,
      change: 1.5,
      aum: 275000000,
      minInvestment: 10000,
      risk: 'Moderate',
      return1Y: 11.2,
      return3Y: 13.5,
      return5Y: 15.8
    },
    {
      id: 6,
      name: 'Money Market Fund',
      category: 'Money Market',
      nav: 1.00,
      change: 0.1,
      aum: 150000000,
      minInvestment: 1000,
      risk: 'Very Low',
      return1Y: 4.2,
      return3Y: 4.5,
      return5Y: 4.8
    }
  ];

  const categories = ['all', 'Equity', 'Balanced', 'Fixed Income', 'Money Market'];

  const filteredFunds = funds.filter(fund => {
    const matchesCategory = selectedCategory === 'all' || fund.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      fund.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [selectedFund, setSelectedFund] = useState(null);

  return (
    <div className="cp-fund-info">
      <div className="cp-fund-info-header">
        <h1>Fund Information</h1>
        <p>Browse and explore available investment funds</p>
      </div>

      {/* Filters */}
      <div className="cp-fund-filters">
        <div className="cp-search-box">
          <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Search funds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cp-search-input"
          />
        </div>
        <div className="cp-category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`cp-category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Funds Grid */}
      <div className="cp-funds-grid">
        {filteredFunds.map(fund => (
          <div 
            key={fund.id} 
            className="cp-fund-card"
            onClick={() => setSelectedFund(selectedFund?.id === fund.id ? null : fund)}
          >
            <div className="cp-fund-card-header">
              <h3>{fund.name}</h3>
              <span className={`cp-fund-category ${fund.category.toLowerCase().replace(' ', '-')}`}>
                {fund.category}
              </span>
            </div>
            <div className="cp-fund-card-body">
              <div className="cp-fund-nav">
                <div className="cp-nav-label">Current NAV</div>
                <div className="cp-nav-value">{fund.nav.toFixed(2)}</div>
                <div className={`cp-nav-change ${fund.change >= 0 ? 'positive' : 'negative'}`}>
                  {fund.change >= 0 ? '+' : ''}{fund.change}%
                </div>
              </div>
              <div className="cp-fund-details">
                <div className="cp-detail-item">
                  <span className="cp-detail-label">1Y Return</span>
                  <span className="cp-detail-value positive">{fund.return1Y}%</span>
                </div>
                <div className="cp-detail-item">
                  <span className="cp-detail-label">Risk Level</span>
                  <span className={`cp-risk-badge ${fund.risk.toLowerCase().replace(' ', '-')}`}>
                    {fund.risk}
                  </span>
                </div>
                <div className="cp-detail-item">
                  <span className="cp-detail-label">Min Investment</span>
                  <span className="cp-detail-value">{fund.minInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {selectedFund?.id === fund.id && (
              <div className="cp-fund-expanded">
                <div className="cp-expanded-section">
                  <h4>Performance</h4>
                  <div className="cp-performance-grid">
                    <div className="cp-performance-item">
                      <span>1 Year</span>
                      <span className="positive">{fund.return1Y}%</span>
                    </div>
                    <div className="cp-performance-item">
                      <span>3 Years</span>
                      <span className="positive">{fund.return3Y}%</span>
                    </div>
                    <div className="cp-performance-item">
                      <span>5 Years</span>
                      <span className="positive">{fund.return5Y}%</span>
                    </div>
                  </div>
                </div>
                <div className="cp-expanded-section">
                  <h4>Fund Details</h4>
                  <div className="cp-details-list">
                    <div className="cp-detail-row">
                      <span>Assets Under Management:</span>
                      <span>{fund.aum.toLocaleString()}</span>
                    </div>
                    <div className="cp-detail-row">
                      <span>Minimum Investment:</span>
                      <span>{fund.minInvestment.toLocaleString()}</span>
                    </div>
                    <div className="cp-detail-row">
                      <span>Risk Level:</span>
                      <span>{fund.risk}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundInformation;
