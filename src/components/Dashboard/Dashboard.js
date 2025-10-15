import React, { useState, useEffect, useCallback } from 'react';
import { tradeSummaryAPI, transactionEntryAPI } from '../../services/api';
import { realizedPnLService } from '../../services/realizedPnLService';
import './Dashboard.css';

const Dashboard = ({ onTabChange }) => {
  const [dashboardData, setDashboardData] = useState({
    activePortfolios: 0,
    recentTransactions: [],
    topPerformers: [],
    marketAlerts: [],
    sectorData: [],
    sectorLegend: [],
    totalCompanies: 0,
    pnlMetrics: {
      totalRealizedCapitalGain: 0,
      realizedPnL: 0,
      totalUnrealizedCapitalGain: 0,
      unrealizedPnL: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);

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
      const portfoliosResponse = await fetch('http://localhost:8080/api/portfolios/active', {
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
      let pnlMetrics = {
        totalRealizedCapitalGain: 0,
        realizedPnL: 0,
        totalUnrealizedCapitalGain: 0,
        unrealizedPnL: 0
      };

      if (portfoliosResponse.ok) {
        const portfolios = await portfoliosResponse.json();
        activePortfolios = portfolios.length;
        
        console.log('🔍 DASHBOARD DEBUG - Available portfolios:', portfolios);
        
        // Fetch P&L metrics for the first portfolio (or all portfolios combined)
        if (portfolios.length > 0) {
          // Get P&L data for the first portfolio - use same field as MTM screen
          const portfolioId = portfolios[0].id;
          console.log('🔍 DASHBOARD DEBUG - Using portfolio ID:', portfolioId, 'from portfolio:', portfolios[0]);
          
          try {
            const pnlData = await realizedPnLService.getCompleteData(portfolioId, '1Y');
            
            if (pnlData && pnlData.portfolioSummary) {
              // Get ALL four values from both screens:
              // 1. Total Realized Capital Gain - from RealizedPnL screen (netRealizedPnL)
              // 2. Realized P&L - from RealizedPnL screen (netRealizedPnL)
              const netRealizedCapitalGain = pnlData.portfolioSummary?.netRealizedPnL || 0;
              const realizedPnL = pnlData.portfolioSummary?.netRealizedPnL || 0; // Same as netRealizedCapitalGain
              
              // Update only the realized values, keep existing unrealized values
              pnlMetrics.totalRealizedCapitalGain = netRealizedCapitalGain;
              pnlMetrics.realizedPnL = realizedPnL;
              
              console.log('🔍 DASHBOARD DEBUG - Realized P&L data from RealizedPnL screen:', {
                portfolioId,
                netRealizedCapitalGain,
                realizedPnL,
                portfolioSummary: pnlData.portfolioSummary,
                tradeHistoryLength: pnlData.tradeHistory?.length || 0,
                source: 'RealizedPnL screen (netRealizedPnL)',
                pnlMetricsAfterRealized: pnlMetrics
              });
            } else {
              console.log('❌ DASHBOARD DEBUG - No portfolioSummary found:', {
                portfolioId,
                pnlData,
                hasPortfolioSummary: !!pnlData?.portfolioSummary
              });
            }

            // Fetch MTM data for unrealized values - using EXACT same calculations as MarkToMarketValuation
            try {
              const mtmData = await transactionEntryAPI.getPortfolioPositions(portfolioId);
              console.log('🔍 DASHBOARD DEBUG - MTM data for unrealized calculations:', mtmData);
              
              if (mtmData && mtmData.length > 0) {
                // Get ALL four values from both screens:
                // 3. Total Unrealized Capital Gain - from MTM screen (totalGainLoss = totalGrossSales - totalCost)
                // 4. Unrealized P&L - from MTM screen (totalProjectedSalesWithCOF - (totalCost + totalCharges))
                
                console.log('🔍 DASHBOARD DEBUG - MTM data sample (first 2 items):', mtmData.slice(0, 2));
                
                // Use EXACT same calculations as MarkToMarketValuation component (lines 476-486, 1157-1158)
                const totalCost = mtmData.reduce((sum, item) => sum + (item.costValue || 0), 0);
                const totalGrossSales = mtmData.reduce((sum, item) => sum + (item.grossSales || 0), 0);
                const totalCharges = mtmData.reduce((sum, item) => sum + (item.charges || 0), 0);
                const totalProjectedSalesWithCOF = mtmData.reduce((sum, item) => sum + (item.projectedSalesWithCOF || 0), 0);
                
                // Total Unrealized Capital Gain = totalGrossSales - totalCost (same as MTM screen line 486)
                const totalUnrealizedCapitalGain = totalGrossSales - totalCost;
                
                // Unrealized P&L = totalProjectedSalesWithCOF - (totalCost + totalCharges) (same as MTM screen line 1158)
                const unrealizedPnL = totalProjectedSalesWithCOF - (totalCost + totalCharges);
                
                console.log('🔍 DASHBOARD DEBUG - Step-by-step calculations:', {
                  totalCost,
                  totalGrossSales,
                  totalCharges,
                  totalProjectedSalesWithCOF,
                  totalUnrealizedCapitalGain: `${totalGrossSales} - ${totalCost} = ${totalUnrealizedCapitalGain}`,
                  unrealizedPnL: `${totalProjectedSalesWithCOF} - (${totalCost} + ${totalCharges}) = ${unrealizedPnL}`
                });
                
                // Update only the unrealized values, keep existing realized values
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
              } else {
                console.log('🔍 DASHBOARD DEBUG - No MTM data available for unrealized calculations');
              }
            } catch (mtmError) {
              console.error('❌ DASHBOARD DEBUG - Error fetching MTM data for unrealized values:', mtmError);
              // Keep existing P&L metrics if MTM fetch fails
            }
          } catch (pnlError) {
            console.error('❌ DASHBOARD DEBUG - Error fetching P&L metrics:', pnlError);
            console.error('❌ DASHBOARD DEBUG - Portfolio ID that failed:', portfolioId);
            // Keep default values if P&L fetch fails
          }
        }
      }

      // Fetch real transactions from the database
      try {
        console.log('Fetching real transactions from database...');
        const [buyTransactions, sellTransactions] = await Promise.all([
          tradeSummaryAPI.getBuyTransactions(),
          transactionEntryAPI.getAllSellTransactions()
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

        // Fetch holdings data from portfolio overview API (same as Portfolio Overview)
        let holdingsData = [];
        try {
          const token = localStorage.getItem('token');
          const holdingsResponse = await fetch('http://localhost:8080/api/portfolios/overview', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });

          if (holdingsResponse.ok) {
            const holdingsResult = await holdingsResponse.json();
            console.log('Holdings data response:', holdingsResult);
            if (holdingsResult.success && holdingsResult.data.holdings) {
              holdingsData = holdingsResult.data.holdings;
              console.log('Fetched holdings data:', holdingsData);
            }
          }
        } catch (holdingsError) {
          console.error('Error fetching holdings data:', holdingsError);
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
        pnlMetrics: pnlMetrics
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
        pnlMetrics: {
          totalRealizedCapitalGain: 0,
          realizedPnL: 0,
          totalUnrealizedCapitalGain: 0,
          unrealizedPnL: 0
        }
      });
      setIsLoading(false);
    }
  }, []);

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

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="header-text">
          <h1>Equity Module Dashboard</h1>
          <p>Professional Portfolio Management Dashboard</p>
        </div>
        <div className="header-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="main-grid">
        {/* Left Column */}
        <div className="left-column">
          {/* Market Status Card */}
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
              <div className="status-info">
            <h3>Market Status</h3>
                <p className="status-value">Open</p>
                <span className="status-subtitle">Trading normally</span>
          </div>
        </div>
            <div className="status-indicator">
              <div className="indicator-dot active"></div>
              <span>Live</span>
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
              dashboardData.recentTransactions.map(transaction => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-header">
                      <div className={`transaction-badge ${(transaction.type || 'BUY').toLowerCase()}`}>
                    {transaction.type || 'BUY'}
                  </div>
                  <div className="transaction-date">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                      </div>
                    </div>
                    <div className="transaction-body">
                      <div className="transaction-symbol">{transaction.symbol || 'N/A'}</div>
                      <div className="transaction-details">
                        <span className="transaction-quantity">{transaction.quantity || 0} shares</span>
                        <span className="transaction-price">
                          {transaction.type === 'SELL' 
                            ? (transaction.sold_price || transaction.price || 0)
                            : (transaction.price || 0)
                          }
                        </span>
                      </div>
                  </div>
                </div>
              ))
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
              <div className="metric-header">
                <div className="metric-info">
                  <h4>Total Realized Capital Gain</h4>
                  <p className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(dashboardData.pnlMetrics.totalRealizedCapitalGain)}</p>
                </div>
              </div>
            </div>

            <div className="pnl-metric-card primary">
              <div className="metric-header">
                <div className="metric-info">
                  <h4>Realized P&L</h4>
                  <p className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(dashboardData.pnlMetrics.realizedPnL)}</p>
                </div>
              </div>
            </div>

            <div className="pnl-metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h4>Total Unrealized Capital Gain</h4>
                  <p className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(dashboardData.pnlMetrics.totalUnrealizedCapitalGain)}</p>
                </div>
              </div>
            </div>

            <div className="pnl-metric-card">
              <div className="metric-header">
                <div className="metric-info">
                  <h4>Unrealized P&L</h4>
                  <p className="metric-value">LKR {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(dashboardData.pnlMetrics.unrealizedPnL)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Pie Chart */}
          <div className="content-card">
            <div className="card-header">
              <div className="header-left">
                <h3>Sector Distribution</h3>
                <span className="card-subtitle">Companies by sector</span>
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
