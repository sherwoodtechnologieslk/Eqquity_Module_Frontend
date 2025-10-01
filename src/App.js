import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Home/Navbar';
import Sidebar from './components/Home/Sidebar';
import AuthContainer from './components/Auth/AuthContainer';
import UserProfileModal from './components/Auth/UserProfileModal';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import PortfolioOverview from './components/Dashboard/DashboardTabs/PortfolioOverview';
import EquityMasterEntry from './components/MasterDataManagement/EquityMasterEntry';
import BuyTransactionEntry from './components/TradeCapture/BuyTransactionEntry';
import SellTransactionEntry from './components/TradeCapture/SellTransactionEntry';
import BulkBuyEntry from './components/BatchTransactionImport/BulkBuyEntry';
import BulkSellEntry from './components/BatchTransactionImport/BulkSellEntry';
import TransactionView from './components/TradeCapture/TransactionView';
import TradeSummaryUpload from './components/ValuationAndMTM/TradeSummaryUpload';
import DividendEntry from './components/CorporateActions/DividendEntry';
import RightsIssueEntry from './components/VoluntaryCorporateActions/RightsIssueEntry';
import ScripDividendEntry from './components/CorporateActions/ScripDividendEntry';
import PortfolioMaster from './components/MasterDataManagement/PortfolioMaster';
import DealSlipScreen from './components/TradeCapture/DealSlipScreen';
import StrategyMaster from './components/MasterDataManagement/StrategyMaster';
import AccountMaster from './components/MasterDataManagement/AccountMaster';
import IPOEntry from './components/IPOEntry/IPOEntry';
import IPOAllocation from './components/IPOEntry/IPOAllocation';
import CostingMethodSelection from './components/MasterDataManagement/CostingMethodSelection';
import PortfolioDropdown from './components/TradeCapture/PortfolioDropdown';
import CostOfFundsDefinition from './components/TradeCapture/CostOfFundsDefinition';
import ChartOfAccounts from './components/AccountingEntries/ChartOfAccounts';
import GeneralLedger from './components/AccountingEntries/GeneralLedger';
import JournalEntries from './components/AccountingEntries/JournalEntries';
import TrialBalance from './components/AccountingEntries/TrialBalance';
import AccountReconciliation from './components/AccountingEntries/AccountReconciliation';
import MarkToMarketValuation from './components/ValuationAndMTM/MarkToMarketValuation';
import RealizedPnL from './components/ValuationAndMTM/RealizedPnL';
import TradeSummaryData from './components/ValuationAndMTM/TradeSummaryData';
import TradeReport from './components/TradeSummary/TradeReport';
import MarketSummary from './components/MarketSummary/MarketSummary';
import RecentActivity from './components/RecentActivity/RecentActivity';
import PerformanceMetrics from './components/PerformanceMetrics/PerformanceMetrics';
import MarketAnnouncements from './components/CSEAnnouncements/MarketAnnouncements';


