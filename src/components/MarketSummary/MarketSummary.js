import React, { useState, useEffect } from 'react';
import './MarketSummary.css';
import { dashboardAPI } from '../../services/api';

const MarketSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 [Frontend] Loading market summary...');
      
      const response = await dashboardAPI.getMarketSummary();
      console.log('📊 [Frontend] Received data:', response);
      
      // Handle response structure
      const marketData = response?.data || response;
      
      if (!marketData) {
        throw new Error('No data received from server');
      }
      
      console.log('📊 [Frontend] Setting data:', {
        totalTradedValue: marketData.marketOverview?.totalTradedValue?.value,
        stocksTraded: marketData.marketOverview?.stocksTraded?.value,
        gainers: marketData.topMovers?.gainers?.length,
        losers: marketData.topMovers?.losers?.length
      });
      
      setData(marketData);
    } catch (err) {
      console.error('❌ [Frontend] Error loading market data:', err);
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    if (!num && num !== 0) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toLocaleString();
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="market-summary-loading">
        <div className="loading-spinner"></div>
        <p>Loading market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-summary">
        <div className="market-summary-header">
          <h1>Market Summary</h1>
        </div>
        <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.25rem' }}>⚠️ Error</div>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadData} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="market-summary">
        <div className="market-summary-header">
          <h1>Market Summary</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          No data available
        </div>
      </div>
    );
  }

  const overview = data.marketOverview || {};
  const stats = data.marketStatistics || {};
  const movers = data.topMovers || {};

  return (
    <div className="market-summary">
      <div className="market-summary-header">
        <h1>Market Summary</h1>
        <div className="last-updated">
          Last updated: {data.lastUpdate 
            ? new Date(data.lastUpdate).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
              })
            : 'N/A'}
          {data.latestTradeDate && (
            <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              Trade Date: {new Date(data.latestTradeDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="market-overview-section">
        <h2>Market Overview</h2>
        <div className="market-cards">
          <div className="market-card">
            <div className="card-header">Total Traded Value (Rs.)</div>
            <div className="card-value">
              {formatCurrency(overview.totalTradedValue?.value || 0)}
            </div>
            {overview.totalTradedValue?.change !== undefined && overview.totalTradedValue?.change !== 0 && (
              <div className={`card-change ${getChangeColor(overview.totalTradedValue.change)}`}>
                {(overview.totalTradedValue.change > 0 ? '+' : '')}{formatCurrency(overview.totalTradedValue.change)}
                {overview.totalTradedValue.changePercent !== undefined && (
                  <span> ({overview.totalTradedValue.changePercent > 0 ? '+' : ''}{overview.totalTradedValue.changePercent.toFixed(2)}%)</span>
                )}
              </div>
            )}
          </div>

          <div className="market-card">
            <div className="card-header">Stocks Traded</div>
            <div className="card-value">
              {(overview.stocksTraded?.value || 0).toLocaleString()}
            </div>
            {overview.stocksTraded?.change !== undefined && overview.stocksTraded?.change !== 0 && (
              <div className={`card-change ${getChangeColor(overview.stocksTraded.change)}`}>
                {(overview.stocksTraded.change > 0 ? '+' : '')}{overview.stocksTraded.change}
              </div>
            )}
          </div>

          <div className="market-card">
            <div className="card-header">Avg Change %</div>
            <div className="card-value">
              {(overview.averageChange?.value || 0).toFixed(2)}%
            </div>
            <div className={`card-change ${getChangeColor(overview.averageChange?.value || 0)}`}>
              {(overview.averageChange?.value || 0) > 0 ? '+' : ''}{(overview.averageChange?.value || 0).toFixed(2)}%
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">Market</div>
            <div className="card-value">{(overview.marketStatus?.value || 'CSE').toString()}</div>
            <div className="card-change neutral">Colombo Stock Exchange</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="market-tabs">
        <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Market Overview
        </button>
        <button className={`tab-button ${activeTab === 'sectors' ? 'active' : ''}`} onClick={() => setActiveTab('sectors')}>
          Sector Performance
        </button>
        <button className={`tab-button ${activeTab === 'movers' ? 'active' : ''}`} onClick={() => setActiveTab('movers')}>
          Top Movers
        </button>
        <button className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`} onClick={() => setActiveTab('statistics')}>
          Market Statistics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h3>CSE Market Overview</h3>
            <div className="indicators-grid">
              <div className="indicator-item">
                <span className="indicator-label">Advances</span>
                <span className="indicator-value positive">{stats.advanceDecline?.advances || 0}</span>
                <span className="indicator-change neutral">Stocks that gained</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Declines</span>
                <span className="indicator-value negative">{stats.advanceDecline?.declines || 0}</span>
                <span className="indicator-change neutral">Stocks that fell</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Unchanged</span>
                <span className="indicator-value neutral">{stats.advanceDecline?.unchanged || 0}</span>
                <span className="indicator-change neutral">No change</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Total Volume</span>
                <span className="indicator-value">{formatNumber(stats.volume?.totalVolume || 0)}</span>
                <span className="indicator-change neutral">Shares traded</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Total Traded Value</span>
                <span className="indicator-value">{formatCurrency(overview.totalTradedValue?.value || 0)}</span>
                <span className="indicator-change neutral">Market value</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Avg Change %</span>
                <span className={`indicator-value ${getChangeColor(overview.averageChange?.value || 0)}`}>
                  {(overview.averageChange?.value || 0) > 0 ? '+' : ''}{(overview.averageChange?.value || 0).toFixed(2)}%
                </span>
                <span className="indicator-change neutral">Market breadth</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="sectors-content">
            <h3>Sector Performance</h3>
            <div className="sectors-grid">
              {(data.sectorPerformance || []).length === 0 ? (
                <p style={{ color: '#64748b', gridColumn: '1 / -1' }}>No sector data available.</p>
              ) : data.sectorPerformance.map((sector, index) => (
                <div key={index} className="sector-card">
                  <div className="sector-header">
                    <span className="sector-name">{sector.name}</span>
                    <span className={`sector-change ${getChangeColor(sector.change)}`}>
                      {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="sector-details">
                    <div className="sector-volume">Volume: {formatNumber(sector.volume || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'movers' && (
          <div className="movers-content">
            <div className="movers-section">
              <h3>Top Gainers</h3>
              <div className="movers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>% Change</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(movers.gainers || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No gainers data available</td></tr>
                    ) : movers.gainers.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price || 0)}</td>
                        <td className="positive">+{formatCurrency(stock.change || 0)}</td>
                        <td className="positive">+{(stock.changePercent || 0).toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="movers-section">
              <h3>Top Losers</h3>
              <div className="movers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>% Change</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(movers.losers || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No losers data available</td></tr>
                    ) : movers.losers.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price || 0)}</td>
                        <td className="negative">{formatCurrency(stock.change || 0)}</td>
                        <td className="negative">{(stock.changePercent || 0).toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="movers-section">
              <h3>Most Active</h3>
              <div className="movers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Volume</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(movers.mostActive || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No most active data available</td></tr>
                    ) : movers.mostActive.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price || 0)}</td>
                        <td className={getChangeColor(stock.change || 0)}>
                          {(stock.change || 0) > 0 ? '+' : ''}{formatCurrency(stock.change || 0)}
                        </td>
                        <td>{formatNumber(stock.volume || 0)}</td>
                        <td>{formatNumber(stock.value || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="statistics-content">
            <h3>Market Statistics</h3>
            <div className="statistics-grid">
              <div className="stat-card">
                <h4>Advance/Decline</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Advances</span>
                    <span className="stat-value positive">{stats.advanceDecline?.advances || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Declines</span>
                    <span className="stat-value negative">{stats.advanceDecline?.declines || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unchanged</span>
                    <span className="stat-value neutral">{stats.advanceDecline?.unchanged || 0}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h4>Volume Analysis</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Total Volume</span>
                    <span className="stat-value">{formatNumber(stats.volume?.totalVolume || 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Volume</span>
                    <span className="stat-value">{formatNumber(stats.volume?.averageVolume || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketSummary;





