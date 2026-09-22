import React, { createContext, useContext, useEffect, useState } from 'react';
import { staffLogin as staffLoginApi, staffMe } from '../services/authService';

const AuthContext = createContext(null);

// How many times to retry a transient (non-401) failure of the
// session-restore call before giving up for this page load, and how
// long to wait between attempts. Covers backend cold starts (e.g.
// Render free-tier services that sleep when idle).
const ME_RETRY_ATTEMPTS = 2;
const ME_RETRY_DELAY_MS = 1500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        setLoading(false);
        return;
      }

      for (let attempt = 0; attempt <= ME_RETRY_ATTEMPTS; attempt += 1) {
        try {
          const res = await staffMe();
          if (!cancelled) setUser(res.user);
          break;
        } catch (err) {
          if (err.status === 401) {
            // Backend explicitly says this token is invalid/expired.
            localStorage.removeItem('staffToken');
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
