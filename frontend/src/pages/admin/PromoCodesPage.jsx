import React, { useEffect, useState } from 'react';
import BrandSelector from '../../components/BrandSelector.jsx';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '../../services/promoCodeService';

const EMPTY = { code: '', discountType: 'percent', discountValue: '', minOrder: 0, maxDiscount: '', expiresAt: '', usageLimit: '' };

export default function PromoCodesPage() {
  const [brandId, setBrandId] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  function load() {
    if (!brandId) return;
    getPromoCodes(brandId).then(res => setPromoCodes(res.promoCodes)).catch(err => setError(err.message));
  }
  useEffect(load, [brandId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await createPromoCode({ ...form, brand: brandId });
      setForm(EMPTY);
      load();
    } catch (err) { setError(err.message); }
  }
  async function toggleActive(p) {
    try { await updatePromoCode(p._id, { isActive: !p.isActive }); load(); } catch (err) { setError(err.message); }
  }
  async function handleDelete(id) {
    if (!window.confirm("Promokodni o'chirishga ishonchingiz komilmi?")) return;
    try { await deletePromoCode(id); load(); } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Promokodlar</h2>
      <BrandSelector value={brandId} onChange={setBrandId} />
      {error && <div className="error-text">{error}</div>}

      {brandId && (
        <>
          <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Kod</label>
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Turi</label>
                <select className="input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                  <option value="percent">Foiz (%)</option>
                  <option value="fixed">Belgilangan summa</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chegirma qiymati</label>
                <input type="number" className="input" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Min buyurtma</label>
                <input type="number" className="input" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Maks chegirma</label>
                <input type="number" className="input" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Amal qilish muddati</label>
                <input type="date" className="input" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ishlatish limiti</label>
                <input type="number" className="input" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} min={0} />
              </div>
            </div>
            <button className="btn btn-primary">Qo'shish</button>
          </form>

          <div style={{ marginTop: 16 }}>
            {!promoCodes.length && <div className="empty-state">Promokodlar yo'q</div>}
            {promoCodes.map(p => (
              <div key={p._id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{p.code}</strong> — {p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} so'm`}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Tugash: {new Date(p.expiresAt).toLocaleDateString()} · Ishlatilgan: {p.usedCount}{p.usageLimit ? `/${p.usageLimit}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => toggleActive(p)}>{p.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(p._id)}>O'chirish</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
