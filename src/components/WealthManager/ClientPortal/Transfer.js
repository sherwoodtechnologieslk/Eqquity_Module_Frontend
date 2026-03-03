import React, { useState } from 'react';
import './Styles/MyPortfolio.css';
import './Styles/Transfer.css';

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

const transferTypes = [
  'Between my funds',
  'Between my accounts',
  'To third-party account'
];

const Transfer = () => {
  const [fromFundId, setFromFundId] = useState(mockHoldings[0]?.id || '');
  const [toFundId, setToFundId] = useState(mockHoldings[1]?.id || '');
  const [entryMode, setEntryMode] = useState('units'); // 'amount' | 'units'
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [transferType, setTransferType] = useState(transferTypes[0]);
  const [instructionDate, setInstructionDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [reference, setReference] = useState('');
  const [submittedTransfers, setSubmittedTransfers] = useState([]);

  const fromFund = mockHoldings.find((h) => h.id === fromFundId);
  const toFund = mockHoldings.find((h) => h.id === toFundId);

  const availableUnits = fromFund ? fromFund.units : 0;
  const inputAmount = parseFloat(amount) || 0;

  const numericUnits =
    entryMode === 'units'
      ? parseFloat(units) || 0
      : fromFund
      ? inputAmount / fromFund.nav
      : 0;

  const calculatedAmount =
    entryMode === 'amount'
      ? inputAmount
      : fromFund
      ? (parseFloat(units) || 0) * fromFund.nav
      : 0;

  const percentOfHolding =
    availableUnits > 0 ? (numericUnits / availableUnits) * 100 : 0;

  const isInvalid =
    !fromFund ||
    !toFund ||
    fromFundId === toFundId ||
    calculatedAmount <= 0 ||
    numericUnits <= 0 ||
    numericUnits > availableUnits;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isInvalid) return;

    const newInstruction = {
      id: `${Date.now()}`,
      fromFundId: fromFund.id,
      toFundId: toFund.id,
      fromFundName: fromFund.name,
      toFundName: toFund.name,
      nav: fromFund.nav,
      units: numericUnits,
      amount: calculatedAmount,
      transferType,
      instructionDate,
      reference: reference || 'N/A',
      status: 'Pending'
    };

    setSubmittedTransfers((prev) => [newInstruction, ...prev.slice(0, 4)]);
    setAmount('');
    setUnits('');
    setReference('');
  };

  return (
    <div className="cp-portfolio">
      <div className="cp-portfolio-header">
        <h1>Transfer Units</h1>
        <p>
          Transfer units between your funds or accounts within your client
          portfolio.
        </p>
      </div>

      <div className="cp-create-grid">
        {/* Left: Transfer form */}
        <div className="cp-create-form-card">
          <div className="cp-section-header">
            <h3>Transfer Between Funds</h3>
          </div>

          <form onSubmit={handleSubmit} className="cp-create-form">
            {/* From / To funds */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="fromFund">From Fund</label>
                <select
                  id="fromFund"
                  value={fromFundId}
                  onChange={(e) => setFromFundId(e.target.value)}
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

            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="toFund">To Fund</label>
                <select
                  id="toFund"
                  value={toFundId}
                  onChange={(e) => setToFundId(e.target.value)}
                >
                  {mockHoldings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field cp-create-field-nav">
                <label>Destination Category</label>
                <div className="cp-create-nav-value">
                  {toFund?.category || '-'}
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
                <label htmlFor="transferAmount">Transfer Amount (LKR)</label>
                <input
                  id="transferAmount"
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
                <label htmlFor="transferUnits">Units to Transfer</label>
                <input
                  id="transferUnits"
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

            {/* Transfer type and date */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="transferType">Transfer Type</label>
                <select
                  id="transferType"
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                >
                  {transferTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field">
                <label htmlFor="transferDate">Instruction Date</label>
                <input
                  id="transferDate"
                  type="date"
                  value={instructionDate}
                  onChange={(e) => setInstructionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reference */}
            <div className="cp-create-row">
              <div className="cp-create-field cp-create-field-full">
                <label htmlFor="transferReference">
                  Reference / Remark (optional)
                </label>
                <input
                  id="transferReference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Rebalance between funds"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="cp-create-summary">
              <div className="cp-create-summary-item">
                <span>From Fund</span>
                <strong>{fromFund?.name || '-'}</strong>
              </div>
              <div className="cp-create-summary-item">
                <span>To Fund</span>
                <strong>{toFund?.name || '-'}</strong>
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
                <span>% of From Holding</span>
                <strong>
                  {percentOfHolding > 0
                    ? `${percentOfHolding.toFixed(2)}%`
                    : '0.00%'}
                </strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Transfer Type</span>
                <strong>{transferType}</strong>
              </div>
            </div>

            <div className="cp-create-actions">
              <button
                type="submit"
                className="cp-create-submit"
                disabled={isInvalid}
              >
                Submit Transfer Instruction
              </button>
              <span className="cp-create-hint">
                Transfers are subject to internal processing and fund cut-off
                times.
              </span>
            </div>
          </form>
        </div>

        {/* Right: Recent transfer instructions */}
        <div className="cp-create-side-card">
          <div className="cp-section-header">
            <h3>Recent Transfer Instructions</h3>
          </div>
          {submittedTransfers.length === 0 ? (
            <div className="cp-create-empty">
              <p>No transfer instructions submitted yet.</p>
              <p>
                Use the form on the left to place your first transfer
                instruction.
              </p>
            </div>
          ) : (
            <div className="cp-create-table-wrapper">
              <table className="cp-create-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedTransfers.map((ins) => (
                    <tr key={ins.id}>
                      <td>{ins.instructionDate}</td>
                      <td>{ins.fromFundName}</td>
                      <td>{ins.toFundName}</td>
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

export default Transfer;

