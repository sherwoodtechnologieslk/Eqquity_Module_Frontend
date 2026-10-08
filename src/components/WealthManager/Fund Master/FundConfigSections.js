import React from 'react';

export const WEEKDAYS = [
  { dayOfWeek: 0, label: 'Sunday' },
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
];

export function toDateInput(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export function toTimeInput(value) {
  if (!value) return '';
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
}

export function numValue(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

export function numOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function blankWeek() {
  return WEEKDAYS.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    isDealingEligible: false,
    isValuationEligible: false,
    isSettlementEligible: false,
    isNavPublicationEligible: false,
    isNonBusiness: false,
  }));
}

export function mergeWeek(rows) {
  const week = blankWeek();
  (rows || []).forEach((row) => {
    const index = week.findIndex((day) => day.dayOfWeek === Number(row.dayOfWeek));
    if (index >= 0) {
      week[index] = {
        ...week[index],
        ...row,
        dayOfWeek: Number(row.dayOfWeek),
      };
    }
  });
  return week;
}

export function emptyDomain(section) {
  switch (section) {
    case 'mandate':
      return { assetClasses: [], rules: [] };
    case 'dealing':
      return { settings: {}, cutoffs: [] };
    case 'navPricing':
      return { settings: {}, publishedPriceTypes: [] };
    case 'fees':
      return { feeLines: [] };
    case 'calendar':
      return { weekdays: blankWeek(), exceptions: [] };
    default:
      return {};
  }
}

function EmptyNote({ children }) {
  return <p className="fcc-empty">{children}</p>;
}

