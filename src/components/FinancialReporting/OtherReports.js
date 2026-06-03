import React, { useState } from 'react';
import './Styles/FinancialReportsExport.css';
import BorrowingsFacilitiesReport from './BorrowingsFacilitiesReport';
import TBondsReport from './TBondsReport';
import EquityPortfolioReport from './EquityPortfolioReport';
import ShareHoldingsReport from './ShareHoldingsReport';
import GroupFinanceDashboard from './GroupFinanceDashboard';
import DashboardReport from './DashboardReport';
import EquityPortfolioSummaryReport from './EquityPortfolioSummaryReport';
import OtherReportsCustomize from './OtherReportsCustomize';

const OtherReports = () => {
  const [borrowingsOpen, setBorrowingsOpen] = useState(false);
  const [tBondsOpen, setTBondsOpen] = useState(false);
  const [equityOpen, setEquityOpen] = useState(false);
  const [shareHoldingsOpen, setShareHoldingsOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardReportOpen, setDashboardReportOpen] = useState(false);
  const [equitySummaryOpen, setEquitySummaryOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  return (
    <div className="fre-wrap">
      <div className="fre-header">
        <div>
          <h2>Other Reports</h2>
          <p>
            Open individual reports, view the group finance dashboard (AMC / AMH / CCH), or use Customize for
            tabbed layouts.
          </p>
        </div>
      </div>

      <div className="other-reports-content">
        <p className="other-reports-content-label">Reports</p>
        <div className="other-reports-btn-group">
          <button type="button" className="or-btn" onClick={() => setBorrowingsOpen(true)}>
            Borrowings
          </button>
          <button type="button" className="or-btn" onClick={() => setTBondsOpen(true)}>
            T bonds
          </button>
          <button type="button" className="or-btn" onClick={() => setEquityOpen(true)}>
            Equity
          </button>
          <button type="button" className="or-btn" onClick={() => setShareHoldingsOpen(true)}>
            Share Holdings
          </button>
          <button type="button" className="or-btn" onClick={() => setEquitySummaryOpen(true)}>
            Equity Summary
          </button>
        </div>

        <p className="other-reports-content-label">Dashboards</p>
        <div className="other-reports-btn-group">
          <button type="button" className="or-btn or-btn--dashboard" onClick={() => setDashboardOpen(true)}>
            Group Dashboard
          </button>
          <button type="button" className="or-btn or-btn--dashboard" onClick={() => setDashboardReportOpen(true)}>
            Dashboard Report
          </button>
        </div>

        <button type="button" className="or-btn or-btn--customize" onClick={() => setCustomizeOpen(true)}>
          Customize
        </button>
      </div>

      {dashboardOpen ? (
        <GroupFinanceDashboard inline open onClose={() => setDashboardOpen(false)} />
      ) : null}

      <BorrowingsFacilitiesReport open={borrowingsOpen} onClose={() => setBorrowingsOpen(false)} />
      <TBondsReport open={tBondsOpen} onClose={() => setTBondsOpen(false)} />
      <EquityPortfolioReport open={equityOpen} onClose={() => setEquityOpen(false)} />
      <ShareHoldingsReport open={shareHoldingsOpen} onClose={() => setShareHoldingsOpen(false)} />
      <DashboardReport open={dashboardReportOpen} onClose={() => setDashboardReportOpen(false)} />
      <EquityPortfolioSummaryReport open={equitySummaryOpen} onClose={() => setEquitySummaryOpen(false)} />
      <OtherReportsCustomize open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </div>
  );
};

export default OtherReports;
