import React, { useEffect, useState } from 'react';
import { getOrders, markOrderPaid } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    getOrders().then(res => setOrders(res.orders)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleMarkPaid(id) { try { await markOrderPaid(id); load(); } catch (err) { setError(err.message); } }

  const unpaid = orders.filter(o => o.paymentStatus === 'pending' && o.status !== 'rejected');

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      {error && <div className="error-text">{error}</div>}
      <h3 style={{ marginTop: 0 }}>💵 To'lov kutilayotgan buyurtmalar</h3>
      {!unpaid.length && <div className="empty-state">To'lanmagan buyurtmalar yo'q</div>}
      {unpaid.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {o.customer?.name || 'Mehmon'} · {o.orderType === 'delivery' ? 'Yetkazib berish' : `Stol #${o.table?.number}`}
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{o.total.toLocaleString()} so'm · {o.paymentMethod}</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => handleMarkPaid(o._id)}>
            To'landi deb belgilash
          </button>
        </div>
      ))}
    </div>
  );
}
