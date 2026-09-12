import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/customer/me')
      .then(res => setCustomer(res.customer))
      .catch(() => localStorage.removeItem('customerToken'))
      .finally(() => setLoading(false));
  }, []);

  async function register(name, phone, password) {
    const res = await api.post('/auth/customer/register', { name, phone, password });
    localStorage.setItem('customerToken', res.token);
    setCustomer(res.customer);
    return res.customer;
  }

  async function login(phone, password) {
    const res = await api.post('/auth/customer/login', { phone, password });
    localStorage.setItem('customerToken', res.token);
    setCustomer(res.customer);
    return res.customer;
  }

  function logout() {
    localStorage.removeItem('customerToken');
    setCustomer(null);
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, register, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
