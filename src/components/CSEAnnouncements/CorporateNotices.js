import React, { useState, useEffect } from 'react';
import './Styles/CorporateNotices.css';

const CorporateNotices = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    searchTerm: ''
  });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data - replace with actual API calls
  const mockNotices = [
    {
      id: 1,
      title: "Change in Board of Directors - ABC Holdings PLC",
      category: "Board Changes",
      company: "ABC Holdings PLC",
      symbol: "ABCH",
      date: "2025-01-15",
      time: "14:30",
      priority: "High",
      summary: "ABC Holdings PLC announces the appointment of Mr. John Smith as Independent Non-Executive Director effective January 20th, 2025.",
      content: "ABC Holdings PLC (Symbol: ABCH) wishes to inform its shareholders and the general public that Mr. John Smith has been appointed as an Independent Non-Executive Director of the Company with effect from January 20th, 2025. Mr. Smith brings over 20 years of experience in the financial services sector and will serve on the Audit Committee and Risk Management Committee. The appointment is subject to regulatory approval from the Securities and Exchange Commission of Sri Lanka.",
      attachments: ["Board_Appointment_Notice.pdf", "Director_Profile_John_Smith.pdf"]
    },
    {
      id: 2,
      title: "Quarterly Financial Results - Q3 2024/25",
      category: "Financial Results",
      company: "XYZ Corporation PLC",
      symbol: "XYZ",
      date: "2025-01-14",
      time: "16:45",
      priority: "Medium",
      summary: "XYZ Corporation PLC announces its quarterly financial results for the period ended December 31st, 2024.",
      content: "XYZ Corporation PLC (Symbol: XYZ) is pleased to announce its unaudited financial results for the third quarter ended December 31st, 2024. The Company recorded a revenue of Rs. 2.5 billion, representing a growth of 15% compared to the corresponding period last year. Net profit after tax stood at Rs. 450 million, showing a 12% increase year-on-year. The Board of Directors has declared an interim dividend of Rs. 1.50 per share.",
      attachments: ["Q3_Financial_Results_2024.pdf", "Interim_Financial_Statements.pdf"]
    },
    {
      id: 3,
      title: "Material Transaction - Asset Acquisition",
      category: "Material Transactions",
      company: "DEF Industries PLC",
      symbol: "DEF",
      date: "2025-01-13",
      time: "11:20",
      priority: "High",
      summary: "DEF Industries PLC enters into a material transaction for the acquisition of manufacturing assets worth Rs. 1.2 billion.",
      content: "DEF Industries PLC (Symbol: DEF) wishes to inform its shareholders that the Company has entered into a Share Purchase Agreement to acquire 100% of the issued share capital of GHI Manufacturing (Pvt) Ltd for a consideration of Rs. 1.2 billion. This acquisition will enhance the Company's manufacturing capabilities and expand its product portfolio. The transaction is subject to regulatory approvals and is expected to be completed by March 31st, 2025.",
      attachments: ["Asset_Acquisition_Agreement.pdf", "Due_Diligence_Report.pdf", "Valuation_Report.pdf"]
    },
    {
      id: 4,
      title: "Change in Corporate Secretary",
      category: "Corporate Governance",
      company: "JKL Holdings PLC",
      symbol: "JKL",
      date: "2025-01-12",
      time: "09:15",
      priority: "Low",
      summary: "JKL Holdings PLC announces the resignation of its Corporate Secretary and appointment of a new one.",
      content: "JKL Holdings PLC (Symbol: JKL) announces that Ms. Sarah Johnson has resigned from the position of Corporate Secretary with effect from January 15th, 2025. The Company has appointed Mr. Michael Brown as the new Corporate Secretary effective from the same date. Mr. Brown is a qualified Chartered Secretary with over 15 years of experience in corporate governance.",
      attachments: ["Corporate_Secretary_Change_Notice.pdf"]
    },
    {
      id: 5,
      title: "Annual General Meeting Notice - 2025",
      category: "AGM/EGM",
      company: "MNO Group PLC",
      symbol: "MNO",
      date: "2025-01-11",
      time: "13:00",
      priority: "Medium",
      summary: "MNO Group PLC announces its Annual General Meeting to be held on March 15th, 2025.",
      content: "MNO Group PLC (Symbol: MNO) hereby gives notice that the Annual General Meeting of the Company will be held on March 15th, 2025, at 2:00 PM at the Company's registered office. The meeting will consider the audited financial statements for the year ended December 31st, 2024, declaration of final dividend, re-election of directors, and other matters as set out in the notice. Shareholders are requested to attend or send their proxies.",
      attachments: ["AGM_Notice_2025.pdf", "Proxy_Form.pdf", "Annual_Report_2024.pdf"]
    },
    {
      id: 6,
      title: "Dividend Declaration - Final Dividend 2024",
      category: "Dividend",
      company: "PQR Bank PLC",
      symbol: "PQR",
      date: "2025-01-10",
      time: "17:30",
      priority: "High",
      summary: "PQR Bank PLC declares a final dividend of Rs. 3.00 per share for the financial year 2024.",
      content: "PQR Bank PLC (Symbol: PQR) is pleased to announce that the Board of Directors has declared a final dividend of Rs. 3.00 per share for the financial year ended December 31st, 2024. The dividend will be paid to shareholders on record as of February 28th, 2025. The ex-dividend date will be February 26th, 2025. This brings the total dividend for the year to Rs. 5.50 per share, including the interim dividend of Rs. 2.50 per share paid in September 2024.",
      attachments: ["Dividend_Declaration_Notice.pdf", "Dividend_Payment_Schedule.pdf"]
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadNotices = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotices(mockNotices);
      } catch (err) {
        setError('Failed to load corporate notices');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNotice(null);
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
      case 'Board Changes': return '#3b82f6';
      case 'Financial Results': return '#10b981';
      case 'Material Transactions': return '#f59e0b';
      case 'Corporate Governance': return '#8b5cf6';
      case 'AGM/EGM': return '#ef4444';
      case 'Dividend': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesCategory = filters.category === 'all' || notice.category === filters.category;
    const matchesSearch = notice.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         notice.company.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         notice.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    // Date filtering (last 7, 30, 90 days)
    const noticeDate = new Date(notice.date);
    const now = new Date();
    const daysDiff = Math.floor((now - noticeDate) / (1000 * 60 * 60 * 24));
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
      <div className="corporate-notices-loading">
        <div className="loading-spinner"></div>
        <p>Loading Corporate Notices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="corporate-notices-error">
        <h3>Error Loading Corporate Notices</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="corporate-notices">
      {/* Header */}
      <div className="notices-header">
        <div className="header-left">
          <h1>Corporate Notices</h1>
          <p className="header-subtitle">Stay informed with the latest corporate announcements and regulatory notices</p>
          <div className="cse-link">
            <span>Data sourced from: </span>
            <a 
              href="https://www.cse.lk/pages/announcements/announcements.component.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              CSE Official Announcements
            </a>
          </div>
        </div>
        <div className="header-right">
          <div className="notice-stats">
            <span className="total-count">{filteredNotices.length} Notices</span>
            <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="notices-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Board Changes">Board Changes</option>
            <option value="Financial Results">Financial Results</option>
            <option value="Material Transactions">Material Transactions</option>
            <option value="Corporate Governance">Corporate Governance</option>
            <option value="AGM/EGM">AGM/EGM</option>
            <option value="Dividend">Dividend</option>
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
            placeholder="Search notices, companies, or symbols..."
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

      {/* Notices List */}
      <div className="notices-list">
        {filteredNotices.length === 0 ? (
          <div className="no-notices">
            <div className="no-notices-icon">
              <svg fill="currentColor" viewBox="0 0 20 20" width="48" height="48">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3>No Corporate Notices Found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="notice-card"
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="notice-header">
                <div className="notice-meta">
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(notice.category) }}
                  >
                    {notice.category}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ color: getPriorityColor(notice.priority) }}
                  >
                    {notice.priority}
                  </span>
                </div>
                <div className="notice-date">
                  <span className="date">{formatDate(notice.date)}</span>
                  <span className="time">{formatTime(notice.time)}</span>
                </div>
              </div>
              
              <div className="notice-content">
                <h3 className="notice-title">{notice.title}</h3>
                <div className="notice-company-info">
                  <span className="company-name">{notice.company}</span>
                  <span className="company-symbol">({notice.symbol})</span>
                </div>
                <p className="notice-summary">{notice.summary}</p>
              </div>
              
              <div className="notice-footer">
                <div className="attachments">
                  {notice.attachments.length > 0 && (
                    <span className="attachment-count">
                      <svg className="attachment-icon" fill="currentColor" viewBox="0 0 20 20" width="14" height="14">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      {notice.attachments.length} attachment(s)
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

      {/* Notice Detail Modal */}
      {showModal && selectedNotice && (
        <div className="notice-modal-overlay" onClick={handleCloseModal}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNotice.title}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="modal-meta">
                <div className="meta-item">
                  <strong>Company:</strong> {selectedNotice.company} ({selectedNotice.symbol})
                </div>
                <div className="meta-item">
                  <strong>Category:</strong> 
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(selectedNotice.category) }}
                  >
                    {selectedNotice.category}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Priority:</strong>
                  <span 
                    className="priority-badge"
                    style={{ color: getPriorityColor(selectedNotice.priority) }}
                  >
                    {selectedNotice.priority}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Date:</strong> {formatDate(selectedNotice.date)} at {formatTime(selectedNotice.time)}
                </div>
              </div>
              
              <div className="modal-body">
                <h4>Summary</h4>
                <p className="summary-text">{selectedNotice.summary}</p>
                
                <h4>Full Notice</h4>
                <div className="notice-text">
                  {selectedNotice.content}
                </div>
                
                {selectedNotice.attachments.length > 0 && (
                  <div className="attachments-section">
                    <h4>Attachments</h4>
                    <div className="attachment-list">
                      {selectedNotice.attachments.map((attachment, index) => (
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

export default CorporateNotices;
