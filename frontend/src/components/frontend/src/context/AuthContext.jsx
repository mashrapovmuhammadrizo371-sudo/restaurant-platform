import React, { createContext, useContext, useEffect, useState } from 'react';
import { staffLogin as staffLoginApi, staffMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    if (!token) {
      setLoading(false);
      return;
    }
    staffMe()
      .then(res => setUser(res.user))
      .catch(() => localStorage.removeItem('staffToken'))
      .finally(() => setLoading(false));
  }, []);

  async function login(loginValue, password) {
    const res = await staffLoginApi(loginValue, password);
    localStorage.setItem('staffToken', res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem('staffToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
