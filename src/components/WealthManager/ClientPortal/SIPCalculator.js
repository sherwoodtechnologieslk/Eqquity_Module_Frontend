import React, { useState } from 'react';
import './Styles/SIPCalculator.css';

const ANNUAL_RETURN_RATE = 0.12;
const MONTHLY_RATE = ANNUAL_RETURN_RATE / 12;

function formatLKR(value) {
  return 'LKR ' + Number(value.toFixed(2)).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcMonthlySIP(targetAmount, years) {
  const n = years * 12;
  const r = MONTHLY_RATE;
  return (targetAmount * r) / (((1 + r) ** n - 1) * (1 + r));
}

function calcFutureValue(monthlyAmount, years) {
  const n = years * 12;
  const r = MONTHLY_RATE;
  return monthlyAmount * (((1 + r) ** n - 1) / r) * (1 + r);
}

// ── Reusable slider + text input field ───────────────────────────────
function SliderInput({ num, label, sublabel, value, min, max, step, onChange, displayNode }) {
  const pct = ((value - min) / (max - min)) * 100;

  const handleSlider = (e) => onChange(Number(e.target.value));
  const handleText = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '' || /^\d+$/.test(raw)) {
      const n = raw === '' ? min : Math.min(max, Math.max(min, Number(raw)));
      onChange(n);
    }
  };

  return (
    <div className="sip-field">
      <div className="sip-field-header">
        <div className="sip-field-num">{num}</div>
        <div className="sip-field-label-group">
          <div className="sip-field-label">{label}</div>
          {sublabel && <div className="sip-field-sublabel">{sublabel}</div>}
        </div>
      </div>
      <div className="sip-field-row">
        <div className="sip-slider-wrap">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSlider}
            className="sip-slider"
            style={{ '--sip-pct': `${pct}%` }}
          />
        </div>
        <div className="sip-input-wrap">
          <span className="sip-input-or">or Enter the amount</span>
          <input
            type="text"
            className="sip-text-input"
            value={value.toLocaleString('en-LK')}
            onChange={handleText}
          />
        </div>
        <div className="sip-display-pill">{displayNode}</div>
      </div>
    </div>
  );
}

// ── Goal Based Planner ────────────────────────────────────────────────
function GoalBasedPlanner() {
  const [target, setTarget] = useState(5000000);
  const [years, setYears] = useState(5);

  const monthly = calcMonthlySIP(target, years);

  return (
    <div className="sip-planner-body">
      <SliderInput
        num="01"
        label="How much do you want to make?"
        sublabel="Drag the target amount in Rupees"
        value={target}
        min={100000}
        max={50000000}
        step={100000}
        onChange={setTarget}
        displayNode={formatLKR(target)}
      />
      <SliderInput
        num="02"
        label="When do you want to make it?"
        sublabel="Choose your investment horizon in years"
        value={years}
        min={1}
        max={30}
        step={1}
        onChange={setYears}
        displayNode={`YEARS ${years}`}
      />
      <div className="sip-result-section">
        <div className="sip-result-banner">
          <div className="sip-result-label">Monthly Saving Amount Required</div>
          <div className="sip-result-amount">{formatLKR(monthly)}</div>
          <div className="sip-result-meta">
            Based on {(ANNUAL_RETURN_RATE * 100).toFixed(0)}% annual return &nbsp;·&nbsp; {years * 12} monthly instalments
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Income Based Planner ──────────────────────────────────────────────
function IncomeBasedPlanner() {
  const [monthly, setMonthly] = useState(25000);
  const MAX_YEARS = 5;

  const yearlyValues = Array.from({ length: MAX_YEARS }, (_, i) =>
    calcFutureValue(monthly, i + 1)
  );

  return (
    <div className="sip-planner-body">
      <SliderInput
        num="01"
        label="How much can you save monthly?"
        sublabel="Drag the amount in Rupees"
        value={monthly}
        min={1000}
        max={500000}
        step={1000}
        onChange={setMonthly}
        displayNode={formatLKR(monthly)}
      />
      <div className="sip-year-section">
        <div className="sip-year-section-label">Your projected wealth</div>
        <div className="sip-year-cards">
          {yearlyValues.map((val, i) => (
            <div key={i} className="sip-year-card">
              <div className="sip-year-card-year">Year {i + 1}</div>
              <div className="sip-year-card-value">
                <span className="sip-year-card-currency">LKR</span>
                {val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="sip-income-meta">
        Based on {(ANNUAL_RETURN_RATE * 100).toFixed(0)}% annual return &nbsp;·&nbsp; Monthly SIP of {formatLKR(monthly)}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────
export default function SIPCalculator({ onGetStarted, embedded = false }) {
  const [activeTab, setActiveTab] = useState('income');

  return (
    <div className={`sip-root${embedded ? ' sip-root--embedded' : ''}`}>
      {!embedded ? (
        <div className="sip-header">
          <div className="sip-header-text">
            <span className="sip-eyebrow">Investment Planner</span>
            <h2 className="sip-heading">Plan smarter. Invest with purpose.</h2>
            <p className="sip-lead">
              Use our SIP calculator to see how disciplined monthly investing can build significant wealth over time.
            </p>
          </div>
          {onGetStarted && (
            <button type="button" className="sip-header-cta" onClick={onGetStarted}>
              Open an Account
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>
      ) : null}

      <div className="sip-tabs-wrap">
        <div className="sip-tabs">
          <button
            type="button"
            className={`sip-tab${activeTab === 'income' ? ' sip-tab--active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            Income Based Planner
          </button>
          <button
            type="button"
            className={`sip-tab${activeTab === 'goal' ? ' sip-tab--active' : ''}`}
            onClick={() => setActiveTab('goal')}
          >
            Goal Based Planner
          </button>
        </div>
      </div>

      <div className="sip-tab-content">
        {activeTab === 'income' ? <IncomeBasedPlanner /> : <GoalBasedPlanner />}
      </div>

      {/* How it works */}
      <div className="sip-how-section">
        <div className="sip-how-title">How it works</div>
        <div className="sip-how-steps">
          <div className="sip-how-step">
            <div className="sip-how-step-num">1</div>
            <div className="sip-how-step-body">
              <div className="sip-how-step-label">Choose your plan</div>
              <div className="sip-how-step-text">
                Select Income Based if you know how much you can save monthly, or Goal Based if you have a target amount in mind.
              </div>
            </div>
          </div>
          <div className="sip-how-step-divider" />
          <div className="sip-how-step">
            <div className="sip-how-step-num">2</div>
            <div className="sip-how-step-body">
              <div className="sip-how-step-label">Set your numbers</div>
              <div className="sip-how-step-text">
                Use the slider or type directly to enter your monthly amount or target, and set your investment time horizon.
              </div>
            </div>
          </div>
          <div className="sip-how-step-divider" />
          <div className="sip-how-step">
            <div className="sip-how-step-num">3</div>
            <div className="sip-how-step-body">
              <div className="sip-how-step-label">See your projection</div>
              <div className="sip-how-step-text">
                Instantly see the required monthly SIP or your projected future wealth, then open an account to start investing.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sip-disclaimer">
        <span className="sip-disclaimer-bold">Disclaimer:</span>{' '}
        This material is created to explain basic financial / investment related concepts to investors.
        Mutual Fund does not provide guaranteed returns. Investors are advised to seek professional
        advice from financial, tax and legal advisor before investing.
      </div>
    </div>
  );
}
