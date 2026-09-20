import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee, resetEmployeePassword, deleteEmployee } from '../../services/employeeService';
import { getBrands } from '../../services/brandService';
import { useAuth } from '../../context/AuthContext.jsx';

const ASSIGNABLE_ROLES = ['admin', 'operator', 'courier', 'ofitsiant', 'cashier'];
const EMPTY = { name: '', phone: '', login: '', password: '', role: 'operator', brands: [] };

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([getEmployees(), getBrands()])
      .then(([empRes, brandsRes]) => {
        setEmployees(empRes.employees);
        setBrands(brandsRes.brands);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function toggleBrand(id) {
    setForm(prev => ({
      ...prev,
      brands: prev.brands.includes(id) ? prev.brands.filter(b => b !== id) : [...prev.brands, id]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await createEmployee(form);
      setForm(EMPTY);
      load();
    } catch (err) { setError(err.message); }
  }
  async function handleToggleActive(emp) {
    try { await updateEmployee(emp._id, { isActive: !emp.isActive }); load(); } catch (err) { setError(err.message); }
  }
  async function handleResetPassword(emp) {
    const newPassword = window.prompt(`${emp.name} uchun yangi parol kiriting (kamida 6 belgi):`);
    if (!newPassword) return;
    try {
      await resetEmployeePassword(emp._id, newPassword);
      window.alert('Parol yangilandi');
    } catch (err) { setError(err.message); }
  }
  async function handleDelete(id) {
    if (!window.confirm("Xodimni butunlay o'chirishga ishonchingiz komilmi?")) return;
    try { await deleteEmployee(id); load(); } catch (err) { setError(err.message); }
  }

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Xodimlar</h2>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Ism</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Telefon</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Login</label>
            <input className="input" value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Parol</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ASSIGNABLE_ROLES.concat(user?.role === 'boss' ? ['boss'] : []).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Brendlar</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {brands.map(b => (
              <label key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <input type="checkbox" checked={form.brands.includes(b._id)} onChange={() => toggleBrand(b._id)} />
                {b.name}
              </label>
            ))}
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary">Xodim qo'shish</button>
      </form>

      {!employees.length && <div className="empty-state">Xodimlar yo'q</div>}
      {employees.map(emp => (
        <div key={emp._id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <strong>{emp.name}</strong> · {emp.role} · {emp.login}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.isActive ? 'Faol' : "O'chirilgan"}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => handleResetPassword(emp)}>Parolni tiklash</button>
            <button className="btn btn-secondary" onClick={() => handleToggleActive(emp)}>{emp.isActive ? "O'chirish" : 'Faollashtirish'}</button>
            <button className="btn btn-danger" onClick={() => handleDelete(emp._id)}>Butunlay o'chirish</button>
          </div>
        </div>
      ))}
    </div>
  );
}
