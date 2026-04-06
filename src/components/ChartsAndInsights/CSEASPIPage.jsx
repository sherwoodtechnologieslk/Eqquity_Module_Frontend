import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import './Styles/ChartsAndInsights.css';

function CSEASPIPage() {
  return (
    <div className="charts-insights-page">
      <nav className="charts-insights-local-nav" aria-label="CSE ASPI chart">
        <span className="charts-insights-local-nav__title">CSE ASPI</span>
      </nav>
      <div className="charts-insights-widget-wrap charts-insights-widget-wrap--tradingview">
        <TradingViewWidget />
      </div>
    </div>
  );
}

export default CSEASPIPage;
