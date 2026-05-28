import React, { useState, useEffect } from 'react';
import './Styles/CSEAnnouncements.css';
import NewsEvents from './NewsEvents';

const CSEAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('corporate-notices');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading CSE announcements...');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/cse-announcements/announcements/json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ CSE announcements loaded:', result);
        
        if (result.success && result.announcements) {
          setAnnouncements(result.announcements);
          setLastUpdated(result.lastUpdated);
        } else {
          setError('No announcements data available');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load announcements:', response.status, errorText);
        setError(`Failed to load announcements: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading CSE announcements:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnnouncements = () => {
    loadAnnouncements();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getAnnouncementTypeColor = (type) => {
    if (!type) return '#6B7280';
    
    const typeLower = type.toLowerCase();
    if (typeLower.includes('dividend')) return '#10B981';
    if (typeLower.includes('split')) return '#3B82F6';
    if (typeLower.includes('rights')) return '#F59E0B';
    if (typeLower.includes('merger')) return '#8B5CF6';
    if (typeLower.includes('acquisition')) return '#8B5CF6';
    if (typeLower.includes('delisting')) return '#EF4444';
    return '#6B7280';
  };

  const tabs = [
    { id: 'corporate-notices', label: 'Corporate Notices', icon: null },
    { id: 'market-announcements', label: 'Market Announcements', icon: null },
    { id: 'trading-updates', label: 'Trading Updates', icon: null },
    { id: 'regulatory-updates', label: 'Regulatory Updates', icon: null },
    { id: 'news-events', label: 'News & Events', icon: null }
  ];

  const filteredAnnouncements = announcements.filter(announcement => {
    if (activeTab === 'corporate-notices') {
      return announcement.type && (
        announcement.type.toLowerCase().includes('corporate') ||
        announcement.type.toLowerCase().includes('notice') ||
        announcement.type.toLowerCase().includes('dividend') ||
        announcement.type.toLowerCase().includes('split') ||
        announcement.type.toLowerCase().includes('rights')
      );
    }
    // For other tabs, you can add more specific filtering logic
    return true;
  });

  return (
    <div className="cse-announcements-container">
      {/* Header */}
      <div className="cse-header">
          <div className="cse-header-content">
            <div className="cse-title-section">
              <h1 className="cse-title">
                CSE Announcements
              </h1>
              <p className="cse-subtitle">
                Latest announcements from Colombo Stock Exchange
              </p>
              {lastUpdated && (
                <div className="last-updated">
                  <svg className="clock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  Last updated: {formatDate(lastUpdated)}
                </div>
              )}
            </div>
            <div className="cse-actions">
              <button 
                className="refresh-btn"
                onClick={refreshAnnouncements}
                disabled={isLoading}
              >
                <svg className="refresh-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="cse-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`cse-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="cse-content">
        {activeTab === 'news-events' ? (
          <NewsEvents />
        ) : isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Error Loading Announcements</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={refreshAnnouncements}>
              Try Again
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="empty-container">
            <h3>No Announcements Found</h3>
            <p>No announcements available for the selected category.</p>
          </div>
        ) : (
          <div className="announcements-list">
            {filteredAnnouncements.map((announcement, index) => (
              <div key={announcement.id || index} className="announcement-card">
                <div className="announcement-header">
                  <div className="announcement-date">
                    {formatDate(announcement.date)}
                  </div>
                  {announcement.type && (
                    <div 
                      className="announcement-type"
                      style={{ backgroundColor: getAnnouncementTypeColor(announcement.type) }}
                    >
                      {announcement.type}
                    </div>
                  )}
                </div>
                
                <div className="announcement-content">
                  <div className="announcement-company">
                    {announcement.company || 'Unknown Company'}
                  </div>
                  <div className="announcement-title">
                    {announcement.title || 'No title available'}
                  </div>
                </div>
                
                {announcement.link && (
                  <div className="announcement-actions">
                    <a 
                      href={announcement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-details-btn"
                    >
                      View Details →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="cse-footer">
        <p className="footer-text">
          Data sourced from <a href="https://www.cse.lk/" target="_blank" rel="noopener noreferrer">Colombo Stock Exchange</a>
        </p>
        <p className="footer-disclaimer">
          This information is for reference only. Please verify with official sources.
        </p>
      </div>
    </div>
  );
};

export default CSEAnnouncements;
