import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge.jsx';
import { connectSocket } from '../../services/socket';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    getMyOrders()
      .then(res => setOrders(res.orders))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();

    const token = localStorage.getItem('customerToken');
    if (!token) return;
    const socket = connectSocket(token);
    socket.on('order:status', load);
    return () => socket.off('order:status', load);
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Buyurtmalarim</h2>
      {error && <div className="error-text">{error}</div>}
      {!orders.length && <div className="empty-state">Hali buyurtmalar yo'q</div>}
      {orders.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>{o.orderNumber}</div>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {o.brand?.name} · {o.items.length} ta taom · {o.total.toLocaleString()} so'm
          </div>
          {o.orderType === 'delivery' && o.courier && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Kuryer: {o.courier.name} · {o.courier.phone}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date(o.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
