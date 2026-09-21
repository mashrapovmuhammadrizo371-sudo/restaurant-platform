import React, { useEffect, useState } from 'react';
import { getOrders, acceptOrder, rejectOrder, assignCourier } from '../../services/orderService';
import { getCouriers } from '../../services/courierService';
import { useAuth } from '../../context/AuthContext.jsx';
import { connectSocket } from '../../services/socket';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function OperatorPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    getOrders().then(res => setOrders(res.orders)).catch(err => setError(err.message)).finally(() => setLoading(false));
    getCouriers({ availability: 'bo_shman' }).then(res => setCouriers(res.couriers)).catch(() => {});
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('staffToken');
    if (!token || !user) return;
    const socket = connectSocket(token);
    (user.brands || []).forEach(brandId => socket.emit('watch:brand', brandId));
    socket.on('order:new', load);
    return () => socket.off('order:new', load);
  }, [user]);

  async function handleAccept(id) { try { await acceptOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleReject(id) { try { await rejectOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleAssign(id, courierId) {
    if (!courierId) return;
    try { await assignCourier(id, courierId); load(); } catch (err) { setError(err.message); }
  }

  const newOrders = orders.filter(o => o.status === 'new');
  const activeDeliveries = orders.filter(o => ['accepted', 'delivering'].includes(o.status) && o.orderType === 'delivery');

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      {error && <div className="error-text">{error}</div>}

      <h3 style={{ marginTop: 0 }}>🆕 Yangi buyurtmalar</h3>
      {!newOrders.length && <div className="empty-state">Yangi buyurtmalar yo'q</div>}
      {newOrders.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {/* contactPhone is collected at checkout regardless of whether
                the customer's account has a phone (customers can enter with
                just a name), so it's the reliable number to call — prefer
                it over the account's phone, which may not exist. */}
            {o.customer?.name || 'Mehmon'} · 📞 {o.contactPhone || o.customer?.phone || "noma'lum"} ·{' '}
            {o.orderType === 'delivery' ? o.deliveryAddress : `Stol #${o.table?.number}`}
          </div>
          <ul style={{ fontSize: 13, margin: '6px 0' }}>
            {o.items.map((it, idx) => <li key={idx}>{it.name} × {it.quantity}</li>)}
          </ul>
          <div style={{ fontWeight: 700 }}>{o.total.toLocaleString()} so'm · {o.paymentMethod}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => handleAccept(o._id)}>Qabul qilish</button>
            <button className="btn btn-danger" onClick={() => handleReject(o._id)}>Rad etish</button>
          </div>
        </div>
      ))}

      <h3>🚚 Yetkazib berish nazorati</h3>
      {!activeDeliveries.length && <div className="empty-state">Faol yetkazib berish yo'q</div>}
      {activeDeliveries.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{o.deliveryAddress}</div>
          <div style={{ fontSize: 13 }}>📞 {o.contactPhone || o.customer?.phone || "noma'lum"}</div>
          {!o.courier && o.status === 'accepted' && (
            <select className="input" style={{ marginTop: 8 }} onChange={e => handleAssign(o._id, e.target.value)} defaultValue="">
              <option value="" disabled>Kuryer tayinlash</option>
              {couriers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          {o.courier && <div style={{ fontSize: 13, marginTop: 6 }}>Kuryer: {o.courier.name} ({o.courier.phone})</div>}
        </div>
      ))}
    </div>
  );
}