function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  

  // Handle tab selection from Navbar
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    
    // Update sidebar to reflect the current tab
    // Find which sidebar section contains this tab
    const sidebarSections = [
      {
        index: 0,
        name: "Dashboard",
        subTopics: ["Dashboard", "Portfolio Overview", "Market Summary", "Recent Activity", "Performance Metrics"]
      },
      {
        index: 1,
        name: "Master Data Management", 
        subTopics: ["Equity Master", "Account Master", "Valuation Method", "Portfolio Master", "Strategy Master"]
      },
      {
        index: 2,
        name: "Accounting Entries",
        subTopics: ["Journal Entries", "General Ledger", "Trial Balance", "Account Reconciliation", "Chart Of Accounts"]
      },
      {
        index: 3,
        name: "Trade Capture",
        subTopics: ["Buy", "Sell", "Transactions", "Portfolio", "Deal Slip", "Cost of Funds"]
      },
      {
        index: 4,
        name: "Batch Transaction Import",
        subTopics: ["Bulk Buy Entry", "Bulk Sell Entry", "Import History", "Trade Confirmation", "Trade Report"]
      },
      {
        index: 5,
        name: "Settlement and Accounting",
        subTopics: ["Settlement Instructions", "Cash Flow Mapping", "GL Mapping"]
      },
      {
        index: 6,
        name: "Valuation and MTM",
        subTopics: ["Mark-to-Market Valuation", "Realized Gain/Loss Tracking", "Trade Summary Data", "Market Price Feed"]
      },
      {
        index: 7,
        name: "CSE Announcements",
        subTopics: ["Corporate Notices", "Market Announcements", "Trading Updates", "Regulatory Updates", "News & Events"]
      },
      {
        index: 8,
        name: "Corporate Actions",
        subTopics: ["Dividend", "Rights Issue", "Stock Split"]
      },
      {
        index: 9,
        name: "IPO Management",
        subTopics: ["IPO Entry", "IPO Allocation"]
      },
      {
        index: 9,
        name: "CSE Announcements",
        subTopics: ["Market Announcements", "Corporate Notices", "Trading Updates", "Regulatory Updates", "News & Events"]
      }
    ];
    
    // Find the section that contains this tab
    const section = sidebarSections.find(section => 
      section.subTopics.includes(tabName)
    );
    
    if (section) {
      setActiveSidebarItem(section.index);
      setVisibleTabs(section.subTopics);
    }
  };

  // Tab component mappings
  const tabToComponent = {
    'Dashboard': <Dashboard onTabChange={handleTabChange} />,
    'Portfolio Overview': <PortfolioOverview onTabChange={handleTabChange} />,
    'Market Summary': <MarketSummary />,
    'Recent Activity': <RecentActivity />,
    'Performance Metrics': <PerformanceMetrics />,
    'Equity Master': <EquityMasterEntry />,
    'Strategy Master':  <StrategyMaster/>,
    'Account Master': <AccountMaster/>,
    'Portfolio Master': <PortfolioMaster/>,
    'Valuation Method': <CostingMethodSelection/>,

    'Buy': <BuyTransactionEntry />,
    'Sell': <SellTransactionEntry setActiveTab={setActiveTab} />,
    'Transactions': <TransactionView />,
    'Bulk Buy Entry': <BulkBuyEntry />,
    'Bulk Sell Entry': <BulkSellEntry />,
    'Import History': <div style={{ padding: '2rem' }}><h3>Import History</h3><p>Coming Soon...</p></div>,
    'Market Price Feed': <TradeSummaryUpload />,
    'Mark-to-Market Valuation': <MarkToMarketValuation />,
    'Realized Gain/Loss Tracking': <RealizedPnL />,
    'Trade Summary Data': <TradeSummaryData />,

    'Dividend': <DividendEntry/>,
    'Rights Issue':<RightsIssueEntry/>,
    'Stock Split': <ScripDividendEntry/>,
    
    'Deal Slip': <DealSlipScreen />,
    'Portfolio': <PortfolioDropdown />,
    'Trade Confirmation': <div style={{ padding: '2rem' }}><h3>Trade Confirmation</h3><p>Coming Soon...</p></div>,
    'Equity Cost': <div style={{ padding: '2rem' }}><h3>Equity Cost Module</h3><p>Coming Soon...</p></div>,
    'Mark To Market': <MarkToMarketValuation />,
    
    'IPO Entry': <IPOEntry />,
    'IPO Allocation': <IPOAllocation/>,
    'Cost of Funds': <CostOfFundsDefinition />,
    'Journal Entries': <JournalEntries onTabChange={handleTabChange} />,
    'Chart Of Accounts': <ChartOfAccounts />,
    'General Ledger': <GeneralLedger />,
    'Trial Balance': <TrialBalance />,
    'Account Reconciliation': <AccountReconciliation />,
    'Trade Report': <TradeReport />,
    'Market Announcements': <MarketAnnouncements />,
  };

  // Handle sidebar selection
  const handleSidebarSelect = (index, subTopics) => {
    setActiveSidebarItem(index);

    if (Array.isArray(subTopics) && subTopics.length > 0) {
      setVisibleTabs(subTopics);
      setActiveTab(subTopics[0]);
    } else {
      setVisibleTabs([]);
      setActiveTab('');
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Always clear any stored authentication data on app startup
      authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Optional: Set default visible tabs on first load
  useEffect(() => {
    if (isAuthenticated) {
      setVisibleTabs(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
      setActiveTab('Dashboard');
    }
  }, [isAuthenticated]);

  // Handle authentication success
  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    authService.setAuth(userData, token);
    // Set default to Dashboard after login
    setActiveTab('Dashboard');
    setVisibleTabs(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('Dashboard');
    setVisibleTabs(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  };

  // If not authenticated, show auth container
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthContainer onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="dashboard-root">
      <Sidebar
        onSelect={handleSidebarSelect}
        activeIndex={activeSidebarItem}
        onLogout={handleLogout}
      />
      <div className="dashboard-main">
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          visibleTabs={visibleTabs}
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <div className="dashboard-content">
          {tabToComponent[activeTab] || (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              <h3>Component Not Found</h3>
              <p>The requested component is not available.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* User Profile Modal */}
      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      

    </div>
  );
}

export default App;
