import React, { useState, useEffect } from 'react';
import './MarketSummary.css';
import { dashboardAPI } from '../../services/api';

const defaultMarketData = {
  marketOverview: {
    totalTradedValue: { value: 0, change: 0, changePercent: 0 },
    stocksTraded: { value: 0, change: 0 },
    averageChange: { value: 0, change: 0 },
    marketStatus: { value: 'CSE Market', change: 0 }
  },
  sectorPerformance: [],
  topMovers: { gainers: [], losers: [], mostActive: [] },
  marketStatistics: {
    advanceDecline: { advances: 0, declines: 0, unchanged: 0 },
    volume: { totalVolume: 0, averageVolume: 0 },
    volatility: { current: 0, change: 0 }
  },
  economicIndicators: {
    gold: { price: 0, change: 0 },
    crudeOil: { price: 0, change: 0 },
    usdInr: { rate: 0, change: 0 },
    bondYield: { rate: 0, change: 0 }
  },
  marketNews: [],
  lastUpdate: null,
  latestTradeDate: null
};

const MarketSummary = () => {
  const [marketData, setMarketData] = useState(defaultMarketData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardAPI.getMarketSummary();
      setMarketData({
        ...defaultMarketData,
        ...data
      });
    } catch (error) {
      console.error('Error loading market data:', error);
      setMarketData(defaultMarketData);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toLocaleString();
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  if (isLoading) {
    return (
      <div className="market-summary-loading">
        <div className="loading-spinner"></div>
        <p>Loading market data...</p>
      </div>
    );
  }

  const ov = marketData.marketOverview || {};
  const tv = ov.totalTradedValue || {};
  const st = ov.stocksTraded || {};
  const ac = ov.averageChange || {};
  const ms = ov.marketStatus || {};

  return (
    <div className="market-summary">
      <div className="market-summary-header">
        <h1>Market Summary</h1>
        <div className="last-updated">
          {marketData.latestTradeDate
            ? `Latest data: ${new Date(marketData.latestTradeDate).toLocaleDateString()} • `
            : ''}
          Last updated: {marketData.lastUpdate
            ? new Date(marketData.lastUpdate).toLocaleTimeString()
            : new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Market Overview Cards - CSE real data from trade_summaries */}
      <div className="market-overview-section">
        <h2>Market Overview</h2>
        <div className="market-cards">
          <div className="market-card">
            <div className="card-header">Total Traded Value (Rs.)</div>
            <div className="card-value">{formatCurrency(tv.value || 0)}</div>
            <div className={`card-change ${getChangeColor(tv.change || 0)}`}>
              {(tv.change || 0) > 0 ? '+' : ''}{formatCurrency(tv.change || 0)}
              {tv.changePercent != null ? ` (${(tv.changePercent || 0) > 0 ? '+' : ''}${(tv.changePercent || 0).toFixed(2)}%)` : ''}
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">Stocks Traded</div>
            <div className="card-value">{(st.value || 0).toLocaleString()}</div>
            <div className={`card-change ${getChangeColor(st.change || 0)}`}>
              {(st.change || 0) > 0 ? '+' : ''}{(st.change || 0)}
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">Avg Change %</div>
            <div className="card-value">{(ac.value || 0).toFixed(2)}%</div>
            <div className={`card-change ${getChangeColor(ac.value || 0)}`}>
              {(ac.value || 0) > 0 ? '+' : ''}{(ac.value || 0).toFixed(2)}%
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">Market</div>
            <div className="card-value">{(ms.value || 'CSE').toString()}</div>
            <div className="card-change neutral">Colombo Stock Exchange</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="market-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Market Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'sectors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sectors')}
        >
          Sector Performance
        </button>
        <button 
          className={`tab-button ${activeTab === 'movers' ? 'active' : ''}`}
          onClick={() => setActiveTab('movers')}
        >
          Top Movers
        </button>
        <button 
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Market Statistics
        </button>
        <button 
          className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          News & Events
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="economic-indicators">
              <h3>CSE Market Overview</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Real-time data from uploaded trade summaries (latest trade date)
              </p>
              <div className="indicators-grid">
                <div className="indicator-item">
                  <span className="indicator-label">Advances</span>
                  <span className="indicator-value positive">{marketData.marketStatistics?.advanceDecline?.advances ?? 0}</span>
                  <span className="indicator-change neutral">Stocks that gained</span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Declines</span>
                  <span className="indicator-value negative">{marketData.marketStatistics?.advanceDecline?.declines ?? 0}</span>
                  <span className="indicator-change neutral">Stocks that fell</span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Unchanged</span>
                  <span className="indicator-value neutral">{marketData.marketStatistics?.advanceDecline?.unchanged ?? 0}</span>
                  <span className="indicator-change neutral">No change</span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Total Volume</span>
                  <span className="indicator-value">{formatNumber(marketData.marketStatistics?.volume?.totalVolume ?? 0)}</span>
                  <span className="indicator-change neutral">Shares traded</span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Total Traded Value</span>
                  <span className="indicator-value">{formatCurrency(marketData.marketOverview?.totalTradedValue?.value ?? 0)}</span>
                  <span className={`indicator-change ${getChangeColor(marketData.marketOverview?.totalTradedValue?.change ?? 0)}`}>
                    {(marketData.marketOverview?.totalTradedValue?.change ?? 0) > 0 ? '+' : ''}
                    {formatCurrency(marketData.marketOverview?.totalTradedValue?.change ?? 0)} vs prev
                  </span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Avg Change %</span>
                  <span className={`indicator-value ${getChangeColor(marketData.marketOverview?.averageChange?.value ?? 0)}`}>
                    {(marketData.marketOverview?.averageChange?.value ?? 0) > 0 ? '+' : ''}
                    {(marketData.marketOverview?.averageChange?.value ?? 0).toFixed(2)}%
                  </span>
                  <span className="indicator-change neutral">Market breadth</span>
                </div>
              </div>
              {((marketData.topMovers?.gainers) || []).length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#1e293b' }}>Top 3 Gainers (Preview)</h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {(marketData.topMovers?.gainers || []).slice(0, 3).map((s, i) => (
                      <span key={i} style={{ background: '#f0fdf4', padding: '0.35rem 0.75rem', color: '#059669', fontWeight: 600, fontSize: '0.875rem' }}>
                        {s.symbol} +{(s.changePercent ?? 0).toFixed(2)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="sectors-content">
            <h3>Sector Performance</h3>
            <div className="sectors-grid">
              {(marketData.sectorPerformance || []).length === 0 ? (
                <p style={{ color: '#64748b', gridColumn: '1 / -1' }}>No sector data available. Ensure equities have sector assigned and trade data is uploaded.</p>
              ) : marketData.sectorPerformance.map((sector, index) => (
                <div key={index} className="sector-card">
                  <div className="sector-header">
                    <span className="sector-name">{sector.name}</span>
                    <span className={`sector-change ${getChangeColor(sector.change)}`}>
                      {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="sector-details">
                    <div className="sector-volume">
                      Volume: {formatNumber(sector.volume || 0)}
                    </div>
                    <div className="sector-stocks">
                      Top: {(sector.topStocks || []).length ? (sector.topStocks || []).join(', ') : '—'}
                    </div>
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
                    {((marketData.topMovers?.gainers) || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No gainers data. Upload trade summaries for the latest date.</td></tr>
                    ) : (marketData.topMovers?.gainers || []).map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price ?? 0)}</td>
                        <td className="positive">+{formatCurrency(stock.change ?? 0)}</td>
                        <td className="positive">+{(stock.changePercent ?? 0).toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume ?? 0)}</td>
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
                    {((marketData.topMovers?.losers) || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No losers data. Upload trade summaries for the latest date.</td></tr>
                    ) : (marketData.topMovers?.losers || []).map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price ?? 0)}</td>
                        <td className="negative">{formatCurrency(stock.change ?? 0)}</td>
                        <td className="negative">{(stock.changePercent ?? 0).toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume ?? 0)}</td>
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
                    {((marketData.topMovers?.mostActive) || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No most active data. Upload trade summaries for the latest date.</td></tr>
                    ) : (marketData.topMovers?.mostActive || []).map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price ?? 0)}</td>
                        <td className={getChangeColor(stock.change ?? 0)}>
                          {(stock.change ?? 0) > 0 ? '+' : ''}{formatCurrency(stock.change ?? 0)}
                        </td>
                        <td>{formatNumber(stock.volume ?? 0)}</td>
                        <td>{formatNumber(stock.value ?? 0)}</td>
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
                    <span className="stat-value positive">{marketData.marketStatistics?.advanceDecline?.advances ?? 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Declines</span>
                    <span className="stat-value negative">{marketData.marketStatistics?.advanceDecline?.declines ?? 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unchanged</span>
                    <span className="stat-value neutral">{marketData.marketStatistics?.advanceDecline?.unchanged ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h4>Volume Analysis</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Total Volume</span>
                    <span className="stat-value">{formatNumber(marketData.marketStatistics?.volume?.totalVolume ?? 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Volume</span>
                    <span className="stat-value">{formatNumber(marketData.marketStatistics?.volume?.averageVolume ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h4>Volatility (VIX)</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Current</span>
                    <span className="stat-value">{(marketData.marketStatistics?.volatility?.current ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Change</span>
                    <span className={`stat-value ${getChangeColor(marketData.marketStatistics?.volatility?.change ?? 0)}`}>
                      {(marketData.marketStatistics?.volatility?.change ?? 0) > 0 ? '+' : ''}
                      {(marketData.marketStatistics?.volatility?.change ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="news-content">
            <h3>Market News & Events</h3>
            <div className="news-list">
              {((marketData.marketNews) || []).length === 0 ? (
                <p style={{ color: '#64748b' }}>No market news available.</p>
              ) : (marketData.marketNews || []).map((news) => (
                <div key={news.id} className="news-item">
                  <div className="news-header">
                    <span className="news-title">{news.title}</span>
                    <span className={`news-impact ${news.impact.toLowerCase()}`}>
                      {news.impact}
                    </span>
                  </div>
                  <div className="news-details">
                    <span className="news-category">{news.category}</span>
                    <span className="news-time">{news.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default MarketSummary;
