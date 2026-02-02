import React, { useState, useEffect } from 'react';
import './RecentActivity.css';
import { transactionEntryAPI, otherTransactionAPI } from '../../services/api';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadRecentActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, activeFilter]);

  const loadRecentActivities = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading recent activities from multiple sources...');
      
      const allActivities = [];

      // 1. Fetch buy transactions (full details: netValue, contractNumber, settlementDate)
      try {
        const buyTransactions = await transactionEntryAPI.getAllBuyTransactions();
        console.log(`📊 Found ${buyTransactions?.length || 0} buy transactions`);
        
        if (buyTransactions && Array.isArray(buyTransactions)) {
          const buyActivities = buyTransactions.map(tx => ({
            id: `buy_${tx.id}`,
            type: 'trade',
            action: 'BUY',
            symbol: tx.symbol || tx.company_symbol || 'N/A',
            quantity: parseFloat(tx.quantity) || 0,
            price: parseFloat(tx.price) || 0,
            value: (parseFloat(tx.quantity) || 0) * (parseFloat(tx.price) || 0),
            netValue: parseFloat(tx.net_value) || 0,
            portfolio: tx.portfolio || 'N/A',
            timestamp: new Date(tx.trade_date || tx.created_at || new Date()),
            status: 'completed',
            contractNumber: tx.contract_number || tx.contractNumber || 'N/A',
            settlementDate: tx.settlement_date || tx.settlementDate || 'N/A',
            brokerage: parseFloat(tx.brokerage) || 0,
            govCess: parseFloat(tx.gov_cess) || 0
          }));
          allActivities.push(...buyActivities);
        }
      } catch (error) {
        console.error('❌ Error fetching buy transactions:', error);
      }

      // 2. Fetch sell transactions
      try {
        const sellTransactions = await transactionEntryAPI.getAllSellTransactions();
        console.log(`📊 Found ${sellTransactions?.length || 0} sell transactions`);
        
        if (sellTransactions && Array.isArray(sellTransactions)) {
          const sellActivities = sellTransactions.map(tx => {
            const price = parseFloat(tx.sold_price || tx.price || 0);
            const quantity = Math.abs(parseFloat(tx.quantity) || 0);
            const portfolio = tx.portfolio_name || tx.portfolio || 'N/A';
            
            return {
              id: `sell_${tx.id}`,
              type: 'trade',
              action: 'SELL',
              symbol: tx.symbol || tx.company_symbol || 'N/A',
              quantity: quantity,
              price: price,
              value: quantity * price,
              netValue: parseFloat(tx.net_value) || 0,
              portfolio: portfolio,
              timestamp: new Date(tx.trade_date || tx.created_at || new Date()),
              status: 'completed',
              contractNumber: tx.contract_number || tx.contractNumber || 'N/A',
              settlementDate: tx.settlement_date || tx.settlementDate || 'N/A',
              brokerage: parseFloat(tx.brokerage) || 0,
              govCess: parseFloat(tx.gov_cess) || 0
            };
          });
          allActivities.push(...sellActivities);
        }
      } catch (error) {
        console.error('❌ Error fetching sell transactions:', error);
      }

      // 3. Fetch other transactions
      try {
        const otherTransactions = await otherTransactionAPI.getAllTransactions();
        console.log(`📊 Found ${otherTransactions?.length || 0} other transactions`);
        
        if (otherTransactions && Array.isArray(otherTransactions)) {
          const otherActivities = otherTransactions.map(tx => ({
            id: `other_${tx.id}`,
            type: 'other_transaction',
            action: tx.transaction_type || tx.transactionType || 'OTHER',
            symbol: tx.description || 'N/A',
            quantity: 0,
            price: 0,
            value: parseFloat(tx.amount) || 0,
            portfolio: 'N/A',
            timestamp: new Date(tx.date || tx.created_at || new Date()),
            status: 'completed',
            voucherNumber: tx.voucher_number || tx.voucherNumber || 'N/A',
            accountType: tx.account_type || tx.accountType || 'N/A',
            glAccountCode: tx.gl_account_code || tx.glAccountCode || 'N/A',
            description: tx.description || '',
            reference: tx.reference || '',
            counterparty: tx.counterparty || ''
          }));
          allActivities.push(...otherActivities);
        }
      } catch (error) {
        console.error('❌ Error fetching other transactions:', error);
      }

      // Sort all activities by timestamp (most recent first)
      const sortedActivities = allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log(`✅ Total activities loaded: ${sortedActivities.length}`);
      setActivities(sortedActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Network error loading recent activities:', error);
      setActivities([]);
      setIsLoading(false);
    }
  };


  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type
    if (activeFilter !== 'all') {
      if (activeFilter === 'buy') {
        filtered = filtered.filter(activity => 
          activity.type === 'trade' && activity.action === 'BUY'
        );
      } else if (activeFilter === 'sell') {
        filtered = filtered.filter(activity => 
          activity.type === 'trade' && activity.action === 'SELL'
        );
      } else {
        filtered = filtered.filter(activity => activity.type === activeFilter);
      }
    }

    console.log('🔍 Filtering - Active filter:', activeFilter);
    console.log('🔍 Total activities:', activities.length);
    console.log('🔍 Filtered activities:', filtered.length);

    setFilteredActivities(filtered);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2
    }).format(num);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toLocaleString();
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (type, action) => {
    switch (type) {
      case 'trade':
        return action === 'BUY' ? 'BUY' : 'SELL';
      case 'other_transaction':
        return 'OTHER';
      case 'dividend':
        return 'DIV';
      case 'corporate_action':
        return 'CORP';
      case 'portfolio_change':
        return 'PORT';
      case 'market_event':
        return 'MKT';
      default:
        return 'ACT';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      case 'announced':
      case 'triggered':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getActivityDetails = (activity) => {
    switch (activity.type) {
      case 'trade':
        return (
          <div className="activity-details">
            <div className="trade-info">
              <span className={`action-badge ${activity.action.toLowerCase()}`}>{activity.action}</span>
              <span className="quantity">{formatNumber(activity.quantity)} shares</span>
              <span className="price">@ {formatCurrency(activity.price)}</span>
            </div>
            <div className="trade-value">
              {activity.netValue ? (
                <>
                  Gross Value: {formatCurrency(activity.value)} | 
                  Net Value: {formatCurrency(activity.netValue)}
                </>
              ) : (
                `Gross Value: ${formatCurrency(activity.value)}`
              )}
            </div>
            {activity.contractNumber && activity.contractNumber !== 'N/A' && (
              <div className="trade-meta">
                Contract: {activity.contractNumber} | 
                Settlement: {activity.settlementDate !== 'N/A' ? activity.settlementDate : 'N/A'}
              </div>
            )}
          </div>
        );
      case 'other_transaction':
        return (
          <div className="activity-details">
            <div className="other-transaction-info">
              <span className="action-badge other">{activity.action}</span>
              <span className="account-type">{activity.accountType}</span>
            </div>
            <div className="other-transaction-value">
              Amount: {formatCurrency(activity.value)}
            </div>
            {activity.voucherNumber && activity.voucherNumber !== 'N/A' && (
              <div className="other-transaction-meta">
                Voucher: {activity.voucherNumber}
                {activity.glAccountCode && activity.glAccountCode !== 'N/A' && (
                  <> | GL Account: {activity.glAccountCode}</>
                )}
              </div>
            )}
            {activity.description && (
              <div className="other-transaction-description">
                {activity.description}
              </div>
            )}
            {activity.reference && (
              <div className="other-transaction-reference">
                Reference: {activity.reference}
              </div>
            )}
            {activity.counterparty && (
              <div className="other-transaction-counterparty">
                Counterparty: {activity.counterparty}
              </div>
            )}
          </div>
        );
      case 'dividend':
        return (
          <div className="activity-details">
            <div className="dividend-info">
              <span className="action-badge dividend">{activity.action}</span>
              <span className="quantity">{activity.quantity} shares</span>
              <span className="amount">@ {formatCurrency(activity.amount)}</span>
            </div>
            <div className="dividend-value">
              Total: {formatCurrency(activity.value)}
            </div>
          </div>
        );
      case 'corporate_action':
        return (
          <div className="activity-details">
            <div className="corporate-info">
              <span className="action-badge corporate">{activity.action.replace('_', ' ')}</span>
              <span className="details">{activity.details}</span>
            </div>
          </div>
        );
      case 'portfolio_change':
        return (
          <div className="activity-details">
            <div className="portfolio-info">
              <span className="action-badge portfolio">{activity.action}</span>
              <span className="details">{activity.details}</span>
            </div>
          </div>
        );
      case 'market_event':
        return (
          <div className="activity-details">
            <div className="market-info">
              <span className="action-badge market">{activity.action.replace('_', ' ')}</span>
              <span className="details">{activity.details}</span>
            </div>
          </div>
        );
      default:
        return <div className="activity-details">{activity.details || 'No details available'}</div>;
    }
  };

  const formatDateTime = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const isToday = activityDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return activityDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return activityDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="recent-activity-loading">
        <div className="loading-spinner"></div>
        <p>Loading recent activities...</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="recent-activity-header">
        <h1>Recent Activity</h1>
        <div className="activity-summary">
          <span className="total-activities">
            {filteredActivities.length} activities found
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="activity-filters">
        <div className="filter-section">
          <label>Filter by Type:</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'buy' ? 'active' : ''}`}
              onClick={() => setActiveFilter('buy')}
            >
              Buy Transactions
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveFilter('sell')}
            >
              Sell Transactions
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'other_transaction' ? 'active' : ''}`}
              onClick={() => setActiveFilter('other_transaction')}
            >
              Other Transactions
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'trade' ? 'active' : ''}`}
              onClick={() => setActiveFilter('trade')}
            >
              All Trades
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'dividend' ? 'active' : ''}`}
              onClick={() => setActiveFilter('dividend')}
            >
              Dividends
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'corporate_action' ? 'active' : ''}`}
              onClick={() => setActiveFilter('corporate_action')}
            >
              Corporate Actions
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'portfolio_change' ? 'active' : ''}`}
              onClick={() => setActiveFilter('portfolio_change')}
            >
              Portfolio Changes
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'market_event' ? 'active' : ''}`}
              onClick={() => setActiveFilter('market_event')}
            >
              Market Events
            </button>
          </div>
        </div>

      </div>


      {/* Activities List */}
      <div className="activities-list">
        {filteredActivities.length === 0 ? (
                  <div className="no-activities">
          <div className="no-activities-icon">No Data</div>
          <h3>No activities found</h3>
          <p>Try adjusting your filters</p>
        </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type, activity.action)}
              </div>
              
              <div className="activity-content">
                <div className="activity-header">
                  <div className="activity-title">
                    <span className="symbol">
                      {activity.type === 'other_transaction' 
                        ? (activity.description || activity.action || 'Other Transaction')
                        : (activity.symbol || 'N/A')}
                    </span>
                    {activity.type !== 'other_transaction' && (
                      <span className="portfolio">{activity.portfolio}</span>
                    )}
                    {activity.type === 'other_transaction' && activity.accountType && (
                      <span className="portfolio">{activity.accountType}</span>
                    )}
                  </div>
                  <div className="activity-meta">
                    <span className="timestamp">{formatDateTime(activity.timestamp)}</span>
                    <span className={`status ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>

                {getActivityDetails(activity)}

                <div className="activity-footer">
                  <span className="activity-id">ID: {activity.id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Options */}
      <div className="export-section">
        <button className="export-btn">
          Export to Excel
        </button>
        <button className="export-btn">
          Export to PDF
        </button>
        <button className="export-btn">
          Email Report
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
