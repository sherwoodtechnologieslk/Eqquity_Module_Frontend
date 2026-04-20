import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Home/Navbar';
import DynamicHeader from './components/Home/DynamicHeader';
import Sidebar, { equityManagerMenuItems, wealthManagerMenuItems } from './components/Home/Sidebar';
import AuthContainer from './components/Auth/AuthContainer';
import UserProfileModal from './components/Auth/UserProfileModal';
import { authService } from './services/authService';
import WealthSidebar from './components/WealthManager/Layout/WealthSidebar';
import WealthNavbar from './components/WealthManager/Layout/WealthNavbar';
import './components/WealthManager/Layout/WealthLayout.css';
import Dashboard from './components/Dashboard';
import WealthManagerDashboard from './components/WealthManager/WM Dashboard/WealthManagerDashboard';
import WMPortfolioOverview from './components/WealthManager/WM Dashboard/WMPortfolioOverview';
import FundPerformance from './components/WealthManager/WM Dashboard/FundPerformance';
import ClientSummary from './components/WealthManager/WM Dashboard/ClientSummary';
import AUMOverview from './components/WealthManager/WM Dashboard/AUMOverview';
import ClientPortfolio from './components/WealthManager/ClientManagement/ClientPortfolio';
import ClientAccounts from './components/WealthManager/ClientManagement/ClientAccounts';
import ClientPortal from './components/WealthManager/ClientPortal/ClientPortal';
import FundMaster from './components/WealthManager/Fund Master/FundMaster';
import FundCategories from './components/WealthManager/Fund Master/FundCategories';
import FundPerfMetrics from './components/WealthManager/Fund Master/FundPerfMetrics';
import WealthPortfolioMaster from './components/WealthManager/Portfolio Master/WealthPortfolioMaster';
import ExpenseMaster from './components/WealthManager/Expense Master/ExpenseMaster';
import DefineExpenses from './components/WealthManager/Expense Master/DefineExpenses';
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
import ChartOfAccounts from './components/EquityEntries/ChartOfAccounts';
import GeneralLedger from './components/EquityEntries/GeneralLedger';
import JournalEntries from './components/EquityEntries/JournalEntries';
import TrialBalance from './components/EquityEntries/TrialBalance';
import ProfitLoss from './components/EquityEntries/ProfitLoss';
import AccountReconciliation from './components/EquityEntries/AccountReconciliation';
import NewGLAccount from './components/EquityEntries/NewGLAccount';
import EquityGLMapping from './components/TradeCapture/EquityGLMapping';
import AvgCostCalculator from './components/TradeCapture/AvgCostCalculator';
import PortfolioMTM from './components/EquityEntries/PortfolioMTM';
import OtherTransactions from './components/EquityEntries/OtherTransactions';
import OpeningBalEntry from './components/OpeningBalManage/OpeningBalEntry';
import OpeningBalList from './components/OpeningBalManage/OpeningBalList';
import AccountBalanceSetup from './components/OpeningBalManage/AccountBalanceSetup';
import DoubleEntries from './components/EquityEntries/DoubleEntries';
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
import PerformanceReport from './components/FinancialReporting/PerformanceReport';
import FinancialReportingNotes from './components/FinancialReporting/FinancialReportingNotes';
import FinancialReportsExport from './components/FinancialReporting/FinancialReportsExport';
import FinancialReportsDownloadCenter from './components/FinancialReporting/FinancialReportsDownloadCenter';
import OtherReports from './components/FinancialReporting/OtherReports';
import GsecEntries from './components/GsecEntries/GsecEntries';
import GsecGeneralLedger from './components/GsecEntries/GsecGeneralLedger';
import GsecBalanceSheet from './components/GsecEntries/GsecBalanceSheet';
import CombinedGL from './components/AccountingEntries/CombinedGL';
import CombinedTrialBalance from './components/AccountingEntries/CombinedTrialBalance';
import HolidayCalendar from './components/HolidayCalendar/HolidayCalendar';
import FundsCenters from './components/FundsCenters/FundsCenters';
import ViewMap from './components/FundsCenters/ViewMap';
import CashFlowMapping from './components/SettlementAndAccounting/CashFlowMapping';
import SettlementInstructions from './components/SettlementAndAccounting/SettlementInstructions';
import GLMapping from './components/SettlementAndAccounting/GLMapping';
import ViewPortfolio from './components/ViewPortfolio/ViewPortfolio';
import ViewTransactions from './components/ViewTransactions/ViewTransactions';
import PortfolioVsSectors from './components/ViewTransactions/PortfolioVsSectors';
import TradeCore from './components/TradeCore/TradeCore';
import RiskManagementChart from './components/PredictiveValuationModel/RiskManagementChart';
import SharePricePrediction from './components/PredictiveValuationModel/SharePricePrediction';
import PredictionIndicators from './components/PredictiveValuationModel/PredictionIndicators';
import BlockAnalysisDashboard from './components/PredictiveValuationModel/BlockAnalysisDashboard';
import AIAssistantDock from './components/AIAssistant/AIAssistantDock';
import CSEASPIPage from './components/ChartsAndInsights/CSEASPIPage';
import CSESectorIndicesPage from './components/ChartsAndInsights/CSESectorIndicesPage';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  const [selectedManager, setSelectedManager] = useState('equity'); // 'equity' or 'wealth'
  const [isClientView, setIsClientView] = useState(false); // Temporary toggle for client/admin view in wealth manager
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  
  // Handle tab selection from Navbar - use Sidebar's menuItems as single source of truth for indices
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);

    // Use the correct menu set based on selected manager
    const currentMenuItems =
      selectedManager === 'wealth' ? wealthManagerMenuItems : equityManagerMenuItems;

    const sectionIndex = currentMenuItems.findIndex(
      (item) => item.subTopics && item.subTopics.includes(tabName)
    );

    if (sectionIndex >= 0) {
      setActiveSidebarItem(sectionIndex);
      setVisibleTabs(currentMenuItems[sectionIndex].subTopics || []);
    }
  };

  // Handle manager type change from Sidebar
  const handleManagerChange = (managerType) => {
    setSelectedManager(managerType);
    setActiveSidebarItem(0);
    if (managerType === 'wealth') {
      setVisibleTabs(['Dashboard', 'Portfolio Overview', 'Fund Performance', 'Client Summary', 'AUM Overview']);
      setActiveTab('Dashboard');
    } else {
      setVisibleTabs(['Dashboard', 'Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
      setActiveTab('Dashboard');
    }
  };

  // Tab component mappings
  const tabToComponent = {
    'Dashboard': selectedManager === 'wealth' 
      ? <WealthManagerDashboard /> 
      : <Dashboard onTabChange={handleTabChange} />,
    'Portfolio Overview': selectedManager === 'wealth'
      ? <WMPortfolioOverview />
      : <PortfolioOverview onTabChange={handleTabChange} />,
    'Fund Performance': <FundPerformance />,
    'Client Summary': <ClientSummary />,
    'AUM Overview': <AUMOverview />,
    'Client Accounts': <ClientAccounts />,
    'Client Portfolio': <ClientPortfolio />,
    'Market Summary': <MarketSummary />,
    'Recent Activity': <RecentActivity />,
    'Performance Metrics': <PerformanceMetrics />,
    'Equity Master': <EquityMasterEntry />,
    'Strategy Master':  <StrategyMaster/>,
    'Account Master': <AccountMaster/>,
    'Portfolio Master': selectedManager === 'wealth' 
      ? <WealthPortfolioMaster /> 
      : <PortfolioMaster/>,
    'Expense Master': <ExpenseMaster />,
    'Define Expenses': <DefineExpenses />,
    'Fund Master': <FundMaster/>,
    'Fund Categories': <FundCategories/>,
    'Fund Performance Metrics': <FundPerfMetrics/>,
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
    'CSE ASPI': <CSEASPIPage />,
    'CSE Sector Indices': <CSESectorIndicesPage />,
    'Risk Management Chart': <RiskManagementChart />,
    'Share Price Prediction': <SharePricePrediction />,
    'Prediction Indicators': <PredictionIndicators />,
    'Block Analysis Dashboard': <BlockAnalysisDashboard />,

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
    'Avg Cost Calculator': <AvgCostCalculator />,
    'Market Announcements': <MarketAnnouncements />,
    'Corporate Notices': <CorporateNotices />,
    'TradeCore': <TradeCore />,
    'Statement of Financial Position': <FinancialPosition onTabChange={handleTabChange} />,
    'Statement of Comprehensive Income': <StatementOfComprehensiveIncome />,
    'Cash Flow': <CashFlow />,
    'Financial Reporting Notes': <FinancialReportingNotes />,
    'Equity Portfolio Snapshot': <FinancialReportsExport />,
    'Financial Reports Export': <FinancialReportsDownloadCenter />,
    'Settlement Instructions': <SettlementInstructions />,
    'Cash Flow Mapping': <CashFlowMapping />,
    'GL Mapping': <GLMapping />,
    'Performance Report': <PerformanceReport />,
    'Other Reports': <OtherReports />,
    'GSEC ENTRIES': <GsecEntries />,
    'Balance Sheet': <GsecBalanceSheet />,
    'GSec General Ledger': <GsecGeneralLedger />,
    'Combined General Ledger': <CombinedGL onTabChange={handleTabChange} />,
    'Combined Trial Balance': <CombinedTrialBalance onTabChange={handleTabChange} />,
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

  // Show Client Portal if in wealth manager mode and client view is enabled
  // TODO: Replace isClientView with user.role === 'client' check when backend is ready
  if (selectedManager === 'wealth' && isClientView) {
    return <ClientPortal user={user} onLogout={handleLogout} />;
  }

  return (
    <div className={selectedManager === 'wealth' ? 'wm-root' : 'dashboard-root'}>
      {selectedManager === 'wealth' ? (
        <WealthSidebar
          onSelect={handleSidebarSelect}
          activeIndex={activeSidebarItem}
          onLogout={handleLogout}
          onManagerChange={handleManagerChange}
          isClientView={isClientView}
          onClientViewToggle={setIsClientView}
        />
      ) : (
        <Sidebar
          onSelect={handleSidebarSelect}
          activeIndex={activeSidebarItem}
          onLogout={handleLogout}
          onManagerChange={handleManagerChange}
          selectedManager={selectedManager}
          isClientView={isClientView}
          onClientViewToggle={setIsClientView}
        />
      )}

      <div className={selectedManager === 'wealth' ? 'wm-main' : 'dashboard-main'}>
        {selectedManager === 'wealth' ? (
          <WealthNavbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            visibleTabs={visibleTabs}
            user={user}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        ) : (
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            visibleTabs={visibleTabs}
            user={user}
            onLogout={handleLogout}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {selectedManager === 'equity' && <DynamicHeader />}

        <div className={selectedManager === 'wealth' ? 'wm-content' : 'dashboard-content'}>
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

      <AIAssistantDock
        open={aiAssistantOpen}
        onOpen={() => setAiAssistantOpen(true)}
        onClose={() => setAiAssistantOpen(false)}
      />
    </div>
  );
}

export default App;
