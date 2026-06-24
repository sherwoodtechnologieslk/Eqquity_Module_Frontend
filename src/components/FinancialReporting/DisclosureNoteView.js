import React from 'react';

const formatNoteAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '—';
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(abs);
  return n < 0 ? `(${formatted})` : formatted;
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

const PpeNote = ({ periods, sections }) => (
  <>
    <div className="frn-mock-section">
      <h4 className="frn-mock-h4">7.1 At cost</h4>
      <div className="frn-mock-table-wrap">
        <table className="frn-mock-table">
          <thead>
            <tr>
              <th />
              <th className="frn-mock-th-num">Balance as at 01 April {periods.prior.year}</th>
              <th className="frn-mock-th-num">Additions</th>
              <th className="frn-mock-th-num">Disposals</th>
              <th className="frn-mock-th-num">Balance as at 31 March {periods.current.year}</th>
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 ? (
              <tr>
                <td colSpan={5} className="frn-mock-row-sub">
                  No fixed assets in the register. Add assets under Fixed Assets.
                </td>
              </tr>
            ) : (
              sections.map((s) => (
                <tr key={`cost-${s.categoryName}`}>
                  <td>{s.categoryName}</td>
                  <td className="frn-mock-num">{formatNoteAmount(s.cost.opening)}</td>
                  <td className="frn-mock-num">{formatNoteAmount(s.cost.additions)}</td>
                  <td className="frn-mock-num">{formatNoteAmount(s.cost.disposals)}</td>
                  <td className="frn-mock-num">{formatNoteAmount(s.cost.closing)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="frn-mock-section">
      <h4 className="frn-mock-h4">7.2 Depreciation</h4>
      <div className="frn-mock-table-wrap">
        <table className="frn-mock-table">
          <thead>
            <tr>
              <th />
              <th className="frn-mock-th-num">Balance as at 01 April {periods.prior.year}</th>
              <th className="frn-mock-th-num">Charge for the year</th>
              <th className="frn-mock-th-num">Disposals</th>
              <th className="frn-mock-th-num">Balance as at 31 March {periods.current.year}</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={`dep-${s.categoryName}`}>
                <td>{s.categoryName}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.depreciation.opening)}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.depreciation.charge)}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.depreciation.disposals)}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.depreciation.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="frn-mock-section">
      <h4 className="frn-mock-h4">7.3 Net book values</h4>
      <div className="frn-mock-table-wrap">
        <table className="frn-mock-table">
          <thead>
            <tr>
              <th />
              <th className="frn-mock-th-num">{periods.current.year} LKR</th>
              <th className="frn-mock-th-num">{periods.prior.year} LKR</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={`nbv-${s.categoryName}`}>
                <td>{s.categoryName}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.nbv.current)}</td>
                <td className="frn-mock-num">{formatNoteAmount(s.nbv.prior)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {sections.some((s) => s.usefulLifeYears) ? (
      <div className="frn-mock-section">
        <h4 className="frn-mock-h4">7.4 Useful lives</h4>
        <div className="frn-mock-table-wrap">
          <table className="frn-mock-table">
            <tbody>
              {sections.map((s) => (
                <tr key={`life-${s.categoryName}`}>
                  <td>{s.categoryName}</td>
                  <td className="frn-mock-num">{s.usefulLifeYears} Years</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null}
  </>
);

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
                <td colSpan={3} className="frn-mock-row-sub">—</td>
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

  const { note, periods, template, rows, total, sections } = data;
  const noteTitle = `${note.number}. ${note.title.toUpperCase()}`;

  return (
    <div className="frn-mock-block">
      <p className="frn-mock-sub">{periods.periodTitle}</p>
      <h2 className="frn-mock-block-title">{noteTitle}</h2>

      {template === 'ppe' ? (
        <PpeNote periods={periods} sections={sections || []} />
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

      <p className="frn-mock-disclaimer">
        Amounts are derived from general ledger, opening balances, and fixed asset
        register data. Comparative columns use your selected as-at date and the
        same calendar date one year earlier.
      </p>
    </div>
  );
};

export default DisclosureNoteView;
