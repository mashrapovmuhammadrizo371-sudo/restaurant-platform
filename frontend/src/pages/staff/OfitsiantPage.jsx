import React, { useEffect, useState } from 'react';
import { getStaffTables } from '../../services/tableService';
import { getOrders, createStaffTableOrder, updateTableOrderStatus } from '../../services/orderService';
import { getFoods } from '../../services/foodService';
import { useAuth } from '../../context/AuthContext.jsx';
import { connectSocket } from '../../services/socket';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function OfitsiantPage() {
  const { user } = useAuth();
  const brandId = user?.brands?.[0]; // an ofitsiant is assigned to a single brand
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // foodId -> qty
  const [paymentMethod, setPaymentMethod] = useState('naqd');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    if (!brandId) { setLoading(false); return; }
    Promise.all([getStaffTables(brandId), getOrders({ orderType: 'table' }), getFoods({ brand: brandId })])
      .then(([tablesRes, ordersRes, foodsRes]) => {
        setTables(tablesRes.tables);
        setOrders(ordersRes.orders);
        setFoods(foodsRes.foods);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('staffToken');
    if (!token || !brandId) return;
    const socket = connectSocket(token);
    socket.emit('watch:brand', brandId);
    socket.on('table_order:update', load);
    return () => socket.off('table_order:update', load);
  }, [brandId]);

  function toggleFood(foodId) {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[foodId]) delete next[foodId]; else next[foodId] = 1;
      return next;
    });
  }
  function changeQty(foodId, delta) {
    setSelectedItems(prev => ({ ...prev, [foodId]: Math.max(1, (prev[foodId] || 1) + delta) }));
  }

  async function handleCreateOrder() {
    setError('');
    const items = Object.entries(selectedItems).map(([food, quantity]) => ({ food, quantity }));
    if (!selectedTable || !items.length) {
      setError('Stol va kamida bitta taom tanlang');
      return;
    }
    try {
      await createStaffTableOrder({ brand: brandId, tableId: selectedTable, items, paymentMethod });
      setSelectedItems({});
      setSelectedTable('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try { await updateTableOrderStatus(id, status); load(); } catch (err) { setError(err.message); }
  }

  if (!brandId) return <div className="empty-state">Sizga hech qanday brend biriktirilmagan</div>;
  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const activeOrders = orders.filter(o => !['completed', 'rejected'].includes(o.status));

  return (
    <div>
      {error && <div className="error-text">{error}</div>}

      <h3 style={{ marginTop: 0 }}>🪩 Stollar</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tables.map(t => (
          <div
            key={t._id}
            className="status-badge"
            style={{
              background: t.status === 'available' ? '#dcfce7' : '#fee2e2',
              color: t.status === 'available' ? '#166534' : '#991b1b'
            }}
          >
            Stol #{t.number} · {t.status === 'available' ? "Bo'sh" : 'Band'}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Yangi stol buyurtmasi</div>
        <select className="input" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
          <option value="">Stolni tanlang</option>
          {tables.filter(t => t.status === 'available').map(t => <option key={t._id} value={t._id}>Stol #{t.number}</option>)}
        </select>

        <div style={{ marginTop: 10, maxHeight: 240, overflowY: 'auto' }}>
          {foods.map(f => (
            <div key={f._id} className="cart-line">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!selectedItems[f._id]} onChange={() => toggleFood(f._id)} />
                {f.name} — {f.price.toLocaleString()} so'm
              </label>
              {!!selectedItems[f._id] && (
                <div className="qty-control">
                  <button onClick={() => changeQty(f._id, -1)}>−</button>
                  <span>{selectedItems[f._id]}</span>
                  <button onClick={() => changeQty(f._id, 1)}>+</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <select className="input" style={{ marginTop: 10 }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="naqd">Naqd</option>
          <option value="karta">Karta</option>
          <option value="online">Onlayn</option>
        </select>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={handleCreateOrder}>
          Buyurtma yaratish
        </button>
      </div>

      <h3>Faol stol buyurtmalari</h3>
      {!activeOrders.length && <div className="empty-state">Faol buyurtmalar yo'q</div>}
      {activeOrders.map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Stol #{o.table?.number} · {o.orderNumber}</strong>
            <StatusBadge status={o.status} />
          </div>
          <ul style={{ fontSize: 13, margin: '6px 0' }}>
            {o.items.map((it, idx) => <li key={idx}>{it.name} × {it.quantity}</li>)}
          </ul>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {o.status === 'accepted' && <button className="btn btn-secondary" onClick={() => handleStatusChange(o._id, 'preparing')}>Tayyorlanmoqda</button>}
            {o.status === 'preparing' && <button className="btn btn-secondary" onClick={() => handleStatusChange(o._id, 'ready')}>Tayyor</button>}
            {o.status === 'ready' && <button className="btn btn-primary" onClick={() => handleStatusChange(o._id, 'completed')}>Yakunlash</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
