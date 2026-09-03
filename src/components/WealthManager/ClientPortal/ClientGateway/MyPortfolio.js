import React, { useMemo, useState } from 'react';
import './Styles/MyPortfolio.css';

const portfolioData = {
  totalValue: 2450000,
  totalCost: 2200000,
  unrealizedGain: 250000,
  realizedGain: 0,
  ytdReturn: 12.5,
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
      category: 'Equity',
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
      category: 'Balanced',
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
      category: 'Fixed Income',
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
      category: 'Equity',
    },
    {
      fund: 'Money Market Fund',
      units: 100000,
      nav: 1.0,
      currentValue: 100000,
      costBasis: 100000,
      gain: 0,
      gainPercent: 0,
      allocation: 4.1,
      return: 4.2,
      category: 'Money Market',
  },
];

const MyPortfolio = () => {
  const [selectedFund, setSelectedFund] = useState(null);

  const categoryMix = useMemo(() => {
    const totals = {};
    holdings.forEach((h) => {
      totals[h.category] = (totals[h.category] || 0) + h.allocation;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const formatMoney = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="cp-portfolio cp-portfolio-page">
      <header className="cp-portfolio-header cp-pf-header">
        <div className="cp-pf-header-main">
          <h1>My Portfolio</h1>
          <p>Detailed view of your investment portfolio</p>
        </div>
        <div className="cp-pf-header-aside">
          <span className="cp-pf-asof-label">As of</span>
          <span className="cp-pf-asof-value">Today</span>
        </div>
      </header>

      <section className="cp-pf-metrics" aria-label="Portfolio summary">
        <div className="cp-pf-metric">
          <span className="cp-pf-metric-label">Total portfolio value</span>
          <span className="cp-pf-metric-value">{formatMoney(portfolioData.totalValue)}</span>
          <span className="cp-pf-metric-unit">LKR</span>
        </div>
        <div className="cp-pf-metric">
          <span className="cp-pf-metric-label">Total cost basis</span>
          <span className="cp-pf-metric-value">{formatMoney(portfolioData.totalCost)}</span>
          <span className="cp-pf-metric-unit">LKR</span>
        </div>
        <div className="cp-pf-metric">
          <span className="cp-pf-metric-label">Unrealized gain / loss</span>
          <span
            className={`cp-pf-metric-value ${
              portfolioData.unrealizedGain >= 0 ? 'cp-pf-positive' : 'cp-pf-negative'
            }`}
          >
            {portfolioData.unrealizedGain >= 0 ? '+' : ''}
            {formatMoney(portfolioData.unrealizedGain)}
          </span>
          <span className="cp-pf-metric-unit">LKR</span>
        </div>
        <div className="cp-pf-metric">
          <span className="cp-pf-metric-label">YTD return</span>
          <span className="cp-pf-metric-value cp-pf-positive">{portfolioData.ytdReturn}%</span>
        </div>
      </section>

      <div className="cp-pf-layout">
        <section className="cp-pf-panel cp-pf-holdings">
          <div className="cp-pf-panel-head">
            <h2>Holdings details</h2>
            <span className="cp-pf-panel-meta">{holdings.length} funds</span>
          </div>
          <div className="cp-pf-table-wrap">
            <table className="cp-pf-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Category</th>
                  <th className="cp-pf-num">Units</th>
                  <th className="cp-pf-num">NAV</th>
                  <th className="cp-pf-num">Current value</th>
                  <th className="cp-pf-num">Cost basis</th>
                  <th className="cp-pf-num">Gain / loss</th>
                  <th className="cp-pf-num">Return</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <tr
                    key={holding.fund}
                    className={selectedFund === index ? 'cp-pf-row-selected' : ''}
                    onClick={() => setSelectedFund(selectedFund === index ? null : index)}
                  >
                    <td className="cp-pf-fund">{holding.fund}</td>
                    <td className="cp-pf-category">{holding.category}</td>
                    <td className="cp-pf-num">{holding.units.toLocaleString()}</td>
                    <td className="cp-pf-num">{holding.nav.toFixed(2)}</td>
                    <td className="cp-pf-num">{formatMoney(holding.currentValue)}</td>
                    <td className="cp-pf-num">{formatMoney(holding.costBasis)}</td>
                    <td
                      className={`cp-pf-num ${
                        holding.gain >= 0 ? 'cp-pf-positive' : 'cp-pf-negative'
                      }`}
                    >
                      {holding.gain >= 0 ? '+' : ''}
                      {formatMoney(holding.gain)} ({holding.gainPercent >= 0 ? '+' : ''}
                      {holding.gainPercent}%)
                    </td>
                    <td
                      className={`cp-pf-num ${
                        holding.return >= 0 ? 'cp-pf-positive' : 'cp-pf-negative'
                      }`}
                    >
                      {holding.return >= 0 ? '+' : ''}
                      {holding.return}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="cp-pf-side">
          <section className="cp-pf-panel cp-pf-allocation">
            <div className="cp-pf-panel-head">
              <h2>Asset allocation</h2>
            </div>
            <p className="cp-pf-panel-intro">Current portfolio mix by fund.</p>
            <div className="cp-pf-bars">
              {holdings.map((holding) => (
                <div key={holding.fund} className="cp-pf-bar-row">
                  <div className="cp-pf-bar-head">
                    <span className="cp-pf-bar-label">{holding.fund}</span>
                    <span className="cp-pf-bar-pct">{holding.allocation}%</span>
                  </div>
                  <div className="cp-pf-bar-track">
                    <div
                      className="cp-pf-bar-fill"
                      style={{ width: `${Math.min(holding.allocation, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="cp-pf-panel cp-pf-category-mix">
            <div className="cp-pf-panel-head">
              <h2>By category</h2>
            </div>
            <div className="cp-pf-category-list">
              {categoryMix.map((item) => (
                <div key={item.name} className="cp-pf-category-row">
                  <span className="cp-pf-category-name">{item.name}</span>
                  <span className="cp-pf-category-pct">{item.value}%</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MyPortfolio;
