import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const REDIRECT_BY_ROLE = {
  boss: '/admin/dashboard',
  admin: '/admin/dashboard',
  operator: '/operator',
  courier: '/courier',
  ofitsiant: '/ofitsiant'
};

export default function StaffLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.login, form.password);
      navigate(REDIRECT_BY_ROLE[user.role] || '/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 360 }}>
        <h2 style={{ marginTop: 0 }}>Xodimlar uchun kirish</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Boss, Admin, Operator, Kuryer va Ofitsiant uchun umumiy login sahifasi.
        </p>

        <div className="form-group">
          <label className="form-label">Login</label>
          <input
            className="input"
            value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Parol</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
