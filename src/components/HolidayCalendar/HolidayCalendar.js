import React, { useMemo, useState, useEffect } from 'react';
import './HolidayCalendar.css';
import holidayService from '../../services/holidayService';
import fundsCenterService from '../../services/fundsCenterService';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const buildCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
};

const toDateKey = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).split('T')[0];
};

const formatHolidayDate = (value) => {
  const key = toDateKey(value);
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const HolidayCalendar = ({ mode = 'calendar' }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  
  // Form state for Add/Edit Holiday
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Public/National',
    fundsCenter: '',
    description: '',
    isRecurring: false
  });
  const [editingId, setEditingId] = useState(null); // Track which holiday is being edited
  const [showFundsCenterModal, setShowFundsCenterModal] = useState(false);
  const [customFundsCenter, setCustomFundsCenter] = useState('');
  const [fundsCenters, setFundsCenters] = useState([]);

  // Settings state
  const [settings, setSettings] = useState({
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    notifications: {
      emailReminders: true,
      upcomingHolidays: true,
      weekBefore: false
    },
    display: {
      showWeekNumbers: false,
      highlightWeekends: true,
      compactView: false
    },
    calendar: {
      fiscalYearStart: 'January',
      defaultView: 'Month'
    }
  });

  // Holiday list state
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Modal state for viewing holidays on a specific date
  const [selectedDate, setSelectedDate] = useState(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Load holidays from backend on component mount
  useEffect(() => {
    if (mode === 'list' || mode === 'calendar') {
      loadHolidays();
    }
  }, [mode]);

  // Load funds centers on component mount
  useEffect(() => {
    loadFundsCenters();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await holidayService.getAllHolidays();
      setHolidays(data || []);
      // If data is empty array, that's fine - not an error
    } catch (err) {
      setError('Failed to load holidays. Please try again.');
      console.error('Error loading holidays:', err);
      setHolidays([]); // Set empty array on error too
    } finally {
      setLoading(false);
    }
  };

  const loadFundsCenters = async () => {
    try {
      const response = await fundsCenterService.getAllFundsCenters();
      if (response.success && response.data) {
        setFundsCenters(response.data);
      }
    } catch (err) {
      console.error('Error loading funds centers:', err);
      // Don't show error to user, just use empty list
    }
  };

  // Helper function to check if a holiday matches a given date
  // For recurring holidays, matches by month and day (ignoring year)
  // For non-recurring holidays, matches exact date
  const holidayMatchesDate = (holiday, checkDate) => {
    if (!holiday || !checkDate) return false;

    const checkDateStr = toDateKey(checkDate);
    const holidayDateStr = toDateKey(holiday.date);

    if (holiday.isRecurring) {
      const checkMonthDay = checkDateStr.substring(5);
      const holidayMonthDay = holidayDateStr.substring(5);
      return checkMonthDay === holidayMonthDay;
    }

    return holidayDateStr === checkDateStr;
  };

  const calendarCells = useMemo(
    () => buildCalendar(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const goMonth = (delta) => {
    const next = new Date(viewDate);
    next.setMonth(viewDate.getMonth() + delta);
    setViewDate(next);
  };

  const goToday = () => setViewDate(today);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFundsCenterSelect = (fundsCenter) => {
    setFormData(prev => ({
      ...prev,
      fundsCenter: fundsCenter
    }));
    setShowFundsCenterModal(false);
    setCustomFundsCenter('');
  };

  const handleDeleteFundsCenter = async (id, event) => {
    event.stopPropagation(); // Prevent selecting the item when deleting
    
    if (window.confirm('Are you sure you want to delete this funds center?')) {
      try {
        await fundsCenterService.deleteFundsCenter(id);
        await loadFundsCenters(); // Reload the list
      } catch (err) {
        alert('Error deleting funds center. Please try again.');
        console.error('Error deleting funds center:', err);
      }
    }
  };

  const handleAddCustomFundsCenter = async () => {
    if (customFundsCenter.trim()) {
      try {
        await fundsCenterService.createFundsCenter({
          name: customFundsCenter.trim(),
          flag: ''
        });
        
        // Reload funds centers list
        await loadFundsCenters();
        
        // Set the newly added funds center as selected
        setFormData(prev => ({
          ...prev,
          fundsCenter: customFundsCenter.trim()
        }));
        
        setShowFundsCenterModal(false);
        setCustomFundsCenter('');
      } catch (err) {
        if (err.response && err.response.status === 409) {
          alert('This funds center already exists.');
        } else {
          alert('Error adding funds center. Please try again.');
        }
        console.error('Error adding custom funds center:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      if (editingId) {
        // Update existing holiday
        await holidayService.updateHoliday(editingId, formData);
        setSuccessMessage('Holiday updated successfully!');
        setEditingId(null);
      } else {
        // Create new holiday
        await holidayService.createHoliday(formData);
        setSuccessMessage('Holiday created successfully!');
      }
      
      // Reset form after submission
      setFormData({
        name: '',
        date: '',
        type: 'Public/National',
        fundsCenter: '',
        description: '',
        isRecurring: false
      });
      
      // Reload holidays list
      await loadHolidays();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(editingId ? 'Failed to update holiday. Please try again.' : 'Failed to create holiday. Please try again.');
      console.error('Error saving holiday:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      date: '',
      type: 'Public/National',
      fundsCenter: '',
      description: '',
      isRecurring: false
    });
    setEditingId(null);
    setError(null);
    setSuccessMessage('');
  };

  const handleSettingToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    setSuccessMessage('Settings saved successfully!');
    console.log('Settings saved:', settings);
    // TODO: Add API call to save settings to backend if needed
    // For now, settings are stored in local state only
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteHoliday = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      try {
        await holidayService.deleteHoliday(id);
        setSuccessMessage('Holiday deleted successfully!');
        // Reload holidays list
        await loadHolidays();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete holiday. Please try again.');
        console.error('Error deleting holiday:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditHoliday = (holiday) => {
    // Populate form with holiday data
    setFormData({
      name: holiday.name,
      date: toDateKey(holiday.date),
      type: holiday.type,
      fundsCenter: holiday.fundsCenter || '',
      description: holiday.description || '',
      isRecurring: holiday.isRecurring || false
    });
    setEditingId(holiday.id);
    setSuccessMessage('Holiday loaded for editing. Please navigate to "Add Holiday" tab to update.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleDateClick = (date, dayHolidays) => {
    if (dayHolidays.length > 0) {
      setSelectedDate(date);
      setShowHolidayModal(true);
    }
  };

  const closeHolidayModal = () => {
    setShowHolidayModal(false);
    setSelectedDate(null);
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || holiday.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get icon for holiday type - solid filled circle for all, different colors via CSS
  const getHolidayIcon = (type) => {
    return (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8"/>
      </svg>
    );
  };

  const renderContent = () => {
    if (mode === 'list') {
      return (
        <div className="hc-list-page">
          <div className="hc-list-container">
            <div className="hc-list-header">
              <div className="hc-list-header-icon" aria-hidden="true">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="hc-list-title-section">
                <h2>Holiday List</h2>
                <p className="hc-list-subtitle">Manage and view all holidays</p>
              </div>
            </div>

            {error && (
              <div className="hc-alert hc-alert-error">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="hc-alert hc-alert-success">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            )}

            <div className="hc-list-controls">
              <div className="hc-search-box">
                <svg className="hc-search-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="hc-search-input"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="hc-filter-select"
              >
                <option value="All">All Types</option>
                <option value="Public/National">Public / National Holidays</option>
                <option value="Bank">Bank Holiday</option>
                <option value="Market">Market Holiday</option>
                <option value="Religious">Religious Holiday</option>
                <option value="Regional">Regional Holiday</option>
                <option value="Commemorative">Commemorative Day</option>
                <option value="Special">Special Declared Holiday</option>
                <option value="Other">Other</option>
              </select>

              <div className="hc-list-stats">
                <span className="hc-stat-badge">{filteredHolidays.length} holidays</span>
              </div>
            </div>

            <div className="hc-table-wrapper">
              {loading ? (
                <div className="hc-loading-container">
                  <svg className="hc-loading-spinner" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Loading holidays...</p>
                </div>
              ) : (
                <table className="hc-table">
                  <thead>
                    <tr>
                      <th>Icon</th>
                      <th>Holiday Name</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Funds Center</th>
                      <th>Description</th>
                      <th>Recurring</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHolidays.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="hc-no-data">
                          <svg className="hc-no-data-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p>No holidays found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredHolidays.map((holiday) => (
                        <tr key={holiday.id}>
                          <td className="hc-table-icon">
                            <div className={`hc-icon-wrapper hc-icon-${holiday.type.toLowerCase().replace('/', '')}`}>
                              {getHolidayIcon(holiday.type)}
                            </div>
                          </td>
                          <td className="hc-table-name">{holiday.name}</td>
                          <td className="hc-table-date">{formatHolidayDate(holiday.date)}</td>
                          <td>
                            <span className={`hc-type-badge hc-type-${holiday.type.toLowerCase().replace('/', '')}`}>
                              {holiday.type}
                            </span>
                          </td>
                          <td className="hc-table-funds">
                            {holiday.fundsCenter ? holiday.fundsCenter.replace(/\s+0$/, '').trim() : ''}
                          </td>
                          <td className="hc-table-description">{holiday.description}</td>
                          <td className="hc-table-recurring">
                            {holiday.isRecurring ? (
                              <span className="hc-recurring-badge">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Yes
                              </span>
                            ) : (
                              <span className="hc-once-badge">Once</span>
                            )}
                          </td>
                          <td className="hc-table-actions">
                            <button
                              type="button"
                              onClick={() => handleEditHoliday(holiday)}
                              className="hc-action-btn hc-edit-btn"
                              title="Edit holiday"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              className="hc-action-btn hc-delete-btn"
                              title="Delete holiday"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (mode === 'create') {
      return (
        <div className="hc-form-page">
          <div className="hc-form-container">
            <div className="hc-form-header">
              <div className="hc-form-header-icon" aria-hidden="true">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="hc-form-header-text">
                <h2>{editingId ? 'Edit Holiday' : 'Add New Holiday'}</h2>
                <p className="hc-form-subtitle">
                  {editingId ? 'Update the holiday information' : 'Create a new holiday entry for the calendar'}
                </p>
              </div>
              {editingId && (
                <span className="hc-edit-badge">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Editing Mode
                </span>
              )}
            </div>

            {error && (
              <div className="hc-alert hc-alert-error">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="hc-alert hc-alert-success">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="hc-form">
              <section className="hc-form-section">
                <div className="hc-form-section-heading">
                  <h3 className="hc-form-section-heading__title">Holiday Details</h3>
                  <p className="hc-form-section-heading__hint">Name, date, type, and funds center</p>
                </div>

                <div className="hc-form-grid">
                  <div className="hc-form-group">
                    <label htmlFor="name" className="hc-label">
                      Holiday Name <span className="hc-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="hc-input"
                      placeholder="e.g., New Year's Day"
                      required
                    />
                  </div>

                  <div className="hc-form-group">
                    <label htmlFor="date" className="hc-label">
                      Date <span className="hc-required">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="hc-input"
                      required
                    />
                  </div>

                  <div className="hc-form-group">
                    <label htmlFor="type" className="hc-label">
                      Holiday Type <span className="hc-required">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="hc-input hc-select"
                      required
                    >
                      <option value="Public/National">Public / National Holidays</option>
                      <option value="Bank">Bank Holiday</option>
                      <option value="Market">Market Holiday / Stock Exchange Holiday</option>
                      <option value="Religious">Religious Holiday</option>
                      <option value="Regional">Regional Holiday</option>
                      <option value="Commemorative">Commemorative Day</option>
                      <option value="Special">Special Declared Holiday</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="hc-form-group">
                    <label htmlFor="fundsCenter" className="hc-label">
                      Funds Center
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFundsCenterModal(true)}
                      className="hc-input hc-funds-select-btn"
                    >
                      {formData.fundsCenter ? formData.fundsCenter.replace(/\s+0$/, '').trim() : 'Select Funds Center'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Funds Center Modal */}
              {showFundsCenterModal && (
                <div className="hc-modal-overlay" onClick={() => setShowFundsCenterModal(false)}>
                  <div className="hc-funds-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="hc-funds-modal-header">
                      <h3>Select Funds Center</h3>
                      <button
                        type="button"
                        className="hc-modal-close"
                        onClick={() => setShowFundsCenterModal(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="hc-funds-list">
                      {fundsCenters.map((center, index) => {
                        const hasFlag = center.flag && center.flag !== 0 && center.flag !== '0' && String(center.flag).trim() !== '';
                        const displayText = hasFlag ? `${center.name} ${center.flag}` : center.name;
                        return (
                          <div
                            key={center.id || index}
                            className={`hc-funds-item ${formData.fundsCenter === displayText ? 'selected' : ''}`}
                            onClick={() => handleFundsCenterSelect(displayText)}
                          >
                            {hasFlag && <span className="hc-funds-flag">{center.flag}</span>}
                            <span className="hc-funds-name">{center.name}</span>
                            {center.isCustom === true && (
                              <button
                                type="button"
                                className="hc-funds-delete-btn"
                                onClick={(e) => handleDeleteFundsCenter(center.id, e)}
                                title="Delete custom funds center"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="hc-funds-custom">
                      <div className="hc-funds-custom-divider">
                        <span>Or Add Custom</span>
                      </div>
                      <div className="hc-funds-custom-input">
                        <input
                          type="text"
                          placeholder="Enter custom funds center"
                          value={customFundsCenter}
                          onChange={(e) => setCustomFundsCenter(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCustomFundsCenter();
                            }
                          }}
                          className="hc-custom-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomFundsCenter}
                          className="hc-custom-add-btn"
                          disabled={!customFundsCenter.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <section className="hc-form-section">
                <div className="hc-form-section-heading">
                  <h3 className="hc-form-section-heading__title">Additional Information</h3>
                  <p className="hc-form-section-heading__hint">Notes and recurrence settings</p>
                </div>

                <div className="hc-form-grid">
                  <div className="hc-form-group hc-full-width">
                    <label htmlFor="description" className="hc-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="hc-input hc-textarea"
                      placeholder="Add any additional notes or details about this holiday..."
                      rows="4"
                    />
                  </div>

                  <div className="hc-form-group hc-full-width">
                    <label className="hc-checkbox-label">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="hc-checkbox"
                      />
                      <span>Recurring annually</span>
                    </label>
                  </div>
                </div>
              </section>

              <div className="hc-form-actions">
                <button type="button" onClick={handleCancel} className="hc-btn hc-btn-cancel" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="hc-btn hc-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <svg className="hc-btn-icon hc-spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="hc-btn-icon" fill="currentColor" viewBox="0 0 20 20">
                        {editingId ? (
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                      {editingId ? 'Update Holiday' : 'Add Holiday'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    if (mode === 'settings') {
      return (
        <div className="hc-settings-page">
          <div className="hc-settings-container">
            <div className="hc-settings-header">
              <div className="hc-settings-header-icon" aria-hidden="true">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="hc-settings-header-text">
                <h2>Holiday Calendar Settings</h2>
                <p className="hc-settings-subtitle">Customize your holiday calendar preferences</p>
              </div>
            </div>

            <div className="hc-settings-content">
              {/* Working Days Section */}
              <div className="hc-settings-section">
                <div className="hc-settings-section-header">
                  <svg className="hc-settings-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3>Working Days</h3>
                    <p>Define which days are considered working days</p>
                  </div>
                </div>
                <div className="hc-settings-grid">
                  {Object.entries(settings.workingDays).map(([day, isWorking]) => (
                    <label key={day} className="hc-settings-toggle-label">
                      <span className="hc-settings-day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      <label className="hc-toggle">
                        <input
                          type="checkbox"
                          checked={isWorking}
                          onChange={() => handleSettingToggle('workingDays', day)}
                        />
                        <span className="hc-toggle-slider"></span>
                      </label>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notifications Section */}
              <div className="hc-settings-section">
                <div className="hc-settings-section-header">
                  <svg className="hc-settings-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <div>
                    <h3>Notifications</h3>
                    <p>Manage holiday notification preferences</p>
                  </div>
                </div>
                <div className="hc-settings-list">
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Email Reminders</span>
                      <span className="hc-settings-item-desc">Receive email notifications for holidays</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailReminders}
                        onChange={() => handleSettingToggle('notifications', 'emailReminders')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Upcoming Holidays</span>
                      <span className="hc-settings-item-desc">Show notifications for upcoming holidays</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.upcomingHolidays}
                        onChange={() => handleSettingToggle('notifications', 'upcomingHolidays')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Week Before Alert</span>
                      <span className="hc-settings-item-desc">Get notified one week before a holiday</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.weekBefore}
                        onChange={() => handleSettingToggle('notifications', 'weekBefore')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Display Preferences Section */}
              <div className="hc-settings-section">
                <div className="hc-settings-section-header">
                  <svg className="hc-settings-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3>Display Preferences</h3>
                    <p>Customize how the calendar is displayed</p>
                  </div>
                </div>
                <div className="hc-settings-list">
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Show Week Numbers</span>
                      <span className="hc-settings-item-desc">Display week numbers on the calendar</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.display.showWeekNumbers}
                        onChange={() => handleSettingToggle('display', 'showWeekNumbers')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Highlight Weekends</span>
                      <span className="hc-settings-item-desc">Visually distinguish weekend days</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.display.highlightWeekends}
                        onChange={() => handleSettingToggle('display', 'highlightWeekends')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                  <div className="hc-settings-item">
                    <div className="hc-settings-item-info">
                      <span className="hc-settings-item-title">Compact View</span>
                      <span className="hc-settings-item-desc">Use a more compact calendar layout</span>
                    </div>
                    <label className="hc-toggle">
                      <input
                        type="checkbox"
                        checked={settings.display.compactView}
                        onChange={() => handleSettingToggle('display', 'compactView')}
                      />
                      <span className="hc-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Calendar Configuration Section */}
              <div className="hc-settings-section">
                <div className="hc-settings-section-header">
                  <svg className="hc-settings-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3>Calendar Configuration</h3>
                    <p>Set calendar year and view preferences</p>
                  </div>
                </div>
                <div className="hc-settings-form-grid">
                  <div className="hc-settings-form-group">
                    <label htmlFor="fiscalYearStart" className="hc-settings-label">Fiscal Year Start Month</label>
                    <select
                      id="fiscalYearStart"
                      value={settings.calendar.fiscalYearStart}
                      onChange={(e) => handleSettingChange('calendar', 'fiscalYearStart', e.target.value)}
                      className="hc-settings-select"
                    >
                      {monthLabels.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hc-settings-form-group">
                    <label htmlFor="defaultView" className="hc-settings-label">Default Calendar View</label>
                    <select
                      id="defaultView"
                      value={settings.calendar.defaultView}
                      onChange={(e) => handleSettingChange('calendar', 'defaultView', e.target.value)}
                      className="hc-settings-select"
                    >
                      <option value="Month">Month</option>
                      <option value="Week">Week</option>
                      <option value="Year">Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="hc-settings-actions">
              <button type="button" onClick={handleSaveSettings} className="hc-btn hc-btn-submit">
                <svg className="hc-btn-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="hc-calendar-page">
        <div className="hc-calendar">
          <header className="hc-header">
            <div className="hc-header-leading">
              <div className="hc-calendar-header-icon" aria-hidden="true">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="hc-title">
                <h2>{monthLabels[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                <span className="hc-subtitle">Holiday Calendar</span>
              </div>
            </div>
            <div className="hc-actions">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="hc-nav-btn hc-nav-btn--arrow"
                aria-label="Previous month"
              >
                <svg className="hc-nav-btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button type="button" onClick={goToday} className="hc-nav-btn hc-nav-btn--today">
                Today
              </button>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="hc-nav-btn hc-nav-btn--arrow"
                aria-label="Next month"
              >
                <svg className="hc-nav-btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </header>

          {error && (
            <div className="hc-alert hc-alert-error">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && holidays.length === 0 && (
            <div className="hc-alert hc-alert-info">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              No holidays saved. Go to "Add Holiday" to create your first holiday!
            </div>
          )}

          <div className="hc-calendar-grid-panel">
            <div className="hc-grid">
              {weekdayLabels.map((label) => (
                <div key={label} className="hc-weekday">{label}</div>
              ))}
              {calendarCells.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="hc-day empty" />;

                const isToday = date.toDateString() === today.toDateString();
                const dayHolidays = holidays.filter((h) => holidayMatchesDate(h, date));
                const hasHolidays = dayHolidays.length > 0;

                return (
                  <div
                    key={toDateKey(date)}
                    className={`hc-day${isToday ? ' today' : ''}${hasHolidays ? ' has-holiday' : ''}${hasHolidays ? ' clickable' : ''}`}
                    title={hasHolidays ? dayHolidays.map((h) => h.name).join(', ') : ''}
                    onClick={() => handleDateClick(date, dayHolidays)}
                  >
                    <div className="hc-day-header">
                      <span className="hc-day-number">{date.getDate()}</span>
                      {hasHolidays && (
                        <div className="hc-day-holidays">
                          {dayHolidays.map((holiday) => (
                            <div
                              key={holiday.id}
                              className={`hc-holiday-circle hc-holiday-${holiday.type.toLowerCase().replace('/', '')}`}
                              title={`${holiday.name} - ${holiday.type}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holiday Details Modal */}
          {showHolidayModal && selectedDate && (
          <div className="hc-modal-overlay" onClick={closeHolidayModal}>
            <div className="hc-holiday-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hc-holiday-modal-header">
                <div>
                  <h3>Holidays on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                  <p className="hc-holiday-modal-subtitle">{holidays.filter(h => holidayMatchesDate(h, selectedDate)).length} holiday(s) observed</p>
                </div>
                <button 
                  className="hc-modal-close"
                  onClick={closeHolidayModal}
                >
                  ×
                </button>
              </div>
              <div className="hc-holiday-modal-content">
                {holidays.filter(h => holidayMatchesDate(h, selectedDate)).map(holiday => (
                  <div key={holiday.id} className="hc-holiday-card">
                    <div className="hc-holiday-card-header">
                      <div className="hc-holiday-card-icon-wrapper">
                        <div className={`hc-holiday-card-icon hc-holiday-${holiday.type.toLowerCase().replace('/', '')}`}>
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8"/>
                          </svg>
                        </div>
                      </div>
                      <div className="hc-holiday-card-title">
                        <h4>{holiday.name}</h4>
                        <span className={`hc-type-badge hc-type-${holiday.type.toLowerCase().replace('/', '').replace(/\s+/g, '-')}`}>
                          {holiday.type}
                        </span>
                      </div>
                    </div>
                    {holiday.fundsCenter && (
                      <div className="hc-holiday-card-info">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                        <span>{holiday.fundsCenter}</span>
                      </div>
                    )}
                    {holiday.description && (
                      <div className="hc-holiday-card-description">
                        <p>{holiday.description}</p>
                      </div>
                    )}
                    {holiday.isRecurring ? (
                      <div className="hc-holiday-card-recurring">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <span>Recurring annually</span>
                      </div>
                    ) : (
                      <div className="hc-holiday-card-once">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>One-time occurrence</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className={`hc-wrapper${mode === 'calendar' ? ' hc-wrapper--calendar' : ''}${mode === 'list' ? ' hc-wrapper--list' : ''}${mode === 'settings' ? ' hc-wrapper--settings' : ''}${mode === 'create' ? ' hc-wrapper--create' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default HolidayCalendar;

