import React, { useState } from 'react';
import {
  autoRowKey,
  customRowKey,
  editRowKey,
  formatClassName,
  getLayoutCell,
  getRowFormat,
  isRowHidden,
  resolveRowLabel
} from '../../utils/noteLayoutEdit';

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

const customSignKey = (rowId) => `c:${rowId}`;

const getRowSign = (rowSignsByKey, key) =>
  rowSignsByKey && rowSignsByKey[key] === -1 ? -1 : 1;

/** Absolute TB amount with user +/- contribution to the note total. */
const signedContribution = (amount, sign) =>
  Math.abs(Number(amount) || 0) * (sign < 0 ? -1 : 1);

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

const ppeSectionKey = (section) =>
  String(section.categoryId || section.accountCode || section.categoryName || '').trim();

const RowActions = ({
  title,
  accounts,
  onViewAccounts,
  onAddAccounts,
  onRemove,
  removeTitle,
  rowSign = 1,
  onToggleRowSign
}) => (
  <span className="frn-sheet-row-actions">
    {typeof onToggleRowSign === 'function' ? (
      <button
        type="button"
        className={`frn-sheet-sign-toggle${rowSign < 0 ? ' is-negative' : ' is-positive'}`}
        onClick={onToggleRowSign}
        title={
          rowSign < 0
            ? 'Subtracts from total — click to add (+)'
            : 'Adds to total — click to subtract (−)'
        }
        aria-label={rowSign < 0 ? 'Negative to total' : 'Positive to total'}
      >
        {rowSign < 0 ? '−' : '+'}
      </button>
    ) : null}
    {typeof onViewAccounts === 'function' ? (
      <button
        type="button"
        className="frn-sheet-view-accounts"
        onClick={() => onViewAccounts({ title, accounts: accounts || [] })}
        title="View linked accounts"
      >
        View
      </button>
    ) : null}
    {typeof onAddAccounts === 'function' ? (
      <button
        type="button"
        className="frn-sheet-add-accounts"
        onClick={onAddAccounts}
        title="Add more accounts to this description"
      >
        Add accounts
      </button>
    ) : null}
    {typeof onRemove === 'function' ? (
      <button
        type="button"
        className="frn-sheet-custom-remove"
        onClick={onRemove}
        title={removeTitle || 'Remove this line'}
      >
        Remove
      </button>
    ) : null}
  </span>
);

const mergeAccountLists = (base = [], extra = []) => {
  const map = new Map();
  [...base, ...extra].forEach((a) => {
    const code = String(a?.code || '').trim();
    const name = String(a?.name || '').trim();
    const key = code || name;
    if (!key) return;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...a, code, name: name || code });
      return;
    }
    map.set(key, {
      ...prev,
      ...a,
      code: prev.code || code,
      name: prev.name || name || code,
      currentAmount:
        a.currentAmount != null
          ? (Number(prev.currentAmount) || 0) + (Number(a.currentAmount) || 0)
          : prev.currentAmount,
      priorAmount:
        a.priorAmount != null
          ? (Number(prev.priorAmount) || 0) + (Number(a.priorAmount) || 0)
          : prev.priorAmount,
      currentSide: a.currentSide || prev.currentSide || '',
      priorSide: a.priorSide || prev.priorSide || ''
    });
  });
  return [...map.values()];
};

const ppeRowLabel = (section, { onViewAccounts, onRemove } = {}) => {
  const accounts =
    section.accounts?.length > 0
      ? section.accounts
      : [
          {
            code: String(section.accountCode || '').trim(),
            name: String(section.categoryName || '').trim(),
            currentAmount: Math.abs(Number(section.nbv?.current) || 0),
            currentSide: 'DR',
            priorAmount: Math.abs(Number(section.nbv?.prior) || 0),
            priorSide: 'DR'
          }
        ].filter((a) => a.code || a.name);
  const title = section.categoryName || section.accountCode || 'PPE category';

  return (
    <span className="frn-excel-label-inner">
      <span className="frn-excel-name">{section.categoryName}</span>
      <RowActions
        title={title}
        accounts={accounts}
        onViewAccounts={onViewAccounts}
        onRemove={onRemove}
        removeTitle="Remove this category from the note"
      />
    </span>
  );
};

