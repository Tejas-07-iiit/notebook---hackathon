import React from 'react';
import { FiBell, FiSearch, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Header = ({ title, subtitle }) => {
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="header">
      <div className="header-left">
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            className="search-input"
          />
        </div>


        <div className="user-info">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>
          <button className="notification-btn">
            <FiBell />
          </button>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role">{user?.role || 'Student'}</span>
          </div>
          <button className="notification-btn">
            <FiBell />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header; // Make sure this is default export!