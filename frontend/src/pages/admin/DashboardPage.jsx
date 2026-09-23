import React, { useEffect, useMemo, useState } from 'react';
import { getOrders } from '../../services/orderService';
import { getEmployees } from '../../services/employeeService';
import { getBrands } from '../../services/brandService';
import { getStaffTables } from '../../services/tableService';
import { useAuth } from '../../context/AuthContext.jsx';

const FINAL_STATUSES = ['delivered', 'completed', 'rejected'];
const TASHKENT_TZ = 'Asia/Tashkent';

function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TASHKENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function formatReportDate(dateKey) {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-');
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: TASHKENT_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([getOrders({ date: selectedDate }), getEmployees(), getBrands()])
      .then(async ([ordersRes, employeesRes, brandsRes]) => {
        setOrders(ordersRes.orders || []);
        setEmployees(employeesRes.employees || []);
        setBrands(brandsRes.brands || []);

        const tableResults = await Promise.all(
          (brandsRes.brands || []).map(b => getStaffTables(b._id).catch(() => ({ tables: [] })))
        );
        setTables(tableResults.flatMap(r => r.tables || []));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const reportOrders = orders;

  const reportCustomerCount = useMemo(() => {
    const ids = new Set();
    reportOrders.forEach(order => {
      const id = order.customer?._id || order.customer || order.customerId;
      if (id) ids.add(String(id));
    });
    return ids.size;
  }, [reportOrders]);

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const revenue = reportOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const completedOrders = reportOrders.filter(
    o => FINAL_STATUSES.includes(o.status) && o.status !== 'rejected'
  );
  const pendingOrders = reportOrders.filter(o => !FINAL_STATUSES.includes(o.status));
  const deliveryOrders = reportOrders.filter(o => o.orderType === 'delivery');
  const tableOrders = reportOrders.filter(o => o.orderType === 'table');
  const couriers = employees.filter(e => e.role === 'courier' && e.isActive);
  const waiters = employees.filter(e => e.role === 'ofitsiant' && e.isActive);
  const busyTables = tables.filter(t => t.status === 'busy');

  const revenueByBrand = brands.map(b => ({
    name: b.name,
    revenue: reportOrders
      .filter(o => o.paymentStatus === 'paid' && (o.brand?._id || o.brand) === b._id)
      .reduce((sum, o) => sum + Number(o.total || 0), 0)
  }));

  const reportLabel = selectedDate === getTodayKey()
    ? 'Bugungi buyurtmalar'
    : `${formatReportDate(selectedDate)} buyurtmalari`;

  const cards = [
    { label: 'Umumiy daromad', value: `${revenue.toLocaleString()} so'm` },
    { label: reportLabel, value: reportOrders.length },
    { label: 'Yakunlangan', value: completedOrders.length },
    { label: 'Kutilayotgan', value: pendingOrders.length },
    { label: 'Yetkazib berish', value: deliveryOrders.length },
    { label: 'Stol buyurtmalari', value: tableOrders.length },
    { label: 'Mijozlar', value: reportCustomerCount },
    { label: 'Faol kuryerlar', value: couriers.length },
    { label: 'Faol ofitsiantlar', value: waiters.length },
    { label: 'Band stollar', value: `${busyTables.length} / ${tables.length}` }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          Dashboard {user?.role === 'boss' ? '(barcha brendlar)' : ''}
        </h2>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <label htmlFor="dashboard-report-date" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Hisobot sanasi
          </label>
          <input
            id="dashboard-report-date"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ddd)' }}
          />
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
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

      <h3 style={{ marginTop: 24 }}>{reportLabel}</h3>
      {!reportOrders.length && <div className="empty-state">Tanlangan kunda buyurtmalar yo'q</div>}
      {reportOrders.slice(0, 10).map(o => (
        <div key={o._id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>{o.orderNumber} · {o.brand?.name}</span>
          <span>{Number(o.total || 0).toLocaleString()} so'm</span>
        </div>
      ))}
    </div>
  );
}
