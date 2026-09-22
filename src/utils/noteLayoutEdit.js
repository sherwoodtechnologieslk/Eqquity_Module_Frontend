/** Session-only note layout edits (rows/columns/text style). Not persisted. */

export const emptyNoteLayout = () => ({
  extraColumns: [],
  addedRows: [],
  hiddenRowKeys: [],
  formats: {},
  labelOverrides: {},
  cells: {}
});

export const cloneNoteLayout = (layout) => {
  const base = layout && typeof layout === 'object' ? layout : emptyNoteLayout();
  return {
    extraColumns: Array.isArray(base.extraColumns)
      ? base.extraColumns.map((c) => ({ ...c }))
      : [],
    addedRows: Array.isArray(base.addedRows)
      ? base.addedRows.map((r) => ({
          ...r,
          cells: r.cells && typeof r.cells === 'object' ? { ...r.cells } : {}
        }))
      : [],
    hiddenRowKeys: Array.isArray(base.hiddenRowKeys) ? [...base.hiddenRowKeys] : [],
    formats: base.formats && typeof base.formats === 'object' ? { ...base.formats } : {},
    labelOverrides:
      base.labelOverrides && typeof base.labelOverrides === 'object'
        ? { ...base.labelOverrides }
        : {},
    cells: Object.fromEntries(
      Object.entries(base.cells && typeof base.cells === 'object' ? base.cells : {}).map(
        ([rowKey, cols]) => [
          rowKey,
          cols && typeof cols === 'object' ? { ...cols } : {}
        ]
      )
    )
  };
};

export const newEditRowId = () =>
  `edit-row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const newEditColId = () =>
  `edit-col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getRowFormat = (layout, rowKey) => {
  const fmt = layout?.formats?.[rowKey];
  return fmt === 'bold' || fmt === 'italic' ? fmt : 'normal';
};

export const formatClassName = (fmt) => {
  if (fmt === 'bold') return 'frn-sheet-fmt-bold';
  if (fmt === 'italic') return 'frn-sheet-fmt-italic';
  return 'frn-sheet-fmt-normal';
};

export const resolveRowLabel = (layout, rowKey, fallback) => {
  const override = layout?.labelOverrides?.[rowKey];
  if (typeof override === 'string') return override;
  return fallback;
};

export const getLayoutCell = (layout, rowKey, colId) => {
  const value = layout?.cells?.[rowKey]?.[colId];
  return typeof value === 'string' ? value : '';
};

export const isRowHidden = (layout, rowKey) =>
  Boolean(layout?.hiddenRowKeys?.includes(rowKey));

export const autoRowKey = (label) => `auto:${label}`;
export const customRowKey = (id) => `custom:${id}`;
export const editRowKey = (id) => `edit:${id}`;
