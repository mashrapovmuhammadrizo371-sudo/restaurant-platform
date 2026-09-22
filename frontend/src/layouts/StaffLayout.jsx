import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffLayout({ title, children }) {
  const { user, logout } = useAuth();
  const initial = (user?.name || 'I').slice(0, 1).toUpperCase();

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <div className="staff-brand-mark">R</div>
          <div>
            <div className="staff-brand-title">Restaurant</div>
            <div className="staff-brand-subtitle">Ishchi paneli</div>
          </div>
        </div>

        <div className="staff-sidebar-label">ISHCHI PANELI</div>
        <div className="staff-role-card">
          <div className="staff-role-icon">◉</div>
          <div>
            <strong>{title}</strong>
            <span>{user?.role || 'staff'}</span>
          </div>
        </div>

        <div className="staff-sidebar-note">
          <span className="staff-online-dot" />
          Tizimga ulangan
        </div>

        <div className="staff-sidebar-footer">
          <div className="staff-user-card">
            <div className="staff-user-avatar">{initial}</div>
            <div className="staff-user-info">
              <strong>{user?.name || 'Ishchi'}</strong>
              <span>{user?.role || 'staff'}</span>
            </div>
          </div>
          <button className="staff-logout" onClick={logout}>
            <span>↪</span> Chiqish
          </button>
        </div>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <div>
            <div className="staff-topbar-title">{title}</div>
            <div className="staff-topbar-subtitle">Restaurant · Ishchi paneli</div>
          </div>
          <div className="staff-topbar-user">
            <div className="staff-user-avatar">{initial}</div>
            <div>
              <strong>{user?.name || 'Ishchi'}</strong>
              <small>{user?.role || 'staff'}</small>
            </div>
          </div>
        </header>

        <main className="staff-page">
          {children}
        </main>
      </div>
    </div>
  );
}
