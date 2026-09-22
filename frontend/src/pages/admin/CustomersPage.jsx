import React, { useEffect, useState } from 'react';
import { getCustomers, updateCustomerStatus } from '../../services/customerService';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    getCustomers(search).then(res => setCustomers(res.customers)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(load, [search]);

  async function toggleStatus(customer) {
    try { await updateCustomerStatus(customer._id, !customer.isActive); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Mijozlar</h2>
      <input
        className="input"
        style={{ maxWidth: 280 }}
        placeholder="Ism yoki telefon bo'yicha qidirish"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {error && <div className="error-text">{error}</div>}
      {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {!loading && !customers.length && <div className="empty-state">Mijozlar topilmadi</div>}

      {!loading && customers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 8 }}>Ism</th>
                <th style={{ padding: 8 }}>Familiya</th>
                <th style={{ padding: 8 }}>Telefon</th>
                <th style={{ padding: 8 }}>Manzil</th>
                <th style={{ padding: 8 }}>Ball</th>
                <th style={{ padding: 8 }}>Buyurtmalar</th>
                <th style={{ padding: 8 }}>Jami summa</th>
                <th style={{ padding: 8 }}>Holat</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>{c.surname || '—'}</td>
                  {/* Guest customers may still have no phone until the profile is saved. */}
                  <td style={{ padding: 8, color: c.phone ? 'inherit' : 'var(--text-muted)' }}>
                    {c.phone || "Ko'rsatilmagan (mehmon)"}
                  </td>
                  <td style={{ padding: 8 }}>{c.address || '—'}</td>
                  <td style={{ padding: 8 }}>{c.points}</td>
                  <td style={{ padding: 8 }}>{c.totalOrders || 0}</td>
                  <td style={{ padding: 8 }}>{Number(c.totalSpent || 0).toLocaleString()} so‘m</td>
                  <td style={{ padding: 8 }}><span className="status-badge" style={{ background: c.isActive ? '#e3f4e8' : '#fae5e5', color: c.isActive ? '#2f7048' : '#984040' }}>{c.isActive ? 'Aktiv' : 'Bloklangan'}</span></td>
                  <td style={{ padding: 8 }}><button className="btn btn-secondary" onClick={() => toggleStatus(c)}>{c.isActive ? 'Bloklash' : 'Blokdan chiqarish'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
