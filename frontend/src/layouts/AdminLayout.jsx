import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Uzbek terminology per product spec (section 28): Buyurtmalar, Brendlar,
// Menyu, Stollar, Ishchilar, Sozlamalar, Ruxsatlar, etc.
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: '📊 Boshqaruv paneli' },
  { to: '/admin/brands', label: '🏪 Brendlar' },
  { to: '/admin/menu', label: '🍽️ Menyu' },
  { to: '/admin/banners', label: '🖼️ Bannerlar' },
  { to: '/admin/tables', label: '🪑 Stollar' },
  { to: '/admin/orders', label: '📋 Buyurtmalar' },
  { to: '/admin/customers', label: '👥 Mijozlar' },
  { to: '/admin/promocodes', label: '🎟️ Promokodlar' },
  // Roles & Permissions ("Ruxsatlar") are managed per-employee on this same
  // page (see EmployeesPage.jsx) rather than a separate page, since a
  // permission only ever means something in the context of one employee's
  // account — kept as one nav entry rather than two pages that would
  // just link back to each other.
  { to: '/admin/employees', label: "👨‍💼 Ishchilar / Ruxsatlar" },
  { to: '/admin/settings', label: '⚙️ Sozlamalar' }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: '#fff',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          transform: mobileOpen ? 'translateX(0)' : undefined,
          zIndex: 20,
          overflowY: 'auto'
        }}
        className="admin-sidebar"
      >
        <div style={{ padding: '20px 16px', fontWeight: 700, fontSize: 18 }}>
          🍔 Boshqaruv paneli
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: 500,
                background: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--brand-color)' : 'var(--text)'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16, marginTop: 'auto' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            {user?.name} · {user?.role}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
            Chiqish
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 0 }} className="admin-content">
        <header
          className="admin-topbar"
          style={{
            display: 'none',
            padding: 12,
            borderBottom: '1px solid var(--border)',
            background: '#fff'
          }}
        >
          <button className="btn btn-secondary" onClick={() => setMobileOpen(o => !o)}>☰</button>
        </header>
        <main style={{ padding: 20 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 901px) {
          .admin-content { margin-left: var(--sidebar-width); }
        }
        @media (max-width: 900px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform 0.2s; }
          .admin-topbar { display: block !important; }
        }
      `}</style>
    </div>
  );
}
