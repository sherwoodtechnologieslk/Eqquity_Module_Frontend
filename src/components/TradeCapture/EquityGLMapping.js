import React, { useEffect, useState } from 'react';
import { portfolioAPI, chartOfAccountsAPI, investmentAccountAPI } from '../../services/api';

const EquityGLMapping = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [portfolioData, coaData, mappingData] = await Promise.all([
          portfolioAPI.getActivePortfolios(),
          chartOfAccountsAPI.getAll(),
          investmentAccountAPI.getMappings()
        ]);

        setPortfolios(portfolioData || []);

        // Prefer Asset accounts, but if none are tagged as Asset, fall back to all accounts
        const allAccounts = coaData || [];
        const assetAccounts = allAccounts.filter(acc => acc.account_type === 'Asset');
        setAccounts(assetAccounts.length > 0 ? assetAccounts : allAccounts);

        setMappings(mappingData || []);
      } catch (err) {
        console.error('Error loading Equity GL Mapping data:', err);
        setError('Failed to load Equity GL Mapping data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!selectedPortfolioId || !selectedAccountCode) {
      setError('Please select both a portfolio and an investment GL account.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const portfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);
      const account = accounts.find(a => a.account_code === selectedAccountCode);

      await investmentAccountAPI.saveMapping({
        portfolio_id: selectedPortfolioId,
        portfolio_name: portfolio ? portfolio.portfolioName : '',
        account_code: selectedAccountCode,
        account_name: account ? account.description : ''
      });

      // Reload mappings
      const mappingData = await investmentAccountAPI.getMappings();
      setMappings(mappingData || []);

      // Keep current selections
    } catch (err) {
      console.error('Error saving Equity GL mapping:', err);
      setError(err.message || 'Failed to save mapping. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this mapping?')) return;
    try {
      await investmentAccountAPI.deleteMapping(id);
      setMappings(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting Equity GL mapping:', err);
      setError('Failed to delete mapping. Please try again.');
    }
  };

  const findPortfolioName = (portfolioId, fallback) => {
    const p = portfolios.find(p => p.portfolioId === portfolioId);
    return p ? p.portfolioName : (fallback || portfolioId);
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(acc => {
    if (!accountSearch.trim()) return true;
    const term = accountSearch.toLowerCase();
    return (
      acc.account_code?.toLowerCase().includes(term) ||
      acc.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="equity-gl-mapping-page" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Equity GL Mapping</h1>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
          Link each portfolio to a specific <strong>Investment in Equity Securities</strong> GL account, per user and per portfolio.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.5fr)',
          gap: '2rem',
          marginBottom: '2rem'
        }}
      >
        {/* Left: Mapping form */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '1.5rem',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            minHeight: '450px'
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 0, marginBottom: '1.5rem' }}>
            Link Portfolio to Investment Account
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Portfolio <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
                disabled={loading || portfolios.length === 0}
              >
                <option value="">Select Portfolio</option>
                {portfolios.map(p => (
                  <option key={p.portfolioId} value={p.portfolioId}>
                    {p.portfolioName} ({p.portfolioId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Investment GL Account <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {/* Search box for GL accounts */}
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search by code or description..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem'
                }}
                disabled={loading || accounts.length === 0}
              />
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
                disabled={loading || filteredAccounts.length === 0}
              >
                <option value="">
                  {accounts.length === 0
                    ? 'No GL accounts available'
                    : filteredAccounts.length === 0
                      ? 'No accounts match your search'
                      : 'Select GL Account'}
                </option>
                {filteredAccounts.map(acc => (
                  <option key={acc.id} value={acc.account_code}>
                    {acc.account_code} – {acc.description}
                  </option>
                ))}
              </select>
              <small style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Typically choose your "Investment in Equity Securities" account for each portfolio.
                Use the search box above to quickly find it.
              </small>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  padding: '0.6rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: saving || loading ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Existing mappings */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '1.5rem',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            minHeight: '450px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 0, marginBottom: '1.5rem' }}>
            Existing Mappings
          </h2>

          {loading ? (
            <div style={{ padding: '1.5rem', color: '#6b7280' }}>Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div style={{ padding: '1.5rem', color: '#6b7280' }}>
              No investment account mappings defined yet. Select a portfolio and GL account to create one.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Portfolio</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Portfolio ID</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>GL Account Code</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>GL Account Name</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {findPortfolioName(m.portfolio_id, m.portfolio_name)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{m.portfolio_id}</td>
                      <td style={{ padding: '0.75rem' }}>{m.account_code}</td>
                      <td style={{ padding: '0.75rem' }}>{m.account_name || '-'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            backgroundColor: '#fef2f2',
                            color: '#b91c1c',
                            borderRadius: 4,
                            border: '1px solid #fecaca',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquityGLMapping;


