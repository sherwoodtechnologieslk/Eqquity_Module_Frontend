import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Navbar from './components/Home/Navbar';
import DynamicHeader from './components/Home/DynamicHeader';
import Sidebar, { equityManagerMenuItems, wealthManagerMenuItems, getEquityNavbarBackdrop } from './components/Home/Sidebar';
import ManagerSelection from './components/Home/ManagerSelection';
import EquityLanding from './components/Home/EquityLanding';
import AuthContainer from './components/Auth/AuthContainer';
import UserProfileModal from './components/Auth/UserProfileModal';
import { authService } from './services/authService';
import {
  canAccessTab,
  filterEquityMenuItems,
} from './constants/governanceConstants';
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
import ClientStatements from './components/WealthManager/ClientManagement/ClientStatements';
import ClientOnboarding from './components/WealthManager/ClientManagement/ClientOnboarding';
import KYCManagement from './components/WealthManager/ClientManagement/KYCManagement';
import ClientPortal from './components/WealthManager/ClientPortal/ClientPortal';
import FundMaster from './components/WealthManager/Fund Master/FundMaster';
import FundCategories from './components/WealthManager/Fund Master/FundCategories';
import FundPerfMetrics from './components/WealthManager/Fund Master/FundPerfMetrics';
import WealthPortfolioMaster from './components/WealthManager/Portfolio Master/WealthPortfolioMaster';
import ExpenseMaster from './components/WealthManager/Expense Master/ExpenseMaster';
import DefineExpenses from './components/WealthManager/Expense Master/DefineExpenses';
import PurchaseSubscription from './components/WealthManager/Unit Trust Operations/PurchaseSubscription';
import Redemption from './components/WealthManager/Unit Trust Operations/Redemption';
import SwitchTransfer from './components/WealthManager/Unit Trust Operations/SwitchTransfer';
import DividendDistribution from './components/WealthManager/Unit Trust Operations/DividendDistribution';
import SIP from './components/WealthManager/Unit Trust Operations/SIP';
import SWP from './components/WealthManager/Unit Trust Operations/SWP';
import FundPricing from './components/WealthManager/Fund Master/FundPricing';
import NAVManagement from './components/WealthManager/Fund Master/NAVManagement';
import ClientPortfolios from './components/WealthManager/Portfolio Master/ClientPortfolios';
import PortfolioAllocation from './components/WealthManager/Portfolio Master/PortfolioAllocation';
import PortfolioPerformance from './components/WealthManager/Portfolio Master/PortfolioPerformance';
import PortfolioReports from './components/WealthManager/Portfolio Master/PortfolioReports';
import TransactionHistory from './components/WealthManager/Transactions/TransactionHistory';
import PendingTransactions from './components/WealthManager/Transactions/PendingTransactions';
import TransactionApproval from './components/WealthManager/Transactions/TransactionApproval';
import TransactionReports from './components/WealthManager/Transactions/TransactionReports';
import BulkTransactions from './components/WealthManager/Transactions/BulkTransactions';
import NAVCalculation from './components/WealthManager/ValuationNAV/NAVCalculation';
import ValuationReports from './components/WealthManager/ValuationNAV/ValuationReports';
import AssetValuation from './components/WealthManager/ValuationNAV/AssetValuation';
import NAVHistory from './components/WealthManager/ValuationNAV/NAVHistory';
import PriceFeedManagement from './components/WealthManager/ValuationNAV/PriceFeedManagement';
import {
  ClientReports,
  FundReports,
  PerformanceReports,
  RegulatoryReports,
  TaxReports,
  StatementGeneration,
} from './components/WealthManager/Reporting/WealthReports';
import WealthJournalEntries from './components/WealthManager/Accounting/WealthJournalEntries';
import WealthGeneralLedger from './components/WealthManager/Accounting/WealthGeneralLedger';
import WealthTrialBalance from './components/WealthManager/Accounting/WealthTrialBalance';
import WealthPnLStatement from './components/WealthManager/Accounting/WealthPnLStatement';
import FundAccounting from './components/WealthManager/Accounting/FundAccounting';
import RiskManagement from './components/WealthManager/RiskCompliance/RiskManagement';
import ComplianceMonitoring from './components/WealthManager/RiskCompliance/ComplianceMonitoring';
import AuditTrail from './components/WealthManager/RiskCompliance/AuditTrail';
import RegulatoryCompliance from './components/WealthManager/RiskCompliance/RegulatoryCompliance';
import RiskReports from './components/WealthManager/RiskCompliance/RiskReports';
import SystemSettings from './components/WealthManager/Settings/SystemSettings';
import FeeStructure from './components/WealthManager/Settings/FeeStructure';
import CommissionSetup from './components/WealthManager/Settings/CommissionSetup';
import WealthHolidayCalendar from './components/WealthManager/Settings/WealthHolidayCalendar';
import UserManagement from './components/WealthManager/Settings/UserManagement';
import GSecHoldings from './components/WealthManager/Government Securities/GSecHoldings';
import TBillSubscription from './components/WealthManager/Government Securities/TBillSubscription';
import TBills from './components/WealthManager/Government Securities/TBills';
import TBondDeals from './components/WealthManager/Government Securities/TBondDeals';
import RepoBuyback from './components/WealthManager/Government Securities/RepoBuyback';
import MaturityCalendar from './components/WealthManager/Government Securities/MaturityCalendar';
import GSecSettlements from './components/WealthManager/Government Securities/GSecSettlements';
import GSecProductReport from './components/WealthManager/Government Securities/GSecProductReport';
import MarkToMarket from './components/WealthManager/Government Securities/MarkToMarket';
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
import IPOPlaceholder from './components/IPOEntry/IPOPlaceholder';
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
import VouchersModule from './components/Vouchers/VouchersModule';
import InternalBankTransferModule from './components/Vouchers/InternalBankTransferModule';
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
import NewsEvents from './components/CSEAnnouncements/NewsEvents';
import FinancialReports from './components/CSEAnnouncements/FinancialReports';
import TradingUpdates from './components/CSEAnnouncements/TradingUpdates';
import RegulatoryUpdates from './components/CSEAnnouncements/RegulatoryUpdates';
import CovidDisclosures from './components/CSEAnnouncements/CovidDisclosures';
import FinancialPosition from './components/FinancialReporting/FinancialPosition';
import StatementOfComprehensiveIncome from './components/FinancialReporting/StatementOfComprehensiveIncome';
import StatementOfChangesInEquity from './components/FinancialReporting/StatementOfChangesInEquity';
import DetailedIncomeStatement from './components/FinancialReporting/DetailedIncomeStatement';
import CashFlow from './components/FinancialReporting/CashFlow';
import PerformanceReport from './components/FinancialReporting/PerformanceReport';
import FinancialReportingNotes from './components/FinancialReporting/FinancialReportingNotes';
import FinancialReportsExport from './components/FinancialReporting/FinancialReportsExport';
import FinancialReportsDownloadCenter from './components/FinancialReporting/FinancialReportsDownloadCenter';
import OtherReports from './components/FinancialReporting/OtherReports';
import GsecEntries from './components/GsecEntries/GsecEntries';
import GsecGeneralLedger from './components/GsecEntries/GsecGeneralLedger';
import GsecBalanceSheet from './components/GsecEntries/GsecBalanceSheet';
import GsecManualEntryPosting from './components/GsecEntries/GsecManualEntryPosting';
import GsecMissingEntries from './components/GsecEntries/GsecMissingEntries';
import GsecBulkEntryGrid from './components/GsecEntries/GsecBulkEntryGrid';
import CombinedGL from './components/AccountingEntries/CombinedGL';
import CombinedTrialBalance from './components/AccountingEntries/CombinedTrialBalance';
import AccountSummaries from './components/AccountingEntries/AccountSummaries';
import HolidayCalendar from './components/HolidayCalendar/HolidayCalendar';
import FundsCenters from './components/FundsCenters/FundsCenters';
import ViewMap from './components/FundsCenters/ViewMap';
import GlobalMarkets from './components/FundsCenters/GlobalMarkets';
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
import MLStockPrediction from './components/PredictiveValuationModel/MLStockPrediction';
import AIAssistantDock from './components/AIAssistant/AIAssistantDock';
import GlobalBlux from './components/AgentBlux/GlobalBlux';
import CSEASPIPage from './components/ChartsAndInsights/CSEASPIPage';
import CSESectorIndicesPage from './components/ChartsAndInsights/CSESectorIndicesPage';
import AssetRegister from './components/FixedAssets/AssetRegister';
import AssetEntry from './components/FixedAssets/AssetEntry';
import AssetCategories from './components/FixedAssets/AssetCategories';
import SuperuserPortal from './components/Governance/SuperuserPortal';
import AdminGovernancePortal from './components/Governance/AdminGovernancePortal';
import BusinessApprovalsPortal from './components/Governance/BusinessApprovalsPortal';
import OwnerAdminApprovals from './components/Governance/OwnerAdminApprovals';
import GovernanceActivityLog from './components/Governance/GovernanceActivityLog';

