import React, { useEffect, useState } from 'react';
import { getOrders, acceptOrder, rejectOrder, markOrderPaid } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge.jsx';

const STATUS_OPTIONS = ['new', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'rejected'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getOrders(statusFilter ? { status: statusFilter } : {})
      .then(res => setOrders(res.orders))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [statusFilter]);

  async function handleAccept(id) { try { await acceptOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleReject(id) { try { await rejectOrder(id); load(); } catch (err) { setError(err.message); } }
  async function handleMarkPaid(id) { try { await markOrderPaid(id); load(); } catch (err) { setError(err.message); } }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Buyurtmalar</h2>
      <select className="input" style={{ maxWidth: 220 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">Barcha holatlar</option>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {error && <div className="error-text">{error}</div>}
      {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {!loading && !orders.length && <div className="empty-state">Buyurtmalar topilmadi</div>}

      {orders.map(o => (
        <div key={o._id} className="card" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{o.orderNumber} · {o.brand?.name}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {o.customer?.name || 'Mehmon'}
            {/* contactPhone is collected at checkout regardless of whether
                the customer account has a phone (customers can enter with
                just a name) — it's the reliable number, prefer it. */}
            {(o.contactPhone || o.customer?.phone) && ` · 📞 ${o.contactPhone || o.customer?.phone}`}
            {' · '}{o.orderType === 'delivery' ? o.deliveryAddress : `Stol #${o.table?.number}`}
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>
            {o.total.toLocaleString()} so'm · {o.paymentMethod} · {o.paymentStatus === 'paid' ? "To'langan" : 'Kutilmoqda'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {o.status === 'new' && <button className="btn btn-primary" onClick={() => handleAccept(o._id)}>Qabul qilish</button>}
            {o.status === 'new' && <button className="btn btn-danger" onClick={() => handleReject(o._id)}>Rad etish</button>}
            {o.paymentStatus === 'pending' && (
              <button className="btn btn-secondary" onClick={() => handleMarkPaid(o._id)}>To'landi deb belgilash</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
