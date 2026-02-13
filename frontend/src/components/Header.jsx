import { FiSearch } from 'react-icons/fi';
const Header = ({ title, subtitle }) => {
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

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
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role">{user?.role || 'Student'}</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Header; // Make sure this is default export!