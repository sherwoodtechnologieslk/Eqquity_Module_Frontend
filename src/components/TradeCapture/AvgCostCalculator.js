import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { portfolioAPI } from '../../services/api';
import { fetchPortfolioHoldings } from './utils/fetchPortfolioHoldings';
import './Styles/AvgCostCalculator.css';

let nextId = 1;
const emptyRow = () => ({ id: nextId++, quantity: '', price: '' });

const parseNum = (v) => {
  if (v === '' || v === undefined || v === null) return 0;
  return parseFloat(String(v).replace(/,/g, '')) || 0;
};

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

/** q = Q*(W-C)/(p-W)  — shares to buy at price p to reach WAP W */
function computeSharesNeeded(Q, C, p, W) {
  if (Q <= 0) return { error: 'Current shares must be greater than zero.' };
  const d = p - W;
  if (Math.abs(d) < 1e-9) {
    return { error: 'Next buy price and target WAP cannot be equal (undefined solution).' };
  }
  const q = (Q * (W - C)) / d;
  if (!Number.isFinite(q)) return { error: 'Invalid numbers.' };
  if (q < 0) {
    return {
      error:
        'A positive number of shares cannot reach this target with these values. Try a different target WAP or next buy price.',
    };
  }
  return { q };
}

/** p = (W*(Q+q) - Q*C) / q — buy price for q new shares to reach WAP W */
function computeBuyPriceForQty(Q, C, q, W) {
  if (q <= 0) return { error: 'Additional shares to buy must be greater than zero.' };
  if (Q < 0) return { error: 'Current shares cannot be negative.' };
  const p = (W * (Q + q) - Q * C) / q;
  if (!Number.isFinite(p)) return { error: 'Invalid numbers.' };
  if (p <= 0) {
    return { error: 'Implied buy price is not positive; adjust target or quantities.' };
  }
  return { p };
}

function previewNewWap(Q, C, q, p) {
  const denom = Q + q;
  if (denom <= 0) return null;
  return (Q * C + q * p) / denom;
}

