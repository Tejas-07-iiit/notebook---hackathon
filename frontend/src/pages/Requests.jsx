import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../services/api';
import { FiPlus, FiClock, FiCheck, FiX, FiEye, FiUser, FiCalendar, FiBook } from 'react-icons/fi';

const Requests = ({ onLogout }) => {
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let endpoint;

      if (user?.role === 'student') {
        endpoint = '/requests/my';
      } else if (activeTab === 'pending') {
        endpoint = '/requests/pending';
      } else {
        endpoint = '/requests/reviewed';
      }

      console.log(`Fetching requests from: ${endpoint}`);
      const response = await api.get(endpoint);
      console.log('Requests fetched:', response);
      setRequests(response);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }

    try {
      setActionLoading(id);
      console.log(`Approving request: ${id}`);

      const response = await api.put(`/requests/${id}/approve`);
      console.log('Approval response:', response);

      setMessage('Request approved successfully!');
      fetchRequests(); // Refresh the list

    } catch (error) {
      console.error('Error approving request:', error);
      setMessage(`Error: ${error.response?.data?.message || 'Failed to approve'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(id);
      console.log(`Rejecting request: ${id} with reason: ${reason}`);

      const response = await api.put(`/requests/${id}/reject`, {
        teacherMessage: reason.trim()
      });
      console.log('Rejection response:', response);

      setMessage('Request rejected successfully!');
      fetchRequests(); // Refresh the list

    } catch (error) {
      console.error('Error rejecting request:', error);
      setMessage(`Error: ${error.response?.data?.message || 'Failed to reject'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        className: 'badge',
        style: { background: 'var(--warning-light)', color: 'var(--warning)' },
        icon: <FiClock />,
        text: 'Pending Review'
      },
      approved: {
        className: 'badge',
        style: { background: 'var(--success-light)', color: 'var(--success)' },
        icon: <FiCheck />,
        text: 'Approved'
      },
      rejected: {
        className: 'badge',
        style: { background: 'var(--danger-light)', color: 'var(--danger)' },
        icon: <FiX />,
        text: 'Rejected'
      }
    };

    const config = styles[status] || styles.pending;

    return (
      <span className={config.className} style={{ ...config.style, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
        {config.icon} {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If user is student, show only their requests
  if (user?.role === 'student') {
    return (
      <div className="dashboard-container">
        <Sidebar onLogout={onLogout} />

        <div className="main-content">
          <div className="d-flex justify-between align-center mb-4">
            <Header
              title="My Note Requests"
              subtitle="Track your submitted note requests"
            />
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/upload'}
            >
              <FiPlus /> New Request
            </button>
          </div>

          {message && (
            <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-center p-5">
              <div className="spinner mx-auto"></div>
              <p>Loading your requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <h3>{request.title}</h3>
                    {getStatusBadge(request.status)}
                  </div>

                  <p className="request-description">{request.description}</p>

                  <div className="request-details">
                    <div className="detail-item">
                      <FiBook /> <strong>Subject:</strong> {request.subject}
                    </div>
                    <div className="detail-item">
                      <strong>Semester:</strong> {request.semester}
                    </div>
                    <div className="detail-item">
                      <strong>Department:</strong> {request.department}
                    </div>
                    {request.year && (
                      <div className="detail-item">
                        <strong>Year:</strong> {request.year}
                      </div>
                    )}
                    <div className="detail-item">
                      <FiCalendar /> <strong>Submitted:</strong> {formatDate(request.createdAt)}
                    </div>
                  </div>

                  {request.status !== 'pending' && request.teacherMessage && (
                    <div className="teacher-feedback">
                      <strong>Teacher's Feedback:</strong> {request.teacherMessage}
                      {request.reviewedBy && (
                        <div className="mt-2 text-sm d-flex align-center gap-2">
                          <FiUser /> Reviewed by: {request.reviewedBy.name}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="request-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(`${process.env.REACT_APP_API_URL}${request.fileUrl}`, '_blank')}
                    >
                      <FiEye /> View File
                    </button>

                    {request.status === 'approved' && (
                      <span className="text-success font-bold d-flex align-center gap-2">
                        <FiCheck /> This note has been published to the library
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't submitted any note requests yet.</p>
              <p>Use the "New Request" button to submit a request.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Teacher/Admin View
  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />

      <div className="main-content">
        <Header
          title="Note Requests"
          subtitle="Review and manage student note requests"
        />

        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}

        {/* Tabs for Teacher/Admin */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FiClock /> Pending Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="badge">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviewed' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviewed')}
          >
            <FiCheck /> Reviewed Requests
          </button>
        </div>

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner mx-auto"></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>{request.title}</h3>
                    <p className="text-sm text-secondary mt-1">
                      Requested by: <strong>{request.requestedBy?.name}</strong>
                      ({request.requestedBy?.email})
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <p className="request-description">{request.description}</p>

                <div className="request-details">
                  <div className="detail-item">
                    <FiBook /> <strong>Subject:</strong> {request.subject}
                  </div>
                  <div className="detail-item">
                    <strong>Semester:</strong> {request.semester}
                  </div>
                  <div className="detail-item">
                    <strong>Department:</strong> {request.department}
                  </div>
                  <div className="detail-item">
                    <FiCalendar /> <strong>Submitted:</strong> {formatDate(request.createdAt)}
                  </div>
                </div>

                {request.status !== 'pending' && request.teacherMessage && (
                  <div className="teacher-feedback">
                    <strong>Your Feedback:</strong> {request.teacherMessage}
                  </div>
                )}

                <div className="request-actions">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(`${process.env.REACT_APP_API_URL}${request.fileUrl}`, '_blank')}
                    >
                      <FiEye /> View File
                    </button>

                    {request.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(request._id)}
                          disabled={actionLoading === request._id}
                        >
                          <FiCheck /> {actionLoading === request._id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(request._id)}
                          disabled={actionLoading === request._id}
                        >
                          <FiX /> {actionLoading === request._id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>

                  {request.status === 'approved' && (
                    <span className="text-success font-bold d-flex align-center gap-2">
                      <FiCheck /> Published to library
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No {activeTab} requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;