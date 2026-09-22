import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../../services/brandService';
import BrandCard from '../../components/BrandCard.jsx';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function BrandListPage() {
  const { customer } = useCustomerAuth();
  const { t } = useLanguage();
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
    <div>
      <div className="top-bar">
        <div style={{ fontWeight: 700 }}>{t('welcome')}, {customer?.name}! 👋</div>
        <Link to="/settings" className="btn btn-secondary">⚙️</Link>
      </div>

      <div className="container" style={{ paddingTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Brendlar</h3>
        {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        {error && <div className="error-text">{error}</div>}
        {!loading && !brands.length && <div className="empty-state">Hozircha brendlar mavjud emas</div>}
        <div className="brand-grid">
          {brands.map(b => <BrandCard key={b._id} brand={b} />)}
        </div>
      </div>
    </div>
  );
}
