import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import { realizedPnLService } from '../../services/realizedPnLService';
import { authService } from '../../services/authService';
import RiskReturnScatterPlot from './RiskReturnScatterPlot';
import DashboardSectorMixChart from './DashboardSectorMixChart';
import MarketNewsWidget from './MarketNewsWidget';
import DashboardMarketPulse from './DashboardMarketPulse';
import DashboardMarketMovers from './DashboardMarketMovers';
import './Dashboard.css';
import './LatestActivityCard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatPnlAmount = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const getPnlSign = (value) => {
  const n = Number(value) || 0;
  if (n > 0) return 'pos';
  if (n < 0) return 'neg';
  return 'flat';
};

const getPnlIndicator = (sign) => {
  if (sign === 'pos') return '▲';
  if (sign === 'neg') return '▼';
  return '◆';
};

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
    costVsMvBySector: [],
    holdingSymbols: [],
    holdingNames: [],
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
  const [portfoliosList, setPortfoliosList] = useState([]);
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
            fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/auth/me`, {
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

  // Check if market is open (9:30 AM to 2:30 PM, weekdays only — CSE closed Sat/Sun)
  const isMarketOpen = (date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;

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

  // Sector color mapping function — Balanced multi-hue
  // Mid-saturation tones (~50-60%): more presence than fully muted, but
  // avoids neon greens and bright reds. Hover state still highlights with
  // a more vivid version (see DashboardSectorMixChart.js).
  const getSectorColor = (index) => {
    const sectorPalette = [
      '#3B6FA8', // Steel blue
      '#4F9669', // Forest green
      '#D89E3A', // Warm amber
      '#C9624E', // Terracotta (replaces bright red)
      '#7B5FBF', // Indigo violet
      '#3FA0A8', // Teal
      '#8AA83C', // Olive green
      '#D77B45', // Burnt orange
      '#B85F8E', // Berry pink
      '#3F8FCF', // Sky blue
      '#5FA877', // Sage green (replaces neon green)
      '#A06FCB', // Purple
      '#3F9C8E', // Sea teal
      '#C49A2E', // Goldenrod
      '#A65349'  // Brick
    ];
    return sectorPalette[index % sectorPalette.length];
  };

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Get active portfolios count
      const token = localStorage.getItem('token');
      const portfoliosResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/portfolios/active`, {
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
      let costVsMvBySector = [];
      let holdingSymbols = [];
      let holdingNames = [];
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

      const apiBase = process.env.REACT_APP_API_URL || 'http://98.91.201.168/api';
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

            // Sector-wise cost vs market value is built later from holdings data
            // (MTM positions don't carry a sector field; holdings endpoint does).
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

        // Symbols / names for CSE Market Pulse (portfolio-aware ranking on dashboard)
        holdingSymbols = [
          ...new Set(holdingsData.map((h) => h.symbol).filter(Boolean))
        ];
        holdingNames = [
          ...new Set(
            holdingsData
              .map((h) => h.companyName || h.company_name || h.name)
              .filter(Boolean)
          )
        ];

        // Process holdings data using the same approach as Portfolio Overview
        const sectorMap = {};
        const sectorCostMvMap = new Map();

        holdingsData.forEach(holding => {
          const sector = holding.sector || 'Unknown';
          const marketValue = Number(holding.marketValue) || 0;
          const qty = Number(holding.quantity) || 0;
          const avg = Number(holding.avgPrice) || 0;
          const pnl = Number(holding.pnl) || 0;
          // Prefer derived cost from (marketValue - pnl) when both are present (matches backend),
          // else fall back to qty * avgPrice.
          const cost =
            holding.marketValue != null && holding.pnl != null
              ? marketValue - pnl
              : qty * avg;

          if (sectorMap[sector]) {
            sectorMap[sector] += marketValue;
          } else {
            sectorMap[sector] = marketValue;
          }

          const cur = sectorCostMvMap.get(sector) || { sector, cost: 0, marketValue: 0 };
          cur.cost += cost;
          cur.marketValue += marketValue;
          sectorCostMvMap.set(sector, cur);
        });

        costVsMvBySector = [...sectorCostMvMap.values()]
          .map((s) => ({ ...s, unrealised: s.marketValue - s.cost }))
          .sort((a, b) => b.marketValue - a.marketValue);

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
        holdingSymbols = [];
        holdingNames = [];
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
        costVsMvBySector,
        holdingSymbols,
        holdingNames,
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
        costVsMvBySector: [],
        holdingSymbols: [],
        holdingNames: [],
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

  const costVsMvSectors = useMemo(() => {
    const list = Array.isArray(dashboardData.costVsMvBySector) ? dashboardData.costVsMvBySector : [];
    if (list.length <= 8) return list;
    const top = list.slice(0, 7);
    const rest = list.slice(7);
    const otherCost = rest.reduce((s, r) => s + (r.cost || 0), 0);
    const otherMv = rest.reduce((s, r) => s + (r.marketValue || 0), 0);
    return [
      ...top,
      {
        sector: `Others (${rest.length})`,
        cost: otherCost,
        marketValue: otherMv,
        unrealised: otherMv - otherCost
      }
    ];
  }, [dashboardData.costVsMvBySector]);

  const costVsMvChartData = useMemo(
    () => ({
      labels: costVsMvSectors.map((s) => s.sector),
      datasets: [
        {
          label: 'Cost',
          data: costVsMvSectors.map((s) => s.cost || 0),
          backgroundColor: '#94a3b8',
          borderColor: '#64748b',
          borderWidth: 0,
          borderRadius: 0,
          maxBarThickness: 22,
          categoryPercentage: 0.7,
          barPercentage: 0.9
        },
        {
          label: 'Market value',
          data: costVsMvSectors.map((s) => s.marketValue || 0),
          backgroundColor: '#3b82f6',
          borderColor: '#1e40af',
          borderWidth: 0,
          borderRadius: 0,
          maxBarThickness: 22,
          categoryPercentage: 0.7,
          barPercentage: 0.9
        }
      ]
    }),
    [costVsMvSectors]
  );

  const costVsMvChartOptions = useMemo(() => {
    const monoFont =
      "'IBM Plex Mono', 'Roboto Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: '#1e293b',
            font: { size: 11, weight: '600', family: monoFont },
            usePointStyle: false,
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#1e293b',
          borderColor: '#0f172a',
          borderWidth: 1,
          titleFont: { size: 11, weight: '700', family: monoFont },
          bodyFont: { size: 10, weight: '500', family: monoFont },
          titleMarginBottom: 6,
          padding: 10,
          cornerRadius: 0,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items?.[0]?.dataIndex ?? 0;
              const row = costVsMvSectors[idx];
              const sector = row ? row.sector : items?.[0]?.label;
              return (sector || '').toString().toUpperCase();
            },
            label: (ctx) => {
              const label = (ctx.dataset.label || '').toString().toUpperCase();
              const value = formatLkrCompact(Number(ctx.raw) || 0);
              return `${label.padEnd(12, ' ')}${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: '#1e293b',
            font: { size: 10, family: monoFont },
            maxRotation: 40,
            minRotation: 0,
            autoSkip: false,
            autoSkipPadding: 6,
            callback: function (value) {
              const label = this.getLabelForValue(value);
              if (typeof label !== 'string') return label;
              return label.length > 16 ? `${label.slice(0, 15)}…` : label;
            }
          },
          border: { color: '#0f172a' }
        },
        y: {
          ticks: {
            callback: (v) => formatLkrCompact(v),
            color: '#1e293b',
            font: { size: 10, family: monoFont },
            padding: 4
          },
          grid: { color: '#e2e8f0', drawTicks: false, drawBorder: false },
          border: { color: '#0f172a' }
        }
      }
    };
  }, [costVsMvSectors]);

  const watchlistSymbols = useMemo(
    () => MOCK_WATCHLIST.map((w) => w.symbol).filter(Boolean),
    []
  );

  const selectedPortfolio =
    portfoliosList.find((p) => String(p.id) === String(selectedPortfolioKey)) ||
    portfoliosList[0] ||
    null;
  const selectedPortfolioName = selectedPortfolio
    ? selectedPortfolio.portfolioName || selectedPortfolio.name || `Portfolio ${selectedPortfolio.id}`
    : '';

  const marketPulseEl = (
    <DashboardMarketPulse
      holdingSymbols={dashboardData.holdingSymbols || []}
      holdingNames={dashboardData.holdingNames || []}
      watchlistSymbols={watchlistSymbols}
      onNavigate={onTabChange}
      portfolioName={selectedPortfolioName}
    />
  );

  const marketMoversEl = (
    <DashboardMarketMovers
      holdingSymbols={dashboardData.holdingSymbols || []}
      holdingNames={dashboardData.holdingNames || []}
      watchlistSymbols={watchlistSymbols}
    />
  );

  const portfolioHeroEl = (
    <header className="dashboard-hero dashboard-hero--portfolio-only" aria-label="Portfolio snapshot">
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
            {portfoliosList.length === 1 ? selectedPortfolioName : 'No active portfolios'}
          </p>
        )}
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <div className="equity-dashboard">
        <div className="dashboard-body">
          <div className="dashboard-body__left">{marketPulseEl}</div>
          <div className="dashboard-body__right">{marketMoversEl}</div>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
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
      <div className="dashboard-body">
        <div className="dashboard-body__left">
          {marketPulseEl}
          {portfolioHeroEl}
          <div className="left-column">
        {/* Risk-return scatter (was Sector Activity mock) */}
        <div className="content-card heatmap-card dashboard-chart-lead">
          <RiskReturnScatterPlot syncedPortfolioId={selectedPortfolioKey} />
        </div>

        {/* Market News (NewsAPI) */}
        <MarketNewsWidget onOpenFull={() => onTabChange && onTabChange('News & Events')} />

        {/* Top Performers */}
        <div className="content-card">
          <div className="card-header">
            <div className="header-left">
              <span className="card-subtitle">Most traded stocks</span>
            </div>
          </div>
          <div className="performers-container">
            {dashboardData.topPerformers.map((performer, index) => (
              <div key={index} className="performer-card">
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
        {(() => {
          const recentTx = dashboardData.recentTransactions || [];
          const buyCount = recentTx.filter(
            (t) => (t.type || 'BUY').toUpperCase() === 'BUY'
          ).length;
          const sellCount = recentTx.filter(
            (t) => (t.type || 'BUY').toUpperCase() === 'SELL'
          ).length;

          return (
            <div className="content-card latest-activity-card">
              <div className="card-header latest-activity-card__header">
                <div className="latest-activity-card__heading">
                  <div className="latest-activity-card__heading-text">
                    <h3 className="latest-activity-card__title-text">
                      Latest trading activity
                    </h3>
                    <span className="latest-activity-card__subtitle-text">
                      Recent buys &amp; sells across your portfolios
                    </span>
                  </div>
                </div>
                {recentTx.length > 0 && (
                  <div className="latest-activity-card__stats">
                    <span className="latest-activity-card__stat latest-activity-card__stat--buy">
                      <span className="latest-activity-card__stat-dot" />
                      {buyCount} Buys
                    </span>
                    <span className="latest-activity-card__stat latest-activity-card__stat--sell">
                      <span className="latest-activity-card__stat-dot" />
                      {sellCount} Sells
                    </span>
                  </div>
                )}
              </div>

              <div className="latest-activity-card__body transactions-container">
                {recentTx.length > 0 ? (
                  recentTx.slice(0, 7).map((transaction) => (
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
                        <div className="transaction-symbol">
                          {transaction.symbol || 'N/A'}
                        </div>
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
                  ))
                ) : (
                  <div className="latest-activity-card__empty">
                    <div className="latest-activity-card__empty-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                    </div>
                    <p className="latest-activity-card__empty-title">No recent transactions</p>
                    <span className="latest-activity-card__empty-text">
                      Start trading to see activity here
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
          </div>
        </div>

        <div className="dashboard-body__right">
          {/* Market status — single horizontal exchange strip */}
          <div
            className={`market-strip ${marketStatus.isLive ? 'market-strip--open' : 'market-strip--closed'}`}
            role="status"
            aria-label={`Market ${marketStatus.status.toLowerCase()}`}
          >
            <div className="market-strip__exchange">
              <div className="market-strip__exchange-text">
                <span className="market-strip__exchange-name">
                  {userRegion || 'Colombo Stock Exchange'}
                </span>
                <span className="market-strip__hours">
                  Opens 9:30 AM · Closes 2:30 PM
                </span>
              </div>
            </div>
            <div className="market-strip__clock">
              <span className="market-strip__time">{formatTime(currentTime)}</span>
              <span className="market-strip__date">{formatDate(currentTime)}</span>
            </div>
          </div>
          {marketMoversEl}
          <div className="right-column">
          {/* P&L Metrics */}
          <div className="pnl-stats">
            {[
              {
                key: 'realized-gain',
                label: 'Net Realized Capital Gain',
                value: dashboardData.pnlMetrics.totalRealizedCapitalGain
              },
              {
                key: 'realized-pnl',
                label: 'Realized P&L',
                value: dashboardData.pnlMetrics.realizedPnL
              },
              {
                key: 'unrealized-gain',
                label: 'Total Unrealized Capital Gain',
                value: dashboardData.pnlMetrics.totalUnrealizedCapitalGain
              },
              {
                key: 'unrealized-pnl',
                label: 'Unrealized P&L',
                value: dashboardData.pnlMetrics.unrealizedPnL
              }
            ].map((m) => {
              const sign = getPnlSign(m.value);
              return (
                <div key={m.key} className={`pnl-stat pnl-stat--${sign}`}>
                  <span className="pnl-stat__label">{m.label}</span>
                  <span className="pnl-stat__value">
                    <span className="pnl-stat__currency">LKR</span>{' '}
                    {formatPnlAmount(m.value)}
                  </span>
                  <span className="pnl-stat__delta" aria-hidden>
                    {getPnlIndicator(sign)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cost vs Market Value by Company */}
          <div className="content-card dashboard-cost-vs-mv-card">
            <div className="card-header">
              <div className="header-left">
                <span className="card-subtitle">
                  {costVsMvSectors.length > 0
                    ? 'Cost vs market value by sector'
                    : 'No position data available'}
                </span>
              </div>
            </div>
            <div className="cost-vs-mv-chart-container">
              {costVsMvSectors.length > 0 ? (
                <Bar data={costVsMvChartData} options={costVsMvChartOptions} />
              ) : (
                <div className="no-data-message">
                  <p>No position data available for this portfolio.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sector Pie Chart */}
          <div className="content-card dashboard-sector-mix-card">
            <div className="card-header">
              <div className="header-left">
                <span className="card-subtitle">{sectorDistributionSubtitle}</span>
              </div>
            </div>
            <div className="chart-container">
              <DashboardSectorMixChart
                sectorData={dashboardData.sectorData}
                totalCompanies={dashboardData.totalCompanies}
              />
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
              <span className="card-subtitle">Quick Actions</span>
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

            <button
              className="action-card secondary"
              onClick={() => onTabChange && onTabChange('Financial Reports Export')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
              </div>
              <div className="action-content">
                <span className="action-title">Reporting Download Center</span>
                <span className="action-subtitle">Excel &amp; PDF exports</span>
              </div>
            </button>
            </div>
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
