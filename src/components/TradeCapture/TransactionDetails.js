import React, { useEffect, useState } from 'react';
import './Styles/TransactionDetails.css';
import { transactionEntryAPI } from '../../services/api';

const TransactionDetails = ({ onBack, portfolioName, companyName, quantity, sellTransaction, valuationMethod }) => {
  const [buyLots, setBuyLots] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [wapDetails, setWapDetails] = useState(null);
  const [fifoAllocations, setFifoAllocations] = useState([]);

  useEffect(() => {
    if (valuationMethod && valuationMethod.toUpperCase() === 'WAP') {
      // Fetch WAP details
      if (portfolioName && companyName && quantity) {
        transactionEntryAPI.getWAPByPortfolioAndCompany(portfolioName, companyName)
          .then(data => {
            setWapDetails({
              wap: data.wap,
              totalQty: data.totalQty,
              costBasis: (data.wap * parseFloat(quantity)).toLocaleString(undefined, {minimumFractionDigits: 2})
            });
          })
          .catch(() => setWapDetails(null));
      }
    } else if (valuationMethod && valuationMethod.toUpperCase() === 'FIFO') {
      // Fetch buy lots and calculate FIFO allocations
      if (portfolioName && companyName && quantity) {
        transactionEntryAPI.getAvailableBuyLots(portfolioName, companyName)
          .then(data => {
            // Sort by buy date ascending (oldest first)
            const sortedLots = [...data].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date));
            let qtyToSell = parseFloat(quantity);
            const fifoRows = [];
            for (let lot of sortedLots) {
              if (qtyToSell <= 0) break;
              const available = parseFloat(lot.remaining_quantity);
              if (available <= 0) continue;
              const used = Math.min(qtyToSell, available);
              fifoRows.push({
                trade_date: lot.trade_date,
                price: lot.price,
                available: available,
                used: used
              });
              qtyToSell -= used;
            }
            setFifoAllocations(fifoRows);
          })
          .catch(() => setFifoAllocations([]));
      }
    } else if (portfolioName && companyName) {
      transactionEntryAPI.getAvailableBuyLots(portfolioName, companyName)
        .then(data => {
          setBuyLots(data);
          setAllocations(data.map(lot => ({ buyTransactionId: lot.id, allocatedQuantity: 0 })));
        })
        .catch(() => setBuyLots([]));
    }
  }, [portfolioName, companyName, quantity, valuationMethod]);

  const handleAllocationChange = (idx, value) => {
    const newAllocations = [...allocations];
    const max = parseFloat(buyLots[idx].remaining_quantity);
    let val = parseFloat(value) || 0;
    if (val > max) val = max;
    if (val < 0) val = 0;
    newAllocations[idx].allocatedQuantity = val;
    setAllocations(newAllocations);
    setError('');
    setSuccess('');
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedQuantity || 0), 0);

  const handleSave = async () => {
    if (totalAllocated !== parseFloat(quantity)) {
      setError(`Total allocated (${totalAllocated}) must match sell quantity (${quantity})`);
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const filteredAllocations = allocations.filter(a => a.allocatedQuantity > 0);
      await transactionEntryAPI.saveSellTransactionWithAllocations(sellTransaction, filteredAllocations);
      setSuccess('Sell transaction and allocations saved successfully!');
      setError('');
    } catch (err) {
      setError('Failed to save sell transaction and allocations.');
      setSuccess('');
    }
    setLoading(false);
  };

  // Show message if no portfolio or valuation method is selected
  if (!portfolioName || !valuationMethod) {
    return (
      <div className="td-container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh'}}>
        <div className="td-header" style={{alignSelf: 'flex-start'}}>
          <button 
            className="td-back-btn" 
            onClick={onBack}
            aria-label="Back to Sell Transaction Entry"
          >
            <svg className="td-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Entry Form
          </button>
        </div>
        <div style={{marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{background: 'linear-gradient(135deg, #fef2f2, #fce7e7)', borderRadius: 16, padding: '2.5rem 3rem', boxShadow: '0 4px 24px rgba(239,68,68,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{marginBottom: 16}}>
              <circle cx="12" cy="12" r="12" fill="#f87171"/>
              <path d="M12 7v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#fff"/>
            </svg>
            <div style={{fontSize: 24, color: '#991b1b', fontWeight: 700, marginBottom: 8, textAlign: 'center'}}>Portfolio & Valuation Method Required</div>
            <div style={{fontSize: 18, color: '#b91c1c', fontWeight: 400, textAlign: 'center', maxWidth: 480}}>
              Please select a portfolio with a valuation method to view transaction details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render ---
  if (valuationMethod && valuationMethod.toUpperCase() === 'WAP') {
    return (
      <div className="td-container">
        <div className="td-header">
          <button 
            className="td-back-btn" 
            onClick={onBack}
            aria-label="Back to Sell Transaction Entry"
          >
            <svg className="td-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Entry Form
          </button>
          <div className="td-title-section">
            <div className="td-title-icon">
              <svg className="td-title-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="td-title">Transaction Details - WAP Calculation</h1>
          </div>
        </div>
        <div className="td-content-section">
          <div className="td-info-row">
            <span><b>Portfolio:</b> {portfolioName}</span>
            <span><b>Company:</b> {companyName}</span>
            <span><b>Sell Quantity:</b> {quantity}</span>
            <span><b>Method:</b> WAP</span>
          </div>
          <div style={{background: '#d1fae5', borderRadius: 8, padding: 16, marginBottom: 16}}>
            Weighted Average Price calculation details:
          </div>
          <div style={{background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
            <div style={{fontWeight: 'bold', marginBottom: 8}}>Current WAP: <span style={{fontWeight: 400}}>{wapDetails ? wapDetails.wap : '...'}</span></div>
            <div style={{fontWeight: 'bold', marginBottom: 8}}>Shares to Sell: <span style={{fontWeight: 400}}>{quantity}</span></div>
            <div style={{fontWeight: 'bold'}}>Cost Basis: <span style={{fontWeight: 400}}>{wapDetails ? wapDetails.costBasis : '...'}</span></div>
          </div>
          <div style={{background: '#d1fae5', borderRadius: 8, padding: 16, marginBottom: 16}}>
            WAP method uses average cost across all buy transactions.
          </div>
        </div>
      </div>
    );
  }

  if (valuationMethod && valuationMethod.toUpperCase() === 'FIFO') {
    const totalToSell = fifoAllocations.reduce((sum, row) => sum + row.used, 0);
    return (
      <div className="td-container">
        <div className="td-header">
          <button 
            className="td-back-btn" 
            onClick={onBack}
            aria-label="Back to Sell Transaction Entry"
          >
            <svg className="td-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Entry Form
          </button>
          <div className="td-title-section">
            <div className="td-title-icon">
              <svg className="td-title-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="td-title">Transaction Details - FIFO Allocation</h1>
          </div>
        </div>
        <div className="td-content-section">
          <div className="td-info-row">
            <span><b>Portfolio:</b> {portfolioName}</span>
            <span><b>Company:</b> {companyName}</span>
            <span><b>Sell Quantity:</b> {quantity}</span>
            <span><b>Method:</b> FIFO</span>
          </div>
          <div style={{background: '#dbeafe', borderRadius: 8, padding: 16, marginBottom: 16, color: '#1e40af'}}>
            The following buy transactions will be automatically used (oldest first):
          </div>
          <table style={{width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 24}}>
            <thead>
              <tr style={{background: '#ef4444', color: 'white', fontWeight: 700}}>
                <th style={{padding: 12}}>BUY DATE</th>
                <th style={{padding: 12}}>BUY PRICE</th>
                <th style={{padding: 12}}>AVAILABLE SHARES</th>
                <th style={{padding: 12}}>SHARES TO SELL</th>
              </tr>
            </thead>
            <tbody>
              {fifoAllocations.map((row, idx) => (
                <tr key={idx} style={{background: '#fff', textAlign: 'center'}}>
                  <td style={{padding: 12}}>{row.trade_date ? new Date(row.trade_date).toLocaleDateString() : ''}</td>
                  <td style={{padding: 12}}>{parseFloat(row.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{padding: 12}}>{row.available}</td>
                  <td style={{padding: 12, fontWeight: 600}}>{row.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{background: '#fee2e2', borderRadius: 8, padding: 16, marginBottom: 16, color: '#b91c1c', fontWeight: 700, textAlign: 'center', fontSize: 20}}>
            Total to Sell: {totalToSell}
          </div>
          <div style={{background: '#d1fae5', borderRadius: 8, padding: 16, marginBottom: 16, color: '#166534'}}>
            FIFO allocation calculated automatically. No manual selection needed.
          </div>
        </div>
      </div>
    );
  }

  // Cherry Picking (default)
  return (
    <div className="td-container">
      <div className="td-header">
        <button 
          className="td-back-btn" 
          onClick={onBack}
          aria-label="Back to Sell Transaction Entry"
        >
          <svg className="td-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Entry Form
        </button>
        <div className="td-title-section">
          <div className="td-title-icon">
            <svg className="td-title-icon-svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="td-title">Transaction Details - Cherry Picking Allocation</h1>
        </div>
      </div>
      <div className="td-content-section">
        <div className="td-info-row">
          <span><b>Portfolio:</b> {portfolioName}</span>
          <span><b>Company:</b> {companyName}</span>
          <span><b>Sell Quantity:</b> {quantity}</span>
        </div>
        <table className="td-allocation-table">
          <thead>
            <tr>
              <th>Buy Date</th>
              <th>Buy Price</th>
              <th>Remaining Shares</th>
              <th>Allocate Shares</th>
            </tr>
          </thead>
          <tbody>
            {buyLots.map((lot, idx) => (
              <tr key={lot.id}>
                <td>{lot.trade_date ? new Date(lot.trade_date).toLocaleDateString() : ''}</td>
                <td>{parseFloat(lot.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>{lot.remaining_quantity}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max={lot.remaining_quantity}
                    value={allocations[idx]?.allocatedQuantity || ''}
                    onChange={e => handleAllocationChange(idx, e.target.value)}
                    className="td-allocation-input"
                    disabled={loading}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="td-allocation-summary">
          <span><b>Total Allocated:</b> {totalAllocated}</span>
        </div>
        {error && <div className="td-error-msg">{error}</div>}
        {success && <div className="td-success-msg">{success}</div>}
        <button className="td-save-btn" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Allocations'}
        </button>
      </div>
    </div>
  );
};

export default TransactionDetails;