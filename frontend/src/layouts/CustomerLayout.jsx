import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function CustomerLayout() {
  const { cart } = useCart();
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 70 }}>
      <Outlet />

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span>🏠</span>
          <span>Bosh sahifa</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span>📋</span>
          <span>Buyurtmalarim</span>
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span style={{ position: 'relative' }}>
            🛒
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </span>
          <span>Savat</span>
        </NavLink>
      </nav>
    </div>
  );
}
