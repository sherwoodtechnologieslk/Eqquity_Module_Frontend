import React, { useState, useMemo } from 'react';
import './Styles/RiskManagementChart.css';

const RiskManagementChart = () => {
  // Input parameters
  const [startEquity, setStartEquity] = useState(1000);
  const [winProbability, setWinProbability] = useState(55);
  const [riskRewardRatio, setRiskRewardRatio] = useState(1.5);
  const [numberOfTrades, setNumberOfTrades] = useState(40);
  const [numberOfVariants, setNumberOfVariants] = useState(40);
  const [riskPerTrade, setRiskPerTrade] = useState(1.0);
  const [color1, setColor1] = useState('#3333ff');
  const [color2, setColor2] = useState('#ff0000');
  const [color3, setColor3] = useState('#3333ff');

  // Monte Carlo simulation
  const simulationResults = useMemo(() => {
    const matrix = [];
    
    for (let i = 0; i < numberOfVariants; i++) {
      const variant = [];
      let equity = startEquity;
      
      for (let j = 0; j < numberOfTrades; j++) {
        const random = Math.round(Math.random() * 100);
        if (random > winProbability) {
          // Loss
          equity = equity * (1 - riskPerTrade / 100);
        } else {
          // Win
          equity = equity * (1 + riskPerTrade * riskRewardRatio / 100);
        }
        variant.push(equity);
      }
      matrix.push(variant);
    }
    
    return matrix;
  }, [startEquity, winProbability, riskRewardRatio, numberOfTrades, numberOfVariants, riskPerTrade]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (simulationResults.length === 0) return null;
    
    const finalEquities = simulationResults.map(variant => variant[variant.length - 1]);
    const allEquities = simulationResults.flat();
    
    const maxEquity = Math.max(...allEquities);
    const minEquity = Math.min(...allEquities);
    const maxFinal = Math.max(...finalEquities);
    const minFinal = Math.min(...finalEquities);
    const avgFinal = finalEquities.reduce((a, b) => a + b, 0) / finalEquities.length;
    
    return {
      maxProfit: maxFinal - startEquity,
      avgProfit: avgFinal - startEquity,
      maxDrawdown: startEquity - minEquity,
      maxEquity,
      minEquity,
      avgFinal
    };
  }, [simulationResults, startEquity]);

  // Chart dimensions and scaling
  const chartConfig = useMemo(() => {
    if (!statistics || simulationResults.length === 0) return null;
    
    const padding = 60;
    const chartWidth = 900;
    const chartHeight = 500;
    const usableWidth = chartWidth - (padding * 2);
    const usableHeight = chartHeight - (padding * 2);
    
    const min = statistics.minEquity * 0.98;
    const max = statistics.maxEquity * 1.02;
    const range = max - min;
    
    const xScale = (index) => padding + (index / (numberOfTrades - 1)) * usableWidth;
    const yScale = (value) => padding + usableHeight - ((value - min) / range) * usableHeight;
    
    return {
      width: chartWidth,
      height: chartHeight,
      padding,
      min,
      max,
      range,
      xScale,
      yScale,
      usableWidth,
      usableHeight
    };
  }, [statistics, simulationResults, numberOfTrades]);

  // Color gradient helper
  const getColorForValue = (value, min, max) => {
    if (max === min) return color1;
    const ratio = (value - min) / (max - min);
    const r1 = parseInt(color2.slice(1, 3), 16);
    const g1 = parseInt(color2.slice(3, 5), 16);
    const b1 = parseInt(color2.slice(5, 7), 16);
    const r2 = parseInt(color1.slice(1, 3), 16);
    const g2 = parseInt(color1.slice(3, 5), 16);
    const b2 = parseInt(color1.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!chartConfig) return { horizontal: [], vertical: [] };
    
    const horizontal = [];
    const vertical = [];
    const gridStep = (chartConfig.max - chartConfig.min) / 10;
    const coef = numberOfTrades > 150 ? 10 : numberOfTrades > 50 ? 5 : 2;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const value = chartConfig.min + (gridStep * i);
      horizontal.push({
        y: chartConfig.yScale(value),
        value: value.toFixed(2)
      });
    }
    
    // Vertical grid lines
    for (let k = 0; k < numberOfTrades; k += coef) {
      vertical.push({
        x: chartConfig.xScale(k),
        trade: k + coef
      });
    }
    
    return { horizontal, vertical };
  }, [chartConfig, numberOfTrades]);

  // Calculate average line points
  const averageLinePoints = useMemo(() => {
    if (!chartConfig || simulationResults.length === 0) return '';
    
    const points = [];
    for (let k = 0; k < numberOfTrades; k++) {
      const avg = simulationResults.reduce((sum, variant) => sum + variant[k], 0) / simulationResults.length;
      const x = chartConfig.xScale(k);
      const y = chartConfig.yScale(avg);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, [chartConfig, simulationResults, numberOfTrades]);

  return (
    <div className="risk-management-chart-container">
      <div className="rmc-header">
        <h2>Risk Management Chart</h2>
        <p className="rmc-subtitle">Monte Carlo simulation for trading risk analysis</p>
      </div>

      <div className="rmc-content">
        {/* Input Controls */}
        <div className="rmc-controls">
          <div className="control-group">
            <label>Start Equity ($)</label>
            <input
              type="number"
              value={startEquity}
              onChange={(e) => setStartEquity(parseFloat(e.target.value) || 1000)}
              min="100"
              step="100"
            />
          </div>

          <div className="control-group">
            <label>Win Probability (%)</label>
            <input
              type="number"
              value={winProbability}
              onChange={(e) => setWinProbability(parseInt(e.target.value) || 55)}
              min="0"
              max="100"
              step="1"
            />
          </div>

          <div className="control-group">
            <label>Risk/Reward Ratio</label>
            <input
              type="number"
              value={riskRewardRatio}
              onChange={(e) => setRiskRewardRatio(parseFloat(e.target.value) || 1.5)}
              min="0.5"
              step="0.5"
            />
          </div>

          <div className="control-group">
            <label>Number of Trades</label>
            <input
              type="number"
              value={numberOfTrades}
              onChange={(e) => setNumberOfTrades(parseInt(e.target.value) || 40)}
              min="10"
              max="200"
              step="5"
            />
          </div>

          <div className="control-group">
            <label>Number of Variants (Lines)</label>
            <input
              type="number"
              value={numberOfVariants}
              onChange={(e) => setNumberOfVariants(parseInt(e.target.value) || 40)}
              min="2"
              max="100"
              step="5"
            />
          </div>

          <div className="control-group">
            <label>Risk per Trade (%)</label>
            <input
              type="number"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 1.0)}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        {/* Statistics Table */}
        {statistics && (
          <div className="rmc-statistics">
            <table>
              <tbody>
                <tr>
                  <td className="stat-label">Max Profit</td>
                  <td className="stat-value profit">
                    {((statistics.maxProfit / startEquity) * 100).toFixed(2)}% 
                    ({statistics.maxProfit.toFixed(2)} $)
                  </td>
                </tr>
                <tr>
                  <td className="stat-label">Avg Profit</td>
                  <td className="stat-value neutral">
                    {((statistics.avgProfit / startEquity) * 100).toFixed(2)}% 
                    ({statistics.avgProfit.toFixed(2)} $)
                  </td>
                </tr>
                <tr>
                  <td className="stat-label">Max Drawdown</td>
                  <td className="stat-value loss">
                    {((statistics.maxDrawdown / startEquity) * 100).toFixed(2)}% 
                    ({statistics.maxDrawdown.toFixed(2)} $)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Chart */}
        {chartConfig && simulationResults.length > 0 && (
          <div className="rmc-chart-wrapper">
            <svg
              width={chartConfig.width}
              height={chartConfig.height}
              className="rmc-chart"
            >
              {/* Grid Lines */}
              {gridLines.horizontal.map((line, idx) => (
                <g key={`h-grid-${idx}`}>
                  <line
                    x1={chartConfig.padding}
                    y1={line.y}
                    x2={chartConfig.width - chartConfig.padding}
                    y2={line.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={chartConfig.padding - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {line.value}
                  </text>
                </g>
              ))}

              {gridLines.vertical.map((line, idx) => (
                <g key={`v-grid-${idx}`}>
                  <line
                    x1={line.x}
                    y1={chartConfig.padding}
                    x2={line.x}
                    y2={chartConfig.height - chartConfig.padding}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={line.x}
                    y={chartConfig.height - chartConfig.padding + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {line.trade}
                  </text>
                </g>
              ))}

              {/* Variant Lines */}
              {simulationResults.map((variant, i) => {
                const finalValue = variant[variant.length - 1];
                const finalValues = simulationResults.map(v => v[v.length - 1]);
                const minFinal = Math.min(...finalValues);
                const maxFinal = Math.max(...finalValues);
                const lineColor = getColorForValue(finalValue, minFinal, maxFinal);
                
                // Create blurred effect with multiple overlapping lines
                const points = variant.map((value, j) => {
                  const x = chartConfig.xScale(j);
                  const y = chartConfig.yScale(value);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g key={`variant-${i}`}>
                    {[0, 1, 2].map((layer) => (
                      <polyline
                        key={`layer-${layer}`}
                        points={points}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={1 + layer}
                        opacity={1 - layer * 0.33}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Average Line */}
              {averageLinePoints && (
                <polyline
                  points={averageLinePoints}
                  fill="none"
                  stroke={color3}
                  strokeWidth="3"
                  opacity="0.8"
                />
              )}

              {/* Bounding Box */}
              <rect
                x={chartConfig.padding - 1}
                y={chartConfig.padding - 1}
                width={chartConfig.usableWidth + 2}
                height={chartConfig.usableHeight + 2}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskManagementChart;
