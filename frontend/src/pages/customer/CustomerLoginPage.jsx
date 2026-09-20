import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';

export default function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(e) {
    setForm({ ...form, phone: formatUzPhoneInput(e.target.value) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 360 }}>
        <h2 style={{ marginTop: 0 }}>Kirish</h2>

        <div className="form-group">
          <label className="form-label">Telefon raqam</label>
          <input
            className="input"
            placeholder={UZ_PHONE_PLACEHOLDER}
            value={form.phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
            maxLength={17}
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

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 14 }}>
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" style={{ color: 'var(--brand-color)', fontWeight: 600 }}>Ro'yxatdan o'tish</Link>
        </p>
      </form>
    </div>
  );
}
