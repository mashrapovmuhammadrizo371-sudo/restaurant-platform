import React, { useEffect, useState } from 'react';
import { getBrands } from '../../services/brandService';
import { useLanguage } from '../../context/LanguageContext.jsx';
import api from '../../services/api';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';
import LocationInput from '../../components/LocationInput.jsx';

const LANGUAGE_LABELS = { uz: "O'zbek", ru: 'Русский', en: 'English' };

const LEGAL_TEXT = {
  terms: {
    uz: "Ushbu platformadan foydalanish orqali siz buyurtma berish, yetkazib berish va to'lov shartlariga rozilik bildirasiz. Narxlar va mahsulot mavjudligi oldindan ogohlantirmasdan o'zgarishi mumkin.",
    ru: 'Используя эту платформу, вы соглашаетесь с условиями оформления заказа, доставки и оплаты. Цены и наличие товаров могут меняться без предварительного уведомления.',
    en: 'By using this platform, you agree to the ordering, delivery, and payment terms described here. Prices and item availability may change without prior notice.'
  },
  privacy: {
    uz: "Buyurtma berish uchun taqdim etilgan ma'lumotlar (ism, manzil, telefon raqami) faqat buyurtmangizni bajarish uchun ishlatiladi va uchinchi shaxslarga sotilmaydi.",
    ru: 'Данные, предоставленные при оформлении заказа (имя, адрес, номер телефона), используются только для выполнения вашего заказа и не передаются третьим лицам.',
    en: 'Information provided when ordering (name, address, phone number) is used only to fulfill your order and is not sold to third parties.'
  }
};

// Customer-side Settings. Profile data is saved to the current anonymous
// customer account so the main admin Customers panel can see it.
export default function SettingsPage() {
  const { language, setLanguage, t, available } = useLanguage();
  const { customer } = useCustomerAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openLegal, setOpenLegal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customerProfile')) || { name: '', surname: '', phone: '', address: '', latitude: null, longitude: null };
    } catch {
      return { name: '', surname: '', phone: '', address: '', latitude: null, longitude: null };
    }
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    getBrands()
      .then(res => setBrands(res.brands))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateProfile(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    if (!/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(profile.phone)) {
      setLocationError("Telefon raqami faqat +998 XX XXX XX XX formatida bo'lishi kerak.");
      return;
    }
    try {
      const res = await api.put('/customers/me', {
        name: profile.name,
        surname: profile.surname,
        phone: profile.phone,
        address: profile.address
      });
      const saved = {
        ...profile,
        name: res.customer.name || '',
        surname: res.customer.surname || '',
        phone: res.customer.phone || '',
        address: res.customer.address || ''
      };
      localStorage.setItem('customerProfile', JSON.stringify(saved));
      setProfile(saved);
      setLocationError('');
      alert('Mijoz saqlandi');
    } catch (err) {
      setLocationError(err.message || "Mijozni saqlab bo'lmadi.");
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError(t('locationNotSupported'));
      return;
    }
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        let address = '';
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`
          );
          if (response.ok) {
            const data = await response.json();
            address = [
              data.locality,
              data.city,
              data.principalSubdivision,
              data.countryName
            ].filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index).join(', ');
          }
        } catch {
          // Coordinates are still saved even if address lookup fails.
        }
        setProfile(prev => {
          const next = { ...prev, latitude, longitude, ...(address ? { address } : {}) };
          localStorage.setItem('customerProfile', JSON.stringify(next));
          return next;
        });
        setLocationLoading(false);
      },
      err => {
        const messages = {
          1: t('locationPermissionDenied'),
          2: t('locationUnavailable'),
          3: t('locationTimeout')
        };
        setLocationError(messages[err.code] || t('locationUnavailable'));
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function clearProfile() {
    const empty = { name: '', surname: '', phone: '', address: '', latitude: null, longitude: null };
    localStorage.removeItem('customerProfile');
    setProfile(empty);
    setLocationError('');
  }

  function toggleLegal(key) {
    setOpenLegal(prev => (prev === key ? null : key));
  }

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 90 }}>
      <h2 style={{ marginTop: 0 }}>⚙️ {t('settings')}</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }} onClick={() => setProfileOpen(prev => !prev)}>
          <span>👤 {t('profile')}</span><span>{profileOpen ? '−' : '+'}</span>
        </button>
      </div>

      {profileOpen && <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label">{t('profileInfo')}</div>
        <div className="form-group">
          <label className="form-label">{t('name')}</label>
          <input className="input" value={profile.name} onChange={e => updateProfile('name', e.target.value)} placeholder={t('namePlaceholder')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('surname')}</label>
          <input className="input" value={profile.surname} onChange={e => updateProfile('surname', e.target.value)} placeholder={t('surnamePlaceholder')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('phone')}</label>
          <input className="input" type="tel" inputMode="numeric" value={profile.phone || '+998 '} onFocus={() => { if (!profile.phone) updateProfile('phone', '+998 '); }} onChange={e => updateProfile('phone', formatUzPhoneInput(e.target.value))} placeholder={UZ_PHONE_PLACEHOLDER} maxLength={17} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('address')}</label>
          <LocationInput rows={3} value={profile.address} onChange={address => updateProfile('address', address)} placeholder={t('addressPlaceholder')} />
        </div>

        <button type="button" className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={detectLocation} disabled={locationLoading}>
          📍 {locationLoading ? t('detectingLocation') : t('detectLocation')}
        </button>
        {locationError && <div className="error-text">{locationError}</div>}
        {profile.latitude && profile.longitude && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            📌 {t('locationDetected')}: {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
          </div>
        )}

        <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={saveProfile}>
          💾 {t('saveProfile')}
        </button>
        <button type="button" className="btn" style={{ width: '100%', marginTop: 8, background: 'transparent', color: 'var(--danger)' }} onClick={clearProfile}>
          {t('clearProfile')}
        </button>
      </div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>{t('language')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {available.map(code => (
            <button key={code} type="button" className={`btn ${language === code ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLanguage(code)}>
              {LANGUAGE_LABELS[code] || code}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>{t('restaurantInfo')}</div>
        {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        {error && <div className="error-text">{error}</div>}
        {!loading && !brands.length && <div className="empty-state">{t('noBrandSelected')}</div>}
        {brands.map(b => (
          <div key={b._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700 }}>{b.name}</div>
            {b.phone && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('restaurantPhone')}: {b.phone}</div>}
            {b.address && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('restaurantAddress')}: {b.address}</div>}
            {b.openingHours && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{b.openingHours}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 6 }}>{t('deliveryConditions')}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('deliveryConditionsText')}</div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 6 }}>{t('paymentMethods')}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('paymentMethodsText')}</div>
      </div>

      <div className="card">
        <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }} onClick={() => toggleLegal('terms')}>
          <span>📄 {t('termsOfUse')}</span><span>{openLegal === 'terms' ? '−' : '+'}</span>
        </button>
        {openLegal === 'terms' && <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 4px' }}>{LEGAL_TEXT.terms[language] || LEGAL_TEXT.terms.uz}</div>}
        <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', display: 'flex', marginTop: 8 }} onClick={() => toggleLegal('privacy')}>
          <span>🔒 {t('privacyPolicy')}</span><span>{openLegal === 'privacy' ? '−' : '+'}</span>
        </button>
        {openLegal === 'privacy' && <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 4px' }}>{LEGAL_TEXT.privacy[language] || LEGAL_TEXT.privacy.uz}</div>}
      </div>
    </div>
  );
}
