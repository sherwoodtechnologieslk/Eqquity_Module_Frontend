import React, { useState, useEffect } from 'react';
import './PerformanceMetrics.css';

const PerformanceMetrics = () => {
  const [performanceData, setPerformanceData] = useState({
    portfolioSummary: {
      totalValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      dailyReturn: 0,
      monthlyReturn: 0,
      yearlyReturn: 0
    },
    riskMetrics: {
      volatility: 0,
      sharpeRatio: 0,
      beta: 0,
      maxDrawdown: 0,
      var95: 0,
      trackingError: 0
    },
    benchmarkComparison: {
      benchmark: 'NIFTY 50',
      benchmarkReturn: 0,
      excessReturn: 0,
      informationRatio: 0,
      correlation: 0
    },
    sectorAllocation: [],
    topHoldings: [],
    performanceHistory: [],
    attribution: {
      assetAllocation: 0,
      stockSelection: 0,
      interaction: 0,
      total: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1Y');

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    try {
      // TODO: Replace with actual API calls
      // For now, using empty data
      const emptyData = {
        portfolioSummary: {
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          dailyReturn: 0,
          monthlyReturn: 0,
          yearlyReturn: 0
        },
        riskMetrics: {
          volatility: 0,
          sharpeRatio: 0,
          beta: 0,
          maxDrawdown: 0,
          var95: 0,
          trackingError: 0
        },
        benchmarkComparison: {
          benchmark: 'NIFTY 50',
          benchmarkReturn: 0,
          excessReturn: 0,
          informationRatio: 0,
          correlation: 0
        },
        sectorAllocation: [],
        topHoldings: [],
        performanceHistory: [],
        attribution: {
          assetAllocation: 0,
          stockSelection: 0,
          interaction: 0,
          total: 0
        }
      };

      setPerformanceData(emptyData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading performance data:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (num) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getReturnColor = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const getRiskColor = (metric, value) => {
    switch (metric) {
      case 'volatility':
        return value < 15 ? 'positive' : value < 25 ? 'warning' : 'negative';
      case 'sharpeRatio':
        return value > 1.5 ? 'positive' : value > 1.0 ? 'warning' : 'negative';
      case 'beta':
        return value < 1.1 && value > 0.9 ? 'positive' : 'warning';
      case 'maxDrawdown':
        return value > -10 ? 'positive' : value > -20 ? 'warning' : 'negative';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <div className="performance-metrics-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance metrics...</p>
      </div>
    );
  }

  return (
    <div className="performance-metrics">
      <div className="performance-header">
        <h1>Performance Metrics</h1>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
            <option value="5Y">5 Years</option>
          </select>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">Portfolio Value</div>
          <div className="card-value">{formatCurrency(performanceData.portfolioSummary.totalValue)}</div>
          <div className="card-change">
            <span className={`return-value ${getReturnColor(performanceData.portfolioSummary.totalReturnPercent)}`}>
              {formatPercentage(performanceData.portfolioSummary.totalReturnPercent)}
            </span>
            <span className="return-amount">
              {formatCurrency(performanceData.portfolioSummary.totalReturn)}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">Daily Return</div>
          <div className="card-value">{formatCurrency(performanceData.portfolioSummary.dailyReturn)}</div>
          <div className="card-change">
            <span className={`return-value ${getReturnColor(performanceData.portfolioSummary.dailyReturn)}`}>
              {formatPercentage((performanceData.portfolioSummary.dailyReturn / performanceData.portfolioSummary.totalValue) * 100)}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">Monthly Return</div>
          <div className="card-value">{formatCurrency(performanceData.portfolioSummary.monthlyReturn)}</div>
          <div className="card-change">
            <span className={`return-value ${getReturnColor(performanceData.portfolioSummary.monthlyReturn)}`}>
              {formatPercentage((performanceData.portfolioSummary.monthlyReturn / performanceData.portfolioSummary.totalValue) * 100)}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">Yearly Return</div>
          <div className="card-value">{formatCurrency(performanceData.portfolioSummary.yearlyReturn)}</div>
          <div className="card-change">
            <span className={`return-value ${getReturnColor(performanceData.portfolioSummary.yearlyReturn)}`}>
              {formatPercentage(performanceData.portfolioSummary.totalReturnPercent)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="performance-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk Metrics
        </button>
        <button 
          className={`tab-button ${activeTab === 'benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmark')}
        >
          Benchmark Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'allocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocation')}
        >
          Allocation & Attribution
        </button>
        <button 
          className={`tab-button ${activeTab === 'holdings' ? 'active' : ''}`}
          onClick={() => setActiveTab('holdings')}
        >
          Top Holdings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="performance-chart-placeholder">
              <div className="chart-header">
                <h3>Portfolio Performance vs Benchmark</h3>
                <span className="chart-period">{timeRange} Performance</span>
              </div>
              <div className="chart-container">
                <div className="chart-placeholder">
                  Performance Chart Placeholder
                  <br />
                  <small>Connect to charting library for interactive charts</small>
                </div>
              </div>
            </div>

            <div className="performance-table">
              <h3>Performance Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Portfolio</th>
                    <th>Benchmark</th>
                    <th>Excess Return</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.performanceHistory.map((period, index) => (
                    <tr key={index}>
                      <td>{period.period}</td>
                      <td className={getReturnColor(period.portfolio)}>
                        {formatPercentage(period.portfolio)}
                      </td>
                      <td className={getReturnColor(period.benchmark)}>
                        {formatPercentage(period.benchmark)}
                      </td>
                      <td className={getReturnColor(period.excess)}>
                        {formatPercentage(period.excess)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="risk-content">
            <div className="risk-metrics-grid">
              <div className="risk-card">
                <h4>Volatility</h4>
                <div className={`metric-value ${getRiskColor('volatility', performanceData.riskMetrics.volatility)}`}>
                  {performanceData.riskMetrics.volatility.toFixed(2)}%
                </div>
                <div className="metric-description">
                  Annualized standard deviation of returns
                </div>
              </div>

              <div className="risk-card">
                <h4>Sharpe Ratio</h4>
                <div className={`metric-value ${getRiskColor('sharpeRatio', performanceData.riskMetrics.sharpeRatio)}`}>
                  {performanceData.riskMetrics.sharpeRatio.toFixed(2)}
                </div>
                <div className="metric-description">
                  Risk-adjusted return measure
                </div>
              </div>

              <div className="risk-card">
                <h4>Beta</h4>
                <div className={`metric-value ${getRiskColor('beta', performanceData.riskMetrics.beta)}`}>
                  {performanceData.riskMetrics.beta.toFixed(2)}
                </div>
                <div className="metric-description">
                  Systematic risk relative to benchmark
                </div>
              </div>

              <div className="risk-card">
                <h4>Max Drawdown</h4>
                <div className={`metric-value ${getRiskColor('maxDrawdown', performanceData.riskMetrics.maxDrawdown)}`}>
                  {performanceData.riskMetrics.maxDrawdown.toFixed(2)}%
                </div>
                <div className="metric-description">
                  Largest peak-to-trough decline
                </div>
              </div>

              <div className="risk-card">
                <h4>VaR (95%)</h4>
                <div className={`metric-value ${getRiskColor('var95', performanceData.riskMetrics.var95)}`}>
                  {performanceData.riskMetrics.var95.toFixed(2)}%
                </div>
                <div className="metric-description">
                  Value at Risk (95% confidence)
                </div>
              </div>

              <div className="risk-card">
                <h4>Tracking Error</h4>
                <div className="metric-value neutral">
                  {performanceData.riskMetrics.trackingError.toFixed(2)}%
                </div>
                <div className="metric-description">
                  Deviation from benchmark
                </div>
              </div>
            </div>

            <div className="risk-chart-placeholder">
              <h3>Risk-Return Scatter Plot</h3>
                              <div className="chart-placeholder">
                  Risk-Return Chart Placeholder
                  <br />
                  <small>Show portfolio vs benchmark risk-return positioning</small>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmark' && (
          <div className="benchmark-content">
            <div className="benchmark-summary">
              <div className="benchmark-header">
                <h3>Benchmark: {performanceData.benchmarkComparison.benchmark}</h3>
                <div className="benchmark-returns">
                  <span className="benchmark-return">
                    {formatPercentage(performanceData.benchmarkComparison.benchmarkReturn)}
                  </span>
                  <span className="excess-return">
                    Excess: {formatPercentage(performanceData.benchmarkComparison.excessReturn)}
                  </span>
                </div>
              </div>

              <div className="benchmark-metrics">
                <div className="metric-item">
                  <span className="metric-label">Information Ratio</span>
                  <span className={`metric-value ${getReturnColor(performanceData.benchmarkComparison.informationRatio)}`}>
                    {performanceData.benchmarkComparison.informationRatio.toFixed(2)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Correlation</span>
                  <span className="metric-value neutral">
                    {performanceData.benchmarkComparison.correlation.toFixed(2)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Tracking Error</span>
                  <span className="metric-value neutral">
                    {performanceData.riskMetrics.trackingError.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="benchmark-chart-placeholder">
              <h3>Rolling Performance vs Benchmark</h3>
                              <div className="chart-placeholder">
                  Rolling Performance Chart Placeholder
                  <br />
                  <small>Show rolling 12-month performance comparison</small>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="allocation-content">
            <div className="sector-allocation">
              <h3>Sector Allocation & Performance</h3>
              <div className="allocation-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th>Allocation</th>
                      <th>Portfolio Return</th>
                      <th>Benchmark Return</th>
                      <th>Excess Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.sectorAllocation.map((sector, index) => (
                      <tr key={index}>
                        <td className="sector-name">{sector.sector}</td>
                        <td>{sector.allocation.toFixed(1)}%</td>
                        <td className={getReturnColor(sector.return)}>
                          {formatPercentage(sector.return)}
                        </td>
                        <td className={getReturnColor(sector.benchmark)}>
                          {formatPercentage(sector.benchmark)}
                        </td>
                        <td className={getReturnColor(sector.return - sector.benchmark)}>
                          {formatPercentage(sector.return - sector.benchmark)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="attribution-analysis">
              <h3>Return Attribution Analysis</h3>
              <div className="attribution-grid">
                <div className="attribution-item">
                  <span className="attribution-label">Asset Allocation</span>
                  <span className={`attribution-value ${getReturnColor(performanceData.attribution.assetAllocation)}`}>
                    {formatPercentage(performanceData.attribution.assetAllocation)}
                  </span>
                </div>
                <div className="attribution-item">
                  <span className="attribution-label">Stock Selection</span>
                  <span className={`attribution-value ${getReturnColor(performanceData.attribution.stockSelection)}`}>
                    {formatPercentage(performanceData.attribution.stockSelection)}
                  </span>
                </div>
                <div className="attribution-item">
                  <span className="attribution-label">Interaction</span>
                  <span className={`attribution-value ${getReturnColor(performanceData.attribution.interaction)}`}>
                    {formatPercentage(performanceData.attribution.interaction)}
                  </span>
                </div>
                <div className="attribution-item total">
                  <span className="attribution-label">Total Excess Return</span>
                  <span className={`attribution-value ${getReturnColor(performanceData.attribution.total)}`}>
                    {formatPercentage(performanceData.attribution.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="holdings-content">
            <h3>Top Holdings Performance</h3>
            <div className="holdings-table">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Allocation</th>
                    <th>Return</th>
                    <th>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.topHoldings.map((holding, index) => (
                    <tr key={index}>
                      <td className="symbol">{holding.symbol}</td>
                      <td>{holding.allocation.toFixed(1)}%</td>
                      <td className={getReturnColor(holding.return)}>
                        {formatPercentage(holding.return)}
                      </td>
                      <td className={getReturnColor(holding.contribution)}>
                        {formatPercentage(holding.contribution)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="holdings-chart-placeholder">
              <h3>Holdings Performance Chart</h3>
                              <div className="chart-placeholder">
                  Holdings Performance Chart Placeholder
                  <br />
                  <small>Show individual stock performance vs allocation</small>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Export and Actions */}
      <div className="actions-section">
        <button className="action-btn">
          Generate Performance Report
        </button>
        <button className="action-btn">
          Export to Excel
        </button>
        <button className="action-btn">
          Email Report
        </button>
        <button className="action-btn">
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
