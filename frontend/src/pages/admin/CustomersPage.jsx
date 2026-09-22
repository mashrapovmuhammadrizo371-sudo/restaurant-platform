import React, { useEffect, useState } from 'react';
import { getCustomers } from '../../services/customerService';

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
                  <td style={{ padding: 8 }}>{c.totalOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
