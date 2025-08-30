import React, { useState, useEffect } from 'react';
import './MarketSummary.css';

const MarketSummary = () => {
  const [marketData, setMarketData] = useState({
    marketOverview: {
      nifty: { value: 0, change: 0, changePercent: 0 },
      sensex: { value: 0, change: 0, changePercent: 0 },
      bankNifty: { value: 0, change: 0, changePercent: 0 },
      vix: { value: 0, change: 0 }
    },
    sectorPerformance: [],
    topMovers: {
      gainers: [],
      losers: [],
      mostActive: []
    },
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
    marketNews: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMarketData();
    // Refresh data every 5 minutes
    const interval = setInterval(loadMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      // TODO: Replace with actual API calls
      // For now, using mock data
      const mockData = {
        marketOverview: {
          nifty: { value: 19567.45, change: 125.67, changePercent: 0.65 },
          sensex: { value: 65432.12, change: 456.78, changePercent: 0.70 },
          bankNifty: { value: 43210.98, change: 234.56, changePercent: 0.55 },
          vix: { value: 15.67, change: -0.45 }
        },
        sectorPerformance: [
          { name: 'IT', change: 2.5, volume: 1250000, topStocks: ['TCS', 'INFY', 'WIPRO'] },
          { name: 'Banking', change: 1.8, volume: 980000, topStocks: ['HDFC', 'ICICI', 'SBI'] },
          { name: 'Pharma', change: -0.8, volume: 450000, topStocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA'] },
          { name: 'Auto', change: 0.5, volume: 320000, topStocks: ['MARUTI', 'TATAMOTORS', 'HEROMOTOCO'] },
          { name: 'FMCG', change: 1.2, volume: 280000, topStocks: ['HUL', 'ITC', 'NESTLE'] },
          { name: 'Energy', change: -1.5, volume: 180000, topStocks: ['RELIANCE', 'ONGC', 'BPCL'] }
        ],
        topMovers: {
          gainers: [
            { symbol: 'TATAMOTORS', price: 789.45, change: 45.67, changePercent: 6.15, volume: 1250000 },
            { symbol: 'INFY', price: 1567.89, change: 78.90, changePercent: 5.30, volume: 890000 },
            { symbol: 'WIPRO', price: 456.78, change: 23.45, changePercent: 5.42, volume: 670000 },
            { symbol: 'HCLTECH', price: 1234.56, change: 56.78, changePercent: 4.82, volume: 450000 },
            { symbol: 'TECHM', price: 987.65, change: 34.56, changePercent: 3.67, volume: 320000 }
          ],
          losers: [
            { symbol: 'RELIANCE', price: 2345.67, change: -89.12, changePercent: -3.66, volume: 2100000 },
            { symbol: 'ONGC', price: 156.78, change: -5.67, changePercent: -3.49, volume: 890000 },
            { symbol: 'BPCL', price: 345.67, change: -12.34, changePercent: -3.45, volume: 670000 },
            { symbol: 'IOC', price: 123.45, change: -4.32, changePercent: -3.38, volume: 450000 },
            { symbol: 'POWERGRID', price: 234.56, change: -7.89, changePercent: -3.25, volume: 320000 }
          ],
          mostActive: [
            { symbol: 'RELIANCE', price: 2345.67, change: -89.12, volume: 1250000, value: 4925907000 },
            { symbol: 'TATAMOTORS', price: 789.45, change: 45.67, volume: 1250000, value: 986812500 },
            { symbol: 'INFY', price: 1567.89, change: 78.90, volume: 890000, value: 1395422100 },
            { symbol: 'TCS', price: 3456.78, change: 123.45, volume: 450000, value: 1555551000 },
            { symbol: 'HDFC', price: 1234.56, change: 34.56, volume: 670000, value: 827155200 }
          ]
        },
        marketStatistics: {
          advanceDecline: { advances: 1250, declines: 890, unchanged: 156 },
          volume: { totalVolume: 12500000000, averageVolume: 9800000000 },
          volatility: { current: 15.67, change: -0.45 }
        },
        economicIndicators: {
          gold: { price: 56789, change: 234 },
          crudeOil: { price: 89.45, change: -1.23 },
          usdInr: { rate: 82.45, change: 0.12 },
          bondYield: { rate: 7.23, change: -0.05 }
        },
        marketNews: [
          { id: 1, title: 'RBI maintains repo rate at 6.5%', category: 'Monetary Policy', impact: 'Positive', time: '2 hours ago' },
          { id: 2, title: 'Q3 earnings season begins with strong IT results', category: 'Earnings', impact: 'Positive', time: '4 hours ago' },
          { id: 3, title: 'Global markets react to Fed policy decision', category: 'Global Markets', impact: 'Neutral', time: '6 hours ago' },
          { id: 4, title: 'Oil prices fall on demand concerns', category: 'Commodities', impact: 'Negative', time: '8 hours ago' }
        ]
      };

      setMarketData(mockData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading market data:', error);
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
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
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

  return (
    <div className="market-summary">
      <div className="market-summary-header">
        <h1>Market Summary</h1>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="market-overview-section">
        <h2>Market Overview</h2>
        <div className="market-cards">
          <div className="market-card">
            <div className="card-header">NIFTY 50</div>
            <div className="card-value">{marketData.marketOverview.nifty.value.toLocaleString()}</div>
            <div className={`card-change ${getChangeColor(marketData.marketOverview.nifty.change)}`}>
              {marketData.marketOverview.nifty.change > 0 ? '+' : ''}
              {marketData.marketOverview.nifty.change.toFixed(2)} 
              ({marketData.marketOverview.nifty.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">SENSEX</div>
            <div className="card-value">{marketData.marketOverview.sensex.value.toLocaleString()}</div>
            <div className={`card-change ${getChangeColor(marketData.marketOverview.sensex.change)}`}>
              {marketData.marketOverview.sensex.change > 0 ? '+' : ''}
              {marketData.marketOverview.sensex.change.toFixed(2)} 
              ({marketData.marketOverview.sensex.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">BANK NIFTY</div>
            <div className="card-value">{marketData.marketOverview.bankNifty.value.toLocaleString()}</div>
            <div className={`card-change ${getChangeColor(marketData.marketOverview.bankNifty.change)}`}>
              {marketData.marketOverview.bankNifty.change > 0 ? '+' : ''}
              {marketData.marketOverview.bankNifty.change.toFixed(2)} 
              ({marketData.marketOverview.bankNifty.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="market-card">
            <div className="card-header">VIX</div>
            <div className="card-value">{marketData.marketOverview.vix.value.toFixed(2)}</div>
            <div className={`card-change ${getChangeColor(marketData.marketOverview.vix.change)}`}>
              {marketData.marketOverview.vix.change > 0 ? '+' : ''}
              {marketData.marketOverview.vix.change.toFixed(2)}
            </div>
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
              <h3>Economic Indicators</h3>
              <div className="indicators-grid">
                <div className="indicator-item">
                  <span className="indicator-label">Gold (/10g)</span>
                  <span className="indicator-value">{formatCurrency(marketData.economicIndicators.gold.price)}</span>
                  <span className={`indicator-change ${getChangeColor(marketData.economicIndicators.gold.change)}`}>
                    {marketData.economicIndicators.gold.change > 0 ? '+' : ''}
                    {formatCurrency(marketData.economicIndicators.gold.change)}
                  </span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">Crude Oil ($/bbl)</span>
                  <span className="indicator-value">${marketData.economicIndicators.crudeOil.price.toFixed(2)}</span>
                  <span className={`indicator-change ${getChangeColor(marketData.economicIndicators.crudeOil.change)}`}>
                    {marketData.economicIndicators.crudeOil.change > 0 ? '+' : ''}
                    ${marketData.economicIndicators.crudeOil.change.toFixed(2)}
                  </span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">USD/INR</span>
                  <span className="indicator-value">{marketData.economicIndicators.usdInr.rate.toFixed(2)}</span>
                  <span className={`indicator-change ${getChangeColor(marketData.economicIndicators.usdInr.change)}`}>
                    {marketData.economicIndicators.usdInr.change > 0 ? '+' : ''}
                    {marketData.economicIndicators.usdInr.change.toFixed(2)}
                  </span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">10Y Bond Yield</span>
                  <span className="indicator-value">{marketData.economicIndicators.bondYield.rate.toFixed(2)}%</span>
                  <span className={`indicator-change ${getChangeColor(marketData.economicIndicators.bondYield.change)}`}>
                    {marketData.economicIndicators.bondYield.change > 0 ? '+' : ''}
                    {marketData.economicIndicators.bondYield.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="sectors-content">
            <h3>Sector Performance</h3>
            <div className="sectors-grid">
              {marketData.sectorPerformance.map((sector, index) => (
                <div key={index} className="sector-card">
                  <div className="sector-header">
                    <span className="sector-name">{sector.name}</span>
                    <span className={`sector-change ${getChangeColor(sector.change)}`}>
                      {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="sector-details">
                    <div className="sector-volume">
                      Volume: {formatNumber(sector.volume)}
                    </div>
                    <div className="sector-stocks">
                      Top: {sector.topStocks.join(', ')}
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
                    {marketData.topMovers.gainers.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price)}</td>
                        <td className="positive">+{formatCurrency(stock.change)}</td>
                        <td className="positive">+{stock.changePercent.toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume)}</td>
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
                    {marketData.topMovers.losers.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price)}</td>
                        <td className="negative">{formatCurrency(stock.change)}</td>
                        <td className="negative">{stock.changePercent.toFixed(2)}%</td>
                        <td>{formatNumber(stock.volume)}</td>
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
                    {marketData.topMovers.mostActive.map((stock, index) => (
                      <tr key={index}>
                        <td className="symbol">{stock.symbol}</td>
                        <td>{formatCurrency(stock.price)}</td>
                        <td className={getChangeColor(stock.change)}>
                          {stock.change > 0 ? '+' : ''}{formatCurrency(stock.change)}
                        </td>
                        <td>{formatNumber(stock.volume)}</td>
                        <td>{formatNumber(stock.value)}</td>
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
                    <span className="stat-value positive">{marketData.marketStatistics.advanceDecline.advances}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Declines</span>
                    <span className="stat-value negative">{marketData.marketStatistics.advanceDecline.declines}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unchanged</span>
                    <span className="stat-value neutral">{marketData.marketStatistics.advanceDecline.unchanged}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h4>Volume Analysis</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Total Volume</span>
                    <span className="stat-value">{formatNumber(marketData.marketStatistics.volume.totalVolume)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Volume</span>
                    <span className="stat-value">{formatNumber(marketData.marketStatistics.volume.averageVolume)}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h4>Volatility (VIX)</h4>
                <div className="stat-values">
                  <div className="stat-item">
                    <span className="stat-label">Current</span>
                    <span className="stat-value">{marketData.marketStatistics.volatility.current.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Change</span>
                    <span className={`stat-value ${getChangeColor(marketData.marketStatistics.volatility.change)}`}>
                      {marketData.marketStatistics.volatility.change > 0 ? '+' : ''}
                      {marketData.marketStatistics.volatility.change.toFixed(2)}
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
              {marketData.marketNews.map((news) => (
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
