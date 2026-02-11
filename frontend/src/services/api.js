import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`, // Uses environment variable
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Handle specific errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CORS')) {
      // CORS error
      console.error('CORS Error Detected:', error.response.data);
      alert(`CORS Error: Your origin is not allowed. Please check backend CORS configuration.`);
    }
    
    if (error.message === 'Network Error') {
      console.error('Network Error - Check if backend is running');
      alert(`Cannot connect to server. Make sure backend is running on ${process.env.REACT_APP_API_URL}`);
    }
    
    return Promise.reject(error);
  }
);

export const createCollege = async (collegeData) => {
  const response = await api.post('/colleges', collegeData);
  return response;
};

export const getColleges = async () => {
  const response = await api.get('/colleges');
  return response;
};

export default api;