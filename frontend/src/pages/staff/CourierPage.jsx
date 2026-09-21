import React, { useEffect, useState } from 'react';
import { getOrders, startDelivery, completeDelivery } from '../../services/orderService';
import { setMyAvailability } from '../../services/courierService';
import { useAuth } from '../../context/AuthContext.jsx';
import { connectSocket } from '../../services/socket';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function CourierPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [availability, setAvailability] = useState(user?.courierAvailability || 'bandman');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    getOrders().then(res => setOrders(res.orders)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('staffToken');
    if (!token) return;
    const socket = connectSocket(token);
    socket.on('order:assigned', load);
    return () => socket.off('order:assigned', load);
  }, []);

  async function toggleAvailability() {
    const next = availability === 'bo_shman' ? 'bandman' : 'bo_shman';
    setError('');
    try {
      await setMyAvailability(next);
      setAvailability(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStart(id) { try { await startDelivery(id); load(); } catch (err) { setError(err.message); } }
  async function handleComplete(id) { try { await completeDelivery(id); load(); } catch (err) { setError(err.message); } }

  const myOrders = orders.filter(o => ['accepted', 'delivering'].includes(o.status));

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>Holat</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {availability === 'bo_shman' ? "Bo'shman (buyurtma qabul qilaman)" : 'Bandman (band)'}
          </div>
        </div>
        <button className={`btn ${availability === 'bo_shman' ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleAvailability}>
          {availability === 'bo_shman' ? "Bo'shman" : 'Bandman'}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <h3>Buyurtmalarim</h3>
      {!myOrders.length && <div className="empty-state">Tayinlangan buyurtmalar yo'q</div>}
      {myOrders.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{o.deliveryAddress}</div>
          {/* contactPhone is collected at checkout regardless of whether
              the customer's account has a phone (customers can enter with
              just a name), so it's the reliable number to call — prefer
              it over the account's phone, which may not exist. */}
          <div style={{ fontSize: 13 }}>{o.customer?.name} · 📞 {o.contactPhone || o.customer?.phone || "noma'lum"}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{o.total.toLocaleString()} so'm · {o.paymentMethod}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {o.status === 'accepted' && <button className="btn btn-primary" onClick={() => handleStart(o._id)}>Yetkazishni boshlash</button>}
            {o.status === 'delivering' && <button className="btn btn-primary" onClick={() => handleComplete(o._id)}>Yetkazildi</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
