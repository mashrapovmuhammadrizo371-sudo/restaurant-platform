import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const CustomerAuthContext = createContext(null);

// How many times to retry a transient failure (network error, backend
// cold start on Render's free tier) before giving up, and how long to
// wait between attempts — applies to both restoring an existing session
// and silently creating a new anonymous one.
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    // Customer registration/login is temporarily removed: there is no
    // login page and nothing for the visitor to do. On first load, if
    // there's no stored session yet, one is created silently in the
    // background (POST /auth/customer/guest with no name — see
    // authController.customerGuest) so browsing/ordering is available
    // immediately. The returned JWT, kept in localStorage, is the
    // "secure session identifier stored on the device" used later to
    // look up "My Orders" — no separate mechanism for that.
    async function ensureSession() {
      const existingToken = localStorage.getItem('customerToken');

      if (existingToken) {
        for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
          try {
            const res = await api.get('/auth/customer/me');
            if (!cancelled) setCustomer(res.customer);
            return;
          } catch (err) {
            if (err.status === 403) {
              if (!cancelled) setError('blocked');
              return;
            }
            if (err.status === 401) {
              // Token really is invalid/expired — fall through and
              // create a fresh anonymous session below instead of
              // leaving the visitor stuck.
              localStorage.removeItem('customerToken');
              break;
            }
            if (attempt < RETRY_ATTEMPTS) {
              await delay(RETRY_DELAY_MS);
              continue;
            }
            // Gave up after retries on a transient failure (not a 401).
            // Don't create a second session on top of a possibly-still-
            // valid one — just surface the failure and let the visitor
            // retry (e.g. reload), same as before.
            if (!cancelled) setError('network');
            return;
          }
        }
      }

      // No token, or the old one was rejected: create a new anonymous
      // session automatically.
      for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
        try {
          const res = await api.post('/auth/customer/guest', {});
          if (!cancelled) {
            localStorage.setItem('customerToken', res.token);
            setCustomer(res.customer);
          }
          return;
        } catch (err) {
          if (attempt < RETRY_ATTEMPTS) {
            await delay(RETRY_DELAY_MS);
            continue;
          }
          if (!cancelled) setError('network');
        }
      }
    }

    ensureSession().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Manual retry for the rare case ensureSession() gave up above (e.g.
  // the backend was unreachable for the whole retry window).
  async function retry() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/customer/guest', {});
      localStorage.setItem('customerToken', res.token);
      setCustomer(res.customer);
    } catch (err) {
      setError('network');
    } finally {
      setLoading(false);
    }
  }

  // Kept for a possible future full-account flow (e.g. a mobile app) —
  // not currently used by the customer-facing UI, which relies entirely
  // on the automatic anonymous session above.
  async function register(name, surname, phone, password, address = '', recaptchaToken = '') {
    const res = await api.post('/auth/customer/register', { name, surname, phone, password, address, recaptchaToken });
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
    <CustomerAuthContext.Provider value={{ customer, loading, error, retry, register, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
