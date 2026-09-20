import React, { useEffect, useState } from 'react';
import { getOrders } from '../../services/orderService';
import { getCustomers } from '../../services/customerService';
import { getEmployees } from '../../services/employeeService';
import { getBrands } from '../../services/brandService';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [brandCount, setBrandCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCustomers(), getEmployees(), getBrands()])
      .then(([ordersRes, customersRes, employeesRes, brandsRes]) => {
        setOrders(ordersRes.orders);
        setCustomerCount(customersRes.customers.length);
        setEmployeeCount(employeesRes.employees.length);
        setBrandCount(brandsRes.brands.length);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter(o => !['delivered', 'completed', 'rejected'].includes(o.status)).length;

  const cards = [
    { label: 'Umumiy daromad', value: `${revenue.toLocaleString()} so'm` },
    { label: 'Jami buyurtmalar', value: orders.length },
    { label: 'Faol buyurtmalar', value: activeOrders },
    { label: 'Mijozlar', value: customerCount },
    { label: 'Xodimlar', value: employeeCount },
    { label: 'Brendlar', value: brandCount }
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Dashboard {user?.role === 'boss' ? '(barcha brendlar)' : ''}</h2>
      {error && <div className="error-text">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

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
