import React, { useEffect, useState } from 'react';
import BrandSelector from '../../components/BrandSelector.jsx';
import api from '../../services/api';

export default function BannersPage() {
  const [brand, setBrand] = useState(null);
  const [banners, setBanners] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    if (!brand) return;
    setLoading(true);
    api.get('/banners', { params: { brand } })
      .then(res => setBanners(res.banners))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [brand]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!file) return setError('Rasm tanlang');
    setError('');
    const fd = new FormData();
    fd.append('brand', brand);
    fd.append('title', title);
    fd.append('image', file);
    try {
      await api.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setFile(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(banner) {
    await api.put(`/banners/${banner._id}`, { isActive: !banner.isActive });
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Ushbu bannerni o'chirishga ishonchingiz komilmi?")) return;
    await api.delete(`/banners/${id}`);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Bannerlar</h2>
        <BrandSelector value={brand} onChange={setBrand} />
      </div>

      <form onSubmit={handleAdd} className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
        <div className="form-group">
          <label className="form-label">Sarlavha</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Rasm</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary">Qo'shish</button>
      </form>

      {loading && <div className="spinner" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {banners.map(b => (
          <div className="card" key={b._id}>
            <img src={b.image} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
            <div style={{ fontWeight: 600 }}>{b.title || '(sarlavhasiz)'}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => toggleActive(b)}>{b.isActive ? 'Yashirish' : 'Yoqish'}</button>
              <button className="btn btn-danger" onClick={() => handleDelete(b._id)}>O'chirish</button>
            </div>
          </div>
        ))}
        {!loading && banners.length === 0 && <div className="empty-state">Bannerlar yo'q</div>}
      </div>
    </div>
  );
            }
