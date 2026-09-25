import React, { useEffect, useState } from 'react';
import {
  getOrders, acceptOrder, rejectOrder, assignCourier, assignWaiter, markOrderPaid
} from '../../services/orderService';
import { getCouriers } from '../../services/courierService';
import { getWaiters } from '../../services/waiterService';
import { getStaffTables } from '../../services/tableService';
import { useAuth } from '../../context/AuthContext.jsx';
import { connectSocket } from '../../services/socket';
import StatusBadge from '../../components/StatusBadge.jsx';

const PAYMENT_LABELS = { naqd: 'Naqd', karta: 'Karta', online: 'Onlayn' };

// Kassir (Cashier) panel. Per the current staff-role spec, Cashier is the
// hub for every order: sees new orders, assigns a free courier for
// delivery or sends a table order to a specific waiter, monitors table
// occupancy, and handles payments. See orderRoutes.js/courierRoutes.js/
// waiterRoutes.js for the additive RBAC changes that make this possible
// (Operator keeps identical access and is unaffected).
export default function CashierPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([
      getOrders(),
      getCouriers({ availability: 'bo_shman' }),
      getWaiters(),
      ...(user?.brands || []).map(b => getStaffTables(b))
    ])
      .then(([ordersRes, couriersRes, waitersRes, ...tableResList]) => {
        setOrders(ordersRes.orders);
        setCouriers(couriersRes.couriers);
        setWaiters(waitersRes.waiters);
        setTables(tableResList.flatMap(r => r.tables));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('staffToken');
    if (!token || !user) return;
    const socket = connectSocket(token);
    const watchBrands = () => (user.brands || []).forEach(brandId => socket.emit('watch:brand', brandId));
    socket.on('connect', watchBrands);
    if (socket.connected) watchBrands();
    socket.on('order:new', load);
    socket.on('table_order:update', load);
    return () => {
      socket.off('connect', watchBrands);
      socket.off('order:new', load);
      socket.off('table_order:update', load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAccept(id) { try { await acceptOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleReject(id) { try { await rejectOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleAssignCourier(id, courierId) {
    if (!courierId) return;
    try { await assignCourier(id, courierId); load(); } catch (err) { setError(err.message); }
  }
  async function handleAssignWaiter(id, waiterId) {
    if (!waiterId) return;
    try { await assignWaiter(id, waiterId); load(); } catch (err) { setError(err.message); }
  }
  async function handleMarkPaid(id) { try { await markOrderPaid(id); load(); } catch (err) { setError(err.message); } }

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const newOrders = orders.filter(o => o.status === 'new');
  const pendingDelivery = orders.filter(o => o.orderType === 'delivery' && o.status === 'accepted' && !o.courier);
  const pendingTable = orders.filter(o => o.orderType === 'table' && o.status === 'accepted' && !o.ofitsiant);
  const unpaid = orders.filter(o => o.paymentStatus === 'pending' && ['delivered', 'completed'].includes(o.status));

  return (
    <div>
      {error && <div className="error-text">{error}</div>}

      <h3 id="orders" style={{ marginTop: 0 }}>🆕 Yangi buyurtmalar</h3>
      {!newOrders.length && <div className="empty-state">Yangi buyurtmalar yo'q</div>}
      {newOrders.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber} · {o.orderType === 'delivery' ? '🚚 Yetkazib berish' : '🍽️ Stol'}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {o.customer?.name || 'Mehmon'} · 📞 {o.contactPhone || o.customer?.phone || "noma'lum"} ·{' '}
            {o.orderType === 'delivery' ? o.deliveryAddress : `Stol #${o.table?.number}`}
          </div>
          <ul style={{ fontSize: 13, margin: '6px 0' }}>
            {o.items.map((it, idx) => <li key={idx}>{it.name} × {it.quantity}</li>)}
          </ul>
          <div style={{ fontWeight: 700 }}>{o.total.toLocaleString()} so'm · {PAYMENT_LABELS[o.paymentMethod]}</div>
          {o.paymentMethod === 'karta' && <div style={{ fontSize: 13, marginTop: 6 }}>💳 Tushgan karta: {o.paymentCardNumber ? o.paymentCardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') : '—'}{o.paymentCardHolder ? ` · ${o.paymentCardHolder}` : ''}</div>}
          {o.paymentMethod === 'karta' && o.receiptImage && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mijoz yuborgan to‘lov cheki</div>
              <a href={o.receiptImage} target="_blank" rel="noreferrer">
                <img src={o.receiptImage} alt="To‘lov cheki" style={{ display: 'block', maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8 }} />
              </a>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => handleAccept(o._id)}>Qabul qilish</button>
            <button className="btn btn-danger" onClick={() => handleReject(o._id)}>Rad etish</button>
          </div>
        </div>
      ))}

      <h3 id="courier">🚚 Kuryer tayinlash kutilmoqda</h3>
      {!pendingDelivery.length && <div className="empty-state">Yo'q</div>}
      {pendingDelivery.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{o.deliveryAddress} · 📞 {o.contactPhone}</div>
          <select className="input" style={{ marginTop: 8 }} onChange={e => handleAssignCourier(o._id, e.target.value)} defaultValue="">
            <option value="" disabled>🟢 Bo'sh kuryer tanlang</option>
            {couriers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {!couriers.length && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Hozircha bo'sh kuryer yo'q</div>}
        </div>
      ))}

      <h3 id="waiter">🍽️ Ofitsiantga yuborish kutilmoqda</h3>
      {!pendingTable.length && <div className="empty-state">Yo'q</div>}
      {pendingTable.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber} · Stol #{o.table?.number}</strong>
            <StatusBadge status={o.status} />
          </div>
          <select className="input" style={{ marginTop: 8 }} onChange={e => handleAssignWaiter(o._id, e.target.value)} defaultValue="">
            <option value="" disabled>Ofitsiantni tanlang</option>
            {waiters.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          {!waiters.length && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Ofitsiantlar topilmadi</div>}
        </div>
      ))}

      <h3 id="tables">🪩 Stollar holati</h3>
      {!tables.length && <div className="empty-state">Stollar topilmadi</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tables.map(t => (
          <span
            key={t._id}
            className="status-badge"
            style={{
              background: t.status === 'available' ? '#dcfce7' : '#fee2e2',
              color: t.status === 'available' ? '#166534' : '#991b1b'
            }}
          >
            Stol #{t.number} · {t.status === 'available' ? "🟢 Bo'sh" : '🔴 Band'}
          </span>
        ))}
      </div>

      <h3>💵 To'lov kutilayotgan buyurtmalar</h3>
      {!unpaid.length && <div className="empty-state">Yo'q</div>}
      {unpaid.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{o.customer?.name || 'Mehmon'} · {PAYMENT_LABELS[o.paymentMethod]}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{o.total.toLocaleString()} so'm</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => handleMarkPaid(o._id)}>To'landi deb belgilash</button>
        </div>
      ))}
    </div>
  );
}
