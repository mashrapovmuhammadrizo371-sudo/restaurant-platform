import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { isValidUzPhone, formatUzPhoneInput, UZ_PHONE_PLACEHOLDER, UZ_PHONE_ERROR } from '../../utils/phone.js';

export default function CustomerRegisterPage() {
  const { register } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(e) {
    setForm({ ...form, phone: formatUzPhoneInput(e.target.value) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isValidUzPhone(form.phone)) {
      setError(UZ_PHONE_ERROR);
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.phone, form.password);
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
        <h2 style={{ marginTop: 0 }}>Ro'yxatdan o'tish</h2>

        <div className="form-group">
          <label className="form-label">Ismingiz</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>

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
            minLength={6}
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? <span className="spinner" /> : "Ro'yxatdan o'tish"}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 14 }}>
          Hisobingiz bormi?{' '}
          <Link to="/login" style={{ color: 'var(--brand-color)', fontWeight: 600 }}>Kirish</Link>
        </p>
      </form>
    </div>
  );
}
