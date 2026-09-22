import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
    let formatted = '+998';
    if (digits.length) formatted += ' ' + digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    return formatted;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(phone)) return setError('Telefon raqami +998 XX XXX XX XX formatida bo‘lishi kerak.');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Войти не удалось.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="container" style={{ maxWidth: 560, paddingTop: 28, paddingBottom: 100 }}>
    <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
      <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 18 }}>← Orqaga</button>
      <h2 style={{ marginTop: 0 }}>Войти</h2>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Номер телефона</label>
          <input className="input" type="tel" inputMode="numeric" value={phone} onFocus={() => { if (!phone) setPhone('+998 '); }} onChange={e => setPhone(formatPhone(e.target.value))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Пароль</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 14 }}>
        <span style={{ color: 'var(--text-muted)' }}>Нет аккаунта?</span>{' '}
        <button type="button" className="btn" style={{ padding: 0, background: 'transparent', color: 'var(--primary)', fontWeight: 700 }} onClick={() => navigate('/register')}>Регистрация</button>
      </div>
    </div>
  </div>;
}
