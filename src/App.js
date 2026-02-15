import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Home/Navbar';
import DynamicHeader from './components/Home/DynamicHeader';
import Sidebar, { menuItems as sidebarMenuItems } from './components/Home/Sidebar';
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
import PendingDividends from './components/CorporateActions/PendingDividends';
import RightsIssueEntry from './components/VoluntaryCorporateActions/RightsIssueEntry';
import ScripDividendEntry from './components/CorporateActions/ScripDividendEntry';
import PortfolioMaster from './components/MasterDataManagement/PortfolioMaster';
import DealSlipScreen from './components/TradeCapture/DealSlipScreen';
import TradeConfirmation from './components/TradeCapture/TradeConfirmation';
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
import FundsCenters from './components/FundsCenters/FundsCenters';
import ViewMap from './components/FundsCenters/ViewMap';
import CashFlowMapping from './components/SettlementAndAccounting/CashFlowMapping';
import SettlementInstructions from './components/SettlementAndAccounting/SettlementInstructions';
import GLMapping from './components/SettlementAndAccounting/GLMapping';
import ViewPortfolio from './components/ViewPortfolio/ViewPortfolio';
import ViewTransactions from './components/ViewTransactions/ViewTransactions';
import PortfolioVsSectors from './components/ViewTransactions/PortfolioVsSectors';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  

  // Handle tab selection from Navbar - use Sidebar's menuItems as single source of truth for indices
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    const sectionIndex = sidebarMenuItems.findIndex(
      (item) => item.subTopics && item.subTopics.includes(tabName)
    );
    if (sectionIndex >= 0) {
      setActiveSidebarItem(sectionIndex);
      setVisibleTabs(sidebarMenuItems[sectionIndex].subTopics || []);
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
    'Funds Centers': <FundsCenters />,
    'View Map': <ViewMap />,

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
    'Dividends': <DividendEntry/>, // Alias for Mandatory Corporate Actions
    'Pending Dividends': <PendingDividends/>,
    'Rights Issue':<RightsIssueEntry/>,
    'Rights Issues': <RightsIssueEntry/>, // Alias for Mandatory Corporate Actions
    'Stock Split': <ScripDividendEntry/>,
    'Splits & Bonus': <ScripDividendEntry/>, // Alias for Mandatory Corporate Actions
    
    'Deal Slip': <DealSlipScreen />,
    'Portfolio': <PortfolioDropdown />,
    'View Portfolio': <ViewPortfolio />,
    'View Transactions': <ViewTransactions />,
    'Sector Allocation & Performance': <PortfolioVsSectors />,
    'Trade Confirmation': <TradeConfirmation />,
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
    'Settlement Instructions': <SettlementInstructions />,
    'Cash Flow Mapping': <CashFlowMapping />,
    'GL Mapping': <GLMapping />,
    'Balance Sheet': <div style={{ padding: '2rem' }}><h3>GSec Balance Sheet</h3><p>Coming Soon...</p></div>,
    'GSec General Ledger': <div style={{ padding: '2rem' }}><h3>GSec General Ledger</h3><p>Coming Soon...</p></div>,
    'GSec Chart of Accounts': <div style={{ padding: '2rem' }}><h3>GSec Chart of Accounts</h3><p>Coming Soon...</p></div>,
  };

  // Handle sidebar selection
  const handleSidebarSelect = (index, subTopics) => {
    // Allowed items: Dashboard (0), View Portfolio (1), Master Data Management (2), 
    // Holiday Calendar (3), Funds Centers (4), Accounting Entries (5),
    // Settlement and Accounting (8), Account Management (9), Opening Balance Management (10),
    // Trade Capture (11), Batch Transaction Import (12), Valuation and MTM (13),
    // Mandatory Corporate Actions (18)
    // All other items should show premium modal
    const allowedIndices = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 18];
    
    if (!allowedIndices.includes(index)) {
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
        <DynamicHeader />
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