// TODO: re-enable when Agent Blux is ready for production
const BLUX_ENABLED = false;

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [activeSidebarItem, setActiveSidebarItem] = useState(-1);
  const [visibleTabs, setVisibleTabs] = useState(['Home']);
  const [selectedManager, setSelectedManager] = useState('equity'); // 'equity' or 'wealth'
  const [hasSelectedManager, setHasSelectedManager] = useState(false);
  const [pendingManager, setPendingManager] = useState(null);
  const [showAuthFromManagers, setShowAuthFromManagers] = useState(false);
  const [isClientPortalTab] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('clientPortal') === '1';
    } catch {
      return false;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [ownerReadOnlyPopup, setOwnerReadOnlyPopup] = useState(null);
  // Optional context payload passed across tabs (e.g. SOFP "View notes" → Financial Reporting Notes).
  // Cleared when the tab is changed without a payload.
  const [tabContext, setTabContext] = useState(null);

  useEffect(() => {
    const showOwnerReadOnlyPopup = (detail = {}) => {
      setOwnerReadOnlyPopup({
        title: detail.title || 'Read-only owner account',
        message:
          detail.message ||
          'This action was blocked because company owner accounts are not allowed to create, edit, or delete business data. Please contact an admin.',
      });
    };

    const handleOwnerReadOnlyEvent = (event) => showOwnerReadOnlyPopup(event.detail);
    window.addEventListener('owner-read-only-write-blocked', handleOwnerReadOnlyEvent);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 403) {
        response
          .clone()
          .json()
          .then((data) => {
            if (data?.code === 'OWNER_READ_ONLY_WRITE_BLOCKED') {
              showOwnerReadOnlyPopup(data);
            }
          })
          .catch(() => {});
      }
      return response;
    };

    return () => {
      window.removeEventListener('owner-read-only-write-blocked', handleOwnerReadOnlyEvent);
      window.fetch = originalFetch;
    };
  }, []);
  
  // Handle tab selection from Navbar - use Sidebar's menuItems as single source of truth for indices
  const handleTabChange = useCallback((tabName, context = null) => {
    if (tabName === 'Home') {
      setActiveTab('Home');
      setTabContext(null);
      setVisibleTabs(['Home']);
      setActiveSidebarItem(-1);
      return;
    }

    if (
      selectedManager === 'equity' &&
      user &&
      !canAccessTab(user, tabName, equityManagerMenuItems)
    ) {
      return;
    }

    setActiveTab(tabName);
    setTabContext(context ?? null);

    const currentMenuItems =
      selectedManager === 'wealth' ? wealthManagerMenuItems : equityManagerMenuItems;

    const menuForLookup =
      selectedManager === 'equity' ? filterEquityMenuItems(user, currentMenuItems) : currentMenuItems;

    const sectionItem = menuForLookup.find(
      (item) => item.subTopics && item.subTopics.includes(tabName)
    );

    if (sectionItem) {
      const sectionIndex = currentMenuItems.findIndex((item) => item.name === sectionItem.name);
      setActiveSidebarItem(sectionIndex >= 0 ? sectionIndex : 0);
      setVisibleTabs(sectionItem.subTopics || []);
    }
  }, [selectedManager, user]);

  const handleManagerChange = (managerType) => {
    setSelectedManager(managerType);
    setActiveSidebarItem(0);
    setTabContext(null);

    if (managerType === 'wealth') {
      const wealthTabs = wealthManagerMenuItems[0]?.subTopics || [
        'Dashboard',
        'Portfolio Overview',
        'Fund Performance',
        'Client Summary',
        'AUM Overview',
      ];
      setVisibleTabs(wealthTabs);
      setActiveTab(wealthTabs[0] || 'Dashboard');
      return true;
    }

    setVisibleTabs(['Home']);
    setActiveTab('Home');
    setActiveSidebarItem(-1);
    return true;
  };

  const handleManagerSelection = (managerType) => {
    handleManagerChange(managerType);
    setHasSelectedManager(true);
  };

  const handlePreAuthManagerSelection = (managerType) => {
    setPendingManager(managerType);
    handleManagerChange(managerType);
    setShowAuthFromManagers(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSelectedManager('equity');
    setHasSelectedManager(false);
    setPendingManager(null);
    setShowAuthFromManagers(false);
    setActiveTab('Home');
    setVisibleTabs(['Home']);
    if (isClientPortalTab) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('clientPortal');
        window.history.replaceState({}, '', url.toString());
      } catch {
        /* ignore */
      }
    }
  };

  // Tab component mappings
  const tabToComponent = {
    'Home': (
      <EquityLanding user={user} onOpenModule={handleTabChange} />
    ),
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
    'Client Statements': <ClientStatements />,
    'Client Onboarding': <ClientOnboarding />,
    'KYC Management': <KYCManagement />,
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
    'Fund Pricing': <FundPricing />,
    'NAV Management': <NAVManagement />,
    'Purchase/Subscription': <PurchaseSubscription />,
    'Redemption': <Redemption />,
    'Switch/Transfer': <SwitchTransfer />,
    'Dividend Distribution': <DividendDistribution />,
    'Systematic Investment Plan (SIP)': <SIP />,
    'Systematic Withdrawal Plan (SWP)': <SWP />,
    'G-Sec Holdings': <GSecHoldings />,
    'T-Bill Subscription': <TBillSubscription />,
    'T-Bills': <TBills />,
    'T-Bond Deals': <TBondDeals />,
    'Repo & Buyback': <RepoBuyback />,
    'Maturity Calendar': <MaturityCalendar />,
    'G-Sec Settlements': <GSecSettlements />,
    'GSec Product Report': <GSecProductReport />,
    'Mark to Market': <MarkToMarket />,
    'Client Portfolios': <ClientPortfolios />,
    'Portfolio Allocation': <PortfolioAllocation />,
    'Portfolio Performance': <PortfolioPerformance />,
    'Portfolio Reports': <PortfolioReports />,
    'Transaction History': <TransactionHistory />,
    'Pending Transactions': <PendingTransactions />,
    'Transaction Approval': <TransactionApproval />,
    'Transaction Reports': <TransactionReports />,
    'Bulk Transactions': <BulkTransactions />,
    'NAV Calculation': <NAVCalculation />,
    'Valuation Reports': <ValuationReports />,
    'Asset Valuation': <AssetValuation />,
    'NAV History': <NAVHistory />,
    'Price Feed Management': <PriceFeedManagement />,
    'Client Reports': <ClientReports />,
    'Fund Reports': <FundReports />,
    'Performance Reports': <PerformanceReports />,
    'Regulatory Reports': <RegulatoryReports />,
    'Tax Reports': <TaxReports />,
    'Statement Generation': <StatementGeneration />,
    'P&L Statement': <WealthPnLStatement />,
    'Fund Accounting': <FundAccounting />,
    'Risk Management': <RiskManagement />,
    'Compliance Monitoring': <ComplianceMonitoring />,
    'Audit Trail': <AuditTrail />,
    'Regulatory Compliance': <RegulatoryCompliance />,
    'Risk Reports': <RiskReports />,
    'System Settings': <SystemSettings />,
    'Fee Structure': <FeeStructure />,
    'Commission Setup': <CommissionSetup />,
    'User Management': <UserManagement />,
    'Valuation Method': <CostingMethodSelection/>,
    'Holiday Calendar': selectedManager === 'wealth'
      ? <WealthHolidayCalendar />
      : <HolidayCalendar mode="calendar" />,
    'Holiday List': <HolidayCalendar mode="list" />,
    'Add Holiday': <HolidayCalendar mode="create" />,
    'Holiday Settings': <HolidayCalendar mode="settings" />,
    'Funds Centers': <FundsCenters />,
    'View Map': <ViewMap />,
    'Global Markets': <GlobalMarkets />,

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
    'ML Stock Predictor': <MLStockPrediction />,

    'Dividend': <DividendEntry/>,
    'Dividends': <DividendEntry/>, // Alias for Mandatory Corporate Actions
    'Pending Dividends': <PendingDividends/>,
    'Rights Issue':<RightsIssueEntry/>,
    'Rights Issues': <RightsIssueEntry/>, // Alias for Mandatory Corporate Actions
    'Stock Split': <ScripDividendEntry mode="split" />,
    'Splits & Bonus': <ScripDividendEntry mode="split" />,
    'Reverse Stock Split': <ScripDividendEntry mode="reverse" />,
    'Deal Slip': <DealSlipScreen />,
    'Portfolio': <PortfolioDropdown />,
    'View Portfolio': <ViewPortfolio />,
    'View Transactions': <ViewTransactions />,
    'Sector Allocation & Performance': <PortfolioVsSectors />,
    'Trade Confirmation': <TradeConfirmation />,
    'Equity Cost': <div style={{ padding: '2rem' }}><h3>Equity Cost Module</h3><p>Coming Soon...</p></div>,
    'Mark To Market': <MarkToMarketValuation />,
    
    'IPO Entry': <IPOEntry />,
    'IPO Allocation': <IPOAllocation />,
    'Refund Processing': (
      <IPOPlaceholder
        title="Refund Processing"
        subtitle="Track and process IPO refunds"
        message="Refund Processing is coming soon."
      />
    ),
    'Allocation Summary': (
      <IPOPlaceholder
        title="Allocation Summary"
        subtitle="Review IPO allocation outcomes"
        message="Allocation Summary is coming soon."
      />
    ),
    'Cost of Funds': <CostOfFundsDefinition />,
    'Journal Entries': selectedManager === 'wealth'
      ? <WealthJournalEntries />
      : <JournalEntries onTabChange={handleTabChange} />,
    'Chart Of Accounts': <ChartOfAccounts />,
    'General Ledger': selectedManager === 'wealth'
      ? <WealthGeneralLedger />
      : <GeneralLedger />,
    'Trial Balance': selectedManager === 'wealth'
      ? <WealthTrialBalance />
      : <TrialBalance />,
    'Account Reconciliation': <AccountReconciliation />,
    'Other Transactions': <OtherTransactions />,
    Vouchers: <VouchersModule />,
    'Internal Bank Transfer': <InternalBankTransferModule />,
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
    'Trading Updates': <TradingUpdates />,
    'Regulatory Updates': <RegulatoryUpdates />,
    'Financial Reports': <FinancialReports />,
    'COVID-19 Disclosures': <CovidDisclosures />,
    'News & Events': <NewsEvents />,
    'TradeCore': <TradeCore />,
    'Statement of Financial Position': <FinancialPosition onTabChange={handleTabChange} />,
    'Statement of Comprehensive Income': (
      <StatementOfComprehensiveIncome onTabChange={handleTabChange} />
    ),
    'Statement of Changes in Equity': <StatementOfChangesInEquity />,
    'Detailed Income Statement': <DetailedIncomeStatement />,
    'Cash Flow': <CashFlow onTabChange={handleTabChange} />,
    'Equity Portfolio Snapshot': <FinancialReportsExport />,
    'Financial Reports Export': <FinancialReportsDownloadCenter />,
    'Settlement Instructions': <SettlementInstructions />,
    'Cash Flow Mapping': <CashFlowMapping />,
    'GL Mapping': <GLMapping />,
    'Performance Report': <PerformanceReport />,
    'Other Reports': <OtherReports />,
    'GSEC ENTRIES': <GsecEntries />,
    'Missing GSec Entries': <GsecMissingEntries />,
    'Gsec Trial Balance': <GsecBalanceSheet />,
    'GSec General Ledger': <GsecGeneralLedger />,
    'GSec Manual Entry Posting': <GsecManualEntryPosting />,
    'GSec Bulk Entry Grid': <GsecBulkEntryGrid />,
    'Combined General Ledger': <CombinedGL onTabChange={handleTabChange} />,
    'Combined Trial Balance': <CombinedTrialBalance onTabChange={handleTabChange} />,
    'Account Summaries': <AccountSummaries onTabChange={handleTabChange} />,
    'Asset Register': <AssetRegister onTabChange={handleTabChange} />,
    'Add Asset': <AssetEntry onTabChange={handleTabChange} />,
    'Asset Categories': <AssetCategories onTabChange={handleTabChange} />,
    'User Requests': (
      <AdminGovernancePortal user={user} company={user?.company} />
    ),
    'Business Approvals': (
      <BusinessApprovalsPortal user={user} company={user?.company} />
    ),
    'Admin Approvals': (
      <OwnerAdminApprovals user={user} company={user?.company} />
    ),
    'Activity Log': (
      <GovernanceActivityLog company={user?.company} />
    ),
  };

  // Handle sidebar selection
  const handleSidebarSelect = (index, subTopics, managerType) => {
    const mode = managerType || selectedManager;
    setActiveSidebarItem(index);
    setTabContext(null);

    const topics = Array.isArray(subTopics) ? subTopics : [];
    const allowedTabs =
      mode === 'wealth'
        ? topics
        : topics.filter((tab) => !user || canAccessTab(user, tab, equityManagerMenuItems));

    if (allowedTabs.length > 0) {
      setVisibleTabs(allowedTabs);
      setActiveTab(allowedTabs[0]);
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
  }, []);

  // Optional: Set default visible tabs on first load (not for superuser)
  useEffect(() => {
    if (isAuthenticated && user?.company_role !== 'superuser' && selectedManager === 'equity') {
      setActiveSidebarItem(-1);
      setVisibleTabs(['Home']);
      setActiveTab('Home');
    }
  }, [isAuthenticated, user, selectedManager]);

  // Handle authentication success
  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthFromManagers(false);
    if (token) {
      localStorage.setItem('token', token);
    }
    if (userData?.company_role === 'superuser') {
      setHasSelectedManager(true);
      return;
    }

    const managerToEnter = pendingManager || selectedManager || 'equity';
    handleManagerChange(managerToEnter);
    setHasSelectedManager(true);
    setPendingManager(null);
  };

  const handlePasswordChanged = (message) => {
    sessionStorage.setItem(
      'authNotice',
      message || 'Password updated successfully. Sign in with your new password.'
    );
    setIsProfileModalOpen(false);
    handleLogout();
  };

  // If not authenticated, show manager selection first, then sign-in
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Public Client Portal site (?clientPortal=1) — no staff login required
  if (isClientPortalTab) {
    return <ClientPortal user={user} onLogout={handleLogout} />;
  }

  if (!isAuthenticated) {
    if (!showAuthFromManagers) {
      return (
        <ManagerSelection
          preAuth
          onSelect={handlePreAuthManagerSelection}
        />
      );
    }

    return (
      <AuthContainer
        onAuthSuccess={handleAuthSuccess}
        onBack={() => {
          setShowAuthFromManagers(false);
          setPendingManager(null);
        }}
      />
    );
  }

  // Superuser: governance-only shell (no equity manager UI)
  if (user?.company_role === 'superuser') {
    return (
      <>
        <SuperuserPortal
          user={user}
          company={user.company}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <UserProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onPasswordChanged={handlePasswordChanged}
        />
      </>
    );
  }

  if (!hasSelectedManager) {
    return (
      <ManagerSelection
        user={user}
        onSelect={handleManagerSelection}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
    <div
      className={
        selectedManager === 'wealth'
          ? 'wm-root'
          : `dashboard-root${activeTab === 'Home' ? ' dashboard-root--home' : ''}`
      }
    >
      {selectedManager === 'wealth' ? (
        <WealthSidebar
          onSelect={handleSidebarSelect}
          activeIndex={activeSidebarItem}
          onLogout={handleLogout}
          onManagerChange={handleManagerChange}
        />
      ) : activeTab === 'Home' ? null : (
        <Sidebar
          onSelect={handleSidebarSelect}
          activeIndex={activeSidebarItem}
          onLogout={handleLogout}
          onManagerChange={handleManagerChange}
          selectedManager={selectedManager}
          user={user}
          onGoHome={() => handleTabChange('Home')}
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
            navBackdrop={getEquityNavbarBackdrop(equityManagerMenuItems[activeSidebarItem]?.name)}
            fullWidth={activeTab === 'Home'}
          />
        )}

        {selectedManager === 'equity' &&
          activeTab !== 'Home' &&
          !['User Requests', 'Admin Approvals', 'Activity Log'].includes(activeTab) && (
            <DynamicHeader />
          )}

        <div
          className={
            selectedManager === 'wealth'
              ? 'wm-content'
              : `dashboard-content${
                  activeTab === 'Home'
                    ? ' dashboard-content--landing'
                    : ['User Requests', 'Admin Approvals', 'Activity Log'].includes(activeTab)
                      ? ' dashboard-content--governance'
                      : ''
                }`
          }
        >
          {activeTab === 'Financial Reporting Notes' ? (
            <FinancialReportingNotes
              context={tabContext}
              onTabChange={handleTabChange}
            />
          ) : (
            <div key={activeTab}>
              {selectedManager === 'equity' &&
              user &&
              !canAccessTab(user, activeTab, equityManagerMenuItems) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                  <h3>Access Denied</h3>
                  <p>You do not have permission to view this section.</p>
                </div>
              ) : (
                tabToComponent[activeTab] || (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <h3>Component Not Found</h3>
                    <p>The requested component is not available.</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modals outside .wm-root so Wealth sharp-corner override does not flatten them */}
      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onPasswordChanged={handlePasswordChanged}
        variant={selectedManager === 'wealth' ? 'wealth' : 'equity'}
      />

      {ownerReadOnlyPopup && (
        <div className="owner-readonly-modal-backdrop" role="presentation">
          <div
            className="owner-readonly-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-readonly-title"
          >
            <h2 id="owner-readonly-title">{ownerReadOnlyPopup.title}</h2>
            <p>{ownerReadOnlyPopup.message}</p>
            <button
              type="button"
              className="owner-readonly-modal-btn"
              onClick={() => setOwnerReadOnlyPopup(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {BLUX_ENABLED && (
        <>
          <AIAssistantDock
            open={aiAssistantOpen}
            onClose={() => setAiAssistantOpen(false)}
          />

          {selectedManager === 'equity' && (
            <GlobalBlux onOpenAIAssistant={() => setAiAssistantOpen(true)} />
          )}
        </>
      )}
    </>
  );
}

export default App;
