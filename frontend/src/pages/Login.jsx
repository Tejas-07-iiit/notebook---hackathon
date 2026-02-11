import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiMail, FiLock, FiUser, FiHome } from 'react-icons/fi';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    collegeId: ''
  });

  const navigate = useNavigate();
  const API_URL = `${process.env.REACT_APP_API_URL}/api`;

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch colleges
  const fetchColleges = async () => {
    try {
      setCollegesLoading(true);
      console.log("Fetching colleges from:", `${API_URL}/colleges`);
      const response = await axios.get(`${API_URL}/colleges`);
      console.log("Colleges fetched:", response.data);
      setColleges(response.data);

      // Auto-select first college if none selected
      if (response.data.length > 0 && !registerData.collegeId) {
        console.log("Auto-selecting first college:", response.data[0]._id);
        setRegisterData(prev => ({
          ...prev,
          collegeId: response.data[0]._id
        }));
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
      setError('Could not load colleges list. Please try again.');
    } finally {
      setCollegesLoading(false);
    }
  };

  useEffect(() => {
    if (!isLogin && colleges.length === 0) {
      fetchColleges();
    }
  }, [isLogin]);

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Setting ${name} to:`, value);
    setRegisterData({
      ...registerData,
      [name]: value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!loginData.email || !loginData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginData.email.trim(),
        password: loginData.password
      });

      console.log("Login successful:", response.data);

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Call onLogin callback if provided
      if (onLogin && typeof onLogin === 'function') {
        onLogin(response.data.token, response.data.user);
      }

      setSuccess('Login successful! Redirecting...');

      // Navigate to dashboard
      navigate('/');

    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log("Register attempt with data:", registerData);

    // Validation
    const { name, email, password, role, collegeId } = registerData;

    if (!name?.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!email?.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (!collegeId) {
      setError('Please select a college');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
        collegeId: collegeId
      };

      console.log("Sending to backend:", dataToSend);

      const response = await axios.post(`${API_URL}/auth/register`, dataToSend);

      console.log("Registration successful:", response.data);

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Call onLogin callback if provided
      if (onLogin && typeof onLogin === 'function') {
        onLogin(response.data.token, response.data.user);
      }

      setSuccess('Registration successful! Redirecting...');

      // Navigate to dashboard
      navigate('/');

    } catch (err) {
      console.error("Registration error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.data?.message) {
        setError(`Server: ${err.response.data.message}`);
      } else if (err.response?.status === 400) {
        setError('Bad request. Please check all fields.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError(`Cannot connect to server. Is backend running on ${process.env.REACT_APP_API_URL} ?`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <FiBook size={48} color="#4361ee" />
            <h1>Notebook</h1>
            <p>College Notes Management System</p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="toggle-buttons">
          <button
            onClick={() => setIsLogin(true)}
            className={isLogin ? 'active' : ''}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={!isLogin ? 'active' : ''}
          >
            Register
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✅ {success}
          </div>
        )}

        {/* Show college loading/error */}
        {!isLogin && collegesLoading && (
          <div className="info-message">
            Loading colleges...
          </div>
        )}

        {!isLogin && !collegesLoading && colleges.length === 0 && (
          <div className="alert alert-warning">
            No colleges found. Please contact administrator.
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>
                <FiMail /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock /> Password
              </label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : 'Login'}
            </button>

            <div className="switch-form">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="link-btn"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>
                <FiUser /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiMail /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiHome /> College
              </label>
              <select
                name="collegeId"
                value={registerData.collegeId}
                onChange={handleRegisterChange}
                required
                disabled={collegesLoading || colleges.length === 0}
              >
                <option value="">
                  {collegesLoading ? 'Loading colleges...' :
                    colleges.length === 0 ? 'No colleges available' :
                      'Select your college'}
                </option>
                {colleges.map(college => (
                  <option key={college._id} value={college._id}>
                    {college.collegeName} ({college.collegeCode})
                  </option>
                ))}
              </select>
              {colleges.length > 0 && (
                <small>
                  {colleges.length} college(s) available
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <FiLock /> Password
              </label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Enter password (min. 6 characters)"
                required
                minLength="6"
              />
              <small>Password must be at least 6 characters long</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || collegesLoading || colleges.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : colleges.length === 0 ? 'No Colleges Available' : 'Create Account'}
            </button>

            <div className="switch-form">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="link-btn"
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;