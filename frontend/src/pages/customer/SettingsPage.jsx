import React, { useEffect, useState } from 'react';
import { getBrands } from '../../services/brandService';
import { useLanguage } from '../../context/LanguageContext.jsx';

const LANGUAGE_LABELS = { uz: "O'zbek", ru: 'Русский', en: 'English' };

// Customer-side Settings. No account/profile/password here by design —
// customer registration/login is temporarily removed, so this page only
// covers what an anonymous visitor actually needs: language, how to
// reach each brand/restaurant, delivery/payment info, and the legal
// pages. Replaces the old account-based ProfilePage.
export default function SettingsPage() {
  const { language, setLanguage, t, available } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBrands()
      .then(res => setBrands(res.brands))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t('settings')}</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>{t('language')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {available.map(code => (
            <button
              key={code}
              type="button"
              className={`btn ${language === code ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLanguage(code)}
            >
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
          📄 {t('termsOfUse')}
        </button>
        <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
          🔒 {t('privacyPolicy')}
        </button>
      </div>
    </div>
  );
}
