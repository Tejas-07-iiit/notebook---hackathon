import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  
const userData = localStorage.getItem('user');
const user = userData ? JSON.parse(userData) : null;

  if (loading) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;