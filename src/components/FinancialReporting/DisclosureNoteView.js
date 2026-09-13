import React from 'react';

const formatNoteAmount = (value, fractionDigits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '-';
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(abs);
  return n < 0 ? `(${formatted})` : formatted;
};

const formatSheetAmount = (value) => formatNoteAmount(value, 0);

const PeriodHead = ({ period }) => (
  <th className="frn-sheet-th-num">
    <span className="frn-sheet-period">{period.shortLabel || period.label}</span>
    <span className="frn-sheet-unit">LKR</span>
  </th>
);

const dash = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) return '-';
  return formatNoteAmount(n);
};

const ppeRowLabel = (section) => {
  if (section.accountCode) {
    return (
      <>
        <span className="frn-excel-code">{section.accountCode}</span>
        <span className="frn-excel-name">{section.categoryName}</span>
      </>
    );
  }
  return section.categoryName;
};

const ComparativeTable = ({
  periods,
  rows,
  total,
  heading,
  sectionLabel,
  totalsOnly = false,
  emptyLabel = 'No GL balances found for this note at the selected as-at date.',
  customRows = [],
  onRemoveCustomRow
}) => {
  const autoRows = rows || [];
  const userRows = customRows || [];
  const hasAnyRows = autoRows.length > 0 || userRows.length > 0;
  const combinedTotal = {
    current: (Number(total?.current) || 0) + userRows.reduce((s, r) => s + (Number(r.current) || 0), 0),
    prior: (Number(total?.prior) || 0) + userRows.reduce((s, r) => s + (Number(r.prior) || 0), 0)
  };

  return (
    <div className="frn-sheet-wrap">
      <table className="frn-sheet">
        {heading ? <caption className="frn-sheet-caption">{heading}</caption> : null}
        <colgroup>
          <col className="frn-sheet-col-label" />
          <col className="frn-sheet-col-num" />
          <col className="frn-sheet-col-num" />
        </colgroup>
        <thead>
          <tr>
            <th className="frn-sheet-th-label">Description</th>
            <PeriodHead period={periods.current} />
            <PeriodHead period={periods.prior} />
          </tr>
        </thead>
        <tbody>
          {sectionLabel ? (
            <tr>
              <td className="frn-sheet-section">{sectionLabel}</td>
              <td className="frn-sheet-num" />
              <td className="frn-sheet-num" />
            </tr>
          ) : null}
          {totalsOnly ? null : !hasAnyRows ? (
            <tr>
              <td colSpan={3} className="frn-sheet-empty">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            <>
              {autoRows.map((row) => (
                <tr key={`auto-${row.label}`} className="frn-sheet-line">
                  <td className="frn-sheet-label">{row.label}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.current)}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.prior)}</td>
                </tr>
              ))}
              {userRows.map((row) => (
                <tr key={`custom-${row.id}`} className="frn-sheet-line frn-sheet-line--custom">
                  <td className="frn-sheet-label">
                    <span className="frn-sheet-custom-label">{row.label}</span>
                    {row.accountCodes?.length ? (
                      <span className="frn-sheet-custom-meta">
                        {row.accountCodes.length} account
                        {row.accountCodes.length === 1 ? '' : 's'}
                        {Math.abs(Number(row.current) || 0) < 0.005 &&
                        Math.abs(Number(row.prior) || 0) < 0.005
                          ? ' · no Combined TB amount for period'
                          : ''}
                      </span>
                    ) : null}
                    {typeof onRemoveCustomRow === 'function' ? (
                      <button
                        type="button"
                        className="frn-sheet-custom-remove"
                        onClick={() => onRemoveCustomRow(row.id)}
                        title="Remove this description"
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.current)}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.prior)}</td>
                </tr>
              ))}
            </>
          )}
          <tr className="frn-sheet-total">
            <td className="frn-sheet-label">Total</td>
            <td className="frn-sheet-num">
              <span>{formatSheetAmount(combinedTotal.current)}</span>
            </td>
            <td className="frn-sheet-num">
              <span>{formatSheetAmount(combinedTotal.prior)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const PpeNote = ({ periods, sections, totals, footnote75 }) => {
  const openingHeader = `Balance As At ${periods.fyStartLabel || periods.prior.longLabel || periods.prior.label} (LKR)`;
  const closingHeader = `Balance As At ${periods.closingLabel || periods.current.longLabel || periods.current.label} (LKR)`;
  const nbvCurrentHeader = `${periods.current.shortLabel || periods.current.label} (LKR)`;
  const nbvPriorHeader = `${periods.prior.shortLabel || periods.prior.year} (LKR)`;

  const costTotals = totals?.cost || {
    opening: sections.reduce((s, r) => s + (Number(r.cost?.opening) || 0), 0),
    additions: sections.reduce((s, r) => s + (Number(r.cost?.additions) || 0), 0),
    disposals: sections.reduce((s, r) => s + (Number(r.cost?.disposals) || 0), 0),
    closing: sections.reduce((s, r) => s + (Number(r.cost?.closing) || 0), 0)
  };
  const depTotals = totals?.depreciation || {
    opening: sections.reduce((s, r) => s + (Number(r.depreciation?.opening) || 0), 0),
    charge: sections.reduce((s, r) => s + (Number(r.depreciation?.charge) || 0), 0),
    disposals: sections.reduce((s, r) => s + (Number(r.depreciation?.disposals) || 0), 0),
    closing: sections.reduce((s, r) => s + (Number(r.depreciation?.closing) || 0), 0)
  };
  const nbvTotals = totals?.nbv || {
    current: sections.reduce((s, r) => s + (Number(r.nbv?.current) || 0), 0),
    prior: sections.reduce((s, r) => s + (Number(r.nbv?.prior) || 0), 0)
  };

  return (
    <div className="frn-excel-sheet">
      <table className="frn-excel-table">
        <colgroup>
          <col className="frn-excel-col-label" />
          <col className="frn-excel-col-num" />
          <col className="frn-excel-col-num" />
          <col className="frn-excel-col-num" />
          <col className="frn-excel-col-num" />
        </colgroup>
        <tbody>
          {/* 7.1 At Cost */}
          <tr className="frn-excel-section">
            <td colSpan={5}>7.1 At Cost</td>
          </tr>
          <tr className="frn-excel-head">
            <td />
            <td>{openingHeader}</td>
            <td>Additions (LKR)</td>
            <td>Disposals (LKR)</td>
            <td>{closingHeader}</td>
          </tr>
          {sections.length === 0 ? (
            <tr>
              <td colSpan={5} className="frn-excel-empty">
                No fixed assets in the register. Add assets under Fixed Assets.
              </td>
            </tr>
          ) : (
            sections.map((s) => (
              <tr key={`cost-${s.accountCode || s.categoryName}`}>
                <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
                <td className="frn-excel-num">{dash(s.cost.opening)}</td>
                <td className="frn-excel-num">{dash(s.cost.additions)}</td>
                <td className="frn-excel-num">{dash(s.cost.disposals)}</td>
                <td className="frn-excel-num">{dash(s.cost.closing)}</td>
              </tr>
            ))
          )}
          {sections.length > 0 ? (
            <tr className="frn-excel-total">
              <td>Total assets</td>
              <td className="frn-excel-num">{dash(costTotals.opening)}</td>
              <td className="frn-excel-num">{dash(costTotals.additions)}</td>
              <td className="frn-excel-num">{dash(costTotals.disposals)}</td>
              <td className="frn-excel-num">{dash(costTotals.closing)}</td>
            </tr>
          ) : null}

          <tr className="frn-excel-spacer">
            <td colSpan={5} />
          </tr>

          {/* 7.2 Depreciation */}
          <tr className="frn-excel-section">
            <td colSpan={5}>7.2 Depreciation</td>
          </tr>
          <tr className="frn-excel-head">
            <td />
            <td>{openingHeader}</td>
            <td>Charge for the year (LKR)</td>
            <td>Disposals (LKR)</td>
            <td>{closingHeader}</td>
          </tr>
          {sections.map((s) => (
            <tr key={`dep-${s.accountCode || s.categoryName}`}>
              <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.opening)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.charge)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.disposals)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.closing)}</td>
            </tr>
          ))}
          {sections.length > 0 ? (
            <tr className="frn-excel-total">
              <td>Total depreciation</td>
              <td className="frn-excel-num">{dash(depTotals.opening)}</td>
              <td className="frn-excel-num">{dash(depTotals.charge)}</td>
              <td className="frn-excel-num">{dash(depTotals.disposals)}</td>
              <td className="frn-excel-num">{dash(depTotals.closing)}</td>
            </tr>
          ) : null}

          <tr className="frn-excel-spacer">
            <td colSpan={5} />
          </tr>

          {/* 7.3 Net Book Values */}
          <tr className="frn-excel-section">
            <td colSpan={5}>7.3 Net Book Values</td>
          </tr>
          <tr className="frn-excel-head">
            <td />
            <td>{nbvCurrentHeader}</td>
            <td>{nbvPriorHeader}</td>
            <td />
            <td />
          </tr>
          {sections.map((s) => (
            <tr key={`nbv-${s.accountCode || s.categoryName}`}>
              <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
              <td className="frn-excel-num">{dash(s.nbv.current)}</td>
              <td className="frn-excel-num">{dash(s.nbv.prior)}</td>
              <td />
              <td />
            </tr>
          ))}
          {sections.length > 0 ? (
            <tr className="frn-excel-total">
              <td>Total Carrying Amount of Property, Plant &amp; Equipment</td>
              <td className="frn-excel-num">{dash(nbvTotals.current)}</td>
              <td className="frn-excel-num">{dash(nbvTotals.prior)}</td>
              <td />
              <td />
            </tr>
          ) : null}

          <tr className="frn-excel-spacer">
            <td colSpan={5} />
          </tr>

          {/* 7.4 Useful Lives */}
          <tr className="frn-excel-section">
            <td colSpan={5}>7.4 Useful Lives</td>
          </tr>
          <tr className="frn-excel-note-line">
            <td colSpan={5}>The useful lives of the assets are estimated as follows;</td>
          </tr>
          <tr className="frn-excel-head">
            <td />
            <td>{periods.current.shortLabel || periods.current.label}</td>
            <td>{periods.prior.shortLabel || periods.prior.year}</td>
            <td />
            <td />
          </tr>
          {sections
            .filter((s) => s.usefulLifeYears)
            .map((s) => (
              <tr key={`life-${s.accountCode || s.categoryName}`}>
                <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
                <td className="frn-excel-num">{s.usefulLifeYears} Years</td>
                <td className="frn-excel-num">{s.usefulLifeYears} Years</td>
                <td />
                <td />
              </tr>
            ))}

          {footnote75 ? (
            <>
              <tr className="frn-excel-spacer">
                <td colSpan={5} />
              </tr>
              <tr className="frn-excel-footnote">
                <td colSpan={5}>{footnote75}</td>
              </tr>
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};

const CashNote = ({ periods, rows, total, customRows = [], onRemoveCustomRow }) => {
  const favorable = rows.filter((r) => !normalizeCashNegative(r.label));
  const unfavorable = rows.filter((r) => normalizeCashNegative(r.label));

  const sumRows = (list, key) =>
    list.reduce((s, r) => s + (Number(r[key]) || 0), 0);

  const favTotal = {
    current: sumRows(favorable, 'current'),
    prior: sumRows(favorable, 'prior')
  };
  const unfavTotal = {
    current: sumRows(unfavorable, 'current'),
    prior: sumRows(unfavorable, 'prior')
  };
  const customTotal = {
    current: sumRows(customRows, 'current'),
    prior: sumRows(customRows, 'prior')
  };
  const netTotal = {
    current: favTotal.current - unfavTotal.current + customTotal.current,
    prior: favTotal.prior - unfavTotal.prior + customTotal.prior
  };

  const renderBlock = (title, list, blockTotal) => (
    <ComparativeTable
      periods={periods}
      rows={list}
      total={blockTotal}
      heading={title}
      emptyLabel="-"
    />
  );

  return (
    <>
      {renderBlock('12.1 Favourable balance', favorable, favTotal)}
      {unfavorable.length > 0 ? renderBlock('12.2 Unfavourable balance', unfavorable, unfavTotal) : null}
      {customRows.length > 0 ? (
        <ComparativeTable
          periods={periods}
          rows={[]}
          total={customTotal}
          heading="User descriptions"
          customRows={customRows}
          onRemoveCustomRow={onRemoveCustomRow}
        />
      ) : null}
      <ComparativeTable
        periods={periods}
        rows={[]}
        total={netTotal}
        heading="Total cash and cash equivalents for cash flow statement"
        totalsOnly
      />
    </>
  );
};

const normalizeCashNegative = (label) =>
  String(label || '')
    .toLowerCase()
    .includes('overdraft');

const FvtplEquityNote = ({ periods, equityRows, equityTotals }) => {
  const currentPeriod = periods.current.shortLabel || periods.current.label;
  const priorPeriod = periods.prior.shortLabel || periods.prior.label;
  const rows = equityRows || [];
  const totals = equityTotals || {
    currentCost: 0,
    currentMv: 0,
    priorCost: 0,
    priorMv: 0
  };

  return (
    <div className="frn-note-subsection">
      <h3 className="frn-note-subsection-title">
        Investments in Equity Securities - Quoted
      </h3>
      <div className="frn-sheet-wrap">
        <table className="frn-sheet frn-sheet--fvtpl">
          <colgroup>
            <col className="frn-sheet-col-label" />
            <col className="frn-sheet-col-num" />
            <col className="frn-sheet-col-num" />
            <col className="frn-sheet-col-num" />
            <col className="frn-sheet-col-num" />
          </colgroup>
          <thead>
            <tr>
              <th className="frn-sheet-th-label" rowSpan={2} />
              <th className="frn-sheet-th-num frn-sheet-th-group" colSpan={2}>
                {currentPeriod}
                <span className="frn-sheet-unit">LKR</span>
              </th>
              <th className="frn-sheet-th-num frn-sheet-th-group" colSpan={2}>
                {priorPeriod}
                <span className="frn-sheet-unit">LKR</span>
              </th>
            </tr>
            <tr>
              <th className="frn-sheet-th-num">Cost</th>
              <th className="frn-sheet-th-num">Market Value</th>
              <th className="frn-sheet-th-num">Cost</th>
              <th className="frn-sheet-th-num">Market Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="frn-sheet-empty">
                  No quoted equity holdings found for the selected as-at dates.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} className="frn-sheet-line">
                  <td className="frn-sheet-label">{row.label}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.currentCost)}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.currentMv)}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.priorCost)}</td>
                  <td className="frn-sheet-num">{formatSheetAmount(row.priorMv)}</td>
                </tr>
              ))
            )}
            <tr className="frn-sheet-total">
              <td className="frn-sheet-label">Total</td>
              <td className="frn-sheet-num">
                <span>{formatSheetAmount(totals.currentCost)}</span>
              </td>
              <td className="frn-sheet-num">
                <span>{formatSheetAmount(totals.currentMv)}</span>
              </td>
              <td className="frn-sheet-num">
                <span>{formatSheetAmount(totals.priorCost)}</span>
              </td>
              <td className="frn-sheet-num">
                <span>{formatSheetAmount(totals.priorMv)}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DisclosureNoteView = ({
  data,
  loading,
  error,
  customRows = [],
  onRemoveCustomRow,
  onRetry
}) => {
  if (loading) {
    return (
      <div className="frn-loading">
        <div className="fp-loading-spinner" />
        <p className="frn-loading-text">Building note from ledger data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="frn-error frn-error--guided" role="alert">
        <p className="frn-error-title">Couldn’t open this note</p>
        <p className="frn-error-body">{error}</p>
        {typeof onRetry === 'function' ? (
          <button type="button" className="frn-error-retry" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (!data?.note) return null;

  const {
    note,
    periods,
    template,
    rows,
    total,
    sections,
    totals,
    footnote75,
    equityRows,
    equityTotals
  } = data;
  const noteTitle = `${note.number}. ${note.title.toUpperCase()}`;
  const showCustomUnderSchedule =
    (template === 'ppe' || template === 'fvtplEquity') && customRows.length > 0;

  return (
    <section
      className={`frn-note-section${
        template === 'ppe' || template === 'fvtplEquity' ? ' frn-note-section--schedule' : ''
      }`}
    >
      <header className="frn-note-section-head">
        <h2 className="frn-note-section-title">{noteTitle}</h2>
      </header>
      <div className="frn-note-section-body">
        {template === 'ppe' ? (
          <PpeNote
            periods={periods}
            sections={sections || []}
            totals={totals}
            footnote75={footnote75}
          />
        ) : template === 'fvtplEquity' ? (
          <FvtplEquityNote
            periods={periods}
            equityRows={equityRows}
            equityTotals={equityTotals}
          />
        ) : template === 'cash' ? (
          <CashNote
            periods={periods}
            rows={rows || []}
            total={total}
            customRows={customRows}
            onRemoveCustomRow={onRemoveCustomRow}
          />
        ) : template === 'statedCapital' ? (
          <ComparativeTable
            periods={periods}
            rows={rows || []}
            total={total}
            heading=""
            sectionLabel="Ordinary shares"
            customRows={customRows}
            onRemoveCustomRow={onRemoveCustomRow}
          />
        ) : (
          <ComparativeTable
            periods={periods}
            rows={rows || []}
            total={total}
            heading=""
            customRows={customRows}
            onRemoveCustomRow={onRemoveCustomRow}
          />
        )}
        {showCustomUnderSchedule ? (
          <ComparativeTable
            periods={periods}
            rows={[]}
            total={{ current: 0, prior: 0 }}
            heading="User descriptions"
            customRows={customRows}
            onRemoveCustomRow={onRemoveCustomRow}
            emptyLabel=""
          />
        ) : null}
      </div>
    </section>
  );
};

export default DisclosureNoteView;
