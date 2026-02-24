import React, { useState } from 'react';
import './Styles/WMPortfolioOverview.css';

const WMPortfolioOverview = () => {
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [viewMode, setViewMode] = useState('summary');
  const [dateRange, setDateRange] = useState('1Y');

  const [portfolioData] = useState({
    portfolios: [
      { id: 1, name: 'Client Portfolio 1', client: 'Client 1', type: 'Individual', value: 12500000, change: 5.2, funds: 8, riskProfile: 'Moderate', manager: 'John Smith' },
      { id: 2, name: 'Client Portfolio 2', client: 'Client 2', type: 'Corporate', value: 45000000, change: 3.8, funds: 12, riskProfile: 'Balanced', manager: 'Sarah Johnson' },
      { id: 3, name: 'Client Portfolio 3', client: 'Client 3', type: 'Individual', value: 8500000, change: 7.1, funds: 6, riskProfile: 'Aggressive', manager: 'Michael Chen' },
      { id: 4, name: 'Client Portfolio 4', client: 'Client 4', type: 'Trust', value: 32000000, change: 4.5, funds: 10, riskProfile: 'Conservative', manager: 'Emily Davis' },
      { id: 5, name: 'Client Portfolio 5', client: 'Client 5', type: 'Individual', value: 18500000, change: 6.2, funds: 9, riskProfile: 'Moderate', manager: 'David Wilson' }
    ],
    allocations: [
      { category: 'Equity Funds', percentage: 45.5, value: 1114750000, funds: 12, change: 8.2 },
      { category: 'Fixed Income', percentage: 28.3, value: 693350000, funds: 8, change: 4.5 },
      { category: 'Balanced Funds', percentage: 15.2, value: 372400000, funds: 6, change: 6.8 },
      { category: 'Money Market', percentage: 8.5, value: 208250000, funds: 4, change: 3.2 },
      { category: 'Real Estate', percentage: 2.5, value: 61250000, funds: 2, change: 5.1 }
    ],
    performance: [
      { period: '1M', return: 2.3, benchmark: 1.8, difference: 0.5 },
      { period: '3M', return: 4.2, benchmark: 4.5, difference: -0.3 },
      { period: '6M', return: 8.5, benchmark: 7.2, difference: 1.3 },
      { period: '1Y', return: 13.8, benchmark: 13.5, difference: 0.3 },
      { period: '3Y', return: 16.2, benchmark: 16.8, difference: -0.6 },
      { period: '5Y', return: 22.1, benchmark: 19.5, difference: 2.6 }
    ],
    topHoldings: [
      { fund: 'Equity Growth Fund', allocation: 18.5, value: 453250000, units: 17800000, nav: 25.45, return: 12.5 },
      { fund: 'Balanced Income Fund', allocation: 15.2, value: 372400000, units: 19680000, nav: 18.92, return: 10.8 },
      { fund: 'Fixed Income Fund', allocation: 12.8, value: 313600000, units: 30585000, nav: 10.25, return: 6.5 },
      { fund: 'Index Fund', allocation: 11.5, value: 281750000, units: 8756000, nav: 32.15, return: 14.2 },
      { fund: 'Dividend Income Equity Fund', allocation: 9.8, value: 240100000, units: 10530000, nav: 22.80, return: 11.2 },
      { fund: 'Money Market Fund', allocation: 8.5, value: 208250000, units: 208250000, nav: 1.00, return: 4.2 }
    ],
    historicalData: [
      { month: 'Jan', value: 2200000000, return: 1.2 },
      { month: 'Feb', value: 2250000000, return: 2.3 },
      { month: 'Mar', value: 2300000000, return: 2.2 },
      { month: 'Apr', value: 2320000000, return: 0.9 },
      { month: 'May', value: 2350000000, return: 1.3 },
      { month: 'Jun', value: 2380000000, return: 1.3 },
      { month: 'Jul', value: 2400000000, return: 0.8 },
      { month: 'Aug', value: 2410000000, return: 0.4 },
      { month: 'Sep', value: 2420000000, return: 0.4 },
      { month: 'Oct', value: 2430000000, return: 0.4 },
      { month: 'Nov', value: 2440000000, return: 0.4 },
      { month: 'Dec', value: 2450000000, return: 0.4 }
    ]
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value) => {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#64748b';
  };

  const totalPortfolioValue = portfolioData.portfolios.reduce((sum, p) => sum + p.value, 0);
  const totalChange = portfolioData.portfolios.reduce((sum, p) => sum + (p.value * p.change / 100), 0) / totalPortfolioValue * 100;

  const renderAllocationChart = () => {
    return (
      <div className="wmp-allocation-chart">
        {portfolioData.allocations.map((item, index) => {
          const colors = ['#14b8a6', '#0d9488', '#06b6d4', '#0891b2', '#5eead4'];
          return (
            <div key={index} className="wmp-allocation-segment" style={{ width: `${item.percentage}%`, background: colors[index % colors.length] }}>
              <span className="wmp-segment-label">{item.percentage}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPerformanceChart = () => {
    const maxValue = Math.max(...portfolioData.historicalData.map(d => d.value));
    const minValue = Math.min(...portfolioData.historicalData.map(d => d.value));
    const range = maxValue - minValue;
    
    // Generate Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels = [];
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = minValue + (range * (i / yAxisSteps));
      yAxisLabels.push(formatCurrency(value / 1000000));
    }
    
    return (
      <div className="wmp-performance-chart">
        {/* Y-axis labels */}
        <div className="wmp-y-axis">
          {yAxisLabels.reverse().map((label, index) => (
            <div key={index} className="wmp-y-axis-label">{label}M</div>
          ))}
        </div>
        <div className="wmp-chart-bars">
          {portfolioData.historicalData.map((item, index) => {
            // Calculate height based on the range, not just max value
            const height = range > 0 ? ((item.value - minValue) / range) * 100 : 100;
            return (
              <div key={index} className="wmp-chart-bar-group">
                <div className="wmp-chart-bar" style={{ height: `${Math.max(height, 5)}%` }}>
                  <span className="wmp-bar-value">{formatCurrency(item.value / 1000000)}M</span>
                </div>
                <span className="wmp-bar-label">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="wmp-container">
      {/* Header */}
      <div className="wmp-header">
        <div className="wmp-header-content">
          <h2>Portfolio Overview</h2>
          <p className="wmp-subtitle">Comprehensive portfolio analysis and performance tracking</p>
        </div>
        <div className="wmp-header-actions">
          <select 
            className="wmp-select" 
            value={selectedPortfolio} 
            onChange={(e) => setSelectedPortfolio(e.target.value)}
          >
            <option value="all">All Portfolios</option>
            {portfolioData.portfolios.map(portfolio => (
              <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>
            ))}
          </select>
          <select 
            className="wmp-select" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
            <option value="5Y">5 Years</option>
          </select>
          <button className="wmp-btn wmp-btn-primary">
            <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="wmp-summary-grid">
        <div className="wmp-summary-card wmp-card-1">
          <div className="wmp-summary-header">
            <span className="wmp-summary-label">Total Portfolio Value</span>
            <span className="wmp-summary-badge" style={{ color: getPerformanceColor(totalChange) }}>
              {formatPercent(totalChange)}
            </span>
          </div>
          <div className="wmp-summary-value">{formatCurrency(totalPortfolioValue)}</div>
          <div className="wmp-summary-change">Across {portfolioData.portfolios.length} portfolios</div>
        </div>
        <div className="wmp-summary-card wmp-card-2">
          <div className="wmp-summary-header">
            <span className="wmp-summary-label">Active Portfolios</span>
          </div>
          <div className="wmp-summary-value">{portfolioData.portfolios.length}</div>
          <div className="wmp-summary-change">All portfolios active</div>
        </div>
        <div className="wmp-summary-card wmp-card-3">
          <div className="wmp-summary-header">
            <span className="wmp-summary-label">Total Funds</span>
          </div>
          <div className="wmp-summary-value">{portfolioData.allocations.reduce((sum, a) => sum + a.funds, 0)}</div>
          <div className="wmp-summary-change">Across all categories</div>
        </div>
        <div className="wmp-summary-card wmp-card-4">
          <div className="wmp-summary-header">
            <span className="wmp-summary-label">YTD Return</span>
            <span className="wmp-summary-badge" style={{ color: getPerformanceColor(portfolioData.performance[3].return) }}>
              {formatPercent(portfolioData.performance[3].return)}
            </span>
          </div>
          <div className="wmp-summary-value">{formatPercent(portfolioData.performance[3].return)}</div>
          <div className="wmp-summary-change">vs Benchmark: {formatPercent(portfolioData.performance[3].benchmark)}</div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="wmp-section">
        <div className="wmp-section-header">
          <h3>Asset Allocation</h3>
        </div>
        <div className="wmp-allocation-container">
          {renderAllocationChart()}
          <div className="wmp-allocation-details">
            {portfolioData.allocations.map((item, index) => (
              <div key={index} className="wmp-allocation-item">
                <div className="wmp-allocation-header">
                  <span className="wmp-allocation-category">{item.category}</span>
                  <span className="wmp-allocation-percentage">{item.percentage}%</span>
                </div>
                <div className="wmp-allocation-bar">
                  <div 
                    className="wmp-allocation-fill" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="wmp-allocation-info">
                  <span>Value: {formatCurrency(item.value)}</span>
                  <span>Funds: {item.funds}</span>
                  <span style={{ color: getPerformanceColor(item.change) }}>
                    Return: {formatPercent(item.change)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio List */}
      <div className="wmp-section">
        <div className="wmp-section-header">
          <h3>Portfolio Details</h3>
          <div className="wmp-view-toggle">
            <button 
              className={`wmp-toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              Summary
            </button>
            <button 
              className={`wmp-toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </button>
          </div>
        </div>
        <div className="wmp-table-container">
          <table className="wmp-table">
            <thead>
              <tr>
                <th>Portfolio Name</th>
                <th>Client</th>
                <th>Type</th>
                <th>Portfolio Value</th>
                <th>Return</th>
                <th>Funds</th>
                <th>Risk Profile</th>
                <th>Manager</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.portfolios.map(portfolio => (
                <tr key={portfolio.id}>
                  <td><strong>{portfolio.name}</strong></td>
                  <td>{portfolio.client}</td>
                  <td><span className="wmp-type-badge">{portfolio.type}</span></td>
                  <td>{formatCurrency(portfolio.value)}</td>
                  <td style={{ color: getPerformanceColor(portfolio.change) }}>
                    {formatPercent(portfolio.change)}
                  </td>
                  <td>{portfolio.funds}</td>
                  <td><span className={`wmp-risk-badge wmp-risk-${portfolio.riskProfile.toLowerCase()}`}>{portfolio.riskProfile}</span></td>
                  <td>{portfolio.manager}</td>
                  <td>
                    <button className="wmp-action-btn wmp-view">View</button>
                    <button className="wmp-action-btn wmp-edit">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="wmp-section">
        <div className="wmp-section-header">
          <h3>Performance Metrics</h3>
        </div>
        <div className="wmp-table-container">
          <table className="wmp-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Portfolio Return</th>
                <th>Benchmark</th>
                <th>Difference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.performance.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.period}</strong></td>
                  <td style={{ color: getPerformanceColor(item.return) }}>
                    {formatPercent(item.return)}
                  </td>
                  <td>{formatPercent(item.benchmark)}</td>
                  <td style={{ color: getPerformanceColor(item.difference) }}>
                    {formatPercent(item.difference)}
                  </td>
                  <td>
                    <span className={`wmp-status-badge ${item.difference > 0 ? 'positive' : 'negative'}`}>
                      {item.difference > 0 ? 'Outperformed' : 'Underperformed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio Value Trend */}
      <div className="wmp-section">
        <div className="wmp-section-header">
          <h3>Portfolio Value Trend</h3>
        </div>
        <div className="wmp-performance-chart-container">
          {renderPerformanceChart()}
        </div>
      </div>

      {/* Top Holdings */}
      <div className="wmp-section">
        <div className="wmp-section-header">
          <h3>Top Holdings</h3>
        </div>
        <div className="wmp-table-container">
          <table className="wmp-table">
            <thead>
              <tr>
                <th>Fund Name</th>
                <th>Allocation %</th>
                <th>Value</th>
                <th>Units</th>
                <th>NAV</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.topHoldings.map((holding, index) => (
                <tr key={index}>
                  <td><strong>{holding.fund}</strong></td>
                  <td>{holding.allocation}%</td>
                  <td>{formatCurrency(holding.value)}</td>
                  <td>{formatCurrency(holding.units)}</td>
                  <td>{holding.nav.toFixed(2)}</td>
                  <td style={{ color: getPerformanceColor(holding.return) }}>
                    {formatPercent(holding.return)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WMPortfolioOverview;
