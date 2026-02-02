import React, { useState, useEffect, useMemo } from 'react';
import './PortfolioVsSectors.css';
import { portfolioAPI, dashboardAPI } from '../../services/api';

const formatNum = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

const PortfolioVsSectors = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [portfolioData, setPortfolioData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSector, setExpandedSector] = useState(null);

  const loadPortfolios = async () => {
    try {
      const list = await portfolioAPI.getActivePortfolios();
      setPortfolios(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('PortfolioVsSectors load portfolios:', e);
      setPortfolios([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewRes, summaryData] = await Promise.all([
        portfolioAPI.getPortfolioOverview(selectedPortfolio === 'all' ? null : selectedPortfolio),
        dashboardAPI.getMarketSummary(),
      ]);
      const overview = overviewRes?.success ? overviewRes.data : overviewRes;
      setPortfolioData(overview || null);
      setMarketData(summaryData || null);
    } catch (e) {
      console.error('PortfolioVsSectors load error:', e);
      setError(e.message || 'Failed to load data.');
      setPortfolioData(null);
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedPortfolio]);

  const comparison = useMemo(() => {
    const holdings = portfolioData?.holdings || [];
    const totalValue = portfolioData?.summary?.totalValue || 0;
    const sectorPerformance = marketData?.sectorPerformance || [];

    const portfolioBySector = {};
    holdings.forEach((h) => {
      const sector = h.sector || 'Unclassified';
      const mv = h.marketValue || 0;
      portfolioBySector[sector] = (portfolioBySector[sector] || 0) + mv;
    });

    const marketBySector = {};
    sectorPerformance.forEach((s) => {
      const name = s.name || 'Other';
      marketBySector[name] = parseFloat(s.change) || 0;
    });

    const sectorSet = new Set([...Object.keys(portfolioBySector), ...Object.keys(marketBySector)]);
    const rows = [];
    sectorSet.forEach((sector) => {
      const portValue = portfolioBySector[sector] || 0;
      const portPct = totalValue ? (portValue / totalValue) * 100 : 0;
      const marketChange = marketBySector[sector] ?? null;
      rows.push({
        sector,
        portfolioWeight: portPct,
        portfolioValue: portValue,
        sectorChange: marketChange,
      });
    });
    rows.sort((a, b) => b.portfolioWeight - a.portfolioWeight);
    return { rows, totalValue: totalValue || 0 };
  }, [portfolioData, marketData]);

  const sectorToHoldings = useMemo(() => {
    const holdings = portfolioData?.holdings || [];
    const map = {};
    holdings.forEach((h) => {
      const sector = h.sector || 'Unclassified';
      if (!map[sector]) map[sector] = [];
      map[sector].push(h);
    });
    Object.keys(map).forEach((s) => map[s].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0)));
    return map;
  }, [portfolioData]);

  if (loading) {
    return (
      <div className="pvs-root">
        <div className="pvs-header">
          <div>
            <h1 className="pvs-title">Sector Allocation & Performance</h1>
            <p className="pvs-subtitle">Compare your portfolio allocation with market sector performance</p>
          </div>
        </div>
        <div className="pvs-loading">
          <div className="pvs-spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pvs-root">
      <div className="pvs-header">
        <div>
          <h1 className="pvs-title">Sector Allocation & Performance</h1>
          <p className="pvs-subtitle">Compare your portfolio allocation with market sector performance</p>
        </div>
        <div className="pvs-header-actions">
          <div className="pvs-select-wrap">
            <label>Portfolio</label>
            <select
              className="pvs-select"
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.portfolioId || p.id} value={p.portfolioId || p.id}>
                  {p.portfolioName || p.portfolio || p.name || 'Portfolio'}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="pvs-btn pvs-btn-ghost" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="pvs-error">
          <span>{error}</span>
          <button type="button" className="pvs-btn pvs-btn-ghost" onClick={loadData}>Retry</button>
        </div>
      )}

      <div className="pvs-intro">
        <p>
          <strong>Your portfolio weight</strong> is the share of your total portfolio value in each sector.
          <strong> Sector performance</strong> is the market’s average change (%) for that sector. Use this to see where you’re tilted vs the market.
        </p>
      </div>

      <div className="pvs-card pvs-table-card">
        <div className="pvs-table-wrap">
          <table className="pvs-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th className="pvs-num">Your portfolio</th>
                <th className="pvs-num">Sector performance</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="pvs-empty-cell">
                    No sector data. Add holdings with sector assigned and ensure market summary data is available.
                  </td>
                </tr>
              ) : (
                comparison.rows.map((row) => {
                  const hasHoldings = (sectorToHoldings[row.sector] || []).length > 0;
                  const isExpanded = expandedSector === row.sector;
                  return (
                    <React.Fragment key={row.sector}>
                      <tr
                        className={`pvs-sector-row ${hasHoldings ? 'pvs-sector-row-clickable' : ''} ${isExpanded ? 'pvs-sector-row-expanded' : ''}`}
                        onClick={() => hasHoldings && setExpandedSector((s) => (s === row.sector ? null : row.sector))}
                        role={hasHoldings ? 'button' : undefined}
                        tabIndex={hasHoldings ? 0 : undefined}
                        onKeyDown={(e) => hasHoldings && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setExpandedSector((s) => (s === row.sector ? null : row.sector)))}
                      >
                        <td className="pvs-sector-name">
                          {hasHoldings && (
                            <span className={`pvs-chevron ${isExpanded ? 'pvs-chevron-open' : ''}`} aria-hidden>▼</span>
                          )}
                          <span>{row.sector}</span>
                          {hasHoldings && (
                            <span className="pvs-row-hint">View companies</span>
                          )}
                        </td>
                        <td className="pvs-num">
                          <span className="pvs-weight">{formatNum(row.portfolioWeight)}%</span>
                          {row.portfolioValue > 0 && (
                            <span className="pvs-value">LKR {formatNum(row.portfolioValue)}</span>
                          )}
                        </td>
                        <td className="pvs-num">
                          {row.sectorChange !== null ? (
                            <span className={row.sectorChange >= 0 ? 'pvs-positive' : 'pvs-negative'}>
                              {row.sectorChange >= 0 ? '+' : ''}{formatNum(row.sectorChange)}%
                            </span>
                          ) : (
                            <span className="pvs-muted">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasHoldings && (
                        <tr className="pvs-expanded-row">
                          <td colSpan={3} className="pvs-expanded-cell">
                            <div className="pvs-holdings">
                              <div className="pvs-holdings-title">Companies in {row.sector}</div>
                              <ul className="pvs-holdings-list">
                                {(sectorToHoldings[row.sector] || []).map((h, idx) => (
                                  <li key={`${row.sector}-${h.symbol || ''}-${h.companyName || ''}-${idx}`} className="pvs-holding-item">
                                    <div className="pvs-holding-main">
                                      <span className="pvs-holding-symbol">{h.symbol || '—'}</span>
                                      <span className="pvs-holding-name">{h.companyName || h.name || '—'}</span>
                                    </div>
                                    <div className="pvs-holding-details">
                                      <span className="pvs-holding-qty">{(h.quantity || 0).toLocaleString()} shares</span>
                                      <span className="pvs-holding-value">LKR {formatNum(h.marketValue)}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {comparison.totalValue > 0 && (
          <div className="pvs-total-row">
            Total portfolio value: LKR {formatNum(comparison.totalValue)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioVsSectors;
