import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Home/Navbar';
import Sidebar from './components/Home/Sidebar';
import AuthContainer from './components/Auth/AuthContainer';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import UserProfileModal from './components/Auth/UserProfileModal';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import PortfolioOverview from './components/Dashboard/DashboardTabs/PortfolioOverview';
import EquityMasterEntry from './components/MasterDataManagement/EquityMasterEntry';
import BuyTransactionEntry from './components/TradeCapture/BuyTransactionEntry';
import SellTransactionEntry from './components/TradeCapture/SellTransactionEntry';
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
import MarkToMarketValuation from './components/ValuationAndMTM/MarkToMarketValuation';
import TradeSummaryData from './components/ValuationAndMTM/TradeSummaryData';
import TradeReport from './components/TradeSummary/TradeReport';


function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(['Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  const [fifoParams, setFifoParams] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  


  // Tab component mappings
  const tabToComponent = {
    'Dashboard': <Dashboard />,
    'Portfolio Overview': <PortfolioOverview />,
    'Market Summary': <Dashboard />,
    'Recent Activity': <Dashboard />,
    'Performance Metrics': <Dashboard />,
    'Equity Master': <EquityMasterEntry />,
    'Strategy Master':  <StrategyMaster/>,
    'Account Master': <AccountMaster/>,
    'Portfolio Master': <PortfolioMaster/>,
    'Valuation Method': <CostingMethodSelection/>,

    'Buy': <BuyTransactionEntry />,
    'Sell': <SellTransactionEntry setFifoParams={setFifoParams} setActiveTab={setActiveTab} />,
    'Market Price Feed': <TradeSummaryUpload />,
    'Mark-to-Market Valuation': <MarkToMarketValuation />,
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
    'Chart Of Accounts': <ChartOfAccounts />,
    'General Ledger': <GeneralLedger />,
    'Trade Report': <TradeReport />,
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

  // Handle tab selection from Navbar
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
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
      setVisibleTabs(['Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
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
    setVisibleTabs(['Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('Dashboard');
    setVisibleTabs(['Portfolio Overview', 'Market Summary', 'Recent Activity', 'Performance Metrics']);
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
