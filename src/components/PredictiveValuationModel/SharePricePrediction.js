import React, { useState, useEffect } from 'react';
import './Styles/SharePricePrediction.css';
import { equityAPI, tradeSummaryAPI } from '../../services/api';

const SharePricePrediction = () => {
  const [equities, setEquities] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [factors, setFactors] = useState(null);

  // Model weights (adjustable)
  const [weights, setWeights] = useState({
    momentum: 0.4,
    volume: 0.2,
    rsi: 0.2,
    sector: 0.2
  });

  // Load equities list
  useEffect(() => {
    const loadEquities = async () => {
      try {
        const data = await equityAPI.getActiveEquities();
        setEquities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading equities:', error);
      }
    };
    loadEquities();
  }, []);

  // Calculate technical indicators
  const calculateMomentum = (prices, days = 7) => {
    if (prices.length < days + 1) return 0;
    const current = parseFloat(prices[prices.length - 1].last_trade);
    const past = parseFloat(prices[prices.length - days - 1].last_trade);
    return past > 0 ? (current - past) / past : 0;
  };

  const calculateVolumeRatio = (data, days = 30) => {
    if (data.length < days) return 1;
    const current = parseFloat(data[data.length - 1].trade_volume);
    const avg = data.slice(-days).reduce((sum, d) => sum + parseFloat(d.trade_volume || 0), 0) / days;
    return avg > 0 ? current / avg : 1;
  };

  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(parseFloat(prices[i].last_trade) - parseFloat(prices[i - 1].last_trade));
    }
    
    if (changes.length < period) return 50;
    
    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
    
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  };

  const getSectorAverage = async (symbol) => {
    try {
      const equity = equities.find(e => e.symbol === symbol);
      if (!equity || !equity.sector) return 0;
      
      const sectorEquities = equities.filter(e => e.sector === equity.sector && e.symbol !== symbol);
      if (sectorEquities.length === 0) return 0;
      
      // Get latest prices for sector stocks
      const sectorReturns = [];
      for (const eq of sectorEquities.slice(0, 10)) { // Limit to 10 for performance
        try {
          const data = await tradeSummaryAPI.getCompanyData(eq.symbol, null, null);
          if (data && data.length > 0) {
            const latest = data[data.length - 1];
            const previous = data.length > 1 ? data[data.length - 2] : latest;
            if (previous && parseFloat(previous.last_trade) > 0) {
              const returnPct = (parseFloat(latest.last_trade) - parseFloat(previous.last_trade)) / parseFloat(previous.last_trade);
              sectorReturns.push(returnPct);
            }
          }
        } catch (err) {
          // Skip if error
        }
      }
      
      return sectorReturns.length > 0 
        ? sectorReturns.reduce((a, b) => a + b, 0) / sectorReturns.length 
        : 0;
    } catch (error) {
      console.error('Error calculating sector average:', error);
      return 0;
    }
  };

  // Predict price
  const predictPrice = async () => {
    if (!selectedSymbol || historicalData.length < 14) {
      alert('Please select a stock and ensure sufficient historical data is available.');
      return;
    }

    setLoading(true);
    try {
      const currentPrice = parseFloat(historicalData[historicalData.length - 1].last_trade);
      
      // Calculate factors
      const momentum = calculateMomentum(historicalData, 7);
      const volumeRatio = calculateVolumeRatio(historicalData, 30);
      const rsi = calculateRSI(historicalData, 14);
      const sectorTrend = await getSectorAverage(selectedSymbol);
      
      // Calculate adjustments
      const momentumAdjustment = momentum * weights.momentum;
      const volumeAdjustment = (volumeRatio - 1) * weights.volume * 0.1; // Scale down volume impact
      const rsiAdjustment = ((rsi - 50) / 50) * weights.rsi; // Normalize RSI
      const sectorAdjustment = sectorTrend * weights.sector;
      
      // Predict
      const totalAdjustment = momentumAdjustment + volumeAdjustment + rsiAdjustment + sectorAdjustment;
      const predictedPrice = currentPrice * (1 + totalAdjustment);
      
      const changePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;
      
      setPrediction({
        currentPrice,
        predictedPrice,
        changePercent,
        confidence: Math.min(100, Math.max(0, 100 - Math.abs(changePercent) * 2)) // Simple confidence metric
      });
      
      setFactors({
        momentum: {
          value: momentum,
          adjustment: momentumAdjustment,
          impact: (momentumAdjustment / totalAdjustment) * 100 || 0
        },
        volume: {
          value: volumeRatio,
          adjustment: volumeAdjustment,
          impact: (volumeAdjustment / totalAdjustment) * 100 || 0
        },
        rsi: {
          value: rsi,
          adjustment: rsiAdjustment,
          impact: (rsiAdjustment / totalAdjustment) * 100 || 0
        },
        sector: {
          value: sectorTrend,
          adjustment: sectorAdjustment,
          impact: (sectorAdjustment / totalAdjustment) * 100 || 0
        }
      });
    } catch (error) {
      console.error('Error predicting price:', error);
      alert('Error generating prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load historical data when symbol changes
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (!selectedSymbol) {
        setHistoricalData([]);
        return;
      }
      
      setLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
        
        const data = await tradeSummaryAPI.getCompanyData(
          selectedSymbol,
          startDate.toISOString().split('T')[0],
          endDate
        );
        
        setHistoricalData(Array.isArray(data) ? data.sort((a, b) => 
          new Date(a.trade_date) - new Date(b.trade_date)
        ) : []);
      } catch (error) {
        console.error('Error loading historical data:', error);
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistoricalData();
  }, [selectedSymbol]);

  return (
    <div className="share-price-prediction-container">
      <div className="spp-header">
        <h2>Share Price Prediction Model</h2>
        <p className="spp-subtitle">
          Predict next-day share prices using multi-factor analysis (Company, Sector, Economic, Market factors)
        </p>
      </div>

      <div className="spp-content">
        {/* Main Factor Category */}
        <div className="spp-section factor-category-header">
          <h3>Market & Psychological Factors + Industry & Sector Factors</h3>
          <p className="factor-category-description">
            This model analyzes Market & Psychological Factors (Momentum, Volume, RSI) and Industry & Sector Factors (Sector Trend) to predict share price movements.
          </p>
        </div>

        {/* Stock Selection */}
        <div className="spp-section">
          <h3>Stock Selection</h3>
          <div className="spp-controls">
            <div className="control-group">
              <label>Select Stock</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select a stock --</option>
                {equities.map((eq) => (
                  <option key={eq.id} value={eq.symbol}>
                    {eq.symbol} - {eq.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSymbol && historicalData.length > 0 && (
              <div className="control-group">
                <label>Current Price</label>
                <div className="current-price">
                  LKR {parseFloat(historicalData[historicalData.length - 1].last_trade).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Model Weights */}
        <div className="spp-section">
          <h3>Model Weights (Adjustable)</h3>
          <div className="spp-weights">
            <div className="weight-control">
              <label>Momentum Weight</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={weights.momentum}
                onChange={(e) => setWeights({...weights, momentum: parseFloat(e.target.value) || 0})}
              />
              <span className="weight-value">{weights.momentum}</span>
            </div>
            <div className="weight-control">
              <label>Volume Weight</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={weights.volume}
                onChange={(e) => setWeights({...weights, volume: parseFloat(e.target.value) || 0})}
              />
              <span className="weight-value">{weights.volume}</span>
            </div>
            <div className="weight-control">
              <label>RSI Weight</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={weights.rsi}
                onChange={(e) => setWeights({...weights, rsi: parseFloat(e.target.value) || 0})}
              />
              <span className="weight-value">{weights.rsi}</span>
            </div>
            <div className="weight-control">
              <label>Sector Weight</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={weights.sector}
                onChange={(e) => setWeights({...weights, sector: parseFloat(e.target.value) || 0})}
              />
              <span className="weight-value">{weights.sector}</span>
            </div>
          </div>
          <div className="weight-total">
            Total: {(weights.momentum + weights.volume + weights.rsi + weights.sector).toFixed(2)}
          </div>
        </div>

        {/* Prediction Button */}
        <div className="spp-section">
          <button
            className="predict-button"
            onClick={predictPrice}
            disabled={!selectedSymbol || historicalData.length < 14 || loading}
          >
            {loading ? 'Calculating...' : 'Predict Next Day Price'}
          </button>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="spp-section">
            <h3>Prediction Results</h3>
            <div className="prediction-results">
              <div className="prediction-card">
                <div className="prediction-item">
                  <span className="prediction-label">Current Price</span>
                  <span className="prediction-value">LKR {prediction.currentPrice.toFixed(2)}</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">Predicted Price</span>
                  <span className={`prediction-value ${prediction.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    LKR {prediction.predictedPrice.toFixed(2)}
                  </span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">Expected Change</span>
                  <span className={`prediction-value ${prediction.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {prediction.changePercent >= 0 ? '+' : ''}{prediction.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">Confidence</span>
                  <span className="prediction-value">{prediction.confidence.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Factor Breakdown */}
        {factors && (
          <div className="spp-section">
            <h3>Factor Contribution Breakdown</h3>
            <div className="factors-breakdown">
              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">Momentum (7-day)</span>
                  <span className="factor-impact">{factors.momentum.impact.toFixed(1)}%</span>
                </div>
                <div className="factor-details">
                  <span>Value: {(factors.momentum.value * 100).toFixed(2)}%</span>
                  <span>Adjustment: {(factors.momentum.adjustment * 100).toFixed(2)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-bar-fill" 
                    style={{ width: `${Math.abs(factors.momentum.impact)}%` }}
                  />
                </div>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">Volume Ratio</span>
                  <span className="factor-impact">{factors.volume.impact.toFixed(1)}%</span>
                </div>
                <div className="factor-details">
                  <span>Value: {factors.volume.value.toFixed(2)}x</span>
                  <span>Adjustment: {(factors.volume.adjustment * 100).toFixed(2)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-bar-fill" 
                    style={{ width: `${Math.abs(factors.volume.impact)}%` }}
                  />
                </div>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">RSI (14-day)</span>
                  <span className="factor-impact">{factors.rsi.impact.toFixed(1)}%</span>
                </div>
                <div className="factor-details">
                  <span>Value: {factors.rsi.value.toFixed(2)}</span>
                  <span>Adjustment: {(factors.rsi.adjustment * 100).toFixed(2)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-bar-fill" 
                    style={{ width: `${Math.abs(factors.rsi.impact)}%` }}
                  />
                </div>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">Sector Trend</span>
                  <span className="factor-impact">{factors.sector.impact.toFixed(1)}%</span>
                </div>
                <div className="factor-details">
                  <span>Value: {(factors.sector.value * 100).toFixed(2)}%</span>
                  <span>Adjustment: {(factors.sector.adjustment * 100).toFixed(2)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-bar-fill" 
                    style={{ width: `${Math.abs(factors.sector.impact)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Status */}
        {selectedSymbol && (
          <div className="spp-section">
            <div className="data-status">
              <span>Historical Data Points: {historicalData.length}</span>
              {historicalData.length < 14 && (
                <span className="warning">Insufficient data for prediction (minimum 14 days required)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePricePrediction;
