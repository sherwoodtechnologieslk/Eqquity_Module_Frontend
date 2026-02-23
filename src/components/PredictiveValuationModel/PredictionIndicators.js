import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/PredictionIndicators.css';
import { equityAPI, tradeSummaryAPI } from '../../services/api';

// Half Circle Gauge Component
const HalfCircleGauge = ({ value, label, color, arrow, onClick }) => {
  const percentage = Math.min(100, Math.max(0, value));
  const radius = 75;
  const centerX = 100;
  const centerY = 95; // Center at bottom of semi-circle
  
  // Calculate needle position
  const needleAngleDeg = (percentage / 100) * 180;
  const needleAngleRad = (needleAngleDeg - 180) * (Math.PI / 180);
  const needleLength = 50;
  const needleX = centerX + Math.cos(needleAngleRad) * needleLength;
  const needleY = centerY + Math.sin(needleAngleRad) * needleLength;
  
  // Professional gradient colors
  const segmentGradients = [
    { start: '#10b981', end: '#34d399' }, // Green
    { start: '#84cc16', end: '#a3e635' }, // Lime
    { start: '#eab308', end: '#fde047' }, // Yellow
    { start: '#f97316', end: '#fb923c' }, // Orange
    { start: '#f87171', end: '#fca5a5' }  // Red
  ];
  
  // 5 segments: angles from 0 to 180 degrees
  const segmentAngles = [0, 36, 72, 108, 144, 180];

  const handleClick = useCallback((e) => {
    if (!onClick) return;
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  }, [onClick]);

  return (
    <div 
      className="half-circle-gauge-card"
      onClick={handleClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <div className="gauge-title">{label}</div>
      <div className="gauge-content">
        <svg width="200" height="130" viewBox="0 0 200 130" className="gauge-svg">
          <defs>
            {/* Gradient definitions for each segment */}
            {segmentGradients.map((grad, index) => (
              <linearGradient key={index} id={`gauge-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={grad.start} />
                <stop offset="100%" stopColor={grad.end} />
              </linearGradient>
            ))}
            {/* Shadow filter for depth */}
            <filter id="gauge-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Glow effect for active segments */}
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc (subtle) */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="24"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Color-coded segments with gradients */}
          {segmentAngles.slice(0, -1).map((startAngle, index) => {
            const endAngle = segmentAngles[index + 1];
            const startRad = (startAngle - 180) * (Math.PI / 180);
            const endRad = (endAngle - 180) * (Math.PI / 180);
            const startX = centerX + Math.cos(startRad) * radius;
            const startY = centerY + Math.sin(startRad) * radius;
            const endX = centerX + Math.cos(endRad) * radius;
            const endY = centerY + Math.sin(endRad) * radius;
            const largeArc = endAngle - startAngle > 90 ? 1 : 0;
            const isActive = percentage >= (startAngle / 180 * 100) && percentage < (endAngle / 180 * 100);
            
            return (
              <path
                key={index}
                d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
                fill="none"
                stroke={`url(#gauge-gradient-${index})`}
                strokeWidth="22"
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.7}
              />
            );
          })}
          
          
          {/* Needle with shadow */}
          <g filter="url(#gauge-shadow)">
            {/* Needle shadow */}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX + 1}
              y2={needleY + 1}
              stroke="#1f2937"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.2"
            />
            {/* Main needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Needle tip */}
            <circle
              cx={needleX}
              cy={needleY}
              r="3"
              fill="#1f2937"
            />
          </g>
          
          {/* Pivot point with gradient */}
          <defs>
            <radialGradient id="pivot-gradient">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </radialGradient>
          </defs>
          <circle
            cx={centerX}
            cy={centerY}
            r="7"
            fill="url(#pivot-gradient)"
            stroke="#374151"
            strokeWidth="2"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill="#1f2937"
          />
        </svg>
      </div>
    </div>
  );
};