function RefSelect({ label, value, onChange, options, disabled, emptyMessage }) {
  const empty = !options?.length;
  return (
    <div className="fm-field-group">
      <label className="fm-field-label">{label}</label>
      <select
        className="fm-form-select"
        value={value || ''}
        disabled={disabled || empty}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">{empty ? 'None configured' : 'Select…'}</option>
        {(options || []).map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {empty && <EmptyNote>{emptyMessage}</EmptyNote>}
    </div>
  );
}

function TextField({ label, value, onChange, disabled, type = 'text', placeholder }) {
  return (
    <div className="fm-field-group">
      <label className="fm-field-label">{label}</label>
      <input
        className="fm-form-input"
        type={type}
        value={value ?? ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function CheckField({ label, checked, onChange, disabled }) {
  return (
    <label className="fcc-check">
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function MandateEditor({ value, onChange, refs, disabled }) {
  const assetClasses = value.assetClasses || [];
  const rules = value.rules || [];
  const catalog = refs.assetClasses || [];

  const addClass = (assetClassId) => {
    if (!assetClassId || assetClasses.some((row) => Number(row.assetClassId) === assetClassId)) return;
    onChange({
      ...value,
      assetClasses: [...assetClasses, { assetClassId, isPermitted: true, notes: '' }],
    });
  };

  const updateClass = (index, patch) => {
    const next = assetClasses.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange({ ...value, assetClasses: next });
  };

  const updateRule = (index, patch) => {
    const next = rules.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange({ ...value, rules: next });
  };

  return (
    <>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Permitted asset classes</h4>
        {catalog.length === 0 ? (
          <EmptyNote>No asset classes have been configured.</EmptyNote>
        ) : (
          <div className="fm-field-group">
            <label className="fm-field-label">Add asset class</label>
            <select
              className="fm-form-select"
              value=""
              disabled={disabled}
              onChange={(event) => {
                addClass(Number(event.target.value));
                event.target.value = '';
              }}
            >
              <option value="">Select…</option>
              {catalog.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {assetClasses.length > 0 && (
          <div className="fcc-stack">
            {assetClasses.map((row, index) => {
              const known = catalog.find((item) => item.id === Number(row.assetClassId));
              return (
                <div key={`${row.assetClassId}-${index}`} className="fcc-row">
                  <strong>{known?.name || row.assetClassName || 'Asset class'}</strong>
                  <CheckField
                    label="Permitted"
                    checked={row.isPermitted !== false && row.isPermitted !== 0}
                    disabled={disabled}
                    onChange={(isPermitted) => updateClass(index, { isPermitted })}
                  />
                  <input
                    className="fm-form-input"
                    value={row.notes || ''}
                    disabled={disabled}
                    placeholder="Notes"
                    onChange={(event) => updateClass(index, { notes: event.target.value })}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="fm-btn fm-btn-secondary"
                      onClick={() => onChange({ ...value, assetClasses: assetClasses.filter((_, i) => i !== index) })}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fcc-block">
        <h4 className="fcc-block__title">Mandate rules</h4>
        <p className="fcc-empty">Enter limit values only when they have been confirmed. Nothing is filled in for you.</p>
        {(refs.mandateRuleDimensions || []).length === 0 ? (
          <EmptyNote>No mandate rule dimensions have been configured.</EmptyNote>
        ) : (
          !disabled && (
            <button
              type="button"
              className="fm-btn fm-btn-secondary"
              onClick={() =>
                onChange({
                  ...value,
                  rules: [
                    ...rules,
                    {
                      ruleDimensionId: '',
                      limitTypeId: null,
                      limitUnitId: null,
                      limitValue: '',
                      limitValueUpper: '',
                      currency: '',
                      notes: '',
                    },
                  ],
                })
              }
            >
              Add rule
            </button>
          )
        )}
        {rules.map((rule, index) => (
          <div key={index} className="fcc-card">
            <div className="fm-form-grid">
              <div className="fm-field-group">
                <label className="fm-field-label">Dimension</label>
                <select
                  className="fm-form-select"
                  value={rule.ruleDimensionId || ''}
                  disabled={disabled}
                  onChange={(event) => updateRule(index, { ruleDimensionId: Number(event.target.value) })}
                >
                  <option value="">Select…</option>
                  {(refs.mandateRuleDimensions || []).map((dimension) => (
                    <option key={dimension.id} value={dimension.id}>
                      {dimension.name}
                    </option>
                  ))}
                </select>
              </div>
              <RefSelect
                label="Limit type"
                value={rule.limitTypeId}
                options={refs.mandateLimitTypes}
                disabled={disabled}
                emptyMessage="No limit types have been configured."
                onChange={(limitTypeId) => updateRule(index, { limitTypeId })}
              />
              <RefSelect
                label="Limit unit"
                value={rule.limitUnitId}
                options={refs.mandateLimitUnits}
                disabled={disabled}
                emptyMessage="No limit units have been configured."
                onChange={(limitUnitId) => updateRule(index, { limitUnitId })}
              />
              <TextField
                label="Limit value"
                type="number"
                value={numValue(rule.limitValue)}
                disabled={disabled}
                onChange={(limitValue) => updateRule(index, { limitValue })}
              />
              <TextField
                label="Upper value"
                type="number"
                value={numValue(rule.limitValueUpper)}
                disabled={disabled}
                onChange={(limitValueUpper) => updateRule(index, { limitValueUpper })}
              />
              <TextField
                label="Currency"
                value={rule.currency || ''}
                disabled={disabled}
                placeholder="Optional"
                onChange={(currency) => updateRule(index, { currency })}
              />
              <TextField
                label="Notes"
                value={rule.notes || ''}
                disabled={disabled}
                onChange={(notes) => updateRule(index, { notes })}
              />
            </div>
            {!disabled && (
              <button
                type="button"
                className="fm-btn fm-btn-secondary"
                onClick={() => onChange({ ...value, rules: rules.filter((_, i) => i !== index) })}
              >
                Remove rule
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function DealingEditor({ value, onChange, refs, disabled }) {
  const settings = value.settings || {};
  const cutoffs = value.cutoffs || [];
  const setSettings = (patch) => onChange({ ...value, settings: { ...settings, ...patch } });

  const updateCutoff = (index, patch) => {
    onChange({
      ...value,
      cutoffs: cutoffs.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  return (
    <>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Dealing permissions</h4>
        <div className="fcc-checks">
          <CheckField label="Subscription Enabled" checked={settings.subscriptionEnabled} disabled={disabled} onChange={(subscriptionEnabled) => setSettings({ subscriptionEnabled })} />
          <CheckField label="Redemption Enabled" checked={settings.redemptionEnabled} disabled={disabled} onChange={(redemptionEnabled) => setSettings({ redemptionEnabled })} />
          <CheckField label="Switch Enabled" checked={settings.switchEnabled} disabled={disabled} onChange={(switchEnabled) => setSettings({ switchEnabled })} />
          <CheckField label="Unit Transfer Enabled" checked={settings.unitTransferEnabled} disabled={disabled} onChange={(unitTransferEnabled) => setSettings({ unitTransferEnabled })} />
        </div>
      </div>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Amounts and precision</h4>
        <div className="fm-form-grid">
          <TextField label="Minimum Initial Investment" type="number" value={numValue(settings.minInitialInvestment)} disabled={disabled} onChange={(minInitialInvestment) => setSettings({ minInitialInvestment })} />
          <TextField label="Minimum Additional Investment" type="number" value={numValue(settings.minAdditionalInvestment)} disabled={disabled} onChange={(minAdditionalInvestment) => setSettings({ minAdditionalInvestment })} />
          <TextField label="Minimum Redemption Amount" type="number" value={numValue(settings.minRedemptionAmount)} disabled={disabled} onChange={(minRedemptionAmount) => setSettings({ minRedemptionAmount })} />
          <TextField label="Minimum Remaining Balance" type="number" value={numValue(settings.minRemainingBalance)} disabled={disabled} onChange={(minRemainingBalance) => setSettings({ minRemainingBalance })} />
          <TextField label="Amount Precision" type="number" value={numValue(settings.amountPrecision)} disabled={disabled} onChange={(amountPrecision) => setSettings({ amountPrecision })} />
          <TextField label="Unit Precision" type="number" value={numValue(settings.unitPrecision)} disabled={disabled} onChange={(unitPrecision) => setSettings({ unitPrecision })} />
          <RefSelect
            label="Rounding Method"
            value={settings.roundingMethodId}
            options={refs.roundingMethods}
            disabled={disabled}
            emptyMessage="No rounding methods have been configured."
            onChange={(roundingMethodId) => setSettings({ roundingMethodId })}
          />
          <RefSelect
            label="Settlement Convention"
            value={settings.settlementConventionId}
            options={refs.settlementConventions}
            disabled={disabled}
            emptyMessage="No settlement conventions have been configured."
            onChange={(settlementConventionId) => setSettings({ settlementConventionId })}
          />
          <TextField label="Notice period (days)" type="number" value={numValue(settings.noticePeriodDays)} disabled={disabled} onChange={(noticePeriodDays) => setSettings({ noticePeriodDays })} />
        </div>
      </div>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Dealing cut-offs</h4>
        {(refs.dealingCutoffTypes || []).length === 0 ? (
          <EmptyNote>No dealing cut-off types have been configured.</EmptyNote>
        ) : (
          !disabled && (
            <button
              type="button"
              className="fm-btn fm-btn-secondary"
              onClick={() => onChange({ ...value, cutoffs: [...cutoffs, { cutoffTypeId: '', cutoffTime: '', timezone: '', notes: '' }] })}
            >
              Add cut-off
            </button>
          )
        )}
        {cutoffs.map((cutoff, index) => (
          <div key={index} className="fcc-card">
            <div className="fm-form-grid">
              <div className="fm-field-group">
                <label className="fm-field-label">Cut-off type</label>
                <select
                  className="fm-form-select"
                  value={cutoff.cutoffTypeId || ''}
                  disabled={disabled}
                  onChange={(event) => updateCutoff(index, { cutoffTypeId: Number(event.target.value) })}
                >
                  <option value="">Select…</option>
                  {(refs.dealingCutoffTypes || []).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextField label="Cut-off time" type="time" value={toTimeInput(cutoff.cutoffTime)} disabled={disabled} onChange={(cutoffTime) => updateCutoff(index, { cutoffTime })} />
              <TextField label="Timezone" value={cutoff.timezone || ''} disabled={disabled} placeholder="Optional" onChange={(timezone) => updateCutoff(index, { timezone })} />
              <TextField label="Notes" value={cutoff.notes || ''} disabled={disabled} onChange={(notes) => updateCutoff(index, { notes })} />
            </div>
            {!disabled && (
              <button type="button" className="fm-btn fm-btn-secondary" onClick={() => onChange({ ...value, cutoffs: cutoffs.filter((_, i) => i !== index) })}>
                Remove cut-off
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function NavEditor({ value, onChange, refs, disabled }) {
  const settings = value.settings || {};
  const publishedPriceTypes = value.publishedPriceTypes || [];
  const setSettings = (patch) => onChange({ ...value, settings: { ...settings, ...patch } });

  return (
    <>
      <div className="fm-form-grid">
        <RefSelect label="Valuation Frequency" value={settings.valuationFrequencyId} options={refs.valuationFrequencies} disabled={disabled} emptyMessage="No valuation frequencies have been configured." onChange={(valuationFrequencyId) => setSettings({ valuationFrequencyId })} />
        <RefSelect label="Pricing Method" value={settings.pricingMethodId} options={refs.pricingMethods} disabled={disabled} emptyMessage="No pricing methods have been configured." onChange={(pricingMethodId) => setSettings({ pricingMethodId })} />
        <TextField label="Valuation Time" type="time" value={toTimeInput(settings.valuationTime)} disabled={disabled} onChange={(valuationTime) => setSettings({ valuationTime })} />
        <TextField label="NAV Cut-off Time" type="time" value={toTimeInput(settings.navCutoffTime)} disabled={disabled} onChange={(navCutoffTime) => setSettings({ navCutoffTime })} />
        <TextField label="NAV Precision" type="number" value={numValue(settings.navPrecision)} disabled={disabled} onChange={(navPrecision) => setSettings({ navPrecision })} />
        <TextField label="NAV Per Unit Precision" type="number" value={numValue(settings.navPerUnitPrecision)} disabled={disabled} onChange={(navPerUnitPrecision) => setSettings({ navPerUnitPrecision })} />
        <TextField label="Unit Price Precision" type="number" value={numValue(settings.unitPricePrecision)} disabled={disabled} onChange={(unitPricePrecision) => setSettings({ unitPricePrecision })} />
        <RefSelect label="Rounding Method" value={settings.roundingMethodId} options={refs.roundingMethods} disabled={disabled} emptyMessage="No rounding methods have been configured." onChange={(roundingMethodId) => setSettings({ roundingMethodId })} />
      </div>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Published price types</h4>
        <p className="fcc-empty">This records which price types the fund may publish. It does not calculate or publish a price.</p>
        {(refs.publishedPriceTypes || []).length === 0 ? (
          <EmptyNote>No published price types have been configured.</EmptyNote>
        ) : (
          !disabled && (
            <button
              type="button"
              className="fm-btn fm-btn-secondary"
              onClick={() =>
                onChange({
                  ...value,
                  publishedPriceTypes: [...publishedPriceTypes, { publishedPriceTypeId: '', isEnabled: false, sortOrder: publishedPriceTypes.length, notes: '' }],
                })
              }
            >
              Add price type
            </button>
          )
        )}
        {publishedPriceTypes.map((row, index) => (
          <div key={index} className="fcc-card">
            <div className="fm-form-grid">
              <div className="fm-field-group">
                <label className="fm-field-label">Price type</label>
                <select
                  className="fm-form-select"
                  value={row.publishedPriceTypeId || ''}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = publishedPriceTypes.map((item, i) =>
                      i === index ? { ...item, publishedPriceTypeId: Number(event.target.value) } : item
                    );
                    onChange({ ...value, publishedPriceTypes: next });
                  }}
                >
                  <option value="">Select…</option>
                  {(refs.publishedPriceTypes || []).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <CheckField
                label="Enabled"
                checked={row.isEnabled}
                disabled={disabled}
                onChange={(isEnabled) => {
                  const next = publishedPriceTypes.map((item, i) => (i === index ? { ...item, isEnabled } : item));
                  onChange({ ...value, publishedPriceTypes: next });
                }}
              />
              <TextField
                label="Sort order"
                type="number"
                value={numValue(row.sortOrder)}
                disabled={disabled}
                onChange={(sortOrder) => {
                  const next = publishedPriceTypes.map((item, i) => (i === index ? { ...item, sortOrder } : item));
                  onChange({ ...value, publishedPriceTypes: next });
                }}
              />
            </div>
            {!disabled && (
              <button
                type="button"
                className="fm-btn fm-btn-secondary"
                onClick={() => onChange({ ...value, publishedPriceTypes: publishedPriceTypes.filter((_, i) => i !== index) })}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function FeesEditor({ value, onChange, refs, disabled, onOpenFeeStructure }) {
  const feeLines = value.feeLines || [];
  const definitions = refs.feeDefinitions || [];

  const updateLine = (index, patch) => {
    onChange({
      ...value,
      feeLines: feeLines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    });
  };

  return (
    <div className="fcc-block">
      <h4 className="fcc-block__title">Fund fee lines</h4>
      <p className="fcc-empty">Attach fee definitions that already exist for the managing company. Rates are entered here only when confirmed.</p>
      {definitions.length === 0 ? (
        <EmptyNote>
          No fee definitions have been configured.
          {onOpenFeeStructure && (
            <>
              {' '}
              <button type="button" className="fcc-link" onClick={onOpenFeeStructure}>
                Open Fee Structure
              </button>
            </>
          )}
        </EmptyNote>
      ) : (
        !disabled && (
          <button
            type="button"
            className="fm-btn fm-btn-secondary"
            onClick={() =>
              onChange({
                ...value,
                feeLines: [
                  ...feeLines,
                  {
                    feeDefinitionId: '',
                    calculationBasisId: null,
                    rate: '',
                    fixedAmount: '',
                    lineEffectiveFrom: '',
                    lineEffectiveTo: '',
                    status: 'Active',
                    notes: '',
                  },
                ],
              })
            }
          >
            Attach fee definition
          </button>
        )
      )}
      {feeLines.map((line, index) => (
        <div key={index} className="fcc-card">
          <div className="fm-form-grid">
            <div className="fm-field-group">
              <label className="fm-field-label">Fee definition</label>
              <select
                className="fm-form-select"
                value={line.feeDefinitionId || ''}
                disabled={disabled}
                onChange={(event) => updateLine(index, { feeDefinitionId: Number(event.target.value) })}
              >
                <option value="">Select…</option>
                {definitions.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.feeCode} — {definition.name}
                  </option>
                ))}
              </select>
            </div>
            <RefSelect
              label="Calculation basis"
              value={line.calculationBasisId}
              options={refs.feeCalculationBases}
              disabled={disabled}
              emptyMessage="No calculation bases have been configured."
              onChange={(calculationBasisId) => updateLine(index, { calculationBasisId })}
            />
            <TextField label="Rate" type="number" value={numValue(line.rate)} disabled={disabled} onChange={(rate) => updateLine(index, { rate })} />
            <TextField label="Fixed amount" type="number" value={numValue(line.fixedAmount)} disabled={disabled} onChange={(fixedAmount) => updateLine(index, { fixedAmount })} />
            <TextField label="Line effective from" type="date" value={toDateInput(line.lineEffectiveFrom)} disabled={disabled} onChange={(lineEffectiveFrom) => updateLine(index, { lineEffectiveFrom })} />
            <TextField label="Line effective to" type="date" value={toDateInput(line.lineEffectiveTo)} disabled={disabled} onChange={(lineEffectiveTo) => updateLine(index, { lineEffectiveTo })} />
            <div className="fm-field-group">
              <label className="fm-field-label">Line status</label>
              <select className="fm-form-select" value={line.status || 'Active'} disabled={disabled} onChange={(event) => updateLine(index, { status: event.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <TextField label="Notes" value={line.notes || ''} disabled={disabled} onChange={(notes) => updateLine(index, { notes })} />
          </div>
          {!disabled && (
            <button type="button" className="fm-btn fm-btn-secondary" onClick={() => onChange({ ...value, feeLines: feeLines.filter((_, i) => i !== index) })}>
              Remove fee line
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function CalendarEditor({ value, onChange, disabled }) {
  const weekdays = mergeWeek(value.weekdays);
  const exceptions = value.exceptions || [];

  const updateDay = (dayOfWeek, patch) => {
    onChange({
      ...value,
      weekdays: weekdays.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
    });
  };

  const updateException = (index, patch) => {
    onChange({
      ...value,
      exceptions: exceptions.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  return (
    <>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Weekly pattern</h4>
        <p className="fcc-empty">Sunday is the first day of the week. Leave a flag unchecked until that day is confirmed.</p>
        <div className="fcc-week">
          {WEEKDAYS.map((day) => {
            const row = weekdays.find((item) => item.dayOfWeek === day.dayOfWeek);
            return (
              <div key={day.dayOfWeek} className="fcc-card">
                <strong>{day.label}</strong>
                <CheckField label="Dealing Eligible" checked={row.isDealingEligible} disabled={disabled} onChange={(isDealingEligible) => updateDay(day.dayOfWeek, { isDealingEligible })} />
                <CheckField label="Valuation Eligible" checked={row.isValuationEligible} disabled={disabled} onChange={(isValuationEligible) => updateDay(day.dayOfWeek, { isValuationEligible })} />
                <CheckField label="Settlement Eligible" checked={row.isSettlementEligible} disabled={disabled} onChange={(isSettlementEligible) => updateDay(day.dayOfWeek, { isSettlementEligible })} />
                <CheckField label="NAV Publication Eligible" checked={row.isNavPublicationEligible} disabled={disabled} onChange={(isNavPublicationEligible) => updateDay(day.dayOfWeek, { isNavPublicationEligible })} />
                <CheckField label="Non-Business Day" checked={row.isNonBusiness} disabled={disabled} onChange={(isNonBusiness) => updateDay(day.dayOfWeek, { isNonBusiness })} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="fcc-block">
        <h4 className="fcc-block__title">Dated exceptions</h4>
        {!disabled && (
          <button
            type="button"
            className="fm-btn fm-btn-secondary"
            onClick={() =>
              onChange({
                ...value,
                exceptions: [
                  ...exceptions,
                  {
                    exceptionDate: '',
                    name: '',
                    isDealingEligible: null,
                    isValuationEligible: null,
                    isSettlementEligible: null,
                    isNavPublicationEligible: null,
                    isNonBusiness: null,
                    notes: '',
                  },
                ],
              })
            }
          >
            Add exception
          </button>
        )}
        {exceptions.length === 0 && <EmptyNote>No dated exceptions on this version.</EmptyNote>}
        {exceptions.map((row, index) => (
          <div key={index} className="fcc-card">
            <div className="fm-form-grid">
              <TextField label="Date" type="date" value={toDateInput(row.exceptionDate)} disabled={disabled} onChange={(exceptionDate) => updateException(index, { exceptionDate })} />
              <TextField label="Name" value={row.name || ''} disabled={disabled} onChange={(name) => updateException(index, { name })} />
              <TextField label="Notes" value={row.notes || ''} disabled={disabled} onChange={(notes) => updateException(index, { notes })} />
            </div>
            <div className="fcc-checks">
              <TriFlag label="Dealing Eligible" value={row.isDealingEligible} disabled={disabled} onChange={(isDealingEligible) => updateException(index, { isDealingEligible })} />
              <TriFlag label="Valuation Eligible" value={row.isValuationEligible} disabled={disabled} onChange={(isValuationEligible) => updateException(index, { isValuationEligible })} />
              <TriFlag label="Settlement Eligible" value={row.isSettlementEligible} disabled={disabled} onChange={(isSettlementEligible) => updateException(index, { isSettlementEligible })} />
              <TriFlag label="NAV Publication Eligible" value={row.isNavPublicationEligible} disabled={disabled} onChange={(isNavPublicationEligible) => updateException(index, { isNavPublicationEligible })} />
              <TriFlag label="Non-Business Day" value={row.isNonBusiness} disabled={disabled} onChange={(isNonBusiness) => updateException(index, { isNonBusiness })} />
            </div>
            {!disabled && (
              <button type="button" className="fm-btn fm-btn-secondary" onClick={() => onChange({ ...value, exceptions: exceptions.filter((_, i) => i !== index) })}>
                Remove exception
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function TriFlag({ label, value, onChange, disabled }) {
  const current = value === true || value === 1 ? 'yes' : value === false || value === 0 ? 'no' : '';
  return (
    <div className="fm-field-group">
      <label className="fm-field-label">{label}</label>
      <select
        className="fm-form-select"
        value={current}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value === 'yes') onChange(true);
          else if (event.target.value === 'no') onChange(false);
          else onChange(null);
        }}
      >
        <option value="">Unspecified</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}

export function payloadFromEditor(section, value) {
  if (section === 'mandate') {
    return {
      assetClasses: (value.assetClasses || [])
        .filter((row) => row.assetClassId)
        .map((row) => ({
          assetClassId: Number(row.assetClassId),
          isPermitted: row.isPermitted !== false && row.isPermitted !== 0,
          notes: row.notes || null,
        })),
      rules: (value.rules || [])
        .filter((row) => row.ruleDimensionId)
        .map((row) => ({
          ruleDimensionId: Number(row.ruleDimensionId),
          limitTypeId: row.limitTypeId || null,
          limitUnitId: row.limitUnitId || null,
          limitValue: numOrNull(row.limitValue),
          limitValueUpper: numOrNull(row.limitValueUpper),
          currency: row.currency || null,
          notes: row.notes || null,
        })),
    };
  }
  if (section === 'dealing') {
    const settings = value.settings || {};
    return {
      settings: {
        subscriptionEnabled: !!settings.subscriptionEnabled,
        redemptionEnabled: !!settings.redemptionEnabled,
        switchEnabled: !!settings.switchEnabled,
        unitTransferEnabled: !!settings.unitTransferEnabled,
        minInitialInvestment: numOrNull(settings.minInitialInvestment),
        minAdditionalInvestment: numOrNull(settings.minAdditionalInvestment),
        minRedemptionAmount: numOrNull(settings.minRedemptionAmount),
        minRemainingBalance: numOrNull(settings.minRemainingBalance),
        amountPrecision: numOrNull(settings.amountPrecision),
        unitPrecision: numOrNull(settings.unitPrecision),
        roundingMethodId: settings.roundingMethodId || null,
        settlementConventionId: settings.settlementConventionId || null,
        noticePeriodDays: numOrNull(settings.noticePeriodDays),
      },
      cutoffs: (value.cutoffs || [])
        .filter((row) => row.cutoffTypeId)
        .map((row) => ({
          cutoffTypeId: Number(row.cutoffTypeId),
          cutoffTime: row.cutoffTime || null,
          timezone: row.timezone || null,
          notes: row.notes || null,
        })),
    };
  }
  if (section === 'navPricing') {
    const settings = value.settings || {};
    return {
      settings: {
        valuationFrequencyId: settings.valuationFrequencyId || null,
        valuationTime: settings.valuationTime || null,
        navCutoffTime: settings.navCutoffTime || null,
        pricingMethodId: settings.pricingMethodId || null,
        navPrecision: numOrNull(settings.navPrecision),
        navPerUnitPrecision: numOrNull(settings.navPerUnitPrecision),
        unitPricePrecision: numOrNull(settings.unitPricePrecision),
        roundingMethodId: settings.roundingMethodId || null,
      },
      publishedPriceTypes: (value.publishedPriceTypes || [])
        .filter((row) => row.publishedPriceTypeId)
        .map((row) => ({
          publishedPriceTypeId: Number(row.publishedPriceTypeId),
          isEnabled: !!row.isEnabled,
          sortOrder: numOrNull(row.sortOrder) ?? 0,
          notes: row.notes || null,
        })),
    };
  }
  if (section === 'fees') {
    return {
      feeLines: (value.feeLines || [])
        .filter((row) => row.feeDefinitionId)
        .map((row) => ({
          feeDefinitionId: Number(row.feeDefinitionId),
          calculationBasisId: row.calculationBasisId || null,
          rate: numOrNull(row.rate),
          fixedAmount: numOrNull(row.fixedAmount),
          lineEffectiveFrom: row.lineEffectiveFrom || null,
          lineEffectiveTo: row.lineEffectiveTo || null,
          status: row.status || 'Active',
          notes: row.notes || null,
        })),
    };
  }
  if (section === 'calendar') {
    return {
      weekdays: mergeWeek(value.weekdays).map((row) => ({
        dayOfWeek: row.dayOfWeek,
        isDealingEligible: !!row.isDealingEligible,
        isValuationEligible: !!row.isValuationEligible,
        isSettlementEligible: !!row.isSettlementEligible,
        isNavPublicationEligible: !!row.isNavPublicationEligible,
        isNonBusiness: !!row.isNonBusiness,
      })),
      exceptions: (value.exceptions || [])
        .filter((row) => row.exceptionDate)
        .map((row) => ({
          exceptionDate: toDateInput(row.exceptionDate),
          name: row.name || null,
          isDealingEligible: row.isDealingEligible,
          isValuationEligible: row.isValuationEligible,
          isSettlementEligible: row.isSettlementEligible,
          isNavPublicationEligible: row.isNavPublicationEligible,
          isNonBusiness: row.isNonBusiness,
          notes: row.notes || null,
        })),
    };
  }
  return {};
}

export function editorFromResponse(section, config) {
  if (!config) return emptyDomain(section);
  if (section === 'calendar') {
    return { weekdays: mergeWeek(config.weekdays), exceptions: config.exceptions || [] };
  }
  if (section === 'dealing') {
    return {
      settings: {
        ...(config.settings || {}),
        cutoffTime: undefined,
      },
      cutoffs: (config.cutoffs || []).map((row) => ({
        ...row,
        cutoffTime: toTimeInput(row.cutoffTime),
      })),
    };
  }
  if (section === 'navPricing') {
    return {
      settings: {
        ...(config.settings || {}),
        valuationTime: toTimeInput(config.settings?.valuationTime),
        navCutoffTime: toTimeInput(config.settings?.navCutoffTime),
      },
      publishedPriceTypes: config.publishedPriceTypes || [],
    };
  }
  if (section === 'fees') {
    return {
      feeLines: (config.feeLines || []).map((line) => ({
        ...line,
        lineEffectiveFrom: toDateInput(line.lineEffectiveFrom),
        lineEffectiveTo: toDateInput(line.lineEffectiveTo),
      })),
    };
  }
  if (section === 'mandate') {
    return { assetClasses: config.assetClasses || [], rules: config.rules || [] };
  }
  return emptyDomain(section);
}
