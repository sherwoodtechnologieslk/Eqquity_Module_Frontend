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
import ImportHistory from './components/BatchTransactionImport/ImportHistory';
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
import ProfitLoss from './components/AccountingEntries/ProfitLoss';
import AccountReconciliation from './components/AccountingEntries/AccountReconciliation';
import NewGLAccount from './components/AccountingEntries/NewGLAccount';
import EquityGLMapping from './components/TradeCapture/EquityGLMapping';
import PortfolioMTM from './components/AccountingEntries/PortfolioMTM';
import OtherTransactions from './components/AccountingEntries/OtherTransactions';
import OpeningBalEntry from './components/OpeningBalManage/OpeningBalEntry';
import OpeningBalList from './components/OpeningBalManage/OpeningBalList';
import AccountBalanceSetup from './components/OpeningBalManage/AccountBalanceSetup';
import DoubleEntries from './components/AccountingEntries/DoubleEntries';
import MarkToMarketValuation from './components/ValuationAndMTM/MarkToMarketValuation';
import RealizedPnL from './components/ValuationAndMTM/RealizedPnL';
import TradeSummaryData from './components/ValuationAndMTM/TradeSummaryData';
import TradeReport from './components/TradeSummary/TradeReport';
import MarketSummary from './components/MarketSummary/MarketSummary';
import RecentActivity from './components/RecentActivity/RecentActivity';
import PerformanceMetrics from './components/PerformanceMetrics/PerformanceMetrics';
import MarketAnnouncements from './components/CSEAnnouncements/MarketAnnouncements';
import CorporateNotices from './components/CSEAnnouncements/CorporateNotices';
import FinancialPosition from './components/FinancialReporting/FinancialPosition';
import StatementOfComprehensiveIncome from './components/FinancialReporting/StatementOfComprehensiveIncome';
import CashFlow from './components/FinancialReporting/CashFlow';
import PremiumModal from './components/PremiumModal/premiumModal';
import HolidayCalendar from './components/HolidayCalendar/HolidayCalendar';


