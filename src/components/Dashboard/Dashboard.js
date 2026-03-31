import React, { useState, useEffect, useCallback } from 'react';
import { tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import { realizedPnLService } from '../../services/realizedPnLService';
import { authService } from '../../services/authService';
import RiskReturnScatterPlot from './RiskReturnScatterPlot';
import './Dashboard.css';

function formatLkrCompact(value) {
  const n = Number(value) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}LKR ${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}LKR ${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e5) return `${sign}LKR ${(abs / 1e3).toFixed(0)}K`;
  return `${sign}LKR ${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// Mock portfolio health / insights data for right column (frontend only)
const MOCK_PORTFOLIO_HEALTH = {
  score: 82,
  status: 'Healthy',
  diversification: 'Good',
  maxDrawdown: '-6.3%',
  concentration: 'Moderate (top position 14.2%)'
};

const MOCK_DASHBOARD_ALERTS = [
  {
    type: 'risk',
    severity: 'high',
    title: 'High single-name exposure',
    message: 'SIRA.N is at 14.2% of portfolio value'
  },
  {
    type: 'rebalance',
    severity: 'medium',
    title: 'Rebalance suggestion',
    message: 'Trim Manufacturing by 5% and add to Consumer Goods'
  },
  {
    type: 'event',
    severity: 'low',
    title: 'Dividend ex-date tomorrow',
    message: 'AGAL.N – LKR 1.25 per share'
  }
];

const MOCK_LIQUIDITY = {
  cashAvailable: 1250000,
  cashPct: 8.4,
  t2Inflows: 430000,
  t2Outflows: 275000,
  liquidWithin3d: 18250000
};

const MOCK_BENCHMARK = {
  name: 'CSE All-Share Index',
  portfolioYTD: 12.4,
  benchmarkYTD: 9.1,
  alpha: 3.3,
  beta: 0.92
};

const MOCK_EVENTS = [
  { date: '2026-03-01', type: 'Dividend', symbol: 'AGAL.N', note: 'Dividend payment date' },
  { date: '2026-03-05', type: 'AGM', symbol: 'TJL.N', note: 'Annual General Meeting – Colombo' },
  { date: '2026-03-10', type: 'Rights Issue', symbol: 'AEL.N', note: 'Rights subscription closes' }
];

const MOCK_WATCHLIST = [
  {
    symbol: 'JKH.N',
    name: 'JOHN KEELLS HOLDINGS PLC',
    lastPrice: 195.5,
    changePct: 1.8,
    status: 'Watch for entry'
  },
  {
    symbol: 'COMB.N',
    name: 'COMMERCIAL BANK PLC',
    lastPrice: 92.3,
    changePct: -0.6,
    status: 'Oversold zone'
  },
  {
    symbol: 'DIAL.N',
    name: 'DIALOG AXIATA PLC',
    lastPrice: 14.2,
    changePct: 0.0,
    status: 'Sideways'
  }
];

const Dashboard = ({ onTabChange }) => {
  const [dashboardData, setDashboardData] = useState({
    activePortfolios: 0,
    recentTransactions: [],
    topPerformers: [],
    marketAlerts: [],
    sectorData: [],
    sectorLegend: [],
    totalCompanies: 0,
    sectorChartPortfolioName: null,
    pnlMetrics: {
      totalRealizedCapitalGain: 0,
      realizedPnL: 0,
      totalUnrealizedCapitalGain: 0,
      unrealizedPnL: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userRegion, setUserRegion] = useState('');
  const [, setPortfoliosList] = useState([]);
  const [selectedPortfolioKey, setSelectedPortfolioKey] = useState(null);

  // Load user region from localStorage or API
  useEffect(() => {
    const loadUserRegion = () => {
      try {
        // Try to get user data from localStorage first
        const storedUser = authService.getStoredUser();
        if (storedUser && storedUser.fundsCenter) {
          setUserRegion(storedUser.fundsCenter);
        } else {
          // If not in localStorage, fetch from API
          const token = localStorage.getItem('token');
          if (token) {
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/auth/me`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
              .then(response => response.json())
              .then(data => {
                if (data.user && data.user.fundsCenter) {
                  setUserRegion(data.user.fundsCenter);
                }
              })
              .catch(error => {
                console.error('Error fetching user region:', error);
              });
          }
        }
      } catch (error) {
        console.error('Error loading user region:', error);
      }
    };

    loadUserRegion();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if market is open (9:30 AM to 2:30 PM)
  const isMarketOpen = (date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentTime = hour * 60 + minute;
    const openTime = 9 * 60 + 30; // 9:30 AM
    const closeTime = 14 * 60 + 30; // 2:30 PM
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  // Get market status
  const getMarketStatus = (date) => {
    const isOpen = isMarketOpen(date);
    return {
      status: isOpen ? 'Open' : 'Closed',
      subtitle: isOpen ? 'Trading normally' : 'Market closed',
      isLive: isOpen
    };
  };

  // Sector color mapping function - Beautiful blue shades
  const getSectorColor = (index) => {
    const blueShades = [
      '#1E40AF', // Deep blue
      '#3B82F6', // Blue
      '#60A5FA', // Light blue
      '#93C5FD', // Lighter blue
      '#DBEAFE', // Very light blue
      '#1D4ED8', // Darker blue
      '#2563EB', // Medium blue
      '#3B82F6', // Standard blue
      '#60A5FA', // Light blue
      '#93C5FD'  // Very light blue
    ];
    return blueShades[index % blueShades.length];
  };

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Get active portfolios count
      const token = localStorage.getItem('token');
      const portfoliosResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/portfolios/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      let activePortfolios = 0;
      let recentTransactions = [];
      let topPerformers = [];
      let marketAlerts = [];
      let sectorData = [];
      let sectorLegend = [];
      let totalCompanies = 0;
      let sectorChartPortfolioName = null;
      let pnlMetrics = {
        totalRealizedCapitalGain: 0,
        realizedPnL: 0,
        totalUnrealizedCapitalGain: 0,
        unrealizedPnL: 0
      };

      let portfolios = [];
      let effectiveKey = null;
      if (portfoliosResponse.ok) {
        portfolios = await portfoliosResponse.json();
        activePortfolios = portfolios.length;
        setPortfoliosList(portfolios);

        console.log('🔍 DASHBOARD DEBUG - Available portfolios:', portfolios);

        const portfolioIds = portfolios.map((p) => String(p.id));
        effectiveKey =
          portfolios.length === 0
            ? null
            : selectedPortfolioKey != null &&
                portfolioIds.includes(String(selectedPortfolioKey))
              ? String(selectedPortfolioKey)
              : String(portfolios[0].id);

        if (portfolios.length > 0 && effectiveKey !== String(selectedPortfolioKey)) {
          setSelectedPortfolioKey(effectiveKey);
        }
        if (portfolios.length === 0) {
          setSelectedPortfolioKey(null);
        }
      } else {
        setPortfoliosList([]);
        setSelectedPortfolioKey(null);
      }

      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      // Run in parallel with P&L below (no dependency on portfolio id)
      const txPromise = Promise.all([
        tradeSummaryAPI.getBuyTransactions(),
        transactionEntryAPI.getAllSellTransactions()
      ]);
      const holdingsPromise = fetch(`${apiBase}/portfolios/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
        .then(async (holdingsResponse) => {
          if (!holdingsResponse.ok) return null;
          return holdingsResponse.json();
        })
        .catch((holdingsError) => {
          console.error('Error fetching holdings data:', holdingsError);
          return null;
        });

      if (portfoliosResponse.ok && portfolios.length > 0 && effectiveKey != null) {
          const selectedPortfolio =
            portfolios.find((p) => String(p.id) === effectiveKey) || portfolios[0];
          const nameFromApi = selectedPortfolio.portfolioName
            ? String(selectedPortfolio.portfolioName).trim()
            : '';
          sectorChartPortfolioName = nameFromApi || null;
          const portfolioId = selectedPortfolio.id;
          const realizedPortfolioId = selectedPortfolio.portfolioId || portfolioId;
          console.log('🔍 DASHBOARD DEBUG - Using portfolio ID:', portfolioId, selectedPortfolio);
          console.log('🔍 DASHBOARD DEBUG - Portfolio structure:', {
            id: selectedPortfolio.id,
            portfolioId: selectedPortfolio.portfolioId,
            portfolioName: selectedPortfolio.portfolioName
          });

          console.log('🔍 DASHBOARD DEBUG - Fetching realized P&L + MTM in parallel for:', realizedPortfolioId);

          const [realizedData, mtmData] = await Promise.all([
            realizedPnLService.getCompleteData(realizedPortfolioId, '1Y').catch((realizedError) => {
              console.error('❌ DASHBOARD DEBUG - Error fetching realized P&L data:', realizedError);
              return null;
            }),
            transactionEntryAPI.getPortfolioPositions(portfolioId).catch((mtmError) => {
              console.error('❌ DASHBOARD DEBUG - Error fetching MTM data for unrealized values:', mtmError);
              return null;
            })
          ]);

          console.log('🔍 DASHBOARD DEBUG - Realized P&L data received:', realizedData);
          console.log('🔍 DASHBOARD DEBUG - MTM data for unrealized calculations:', mtmData);

          if (realizedData && realizedData.portfolioSummary) {
            const summary = realizedData.portfolioSummary;
            const netRealizedCapitalGain = summary.netRealizedPnL || 0;
            const realizedPnL = realizedData.realizedPnL || 0;
            console.log('🔍 DASHBOARD DEBUG - Calculated realized values:', {
              netRealizedCapitalGain,
              realizedPnL,
              totalRealizedGains: summary.totalRealizedGains,
              totalRealizedLosses: summary.totalRealizedLosses,
              netRealizedPnL: summary.netRealizedPnL,
              properRealizedPnL: realizedData.realizedPnL,
              source: 'RealizedPnL complete data service'
            });
            pnlMetrics.totalRealizedCapitalGain = netRealizedCapitalGain;
            pnlMetrics.realizedPnL = realizedPnL;
          } else {
            console.warn('⚠️ DASHBOARD DEBUG - No realized P&L data available or invalid response structure');
            console.warn('⚠️ Response structure:', {
              hasData: !!realizedData,
              hasPortfolioSummary: !!(realizedData && realizedData.portfolioSummary),
              dataKeys: realizedData ? Object.keys(realizedData) : []
            });
          }

          if (mtmData && mtmData.length > 0) {
            console.log('🔍 DASHBOARD DEBUG - MTM data sample (first 2 items):', mtmData.slice(0, 2));
            const totalCost = mtmData.reduce((sum, item) => sum + (item.costValue || 0), 0);
            const totalGrossSales = mtmData.reduce((sum, item) => sum + (item.grossSales || 0), 0);
            const totalCharges = mtmData.reduce((sum, item) => sum + (item.charges || 0), 0);
            const totalProjectedSalesWithCOF = mtmData.reduce((sum, item) => sum + (item.projectedSalesWithCOF || 0), 0);
            const totalUnrealizedCapitalGain = totalGrossSales - totalCost;
            const unrealizedPnL = totalProjectedSalesWithCOF - (totalCost + totalCharges);
            console.log('🔍 DASHBOARD DEBUG - Step-by-step calculations:', {
              totalCost,
              totalGrossSales,
              totalCharges,
              totalProjectedSalesWithCOF,
              totalUnrealizedCapitalGain: `${totalGrossSales} - ${totalCost} = ${totalUnrealizedCapitalGain}`,
              unrealizedPnL: `${totalProjectedSalesWithCOF} - (${totalCost} + ${totalCharges}) = ${unrealizedPnL}`
            });
            pnlMetrics.totalUnrealizedCapitalGain = totalUnrealizedCapitalGain;
            pnlMetrics.unrealizedPnL = unrealizedPnL;
            console.log('🔍 DASHBOARD DEBUG - Calculated unrealized values from MTM screen:', {
              totalUnrealizedCapitalGain,
              unrealizedPnL,
              totalCost,
              totalGrossSales,
              totalCharges,
              totalProjectedSalesWithCOF,
              source: 'MarkToMarketValuation screen',
              mtmScreenReference: 'Lines 476-486, 1157-1158',
              pnlMetricsAfterUnrealized: pnlMetrics
            });
            console.log('🔍 DASHBOARD DEBUG - FINAL P&L METRICS:', {
              totalRealizedCapitalGain: pnlMetrics.totalRealizedCapitalGain,
              realizedPnL: pnlMetrics.realizedPnL,
              totalUnrealizedCapitalGain: pnlMetrics.totalUnrealizedCapitalGain,
              unrealizedPnL: pnlMetrics.unrealizedPnL
            });
          } else {
            console.log('🔍 DASHBOARD DEBUG - No MTM data available for unrealized calculations');
          }
      }

      // Await buys/sells + holdings (requests started above, in parallel with P&L when applicable)
      try {
        console.log('Fetching real transactions and holdings from database...');
        const [[buyTransactions, sellTransactions], holdingsResult] = await Promise.all([
          txPromise,
          holdingsPromise
        ]);

        console.log('Buy transactions:', buyTransactions);
        console.log('Sell transactions:', sellTransactions);

        // Combine and sort all transactions by date
        const allTransactions = [
          ...buyTransactions.map(tx => ({ 
            ...tx, 
            type: 'BUY',
            symbol: tx.symbol || 'N/A',
            quantity: tx.quantity || 0,
            price: tx.price || 0,
            date: tx.trade_date || tx.created_at,
            portfolio: tx.portfolio || 'N/A',
            company: tx.company_name || 'N/A'
          })),
          ...sellTransactions.map(tx => ({ 
            ...tx, 
            type: 'SELL',
            symbol: tx.symbol || 'N/A',
            quantity: tx.quantity || 0,
            price: tx.price || 0,
            date: tx.trade_date || tx.created_at,
            portfolio: tx.portfolio || 'N/A',
            company: tx.company_name || 'N/A'
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10); // Get latest 10

        recentTransactions = allTransactions;
        console.log('Combined recent transactions:', recentTransactions);

        // Calculate top performers from buy transactions
        const performerMap = new Map();
        buyTransactions.forEach(tx => {
          const key = tx.symbol || 'N/A';
          if (performerMap.has(key)) {
            const existing = performerMap.get(key);
            existing.totalValue += (tx.quantity || 0) * (tx.price || 0);
            existing.transactionCount += 1;
            existing.totalQuantity += (tx.quantity || 0);
          } else {
            performerMap.set(key, {
              symbol: key,
              name: tx.company_name || 'Unknown',
              totalValue: (tx.quantity || 0) * (tx.price || 0),
              transactionCount: 1,
              totalQuantity: tx.quantity || 0
            });
          }
        });

        topPerformers = Array.from(performerMap.values())
          .map(performer => ({
            symbol: performer.symbol,
            name: performer.name,
            avgPrice: performer.totalQuantity > 0 ? performer.totalValue / performer.totalQuantity : 0,
            transactionCount: performer.transactionCount
          }))
          .sort((a, b) => b.transactionCount - a.transactionCount)
          .slice(0, 5);

        marketAlerts = [
          { type: 'success', message: `Loaded ${recentTransactions.length} recent transactions` },
          { type: 'info', message: `${activePortfolios} active portfolios found` }
        ];

        // Holdings from portfolio overview API (same as Portfolio Overview) — fetched in parallel above
        let holdingsData = [];
        if (holdingsResult && holdingsResult.success && holdingsResult.data && holdingsResult.data.holdings) {
          holdingsData = holdingsResult.data.holdings;
          console.log('Holdings data response:', holdingsResult);
          console.log('Fetched holdings data:', holdingsData);
        }

        // Process holdings data using the same approach as Portfolio Overview
        const sectorMap = {};
        
        holdingsData.forEach(holding => {
          const sector = holding.sector || 'Unknown';
          if (sectorMap[sector]) {
            sectorMap[sector] += holding.marketValue;
          } else {
            sectorMap[sector] = holding.marketValue;
          }
        });

        console.log('Sector map from holdings:', sectorMap);

        // Convert to sector data array (same as Portfolio Overview)
        const sectorDataArray = Object.entries(sectorMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const totalSectorValue = sectorDataArray.reduce((sum, sector) => sum + sector.value, 0);
        
        // Generate pie chart segments (same as Portfolio Overview)
        let cumulativePercentage = 0;
        sectorData = sectorDataArray.map((sector, index) => {
          const percentage = (sector.value / totalSectorValue) * 100;
          const startAngle = (cumulativePercentage / 100) * 360;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
          
          cumulativePercentage += percentage;
          
          return {
            name: sector.name,
            value: sector.value,
            percentage: Math.round(percentage * 10) / 10,
            color: getSectorColor(index),
            startAngle: startAngle,
            endAngle: endAngle
          };
        });

        // Generate sector legend (same as Portfolio Overview)
        sectorLegend = sectorData.map(sector => ({
          name: sector.name,
          value: sector.value,
          percentage: sector.percentage,
          color: sector.color
        }));

        totalCompanies = sectorData.length;

        console.log('Generated sector pie data from holdings:', sectorData);
        console.log('Generated sector legend:', sectorLegend);
        console.log('Total sectors:', totalCompanies);

        // Use real data or empty arrays
        if (sectorData.length === 0 || (sectorData.length === 1 && sectorData[0].name === 'Unknown')) {
          console.log('No real holdings data available for sector chart');
          sectorData = [];
          sectorLegend = [];
          totalCompanies = 0;
        } else {
          console.log('Using real holdings data for sector chart:', sectorData);
        }

      } catch (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        
        // Use empty data if transaction fetch fails
        recentTransactions = [];
        topPerformers = [];
        marketAlerts = [
          { type: 'error', message: 'Failed to load transaction data' }
        ];
        sectorData = [];
        sectorLegend = [];
        totalCompanies = 0;
      }

      console.log('🔍 DASHBOARD DEBUG - Final pnlMetrics before setting state:', pnlMetrics);
      
      setDashboardData({
        activePortfolios,
        recentTransactions,
        topPerformers: topPerformers.map(performer => ({
          symbol: performer.symbol || 'N/A',
          name: performer.name || 'Unknown',
          avgPrice: performer.avgPrice || 0,
          transactionCount: performer.transactionCount || 0
        })),
        marketAlerts: marketAlerts,
        sectorData: sectorData,
        sectorLegend: sectorLegend,
        totalCompanies: totalCompanies,
        sectorChartPortfolioName,
        pnlMetrics: pnlMetrics
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setPortfoliosList([]);
      // Set empty data on error
      setDashboardData({
        activePortfolios: 0,
        recentTransactions: [],
        topPerformers: [],
        marketAlerts: [
          { type: 'error', message: 'Failed to load dashboard data. Please try again.' }
        ],
        sectorData: [],
        sectorLegend: [],
        totalCompanies: 0,
        sectorChartPortfolioName: null,
        pnlMetrics: {
          totalRealizedCapitalGain: 0,
          realizedPnL: 0,
          totalUnrealizedCapitalGain: 0,
          unrealizedPnL: 0
        }
      });
      setIsLoading(false);
    }
  }, [selectedPortfolioKey]);

  useEffect(() => {
    // TODO: Replace with actual API calls
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const marketStatus = getMarketStatus(currentTime);

  const portfolioCount = dashboardData.activePortfolios ?? 0;
  const sectorChartName = dashboardData.sectorChartPortfolioName;
  let sectorDistributionSubtitle = 'Sector mix for your portfolio';
  if (sectorChartName) {
    sectorDistributionSubtitle =
      portfolioCount > 1
        ? `Sector mix for ${sectorChartName} — other portfolios not included`
        : `Sector mix for ${sectorChartName}`;
  } else if (portfolioCount > 1) {
    sectorDistributionSubtitle = `One portfolio at a time (${portfolioCount} on your account) — not a combined view`;
  }

  return (
    <div className="equity-dashboard">
      <header className="dashboard-hero" aria-label="Portfolio snapshot">
        <div className="dashboard-hero__intro">
          <p className="dashboard-hero__eyebrow">Portfolio snapshot</p>
          {portfoliosList.length > 1 ? (
            <div className="dashboard-hero__portfolio-field">
              <label htmlFor="dashboard-portfolio-select" className="dashboard-hero__meta-label">
                Portfolio
              </label>
              <select
                id="dashboard-portfolio-select"
                className="dashboard-hero__portfolio-select"
                value={selectedPortfolioKey != null ? String(selectedPortfolioKey) : ''}
                onChange={(e) => setSelectedPortfolioKey(e.target.value)}
              >
                {portfoliosList.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.portfolioName || p.name || `Portfolio ${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="dashboard-hero__note">
              {portfoliosList.length === 1
                ? `${selectedPortfolioName} · P&L and chart use this portfolio`
                : 'No active portfolios · add a portfolio to see P&L'}
            </p>
          )}
          {portfoliosList.length > 1 && (
            <p className="dashboard-hero__note dashboard-hero__note--tight">
              P&amp;L and risk–return chart follow the selection above.
            </p>
          )}
        </div>
        <div className="dashboard-hero__primary">
          <span className="dashboard-hero__primary-label">Unrealized P&amp;L</span>
          <span
            className={`dashboard-hero__primary-value ${
              dashboardData.pnlMetrics.unrealizedPnL < 0 ? 'is-negative' : ''
            }`}
          >
            LKR{' '}
            {new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(dashboardData.pnlMetrics.unrealizedPnL)}
          </span>
        </div>
        <div className="dashboard-hero__meta" role="list">
          <div className="dashboard-hero__meta-item" role="listitem">
            <span className="dashboard-hero__meta-label">Market</span>
            <span
              className={`dashboard-hero__pill ${
                marketStatus.isLive ? 'is-open' : 'is-closed'
              }`}
            >
              {marketStatus.status}
            </span>
          </div>
          <div className="dashboard-hero__meta-item" role="listitem">
            <span className="dashboard-hero__meta-label">Portfolios</span>
            <span className="dashboard-hero__meta-value">
              {dashboardData.activePortfolios}
            </span>
          </div>
          <div className="dashboard-hero__meta-item" role="listitem">
            <span className="dashboard-hero__meta-label">Realized P&amp;L</span>
            <span className="dashboard-hero__meta-value">
              {formatLkrCompact(dashboardData.pnlMetrics.realizedPnL)}
            </span>
          </div>
          <div className="dashboard-hero__meta-item" role="listitem">
            <span className="dashboard-hero__meta-label">Net realized cap.</span>
            <span className="dashboard-hero__meta-value">
              {formatLkrCompact(dashboardData.pnlMetrics.totalRealizedCapitalGain)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="main-grid">
        {/* Left Column */}
        <div className="left-column">
          {/* Market status — no card container; sits on dashboard background */}
          <div className="market-status-bare">
            <div className="market-status-bare__top">
              <h3 className="market-status-bare__title">Market Status</h3>
              <p
                className={`market-status-bare__state ${marketStatus.isLive ? 'is-open' : 'is-closed'}`}
              >
                {marketStatus.status}
              </p>
            </div>
            <div className="market-status-bare__hours">
              <div className="market-status-bare__hour">
                <span className="market-status-bare__label">Opening</span>
                <span className="market-status-bare__value">9:30 AM</span>
              </div>
              <div className="market-status-bare__hour">
                <span className="market-status-bare__label">Closing</span>
                <span className="market-status-bare__value">2:30 PM</span>
              </div>
            </div>
            {userRegion && <div className="market-status-bare__region">{userRegion}</div>}
            <div className="market-status-bare__clock">
              <span className="market-status-bare__time">{formatTime(currentTime)}</span>
              <span className="market-status-bare__date">{formatDate(currentTime)}</span>
            </div>
          </div>

        {/* Risk-return scatter (was Sector Activity mock) */}
        <div className="content-card heatmap-card dashboard-chart-lead">
          <RiskReturnScatterPlot syncedPortfolioId={selectedPortfolioKey} />
        </div>

        {/* Top Performers */}
        <div className="content-card">
          <div className="card-header">
            <div className="header-left">
              <h3>Top Performers</h3>
              <span className="card-subtitle">Most traded stocks</span>
            </div>
          </div>
          <div className="performers-container">
            {dashboardData.topPerformers.map((performer, index) => (
              <div key={index} className="performer-card">
                <div className="performer-rank">
                  <span>{index + 1}</span>
                </div>
                <div className="performer-info">
                  <div className="performer-symbol">{performer.symbol || 'N/A'}</div>
                  <div className="performer-name">{performer.name || 'Unknown'}</div>
                </div>
                <div className="performer-stats">
                  <div className="performer-trades">{performer.transactionCount || 0} trades</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="content-card">
          <div className="card-header">
            <div className="header-left">
              <h3>Recent Transactions</h3>
              <span className="card-subtitle">Latest trading activity</span>
            </div>
          </div>
          <div className="transactions-container">
            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              <>
                {dashboardData.recentTransactions.slice(0, 7).map(transaction => (
                  <div
                    key={transaction.id}
                    className={`transaction-card ${
                      (transaction.type || 'BUY') === 'SELL' ? 'sell' : 'buy'
                    }`}
                  >
                    <div className="transaction-left">
                      <div
                        className={`transaction-badge ${
                          (transaction.type || 'BUY').toLowerCase() === 'sell'
                            ? 'sell'
                            : 'buy'
                        }`}
                      >
                        {transaction.type || 'BUY'}
                      </div>
                      <div className="transaction-date">
                        {transaction.date
                          ? new Date(transaction.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="transaction-center">
                      <div className="transaction-symbol">{transaction.symbol || 'N/A'}</div>
                      {transaction.company && transaction.company !== 'N/A' && (
                        <div className="transaction-company">{transaction.company}</div>
                      )}
                    </div>
                    <div className="transaction-right">
                      <div className="transaction-quantity">
                        {Number(transaction.quantity || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        shares
                      </div>
                      <div
                        className={`transaction-price ${
                          (transaction.type || 'BUY') === 'SELL' ? 'sell' : 'buy'
                        }`}
                      >
                        {Number(
                          transaction.type === 'SELL'
                            ? transaction.sold_price || transaction.price || 0
                            : transaction.price || 0
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <p>No recent transactions</p>
                <span>Start trading to see activity here</span>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Right Column */}
        <div className="right-column">
          {/* P&L Metrics */}
          <div className="pnl-metrics-grid">
            <div className="pnl-metric-card">
              <svg className="pnl-metric-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              <div className="metric-content">
                <span className="metric-title">Net Realized Capital Gain</span>
                <span className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(dashboardData.pnlMetrics.totalRealizedCapitalGain)}</span>
              </div>
            </div>

            <div className="pnl-metric-card primary">
              <svg className="pnl-metric-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              <div className="metric-content">
                <span className="metric-title">Realized P&L</span>
                <span className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(dashboardData.pnlMetrics.realizedPnL)}</span>
              </div>
            </div>

            <div className="pnl-metric-card">
              <svg className="pnl-metric-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
              <div className="metric-content">
                <span className="metric-title">Total Unrealized Capital Gain</span>
                <span className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(dashboardData.pnlMetrics.totalUnrealizedCapitalGain)}</span>
              </div>
            </div>

            <div className="pnl-metric-card primary">
              <svg className="pnl-metric-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21Z"/>
              </svg>
              <div className="metric-content">
                <span className="metric-title">Unrealized P&L</span>
                <span className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(dashboardData.pnlMetrics.unrealizedPnL)}</span>
              </div>
            </div>
          </div>

          {/* Sector Pie Chart */}
          <div className="content-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Sector Distribution</h3>
                <span className="card-subtitle">{sectorDistributionSubtitle}</span>
              </div>
            </div>
            <div className="chart-container">
              <div className="pie-chart">
                <svg width="200" height="200" viewBox="0 0 200 200" className="sector-pie-chart">
                  {dashboardData.sectorData && dashboardData.sectorData.length > 0 ? dashboardData.sectorData.map((sector, index) => {
                    const startAngle = sector.startAngle;
                    const endAngle = sector.endAngle;
                    const largeArcFlag = sector.percentage > 50 ? 1 : 0;
                    
                    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                    
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;
                    
                    const x1 = centerX + radius * Math.cos(startAngleRad);
                    const y1 = centerY + radius * Math.sin(startAngleRad);
                    const x2 = centerX + radius * Math.cos(endAngleRad);
                    const y2 = centerY + radius * Math.sin(endAngleRad);
                    
                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'Z'
                    ].join(' ');
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={sector.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="sector-slice"
                      />
                    );
                  }) : (
                    // Fallback circle if no data
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                  <circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="#fff"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    className="pie-center-text"
                    fontSize="12"
                    fontWeight="600"
                    fill="#374151"
                  >
                    {dashboardData.totalCompanies || 0}
                  </text>
                  <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="pie-center-text"
                    fontSize="10"
                    fill="#6B7280"
                  >
                    Sectors
                  </text>
                </svg>
              </div>
              <div className="chart-legend">
                {dashboardData.sectorLegend && dashboardData.sectorLegend.length > 0 ? dashboardData.sectorLegend.map((sector, index) => (
                  <div key={index} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: sector.color }}
                    ></div>
                    <div className="legend-content">
                      <div className="legend-label">{sector.name}</div>
                      <div className="legend-value">
                        {new Intl.NumberFormat('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(sector.value)} ({sector.percentage}%)
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="no-data-message">
                    <p>No sector data available</p>
              </div>
            )}
              </div>
          </div>
        </div>

          {/* Portfolio Health, Alerts & Liquidity (Mock Data) */}
          <div className="content-card health-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Portfolio Health & Risk</h3>
                <span className="card-subtitle">High-level view using sample data</span>
              </div>
            </div>

            <div className="health-layout">
              <div className="health-top">
                <div className="health-score">
                  <div className="health-score__label">Overall health</div>
                  <div className="health-score__value">
                    {MOCK_PORTFOLIO_HEALTH.score}
                    <span className="health-score__outof">/100</span>
                  </div>
                  <div className="health-score__status">
                    <span className="health-status-pill">{MOCK_PORTFOLIO_HEALTH.status}</span>
                  </div>
                </div>

                <div className="health-kpis" aria-label="Key risk indicators">
                  <div className="health-kpi">
                    <div className="health-kpi__label">Diversification</div>
                    <div className="health-kpi__value">{MOCK_PORTFOLIO_HEALTH.diversification}</div>
                  </div>
                  <div className="health-kpi">
                    <div className="health-kpi__label">Max drawdown</div>
                    <div className="health-kpi__value health-kpi__value--negative">
                      {MOCK_PORTFOLIO_HEALTH.maxDrawdown}
                    </div>
                  </div>
                  <div className="health-kpi">
                    <div className="health-kpi__label">Concentration</div>
                    <div className="health-kpi__value">{MOCK_PORTFOLIO_HEALTH.concentration}</div>
                  </div>
                </div>
              </div>

              <div className="health-bottom">
                <div className="health-block">
                  <div className="health-block__title">Alerts & tasks</div>
                  <ul className="health-alerts">
                    {MOCK_DASHBOARD_ALERTS.map((alert, index) => (
                      <li
                        key={index}
                        className={`health-alert health-alert--${alert.severity}`}
                      >
                        <div className="health-alert__title">{alert.title}</div>
                        <div className="health-alert__text">{alert.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="health-block">
                  <div className="health-block__title">Cash & liquidity</div>
                  <div className="health-liquidity">
                    <div className="health-liquidity__row">
                      <div className="health-liquidity__label">Available cash</div>
                      <div className="health-liquidity__value">
                        {formatLkrCompact(MOCK_LIQUIDITY.cashAvailable)}{' '}
                        <span className="health-liquidity__muted">({MOCK_LIQUIDITY.cashPct}%)</span>
                      </div>
                    </div>
                    <div className="health-liquidity__row">
                      <div className="health-liquidity__label">T+2 net</div>
                      <div className="health-liquidity__value">
                        {formatLkrCompact(MOCK_LIQUIDITY.t2Inflows - MOCK_LIQUIDITY.t2Outflows)}
                        <div className="health-liquidity__muted">
                          in {formatLkrCompact(MOCK_LIQUIDITY.t2Inflows)} / out{' '}
                          {formatLkrCompact(MOCK_LIQUIDITY.t2Outflows)}
                        </div>
                      </div>
                    </div>
                    <div className="health-liquidity__row">
                      <div className="health-liquidity__label">Liquid ≤ 3 days</div>
                      <div className="health-liquidity__value">
                        {formatLkrCompact(MOCK_LIQUIDITY.liquidWithin3d)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark, Events & Watchlist (Mock Data) */}
          <div className="content-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Insights & Upcoming (Mock)</h3>
                <span className="card-subtitle">
                  Sample view for benchmark, events and watchlist
                </span>
              </div>
            </div>
            <div className="insights-grid insights-grid-compact">
              <div className="insight-column">
                <div className="insight-section-title">
                  Performance vs {MOCK_BENCHMARK.name}
                </div>
                <div className="insight-row">
                  <span className="insight-label">Portfolio YTD</span>
                  <span className="insight-value">
                    {MOCK_BENCHMARK.portfolioYTD}%
                  </span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Benchmark YTD</span>
                  <span className="insight-value">
                    {MOCK_BENCHMARK.benchmarkYTD}%
                  </span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Alpha</span>
                  <span className="insight-value">
                    {MOCK_BENCHMARK.alpha}%
                  </span>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Beta</span>
                  <span className="insight-value">
                    {MOCK_BENCHMARK.beta}
                  </span>
                </div>
              </div>

              <div className="insight-column">
                <div className="insight-section-title">Upcoming events</div>
                <ul className="insight-list">
                  {MOCK_EVENTS.map((event, index) => (
                    <li key={index} className="insight-event">
                      <div className="insight-row">
                        <span className="insight-label">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="insight-value">
                          {event.type}
                        </span>
                      </div>
                      <div className="insight-row">
                        <span className="insight-label">{event.symbol}</span>
                        <span className="insight-value">
                          {event.note}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="insight-column">
                <div className="insight-section-title">Focus watchlist</div>
                <ul className="insight-list">
                  {MOCK_WATCHLIST.map((item, index) => (
                    <li key={index} className="insight-watch">
                      <div className="insight-row">
                        <span className="insight-label">{item.symbol}</span>
                        <span className="insight-value">
                          LKR {item.lastPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="insight-row">
                        <span className="insight-label">{item.name}</span>
                        <span
                          className="insight-value"
                          style={{
                            color:
                              item.changePct > 0
                                ? '#16a34a'
                                : item.changePct < 0
                                ? '#dc2626'
                                : '#6b7280'
                          }}
                        >
                          {item.changePct > 0 ? '+' : ''}
                          {item.changePct}%
                        </span>
                      </div>
                      <div className="insight-row">
                        <span className="insight-label">Status</span>
                        <span className="insight-value">{item.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        {/* Quick Actions */}
        <div className="content-card">
          <div className="card-header">
            <div className="header-left">
            <h3>Quick Actions</h3>
              <span className="card-subtitle">Common tasks</span>
            </div>
          </div>
          <div className="actions-grid">
            <button 
                className="action-card primary"
              onClick={() => onTabChange && onTabChange('Buy')}
            >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-title">New Trade</span>
                  <span className="action-subtitle">Execute buy/sell</span>
                </div>
            </button>
              
            <button 
                className="action-card secondary"
              onClick={() => onTabChange && onTabChange('Portfolio Overview')}
            >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-title">Portfolio Review</span>
                  <span className="action-subtitle">View holdings</span>
                </div>
            </button>
              
            <button 
                className="action-card secondary"
              onClick={() => onTabChange && onTabChange('Mark-to-Market Valuation')}
            >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-title">Market Analysis</span>
                  <span className="action-subtitle">Real-time data</span>
                </div>
            </button>
              
            <button 
                className="action-card secondary"
              onClick={() => onTabChange && onTabChange('Trade Report')}
            >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-title">Reports</span>
                  <span className="action-subtitle">Generate reports</span>
                </div>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer-section">
        <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Professional portfolio management dashboard • All data is encrypted and protected</p>
      </div>
    </div>
  );
};

export default Dashboard;
