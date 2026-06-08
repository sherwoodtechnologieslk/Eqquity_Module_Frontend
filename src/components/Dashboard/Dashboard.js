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

// Compute live Portfolio Health & Risk metrics from real holdings + P&L data.
function computePortfolioHealth(holdings, sectorData) {
  const list = Array.isArray(holdings) ? holdings : [];
  const sectors = Array.isArray(sectorData) ? sectorData : [];

  const totalMarketValue = list.reduce((s, h) => s + (Number(h.marketValue) || 0), 0);
  const totalCost = list.reduce((s, h) => {
    const mv = Number(h.marketValue) || 0;
    const pnl = Number(h.pnl) || 0;
    const qty = Number(h.quantity) || 0;
    const avg = Number(h.avgPrice) || 0;
    return s + (h.marketValue != null && h.pnl != null ? mv - pnl : qty * avg);
  }, 0);

  if (list.length === 0 || totalMarketValue <= 0) {
    return {
      hasData: false,
      score: 0,
      status: 'No data',
      diversification: '—',
      holdingsCount: 0,
      sectorCount: 0,
      unrealizedReturnPct: 0,
      concentration: '—',
      concentrationDetail: '',
      alerts: [],
      valuation: { marketValue: 0, cost: 0, unrealized: 0, unrealizedPct: 0 }
    };
  }

  const holdingsCount = list.length;
  const sectorCount = sectors.length;

  // Holding weights → Herfindahl index → effective number of holdings.
  const hhi = list.reduce((s, h) => {
    const w = (Number(h.marketValue) || 0) / totalMarketValue;
    return s + w * w;
  }, 0);
  const effectiveN = hhi > 0 ? 1 / hhi : 0;

  const sortedByMv = [...list].sort(
    (a, b) => (Number(b.marketValue) || 0) - (Number(a.marketValue) || 0)
  );
  const topHolding = sortedByMv[0] || {};
  const topWeightPct = ((Number(topHolding.marketValue) || 0) / totalMarketValue) * 100;
  const topSymbol = topHolding.symbol || '—';

  const topSector = sectors[0] || null;
  const topSectorPct = topSector ? Number(topSector.percentage) || 0 : 0;
  const topSectorName = topSector ? topSector.name : '—';

  const unrealizedReturnPct = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0;

  // Score components: diversification (0-40), concentration (0-30), performance (0-30).
  const divScore = Math.max(0, Math.min(40, (effectiveN / 10) * 40));
  const concScore = Math.max(0, Math.min(30, 30 - Math.max(0, topWeightPct - 10) * 1.2));
  const perfScore = Math.max(0, Math.min(30, 15 + unrealizedReturnPct));
  const score = Math.round(divScore + concScore + perfScore);

  const status = score >= 75 ? 'Healthy' : score >= 50 ? 'Moderate' : 'At risk';
  const diversification = effectiveN >= 8 ? 'Good' : effectiveN >= 4 ? 'Moderate' : 'Low';
  const concentration = topWeightPct <= 10 ? 'Low' : topWeightPct <= 20 ? 'Moderate' : 'High';

  // Dynamic alerts derived from real positions.
  const alerts = [];
  if (topWeightPct > 15) {
    alerts.push({
      severity: topWeightPct > 25 ? 'high' : 'medium',
      title: 'High single-name exposure',
      message: `${topSymbol} is ${topWeightPct.toFixed(1)}% of portfolio value`
    });
  }
  if (topSectorPct > 40) {
    alerts.push({
      severity: 'medium',
      title: 'Sector concentration',
      message: `${topSectorName} makes up ${topSectorPct.toFixed(1)}% of holdings`
    });
  }
  const losers = list
    .filter((h) => (Number(h.pnl) || 0) < 0)
    .sort((a, b) => (Number(a.pnl) || 0) - (Number(b.pnl) || 0));
  if (losers.length > 0) {
    const worst = losers[0];
    alerts.push({
      severity: losers.length > holdingsCount / 2 ? 'medium' : 'low',
      title: `${losers.length} position${losers.length > 1 ? 's' : ''} in loss`,
      message: `${worst.symbol || 'A position'} down ${formatLkrCompact(Math.abs(Number(worst.pnl) || 0))} unrealized`
    });
  }
  if (unrealizedReturnPct > 0) {
    alerts.push({
      severity: 'low',
      title: 'Portfolio in profit',
      message: `Unrealized return of ${unrealizedReturnPct.toFixed(1)}% across ${holdingsCount} holdings`
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      severity: 'low',
      title: 'No risk flags',
      message: 'Well balanced — no major concentration or losses'
    });
  }

  return {
    hasData: true,
    score,
    status,
    diversification,
    holdingsCount,
    sectorCount,
    unrealizedReturnPct,
    concentration,
    concentrationDetail: `Top ${topSymbol} · ${topWeightPct.toFixed(1)}%`,
    alerts: alerts.slice(0, 4),
    valuation: {
      marketValue: totalMarketValue,
      cost: totalCost,
      unrealized: totalMarketValue - totalCost,
      unrealizedPct: unrealizedReturnPct
    }
  };
}

