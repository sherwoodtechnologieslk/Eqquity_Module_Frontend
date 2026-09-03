import React, { useState, useMemo } from 'react';
import './Styles/RightsIssueEntry.css';

const TABS = [
  { id: 'master', label: 'Rights Issue Details' },
  { id: 'entitlement', label: 'Client & Entitlement' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'payment', label: 'Payment' },
  { id: 'allotment', label: 'Allotment' }
];

const STATUS_OPTIONS = ['Draft', 'Open', 'Closed', 'Allotted', 'Completed'];
const SUBSCRIPTION_STATUS_OPTIONS = [
  'Not Responded',
  'Fully Subscribed',
  'Partially Subscribed',
  'Declined',
  'Excess Applied'
];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Partially Paid', 'Fully Paid', 'Refunded'];

const INITIAL_FORM = {
  // Master
  rightsRefNo: '',
  securityCode: '',
  securityName: '',
  rightsSecurityCode: '',
  rightsRatioNum: '',
  rightsRatioDen: '',
  issuePrice: '',
  marketPrice: '',
  announcementDate: '',
  exRightsDate: '',
  recordDate: '',
  subscriptionStart: '',
  subscriptionEnd: '',
  rightsLastTradingDate: '',
  allotmentDate: '',
  cdsCreditDate: '',
  issueStatus: 'Draft',

  // Client / Entitlement
  portfolioCode: '',
  clientName: '',
  cdsAccountNo: '',
  sharesHeld: '',

  // Subscription
  subscriptionStatus: 'Not Responded',
  acceptedQty: '',
  renouncedQty: '',
  excessApplied: '',

  // Payment
  paymentStatus: 'Pending',
  amountPaid: '',
  paymentDate: '',
  receiptNo: '',
  bankReference: '',
  paymentVoucherNo: '',
  bankAccount: '',

  // Allotment
  entitlementAllotted: '',
  excessAllotted: '',
  cdsConfirmationNo: '',
  sharesCreditedDate: '',
  oldQty: '',
  oldAvgCost: '',

  remarks: ''
};

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (n, digits = 2) => {
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

const RightsIssueEntry = () => {
  const [activeTab, setActiveTab] = useState('master');
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Auto calculations ----------
  const computed = useMemo(() => {
    const num = toNumber(form.rightsRatioNum);
    const den = toNumber(form.rightsRatioDen);
    const held = toNumber(form.sharesHeld);
    const issuePrice = toNumber(form.issuePrice);
    const marketPrice = toNumber(form.marketPrice);
    const acceptedQty = toNumber(form.acceptedQty);
    const entitlementAllotted = toNumber(form.entitlementAllotted);
    const excessAllotted = toNumber(form.excessAllotted);
    const amountPaid = toNumber(form.amountPaid);
    const oldQty = toNumber(form.oldQty);
    const oldAvgCost = toNumber(form.oldAvgCost);

    const rawEntitlement = den > 0 ? (held * num) / den : 0;
    const roundedEntitlement = Math.floor(rawEntitlement);
    const fractional = rawEntitlement - roundedEntitlement;
    const rightsValue = roundedEntitlement * issuePrice;

    const discountPct =
      marketPrice > 0 ? ((marketPrice - issuePrice) / marketPrice) * 100 : 0;

    const amountPayable = acceptedQty * issuePrice;
    const totalAllotted = entitlementAllotted + excessAllotted;

    const allottedValue = totalAllotted * issuePrice;
    const refundAmount = Math.max(0, amountPaid - allottedValue);

    const newAvgCost =
      oldQty + totalAllotted > 0
        ? (oldQty * oldAvgCost + totalAllotted * issuePrice) /
          (oldQty + totalAllotted)
        : 0;

    return {
      rawEntitlement,
      roundedEntitlement,
      fractional,
      rightsValue,
      discountPct,
      amountPayable,
      totalAllotted,
      refundAmount,
      newAvgCost
    };
  }, [form]);

  // ---------- Validation per tab ----------
  const REQUIRED_BY_TAB = {
    master: [
      ['securityCode', 'Security Code'],
      ['securityName', 'Security Name'],
      ['rightsRatioNum', 'Rights Ratio (Numerator)'],
      ['rightsRatioDen', 'Rights Ratio (Denominator)'],
      ['issuePrice', 'Issue Price'],
      ['announcementDate', 'Announcement Date'],
      ['recordDate', 'Record Date'],
      ['exRightsDate', 'Ex-Rights Date'],
      ['subscriptionStart', 'Subscription Start'],
      ['subscriptionEnd', 'Subscription End']
    ],
    entitlement: [
      ['sharesHeld', 'Shares Held on Record Date']
    ],
    subscription: [],
    payment: [],
    allotment: []
  };

  const validateAll = () => {
    const allRequired = Object.values(REQUIRED_BY_TAB).flat();
    const missing = allRequired.filter(
      ([key]) => !String(form[key] ?? '').trim()
    );
    if (missing.length > 0) {
      alert(
        `Please fill in all required fields:\n- ${missing
          .map(([, label]) => label)
          .join('\n- ')}`
      );
      return false;
    }

    // Date sanity checks
    const d = (k) => (form[k] ? new Date(form[k]) : null);
    const checks = [
      [d('announcementDate'), d('recordDate'), 'Announcement Date must be on or before Record Date'],
      [d('recordDate'), d('exRightsDate'), 'Record Date must be on or before Ex-Rights Date'],
      [d('subscriptionStart'), d('subscriptionEnd'), 'Subscription Start must be on or before Subscription End']
    ];
    for (const [a, b, msg] of checks) {
      if (a && b && a > b) {
        alert(msg);
        return false;
      }
    }

    // Quantity sanity checks
    const accepted = toNumber(form.acceptedQty);
    if (accepted > computed.roundedEntitlement) {
      alert(
        `Accepted Quantity (${accepted}) cannot exceed Rights Entitlement (${computed.roundedEntitlement}).`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    console.log('Submitted Rights Issue:', { ...form, computed });
    alert('Rights Issue entry submitted successfully!');
  };

  const handleSaveDraft = () => {
    console.log('Saved as Draft:', { ...form, computed });
    alert('Rights Issue saved as Draft.');
  };

  const handleReset = () => setForm(INITIAL_FORM);

  const nextTab = () => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
  };
  const prevTab = () => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1].id);
  };

  // ---------- Renderers ----------
  const Field = ({ label, name, type = 'text', placeholder, required, readOnly, as = 'input', options, value, className = '' }) => {
    const commonProps = {
      name,
      value: value !== undefined ? value : form[name],
      onChange: handleChange,
      placeholder,
      readOnly,
      className: `rights-form-input ${readOnly ? 'calculated' : ''} ${className}`
    };
    return (
      <div className="rights-field-group">
        <label className="rights-field-label">
          {label} {required && <span className="rights-required">*</span>}
        </label>
        {as === 'select' ? (
          <select
            name={name}
            value={form[name]}
            onChange={handleChange}
            className="rights-form-select"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input type={type} {...commonProps} />
        )}
      </div>
    );
  };

  const SectionHeader = ({ title }) => (
    <div className="rights-section-header">
      <div className="rights-section-icon">
        <svg className="rights-section-icon-svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="rights-section-title">{title}</h3>
    </div>
  );

  const renderMaster = () => (
    <>
      <SectionHeader title="Security & Offer" />
      <div className="rights-form-grid">
        <Field label="Security Code" name="securityCode" placeholder="e.g. JKH.N" required />
        <Field label="Security Name" name="securityName" placeholder="Enter security name" required />
        <div className="rights-field-group">
          <label className="rights-field-label">
            Rights Ratio <span className="rights-required">*</span>
          </label>
          <div className="rights-ratio-inputs">
            <input
              name="rightsRatioNum"
              placeholder="1"
              value={form.rightsRatioNum}
              onChange={handleChange}
              className="rights-form-input"
            />
            <span className="rights-ratio-separator">:</span>
            <input
              name="rightsRatioDen"
              placeholder="5"
              value={form.rightsRatioDen}
              onChange={handleChange}
              className="rights-form-input"
            />
          </div>
          <span className="rights-help-text">e.g. 1 : 5 (1 new share per 5 held)</span>
        </div>
        <Field label="Issue Price (LKR)" name="issuePrice" type="number" placeholder="Discounted price per share" required />
        <Field label="Market Price on Announcement (LKR)" name="marketPrice" type="number" placeholder="Optional reference" />
        <div className="rights-field-group">
          <label className="rights-field-label">Discount %</label>
          <input
            readOnly
            value={
              toNumber(form.marketPrice) > 0
                ? `${formatNumber(computed.discountPct, 2)} %`
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">(Market − Issue) ÷ Market × 100</span>
        </div>
      </div>

      <SectionHeader title="Key Dates" />
      <div className="rights-form-grid">
        <Field label="Announcement Date" name="announcementDate" type="date" required />
        <Field label="Record Date" name="recordDate" type="date" required />
        <Field label="Ex-Rights Date" name="exRightsDate" type="date" required />
        <Field label="Subscription Start" name="subscriptionStart" type="date" required />
        <Field label="Subscription End" name="subscriptionEnd" type="date" required />
        <Field label="Allotment Date" name="allotmentDate" type="date" />
        <Field label="CDS Credit Date" name="cdsCreditDate" type="date" />
      </div>

      <SectionHeader title="My Holding & Entitlement" />
      <div className="rights-form-grid">
        <Field label="Portfolio (Optional)" name="portfolioCode" placeholder="Pick a portfolio if you use multiple" />
        <Field
          label="Shares Held on Record Date"
          name="sharesHeld"
          type="number"
          placeholder="Shares you owned on record date"
          required
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Rights Entitlement (Raw)</label>
          <input
            readOnly
            value={
              toNumber(form.rightsRatioDen) > 0
                ? formatNumber(computed.rawEntitlement, 4)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Shares Held × Numerator ÷ Denominator</span>
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Rounded Entitlement</label>
          <input
            readOnly
            value={
              toNumber(form.rightsRatioDen) > 0
                ? formatNumber(computed.roundedEntitlement, 0)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Final rights shares you can buy</span>
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Rights Value (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.issuePrice) > 0
                ? formatNumber(computed.rightsValue, 2)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Cost to take up the full entitlement</span>
        </div>
      </div>

      <SectionHeader title="My Subscription & Payment" />
      <div className="rights-form-grid">
        <Field
          label="Accepted Quantity"
          name="acceptedQty"
          type="number"
          placeholder="How many you'll take up"
        />
        <Field
          label="Excess Rights Applied"
          name="excessApplied"
          type="number"
          placeholder="Extra shares you're applying for"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Amount Payable (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.acceptedQty) > 0 && toNumber(form.issuePrice) > 0
                ? formatNumber(computed.amountPayable, 2)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Accepted Qty × Issue Price</span>
        </div>
        <Field
          label="Amount Paid (LKR)"
          name="amountPaid"
          type="number"
          placeholder="Amount actually paid"
        />
        <Field label="Payment Date" name="paymentDate" type="date" />
      </div>

      <SectionHeader title="Allotment & Result" />
      <div className="rights-form-grid">
        <Field
          label="Entitlement Allotted"
          name="entitlementAllotted"
          type="number"
          placeholder="Shares granted from entitlement"
        />
        <Field
          label="Excess Allotted"
          name="excessAllotted"
          type="number"
          placeholder="Extra shares granted"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Total Allotted</label>
          <input
            readOnly
            value={formatNumber(computed.totalAllotted, 0)}
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Entitlement + Excess allotted</span>
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Refund Amount (LKR)</label>
          <input
            readOnly
            value={formatNumber(computed.refundAmount, 2)}
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">If you paid more than shares allotted</span>
        </div>
        <Field
          label="Existing Holding Qty"
          name="oldQty"
          type="number"
          placeholder="Shares held before allotment"
        />
        <Field
          label="Existing Avg Cost (LKR)"
          name="oldAvgCost"
          type="number"
          placeholder="Current average cost per share"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">New Average Cost (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.oldQty) + computed.totalAllotted > 0
                ? formatNumber(computed.newAvgCost, 4)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">
            (Old Qty × Old Cost + Allotted × Issue Price) ÷ (Old Qty + Allotted)
          </span>
        </div>
      </div>
    </>
  );

  const renderEntitlement = () => (
    <>
      <SectionHeader title="Client / Portfolio Details" />
      <div className="rights-form-grid">
        <Field label="Portfolio Code" name="portfolioCode" placeholder="e.g. PF-00123" required />
        <Field label="Client Name" name="clientName" placeholder="Enter client name" required />
        <Field label="CDS Account No" name="cdsAccountNo" placeholder="CDS account number" />
      </div>

      <SectionHeader title="Entitlement Calculation" />
      <div className="rights-form-grid">
        <Field
          label="Shares Held on Record Date"
          name="sharesHeld"
          type="number"
          placeholder="Enter shares held"
          required
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Rights Entitlement (Raw)</label>
          <input
            readOnly
            value={
              toNumber(form.rightsRatioDen) > 0
                ? formatNumber(computed.rawEntitlement, 4)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Shares Held × Numerator ÷ Denominator</span>
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Rounded Entitlement</label>
          <input
            readOnly
            value={
              toNumber(form.rightsRatioDen) > 0
                ? formatNumber(computed.roundedEntitlement, 0)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Final entitled rights shares</span>
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Fractional Entitlement</label>
          <input
            readOnly
            value={
              toNumber(form.rightsRatioDen) > 0
                ? formatNumber(computed.fractional, 4)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Rights Value (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.issuePrice) > 0
                ? formatNumber(computed.rightsValue, 2)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Rounded Entitlement × Issue Price</span>
        </div>
      </div>
    </>
  );

  const renderSubscription = () => (
    <>
      <SectionHeader title="Subscription Response" />
      <div className="rights-form-grid">
        <Field
          label="Subscription Status"
          name="subscriptionStatus"
          as="select"
          options={SUBSCRIPTION_STATUS_OPTIONS}
        />
        <Field
          label="Accepted Quantity"
          name="acceptedQty"
          type="number"
          placeholder="Quantity accepted"
        />
        <Field
          label="Renounced Quantity"
          name="renouncedQty"
          type="number"
          placeholder="Rights sold/transferred"
        />
        <Field
          label="Excess Rights Applied"
          name="excessApplied"
          type="number"
          placeholder="Additional shares requested"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Amount Payable (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.acceptedQty) > 0 && toNumber(form.issuePrice) > 0
                ? formatNumber(computed.amountPayable, 2)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Accepted Quantity × Issue Price</span>
        </div>
      </div>
    </>
  );

  const renderPayment = () => (
    <>
      <SectionHeader title="Payment Details" />
      <div className="rights-form-grid">
        <Field
          label="Payment Status"
          name="paymentStatus"
          as="select"
          options={PAYMENT_STATUS_OPTIONS}
        />
        <Field
          label="Amount Paid (LKR)"
          name="amountPaid"
          type="number"
          placeholder="Enter amount paid"
        />
        <Field label="Payment Date" name="paymentDate" type="date" />
        <Field label="Receipt No" name="receiptNo" placeholder="Receipt number" />
        <Field label="Bank Reference" name="bankReference" placeholder="Bank ref / transaction id" />
        <Field label="Payment Voucher No" name="paymentVoucherNo" placeholder="Voucher number" />
        <Field label="Bank Account" name="bankAccount" placeholder="Bank account used" />
      </div>
    </>
  );

  const renderAllotment = () => (
    <>
      <SectionHeader title="Allotment & Finalization" />
      <div className="rights-form-grid">
        <Field
          label="Entitlement Allotted"
          name="entitlementAllotted"
          type="number"
          placeholder="Shares allotted from entitlement"
        />
        <Field
          label="Excess Allotted"
          name="excessAllotted"
          type="number"
          placeholder="Extra shares granted"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">Total Allotted</label>
          <input
            readOnly
            value={formatNumber(computed.totalAllotted, 0)}
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
        </div>
        <div className="rights-field-group">
          <label className="rights-field-label">Refund Amount (LKR)</label>
          <input
            readOnly
            value={formatNumber(computed.refundAmount, 2)}
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">Amount Paid − (Total Allotted × Issue Price)</span>
        </div>
        <Field label="CDS Confirmation No" name="cdsConfirmationNo" placeholder="CDS reference" />
        <Field label="Shares Credited Date" name="sharesCreditedDate" type="date" />
      </div>

      <SectionHeader title="Average Cost Adjustment" />
      <div className="rights-form-grid">
        <Field
          label="Existing Holding Qty"
          name="oldQty"
          type="number"
          placeholder="Shares held before allotment"
        />
        <Field
          label="Existing Avg Cost (LKR)"
          name="oldAvgCost"
          type="number"
          placeholder="Current average cost"
        />
        <div className="rights-field-group">
          <label className="rights-field-label">New Average Cost (LKR)</label>
          <input
            readOnly
            value={
              toNumber(form.oldQty) + computed.totalAllotted > 0
                ? formatNumber(computed.newAvgCost, 4)
                : ''
            }
            placeholder="Auto-calculated"
            className="rights-form-input calculated"
          />
          <span className="rights-help-text">
            (Old Qty × Old Cost + Allotted × Issue Price) ÷ (Old Qty + Allotted)
          </span>
        </div>
      </div>
    </>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'master':
        return renderMaster();
      case 'entitlement':
        return renderEntitlement();
      case 'subscription':
        return renderSubscription();
      case 'payment':
        return renderPayment();
      case 'allotment':
        return renderAllotment();
      default:
        return null;
    }
  };

  const isFirstTab = activeTab === TABS[0].id;
  const isLastTab = activeTab === TABS[TABS.length - 1].id;
  const statusClass = `rights-status-badge rights-status-${form.issueStatus.toLowerCase()}`;

  return (
    <div className="rights-page-container">
      <div className="rights-content-wrapper">
        <div className="rights-header-section">
          <div className="rights-header-text-group">
            <p className="rights-eyebrow">Corporate Actions</p>
            <h1 className="rights-main-title">Rights Issues</h1>
            <p className="rights-subtitle">
              Record and track CSE rights issues, entitlements, subscriptions and allotments
            </p>
          </div>
          <div className="rights-status-wrapper">
            <label className="rights-status-label" htmlFor="rights-issue-status">
              Status
            </label>
            <select
              id="rights-issue-status"
              name="issueStatus"
              value={form.issueStatus}
              onChange={handleChange}
              className={statusClass}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rights-form-card">
          <div className="rights-tab-bar" role="tablist">
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`rights-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="rights-tab-index">{idx + 1}</span>
                <span className="rights-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="rights-form-content">
            <form onSubmit={handleSubmit}>
              {renderActiveTab()}

              <div className="rights-notes-section">
                <label className="rights-field-label">Remarks & Notes</label>
                <textarea
                  name="remarks"
                  placeholder="Add any additional remarks or notes about this rights issue..."
                  value={form.remarks}
                  onChange={handleChange}
                  rows="3"
                  className="rights-form-textarea"
                />
              </div>

              <div className="rights-button-section">
                <div className="rights-button-group-left">
                  <button
                    type="button"
                    onClick={prevTab}
                    disabled={isFirstTab}
                    className="rights-btn rights-btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextTab}
                    disabled={isLastTab}
                    className="rights-btn rights-btn-secondary"
                  >
                    Next
                  </button>
                </div>

                <div className="rights-button-group-right">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rights-btn rights-btn-secondary"
                  >
                    Clear Form
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('View existing rights issues')}
                    className="rights-btn rights-btn-tertiary"
                  >
                    View Rights Issues
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rights-btn rights-btn-tertiary"
                  >
                    Save as Draft
                  </button>
                  <button type="submit" className="rights-btn rights-btn-primary">
                    Save Rights Issue
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightsIssueEntry;
