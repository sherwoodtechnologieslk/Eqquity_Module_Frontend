import React, { useState, useEffect, useCallback } from 'react';
import './PortfolioOverview.css';
import { portfolioAPI, transactionEntryAPI } from '../../../services/api';
import { realizedPnLService } from '../../../services/realizedPnLService';

const PortfolioOverview = ({ onTabChange }) => {
  const [portfolioData, setPortfolioData] = useState({
    summary: {
      totalValue: 0,
      totalPnL: 0,
      totalCost: 0,
      cashBalance: 0,
      numberOfPositions: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      netRealizedCapitalGain: 0,
      totalUnrealizedCapitalGain: 0
    },
    holdings: [],
    assetAllocation: {
      equity: 0,
      cash: 0
    },
    valueHistory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('3M');

  // Generate empty portfolio value history data
  const generateValueHistory = (timeRange, currentValue) => {
    // Return empty array - no mock data
    return [];
  };

  const loadActivePortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      const data = await portfolioAPI.getActivePortfolios();
      console.log('🔍 PORTFOLIO OVERVIEW - Loaded portfolios:', data);
      setPortfolios(data);
    } catch (error) {
      console.error('❌ PORTFOLIO OVERVIEW - Error loading active portfolios:', error);
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const setEmptyData = useCallback(() => {
    const emptyData = {
      summary: {
        totalValue: 0,
        totalPnL: 0,
        totalCost: 0,
        cashBalance: 0,
        numberOfPositions: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        netRealizedCapitalGain: 0,
        totalUnrealizedCapitalGain: 0
      },
      holdings: [],
      assetAllocation: {
        equity: 0,
        cash: 0
      },
      valueHistory: []
    };
    setPortfolioData(emptyData);
  }, []);

  const loadPortfolioData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 PORTFOLIO OVERVIEW - Fetching portfolio data for portfolioId:', selectedPortfolio);
      
      // Use the API service instead of direct fetch
      const result = await portfolioAPI.getPortfolioOverview(selectedPortfolio);
      console.log('🔍 PORTFOLIO OVERVIEW - Portfolio data response:', result);
      
      if (result.success && result.data) {
        const portfolioValue = result.data.summary?.totalValue || 0;
        console.log('🔍 PORTFOLIO OVERVIEW - Setting portfolio data with value:', portfolioValue, 'holdings:', result.data.holdings?.length);
        
        // Fetch P&L data - SAME AS DASHBOARD LOGIC
        let realizedPnL = 0;
        let netRealizedCapitalGain = 0;
        let unrealizedPnL = 0;
        let totalUnrealizedCapitalGain = 0;
        
        // Use same portfolio selection logic as dashboard
        if (portfolios.length > 0) {
          // Get P&L data for the selected portfolio - use same field logic as dashboard
          const selectedPortfolioData = portfolios.find(p => 
            p.id === selectedPortfolio || 
            p.portfolioId === selectedPortfolio || 
            (selectedPortfolio === 'all' && p.id)
          ) || portfolios[0];
          
          const portfolioId = selectedPortfolioData.id;
          const realizedPortfolioId = selectedPortfolioData.portfolioId || portfolioId;
          
          console.log('🔍 PORTFOLIO OVERVIEW - Portfolio selection:', {
            selectedPortfolio,
            selectedPortfolioData,
            portfolioId,
            realizedPortfolioId,
            portfoliosAvailable: portfolios.length
          });
          
          // Fetch realized P&L data - SAME AS DASHBOARD
          try {
            console.log('🔍 PORTFOLIO OVERVIEW - Fetching realized P&L data for portfolio:', realizedPortfolioId);
            const realizedData = await realizedPnLService.getCompleteData(realizedPortfolioId, '1Y');
            console.log('🔍 PORTFOLIO OVERVIEW - Realized P&L data:', realizedData);
            
            if (realizedData && realizedData.portfolioSummary) {
              const summary = realizedData.portfolioSummary;
              
              // Net Realized Capital Gain = netRealizedPnL (gains + losses, can be negative) - SAME AS DASHBOARD
              netRealizedCapitalGain = summary.netRealizedPnL || 0;
              
              // Realized P&L = proper calculation with fees and cost of funds - SAME AS DASHBOARD
              realizedPnL = realizedData.realizedPnL || 0;
              
              console.log('🔍 PORTFOLIO OVERVIEW - Calculated realized values:', {
                netRealizedCapitalGain,
                realizedPnL,
                totalRealizedGains: summary.totalRealizedGains,
                totalRealizedLosses: summary.totalRealizedLosses,
                source: 'RealizedPnL complete data service (same as dashboard)'
              });
            }
          } catch (realizedError) {
            console.error('❌ PORTFOLIO OVERVIEW - Error fetching realized P&L data:', realizedError);
            // Keep realized values as 0 if fetch fails
          }
          
          // Fetch unrealized P&L data - SAME AS DASHBOARD
          try {
            console.log('🔍 PORTFOLIO OVERVIEW - Fetching MTM data for unrealized calculations, portfolioId:', portfolioId);
            const mtmData = await transactionEntryAPI.getPortfolioPositions(portfolioId);
            console.log('🔍 PORTFOLIO OVERVIEW - MTM data for unrealized calculations:', mtmData);
          
            if (mtmData && mtmData.length > 0) {
              // Use EXACT same calculations as MarkToMarketValuation component (same as dashboard)
              const totalCost = mtmData.reduce((sum, item) => sum + (item.costValue || 0), 0);
              const totalGrossSales = mtmData.reduce((sum, item) => sum + (item.grossSales || 0), 0);
              const totalCharges = mtmData.reduce((sum, item) => sum + (item.charges || 0), 0);
              const totalProjectedSalesWithCOF = mtmData.reduce((sum, item) => sum + (item.projectedSalesWithCOF || 0), 0);
              
              // Total Unrealized Capital Gain = totalGrossSales - totalCost (same as MTM screen line 486) - SAME AS DASHBOARD
              totalUnrealizedCapitalGain = totalGrossSales - totalCost;
              
              // Unrealized P&L = totalProjectedSalesWithCOF - (totalCost + totalCharges) (same as MTM screen line 1158) - SAME AS DASHBOARD
              unrealizedPnL = totalProjectedSalesWithCOF - (totalCost + totalCharges);
              
              console.log('🔍 PORTFOLIO OVERVIEW - Step-by-step calculations:', {
                totalCost,
                totalGrossSales,
                totalCharges,
                totalProjectedSalesWithCOF,
                totalUnrealizedCapitalGain: `${totalGrossSales} - ${totalCost} = ${totalUnrealizedCapitalGain}`,
                unrealizedPnL: `${totalProjectedSalesWithCOF} - (${totalCost} + ${totalCharges}) = ${unrealizedPnL}`,
                source: 'MarkToMarketValuation screen (same as dashboard)'
              });
            } else {
              console.log('🔍 PORTFOLIO OVERVIEW - No MTM data available for unrealized calculations');
            }
          } catch (mtmError) {
            console.error('❌ PORTFOLIO OVERVIEW - Error fetching MTM data for unrealized values:', mtmError);
            // Keep unrealized values as 0 if fetch fails
          }
        } else {
          console.log('🔍 PORTFOLIO OVERVIEW - No portfolios available for P&L calculations');
        }
        
        // Calculate total P&L = realized P&L + unrealized P&L
        const totalPnL = realizedPnL + unrealizedPnL;
        
        console.log('🔍 PORTFOLIO OVERVIEW - FINAL P&L CALCULATION:', {
          realizedPnL,
          unrealizedPnL,
          totalPnL,
          netRealizedCapitalGain,
          totalUnrealizedCapitalGain,
          source: 'Same calculations as dashboard'
        });
        
        setPortfolioData({
          summary: {
            ...result.data.summary,
            totalPnL: totalPnL, // Updated total P&L
            realizedPnL: realizedPnL,
            unrealizedPnL: unrealizedPnL,
            netRealizedCapitalGain: netRealizedCapitalGain,
            totalUnrealizedCapitalGain: totalUnrealizedCapitalGain
          },
          holdings: result.data.holdings || [],
          assetAllocation: result.data.assetAllocation || { equity: 0, cash: 0 },
          valueHistory: generateValueHistory(selectedTimeRange, portfolioValue)
        });
      } else {
        // API returned error, use empty data
        console.log('🔍 PORTFOLIO OVERVIEW - API returned error, using empty data');
        setEmptyData();
      }
    } catch (error) {
      console.error('❌ PORTFOLIO OVERVIEW - Error loading portfolio data:', error);
      // Error occurred, show empty state
      setEmptyData();
    } finally {
      setIsLoading(false);
    }
  }, [selectedPortfolio, selectedTimeRange, setEmptyData, portfolios]);

  useEffect(() => {
    loadActivePortfolios();
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      loadPortfolioData();
    }
  }, [selectedPortfolio, portfolios, loadPortfolioData]);

  // Regenerate chart data when time range changes
  useEffect(() => {
    const currentTotalValue = portfolioData.summary?.totalValue || 0;
    if (currentTotalValue > 0) {
      const newValueHistory = generateValueHistory(selectedTimeRange, currentTotalValue);
      setPortfolioData(prev => ({
        ...prev,
        valueHistory: newValueHistory
      }));
    } else {
      // No data available, clear value history
      setPortfolioData(prev => ({
        ...prev,
        valueHistory: []
      }));
    }
  }, [selectedTimeRange, portfolioData.summary?.totalValue]);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Sector data processing functions
  const getSectorData = (holdings) => {
    console.log('=== SECTOR DATA DEBUG ===');
    console.log('Holdings data:', holdings);
    
    const sectorMap = {};
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const marketValue = holding.marketValue || 0;
      console.log(`Processing holding: ${holding.symbol}, sector: ${sector}, marketValue: ${marketValue}`);
      
      if (sectorMap[sector]) {
        sectorMap[sector] += marketValue;
      } else {
        sectorMap[sector] = marketValue;
      }
    });

    const result = Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    console.log('Final sector data:', result);
    return result;
  };

  const getTotalSectorValue = (holdings) => {
    return holdings.reduce((total, holding) => total + (holding.marketValue || 0), 0);
  };

  const getSectorColor = (index) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
    return colors[index % colors.length];
  };

  // Sector Pie Chart Component
  const SectorPieChart = ({ data }) => {
    console.log('=== SECTOR PIE CHART DEBUG ===');
    console.log('Data passed to SectorPieChart:', data);
    
    const sectorData = getSectorData(data);
    const totalValue = getTotalSectorValue(data);
    
    console.log('Sector data for chart:', sectorData);
    console.log('Total value for chart:', totalValue);
    
    if (sectorData.length === 0 || totalValue === 0) {
      console.log('No sector data available or total value is zero, showing no-data message');
      return (
        <div className="no-data-message">
          <p>No sector data available</p>
        </div>
      );
    }

    let cumulativePercentage = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200" className="portfolio-sector-pie-chart">
        {sectorData.map((sector, index) => {
          const percentage = (sector.value / totalValue) * 100;
          const startAngle = (cumulativePercentage / 100) * 360;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
          
          const startAngleRad = (startAngle - 90) * (Math.PI / 180);
          const endAngleRad = (endAngle - 90) * (Math.PI / 180);
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = percentage > 50 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          cumulativePercentage += percentage;

          return (
            <path
              key={index}
              d={pathData}
              fill={getSectorColor(index)}
              stroke="#fff"
              strokeWidth="2"
              className="portfolio-sector-slice"
            />
          );
        })}
        <circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="#fff"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="portfolio-pie-center-text"
          fontSize="12"
          fontWeight="600"
          fill="#374151"
        >
          {sectorData.length}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="portfolio-pie-center-text"
          fontSize="10"
          fill="#6B7280"
        >
          Sectors
        </text>
      </svg>
    );
  };

  // Portfolio Value Chart Component
  const PortfolioValueChart = ({ data, timeRange }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>No data available for the selected time range</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding

    // Responsive chart dimensions - larger chart within same container
    const isMobile = window.innerWidth <= 768;
    const chartWidth = isMobile ? Math.min(window.innerWidth - 60, 550) : 700;
    const chartHeight = isMobile ? 280 : 350;
    const margin = { top: 25, right: 25, bottom: 35, left: isMobile ? 80 : 100 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const xScale = (index) => (index / (data.length - 1)) * innerWidth;
    const yScale = (value) => innerHeight - ((value - minValue + padding) / (range + 2 * padding)) * innerHeight;

    const pathData = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaData = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ` L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`;

    return (
      <div className="portfolio-chart-container">
        <svg width={chartWidth} height={chartHeight} className="portfolio-chart">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            <g className="grid-lines">
              {[0, 0.25, 0.5, 0.75, 1].map(t => (
                <line
                  key={t}
                  x1={0}
                  y1={t * innerHeight}
                  x2={innerWidth}
                  y2={t * innerHeight}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
            </g>

            {/* Area under the curve */}
            <path
              d={areaData}
              fill="url(#areaGradient)"
              className="area-path"
            />

            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              className="line-path"
            />

            {/* Data points */}
            {data.map((point, index) => (
              <circle
                key={index}
                cx={xScale(index)}
                cy={yScale(point.value)}
                r="3"
                fill="#3B82F6"
                className="data-point"
              />
            ))}

            {/* Y-axis labels */}
            <g className="y-axis">
              {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const value = minValue + padding + (1 - t) * (range + 2 * padding);
                return (
                  <text
                    key={t}
                    x={-15}
                    y={t * innerHeight + 5}
                    textAnchor="end"
                    className="axis-label"
                    fontSize="11"
                    fill="#6B7280"
                    dominantBaseline="middle"
                  >
                    {formatCurrency(value)}
                  </text>
                );
              })}
            </g>

            {/* X-axis labels */}
            <g className="x-axis">
              {data.filter((_, index) => index % Math.ceil(data.length / 5) === 0).map((point, index) => {
                const originalIndex = data.findIndex(d => d === point);
                return (
                  <text
                    key={index}
                    x={xScale(originalIndex)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="axis-label"
                    fontSize="12"
                    fill="#6B7280"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="portfolio-overview-loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  // Show empty state when no data is available
  const totalValue = portfolioData.summary?.totalValue || 0;
  const holdingsLength = portfolioData.holdings?.length || 0;
  console.log('Checking empty state - totalValue:', totalValue, 'holdings:', holdingsLength);
  if (totalValue === 0 && holdingsLength === 0) {
    return (
      <div className="portfolio-overview">
        <div className="overview-header">
          <h2>Portfolio Overview</h2>
          <p className="overview-subtitle">Your current portfolio status and holdings</p>
        </div>
        
        <div className="portfolio-empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>No Portfolio Data Available</h3>
          <p>There are no transactions or holdings in the selected portfolio. Start by adding some buy transactions to see your portfolio overview.</p>
          <div className="empty-state-actions">
            <button className="btn-primary" onClick={() => onTabChange('Buy')}>
              Add Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-overview">
      <div className="overview-header">
        <h2>Portfolio Overview</h2>
        <p className="overview-subtitle">Your current portfolio status and holdings</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card secondary">
          <div className="card-content">
            <div className="card-header">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
            <h3>Portfolio Selection</h3>
            </div>
            <div className="portfolio-selector">
              <select 
                value={selectedPortfolio} 
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                disabled={portfoliosLoading}
                className="portfolio-dropdown"
              >
                <option value="all">All Portfolios</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.portfolioName}
                  </option>
                ))}
              </select>
            </div>
            <span className="card-change">
              {portfoliosLoading ? 'Loading portfolios...' : `${portfolios.length} portfolios available`}
            </span>
          </div>
        </div>

        <div className="summary-card primary">
          <div className="card-content">
            <div className="card-header">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
            <h3>Total Portfolio Value</h3>
            </div>
            <p className="card-value">
              {portfolioData.summary?.totalValue !== null ? formatCurrency(totalValue) : 'N/A'}
            </p>
            <span className="card-change positive">
              {portfolioData.summary?.totalPnL !== null ? 
                `+${formatPercentage(portfolioData.summary?.totalPnL || 0, portfolioData.summary?.totalCost || 0)}` : 
                'Market data unavailable'
              }
            </span>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-content">
            <div className="card-header">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
          </div>
            <h3>Total P&L</h3>
            </div>
            <p className="card-value">
              {portfolioData.summary?.totalPnL !== null ? formatCurrency(portfolioData.summary?.totalPnL || 0) : 'N/A'}
            </p>
            <span className="card-change positive">
              {portfolioData.summary?.totalPnL !== null ? 
                `Realized: ${formatCurrency(portfolioData.summary?.realizedPnL || 0)} | Unrealized: ${formatCurrency(portfolioData.summary?.unrealizedPnL || 0)}` : 
                'Market data unavailable'
              }
            </span>
          </div>
        </div>

        <div className="summary-card info">
          <div className="card-content">
            <div className="card-header">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
            <h3>Active Positions</h3>
            </div>
            <p className="card-value">{portfolioData.summary?.numberOfPositions || 0}</p>
            <span className="card-change">Across multiple sectors</span>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-content">
            <div className="card-header">
          <div className="card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
            <h3>Cash Balance</h3>
            </div>
            <p className="card-value">{formatCurrency(portfolioData.summary?.cashBalance || 0)}</p>
            <span className="card-change">{formatPercentage(portfolioData.summary?.cashBalance || 0, totalValue)} of portfolio</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="allocation-section">
        <div className="section-header">
          <h3>Asset Allocation</h3>
        </div>
        <div className="allocation-cards">
          <div className="allocation-card equity">
            <div className="allocation-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="allocation-content">
              <h4>Equity</h4>
              <p className="allocation-value">{formatCurrency(portfolioData.assetAllocation?.equity || 0)}</p>
              <span className="allocation-percentage">
                {formatPercentage(portfolioData.assetAllocation?.equity || 0, totalValue)}
              </span>
            </div>
          </div>
          <div className="allocation-card cash">
            <div className="allocation-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="allocation-content">
              <h4>Cash</h4>
              <p className="allocation-value">{formatCurrency(portfolioData.assetAllocation?.cash || 0)}</p>
              <span className="allocation-percentage">
                {formatPercentage(portfolioData.assetAllocation?.cash || 0, totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Value Over Time Chart */}
      <div className="value-chart-section">
        <div className="section-header">
          <h3>Portfolio Value Over Time</h3>
          <div className="time-range-selector">
            <button 
              className={`time-btn ${selectedTimeRange === '1M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('1M')}
            >
              1M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '3M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('3M')}
            >
              3M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '6M' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('6M')}
            >
              6M
            </button>
            <button 
              className={`time-btn ${selectedTimeRange === '1Y' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('1Y')}
            >
              1Y
            </button>
          </div>
        </div>
        <div className="chart-wrapper">
          <PortfolioValueChart data={portfolioData.valueHistory} timeRange={selectedTimeRange} />
        </div>
      </div>

      {/* Sector Distribution Chart */}
      <div className="portfolio-sector-chart-section">
        <div className="portfolio-section-header">
          <h3>Sector Distribution</h3>
          <p className="portfolio-section-subtitle">Portfolio allocation by sector</p>
        </div>
        <div className="portfolio-chart-container">
          <div className="portfolio-pie-chart">
            <SectorPieChart data={portfolioData.holdings || []} />
          </div>
          <div className="portfolio-chart-legend">
            {getSectorData(portfolioData.holdings || []).map((sector, index) => (
              <div key={index} className="portfolio-legend-item">
                <div 
                  className="portfolio-legend-color" 
                  style={{ backgroundColor: getSectorColor(index) }}
                ></div>
                <div className="portfolio-legend-content">
                  <div className="portfolio-legend-label">{sector.name}</div>
                  <div className="portfolio-legend-value">
                    {formatCurrency(sector.value)} ({formatPercentage(sector.value, getTotalSectorValue(portfolioData.holdings || []))})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="holdings-section">
        <div className="section-header">
          <h3>Current Holdings</h3>
          <button className="view-all-btn">View All Positions</button>
        </div>
        <div className="holdings-table-container">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Avg Price</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>P&L</th>
                <th>Sector</th>
              </tr>
            </thead>
            <tbody>
              {(portfolioData.holdings || []).map((holding, index) => (
                <tr key={index} className="holding-row">
                  <td className="symbol-cell">
                    <span className="symbol">{holding.symbol}</span>
                  </td>
                  <td>{(holding.quantity || 0).toLocaleString()}</td>
                  <td>{formatCurrency(holding.avgPrice || 0)}</td>
                  <td>{holding.currentPrice ? formatCurrency(holding.currentPrice) : 'N/A'}</td>
                  <td>{holding.marketValue ? formatCurrency(holding.marketValue) : 'N/A'}</td>
                  <td className={`pnl-cell ${holding.pnl !== null ? (holding.pnl >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
                    {holding.pnl !== null ? 
                      `${holding.pnl >= 0 ? '+' : ''}${formatCurrency(holding.pnl)}` : 
                      'N/A'
                    }
                  </td>
                  <td className="sector-cell">{holding.sector || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
