import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Boshqaruv paneli', icon: '▦' },
  { to: '/admin/brands', label: 'Brendlar', icon: '⌂' },
  { to: '/admin/menu', label: 'Menyu', icon: '☷' },
  { to: '/admin/banners', label: 'Bannerlar', icon: '▧' },
  { to: '/admin/tables', label: 'Stollar', icon: '▥' },
  { to: '/admin/orders', label: 'Buyurtmalar', icon: '◉' },
  { to: '/admin/customers', label: 'Mijozlar', icon: '♙' },
  { to: '/admin/promocodes', label: 'Promokodlar', icon: '◇' },
  { to: '/admin/employees', label: 'Ishchilar / Ruxsatlar', icon: '♧' },
  { to: '/admin/settings', label: 'Sozlamalar', icon: '⚙' }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      <div className={`admin-mobile-backdrop ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />

      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">R</div>
          <div>
            <div className="admin-brand-title">Restaurant</div>
            <div className="admin-brand-subtitle">Boshqaruv paneli</div>
          </div>
          <button className="admin-close-btn" onClick={() => setMobileOpen(false)} aria-label="Menyuni yopish">×</button>
        </div>

        <div className="admin-nav-label">ASOSIY MENYU</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="admin-user-info">
              <strong>{user?.name || 'Admin'}</strong>
              <span>{user?.role || 'admin'}</span>
            </div>
          </div>
          <button className="admin-logout" onClick={logout}>
            <span>↪</span> Chiqish
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Menyuni ochish">☰</button>
          <div className="admin-topbar-title">
            <span>Restaurant</span>
            <small>Admin panel</small>
          </div>
          <div className="admin-topbar-user">
            <div className="admin-user-avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.name || 'Admin'}</strong>
              <small>{user?.role || 'admin'}</small>
            </div>
          </div>
        </header>

        <main className="admin-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
