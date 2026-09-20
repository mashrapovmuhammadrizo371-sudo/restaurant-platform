import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../../services/brandService';
import BrandCard from '../../components/BrandCard.jsx';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';

export default function BrandListPage() {
  const { customer } = useCustomerAuth();
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
        <div>
          <div style={{ fontWeight: 700 }}>Salom, {customer?.name}! 👋</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer?.points || 0} ball</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/leaderboard" className="btn btn-secondary">🏆</Link>
          <Link to="/profile" className="btn btn-secondary">👤</Link>
        </div>
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
