import React, { useState, useEffect, useMemo } from 'react';
import './Styles/BlockAnalysisDashboard.css';
import { equityAPI, tradeSummaryAPI, aiAnalysisAPI } from '../../services/api';

const BlockAnalysisDashboard = () => {
  const [equities, setEquities] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Block Analysis Settings
  const [windowBars, setWindowBars] = useState(100);
  const [groupCount, setGroupCount] = useState(20);
  const [calculationBasis, setCalculationBasis] = useState('closed'); // 'current' or 'closed'
  
  // Analysis Results
  const [blockAnalytics, setBlockAnalytics] = useState([]);
  const [trendChannels, setTrendChannels] = useState([]);
  const [keyLevels, setKeyLevels] = useState({ support: null, resistance: null, poc: null });
  const [qualityScore, setQualityScore] = useState(0);
  const [narrative, setNarrative] = useState('');
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);

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

  // Load historical data
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
        startDate.setMonth(startDate.getMonth() - 6); // 6 months of data
        
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

  // Calculate block size
  const groupSize = useMemo(() => {
    return Math.max(1, Math.round(windowBars / groupCount));
  }, [windowBars, groupCount]);

  // Calculate effective window
  const effectiveWindow = useMemo(() => {
    return groupSize * groupCount;
  }, [groupSize, groupCount]);

  // Calculate base offset (for current vs closed mode)
  const baseOffset = useMemo(() => {
    return calculationBasis === 'current' ? 0 : 1;
  }, [calculationBasis]);

  // Block Analytics Calculation
  useEffect(() => {
    if (historicalData.length < effectiveWindow) {
      setBlockAnalytics([]);
      return;
    }

    const calculateBlockAnalytics = () => {
      const blocks = [];
      const dataLength = historicalData.length;
      const startIndex = Math.max(0, dataLength - effectiveWindow - baseOffset);
      
      for (let gi = 0; gi < groupCount; gi++) {
        const startOff = startIndex + gi * groupSize;
        const endOff = Math.min(startIndex + (gi + 1) * groupSize - 1, dataLength - 1);
        
        if (startOff >= dataLength || endOff < startOff) {
          blocks.push(null);
          continue;
        }

        let high = -Infinity;
        let low = Infinity;
        let open = null;
        let close = null;
        let totalVolume = 0;
        let totalPriceChange = 0;
        let priceChanges = [];
        let volumes = [];

        for (let i = startOff; i <= endOff; i++) {
          const bar = historicalData[i];
          const price = parseFloat(bar.last_trade);
          const vol = parseFloat(bar.trade_volume || 0);
          
          if (isNaN(price)) continue;
          
          if (i === startOff) open = price;
          if (i === endOff) close = price;
          
          high = Math.max(high, price);
          low = Math.min(low, price);
          totalVolume += vol;
          
          if (i > startOff) {
            const prevPrice = parseFloat(historicalData[i - 1].last_trade);
            if (!isNaN(prevPrice)) {
              const change = (price - prevPrice) / prevPrice;
              priceChanges.push(change);
              totalPriceChange += change;
            }
          }
          volumes.push(vol);
        }

        if (open === null || close === null || high === low) {
          blocks.push(null);
          continue;
        }

        const avgVolume = volumes.length > 0 ? totalVolume / volumes.length : 0;
        const avgPriceChange = priceChanges.length > 0 ? totalPriceChange / priceChanges.length : 0;
        const volatility = priceChanges.length > 1 
          ? Math.sqrt(priceChanges.reduce((sum, ch) => sum + Math.pow(ch - avgPriceChange, 2), 0) / priceChanges.length)
          : 0;

        blocks.push({
          blockIndex: gi + 1,
          startIndex: startOff,
          endIndex: endOff,
          open,
          high,
          low,
          close,
          range: high - low,
          bodySize: Math.abs(close - open),
          upperWick: high - Math.max(open, close),
          lowerWick: Math.min(open, close) - low,
          totalVolume,
          avgVolume,
          avgPriceChange,
          volatility,
          isBullish: close > open,
          centerPrice: (high + low) / 2,
          trendType: null, // Will be set by trend detection
          trendLocked: false
        });
      }

      return blocks;
    };

    const blocks = calculateBlockAnalytics();
    setBlockAnalytics(blocks);

    // Detect trends
    const detectTrends = (blocks) => {
      const channels = [];
      let i = 0;
      
      while (i < blocks.length - 1) {
        const newerBlock = blocks[i];
        const olderBlock = blocks[i + 1];
        
        if (!newerBlock || !olderBlock) {
          i++;
          continue;
        }

        const newerMid = newerBlock.centerPrice;
        const olderMid = olderBlock.centerPrice;
        
        let direction = 0; // 0 = range, 1 = up, -1 = down
        if (newerMid > olderMid * 1.01) direction = 1;
        else if (newerMid < olderMid * 0.99) direction = -1;

        if (direction === 0) {
          i++;
          continue;
        }

        // Extend trend as far as possible
        let segStart = i;
        let segEnd = i + 1;
        
        while (segEnd < blocks.length - 1) {
          const blkNewer = blocks[segEnd];
          const blkOlder = blocks[segEnd + 1];
          
          if (!blkNewer || !blkOlder) break;
          
          const newMid = blkNewer.centerPrice;
          const oldMid = blkOlder.centerPrice;
          
          let nextDir = 0;
          if (newMid > oldMid * 1.01) nextDir = 1;
          else if (newMid < oldMid * 0.99) nextDir = -1;
          
          if (nextDir === direction) {
            segEnd++;
          } else {
            break;
          }
        }

        // Calculate channel boundaries
        let highestHigh = -Infinity;
        let lowestLow = Infinity;
        let highestHighIdx = -1;
        let lowestLowIdx = -1;
        
        for (let j = segStart; j <= segEnd; j++) {
          if (blocks[j]) {
            if (blocks[j].high > highestHigh) {
              highestHigh = blocks[j].high;
              highestHighIdx = j;
            }
            if (blocks[j].low < lowestLow) {
              lowestLow = blocks[j].low;
              lowestLowIdx = j;
            }
          }
        }

        if (highestHighIdx >= 0 && lowestLowIdx >= 0) {
          const angle = direction === 1 
            ? Math.atan((highestHigh - blocks[segEnd].high) / (segEnd - segStart + 1)) * (180 / Math.PI)
            : direction === -1
            ? Math.atan((lowestLow - blocks[segEnd].low) / (segEnd - segStart + 1)) * (180 / Math.PI)
            : 0;

          channels.push({
            type: direction === 1 ? 'UPTREND' : direction === -1 ? 'DOWNTREND' : 'RANGE',
            startBlock: segStart + 1,
            endBlock: segEnd + 1,
            upperBound: highestHigh,
            lowerBound: lowestLow,
            angle: Math.abs(angle),
            blocks: blocks.slice(segStart, segEnd + 1)
          });
        }

        i = segEnd + 1;
      }

      return channels;
    };

    const channels = detectTrends(blocks);
    setTrendChannels(channels);

    // Calculate key levels (POC, Support, Resistance)
    const calculateKeyLevels = (blocks) => {
      if (blocks.length === 0) return { support: null, resistance: null, poc: null };

      const validBlocks = blocks.filter(b => b !== null);
      if (validBlocks.length === 0) return { support: null, resistance: null, poc: null };

      // Find highest volume block (POC)
      let maxVolume = -1;
      let pocBlock = null;
      validBlocks.forEach(block => {
        if (block.totalVolume > maxVolume) {
          maxVolume = block.totalVolume;
          pocBlock = block;
        }
      });

      // Support = lowest low in recent blocks
      const recentBlocks = validBlocks.slice(0, Math.min(5, validBlocks.length));
      const support = Math.min(...recentBlocks.map(b => b.low));

      // Resistance = highest high in recent blocks
      const resistance = Math.max(...recentBlocks.map(b => b.high));

      return {
        support,
        resistance,
        poc: pocBlock ? pocBlock.centerPrice : null
      };
    };

    const levels = calculateKeyLevels(blocks);
    setKeyLevels(levels);

    // Calculate Quality Score
    const calculateQualityScore = (channels, blocks) => {
      if (channels.length === 0) return 50;

      const latestChannel = channels[0];
      if (!latestChannel) return 50;

      let score = 50; // Base score

      // Angle strength (0-15 points)
      const angleScore = Math.min(15, (latestChannel.angle / 45) * 15);
      score += angleScore;

      // Volume consistency (0-10 points)
      const channelBlocks = latestChannel.blocks;
      if (channelBlocks.length > 1) {
        const volumes = channelBlocks.map(b => b.totalVolume);
        const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const volVariance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVol, 2), 0) / volumes.length;
        const volConsistency = Math.max(0, 10 - (volVariance / (avgVol * avgVol)) * 10);
        score += volConsistency;
      }

      // Trend consistency (0-10 points)
      const priceChanges = channelBlocks.map(b => b.avgPriceChange);
      const consistentDirection = priceChanges.every((ch, i) => 
        i === 0 || Math.sign(ch) === Math.sign(priceChanges[0])
      );
      score += consistentDirection ? 10 : 5;

      // Block alignment (0-10 points)
      const centers = channelBlocks.map(b => b.centerPrice);
      const isAscending = centers.every((c, i) => i === 0 || c >= centers[i - 1]);
      const isDescending = centers.every((c, i) => i === 0 || c <= centers[i - 1]);
      score += (isAscending || isDescending) ? 10 : 5;

      // Contradiction penalty
      if (latestChannel.type === 'UPTREND' && channelBlocks[0].avgPriceChange < 0) {
        score -= 5;
      }
      if (latestChannel.type === 'DOWNTREND' && channelBlocks[0].avgPriceChange > 0) {
        score -= 5;
      }

      return Math.max(0, Math.min(100, score));
    };

    const quality = calculateQualityScore(channels, blocks);
    setQualityScore(quality);

    // Generate Narrative
    const generateNarrative = (channels, blocks, levels, quality) => {
      if (channels.length === 0 || blocks.length === 0) {
        return 'Insufficient data for analysis.';
      }

      const latestChannel = channels[0];
      const currentBlock = blocks[0];
      const currentPrice = historicalData[historicalData.length - baseOffset]?.last_trade 
        ? parseFloat(historicalData[historicalData.length - baseOffset].last_trade) 
        : null;

      if (!currentBlock || !currentPrice) {
        return 'Unable to generate analysis.';
      }

      let narrative = '';

      // Trend Analysis
      narrative += `The market is currently in a ${latestChannel.type.toLowerCase()} `;
      narrative += `with ${latestChannel.angle.toFixed(1)}° angle, `;
      narrative += `spanning blocks ${latestChannel.startBlock} to ${latestChannel.endBlock}. `;

      // Quality Assessment
      const confidence = quality >= 80 ? 'HIGH' : quality >= 60 ? 'MEDIUM' : 'LOW';
      narrative += `Quality score: ${quality.toFixed(0)}/100 (${confidence} confidence). `;

      // Current Block Analysis
      const bodyRatio = currentBlock.range > 0 ? (currentBlock.bodySize / currentBlock.range) * 100 : 0;
      if (bodyRatio < 20) {
        narrative += `Current block shows a doji-like pattern indicating market indecision. `;
      } else if (bodyRatio > 80) {
        narrative += `Current block shows strong directional movement with minimal wicks. `;
      }

      // Volume Analysis
      if (currentBlock.totalVolume > blocks.slice(1, 4).reduce((sum, b) => sum + (b?.totalVolume || 0), 0) / 3) {
        narrative += `Volume is above recent average, suggesting increased participation. `;
      } else {
        narrative += `Volume is below recent average, indicating reduced market activity. `;
      }

      // Key Levels
      if (levels.poc) {
        const pocDistance = Math.abs(currentPrice - levels.poc) / currentPrice * 100;
        if (pocDistance < 2) {
          narrative += `Price is near the Point of Control (POC) at ${levels.poc.toFixed(2)}, a high-volume zone. `;
        }
      }

      if (levels.resistance && currentPrice >= levels.resistance * 0.98) {
        narrative += `Price is approaching resistance at ${levels.resistance.toFixed(2)}. `;
      }

      if (levels.support && currentPrice <= levels.support * 1.02) {
        narrative += `Price is near support at ${levels.support.toFixed(2)}. `;
      }

      // Final Assessment
      if (quality >= 80) {
        narrative += `Overall, the trend shows strong characteristics with high confidence. `;
      } else if (quality < 50) {
        narrative += `The trend shows mixed signals with lower confidence. Exercise caution. `;
      }

      return narrative;
    };

    const narrativeText = generateNarrative(channels, blocks, levels, quality);
    setNarrative(narrativeText);
    setAiEnhanced(false); // Reset AI enhanced flag when new analysis is generated

  }, [historicalData, windowBars, groupCount, groupSize, effectiveWindow, baseOffset]);

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (historicalData.length === 0) return null;
    return parseFloat(
      historicalData[historicalData.length - baseOffset]?.last_trade || 
      historicalData[historicalData.length - 1].last_trade
    );
  }, [historicalData, baseOffset]);

  // Function to enhance narrative with AI
  const enhanceNarrativeWithAI = async () => {
    if (!narrative || aiEnhancing) return;

    setAiEnhancing(true);
    try {
      const technicalData = {
        trendChannels: trendChannels.slice(0, 3),
        keyLevels,
        qualityScore,
        blockAnalytics: blockAnalytics.slice(0, 10).filter(b => b !== null),
        currentPrice: currentPrice,
        selectedSymbol,
        indicators: {
          currentBlock: blockAnalytics[0] || null,
          recentVolatility: blockAnalytics.slice(0, 5).reduce((sum, b) => sum + (b?.volatility || 0), 0) / 5,
          avgVolume: blockAnalytics.slice(0, 5).reduce((sum, b) => sum + (b?.totalVolume || 0), 0) / 5
        }
      };

      const enhancedNarrative = await aiAnalysisAPI.enhanceMarketNarrative(technicalData, narrative);
      setNarrative(enhancedNarrative);
      setAiEnhanced(true);
    } catch (error) {
      console.error('Error enhancing narrative with AI:', error);
      alert('Failed to enhance narrative with AI. Please try again later.');
    } finally {
      setAiEnhancing(false);
    }
  };

  return (
    <div className="block-analysis-dashboard">
      <div className="bad-header">
        <h2>Block Analysis Dashboard</h2>
        <p className="bad-subtitle">
          Advanced block-based market structure analysis with quality scoring and narrative insights
        </p>
      </div>

      <div className="bad-content">
        {/* Controls */}
        <div className="bad-controls">
          <div className="control-group">
            <label>Select Equity</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              <option value="">-- Select Equity --</option>
              {equities.map((eq) => (
                <option key={eq.symbol} value={eq.symbol}>
                  {eq.symbol} - {eq.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Window Bars</label>
            <input
              type="number"
              value={windowBars}
              onChange={(e) => setWindowBars(parseInt(e.target.value) || 100)}
              min="20"
              max="500"
              step="10"
            />
          </div>

          <div className="control-group">
            <label>Group Count</label>
            <input
              type="number"
              value={groupCount}
              onChange={(e) => setGroupCount(parseInt(e.target.value) || 20)}
              min="5"
              max="50"
              step="1"
            />
          </div>

          <div className="control-group">
            <label>Calculation Basis</label>
            <select
              value={calculationBasis}
              onChange={(e) => setCalculationBasis(e.target.value)}
            >
              <option value="closed">Closed (bar[1]) - Stable</option>
              <option value="current">Current (bar[0]) - Live</option>
            </select>
          </div>

          {currentPrice && (
            <div className="control-group">
              <label>Current Price</label>
              <div className="current-price-display">
                LKR {currentPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="bad-loading">
            <p>Loading data...</p>
          </div>
        )}

        {!loading && selectedSymbol && historicalData.length > 0 && (
          <>
            {/* Quality Score & Confidence */}
            <div className="bad-quality-section">
              <div className="quality-card">
                <div className="quality-label">Quality Score</div>
                <div className="quality-value" style={{
                  color: qualityScore >= 80 ? '#10b981' : qualityScore >= 60 ? '#eab308' : '#ef4444'
                }}>
                  {qualityScore.toFixed(0)}/100
                </div>
                <div className="quality-confidence">
                  {qualityScore >= 80 ? 'HIGH' : qualityScore >= 60 ? 'MEDIUM' : 'LOW'} Confidence
                </div>
              </div>

              <div className="quality-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Angle Strength:</span>
                  <span className="breakdown-value">{(qualityScore * 0.15).toFixed(1)}/15</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Volume Consistency:</span>
                  <span className="breakdown-value">{(qualityScore * 0.10).toFixed(1)}/10</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Trend Alignment:</span>
                  <span className="breakdown-value">{(qualityScore * 0.20).toFixed(1)}/20</span>
                </div>
              </div>
            </div>

            {/* Trend Channels */}
            {trendChannels.length > 0 && (
              <div className="bad-section">
                <h3>Trend Channels</h3>
                <div className="trend-channels-grid">
                  {trendChannels.slice(0, 3).map((channel, idx) => (
                    <div key={idx} className="trend-channel-card">
                      <div className="channel-header">
                        <span className={`channel-type channel-${channel.type.toLowerCase()}`}>
                          {channel.type}
                        </span>
                        <span className="channel-blocks">
                          Blocks {channel.startBlock}-{channel.endBlock}
                        </span>
                      </div>
                      <div className="channel-details">
                        <div className="channel-detail-item">
                          <span>Angle:</span>
                          <span>{channel.angle.toFixed(1)}°</span>
                        </div>
                        <div className="channel-detail-item">
                          <span>Upper:</span>
                          <span>LKR {channel.upperBound.toFixed(2)}</span>
                        </div>
                        <div className="channel-detail-item">
                          <span>Lower:</span>
                          <span>LKR {channel.lowerBound.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Levels */}
            {keyLevels.support && keyLevels.resistance && (
              <div className="bad-section">
                <h3>Key Levels</h3>
                <div className="key-levels-grid">
                  <div className="key-level-card resistance">
                    <div className="level-label">Resistance</div>
                    <div className="level-price">LKR {keyLevels.resistance.toFixed(2)}</div>
                    {currentPrice && (
                      <div className="level-distance">
                        {((keyLevels.resistance - currentPrice) / currentPrice * 100).toFixed(2)}% above
                      </div>
                    )}
                  </div>

                  {keyLevels.poc && (
                    <div className="key-level-card poc">
                      <div className="level-label">Point of Control (POC)</div>
                      <div className="level-price">LKR {keyLevels.poc.toFixed(2)}</div>
                      {currentPrice && (
                        <div className="level-distance">
                          {Math.abs((keyLevels.poc - currentPrice) / currentPrice * 100).toFixed(2)}% away
                        </div>
                      )}
                    </div>
                  )}

                  <div className="key-level-card support">
                    <div className="level-label">Support</div>
                    <div className="level-price">LKR {keyLevels.support.toFixed(2)}</div>
                    {currentPrice && (
                      <div className="level-distance">
                        {((currentPrice - keyLevels.support) / currentPrice * 100).toFixed(2)}% above
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Block Analytics Table */}
            {blockAnalytics.length > 0 && (
              <div className="bad-section">
                <h3>Block Analytics</h3>
                <div className="block-table-wrapper">
                  <table className="block-table">
                    <thead>
                      <tr>
                        <th>Block</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Range</th>
                        <th>Volume</th>
                        <th>Volatility</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockAnalytics.slice(0, 10).map((block, idx) => {
                        if (!block) return null;
                        return (
                          <tr key={idx}>
                            <td>{block.blockIndex}</td>
                            <td>LKR {block.open.toFixed(2)}</td>
                            <td>LKR {block.high.toFixed(2)}</td>
                            <td>LKR {block.low.toFixed(2)}</td>
                            <td className={block.isBullish ? 'bullish' : 'bearish'}>
                              LKR {block.close.toFixed(2)}
                            </td>
                            <td>LKR {block.range.toFixed(2)}</td>
                            <td>{block.totalVolume.toLocaleString()}</td>
                            <td>{(block.volatility * 100).toFixed(2)}%</td>
                            <td>
                              <span className={`trend-indicator ${block.isBullish ? 'up' : 'down'}`}>
                                {block.isBullish ? '↑' : '↓'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Market Narrative */}
            {narrative && (
              <div className="bad-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>Market Narrative</h3>
                  <button
                    onClick={enhanceNarrativeWithAI}
                    disabled={aiEnhancing}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: aiEnhanced ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: aiEnhancing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    title={aiEnhanced ? 'Narrative enhanced with AI' : 'Enhance with AI insights'}
                  >
                    {aiEnhancing ? (
                      <>
                        <span>🤖 Enhancing...</span>
                      </>
                    ) : aiEnhanced ? (
                      <>
                        <span>✨ AI Enhanced</span>
                      </>
                    ) : (
                      <>
                        <span>🤖 Enhance with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="narrative-box">
                  <p>{narrative}</p>
                  {aiEnhanced && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#ecfdf5', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#065f46'
                    }}>
                      ✨ This narrative has been enhanced with AI-powered insights
                    </div>
                  )}
                  <div className="narrative-disclaimer">
                    ⚠️ This analysis is for educational purposes only and does not constitute investment advice.
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && selectedSymbol && historicalData.length === 0 && (
          <div className="bad-empty">
            <p>No historical data available for {selectedSymbol}</p>
          </div>
        )}

        {!loading && !selectedSymbol && (
          <div className="bad-empty">
            <p>Please select an equity to begin analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockAnalysisDashboard;
