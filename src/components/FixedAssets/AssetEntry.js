import React, { useEffect, useMemo, useState } from 'react';
import './Styles/FixedAssets.css';
import {
  listCategories,
  createAsset,
  computeAssetSnapshot
} from './fixedAssetStore';

const formatAmount = (n) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const todayYmd = () => new Date().toISOString().split('T')[0];

const blankForm = {
  categoryId: '',
  assetCode: '',
  name: '',
  description: '',
  serialNumber: '',
  purchaseDate: todayYmd(),
  depreciationStartDate: todayYmd(),
  cost: '',
  residualValue: '0',
  quantity: 1,
  supplier: '',
  invoiceNumber: '',
  location: ''
};

const AssetEntry = ({ onTabChange }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [savedAsset, setSavedAsset] = useState(null);

  useEffect(() => {
    const cats = listCategories();
    setCategories(cats);
    if (cats.length && !form.categoryId) {
      setForm((f) => ({ ...f, categoryId: cats[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'purchaseDate' && (!f.depreciationStartDate || f.depreciationStartDate === f.purchaseDate)) {
        next.depreciationStartDate = value;
      }
      return next;
    });
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.categoryId) || null,
    [categories, form.categoryId]
  );

  const previewSnapshot = useMemo(() => {
    if (!selectedCategory) return null;
    return computeAssetSnapshot(
      {
        cost: Number(form.cost) || 0,
        residualValue: Number(form.residualValue) || 0,
        purchaseDate: form.purchaseDate,
        depreciationStartDate: form.depreciationStartDate
      },
      selectedCategory,
      todayYmd()
    );
  }, [
    selectedCategory,
    form.cost,
    form.residualValue,
    form.purchaseDate,
    form.depreciationStartDate
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedCategory) {
      setError('Please select a category.');
      return;
    }
    if (!form.name.trim()) {
      setError('Asset name is required.');
      return;
    }
    const cost = Number(form.cost);
    if (!Number.isFinite(cost) || cost <= 0) {
      setError('Cost must be greater than 0.');
      return;
    }
    const residual = Number(form.residualValue);
    if (!Number.isFinite(residual) || residual < 0) {
      setError('Residual value cannot be negative.');
      return;
    }
    if (residual >= cost) {
      setError('Residual value must be less than cost.');
      return;
    }
    if (!form.purchaseDate) {
      setError('Purchase date is required.');
      return;
    }
    const created = createAsset({
      ...form,
      cost,
      residualValue: residual,
      quantity: Number(form.quantity) || 1
    });
    setSavedAsset(created);
  };

  const handleNewEntry = () => {
    setSavedAsset(null);
    setForm({ ...blankForm, categoryId: form.categoryId });
    setError('');
  };

  const goToRegister = () => {
    if (typeof onTabChange === 'function') {
      onTabChange('Asset Register');
    }
  };

  if (categories.length === 0) {
    return (
      <div className="fa-container">
        <div className="fa-wrapper">
          <div className="fa-header">
            <div className="fa-header-left">
              <h1 className="fa-title">Add Asset</h1>
              <span className="fa-subtitle">No asset categories defined yet.</span>
            </div>
          </div>
          <div className="fa-empty fa-table-wrap">
            Set up at least one category in <strong>Asset Categories</strong> before
            adding assets.
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="fa-btn fa-btn-primary"
                onClick={() => onTabChange?.('Asset Categories')}
              >
                Open Asset Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fa-container">
      <div className="fa-wrapper">
        <div className="fa-header">
          <div className="fa-header-left">
            <h1 className="fa-title">Add Asset</h1>
            <span className="fa-subtitle">
              Record a new fixed asset. Depreciation schedule is generated live from the
              category settings.
            </span>
          </div>
          <div className="fa-header-right">
            <button type="button" className="fa-btn" onClick={goToRegister}>
              Open Asset Register
            </button>
          </div>
        </div>

        {savedAsset ? (
          <div className="fa-schedule-section">
            <h3 className="fa-schedule-title">Asset saved ✓</h3>
            <p className="fa-schedule-sub">
              <strong>{savedAsset.assetCode}</strong> &middot; {savedAsset.name}
            </p>
            <div className="fa-form-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="fa-btn fa-btn-primary" onClick={handleNewEntry}>
                Add another asset
              </button>
              <button type="button" className="fa-btn" onClick={goToRegister}>
                Go to Asset Register
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="fa-form-grid">
              <h3 className="fa-section-title">General information</h3>

              <div className="fa-form-group">
                <label className="fa-form-label">
                  Category <span className="fa-form-required">*</span>
                </label>
                <select
                  className="fa-select"
                  value={form.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({(c.rate * 100).toFixed(0)}% / {c.usefulLifeYears} yrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Asset code</label>
                <input
                  className="fa-input"
                  value={form.assetCode}
                  onChange={(e) => handleChange('assetCode', e.target.value)}
                  placeholder="Auto-generated if blank"
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">
                  Asset name <span className="fa-form-required">*</span>
                </label>
                <input
                  className="fa-input"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="HP Probook 450 G10 Laptop"
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Serial number</label>
                <input
                  className="fa-input"
                  value={form.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                />
              </div>

              <div className="fa-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="fa-form-label">Description</label>
                <input
                  className="fa-input"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="16GB RAM, 1TB SSD"
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Supplier / vendor</label>
                <input
                  className="fa-input"
                  value={form.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Invoice number</label>
                <input
                  className="fa-input"
                  value={form.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Location / department</label>
                <input
                  className="fa-input"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Finance"
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Quantity</label>
                <input
                  className="fa-input"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                />
              </div>

              <h3 className="fa-section-title">Acquisition & depreciation</h3>

              <div className="fa-form-group">
                <label className="fa-form-label">
                  Purchase date <span className="fa-form-required">*</span>
                </label>
                <input
                  className="fa-input"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Depreciation start date</label>
                <input
                  className="fa-input"
                  type="date"
                  value={form.depreciationStartDate}
                  onChange={(e) => handleChange('depreciationStartDate', e.target.value)}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">
                  Cost (LKR) <span className="fa-form-required">*</span>
                </label>
                <input
                  className="fa-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  placeholder="318000"
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Residual value (LKR)</label>
                <input
                  className="fa-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.residualValue}
                  onChange={(e) => handleChange('residualValue', e.target.value)}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Depreciation rate (read only)</label>
                <input
                  className="fa-input"
                  readOnly
                  value={
                    selectedCategory
                      ? `${(selectedCategory.rate * 100).toFixed(2)}% per year`
                      : '-'
                  }
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Useful life (read only)</label>
                <input
                  className="fa-input"
                  readOnly
                  value={selectedCategory ? `${selectedCategory.usefulLifeYears} years` : '-'}
                />
              </div>

              <div className="fa-form-group">
                <label className="fa-form-label">Method (read only)</label>
                <input
                  className="fa-input"
                  readOnly
                  value={
                    selectedCategory?.method === 'STRAIGHT_LINE'
                      ? 'Straight Line'
                      : selectedCategory?.method || '-'
                  }
                />
              </div>

              {error ? (
                <div
                  className="fa-section-title"
                  style={{ color: '#b91c1c', border: 'none', gridColumn: '1 / -1' }}
                >
                  {error}
                </div>
              ) : null}
            </div>

            {/* Calculations cards */}
            {previewSnapshot && (
              <div className="fa-summary">
                <div className="fa-card">
                  <div className="fa-card-label">Annual depreciation</div>
                  <div className="fa-card-value">{formatAmount(previewSnapshot.annual)}</div>
                </div>
                <div className="fa-card fa-card-green">
                  <div className="fa-card-label">Monthly depreciation</div>
                  <div className="fa-card-value">{formatAmount(previewSnapshot.monthly)}</div>
                </div>
                <div className="fa-card fa-card-amber">
                  <div className="fa-card-label">Total schedule months</div>
                  <div className="fa-card-value">{previewSnapshot.schedule.length}</div>
                </div>
                <div className="fa-card fa-card-slate">
                  <div className="fa-card-label">Final WDV (after life)</div>
                  <div className="fa-card-value">
                    {formatAmount(
                      previewSnapshot.schedule.length > 0
                        ? previewSnapshot.schedule[previewSnapshot.schedule.length - 1].wdv
                        : Number(form.cost) || 0
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule preview */}
            {previewSnapshot && previewSnapshot.schedule.length > 0 && (
              <div className="fa-schedule-section">
                <h3 className="fa-schedule-title">Depreciation schedule preview</h3>
                <p className="fa-schedule-sub">
                  Straight-line, generated from category settings. Saved schedule is
                  read-only and will eventually drive the monthly Depreciation Run.
                </p>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
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
                      {previewSnapshot.schedule.map((row, idx) => (
                        <tr
                          key={row.periodKey}
                          className={
                            idx === previewSnapshot.schedule.length - 1
                              ? 'fa-schedule-row-final'
                              : ''
                          }
                        >
                          <td>{row.periodLabel}</td>
                          <td className="fa-table-num">{formatAmount(row.depreciation)}</td>
                          <td className="fa-table-num">{formatAmount(row.accumulated)}</td>
                          <td className="fa-table-num">{formatAmount(row.wdv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="fa-form-actions">
              <button type="button" className="fa-btn" onClick={() => setForm(blankForm)}>
                Reset
              </button>
              <button type="submit" className="fa-btn fa-btn-primary">
                Save asset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssetEntry;
