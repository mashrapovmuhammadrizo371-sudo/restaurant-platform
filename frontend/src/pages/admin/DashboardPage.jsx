import React, { useEffect, useState } from 'react';
import { getOrders } from '../../services/orderService';
import { getCustomers } from '../../services/customerService';
import { getEmployees } from '../../services/employeeService';
import { getBrands } from '../../services/brandService';
import { getStaffTables } from '../../services/tableService';
import { useAuth } from '../../context/AuthContext.jsx';

const PAYMENT_LABELS = { naqd: 'Naqd', karta: 'Karta', online: 'Onlayn' };
const FINAL_STATUSES = ['delivered', 'completed', 'rejected'];

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCustomers(), getEmployees(), getBrands()])
      .then(async ([ordersRes, customersRes, employeesRes, brandsRes]) => {
        setOrders(ordersRes.orders);
        setCustomerCount(customersRes.customers.length);
        setEmployees(employeesRes.employees);
        setBrands(brandsRes.brands);
        // Table occupancy across every brand this admin can see.
        const tableResults = await Promise.all(
          brandsRes.brands.map(b => getStaffTables(b._id).catch(() => ({ tables: [] })))
        );
        setTables(tableResults.flatMap(r => r.tables));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const ordersToday = orders.filter(o => isToday(o.createdAt));
  const completedOrders = orders.filter(o => FINAL_STATUSES.includes(o.status) && o.status !== 'rejected');
  const pendingOrders = orders.filter(o => !FINAL_STATUSES.includes(o.status));
  const deliveryOrders = orders.filter(o => o.orderType === 'delivery');
  const tableOrders = orders.filter(o => o.orderType === 'table');
  const couriers = employees.filter(e => e.role === 'courier' && e.isActive);
  const waiters = employees.filter(e => e.role === 'ofitsiant' && e.isActive);
  const busyTables = tables.filter(t => t.status === 'busy');

  const paymentBreakdown = orders.reduce((acc, o) => {
    if (o.paymentStatus !== 'paid') return acc;
    acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.total;
    return acc;
  }, {});

  const revenueByBrand = brands.map(b => ({
    name: b.name,
    revenue: orders
      .filter(o => o.paymentStatus === 'paid' && (o.brand?._id || o.brand) === b._id)
      .reduce((sum, o) => sum + o.total, 0)
  }));

  const cards = [
    { label: 'Umumiy daromad', value: `${revenue.toLocaleString()} so'm` },
    { label: 'Bugungi buyurtmalar', value: ordersToday.length },
    { label: 'Yakunlangan', value: completedOrders.length },
    { label: 'Kutilayotgan', value: pendingOrders.length },
    { label: 'Yetkazib berish', value: deliveryOrders.length },
    { label: 'Stol buyurtmalari', value: tableOrders.length },
    { label: 'Mijozlar', value: customerCount },
    { label: `Faol kuryerlar`, value: couriers.length },
    { label: `Faol ofitsiantlar`, value: waiters.length },
    { label: 'Band stollar', value: `${busyTables.length} / ${tables.length}` }
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Dashboard {user?.role === 'boss' ? '(barcha brendlar)' : ''}</h2>
      {error && <div className="error-text">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>To'lov turlari bo'yicha daromad</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.keys(PAYMENT_LABELS).map(method => (
          <div key={method} className="card" style={{ minWidth: 140 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{PAYMENT_LABELS[method]}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{(paymentBreakdown[method] || 0).toLocaleString()} so'm</div>
          </div>
        ))}
      </div>

      {user?.role === 'boss' && brands.length > 1 && (
        <>
          <h3 style={{ marginTop: 24 }}>Brendlar bo'yicha daromad</h3>
          {revenueByBrand.map(b => (
            <div key={b.name} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>{b.name}</span>
              <span style={{ fontWeight: 700 }}>{b.revenue.toLocaleString()} so'm</span>
            </div>
          ))}
        </>
      )}

      <h3 style={{ marginTop: 24 }}>So'nggi buyurtmalar</h3>
      {!orders.length && <div className="empty-state">Buyurtmalar yo'q</div>}
      {orders.slice(0, 10).map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>{o.orderNumber} · {o.brand?.name}</span>
          <span>{o.total.toLocaleString()} so'm</span>
        </div>
      ))}
    </div>
  );
}