const ExtraColumnHeads = ({
  columns = [],
  editMode = false,
  selectedColId = null,
  onSelectCol,
  onChangeColumnHeader
}) =>
  columns.map((col) => (
    <th
      key={col.id}
      className={`frn-sheet-th-num frn-sheet-th-extra${
        editMode && selectedColId === col.id ? ' is-edit-selected' : ''
      }`}
      onClick={
        editMode && typeof onSelectCol === 'function'
          ? (e) => {
              e.stopPropagation();
              onSelectCol(col.id);
            }
          : undefined
      }
    >
      {editMode && typeof onChangeColumnHeader === 'function' ? (
        <input
          type="text"
          className="frn-sheet-edit-input frn-sheet-edit-input--header"
          value={col.header || ''}
          placeholder="Column"
          onChange={(e) => onChangeColumnHeader(col.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="frn-sheet-period">{col.header || ''}</span>
          {col.header ? <span className="frn-sheet-unit">LKR</span> : null}
        </>
      )}
    </th>
  ));

const ExtraColumnCells = ({
  columns = [],
  rowKey,
  layoutEdit,
  editMode = false,
  selectedColId = null,
  onSelectCol,
  onChangeCell,
  formatCls = ''
}) =>
  columns.map((col) => {
    const value = getLayoutCell(layoutEdit, rowKey, col.id);
    return (
      <td
        key={col.id}
        className={`frn-sheet-num frn-sheet-extra-cell${
          editMode && selectedColId === col.id ? ' is-edit-selected' : ''
        }`}
        onClick={
          editMode && typeof onSelectCol === 'function'
            ? (e) => {
                e.stopPropagation();
                onSelectCol(col.id);
              }
            : undefined
        }
      >
        {editMode && typeof onChangeCell === 'function' ? (
          <input
            type="text"
            className={`frn-sheet-edit-input ${formatCls}`.trim()}
            value={value}
            onChange={(e) => onChangeCell(rowKey, col.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={formatCls}>{value || ''}</span>
        )}
      </td>
    );
  });

const EditableLabel = ({
  value,
  formatCls,
  editMode,
  onChange
}) => {
  if (editMode && typeof onChange === 'function') {
    return (
      <input
        type="text"
        className={`frn-sheet-edit-input frn-sheet-edit-input--label ${formatCls}`.trim()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return <span className={`frn-sheet-custom-label ${formatCls}`.trim()}>{value}</span>;
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
  removedAutoKeys = [],
  extraAccountsByKey = {},
  rowSignsByKey = {},
  layoutEdit = null,
  editMode = false,
  selectedRowKey = null,
  selectedColId = null,
  includeLayoutRows = true,
  onSelectRow,
  onSelectCol,
  onChangeRowLabel,
  onChangeCell,
  onChangeColumnHeader,
  onRemoveCustomRow,
  onRemoveAutoRow,
  onViewAccounts,
  onAddAccounts,
  onToggleRowSign
}) => {
  const removed = new Set(removedAutoKeys || []);
  const extraColumns = layoutEdit?.extraColumns || [];
  const colCount = 3 + extraColumns.length;
  const emptyExtraCells = () =>
    extraColumns.map((col) => <td key={col.id} className="frn-sheet-num" />);

  const autoRows = (rows || [])
    .filter((r) => !removed.has(r.label))
    .filter((r) => !isRowHidden(layoutEdit, autoRowKey(r.label)))
    .map((row) => {
      const extras = extraAccountsByKey[row.label];
      if (!extras) return row;
      return {
        ...row,
        current: (Number(row.current) || 0) + (Number(extras.current) || 0),
        prior: (Number(row.prior) || 0) + (Number(extras.prior) || 0),
        accounts: mergeAccountLists(row.accounts || [], extras.accountDetails || [])
      };
    });
  const userRows = (customRows || []).filter(
    (r) => !isRowHidden(layoutEdit, customRowKey(r.id))
  );
  const layoutAddedRows = includeLayoutRows
    ? (layoutEdit?.addedRows || []).filter((r) => !isRowHidden(layoutEdit, editRowKey(r.id)))
    : [];
  const hasAnyRows =
    autoRows.length > 0 || userRows.length > 0 || layoutAddedRows.length > 0;
  const autoTotal = autoRows.reduce(
    (s, r) => {
      const sign = getRowSign(rowSignsByKey, r.label);
      return {
        current: s.current + signedContribution(r.current, sign),
        prior: s.prior + signedContribution(r.prior, sign)
      };
    },
    { current: 0, prior: 0 }
  );
  const combinedTotal = totalsOnly
    ? {
        current: Number(total?.current) || 0,
        prior: Number(total?.prior) || 0
      }
    : {
        current:
          autoTotal.current +
          userRows.reduce((s, r) => {
            const sign = getRowSign(rowSignsByKey, customSignKey(r.id));
            return s + signedContribution(r.current, sign);
          }, 0),
        prior:
          autoTotal.prior +
          userRows.reduce((s, r) => {
            const sign = getRowSign(rowSignsByKey, customSignKey(r.id));
            return s + signedContribution(r.prior, sign);
          }, 0)
      };

  const accountsForCustom = (row) => {
    if (Array.isArray(row.accountDetails) && row.accountDetails.length) {
      return row.accountDetails;
    }
    const codes = row.accountCodes || [];
    const names = row.accountNames || [];
    if (!codes.length && names.length) {
      return names.map((name) => ({ code: '', name }));
    }
    return codes.map((code, i) => ({
      code,
      name: names[i] || code
    }));
  };

  const existingCodesFromAccounts = (accounts) =>
    (accounts || [])
      .map((a) => String(a.code || '').trim())
      .filter(Boolean);

  const selectRow = (rowKey) => {
    if (editMode && typeof onSelectRow === 'function') onSelectRow(rowKey);
  };

  const rowSelectedClass = (rowKey) =>
    editMode && selectedRowKey === rowKey ? ' is-edit-selected' : '';

  return (
    <div className={`frn-sheet-wrap${editMode ? ' is-edit-mode' : ''}`}>
      <table className="frn-sheet">
        {heading ? <caption className="frn-sheet-caption">{heading}</caption> : null}
        <colgroup>
          <col className="frn-sheet-col-label" />
          <col className="frn-sheet-col-num" />
          <col className="frn-sheet-col-num" />
          {extraColumns.map((col) => (
            <col key={col.id} className="frn-sheet-col-num" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="frn-sheet-th-label">Description</th>
            <PeriodHead period={periods.current} />
            <PeriodHead period={periods.prior} />
            <ExtraColumnHeads
              columns={extraColumns}
              editMode={editMode}
              selectedColId={selectedColId}
              onSelectCol={onSelectCol}
              onChangeColumnHeader={onChangeColumnHeader}
            />
          </tr>
        </thead>
        <tbody>
          {sectionLabel ? (
            <tr>
              <td className="frn-sheet-section">{sectionLabel}</td>
              <td className="frn-sheet-num" />
              <td className="frn-sheet-num" />
              {emptyExtraCells()}
            </tr>
          ) : null}
          {totalsOnly ? null : !hasAnyRows ? (
            <tr>
              <td colSpan={colCount} className="frn-sheet-empty">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            <>
              {autoRows.map((row) => {
                const accounts = row.accounts || [{ code: '', name: row.label }];
                const sign = getRowSign(rowSignsByKey, row.label);
                const rowKey = autoRowKey(row.label);
                const fmt = getRowFormat(layoutEdit, rowKey);
                const formatCls = formatClassName(fmt);
                const label = resolveRowLabel(layoutEdit, rowKey, row.label);
                return (
                  <tr
                    key={`auto-${row.label}`}
                    className={`frn-sheet-line${sign < 0 ? ' is-negative-contrib' : ''}${rowSelectedClass(
                      rowKey
                    )}`}
                    onClick={() => selectRow(rowKey)}
                  >
                    <td className="frn-sheet-label">
                      <EditableLabel
                        value={label}
                        formatCls={formatCls}
                        editMode={editMode}
                        onChange={
                          typeof onChangeRowLabel === 'function'
                            ? (next) => onChangeRowLabel(rowKey, next)
                            : undefined
                        }
                      />
                      {!editMode && accounts.length ? (
                        <span className="frn-sheet-custom-meta">
                          {accounts.length} account
                          {accounts.length === 1 ? '' : 's'}
                        </span>
                      ) : null}
                      {!editMode ? (
                        <RowActions
                          title={row.label}
                          accounts={accounts}
                          rowSign={sign}
                          onToggleRowSign={
                            typeof onToggleRowSign === 'function'
                              ? () => onToggleRowSign(row.label)
                              : undefined
                          }
                          onViewAccounts={onViewAccounts}
                          onAddAccounts={
                            typeof onAddAccounts === 'function'
                              ? () =>
                                  onAddAccounts({
                                    kind: 'auto',
                                    rowKey: row.label,
                                    title: row.label,
                                    existingCodes: existingCodesFromAccounts(accounts)
                                  })
                              : undefined
                          }
                          onRemove={
                            typeof onRemoveAutoRow === 'function'
                              ? () => onRemoveAutoRow(row.label)
                              : undefined
                          }
                          removeTitle="Remove this auto-generated line"
                        />
                      ) : null}
                    </td>
                    <td className="frn-sheet-num">
                      {formatSheetAmount(signedContribution(row.current, sign))}
                    </td>
                    <td className="frn-sheet-num">
                      {formatSheetAmount(signedContribution(row.prior, sign))}
                    </td>
                    <ExtraColumnCells
                      columns={extraColumns}
                      rowKey={rowKey}
                      layoutEdit={layoutEdit}
                      editMode={editMode}
                      selectedColId={selectedColId}
                      onSelectCol={onSelectCol}
                      onChangeCell={onChangeCell}
                      formatCls={formatCls}
                    />
                  </tr>
                );
              })}
              {userRows.map((row) => {
                const accounts = accountsForCustom(row);
                const signKey = customSignKey(row.id);
                const sign = getRowSign(rowSignsByKey, signKey);
                const rowKey = customRowKey(row.id);
                const fmt = getRowFormat(layoutEdit, rowKey);
                const formatCls = formatClassName(fmt);
                const label = resolveRowLabel(layoutEdit, rowKey, row.label);
                return (
                  <tr
                    key={`custom-${row.id}`}
                    className={`frn-sheet-line frn-sheet-line--custom${
                      sign < 0 ? ' is-negative-contrib' : ''
                    }${rowSelectedClass(rowKey)}`}
                    onClick={() => selectRow(rowKey)}
                  >
                    <td className="frn-sheet-label">
                      <EditableLabel
                        value={label}
                        formatCls={formatCls}
                        editMode={editMode}
                        onChange={
                          typeof onChangeRowLabel === 'function'
                            ? (next) => onChangeRowLabel(rowKey, next)
                            : undefined
                        }
                      />
                      {!editMode && accounts.length ? (
                        <span className="frn-sheet-custom-meta">
                          {accounts.length} account
                          {accounts.length === 1 ? '' : 's'}
                          {Math.abs(Number(row.current) || 0) < 0.005 &&
                          Math.abs(Number(row.prior) || 0) < 0.005
                            ? ' · no Combined TB amount for period'
                            : ''}
                        </span>
                      ) : null}
                      {!editMode ? (
                        <RowActions
                          title={row.label}
                          accounts={accounts}
                          rowSign={sign}
                          onToggleRowSign={
                            typeof onToggleRowSign === 'function'
                              ? () => onToggleRowSign(signKey)
                              : undefined
                          }
                          onViewAccounts={onViewAccounts}
                          onAddAccounts={
                            typeof onAddAccounts === 'function'
                              ? () =>
                                  onAddAccounts({
                                    kind: 'custom',
                                    rowKey: row.id,
                                    title: row.label,
                                    existingCodes: [
                                      ...new Set([
                                        ...(row.accountCodes || []),
                                        ...existingCodesFromAccounts(accounts)
                                      ])
                                    ]
                                  })
                              : undefined
                          }
                          onRemove={
                            typeof onRemoveCustomRow === 'function'
                              ? () => onRemoveCustomRow(row.id)
                              : undefined
                          }
                          removeTitle="Remove this description"
                        />
                      ) : null}
                    </td>
                    <td className="frn-sheet-num">
                      {formatSheetAmount(signedContribution(row.current, sign))}
                    </td>
                    <td className="frn-sheet-num">
                      {formatSheetAmount(signedContribution(row.prior, sign))}
                    </td>
                    <ExtraColumnCells
                      columns={extraColumns}
                      rowKey={rowKey}
                      layoutEdit={layoutEdit}
                      editMode={editMode}
                      selectedColId={selectedColId}
                      onSelectCol={onSelectCol}
                      onChangeCell={onChangeCell}
                      formatCls={formatCls}
                    />
                  </tr>
                );
              })}
              {layoutAddedRows.map((row) => {
                const rowKey = editRowKey(row.id);
                const fmt = getRowFormat(layoutEdit, rowKey) || row.format || 'normal';
                const formatCls = formatClassName(fmt);
                const label =
                  resolveRowLabel(layoutEdit, rowKey, row.label) || row.label || '';
                return (
                  <tr
                    key={`edit-${row.id}`}
                    className={`frn-sheet-line frn-sheet-line--edit${rowSelectedClass(rowKey)}`}
                    onClick={() => selectRow(rowKey)}
                  >
                    <td className="frn-sheet-label">
                      <EditableLabel
                        value={label}
                        formatCls={formatCls}
                        editMode={editMode}
                        onChange={
                          typeof onChangeRowLabel === 'function'
                            ? (next) => onChangeRowLabel(rowKey, next)
                            : undefined
                        }
                      />
                    </td>
                    <td className="frn-sheet-num" />
                    <td className="frn-sheet-num" />
                    <ExtraColumnCells
                      columns={extraColumns}
                      rowKey={rowKey}
                      layoutEdit={layoutEdit}
                      editMode={editMode}
                      selectedColId={selectedColId}
                      onSelectCol={onSelectCol}
                      onChangeCell={onChangeCell}
                      formatCls={formatCls}
                    />
                  </tr>
                );
              })}
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
            {emptyExtraCells()}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const NoteAccountsModal = ({ open, title, accounts, periods, onClose }) => {
  if (!open) return null;
  const list = accounts || [];
  const currentLabel = periods?.current?.label
    ? `As at ${periods.current.label}`
    : periods?.current?.shortLabel || 'Current period';
  const priorLabel = periods?.prior?.label
    ? `As at ${periods.prior.label}`
    : periods?.prior?.shortLabel || 'Comparative period';
  const showPrior = list.some((acc) => acc.priorAmount != null);

  const formatBalance = (amount, side) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || Math.abs(n) < 0.005) return '—';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(n));
    return side ? `${formatted} ${side}` : formatted;
  };

  return (
    <div className="frn-accounts-overlay" role="presentation" onClick={onClose}>
      <div
        className="frn-accounts-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Linked accounts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="frn-accounts-modal-head">
          <div>
            <p className="frn-accounts-modal-eyebrow">Linked accounts</p>
            <h3 className="frn-accounts-modal-title">{title || 'Description'}</h3>
          </div>
          <button type="button" className="frn-accounts-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="frn-accounts-modal-body">
          {list.length === 0 ? (
            <p className="frn-accounts-empty">No account details available for this line.</p>
          ) : (
            <div className="frn-accounts-table-wrap">
              <table className="frn-accounts-table">
                <thead>
                  <tr>
                    <th className="frn-accounts-th-account">Account</th>
                    <th className="frn-accounts-th-amount">{currentLabel}</th>
                    {showPrior ? (
                      <th className="frn-accounts-th-amount">{priorLabel}</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {list.map((acc, idx) => {
                    const currentAmt =
                      acc.currentAmount != null ? acc.currentAmount : acc.amount;
                    const currentSide = acc.currentSide || acc.side || '';
                    const priorAmt = acc.priorAmount;
                    const priorSide = acc.priorSide || '';
                    return (
                      <tr key={`${acc.code || acc.name}-${idx}`}>
                        <td className="frn-accounts-td-account">
                          {acc.code ? (
                            <span className="frn-accounts-code">{acc.code}</span>
                          ) : null}
                          <span className="frn-accounts-name">
                            {acc.name || acc.code || '—'}
                          </span>
                          {acc.currentCost != null || acc.priorCost != null ? (
                            <span className="frn-accounts-balance-meta">
                              Cost · {formatBalance(acc.currentCost, '')}
                              {acc.priorCost != null
                                ? ` / ${formatBalance(acc.priorCost, '')}`
                                : ''}
                            </span>
                          ) : null}
                        </td>
                        <td
                          className={`frn-accounts-td-amount${
                            currentSide === 'CR'
                              ? ' is-credit'
                              : currentSide === 'DR'
                                ? ' is-debit'
                                : ''
                          }`}
                        >
                          {formatBalance(currentAmt, currentSide)}
                        </td>
                        {showPrior ? (
                          <td
                            className={`frn-accounts-td-amount${
                              priorSide === 'CR'
                                ? ' is-credit'
                                : priorSide === 'DR'
                                  ? ' is-debit'
                                  : ''
                            }`}
                          >
                            {formatBalance(priorAmt, priorSide)}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PpeNote = ({
  periods,
  sections,
  footnote75,
  removedAutoKeys = [],
  onRemoveAutoRow,
  onViewAccounts
}) => {
  const removed = new Set(removedAutoKeys || []);
  const visibleSections = (sections || []).filter(
    (s) => !removed.has(ppeSectionKey(s))
  );

  const openingHeader = `Balance As At ${periods.fyStartLabel || periods.prior.longLabel || periods.prior.label} (LKR)`;
  const closingHeader = `Balance As At ${periods.closingLabel || periods.current.longLabel || periods.current.label} (LKR)`;
  const nbvCurrentHeader = `${periods.current.shortLabel || periods.current.label} (LKR)`;
  const nbvPriorHeader = `${periods.prior.shortLabel || periods.prior.year} (LKR)`;

  const costTotals = {
    opening: visibleSections.reduce((s, r) => s + (Number(r.cost?.opening) || 0), 0),
    additions: visibleSections.reduce((s, r) => s + (Number(r.cost?.additions) || 0), 0),
    disposals: visibleSections.reduce((s, r) => s + (Number(r.cost?.disposals) || 0), 0),
    closing: visibleSections.reduce((s, r) => s + (Number(r.cost?.closing) || 0), 0)
  };
  const depTotals = {
    opening: visibleSections.reduce((s, r) => s + (Number(r.depreciation?.opening) || 0), 0),
    charge: visibleSections.reduce((s, r) => s + (Number(r.depreciation?.charge) || 0), 0),
    disposals: visibleSections.reduce((s, r) => s + (Number(r.depreciation?.disposals) || 0), 0),
    closing: visibleSections.reduce((s, r) => s + (Number(r.depreciation?.closing) || 0), 0)
  };
  const nbvTotals = {
    current: visibleSections.reduce((s, r) => s + (Number(r.nbv?.current) || 0), 0),
    prior: visibleSections.reduce((s, r) => s + (Number(r.nbv?.prior) || 0), 0)
  };

  const sectionActions = (s) => ({
    onViewAccounts,
    onRemove:
      typeof onRemoveAutoRow === 'function'
        ? () => onRemoveAutoRow(ppeSectionKey(s))
        : undefined
  });

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
          {visibleSections.length === 0 ? (
            <tr>
              <td colSpan={5} className="frn-excel-empty">
                No PPE categories configured. Add categories under Fixed Assets.
              </td>
            </tr>
          ) : (
            visibleSections.map((s) => (
              <tr key={`cost-${ppeSectionKey(s)}`}>
                <td className="frn-excel-label-cell">{ppeRowLabel(s, sectionActions(s))}</td>
                <td className="frn-excel-num">{dash(s.cost.opening)}</td>
                <td className="frn-excel-num">{dash(s.cost.additions)}</td>
                <td className="frn-excel-num">{dash(s.cost.disposals)}</td>
                <td className="frn-excel-num">{dash(s.cost.closing)}</td>
              </tr>
            ))
          )}
          {visibleSections.length > 0 ? (
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
          {visibleSections.map((s) => (
            <tr key={`dep-${ppeSectionKey(s)}`}>
              <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.opening)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.charge)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.disposals)}</td>
              <td className="frn-excel-num">{dash(s.depreciation.closing)}</td>
            </tr>
          ))}
          {visibleSections.length > 0 ? (
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
          {visibleSections.map((s) => (
            <tr key={`nbv-${ppeSectionKey(s)}`}>
              <td className="frn-excel-label-cell">{ppeRowLabel(s)}</td>
              <td className="frn-excel-num">{dash(s.nbv.current)}</td>
              <td className="frn-excel-num">{dash(s.nbv.prior)}</td>
              <td />
              <td />
            </tr>
          ))}
          {visibleSections.length > 0 ? (
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
          {visibleSections
            .filter((s) => s.usefulLifeYears)
            .map((s) => (
              <tr key={`life-${ppeSectionKey(s)}`}>
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

const CashNote = ({
  periods,
  rows,
  customRows = [],
  removedAutoKeys = [],
  extraAccountsByKey = {},
  rowSignsByKey = {},
  layoutEdit = null,
  editMode = false,
  selectedRowKey = null,
  selectedColId = null,
  onSelectRow,
  onSelectCol,
  onChangeRowLabel,
  onChangeCell,
  onChangeColumnHeader,
  onRemoveCustomRow,
  onRemoveAutoRow,
  onViewAccounts,
  onAddAccounts,
  onToggleRowSign
}) => {
  const removed = new Set(removedAutoKeys || []);
  const visibleRows = (rows || []).filter((r) => !removed.has(r.label));
  const favorable = visibleRows.filter((r) => !normalizeCashNegative(r.label));
  const unfavorable = visibleRows.filter((r) => normalizeCashNegative(r.label));

  const sumRows = (list, key) =>
    list.reduce((s, r) => {
      const extras = extraAccountsByKey[r.label];
      const raw = (Number(r[key]) || 0) + (Number(extras?.[key]) || 0);
      const sign = getRowSign(rowSignsByKey, r.label);
      return s + signedContribution(raw, sign);
    }, 0);

  const favTotal = {
    current: sumRows(favorable, 'current'),
    prior: sumRows(favorable, 'prior')
  };
  const unfavTotal = {
    current: sumRows(unfavorable, 'current'),
    prior: sumRows(unfavorable, 'prior')
  };
  const customTotal = {
    current: (customRows || []).reduce((s, r) => {
      const sign = getRowSign(rowSignsByKey, customSignKey(r.id));
      return s + signedContribution(r.current, sign);
    }, 0),
    prior: (customRows || []).reduce((s, r) => {
      const sign = getRowSign(rowSignsByKey, customSignKey(r.id));
      return s + signedContribution(r.prior, sign);
    }, 0)
  };
  const netTotal = {
    current: favTotal.current - unfavTotal.current + customTotal.current,
    prior: favTotal.prior - unfavTotal.prior + customTotal.prior
  };

  const shared = {
    removedAutoKeys,
    extraAccountsByKey,
    rowSignsByKey,
    layoutEdit,
    editMode,
    selectedRowKey,
    selectedColId,
    onSelectRow,
    onSelectCol,
    onChangeRowLabel,
    onChangeCell,
    onChangeColumnHeader,
    onRemoveAutoRow,
    onViewAccounts,
    onAddAccounts,
    onToggleRowSign
  };

  const renderBlock = (title, list, blockTotal, includeLayoutRows = false) => (
    <ComparativeTable
      periods={periods}
      rows={list}
      total={blockTotal}
      heading={title}
      emptyLabel="-"
      includeLayoutRows={includeLayoutRows}
      {...shared}
    />
  );

  return (
    <>
      {renderBlock('12.1 Favourable balance', favorable, favTotal, true)}
      {unfavorable.length > 0
        ? renderBlock('12.2 Unfavourable balance', unfavorable, unfavTotal)
        : null}
      {customRows.length > 0 ? (
        <ComparativeTable
          periods={periods}
          rows={[]}
          total={customTotal}
          heading="User descriptions"
          customRows={customRows}
          rowSignsByKey={rowSignsByKey}
          layoutEdit={layoutEdit}
          editMode={editMode}
          selectedRowKey={selectedRowKey}
          selectedColId={selectedColId}
          includeLayoutRows={false}
          onSelectRow={onSelectRow}
          onSelectCol={onSelectCol}
          onChangeRowLabel={onChangeRowLabel}
          onChangeCell={onChangeCell}
          onChangeColumnHeader={onChangeColumnHeader}
          onRemoveCustomRow={onRemoveCustomRow}
          onViewAccounts={onViewAccounts}
          onAddAccounts={onAddAccounts}
          onToggleRowSign={onToggleRowSign}
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

const IncomeTaxNote = ({
  periods,
  rows = [],
  customRows = [],
  removedAutoKeys = [],
  extraAccountsByKey = {},
  rowSignsByKey = {},
  layoutEdit = null,
  editMode = false,
  selectedRowKey = null,
  selectedColId = null,
  onSelectRow,
  onSelectCol,
  onChangeRowLabel,
  onChangeCell,
  onChangeColumnHeader,
  onRemoveCustomRow,
  onRemoveAutoRow,
  onViewAccounts,
  onAddAccounts,
  onToggleRowSign
}) => {
  const removed = new Set(removedAutoKeys || []);
  const extraColumns = layoutEdit?.extraColumns || [];
  const colCount = 3 + extraColumns.length;
  const emptyExtraCells = () =>
    extraColumns.map((col) => <td key={col.id} className="frn-sheet-num" />);
  const existingCodesFromAccounts = (accounts) =>
    (accounts || [])
      .map((a) => String(a.code || '').trim())
      .filter(Boolean);

  const visibleRows = (rows || [])
    .filter((r) => {
      if (r.type === 'heading' || r.type === 'section') return true;
      const key = r.id || r.label;
      if (removed.has(key)) return false;
      return !isRowHidden(layoutEdit, autoRowKey(key));
    })
    .map((row) => {
      if (row.type === 'heading' || row.type === 'section') return row;
      const key = row.id || row.label;
      const extras = extraAccountsByKey[key];
      if (!extras) return row;
      return {
        ...row,
        current: (Number(row.current) || 0) + (Number(extras.current) || 0),
        prior: (Number(row.prior) || 0) + (Number(extras.prior) || 0),
        accounts: mergeAccountLists(row.accounts || [], extras.accountDetails || [])
      };
    });

  const summaryRows = visibleRows.filter((r) => r.block !== 'reconciliation');
  const reconRows = visibleRows.filter((r) => r.block === 'reconciliation');
  const layoutAddedRows = (layoutEdit?.addedRows || []).filter(
    (r) => !isRowHidden(layoutEdit, editRowKey(r.id))
  );

  const selectRow = (rowKey) => {
    if (editMode && typeof onSelectRow === 'function') onSelectRow(rowKey);
  };

  const rowSelectedClass = (rowKey) =>
    editMode && selectedRowKey === rowKey ? ' is-edit-selected' : '';

  const renderStructuredRows = (list) =>
    list.map((row) => {
      const key = row.id || row.label;
      const type = row.type || 'line';
      const layoutKey = autoRowKey(key);

      if (type === 'heading') {
        return (
          <tr key={key} className="frn-sheet-heading-row">
            <td colSpan={colCount} className="frn-sheet-heading-cell">
              {row.label}
            </td>
          </tr>
        );
      }

      if (type === 'section') {
        return (
          <tr key={key} className="frn-sheet-section-row">
            <td className="frn-sheet-section">{row.label}</td>
            <td className="frn-sheet-num" />
            <td className="frn-sheet-num" />
            {emptyExtraCells()}
          </tr>
        );
      }

      const accounts = row.accounts || [];
      const sign = getRowSign(rowSignsByKey, key);
      const isTotalish = type === 'total' || type === 'subtotal';
      const indentClass = row.indent ? ` is-indent-${Math.min(Number(row.indent) || 0, 2)}` : '';
      const fmt = getRowFormat(layoutEdit, layoutKey);
      const formatCls = formatClassName(fmt);
      const label = resolveRowLabel(layoutEdit, layoutKey, row.label);

      return (
        <tr
          key={key}
          className={`frn-sheet-line${isTotalish ? ' frn-sheet-total-line' : ''}${
            sign < 0 ? ' is-negative-contrib' : ''
          }${rowSelectedClass(layoutKey)}`}
          onClick={() => selectRow(layoutKey)}
        >
          <td className={`frn-sheet-label${indentClass}`}>
            <EditableLabel
              value={label}
              formatCls={formatCls}
              editMode={editMode}
              onChange={
                typeof onChangeRowLabel === 'function'
                  ? (next) => onChangeRowLabel(layoutKey, next)
                  : undefined
              }
            />
            {!editMode && accounts.length ? (
              <span className="frn-sheet-custom-meta">
                {accounts.length} account
                {accounts.length === 1 ? '' : 's'}
              </span>
            ) : null}
            {!editMode ? (
              <RowActions
                title={row.label}
                accounts={accounts}
                rowSign={sign}
                onToggleRowSign={
                  typeof onToggleRowSign === 'function' ? () => onToggleRowSign(key) : undefined
                }
                onViewAccounts={onViewAccounts}
                onAddAccounts={
                  typeof onAddAccounts === 'function'
                    ? () =>
                        onAddAccounts({
                          kind: 'auto',
                          rowKey: key,
                          title: row.label,
                          existingCodes: existingCodesFromAccounts(accounts)
                        })
                    : undefined
                }
                onRemove={
                  typeof onRemoveAutoRow === 'function' ? () => onRemoveAutoRow(key) : undefined
                }
                removeTitle="Remove this line"
              />
            ) : null}
          </td>
          <td className="frn-sheet-num">
            {formatSheetAmount(signedContribution(row.current, sign))}
          </td>
          <td className="frn-sheet-num">
            {formatSheetAmount(signedContribution(row.prior, sign))}
          </td>
          <ExtraColumnCells
            columns={extraColumns}
            rowKey={layoutKey}
            layoutEdit={layoutEdit}
            editMode={editMode}
            selectedColId={selectedColId}
            onSelectCol={onSelectCol}
            onChangeCell={onChangeCell}
            formatCls={formatCls}
          />
        </tr>
      );
    });

  const renderLayoutAddedRows = () =>
    layoutAddedRows.map((row) => {
      const rowKey = editRowKey(row.id);
      const fmt = getRowFormat(layoutEdit, rowKey) || row.format || 'normal';
      const formatCls = formatClassName(fmt);
      const label = resolveRowLabel(layoutEdit, rowKey, row.label) || row.label || '';
      return (
        <tr
          key={`edit-${row.id}`}
          className={`frn-sheet-line frn-sheet-line--edit${rowSelectedClass(rowKey)}`}
          onClick={() => selectRow(rowKey)}
        >
          <td className="frn-sheet-label">
            <EditableLabel
              value={label}
              formatCls={formatCls}
              editMode={editMode}
              onChange={
                typeof onChangeRowLabel === 'function'
                  ? (next) => onChangeRowLabel(rowKey, next)
                  : undefined
              }
            />
          </td>
          <td className="frn-sheet-num" />
          <td className="frn-sheet-num" />
          <ExtraColumnCells
            columns={extraColumns}
            rowKey={rowKey}
            layoutEdit={layoutEdit}
            editMode={editMode}
            selectedColId={selectedColId}
            onSelectCol={onSelectCol}
            onChangeCell={onChangeCell}
            formatCls={formatCls}
          />
        </tr>
      );
    });

  const sheetTable = (bodyRows, wrapClass = '', includeAddedRows = false) => (
    <div className={`frn-sheet-wrap${editMode ? ' is-edit-mode' : ''}${wrapClass}`}>
      <table className="frn-sheet">
        <colgroup>
          <col className="frn-sheet-col-label" />
          <col className="frn-sheet-col-num" />
          <col className="frn-sheet-col-num" />
          {extraColumns.map((col) => (
            <col key={col.id} className="frn-sheet-col-num" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="frn-sheet-th-label">Description</th>
            <PeriodHead period={periods.current} />
            <PeriodHead period={periods.prior} />
            <ExtraColumnHeads
              columns={extraColumns}
              editMode={editMode}
              selectedColId={selectedColId}
              onSelectCol={onSelectCol}
              onChangeColumnHeader={onChangeColumnHeader}
            />
          </tr>
        </thead>
        <tbody>
          {bodyRows}
          {includeAddedRows ? renderLayoutAddedRows() : null}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {sheetTable(renderStructuredRows(summaryRows), '', true)}

      {reconRows.length ? sheetTable(renderStructuredRows(reconRows), ' frn-sheet-wrap--recon') : null}

      {customRows.length > 0 ? (
        <ComparativeTable
          periods={periods}
          rows={[]}
          total={{ current: 0, prior: 0 }}
          heading="User descriptions"
          customRows={customRows}
          rowSignsByKey={rowSignsByKey}
          layoutEdit={layoutEdit}
          editMode={editMode}
          selectedRowKey={selectedRowKey}
          selectedColId={selectedColId}
          includeLayoutRows={false}
          onSelectRow={onSelectRow}
          onSelectCol={onSelectCol}
          onChangeRowLabel={onChangeRowLabel}
          onChangeCell={onChangeCell}
          onChangeColumnHeader={onChangeColumnHeader}
          onRemoveCustomRow={onRemoveCustomRow}
          onViewAccounts={onViewAccounts}
          onAddAccounts={onAddAccounts}
          onToggleRowSign={onToggleRowSign}
        />
      ) : null}
    </>
  );
};

const FvtplEquityNote = ({
  periods,
  equityRows,
  removedAutoKeys = [],
  onRemoveAutoRow,
  onViewAccounts
}) => {
  const currentPeriod = periods.current.shortLabel || periods.current.label;
  const priorPeriod = periods.prior.shortLabel || periods.prior.label;
  const removed = new Set(removedAutoKeys || []);
  const rows = (equityRows || []).filter((r) => !removed.has(r.label));
  const totals = rows.reduce(
    (s, r) => ({
      currentCost: s.currentCost + (Number(r.currentCost) || 0),
      currentMv: s.currentMv + (Number(r.currentMv) || 0),
      priorCost: s.priorCost + (Number(r.priorCost) || 0),
      priorMv: s.priorMv + (Number(r.priorMv) || 0)
    }),
    { currentCost: 0, currentMv: 0, priorCost: 0, priorMv: 0 }
  );

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
                  <td className="frn-sheet-label">
                    <span className="frn-sheet-custom-label">{row.label}</span>
                    <RowActions
                      title={row.label}
                      accounts={row.accounts || [{ code: '', name: row.label }]}
                      onViewAccounts={onViewAccounts}
                      onRemove={
                        typeof onRemoveAutoRow === 'function'
                          ? () => onRemoveAutoRow(row.label)
                          : undefined
                      }
                      removeTitle="Remove this auto-generated line"
                    />
                  </td>
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
  removedAutoKeys = [],
  extraAccountsByKey = {},
  rowSignsByKey = {},
  layoutEdit = null,
  editMode = false,
  selectedRowKey = null,
  selectedColId = null,
  onSelectRow,
  onSelectCol,
  onChangeRowLabel,
  onChangeCell,
  onChangeColumnHeader,
  onRemoveCustomRow,
  onRemoveAutoRow,
  onAddAccounts,
  onToggleRowSign,
  onRetry
}) => {
  const [accountsModal, setAccountsModal] = useState(null);

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
    footnote75,
    equityRows
  } = data;
  const noteTitle = `${note.number}. ${note.title.toUpperCase()}`;
  const showCustomUnderSchedule =
    (template === 'ppe' || template === 'fvtplEquity') && customRows.length > 0;

  const sharedRowProps = {
    customRows,
    removedAutoKeys,
    extraAccountsByKey,
    rowSignsByKey,
    layoutEdit,
    editMode,
    selectedRowKey,
    selectedColId,
    onSelectRow,
    onSelectCol,
    onChangeRowLabel,
    onChangeCell,
    onChangeColumnHeader,
    onRemoveCustomRow,
    onRemoveAutoRow,
    onAddAccounts,
    onToggleRowSign,
    onViewAccounts: (payload) => setAccountsModal({ ...payload, periods })
  };

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
            footnote75={footnote75}
            removedAutoKeys={removedAutoKeys}
            onRemoveAutoRow={onRemoveAutoRow}
            onViewAccounts={(payload) => setAccountsModal({ ...payload, periods })}
          />
        ) : template === 'fvtplEquity' ? (
          <FvtplEquityNote
            periods={periods}
            equityRows={equityRows}
            removedAutoKeys={removedAutoKeys}
            onRemoveAutoRow={onRemoveAutoRow}
            onViewAccounts={(payload) => setAccountsModal({ ...payload, periods })}
          />
        ) : template === 'cash' ? (
          <CashNote periods={periods} rows={rows || []} {...sharedRowProps} />
        ) : template === 'incomeTax' ? (
          <IncomeTaxNote periods={periods} rows={rows || []} {...sharedRowProps} />
        ) : template === 'statedCapital' ? (
          <ComparativeTable
            periods={periods}
            rows={rows || []}
            total={total}
            heading=""
            sectionLabel="Ordinary shares"
            {...sharedRowProps}
          />
        ) : (
          <ComparativeTable
            periods={periods}
            rows={rows || []}
            total={total}
            heading=""
            {...sharedRowProps}
          />
        )}
        {showCustomUnderSchedule ? (
          <ComparativeTable
            periods={periods}
            rows={[]}
            total={{ current: 0, prior: 0 }}
            heading="User descriptions"
            customRows={customRows}
            rowSignsByKey={rowSignsByKey}
            layoutEdit={layoutEdit}
            editMode={editMode}
            selectedRowKey={selectedRowKey}
            selectedColId={selectedColId}
            onSelectRow={onSelectRow}
            onSelectCol={onSelectCol}
            onChangeRowLabel={onChangeRowLabel}
            onChangeCell={onChangeCell}
            onChangeColumnHeader={onChangeColumnHeader}
            onRemoveCustomRow={onRemoveCustomRow}
            onAddAccounts={onAddAccounts}
            onToggleRowSign={onToggleRowSign}
            onViewAccounts={(payload) => setAccountsModal({ ...payload, periods })}
            emptyLabel=""
          />
        ) : null}
      </div>
      <NoteAccountsModal
        open={Boolean(accountsModal)}
        title={accountsModal?.title}
        accounts={accountsModal?.accounts}
        periods={accountsModal?.periods || periods}
        onClose={() => setAccountsModal(null)}
      />
    </section>
  );
};

export default DisclosureNoteView;
