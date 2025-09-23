import React, { useState, useEffect } from 'react';
import './RecentActivity.css';

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
      console.log('🔄 Loading recent activities from API...');
      console.log('API URL: http://localhost:8080/api/dashboard/recent-activities');
      
      // Fetch real data from API
      const response = await fetch('http://localhost:8080/api/dashboard/recent-activities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API response received:', result);
        
        if (result.success && result.data && Array.isArray(result.data)) {
          console.log(`📊 Found ${result.data.length} activities`);
          setActivities(result.data);
        } else {
          console.error('❌ API returned invalid data structure:', result);
          console.log('Falling back to mock data...');
          setActivities(getMockActivities());
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, response.statusText);
        console.error('Error response:', errorText);
        console.log('Falling back to mock data...');
        setActivities(getMockActivities());
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Network error loading recent activities:', error);
      console.log('Falling back to mock data...');
      setActivities(getMockActivities());
      setIsLoading(false);
    }
  };

  // Mock data fallback function
  const getMockActivities = () => {
    return [
      {
        id: 'mock_1',
        type: 'trade',
        action: 'BUY',
        symbol: 'AAPL',
        quantity: 100,
        price: 150.50,
        value: 15050,
        portfolio: 'Test Portfolio',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        status: 'completed',
        user: 'System'
      },
      {
        id: 'mock_2',
        type: 'trade',
        action: 'SELL',
        symbol: 'MSFT',
        quantity: 50,
        price: 300.25,
        value: 15012.50,
        portfolio: 'Test Portfolio',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        status: 'completed',
        user: 'System'
      },
      {
        id: 'mock_3',
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
        id: 'mock_4',
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
        id: 'mock_5',
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
        id: 'mock_6',
        type: 'market_event',
        action: 'PRICE_ALERT',
        symbol: 'RELIANCE',
        details: 'Price dropped below 2300',
        portfolio: 'N/A',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 hours ago
        status: 'triggered',
        user: 'System'
      }
    ];
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type only
    if (activeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activeFilter);
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
              <span className="quantity">{activity.quantity} shares</span>
              <span className="price">@ {formatCurrency(activity.price)}</span>
            </div>
            <div className="trade-value">
              Gross Value: {formatCurrency(activity.value)}
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
                    <span className="symbol">{activity.symbol || 'N/A'}</span>
                    <span className="portfolio">{activity.portfolio}</span>
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
