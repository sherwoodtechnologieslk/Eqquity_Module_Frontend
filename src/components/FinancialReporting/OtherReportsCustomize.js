import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BorrowingsFacilitiesReport from './BorrowingsFacilitiesReport';
import TBondsReport from './TBondsReport';
import EquityPortfolioReport from './EquityPortfolioReport';
import ShareHoldingsReport from './ShareHoldingsReport';
import GroupFinanceDashboard from './GroupFinanceDashboard';
import DashboardReport from './DashboardReport';
import EquityPortfolioSummaryReport from './EquityPortfolioSummaryReport';
import {
  OTHER_REPORT_TYPES,
  createDefaultTabs,
  loadSavedTabs,
  saveTabs,
  labelForNewTab,
  newTabId
} from './otherReportsRegistry';
import './Styles/BorrowingsFacilitiesReport.css';
import './Styles/OtherReportsCustomize.css';

const REPORT_COMPONENTS = {
  borrowings: BorrowingsFacilitiesReport,
  tbonds: TBondsReport,
  equity: EquityPortfolioReport,
  shareHoldings: ShareHoldingsReport,
  groupDashboard: GroupFinanceDashboard,
  dashboardReport: DashboardReport,
  equitySummary: EquityPortfolioSummaryReport
};

const OtherReportsCustomize = ({ open, onClose }) => {
  const [tabs, setTabs] = useState(() => loadSavedTabs() || createDefaultTabs());
  const [activeTabId, setActiveTabId] = useState(() => (loadSavedTabs() || createDefaultTabs())[0]?.tabId);
  const [addType, setAddType] = useState('borrowings');

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  useEffect(() => {
    if (open) {
      const loaded = loadSavedTabs() || createDefaultTabs();
      setTabs(loaded);
      setActiveTabId(loaded[0]?.tabId);
    }
  }, [open]);

  useEffect(() => {
    if (open && tabs.length) saveTabs(tabs);
  }, [tabs, open]);

  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.tabId === activeTabId)) {
      setActiveTabId(tabs[0].tabId);
    }
  }, [tabs, activeTabId]);

  const addTab = () => {
    const tab = {
      tabId: newTabId(),
      reportType: addType,
      label: labelForNewTab(addType, tabs)
    };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.tabId);
  };

  const removeTab = (tabId) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t.tabId !== tabId);
      if (activeTabId === tabId) setActiveTabId(next[0].tabId);
      return next;
    });
  };

  const renameTab = (tabId, label) => {
    setTabs((prev) => prev.map((t) => (t.tabId === tabId ? { ...t, label } : t)));
  };

  if (!open) return null;

  const activeTab = tabs.find((t) => t.tabId === activeTabId);
  const ActiveReport = activeTab ? REPORT_COMPONENTS[activeTab.reportType] : null;

  return createPortal(
    <div className="orc-modal-root" role="dialog" aria-modal="true" aria-labelledby="orc-title">
      <div className="orc-shell" onClick={(e) => e.stopPropagation()}>
        <header className="orc-header">
          <div>
            <h2 id="orc-title">Customize reports</h2>
            <p>Add or remove report tabs. Your tab layout is saved in this browser.</p>
          </div>
          <button type="button" className="orc-header-close" onClick={onClose} aria-label="Close customize view">
            ×
          </button>
        </header>

        <div className="orc-tabs-bar" role="tablist" aria-label="Report tabs">
          {tabs.map((tab) => (
            <button
              key={tab.tabId}
              type="button"
              role="tab"
              aria-selected={tab.tabId === activeTabId}
              className={`orc-tab${tab.tabId === activeTabId ? ' orc-tab--active' : ''}`}
              onClick={() => setActiveTabId(tab.tabId)}
            >
              <span
                className="orc-tab-label"
                title={tab.label}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const next = window.prompt('Tab name', tab.label);
                  if (next != null && String(next).trim()) renameTab(tab.tabId, String(next).trim());
                }}
              >
                {tab.label}
              </span>
              <span
                role="button"
                tabIndex={0}
                className="orc-tab-remove"
                aria-label={`Remove ${tab.label}`}
                disabled={tabs.length <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.tabId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTab(tab.tabId);
                  }
                }}
              >
                ×
              </span>
            </button>
          ))}
          <div className="orc-add-wrap">
            <select
              className="orc-add-select"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              aria-label="Report type to add"
            >
              {Object.entries(OTHER_REPORT_TYPES).map(([type, meta]) => (
                <option key={type} value={type}>
                  {meta.defaultLabel}
                </option>
              ))}
            </select>
            <button type="button" className="orc-add-btn" onClick={addTab}>
              + Add report
            </button>
          </div>
        </div>

        <div className="orc-body" role="tabpanel">
          {activeTab && ActiveReport ? (
            <div key={activeTab.tabId} className="orc-tab-panel">
              <ActiveReport embedded open onClose={() => {}} />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OtherReportsCustomize;
