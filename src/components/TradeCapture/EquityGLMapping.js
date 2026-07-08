import React, { useEffect, useMemo, useState } from 'react';
import { portfolioAPI, chartOfAccountsAPI, investmentAccountAPI } from '../../services/api';
import './Styles/EquityGLMapping.css';

const PAGE_SIZE = 8;

const IconSearch = () => (
  <svg className="eglm-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 14l3.5 3.5" />
  </svg>
);

const IconSave = () => (
  <svg className="eglm-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const IconTrash = () => (
  <svg className="eglm-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.5 5.5h11M8 5.5V4.25A.75.75 0 018.75 3.5h2.5a.75.75 0 01.75.75V5.5M7.5 8.5v5M12.5 8.5v5M6 5.5l.5 10.25A1.25 1.25 0 007.75 17h4.5a1.25 1.25 0 001.25-1.25L14 5.5" />
  </svg>
);

const IconArrow = () => (
  <svg className="eglm-preview-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconSort = ({ direction }) => (
  <svg className="eglm-sort-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    {direction === 'asc' && <path d="M8 4l4 5H4l4-5z" />}
    {direction === 'desc' && <path d="M8 12L4 7h8l-4 5z" />}
    {!direction && <path d="M8 4l3 4H5l3-4zm0 8l-3-4h6l-3 4z" opacity="0.35" />}
  </svg>
);

const IconSpinner = () => (
  <svg className="eglm-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const IconEmpty = () => (
  <svg className="eglm-empty-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true">
    <rect x="8" y="10" width="32" height="28" rx="3" strokeWidth="1.5" />
    <path strokeWidth="1.5" strokeLinecap="round" d="M16 20h16M16 26h10" />
  </svg>
);

const IconInfo = () => (
  <svg className="eglm-wf-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
    <path strokeLinecap="round" strokeWidth="1.75" d="M12 11v5M12 8h.01" />
  </svg>
);

const IconTrade = () => (
  <svg className="eglm-wf-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7h12M8 12h8M8 17h4M4 7h.01M4 12h.01M4 17h.01" />
  </svg>
);

const IconInvestment = () => (
  <svg className="eglm-wf-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
  </svg>
);

const IconControl = () => (
  <svg className="eglm-wf-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" />
    <circle cx="12" cy="12" r="3.25" strokeWidth="1.75" />
  </svg>
);

const IconBank = () => (
  <svg className="eglm-wf-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" />
  </svg>
);

const IconFlowArrow = () => (
  <svg className="eglm-wf-connector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M13 7l6 5-6 5" />
  </svg>
);

const WorkflowProcessCard = ({ type, title, badge, lines, entries }) => (
  <article className={`eglm-wf-card eglm-wf-card--${type}`}>
    <div className="eglm-wf-card__icon-wrap" aria-hidden="true">
      {type === 'trade' && <IconTrade />}
      {type === 'investment' && <IconInvestment />}
      {type === 'control' && <IconControl />}
      {type === 'bank' && <IconBank />}
      {type === 'settlement' && <IconTrade />}
    </div>
    <div className="eglm-wf-card__body">
      <div className="eglm-wf-card__top">
        <h4 className="eglm-wf-card__title">{title}</h4>
        {badge && <span className="eglm-wf-card__badge">{badge}</span>}
      </div>
      <ul className="eglm-wf-card__lines">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {entries && entries.length > 0 && (
        <div className="eglm-wf-card__entries">
          {entries.map((entry) => (
            <span key={entry} className="eglm-wf-entry">{entry}</span>
          ))}
        </div>
      )}
    </div>
  </article>
);

const WorkflowConnector = ({ label }) => (
  <div className="eglm-wf-connector" aria-hidden="true">
    <span className="eglm-wf-connector__label">{label}</span>
    <IconFlowArrow />
  </div>
);

