import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee, resetEmployeePassword, deleteEmployee } from '../../services/employeeService';
import { getBrands } from '../../services/brandService';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';

const ASSIGNABLE_ROLES = ['admin', 'operator', 'courier', 'ofitsiant', 'cashier'];

// Mirrors backend/src/config/roles.js PERMISSIONS. Only meaningful for
// role = admin — Boss has all of these implicitly, other roles use
// fixed logic instead of this permission list (see backend rbac.js).
const PERMISSIONS = [
  { key: 'brands.manage', label: 'Brendlar' },
  { key: 'menu.manage', label: 'Menyu (umumiy)' },
  { key: 'categories.manage', label: 'Kategoriyalar' },
  { key: 'foods.manage', label: 'Taomlar' },
  { key: 'banners.manage', label: 'Bannerlar' },
  { key: 'tables.manage', label: 'Stollar' },
  { key: 'orders.manage', label: 'Buyurtmalar' },
  { key: 'customers.manage', label: 'Mijozlar' },
  { key: 'promocodes.manage', label: 'Promokodlar' },
  { key: 'employees.manage', label: 'Xodimlar' },
  { key: 'settings.manage', label: 'Sozlamalar' }
];

const EMPTY = { name: '', phone: '', login: '', password: '', role: 'operator', brands: [], permissions: [] };

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  function load() {
    setLoading(true);
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

  function togglePermission(key) {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  }

  // Same toggle, but applied directly to an existing employee's saved
  // permissions (used on each employee's card, not the create form).
  async function toggleEmployeePermission(emp, key) {
    const next = (emp.permissions || []).includes(key)
      ? emp.permissions.filter(p => p !== key)
      : [...(emp.permissions || []), key];
    setSavingId(emp._id);
    setError('');
    try {
      await updateEmployee(emp._id, { permissions: next });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
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
            <input
              className="input"
              placeholder={UZ_PHONE_PLACEHOLDER}
              value={form.phone}
              onChange={e => setForm({ ...form, phone: formatUzPhoneInput(e.target.value) })}
              inputMode="numeric"
              maxLength={17}
            />
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
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, permissions: [] })}>
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

        {form.role === 'admin' && (
          <div className="form-group">
            <label className="form-label">Ruxsatlar (faqat admin roli uchun)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PERMISSIONS.map(p => (
                <label
                  key={p.key}
                  className="status-badge"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    background: form.permissions.includes(p.key) ? '#dcfce7' : 'var(--bg)',
                    color: form.permissions.includes(p.key) ? '#166534' : 'var(--text-muted)'
                  }}
                >
                  <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} />
                  {p.label}
                </label>
              ))}
            </div>
            {!form.permissions.length && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Hech qanday ruxsat tanlanmagan — bu admin hech narsani boshqara olmaydi.
              </div>
            )}
          </div>
        )}

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary">Xodim qo'shish</button>
      </form>

      {!employees.length && <div className="empty-state">Xodimlar yo'q</div>}
      {employees.map(emp => (
        <div key={emp._id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong>{emp.name}</strong> · {emp.role} · {emp.login}
              {emp.phone && <span style={{ color: 'var(--text-muted)' }}> · {emp.phone}</span>}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.isActive ? 'Faol' : "O'chirilgan"}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => handleResetPassword(emp)}>Parolni tiklash</button>
              <button className="btn btn-secondary" onClick={() => handleToggleActive(emp)}>{emp.isActive ? "O'chirish" : 'Faollashtirish'}</button>
              <button className="btn btn-danger" onClick={() => handleDelete(emp._id)}>Butunlay o'chirish</button>
            </div>
          </div>

          {emp.role === 'admin' && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Ruxsatlar {savingId === emp._id && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PERMISSIONS.map(p => {
                  const checked = (emp.permissions || []).includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className="status-badge"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        background: checked ? '#dcfce7' : 'var(--bg)',
                        color: checked ? '#166534' : 'var(--text-muted)',
                        opacity: savingId === emp._id ? 0.6 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={savingId === emp._id}
                        onChange={() => toggleEmployeePermission(emp, p.key)}
                      />
                      {p.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