const AvgCostCalculator = () => {
  const [rows, setRows] = useState([emptyRow(), emptyRow()]);

  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [holdingsError, setHoldingsError] = useState('');

  const [plannerQty, setPlannerQty] = useState('');
  const [plannerC, setPlannerC] = useState('');
  const [plannerBuyPrice, setPlannerBuyPrice] = useState('');
  const [plannerTargetWap, setPlannerTargetWap] = useState('');

  const [plannerQtyForPrice, setPlannerQtyForPrice] = useState('');
  const [plannerTargetWapB, setPlannerTargetWapB] = useState('');

  const [previewQ, setPreviewQ] = useState('');
  const [previewP, setPreviewP] = useState('');

  const loadPortfolios = useCallback(async () => {
    try {
      setPortfoliosLoading(true);
      const data = await portfolioAPI.getActivePortfolios();
      setPortfolios(data || []);
    } catch (e) {
      console.error(e);
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  }, []);

  const loadHoldings = useCallback(
    async (portfolioName) => {
      if (!portfolioName) {
        setHoldings([]);
        return;
      }
      setHoldingsLoading(true);
      setHoldingsError('');
      try {
        const list = await fetchPortfolioHoldings(portfolioName, portfolios);
        setHoldings(list);
      } catch (e) {
        console.error(e);
        setHoldingsError(e.message || 'Could not load holdings.');
        setHoldings([]);
      } finally {
        setHoldingsLoading(false);
      }
    },
    [portfolios]
  );

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    if (selectedPortfolio && portfolios.length > 0) {
      loadHoldings(selectedPortfolio);
    }
  }, [selectedPortfolio, portfolios.length, loadHoldings]);

  const { totalQty, totalCost, avgCost } = useMemo(() => {
    let qty = 0;
    let cost = 0;
    rows.forEach((r) => {
      const q = parseNum(r.quantity);
      const p = parseNum(r.price);
      if (q > 0 && p >= 0) {
        qty += q;
        cost += q * p;
      }
    });
    const avg = qty > 0 ? cost / qty : 0;
    return { totalQty: qty, totalCost: cost, avgCost: avg };
  }, [rows]);

  const Q = parseNum(plannerQty);
  const C = parseNum(plannerC);
  const pNext = parseNum(plannerBuyPrice);
  const W = parseNum(plannerTargetWap);
  const qForPrice = parseNum(plannerQtyForPrice);
  const WB = parseNum(plannerTargetWapB);

  const sharesNeededResult = useMemo(() => {
    if (
      !plannerQty.trim() ||
      !plannerC.trim() ||
      !plannerBuyPrice.trim() ||
      !plannerTargetWap.trim()
    ) {
      return null;
    }
    return computeSharesNeeded(Q, C, pNext, W);
  }, [Q, C, pNext, W, plannerQty, plannerC, plannerBuyPrice, plannerTargetWap]);

  const priceNeededResult = useMemo(() => {
    if (
      !plannerQty.trim() ||
      !plannerC.trim() ||
      !plannerQtyForPrice.trim() ||
      !plannerTargetWapB.trim()
    ) {
      return null;
    }
    return computeBuyPriceForQty(Q, C, qForPrice, WB);
  }, [Q, C, qForPrice, WB, plannerQty, plannerC, plannerQtyForPrice, plannerTargetWapB]);

  const pq = parseNum(previewQ);
  const pp = parseNum(previewP);
  const previewWap = useMemo(() => {
    if (!plannerQty.trim() || !plannerC.trim() || !previewQ.trim() || !previewP.trim()) {
      return null;
    }
    return previewNewWap(Q, C, pq, pp);
  }, [Q, C, pq, pp, plannerQty, plannerC, previewQ, previewP]);

  const applyHolding = (h, basis) => {
    setPlannerQty(String(h.netQuantity));
    const c = basis === 'net' ? h.costPerShare : h.wapGross;
    setPlannerC(String(c));
  };

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  return (
    <div className="acc-calc-container">
      <div className="acc-calc-content acc-calc-content-wide">
        <div className="acc-calc-header">
          <div className="acc-calc-header-icon" aria-hidden>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707l-6 6a1 1 0 01-1.414 0l-6-6A1 1 0 013 6V3zm3 2a1 1 0 100 2 1 1 0 000-2zm3-1a1 1 0 011 1v1h-2V5a1 1 0 011-1zm-3 7a1 1 0 100 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="acc-calc-title">Avg Cost Calculator</h1>
            <p className="acc-calc-subtitle">
              See your holdings and WAP, then work out how many shares to buy at a price to reach a
              target average — or what buy price you need for a fixed size add-on.
            </p>
          </div>
        </div>

        {/* Portfolio holdings */}
        <div className="acc-calc-card">
          <h2>Your holdings (by portfolio)</h2>
          <p className="acc-calc-help acc-calc-mb">
            WAP (gross) is from buy gross value ÷ quantity. Cost / share (net) includes your
            proportional fees — use the basis you prefer in the planners below.
          </p>
          <div className="acc-calc-toolbar">
            <label className="acc-calc-field acc-calc-field-inline">
              <span className="acc-calc-label-text">Portfolio</span>
              <select
                className="acc-calc-select"
                value={selectedPortfolio}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                disabled={portfoliosLoading}
              >
                <option value="">Select portfolio</option>
                {portfolios.map((pf) => (
                  <option key={pf.id || pf.portfolioName} value={pf.portfolioName}>
                    {pf.portfolioName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="acc-calc-btn-secondary"
              disabled={!selectedPortfolio || holdingsLoading}
              onClick={() => loadHoldings(selectedPortfolio)}
            >
              {holdingsLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {holdingsError && <p className="acc-calc-error">{holdingsError}</p>}
          {!selectedPortfolio && (
            <p className="acc-calc-help">Choose a portfolio to load positions.</p>
          )}
          {selectedPortfolio && !holdingsLoading && !holdingsError && holdings.length === 0 && (
            <p className="acc-calc-help">No open positions in this portfolio.</p>
          )}
          {holdings.length > 0 && (
            <div className="acc-calc-table-wrap">
              <table className="acc-calc-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Symbol</th>
                    <th>Shares</th>
                    <th>WAP (gross)</th>
                    <th>Cost / share (net)</th>
                    <th>Use in planner</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, idx) => (
                    <tr key={`${h.companyName}-${h.symbol}-${idx}`}>
                      <td>{h.companyName}</td>
                      <td>{h.symbol || '—'}</td>
                      <td className="acc-calc-num">{fmt(h.netQuantity)}</td>
                      <td className="acc-calc-num">{fmt(h.wapGross)}</td>
                      <td className="acc-calc-num">{fmt(h.costPerShare)}</td>
                      <td>
                        <div className="acc-calc-use-btns">
                          <button
                            type="button"
                            className="acc-calc-btn-tiny"
                            onClick={() => applyHolding(h, 'net')}
                            title="Set current Q and C (net cost per share)"
                          >
                            Net C
                          </button>
                          <button
                            type="button"
                            className="acc-calc-btn-tiny"
                            onClick={() => applyHolding(h, 'gross')}
                            title="Set current Q and C (WAP gross)"
                          >
                            Gross WAP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Planners — shared Q & C */}
        <div className="acc-calc-card">
          <h2>Planner inputs (current position)</h2>
          <p className="acc-calc-help acc-calc-mb">
            Q = shares you already hold. C = your current average cost per share for that line (pick
            net or gross from the table above).
          </p>
          <div className="acc-calc-planner-grid">
            <div className="acc-calc-field">
              <label htmlFor="acc-planner-q">Current shares (Q)</label>
              <input
                id="acc-planner-q"
                value={plannerQty}
                onChange={(e) => setPlannerQty(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 500"
              />
            </div>
            <div className="acc-calc-field">
              <label htmlFor="acc-planner-c">Current avg cost / share (C)</label>
              <input
                id="acc-planner-c"
                value={plannerC}
                onChange={(e) => setPlannerC(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 125.50"
              />
            </div>
          </div>
        </div>

        <div className="acc-calc-two-col">
          <div className="acc-calc-card">
            <h2>How many shares to buy?</h2>
            <p className="acc-calc-help acc-calc-mb">
              If the <strong>next</strong> purchase is at price <em>p</em>, how many shares{' '}
              <em>q</em> do you need so the <strong>new</strong> WAP equals your target?
            </p>
            <div className="acc-calc-field">
              <label htmlFor="acc-next-p">Next buy price per share (p)</label>
              <input
                id="acc-next-p"
                value={plannerBuyPrice}
                onChange={(e) => setPlannerBuyPrice(e.target.value)}
                inputMode="decimal"
                placeholder="Price of the add-on buy"
              />
            </div>
            <div className="acc-calc-field">
              <label htmlFor="acc-target-w">Target WAP after buy (W)</label>
              <input
                id="acc-target-w"
                value={plannerTargetWap}
                onChange={(e) => setPlannerTargetWap(e.target.value)}
                inputMode="decimal"
                placeholder="Desired average after purchase"
              />
            </div>
            <div className="acc-calc-result-box">
              {sharesNeededResult && sharesNeededResult.error && (
                <p className="acc-calc-error">{sharesNeededResult.error}</p>
              )}
              {sharesNeededResult && sharesNeededResult.q !== undefined && !sharesNeededResult.error && (
                <p className="acc-calc-result-main">
                  Buy <strong>{fmt(sharesNeededResult.q)}</strong> shares at {fmt(pNext)} to reach WAP{' '}
                  {fmt(W)}.
                </p>
              )}
              {!sharesNeededResult && (
                <p className="acc-calc-help">Enter next buy price and target WAP.</p>
              )}
            </div>
            <p className="acc-calc-help acc-calc-mt">
              Formula: q = Q × (W − C) ÷ (p − W). Requires p ≠ W.
            </p>
          </div>

          <div className="acc-calc-card">
            <h2>What buy price do I need?</h2>
            <p className="acc-calc-help acc-calc-mb">
              If you buy exactly <strong>q</strong> more shares, what <strong>price per share</strong>{' '}
              gives a new WAP of <strong>W</strong>?
            </p>
            <div className="acc-calc-field">
              <label htmlFor="acc-extra-q">Additional shares to buy (q)</label>
              <input
                id="acc-extra-q"
                value={plannerQtyForPrice}
                onChange={(e) => setPlannerQtyForPrice(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 100"
              />
            </div>
            <div className="acc-calc-field">
              <label htmlFor="acc-target-wb">Target WAP after buy (W)</label>
              <input
                id="acc-target-wb"
                value={plannerTargetWapB}
                onChange={(e) => setPlannerTargetWapB(e.target.value)}
                inputMode="decimal"
                placeholder="Desired average after purchase"
              />
            </div>
            <div className="acc-calc-result-box">
              {priceNeededResult && priceNeededResult.error && (
                <p className="acc-calc-error">{priceNeededResult.error}</p>
              )}
              {priceNeededResult && priceNeededResult.p !== undefined && !priceNeededResult.error && (
                <p className="acc-calc-result-main">
                  Pay up to <strong>{fmt(priceNeededResult.p)}</strong> per share on {fmt(qForPrice)}{' '}
                  shares to reach WAP {fmt(WB)}.
                </p>
              )}
              {!priceNeededResult && (
                <p className="acc-calc-help">Enter additional quantity and target WAP.</p>
              )}
            </div>
            <p className="acc-calc-help acc-calc-mt">
              Formula: p = (W × (Q + q) − Q × C) ÷ q.
            </p>
          </div>
        </div>

        <div className="acc-calc-card">
          <h2>Preview: new WAP after one more buy</h2>
          <p className="acc-calc-help acc-calc-mb">
            Uses the same Q and C above. Enter the <strong>extra</strong> shares and the{' '}
            <strong>price</strong> of that purchase.
          </p>
          <div className="acc-calc-planner-grid">
            <div className="acc-calc-field">
              <label htmlFor="acc-pv-q">Additional shares (q)</label>
              <input
                id="acc-pv-q"
                value={previewQ}
                onChange={(e) => setPreviewQ(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="acc-calc-field">
              <label htmlFor="acc-pv-p">Price per share (p)</label>
              <input
                id="acc-pv-p"
                value={previewP}
                onChange={(e) => setPreviewP(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>
          <div className="acc-calc-result-box">
            {previewWap != null && Number.isFinite(previewWap) && (
              <p className="acc-calc-result-main">
                New WAP ≈ <strong>{fmt(previewWap)}</strong>
              </p>
            )}
            {plannerQty.trim() &&
              plannerC.trim() &&
              previewQ.trim() &&
              previewP.trim() &&
              (previewWap == null || !Number.isFinite(previewWap)) && (
                <p className="acc-calc-help">Check Q, C, q, and p (denominator Q + q must be &gt; 0).</p>
              )}
          </div>
          <p className="acc-calc-help acc-calc-mt">
            New WAP = (Q × C + q × p) ÷ (Q + q).
          </p>
        </div>

        {/* Manual lots */}
        <div className="acc-calc-card">
          <h2>Manual buy lots (what-if)</h2>
          <p className="acc-calc-help acc-calc-mb">
            Enter hypothetical lots only — not linked to your portfolio.
          </p>
          <div className="acc-calc-rows">
            {rows.map((row) => (
              <div key={row.id} className="acc-calc-row">
                <div className="acc-calc-field">
                  <label htmlFor={`acc-q-${row.id}`}>Quantity (shares)</label>
                  <input
                    id={`acc-q-${row.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 100"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                  />
                </div>
                <div className="acc-calc-field">
                  <label htmlFor={`acc-p-${row.id}`}>Price per share</label>
                  <input
                    id={`acc-p-${row.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 125.50"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="acc-calc-remove"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  title={rows.length <= 1 ? 'Keep at least one row' : 'Remove row'}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="acc-calc-add" onClick={addRow}>
            + Add lot
          </button>
        </div>

        <div className="acc-calc-card">
          <h2>Manual result</h2>
          <div className="acc-calc-summary">
            <div className="acc-calc-stat">
              <div className="acc-calc-stat-label">Total shares</div>
              <div className="acc-calc-stat-value">{fmt(totalQty)}</div>
            </div>
            <div className="acc-calc-stat">
              <div className="acc-calc-stat-label">Total cost</div>
              <div className="acc-calc-stat-value">{fmt(totalCost)}</div>
            </div>
            <div className="acc-calc-stat">
              <div className="acc-calc-stat-label">Average cost / share</div>
              <div className="acc-calc-stat-value highlight">
                {totalQty > 0 ? fmt(avgCost) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvgCostCalculator;
