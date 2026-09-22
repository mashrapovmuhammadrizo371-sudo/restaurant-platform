import React, { useEffect, useState } from 'react';
import { getCustomers, updateCustomerStatus, updateCustomer, deleteCustomer } from '../../services/customerService';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    getCustomers(search).then(res => setCustomers(res.customers)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(load, [search]);

  async function toggleStatus(customer) {
    try { await updateCustomerStatus(customer._id, !customer.isActive); setOpenMenu(null); load(); }
    catch (err) { setError(err.message); }
  }

  async function removeCustomer(customer) {
    if (!window.confirm(`Mijoz "${customer.name}"ni butunlay o‘chirishni xohlaysizmi? Bu amalni qaytarib bo‘lmaydi.`)) return;
    try { await deleteCustomer(customer._id); setOpenMenu(null); load(); }
    catch (err) { setError(err.message); }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await updateCustomer(editing._id, {
        name: editing.name,
        surname: editing.surname,
        phone: editing.phone,
        address: editing.address
      });
      setEditing(null);
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Mijozlar</h2>
      <input className="input" style={{ maxWidth: 280 }} placeholder="Ism yoki telefon bo‘yicha qidirish" value={search} onChange={e => setSearch(e.target.value)} />

      {error && <div className="error-text">{error}</div>}
      {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {!loading && !customers.length && <div className="empty-state">Mijozlar topilmadi</div>}

      {!loading && customers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 8 }}>Ism</th><th style={{ padding: 8 }}>Familiya</th><th style={{ padding: 8 }}>Telefon</th>
                <th style={{ padding: 8 }}>Manzil</th><th style={{ padding: 8 }}>Buyurtmalar</th><th style={{ padding: 8 }}>Jami summa</th>
                <th style={{ padding: 8 }}>Holat</th><th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>{c.surname || '—'}</td>
                  <td style={{ padding: 8, color: c.phone ? 'inherit' : 'var(--text-muted)' }}>{c.phone || "Ko‘rsatilmagan (mehmon)"}</td>
                  <td style={{ padding: 8 }}>{c.address || '—'}</td>
                  <td style={{ padding: 8 }}>{c.totalOrders || 0}</td>
                  <td style={{ padding: 8 }}>{Number(c.totalSpent || 0).toLocaleString()} so‘m</td>
                  <td style={{ padding: 8 }}><span className="status-badge" style={{ background: c.isActive ? '#e3f4e8' : '#fae5e5', color: c.isActive ? '#2f7048' : '#984040' }}>{c.isActive ? 'Aktiv' : 'Bloklangan'}</span></td>
                  <td style={{ padding: 8, position: 'relative' }}>
                    <button type="button" className="btn btn-secondary" style={{ minWidth: 42, padding: '6px 10px', fontSize: 20, lineHeight: 1 }} onClick={() => setOpenMenu(openMenu === c._id ? null : c._id)}>⋯</button>
                    {openMenu === c._id && (
                      <div style={{ position: 'absolute', right: 8, top: 44, zIndex: 20, minWidth: 190, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, boxShadow: 'var(--shadow-md)' }}>
                        <button className="btn" style={{ width: '100%', textAlign: 'left', background: 'transparent' }} onClick={() => { setEditing({ ...c }); setOpenMenu(null); }}>✏️ Tahrirlash</button>
                        <button className="btn" style={{ width: '100%', textAlign: 'left', background: 'transparent' }} onClick={() => toggleStatus(c)}>{c.isActive ? '🚫 Bloklash' : '🔓 Blokdan ochish'}</button>
                        <button className="btn" style={{ width: '100%', textAlign: 'left', background: 'transparent', color: 'var(--danger)' }} onClick={() => removeCustomer(c)}>🗑️ Butunlay o‘chirish</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setEditing(null)}>
          <form className="card" style={{ width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto' }} onSubmit={saveEdit} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Mijozni tahrirlash</h3>
            <div className="form-group"><label className="form-label">Ism</label><input className="input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Familiya</label><input className="input" value={editing.surname || ''} onChange={e => setEditing({ ...editing, surname: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Telefon</label><input className="input" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="+998 XX XXX XX XX" /></div>
            <div className="form-group"><label className="form-label">Manzil</label><textarea className="input" rows={3} value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Saqlash</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
