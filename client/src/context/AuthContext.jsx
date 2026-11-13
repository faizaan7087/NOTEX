import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('notex_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('notex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('notex_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res && res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('notex_user', JSON.stringify(res.user));
          } else if (res && res.status === 401) {
            localStorage.removeItem('notex_token');
            localStorage.removeItem('notex_user');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('[Auth init] Session validation notice:', err.message);
          // ONLY clear session if server explicitly responded with 401 Unauthorized
          if (err.status === 401) {
            localStorage.removeItem('notex_token');
            localStorage.removeItem('notex_user');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('notex_user');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      if (res.user) {
        localStorage.setItem('notex_user', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginWithGoogle = async (googlePayload) => {
    const res = await api.googleAuth(googlePayload);
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      if (res.user) {
        localStorage.setItem('notex_user', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('notex_token', res.token);
      if (res.user) {
        localStorage.setItem('notex_user', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('notex_token');
    localStorage.removeItem('notex_user');
    localStorage.removeItem('notex_ai_study_chat_history');
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
