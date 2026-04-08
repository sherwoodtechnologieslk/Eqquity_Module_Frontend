import React from 'react';
import TradingViewSectorIndicesWidget from './TradingViewSectorIndicesWidget';
import './Styles/ChartsAndInsights.css';

function CSESectorIndicesPage() {
  return (
    <div className="charts-insights-page">
      <nav className="charts-insights-local-nav" aria-label="CSE sector indices charts">
        <span className="charts-insights-local-nav__title">CSE Sector Indices</span>
      </nav>
      <div className="charts-insights-widget-wrap charts-insights-widget-wrap--tradingview charts-insights-widget-wrap--sector-indices">
        <TradingViewSectorIndicesWidget />
      </div>
    </div>
  );
}

export default CSESectorIndicesPage;
