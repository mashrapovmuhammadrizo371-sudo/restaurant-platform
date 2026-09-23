import React, { useEffect, useState } from 'react';
import { getStaffBrands, createBrand, updateBrand, deleteBrand } from '../../services/brandService';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';
import LocationInput from '../../components/LocationInput.jsx';

function formatOpeningHours(value) {
  const raw = String(value || '').replace(/\D/g, '').slice(0, 8);

  if (raw.length <= 2) return raw;
  if (raw.length <= 4) return raw.slice(0, 2) + ':' + raw.slice(2);

  const start = raw.slice(0, 4);
  const end = raw.slice(4);

  let formatted = start.slice(0, 2) + ':' + start.slice(2) + ' - ';

  if (end.length <= 2) {
    formatted += end;
  } else {
    formatted += end.slice(0, 2) + ':' + end.slice(2);
  }

  return formatted;
}


const EMPTY = {
  name: '', slug: '', mainColor: '#ff5a1f', phone: '', address: '',
  telegram: '', instagram: '', description: '', openingHours: '', city: 'Андижан', deliveryTimeText: '', deliveryPromoText: '', yandexMapsUrl: '', yandexNavigatorUrl: '', googleMapsUrl: '', logoFile: null
};

export default function BrandsPage() {
  const { user } = useAuth();
  const isBoss = user?.role === 'boss';
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    getStaffBrands().then(res => setBrands(res.brands)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startEdit(b) {
    setEditingId(b._id);
    setForm({ ...EMPTY, ...b, logoFile: null });
  }
  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await updateBrand(editingId, form);
      else await createBrand(form);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Brendni o'chirishga ishonchingiz komilmi?")) return;
    try { await deleteBrand(id); load(); } catch (err) { setError(err.message); }
  }

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Brendlar</h2>

      {(isBoss || editingId) && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nomi</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input
                className="input"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                required
                disabled={!isBoss}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rang</label>
              <input type="color" className="input" value={form.mainColor} onChange={e => setForm({ ...form, mainColor: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon</label>
              <input className="input" type="tel" inputMode="numeric" placeholder={UZ_PHONE_PLACEHOLDER} value={form.phone || '+998 '} onFocus={() => { if (!form.phone) setForm({ ...form, phone: '+998 ' }); }} onChange={e => setForm({ ...form, phone: formatUzPhoneInput(e.target.value) })} maxLength={17} />
            </div>
            <div className="form-group">
              <label className="form-label">Manzil</label>
              <LocationInput value={form.address} onChange={address => setForm({ ...form, address })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ish vaqti</label>
              <input className="input" inputMode="numeric" maxLength={13} value={form.openingHours} onChange={e => setForm({ ...form, openingHours: formatOpeningHours(e.target.value) })} placeholder="09:00 - 23:00" />
            </div>
            <div className="form-group">
              <label className="form-label">Shahar</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">O‘rtacha yetkazish vaqti</label>
              <input className="input" value={form.deliveryTimeText} onChange={e => setForm({ ...form, deliveryTimeText: e.target.value })} placeholder="26 мин." />
            </div>
            <div className="form-group">
              <label className="form-label">Yetkazish promo matni</label>
              <input className="input" value={form.deliveryPromoText} onChange={e => setForm({ ...form, deliveryPromoText: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Yandex Maps</label>
              <input className="input" value={form.yandexMapsUrl} onChange={e => setForm({ ...form, yandexMapsUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Yandex Navigator</label>
              <input className="input" value={form.yandexNavigatorUrl} onChange={e => setForm({ ...form, yandexNavigatorUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Google Maps</label>
              <input className="input" value={form.googleMapsUrl} onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Telegram</label>
              <input className="input" value={form.telegram} onChange={e => setForm({ ...form, telegram: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram</label>
              <input className="input" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Logotip</label>
              <input type="file" accept="image/*" onChange={e => setForm({ ...form, logoFile: e.target.files[0] })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tavsif</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary">{editingId ? 'Yangilash' : "Qo'shish"}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Bekor qilish</button>}
          </div>
        </form>
      )}

      {!brands.length && <div className="empty-state">Brendlar topilmadi</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {brands.map(b => (
          <div key={b._id} className="card" style={{ borderTop: `4px solid ${b.mainColor}` }}>
            {b.logo && <img src={b.logo} alt={b.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10 }} />}
            <div style={{ fontWeight: 700, marginTop: 8 }}>{b.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.address}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => startEdit(b)}>Tahrirlash</button>
              {isBoss && <button className="btn btn-danger" onClick={() => handleDelete(b._id)}>O'chirish</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
