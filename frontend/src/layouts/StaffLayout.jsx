import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// Lightweight single-page layout for the four operational staff roles
// (operator, courier, ofitsiant, cashier), which don't need the full
// multi-section admin sidebar — each of them lives on exactly one page.
export default function StaffLayout({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: '#fff', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 10
        }}
      >
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Chiqish</button>
        </div>
      </header>
      <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
