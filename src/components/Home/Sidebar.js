
// Sidebar.js

import React, { useState, useEffect } from 'react';
import './Styles/Sidebar.css';

const menuItems = [
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
      </svg>
    ),
    name: "Dashboard",
    subTopics: [
      "Dashboard",
      "Portfolio Overview",
      "Market Summary",
      "Recent Activity",
      "Performance Metrics"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Master Data Management",
    subTopics: [
      "Equity Master",
      "Account Master",
      "Valuation Method",
      "Portfolio Master",
      "Strategy Master"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Holiday Calendar",
    subTopics: [
      "Holiday Calendar",
      "Holiday List",
      "Add Holiday",
      "Holiday Settings"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
        <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
      </svg>
    ),
    name: "Accounting Entries",
    subTopics: [
      "Journal Entries",
      "General Ledger",
      "Trial Balance",
      "P&L",
      "Portfolio MTM"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
        <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
      </svg>
    ),
    name: "GSec Entries",
    subTopics: [
      "Balance Sheet",
      "GSec General Ledger",
      "GSec Chart of Accounts"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9.414a1 1 0 00-.293-.707l-4.414-4.414A1 1 0 0011.586 4H4z"/>
      </svg>
    ),
    name: "Financial Reporting",
    subTopics: [
      "Statement of Financial Position",
      "Statement of Comprehensive Income",
      "Cash Flow",
      "Financial Reports Export"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z"/>
        <path fillRule="evenodd" d="M6 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V4zm2 0h8v10H8V4z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Settlement and Accounting",
    subTopics: [
      "Settlement Instructions",
      "Cash Flow Mapping",
      "GL Mapping"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2v8h8V6H6z" clipRule="evenodd"/>
        <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 1a1 1 0 100 2h2a1 1 0 100-2H9z"/>
      </svg>
    ),
    name: "Account Management",
    subTopics: [
      "Chart Of Accounts",
      "New GL Account",
      "Account Reconciliation",
      "Other Transactions"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Opening Balance Management",
    subTopics: [
      "Opening Balance Entry",
      "Opening Balance List",
      "Account Balance Setup",
      "Double Entries"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V5a2 2 0 114 0v1H8zm2 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Trade Capture",
    subTopics: [
      "Buy",
      "Sell",
      "Transactions",
      "Portfolio",
      "Deal Slip",
      "Cost of Funds",
      "Equity GL Mapping"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
      </svg>
    ),
    name: "Batch Transaction Import",
    subTopics: [
      "Bulk Buy Entry",
      "Bulk Sell Entry",
      "Import History",
      "Trade Confirmation",
      "Trade Report"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
      </svg>
    ),
    name: "Valuation and MTM",
    subTopics: [
      "Market Price Feed",
      "Mark-to-Market Valuation",
      "Realized Gain/Loss Tracking",
      "Trade Summary Data"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
      </svg>
    ),
    name: "CSE Announcements",
    subTopics: [
      "Market Announcements",
      "Corporate Notices",
      "Trading Updates",
      "Regulatory Updates",
      "News & Events"
    ]
  },
  {
     icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
      </svg>
    ),
    name: "Corporate Actions",
    subTopics: [
      "Dividend",

      "Stock Split",
      "Reverse Stock Split",
      
    ]
  },
  {
     icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
      </svg>
    ),
    name: "Security Identity",
    subTopics: [
      
      "Merger or Acquisition",
      "Spin-off / Demerger",
      "Change in Name / Ticker / ISIN",
      "Delisting"
    ]
  },
  {
   icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Voluntary Corporate Actions",
    subTopics: [
      "Rights Issue",
      "Buyback / Share Repurchase",
      "Tender Offer",
      "Election for Dividend Options",
      
    ]
  },
  {
   icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Mandatory Corporate Actions",
    subTopics: [
      
      "Dividends",
      "Splits & Bonus",
      "Rights Issues"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
<path
  fillRule="evenodd"
  d="M3 3a1 1 0 011-1h2a1 1 0 110 2H5v13h14v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm14.707 4.707a1 1 0 00-1.414-1.414L13 9.586l-2.293-2.293a1 1 0 00-1.414 0L6 10.586V9a1 1 0 10-2 0v4a1 1 0 001 1h4a1 1 0 100-2H7.414l3.293-3.293 2.293 2.293a1 1 0 001.414 0l3.293-3.293z"
  clipRule="evenodd"
/>      </svg>
    ),
    name: "IPO",
    subTopics: [
      "IPO Entry",
      "IPO Allocation",
      "Refund Processing",
      "Allocation Summary"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Portfolio Monitoring",
    subTopics: [
      "Holdings Dashboard",
      "Performance Metrics",
      "Sector/Exposure Analysis"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Risk and Limit Management",
    subTopics: [
      "Counterparty Limits",
      "Position Limits",
      "Concentration Limits"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Reporting and Compliance",
    subTopics: [
      "Daily Holdings Report",
      "P&L Statement",
      "Trade Blotter",
      "Audit Trail"
    ]
  },
  {
    icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
      </svg>
    ),
    name: "Integration and Automation",
    subTopics: [
      "Broker Feed / FIX Integration",
      "Custodian Integration",
      "Accounting System Interface"
    ]
  },
  {
   icon: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
      </svg>
    ),
    name: "Portfolio Transfers",
    
  }
  
];

const Sidebar = ({ onSelect, activeIndex = 0, onLogout }) => {
  const [active, setActive] = useState(activeIndex);

  // Sync internal state with prop changes
  useEffect(() => {
    setActive(activeIndex);
  }, [activeIndex]);

  // When a sidebar item is clicked, provide both its index and its subTopics to parent
  const handleClick = (i) => {
    setActive(i);
    if (onSelect) onSelect(i, menuItems[i].subTopics); // Pass index and subTopics
  };

  return (
    <aside className="sidebar">
      {/* Brand/logo section */}
      <div className="sidebar-brand">
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg className="brand-logo" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="brand-text-container">
           
            <span className="app-name">Equity Manager</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-content">
        <div className="menu-section">
          <h3 className="menu-title">Navigation</h3>
          <ul className="sidebar-menu">
            {menuItems.map((item, i) => (
              <li
                key={item.name}
                className={`sidebar-item${active === i ? ' active' : ''}`}
                onClick={() => handleClick(i)}
                tabIndex={0}
                role="button"
                aria-pressed={active === i}
                // title={item.name} // Remove this line to disable native tooltip
              >
                <span className="item-icon" style={{fontSize:"1.2rem"}}>{item.icon}</span>
                <span className="item-text">{item.name}</span>
                <div className="item-indicator"></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-content">
          {onLogout && (
            <button 
              className="sidebar-logout-button" 
              onClick={onLogout}
              title="Logout"
            >
              <svg className="logout-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/>
                <circle cx="12" cy="15" r="2"/>
              </svg>
              <span className="logout-text">Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