const WorkflowDiagram = () => {
  return (
    <div className="eglm-workflow">
      <header className="eglm-wf-header">
        <p className="eglm-wf-eyebrow">Process Reference</p>
        <h2 className="eglm-wf-title">Settlement Control (Share Trading) Workflow</h2>
        <p className="eglm-wf-subtitle">
          End-to-end accounting flow for equity buy and sell transactions across trade date and settlement date postings.
        </p>
      </header>

      <div className="eglm-wf-info" role="note">
        <div className="eglm-wf-info__icon" aria-hidden="true">
          <IconInfo />
        </div>
        <div className="eglm-wf-info__content">
          <h3 className="eglm-wf-info__title">How this workflow works</h3>
          <p className="eglm-wf-info__text">
            This is a <strong>reference workflow only</strong>. It illustrates how share buy/sell postings move between
            Investment GL, Settlement Control GL, and Bank GL. It does not create mappings, post journals, or execute
            any transactions.
          </p>
        </div>
      </div>

      <div className="eglm-wf-overview">
        <div className="eglm-wf-overview__item eglm-wf-overview__item--trade">
          <span className="eglm-wf-overview__phase">Phase 1</span>
          <span className="eglm-wf-overview__name">Trade Date</span>
          <span className="eglm-wf-overview__note">No bank movement</span>
        </div>
        <div className="eglm-wf-overview__divider" aria-hidden="true">
          <IconFlowArrow />
        </div>
        <div className="eglm-wf-overview__item eglm-wf-overview__item--settlement">
          <span className="eglm-wf-overview__phase">Phase 2</span>
          <span className="eglm-wf-overview__name">Settlement Date</span>
          <span className="eglm-wf-overview__note">Bank movement</span>
        </div>
      </div>

      <section className="eglm-wf-phase eglm-wf-phase--trade" aria-labelledby="eglm-wf-phase-trade">
        <div className="eglm-wf-phase__header">
          <div className="eglm-wf-phase__heading">
            <span className="eglm-wf-phase__badge eglm-wf-phase__badge--trade">Phase 1</span>
            <h3 id="eglm-wf-phase-trade" className="eglm-wf-phase__title">Trade Date</h3>
          </div>
          <span className="eglm-wf-phase__status eglm-wf-phase__status--muted">No Bank Movement</span>
        </div>
        <p className="eglm-wf-phase__desc">
          When a buy or sell is saved, investment and control accounts are posted on the trade date. Cash does not move yet.
        </p>

        <div className="eglm-wf-flow" role="list" aria-label="Trade date accounting flow">
          <WorkflowProcessCard
            type="trade"
            title="BUY / SELL Saved"
            badge="Trade Entry"
            lines={['Use Trade Date', 'Uses Equity GL Mapping (existing)']}
          />
          <WorkflowConnector label="posts" />
          <WorkflowProcessCard
            type="investment"
            title="Investment GL"
            badge="Portfolio Mapped"
            lines={['Dr/Cr Investment + fees', 'Gain/Loss for sells (policy)']}
            entries={['Dr Investment', 'Cr Fees / Gain']}
          />
          <WorkflowConnector label="balances with" />
          <WorkflowProcessCard
            type="control"
            title="Settlement Control GL"
            badge="Control Account"
            lines={['BUY: Cr Payable Control', 'SELL: Dr Receivable Control']}
            entries={['BUY: Cr Control', 'SELL: Dr Control']}
          />
        </div>
      </section>

      <section className="eglm-wf-phase eglm-wf-phase--settlement" aria-labelledby="eglm-wf-phase-settlement">
        <div className="eglm-wf-phase__header">
          <div className="eglm-wf-phase__heading">
            <span className="eglm-wf-phase__badge eglm-wf-phase__badge--settlement">Phase 2</span>
            <h3 id="eglm-wf-phase-settlement" className="eglm-wf-phase__title">Settlement Date</h3>
          </div>
          <span className="eglm-wf-phase__status eglm-wf-phase__status--active">Bank Movement</span>
        </div>
        <p className="eglm-wf-phase__desc">
          On settlement date, the control account is cleared against the mapped bank GL. Investment balances remain unchanged.
        </p>

        <div className="eglm-wf-flow" role="list" aria-label="Settlement date accounting flow">
          <WorkflowProcessCard
            type="settlement"
            title="Settlement Posting"
            badge="Settlement Event"
            lines={['Use Settlement Date', 'Control ↔ Bank only']}
          />
          <WorkflowConnector label="clears" />
          <WorkflowProcessCard
            type="control"
            title="Settlement Control GL"
            badge="Control Account"
            lines={['BUY: Dr Payable Control', 'SELL: Cr Receivable Control']}
            entries={['BUY: Dr Control', 'SELL: Cr Control']}
          />
          <WorkflowConnector label="via bank mapping" />
          <WorkflowProcessCard
            type="bank"
            title="Bank GL"
            badge="Cash Account"
            lines={['BUY: Cr Bank', 'SELL: Dr Bank']}
            entries={['BUY: Cr Bank', 'SELL: Dr Bank']}
          />
        </div>
      </section>

      <section className="eglm-wf-reference" aria-labelledby="eglm-wf-reference-title">
        <div className="eglm-wf-reference__header">
          <h3 id="eglm-wf-reference-title" className="eglm-wf-reference__title">GL Account Reference</h3>
          <p className="eglm-wf-reference__subtitle">Key components used in the share trading settlement control process</p>
        </div>

        <div className="eglm-wf-reference__group">
          <h4 className="eglm-wf-reference__group-title">Transaction Inputs</h4>
          <div className="eglm-wf-reference__grid">
            <article className="eglm-wf-ref-card eglm-wf-ref-card--trade">
              <div className="eglm-wf-ref-card__icon"><IconTrade /></div>
              <div>
                <div className="eglm-wf-ref-card__head">
                  <span className="eglm-wf-ref-card__title">Input Transaction</span>
                  <span className="eglm-wf-ref-card__tag">Trade Entry</span>
                </div>
                <p className="eglm-wf-ref-card__text">Buy/Sell saved with Trade Date and Settlement Date</p>
              </div>
            </article>
          </div>
        </div>

        <div className="eglm-wf-reference__group">
          <h4 className="eglm-wf-reference__group-title">General Ledger Accounts</h4>
          <div className="eglm-wf-reference__grid">
            <article className="eglm-wf-ref-card eglm-wf-ref-card--investment">
              <div className="eglm-wf-ref-card__icon"><IconInvestment /></div>
              <div>
                <div className="eglm-wf-ref-card__head">
                  <span className="eglm-wf-ref-card__title">Investment GL</span>
                  <span className="eglm-wf-ref-card__tag">Asset</span>
                </div>
                <p className="eglm-wf-ref-card__text">Mapped by portfolio on the Investment GL Mapping tab</p>
              </div>
            </article>
            <article className="eglm-wf-ref-card eglm-wf-ref-card--control">
              <div className="eglm-wf-ref-card__icon"><IconControl /></div>
              <div>
                <div className="eglm-wf-ref-card__head">
                  <span className="eglm-wf-ref-card__title">Settlement Control GL</span>
                  <span className="eglm-wf-ref-card__tag">Control</span>
                </div>
                <p className="eglm-wf-ref-card__text">Payable control for buys; receivable control for sells</p>
              </div>
            </article>
            <article className="eglm-wf-ref-card eglm-wf-ref-card--bank">
              <div className="eglm-wf-ref-card__icon"><IconBank /></div>
              <div>
                <div className="eglm-wf-ref-card__head">
                  <span className="eglm-wf-ref-card__title">Bank GL</span>
                  <span className="eglm-wf-ref-card__tag">Cash</span>
                </div>
                <p className="eglm-wf-ref-card__text">Mapped from bank account on the GL Mapping screen</p>
              </div>
            </article>
          </div>
        </div>

        <p className="eglm-wf-footnote">
          This diagram describes the target accounting flow. Configuration and postings are managed in their respective mapping and transaction screens.
        </p>
      </section>
    </div>
  );
};

