import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
const CustomerAuthContext = createContext(null);
export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const token = localStorage.getItem('customerToken');
      if (!token) { if (!cancelled) setLoading(false); return; }
      try {
        const res = await api.get('/auth/customer/me');
        if (!cancelled) setCustomer(res.customer);
      } catch (err) {
        if (err.status === 401) localStorage.removeItem('customerToken');
        else if (!cancelled) setError('network');
      } finally { if (!cancelled) setLoading(false); }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);
  async function retry() {
    setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) return;
      const res = await api.get('/auth/customer/me');
      setCustomer(res.customer);
    } catch (err) {
      if (err.status === 401) { localStorage.removeItem('customerToken'); setCustomer(null); }
      else setError('network');
    } finally { setLoading(false); }
  }
  async function register(name, surname, phone, password, address = '', recaptchaToken = '') {
    const res = await api.post('/auth/customer/register', { name, surname, phone, password, address, recaptchaToken });
    localStorage.setItem('customerToken', res.token); setCustomer(res.customer); setError('');
    return res.customer;
  }
  async function login(phone, password) {
    const res = await api.post('/auth/customer/login', { phone, password });
    localStorage.setItem('customerToken', res.token); setCustomer(res.customer); setError('');
    return res.customer;
  }
  function logout() { localStorage.removeItem('customerToken'); setCustomer(null); }
  return <CustomerAuthContext.Provider value={{ customer, loading, error, retry, register, login, logout }}>{children}</CustomerAuthContext.Provider>;
}
export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}