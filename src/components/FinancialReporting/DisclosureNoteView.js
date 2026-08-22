import React from 'react';

const formatNoteAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '-';
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(abs);
  return n < 0 ? `(${formatted})` : formatted;
};

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

const ComparativeTable = ({ periods, rows, total, title }) => (
  <div className="frn-mock-section">
    <h3 className="frn-mock-h4">{title}</h3>
    <div className="frn-mock-table-wrap">
      <table className="frn-mock-table">
        <thead>
          <tr>
            <th />
            <th className="frn-mock-th-num">{periods.current.label} LKR</th>
            <th className="frn-mock-th-num">{periods.prior.label} LKR</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="frn-mock-row-sub">
                No GL balances found for this note at the selected as-at date.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="frn-mock-num">{formatNoteAmount(row.current)}</td>
                <td className="frn-mock-num">{formatNoteAmount(row.prior)}</td>
              </tr>
            ))
          )}
          <tr className="frn-mock-row-total">
            <td>
              <strong>Total</strong>
            </td>
            <td className="frn-mock-num">
              <strong>{formatNoteAmount(total?.current)}</strong>
            </td>
            <td className="frn-mock-num">
              <strong>{formatNoteAmount(total?.prior)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

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

const CashNote = ({ periods, rows, total }) => {
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
  const netTotal = {
    current: favTotal.current - unfavTotal.current,
    prior: favTotal.prior - unfavTotal.prior
  };

  const renderBlock = (title, list, blockTotal) => (
    <div className="frn-mock-section">
      <h4 className="frn-mock-h4">{title}</h4>
      <div className="frn-mock-table-wrap">
        <table className="frn-mock-table">
          <thead>
            <tr>
              <th />
              <th className="frn-mock-th-num">{periods.current.label} LKR</th>
              <th className="frn-mock-th-num">{periods.prior.label} LKR</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="frn-mock-row-sub">-</td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="frn-mock-num">{formatNoteAmount(row.current)}</td>
                  <td className="frn-mock-num">{formatNoteAmount(row.prior)}</td>
                </tr>
              ))
            )}
            <tr className="frn-mock-row-total">
              <td>
                <strong>Total</strong>
              </td>
              <td className="frn-mock-num">
                <strong>{formatNoteAmount(blockTotal.current)}</strong>
              </td>
              <td className="frn-mock-num">
                <strong>{formatNoteAmount(blockTotal.prior)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {renderBlock('12.1 Favourable balance', favorable, favTotal)}
      {unfavorable.length > 0 ? renderBlock('12.2 Unfavourable balance', unfavorable, unfavTotal) : null}
      <div className="frn-mock-section">
        <h4 className="frn-mock-h4">Total cash and cash equivalents for cash flow statement</h4>
        <div className="frn-mock-table-wrap">
          <table className="frn-mock-table">
            <tbody>
              <tr className="frn-mock-row-total">
                <td>
                  <strong>Total</strong>
                </td>
                <td className="frn-mock-num">
                  <strong>{formatNoteAmount(netTotal.current)}</strong>
                </td>
                <td className="frn-mock-num">
                  <strong>{formatNoteAmount(netTotal.prior)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const normalizeCashNegative = (label) =>
  String(label || '')
    .toLowerCase()
    .includes('overdraft');

const DisclosureNoteView = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="frn-loading">
        <div className="fp-loading-spinner" />
        <p className="frn-loading-text">Building note from ledger data…</p>
      </div>
    );
  }

  if (error) {
    return <div className="frn-error">{error}</div>;
  }

  if (!data?.note) return null;

  const { note, periods, template, rows, total, sections, totals, footnote75 } = data;
  const noteTitle = `${note.number}. ${note.title.toUpperCase()}`;

  return (
    <div className={`frn-mock-block${template === 'ppe' ? ' frn-mock-block--excel' : ''}`}>
      <h2 className="frn-mock-block-title">{noteTitle}</h2>

      {template === 'ppe' ? (
        <PpeNote
          periods={periods}
          sections={sections || []}
          totals={totals}
          footnote75={footnote75}
        />
      ) : template === 'cash' ? (
        <CashNote periods={periods} rows={rows || []} total={total} />
      ) : template === 'statedCapital' ? (
        <ComparativeTable
          periods={periods}
          rows={rows || []}
          total={total}
          title="Ordinary shares"
        />
      ) : (
        <ComparativeTable
          periods={periods}
          rows={rows || []}
          total={total}
          title={note.title}
        />
      )}
    </div>
  );
};

export default DisclosureNoteView;
