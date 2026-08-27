import React from 'react';
import './Styles/IPOEntry.css';

const IPOPlaceholder = ({ title, subtitle, message }) => (
  <div className="ipo-page-container">
    <div className="ipo-content-wrapper">
      <div className="ipo-header-section">
        <div className="ipo-header-text-group">
          <p className="ipo-eyebrow">IPO</p>
          <h1 className="ipo-main-title">{title}</h1>
          <p className="ipo-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="ipo-placeholder-card">
        <p>{message || 'This module is coming soon.'}</p>
      </div>
    </div>
  </div>
);

export default IPOPlaceholder;
