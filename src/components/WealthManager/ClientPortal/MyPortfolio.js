import React, { useState } from 'react';
import './Styles/MyPortfolio.css';

const MyPortfolio = () => {
  const [selectedFund, setSelectedFund] = useState(null);

  const portfolioData = {
    totalValue: 2450000,
    totalCost: 2200000,
    unrealizedGain: 250000,
    realizedGain: 0,
    ytdReturn: 12.5
  };

  const holdings = [
    { 
      fund: 'Equity Growth Fund', 
      units: 50000, 
      nav: 25.45, 
      currentValue: 1272500,
      costBasis: 1150000,
      gain: 122500,
      gainPercent: 10.65,
      allocation: 51.9,
      return: 12.5,
      category: 'Equity'
    },
    { 
      fund: 'Balanced Income Fund', 
      units: 30000, 
      nav: 18.92, 
      currentValue: 567600,
      costBasis: 540000,
      gain: 27600,
      gainPercent: 5.11,
      allocation: 23.2,
      return: 10.8,
      category: 'Balanced'
    },
    { 
      fund: 'Fixed Income Fund', 
      units: 25000, 
      nav: 10.25, 
      currentValue: 256250,
      costBasis: 250000,
      gain: 6250,
      gainPercent: 2.5,
      allocation: 10.5,
      return: 6.5,
      category: 'Fixed Income'
    },
    { 
      fund: 'Index Fund', 
      units: 15000, 
      nav: 32.15, 
      currentValue: 482250,
      costBasis: 450000,
      gain: 32250,
      gainPercent: 7.17,
      allocation: 19.7,
      return: 14.2,
      category: 'Equity'
    },
    { 
      fund: 'Money Market Fund', 
      units: 100000, 
      nav: 1.00, 
      currentValue: 100000,
      costBasis: 100000,
      gain: 0,
      gainPercent: 0,
      allocation: 4.1,
      return: 4.2,
      category: 'Money Market'
    }
  ];

  const allocationData = holdings.map(h => ({
    name: h.fund,
    value: h.allocation
  }));

  const renderAllocationChart = () => {
    const total = allocationData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="cp-allocation-chart">
        <svg viewBox="0 0 200 200" className="cp-pie-chart">
          {allocationData.map((item, index) => {
            const angle = (item.value / total) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            const x1 = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = 100 + 80 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
            const y2 = 100 + 80 * Math.sin(((currentAngle + angle) * Math.PI) / 180);

            const colors = ['#0f766e', '#14b8a6', '#0891b2', '#06b6d4', '#0e7490'];
            const color = colors[index % colors.length];

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            currentAngle += angle;

            return (
              <path
                key={index}
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="cp-chart-legend">
          {allocationData.map((item, index) => {
            const colors = ['#0f766e', '#14b8a6', '#0891b2', '#06b6d4', '#0e7490'];
            return (
              <div key={index} className="cp-legend-item">
                <div 
                  className="cp-legend-color" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="cp-legend-name">{item.name}</span>
                <span className="cp-legend-value">{item.value}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="cp-portfolio">
      <div className="cp-portfolio-header">
        <h1>My Portfolio</h1>
        <p>Detailed view of your investment portfolio</p>
      </div>

      {/* Portfolio Summary */}
      <div className="cp-portfolio-summary">
        <div className="cp-summary-card">
          <div className="cp-summary-label">Total Portfolio Value</div>
          <div className="cp-summary-value">{portfolioData.totalValue.toLocaleString()}</div>
        </div>
        <div className="cp-summary-card">
          <div className="cp-summary-label">Total Cost Basis</div>
          <div className="cp-summary-value">{portfolioData.totalCost.toLocaleString()}</div>
        </div>
        <div className="cp-summary-card">
          <div className="cp-summary-label">Unrealized Gain/Loss</div>
          <div className={`cp-summary-value ${portfolioData.unrealizedGain >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.unrealizedGain >= 0 ? '+' : ''}{portfolioData.unrealizedGain.toLocaleString()}
          </div>
        </div>
        <div className="cp-summary-card">
          <div className="cp-summary-label">YTD Return</div>
          <div className="cp-summary-value positive">{portfolioData.ytdReturn}%</div>
        </div>
      </div>

      <div className="cp-portfolio-grid">
        {/* Holdings Table */}
        <div className="cp-holdings-detail">
          <div className="cp-section-header">
            <h3>Holdings Details</h3>
          </div>
          <div className="cp-holdings-table">
            <table>
              <thead>
                <tr>
                  <th>Fund Name</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>NAV</th>
                  <th>Current Value</th>
                  <th>Cost Basis</th>
                  <th>Gain/Loss</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <tr 
                    key={index}
                    className={selectedFund === index ? 'selected' : ''}
                    onClick={() => setSelectedFund(selectedFund === index ? null : index)}
                  >
                    <td className="cp-fund-name">{holding.fund}</td>
                    <td><span className="cp-category-badge">{holding.category}</span></td>
                    <td>{holding.units.toLocaleString()}</td>
                    <td>{holding.nav.toFixed(2)}</td>
                    <td>{holding.currentValue.toLocaleString()}</td>
                    <td>{holding.costBasis.toLocaleString()}</td>
                    <td className={holding.gain >= 0 ? 'positive' : 'negative'}>
                      {holding.gain >= 0 ? '+' : ''}{holding.gain.toLocaleString()} ({holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent}%)
                    </td>
                    <td className={`cp-return ${holding.return >= 0 ? 'positive' : 'negative'}`}>
                      {holding.return >= 0 ? '+' : ''}{holding.return}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="cp-allocation-section">
          <div className="cp-section-header">
            <h3>Asset Allocation</h3>
          </div>
          {renderAllocationChart()}
        </div>
      </div>
    </div>
  );
};

export default MyPortfolio;
