import React, { useState } from 'react';
import './Styles/FundPerfMetrics.css';

const FundPerfMetrics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFund, setSelectedFund] = useState('all');
  const [dateRange, setDateRange] = useState('1Y');
  const [benchmark, setBenchmark] = useState('market');
  const [viewMode, setViewMode] = useState('detailed');

  const [performanceData] = useState({
    funds: [
      { id: 1, code: 'EGF001', name: 'Equity Growth Fund', category: 'Equity', nav: 25.45, ytd: 12.5, mtd: 2.3, wtd: 0.8, oneYear: 15.2, threeYear: 18.5, fiveYear: 22.1, inception: 28.3, sharpe: 1.45, beta: 1.12, alpha: 2.3, volatility: 14.2, maxDrawdown: -8.5, sortino: 1.68, treynor: 12.5, informationRatio: 0.85 },
      { id: 2, code: 'BIF002', name: 'Balanced Income Fund', category: 'Balanced', nav: 18.92, ytd: 8.2, mtd: 1.5, wtd: 0.4, oneYear: 10.5, threeYear: 12.8, fiveYear: 15.2, inception: 18.5, sharpe: 1.25, beta: 0.85, alpha: 1.2, volatility: 9.5, maxDrawdown: -5.2, sortino: 1.45, treynor: 10.2, informationRatio: 0.65 },
      { id: 3, code: 'FIF003', name: 'Fixed Income Fund', category: 'Fixed Income', nav: 10.25, ytd: 5.8, mtd: 0.8, wtd: 0.2, oneYear: 6.5, threeYear: 7.2, fiveYear: 8.1, inception: 9.5, sharpe: 0.95, beta: 0.35, alpha: 0.5, volatility: 4.2, maxDrawdown: -2.1, sortino: 1.15, treynor: 8.5, informationRatio: 0.35 },
      { id: 4, code: 'MMF004', name: 'Money Market Fund', category: 'Money Market', nav: 1.00, ytd: 4.2, mtd: 0.3, wtd: 0.1, oneYear: 4.5, threeYear: 4.8, fiveYear: 5.1, inception: 5.5, sharpe: 0.75, beta: 0.05, alpha: 0.1, volatility: 1.2, maxDrawdown: -0.5, sortino: 0.95, treynor: 6.2, informationRatio: 0.15 },
      { id: 5, code: 'IDX005', name: 'Index Fund', category: 'Equity', nav: 32.15, ytd: 11.8, mtd: 2.1, wtd: 0.7, oneYear: 14.2, threeYear: 16.8, fiveYear: 19.5, inception: 21.2, sharpe: 1.35, beta: 0.98, alpha: 0.8, volatility: 13.5, maxDrawdown: -7.8, sortino: 1.55, treynor: 11.8, informationRatio: 0.72 }
    ],
    historicalData: generateHistoricalData(),
    benchmarkData: generateBenchmarkData(),
    attribution: generateAttributionData()
  });

  function generateHistoricalData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      equityGrowth: 20 + Math.random() * 10,
      balancedIncome: 15 + Math.random() * 8,
      fixedIncome: 8 + Math.random() * 4,
      moneyMarket: 4 + Math.random() * 2,
      indexFund: 18 + Math.random() * 10,
      benchmark: 16 + Math.random() * 8
    }));
  }

  function generateBenchmarkData() {
    return [
      { period: '1M', fund: 2.3, benchmark: 1.8, difference: 0.5 },
      { period: '3M', fund: 5.2, benchmark: 4.5, difference: 0.7 },
      { period: '6M', fund: 8.5, benchmark: 7.2, difference: 1.3 },
      { period: '1Y', fund: 15.2, benchmark: 13.5, difference: 1.7 },
      { period: '3Y', fund: 18.5, benchmark: 16.8, difference: 1.7 },
      { period: '5Y', fund: 22.1, benchmark: 19.5, difference: 2.6 },
      { period: 'Since Inception', fund: 28.3, benchmark: 24.2, difference: 4.1 }
    ];
  }

  function generateAttributionData() {
    return [
      { sector: 'Technology', weight: 25.5, return: 18.2, contribution: 4.64, benchmark: 15.5, active: 2.7 },
      { sector: 'Financial Services', weight: 20.3, return: 12.8, contribution: 2.60, benchmark: 12.2, active: 0.6 },
      { sector: 'Consumer Goods', weight: 15.2, return: 10.5, contribution: 1.60, benchmark: 10.8, active: -0.3 },
      { sector: 'Healthcare', weight: 12.8, return: 14.2, contribution: 1.82, benchmark: 13.5, active: 0.7 },
      { sector: 'Energy', weight: 10.5, return: 8.5, contribution: 0.89, benchmark: 9.2, active: -0.7 },
      { sector: 'Real Estate', weight: 8.2, return: 11.2, contribution: 0.92, benchmark: 10.5, active: 0.7 },
      { sector: 'Utilities', weight: 7.5, return: 6.8, contribution: 0.51, benchmark: 7.2, active: -0.4 }
    ];
  }

  const selectedFundData = selectedFund === 'all' 
    ? performanceData.funds[0] 
    : performanceData.funds.find(f => f.id === parseInt(selectedFund)) || performanceData.funds[0];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  const renderChart = (dataKey, label) => {
    const maxValue = Math.max(...performanceData.historicalData.map(d => d[dataKey]));
    return (
      <div className="fpm-chart-container">
        <div className="fpm-chart-bars">
          {performanceData.historicalData.map((item, index) => {
            const height = (item[dataKey] / maxValue) * 100;
            return (
              <div key={index} className="fpm-chart-bar-group">
                <div className="fpm-chart-bar" style={{ height: `${height}%` }}>
                  <span className="fpm-bar-value">{item[dataKey].toFixed(1)}</span>
                </div>
                <span className="fpm-bar-label">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fpm-container">
      {/* Header Section */}
      <div className="fpm-header">
        <div className="fpm-header-content">
          <h2>Fund Performance Metrics</h2>
          <p className="fpm-subtitle">Comprehensive performance analysis and benchmarking</p>
        </div>
        <div className="fpm-header-actions">
          <button className="fpm-btn fpm-btn-secondary">
            <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
            </svg>
            Export Report
          </button>
          <button className="fpm-btn fpm-btn-primary">
            <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="fpm-filters">
        <div className="fpm-filter-group">
          <label>Select Fund</label>
          <select 
            className="fpm-select" 
            value={selectedFund} 
            onChange={(e) => setSelectedFund(e.target.value)}
          >
            <option value="all">All Funds</option>
            {performanceData.funds.map(fund => (
              <option key={fund.id} value={fund.id}>{fund.name} ({fund.code})</option>
            ))}
          </select>
        </div>
        <div className="fpm-filter-group">
          <label>Date Range</label>
          <select 
            className="fpm-select" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
            <option value="5Y">5 Years</option>
            <option value="ALL">All Time</option>
          </select>
        </div>
        <div className="fpm-filter-group">
          <label>Benchmark</label>
          <select 
            className="fpm-select" 
            value={benchmark} 
            onChange={(e) => setBenchmark(e.target.value)}
          >
            <option value="market">Market Index</option>
            <option value="category">Category Average</option>
            <option value="custom">Custom Benchmark</option>
          </select>
        </div>
        <div className="fpm-filter-group">
          <label>View Mode</label>
          <select 
            className="fpm-select" 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="detailed">Detailed</option>
            <option value="summary">Summary</option>
            <option value="comparison">Comparison</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="fpm-tabs">
        <button 
          className={`fpm-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`fpm-tab ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          Returns Analysis
        </button>
        <button 
          className={`fpm-tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk Metrics
        </button>
        <button 
          className={`fpm-tab ${activeTab === 'attribution' ? 'active' : ''}`}
          onClick={() => setActiveTab('attribution')}
        >
          Performance Attribution
        </button>
        <button 
          className={`fpm-tab ${activeTab === 'benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmark')}
        >
          Benchmark Comparison
        </button>
        <button 
          className={`fpm-tab ${activeTab === 'historical' ? 'active' : ''}`}
          onClick={() => setActiveTab('historical')}
        >
          Historical Performance
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="fpm-tab-content">
          {/* Key Metrics Cards */}
          <div className="fpm-metrics-grid">
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">Current NAV</span>
                <span className="fpm-metric-badge positive">{formatPercent(selectedFundData.mtd)}</span>
              </div>
              <div className="fpm-metric-value">{formatCurrency(selectedFundData.nav)}</div>
              <div className="fpm-metric-change">MTD: {formatPercent(selectedFundData.mtd)}</div>
            </div>
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">YTD Return</span>
                <span className="fpm-metric-badge positive">{formatPercent(selectedFundData.ytd)}</span>
              </div>
              <div className="fpm-metric-value">{formatPercent(selectedFundData.ytd)}</div>
              <div className="fpm-metric-change">1Y: {formatPercent(selectedFundData.oneYear)}</div>
            </div>
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">Sharpe Ratio</span>
                <span className="fpm-metric-badge positive">Excellent</span>
              </div>
              <div className="fpm-metric-value">{selectedFundData.sharpe.toFixed(2)}</div>
              <div className="fpm-metric-change">Risk-Adjusted Return</div>
            </div>
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">Volatility</span>
                <span className="fpm-metric-badge neutral">Moderate</span>
              </div>
              <div className="fpm-metric-value">{formatPercent(selectedFundData.volatility)}</div>
              <div className="fpm-metric-change">Annualized</div>
            </div>
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">Beta</span>
                <span className="fpm-metric-badge neutral">{selectedFundData.beta < 1 ? 'Low' : 'High'}</span>
              </div>
              <div className="fpm-metric-value">{selectedFundData.beta.toFixed(2)}</div>
              <div className="fpm-metric-change">Market Correlation</div>
            </div>
            <div className="fpm-metric-card">
              <div className="fpm-metric-header">
                <span className="fpm-metric-label">Alpha</span>
                <span className="fpm-metric-badge positive">{formatPercent(selectedFundData.alpha)}</span>
              </div>
              <div className="fpm-metric-value">{formatPercent(selectedFundData.alpha)}</div>
              <div className="fpm-metric-change">Excess Return</div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="fpm-chart-section">
            <div className="fpm-section-header">
              <h3>Performance Trend</h3>
              <div className="fpm-legend">
                <span className="fpm-legend-item">
                  <span className="fpm-legend-color" style={{ background: '#14b8a6' }}></span>
                  Fund Performance
                </span>
                <span className="fpm-legend-item">
                  <span className="fpm-legend-color" style={{ background: '#94a3b8' }}></span>
                  Benchmark
                </span>
              </div>
            </div>
            {renderChart('equityGrowth', 'Equity Growth Fund')}
          </div>

          {/* Performance Table */}
          <div className="fpm-table-section">
            <div className="fpm-section-header">
              <h3>All Funds Performance Summary</h3>
            </div>
            <div className="fpm-table-container">
              <table className="fpm-table">
                <thead>
                  <tr>
                    <th>Fund Name</th>
                    <th>Category</th>
                    <th>NAV</th>
                    <th>YTD</th>
                    <th>1Y</th>
                    <th>3Y</th>
                    <th>5Y</th>
                    <th>Sharpe</th>
                    <th>Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.funds.map(fund => (
                    <tr key={fund.id}>
                      <td><strong>{fund.name}</strong></td>
                      <td><span className="fpm-category-badge">{fund.category}</span></td>
                      <td>{formatCurrency(fund.nav)}</td>
                      <td style={{ color: getPerformanceColor(fund.ytd) }}>{formatPercent(fund.ytd)}</td>
                      <td style={{ color: getPerformanceColor(fund.oneYear) }}>{formatPercent(fund.oneYear)}</td>
                      <td style={{ color: getPerformanceColor(fund.threeYear) }}>{formatPercent(fund.threeYear)}</td>
                      <td style={{ color: getPerformanceColor(fund.fiveYear) }}>{formatPercent(fund.fiveYear)}</td>
                      <td>{fund.sharpe.toFixed(2)}</td>
                      <td>{formatPercent(fund.volatility)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Returns Analysis Tab */}
      {activeTab === 'returns' && (
        <div className="fpm-tab-content">
          <div className="fpm-returns-grid">
            <div className="fpm-returns-card">
              <h3>Period Returns</h3>
              <div className="fpm-returns-table">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Return</th>
                      <th>Annualized</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Week to Date</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.wtd) }}>{formatPercent(selectedFundData.wtd)}</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>Month to Date</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.mtd) }}>{formatPercent(selectedFundData.mtd)}</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>Year to Date</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.ytd) }}>{formatPercent(selectedFundData.ytd)}</td>
                      <td>{formatPercent(selectedFundData.ytd)}</td>
                    </tr>
                    <tr>
                      <td>1 Year</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.oneYear) }}>{formatPercent(selectedFundData.oneYear)}</td>
                      <td>{formatPercent(selectedFundData.oneYear)}</td>
                    </tr>
                    <tr>
                      <td>3 Years</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.threeYear) }}>{formatPercent(selectedFundData.threeYear)}</td>
                      <td>{formatPercent(selectedFundData.threeYear / 3)}</td>
                    </tr>
                    <tr>
                      <td>5 Years</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.fiveYear) }}>{formatPercent(selectedFundData.fiveYear)}</td>
                      <td>{formatPercent(selectedFundData.fiveYear / 5)}</td>
                    </tr>
                    <tr>
                      <td>Since Inception</td>
                      <td style={{ color: getPerformanceColor(selectedFundData.inception) }}>{formatPercent(selectedFundData.inception)}</td>
                      <td>{formatPercent(selectedFundData.inception / 7)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="fpm-returns-card">
              <h3>Return Distribution</h3>
              {renderChart('equityGrowth', 'Returns')}
            </div>
          </div>
        </div>
      )}

      {/* Risk Metrics Tab */}
      {activeTab === 'risk' && (
        <div className="fpm-tab-content">
          <div className="fpm-risk-grid">
            <div className="fpm-risk-card">
              <h3>Risk Metrics</h3>
              <div className="fpm-risk-metrics">
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Volatility (Annualized)</span>
                  <span className="fpm-risk-value">{formatPercent(selectedFundData.volatility)}</span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Beta</span>
                  <span className="fpm-risk-value">{selectedFundData.beta.toFixed(2)}</span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Maximum Drawdown</span>
                  <span className="fpm-risk-value" style={{ color: getPerformanceColor(selectedFundData.maxDrawdown) }}>
                    {formatPercent(selectedFundData.maxDrawdown)}
                  </span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Sharpe Ratio</span>
                  <span className="fpm-risk-value">{selectedFundData.sharpe.toFixed(2)}</span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Sortino Ratio</span>
                  <span className="fpm-risk-value">{selectedFundData.sortino.toFixed(2)}</span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Treynor Ratio</span>
                  <span className="fpm-risk-value">{selectedFundData.treynor.toFixed(2)}</span>
                </div>
                <div className="fpm-risk-item">
                  <span className="fpm-risk-label">Information Ratio</span>
                  <span className="fpm-risk-value">{selectedFundData.informationRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="fpm-risk-card">
              <h3>Risk-Adjusted Returns</h3>
              <div className="fpm-risk-chart">
                {renderChart('equityGrowth', 'Risk-Adjusted')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Attribution Tab */}
      {activeTab === 'attribution' && (
        <div className="fpm-tab-content">
          <div className="fpm-attribution-section">
            <div className="fpm-section-header">
              <h3>Sector Performance Attribution</h3>
              <p>Breakdown of returns by sector allocation</p>
            </div>
            <div className="fpm-table-container">
              <table className="fpm-table">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Weight (%)</th>
                    <th>Sector Return (%)</th>
                    <th>Contribution (%)</th>
                    <th>Benchmark (%)</th>
                    <th>Active Return (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.attribution.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.sector}</strong></td>
                      <td>{item.weight.toFixed(1)}</td>
                      <td style={{ color: getPerformanceColor(item.return) }}>{formatPercent(item.return)}</td>
                      <td style={{ color: getPerformanceColor(item.contribution) }}>{formatPercent(item.contribution)}</td>
                      <td>{formatPercent(item.benchmark)}</td>
                      <td style={{ color: getPerformanceColor(item.active) }}>{formatPercent(item.active)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td>100.0</td>
                    <td>-</td>
                    <td><strong>{formatPercent(performanceData.attribution.reduce((sum, item) => sum + item.contribution, 0))}</strong></td>
                    <td>-</td>
                    <td><strong>{formatPercent(performanceData.attribution.reduce((sum, item) => sum + item.active, 0))}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Comparison Tab */}
      {activeTab === 'benchmark' && (
        <div className="fpm-tab-content">
          <div className="fpm-benchmark-section">
            <div className="fpm-section-header">
              <h3>Fund vs Benchmark Performance</h3>
            </div>
            <div className="fpm-benchmark-table">
              <table className="fpm-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Fund Return</th>
                    <th>Benchmark Return</th>
                    <th>Difference</th>
                    <th>Outperformance</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.benchmarkData.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.period}</strong></td>
                      <td style={{ color: getPerformanceColor(item.fund) }}>{formatPercent(item.fund)}</td>
                      <td>{formatPercent(item.benchmark)}</td>
                      <td style={{ color: getPerformanceColor(item.difference) }}>{formatPercent(item.difference)}</td>
                      <td>
                        <span className={`fpm-outperformance ${item.difference > 0 ? 'positive' : 'negative'}`}>
                          {item.difference > 0 ? '✓ Outperformed' : '✗ Underperformed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fpm-benchmark-chart">
              {renderChart('equityGrowth', 'Fund vs Benchmark')}
            </div>
          </div>
        </div>
      )}

      {/* Historical Performance Tab */}
      {activeTab === 'historical' && (
        <div className="fpm-tab-content">
          <div className="fpm-historical-section">
            <div className="fpm-section-header">
              <h3>12-Month Historical Performance</h3>
            </div>
            <div className="fpm-historical-chart">
              {renderChart('equityGrowth', 'Historical NAV')}
            </div>
            <div className="fpm-historical-table">
              <table className="fpm-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Equity Growth</th>
                    <th>Balanced Income</th>
                    <th>Fixed Income</th>
                    <th>Money Market</th>
                    <th>Index Fund</th>
                    <th>Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.historicalData.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.month}</strong></td>
                      <td>{formatCurrency(item.equityGrowth)}</td>
                      <td>{formatCurrency(item.balancedIncome)}</td>
                      <td>{formatCurrency(item.fixedIncome)}</td>
                      <td>{formatCurrency(item.moneyMarket)}</td>
                      <td>{formatCurrency(item.indexFund)}</td>
                      <td>{formatCurrency(item.benchmark)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundPerfMetrics;
