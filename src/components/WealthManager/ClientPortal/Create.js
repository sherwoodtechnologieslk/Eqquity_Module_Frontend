import React, { useState } from 'react';
import './Styles/MyPortfolio.css';
import './Styles/Create.css';

const mockFunds = [
  { id: 'EGF', name: 'Equity Growth Fund', category: 'Equity', nav: 25.45 },
  { id: 'BIF', name: 'Balanced Income Fund', category: 'Balanced', nav: 18.92 },
  { id: 'FIF', name: 'Fixed Income Fund', category: 'Fixed Income', nav: 10.25 },
  { id: 'MMF', name: 'Money Market Fund', category: 'Money Market', nav: 1.0 }
];

const paymentMethods = ['Bank Transfer', 'Direct Debit (JustPay)', 'Cash Deposit', 'Standing Order'];

const Create = () => {
  const [selectedFundId, setSelectedFundId] = useState(mockFunds[0].id);
  const [entryMode, setEntryMode] = useState('amount'); // 'amount' or 'units'
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [instructionDate, setInstructionDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [reference, setReference] = useState('');
  const [submittedInstructions, setSubmittedInstructions] = useState([]);

  const selectedFund = mockFunds.find((f) => f.id === selectedFundId);
  const numericAmount = parseFloat(amount) || 0;
  const numericUnits =
    entryMode === 'units'
      ? parseFloat(units) || 0
      : selectedFund
      ? numericAmount / selectedFund.nav
      : 0;
  const calculatedAmount =
    entryMode === 'amount'
      ? numericAmount
      : selectedFund
      ? (parseFloat(units) || 0) * selectedFund.nav
      : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFund || calculatedAmount <= 0 || numericUnits <= 0) return;

    const newInstruction = {
      id: `${Date.now()}`,
      fundName: selectedFund.name,
      fundId: selectedFund.id,
      nav: selectedFund.nav,
      amount: calculatedAmount,
      units: numericUnits,
      paymentMethod,
      instructionDate,
      reference: reference || 'N/A',
      status: 'Pending'
    };

    setSubmittedInstructions((prev) => [newInstruction, ...prev.slice(0, 4)]);

    // Reset entry values but keep fund and payment method
    setAmount('');
    setUnits('');
    setReference('');
  };

  return (
    <div className="cp-portfolio">
      <div className="cp-portfolio-header">
        <h1>Create Units</h1>
        <p>Create a new subscription into one of your unit trust funds.</p>
      </div>

      <div className="cp-create-grid">
        {/* Left: Create form */}
        <div className="cp-create-form-card">
          <div className="cp-section-header">
            <h3>Create New Investment</h3>
          </div>

          <form onSubmit={handleSubmit} className="cp-create-form">
            {/* Fund selection */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="fund">Fund</label>
                <select
                  id="fund"
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                >
                  {mockFunds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name} ({fund.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field cp-create-field-nav">
                <label>Current NAV</label>
                <div className="cp-create-nav-value">
                  {selectedFund ? selectedFund.nav.toFixed(2) : '-'}
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
                <label htmlFor="amount">Subscription Amount (LKR)</label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryMode === 'amount' ? amount : calculatedAmount ? calculatedAmount.toFixed(2) : ''}
                  onChange={(e) => {
                    setEntryMode('amount');
                    setAmount(e.target.value);
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="cp-create-field">
                <label htmlFor="units">Estimated Units</label>
                <input
                  id="units"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={entryMode === 'units' ? units : numericUnits ? numericUnits.toFixed(4) : ''}
                  onChange={(e) => {
                    setEntryMode('units');
                    setUnits(e.target.value);
                  }}
                  placeholder="0.0000"
                />
              </div>
            </div>

            {/* Payment and date */}
            <div className="cp-create-row">
              <div className="cp-create-field">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-create-field">
                <label htmlFor="instructionDate">Instruction Date</label>
                <input
                  id="instructionDate"
                  type="date"
                  value={instructionDate}
                  onChange={(e) => setInstructionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reference */}
            <div className="cp-create-row">
              <div className="cp-create-field cp-create-field-full">
                <label htmlFor="reference">Bank / Payment Reference (optional)</label>
                <input
                  id="reference"
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
                <strong>{selectedFund?.name || '-'}</strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Amount</span>
                <strong>{calculatedAmount > 0 ? calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Estimated Units</span>
                <strong>{numericUnits > 0 ? numericUnits.toFixed(4) : '0.0000'}</strong>
              </div>
              <div className="cp-create-summary-item">
                <span>Payment Method</span>
                <strong>{paymentMethod}</strong>
              </div>
            </div>

            <div className="cp-create-actions">
              <button
                type="submit"
                className="cp-create-submit"
                disabled={!selectedFund || calculatedAmount <= 0 || numericUnits <= 0}
              >
                Submit Create Instruction
              </button>
              <span className="cp-create-hint">
                Your instruction will be processed on the next dealing day subject to cut-off times.
              </span>
            </div>
          </form>
        </div>

        {/* Right: Recent instructions */}
        <div className="cp-create-side-card">
          <div className="cp-section-header">
            <h3>Recent Create Instructions</h3>
          </div>
          {submittedInstructions.length === 0 ? (
            <div className="cp-create-empty">
              <p>No create instructions submitted yet.</p>
              <p>Use the form on the left to place your first instruction.</p>
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
                  {submittedInstructions.map((ins) => (
                    <tr key={ins.id}>
                      <td>{ins.instructionDate}</td>
                      <td>{ins.fundName}</td>
                      <td>{ins.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

export default Create;

