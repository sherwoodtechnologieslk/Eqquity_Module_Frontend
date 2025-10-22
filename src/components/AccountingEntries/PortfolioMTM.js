import React, { useState, useEffect } from 'react';
import { portfolioAPI, transactionEntryAPI } from '../../services/api';
import './Styles/PortfolioMTM.css';

const PortfolioMTM = () => {
  const [portfolioMTMData, setPortfolioMTMData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState('All');
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [mtmData, setMtmData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Load MTM data function (same as Mark-to-Market Valuation screen)
  const loadMtmData = async (portfolioId) => {
    setLoading(true);
    try {
      if (portfolioId === 'All') {
        console.log('🔍 PORTFOLIO MTM - Loading MTM data for all portfolios');
        // Load data for all portfolios
        const allPortfolioData = [];
        for (const portfolio of portfolios) {
          try {
            const data = await transactionEntryAPI.getPortfolioPositions(portfolio.id);
            // Add portfolio name to each item for identification
            const dataWithPortfolio = data.map(item => ({
              ...item,
              portfolioName: portfolio.portfolioName,
              portfolioId: portfolio.id
            }));
            allPortfolioData.push(...dataWithPortfolio);
          } catch (error) {
            console.error(`❌ PORTFOLIO MTM - Error loading data for portfolio ${portfolio.portfolioName}:`, error);
          }
        }
        console.log('🔍 PORTFOLIO MTM - All portfolios MTM data loaded:', allPortfolioData);
        setMtmData(allPortfolioData);
      } else if (portfolioId) {
        console.log('🔍 PORTFOLIO MTM - Loading MTM data for portfolio:', portfolioId);
        const data = await transactionEntryAPI.getPortfolioPositions(portfolioId);
        // Add portfolio name to each item
        const portfolio = portfolios.find(p => p.id === portfolioId);
        const dataWithPortfolio = data.map(item => ({
          ...item,
          portfolioName: portfolio ? portfolio.portfolioName : 'Unknown',
          portfolioId: portfolioId
        }));
        console.log('🔍 PORTFOLIO MTM - MTM data loaded:', dataWithPortfolio);
        setMtmData(dataWithPortfolio);
      } else {
        setMtmData([]);
      }
    } catch (error) {
      console.error('❌ PORTFOLIO MTM - Error loading MTM data:', error);
      setMtmData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio totals (same logic as Mark-to-Market Valuation screen)
  const calculatePortfolioTotals = () => {
    if (!mtmData.length) return { 
      totalCost: 0, 
      totalGrossSales: 0, 
      totalCharges: 0, 
      totalProjectedSalesWithCOF: 0, 
      totalUnrealizedPnL: 0,
      totalMarket: 0
    };
    
    const totalCost = mtmData.reduce((sum, item) => sum + (item.costValue || 0), 0);
    const totalGrossSales = mtmData.reduce((sum, item) => sum + (item.grossSales || 0), 0);
    const totalCharges = mtmData.reduce((sum, item) => sum + (item.charges || 0), 0);
    const totalProjectedSalesWithCOF = mtmData.reduce((sum, item) => sum + (item.projectedSalesWithCOF || 0), 0);
    
    // Calculate total market value - using grossSales as it represents current market value
    const totalMarket = mtmData.reduce((sum, item) => sum + (item.grossSales || 0), 0);
    
    // Unrealized P&L = totalProjectedSalesWithCOF - (totalCost + totalCharges) (same as MTM screen)
    const totalUnrealizedPnL = totalProjectedSalesWithCOF - (totalCost + totalCharges);
    
    return { 
      totalCost, 
      totalGrossSales, 
      totalCharges, 
      totalProjectedSalesWithCOF, 
      totalUnrealizedPnL,
      totalMarket
    };
  };

  useEffect(() => {
    // Fetch portfolios
    const fetchPortfolios = async () => {
      try {
        setPortfoliosLoading(true);
        const portfoliosData = await portfolioAPI.getActivePortfolios();
        console.log('🔍 PORTFOLIO MTM - Loaded portfolios:', portfoliosData);
        setPortfolios(portfoliosData);
      } catch (err) {
        console.error('❌ PORTFOLIO MTM - Error loading active portfolios:', err);
        setError('Failed to fetch portfolios');
        setPortfolios([]);
      } finally {
        setPortfoliosLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  // Load MTM data when portfolio selection changes
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolio) {
      loadMtmData(selectedPortfolio);
    }
  }, [selectedPortfolio, portfolios]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercentage = (value, baseValue) => {
    const percentage = ((value - baseValue) / baseValue) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getUniquePortfolios = () => {
    if (!portfolios || portfolios.length === 0) {
      return ['All'];
    }
    // Use portfolio IDs for selection (same as Mark-to-Market Valuation screen)
    return ['All', ...portfolios.map(portfolio => portfolio.id)];
  };

  const getPortfolioName = (portfolioId) => {
    if (portfolioId === 'All') return 'All';
    const portfolio = portfolios.find(p => p.id === portfolioId);
    return portfolio ? portfolio.portfolioName : portfolioId;
  };

  // Get calculated totals from MTM data
  const totals = calculatePortfolioTotals();
  
  // Create filtered data based on selection
  const filteredData = mtmData.length > 0 ? (() => {
    if (selectedPortfolio === 'All') {
      // Group by portfolio and show each portfolio's totals
      const portfolioGroups = {};
      mtmData.forEach(item => {
        const portfolioName = item.portfolioName || 'Unknown';
        if (!portfolioGroups[portfolioName]) {
          portfolioGroups[portfolioName] = {
            costValue: 0,
            grossSales: 0,
            charges: 0,
            projectedSalesWithCOF: 0
          };
        }
        portfolioGroups[portfolioName].costValue += item.costValue || 0;
        portfolioGroups[portfolioName].grossSales += item.grossSales || 0;
        portfolioGroups[portfolioName].charges += item.charges || 0;
        portfolioGroups[portfolioName].projectedSalesWithCOF += item.projectedSalesWithCOF || 0;
      });

      return Object.entries(portfolioGroups).map(([portfolioName, data], index) => ({
        id: index + 1,
        date: new Date().toISOString().split('T')[0],
        portfolioName: portfolioName,
        portfolioValue: data.costValue,
        currentMTMValue: data.grossSales,
        unrealizedPnL: data.projectedSalesWithCOF - (data.costValue + data.charges)
      }));
    } else {
      // Show single portfolio data
      return [{
        id: 1,
        date: new Date().toISOString().split('T')[0],
        portfolioName: getPortfolioName(selectedPortfolio),
        portfolioValue: totals.totalCost,
        currentMTMValue: totals.totalMarket,
        unrealizedPnL: totals.totalUnrealizedPnL
      }];
    }
  })() : [];

  const totalUnrealizedPnL = totals.totalUnrealizedPnL;
  const totalPortfolioValue = totals.totalCost;
  const totalMTMValue = totals.totalMarket;

  if (loading) {
    return (
      <div className="portfolio-mtm-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Portfolio MTM Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-mtm-container">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-mtm-container">
      <div className="portfolio-mtm-header">
        <h2>Portfolio Mark-to-Market</h2>
        <p>Daily portfolio valuations and unrealized P&L tracking</p>
      </div>

      {/* Filters */}
      <div className="pmtm-filters-section">
        <div className="pmtm-filter-group">
          <label htmlFor="portfolio-filter">Portfolio:</label>
          <select
            id="portfolio-filter"
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            className="pmtm-filter-select"
            disabled={portfoliosLoading}
          >
            {portfoliosLoading ? (
              <option value="All">Loading portfolios...</option>
            ) : (
              getUniquePortfolios().map(portfolioId => (
                <option key={portfolioId} value={portfolioId}>
                  {getPortfolioName(portfolioId)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="pmtm-filter-group">
          <label htmlFor="start-date">From Date:</label>
          <input
            id="start-date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="pmtm-filter-input"
          />
        </div>

        <div className="pmtm-filter-group">
          <label htmlFor="end-date">To Date:</label>
          <input
            id="end-date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="pmtm-filter-input"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="pmtm-summary-cards">
        <div className="pmtm-summary-card">
          <h4>Total Portfolio Value</h4>
          <p className="pmtm-summary-value">{formatCurrency(totalPortfolioValue)}</p>
        </div>
        <div className="pmtm-summary-card">
          <h4>Total MTM Value</h4>
          <p className="pmtm-summary-value">{formatCurrency(totalMTMValue)}</p>
        </div>
        <div className="pmtm-summary-card">
          <h4>Total Unrealized P&L</h4>
          <p className={`pmtm-summary-value ${totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalUnrealizedPnL)}
          </p>
        </div>
        <div className="pmtm-summary-card">
          <h4>Total Return</h4>
          <p className={`pmtm-summary-value ${totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
            {formatPercentage(totalMTMValue, totalPortfolioValue)}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="pmtm-table-container">
        <table className="portfolio-mtm-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Portfolio</th>
              <th>Portfolio Value</th>
              <th>Current MTM Value</th>
              <th>Unrealized P&L</th>
              <th>Return %</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.date)}</td>
                <td>{item.portfolioName}</td>
                <td>{formatCurrency(item.portfolioValue)}</td>
                <td>{formatCurrency(item.currentMTMValue)}</td>
                <td className={item.unrealizedPnL >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(item.unrealizedPnL)}
                </td>
                <td className={item.unrealizedPnL >= 0 ? 'positive' : 'negative'}>
                  {formatPercentage(item.currentMTMValue, item.portfolioValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && !loading && (
        <div className="pmtm-no-data-message">
          <h3>No Portfolio MTM Data Available</h3>
          <p>No portfolio mark-to-market data found. Data will appear here once portfolio valuations are calculated.</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioMTM;
