import React, { useEffect, useMemo, useState } from 'react';
import './Styles/FixedAssets.css';
import {
  listCategories,
  upsertCategory,
  deleteCategory,
  listAssets
} from './fixedAssetStore';

const emptyForm = {
  id: '',
  code: '',
  name: '',
  rate: '0.25',
  ratePercent: '25',
  usefulLifeYears: 4,
  method: 'STRAIGHT_LINE',
  assetGlAccountCode: '',
  accumulatedDepGlAccountCode: '',
  depreciationExpenseGlAccountCode: ''
};

const ratePercent = (r) => `${(Number(r) * 100).toFixed(2)}%`;

/** Drop trailing zeros while keeping a reasonable precision (handles 0.25 -> "25", 0.225 -> "22.5"). */
const trimNumberString = (n, fractionDigits = 6) => {
  if (!Number.isFinite(n)) return '';
  return String(Number(n.toFixed(fractionDigits)));
};

const fractionToPercent = (raw) => {
  if (raw === '' || raw == null) return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  return trimNumberString(n * 100);
};

const percentToFraction = (raw) => {
  if (raw === '' || raw == null) return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  return trimNumberString(n / 100, 8);
};

const AssetCategories = () => {
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCategories(listCategories());
    setAssets(listAssets());
  }, []);

  const assetCountByCategory = useMemo(() => {
    const map = new Map();
    assets.forEach((a) => map.set(a.categoryId, (map.get(a.categoryId) || 0) + 1));
    return map;
  }, [assets]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleRateFractionChange = (value) => {
    setForm((f) => ({
      ...f,
      rate: value,
      ratePercent: fractionToPercent(value)
    }));
  };

  const handleRatePercentChange = (value) => {
    setForm((f) => ({
      ...f,
      ratePercent: value,
      rate: percentToFraction(value)
    }));
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    const rateStr = cat.rate != null ? String(cat.rate) : '';
    setForm({
      id: cat.id,
      code: cat.code || '',
      name: cat.name || '',
      rate: rateStr,
      ratePercent: fractionToPercent(rateStr),
      usefulLifeYears: cat.usefulLifeYears ?? 0,
      method: cat.method || 'STRAIGHT_LINE',
      assetGlAccountCode: cat.assetGlAccountCode || '',
      accumulatedDepGlAccountCode: cat.accumulatedDepGlAccountCode || '',
      depreciationExpenseGlAccountCode: cat.depreciationExpenseGlAccountCode || ''
    });
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError('Category code is required.');
      return;
    }
    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }
    const rate = Number(form.rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
      setError('Depreciation rate must be a fraction between 0 and 1 (e.g. 0.25 for 25%).');
      return;
    }
    const life = Number(form.usefulLifeYears);
    if (!Number.isFinite(life) || life <= 0) {
      setError('Useful life must be greater than 0.');
      return;
    }
    upsertCategory({
      ...form,
      rate,
      usefulLifeYears: life
    });
    setCategories(listCategories());
    resetForm();
  };

  const handleDelete = (cat) => {
    const used = assetCountByCategory.get(cat.id) || 0;
    if (used > 0) {
      window.alert(
        `Cannot delete "${cat.name}". ${used} asset${used > 1 ? 's are' : ' is'} still using this category.`
      );
      return;
    }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    deleteCategory(cat.id);
    setCategories(listCategories());
    if (editingId === cat.id) resetForm();
  };

  return (
    <div className="fa-container">
      <div className="fa-wrapper">
        <header className="fa-header">
          <div className="fa-header-left">
            <p className="fa-eyebrow">Accounting · Fixed assets</p>
            <h1 className="fa-title">Asset Categories</h1>
            <span className="fa-subtitle">
              Depreciation rate, useful life, and GL account mapping per category.
            </span>
          </div>
        </header>

        <form className="fa-form-grid" onSubmit={handleSave}>
          <h3 className="fa-section-title">
            {editingId ? 'Edit category' : 'New category'}
          </h3>

          <div className="fa-form-group">
            <label className="fa-form-label">
              Code <span className="fa-form-required">*</span>
            </label>
            <input
              className="fa-input"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g. COMPUTER"
              maxLength={20}
            />
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">
              Name <span className="fa-form-required">*</span>
            </label>
            <input
              className="fa-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Office Computers"
            />
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">
              Depreciation rate (%) <span className="fa-form-required">*</span>
            </label>
            <input
              className="fa-input"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.ratePercent}
              onChange={(e) => handleRatePercentChange(e.target.value)}
              placeholder="25"
            />
            <span className="fa-card-sub">Enter the annual rate, e.g. 25 for 25%.</span>
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">Depreciation rate (fraction)</label>
            <input
              className="fa-input"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.rate}
              onChange={(e) => handleRateFractionChange(e.target.value)}
              placeholder="0.25"
            />
            <span className="fa-card-sub">
              Auto-synced with the % field. 0.25 = 25% per year.
            </span>
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">
              Useful life (years) <span className="fa-form-required">*</span>
            </label>
            <input
              className="fa-input"
              type="number"
              min="1"
              step="1"
              value={form.usefulLifeYears}
              onChange={(e) => handleChange('usefulLifeYears', e.target.value)}
            />
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">Method</label>
            <select
              className="fa-select"
              value={form.method}
              onChange={(e) => handleChange('method', e.target.value)}
            >
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="REDUCING_BALANCE" disabled>
                Reducing Balance (coming soon)
              </option>
            </select>
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">Asset GL account code</label>
            <input
              className="fa-input"
              value={form.assetGlAccountCode}
              onChange={(e) => handleChange('assetGlAccountCode', e.target.value)}
              placeholder="1-FA-COMPUTER"
            />
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">Accumulated depreciation GL</label>
            <input
              className="fa-input"
              value={form.accumulatedDepGlAccountCode}
              onChange={(e) => handleChange('accumulatedDepGlAccountCode', e.target.value)}
              placeholder="1-PROV-COMPUTER"
            />
          </div>

          <div className="fa-form-group">
            <label className="fa-form-label">Depreciation expense GL</label>
            <input
              className="fa-input"
              value={form.depreciationExpenseGlAccountCode}
              onChange={(e) =>
                handleChange('depreciationExpenseGlAccountCode', e.target.value)
              }
              placeholder="6-DEP-COMPUTER"
            />
          </div>

          {error ? <div className="fa-form-error-banner">{error}</div> : null}

          <div className="fa-form-actions fa-form-actions--grid">
            {editingId && (
              <button type="button" className="fa-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="fa-btn fa-btn-primary">
              {editingId ? 'Update category' : 'Add category'}
            </button>
          </div>
        </form>

        <div className="fa-table-wrap">
          <table className="fa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th className="fa-table-num">Rate</th>
                <th className="fa-table-num">Useful life</th>
                <th>Method</th>
                <th>Asset GL</th>
                <th>Acc. Dep GL</th>
                <th>Expense GL</th>
                <th className="fa-table-num">Assets</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={10} className="fa-empty">
                    No categories yet. Add one above.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.code}</strong>
                    </td>
                    <td>{c.name}</td>
                    <td className="fa-table-num">{ratePercent(c.rate)}</td>
                    <td className="fa-table-num">{c.usefulLifeYears} yrs</td>
                    <td>{c.method === 'STRAIGHT_LINE' ? 'Straight Line' : c.method}</td>
                    <td>{c.assetGlAccountCode || '-'}</td>
                    <td>{c.accumulatedDepGlAccountCode || '-'}</td>
                    <td>{c.depreciationExpenseGlAccountCode || '-'}</td>
                    <td className="fa-table-num">
                      {assetCountByCategory.get(c.id) || 0}
                    </td>
                    <td className="fa-table-actions">
                      <button
                        type="button"
                        className="fa-btn-ghost"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="fa-btn-ghost fa-btn-ghost-danger"
                        onClick={() => handleDelete(c)}
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
      </div>
    </div>
  );
};

export default AssetCategories;
