import React, { useMemo, useState } from 'react';
import './Styles/AUMOverview.css';

const AUMOverview = () => {
  const [viewMode, setViewMode] = useState('segments'); // segments | funds
  const [currency, setCurrency] = useState('LKR');

  // Mock AUM data – can be wired to backend later
  const segments = useMemo(
    () => [
      { name: 'Retail', clients: 320, aum: 185000000000, change1M: 2.8 },
      { name: 'HNWI', clients: 74, aum: 96500000000, change1M: 3.5 },
      { name: 'Institutional', clients: 42, aum: 210000000000, change1M: 1.9 },
      { name: 'Pension / Provident', clients: 18, aum: 145000000000, change1M: 1.2 },
    ],
    [],
  );

  const assetClasses = useMemo(
    () => [
      { name: 'Equity Funds', aum: 220000000000, share: 36.5 },
      { name: 'Fixed Income', aum: 170000000000, share: 28.2 },
      { name: 'Money Market', aum: 65000000000, share: 10.8 },
      { name: 'Balanced Funds', aum: 90000000000, share: 15.0 },
      { name: 'Real Estate', aum: 45000000000, share: 7.5 },
      { name: 'Others', aum: 20000000000, share: 2.0 },
    ],
    [],
  );

  const funds = useMemo(
    () => [
      { name: 'Equity Growth Fund', code: 'EGF', aum: 62000000000, segment: 'Retail / HNWI' },
      { name: 'Dividend Income Fund', code: 'DIF', aum: 48000000000, segment: 'Retail / HNWI' },
      { name: 'Balanced Income Fund', code: 'BIF', aum: 39000000000, segment: 'Mixed' },
      { name: 'Corporate Bond Fund', code: 'CBF', aum: 52000000000, segment: 'Institutional' },
      { name: 'Pension Stable Fund', code: 'PSF', aum: 73000000000, segment: 'Pension / Provident' },
      { name: 'Money Market Fund', code: 'MMF', aum: 65000000000, segment: 'All Segments' },
    ],
    [],
  );

  const totalAum = segments.reduce((sum, s) => sum + s.aum, 0);
  const totalClients = segments.reduce((sum, s) => sum + s.clients, 0);
  const oneMonthNetFlow = totalAum * 0.022; // dummy ~2.2% net inflow

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (val) => {
    if (val > 0) return '#16a34a';
    if (val < 0) return '#dc2626';
    return '#64748b';
  };

  // Build data for simple horizontal bar chart of asset classes
  const maxAumAsset = Math.max(...assetClasses.map((a) => a.aum));

  return (
    <div className="wao-container">
      {/* Header */}
      <div className="wao-header">
        <div className="wao-header-content">
          <h2>AUM Overview</h2>
          <p className="wao-subtitle">
            Total assets under management by client segment and asset class.
          </p>
        </div>
        <div className="wao-header-actions">
          <select
            className="wao-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="LKR">LKR</option>
            <option value="USD">USD (view only)</option>
          </select>
          <button type="button" className="wao-btn wao-btn-primary">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
            </svg>
            Export AUM Report
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="wao-summary-grid">
        <div className="wao-summary-card wao-card-1">
          <div className="wao-summary-header">
            <span className="wao-summary-label">Total AUM</span>
          </div>
          <div className="wao-summary-value">
            {currency === 'LKR' ? formatCurrency(totalAum) : formatCurrency(totalAum / 360)}
          </div>
          <div className="wao-summary-note">
            {currency === 'LKR' ? 'LKR' : 'USD'} across all segments
          </div>
        </div>

        <div className="wao-summary-card wao-card-2">
          <div className="wao-summary-header">
            <span className="wao-summary-label">Total Clients</span>
          </div>
          <div className="wao-summary-value">{totalClients}</div>
          <div className="wao-summary-note">Active investing clients</div>
        </div>

        <div className="wao-summary-card wao-card-3">
          <div className="wao-summary-header">
            <span className="wao-summary-label">1M Net Inflow</span>
          </div>
          <div className="wao-summary-value">
            {currency === 'LKR'
              ? formatCurrency(oneMonthNetFlow)
              : formatCurrency(oneMonthNetFlow / 360)}
          </div>
          <div className="wao-summary-note">Approx. {formatPercent(2.2)} of AUM</div>
        </div>

        <div className="wao-summary-card wao-card-4">
          <div className="wao-summary-header">
            <span className="wao-summary-label">Largest Segment</span>
          </div>
          <div className="wao-summary-value-small">
            {segments[2].name}
            <span className="wao-pill">
              {formatCurrency(segments[2].aum)} {currency}
            </span>
          </div>
          <div className="wao-summary-note">{segments[2].clients} clients</div>
        </div>
      </div>

      {/* Segment breakdown */}
      <div className="wao-section">
        <div className="wao-section-header">
          <h3>Client Segment AUM</h3>
          <div className="wao-view-toggle">
            <button
              type="button"
              className={`wao-toggle-btn ${viewMode === 'segments' ? 'active' : ''}`}
              onClick={() => setViewMode('segments')}
            >
              By Segment
            </button>
            <button
              type="button"
              className={`wao-toggle-btn ${viewMode === 'funds' ? 'active' : ''}`}
              onClick={() => setViewMode('funds')}
            >
              Top Funds
            </button>
          </div>
        </div>

        {viewMode === 'segments' ? (
          <div className="wao-table-container">
            <table className="wao-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Clients</th>
                  <th>AUM</th>
                  <th>Avg. AUM / Client</th>
                  <th>1M Change</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => {
                  const avg = s.clients > 0 ? s.aum / s.clients : 0;
                  return (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td>{s.clients}</td>
                      <td>{formatCurrency(s.aum)}</td>
                      <td>{formatCurrency(avg)}</td>
                      <td style={{ color: getPerformanceColor(s.change1M) }}>
                        {formatPercent(s.change1M)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="wao-table-container">
            <table className="wao-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Code</th>
                  <th>AUM</th>
                  <th>Key Segments</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.code}>
                    <td>{f.name}</td>
                    <td>{f.code}</td>
                    <td>{formatCurrency(f.aum)}</td>
                    <td>{f.segment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset class allocation */}
      <div className="wao-section">
        <div className="wao-section-header">
          <h3>Asset Class Allocation</h3>
        </div>
        <div className="wao-asset-grid">
          <div className="wao-asset-bars">
            {assetClasses.map((a) => {
              const width = (a.aum / maxAumAsset) * 100;
              return (
                <div key={a.name} className="wao-asset-row">
                  <div className="wao-asset-label">
                    <span>{a.name}</span>
                    <span>{a.share.toFixed(1)}%</span>
                  </div>
                  <div className="wao-asset-bar">
                    <div
                      className="wao-asset-fill"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="wao-asset-meta">
                    <span>{formatCurrency(a.aum)} {currency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AUMOverview;

