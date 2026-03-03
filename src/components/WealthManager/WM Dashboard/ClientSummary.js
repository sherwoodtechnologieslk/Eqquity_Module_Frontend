import React, { useMemo, useState } from 'react';
import './Styles/ClientSummary.css';

const ClientSummary = () => {
  const [segmentFilter, setSegmentFilter] = useState('all'); // all | individual | corporate | hni
  const [riskFilter, setRiskFilter] = useState('all'); // all | conservative | balanced | aggressive

  // Mock client dataset – can be wired to APIs later
  const clients = useMemo(
    () => [
      {
        id: 1,
        name: 'John Perera',
        code: 'CLT-001',
        type: 'Individual',
        segment: 'Retail',
        riskProfile: 'Moderate',
        portfolios: 3,
        aum: 12500000,
        ytdReturn: 8.4,
        rm: 'Client 1',
      },
      {
        id: 2,
        name: 'ABC Holdings PLC',
        code: 'CLT-002',
        type: 'Corporate',
        segment: 'Institutional',
        riskProfile: 'Balanced',
        portfolios: 5,
        aum: 78500000,
        ytdReturn: 7.2,
        rm: 'Client 2',
      },
      {
        id: 3,
        name: 'Global Trust Fund',
        code: 'CLT-003',
        type: 'Trust',
        segment: 'HNWI',
        riskProfile: 'Conservative',
        portfolios: 2,
        aum: 42000000,
        ytdReturn: 5.1,
        rm: 'Client 3',
      },
      {
        id: 4,
        name: 'Lakshmi De Silva',
        code: 'CLT-004',
        type: 'Individual',
        segment: 'HNWI',
        riskProfile: 'Aggressive',
        portfolios: 4,
        aum: 26500000,
        ytdReturn: 12.3,
        rm: 'Client 1',
      },
      {
        id: 5,
        name: 'Sunrise Pension Fund',
        code: 'CLT-005',
        type: 'Corporate',
        segment: 'Institutional',
        riskProfile: 'Balanced',
        portfolios: 3,
        aum: 51000000,
        ytdReturn: 6.8,
        rm: 'Client 2',
      },
      {
        id: 6,
        name: 'Chamila Fernando',
        code: 'CLT-006',
        type: 'Individual',
        segment: 'Retail',
        riskProfile: 'Moderate',
        portfolios: 2,
        aum: 8800000,
        ytdReturn: 9.1,
        rm: 'Client 3',
      },
    ],
    [],
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (v) => {
    if (v > 0) return '#16a34a';
    if (v < 0) return '#dc2626';
    return '#64748b';
  };

  const filteredClients = useMemo(
    () =>
      clients.filter((c) => {
        const typeOk =
          segmentFilter === 'all'
            ? true
            : segmentFilter === 'individual'
            ? c.type === 'Individual'
            : segmentFilter === 'corporate'
            ? c.type === 'Corporate'
            : c.segment === 'HNWI';

        const riskOk =
          riskFilter === 'all'
            ? true
            : riskFilter === 'conservative'
            ? c.riskProfile === 'Conservative'
            : riskFilter === 'balanced'
            ? c.riskProfile === 'Balanced' || c.riskProfile === 'Moderate'
            : c.riskProfile === 'Aggressive';

        return typeOk && riskOk;
      }),
    [clients, segmentFilter, riskFilter],
  );

  const totalAum = clients.reduce((sum, c) => sum + c.aum, 0);
  const totalClients = clients.length;
  const totalPortfolios = clients.reduce((sum, c) => sum + c.portfolios, 0);
  const avgYtdReturn =
    clients.length > 0
      ? clients.reduce((sum, c) => sum + c.ytdReturn, 0) / clients.length
      : 0;

  const topClient = [...clients].sort((a, b) => b.aum - a.aum)[0];
  const rmStats = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => {
      const key = c.rm || 'Unassigned';
      if (!map.has(key)) {
        map.set(key, { rm: key, clients: 0, aum: 0 });
      }
      const entry = map.get(key);
      entry.clients += 1;
      entry.aum += c.aum;
    });
    return Array.from(map.values()).sort((a, b) => b.aum - a.aum);
  }, [clients]);

  return (
    <div className="wcs-container">
      {/* Header */}
      <div className="wcs-header">
        <div className="wcs-header-content">
          <h2>Client Summary</h2>
          <p className="wcs-subtitle">
            Overview of client assets, segments and performance across all unit trust portfolios.
          </p>
        </div>
        <div className="wcs-header-actions">
          <select
            className="wcs-select"
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
          >
            <option value="all">All Client Types</option>
            <option value="individual">Individuals</option>
            <option value="corporate">Corporate / Funds</option>
            <option value="hni">HNWI / Trust</option>
          </select>
          <select
            className="wcs-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Profiles</option>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced / Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <button type="button" className="wcs-btn wcs-btn-primary">
            <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
            </svg>
            Export Client Report
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="wcs-summary-grid">
        <div className="wcs-summary-card wcs-card-1">
          <div className="wcs-summary-header">
            <span className="wcs-summary-label">Total Clients</span>
          </div>
          <div className="wcs-summary-value">{totalClients}</div>
          <div className="wcs-summary-note">{totalPortfolios} total portfolios</div>
        </div>

        <div className="wcs-summary-card wcs-card-2">
          <div className="wcs-summary-header">
            <span className="wcs-summary-label">Total Client AUM</span>
          </div>
          <div className="wcs-summary-value">{formatCurrency(totalAum)}</div>
          <div className="wcs-summary-note">All client segments</div>
        </div>

        <div className="wcs-summary-card wcs-card-3">
          <div className="wcs-summary-header">
            <span className="wcs-summary-label">Average YTD Return</span>
          </div>
          <div
            className="wcs-summary-value"
            style={{ color: getPerformanceColor(avgYtdReturn) }}
          >
            {formatPercent(avgYtdReturn)}
          </div>
          <div className="wcs-summary-note">Weighted equally across clients</div>
        </div>

        <div className="wcs-summary-card wcs-card-4">
          <div className="wcs-summary-header">
            <span className="wcs-summary-label">Top Client by AUM</span>
          </div>
          <div className="wcs-summary-value-small">
            {topClient?.name || '-'}
            <span className="wcs-pill">
              {formatCurrency(topClient?.aum ?? 0)} AUM
            </span>
          </div>
          <div className="wcs-summary-note">{topClient?.segment}</div>
        </div>
      </div>

      {/* Client table */}
      <div className="wcs-section">
        <div className="wcs-section-header">
          <h3>Client List</h3>
          <span className="wcs-section-tag">
            Showing {filteredClients.length} of {clients.length} clients
          </span>
        </div>
        <div className="wcs-table-container">
          <table className="wcs-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Code</th>
                <th>Type</th>
                <th>Segment</th>
                <th>Risk Profile</th>
                <th>Portfolios</th>
                <th>AUM</th>
                <th>YTD Return</th>
                <th>Relationship Manager</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="wcs-client-cell">
                      <span className="wcs-client-name">{c.name}</span>
                    </div>
                  </td>
                  <td>{c.code}</td>
                  <td>
                    <span className="wcs-badge wcs-badge-type">{c.type}</span>
                  </td>
                  <td>{c.segment}</td>
                  <td>
                    <span
                      className={`wcs-badge wcs-badge-risk wcs-risk-${c.riskProfile.toLowerCase()}`}
                    >
                      {c.riskProfile}
                    </span>
                  </td>
                  <td>{c.portfolios}</td>
                  <td>{formatCurrency(c.aum)}</td>
                  <td style={{ color: getPerformanceColor(c.ytdReturn) }}>
                    {formatPercent(c.ytdReturn)}
                  </td>
                  <td>{c.rm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relationship manager breakdown */}
      <div className="wcs-section">
        <div className="wcs-section-header">
          <h3>Relationship Manager Summary</h3>
        </div>
        <div className="wcs-table-container">
          <table className="wcs-table">
            <thead>
              <tr>
                <th>Relationship Manager</th>
                <th>Clients</th>
                <th>Total AUM</th>
                <th>Avg AUM / Client</th>
              </tr>
            </thead>
            <tbody>
              {rmStats.map((rm) => {
                const avgAum = rm.clients > 0 ? rm.aum / rm.clients : 0;
                return (
                  <tr key={rm.rm}>
                    <td>{rm.rm}</td>
                    <td>{rm.clients}</td>
                    <td>{formatCurrency(rm.aum)}</td>
                    <td>{formatCurrency(avgAum)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientSummary;

