import React, { useEffect, useState } from 'react';
import { getBrands } from '../../services/brandService';

export default function RestaurantsPage() {
  const [brands, setBrands] = useState([]);
  const [view, setView] = useState('list');
  const [city, setCity] = useState('Андижан');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBrands().then(res => setBrands(res.brands || [])).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const cities = [...new Set(brands.map(b => b.city || 'Андижан'))];

  return <div style={{ paddingBottom: 100 }}>
    <div className="top-bar"><strong>Рестораны</strong><button className="btn btn-secondary" onClick={() => history.back()}>Закрыть</button></div>
    <div className="container" style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}>Списком</button>
        <button className={`btn ${view === 'map' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('map')}>На карте</button>
        {cities.length > 0 && <select className="input" style={{ maxWidth: 150 }} value={city} onChange={e => setCity(e.target.value)}><option value="Андижан">Андижан</option>{cities.filter(c => c !== 'Андижан').map(c => <option key={c}>{c}</option>)}</select>}
      </div>

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error && <div className="error-text">{error}</div>}

      {!loading && view === 'map' && <div className="card">
        <h3 style={{ marginTop: 0 }}>На карте</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {brands.filter(b => (b.city || 'Андижан') === city).map(b => <div key={b._id}><strong>{b.name}</strong><div style={{ color: 'var(--text-muted)' }}>{b.address}</div></div>)}
          {!brands.length && <div className="empty-state">Рестораны пока не добавлены</div>}
        </div>
      </div>}

      {!loading && view === 'list' && brands.filter(b => (b.city || 'Андижан') === city).map(b => <div className="card" key={b._id} style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{b.name}</h3>
        <div style={{ marginTop: 5, color: 'var(--text-muted)' }}>{b.address || 'Адрес не указан'}</div>
        <div style={{ marginTop: 12, fontWeight: 650 }}>График работы</div>
        <div style={{ marginTop: 4 }}>🕐 {b.openingHours || 'Не указан'}</div>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => window.location.href = `/brand/${b._id}`}>Посмотреть филиал</button>
      </div>)}

      {!loading && !brands.length && <div className="empty-state">Рестораны пока не добавлены</div>}

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ fontSize: 28, fontWeight: 850 }}>{brands[0]?.deliveryTimeText || '26 мин.'}</div>
        <div style={{ fontWeight: 700 }}>Среднее время доставки</div>
        <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>{brands[0]?.deliveryPromoText || 'Если не успеем за 35 минут, пришлем промокод на бесплатную пиццу'}</div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>Данные за последние 7 дней</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {brands[0]?.yandexMapsUrl && <a className="btn btn-secondary" href={brands[0].yandexMapsUrl} target="_blank" rel="noreferrer">Yandex Maps</a>}
        {brands[0]?.yandexNavigatorUrl && <a className="btn btn-secondary" href={brands[0].yandexNavigatorUrl} target="_blank" rel="noreferrer">Yandex Navigator</a>}
        {brands[0]?.googleMapsUrl && <a className="btn btn-secondary" href={brands[0].googleMapsUrl} target="_blank" rel="noreferrer">Google Maps</a>}
      </div>
    </div>
  </div>;
}
