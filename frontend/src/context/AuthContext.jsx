import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rc_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('rc_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize auth state on mount if token exists
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('rc_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('rc_user', JSON.stringify(res.data.user));
        } else if (res.data) {
          setUser(res.data);
          localStorage.setItem('rc_user', JSON.stringify(res.data));
        }
      } catch (err) {
        // If 401, axios interceptor or this catch will clear invalid credentials
        console.warn('Auth verification failed:', err?.response?.data?.error || err.message);
        localStorage.removeItem('rc_token');
        localStorage.removeItem('rc_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const resToken = res.data.token;
    const resUser = res.data.user || res.data;

    if (resToken) {
      localStorage.setItem('rc_token', resToken);
      setToken(resToken);
    }
    if (resUser) {
      localStorage.setItem('rc_user', JSON.stringify(resUser));
      setUser(resUser);
    }
    return resUser;
  };

  const register = async (name, email, password, role) => {
    const payload = { name, email, password, role };
    const res = await api.post('/auth/register', payload);
    return res.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('rc_token');
    localStorage.removeItem('rc_user');
    setUser(null);
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(user && token);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
