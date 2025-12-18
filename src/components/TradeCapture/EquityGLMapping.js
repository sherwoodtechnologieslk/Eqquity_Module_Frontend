import React, { useEffect, useState } from 'react';
import { portfolioAPI, chartOfAccountsAPI, investmentAccountAPI } from '../../services/api';

const EquityGLMapping = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
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

      // Show success message
      setSuccess(`Successfully linked ${portfolio?.portfolioName || selectedPortfolioId} to ${account?.description || selectedAccountCode}`);
      
      // Clear form after successful save
      setSelectedPortfolioId('');
      setSelectedAccountCode('');
      setAccountSearch('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving Equity GL mapping:', err);
      setError(err.message || 'Failed to save mapping. Please try again.');
      setSuccess('');
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
    <div className="equity-gl-mapping-page" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#1e293b', letterSpacing: '-0.02em' }}>Equity GL Mapping</h1>
        <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.9375rem', lineHeight: '1.6' }}>
          Link each portfolio to a specific <strong style={{ color: '#475569' }}>Investment in Equity Securities</strong> GL account, per user and per portfolio.
        </p>
      </div>

      {error && (
        <div style={{ 
          marginBottom: '1.25rem', 
          padding: '0.875rem 1.125rem', 
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
          color: '#7f1d1d', 
          borderRadius: 6,
          border: '1px solid #fca5a5',
          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          marginBottom: '1.25rem', 
          padding: '0.875rem 1.125rem', 
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
          color: '#064e3b', 
          borderRadius: 6,
          border: '1px solid #6ee7b7',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
        }}>
          {success}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.5fr)',
          gap: '2.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Left: Mapping form */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '2rem',
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
            transition: 'box-shadow 0.2s ease'
          }}
        >
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            marginTop: 0, 
            marginBottom: '1.5rem',
            color: '#1e293b',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.75rem'
          }}>
            Link Portfolio to Investment Account
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#334155' }}>
                Portfolio <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => {
                  setSelectedPortfolioId(e.target.value);
                  // Check if this portfolio already has a mapping
                  const existingMapping = mappings.find(m => m.portfolio_id === e.target.value);
                  if (existingMapping) {
                    setSelectedAccountCode(existingMapping.account_code);
                    setSuccess(`This portfolio is already mapped to ${existingMapping.account_name || existingMapping.account_code}. You can update it by selecting a different account.`);
                    setTimeout(() => setSuccess(''), 5000);
                  } else {
                    setSelectedAccountCode('');
                    setSuccess('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  background: '#ffffff',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                disabled={loading || portfolios.length === 0}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              >
                <option value="">Select Portfolio</option>
                {portfolios.map(p => {
                  const hasMapping = mappings.some(m => m.portfolio_id === p.portfolioId);
                  return (
                    <option key={p.portfolioId} value={p.portfolioId}>
                      {p.portfolioName} ({p.portfolioId}){hasMapping ? ' ✓' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#334155' }}>
                Investment GL Account <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {/* Search box for GL accounts */}
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search by code or description..."
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  marginBottom: '0.75rem',
                  background: '#f8fafc',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}
                disabled={loading || accounts.length === 0}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.background = '#f8fafc';
                }}
              />
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  background: '#ffffff',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                disabled={loading || filteredAccounts.length === 0}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              >
                <option value="">
                  {accounts.length === 0
                    ? 'No GL accounts available'
                    : filteredAccounts.length === 0
                      ? 'No accounts match your search'
                      : 'Select GL Account'}
                </option>
                {filteredAccounts.map(acc => {
                  // Check if this account is already mapped to a portfolio
                  const isMapped = mappings.some(m => m.account_code === acc.account_code && m.portfolio_id !== selectedPortfolioId);
                  return (
                    <option key={acc.id} value={acc.account_code}>
                      {acc.account_code} – {acc.description}
                      {isMapped ? ' (already mapped)' : ''}
                    </option>
                  );
                })}
              </select>
              <small style={{ display: 'block', marginTop: 6, fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
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
                  padding: '0.75rem 2rem',
                  background: saving || loading 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: saving || loading ? 'not-allowed' : 'pointer',
                  boxShadow: saving || loading 
                    ? 'none' 
                    : '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                  transform: saving || loading ? 'none' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  if (!saving && !loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving && !loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                  }
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
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '2rem',
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
            transition: 'box-shadow 0.2s ease'
          }}
        >
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            marginTop: 0, 
            marginBottom: '1.5rem',
            color: '#1e293b',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '0.75rem'
          }}>
            Existing Mappings
          </h2>

          {loading ? (
            <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div style={{ 
              padding: '1.5rem', 
              color: '#64748b', 
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px dashed #cbd5e1'
            }}>
              No investment account mappings defined yet. Select a portfolio and GL account to create one.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                    borderBottom: '2px solid #cbd5e1'
                  }}>
                    <th style={{ textAlign: 'left', padding: '0.875rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio</th>
                    <th style={{ textAlign: 'left', padding: '0.875rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio ID</th>
                    <th style={{ textAlign: 'left', padding: '0.875rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GL Account Code</th>
                    <th style={{ textAlign: 'left', padding: '0.875rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GL Account Name</th>
                    <th style={{ textAlign: 'center', padding: '0.875rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, index) => (
                    <tr 
                      key={m.id} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        background: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem', color: '#1e293b' }}>
                        {findPortfolioName(m.portfolio_id, m.portfolio_name)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{m.portfolio_id}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{m.account_code}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{m.account_name || '-'}</td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          style={{
                            padding: '0.375rem 1rem',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            color: '#991b1b',
                            borderRadius: 6,
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.1)';
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


