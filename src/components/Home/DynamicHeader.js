import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import './Styles/DynamicHeader.css';

const DynamicHeader = () => {
  const [gainers, setGainers] = useState([]);
  const [latestTradeDate, setLatestTradeDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGainers();
    // Refresh every 5 minutes
    const interval = setInterval(loadGainers, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadGainers = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardAPI.getMarketSummary();
      
      // Get gainers (stocks with positive change_percent)
      const gainersList = data.topMovers?.gainers || [];
      
      // Sort by change_percent descending (highest gainers first)
      const sortedGainers = [...gainersList].sort((a, b) => 
        (b.changePercent || 0) - (a.changePercent || 0)
      );
      
      setGainers(sortedGainers);
      setLatestTradeDate(data.latestTradeDate);
    } catch (error) {
      console.error('Error loading gainers:', error);
      setGainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num == null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading && gainers.length === 0) {
    return (
      <div className="dynamic-header">
        <div className="dynamic-header-content">
          <div className="dynamic-header-label">
            <span>Top Gainers</span>
            {latestTradeDate && (
              <span className="date-badge">{formatDate(latestTradeDate)}</span>
            )}
          </div>
          <div className="dynamic-header-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (gainers.length === 0) {
    return null; // Don't show header if no gainers
  }

  return (
    <div className="dynamic-header">
      <div className="dynamic-header-content">
        <div className="dynamic-header-label">
          <span>Top Gainers</span>
          {latestTradeDate && (
            <span className="date-badge">{formatDate(latestTradeDate)}</span>
          )}
        </div>
        <div className="dynamic-header-ticker">
          <div className="ticker-content">
            {gainers.map((stock, index) => (
              <div key={`${stock.symbol}-${index}`} className="ticker-item">
                <span className="stock-symbol">{stock.symbol || 'N/A'}</span>
                <span className="stock-price">Rs. {formatNumber(stock.price)}</span>
                <span className="stock-change positive">
                  +{formatNumber(stock.changePercent)}%
                </span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {gainers.map((stock, index) => (
              <div key={`${stock.symbol}-${index}-dup`} className="ticker-item">
                <span className="stock-symbol">{stock.symbol || 'N/A'}</span>
                <span className="stock-price">Rs. {formatNumber(stock.price)}</span>
                <span className="stock-change positive">
                  +{formatNumber(stock.changePercent)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicHeader;
