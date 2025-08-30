import React, { useState, useEffect } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    loadRecentActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, activeFilter, searchTerm, dateRange]);

  const loadRecentActivities = async () => {
    try {
      // TODO: Replace with actual API calls
      // For now, using mock data
      const mockActivities = [
        {
          id: 1,
          type: 'trade',
          action: 'BUY',
          symbol: 'RELIANCE',
          quantity: 100,
          price: 2345.67,
          value: 234567,
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          status: 'completed',
          user: 'John Doe'
        },
        {
          id: 2,
          type: 'trade',
          action: 'SELL',
          symbol: 'TCS',
          quantity: 50,
          price: 3456.78,
          value: 172839,
          portfolio: 'Growth Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          status: 'completed',
          user: 'Jane Smith'
        },
        {
          id: 3,
          type: 'dividend',
          action: 'RECEIVED',
          symbol: 'INFY',
          quantity: 200,
          amount: 25.50,
          value: 5100,
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          status: 'processed',
          user: 'System'
        },
        {
          id: 4,
          type: 'corporate_action',
          action: 'STOCK_SPLIT',
          symbol: 'TATAMOTORS',
          details: '2:1 Stock Split',
          portfolio: 'All Portfolios',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          status: 'announced',
          user: 'System'
        },
        {
          id: 5,
          type: 'portfolio_change',
          action: 'REBALANCING',
          symbol: 'N/A',
          details: 'Portfolio rebalancing completed',
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          status: 'completed',
          user: 'System'
        },
        {
          id: 6,
          type: 'trade',
          action: 'BUY',
          symbol: 'HDFC',
          quantity: 75,
          price: 1234.56,
          value: 92592,
          portfolio: 'Conservative Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          status: 'completed',
          user: 'Mike Johnson'
        },
        {
          id: 7,
          type: 'market_event',
          action: 'PRICE_ALERT',
          symbol: 'RELIANCE',
          details: 'Price dropped below 2300',
          portfolio: 'N/A',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 hours ago
          status: 'triggered',
          user: 'System'
        },
        {
          id: 8,
          type: 'trade',
          action: 'SELL',
          symbol: 'WIPRO',
          quantity: 100,
          price: 456.78,
          value: 45678,
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          status: 'completed',
          user: 'John Doe'
        },
        {
          id: 9,
          type: 'dividend',
          action: 'RECEIVED',
          symbol: 'HUL',
          quantity: 150,
          amount: 18.00,
          value: 2700,
          portfolio: 'Growth Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14), // 14 hours ago
          status: 'processed',
          user: 'System'
        },
        {
          id: 10,
          type: 'corporate_action',
          action: 'RIGHTS_ISSUE',
          symbol: 'ONGC',
          details: 'Rights issue announced at 120 per share',
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16), // 16 hours ago
          status: 'announced',
          user: 'System'
        },
        {
          id: 11,
          type: 'portfolio_change',
          action: 'DEPOSIT',
          symbol: 'N/A',
          details: 'Cash deposit of 500,000',
          portfolio: 'Main Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
          status: 'completed',
          user: 'John Doe'
        },
        {
          id: 12,
          type: 'trade',
          action: 'BUY',
          symbol: 'MARUTI',
          quantity: 200,
          price: 789.45,
          value: 157890,
          portfolio: 'Auto Portfolio',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20 hours ago
          status: 'completed',
          user: 'Sarah Wilson'
        }
      ];

      setActivities(mockActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setIsLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.portfolio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(activity => {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return activity.timestamp >= today;
        });
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(activity => 
          activity.timestamp >= yesterday && activity.timestamp < today
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(activity => activity.timestamp >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = filtered.filter(activity => activity.timestamp >= monthAgo);
        break;
      default:
        break;
    }

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
              <span className="action-badge buy">{activity.action}</span>
              <span className="quantity">{activity.quantity} shares</span>
              <span className="price">@ {formatCurrency(activity.price)}</span>
            </div>
            <div className="trade-value">
              Total: {formatCurrency(activity.value)}
            </div>
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
        return <div className="activity-details">{activity.details}</div>;
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
              className={`filter-btn ${activeFilter === 'trade' ? 'active' : ''}`}
              onClick={() => setActiveFilter('trade')}
            >
              Trades
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

        <div className="search-section">
                  <div className="search-box">
          <input
            type="text"
            placeholder="Search by symbol, portfolio, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">Search</span>
        </div>

          <div className="date-filter">
            <label>Time Range:</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="activities-list">
        {filteredActivities.length === 0 ? (
                  <div className="no-activities">
          <div className="no-activities-icon">No Data</div>
          <h3>No activities found</h3>
          <p>Try adjusting your filters or search terms</p>
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
                    <span className="symbol">{activity.symbol || 'N/A'}</span>
                    <span className="portfolio">{activity.portfolio}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="timestamp">{getTimeAgo(activity.timestamp)}</span>
                    <span className={`status ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>

                {getActivityDetails(activity)}

                <div className="activity-footer">
                  <span className="user">By: {activity.user}</span>
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
