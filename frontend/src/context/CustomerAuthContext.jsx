import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const CustomerAuthContext = createContext(null);

// How many times to retry a transient (non-401) failure of the
// session-restore call before giving up for this page load, and how
// long to wait between attempts. Covers backend cold starts (e.g.
// Render free-tier services that sleep when idle).
const ME_RETRY_ATTEMPTS = 2;
const ME_RETRY_DELAY_MS = 1500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setLoading(false);
        return;
      }

      for (let attempt = 0; attempt <= ME_RETRY_ATTEMPTS; attempt += 1) {
        try {
          const res = await api.get('/auth/customer/me');
          if (!cancelled) setCustomer(res.customer);
          break;
        } catch (err) {
          if (err.status === 401) {
            // Backend explicitly says this token is invalid/expired.
            localStorage.removeItem('customerToken');
            break;
          }
          if (attempt < ME_RETRY_ATTEMPTS) {
            await delay(ME_RETRY_DELAY_MS);
            continue;
          }
          // Gave up after retries. Keep the token — this may just be a
          // transient/network failure, not proof the session is invalid.
          // The next reload will try restoring it again.
        }
      }

      if (!cancelled) setLoading(false);
    }

    restoreSession();
    return () => { cancelled = true; };
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
