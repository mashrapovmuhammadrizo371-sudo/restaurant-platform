import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useEffect, useState } from 'react';
import { getBrands } from '../services/brandService';

export default function CustomerLayout() {
  const { cart } = useCart();
  const { t, language, setLanguage } = useLanguage();
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [restaurantPhone, setRestaurantPhone] = useState('');

  useEffect(() => {
    getBrands().then(res => setRestaurantPhone(res.brands?.find(b => b.phone)?.phone || '')).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 70 }}>
      <Outlet />
      <button className={'customer-menu-trigger ' + (menuOpen ? 'open' : '')} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      {menuOpen && <div className="customer-menu-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={'customer-side-menu ' + (menuOpen ? 'open' : '')}>
        <div className="customer-menu-head"><strong>Меню</strong><button onClick={() => setMenuOpen(false)}>×</button></div>
        <button className="customer-menu-link" onClick={() => { setMenuOpen(false); window.location.href='/register'; }}>↪ <span>Войти</span></button>
        <button className="customer-menu-link" onClick={() => { setMenuOpen(false); window.location.href='/restaurants'; }}>📍 <span>Рестораны</span></button>
        <a className="customer-menu-link" href={restaurantPhone ? `tel:${restaurantPhone.replace(/[^+0-9]/g, '')}` : undefined} onClick={() => setMenuOpen(false)}>📞 <span>Позвонить нам</span></a>
        <button className="customer-menu-link" onClick={() => { setMenuOpen(false); window.location.href='/settings'; }}>⚙️ <span>Настройки</span></button>
        <div className="customer-language-block">
          <div className="customer-language-title">🌐 Язык</div>
          <div className="customer-language-buttons">
            {[['uz','O‘zbekcha'],['ru','Русский'],['en','English']].map(([code,label]) =>
              <button key={code} className={language === code ? 'active' : ''} onClick={() => { setLanguage(code); setMenuOpen(false); }}>{label}</button>
            )}
          </div>
        </div>
      </aside>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}><span>🏠</span><span>{t('home')}</span></NavLink>
        <NavLink to="/orders" className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}><span>📋</span><span>{t('myOrders')}</span></NavLink>
        <NavLink to="/cart" className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}><span style={{ position: 'relative' }}>🛒{itemCount > 0 && <span className="cart-badge">{itemCount}</span>}</span><span>{t('cart')}</span></NavLink>
      </nav>
    </div>
  );
}
