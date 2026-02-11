import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../services/api';
import { FiUser, FiMail, FiBook, FiEdit, FiSave, FiKey, FiFileText, FiClock, FiCheck, FiX } from 'react-icons/fi';

const Profile = ({ onLogout }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Get user from localStorage
  const userData = localStorage.getItem('user');
  const initialUser = userData ? JSON.parse(userData) : null;

  const [user, setUser] = useState(initialUser);
  const [formData, setFormData] = useState({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    collegeId: initialUser?.collegeId || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        collegeId: user.collegeId || ''
      });
      // Fetch user requests if student
      if (user.role === 'student') {
        fetchUserRequests();
      }
    }
    fetchColleges();
  }, [user]);

  const fetchColleges = async () => {
    try {
      const response = await api.get('/colleges');
      setColleges(response);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchUserRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await api.get('/requests/my');
      setUserRequests(response);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: You'll need to create an update profile endpoint in your backend
      await api.put('/auth/profile', formData);

      // Update user in localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Note: You'll need to create a change password endpoint in your backend
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      alert('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCollegeName = (collegeId) => {
    const college = colleges.find(c => c._id === collegeId);
    return college ? `${college.collegeName} (${college.collegeCode})` : 'Loading...';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FiCheck className="icon-success" />;
      case 'rejected': return <FiX className="icon-danger" />;
      default: return <FiClock className="icon-warning" />;
    }
  };

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />

      <div className="main-content">
        <Header
          title="My Profile"
          subtitle="Manage your account settings"
        />

        <div className="profile-container">
          {/* Profile Info Card */}
          <div className="card">
            <div className="card-header-flex">
              <h2>Profile Information</h2>
              <button
                className="btn btn-secondary"
                onClick={() => setEditMode(!editMode)}
              >
                <FiEdit /> {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label><FiUser /> Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                ) : (
                  <div className="profile-value">{user.name}</div>
                )}
              </div>

              <div className="form-group">
                <label><FiMail /> Email Address</label>
                {editMode ? (
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                ) : (
                  <div className="profile-value">{user.email}</div>
                )}
              </div>

              <div className="form-group">
                <label><FiBook /> Role</label>
                <div className={`profile-value role-badge role-${user.role}`}>
                  {user.role}
                </div>
              </div>

              <div className="form-group">
                <label><FiBook /> College</label>
                {editMode ? (
                  <select
                    className="form-control"
                    value={formData.collegeId}
                    onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college._id} value={college._id}>
                        {college.collegeName} ({college.collegeCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="profile-value">{getCollegeName(user.collegeId)}</div>
                )}
              </div>

              {editMode && (
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <h2><FiKey /> Change Password</h2>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>

            {/* Account Actions */}
            <div className="account-actions">
              <h3>Account Actions</h3>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    onLogout();
                  }
                }}
              >
                Logout
              </button>

              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('This will permanently delete your account. Are you sure?')) {
                    alert('Account deletion functionality would be implemented here');
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="card">
          <h3>Your Activity</h3>
          <div className="stats-grid-small">
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Notes Uploaded</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userRequests.length}</div>
              <div className="stat-label">Requests Made</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Downloads</div>
            </div>
          </div>
        </div>

        {/* Request History (Only for Students) */}
        {user?.role === 'student' && (
          <div className="card mt-4">
            <h3 className="d-flex align-center gap-2 mb-3">
              <FiFileText /> My Request History
            </h3>
            {loadingRequests ? (
              <div className="text-center p-4">
                <div className="spinner"></div>
                <p>Loading request history...</p>
              </div>
            ) : userRequests.length > 0 ? (
              <div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRequests.map((req) => (
                        <tr key={req._id}>
                          <td>
                            <div className="font-medium">{req.title}</div>
                            {req.description && (
                              <div className="table-description">
                                {req.description.length > 50 ? req.description.substring(0, 50) + '...' : req.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{req.subject}</div>
                            <div className="table-subtext">
                              Sem {req.semester} • {req.department}
                            </div>
                          </td>
                          <td>
                            <div className="status-badge-container">
                              {getStatusIcon(req.status)}
                              <span className={`status-badge status-${req.status}`}>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </div>
                            {req.teacherMessage && (
                              <div className="teacher-message">
                                {req.teacherMessage}
                              </div>
                            )}
                          </td>
                          <td className="table-date">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td>
                            <button
                              onClick={() => window.open(`http://localhost:8000${req.fileUrl}`, '_blank')}
                              className="view-file-btn"
                            >
                              <FiFileText /> View File
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-3 table-subtext">
                  Showing {userRequests.length} request{userRequests.length !== 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <FiFileText size={48} />
                <p>No requests submitted yet.</p>
                <p className="table-subtext">
                  Use the "Upload Notes" feature to submit your first request!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};



export default Profile;