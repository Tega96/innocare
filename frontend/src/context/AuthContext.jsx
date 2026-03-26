// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios default headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const registerPatient = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register/patient', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      toast.success('Registration successful! Please verify your email and phone.');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const registerDoctor = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register/doctor', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      toast.success('Registration successful! Please verify your email and phone.');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`/api/auth/verify-email/${token}`);
      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      toast.error('Email verification failed');
      return { success: false };
    }
  };

  const verifyPhone = async (userId, code) => {
    try {
      const response = await axios.post('/api/auth/verify-phone', { userId, code });
      toast.success('Phone verified successfully!');
      return { success: true };
    } catch (error) {
      toast.error('Phone verification failed');
      return { success: false };
    }
  };

  const value = {
    user, 
    loading,
    token, 
    login,
    registerPatient,
    registerDoctor,
    logout,
    verifyEmail,
    verifyPhone
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};