// Compute live portfolio insights (P&L summary, top holdings, movers) from real holdings.
function computePortfolioInsights(holdings, pnlMetrics) {
  const list = Array.isArray(holdings) ? holdings : [];
  const totalMarketValue = list.reduce((s, h) => s + (Number(h.marketValue) || 0), 0);

  if (list.length === 0 || totalMarketValue <= 0) {
    return {
      hasData: false,
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      totalMarketValue: 0,
      topHoldings: [],
      movers: []
    };
  }

  const realizedPnL = Number(pnlMetrics?.realizedPnL) || 0;
  const unrealizedPnL = list.reduce((s, h) => s + (Number(h.pnl) || 0), 0);

  const enriched = list.map((h) => {
    const mv = Number(h.marketValue) || 0;
    const pnl = Number(h.pnl) || 0;
    const cost = mv - pnl;
    return {
      symbol: h.symbol || '—',
      name: h.companyName || h.company_name || h.name || h.symbol || '—',
      marketValue: mv,
      pnl,
      weightPct: totalMarketValue > 0 ? (mv / totalMarketValue) * 100 : 0,
      returnPct: cost > 0 ? (pnl / cost) * 100 : 0
    };
  });

  const topHoldings = [...enriched]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5);

  const gainers = [...enriched]
    .filter((h) => h.pnl > 0)
    .sort((a, b) => b.returnPct - a.returnPct)
    .slice(0, 3);
  const losers = [...enriched]
    .filter((h) => h.pnl < 0)
    .sort((a, b) => a.returnPct - b.returnPct)
    .slice(0, 3);

  return {
    hasData: true,
    realizedPnL,
    unrealizedPnL,
    totalPnL: realizedPnL + unrealizedPnL,
    totalMarketValue,
    topHoldings,
    movers: [...gainers, ...losers]
  };
}

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
    },
    portfolioHealth: computePortfolioHealth([], []),
    portfolioInsights: computePortfolioInsights([], {})
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
      let portfolioHealth = computePortfolioHealth([], []);
      let portfolioInsights = computePortfolioInsights([], {});

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

        // Live Portfolio Health & Risk metrics from real holdings + sectors.
        portfolioHealth = computePortfolioHealth(holdingsData, sectorData);
        portfolioInsights = computePortfolioInsights(holdingsData, pnlMetrics);

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
        portfolioHealth = computePortfolioHealth([], []);
        portfolioInsights = computePortfolioInsights([], {});
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
        pnlMetrics: pnlMetrics,
        portfolioHealth,
        portfolioInsights
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
        },
        portfolioHealth: computePortfolioHealth([], []),
        portfolioInsights: computePortfolioInsights([], {})
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
    () => (dashboardData.holdingSymbols || []).filter(Boolean),
    [dashboardData.holdingSymbols]
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

          {/* Portfolio Health & Risk (live data from holdings + P&L) */}
          <div className="content-card health-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Portfolio Health & Risk</h3>
              </div>
              {dashboardData.sectorChartPortfolioName && (
                <span className="card-subtitle">{dashboardData.sectorChartPortfolioName}</span>
              )}
            </div>

            {(() => {
              const ph = dashboardData.portfolioHealth || {};
              if (!ph.hasData) {
                return (
                  <div className="health-empty">
                    No holdings data available for the selected portfolio yet.
                  </div>
                );
              }
              const val = ph.valuation || {};
              const up = (ph.unrealizedReturnPct || 0) >= 0;
              const statusKey = (ph.status || '').toLowerCase().replace(/\s+/g, '-');
              return (
                <div className="health-layout">
                <div className="health-top">
                  <div className={`health-score health-score--${statusKey}`}>
                    <div className="health-gauge">
                      <svg className="health-gauge__svg" viewBox="0 0 120 120">
                        <circle className="health-gauge__bg" cx="60" cy="60" r="52" />
                        <circle
                          className="health-gauge__bar"
                          cx="60"
                          cy="60"
                          r="52"
                          style={{
                            strokeDasharray: 326.726,
                            strokeDashoffset:
                              326.726 * (1 - Math.max(0, Math.min(100, ph.score)) / 100)
                          }}
                        />
                      </svg>
                      <div className="health-gauge__center">
                        <div className="health-gauge__score">{ph.score}</div>
                        <div className="health-gauge__outof">/ 100</div>
                      </div>
                    </div>
                    <div className="health-score__meta">
                      <div className="health-score__label">Overall health</div>
                      <span className={`health-status-pill health-status-pill--${statusKey}`}>
                        {ph.status}
                      </span>
                    </div>
                  </div>

                    <div className="health-kpis" aria-label="Key risk indicators">
                      <div className="health-kpi">
                        <div className="health-kpi__label">Diversification</div>
                        <div className="health-kpi__value">{ph.diversification}</div>
                        <div className="health-kpi__sub">
                          {ph.holdingsCount} holdings · {ph.sectorCount} sectors
                        </div>
                      </div>
                      <div className="health-kpi">
                        <div className="health-kpi__label">Unrealized return</div>
                        <div
                          className={`health-kpi__value ${
                            up ? 'health-kpi__value--positive' : 'health-kpi__value--negative'
                          }`}
                        >
                          {up ? '+' : ''}
                          {(ph.unrealizedReturnPct || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className="health-kpi">
                        <div className="health-kpi__label">Concentration</div>
                        <div className="health-kpi__value">{ph.concentration}</div>
                        <div className="health-kpi__sub">{ph.concentrationDetail}</div>
                      </div>
                    </div>
                  </div>

                  <div className="health-bottom">
                    <div className="health-block">
                      <div className="health-block__title">Alerts & tasks</div>
                      <ul className="health-alerts">
                        {ph.alerts.map((alert, index) => (
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
                      <div className="health-block__title">Valuation</div>
                      <div className="health-liquidity">
                        <div className="health-liquidity__row">
                          <div className="health-liquidity__label">Market value</div>
                          <div className="health-liquidity__value">
                            {formatLkrCompact(val.marketValue)}
                          </div>
                        </div>
                        <div className="health-liquidity__row">
                          <div className="health-liquidity__label">Invested (cost)</div>
                          <div className="health-liquidity__value">
                            {formatLkrCompact(val.cost)}
                          </div>
                        </div>
                        <div className="health-liquidity__row">
                          <div className="health-liquidity__label">Unrealized P&amp;L</div>
                          <div
                            className={`health-liquidity__value ${
                              up ? 'health-kpi__value--positive' : 'health-kpi__value--negative'
                            }`}
                          >
                            {up ? '+' : ''}
                            {formatLkrCompact(val.unrealized)}
                            <span className="health-liquidity__muted">
                              {' '}
                              ({up ? '+' : ''}
                              {(val.unrealizedPct || 0).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Portfolio Insights — live P&L, top holdings & movers */}
          <div className="content-card insights-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Portfolio Insights</h3>
              </div>
              {dashboardData.sectorChartPortfolioName && (
                <span className="card-subtitle">{dashboardData.sectorChartPortfolioName}</span>
              )}
            </div>

            {(() => {
              const pi = dashboardData.portfolioInsights || {};
              if (!pi.hasData) {
                return (
                  <div className="health-empty">
                    No holdings data available for the selected portfolio yet.
                  </div>
                );
              }
              const totalUp = (pi.totalPnL || 0) >= 0;
              const realUp = (pi.realizedPnL || 0) >= 0;
              const unrUp = (pi.unrealizedPnL || 0) >= 0;
              return (
                <div className="pi-grid">
                  {/* Performance */}
                  <div className="pi-col">
                    <div className="pi-col__title">Performance</div>
                    <div className="pi-hero">
                      <div className="pi-hero__label">Total P&amp;L</div>
                      <div className={`pi-hero__value ${totalUp ? 'pi-pos' : 'pi-neg'}`}>
                        {totalUp ? '+' : ''}
                        {formatLkrCompact(pi.totalPnL)}
                      </div>
                    </div>
                    <div className="pi-stat">
                      <span className="pi-stat__label">Realized</span>
                      <span className={`pi-stat__value ${realUp ? 'pi-pos' : 'pi-neg'}`}>
                        {realUp ? '+' : ''}
                        {formatLkrCompact(pi.realizedPnL)}
                      </span>
                    </div>
                    <div className="pi-stat">
                      <span className="pi-stat__label">Unrealized</span>
                      <span className={`pi-stat__value ${unrUp ? 'pi-pos' : 'pi-neg'}`}>
                        {unrUp ? '+' : ''}
                        {formatLkrCompact(pi.unrealizedPnL)}
                      </span>
                    </div>
                    <div className="pi-stat">
                      <span className="pi-stat__label">Market value</span>
                      <span className="pi-stat__value">{formatLkrCompact(pi.totalMarketValue)}</span>
                    </div>
                  </div>

                  {/* Top holdings */}
                  <div className="pi-col">
                    <div className="pi-col__title">Top holdings</div>
                    <ul className="pi-list">
                      {pi.topHoldings.map((h, index) => (
                        <li key={index} className="pi-holding">
                          <div className="pi-holding__head">
                            <span className="pi-holding__sym" title={h.name}>{h.symbol}</span>
                            <span className="pi-holding__wt">{h.weightPct.toFixed(1)}%</span>
                          </div>
                          <div className="pi-bar">
                            <div
                              className="pi-bar__fill"
                              style={{ width: `${Math.min(100, h.weightPct)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Movers */}
                  <div className="pi-col">
                    <div className="pi-col__title">Movers</div>
                    <ul className="pi-list">
                      {pi.movers.map((m, index) => {
                        const moverUp = (m.returnPct || 0) >= 0;
                        return (
                          <li key={index} className="pi-mover">
                            <div className="pi-mover__info">
                              <span className="pi-mover__sym">{m.symbol}</span>
                              <span className="pi-mover__name">{m.name}</span>
                            </div>
                            <span className={`pi-mover__chg ${moverUp ? 'pi-pos' : 'pi-neg'}`}>
                              {moverUp ? '+' : ''}
                              {m.returnPct.toFixed(1)}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })()}
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
