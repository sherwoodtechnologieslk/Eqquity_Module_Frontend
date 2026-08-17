import React, { useEffect, useMemo, useState } from 'react';
import './Styles/FixedAssets.css';
import {
  listAssets,
  listCategories,
  findCategoryById,
  deleteAsset,
  computeAssetSnapshot
} from './fixedAssetStore';

const formatAmount = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const formatDate = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

const todayYmd = () => new Date().toISOString().split('T')[0];

const STATUS_LABELS = {
  ACTIVE: 'Active',
  DISPOSED: 'Disposed',
  FULLY_DEPRECIATED: 'Fully depreciated',
  DRAFT: 'Draft'
};

const STATUS_BADGE_CLASS = {
  ACTIVE: 'fa-status-badge fa-status-active',
  DISPOSED: 'fa-status-badge fa-status-disposed',
  FULLY_DEPRECIATED: 'fa-status-badge fa-status-fully-dep',
  DRAFT: 'fa-status-badge fa-status-draft'
};

const AssetRegister = ({ onTabChange }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: '',
    status: '',
    asOfDate: todayYmd(),
    search: ''
  });
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  const refresh = () => {
    setAssets(listAssets());
    setCategories(listCategories());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
  };

  const enriched = useMemo(() => {
    return assets.map((a) => {
      const cat = categories.find((c) => c.id === a.categoryId) || null;
      const snap = computeAssetSnapshot(a, cat, filters.asOfDate);
      const derivedStatus =
        a.status === 'DISPOSED'
          ? 'DISPOSED'
          : snap.wdv <= 0.005
            ? 'FULLY_DEPRECIATED'
            : 'ACTIVE';
      return {
        ...a,
        categoryName: cat?.name || '-',
        categoryRate: cat?.rate || 0,
        cost: snap.cost,
        accumulated: snap.accumulated,
        wdv: snap.wdv,
        derivedStatus
      };
    });
  }, [assets, categories, filters.asOfDate]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return enriched.filter((row) => {
      if (filters.categoryId && row.categoryId !== filters.categoryId) return false;
      if (filters.status && row.derivedStatus !== filters.status) return false;
      if (
        q &&
        ![row.assetCode, row.name, row.description, row.serialNumber]
          .map((v) => String(v || '').toLowerCase())
          .some((v) => v.includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [enriched, filters]);

  const summary = useMemo(() => {
    const totalCost = filtered.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    const totalAccDep = filtered.reduce((s, r) => s + (Number(r.accumulated) || 0), 0);
    const totalWdv = filtered.reduce((s, r) => s + (Number(r.wdv) || 0), 0);
    const activeCount = filtered.filter((r) => r.derivedStatus === 'ACTIVE').length;
    const fullyDepCount = filtered.filter((r) => r.derivedStatus === 'FULLY_DEPRECIATED')
      .length;
    return { totalCost, totalAccDep, totalWdv, activeCount, fullyDepCount };
  }, [filtered]);

  const selectedAsset = useMemo(
    () => enriched.find((a) => a.id === selectedAssetId) || null,
    [enriched, selectedAssetId]
  );

  const selectedCategory = selectedAsset
    ? findCategoryById(selectedAsset.categoryId)
    : null;
  const selectedSchedule = useMemo(
    () => (selectedAsset ? computeAssetSnapshot(selectedAsset, selectedCategory, filters.asOfDate) : null),
    [selectedAsset, selectedCategory, filters.asOfDate]
  );

  const handleDelete = (asset) => {
    if (
      !window.confirm(
        `Delete asset "${asset.name}" (${asset.assetCode})? In a live system you would dispose, not delete.`
      )
    ) {
      return;
    }
    deleteAsset(asset.id);
    if (asset.id === selectedAssetId) setSelectedAssetId(null);
    refresh();
  };

  const exportCsv = () => {
    const headers = [
      'Asset code',
      'Name',
      'Category',
      'Purchase date',
      'Cost',
      'Accumulated depreciation',
      'WDV',
      'Status'
    ];
    const lines = [headers.join(',')];
    filtered.forEach((row) => {
      lines.push(
        [
          row.assetCode,
          row.name,
          row.categoryName,
          formatDate(row.purchaseDate),
          formatAmount(row.cost),
          formatAmount(row.accumulated),
          formatAmount(row.wdv),
          STATUS_LABELS[row.derivedStatus] || row.derivedStatus
        ]
          .map((cell) => {
            const s = String(cell ?? '');
            return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      );
    });
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixed_assets_${filters.asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fa-container">
      <div className="fa-wrapper">
        <header className="fa-header">
          <div className="fa-header-left">
            <p className="fa-eyebrow">Accounting · Fixed assets</p>
            <h1 className="fa-title">Asset Register</h1>
            <span className="fa-subtitle">
              Cost, accumulated depreciation and written-down value (WDV) as of the
              selected date.
            </span>
          </div>
          <div className="fa-header-right">
            <button
              type="button"
              className="fa-btn fa-btn-primary"
              onClick={() => onTabChange?.('Add Asset')}
            >
              + Add asset
            </button>
            <button type="button" className="fa-btn fa-btn-excel" onClick={exportCsv}>
              Export CSV
            </button>
            <button
              type="button"
              className="fa-btn"
              onClick={() => onTabChange?.('Asset Categories')}
            >
              Categories
            </button>
          </div>
        </header>

        <div className="fa-summary">
          <div className="fa-card">
            <div className="fa-card-label">Total cost</div>
            <div className="fa-card-value">{formatAmount(summary.totalCost)}</div>
            <div className="fa-card-sub">{filtered.length} asset(s)</div>
          </div>
          <div className="fa-card fa-card-amber">
            <div className="fa-card-label">Accumulated depreciation</div>
            <div className="fa-card-value">{formatAmount(summary.totalAccDep)}</div>
            <div className="fa-card-sub">As of {formatDate(filters.asOfDate)}</div>
          </div>
          <div className="fa-card fa-card-green">
            <div className="fa-card-label">Net book value (WDV)</div>
            <div className="fa-card-value">{formatAmount(summary.totalWdv)}</div>
            <div className="fa-card-sub">Cost − Accumulated depreciation</div>
          </div>
          <div className="fa-card fa-card-slate">
            <div className="fa-card-label">Active / Fully depreciated</div>
            <div className="fa-card-value">
              {summary.activeCount} / {summary.fullyDepCount}
            </div>
            <div className="fa-card-sub">In current filter</div>
          </div>
        </div>

        <div className="fa-filters">
          <div className="fa-filter-group">
            <label className="fa-filter-label">As of date</label>
            <input
              type="date"
              className="fa-input"
              value={filters.asOfDate}
              onChange={(e) => handleFilterChange('asOfDate', e.target.value)}
            />
          </div>
          <div className="fa-filter-group">
            <label className="fa-filter-label">Category</label>
            <select
              className="fa-select"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fa-filter-group">
            <label className="fa-filter-label">Status</label>
            <select
              className="fa-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="FULLY_DEPRECIATED">Fully depreciated</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>
          <div className="fa-filter-group fa-filter-group--search">
            <label className="fa-filter-label">Search</label>
            <input
              className="fa-input"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Asset code, name, description, serial number…"
            />
          </div>
        </div>

        <div className="fa-table-wrap">
          <table className="fa-table">
            <thead>
              <tr>
                <th>Asset code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Purchase date</th>
                <th className="fa-table-num">Cost</th>
                <th className="fa-table-num">Acc. dep</th>
                <th className="fa-table-num">WDV</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="fa-empty">
                    No assets match the current filter.
                    <div className="fa-empty-actions">
                      <button
                        type="button"
                        className="fa-btn fa-btn-primary"
                        onClick={() => onTabChange?.('Add Asset')}
                      >
                        Add the first asset
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.assetCode}</strong>
                    </td>
                    <td>
                      <div>{row.name}</div>
                      {row.description ? (
                        <div className="fa-card-sub">{row.description}</div>
                      ) : null}
                    </td>
                    <td>{row.categoryName}</td>
                    <td>{formatDate(row.purchaseDate)}</td>
                    <td className="fa-table-num">{formatAmount(row.cost)}</td>
                    <td className="fa-table-num">{formatAmount(row.accumulated)}</td>
                    <td className="fa-table-num">
                      <strong>{formatAmount(row.wdv)}</strong>
                    </td>
                    <td>
                      <span className={STATUS_BADGE_CLASS[row.derivedStatus]}>
                        {STATUS_LABELS[row.derivedStatus]}
                      </span>
                    </td>
                    <td className="fa-table-actions">
                      <button
                        type="button"
                        className="fa-btn-ghost"
                        onClick={() => setSelectedAssetId(row.id)}
                      >
                        Schedule
                      </button>
                      <button
                        type="button"
                        className="fa-btn-ghost fa-btn-ghost-danger"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedAsset && selectedSchedule && (
          <div
            className="fa-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedAssetId(null)}
          >
            <div className="fa-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fa-modal-head">
                <div>
                  <div className="fa-card-label">Asset detail</div>
                  <div className="fa-modal-title">
                    {selectedAsset.assetCode} &middot; {selectedAsset.name}
                  </div>
                  <div className="fa-card-sub">
                    {selectedAsset.categoryName} &middot; Purchased{' '}
                    {formatDate(selectedAsset.purchaseDate)}
                  </div>
                </div>
                <button
                  type="button"
                  className="fa-btn"
                  onClick={() => setSelectedAssetId(null)}
                >
                  Close
                </button>
              </div>

              <div className="fa-summary fa-modal-summary">
                <div className="fa-card">
                  <div className="fa-card-label">Cost</div>
                  <div className="fa-card-value">{formatAmount(selectedSchedule.cost)}</div>
                </div>
                <div className="fa-card">
                  <div className="fa-card-label">Accumulated depreciation</div>
                  <div className="fa-card-value">
                    {formatAmount(selectedSchedule.accumulated)}
                  </div>
                </div>
                <div className="fa-card">
                  <div className="fa-card-label">WDV</div>
                  <div className="fa-card-value">{formatAmount(selectedSchedule.wdv)}</div>
                </div>
                <div className="fa-card">
                  <div className="fa-card-label">Monthly depreciation</div>
                  <div className="fa-card-value">{formatAmount(selectedSchedule.monthly)}</div>
                </div>
              </div>

              <div className="fa-modal-body">
                <h3 className="fa-schedule-title">Schedule</h3>
                <p className="fa-schedule-sub">
                  Straight-line, generated from category settings.
                </p>
                <div className="fa-schedule-scroll">
                  <table className="fa-schedule-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th className="fa-table-num">Depreciation</th>
                        <th className="fa-table-num">Accumulated</th>
                        <th className="fa-table-num">WDV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSchedule.schedule.map((row, idx) => (
                        <tr
                          key={row.periodKey}
                          className={
                            idx === selectedSchedule.schedule.length - 1
                              ? 'fa-schedule-row-final'
                              : ''
                          }
                        >
                          <td>{row.periodLabel}</td>
                          <td className="fa-table-num">
                            {formatAmount(row.depreciation)}
                          </td>
                          <td className="fa-table-num">{formatAmount(row.accumulated)}</td>
                          <td className="fa-table-num">{formatAmount(row.wdv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetRegister;
