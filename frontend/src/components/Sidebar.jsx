import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiBook, FiUpload, FiDownload,
  FiUsers, FiSettings, FiLogOut
} from 'react-icons/fi';

const Sidebar = ({ onLogout }) => {
  // Get user from localStorage instead of AuthContext
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const navItems = [
    { path: '/', icon: <FiHome />, label: 'Dashboard' },
    { path: '/notes', icon: <FiBook />, label: 'Notes Library' },
    { path: '/upload', icon: <FiUpload />, label: 'Upload Notes' },
    { path: '/colleges', icon: <FiHome />, label: 'Colleges' },
  ];

  if (user?.role === 'student') {
    navItems.push(
      { path: '/requests', icon: <FiDownload />, label: 'My Requests' }
    );
  }

  if (user?.role === 'teacher' || user?.role === 'admin') {
    navItems.push(
      { path: '/requests', icon: <FiUsers />, label: 'Review Requests' }
    );
  }

  return (
    <div className="sidebar">
      <div className="logo">
        <FiBook size={28} />
        <span>Notebook</span>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="nav-item">
          <span className="nav-icon"><FiSettings /></span>
          <span>Profile</span>
        </NavLink>
        <button onClick={onLogout} className="nav-item">
          <span className="nav-icon"><FiLogOut /></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;