const PredictionIndicators = () => {
  const [equities, setEquities] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPolicyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPolicyModal]);

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

  const calculateMovingAverage = (prices, period) => {
    if (prices.length < period) return null;
    const recent = prices.slice(-period);
    const sum = recent.reduce((acc, p) => acc + parseFloat(p.last_trade), 0);
    return sum / period;
  };

  const calculateVolatility = (prices, period = 20) => {
    if (prices.length < period + 1) return 0;
    const recent = prices.slice(-period);
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = parseFloat(recent[i - 1].last_trade);
      const curr = parseFloat(recent[i].last_trade);
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Return as percentage
  };

  const getSectorAverage = async (symbol) => {
    try {
      const equity = equities.find(e => e.symbol === symbol);
      if (!equity || !equity.sector) return 0;
      
      const sectorEquities = equities.filter(e => e.sector === equity.sector && e.symbol !== symbol);
      if (sectorEquities.length === 0) return 0;
      
      const sectorReturns = [];
      for (const eq of sectorEquities.slice(0, 10)) {
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

  // Calculate all indicators (auto-calculate when data is available)
  useEffect(() => {
    const calculateIndicators = async () => {
      if (!selectedSymbol || historicalData.length < 14) {
        setIndicators(null);
        return;
      }

    setLoading(true);
    try {
      const currentPrice = parseFloat(historicalData[historicalData.length - 1].last_trade);
      
      // Calculate all indicators
      const momentum7d = calculateMomentum(historicalData, 7);
      const momentum30d = calculateMomentum(historicalData, 30);
      const volumeRatio = calculateVolumeRatio(historicalData, 30);
      const rsi = calculateRSI(historicalData, 14);
      const ma7 = calculateMovingAverage(historicalData, 7);
      const ma30 = calculateMovingAverage(historicalData, 30);
      const volatility = calculateVolatility(historicalData, 20);
      const sectorTrend = await getSectorAverage(selectedSymbol);
      
      // Calculate factor scores for gauges (0-100 scale)
      // 1. Company Performance (Fundamentals) - Placeholder (would need financial data)
      const fundamentalsScore = 50; // Default neutral
      const fundamentalsColor = 'neutral';
      const fundamentalsDirection = 'neutral';
      
      // 2. Market Sentiment (Psychology) - Based on RSI and Momentum
      const sentimentScore = rsi; // RSI is already 0-100
      const sentimentColor = rsi > 60 ? 'positive' : rsi < 40 ? 'negative' : 'neutral';
      const sentimentDirection = momentum7d > 0.02 ? 'up' : momentum7d < -0.02 ? 'down' : 'neutral';
      
      // 3. Economic Conditions (Macro) - Placeholder (would need economic data)
      const economicScore = 50; // Default neutral
      const economicColor = 'neutral';
      const economicDirection = 'neutral';
      
      // 4. Industry & Sector Trends
      const sectorScore = 50 + (sectorTrend * 1000); // Convert to 0-100 scale
      const sectorColor = sectorTrend > 0.02 ? 'positive' : sectorTrend < -0.02 ? 'negative' : 'neutral';
      const sectorDirection = sectorTrend > 0 ? 'up' : sectorTrend < 0 ? 'down' : 'neutral';
      
      // 5. Supply & Demand - Based on Volume Ratio
      const supplyDemandScore = Math.min(100, Math.max(0, (volumeRatio - 0.5) * 66.67 + 50)); // Scale volume ratio
      const supplyDemandColor = volumeRatio > 1.5 ? 'positive' : volumeRatio < 0.7 ? 'negative' : 'neutral';
      const supplyDemandDirection = volumeRatio > 1.2 ? 'up' : volumeRatio < 0.8 ? 'down' : 'neutral';
      
      // 6. Global Events - Placeholder
      const globalScore = 50;
      const globalColor = 'neutral';
      const globalDirection = 'neutral';
      
      // 7. Government Policies - Placeholder
      const policyScore = 50;
      const policyColor = 'neutral';
      const policyDirection = 'neutral';
      
      // 8. Company-Specific News - Placeholder
      const newsScore = 50;
      const newsColor = 'neutral';
      const newsDirection = 'neutral';
      
      // 9. Technical Factors - Composite of RSI, Momentum, MA
      const technicalScore = (rsi * 0.4 + (momentum7d * 100 + 50) * 0.3 + (currentPrice > ma7 && ma7 > ma30 ? 70 : 50) * 0.3);
      const technicalColor = technicalScore > 60 ? 'positive' : technicalScore < 40 ? 'negative' : 'neutral';
      const technicalDirection = momentum7d > 0 ? 'up' : momentum7d < 0 ? 'down' : 'neutral';
      
      // Determine signals
      const getRSISignal = (rsi) => {
        if (rsi > 70) return { signal: 'Overbought', color: 'negative' };
        if (rsi < 30) return { signal: 'Oversold', color: 'positive' };
        return { signal: 'Neutral', color: 'neutral' };
      };

      const getMomentumSignal = (momentum) => {
        if (momentum > 0.05) return { signal: 'Strong Bullish', color: 'positive' };
        if (momentum > 0.02) return { signal: 'Bullish', color: 'positive' };
        if (momentum < -0.05) return { signal: 'Strong Bearish', color: 'negative' };
        if (momentum < -0.02) return { signal: 'Bearish', color: 'negative' };
        return { signal: 'Neutral', color: 'neutral' };
      };

      const getVolumeSignal = (ratio) => {
        if (ratio > 2) return { signal: 'High Volume', color: 'positive' };
        if (ratio > 1.5) return { signal: 'Above Average', color: 'neutral' };
        if (ratio < 0.5) return { signal: 'Low Volume', color: 'negative' };
        return { signal: 'Normal', color: 'neutral' };
      };

      const getMASignal = (price, ma7, ma30) => {
        if (!ma7 || !ma30) return { signal: 'Insufficient Data', color: 'neutral' };
        if (price > ma7 && ma7 > ma30) return { signal: 'Bullish Trend', color: 'positive' };
        if (price < ma7 && ma7 < ma30) return { signal: 'Bearish Trend', color: 'negative' };
        return { signal: 'Mixed', color: 'neutral' };
      };

      setIndicators({
        currentPrice,
        // Factor gauge data
        fundamentals: {
          score: fundamentalsScore,
          color: fundamentalsColor,
          direction: fundamentalsDirection
        },
        sentiment: {
          score: sentimentScore,
          color: sentimentColor,
          direction: sentimentDirection
        },
        economic: {
          score: economicScore,
          color: economicColor,
          direction: economicDirection
        },
        sector: {
          score: Math.min(100, Math.max(0, sectorScore)),
          color: sectorColor,
          direction: sectorDirection
        },
        supplyDemand: {
          score: supplyDemandScore,
          color: supplyDemandColor,
          direction: supplyDemandDirection
        },
        global: {
          score: globalScore,
          color: globalColor,
          direction: globalDirection
        },
        policy: {
          score: policyScore,
          color: policyColor,
          direction: policyDirection
        },
        news: {
          score: newsScore,
          color: newsColor,
          direction: newsDirection
        },
        technical: {
          score: Math.min(100, Math.max(0, technicalScore)),
          color: technicalColor,
          direction: technicalDirection
        },
        momentum: {
          '7-day': { value: momentum7d, signal: getMomentumSignal(momentum7d) },
          '30-day': { value: momentum30d, signal: getMomentumSignal(momentum30d) }
        },
        volume: {
          ratio: volumeRatio,
          signal: getVolumeSignal(volumeRatio)
        },
        rsi: {
          value: rsi,
          signal: getRSISignal(rsi)
        },
        movingAverages: {
          ma7,
          ma30,
          signal: getMASignal(currentPrice, ma7, ma30)
        },
        volatility: {
          value: volatility,
          signal: volatility > 3 ? { signal: 'High Volatility', color: 'negative' } : 
                  volatility > 1.5 ? { signal: 'Moderate Volatility', color: 'neutral' } :
                  { signal: 'Low Volatility', color: 'positive' }
        },
        sectorTrend: {
          trend: sectorTrend,
          signal: sectorTrend > 0.02 ? { signal: 'Sector Outperforming', color: 'positive' } :
                  sectorTrend < -0.02 ? { signal: 'Sector Underperforming', color: 'negative' } :
                  { signal: 'Sector Neutral', color: 'neutral' }
        }
      });
    } catch (error) {
      console.error('Error calculating indicators:', error);
      setIndicators(null);
    } finally {
      setLoading(false);
    }
    };

    calculateIndicators();
  }, [selectedSymbol, historicalData]);

  // Load historical data when symbol changes
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (!selectedSymbol) {
        setHistoricalData([]);
        setIndicators(null);
        return;
      }
      
      setLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        
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
    <div className="prediction-indicators-container">
      <div className="pi-header">
        <h2>Prediction Indicators</h2>
        <p className="pi-subtitle">
          Analyze key technical and fundamental indicators to assess stock performance and predict price movements
        </p>
      </div>

      <div className="pi-content">
        {/* Factor Indicators - Half Circle Gauges */}
        <div className="pi-section">
          <h3>Factor Indicators</h3>
          <div className="factor-gauges-grid">
            {/* 1. Company Performance (Fundamentals) */}
            <div className="gauge-container">
              <div className="gauge-wrapper">
                <HalfCircleGauge
                  value={indicators?.fundamentals?.score || 50}
                  label="Company Performance"
                  color={indicators?.fundamentals?.color || 'neutral'}
                  arrow={indicators?.fundamentals?.direction || 'neutral'}
                />
              </div>
            </div>

            {/* 2. Market Sentiment (Psychology) */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.sentiment?.score || 50}
                label="Market Sentiment"
                color={indicators?.sentiment?.color || 'neutral'}
                arrow={indicators?.sentiment?.direction || 'neutral'}
              />
            </div>

            {/* 3. Economic Conditions (Macro) */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.economic?.score || 50}
                label="Economic Conditions"
                color={indicators?.economic?.color || 'neutral'}
                arrow={indicators?.economic?.direction || 'neutral'}
              />
            </div>

            {/* 4. Industry & Sector Trends */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.sector?.score || 50}
                label="Industry & Sector"
                color={indicators?.sector?.color || 'neutral'}
                arrow={indicators?.sector?.direction || 'neutral'}
              />
            </div>

            {/* 5. Supply & Demand */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.supplyDemand?.score || 50}
                label="Supply & Demand"
                color={indicators?.supplyDemand?.color || 'neutral'}
                arrow={indicators?.supplyDemand?.direction || 'neutral'}
              />
            </div>

            {/* 6. Global Events */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.global?.score || 50}
                label="Global Events"
                color={indicators?.global?.color || 'neutral'}
                arrow={indicators?.global?.direction || 'neutral'}
              />
            </div>

            {/* 7. Government Policies */}
            <div className="gauge-container" id="policy-gauge-container">
              <HalfCircleGauge
                value={indicators?.policy?.score || 50}
                label="Government Policies"
                color={indicators?.policy?.color || 'neutral'}
                arrow={indicators?.policy?.direction || 'neutral'}
                onClick={(e) => {
                  // Stop all event propagation
                  e.stopPropagation();
                  e.preventDefault();
                  // Mark this click so overlay can ignore it
                  e.target.setAttribute('data-just-opened-modal', 'true');
                  // Use requestAnimationFrame to ensure event completes before opening modal
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                  setShowPolicyModal(true);
                      // Clean up the attribute after modal opens
                      setTimeout(() => {
                        const element = document.getElementById('policy-gauge-container');
                        if (element) {
                          element.removeAttribute('data-just-opened-modal');
                        }
                      }, 100);
                    });
                  });
                }}
              />
            </div>

            {/* 8. Company-Specific News */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.news?.score || 50}
                label="Company News"
                color={indicators?.news?.color || 'neutral'}
                arrow={indicators?.news?.direction || 'neutral'}
              />
            </div>

            {/* 9. Technical Factors */}
            <div className="gauge-container">
              <HalfCircleGauge
                value={indicators?.technical?.score || 50}
                label="Technical Factors"
                color={indicators?.technical?.color || 'neutral'}
                arrow={indicators?.technical?.direction || 'neutral'}
              />
            </div>
          </div>
        </div>

        {/* Indicators Display */}
        {indicators && (
          <>
            {/* Momentum Indicators */}
            <div className="pi-section">
              <h3>Momentum Indicators</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">7-Day Momentum</div>
                  <div className="indicator-value">
                    {(indicators.momentum['7-day'].value * 100).toFixed(2)}%
                  </div>
                  <div className={`indicator-signal ${indicators.momentum['7-day'].signal.color}`}>
                    {indicators.momentum['7-day'].signal.signal}
                  </div>
                </div>
                <div className="indicator-card">
                  <div className="indicator-label">30-Day Momentum</div>
                  <div className="indicator-value">
                    {(indicators.momentum['30-day'].value * 100).toFixed(2)}%
                  </div>
                  <div className={`indicator-signal ${indicators.momentum['30-day'].signal.color}`}>
                    {indicators.momentum['30-day'].signal.signal}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Indicator */}
            <div className="pi-section">
              <h3>Volume Indicator</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">Volume Ratio (vs 30-day avg)</div>
                  <div className="indicator-value">
                    {indicators.volume.ratio.toFixed(2)}x
                  </div>
                  <div className={`indicator-signal ${indicators.volume.signal.color}`}>
                    {indicators.volume.signal.signal}
                  </div>
                </div>
              </div>
            </div>

            {/* RSI Indicator */}
            <div className="pi-section">
              <h3>RSI (Relative Strength Index)</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">RSI (14-day)</div>
                  <div className="indicator-value">
                    {indicators.rsi.value.toFixed(2)}
                  </div>
                  <div className={`indicator-signal ${indicators.rsi.signal.color}`}>
                    {indicators.rsi.signal.signal}
                  </div>
                  <div className="rsi-scale">
                    <div className="rsi-markers">
                      <span>0</span>
                      <span>30</span>
                      <span>50</span>
                      <span>70</span>
                      <span>100</span>
                    </div>
                    <div className="rsi-bar">
                      <div 
                        className="rsi-indicator" 
                        style={{ left: `${indicators.rsi.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Moving Averages */}
            <div className="pi-section">
              <h3>Moving Averages</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">7-Day MA</div>
                  <div className="indicator-value">
                    {indicators.movingAverages.ma7 ? `LKR ${indicators.movingAverages.ma7.toFixed(2)}` : 'N/A'}
                  </div>
                </div>
                <div className="indicator-card">
                  <div className="indicator-label">30-Day MA</div>
                  <div className="indicator-value">
                    {indicators.movingAverages.ma30 ? `LKR ${indicators.movingAverages.ma30.toFixed(2)}` : 'N/A'}
                  </div>
                </div>
                <div className="indicator-card">
                  <div className="indicator-label">Trend Signal</div>
                  <div className={`indicator-signal ${indicators.movingAverages.signal.color}`}>
                    {indicators.movingAverages.signal.signal}
                  </div>
                </div>
              </div>
            </div>

            {/* Volatility */}
            <div className="pi-section">
              <h3>Volatility</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">20-Day Volatility</div>
                  <div className="indicator-value">
                    {indicators.volatility.value.toFixed(2)}%
                  </div>
                  <div className={`indicator-signal ${indicators.volatility.signal.color}`}>
                    {indicators.volatility.signal.signal}
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Trend */}
            <div className="pi-section">
              <h3>Sector Performance</h3>
              <div className="indicators-grid">
                <div className="indicator-card">
                  <div className="indicator-label">Sector Average Return</div>
                  <div className="indicator-value">
                    {(indicators.sectorTrend.trend * 100).toFixed(2)}%
                  </div>
                  <div className={`indicator-signal ${indicators.sectorTrend.signal.color}`}>
                    {indicators.sectorTrend.signal.signal}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Government Policies Modal */}
      {showPolicyModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            // Ignore clicks that originated from the gauge
            const gaugeContainer = document.getElementById('policy-gauge-container');
            if (gaugeContainer && (gaugeContainer.contains(e.target) || gaugeContainer.hasAttribute('data-just-opened-modal'))) {
              return;
            }
            // Only close if clicking directly on the overlay, not on children
            if (e.target === e.currentTarget) {
              setShowPolicyModal(false);
            }
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => {
              // Stop propagation to prevent closing when clicking inside modal
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h2>Government Policies Impact on Stock Prices</h2>
              <button 
                className="modal-close" 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPolicyModal(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="policy-section">
                <div className="policy-item" key="policy-1">
                  <div className="policy-number">1</div>
                  <div className="policy-content">
                    <h3>Investor Confidence</h3>
                    <div className="policy-details">
                      <div className="policy-scenario">
                        <strong>When a country is politically stable:</strong>
                        <ul>
                          <li>Investors feel safe</li>
                          <li>Foreign investors bring capital</li>
                          <li>Long-term investments increase</li>
                          <li>Market volatility reduces</li>
                        </ul>
                      </div>
                      <div className="policy-scenario">
                        <strong>When there's instability:</strong>
                        <ul>
                          <li>Investors panic</li>
                          <li>Foreign funds withdraw money</li>
                          <li>Market drops sharply</li>
                        </ul>
                      </div>
                      <p className="policy-example">
                        <em>For example, during political crises, the Colombo Stock Exchange has historically experienced heavy volatility.</em>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="policy-item" key="policy-2">
                  <div className="policy-number">2</div>
                  <div className="policy-content">
                    <h3>Foreign Investment Flows</h3>
                    <div className="policy-details">
                      <p>Foreign investors care deeply about:</p>
                      <ul>
                        <li>Rule of law</li>
                        <li>Government consistency</li>
                        <li>Policy predictability</li>
                        <li>Currency stability</li>
                      </ul>
                      <p className="policy-impact">
                        <strong>If political uncertainty rises → foreign selling increases → index falls.</strong>
                      </p>
                      <p className="policy-example">
                        <em>This is very common in smaller markets.</em>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="policy-item" key="policy-3">
                  <div className="policy-number">3</div>
                  <div className="policy-content">
                    <h3>Economic Policy Uncertainty</h3>
                    <div className="policy-details">
                      <p>Political instability can lead to:</p>
                      <ul>
                        <li>Sudden tax changes</li>
                        <li>Import/export bans</li>
                        <li>Currency controls</li>
                        <li>Nationalization fears</li>
                      </ul>
                      <p className="policy-impact">
                        <strong>Policies from the Central Bank of Sri Lanka and government ministries strongly influence banking, manufacturing, tourism, and export stocks.</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="policy-item" key="policy-4">
                  <div className="policy-number">4</div>
                  <div className="policy-content">
                    <h3>Currency Impact</h3>
                    <div className="policy-details">
                      <p><strong>Political instability often weakens the currency.</strong></p>
                      <ul>
                        <li><strong>Weaker LKR →</strong> import-heavy companies suffer</li>
                        <li><strong>Export companies</strong> may benefit</li>
                        <li><strong>Foreign debt</strong> becomes riskier</li>
                      </ul>
                      <p className="policy-impact">
                        Currency depreciation also scares foreign investors.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="policy-item" key="policy-5">
                  <div className="policy-number">5</div>
                  <div className="policy-content">
                    <h3>Sector-Specific Impact</h3>
                    <div className="policy-details">
                      <p>Different sectors react differently:</p>
                      <ul>
                        <li><strong>🏦 Banking</strong> → highly sensitive to political and policy shifts</li>
                        <li><strong>🏨 Tourism</strong> → affected by protests or unrest</li>
                        <li><strong>🏗 Construction</strong> → depends on government projects</li>
                        <li><strong>🌾 Export companies</strong> → react to trade policy</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="policy-item" key="policy-6">
                  <div className="policy-number">6</div>
                  <div className="policy-content">
                    <h3>Risk Premium Increases</h3>
                    <div className="policy-details">
                      <p>In unstable countries:</p>
                      <ul>
                        <li>Investors demand higher returns</li>
                        <li>Valuations (P/E ratios) fall</li>
                        <li>Stocks trade at discounts</li>
                        <li>Even profitable companies may see lower prices because the country risk increases</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PredictionIndicators;
