import React, { useState } from 'react';
import './Styles/Statements.css';

const Statements = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2024');

  const statements = [
    { 
      id: 1, 
      type: 'Monthly Statement', 
      period: 'January 2024', 
      date: '2024-02-01',
      format: 'PDF',
      size: '2.4 MB',
      status: 'Available'
    },
    { 
      id: 2, 
      type: 'Monthly Statement', 
      period: 'December 2023', 
      date: '2024-01-01',
      format: 'PDF',
      size: '2.1 MB',
      status: 'Available'
    },
    { 
      id: 3, 
      type: 'Quarterly Statement', 
      period: 'Q4 2023', 
      date: '2024-01-15',
      format: 'PDF',
      size: '5.8 MB',
      status: 'Available'
    },
    { 
      id: 4, 
      type: 'Annual Statement', 
      period: '2023', 
      date: '2024-02-15',
      format: 'PDF',
      size: '12.3 MB',
      status: 'Available'
    },
    { 
      id: 5, 
      type: 'Tax Statement', 
      period: '2023', 
      date: '2024-03-01',
      format: 'PDF',
      size: '1.2 MB',
      status: 'Available'
    }
  ];

  const handleDownload = (statementId) => {
    // Mock download functionality
    console.log('Downloading statement:', statementId);
    alert('Statement download will be implemented with backend integration');
  };

  return (
    <div className="cp-statements">
      <div className="cp-statements-header">
        <h1>Account Statements</h1>
        <p>View and download your account statements</p>
      </div>

      {/* Filters */}
      <div className="cp-statements-filters">
        <div className="cp-filter-group">
          <label>Statement Type</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="cp-filter-select"
          >
            <option value="all">All Statements</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="tax">Tax Statements</option>
          </select>
        </div>
        <div className="cp-filter-group">
          <label>Year</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="cp-filter-select"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
        <button className="cp-filter-btn">Apply Filters</button>
      </div>

      {/* Statements List */}
      <div className="cp-statements-list">
        <div className="cp-statements-table">
          <table>
            <thead>
              <tr>
                <th>Statement Type</th>
                <th>Period</th>
                <th>Generated Date</th>
                <th>Format</th>
                <th>Size</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((statement) => (
                <tr key={statement.id}>
                  <td>{statement.type}</td>
                  <td className="cp-period">{statement.period}</td>
                  <td>{statement.date}</td>
                  <td>
                    <span className="cp-format-badge">{statement.format}</span>
                  </td>
                  <td>{statement.size}</td>
                  <td>
                    <span className={`cp-status-badge ${statement.status.toLowerCase()}`}>
                      {statement.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="cp-download-btn"
                      onClick={() => handleDownload(statement.id)}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="cp-statements-info">
        <div className="cp-info-icon">
          <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="cp-info-content">
          <h4>Statement Information</h4>
          <p>Monthly statements are generated on the 1st of each month. Quarterly and annual statements are available after the period ends. Tax statements are generated annually for tax filing purposes.</p>
        </div>
      </div>
    </div>
  );
};

export default Statements;
