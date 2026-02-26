import React from 'react';
import './Styles/ClientNavbar.css';

const ClientNavbar = ({ activeTab, onTabChange, user, onLogout }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="cp-navbar">
      <div className="cp-navbar-left">
        <div className="cp-navbar-title">
          <h2>{activeTab}</h2>
        </div>
      </div>
      <div className="cp-navbar-right">
        <div className="cp-navbar-time">
          <div className="cp-time-display">{formatTime(currentTime)}</div>
          <div className="cp-date-display">{formatDate(currentTime)}</div>
        </div>
        <div className="cp-navbar-user">
          <div className="cp-navbar-avatar">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="cp-navbar-user-info">
            <div className="cp-navbar-user-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="cp-navbar-user-role">Client</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientNavbar;
