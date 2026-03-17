import React, { useState } from 'react';
import './Styles/MyPortfolio.css';
import './Styles/Redeem.css';

const mockHoldings = [
  {
    id: 'EGF',
    name: 'Equity Growth Fund',
    category: 'Equity',
    nav: 25.45,
    units: 50000
  },
  {
    id: 'BIF',
    name: 'Balanced Income Fund',
    category: 'Balanced',
    nav: 18.92,
    units: 30000
  },
  {
    id: 'FIF',
    name: 'Fixed Income Fund',
    category: 'Fixed Income',
    nav: 10.25,
    units: 25000
  },
  {
    id: 'MMF',
    name: 'Money Market Fund',
    category: 'Money Market',
    nav: 1.0,
    units: 100000
  }
];

const payoutMethods = [
  'Credit to registered bank account',
  'Cheque',
  'Transfer to settlement account'
];

const Redeem = () => {
  const [selectedHoldingId, setSelectedHoldingId] = useState(
    mockHoldings[0]?.id || ''
  );
  const [entryMode, setEntryMode] = useState('amount'); // 'amount' | 'units'
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [payoutMethod, setPayoutMethod] = useState(payoutMethods[0]);
  const [instructionDate, setInstructionDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [reference, setReference] = useState('');
  const [submittedRedemptions, setSubmittedRedemptions] = useState([]);

  const selectedHolding = mockHoldings.find(
    (h) => h.id === selectedHoldingId
  );

  const availableUnits = selectedHolding ? selectedHolding.units : 0;
  const inputAmount = parseFloat(amount) || 0;

  const numericUnits =
    entryMode === 'units'
      ? parseFloat(units) || 0
      : selectedHolding
      ? inputAmount / selectedHolding.nav
      : 0;

  const calculatedAmount =
    entryMode === 'amount'
      ? inputAmount
      : selectedHolding
      ? (parseFloat(units) || 0) * selectedHolding.nav
      : 0;

  const percentOfHolding =
    availableUnits > 0 ? (numericUnits / availableUnits) * 100 : 0;

  const isInvalid =
    !selectedHolding ||
    calculatedAmount <= 0 ||
    numericUnits <= 0 ||
    numericUnits > availableUnits;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isInvalid) return;

    const newInstruction = {
      id: `${Date.now()}`,
      holdingId: selectedHolding.id,
      fundName: selectedHolding.name,
      nav: selectedHolding.nav,
      units: numericUnits,
      amount: calculatedAmount,
      payoutMethod,
      instructionDate,
      reference: reference || 'N/A',
      status: 'Pending'
    };

    setSubmittedRedemptions((prev) => [newInstruction, ...prev.slice(0, 4)]);
    setAmount('');
    setUnits('');
    setReference('');
  };

  return (
    <div className="cp-portfolio">
      <div className="cp-portfolio-header">
        <h1>Redeem Units</h1>
        <p>Place a redemption instruction from one of your existing funds.</p>
      </div>

      <div className="cp-create-grid">
        {/* Left: Redeem form */}
        <div className="cp-create-form-card">
          <div className="cp-section-header">
            <h3>Redeem from Fund</h3>
          </div>

          <form onSubmit={handleSubmit} className="cp-create-form">
            {/* Fund selection */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="redeemFund">Fund</label>
                <select
                  id="redeemFund"
                  value={selectedHoldingId}
                  onChange={(e) => setSelectedHoldingId(e.target.value)}
                >
                  {mockHoldings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field cp-create-field-nav">
                <label>Available Units</label>
                <div className="cp-create-nav-value">
                  {availableUnits.toLocaleString(undefined, {
                    maximumFractionDigits: 4
                  })}
                </div>
              </div>
            </div>

            {/* Entry mode toggle */}
            <div className="cp-create-row cp-create-toggle-row">
              <span className="cp-create-toggle-label">Enter by</span>
              <div className="cp-create-toggle">
                <button
                  type="button"
                  className={entryMode === 'amount' ? 'active' : ''}
                  onClick={() => setEntryMode('amount')}
                >
                  Amount (LKR)
                </button>
                <button
                  type="button"
                  className={entryMode === 'units' ? 'active' : ''}
                  onClick={() => setEntryMode('units')}
                >
                  Units
                </button>
              </div>
            </div>

            {/* Amount / Units inputs */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="redeemAmount">Redemption Amount (LKR)</label>
                <input
                  id="redeemAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    entryMode === 'amount'
                      ? amount
                      : calculatedAmount
                      ? calculatedAmount.toFixed(2)
                      : ''
                  }
                  onChange={(e) => {
                    setEntryMode('amount');
                    setAmount(e.target.value);
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="cp-create-field">
                <label htmlFor="redeemUnits">Units to Redeem</label>
                <input
                  id="redeemUnits"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={
                    entryMode === 'units'
                      ? units
                      : numericUnits
                      ? numericUnits.toFixed(4)
                      : ''
                  }
                  onChange={(e) => {
                    setEntryMode('units');
                    setUnits(e.target.value);
                  }}
                  placeholder="0.0000"
                />
              </div>
            </div>

            {/* Payout and date */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="payoutMethod">Payout Method</label>
                <select
                  id="payoutMethod"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                >
                  {payoutMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field">
                <label htmlFor="redeemDate">Instruction Date</label>
                <input
                  id="redeemDate"
                  type="date"
                  value={instructionDate}
                  onChange={(e) => setInstructionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reference */}
            <div className="cp-create-row">
              <div className="cp-create-field cp-create-field-full">
                <label htmlFor="redeemReference">
                  Bank / Payment Reference (optional)
                </label>
                <input
                  id="redeemReference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Online transfer reference number"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="cp-create-summary">
              <div className="cp-create-summary-item">
                <span>Fund</span>
                <strong>{selectedHolding?.name || '-'}</strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Amount</span>
                <strong>
                  {calculatedAmount > 0
                    ? calculatedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : '0.00'}
                </strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Units</span>
                <strong>
                  {numericUnits > 0 ? numericUnits.toFixed(4) : '0.0000'}
                </strong>
              </div>
              <div className="cp-create-summary-item">
                <span>% of Holding</span>
                <strong>
                  {percentOfHolding > 0
                    ? `${percentOfHolding.toFixed(2)}%`
                    : '0.00%'}
                </strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Payout Method</span>
                <strong>{payoutMethod}</strong>
              </div>
            </div>

            <div className="cp-create-actions">
              <button
                type="submit"
                className="cp-create-submit"
                disabled={isInvalid}
              >
                Submit Redeem Instruction
              </button>
              <span className="cp-create-hint">
                Redemptions are subject to fund cut-off times and settlement
                cycles.
              </span>
            </div>
          </form>
        </div>

        {/* Right: Recent redeem instructions */}
        <div className="cp-create-side-card">
          <div className="cp-section-header">
            <h3>Recent Redeem Instructions</h3>
          </div>
          {submittedRedemptions.length === 0 ? (
            <div className="cp-create-empty">
              <p>No redeem instructions submitted yet.</p>
              <p>Use the form on the left to place your first redemption.</p>
            </div>
          ) : (
            <div className="cp-create-table-wrapper">
              <table className="cp-create-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fund</th>
                    <th>Amount (LKR)</th>
                    <th>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedRedemptions.map((ins) => (
                    <tr key={ins.id}>
                      <td>{ins.instructionDate}</td>
                      <td>{ins.fundName}</td>
                      <td>
                        {ins.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td>{ins.units.toFixed(4)}</td>
                      <td>
                        <span className="cp-create-status cp-create-status-pending">
                          {ins.status}
                        </span>
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

export default Redeem;

