import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('notex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('notex_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            // Token invalid or expired
            localStorage.removeItem('notex_token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('[Auth init] Session expired or server unavailable:', err.message);
          localStorage.removeItem('notex_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginWithGoogle = async (googlePayload) => {
    const res = await api.googleAuth(googlePayload);
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('notex_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithGoogle,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
