import React, { useState, useEffect } from 'react';
import './Styles/MarketAnnouncements.css';

const MarketAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    searchTerm: ''
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data - replace with actual API calls
  const mockAnnouncements = [
    {
      id: 1,
      title: "CSE Market Closure - Independence Day",
      category: "Market Updates",
      company: "Colombo Stock Exchange",
      date: "2025-01-15",
      time: "09:30",
      priority: "High",
      summary: "The Colombo Stock Exchange will be closed on February 4th, 2025 in observance of Independence Day.",
      content: "The Colombo Stock Exchange (CSE) wishes to inform all market participants that the Exchange will be closed on Tuesday, February 4th, 2025, in observance of Independence Day. Normal trading will resume on Wednesday, February 5th, 2025. All pending settlements and clearing activities will be processed accordingly.",
      attachments: ["Independence_Day_Closure_Notice.pdf"]
    },
    {
      id: 2,
      title: "New Listing - ABC Holdings PLC",
      category: "New Listings",
      company: "ABC Holdings PLC",
      date: "2025-01-14",
      time: "14:15",
      priority: "Medium",
      summary: "ABC Holdings PLC will be listed on the CSE Main Board effective January 20th, 2025.",
      content: "The Colombo Stock Exchange is pleased to announce that ABC Holdings PLC will be listed on the Main Board of the Exchange effective Monday, January 20th, 2025. The company will trade under the symbol 'ABCH' with a total issued capital of 50 million shares.",
      attachments: ["ABC_Holdings_Listing_Details.pdf", "Prospectus_Summary.pdf"]
    },
    {
      id: 3,
      title: "Trading Halt - XYZ Corporation",
      category: "Trading Updates",
      company: "XYZ Corporation",
      date: "2025-01-13",
      time: "11:45",
      priority: "High",
      summary: "Trading in XYZ Corporation shares has been temporarily halted pending material announcement.",
      content: "Trading in XYZ Corporation PLC (Symbol: XYZ) has been temporarily halted effective immediately pending a material announcement. The halt will remain in place until further notice. Investors are advised to exercise caution and await further updates.",
      attachments: []
    },
    {
      id: 4,
      title: "Regulatory Update - Margin Trading Rules",
      category: "Regulatory Updates",
      company: "Securities and Exchange Commission",
      date: "2025-01-12",
      time: "16:00",
      priority: "Medium",
      summary: "Updated margin trading rules and requirements effective March 1st, 2025.",
      content: "The Securities and Exchange Commission of Sri Lanka has issued updated guidelines for margin trading activities. The new rules will be effective from March 1st, 2025, and include revised margin requirements, risk management protocols, and reporting obligations for licensed brokers.",
      attachments: ["Margin_Trading_Guidelines_2025.pdf", "Implementation_Timeline.pdf"]
    },
    {
      id: 5,
      title: "Corporate Action - DEF Industries Dividend",
      category: "Corporate Actions",
      company: "DEF Industries PLC",
      date: "2025-01-11",
      time: "10:30",
      priority: "Low",
      summary: "DEF Industries declares interim dividend of Rs. 2.50 per share.",
      content: "DEF Industries PLC has declared an interim dividend of Rs. 2.50 per share for the financial year 2024/25. The dividend will be paid to shareholders on record as of February 15th, 2025. The ex-dividend date will be February 13th, 2025.",
      attachments: ["Dividend_Declaration_Notice.pdf"]
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadAnnouncements = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnnouncements(mockAnnouncements);
      } catch (err) {
        setError('Failed to load announcements');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Market Updates': return '#3b82f6';
      case 'New Listings': return '#10b981';
      case 'Trading Updates': return '#f59e0b';
      case 'Regulatory Updates': return '#8b5cf6';
      case 'Corporate Actions': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesCategory = filters.category === 'all' || announcement.category === filters.category;
    const matchesSearch = announcement.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         announcement.company.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    // Date filtering (last 7, 30, 90 days)
    const announcementDate = new Date(announcement.date);
    const now = new Date();
    const daysDiff = Math.floor((now - announcementDate) / (1000 * 60 * 60 * 24));
    const matchesDateRange = filters.dateRange === 'all' || daysDiff <= parseInt(filters.dateRange);
    
    return matchesCategory && matchesSearch && matchesDateRange;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (isLoading) {
    return (
      <div className="market-announcements-loading">
        <div className="loading-spinner"></div>
        <p>Loading Market Announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-announcements-error">
        <h3>Error Loading Announcements</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="market-announcements">
      {/* Header */}
      <div className="announcements-header">
        <div className="header-left">
          <h1>Market Announcements</h1>
          <p className="header-subtitle">Stay updated with the latest CSE announcements and market news</p>
        </div>
        <div className="header-right">
          <div className="announcement-stats">
            <span className="total-count">{filteredAnnouncements.length} Announcements</span>
            <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="announcements-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Market Updates">Market Updates</option>
            <option value="New Listings">New Listings</option>
            <option value="Trading Updates">Trading Updates</option>
            <option value="Regulatory Updates">Regulatory Updates</option>
            <option value="Corporate Actions">Corporate Actions</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Date Range:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search announcements..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
        <button 
          className="refresh-btn"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="no-announcements">
            <div className="no-announcements-icon">
              <svg fill="currentColor" viewBox="0 0 20 20" width="48" height="48">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3>No Announcements Found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="announcement-card"
              onClick={() => handleAnnouncementClick(announcement)}
            >
              <div className="announcement-header">
                <div className="announcement-meta">
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(announcement.category) }}
                  >
                    {announcement.category}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ color: getPriorityColor(announcement.priority) }}
                  >
                    {announcement.priority}
                  </span>
                </div>
                <div className="announcement-date">
                  <span className="date">{formatDate(announcement.date)}</span>
                  <span className="time">{formatTime(announcement.time)}</span>
                </div>
              </div>
              
              <div className="announcement-content">
                <h3 className="announcement-title">{announcement.title}</h3>
                <p className="announcement-company">{announcement.company}</p>
                <p className="announcement-summary">{announcement.summary}</p>
              </div>
              
              <div className="announcement-footer">
                <div className="attachments">
                  {announcement.attachments.length > 0 && (
                    <span className="attachment-count">
                      <svg className="attachment-icon" fill="currentColor" viewBox="0 0 20 20" width="14" height="14">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      {announcement.attachments.length} attachment(s)
                    </span>
                  )}
                </div>
                <div className="read-more">
                  <span>Click to read more →</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div className="announcement-modal-overlay" onClick={handleCloseModal}>
          <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAnnouncement.title}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="modal-meta">
                <div className="meta-item">
                  <strong>Company:</strong> {selectedAnnouncement.company}
                </div>
                <div className="meta-item">
                  <strong>Category:</strong> 
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(selectedAnnouncement.category) }}
                  >
                    {selectedAnnouncement.category}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Priority:</strong>
                  <span 
                    className="priority-badge"
                    style={{ color: getPriorityColor(selectedAnnouncement.priority) }}
                  >
                    {selectedAnnouncement.priority}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Date:</strong> {formatDate(selectedAnnouncement.date)} at {formatTime(selectedAnnouncement.time)}
                </div>
              </div>
              
              <div className="modal-body">
                <h4>Summary</h4>
                <p className="summary-text">{selectedAnnouncement.summary}</p>
                
                <h4>Full Announcement</h4>
                <div className="announcement-text">
                  {selectedAnnouncement.content}
                </div>
                
                {selectedAnnouncement.attachments.length > 0 && (
                  <div className="attachments-section">
                    <h4>Attachments</h4>
                    <div className="attachment-list">
                      {selectedAnnouncement.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          <svg className="attachment-icon" fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                          <span className="attachment-name">{attachment}</span>
                          <button className="download-btn">Download</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketAnnouncements;
