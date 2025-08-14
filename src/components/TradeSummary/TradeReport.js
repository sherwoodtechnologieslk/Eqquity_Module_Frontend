import React, { useState, useEffect } from 'react';
import './Styles/TradeReport.css';

const TradeReport = () => {
  const [tradeData, setTradeData] = useState({
    clientInfo: {
      accountNo: 'TSL-96306-LC/00',
      clientName: 'SHERWOOD CAPITAL (PVT) LTD',
      brokerName: 'Ambeon Securities (Private)',
      address: '2nd Floor, No: 100 / 1, Elvitigala Mawatha, Colombo 08 Sri Lanka',
      contact: {
        tel: '0115328100',
        fax: '0115328177',
        email: 'info@ambeonsecurities.lk'
      }
    },
    tradeInfo: {
      tradeDate: '12/08/2025',
      attention: 'Charith Kamaladasa',
      settlementDate: '14/08/2025'
    },
    transactions: {
      sales: [
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150725',
          shares: 12032.0064,
          price: 10.11,
          grossAmount: 188.00,
          brokerage: 1.44,
          govCess: 36.10,
          netAmount: 11897.25,
          settlementDate: '14/08/2025',
          foreignBrokerage: 77.00,
          clearingFees: 8.66
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150726',
          shares: 9400.0050,
          price: 7.90,
          grossAmount: 188.00,
          brokerage: 1.13,
          govCess: 28.20,
          netAmount: 9294.71,
          settlementDate: '14/08/2025',
          foreignBrokerage: 60.16,
          clearingFees: 6.77
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150727',
          shares: 7510.0040,
          price: 6.31,
          grossAmount: 187.75,
          brokerage: 0.90,
          govCess: 22.53,
          netAmount: 7425.89,
          settlementDate: '14/08/2025',
          foreignBrokerage: 48.06,
          clearingFees: 5.41
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150728',
          shares: 187.751,
          price: 0.16,
          grossAmount: 187.75,
          brokerage: 0.02,
          govCess: 0.56,
          netAmount: 185.65,
          settlementDate: '14/08/2025',
          foreignBrokerage: 1.20,
          clearingFees: 0.14
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150729',
          shares: 23844.25127,
          price: 20.03,
          grossAmount: 187.75,
          brokerage: 2.86,
          govCess: 71.53,
          netAmount: 23577.20,
          settlementDate: '14/08/2025',
          foreignBrokerage: 152.60,
          clearingFees: 17.17
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150730',
          shares: 18775.00,
          price: 15.77,
          grossAmount: 187.75,
          brokerage: 2.25,
          govCess: 56.33,
          netAmount: 18564.72,
          settlementDate: '14/08/2025',
          foreignBrokerage: 120.16,
          clearingFees: 13.52
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150731',
          shares: 9375.00,
          price: 7.88,
          grossAmount: 187.50,
          brokerage: 1.13,
          govCess: 28.13,
          netAmount: 9269.98,
          settlementDate: '14/08/2025',
          foreignBrokerage: 60.00,
          clearingFees: 6.75
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150732',
          shares: 937.505,
          price: 0.79,
          grossAmount: 187.50,
          brokerage: 0.11,
          govCess: 2.81,
          netAmount: 927.00,
          settlementDate: '14/08/2025',
          foreignBrokerage: 6.00,
          clearingFees: 0.68
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150733',
          shares: 1875000.00,
          price: 1575.00,
          grossAmount: 187.50,
          brokerage: 225.00,
          govCess: 5625.00,
          netAmount: 1854000.00,
          settlementDate: '14/08/2025',
          foreignBrokerage: 12000.00,
          clearingFees: 1350.00
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150734',
          shares: 937500.00,
          price: 787.50,
          grossAmount: 187.50,
          brokerage: 112.50,
          govCess: 2812.50,
          netAmount: 927000.00,
          settlementDate: '14/08/2025',
          foreignBrokerage: 6000.00,
          clearingFees: 675.00
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150735',
          shares: 1875000.00,
          price: 1575.00,
          grossAmount: 187.50,
          brokerage: 225.00,
          govCess: 5625.00,
          netAmount: 1854000.00,
          settlementDate: '14/08/2025',
          foreignBrokerage: 12000.00,
          clearingFees: 1350.00
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150736',
          shares: 4605562.50,
          price: 3868.67,
          grossAmount: 187.50,
          brokerage: 552.67,
          govCess: 13816.69,
          netAmount: 4553980.19,
          settlementDate: '14/08/2025',
          foreignBrokerage: 29475.60,
          clearingFees: 3316.01
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150967',
          shares: 862732.00,
          price: 724.69,
          grossAmount: 188.00,
          brokerage: 103.53,
          govCess: 2588.20,
          netAmount: 853069.40,
          settlementDate: '14/08/2025',
          foreignBrokerage: 5521.48,
          clearingFees: 621.17
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025150968',
          shares: 137428.00,
          price: 115.44,
          grossAmount: 188.00,
          brokerage: 16.49,
          govCess: 412.28,
          netAmount: 135888.81,
          settlementDate: '14/08/2025',
          foreignBrokerage: 879.54,
          clearingFees: 98.95
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025151159',
          shares: 8460.00,
          price: 7.11,
          grossAmount: 188.00,
          brokerage: 1.02,
          govCess: 25.38,
          netAmount: 8365.24,
          settlementDate: '14/08/2025',
          foreignBrokerage: 54.14,
          clearingFees: 6.09
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025151187',
          shares: 20116.00,
          price: 16.90,
          grossAmount: 188.00,
          brokerage: 2.41,
          govCess: 60.35,
          netAmount: 19890.71,
          settlementDate: '14/08/2025',
          foreignBrokerage: 128.74,
          clearingFees: 14.48
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025151192',
          shares: 188000.00,
          price: 157.92,
          grossAmount: 188.00,
          brokerage: 22.56,
          govCess: 564.00,
          netAmount: 185894.40,
          settlementDate: '14/08/2025',
          foreignBrokerage: 1203.20,
          clearingFees: 135.36
        },
        {
          equity: 'HAYLEYS PLC',
          symbol: 'HAYL.N0000',
          isin: 'LK0080N00008',
          contractNo: '2025151199',
          shares: 94000.00,
          price: 78.96,
          grossAmount: 188.00,
          brokerage: 11.28,
          govCess: 282.00,
          netAmount: 92947.20,
          settlementDate: '14/08/2025',
          foreignBrokerage: 601.60,
          clearingFees: 67.68
        }
      ],
      purchases: [
        {
          equity: 'R I L PROPERTY PLC',
          symbol: 'RIL.N0000',
          isin: 'LK0452N00009',
          contractNo: '2025150587',
          shares: 28458.00,
          price: 27.90,
          grossAmount: 1020,
          brokerage: 3.41,
          govCess: 85.37,
          netAmount: 28776.71,
          settlementDate: '14/08/2025',
          foreignBrokerage: 182.13,
          clearingFees: 20.49
        },
        {
          equity: 'R I L PROPERTY PLC',
          symbol: 'RIL.N0000',
          isin: 'LK0452N00009',
          contractNo: '2025150588',
          shares: 167400.00,
          price: 140.62,
          grossAmount: 27.90,
          brokerage: 20.09,
          govCess: 502.20,
          netAmount: 169274.89,
          settlementDate: '14/08/2025',
          foreignBrokerage: 1071.36,
          clearingFees: 120.53
        },
        {
          equity: 'R I L PROPERTY PLC',
          symbol: 'RIL.N0000',
          isin: 'LK0452N00009',
          contractNo: '2025150589',
          shares: 2790.00,
          price: 2.34,
          grossAmount: 27.90,
          brokerage: 0.33,
          govCess: 8.37,
          netAmount: 2821.24,
          settlementDate: '14/08/2025',
          foreignBrokerage: 17.86,
          clearingFees: 2.01
        },
        {
          equity: 'R I L PROPERTY PLC',
          symbol: 'RIL.N0000',
          isin: 'LK0452N00009',
          contractNo: '2025150590',
          shares: 159030.00,
          price: 133.59,
          grossAmount: 27.90,
          brokerage: 19.08,
          govCess: 477.09,
          netAmount: 160811.13,
          settlementDate: '14/08/2025',
          foreignBrokerage: 1017.79,
          clearingFees: 114.50
        }
      ]
    },
    summary: {
      totalSales: 10566178.35,
      totalPurchases: 361683.97,
      netSettlement: 10204494.38,
      totalSalesShares: 56972,
      totalPurchaseShares: 12820,
      totalBrokerage: 1282.30,
      totalGovCess: 32057.59,
      totalForeignBrokerage: 68389.48,
      totalClearingFees: 7693.84
    }
  });

  const [selectedView, setSelectedView] = useState('overview');
  const [selectedEquity, setSelectedEquity] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(number);
  };

  const getEquityList = () => {
    const equities = new Set();
    tradeData.transactions.sales.forEach(sale => equities.add(sale.equity));
    tradeData.transactions.purchases.forEach(purchase => equities.add(purchase.equity));
    return Array.from(equities);
  };

  const getFilteredTransactions = () => {
    if (selectedEquity === 'all') {
      return {
        sales: tradeData.transactions.sales,
        purchases: tradeData.transactions.purchases
      };
    }
    
    return {
      sales: tradeData.transactions.sales.filter(sale => sale.equity === selectedEquity),
      purchases: tradeData.transactions.purchases.filter(purchase => purchase.equity === selectedEquity)
    };
  };

  const getFilteredSummary = () => {
    const filteredData = getFilteredTransactions();
    
    const totalSales = filteredData.sales.reduce((sum, sale) => sum + sale.netAmount, 0);
    const totalPurchases = filteredData.purchases.reduce((sum, purchase) => sum + purchase.netAmount, 0);
    const totalSalesShares = filteredData.sales.reduce((sum, sale) => sum + sale.shares, 0);
    const totalPurchaseShares = filteredData.purchases.reduce((sum, purchase) => sum + purchase.shares, 0);
    const totalBrokerage = filteredData.sales.reduce((sum, sale) => sum + sale.brokerage, 0) + 
                           filteredData.purchases.reduce((sum, purchase) => sum + purchase.brokerage, 0);
    const totalGovCess = filteredData.sales.reduce((sum, sale) => sum + sale.govCess, 0) + 
                         filteredData.purchases.reduce((sum, purchase) => sum + purchase.govCess, 0);
    
    return {
      totalSales,
      totalPurchases,
      netSettlement: totalSales - totalPurchases,
      totalSalesShares,
      totalPurchaseShares,
      totalBrokerage,
      totalGovCess
    };
  };

  const renderTransactionRow = (transaction, index) => (
    <tr key={index}>
      <td>{transaction.contractNo}</td>
      <td>{transaction.equity}</td>
      <td>{formatNumber(transaction.shares)}</td>
      <td>{formatNumber(transaction.price)}</td>
      <td>{formatCurrency(transaction.grossAmount)}</td>
      <td>{formatCurrency(transaction.brokerage)}</td>
      <td>{formatCurrency(transaction.govCess)}</td>
      <td>{formatCurrency(transaction.netAmount)}</td>
      <td>{transaction.settlementDate}</td>
      <td>{formatCurrency(transaction.foreignBrokerage)}</td>
      <td>{formatCurrency(transaction.clearingFees)}</td>
    </tr>
  );

  const renderOverview = () => {
    const filteredSummary = getFilteredSummary();
    const filteredData = getFilteredTransactions();
    
    return (
      <div className="tr-overview-section">
        {selectedEquity !== 'all' && (
          <div className="tr-equity-header">
            <h2>Summary for {selectedEquity}</h2>
          </div>
        )}
        
        <div className="tr-summary-cards">
          <div className="tr-summary-card">
            <h3>Total Sales</h3>
            <div className="tr-amount">Rs. {formatCurrency(filteredSummary.totalSales)}</div>
            <div className="tr-sub-info">{formatNumber(filteredSummary.totalSalesShares)} shares</div>
          </div>
          <div className="tr-summary-card">
            <h3>Total Purchases</h3>
            <div className="tr-amount">Rs. {formatCurrency(filteredSummary.totalPurchases)}</div>
            <div className="tr-sub-info">{formatNumber(filteredSummary.totalPurchaseShares)} shares</div>
          </div>
          <div className="tr-summary-card">
            <h3>Net Settlement</h3>
            <div className="tr-amount">Rs. {formatCurrency(filteredSummary.netSettlement)}</div>
            <div className="tr-sub-info">Net Position</div>
          </div>
        </div>
        
        <div className="tr-detailed-stats">
          <h3>Transaction Summary</h3>
          <div className="tr-stats-grid">
            <div className="tr-stat-item">
              <span className="tr-label">Total Sales Transactions:</span>
              <span className="tr-value">{filteredData.sales.length}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Purchase Transactions:</span>
              <span className="tr-value">{filteredData.purchases.length}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Brokerage:</span>
              <span className="tr-value">Rs. {formatCurrency(filteredSummary.totalBrokerage)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total GOV CESS:</span>
              <span className="tr-value">Rs. {formatCurrency(filteredSummary.totalGovCess)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Foreign Brokerage:</span>
              <span className="tr-value">Rs. {formatCurrency(tradeData.summary.totalForeignBrokerage)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Clearing Fees:</span>
              <span className="tr-value">Rs. {formatCurrency(tradeData.summary.totalClearingFees)}</span>
            </div>
          </div>
        </div>
        
        <div className="tr-quick-stats">
          <div className="tr-stat-item">
            <span className="tr-label">Trade Date:</span>
            <span className="tr-value">{tradeData.tradeInfo.tradeDate}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Settlement Date:</span>
            <span className="tr-value">{tradeData.tradeInfo.settlementDate}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Client Account:</span>
            <span className="tr-value">{tradeData.clientInfo.accountNo}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Client Name:</span>
            <span className="tr-value">{tradeData.clientInfo.clientName}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    const filteredData = getFilteredTransactions();
    return (
      <div className="tr-transactions-section">
        <h3>Sales Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
        <div className="tr-table-container">
          <table className="tr-transactions-table">
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Equity</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Gross Amount</th>
                <th>Brokerage</th>
                <th>GOV CESS</th>
                <th>Net Amount</th>
                <th>Settlement</th>
                <th>Foreign Brokerage</th>
                <th>Clearing Fees</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.sales.map((sale, index) => 
                renderTransactionRow(sale, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPurchases = () => {
    const filteredData = getFilteredTransactions();
    return (
      <div className="tr-transactions-section">
        <h3>Purchase Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
        <div className="tr-table-container">
          <table className="tr-transactions-table">
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Equity</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Gross Amount</th>
                <th>Brokerage</th>
                <th>GOV CESS</th>
                <th>Net Amount</th>
                <th>Settlement</th>
                <th>Foreign Brokerage</th>
                <th>Clearing Fees</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.purchases.map((purchase, index) => 
                renderTransactionRow(purchase, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClientInfo = () => (
    <div className="tr-client-info-section">
      <div className="tr-client-header">
        <h2>TRADE CONFIRMATION</h2>
      </div>
      
      <div className="tr-client-details">
        <div className="tr-client-left">
          <div className="tr-info-group">
            <label>Client A/C No:</label>
            <span>{tradeData.clientInfo.accountNo}</span>
          </div>
          <div className="tr-info-group">
            <label>Client Name:</label>
            <span>{tradeData.clientInfo.clientName}</span>
          </div>
          <div className="tr-info-group">
            <label>Broker:</label>
            <span>{tradeData.clientInfo.brokerName}</span>
          </div>
          <div className="tr-info-group">
            <label>Address:</label>
            <span>{tradeData.clientInfo.address}</span>
          </div>
        </div>
        
        <div className="tr-client-right">
          <div className="tr-info-group">
            <label>Trade Date:</label>
            <span>{tradeData.tradeInfo.tradeDate}</span>
          </div>
          <div className="tr-info-group">
            <label>Attention:</label>
            <span>{tradeData.tradeInfo.attention}</span>
          </div>
          <div className="tr-info-group">
            <label>Settlement Date:</label>
            <span>{tradeData.tradeInfo.settlementDate}</span>
          </div>
          <div className="tr-info-group">
            <label>Tel:</label>
            <span>{tradeData.clientInfo.contact.tel}</span>
          </div>
          <div className="tr-info-group">
            <label>Fax:</label>
            <span>{tradeData.clientInfo.contact.fax}</span>
          </div>
          <div className="tr-info-group">
            <label>Email:</label>
            <span>{tradeData.clientInfo.contact.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tr-equity-module-main-container">
      <div className="tr-page-header-section">
        <div className="tr-header-content-wrapper">
          <div className="tr-header-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="tr-header-text-content">
            <h2>Trade Report</h2>
            <p>Comprehensive trade analysis and reporting</p>
          </div>
        </div>
      </div>

      <div className="tr-controls-section">
        <div className="tr-view-tabs">
          <button 
            className={selectedView === 'overview' ? 'tr-active' : ''}
            onClick={() => setSelectedView('overview')}
          >
            Overview
          </button>
          <button 
            className={selectedView === 'sales' ? 'tr-active' : ''}
            onClick={() => setSelectedView('sales')}
          >
            Sales
          </button>
          <button 
            className={selectedView === 'purchases' ? 'tr-active' : ''}
            onClick={() => setSelectedView('purchases')}
          >
            Purchases
          </button>
          <button 
            className={selectedView === 'client' ? 'tr-active' : ''}
            onClick={() => setSelectedView('client')}
          >
            Client Info
          </button>
        </div>
        
        <div className="tr-equity-filter">
          <label htmlFor="equity-select">Filter by Equity:</label>
          <select 
            id="equity-select"
            value={selectedEquity}
            onChange={(e) => setSelectedEquity(e.target.value)}
          >
            <option value="all">All Equities</option>
            {getEquityList().map(equity => (
              <option key={equity} value={equity}>{equity}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tr-report-content">
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'sales' && renderSales()}
        {selectedView === 'purchases' && renderPurchases()}
        {selectedView === 'client' && renderClientInfo()}
      </div>

      <div className="tr-report-footer">
        <p>This is a computer generated report on {tradeData.tradeInfo.tradeDate}</p>
      </div>
    </div>
  );
};

export default TradeReport;