function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
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
        name: "Holiday Calendar",
        subTopics: ["Holiday Calendar", "Holiday List", "Add Holiday", "Holiday Settings"]
      },
      {
        index: 3,
        name: "Accounting Entries",
        subTopics: ["Journal Entries", "General Ledger", "Trial Balance", "P&L", "Portfolio MTM"]
      },
      {
        index: 4,
        name: "Financial Reporting",
        subTopics: ["Statement of Financial Position", "Statement of Comprehensive Income", "Cash Flow", "Financial Reports Export"]
      },
      {
        index: 5,
        name: "Account Management",
        subTopics: ["Chart Of Accounts", "New GL Account", "Account Reconciliation", "Other Transactions"]
      },
      {
        index: 6,
        name: "Opening Balance Management",
        subTopics: ["Opening Balance Entry", "Opening Balance List", "Account Balance Setup", "Double Entries"]
      },
      {
        index: 7,
        name: "Trade Capture",
      subTopics: ["Buy", "Sell", "Transactions", "Portfolio", "Deal Slip", "Cost of Funds", "Equity GL Mapping"]
      },
      {
        index: 8,
        name: "Batch Transaction Import",
        subTopics: ["Bulk Buy Entry", "Bulk Sell Entry", "Import History", "Trade Confirmation", "Trade Report"]
      },
      {
        index: 9,
        name: "Settlement and Accounting",
        subTopics: ["Settlement Instructions", "Cash Flow Mapping", "GL Mapping"]
      },
      {
        index: 10,
        name: "Valuation and MTM",
        subTopics: ["Mark-to-Market Valuation", "Realized Gain/Loss Tracking", "Trade Summary Data", "Market Price Feed"]
      },
      {
        index: 11,
        name: "CSE Announcements",
        subTopics: ["Corporate Notices", "Market Announcements", "Trading Updates", "Regulatory Updates", "News & Events"]
      },
      {
        index: 12,
        name: "Corporate Actions",
        subTopics: ["Dividend", "Rights Issue", "Stock Split"]
      },
      {
        index: 16,
        name: "IPO",
        subTopics: ["IPO Entry", "IPO Allocation", "Refund Processing", "Allocation Summary"]
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
    'Holiday Calendar': <HolidayCalendar mode="calendar" />,
    'Holiday List': <HolidayCalendar mode="list" />,
    'Add Holiday': <HolidayCalendar mode="create" />,
    'Holiday Settings': <HolidayCalendar mode="settings" />,

    'Buy': <BuyTransactionEntry />,
    'Sell': <SellTransactionEntry setActiveTab={setActiveTab} />,
    'Transactions': <TransactionView onTabChange={handleTabChange} />,
    'Bulk Buy Entry': <BulkBuyEntry />,
    'Bulk Sell Entry': <BulkSellEntry />,
    'Import History': <ImportHistory />,
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
    'Refund Processing': <div style={{ padding: '2rem' }}><h3>Refund Processing</h3><p>Coming Soon...</p></div>,
    'Allocation Summary': <div style={{ padding: '2rem' }}><h3>Allocation Summary</h3><p>Coming Soon...</p></div>,
    'Cost of Funds': <CostOfFundsDefinition />,
    'Journal Entries': <JournalEntries onTabChange={handleTabChange} />,
    'Chart Of Accounts': <ChartOfAccounts />,
    'General Ledger': <GeneralLedger />,
    'Trial Balance': <TrialBalance />,
    'Account Reconciliation': <AccountReconciliation />,
    'Other Transactions': <OtherTransactions />,
    'P&L': <ProfitLoss />,
    'Portfolio MTM': <PortfolioMTM />,
    'Double Entries': <DoubleEntries />,
    'New GL Account': <NewGLAccount />,
    'Opening Balance Entry': <OpeningBalEntry />,
    'Opening Balance List': <OpeningBalList />,
    'Account Balance Setup': <AccountBalanceSetup />,
    'Trade Report': <TradeReport />,
    'Equity GL Mapping': <EquityGLMapping />,
    'Market Announcements': <MarketAnnouncements />,
    'Corporate Notices': <CorporateNotices />,
    'Statement of Financial Position': <FinancialPosition />,
    'Statement of Comprehensive Income': <StatementOfComprehensiveIncome />,
    'Cash Flow': <CashFlow />,
    'Financial Reports Export': <div style={{ padding: '2rem' }}><h3>Financial Reports Export</h3><p>Coming Soon...</p></div>,
  };

  // Handle sidebar selection
  const handleSidebarSelect = (index, subTopics) => {
    // Financial Reporting is at index 4 - show premium modal instead
    // Settlement and Accounting is at index 9 - show premium modal instead
    // CSE Announcements is at index 11 - show premium modal instead
    // Corporate Actions is at index 12 - show premium modal instead
    // Security Identity is at index 13 - show premium modal instead
    // Voluntary Corporate Actions is at index 14 - show premium modal instead
    // Mandatory Corporate Actions is at index 15 - show premium modal instead
    // IPO is at index 16 - show premium modal instead
    // Portfolio Monitoring is at index 17 - show premium modal instead
    // Risk and Limit Management is at index 18 - show premium modal instead
    // Reporting and Compliance is at index 19 - show premium modal instead
    // Integration and Automation is at index 20 - show premium modal instead
    // Portfolio Transfers is at index 21 - show premium modal instead
    if (index === 4 || index === 9 || index === 11 || index === 12 || index === 13 || index === 14 || index === 15 || index === 16 || index === 17 || index === 18 || index === 19 || index === 20 || index === 21) {
      setIsPremiumModalOpen(true);
      return;
    }

    setActiveSidebarItem(index);

    if (Array.isArray(subTopics) && subTopics.length > 0) {
      setVisibleTabs(subTopics);
      setActiveTab(subTopics[0]);
    } else {
      setVisibleTabs([]);
      setActiveTab('');
    }
  };

  // Handle Contact Sales button click
  const handleContactSales = () => {
    setIsPremiumModalOpen(false);
    // Add your contact sales logic here
    // For example: window.open('mailto:sales@example.com', '_blank');
    // Or navigate to a contact page
    console.log('Contact Sales clicked');
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is already authenticated
      const isValidToken = await authService.validateStoredToken();
      if (isValidToken) {
        const user = authService.getStoredUser();
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };
    
    checkAuth();

    // Add event listener to clear auth data only when browser is closed
    const handleBeforeUnload = () => {
      authService.logout();
    };

    // Add event listener for browser close only
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
      
      {/* Premium Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onContactSales={handleContactSales}
      />

    </div>
  );
}

export default App;
