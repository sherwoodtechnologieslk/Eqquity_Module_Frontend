import React, { useState, useMemo } from 'react';
import './Styles/FundPerformance.css';

const FundPerformance = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHorizon, setSelectedHorizon] = useState('1Y');
  const [viewMode, setViewMode] = useState('funds'); // 'funds' | 'categories'

  // Mocked fund-level data for now – can be wired to backend later
  const [fundData] = useState({
    summary: {
      totalAUM: 125000000000,
      totalFunds: 18,
      avgReturn1Y: 12.4,
      avgReturn3Y: 10.8,
    },
    categories: [
      { name: 'Equity Funds', aum: 62000000000, funds: 7, return1Y: 15.2, return3Y: 13.1 },
      { name: 'Balanced Funds', aum: 28000000000, funds: 4, return1Y: 11.3, return3Y: 9.4 },
      { name: 'Fixed Income', aum: 21000000000, funds: 3, return1Y: 7.1, return3Y: 6.5 },
      { name: 'Money Market', aum: 9000000000, funds: 2, return1Y: 4.3, return3Y: 4.1 },
      { name: 'Real Estate', aum: 6000000000, funds: 2, return1Y: 9.5, return3Y: 8.7 },
    ],
    funds: [
      {
        code: 'EGF',
        name: 'Equity Growth Fund',
        category: 'Equity Funds',
        aum: 26000000000,
        nav: 25.45,
        change1D: 0.8,
        return1M: 3.1,
        return3M: 7.4,
        return6M: 11.2,
        return1Y: 17.8,
        volatility1Y: 14.2,
        sharpe1Y: 1.25,
        manager: 'John Smith',
      },
      {
        code: 'DIEF',
        name: 'Dividend Income Equity Fund',
        category: 'Equity Funds',
        aum: 18000000000,
        nav: 22.8,
        change1D: 0.4,
        return1M: 2.4,
        return3M: 5.8,
        return6M: 9.7,
        return1Y: 14.3,
        volatility1Y: 11.6,
        sharpe1Y: 1.18,
        manager: 'Emily Davis',
      },
      {
        code: 'BIF',
        name: 'Balanced Income Fund',
        category: 'Balanced Funds',
        aum: 19000000000,
        nav: 18.92,
        change1D: 0.3,
        return1M: 1.9,
        return3M: 4.6,
        return6M: 7.8,
        return1Y: 11.1,
        volatility1Y: 9.3,
        sharpe1Y: 0.98,
        manager: 'Sarah Johnson',
      },
      {
        code: 'FIF',
        name: 'Fixed Income Fund',
        category: 'Fixed Income',
        aum: 13000000000,
        nav: 10.25,
        change1D: 0.1,
        return1M: 0.8,
        return3M: 2.1,
        return6M: 3.8,
        return1Y: 6.2,
        volatility1Y: 3.4,
        sharpe1Y: 0.85,
        manager: 'Michael Chen',
      },
      {
        code: 'MMF',
        name: 'Money Market Fund',
        category: 'Money Market',
        aum: 9000000000,
        nav: 1.0,
        change1D: 0.02,
        return1M: 0.35,
        return3M: 1.0,
        return6M: 2.1,
        return1Y: 4.1,
        volatility1Y: 0.6,
        sharpe1Y: 0.9,
        manager: 'David Wilson',
      },
      {
        code: 'REF',
        name: 'Real Estate Fund',
        category: 'Real Estate',
        aum: 6000000000,
        nav: 32.15,
        change1D: -0.2,
        return1M: 1.2,
        return3M: 3.9,
        return6M: 6.4,
        return1Y: 9.8,
        volatility1Y: 12.7,
        sharpe1Y: 0.92,
        manager: 'Alex Brown',
      },
    ],
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
  };

  const getPerformanceColor = (value) => {
    if (value > 0) return '#16a34a';
    if (value < 0) return '#dc2626';
    return '#64748b';
  };

  const filteredFunds = useMemo(() => {
    return fundData.funds.filter((f) =>
      selectedCategory === 'all' ? true : f.category === selectedCategory,
    );
  }, [fundData.funds, selectedCategory]);

  const bestFund = useMemo(() => {
    return [...fundData.funds].sort((a, b) => b.return1Y - a.return1Y)[0];
  }, [fundData.funds]);

  const worstFund = useMemo(() => {
    return [...fundData.funds].sort((a, b) => a.return1Y - b.return1Y)[0];
  }, [fundData.funds]);

  const getHorizonReturn = (fund) => {
    switch (selectedHorizon) {
      case '1M':
        return fund.return1M;
      case '3M':
        return fund.return3M;
      case '6M':
        return fund.return6M;
      case '1Y':
      default:
        return fund.return1Y;
    }
  };

  return (
    <div className="wfp-container">
      {/* Header */}
      <div className="wfp-header">
        <div className="wfp-header-content">
          <h2>Fund Performance</h2>
          <p className="wfp-subtitle">
            Analyze return, risk and consistency across all unit trust funds.
          </p>
        </div>
        <div className="wfp-header-actions">
          <select
            className="wfp-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {fundData.categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="wfp-select"
            value={selectedHorizon}
            onChange={(e) => setSelectedHorizon(e.target.value)}
          >
            <option value="1M">1M</option>
            <option value="3M">3M</option>
            <option value="6M">6M</option>
            <option value="1Y">1Y</option>
          </select>

          <button className="wfp-btn wfp-btn-primary" type="button">
            <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
            </svg>
            Export Fund Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="wfp-summary-grid">
        <div className="wfp-summary-card wfp-card-1">
          <div className="wfp-summary-header">
            <span className="wfp-summary-label">Total Fund AUM</span>
          </div>
          <div className="wfp-summary-value">{formatCurrency(fundData.summary.totalAUM)}</div>
          <div className="wfp-summary-note">Across {fundData.summary.totalFunds} active funds</div>
        </div>

        <div className="wfp-summary-card wfp-card-2">
          <div className="wfp-summary-header">
            <span className="wfp-summary-label">Average 1Y Return</span>
          </div>
          <div
            className="wfp-summary-value"
            style={{ color: getPerformanceColor(fundData.summary.avgReturn1Y) }}
          >
            {formatPercent(fundData.summary.avgReturn1Y)}
          </div>
          <div className="wfp-summary-note">Simple average across all funds</div>
        </div>

        <div className="wfp-summary-card wfp-card-3">
          <div className="wfp-summary-header">
            <span className="wfp-summary-label">Best 1Y Performer</span>
          </div>
          <div className="wfp-summary-value-small">
            {bestFund?.name || '-'}
            <span className="wfp-pill wfp-pill-positive">
              {formatPercent(bestFund?.return1Y ?? 0)}
            </span>
          </div>
          <div className="wfp-summary-note">{bestFund?.category}</div>
        </div>

        <div className="wfp-summary-card wfp-card-4">
          <div className="wfp-summary-header">
            <span className="wfp-summary-label">Lowest 1Y Performer</span>
          </div>
          <div className="wfp-summary-value-small">
            {worstFund?.name || '-'}
            <span className="wfp-pill wfp-pill-negative">
              {formatPercent(worstFund?.return1Y ?? 0)}
            </span>
          </div>
          <div className="wfp-summary-note">{worstFund?.category}</div>
        </div>
      </div>

      {/* Category Snapshot */}
      <div className="wfp-section">
        <div className="wfp-section-header">
          <h3>Category Snapshot</h3>
          <div className="wfp-view-toggle">
            <button
              type="button"
              className={`wfp-toggle-btn ${viewMode === 'funds' ? 'active' : ''}`}
              onClick={() => setViewMode('funds')}
            >
              By Fund
            </button>
            <button
              type="button"
              className={`wfp-toggle-btn ${viewMode === 'categories' ? 'active' : ''}`}
              onClick={() => setViewMode('categories')}
            >
              By Category
            </button>
          </div>
        </div>

        {viewMode === 'categories' ? (
          <div className="wfp-table-container">
            <table className="wfp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Funds</th>
                  <th>Total AUM</th>
                  <th>Avg 1Y Return</th>
                  <th>Avg 3Y Return</th>
                </tr>
              </thead>
              <tbody>
                {fundData.categories.map((cat) => (
                  <tr key={cat.name}>
                    <td>{cat.name}</td>
                    <td>{cat.funds}</td>
                    <td>{formatCurrency(cat.aum)}</td>
                    <td style={{ color: getPerformanceColor(cat.return1Y) }}>
                      {formatPercent(cat.return1Y)}
                    </td>
                    <td style={{ color: getPerformanceColor(cat.return3Y) }}>
                      {formatPercent(cat.return3Y)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="wfp-table-container">
            <table className="wfp-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Category</th>
                  <th>AUM</th>
                  <th>NAV</th>
                  <th>1D</th>
                  <th>{selectedHorizon} Return</th>
                  <th>1Y Volatility</th>
                  <th>1Y Sharpe</th>
                  <th>Manager</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund) => {
                  const horizonReturn = getHorizonReturn(fund);
                  return (
                    <tr key={fund.code}>
                      <td>
                        <div className="wfp-fund-cell">
                          <span className="wfp-fund-code">{fund.code}</span>
                          <span className="wfp-fund-name">{fund.name}</span>
                        </div>
                      </td>
                      <td>{fund.category}</td>
                      <td>{formatCurrency(fund.aum)}</td>
                      <td>{fund.nav.toFixed(2)}</td>
                      <td style={{ color: getPerformanceColor(fund.change1D) }}>
                        {formatPercent(fund.change1D, 2)}
                      </td>
                      <td style={{ color: getPerformanceColor(horizonReturn) }}>
                        {formatPercent(horizonReturn, 2)}
                      </td>
                      <td>{fund.volatility1Y.toFixed(2)}%</td>
                      <td>{fund.sharpe1Y.toFixed(2)}</td>
                      <td>{fund.manager}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundPerformance;

