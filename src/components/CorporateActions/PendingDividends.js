import React, { useState } from 'react';
import './Styles/PendingDividends.css';

const PendingDividends = () => {
  const [dividendType, setDividendType] = useState('cash'); // 'cash' or 'stock'
  const [taxRate, setTaxRate] = useState(6); // Tax rate in percentage
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);
  const [dividends, setDividends] = useState([
    {
      id: 1,
      name: 'Combank',
      amount: 560,
      price: 600,
      receivedAmount: 560,
      tax: 6,
      status: 'pending',
      type: 'cash',
      recordDate: '2025-01-15',
      paymentDate: '2025-01-20'
    }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a bank statement file to upload');
      return;
    }

    setIsUploading(true);
    // TODO: Implement actual file upload logic
    setTimeout(() => {
      alert('Bank statement uploaded successfully! Matching dividends...');
      setIsUploading(false);
      setSelectedFile(null);
      // In real implementation, this would update the dividends list with matched data
    }, 1500);
  };

  const handleMatch = (id) => {
    setDividends(prev => prev.map(div => 
      div.id === id ? { ...div, status: 'matched' } : div
    ));
    alert('Dividend matched successfully!');
  };

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this dividend entry?')) {
      setDividends(prev => prev.filter(div => div.id !== id));
    }
  };

  const handleTaxRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setTaxRate(value);
    }
  };

  const handleTaxRateBlur = () => {
    setIsEditingTaxRate(false);
  };

  const handleTaxRateClick = () => {
    setIsEditingTaxRate(true);
  };

  const calculateTaxAmount = (amount, taxPercent) => {
    return ((amount * taxPercent) / 100).toFixed(2);
  };

  const calculateNetAmount = (amount, taxPercent) => {
    return (amount - (amount * taxPercent) / 100).toFixed(2);
  };

  const filteredDividends = dividends.filter(div => div.type === dividendType);

  return (
    <div className="pending-div-page-container">
      <div className="pending-div-content-wrapper">
        <div className="pending-div-header-section">
          <div className="pending-div-header-icon">
            <svg className="pending-div-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h6a1 1 0 100-2H9z"/>
            </svg>
          </div>
          <div className="pending-div-header-text-group">
            <h1 className="pending-div-main-title">Pending Dividends</h1>
            <p className="pending-div-subtitle">Reconcile dividend payments with bank statements</p>
          </div>
        </div>

        {/* Dividend Type Buttons */}
        <div className="pending-div-buttons-section">
          <button
            className={`pending-div-type-btn ${dividendType === 'cash' ? 'active' : ''}`}
            onClick={() => setDividendType('cash')}
          >
            Cash Dividends
          </button>
          <button
            className={`pending-div-type-btn ${dividendType === 'stock' ? 'active' : ''}`}
            onClick={() => setDividendType('stock')}
          >
            Stock Dividends
          </button>
        </div>

        {/* Bank Statement Upload Section */}
        <div className="pending-div-upload-section">
          <div className="pending-div-upload-card">
            <div className="pending-div-upload-header">
              <svg className="pending-div-upload-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <h2 className="pending-div-upload-title">Bank Statement Upload</h2>
            </div>
            <div className="pending-div-upload-content">
              <div className="pending-div-file-input-wrapper">
                <input
                  type="file"
                  id="bankStatementFile"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleFileChange}
                  className="pending-div-file-input"
                />
                <label htmlFor="bankStatementFile" className="pending-div-file-label">
                  {selectedFile ? selectedFile.name : 'Choose Bank Statement File'}
                </label>
              </div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="pending-div-upload-btn"
              >
                {isUploading ? 'Uploading...' : 'Upload & Match'}
              </button>
            </div>
          </div>
        </div>

        {/* Pending Dividends Table */}
        <div className="pending-div-table-card">
          <div className="pending-div-table-header">
            <h2 className="pending-div-table-title">Pending Dividends</h2>
            <div 
              className={`pending-div-tax-info ${!isEditingTaxRate ? 'pending-div-tax-clickable' : ''}`}
              onClick={!isEditingTaxRate ? handleTaxRateClick : undefined}
              title={!isEditingTaxRate ? "Click to edit tax rate" : undefined}
            >
              <span className="pending-div-tax-label">Tax Rate:</span>
              {isEditingTaxRate ? (
                <input
                  type="number"
                  className="pending-div-tax-input"
                  value={taxRate}
                  onChange={handleTaxRateChange}
                  onBlur={handleTaxRateBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTaxRateBlur();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  min="0"
                  max="100"
                  step="0.1"
                  autoFocus
                />
              ) : (
                <span className="pending-div-tax-value">
                  {taxRate}%
                </span>
              )}
            </div>
          </div>

          <div className="pending-div-table-wrapper">
            <table className="pending-div-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Received Amount</th>
                  <th>Tax ({taxRate}%)</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDividends.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="pending-div-empty">
                      No pending {dividendType === 'cash' ? 'cash' : 'stock'} dividends found
                    </td>
                  </tr>
                ) : (
                  filteredDividends.map((dividend) => (
                    <tr key={dividend.id} className={dividend.status === 'matched' ? 'pending-div-matched' : ''}>
                      <td>{dividend.name}</td>
                      <td>{dividend.amount.toLocaleString()}</td>
                      <td>
                        {dividend.price.toLocaleString()}
                        <svg className="pending-div-check-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </td>
                      <td>{dividend.receivedAmount.toLocaleString()}</td>
                      <td>{calculateTaxAmount(dividend.amount, taxRate)}</td>
                      <td>{calculateNetAmount(dividend.amount, taxRate)}</td>
                      <td>
                        <span className={`pending-div-status pending-div-status-${dividend.status}`}>
                          {dividend.status === 'matched' ? 'Matched' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="pending-div-actions">
                          {dividend.status === 'pending' && (
                            <button
                              onClick={() => handleMatch(dividend.id)}
                              className="pending-div-btn pending-div-btn-match"
                            >
                              Match
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(dividend.id)}
                            className="pending-div-btn pending-div-btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pending-div-footer-section">
          <p>SHERWOOD TECHNOLOGIES (PVT) LTD • Secure dividend reconciliation • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default PendingDividends;