const EquityGLMapping = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('investment');

  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ portfolio: '', account: '' });
  const [touched, setTouched] = useState({ portfolio: false, account: false });

  const [gridSearch, setGridSearch] = useState('');
  const [sortKey, setSortKey] = useState('portfolio');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

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

        const allAccounts = coaData || [];
        const assetAccounts = allAccounts.filter(acc => acc.account_type?.toLowerCase() === 'asset');
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

  const selectedPortfolio = useMemo(
    () => portfolios.find(p => p.portfolioId === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId]
  );

  const selectedAccount = useMemo(
    () => accounts.find(a => a.account_code === selectedAccountCode) || null,
    [accounts, selectedAccountCode]
  );

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    const term = accountSearch.toLowerCase();
    return accounts.filter(acc =>
      acc.account_code?.toLowerCase().includes(term) ||
      acc.description?.toLowerCase().includes(term)
    );
  }, [accounts, accountSearch]);

  const findPortfolioName = (portfolioId, fallback) => {
    const p = portfolios.find(item => item.portfolioId === portfolioId);
    return p ? p.portfolioName : (fallback || portfolioId);
  };

  const validateFields = () => {
    const next = {
      portfolio: selectedPortfolioId ? '' : 'Select a portfolio to continue.',
      account: selectedAccountCode ? '' : 'Select an investment GL account to continue.'
    };
    setFieldErrors(next);
    setTouched({ portfolio: true, account: true });
    return !next.portfolio && !next.account;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      setError('Please complete all required fields before saving.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await investmentAccountAPI.saveMapping({
        portfolio_id: selectedPortfolioId,
        portfolio_name: selectedPortfolio ? selectedPortfolio.portfolioName : '',
        account_code: selectedAccountCode,
        account_name: selectedAccount ? selectedAccount.description : ''
      });

      const mappingData = await investmentAccountAPI.getMappings();
      setMappings(mappingData || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error saving Equity GL mapping:', err);
      setError(err.message || 'Failed to save mapping. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this mapping?')) return;
    setDeletingId(id);
    setError('');
    try {
      await investmentAccountAPI.deleteMapping(id);
      setMappings(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting Equity GL mapping:', err);
      setError('Failed to delete mapping. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const processedMappings = useMemo(() => {
    const term = gridSearch.trim().toLowerCase();
    let rows = mappings.map(m => ({
      ...m,
      displayPortfolio: findPortfolioName(m.portfolio_id, m.portfolio_name)
    }));

    if (term) {
      rows = rows.filter(m =>
        m.displayPortfolio?.toLowerCase().includes(term) ||
        m.portfolio_id?.toLowerCase().includes(term) ||
        m.account_code?.toLowerCase().includes(term) ||
        m.account_name?.toLowerCase().includes(term)
      );
    }

    rows.sort((a, b) => {
      const getVal = (row) => {
        if (sortKey === 'portfolio') return row.displayPortfolio || '';
        if (sortKey === 'portfolio_id') return row.portfolio_id || '';
        if (sortKey === 'account_code') return row.account_code || '';
        return row.account_name || '';
      };
      const av = getVal(a).toString().toLowerCase();
      const bv = getVal(b).toString().toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [mappings, gridSearch, sortKey, sortDir, portfolios]);

  const totalPages = Math.max(1, Math.ceil(processedMappings.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMappings = processedMappings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const previewReady = Boolean(selectedPortfolio && selectedAccount);
  const portfolioError = touched.portfolio ? fieldErrors.portfolio : '';
  const accountError = touched.account ? fieldErrors.account : '';

  const sortColumns = [
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'portfolio_id', label: 'Portfolio ID' },
    { key: 'account_code', label: 'GL Account Code' },
    { key: 'account_name', label: 'GL Account Name' }
  ];

  return (
    <div className="eglm-page">
      <header className="eglm-page-header">
        <div className="eglm-page-header__text">
          <p className="eglm-page-eyebrow">GL Configuration</p>
          <h1 className="eglm-page-title">Equity GL Mapping</h1>
          <p className="eglm-page-subtitle">
            Link each portfolio to a dedicated <span className="eglm-page-subtitle__accent">Investment in Equity Securities</span> GL account, scoped per user and per portfolio.
          </p>
        </div>
      </header>

      <div className="eglm-tab-bar" role="tablist" aria-label="Equity GL Mapping tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'investment'}
          className={`eglm-tab-bar__btn ${activeTab === 'investment' ? 'eglm-tab-bar__btn--active' : ''}`}
          onClick={() => setActiveTab('investment')}
        >
          Investment GL Mapping
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'workflow'}
          className={`eglm-tab-bar__btn ${activeTab === 'workflow' ? 'eglm-tab-bar__btn--active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Settlement Control – Workflow
        </button>
      </div>

      {error && (
        <div className="eglm-alert eglm-alert--error" role="alert">
          {error}
        </div>
      )}

      {activeTab === 'workflow' ? (
        <div className="eglm-tab-panel" role="tabpanel">
          <WorkflowDiagram />
        </div>
      ) : (
        <div className="eglm-tab-panel" role="tabpanel">
          <div className="eglm-workspace">
            {/* Primary: Mapping form */}
            <section className="eglm-card eglm-card--primary" aria-labelledby="eglm-form-title">
              <div className="eglm-card__header">
                <div>
                  <p className="eglm-card__eyebrow">New Mapping</p>
                  <h2 id="eglm-form-title" className="eglm-card__title">Link Portfolio to Investment Account</h2>
                  <p className="eglm-card__desc">Configure how equity trades post to the investment GL for each portfolio.</p>
                </div>
              </div>

              <div className="eglm-card__body">
                <div className="eglm-form-section">
                  <h3 className="eglm-form-section__title">1. Portfolio Selection</h3>
                  <div className="eglm-field">
                    <label className="eglm-label" htmlFor="eglm-portfolio">
                      Portfolio <span className="eglm-required" aria-hidden="true">*</span>
                    </label>
                    <div className={`eglm-select-wrap ${portfolioError ? 'eglm-select-wrap--error' : ''}`}>
                      <select
                        id="eglm-portfolio"
                        className="eglm-select"
                        value={selectedPortfolioId}
                        onChange={(e) => {
                          setSelectedPortfolioId(e.target.value);
                          setFieldErrors(prev => ({ ...prev, portfolio: '' }));
                          setTouched(prev => ({ ...prev, portfolio: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, portfolio: true }))}
                        disabled={loading || portfolios.length === 0}
                      >
                        <option value="">Select portfolio</option>
                        {portfolios.map(p => (
                          <option key={p.portfolioId} value={p.portfolioId}>
                            {p.portfolioName} ({p.portfolioId})
                          </option>
                        ))}
                      </select>
                    </div>
                    {portfolioError ? (
                      <p className="eglm-field-error" role="alert">{portfolioError}</p>
                    ) : (
                      <p className="eglm-helper">Choose the portfolio whose equity positions will post to the selected GL account.</p>
                    )}
                  </div>
                </div>

                <div className="eglm-form-divider" />

                <div className="eglm-form-section">
                  <h3 className="eglm-form-section__title">2. Investment GL Account</h3>
                  <div className="eglm-field">
                    <label className="eglm-label" htmlFor="eglm-account-search">
                      Search GL Accounts
                    </label>
                    <div className="eglm-input-wrap">
                      <span className="eglm-input-icon" aria-hidden="true"><IconSearch /></span>
                      <input
                        id="eglm-account-search"
                        type="search"
                        className="eglm-input"
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                        placeholder="Search by code or description…"
                        disabled={loading || accounts.length === 0}
                      />
                    </div>
                  </div>

                  <div className="eglm-field">
                    <label className="eglm-label" htmlFor="eglm-account">
                      Investment GL Account <span className="eglm-required" aria-hidden="true">*</span>
                    </label>
                    <div className={`eglm-select-wrap ${accountError ? 'eglm-select-wrap--error' : ''}`}>
                      <select
                        id="eglm-account"
                        className="eglm-select"
                        value={selectedAccountCode}
                        onChange={(e) => {
                          setSelectedAccountCode(e.target.value);
                          setFieldErrors(prev => ({ ...prev, account: '' }));
                          setTouched(prev => ({ ...prev, account: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, account: true }))}
                        disabled={loading || filteredAccounts.length === 0}
                      >
                        <option value="">
                          {accounts.length === 0
                            ? 'No GL accounts available'
                            : filteredAccounts.length === 0
                              ? 'No accounts match your search'
                              : 'Select GL account'}
                        </option>
                        {filteredAccounts.map(acc => (
                          <option key={acc.id} value={acc.account_code}>
                            {acc.account_code} – {acc.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    {accountError ? (
                      <p className="eglm-field-error" role="alert">{accountError}</p>
                    ) : (
                      <p className="eglm-helper">
                        Typically map to <strong>Investment in Equity Securities</strong>. Asset-type accounts are shown first.
                      </p>
                    )}
                  </div>
                </div>

                <div className="eglm-form-divider" />

                <div className="eglm-form-section">
                  <h3 className="eglm-form-section__title">3. Mapping Preview</h3>
                  <div className={`eglm-preview ${previewReady ? 'eglm-preview--ready' : ''}`}>
                    <div className="eglm-preview__node">
                      <span className="eglm-preview__label">Portfolio</span>
                      <span className="eglm-preview__value">
                        {selectedPortfolio
                          ? `${selectedPortfolio.portfolioName} (${selectedPortfolio.portfolioId})`
                          : '—'}
                      </span>
                    </div>
                    <div className="eglm-preview__arrow" aria-hidden="true">
                      <IconArrow />
                    </div>
                    <div className="eglm-preview__node">
                      <span className="eglm-preview__label">Investment GL Account</span>
                      <span className="eglm-preview__value">
                        {selectedAccount
                          ? `${selectedAccount.account_code} – ${selectedAccount.description}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="eglm-helper eglm-helper--center">
                    {previewReady
                      ? 'Review the mapping above, then save to apply it for this portfolio.'
                      : 'Select both fields to preview the mapping relationship.'}
                  </p>
                </div>

                <div className="eglm-form-actions">
                  <button
                    type="button"
                    className="eglm-btn eglm-btn--primary"
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? <IconSpinner /> : <IconSave />}
                    <span>{saving ? 'Saving…' : 'Save Mapping'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Secondary: Existing mappings grid */}
            <section className="eglm-card eglm-card--secondary" aria-labelledby="eglm-grid-title">
              <div className="eglm-card__header eglm-card__header--row">
                <div>
                  <p className="eglm-card__eyebrow">Reference</p>
                  <h2 id="eglm-grid-title" className="eglm-card__title">Existing Mappings</h2>
                </div>
                <span className="eglm-badge">{mappings.length} total</span>
              </div>

              <div className="eglm-grid-toolbar">
                <div className="eglm-input-wrap eglm-input-wrap--compact">
                  <span className="eglm-input-icon" aria-hidden="true"><IconSearch /></span>
                  <input
                    type="search"
                    className="eglm-input eglm-input--compact"
                    value={gridSearch}
                    onChange={(e) => {
                      setGridSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filter mappings…"
                    aria-label="Filter existing mappings"
                  />
                </div>
                {gridSearch && (
                  <button
                    type="button"
                    className="eglm-btn eglm-btn--ghost eglm-btn--sm"
                    onClick={() => { setGridSearch(''); setCurrentPage(1); }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="eglm-grid-wrap">
                {loading ? (
                  <div className="eglm-empty-state">
                    <IconSpinner />
                    <p>Loading mappings…</p>
                  </div>
                ) : processedMappings.length === 0 ? (
                  <div className="eglm-empty-state">
                    <IconEmpty />
                    <p className="eglm-empty-state__title">
                      {mappings.length === 0 ? 'No mappings configured' : 'No results match your filter'}
                    </p>
                    <p className="eglm-empty-state__text">
                      {mappings.length === 0
                        ? 'Create your first portfolio-to-GL mapping using the form on the left.'
                        : 'Try adjusting your search terms or clear the filter.'}
                    </p>
                  </div>
                ) : (
                  <table className="eglm-grid">
                    <thead>
                      <tr>
                        {sortColumns.map(col => (
                          <th key={col.key} scope="col">
                            <button
                              type="button"
                              className="eglm-grid-sort"
                              onClick={() => handleSort(col.key)}
                              aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              {col.label}
                              <IconSort direction={sortKey === col.key ? sortDir : null} />
                            </button>
                          </th>
                        ))}
                        <th scope="col" className="eglm-grid__actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMappings.map((m, idx) => (
                        <tr key={m.id} className={idx % 2 === 1 ? 'eglm-grid__row--alt' : ''}>
                          <td className="eglm-grid__portfolio">{m.displayPortfolio}</td>
                          <td><span className="eglm-code">{m.portfolio_id}</span></td>
                          <td><span className="eglm-code">{m.account_code}</span></td>
                          <td>{m.account_name || '—'}</td>
                          <td className="eglm-grid__actions">
                            <button
                              type="button"
                              className="eglm-btn eglm-btn--danger eglm-btn--sm"
                              onClick={() => handleDelete(m.id)}
                              disabled={deletingId === m.id}
                              aria-label={`Remove mapping for ${m.displayPortfolio}`}
                            >
                              {deletingId === m.id ? <IconSpinner /> : <IconTrash />}
                              <span>{deletingId === m.id ? 'Removing…' : 'Remove'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {!loading && processedMappings.length > 0 && (
                <div className="eglm-pagination">
                  <span className="eglm-pagination__info">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, processedMappings.length)} of {processedMappings.length}
                  </span>
                  <div className="eglm-pagination__controls">
                    <button
                      type="button"
                      className="eglm-btn eglm-btn--ghost eglm-btn--sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      Previous
                    </button>
                    <span className="eglm-pagination__page">Page {safePage} of {totalPages}</span>
                    <button
                      type="button"
                      className="eglm-btn eglm-btn--ghost eglm-btn--sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquityGLMapping;
